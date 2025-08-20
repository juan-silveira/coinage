"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Settings,
  Mail,
  Calendar,
  Globe,
  Shield,
  Activity,
  DollarSign,
  BarChart3,
  Key,
  Webhook,
  UserCheck,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { useAlertContext } from '@/contexts/AlertContext';

const CompanyDetailsModal = ({ isOpen, onClose, company }) => {
  const { showSuccess, showError, showInfo, showWarning } = useAlertContext();
  const [activeTab, setActiveTab] = useState("overview");

  if (!company) return null;

  const tabs = [
    { id: "overview", label: "Visão Geral", icon: Building2 },
    { id: "users", label: "Usuários", icon: Users },
    { id: "transactions", label: "Transações", icon: TrendingUp },
    { id: "settings", label: "Configurações", icon: Settings },
    { id: "activity", label: "Atividade", icon: Activity }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: "Ativa", className: "bg-success-500" },
      inactive: { label: "Inativa", className: "bg-secondary-500" },
      suspended: { label: "Suspensa", className: "bg-danger-500" }
    };
    const config = statusConfig[status] || { label: status, className: "bg-secondary-500" };
    return <Badge label={config.label} className={config.className} />;
  };

  const getPlanBadge = (plan) => {
    const planConfig = {
      starter: { label: "Starter", className: "bg-info-500" },
      professional: { label: "Professional", className: "bg-primary-500" },
      enterprise: { label: "Enterprise", className: "bg-warning-500" },
      custom: { label: "Personalizado", className: "bg-purple-500" }
    };
    const config = planConfig[plan] || { label: plan, className: "bg-secondary-500" };
    return <Badge label={config.label} className={config.className} />;
  };

  const handleAction = (action) => {
    switch (action) {
      case 'editCompany':
        showInfo("Modal de edição de empresa em desenvolvimento");
        break;
      case 'deleteCompany':
        if (window.confirm(`Tem certeza que deseja deletar a empresa ${company.name}?`)) {
          showError(`Empresa ${company.name} deletada`);
          onClose();
        }
        break;
      case 'manageUsers':
        showInfo("Gestão de usuários da empresa em desenvolvimento");
        break;
      default:
        break;
    }
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Informações da Empresa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <Building2 className="h-5 w-5 text-slate-400 mr-3" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Nome</p>
                <p className="font-medium text-slate-900 dark:text-white">{company.name}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Key className="h-5 w-5 text-slate-400 mr-3" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Alias</p>
                <p className="font-medium text-slate-900 dark:text-white">{company.alias}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-slate-400 mr-3" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
                <p className="font-medium text-slate-900 dark:text-white">{company.email}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <Globe className="h-5 w-5 text-slate-400 mr-3" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">País</p>
                <p className="font-medium text-slate-900 dark:text-white">{company.country}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-slate-400 mr-3" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Criada em</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {new Date(company.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-slate-400 mr-3" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Última Atividade</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {new Date(company.lastActivity).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-6">
          <div className="flex items-center">
            <span className="text-sm text-slate-600 dark:text-slate-400 mr-2">Status:</span>
            {getStatusBadge(company.status)}
          </div>
          <div className="flex items-center">
            <span className="text-sm text-slate-600 dark:text-slate-400 mr-2">Plano:</span>
            {getPlanBadge(company.plan)}
          </div>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-info-100 dark:bg-info-500/20">
              <Users className="h-6 w-6 text-info-600 dark:text-info-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total de Usuários
              </p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {company.userCount.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-success-100 dark:bg-success-500/20">
              <BarChart3 className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total de Transações
              </p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {company.transactionCount.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-warning-100 dark:bg-warning-500/20">
              <DollarSign className="h-6 w-6 text-warning-600 dark:text-warning-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Receita Mensal
              </p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                R$ {company.monthlyRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const UsersTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Gestão de Usuários
          </h3>
          <Button
            text="Gerenciar Usuários"
            className="btn-primary btn-sm"
            onClick={() => handleAction('manageUsers')}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-2xl font-bold text-info-500">{company.userCount}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Total de Usuários</div>
          </div>
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-2xl font-bold text-success-500">{Math.floor(company.userCount * 0.8)}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Usuários Ativos</div>
          </div>
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-2xl font-bold text-warning-500">{Math.floor(company.userCount * 0.1)}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Administradores</div>
          </div>
        </div>
      </Card>
    </div>
  );

  const TransactionsTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          Resumo de Transações
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Total de Transações:</span>
              <span className="font-semibold">{company.transactionCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Volume Total:</span>
              <span className="font-semibold">R$ {(company.transactionCount * 150).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Transações Hoje:</span>
              <span className="font-semibold">{Math.floor(company.transactionCount * 0.01).toLocaleString()}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Taxa de Sucesso:</span>
              <span className="font-semibold text-success-500">98.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Ticket Médio:</span>
              <span className="font-semibold">R$ 150</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Receita Mensal:</span>
              <span className="font-semibold text-primary-500">R$ {company.monthlyRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const SettingsTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          Configurações da Empresa
        </h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <Key className="h-5 w-5 text-slate-400 mr-3" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">API Habilitada</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Permite acesso via API</p>
              </div>
            </div>
            <Badge 
              label={company.settings.apiEnabled ? "Ativada" : "Desativada"} 
              className={company.settings.apiEnabled ? "bg-success-500" : "bg-secondary-500"} 
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <Webhook className="h-5 w-5 text-slate-400 mr-3" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Webhooks</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Notificações automáticas</p>
              </div>
            </div>
            <Badge 
              label={company.settings.webhooksEnabled ? "Ativado" : "Desativado"} 
              className={company.settings.webhooksEnabled ? "bg-success-500" : "bg-secondary-500"} 
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-slate-400 mr-3" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">2FA Obrigatório</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Autenticação de dois fatores</p>
              </div>
            </div>
            <Badge 
              label={company.settings.twoFactorRequired ? "Obrigatório" : "Opcional"} 
              className={company.settings.twoFactorRequired ? "bg-warning-500" : "bg-info-500"} 
            />
          </div>
        </div>
      </Card>
    </div>
  );

  const ActivityTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          Atividades Recentes
        </h3>
        
        <div className="space-y-4">
          {[
            { action: "Login de usuário", time: "Há 2 minutos", user: "admin@navitecnologia.com.br" },
            { action: "Nova transação processada", time: "Há 5 minutos", user: "Sistema" },
            { action: "Configuração alterada", time: "Há 1 hora", user: "admin@navitecnologia.com.br" },
            { action: "Novo usuário cadastrado", time: "Há 2 horas", user: "user@navitecnologia.com.br" },
            { action: "Saque processado", time: "Há 3 horas", user: "Sistema" }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{activity.action}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{activity.user}</p>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {activity.time}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "users":
        return <UsersTab />;
      case "transactions":
        return <TransactionsTab />;
      case "settings":
        return <SettingsTab />;
      case "activity":
        return <ActivityTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes da Empresa - ${company.name}`} size="4xl">
      <div className="p-6">
        {/* Header com ações */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {getStatusBadge(company.status)}
              {getPlanBadge(company.plan)}
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              icon={Eye}
              text="Ver Site"
              className="btn-secondary btn-sm"
              onClick={() => window.open(`https://${company.alias}.example.com`, '_blank')}
            />
            <Button
              icon={Edit}
              text="Editar"
              className="btn-primary btn-sm"
              onClick={() => handleAction('editCompany')}
            />
            <Button
              icon={Trash2}
              text="Deletar"
              className="btn-danger btn-sm"
              onClick={() => handleAction('deleteCompany')}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </Modal>
  );
};

export default CompanyDetailsModal;