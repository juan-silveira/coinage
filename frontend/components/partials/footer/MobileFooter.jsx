import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import UserAvatar from "@/components/ui/UserAvatar";
import { useNotifications } from "@/hooks/useNotifications";
import { useChatMessages } from "@/hooks/useChatMessages";
import { Menu, Transition } from "@headlessui/react";
import useAuthStore from "@/store/authStore";
import { authService } from "@/services/api";
import { getNotificationSoundService } from "@/services/notificationSoundService";
import { useAlertContext } from "@/contexts/AlertContext";
import Swicth from "@/components/ui/Switch";

const MobileFooter = () => {
  const router = useRouter();
  const { unreadCount: notificationCount } = useNotifications();
  const { unreadCount: chatCount } = useChatMessages();
  const { logout, user } = useAuthStore();
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

  const formatNameForHeader = (fullName) => {
    if (!fullName) return 'Usuário';
    
    const names = fullName.trim().split(' ').filter(name => name.length > 0);
    if (names.length === 0) return 'Usuário';
    if (names.length === 1) return names[0];
    
    return `${names[0]} ${names[names.length - 1]}`;
  };
  
  return (
    <div className="bg-white bg-no-repeat custom-dropshadow footer-bg dark:bg-slate-700 flex justify-around items-center backdrop-filter backdrop-blur-[40px] fixed left-0 w-full z-[9999] bottom-0 py-[12px] px-4">
      <Link href="chat">
        <div>
          <span
            className={` relative cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center mb-1
         ${
           router.pathname === "chat"
             ? "text-primary-500"
             : "dark:text-white text-slate-900"
         }
          `}
          >
            <Icon icon="heroicons-outline:mail" />
            {chatCount > 0 && (
              <span className="absolute right-[5px] lg:top-0 -top-2 h-4 w-4 bg-red-500 text-[8px] font-semibold flex flex-col items-center justify-center rounded-full text-white z-[99]">
                {chatCount > 99 ? '99+' : chatCount}
              </span>
            )}
          </span>
          <span
            className={` block text-[11px]
          ${
            router.pathname === "chat"
              ? "text-primary-500"
              : "text-slate-600 dark:text-slate-300"
          }
          `}
          >
            Messages
          </span>
        </div>
      </Link>
      
      {/* Profile Dropdown */}
      <Menu as="div" className="relative">
        <Menu.Button className="relative bg-white bg-no-repeat backdrop-filter backdrop-blur-[40px] rounded-full footer-bg dark:bg-slate-700 h-[65px] w-[65px] z-[-1] -mt-[40px] flex justify-center items-center">
          <div className="h-[50px] w-[50px] rounded-full relative left-[0px] top-[0px] custom-dropshadow">
            <UserAvatar size="3xl" className="!w-[50px] !h-[50px] border-2 border-slate-100" />
          </div>
        </Menu.Button>
        
        <Transition
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute bottom-[80px] left-1/2 transform -translate-x-1/2 mt-2 w-[220px] origin-bottom-center bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            
            {/* User Info */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {formatNameForHeader(user?.name)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                {user?.email}
              </p>
            </div>

            {/* Sound Toggle */}
            <Menu.Item>
              {({ active }) => (
                <div
                  className={`${
                    active
                      ? "bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-300 dark:bg-opacity-50"
                      : "text-slate-600 dark:text-slate-300"
                  } block w-full px-4 py-2 border-b border-slate-100 dark:border-slate-700`}
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

            {/* Profile Menu */}
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => router.push("/profile")}
                  className={`${
                    active
                      ? "bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-300 dark:bg-opacity-50"
                      : "text-slate-600 dark:text-slate-300"
                  } block w-full px-4 py-2 text-left`}
                >
                  <div className="flex items-center">
                    <span className="block text-xl ltr:mr-3 rtl:ml-3">
                      <Icon icon="heroicons-outline:user" />
                    </span>
                    <span className="block text-sm">Perfil</span>
                  </div>
                </button>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => router.push("/settings")}
                  className={`${
                    active
                      ? "bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-300 dark:bg-opacity-50"
                      : "text-slate-600 dark:text-slate-300"
                  } block w-full px-4 py-2 text-left`}
                >
                  <div className="flex items-center">
                    <span className="block text-xl ltr:mr-3 rtl:ml-3">
                      <Icon icon="heroicons-outline:cog" />
                    </span>
                    <span className="block text-sm">Configurações</span>
                  </div>
                </button>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={`${
                    active
                      ? "bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-300 dark:bg-opacity-50"
                      : "text-slate-600 dark:text-slate-300"
                  } block w-full px-4 py-2 text-left`}
                >
                  <div className="flex items-center">
                    <span className="block text-xl ltr:mr-3 rtl:ml-3">
                      <Icon icon="heroicons-outline:login" />
                    </span>
                    <span className="block text-sm">Sair</span>
                  </div>
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
      <Link href="notifications">
        <div>
          <span
            className={` relative cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center mb-1
      ${
        router.pathname === "notifications"
          ? "text-primary-500"
          : "dark:text-white text-slate-900"
      }
          `}
          >
            <Icon icon="heroicons-outline:bell" />
            {notificationCount > 0 && (
              <span className="absolute right-[17px] lg:top-0 -top-2 h-4 w-4 bg-red-500 text-[8px] font-semibold flex flex-col items-center justify-center rounded-full text-white z-[99]">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </span>
          <span
            className={` block text-[11px]
         ${
           router.pathname === "notifications"
             ? "text-primary-500"
             : "text-slate-600 dark:text-slate-300"
         }
        `}
          >
            Notifications
          </span>
        </div>
      </Link>
    </div>
  );
};

export default MobileFooter;
