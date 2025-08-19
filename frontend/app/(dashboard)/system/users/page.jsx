"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Select from "react-select";
import Tooltip from "@/components/ui/Tooltip";
import UserProfileModal from "@/components/modals/UserProfileModal";
import usePermissions from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";
import { useAlertContext } from '@/contexts/AlertContext';
import { userService } from '@/services/api';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  MoreVertical,
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  Eye,
  Shield,
  ShieldCheck,
  ShieldX,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  Building,
  Globe,
  FileCheck,
  FileX,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

const SystemUsersPage = () => {
  const { showSuccess, showError, showInfo, showWarning } = useAlertContext();
  const router = useRouter();
  const permissions = usePermissions();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    company: '',
    role: '',
    status: '',
    lastLoginDays: '',
    country: ''
  });

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    superAdmins: 0,
    companies: 0
  });

  useEffect(() => {
    if (!permissions.canViewSystemSettings) {
      router.push("/dashboard");
      return;
    }
    
    // Só carrega uma vez na montagem inicial
    if (!initialLoadDone) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions.canViewSystemSettings, router, initialLoadDone]);

  // Aplicar filtros quando filters mudarem
  useEffect(() => {
    if (initialLoadDone) {
      applyFilters();
    }
  }, [users, filters, initialLoadDone]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = {
        page: 1,
        limit: 100, // Reduzir limit para evitar sobrecarga
      };

      try {
        const response = await userService.getUsers(params);
        
        if (response.success && response.data) {
          const usersData = response.data.users || [];
          
          // Transformar dados da API para o formato esperado
          const transformedUsers = usersData.map(user => {
            // Obter todas as empresas do usuário
            const userCompanies = user.userCompanies || [];
            
            // Empresa principal (primeira ativa ou primeira da lista)
            const primaryCompany = userCompanies.find(uc => uc.status === 'active') || userCompanies[0] || null;
            
            // Extrair o maior role entre todas as empresas
            const roles = userCompanies.map(uc => uc.role).filter(Boolean);
            const roleHierarchy = { 'SUPER_ADMIN': 4, 'APP_ADMIN': 3, 'ADMIN': 2, 'USER': 1 };
            const highestRole = roles.reduce((highest, role) => {
              return (roleHierarchy[role] || 0) > (roleHierarchy[highest] || 0) ? role : highest;
            }, user.role || 'USER');
            
            // Calcular totais de atividade de todas as empresas
            const totalAccessCount = userCompanies.reduce((total, uc) => total + (uc.accessCount || 0), 0);
            
            // Último acesso mais recente entre todas as empresas
            const lastAccessDates = userCompanies
              .map(uc => uc.lastAccessAt)
              .filter(Boolean)
              .map(date => new Date(date));
            const mostRecentAccess = lastAccessDates.length > 0 
              ? new Date(Math.max(...lastAccessDates))
              : (user.lastActivityAt ? new Date(user.lastActivityAt) : null);
            
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              cpf: user.cpf,
              phone: user.phone,
              role: highestRole,
              status: user.isActive ? 'active' : 'inactive',
              // Para exibição na tabela - empresa principal
              company: {
                id: primaryCompany?.company?.id || 'sem-empresa',
                name: primaryCompany?.company?.name || 'Sem Empresa',
                alias: primaryCompany?.company?.alias || 'sem-empresa'
              },
              // Todas as empresas para uso no modal e outras funções
              allCompanies: userCompanies.map(uc => ({
                id: uc.company.id,
                name: uc.company.name,
                alias: uc.company.alias,
                role: uc.role,
                status: uc.status,
                accessCount: uc.accessCount,
                lastAccessAt: uc.lastAccessAt,
                linkedAt: uc.linkedAt
              })),
              // Status de documentos - Front, Back e Selfie
              documentsStatus: {
                front: Math.random() > 0.2,    // 80% chance de ter frente do documento
                back: Math.random() > 0.3,     // 70% chance de ter verso do documento  
                selfie: Math.random() > 0.4,   // 60% chance de ter selfie com documento
                validated: Math.random() > 0.4 // 60% chance de estar validado
              },
              createdAt: user.createdAt,
              lastLogin: mostRecentAccess?.toISOString() || user.lastActivityAt,
              loginCount: totalAccessCount,
              transactions: 0,
              balance: 0,
              publicKey: user.publicKey,
              privateKey: permissions.canViewSensitiveData ? user.privateKey : "***REDACTED***",
              avatar: user.avatar || null
            };
          });
          
          setUsers(transformedUsers);
          
          // Calcular estatísticas
          const companies = [...new Set(transformedUsers.map(u => u.company.name))];
          const newStats = {
            total: transformedUsers.length,
            active: transformedUsers.filter(u => u.status === 'active').length,
            inactive: transformedUsers.filter(u => u.status === 'inactive' || u.status === 'blocked').length,
            superAdmins: transformedUsers.filter(u => u.role === 'SUPER_ADMIN').length,
            companies: companies.length
          };
          
          setStats(newStats);
          
          // Aplicar filtros iniciais
          if (!initialLoadDone) {
            setInitialLoadDone(true);
          }
        } else {
          // Se não conseguir carregar dados reais, mostrar estado vazio
          console.warn('Nenhum usuário encontrado ou resposta inválida:', response);
          setUsers([]);
          setStats({ total: 0, active: 0, inactive: 0, superAdmins: 0, companies: 0 });
          setInitialLoadDone(true);
        }
      } catch (apiError) {
        console.error('Erro na API de usuários:', apiError);
        
        // Se falhar na API, mostrar estado vazio em vez de erro
        setUsers([]);
        setStats({ total: 0, active: 0, inactive: 0, superAdmins: 0, companies: 0 });
        setInitialLoadDone(true);
        
        // Mostrar toast apenas se for erro de autenticação ou rate limiting
        if (apiError.response?.status === 401) {
          showError('Erro de autenticação ao carregar usuários');
        } else if (apiError.response?.status === 429) {
          showError('Muitas requisições simultâneas. Aguarde um momento.');
        } else {
          showError('Erro ao carregar usuários. Tente novamente.');
        }
      }
      
    } catch (error) {
      console.error('Erro geral ao carregar usuários:', error);
      showError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [initialLoadDone]);

  const applyFilters = () => {
    let filtered = [...users];

    // Filtro de busca
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.cpf.includes(search) ||
        user.phone.includes(search) ||
        user.company.name.toLowerCase().includes(search) ||
        user.allCompanies.some(company => company.name.toLowerCase().includes(search))
      );
    }

    // Filtro de empresa - considerar todas as empresas do usuário
    if (filters.company) {
      filtered = filtered.filter(user => 
        user.allCompanies.some(company => company.name === filters.company)
      );
    }

    // Filtro de role
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // Filtro de status
    if (filters.status) {
      filtered = filtered.filter(user => user.status === filters.status);
    }

    // Filtro de último login
    if (filters.lastLoginDays) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(filters.lastLoginDays));
      filtered = filtered.filter(user => 
        new Date(user.lastLogin) >= daysAgo
      );
    }

    // Filtro de país
    if (filters.country) {
      filtered = filtered.filter(user => user.country === filters.country);
    }

    setFilteredUsers(filtered);
  };

  // Debounced filter change to prevent excessive API calls
  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const clearFilters = () => {
    setFilters({
      search: '',
      company: '',
      role: '',
      status: '',
      lastLoginDays: '',
      country: ''
    });
  };

  const exportUsers = () => {
    const csvData = filteredUsers.map(user => ({
      Nome: user.name,
      Email: user.email,
      CPF: user.cpf,
      Telefone: user.phone,
      Role: user.role,
      Status: user.status,
      Empresa: user.company.name,
      País: user.country,
      Cidade: user.city,
      'Data Criação': new Date(user.createdAt).toLocaleDateString('pt-BR'),
      'Último Login': user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca',
      'Login Count': user.loginCount,
      'Transações': user.transactions,
      'Saldo (BRL)': `R$ ${user.balance.toFixed(2)}`
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios-sistema-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUserAction = async (action, user) => {
    if (!permissions.canManageRoles && ['block', 'unblock', 'changeRole'].includes(action)) {
      showError("Você não tem permissão para esta ação");
      return;
    }

    try {
      switch (action) {
        case 'viewProfile':
          setSelectedUser(user);
          setShowProfileModal(true);
          break;

        case 'block':
          await userService.blockUser(user.id);
          setUsers(users.map(u => 
            u.id === user.id ? { ...u, status: 'blocked' } : u
          ));
          showSuccess(`${user.name} foi bloqueado`);
          break;

        case 'unblock':
          await userService.unblockUser(user.id);
          setUsers(users.map(u => 
            u.id === user.id ? { ...u, status: 'active' } : u
          ));
          showSuccess(`${user.name} foi desbloqueado`);
          break;

        case 'activate':
          await userService.activateUser(user.id);
          setUsers(users.map(u => 
            u.id === user.id ? { ...u, status: 'active' } : u
          ));
          showSuccess(`${user.name} foi ativado`);
          break;

        case 'deactivate':
          await userService.deactivateUser(user.id);
          setUsers(users.map(u => 
            u.id === user.id ? { ...u, status: 'inactive' } : u
          ));
          showSuccess(`${user.name} foi desativado`);
          break;

        default:
          console.log('Action:', action, 'User:', user.name);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      showError('Erro ao executar ação');
    }
    
    setOpenDropdown(null);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "SUPER_ADMIN": return "bg-red-500";
      case "APP_ADMIN": return "bg-orange-500";
      case "ADMIN": return "bg-blue-500";
      case "USER": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "inactive": return "bg-gray-500";
      case "blocked": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active": return <UserCheck size={16} />;
      case "inactive": return <UserX size={16} />;
      case "blocked": return <ShieldX size={16} />;
      default: return <User size={16} />;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "SUPER_ADMIN": return <ShieldCheck className="text-red-600" size={16} />;
      case "APP_ADMIN": return <Shield className="text-orange-600" size={16} />;
      case "ADMIN": return <Shield className="text-blue-600" size={16} />;
      case "USER": return <User className="text-gray-600" size={16} />;
      default: return <User className="text-gray-600" size={16} />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "SUPER_ADMIN": return "Super Admin";
      case "APP_ADMIN": return "Admin da Empresa";
      case "ADMIN": return "Administrador";
      case "USER": return "Usuário";
      default: return role;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active": return "Ativo";
      case "inactive": return "Inativo";
      case "blocked": return "Bloqueado";
      default: return status;
    }
  };

  const getDaysSinceLastLogin = (lastLogin) => {
    if (!lastLogin) return null;
    const days = Math.floor((new Date() - new Date(lastLogin)) / (1000 * 60 * 60 * 24));
    return days;
  };

  const generateCompaniesTooltip = (allCompanies) => {
    if (!allCompanies || allCompanies.length <= 1) return null;
    
    return (
      <div className="space-y-2 p-2">
        <div className="font-semibold text-sm border-b border-gray-200 pb-1 mb-2">
          Empresas ({allCompanies.length})
        </div>
        {allCompanies.map((company, index) => (
          <div key={company.id} className="flex items-center justify-between space-x-3 text-xs">
            <div className="flex-1">
              <div className="font-medium text-white">{company.name}</div>
            </div>
            <div className="text-right">
              <div className="text-blue-200 font-medium">{company.role}</div>
              <div className="text-gray-300">
                {company.accessCount || 0} acessos
              </div>
            </div>
            {company.status === 'active' && (
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const generateDocumentsTooltip = (documentsStatus) => {
    const documents = [
      {
        key: 'front',
        name: 'Frente do Documento',
        description: 'Foto da frente do RG/CNH',
        status: documentsStatus.front,
        icon: '📄'
      },
      {
        key: 'back',
        name: 'Verso do Documento',
        description: 'Foto do verso do RG/CNH',
        status: documentsStatus.back,
        icon: '📃'
      },
      {
        key: 'selfie',
        name: 'Selfie com Documento',
        description: 'Foto segurando o documento',
        status: documentsStatus.selfie,
        icon: '🤳'
      }
    ];

    const validatedCount = documents.filter(doc => doc.status).length;
    const totalCount = documents.length;
    
    return (
      <div className="space-y-3 p-2 min-w-64">
        <div className="border-b border-gray-200 pb-2 mb-3">
          <div className="font-semibold text-sm text-white">
            Status dos Documentos
          </div>
          <div className="text-xs text-gray-300">
            {validatedCount}/{totalCount} documentos validados
          </div>
          <div className="flex items-center mt-2">
            <div className="flex-1 bg-gray-600 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  documentsStatus.validated ? 'bg-green-400' : 'bg-yellow-400'
                }`}
                style={{ width: `${(validatedCount / totalCount) * 100}%` }}
              />
            </div>
            <span className={`ml-2 text-xs font-medium ${
              documentsStatus.validated ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {documentsStatus.validated ? 'Validado' : 'Pendente'}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.key} className="flex items-start space-x-3">
              <div className="text-lg">{doc.icon}</div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${
                  doc.status ? 'text-green-400' : 'text-gray-300'
                }`}>
                  {doc.name}
                </div>
                <div className="text-xs text-gray-400">
                  {doc.description}
                </div>
              </div>
              <div className="flex items-center">
                {doc.status ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
          ))}
        </div>
        
        {!documentsStatus.validated && (
          <div className="pt-2 border-t border-gray-600">
            <div className="text-xs text-yellow-400 font-medium">
              ⚠️ Validação Pendente
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Aguardando análise da equipe de compliance
            </div>
          </div>
        )}
      </div>
    );
  };

  // Opções para filtros - incluir todas as empresas de todos os usuários
  const allCompanyNames = users.flatMap(u => u.allCompanies.map(c => c.name));
  const companyOptions = [
    { value: '', label: 'Todas as Empresas' },
    ...Array.from(new Set(allCompanyNames)).map(company => ({
      value: company,
      label: company
    }))
  ];

  const roleOptions = [
    { value: '', label: 'Todos os Roles' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'APP_ADMIN', label: 'Admin da Empresa' },
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'USER', label: 'Usuário' }
  ];

  const statusOptions = [
    { value: '', label: 'Todos os Status' },
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
    { value: 'blocked', label: 'Bloqueado' }
  ];

  const lastLoginOptions = [
    { value: '', label: 'Qualquer período' },
    { value: '1', label: 'Último dia' },
    { value: '7', label: 'Últimos 7 dias' },
    { value: '30', label: 'Últimos 30 dias' },
    { value: '90', label: 'Últimos 90 dias' }
  ];

  const countryOptions = [
    { value: '', label: 'Todos os países' },
    { value: 'Brasil', label: 'Brasil' },
    { value: 'Estados Unidos', label: 'Estados Unidos' },
    { value: 'Argentina', label: 'Argentina' }
  ];

  const itemsPerPageOptions = [
    { value: 10, label: "10 por página" },
    { value: 20, label: "20 por página" },
    { value: 50, label: "50 por página" },
    { value: 100, label: "100 por página" }
  ];

  // Estilos para react-select
  const selectStyles = {
    option: (provided, state) => ({
      ...provided,
      fontSize: "14px",
    }),
    control: (provided) => ({
      ...provided,
      minHeight: "38px",
      fontSize: "14px",
    }),
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const goToPage = (page) => setCurrentPage(page);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);

  const handleItemsPerPageChange = (option) => {
    setItemsPerPage(option.value);
    setCurrentPage(1);
  };

  const DropdownMenu = ({ user }) => {
    const isBlocked = user.status === 'blocked';
    const isActive = user.status === 'active';
    
    return (
      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
        <div className="py-1">
          <button
            onClick={() => handleUserAction('viewProfile', user)}
            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
          >
            <Eye size={14} className="mr-2" />
            Ver Perfil
          </button>
          
          {permissions.canManageRoles && (
            <>
              <div className="border-t border-gray-100 dark:border-gray-600"></div>
              
              {isBlocked ? (
                <button
                  onClick={() => handleUserAction('unblock', user)}
                  className="flex items-center px-4 py-2 text-sm text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                >
                  <Unlock size={14} className="mr-2" />
                  Desbloquear
                </button>
              ) : (
                <button
                  onClick={() => handleUserAction('block', user)}
                  className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                >
                  <Lock size={14} className="mr-2" />
                  Bloquear
                </button>
              )}
              
              {!isBlocked && (
                <>
                  {isActive ? (
                    <button
                      onClick={() => handleUserAction('deactivate', user)}
                      className="flex items-center px-4 py-2 text-sm text-orange-600 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      <UserX size={14} className="mr-2" />
                      Desativar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUserAction('activate', user)}
                      className="flex items-center px-4 py-2 text-sm text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      <UserCheck size={14} className="mr-2" />
                      Ativar
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  if (!permissions.canViewSystemSettings) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Gestão de Usuários do Sistema
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Gerencie todos os usuários do sistema, independente da empresa
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={exportUsers}
            variant="outline"
            className="btn-outline-brand"
          >
            <Download size={16} className="mr-2" />
            Exportar CSV
          </Button>
          <Button
            onClick={loadUsers}
            variant="outline"
            isLoading={loading}
          >
            <RefreshCw size={16} className="mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="text-blue-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="text-green-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Ativos</p>
                <p className="text-xl font-bold">{stats.active}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <UserX className="text-gray-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Inativos</p>
                <p className="text-xl font-bold">{stats.inactive}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ShieldCheck className="text-red-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Super Admins</p>
                <p className="text-xl font-bold">{stats.superAdmins}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="text-purple-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Empresas</p>
                <p className="text-xl font-bold">{stats.companies}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Buscar
            </label>
            <div className="relative">
              <Textinput
                placeholder="Nome, email, CPF..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <Search size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Empresa
            </label>
            <Select
              className="react-select"
              classNamePrefix="select"
              options={companyOptions}
              value={companyOptions.find(option => option.value === filters.company)}
              onChange={(option) => handleFilterChange('company', option?.value || '')}
              placeholder="Empresa"
              styles={selectStyles}
              isClearable
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Role
            </label>
            <Select
              className="react-select"
              classNamePrefix="select"
              options={roleOptions}
              value={roleOptions.find(option => option.value === filters.role)}
              onChange={(option) => handleFilterChange('role', option?.value || '')}
              placeholder="Role"
              styles={selectStyles}
              isClearable
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Status
            </label>
            <Select
              className="react-select"
              classNamePrefix="select"
              options={statusOptions}
              value={statusOptions.find(option => option.value === filters.status)}
              onChange={(option) => handleFilterChange('status', option?.value || '')}
              placeholder="Status"
              styles={selectStyles}
              isClearable
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Último Login
            </label>
            <Select
              className="react-select"
              classNamePrefix="select"
              options={lastLoginOptions}
              value={lastLoginOptions.find(option => option.value === filters.lastLoginDays)}
              onChange={(option) => handleFilterChange('lastLoginDays', option?.value || '')}
              placeholder="Período"
              styles={selectStyles}
              isClearable
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={clearFilters}
              variant="outline"
              className="btn-outline-secondary flex-1"
            >
              Limpar
            </Button>
          </div>
        </div>

        {/* Resumo dos filtros */}
        {(filters.search || filters.company || filters.role || filters.status || filters.lastLoginDays) && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Filtros ativos:</span>
              {filters.search && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-300">
                  Busca: {filters.search}
                </span>
              )}
              {filters.company && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-300">
                  Empresa: {filters.company}
                </span>
              )}
              {filters.role && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-300">
                  Role: {roleOptions.find(o => o.value === filters.role)?.label}
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-300">
                  Status: {statusOptions.find(o => o.value === filters.status)?.label}
                </span>
              )}
              {filters.lastLoginDays && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-300">
                  Login: {lastLoginOptions.find(o => o.value === filters.lastLoginDays)?.label}
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Lista de Usuários */}
      <Card>
        <div className="space-y-4">
          {/* Cabeçalho da tabela com contador */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Usuários ({loading ? '...' : filteredUsers.length})
            </h3>
            <div className="flex items-center space-x-2">
              <Select
                className="react-select"
                classNamePrefix="select"
                options={itemsPerPageOptions}
                value={itemsPerPageOptions.find(option => option.value === itemsPerPage)}
                onChange={handleItemsPerPageChange}
                styles={selectStyles}
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="ml-2 text-slate-600 dark:text-slate-400">Carregando usuários...</span>
            </div>
          )}

          {/* Tabela responsiva */}
          {!loading && (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Atividade
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Documentos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user) => {
                      const daysSinceLogin = getDaysSinceLastLogin(user.lastLogin);
                      
                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
                        >
                          {/* Usuário */}
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="flex-none">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                  {user.avatar ? (
                                    <img
                                      src={user.avatar}
                                      alt={user.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <span className="text-white font-bold text-sm">
                                    {user.name.charAt(0)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-slate-900 dark:text-white">
                                  {user.name}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {user.email}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {user.phone}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          {/* Empresa */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {user.allCompanies.length > 1 ? (
                              <Tooltip
                                content={generateCompaniesTooltip(user.allCompanies)}
                                placement="top"
                                theme="dark"
                                allowHTML={true}
                                interactive={true}
                                maxWidth={320}
                                animation="shift-away"
                              >
                                <div className="flex items-center space-x-2 cursor-help">
                                  <Building className="w-4 h-4 text-slate-500" />
                                  <div>
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                      {user.company.name}
                                      <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded">
                                        +{user.allCompanies.length - 1}
                                      </span>
                                    </div>
                                    <div className="text-xs text-blue-600 dark:text-blue-400">
                                      {user.allCompanies.length} empresas
                                    </div>
                                  </div>
                                </div>
                              </Tooltip>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Building className="w-4 h-4 text-slate-500" />
                                <div>
                                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                                    {user.company.name}
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                          
                          {/* Role */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getRoleIcon(user.role)}
                              <Badge
                                label={getRoleLabel(user.role)}
                                className={`${getRoleBadgeColor(user.role)} text-white`}
                              />
                            </div>
                          </td>
                          
                          {/* Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(user.status)}
                              <Badge
                                label={getStatusLabel(user.status)}
                                className={`${getStatusBadgeColor(user.status)} text-white`}
                              />
                            </div>
                          </td>
                          
                          {/* Atividade */}
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="space-y-1">
                              <div className="text-slate-900 dark:text-white">
                                {user.loginCount.toLocaleString()} logins
                              </div>
                              <div className="text-slate-500 dark:text-slate-400">
                                {user.transactions.toLocaleString()} transações
                              </div>
                              {daysSinceLogin !== null && (
                                <div className={`text-xs ${
                                  daysSinceLogin <= 1 ? 'text-green-600' :
                                  daysSinceLogin <= 7 ? 'text-yellow-600' :
                                  daysSinceLogin <= 30 ? 'text-orange-600' : 'text-red-600'
                                }`}>
                                  {daysSinceLogin === 0 ? 'Hoje' : `${daysSinceLogin} dias atrás`}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          {/* Documentos */}
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <Tooltip
                              content={generateDocumentsTooltip(user.documentsStatus)}
                              placement="top"
                              theme="dark"
                              allowHTML={true}
                              interactive={true}
                              maxWidth={280}
                              animation="shift-away"
                            >
                              <div className="space-y-1 cursor-help">
                                {user.documentsStatus.validated ? (
                                  <div className="flex items-center space-x-1 text-green-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-xs font-medium">Validado</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1 text-orange-600">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-xs font-medium">Pendente</span>
                                  </div>
                                )}
                                <div className="flex space-x-1">
                                  {user.documentsStatus.front ? (
                                    <div className="flex items-center text-green-600" title="Frente do Documento">
                                      <FileCheck className="w-3 h-3" />
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-gray-400" title="Frente do Documento">
                                      <FileX className="w-3 h-3" />
                                    </div>
                                  )}
                                  {user.documentsStatus.back ? (
                                    <div className="flex items-center text-green-600" title="Verso do Documento">
                                      <FileCheck className="w-3 h-3" />
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-gray-400" title="Verso do Documento">
                                      <FileX className="w-3 h-3" />
                                    </div>
                                  )}
                                  {user.documentsStatus.selfie ? (
                                    <div className="flex items-center text-green-600" title="Selfie com Documento">
                                      <FileCheck className="w-3 h-3" />
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-gray-400" title="Selfie com Documento">
                                      <FileX className="w-3 h-3" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Tooltip>
                          </td>
                          
                          {/* Ações */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="relative" ref={openDropdown === user.id ? dropdownRef : null}>
                              <button
                                onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <MoreVertical size={16} className="text-gray-500" />
                              </button>
                              
                              {openDropdown === user.id && (
                                <DropdownMenu user={user} />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center">
                          <User className="w-12 h-12 mb-2 opacity-50" />
                          <span className="font-medium">Nenhum usuário encontrado</span>
                          <span className="text-sm">Tente ajustar os filtros para ver mais resultados</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredUsers.length > itemsPerPage && (
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                <div className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left">
                  Exibindo {((currentPage - 1) * itemsPerPage) + 1} ao {Math.min(currentPage * itemsPerPage, filteredUsers.length)} de {filteredUsers.length} registros
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <button
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    «
                  </button>
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        currentPage === page
                          ? "bg-primary-500 text-white"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                  <button
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Perfil Completo do Usuário */}
      <UserProfileModal
        show={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={selectedUser}
        onUserUpdate={(updatedUser) => {
          setUsers(users.map(user => 
            user.id === updatedUser.id ? updatedUser : user
          ));
        }}
        canEdit={permissions.canManageRoles}
        canViewSensitive={permissions.canViewSensitiveData}
      />
    </div>
  );
};

export default SystemUsersPage;