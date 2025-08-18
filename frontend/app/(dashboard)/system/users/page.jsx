"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import usePermissions from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";

const SystemUsersPage = () => {
  const router = useRouter();
  const permissions = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    if (!permissions.canViewSystemSettings) {
      router.push("/dashboard");
      return;
    }
    
    loadAllUsers();
  }, [permissions, router]);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to get all users across all companies
      const mockUsers = [
        {
          id: 1,
          name: "Ivan Alberton",
          email: "ivan.alberton@navi.inf.br",
          cpf: "02308739959",
          phone: "46999716711",
          roles: ["SUPER_ADMIN", "ADMIN"],
          companies: ["Navi", "Coinage"],
          isActive: true,
          lastLogin: new Date().toISOString(),
          publicKey: "0x5528C065931f523CA9F3a6e49a911896fb1D2e6f",
          privateKey: permissions.canViewSensitiveData ? "0x2a09b1aaa664113fd7163a0a4aafbcb16f6b5a16ae9dacfe7c840be2455e3f61" : "***REDACTED***"
        },
        {
          id: 2,
          name: "Usuário Teste 1",
          email: "user1@coinage.com",
          cpf: "12345678901",
          phone: "11999999999",
          roles: ["USER"],
          companies: ["Coinage"],
          isActive: true,
          lastLogin: new Date().toISOString(),
          publicKey: "0x1234567890123456789012345678901234567890",
          privateKey: permissions.canViewSensitiveData ? "0x1234567890123456789012345678901234567890123456789012345678901234" : "***REDACTED***"
        }
      ];
      
      setAllUsers(mockUsers);
      setUsers(mockUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = () => {
    if (!searchTerm.trim()) {
      setUsers(allUsers);
      return;
    }
    
    const filtered = allUsers.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cpf.includes(searchTerm) ||
      user.companies.some(company => 
        company.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    
    setUsers(filtered);
  };

  const promoteUser = async (userId, newRole) => {
    if (!permissions.canManageRoles) {
      alert("Você não tem permissão para alterar roles de usuário");
      return;
    }
    
    try {
      // TODO: Implement API call to promote user
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, roles: [...user.roles, newRole] } 
          : user
      ));
      setAllUsers(allUsers.map(user => 
        user.id === userId 
          ? { ...user, roles: [...user.roles, newRole] } 
          : user
      ));
      alert("Usuário promovido com sucesso!");
    } catch (error) {
      console.error("Error promoting user:", error);
      alert("Erro ao promover usuário");
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      // TODO: Implement API call to toggle user status
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, isActive: !user.isActive } 
          : user
      ));
      setAllUsers(allUsers.map(user => 
        user.id === userId 
          ? { ...user, isActive: !user.isActive } 
          : user
      ));
      alert("Status do usuário alterado com sucesso!");
    } catch (error) {
      console.error("Error toggling user status:", error);
      alert("Erro ao alterar status do usuário");
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "danger";
      case "APP_ADMIN":
        return "warning";
      case "ADMIN":
        return "info";
      default:
        return "secondary";
    }
  };

  if (!permissions.canViewSystemSettings) {
    return null;
  }

  return (
    <div className="space-y-5">
      <Card title="Gestão de Usuários do Sistema">
        <div className="mb-6">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Gerencie todos os usuários do sistema, independente da empresa.
          </p>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <Textinput
                label="Buscar usuário"
                type="text"
                placeholder="Digite nome, email, CPF ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              />
            </div>
            <div className="flex items-end">
              <Button
                text="Buscar"
                icon="heroicons-outline:search"
                className="btn-primary"
                onClick={searchUsers}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                Usuários ({users.length})
              </h3>
              
              <div className="flex gap-2">
                <Badge
                  label={`Total: ${allUsers.length}`}
                  className="bg-info-500"
                />
                <Badge
                  label={`Ativos: ${allUsers.filter(u => u.isActive).length}`}
                  className="bg-success-500"
                />
                <Badge
                  label={`Inativos: ${allUsers.filter(u => !u.isActive).length}`}
                  className="bg-secondary-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {users.map((user) => (
                <div key={user.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-medium text-slate-900 dark:text-white">
                          {user.name}
                        </h4>
                        {user.roles.map(role => (
                          <Badge
                            key={role}
                            label={role}
                            className={`bg-${getRoleBadgeColor(role)}-500`}
                          />
                        ))}
                        {user.isActive ? (
                          <Badge label="Ativo" className="bg-success-500" />
                        ) : (
                          <Badge label="Inativo" className="bg-secondary-500" />
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><span className="font-medium">Email:</span> {user.email}</p>
                          <p><span className="font-medium">CPF:</span> {user.cpf}</p>
                          <p><span className="font-medium">Telefone:</span> {user.phone}</p>
                          <p><span className="font-medium">Empresas:</span> {user.companies.join(", ")}</p>
                          <p><span className="font-medium">Último Login:</span> {new Date(user.lastLogin).toLocaleString()}</p>
                        </div>
                        <div>
                          <p><span className="font-medium">Chave Pública:</span></p>
                          <code className="text-xs bg-slate-100 dark:bg-slate-800 p-1 rounded break-all">
                            {user.publicKey}
                          </code>
                          {permissions.canViewSensitiveData && (
                            <>
                              <p className="mt-2"><span className="font-medium text-red-600">Chave Privada:</span></p>
                              <code className="text-xs bg-red-50 dark:bg-red-900/20 p-1 rounded break-all text-red-600">
                                {user.privateKey}
                              </code>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <div className="flex flex-col gap-2">
                        <Button
                          text={user.isActive ? "Desativar" : "Ativar"}
                          className={`btn-sm ${user.isActive ? "btn-warning" : "btn-success"}`}
                          onClick={() => toggleUserStatus(user.id)}
                        />
                        
                        {permissions.canManageRoles && !user.roles.includes("SUPER_ADMIN") && (
                          <>
                            {!user.roles.includes("APP_ADMIN") && (
                              <Button
                                text="→ APP_ADMIN"
                                className="btn-sm btn-warning"
                                onClick={() => promoteUser(user.id, "APP_ADMIN")}
                              />
                            )}
                            {permissions.canViewSensitiveData && (
                              <Button
                                text="→ SUPER_ADMIN"
                                className="btn-sm btn-danger"
                                onClick={() => promoteUser(user.id, "SUPER_ADMIN")}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SystemUsersPage;