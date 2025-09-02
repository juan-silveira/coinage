"use client";
import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  TrendingUp, 
  Clock, 
  Percent,
  Award,
  Info,
  Loader2
} from 'lucide-react';
import Image from '@/components/ui/Image';
import stakeContractsService from '@/services/stakeContractsService';
import { useAuth } from '@/hooks/useAuth';
import { useAlertContext } from '@/contexts/AlertContext';

const StakeTab = () => {
  const { user } = useAuth();
  const { showError } = useAlertContext();
  const [loading, setLoading] = useState(true);
  const [publicStakeContracts, setPublicStakeContracts] = useState([]);


  useEffect(() => {
    loadPublicStakeContracts();
  }, [user]);

  const loadPublicStakeContracts = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Limpar cache se forceRefresh
      if (forceRefresh) {
        stakeContractsService.clearCache();
      }
      
      const userAddress = user?.walletAddress || user?.blockchainAddress || user?.publicKey;
      
      const result = await stakeContractsService.categorizeStakeContracts(userAddress, forceRefresh);
      
      // Validar resultado antes de definir estado
      if (result && Array.isArray(result.publicStakes)) {
        setPublicStakeContracts(result.publicStakes);
      } else {
        console.warn('Invalid result from categorizeStakeContracts:', result);
        setPublicStakeContracts([]);
      }
    } catch (error) {
      console.error('Error loading public stake contracts:', error);
      setPublicStakeContracts([]); // Garantir estado válido em caso de erro
      showError('Erro ao carregar contratos de stake. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const formatContractToStakeOption = (contract) => {
    // Validar dados do contrato
    if (!contract || typeof contract !== 'object') {
      console.warn('Invalid contract for stake option formatting:', contract);
      return null;
    }

    return {
      title: contract.name || 'Unknown Contract',
      subtitle: '(Smart Contract)',
      risk: 'Variável',
      riskLevel: 2,
      currency: contract.symbol || 'STAKE',
      receivableInteger: '0',
      receivableDecimals: '00',
      quarterlyReturn: 'Variável',
      stakedInteger: '0',
      stakedDecimals: '00',
      distributedInteger: '0',
      distributedDecimals: '000000',
      vencimento: 'Sem prazo',
      disponivel: 'N/A',
      aliquota: 'N/A',
      type: 'contract',
      contractAddress: contract.address || '',
      network: contract.network || ''
    };
  };

  // Usar apenas contratos de stake reais com validação
  const allStakeOptions = publicStakeContracts
    .map(formatContractToStakeOption)
    .filter(option => option !== null); // Filtrar opções inválidas

  const getRiskBadge = (risk) => {
    const colors = {
      'Baixo': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Médio': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'Alto': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'Variável': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[risk] || colors['Variável']}`}>
        {risk}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Stake de Ativos Digitais</h2>
            <p className="text-purple-100">
              Bloqueie seus ativos e receba recompensas periódicas
            </p>
          </div>
          <Award size={48} className="text-purple-200" />
        </div>
      </div>

      {/* Stake Options Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Carregando opções de stake...
          </span>
        </div>
      ) : allStakeOptions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {allStakeOptions.map((option, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {option.subtitle}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold`}>
                  <Image src={`assets/images/currencies/${option.currency}.png`} alt={option.currency} />
                </div>
              </div>

              {/* Receivable Amount */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase mb-1">
                    À Receber
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {option.receivableInteger}
                    </span>
                    <span className="text-lg">,</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {option.receivableDecimals}
                    </span>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {option.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Risco:</span>
                  {getRiskBadge(option.risk)}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <Percent size={14} className="mr-1" />
                    Retorno Trimestral:
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    {option.quarterlyReturn}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <Clock size={14} className="mr-1" />
                    Vencimento:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {option.vencimento}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Alíquota:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {option.aliquota}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Disponível:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {option.disponivel} {option.currency}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Em Stake:</span>
                  <div className="flex items-baseline">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {option.stakedInteger}
                    </span>
                    <span className="text-xs">,</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {option.stakedDecimals}
                    </span>
                    <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">
                      {option.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                  <Lock size={16} className="mr-1" />
                  Fazer Stake
                </button>
                <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors">
                  <Unlock size={16} className="mr-1" />
                  Retirar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      ) : (
        <div className="text-center py-12">
          <div className="flex flex-col items-center">
            <Award className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum contrato de stake disponível
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Não há contratos de stake público disponíveis no momento
            </p>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-200 mb-2">
              Como funciona o Stake?
            </h3>
            <div className="text-sm text-indigo-700 dark:text-indigo-300 space-y-2">
              <p>
                O Stake permite que você bloqueie seus ativos digitais por um período determinado 
                em troca de recompensas periódicas. Quanto maior o período de bloqueio, maiores as recompensas.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Rendimentos pagos periodicamente conforme o plano escolhido</li>
                <li>Possibilidade de reinvestir automaticamente os rendimentos</li>
                <li>Diferentes níveis de risco e retorno disponíveis</li>
                <li>Retirada antecipada sujeita a penalidades</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakeTab;