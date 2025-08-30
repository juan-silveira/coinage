import { useState, useEffect } from 'react';
import pixKeysService from '@/services/pixKeys.service';
import { useAlertContext } from '@/contexts/AlertContext';

const usePixKeys = () => {
  const [pixKeys, setPixKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useAlertContext();

  // Carregar chaves PIX
  const loadPixKeys = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Tentar carregar da API
      const response = await pixKeysService.getPixKeys();
      if (response?.success) {
        setPixKeys(response.data.pixKeys);
        return;
      }
    } catch (apiError) {
      // Silenciar o log quando é esperado que não haja dados
      // console.warn('API não disponível, usando dados locais');
    }

    // Fallback: carregar do localStorage
    try {
      const localKeys = JSON.parse(localStorage.getItem('userPixKeys') || '[]');
      setPixKeys(localKeys);
    } catch (localError) {
      setError('Erro ao carregar chaves PIX');
      setPixKeys([]);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova chave PIX
  const addPixKey = async (pixKeyData) => {
    try {
      // Tentar salvar na API
      const response = await pixKeysService.createPixKey(pixKeyData);
      if (response?.success) {
        await loadPixKeys();
        showSuccess('Chave PIX cadastrada com sucesso');
        return response.data.pixKey;
      }
    } catch (apiError) {
      // console.warn('API não disponível, salvando localmente');
    }

    // Fallback: salvar no localStorage
    const newKey = {
      ...pixKeyData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    const localKeys = [...pixKeys, newKey];
    localStorage.setItem('userPixKeys', JSON.stringify(localKeys));
    setPixKeys(localKeys);
    showSuccess('Chave PIX salva localmente');
    return newKey;
  };

  // Remover chave PIX
  const removePixKey = async (pixKeyId) => {
    try {
      // Tentar remover da API
      const response = await pixKeysService.deletePixKey(pixKeyId);
      if (response?.success) {
        await loadPixKeys();
        showSuccess('Chave PIX removida');
        return true;
      }
    } catch (apiError) {
      // console.warn('API não disponível, removendo localmente');
    }

    // Fallback: remover do localStorage
    const updatedKeys = pixKeys.filter(key => key.id !== pixKeyId);
    localStorage.setItem('userPixKeys', JSON.stringify(updatedKeys));
    setPixKeys(updatedKeys);
    showSuccess('Chave PIX removida');
    return true;
  };

  // Definir chave padrão
  const setDefaultPixKey = async (pixKeyId) => {
    try {
      // Tentar atualizar na API
      const response = await pixKeysService.setDefaultPixKey(pixKeyId);
      if (response?.success) {
        await loadPixKeys();
        showSuccess('Chave PIX definida como padrão');
        return true;
      }
    } catch (apiError) {
      // console.warn('API não disponível, atualizando localmente');
    }

    // Fallback: atualizar no localStorage
    const updatedKeys = pixKeys.map(key => ({
      ...key,
      isDefault: key.id === pixKeyId
    }));
    localStorage.setItem('userPixKeys', JSON.stringify(updatedKeys));
    setPixKeys(updatedKeys);
    showSuccess('Chave PIX definida como padrão');
    return true;
  };

  // Obter chave PIX padrão
  const getDefaultPixKey = () => {
    return pixKeys.find(key => key.isDefault) || pixKeys[0] || null;
  };

  // Carregar ao montar
  useEffect(() => {
    loadPixKeys();
  }, []);

  return {
    pixKeys,
    loading,
    error,
    loadPixKeys,
    addPixKey,
    removePixKey,
    setDefaultPixKey,
    getDefaultPixKey
  };
};

export default usePixKeys;