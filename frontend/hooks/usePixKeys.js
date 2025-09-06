import { useState, useEffect } from 'react';
import pixKeysService from '@/services/pixKeys.service';
import { useAlertContext } from '@/contexts/AlertContext';

const usePixKeys = () => {
  const [pixKeys, setPixKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useAlertContext();

  // Carregar chaves PIX (apenas da API)
  const loadPixKeys = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Carregar apenas da API (sem fallback para localStorage)
      const response = await pixKeysService.getPixKeys();
      if (response?.success) {
        // console.log('✅ [usePixKeys] Chaves PIX carregadas da API:', response.data.pixKeys.length);
        setPixKeys(response.data.pixKeys);
        // Limpar dados antigos do localStorage se existirem
        localStorage.removeItem('userPixKeys');
      } else {
        // console.log('⚠️ [usePixKeys] API retornou sem sucesso:', response?.message);
        setPixKeys([]);
      }
    } catch (apiError) {
      console.error('❌ [usePixKeys] Erro ao carregar da API:', apiError);
      setError('Erro ao carregar chaves PIX do servidor');
      setPixKeys([]);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova chave PIX (apenas via API)
  const addPixKey = async (pixKeyData) => {
    try {
      // console.log('🔄 [usePixKeys] Criando nova chave PIX via API:', pixKeyData);
      const response = await pixKeysService.createPixKey(pixKeyData);
      if (response?.success) {
        // console.log('✅ [usePixKeys] Chave PIX criada com sucesso:', response.data.pixKey.id);
        await loadPixKeys(); // Recarregar da API
        showSuccess('Chave PIX cadastrada com sucesso');
        return response.data.pixKey;
      } else {
        throw new Error(response?.message || 'Erro ao criar chave PIX');
      }
    } catch (apiError) {
      console.error('❌ [usePixKeys] Erro ao criar chave PIX:', apiError);
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Erro ao cadastrar chave PIX';
      showError(errorMessage);
      throw apiError;
    }
  };

  // Remover chave PIX (apenas via API)
  const removePixKey = async (pixKeyId) => {
    try {
      console.log('🔄 [usePixKeys] Removendo chave PIX via API:', pixKeyId);
      const response = await pixKeysService.deletePixKey(pixKeyId);
      if (response?.success) {
        console.log('✅ [usePixKeys] Chave PIX removida com sucesso');
        await loadPixKeys(); // Recarregar da API
        showSuccess('Chave PIX removida');
        return true;
      } else {
        throw new Error(response?.message || 'Erro ao remover chave PIX');
      }
    } catch (apiError) {
      console.error('❌ [usePixKeys] Erro ao remover chave PIX:', apiError);
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Erro ao remover chave PIX';
      showError(errorMessage);
      throw apiError;
    }
  };

  // Definir chave padrão (apenas via API)
  const setDefaultPixKey = async (pixKeyId) => {
    try {
      console.log('🔄 [usePixKeys] Definindo chave PIX padrão via API:', pixKeyId);
      const response = await pixKeysService.setDefaultPixKey(pixKeyId);
      if (response?.success) {
        console.log('✅ [usePixKeys] Chave PIX padrão definida com sucesso');
        await loadPixKeys(); // Recarregar da API
        showSuccess('Chave PIX definida como padrão');
        return true;
      } else {
        throw new Error(response?.message || 'Erro ao definir chave padrão');
      }
    } catch (apiError) {
      console.error('❌ [usePixKeys] Erro ao definir chave padrão:', apiError);
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Erro ao definir chave padrão';
      showError(errorMessage);
      throw apiError;
    }
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