"use client";
import { useEffect } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import BalancesTable from "@/components/partials/table/BalancesTable";
import useAuthStore from "@/store/authStore";
import useCachedBalances from "@/hooks/useCachedBalances";
import useCacheData from "@/hooks/useCacheData";
import useCurrentClient from "@/hooks/useCurrentClient";

const profile = () => {
  const { user } = useAuthStore();
  const { cachedUser, formatCPF, formatPhone } = useCacheData();
  const { balances, loading, getBalance, getCorrectAzeSymbol } =
    useCachedBalances();
  const { currentClient, loading: clientLoading } = useCurrentClient();

  // Usar dados do cache se disponível, senão usar dados do store
  const displayUser = cachedUser || user;

  const roleDisplayMap = {
    USER: "Usuário",
    ADMIN: "Admin do Cliente",
    APP_ADMIN: "Admin Coinage",
    SUPER_ADMIN: "Super Admin",
  };

  // Console.log apenas quando currentClient mudar
  // useEffect(() => {
  //   if (currentClient) {
  //     console.log('🔍 [Profile] Current Client Role:', currentClient);
  //   }
  // }, [currentClient]);

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
                  {/* Acessamos 'role' do currentClient para encontrar o nome de exibição no mapa */}
                  {currentClient ? roleDisplayMap[currentClient.userRole] : "Role não definida"}
                </div>

                {/* Verificamos se 'role' existe para exibir a tag */}
                {currentClient?.userRole && (
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {/* Exibimos o valor de 'role' */}
                      {roleDisplayMap[currentClient.userRole]}
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
                      CLIENTE ATUAL
                    </div>
                    <div className="text-base text-slate-600 dark:text-slate-50">
                      {clientLoading ? (
                        <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-4 w-24 rounded"></div>
                      ) : currentClient ? (
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {currentClient.name}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default profile;
