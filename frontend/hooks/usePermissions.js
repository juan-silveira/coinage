import { useMemo } from 'react';
import useAuthStore from '@/store/authStore';

const usePermissions = () => {
  const { user } = useAuthStore();

  const permissions = useMemo(() => {
    if (!user?.userCompanies?.length) {
      return {
        isAdmin: false,
        isAppAdmin: false,
        isSuperAdmin: false,
        canViewCompanySettings: false,
        canViewSystemSettings: false,
        canViewSensitiveData: false,
        canManageRoles: false,
        roles: []
      };
    }

    // Pega todas as roles do usuário em todas as empresas
    const allRoles = user.userCompanies.map(uc => uc.role);
    const uniqueRoles = [...new Set(allRoles)];

    const isAdmin = uniqueRoles.includes('ADMIN');
    const isAppAdmin = uniqueRoles.includes('APP_ADMIN');
    const isSuperAdmin = uniqueRoles.includes('SUPER_ADMIN');

    return {
      isAdmin,
      isAppAdmin,
      isSuperAdmin,
      canViewCompanySettings: isAdmin || isAppAdmin || isSuperAdmin,
      canViewSystemSettings: isAppAdmin || isSuperAdmin,
      canViewSensitiveData: isSuperAdmin,
      canManageRoles: isSuperAdmin,
      roles: uniqueRoles,
      primaryRole: uniqueRoles.includes('SUPER_ADMIN') ? 'SUPER_ADMIN' :
                   uniqueRoles.includes('APP_ADMIN') ? 'APP_ADMIN' :
                   uniqueRoles.includes('ADMIN') ? 'ADMIN' : 'USER'
    };
  }, [user]);

  const hasPermission = (permission) => {
    return permissions[permission] || false;
  };

  const hasAnyRole = (rolesList) => {
    return rolesList.some(role => permissions.roles.includes(role));
  };

  const hasAllRoles = (rolesList) => {
    return rolesList.every(role => permissions.roles.includes(role));
  };

  return {
    ...permissions,
    hasPermission,
    hasAnyRole,
    hasAllRoles
  };
};

export default usePermissions;