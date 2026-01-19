"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Lock,
  Bell,
  Palette,
  Globe,
  Shield,
  Save,
  Eye,
  EyeOff,
  Check,
  MessageCircle,
  Loader2,
  RefreshCw,
  History,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { whatsAppService, type WhatsAppConfig, type ChatLog } from "@/services/whatsapp.service";
import { telegramService, type TelegramConfig, type ChatLog as TelegramChatLog } from "@/services/telegram.service";
import { Send } from "lucide-react";

interface TabProps {
  id: string;
  label: string;
  icon: React.ElementType;
}

const TABS: TabProps[] = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "security", label: "Segurança", icon: Lock },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "appearance", label: "Aparência", icon: Palette },
  { id: "telegram", label: "Telegram IA", icon: Send },
  { id: "whatsapp", label: "WhatsApp IA", icon: MessageCircle },
];

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
      type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
    }`}>
      {type === "success" ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
      <span>{message}</span>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailSales: true,
    emailReports: true,
    emailAlerts: true,
    pushSales: false,
    pushReports: false,
  });

  // Appearance
  const [appearance, setAppearance] = useState({
    theme: "system",
    language: "pt-BR",
  });

  // WhatsApp settings
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsAppConfig>({
    enabled: false,
    phoneNumber: "",
    instanceName: "",
    evolutionApiUrl: "https://evolution.exageradosclub.com",
    evolutionApiKey: "",
    authorizedPhones: "",
  });
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();

  // Telegram settings
  const [telegramSettings, setTelegramSettings] = useState<TelegramConfig>({
    enabled: false,
    botToken: "",
    botUsername: null,
    authorizedUsers: "",
  });
  const [telegramConnectionStatus, setTelegramConnectionStatus] = useState<string | null>(null);
  const [showTelegramHistory, setShowTelegramHistory] = useState(false);
  const [telegramHasToken, setTelegramHasToken] = useState(false);

  // Load saved theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "system";
    setAppearance(prev => ({ ...prev, theme: savedTheme }));
    applyTheme(savedTheme);
  }, []);

  // Apply theme function
  const applyTheme = (theme: string) => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // System preference
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }

    localStorage.setItem("theme", theme);
  };

  // Handle theme change
  const handleThemeChange = (theme: string) => {
    setAppearance({ ...appearance, theme });
    applyTheme(theme);
    setToast({ message: "Tema aplicado com sucesso!", type: "success" });
  };

  // Fetch WhatsApp config
  const { data: whatsappConfig, isLoading: loadingConfig } = useQuery({
    queryKey: ["whatsapp-config"],
    queryFn: () => whatsAppService.getConfig(),
  });

  // Fetch chat history
  const { data: chatHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ["whatsapp-history"],
    queryFn: () => whatsAppService.getChatHistory(30),
    enabled: showHistory,
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: (config: Partial<WhatsAppConfig>) => whatsAppService.updateConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] });
      setToast({ message: "Configurações do WhatsApp salvas com sucesso!", type: "success" });
    },
    onError: (error: Error) => {
      setToast({ message: `Erro ao salvar: ${error.message}`, type: "error" });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: () => whatsAppService.testConnection(),
    onSuccess: (data) => {
      setConnectionStatus(data.connected ? "connected" : data.state);
      setToast({
        message: data.connected ? "WhatsApp conectado!" : `Status: ${data.state}`,
        type: data.connected ? "success" : "error"
      });
    },
    onError: (error: Error) => {
      setToast({ message: `Erro ao testar conexão: ${error.message}`, type: "error" });
    },
  });

  // Fetch Telegram config
  const { data: telegramConfig, isLoading: loadingTelegramConfig } = useQuery({
    queryKey: ["telegram-config"],
    queryFn: () => telegramService.getConfig(),
  });

  // Fetch Telegram chat history
  const { data: telegramChatHistory, isLoading: loadingTelegramHistory } = useQuery({
    queryKey: ["telegram-history"],
    queryFn: () => telegramService.getChatHistory(30),
    enabled: showTelegramHistory,
  });

  // Update Telegram config mutation
  const updateTelegramConfigMutation = useMutation({
    mutationFn: (config: Partial<TelegramConfig>) => telegramService.updateConfig(config),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["telegram-config"] });
      setToast({ message: "Configurações do Telegram salvas com sucesso!", type: "success" });
      // Update local state with returned data
      if (data.botUsername) {
        setTelegramSettings(prev => ({ ...prev, botUsername: data.botUsername }));
        setTelegramHasToken(true);
      }
    },
    onError: (error: Error) => {
      setToast({ message: `Erro ao salvar: ${error.message}`, type: "error" });
    },
  });

  // Setup Telegram webhook mutation
  const setupTelegramWebhookMutation = useMutation({
    mutationFn: (baseUrl: string) => telegramService.setupWebhook(baseUrl),
    onSuccess: (data) => {
      setToast({ message: "Webhook configurado com sucesso!", type: "success" });
    },
    onError: (error: Error) => {
      setToast({ message: `Erro ao configurar webhook: ${error.message}`, type: "error" });
    },
  });

  // Test Telegram connection mutation
  const testTelegramConnectionMutation = useMutation({
    mutationFn: () => telegramService.testConnection(),
    onSuccess: (data) => {
      setTelegramConnectionStatus(data.connected ? "connected" : "disconnected");
      setToast({
        message: data.connected ? `Bot conectado: @${data.username}` : "Bot desconectado",
        type: data.connected ? "success" : "error"
      });
    },
    onError: (error: Error) => {
      setTelegramConnectionStatus("disconnected");
      setToast({ message: `Erro ao testar conexão: ${error.message}`, type: "error" });
    },
  });

  // Load config into state when fetched
  useEffect(() => {
    if (whatsappConfig) {
      setWhatsappSettings({
        enabled: whatsappConfig.enabled,
        phoneNumber: whatsappConfig.phoneNumber || "",
        instanceName: whatsappConfig.instanceName || "",
        evolutionApiUrl: whatsappConfig.evolutionApiUrl || "https://evolution.exageradosclub.com",
        evolutionApiKey: "",
        authorizedPhones: whatsappConfig.authorizedPhones || "",
      });
    }
  }, [whatsappConfig]);

  // Load Telegram config into state when fetched
  useEffect(() => {
    if (telegramConfig) {
      setTelegramSettings({
        enabled: telegramConfig.enabled,
        botToken: "",
        botUsername: telegramConfig.botUsername || null,
        authorizedUsers: telegramConfig.authorizedUsers || "",
      });
      // Check if there's an existing token (indicated by botUsername presence)
      setTelegramHasToken(!!telegramConfig.botUsername);
    }
  }, [telegramConfig]);

  const handleSave = () => {
    setToast({ message: "Configurações salvas!", type: "success" });
  };

  // Handle Telegram save
  const handleTelegramSave = () => {
    // Validation
    if (telegramSettings.enabled && !telegramHasToken && !telegramSettings.botToken) {
      setToast({ message: "Por favor, insira o token do bot", type: "error" });
      return;
    }

    const configToSave: Partial<TelegramConfig> = {
      enabled: telegramSettings.enabled,
      authorizedUsers: telegramSettings.authorizedUsers,
    };

    if (telegramSettings.botToken) {
      configToSave.botToken = telegramSettings.botToken;
    }

    updateTelegramConfigMutation.mutate(configToSave);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Configurações
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gerencie suas preferências e configurações da conta
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 shrink-0">
          <nav className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Informações do Perfil
              </h2>

              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                    {profileForm.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Foto do Perfil
                    </h3>
                    <p className="text-sm text-gray-500">
                      JPG, GIF ou PNG. Máximo 1MB.
                    </p>
                    <button className="mt-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                      Alterar Foto
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Segurança
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                    Alterar Senha
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Senha Atual
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              currentPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nova Senha
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirmar Nova Senha
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  <Shield className="h-4 w-4" />
                  Atualizar Senha
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Notificações
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                    Notificações por Email
                  </h3>
                  <div className="space-y-4">
                    {[
                      { key: "emailSales", label: "Novas vendas", desc: "Receba um email a cada nova venda" },
                      { key: "emailReports", label: "Relatórios semanais", desc: "Resumo semanal de performance" },
                      { key: "emailAlerts", label: "Alertas importantes", desc: "Problemas de integração e chargebacks" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                          <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.key as keyof typeof notifications]}
                            onChange={(e) =>
                              setNotifications({
                                ...notifications,
                                [item.key]: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  <Save className="h-4 w-4" />
                  Salvar Preferências
                </button>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Aparência
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tema
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: "light", label: "Claro", emoji: "☀️" },
                      { value: "dark", label: "Escuro", emoji: "🌙" },
                      { value: "system", label: "Sistema", emoji: "💻" },
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => handleThemeChange(theme.value)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          appearance.theme === theme.value
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <span className="text-2xl">{theme.emoji}</span>
                        <p className="mt-2 font-medium text-gray-900 dark:text-white">
                          {theme.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Idioma
                  </label>
                  <select
                    value={appearance.language}
                    onChange={(e) =>
                      setAppearance({ ...appearance, language: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Telegram IA Tab */}
          {activeTab === "telegram" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Telegram IA
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Configure a integração com Telegram para consultar dados via IA
              </p>

              {loadingTelegramConfig ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Status Card */}
                  <div className={`p-4 rounded-lg ${telegramSettings.enabled ? "bg-blue-50 dark:bg-blue-900/20" : "bg-gray-50 dark:bg-gray-700"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${telegramConnectionStatus === "connected" ? "bg-emerald-500" : telegramSettings.enabled && telegramHasToken ? "bg-amber-500" : "bg-gray-400"}`}></div>
                        <span className={`font-medium ${telegramConnectionStatus === "connected" ? "text-emerald-700 dark:text-emerald-400" : telegramSettings.enabled ? "text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}>
                          {telegramConnectionStatus === "connected"
                            ? `Conectado (@${telegramSettings.botUsername})`
                            : telegramSettings.enabled && telegramHasToken
                              ? "Configurado - clique em Testar"
                              : telegramSettings.enabled
                                ? "Aguardando token do bot"
                                : "Desativado"}
                        </span>
                      </div>
                      {telegramSettings.enabled && telegramHasToken && (
                        <button
                          onClick={() => testTelegramConnectionMutation.mutate()}
                          disabled={testTelegramConnectionMutation.isPending}
                          className="flex items-center gap-2 px-3 py-1 text-sm bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500"
                        >
                          {testTelegramConnectionMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Testar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Ativar Telegram IA</p>
                      <p className="text-sm text-gray-500">Permitir consultas via Telegram</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={telegramSettings.enabled}
                        onChange={(e) =>
                          setTelegramSettings({
                            ...telegramSettings,
                            enabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {telegramSettings.enabled && (
                    <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Como criar um bot no Telegram:</h4>
                        <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
                          <li>Abra o Telegram e procure por @BotFather</li>
                          <li>Envie o comando /newbot</li>
                          <li>Escolha um nome e um username para o bot</li>
                          <li>Copie o token e cole abaixo</li>
                        </ol>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Token do Bot {telegramHasToken && <span className="text-emerald-500">(Token já configurado)</span>}
                        </label>
                        <input
                          type="password"
                          value={telegramSettings.botToken || ""}
                          onChange={(e) =>
                            setTelegramSettings({
                              ...telegramSettings,
                              botToken: e.target.value,
                            })
                          }
                          placeholder={telegramHasToken ? "Deixe vazio para manter o token atual" : "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        {telegramHasToken && (
                          <p className="mt-1 text-xs text-emerald-600">Token salvo anteriormente. Deixe vazio para manter ou insira um novo para substituir.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          IDs Autorizados (separados por vírgula)
                        </label>
                        <input
                          type="text"
                          value={telegramSettings.authorizedUsers || ""}
                          onChange={(e) =>
                            setTelegramSettings({
                              ...telegramSettings,
                              authorizedUsers: e.target.value,
                            })
                          }
                          placeholder="123456789, 987654321"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <p className="mt-1 text-xs text-gray-500">Deixe vazio para permitir qualquer usuário. Seu ID aparece ao enviar /start para o bot.</p>
                      </div>
                    </div>
                  )}

                  {/* Feature Preview */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <h3 className="text-lg font-semibold mb-3">O que você pode perguntar</h3>
                    <ul className="space-y-2 text-white/90 text-sm">
                      <li>• "Qual meu faturamento de hoje?"</li>
                      <li>• "Quantas vendas aprovadas tive essa semana?"</li>
                      <li>• "Me dê um resumo do mês"</li>
                      <li>• "Qual produto mais vendeu?"</li>
                      <li>• "Compare hoje com ontem"</li>
                      <li>• /start - iniciar o bot</li>
                      <li>• /help - ver todos os comandos</li>
                    </ul>
                  </div>

                  {/* Chat History Toggle */}
                  <button
                    onClick={() => setShowTelegramHistory(!showTelegramHistory)}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <History className="h-4 w-4" />
                    {showTelegramHistory ? "Ocultar histórico" : "Ver histórico de conversas"}
                  </button>

                  {/* Telegram Chat History */}
                  {showTelegramHistory && (
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                        <h4 className="font-medium text-gray-900 dark:text-white">Últimas Conversas</h4>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {loadingTelegramHistory ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : telegramChatHistory && telegramChatHistory.length > 0 ? (
                          <div className="divide-y divide-gray-200 dark:divide-gray-600">
                            {telegramChatHistory.map((chat) => (
                              <div key={chat.id} className="p-4 space-y-2">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>{chat.firstName} {chat.username ? `(@${chat.username})` : ""}</span>
                                  <span>{new Date(chat.createdAt).toLocaleString("pt-BR")}</span>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">Pergunta:</span> {chat.messageIn}
                                  </p>
                                  {chat.messageOut && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                                      <span className="font-medium">Resposta:</span> {chat.messageOut.substring(0, 200)}{chat.messageOut.length > 200 ? "..." : ""}
                                    </p>
                                  )}
                                  {chat.intent && (
                                    <span className="inline-block px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                                      {chat.intent}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="p-4 text-center text-gray-500">Nenhuma conversa registrada</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleTelegramSave}
                      disabled={updateTelegramConfigMutation.isPending}
                      className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      {updateTelegramConfigMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Salvar Configurações
                    </button>

                    {telegramSettings.enabled && telegramHasToken && (
                      <button
                        onClick={() => {
                          setupTelegramWebhookMutation.mutate("https://api-dash.utmia.com.br");
                        }}
                        disabled={setupTelegramWebhookMutation.isPending}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {setupTelegramWebhookMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Globe className="h-4 w-4" />
                        )}
                        Configurar Webhook
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* WhatsApp IA Tab */}
          {activeTab === "whatsapp" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                WhatsApp IA
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Configure a integração com WhatsApp para consultar dados via IA
              </p>

              {loadingConfig ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Status Card */}
                  <div className={`p-4 rounded-lg ${whatsappSettings.enabled ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-amber-50 dark:bg-amber-900/20"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${connectionStatus === "connected" ? "bg-emerald-500" : whatsappSettings.enabled ? "bg-amber-500" : "bg-gray-400"}`}></div>
                        <span className={`font-medium ${connectionStatus === "connected" ? "text-emerald-700 dark:text-emerald-400" : whatsappSettings.enabled ? "text-amber-700 dark:text-amber-400" : "text-gray-600 dark:text-gray-400"}`}>
                          {connectionStatus === "connected" ? "Conectado" : connectionStatus === "not_configured" ? "Não configurado" : connectionStatus || (whatsappSettings.enabled ? "Aguardando verificação" : "Desativado")}
                        </span>
                      </div>
                      {whatsappSettings.enabled && (
                        <button
                          onClick={() => testConnectionMutation.mutate()}
                          disabled={testConnectionMutation.isPending}
                          className="flex items-center gap-2 px-3 py-1 text-sm bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500"
                        >
                          {testConnectionMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Testar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Ativar WhatsApp IA</p>
                      <p className="text-sm text-gray-500">Permitir consultas via WhatsApp</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whatsappSettings.enabled}
                        onChange={(e) =>
                          setWhatsappSettings({
                            ...whatsappSettings,
                            enabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {whatsappSettings.enabled && (
                    <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Número do WhatsApp (conectado)
                        </label>
                        <input
                          type="text"
                          value={whatsappSettings.phoneNumber || ""}
                          onChange={(e) =>
                            setWhatsappSettings({
                              ...whatsappSettings,
                              phoneNumber: e.target.value,
                            })
                          }
                          placeholder="+55 11 99999-9999"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nome da Instância (Evolution API)
                        </label>
                        <input
                          type="text"
                          value={whatsappSettings.instanceName || ""}
                          onChange={(e) =>
                            setWhatsappSettings({
                              ...whatsappSettings,
                              instanceName: e.target.value,
                            })
                          }
                          placeholder="minha-instancia"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          URL da Evolution API
                        </label>
                        <input
                          type="text"
                          value={whatsappSettings.evolutionApiUrl || ""}
                          onChange={(e) =>
                            setWhatsappSettings({
                              ...whatsappSettings,
                              evolutionApiUrl: e.target.value,
                            })
                          }
                          placeholder="https://evolution.exageradosclub.com"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          API Key (Evolution API)
                        </label>
                        <input
                          type="password"
                          value={whatsappSettings.evolutionApiKey || ""}
                          onChange={(e) =>
                            setWhatsappSettings({
                              ...whatsappSettings,
                              evolutionApiKey: e.target.value,
                            })
                          }
                          placeholder="Deixe vazio para manter a atual"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Números Autorizados (separados por vírgula)
                        </label>
                        <input
                          type="text"
                          value={whatsappSettings.authorizedPhones || ""}
                          onChange={(e) =>
                            setWhatsappSettings({
                              ...whatsappSettings,
                              authorizedPhones: e.target.value,
                            })
                          }
                          placeholder="5511999999999, 5521888888888"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <p className="mt-1 text-xs text-gray-500">Deixe vazio para permitir qualquer número</p>
                      </div>
                    </div>
                  )}

                  {/* Feature Preview */}
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <h3 className="text-lg font-semibold mb-3">O que você pode perguntar</h3>
                    <ul className="space-y-2 text-white/90 text-sm">
                      <li>• "Qual meu faturamento de hoje?"</li>
                      <li>• "Quantas vendas aprovadas tive essa semana?"</li>
                      <li>• "Me dê um resumo do mês"</li>
                      <li>• "Qual produto mais vendeu?"</li>
                      <li>• "Compare hoje com ontem"</li>
                      <li>• "ajuda" - ver todos os comandos</li>
                    </ul>
                  </div>

                  {/* Webhook URL */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL do Webhook (configure na Evolution API):
                    </p>
                    <code className="block p-2 bg-white dark:bg-gray-800 rounded text-sm text-gray-800 dark:text-gray-200 break-all">
                      https://dashapi.exageradosclub.com/webhooks/evolution/{whatsappSettings.instanceName || "[nome-da-instancia]"}
                    </code>
                  </div>

                  {/* Chat History Toggle */}
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <History className="h-4 w-4" />
                    {showHistory ? "Ocultar histórico" : "Ver histórico de conversas"}
                  </button>

                  {/* Chat History */}
                  {showHistory && (
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                        <h4 className="font-medium text-gray-900 dark:text-white">Últimas Conversas</h4>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {loadingHistory ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : chatHistory && chatHistory.length > 0 ? (
                          <div className="divide-y divide-gray-200 dark:divide-gray-600">
                            {chatHistory.map((chat) => (
                              <div key={chat.id} className="p-4 space-y-2">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>{chat.phoneNumber}</span>
                                  <span>{new Date(chat.createdAt).toLocaleString("pt-BR")}</span>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">Pergunta:</span> {chat.messageIn}
                                  </p>
                                  {chat.messageOut && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                                      <span className="font-medium">Resposta:</span> {chat.messageOut.substring(0, 200)}{chat.messageOut.length > 200 ? "..." : ""}
                                    </p>
                                  )}
                                  {chat.intent && (
                                    <span className="inline-block px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                                      {chat.intent}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="p-4 text-center text-gray-500">Nenhuma conversa registrada</p>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const configToSave: Partial<WhatsAppConfig> = {
                        enabled: whatsappSettings.enabled,
                        phoneNumber: whatsappSettings.phoneNumber,
                        instanceName: whatsappSettings.instanceName,
                        evolutionApiUrl: whatsappSettings.evolutionApiUrl,
                        authorizedPhones: whatsappSettings.authorizedPhones,
                      };
                      if (whatsappSettings.evolutionApiKey) {
                        configToSave.evolutionApiKey = whatsappSettings.evolutionApiKey;
                      }
                      updateConfigMutation.mutate(configToSave);
                    }}
                    disabled={updateConfigMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {updateConfigMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                    Salvar Configurações
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
