import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { useAlertContext } from '@/contexts/AlertContext';
import UserPlanService from '@/services/userPlanService';
import useAuthStore from '@/store/authStore';

const UserPlanManager = () => {
  const [plans, setPlans] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('BASIC');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  const { user } = useAuthStore();
  const { showSuccess, showError } = useAlertContext();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar planos disponíveis
      const plansResponse = await UserPlanService.getAvailablePlans();
      setPlans(plansResponse.data);

      // Carregar estatísticas (se for admin)
      if (user?.globalRole === 'ADMIN' || user?.globalRole === 'SUPER_ADMIN') {
        const statsResponse = await UserPlanService.getPlanStatistics();
        setStatistics(statsResponse.data);
      }

      // TODO: Carregar lista de usuários para seleção
      // setUsers(usersResponse.data);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados dos planos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserPlan = async () => {
    if (!selectedUser || !selectedPlan) {
      showError('Selecione um usuário e um plano');
      return;
    }

    try {
      setUpdating(true);
      const response = await UserPlanService.updateUserPlan(selectedUser, selectedPlan);
      
      if (response.success) {
        showSuccess(response.message, 'Plano atualizado');
        setSelectedUser('');
        setSelectedPlan('BASIC');
        loadData(); // Recarregar estatísticas
      } else {
        showError(response.error || 'Erro ao atualizar plano');
      }
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      showError('Erro ao atualizar plano do usuário');
    } finally {
      setUpdating(false);
    }
  };

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'PREMIUM': return 'success';
      case 'PRO': return 'warning';
      case 'BASIC':
      default: return 'info';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-500">Carregando planos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" className="mb-6">
        <div className="flex items-center">
          <span className="text-red-600 font-medium">Erro:</span>
          <span className="ml-2 text-red-600">{error}</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadData}
          className="mt-2"
        >
          Tentar novamente
        </Button>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          Gerenciador de Planos de Usuário
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Controle os intervalos de auto-sync baseados no plano de cada usuário
        </p>
      </div>

      {/* Estatísticas */}
      {statistics && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
              Estatísticas dos Planos
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {statistics.totalUsers}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Total de Usuários
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {statistics.summary.basic}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Plano Básico
                </div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {statistics.summary.pro}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                  Plano Pro
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {statistics.summary.premium}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  Plano Premium
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Planos Disponíveis */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            Planos Disponíveis
          </h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                  plan.id === 'PREMIUM' 
                    ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                    : plan.id === 'PRO'
                    ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800'
                    : 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                }`}
              >
                <div className="text-center mb-4">
                  <Badge variant={getPlanColor(plan.id)} className="mb-2">
                    {plan.name}
                  </Badge>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {plan.description}
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-center">
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    {plan.syncInterval} min
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Intervalo de Auto-sync
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Gerenciador de Usuários (Admin) */}
      {(user?.globalRole === 'ADMIN' || user?.globalRole === 'SUPER_ADMIN') && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
              Alterar Plano de Usuário
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Usuário
                </label>
                <Select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full"
                >
                  <option value="">Selecione um usuário</option>
                  {/* TODO: Adicionar opções de usuários */}
                  <option value="user1">Usuário 1</option>
                  <option value="user2">Usuário 2</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Novo Plano
                </label>
                <Select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full"
                >
                  <option value="BASIC">Básico (5 min)</option>
                  <option value="PRO">Profissional (2 min)</option>
                  <option value="PREMIUM">Premium (1 min)</option>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleUpdateUserPlan}
                  disabled={!selectedUser || updating}
                  loading={updating}
                  className="w-full"
                >
                  {updating ? 'Atualizando...' : 'Atualizar Plano'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Informações sobre Auto-sync */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            Como Funciona o Auto-sync
          </h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                🔄 Sistema de Sincronização Automática
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                O sistema atualiza automaticamente os saldos e notificações dos usuários 
                baseado no plano contratado. Usuários com planos superiores recebem 
                atualizações mais frequentes para maior precisão e tempo real.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl mb-2">⏱️</div>
                <div className="font-semibold text-blue-600 dark:text-blue-400">5 minutos</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Plano Básico</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl mb-2">⚡</div>
                <div className="font-semibold text-yellow-600 dark:text-yellow-400">2 minutos</div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Plano Pro</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl mb-2">🚀</div>
                <div className="font-semibold text-green-600 dark:text-green-400">1 minuto</div>
                <div className="text-sm text-green-600 dark:text-green-400">Plano Premium</div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default UserPlanManager;

