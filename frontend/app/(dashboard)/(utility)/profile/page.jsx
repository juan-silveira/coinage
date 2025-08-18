"use client";
import { useEffect } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import BalancesTable from "@/components/partials/table/BalancesTable";
import useAuthStore from "@/store/authStore";
import useCachedBalances from "@/hooks/useCachedBalances";
import useCacheData from "@/hooks/useCacheData";
import useCurrentCompany from "@/hooks/useCurrentCompany";
import useEarnings from "@/hooks/useEarnings";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const profile = () => {
  // Hook para gerenciar título da aba com contagem de notificações
  useDocumentTitle('Perfil do Usuário', 'Coinage', true);
  
  const { user } = useAuthStore();
  const { cachedUser, formatCPF, formatPhone } = useCacheData();
  const { balances, loading, getBalance, getCorrectAzeSymbol } =
    useCachedBalances();
  const { currentCompany, loading: companyLoading } = useCurrentCompany();
  
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

  // Console.log apenas quando currentCompany mudar
  // useEffect(() => {
  //   if (currentCompany) {
  //     console.log('🔍 [Profile] Current Company Role:', currentCompany);
  //   }
  // }, [currentCompany]);

  return (
    <div>
      <div className="space-y-5 profile-page">
        <div className="profiel-wrap px-[35px] pb-10 md:pt-[84px] pt-10 rounded-lg bg-white dark:bg-slate-800 lg:flex lg:space-y-0 space-y-6 justify-between items-end relative z-[1]">
          <div className="bg-slate-900 dark:bg-slate-700 absolute left-0 top-0 md:h-1/2 h-[150px] w-full z-[-1] rounded-t-lg"></div>
          <div className="profile-box flex-none md:text-start text-center">
            <div className="md:flex items-end md:space-x-6 rtl:space-x-reverse">
              <div className="flex-none">
                <div className="md:h-[186px] md:w-[186px] h-[140px] w-[140px] md:ml-0 md:mr-0 ml-auto mr-auto md:mb-0 mb-4 rounded-full ring-4 ring-slate-100 relative">
                  <img
                    src="/assets/images/users/ivan.jpg"
                    alt=""
                    className="w-full h-full object-cover rounded-full"
                  />
                  <Link
                    href="#"
                    className="absolute right-2 h-8 w-8 bg-slate-50 text-slate-600 rounded-full shadow-sm flex flex-col items-center justify-center md:top-[140px] top-[100px]"
                  >
                    <Icon icon="heroicons:pencil-square" />
                  </Link>
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
                  <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-4 w-16 rounded"></div>
                ) : (
                  `${getBalance(
                    getCorrectAzeSymbol()
                  )} ${getCorrectAzeSymbol()}`
                )}
              </div>
              <div className="text-sm text-slate-600 font-light dark:text-slate-300">
                Saldo {getCorrectAzeSymbol()}
              </div>
            </div>

            <div className="flex-1">
              <div className="balance text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                {loading ? (
                  <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-4 w-16 rounded"></div>
                ) : (
                  `${getBalance("cBRL")} cBRL`
                )}
              </div>
              <div className="text-sm text-slate-600 font-light dark:text-slate-300">
                Saldo cBRL
              </div>
            </div>

            <div className="flex-1">
              <div className="text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                {loading ? (
                  <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-4 w-16 rounded"></div>
                ) : (
                  balances?.totalTokens || 0
                )}
              </div>
              <div className="text-sm text-slate-600 font-light dark:text-slate-300">
                Total de Tokens
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="lg:col-span-5 col-span-12">
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
          </div>
          <div className="lg:col-span-7 col-span-12">
            <div className="space-y-6">
              <Card title="Balance de tokens">
                <BalancesTable balances={balances} loading={loading} />
              </Card>
              
              {/* Nova seção de Earnings */}
              <Card title="Earnings (Proventos)">
                {earningsLoading ? (
                  <div className="space-y-4">
                    <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-4 w-full rounded"></div>
                    <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-4 w-3/4 rounded"></div>
                    <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-4 w-1/2 rounded"></div>
                  </div>
                ) : earnings && earnings.length > 0 ? (
                  <div className="space-y-4">
                    {/* Tabela de Earnings */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse dark:border-slate-700 dark:border">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <th className="text-xs font-medium leading-4 uppercase text-slate-600 ltr:text-left px-3 md:px-6 py-3">
                              <span className="block font-semibold">Token</span>
                            </th>
                            <th className="text-xs font-medium leading-4 uppercase text-slate-600 ltr:text-left px-3 md:px-6 py-3">
                              <span className="block font-semibold">Quantidade</span>
                            </th>
                            <th className="text-xs font-medium leading-4 uppercase text-slate-600 ltr:text-left px-3 md:px-6 py-3">
                              <span className="block font-semibold">Cotação</span>
                            </th>
                            <th className="text-xs font-medium leading-4 uppercase text-slate-600 ltr:text-left px-3 md:px-6 py-3">
                              <span className="block font-semibold">Valor</span>
                            </th>
                            <th className="text-xs font-medium leading-4 uppercase text-slate-600 ltr:text-left px-3 md:px-6 py-3">
                              <span className="block font-semibold">Data</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {earnings.map((earning, index) => (
                            <tr
                              key={earning.id}
                              className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                              <td className="text-slate-900 dark:text-slate-300 text-sm px-3 md:px-6 py-3">
                                <div className="flex items-center space-x-2">
                                  <img
                                    src={`/assets/images/currencies/${earning.tokenSymbol}.png`}
                                    alt={earning.tokenSymbol}
                                    className="w-6 h-6 rounded-full"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center hidden">
                                    <span className="text-slate-600 dark:text-slate-400 text-xs font-bold">
                                      {earning.tokenSymbol.charAt(0)}
                                    </span>
                                  </div>
                                  <span className="font-medium">{earning.tokenSymbol}</span>
                                </div>
                              </td>
                              <td className="text-slate-900 dark:text-slate-300 text-sm px-3 md:px-6 py-3">
                                {parseFloat(earning.amount).toFixed(6)}
                              </td>
                              <td className="text-slate-900 dark:text-slate-300 text-sm px-3 md:px-6 py-3">
                                R$ {parseFloat(earning.quote).toFixed(2)}
                              </td>
                              <td className="text-slate-900 dark:text-slate-300 text-sm px-3 md:px-6 py-3">
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  R$ {earning.valueInCbrl?.toFixed(2) || '0.00'}
                                </span>
                              </td>
                              <td className="text-slate-900 dark:text-slate-300 text-sm px-3 md:px-6 py-3">
                                {new Date(earning.distributionDate).toLocaleDateString('pt-BR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Resumo dos Earnings */}
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {stats.totalEarnings}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Total de Earnings
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            R$ {stats.totalValueInCbrl?.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Valor Total
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {pagination.totalPages || 1}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Páginas
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Icon icon="heroicons:currency-dollar" className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      Nenhum earning disponível no momento.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default profile;
