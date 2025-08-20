// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title IGaslessToken
 * @dev Interface para tokens que suportam transferências sem gás (meta-transações)
 * executadas por um contrato com role específico.
 */
interface IGaslessToken {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFromGasless(address from, address to, uint256 value) external;
}

/**
 * @title HybridExchange
 * @author [Seu Nome/Empresa]
 * @dev Contrato para uma exchange híbrida, desenhado para operar com um relayer (contrato admin)
 * que paga o gás e executa transações em nome dos usuários.
 * CORREÇÃO: A taxa de negociação é deduzida do valor recebido pelo vendedor (maker).
 */
contract HybridExchange is AccessControl, ReentrancyGuard {

    //=========== ESTRUTURAS ===========

    struct SellOrder {
        uint256 id;
        address seller;
        uint256 amountAsset; 
        uint256 pricePerAsset;
        bool isActive;
    }

    //=========== CONSTANTES E VARIÁVEIS DE ESTADO ===========

    bytes32 public constant ORDER_CREATOR_ROLE = keccak256("ORDER_CREATOR_ROLE");

    IGaslessToken public immutable cBRLToken;
    IGaslessToken public immutable assetToken;

    uint256 public nextOrderId;
    mapping(uint256 => SellOrder) public orders;
    mapping(address => uint256[]) public userOrders;

    address public feeWallet;
    uint256 public feeBps; // Taxa em Basis Points (1 BPS = 0.01%)

    //=========== EVENTOS ===========

    event OrderCreated(address indexed seller, uint256 indexed orderId, uint256 amountAsset, uint256 pricePerAsset);
    event OrderCancelled(address indexed seller, uint256 indexed orderId);
    event OrderFilled(
        address indexed buyer,
        uint256 indexed orderId,
        address indexed seller,
        uint256 amountAssetBought,
        uint256 amountCBRLSpent,
        uint256 feePaid
    );
    event FeeUpdated(uint256 newFeeBps);
    event FeeWalletUpdated(address indexed newFeeWallet);


    //=========== CONSTRUTOR ===========

    constructor(
        address _cbrlToken,
        address _assetToken,
        address _initialFeeWallet,
        uint256 _initialFeeBps
    ) {
        require(_cbrlToken != address(0) && _assetToken != address(0) && _initialFeeWallet != address(0), "Enderecos invalidos");
        
        cBRLToken = IGaslessToken(_cbrlToken);
        assetToken = IGaslessToken(_assetToken);
        feeWallet = _initialFeeWallet;
        feeBps = _initialFeeBps;
        nextOrderId = 1;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORDER_CREATOR_ROLE, msg.sender);
    }

    //=========== FUNÇÕES DE CRIAÇÃO E CANCELAMENTO DE ORDENS ===========

    function createOrder(address _seller, uint256 _amountAsset, uint256 _pricePerAsset) external nonReentrant onlyRole(ORDER_CREATOR_ROLE) {
        require(_amountAsset > 0, "Quantidade do ativo deve ser maior que zero");
        require(_pricePerAsset > 0, "Preco deve ser maior que zero");

        assetToken.transferFromGasless(_seller, address(this), _amountAsset);

        uint256 orderId = nextOrderId;
        orders[orderId] = SellOrder({
            id: orderId,
            seller: _seller,
            amountAsset: _amountAsset,
            pricePerAsset: _pricePerAsset,
            isActive: true
        });

        userOrders[_seller].push(orderId);
        nextOrderId++;

        emit OrderCreated(_seller, orderId, _amountAsset, _pricePerAsset);
    }

    function cancelOrder(uint256 _orderId, address _user) external nonReentrant onlyRole(ORDER_CREATOR_ROLE) {
        SellOrder storage order = orders[_orderId];
        require(order.seller == _user, "Nao autorizado");
        require(order.isActive, "Ordem ja inativa");

        order.isActive = false;

        if (order.amountAsset > 0) {
            assetToken.transfer(order.seller, order.amountAsset);
        }

        emit OrderCancelled(_user, _orderId);
    }

    //=========== FUNÇÃO AUXILIAR PARA PROCESSAR ORDEM ===========
    
    function _processSingleOrder(
        address _buyer,
        uint256 _orderId,
        uint256 _cbrlAvailable
    ) internal returns (uint256 assetBought, uint256 cbrlSpent, uint256 fee) {
        SellOrder storage order = orders[_orderId];
        
        if (!order.isActive || order.seller == _buyer) {
            return (0, 0, 0);
        }
        
        uint256 assetAvailable = order.amountAsset;
        uint256 cbrlNeededForFullOrder = assetAvailable * order.pricePerAsset;
        
        if (_cbrlAvailable >= cbrlNeededForFullOrder) {
            assetBought = assetAvailable;
            cbrlSpent = cbrlNeededForFullOrder;
            order.amountAsset = 0;
            order.isActive = false;
        } else {
            assetBought = _cbrlAvailable / order.pricePerAsset;
            cbrlSpent = assetBought * order.pricePerAsset;
            order.amountAsset -= assetBought;
        }
        
        if (assetBought > 0) {
            fee = (cbrlSpent * feeBps) / 10000;
            uint256 amountToSeller = cbrlSpent - fee;
            
            // Paga ao vendedor o valor líquido
            cBRLToken.transfer(order.seller, amountToSeller);
            
            emit OrderFilled(_buyer, _orderId, order.seller, assetBought, cbrlSpent, fee);
        }
        
        return (assetBought, cbrlSpent, fee);
    }

    //=========== FUNÇÃO DE COMPRA (TAKERS) ===========

    function buyAssetWithCbrl(
        address _buyer,
        uint256 _cbrlAmountToSpend,
        uint256[] calldata _orderIds,
        uint256 _minAssetAmountOut
    ) external nonReentrant onlyRole(ORDER_CREATOR_ROLE) {
        require(_cbrlAmountToSpend > 0, "Valor em cBRL deve ser maior que zero");
        
        uint256 cbrlRemaining = _cbrlAmountToSpend;
        uint256 totalAssetBought = 0;
        uint256 totalFee = 0;

        cBRLToken.transferFromGasless(_buyer, address(this), _cbrlAmountToSpend);

        for (uint i = 0; i < _orderIds.length && cbrlRemaining > 0; i++) {
            (uint256 assetBought, uint256 cbrlSpent, uint256 fee) = _processSingleOrder(
                _buyer,
                _orderIds[i],
                cbrlRemaining
            );
            
            if (assetBought > 0) {
                totalAssetBought += assetBought;
                cbrlRemaining -= cbrlSpent;
                totalFee += fee;
            }
        }

        require(totalAssetBought >= _minAssetAmountOut, "Erro de Slippage");
        
        // Transfere o total de taxas acumuladas para a feeWallet
        if (totalFee > 0) {
            cBRLToken.transfer(feeWallet, totalFee);
        }
        
        // Se sobrou cBRL (não foi possível gastar tudo), devolve ao comprador
        if (cbrlRemaining > 0) {
            cBRLToken.transfer(_buyer, cbrlRemaining);
        }

        require(totalAssetBought > 0, "Nenhum ativo foi comprado");
        assetToken.transfer(_buyer, totalAssetBought);
    }


    //=========== FUNÇÕES DE VIEW (PARA O FRONTEND) ===========

    function getQuoteForCbrl(
        uint256 _cbrlAmountToSpend,
        uint256[] calldata _orderIds
    ) external view returns (uint256 totalAssetOut, uint256 cbrlEffectivelySpent, uint256 weightedAveragePrice) {
        uint256 cbrlRemaining = _cbrlAmountToSpend;
        
        for (uint i = 0; i < _orderIds.length && cbrlRemaining > 0; i++) {
            SellOrder memory order = orders[_orderIds[i]];
            if (!order.isActive) continue;

            uint256 cbrlNeededForFullOrder = order.amountAsset * order.pricePerAsset;
            uint256 assetToGet;

            if (cbrlRemaining >= cbrlNeededForFullOrder) {
                assetToGet = order.amountAsset;
                cbrlRemaining -= cbrlNeededForFullOrder;
            } else {
                assetToGet = cbrlRemaining / order.pricePerAsset;
                cbrlRemaining = 0;
            }
            totalAssetOut += assetToGet;
        }

        cbrlEffectivelySpent = _cbrlAmountToSpend - cbrlRemaining;
        if (totalAssetOut > 0) {
            weightedAveragePrice = cbrlEffectivelySpent * (10**18) / totalAssetOut;
        } else {
            weightedAveragePrice = 0;
        }
    }

    function getOrderDetails(uint256 _orderId) external view returns (SellOrder memory) {
        return orders[_orderId];
    }

    function getUserActiveOrders(address _user) external view returns (uint256[] memory) {
        uint256[] memory allIds = userOrders[_user];
        uint256 activeCount = 0;
        for (uint i = 0; i < allIds.length; i++) {
            if (orders[allIds[i]].isActive) {
                activeCount++;
            }
        }
        
        uint256[] memory activeIds = new uint256[](activeCount);
        uint256 counter = 0;
        for (uint i = 0; i < allIds.length; i++) {
            if (orders[allIds[i]].isActive) {
                activeIds[counter] = allIds[i];
                counter++;
            }
        }
        return activeIds;
    }
    

    //=========== FUNÇÕES ADMINISTRATIVAS ===========

    function setFee(uint256 _newFeeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newFeeBps <= 1000, "Taxa nao pode exceder 10%"); // Limite de segurança
        feeBps = _newFeeBps;
        emit FeeUpdated(_newFeeBps);
    }

    function setFeeWallet(address _newFeeWallet) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newFeeWallet != address(0), "Endereco invalido");
        feeWallet = _newFeeWallet;
        emit FeeWalletUpdated(_newFeeWallet);
    }
}