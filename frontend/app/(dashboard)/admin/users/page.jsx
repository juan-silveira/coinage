"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import usePermissions from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";

const UserSearchPage = () => {
  const router = useRouter();
  const permissions = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (!permissions.canViewCompanySettings) {
      router.push("/dashboard");
      return;
    }
  }, [permissions, router]);

  const searchUsers = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      // TODO: Implement API call to search users
      const mockUsers = [
        {
          id: 1,
          name: "Ivan Alberton",
          email: "ivan.alberton@navi.inf.br",
          cpf: "02308739959",
          phone: "46999716711",
          role: "SUPER_ADMIN",
          isActive: true,
          publicKey: "0x5528C065931f523CA9F3a6e49a911896fb1D2e6f",
          privateKey: permissions.canViewSensitiveData ? "0x2a09b1aaa664113fd7163a0a4aafbcb16f6b5a16ae9dacfe7c840be2455e3f61" : "***REDACTED***"
        },
        {
          id: 2,
          name: "Usuário Teste 1",
          email: "user1@coinage.com",
          cpf: "12345678901",
          phone: "11999999999",
          role: "USER",
          isActive: true,
          publicKey: "0x1234567890123456789012345678901234567890",
          privateKey: permissions.canViewSensitiveData ? "0x1234567890123456789012345678901234567890123456789012345678901234" : "***REDACTED***"
        }
      ];
      
      const filtered = mockUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.cpf.includes(searchTerm)
      );
      
      setUsers(filtered);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const promoteUser = async (userId, newRole) => {
    if (!permissions.canManageRoles) {
      alert("Você não tem permissão para alterar roles de usuário");
      return;
    }
    
    try {
      // TODO: Implement API call to promote user
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      alert("Usuário promovido com sucesso!");
    } catch (error) {
      console.error("Error promoting user:", error);
      alert("Erro ao promover usuário");
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

  if (!permissions.canViewCompanySettings) {
    return null;
  }

  return (
    <div className="space-y-5">
      <Card title="Busca por Usuário">
        <div className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Textinput
                label="Buscar usuário"
                type="text"
                placeholder="Digite nome, email ou CPF..."
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
                isLoading={loading}
              />
            </div>
          </div>
        </div>

        {users.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              Resultados da Busca ({users.length})
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {users.map((user) => (
                <div key={user.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-medium text-slate-900 dark:text-white">
                          {user.name}
                        </h4>
                        <Badge
                          label={user.role}
                          className={`bg-${getRoleBadgeColor(user.role)}-500`}
                        />
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
                    
                    {permissions.canManageRoles && user.role !== "SUPER_ADMIN" && (
                      <div className="ml-4">
                        <div className="flex flex-col gap-2">
                          {user.role !== "APP_ADMIN" && (
                            <Button
                              text="Promover para APP_ADMIN"
                              className="btn-sm btn-warning"
                              onClick={() => promoteUser(user.id, "APP_ADMIN")}
                            />
                          )}
                          {user.role === "USER" && (
                            <Button
                              text="Promover para ADMIN"
                              className="btn-sm btn-info"
                              onClick={() => promoteUser(user.id, "ADMIN")}
                            />
                          )}
                          {permissions.canViewSensitiveData && user.role !== "SUPER_ADMIN" && (
                            <Button
                              text="Promover para SUPER_ADMIN"
                              className="btn-sm btn-danger"
                              onClick={() => promoteUser(user.id, "SUPER_ADMIN")}
                            />
                          )}
                        </div>
                      </div>
                    )}
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

export default UserSearchPage;