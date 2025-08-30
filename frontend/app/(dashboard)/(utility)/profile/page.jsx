"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import UserAvatar from "@/components/ui/UserAvatar";
import PhotoUploadModal from "@/components/ui/PhotoUploadModal";
import BalancesTable from "@/components/partials/table/BalancesTable";
import useAuthStore from "@/store/authStore";
import useCachedBalances from "@/hooks/useCachedBalances";
import useCacheData from "@/hooks/useCacheData";
import useCurrentCompany from "@/hooks/useCurrentCompany";
import useEarnings from "@/hooks/useEarnings";
import usePixKeys from "@/hooks/usePixKeys";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAlertContext } from "@/contexts/AlertContext";
import PixKeyModal from "@/components/modals/PixKeyModal";
import api from "@/services/api";

const Profile = () => {
  // Hook para gerenciar título da aba com contagem de notificações
  useDocumentTitle('Perfil do Usuário', 'Coinage', true);
  
  const { user, profilePhotoUrl, setProfilePhotoUrl } = useAuthStore();
  const { cachedUser, formatCPF, formatPhone } = useCacheData();
  const { balances, loading, getBalance, getCorrectAzeSymbol } = useCachedBalances();
  const { currentCompany, loading: companyLoading } = useCurrentCompany();
  const { pixKeys, loading: pixKeysLoading, removePixKey, setDefaultPixKey } = usePixKeys();
  const { showSuccess, showError } = useAlertContext();
  
  // Estados para foto de perfil
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  
  // Estados para PIX keys
  const [pixKeyModalOpen, setPixKeyModalOpen] = useState(false);
  
  // Hook para earnings
  const { 
    earnings, 
    loading: earningsLoading, 
    stats, 
    pagination,
    fetchEarnings 
  } = useEarnings({ 
    autoFetch: true, 
    limit: 10 
  });

  // Usar dados do cache se disponível, senão usar dados do store
  const displayUser = cachedUser || user;

  const roleDisplayMap = {
    USER: "Usuário",
    ADMIN: "Admin do Company",
    APP_ADMIN: "Admin Coinage",
    SUPER_ADMIN: "Super Admin",
  };

  const handleRemovePixKey = async (pixKeyId) => {
    try {
      await removePixKey(pixKeyId);
    } catch (error) {
      showError('Erro ao remover chave PIX');
    }
  };

  const handleSetDefaultPixKey = async (pixKeyId) => {
    try {
      await setDefaultPixKey(pixKeyId);
    } catch (error) {
      showError('Erro ao definir chave padrão');
    }
  };

  const formatPixKeyValue = (keyType, keyValue) => {
    if (keyType === 'cpf') {
      return formatCPF(keyValue);
    }
    if (keyType === 'phone') {
      return formatPhone(keyValue);
    }
    return keyValue;
  };



  return (
    <div>
      <div className="space-y-5 profile-page">
        <div className="profiel-wrap px-[35px] pb-10 md:pt-[84px] pt-10 rounded-lg bg-white dark:bg-slate-800 lg:flex lg:space-y-0 space-y-6 justify-between items-end relative z-[1]">
          <div className="bg-slate-900 dark:bg-slate-700 absolute left-0 top-0 md:h-1/2 h-[150px] w-full z-[-1] rounded-t-lg"></div>
          <div className="profile-box flex-none md:text-start text-center">
            <div className="md:flex items-end md:space-x-6 rtl:space-x-reverse">
              <div className="flex-none">
                <div className="md:h-[186px] md:w-[186px] h-[140px] w-[140px] md:ml-0 md:mr-0 ml-auto mr-auto md:mb-0 mb-4 rounded-full ring-4 ring-slate-100 relative">
                  <UserAvatar size="3xl" className="!w-full !h-full" />
                  <button
                    onClick={() => setPhotoModalOpen(true)}
                    className="absolute right-2 h-8 w-8 bg-slate-50 text-slate-600 rounded-full shadow-sm flex flex-col items-center justify-center md:top-[140px] top-[100px] hover:bg-slate-200 transition-colors"
                  >
                    <Icon icon="heroicons:pencil-square" />
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-2xl font-medium text-slate-900 dark:text-slate-200 mb-[3px]">
                  {displayUser?.name || "Usuário"}
                </div>
                <div className="text-sm font-light text-slate-600 dark:text-slate-400 mb-2">
                  {/* Acessamos 'role' do currentCompany para encontrar o nome de exibição no mapa */}
                  {currentCompany ? roleDisplayMap[currentCompany.userRole] : "Role não definida"}
                </div>

                {/* Verificamos se 'role' existe para exibir a tag */}
                {currentCompany?.userRole && (
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {/* Exibimos o valor de 'role' */}
                      {roleDisplayMap[currentCompany.userRole]}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="profile-info-500 md:flex md:text-start text-center flex-1 max-w-[516px] md:space-y-0 space-y-4">
            <div className="flex-1">
              <div className="balance text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-24"></div>
                  </div>
                ) : (
                  <span>
                    {getBalance('cBRL')} {getCorrectAzeSymbol('cBRL')}
                  </span>
                )}
              </div>
              <div className="balance-text text-xs text-slate-500 dark:text-slate-400">
                Saldo em Real Digital (cBRL)
              </div>
            </div>
            <div className="flex-1">
              <div className="balance text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-24"></div>
                  </div>
                ) : (
                  <span>
                    {getBalance('AZE')} {getCorrectAzeSymbol('AZE')}
                  </span>
                )}
              </div>
              <div className="balance-text text-xs text-slate-500 dark:text-slate-400">
                Saldo da Coin Azore (AZE)
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
        <div className="lg:col-span-5 col-span-12 space-y-6">
            <Card title="Info">
              <ul className="list space-y-8">
                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:building-office" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      EMPRESA ATUAL
                    </div>
                    <div className="text-base text-slate-600 dark:text-slate-50">
                      {companyLoading ? (
                        <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-4 w-24 rounded"></div>
                      ) : currentCompany ? (
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {currentCompany.name}
                        </span>
                      ) : (
                        "Não informado"
                      )}
                    </div>
                  </div>
                </li>

                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:envelope" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      EMAIL
                    </div>
                    <a
                      href={`mailto:${displayUser?.email || ""}`}
                      className="text-base text-slate-600 dark:text-slate-50"
                    >
                      {displayUser?.email || "Não informado"}
                    </a>
                  </div>
                </li>

                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:phone-arrow-up-right" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      PHONE
                    </div>
                    <a
                      href={`tel:${displayUser?.phone || ""}`}
                      className="text-base text-slate-600 dark:text-slate-50"
                    >
                      {displayUser?.phone
                        ? formatPhone(displayUser.phone)
                        : "Não informado"}
                    </a>
                  </div>
                </li>

                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:identification" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      CPF
                    </div>
                    <div className="text-base text-slate-600 dark:text-slate-50">
                      {displayUser?.cpf
                        ? formatCPF(displayUser.cpf)
                        : "Não informado"}
                    </div>
                  </div>
                </li>

                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:calendar" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      DATA DE NASCIMENTO
                    </div>
                    <div className="text-base text-slate-600 dark:text-slate-50">
                      {displayUser?.birthDate
                        ? new Date(displayUser.birthDate).toLocaleDateString(
                            "pt-BR"
                          )
                        : "Não informado"}
                    </div>
                  </div>
                </li>

                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:key" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      CHAVE PÚBLICA
                    </div>
                    <div className="text-base text-slate-600 dark:text-slate-50 font-mono text-sm">
                      {displayUser?.publicKey ? (
                        <span className="break-all">
                          {displayUser.publicKey}
                        </span>
                      ) : (
                        "Não informado"
                      )}
                    </div>
                  </div>
                </li>

                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:check-circle" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      STATUS
                    </div>
                    <div className="text-base text-slate-600 dark:text-slate-50">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          displayUser?.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {displayUser?.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                </li>
              </ul>
            </Card>

            {/* PIX Keys Section */}
            <Card title="Chaves PIX" 
                  headerslot={
                    <button
                      onClick={() => setPixKeyModalOpen(true)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                    >
                      <Icon icon="heroicons:plus" className="w-4 h-4 mr-1" />
                      Adicionar
                    </button>
                  }>
              {pixKeysLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="rounded-full bg-slate-300 dark:bg-slate-600 h-10 w-10"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : pixKeys.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Icon icon="fa6-brands:pix" className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Nenhuma chave PIX cadastrada
                  </p>
                  <button
                    onClick={() => setPixKeyModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                    Cadastrar primeira chave
                  </button>
                </div>
              ) : (
                <ul className="space-y-4">
                  {pixKeys.map((pixKey) => (
                    <li key={pixKey.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                              <Icon icon="fa6-brands:pix" className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {pixKey.keyType === 'cpf' ? 'CPF' : 
                                 pixKey.keyType === 'email' ? 'E-mail' :
                                 pixKey.keyType === 'phone' ? 'Telefone' : 'Chave Aleatória'}
                              </p>
                              {pixKey.isDefault && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Padrão
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                              {formatPixKeyValue(pixKey.keyType, pixKey.keyValue)}
                            </p>
                            {pixKey.bankName && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {pixKey.bankName}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              Cadastrada em {new Date(pixKey.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!pixKey.isDefault && (
                            <button
                              onClick={() => handleSetDefaultPixKey(pixKey.id)}
                              className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Tornar padrão
                            </button>
                          )}
                          <button
                            onClick={() => handleRemovePixKey(pixKey.id)}
                            className="text-xs text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
          <div className="lg:col-span-7 col-span-12">
            <Card title="Saldos Atuais">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="rounded-full bg-slate-300 dark:bg-slate-600 h-10 w-10"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <BalancesTable balances={balances} />
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        currentPhoto={profilePhotoUrl}
      />

      {/* PIX Key Modal */}
      <PixKeyModal
        isOpen={pixKeyModalOpen}
        onClose={() => setPixKeyModalOpen(false)}
        mode="profile"
      />
    </div>
  );
};

export default Profile;