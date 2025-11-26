"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Credential, CredentialType } from "@/types/credential";
import { Calendar, MessageSquare, Workflow, Key, Eye, EyeOff } from "lucide-react";
import JSONPretty from "react-json-pretty";
import "react-json-pretty/themes/monikai.css";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";

interface CredentialFormProps {
  credential?: Credential | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const credentialTypes: { value: CredentialType; label: string; icon: any }[] = [
  { value: "GOOGLE_CALENDAR", label: "Google Calendar", icon: Calendar },
  { value: "CHATGPT", label: "ChatGPT", icon: MessageSquare },
  { value: "N8N", label: "N8N", icon: Workflow },
  { value: "CUSTOM", label: "Personalizada", icon: Key },
];

const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function CredentialForm({ credential, onSuccess, onCancel }: CredentialFormProps) {
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [viewMode, setViewMode] = useState<'form' | 'json'>('form');
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Garantir que o tema seja aplicado corretamente após o mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determinar o tema do editor (resolve "system" para "light" ou "dark")
  const editorTheme = mounted ? (resolvedTheme === "dark" ? "vs-dark" : "light") : "light";

  // Estado específico para ChatGPT
  const [chatGptData, setChatGptData] = useState({
    apiKey: "",
    organizationId: "",
    url: "https://api.openai.com/v1",
    header: false,
  });

  // Estado específico para Google Calendar
  const [googleCalendarData, setGoogleCalendarData] = useState({
    clientId: "",
    clientSecret: "",
  });

  const [formData, setFormData] = useState({
    name: credential?.name || "",
    type: credential?.type || "CUSTOM" as CredentialType,
    url: credential?.url || "",
    method: credential?.method || "POST",
    authHeaderKey: credential?.authHeaderKey || "X-N8N-API-KEY",
    authHeaderValue: credential?.authHeaderValue || "",
    customHeaders: JSON.stringify(credential?.customHeaders || {}, null, 2),
    awaitResponse: credential?.awaitResponse || false,
    successModel: JSON.stringify(credential?.successModel || {}, null, 2),
    data: JSON.stringify(credential?.data || {}, null, 2),
    isActive: credential?.isActive ?? true,
  });

  // Carregar dados do ChatGPT se for edição
  useEffect(() => {
    if (credential && credential.type === "CHATGPT" && credential.data) {
      try {
        const data = typeof credential.data === 'string'
          ? JSON.parse(credential.data)
          : credential.data;
        setChatGptData({
          apiKey: data.data?.apiKey || "",
          organizationId: data.data?.organizationId || "",
          url: data.data?.url || "https://api.openai.com/v1",
          header: data.data?.header || false,
        });
      } catch (error) {
        console.error("Error parsing ChatGPT data:", error);
      }
    }

    if (credential && credential.type === "GOOGLE_CALENDAR" && credential.data) {
      try {
        const data = typeof credential.data === 'string'
          ? JSON.parse(credential.data)
          : credential.data;
        setGoogleCalendarData({
          clientId: data.clientId || "",
          clientSecret: data.clientSecret || "",
        });
      } catch (error) {
        console.error("Error parsing Google Calendar data:", error);
      }
    }
  }, [credential]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let customHeaders = null;
      let successModel = null;
      let data = null;

      // Determinar URL baseado no tipo
      let finalUrl = formData.url;
      if (formData.type !== "CUSTOM") {
        // Para tipos pré-configurados, a URL será definida pelo backend via variável de ambiente
        finalUrl = ""; // URL vazia será tratada pelo backend
      }

      // Se for ChatGPT, usar formato específico
      if (formData.type === "CHATGPT") {
        // Validar campos obrigatórios
        if (!formData.name.trim()) {
          toast.error("Nome é obrigatório");
          setLoading(false);
          return;
        }

        if (!chatGptData.apiKey.trim()) {
          toast.error("API Key é obrigatório para ChatGPT");
          setLoading(false);
          return;
        }

        // Montar objeto no formato esperado
        data = {
          name: formData.name,
          type: "openAiApi",
          data: {
            apiKey: chatGptData.apiKey,
            organizationId: chatGptData.organizationId || "",
            url: chatGptData.url,
            header: chatGptData.header,
          },
          nodesAccess: [],
        };
      } else if (formData.type === "GOOGLE_CALENDAR") {
        // Validar campos obrigatórios para Google Calendar
        if (!formData.name.trim()) {
          toast.error("Nome é obrigatório");
          setLoading(false);
          return;
        }

        if (!googleCalendarData.clientId.trim()) {
          toast.error("Client ID é obrigatório para Google Calendar");
          setLoading(false);
          return;
        }

        if (!googleCalendarData.clientSecret.trim()) {
          toast.error("Client Secret é obrigatório para Google Calendar");
          setLoading(false);
          return;
        }

        // Montar objeto no formato esperado
        data = {
          clientId: googleCalendarData.clientId,
          clientSecret: googleCalendarData.clientSecret,
        };
      } else {
        // Para outros tipos, validar JSONs normalmente
        if (formData.customHeaders.trim()) {
          try {
            customHeaders = JSON.parse(formData.customHeaders);
          } catch {
            toast.error("Headers customizados devem ser um JSON válido");
            setLoading(false);
            return;
          }
        }

        if (formData.successModel.trim()) {
          try {
            successModel = JSON.parse(formData.successModel);
          } catch {
            toast.error("Modelo de sucesso deve ser um JSON válido");
            setLoading(false);
            return;
          }
        }

        if (formData.data.trim()) {
          try {
            data = JSON.parse(formData.data);
          } catch {
            toast.error("Dados devem ser um JSON válido");
            setLoading(false);
            return;
          }
        }
      }

      const payload = {
        name: formData.name,
        type: formData.type,
        url: finalUrl,
        method: formData.method,
        authHeaderKey: formData.authHeaderKey || undefined,
        authHeaderValue: formData.authHeaderValue || undefined,
        customHeaders,
        awaitResponse: formData.awaitResponse,
        successModel,
        data,
        isActive: formData.isActive,
      };

      const { createCredential, updateCredential } = await import("@/lib/credentials-api");

      if (credential) {
        await updateCredential(credential.id, payload);
        toast.success("Credencial atualizada com sucesso");
      } else {
        await createCredential(payload);
        toast.success("Credencial criada com sucesso");
      }

      onSuccess();
    } catch (error) {
      toast.error("Erro ao salvar credencial");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        {/* Nome e Tipo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Credencial *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Minha API N8N"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: CredentialType) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {credentialTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* URL e Método - Só mostrar para tipo CUSTOM */}
        {formData.type === "CUSTOM" && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="url">URL da API *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://api.exemplo.com/endpoint"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Método HTTP *</Label>
              <Select
                value={formData.method}
                onValueChange={(value) => setFormData({ ...formData, method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {httpMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Mensagem informativa para tipos pré-configurados */}
        {formData.type !== "CUSTOM" && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  ✨ Configuração Simplificada
                </h3>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  <strong>{formData.type}</strong> é um tipo pré-configurado. Você <strong>não precisa</strong> informar URL ou autenticação manualmente.
                  {formData.type === "CHATGPT" && " Configure apenas a API Key do OpenAI na aba 'Dados'."}
                  {formData.type === "GOOGLE_CALENDAR" && " Configure apenas as credenciais do Google na aba 'Dados'."}
                  {formData.type === "N8N" && " Configure apenas os dados do N8N na aba 'Dados' (se necessário)."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs para configurações avançadas */}
        <Tabs defaultValue="auth" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted/30 dark:bg-muted">
            <TabsTrigger value="auth">Autenticação</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="data">Dados</TabsTrigger>
            <TabsTrigger value="response">Resposta</TabsTrigger>
          </TabsList>

          <TabsContent value="auth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Autenticação</CardTitle>
                <CardDescription>
                  {formData.type === "CUSTOM"
                    ? "Configure a chave de autenticação da API"
                    : "Configurações de autenticação (gerenciadas automaticamente pelo sistema)"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Aviso para tipos pré-configurados */}
                {formData.type !== "CUSTOM" && (
                  <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-green-900 dark:text-green-100">
                          Autenticação Automática
                        </h3>
                        <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                          Este tipo de credencial (<strong>{formData.type}</strong>) usa autenticação pré-configurada.
                          Você <strong>não precisa</strong> preencher os campos abaixo. Configure apenas os dados específicos na aba "Dados".
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Campos de autenticação (opcionais para não-CUSTOM) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="authHeaderKey">
                      Nome do Header
                      {formData.type === "CUSTOM" && <span className="text-red-500 ml-1">*</span>}
                      {formData.type !== "CUSTOM" && <span className="text-xs text-muted-foreground ml-2">(opcional)</span>}
                    </Label>
                    <Input
                      id="authHeaderKey"
                      value={formData.authHeaderKey}
                      onChange={(e) =>
                        setFormData({ ...formData, authHeaderKey: e.target.value })
                      }
                      placeholder={formData.type === "CUSTOM" ? "X-API-KEY" : "Gerenciado automaticamente"}
                      disabled={formData.type !== "CUSTOM"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="authHeaderValue">
                      Valor da Chave
                      {formData.type === "CUSTOM" && <span className="text-red-500 ml-1">*</span>}
                      {formData.type !== "CUSTOM" && <span className="text-xs text-muted-foreground ml-2">(opcional)</span>}
                    </Label>
                    <Input
                      id="authHeaderValue"
                      type="password"
                      value={formData.authHeaderValue}
                      onChange={(e) =>
                        setFormData({ ...formData, authHeaderValue: e.target.value })
                      }
                      placeholder={formData.type === "CUSTOM" ? "sua-chave-api-aqui" : "Gerenciada automaticamente"}
                      disabled={formData.type !== "CUSTOM"}
                    />
                  </div>
                </div>

                {/* Informação adicional para CUSTOM */}
                {formData.type === "CUSTOM" && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-3 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      💡 <strong>Dica:</strong> Para APIs personalizadas, preencha o nome do header de autenticação
                      (ex: <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">X-API-KEY</code>,
                      <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded ml-1">Authorization</code>)
                      e seu respectivo valor.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="headers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Headers Customizados</CardTitle>
                <CardDescription>
                  {formData.type === "CUSTOM"
                    ? "Headers adicionais em formato JSON (opcional)"
                    : "Headers adicionais - Apenas para casos avançados (normalmente não necessário)"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Aviso para tipos pré-configurados */}
                {formData.type !== "CUSTOM" && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      ℹ️ <strong>Não recomendado:</strong> Headers customizados não são necessários para o tipo <strong>{formData.type}</strong>.
                      Use apenas se você souber exatamente o que está fazendo.
                    </p>
                  </div>
                )}

                {/* Botão de ação */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'form' ? 'json' : 'form')}
                  >
                    {viewMode === 'form' ? 'Ver Preview' : 'Voltar ao Editor'}
                  </Button>
                </div>

                {viewMode === 'form' ? (
                  // Monaco Editor - VS Code style
                  <div className="border rounded-lg overflow-hidden">
                    <Editor
                      key={`headers-${editorTheme}`}
                      height="200px"
                      defaultLanguage="json"
                      value={formData.customHeaders}
                      onChange={(value) => setFormData({ ...formData, customHeaders: value || "" })}
                      theme={editorTheme}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        formatOnPaste: true,
                        formatOnType: true,
                        suggest: {
                          snippetsPreventQuickSuggestions: false,
                        },
                      }}
                    />
                  </div>
                ) : (
                  // Visualização JSON Pretty
                  <div className="space-y-2">
                    <Label>Preview do JSON:</Label>
                    <div className="border rounded-lg p-4 bg-muted/30 overflow-auto max-h-96">
                      {formData.customHeaders.trim() ? (
                        <JSONPretty
                          id="json-pretty-headers"
                          data={(() => {
                            try {
                              return JSON.parse(formData.customHeaders);
                            } catch {
                              return { error: "JSON inválido - corrija no editor" };
                            }
                          })()}
                          theme={{
                            main: 'line-height:1.3;color:var(--foreground);background:transparent;overflow:auto;',
                            error: 'line-height:1.3;color:#f44336;background:transparent;overflow:auto;',
                            key: 'color:#4fc3f7;',
                            string: 'color:#81c784;',
                            value: 'color:#ffb74d;',
                            boolean: 'color:#ff8a65;',
                          }}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Nenhum header customizado. Use o editor para adicionar.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            {formData.type === "GOOGLE_CALENDAR" ? (
              // Formulário específico para Google Calendar
              <Card>
                <CardHeader>
                  <CardTitle>Configuração Google Calendar</CardTitle>
                  <CardDescription>
                    Configure suas credenciais OAuth2 do Google
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Botão para alternar entre formulário e JSON */}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'form' ? 'json' : 'form')}
                    >
                      {viewMode === 'form' ? 'Ver JSON' : 'Ver Formulário'}
                    </Button>
                  </div>

                  {viewMode === 'form' ? (
                    <>
                      {/* Client ID */}
                      <div className="space-y-2">
                        <Label htmlFor="google-clientid">
                          Client ID * <span className="text-xs text-muted-foreground">(Obrigatório)</span>
                        </Label>
                        <Input
                          id="google-clientid"
                          value={googleCalendarData.clientId}
                          onChange={(e) => setGoogleCalendarData({ ...googleCalendarData, clientId: e.target.value })}
                          placeholder="123456789-abc.apps.googleusercontent.com"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Obtido no Google Cloud Console
                        </p>
                      </div>

                      {/* Client Secret */}
                      <div className="space-y-2">
                        <Label htmlFor="google-clientsecret">
                          Client Secret * <span className="text-xs text-muted-foreground">(Obrigatório)</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="google-clientsecret"
                            type={showApiKey ? "text" : "password"}
                            value={googleCalendarData.clientSecret}
                            onChange={(e) => setGoogleCalendarData({ ...googleCalendarData, clientSecret: e.target.value })}
                            placeholder="GOCSPX-..."
                            required
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Obtido no Google Cloud Console
                        </p>
                      </div>

                      {/* Informação de ajuda */}
                      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Como obter as credenciais?
                            </h3>
                            <ol className="mt-2 text-sm text-blue-700 dark:text-blue-300 list-decimal list-inside space-y-1">
                              <li>Acesse o <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                              <li>Crie ou selecione um projeto</li>
                              <li>Ative a API do Google Calendar</li>
                              <li>Vá em "Credenciais" e crie credenciais OAuth 2.0</li>
                              <li>Copie o Client ID e Client Secret</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Visualização JSON
                    <div className="space-y-2">
                      <Label>Preview do JSON que será salvo:</Label>
                      <div className="border rounded-lg p-4 bg-muted/30 overflow-auto max-h-96">
                        <JSONPretty
                          id="json-pretty-google"
                          data={{
                            clientId: googleCalendarData.clientId || "[CLIENT_ID]",
                            clientSecret: googleCalendarData.clientSecret || "[CLIENT_SECRET]",
                          }}
                          theme={{
                            main: 'line-height:1.3;color:var(--foreground);background:transparent;overflow:auto;',
                            error: 'line-height:1.3;color:#f44336;background:transparent;overflow:auto;',
                            key: 'color:#4fc3f7;',
                            string: 'color:#81c784;',
                            value: 'color:#ffb74d;',
                            boolean: 'color:#ff8a65;',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : formData.type === "CHATGPT" ? (
              // Formulário específico para ChatGPT
              <Card>
                <CardHeader>
                  <CardTitle>Configuração OpenAI</CardTitle>
                  <CardDescription>
                    Configure suas credenciais da API OpenAI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Botão para alternar entre formulário e JSON */}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'form' ? 'json' : 'form')}
                    >
                      {viewMode === 'form' ? 'Ver JSON' : 'Ver Formulário'}
                    </Button>
                  </div>

                  {viewMode === 'form' ? (
                    <>
                      {/* API Key */}
                      <div className="space-y-2">
                        <Label htmlFor="chatgpt-apikey">
                          API Key * <span className="text-xs text-muted-foreground">(Obrigatório)</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="chatgpt-apikey"
                            type={showApiKey ? "text" : "password"}
                            value={chatGptData.apiKey}
                            onChange={(e) => setChatGptData({ ...chatGptData, apiKey: e.target.value })}
                            placeholder="sk-..."
                            required
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Organization ID */}
                      <div className="space-y-2">
                        <Label htmlFor="chatgpt-orgid">
                          Organization ID <span className="text-xs text-muted-foreground">(Opcional)</span>
                        </Label>
                        <Input
                          id="chatgpt-orgid"
                          value={chatGptData.organizationId}
                          onChange={(e) => setChatGptData({ ...chatGptData, organizationId: e.target.value })}
                          placeholder="org-..."
                        />
                      </div>

                      {/* URL */}
                      <div className="space-y-2">
                        <Label htmlFor="chatgpt-url">URL da API</Label>
                        <Input
                          id="chatgpt-url"
                          value={chatGptData.url}
                          onChange={(e) => setChatGptData({ ...chatGptData, url: e.target.value })}
                          placeholder="https://api.openai.com/v1"
                        />
                      </div>

                      {/* Header */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label htmlFor="chatgpt-header">Usar Header Customizado</Label>
                          <p className="text-sm text-muted-foreground">
                            Ativar headers customizados na requisição
                          </p>
                        </div>
                        <Switch
                          id="chatgpt-header"
                          checked={chatGptData.header}
                          onCheckedChange={(checked) =>
                            setChatGptData({ ...chatGptData, header: checked })
                          }
                        />
                      </div>
                    </>
                  ) : (
                    // Visualização JSON
                    <div className="space-y-2">
                      <Label>Preview do JSON que será salvo:</Label>
                      <div className="border rounded-lg p-4 bg-muted/30 overflow-auto max-h-96">
                        <JSONPretty
                          id="json-pretty"
                          data={{
                            name: formData.name,
                            type: "openAiApi",
                            data: {
                              apiKey: chatGptData.apiKey || "[API_KEY]",
                              organizationId: chatGptData.organizationId || "",
                              url: chatGptData.url,
                              header: chatGptData.header,
                            },
                            nodesAccess: [],
                          }}
                          theme={{
                            main: 'line-height:1.3;color:var(--foreground);background:transparent;overflow:auto;',
                            error: 'line-height:1.3;color:#f44336;background:transparent;overflow:auto;',
                            key: 'color:#4fc3f7;',
                            string: 'color:#81c784;',
                            value: 'color:#ffb74d;',
                            boolean: 'color:#ff8a65;',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              // Formulário genérico para outros tipos
              <Card>
                <CardHeader>
                  <CardTitle>Dados da Requisição</CardTitle>
                  <CardDescription>
                    Body da requisição em formato JSON (opcional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Botão de ação */}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'form' ? 'json' : 'form')}
                    >
                      {viewMode === 'form' ? 'Ver Preview' : 'Voltar ao Editor'}
                    </Button>
                  </div>

                  {viewMode === 'form' ? (
                    // Monaco Editor - VS Code style
                    <div className="border rounded-lg overflow-hidden">
                      <Editor
                        key={`data-${editorTheme}`}
                        height="300px"
                        defaultLanguage="json"
                        value={formData.data}
                        onChange={(value) => setFormData({ ...formData, data: value || "" })}
                        theme={editorTheme}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13,
                          lineNumbers: "on",
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          formatOnPaste: true,
                          formatOnType: true,
                          suggest: {
                            snippetsPreventQuickSuggestions: false,
                          },
                        }}
                      />
                    </div>
                  ) : (
                    // Visualização JSON Pretty
                    <div className="space-y-2">
                      <Label>Preview do JSON:</Label>
                      <div className="border rounded-lg p-4 bg-muted/30 overflow-auto max-h-96">
                        {formData.data.trim() ? (
                          <JSONPretty
                            id="json-pretty-data"
                            data={(() => {
                              try {
                                return JSON.parse(formData.data);
                              } catch {
                                return { error: "JSON inválido - corrija no editor" };
                              }
                            })()}
                            theme={{
                              main: 'line-height:1.3;color:var(--foreground);background:transparent;overflow:auto;',
                              error: 'line-height:1.3;color:#f44336;background:transparent;overflow:auto;',
                              key: 'color:#4fc3f7;',
                              string: 'color:#81c784;',
                              value: 'color:#ffb74d;',
                              boolean: 'color:#ff8a65;',
                            }}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            Nenhum dado configurado. Use o editor para adicionar JSON.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="response" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Resposta</CardTitle>
                <CardDescription>
                  Como a API deve responder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="awaitResponse">Aguardar Resposta</Label>
                    <p className="text-sm text-muted-foreground">
                      Esperar pela resposta da API antes de continuar
                    </p>
                  </div>
                  <Switch
                    id="awaitResponse"
                    checked={formData.awaitResponse}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, awaitResponse: checked })
                    }
                  />
                </div>

                {formData.awaitResponse && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="successModel">Modelo de Sucesso</Label>
                      <p className="text-sm text-muted-foreground">
                        Formato esperado da resposta quando bem-sucedida (JSON)
                      </p>
                    </div>

                    {/* Botão de ação */}
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode(viewMode === 'form' ? 'json' : 'form')}
                      >
                        {viewMode === 'form' ? 'Ver Preview' : 'Voltar ao Editor'}
                      </Button>
                    </div>

                    {viewMode === 'form' ? (
                      // Monaco Editor - VS Code style
                      <div className="border rounded-lg overflow-hidden">
                        <Editor
                          key={`success-${editorTheme}`}
                          height="200px"
                          defaultLanguage="json"
                          value={formData.successModel}
                          onChange={(value) => setFormData({ ...formData, successModel: value || "" })}
                          theme={editorTheme}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 13,
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 2,
                            formatOnPaste: true,
                            formatOnType: true,
                            suggest: {
                              snippetsPreventQuickSuggestions: false,
                            },
                          }}
                        />
                      </div>
                    ) : (
                      // Visualização JSON Pretty
                      <div className="space-y-2">
                        <Label>Preview do JSON:</Label>
                        <div className="border rounded-lg p-4 bg-muted/30 overflow-auto max-h-96">
                          {formData.successModel.trim() ? (
                            <JSONPretty
                              id="json-pretty-success"
                              data={(() => {
                                try {
                                  return JSON.parse(formData.successModel);
                                } catch {
                                  return { error: "JSON inválido - corrija no editor" };
                                }
                              })()}
                              theme={{
                                main: 'line-height:1.3;color:var(--foreground);background:transparent;overflow:auto;',
                                error: 'line-height:1.3;color:#f44336;background:transparent;overflow:auto;',
                                key: 'color:#4fc3f7;',
                                string: 'color:#81c784;',
                                value: 'color:#ffb74d;',
                                boolean: 'color:#ff8a65;',
                              }}
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              Nenhum modelo de sucesso configurado. Use o editor para adicionar.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="isActive">Credencial Ativa</Label>
            <p className="text-sm text-muted-foreground">
              Desative para manter a credencial salva mas não utilizável
            </p>
          </div>
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isActive: checked })
            }
          />
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : credential ? "Atualizar" : "Criar Credencial"}
        </Button>
      </div>
    </form>
  );
}
