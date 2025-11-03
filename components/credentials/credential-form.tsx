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
  }, [credential]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let customHeaders = null;
      let successModel = null;
      let data = null;

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
        url: formData.url,
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

        {/* URL e Método */}
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
                  Configure a chave de autenticação da API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="authHeaderKey">Nome do Header</Label>
                    <Input
                      id="authHeaderKey"
                      value={formData.authHeaderKey}
                      onChange={(e) =>
                        setFormData({ ...formData, authHeaderKey: e.target.value })
                      }
                      placeholder="X-N8N-API-KEY"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="authHeaderValue">Valor da Chave</Label>
                    <Input
                      id="authHeaderValue"
                      type="password"
                      value={formData.authHeaderValue}
                      onChange={(e) =>
                        setFormData({ ...formData, authHeaderValue: e.target.value })
                      }
                      placeholder="sua-chave-api-aqui"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="headers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Headers Customizados</CardTitle>
                <CardDescription>
                  Headers adicionais em formato JSON (opcional)
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
            {formData.type === "CHATGPT" ? (
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
