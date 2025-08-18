"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import ColorPicker from "@/components/ui/ColorPicker";
import usePermissions from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";

const WhitelabelManagementPage = () => {
  const router = useRouter();
  const permissions = usePermissions();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [brandingData, setBrandingData] = useState({
    primaryColor: "#10B981",
    secondaryColor: "#059669",
    accentColor: "#34D399",
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    logoUrl: "/assets/images/companies/coinage.png",
    logoUrlDark: "/assets/images/companies/coinage.png",
    faviconUrl: "/assets/images/companies/coinage-favicon.ico",
    loginTitle: "Bem-vindo à Coinage",
    loginSubtitle: "Plataforma líder em criptomoedas",
    welcomeMessage: "Bem-vindo à Coinage! A plataforma mais confiável para suas operações com criptomoedas.",
    footerText: "© 2025 Coinage. Todos os direitos reservados.",
    supportUrl: "https://support.coinage.com",
    privacyPolicyUrl: "https://coinage.com/privacy",
    termsOfServiceUrl: "https://coinage.com/terms",
    contactEmail: "support@coinage.com"
  });

  useEffect(() => {
    if (!permissions.canViewCompanySettings) {
      router.push("/dashboard");
      return;
    }
    
    loadBrandingData();
  }, [permissions, router]);

  const loadBrandingData = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to get company branding
      // For now, using mock data
    } catch (error) {
      console.error("Error loading branding data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setBrandingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: Implement API call to save branding data
      console.log("Saving branding data:", brandingData);
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving branding data:", error);
      alert("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (!permissions.canViewCompanySettings) {
    return null;
  }

  return (
    <div className="space-y-5">
      <Card title="Gestão do Whitelabel">
        <div className="mb-6">
          <p className="text-slate-600 dark:text-slate-400">
            Configure a identidade visual e textos da sua empresa na plataforma.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Cores */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                Paleta de Cores
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Cor Primária
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandingData.primaryColor}
                      onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                      className="w-12 h-10 rounded border border-slate-300 dark:border-slate-600"
                    />
                    <Textinput
                      type="text"
                      value={brandingData.primaryColor}
                      onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Cor Secundária
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandingData.secondaryColor}
                      onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                      className="w-12 h-10 rounded border border-slate-300 dark:border-slate-600"
                    />
                    <Textinput
                      type="text"
                      value={brandingData.secondaryColor}
                      onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Cor de Destaque
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandingData.accentColor}
                      onChange={(e) => handleInputChange("accentColor", e.target.value)}
                      className="w-12 h-10 rounded border border-slate-300 dark:border-slate-600"
                    />
                    <Textinput
                      type="text"
                      value={brandingData.accentColor}
                      onChange={(e) => handleInputChange("accentColor", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Textos e Mensagens */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                Textos e Mensagens
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textinput
                  label="Título de Login"
                  type="text"
                  value={brandingData.loginTitle}
                  onChange={(e) => handleInputChange("loginTitle", e.target.value)}
                />
                
                <Textinput
                  label="Subtítulo de Login"
                  type="text"
                  value={brandingData.loginSubtitle}
                  onChange={(e) => handleInputChange("loginSubtitle", e.target.value)}
                />
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Mensagem de Boas-vindas
                  </label>
                  <textarea
                    value={brandingData.welcomeMessage}
                    onChange={(e) => handleInputChange("welcomeMessage", e.target.value)}
                    rows={3}
                    className="form-control w-full"
                  />
                </div>
                
                <Textinput
                  label="Texto do Rodapé"
                  type="text"
                  value={brandingData.footerText}
                  onChange={(e) => handleInputChange("footerText", e.target.value)}
                />
              </div>
            </div>

            {/* URLs e Links */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                URLs e Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textinput
                  label="URL de Suporte"
                  type="url"
                  value={brandingData.supportUrl}
                  onChange={(e) => handleInputChange("supportUrl", e.target.value)}
                />
                
                <Textinput
                  label="Política de Privacidade"
                  type="url"
                  value={brandingData.privacyPolicyUrl}
                  onChange={(e) => handleInputChange("privacyPolicyUrl", e.target.value)}
                />
                
                <Textinput
                  label="Termos de Serviço"
                  type="url"
                  value={brandingData.termsOfServiceUrl}
                  onChange={(e) => handleInputChange("termsOfServiceUrl", e.target.value)}
                />
                
                <Textinput
                  label="Email de Contato"
                  type="email"
                  value={brandingData.contactEmail}
                  onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                />
              </div>
            </div>

            {/* Assets */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                Logos e Ícones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Textinput
                  label="URL do Logo (Claro)"
                  type="text"
                  value={brandingData.logoUrl}
                  onChange={(e) => handleInputChange("logoUrl", e.target.value)}
                />
                
                <Textinput
                  label="URL do Logo (Escuro)"
                  type="text"
                  value={brandingData.logoUrlDark}
                  onChange={(e) => handleInputChange("logoUrlDark", e.target.value)}
                />
                
                <Textinput
                  label="URL do Favicon"
                  type="text"
                  value={brandingData.faviconUrl}
                  onChange={(e) => handleInputChange("faviconUrl", e.target.value)}
                />
              </div>
            </div>

            {/* Preview */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                Prévia
              </h3>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div 
                  className="text-center p-8 rounded-lg"
                  style={{ 
                    backgroundColor: brandingData.backgroundColor,
                    color: brandingData.textColor,
                    borderColor: brandingData.primaryColor
                  }}
                >
                  <h2 
                    className="text-2xl font-bold mb-2"
                    style={{ color: brandingData.primaryColor }}
                  >
                    {brandingData.loginTitle}
                  </h2>
                  <p 
                    className="mb-4"
                    style={{ color: brandingData.secondaryColor }}
                  >
                    {brandingData.loginSubtitle}
                  </p>
                  <div 
                    className="inline-block px-4 py-2 rounded text-white"
                    style={{ backgroundColor: brandingData.primaryColor }}
                  >
                    Botão de Exemplo
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button
                text="Cancelar"
                className="btn-secondary"
                onClick={() => loadBrandingData()}
              />
              <Button
                text="Salvar Alterações"
                className="btn-primary"
                onClick={handleSave}
                isLoading={saving}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default WhitelabelManagementPage;