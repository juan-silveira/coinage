import { useState, useEffect, useCallback, useRef } from 'react';
import { userService } from '@/services/api';
import useAuthStore from '@/store/authStore';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

const useCacheData = () => {
  const [cachedUser, setCachedUser] = useState(null);
  const [balances, setBalances] = useState({
    network: 'testnet',
    balancesTable: {},
    tokenBalances: [],
    totalTokens: 0
  });
  const [loading, setLoading] = useState(true);

  // Store
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const cacheLoaded = useAuthStore((s) => s.cacheLoaded);
  const setCacheLoaded = useAuthStore((s) => s.setCacheLoaded);
  const cacheLoading = useAuthStore((s) => s.cacheLoading);
  const setCacheLoading = useAuthStore((s) => s.setCacheLoading);
  const maskBalances = useAuthStore((s) => s.maskBalances);
  const setMaskBalances = useAuthStore((s) => s.setMaskBalances);
  const toggleMaskBalances = useAuthStore((s) => s.toggleMaskBalances);

  const hasLoadedRef = useRef(false);
  const currentUserEmailRef = useRef(null);
  const refreshTimerRef = useRef(null);

  const loadCacheData = useCallback(async (reason = 'auto') => {
    // Reset ao trocar usuário
    if (currentUserEmailRef.current !== user?.email) {
      hasLoadedRef.current = false;
      currentUserEmailRef.current = user?.email;
      setCacheLoaded(false);
      setCacheLoading(false);
    }

    if (!user?.email) {
      setLoading(false);
      setBalances({ network: 'testnet', balancesTable: {}, tokenBalances: [], totalTokens: 0 });
      return;
    }

    // Evitar reentrância
    if (hasLoadedRef.current || cacheLoading) return;

    setCacheLoading(true);
    setLoading(true);

    try {
      const userResponse = await userService.getUserByEmail(user.email);
      if (userResponse.success) {
        setCachedUser(userResponse.data);
        updateUser(userResponse.data);

        if (userResponse.data?.publicKey) {
          const balanceResponse = await userService.getUserBalances(userResponse.data.publicKey);
          if (balanceResponse.success) {
            setBalances(balanceResponse.data);
            setCacheLoaded(true);
          } else {
            setBalances({ network: 'testnet', balancesTable: {}, tokenBalances: [], totalTokens: 0 });
          }
        } else {
          setBalances({ network: 'testnet', balancesTable: {}, tokenBalances: [], totalTokens: 0 });
        }
      } else {
        setBalances({ network: 'testnet', balancesTable: {}, tokenBalances: [], totalTokens: 0 });
      }
    } catch (error) {
      setBalances({ network: 'testnet', balancesTable: {}, tokenBalances: [], totalTokens: 0 });
    } finally {
      setLoading(false);
      setCacheLoading(false);
      hasLoadedRef.current = true;
    }
  }, [user?.email, cacheLoaded, cacheLoading, updateUser, setCacheLoaded, setCacheLoading]);

  // Atualização automática a cada 5 minutos (silenciosa)
  useEffect(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(() => {
      loadCacheData('silent');
    }, REFRESH_INTERVAL_MS);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [loadCacheData]);

  const formatBalance = useCallback((balance) => {
    if (!balance || balance === '0' || balance === 0) return '0.000000';
    return parseFloat(balance).toFixed(6);
  }, []);

  const getCorrectAzeSymbol = useCallback(() => {
    if (!balances) return 'AZE';
    const network = balances.network || 'testnet';
    return network === 'testnet' ? 'AZE-t' : 'AZE';
  }, [balances]);

  const getBalance = useCallback((symbol) => {
    if (!balances) return '0.000000';
    if (symbol === 'AZE') symbol = getCorrectAzeSymbol();
    if (balances.balancesTable && balances.balancesTable[symbol]) return formatBalance(balances.balancesTable[symbol]);
    if (balances.tokenBalances && Array.isArray(balances.tokenBalances)) {
      const token = balances.tokenBalances.find(t => t.tokenSymbol === symbol || t.tokenName === symbol);
      if (token) return formatBalance(token.balanceEth || token.balance);
    }
    if ((symbol === 'AZE' || symbol === 'AZE-t') && balances.azeBalance) return formatBalance(balances.azeBalance.balanceEth);
    if (symbol === 'AZE' || symbol === 'AZE-t') {
      if (balances.balancesTable && balances.balancesTable.AZE) return formatBalance(balances.balancesTable.AZE);
      if (balances.balancesTable && balances.balancesTable['AZE-t']) return formatBalance(balances.balancesTable['AZE-t']);
      if (balances.tokenBalances && Array.isArray(balances.tokenBalances)) {
        const azeToken = balances.tokenBalances.find(t => ['AZE', 'AZE-t'].includes(t.tokenSymbol) || ['AZE', 'AZE-t'].includes(t.tokenName));
        if (azeToken) return formatBalance(azeToken.balanceEth || azeToken.balance);
      }
    }
    return '0.000000';
  }, [balances, formatBalance, getCorrectAzeSymbol]);

  // Formatações (CPF e Telefone) no padrão brasileiro
  const formatCPF = useCallback((cpf) => {
    if (!cpf) return '';
    const cleaned = String(cpf).replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }, []);

  const formatPhone = useCallback((phone) => {
    if (!phone) return '';
    const cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  }, []);

  // Aplicar/retirar blur globalmente aos valores com classe .balance
  useEffect(() => {
    const root = document.documentElement;
    if (maskBalances) root.classList.add('mask-balances');
    else root.classList.remove('mask-balances');
  }, [maskBalances]);

  // Carregamento inicial e quando o usuário mudar
  useEffect(() => {
    loadCacheData('initial');
  }, [user?.email]);

  return {
    cachedUser,
    balances,
    loading,
    getBalance,
    formatBalance,
    getCorrectAzeSymbol,
    reloadData: () => loadCacheData('manual'),
    // Controle de máscara
    maskBalances,
    setMaskBalances,
    toggleMaskBalances,
    // Formatações
    formatCPF,
    formatPhone,
  };
};

export default useCacheData;

