import React, { useState, useEffect } from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import UserAvatar from "@/components/ui/UserAvatar";
import Swicth from "@/components/ui/Switch"; // Note: o componente tem um typo no nome
import { Menu, Transition } from "@headlessui/react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { authService } from "@/services/api";
import { getNotificationSoundService } from "@/services/notificationSoundService";
import { useAlertContext } from "@/contexts/AlertContext";

const ProfileLabel = () => {
  const { user } = useAuthStore();
  
  // Função para formatar nome (primeiro + último)
  const formatNameForHeader = (fullName) => {
    if (!fullName) return 'Usuário';
    
    const names = fullName.trim().split(' ').filter(name => name.length > 0);
    if (names.length === 0) return 'Usuário';
    if (names.length === 1) return names[0];
    
    // Retorna primeiro nome + último nome
    return `${names[0]} ${names[names.length - 1]}`;
  };
  
  return (
    <div className="flex items-center">
      <div className="flex-1 ltr:mr-[10px] rtl:ml-[10px]">
        <UserAvatar size="sm" />
      </div>
      <div className="flex-none text-slate-600 dark:text-white text-sm font-normal items-center lg:flex hidden overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="overflow-hidden text-ellipsis whitespace-nowrap w-[85px] block">
          {formatNameForHeader(user?.name)}
        </span>
        <span className="text-base inline-block ltr:ml-[10px] rtl:mr-[10px]">
          <Icon icon="heroicons-outline:chevron-down"></Icon>
        </span>
      </div>
    </div>
  );
};

const Profile = () => {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { showSuccess, showError } = useAlertContext();
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Carregar preferência de som do localStorage
  useEffect(() => {
    const soundService = getNotificationSoundService();
    if (soundService) {
      setSoundEnabled(soundService.isEnabled());
    }
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      const companyAlias = logout();
      router.push(`/login/${companyAlias}`);
    } catch (error) {
      // Mesmo com erro, fazer logout local
      const companyAlias = logout();
      router.push(`/login/${companyAlias}`);
    }
  };

  const handleSoundToggle = (event) => {
    const enabled = event.target.checked;
    const soundService = getNotificationSoundService();
    if (soundService) {
      if (enabled) {
        soundService.enable();
        showSuccess('Som de notificações ativado', 'Som ativado');
      } else {
        soundService.disable();
        showSuccess('Som de notificações desativado', 'Som desativado');
      }
      setSoundEnabled(enabled);
    }
  };

  const ProfileMenu = [
    {
      label: "Perfil",
      icon: "heroicons-outline:user",
      action: () => {
        router.push("/profile");
      },
    },
    {
      label: "Configurações",
      icon: "heroicons-outline:cog",
      action: () => {
        router.push("/settings");
      },
    },
    {
      label: "Sair",
      icon: "heroicons-outline:login",
      action: handleLogout,
    },
  ];

  return (
    <Dropdown label={ProfileLabel()} classMenuItems="w-[220px] top-[58px]">
      {/* Switch de Som das Notificações */}
      <Menu.Item>
        {({ active }) => (
          <div
            className={`${
              active
                ? "bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-300 dark:bg-opacity-50"
                : "text-slate-600 dark:text-slate-300"
            } block px-4 py-2 border-b border-slate-100 dark:border-slate-700`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="block text-xl ltr:mr-3 rtl:ml-3">
                  <Icon icon="heroicons-outline:volume-up" />
                </span>
                <span className="block text-sm">Som das notificações</span>
              </div>
              <Swicth
                value={soundEnabled}
                onChange={handleSoundToggle}
              />
            </div>
          </div>
        )}
      </Menu.Item>

      {/* Menu Items Originais */}
      {ProfileMenu.map((item, index) => (
        <Menu.Item key={index}>
          {({ active }) => (
            <div
              onClick={() => item.action()}
              className={`${
                active
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-300 dark:bg-opacity-50"
                  : "text-slate-600 dark:text-slate-300"
              } block     ${
                item.hasDivider
                  ? "border-t border-slate-100 dark:border-slate-700"
                  : ""
              }`}
            >
              <div className={`block cursor-pointer px-4 py-2`}>
                <div className="flex items-center">
                  <span className="block text-xl ltr:mr-3 rtl:ml-3">
                    <Icon icon={item.icon} />
                  </span>
                  <span className="block text-sm">{item.label}</span>
                </div>
              </div>
            </div>
          )}
        </Menu.Item>
      ))}
    </Dropdown>
  );
};

export default Profile;
