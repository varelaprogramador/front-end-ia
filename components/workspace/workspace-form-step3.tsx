"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Credential } from "@/types/credential";
import { getCredentials } from "@/lib/credentials-api";
import { configIAService } from "@/lib/config-ia-api";
import { Calendar, MessageSquare, Workflow, Key, Loader2, CheckCircle, Rocket } from "lucide-react";
import { toast } from "sonner";

interface WorkspaceFormData {
  name: string;
  status: "active" | "inactive" | "development";
  prompt: string;
  description: string;
  kommoEnabled: boolean;
  kommoSubdomain: string;
  kommoAccessToken: string;
  kommodPipelineId: string;
  rdstationEnabled: boolean;
  rdstationClientId: string;
  rdstationClientSecret: string;
  rdstationCode: string;
  rdstationAccessToken: string;
  rdstationRefreshToken: string;
  selectedCredentials: string[];
}

interface WorkspaceFormStep3Props {
  formData: WorkspaceFormData;
  updateFormData: (data: Partial<WorkspaceFormData>) => void;
  userId: string | null;
  onWorkspaceCreated: (id: string) => void;
  handleCreateWorkspace: (n8nData: any) => Promise<string | null>;
}

const credentialIcons: Record<string, any> = {
  GOOGLE_CALENDAR: Calendar,
  CHATGPT: MessageSquare,
  N8N: Workflow,
  CUSTOM: Key,
};

const credentialTypeColors: Record<string, string> = {
  GOOGLE_CALENDAR: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  CHATGPT: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  N8N: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  CUSTOM: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
};

export default function WorkspaceFormStep3({
  formData,
  updateFormData,
  userId,
  onWorkspaceCreated,
  handleCreateWorkspace
}: WorkspaceFormStep3Props) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingN8N, setCreatingN8N] = useState(false);
  const [n8nCreated, setN8nCreated] = useState(false);
  const [n8nData, setN8nData] = useState<any>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<"sending" | "waiting" | "received" | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ type: string; message: string; details: string } | null>(null);

  useEffect(() => {
    if (userId) {
      fetchCredentials();
    }
  }, [userId]);

  const fetchCredentials = async () => {
    if (!userId) return;
    try {
      const data = await getCredentials(userId);
      // Filtrar apenas credenciais ativas
      setCredentials(data.filter((c) => c.isActive));
    } catch (error) {
      console.error("Erro ao carregar credenciais:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCredential = (credentialId: string) => {
    const isSelected = formData.selectedCredentials.includes(credentialId);
    const newSelected = isSelected
      ? formData.selectedCredentials.filter((id) => id !== credentialId)
      : [...formData.selectedCredentials, credentialId];

    updateFormData({ selectedCredentials: newSelected });
  };

  // Verificar se tem credencial ChatGPT selecionada
  const hasChatGPTCredential = formData.selectedCredentials.some(credId => {
    const cred = credentials.find(c => c.id === credId);
    return cred?.type === "CHATGPT";
  });

  // Verificar se existe credencial ChatGPT disponível
  const chatGPTCredentials = credentials.filter(c => c.type === "CHATGPT");
  const hasChatGPTAvailable = chatGPTCredentials.length > 0;

  const handleCreateWorkspaceWithN8N = async () => {
    if (!userId) {
      toast.error("Erro de autenticação", {
        description: "Usuário não autenticado. Faça login para continuar.",
      });
      return;
    }

    // Validar credencial ChatGPT obrigatória
    if (!hasChatGPTCredential) {
      toast.error("Credencial ChatGPT obrigatória", {
        description: "Você precisa selecionar uma credencial ChatGPT para criar o workspace.",
      });
      return;
    }

    setCreatingN8N(true);
    const startTime = Date.now();

    try {
      // Estágio 1: Enviando para N8N
      setLoadingStage("sending");
      await new Promise(resolve => setTimeout(resolve, 800)); // Animação inicial

      // 1. Preparar dados do workspace (webhooks são gerados automaticamente pelo backend)
      const workspaceData = {
        userId,
        nome: formData.name,
        prompt: formData.prompt,
        status: formData.status,
        kommoSubdomain: formData.kommoEnabled ? formData.kommoSubdomain : undefined,
        kommoAccessToken: formData.kommoEnabled ? formData.kommoAccessToken : undefined,
        kommodPipelineId: formData.kommoEnabled ? formData.kommodPipelineId : undefined,
        rdstationClientId: formData.rdstationEnabled ? formData.rdstationClientId : undefined,
        rdstationClientSecret: formData.rdstationEnabled ? formData.rdstationClientSecret : undefined,
        rdstationCode: formData.rdstationEnabled ? formData.rdstationCode : undefined,
        rdstationAccessToken: formData.rdstationEnabled ? formData.rdstationAccessToken : undefined,
        rdstationRefreshToken: formData.rdstationEnabled ? formData.rdstationRefreshToken : undefined,
        credentialIds: formData.selectedCredentials,
      };

      // Estágio 2: Aguardando resposta do N8N
      setLoadingStage("waiting");

      // 2. Enviar para criar no N8N primeiro e depois no banco
      const result = await configIAService.createWithN8N(workspaceData);

      // Garantir tempo mínimo de 3 segundos
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(3000 - elapsedTime, 0);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      if (result.success && result.data) {
        const { workspace, n8nResponse } = result.data;

        // Estágio 3: Resposta recebida com sucesso
        setLoadingStage("received");
        await new Promise(resolve => setTimeout(resolve, 1000)); // Mostrar sucesso por 1s

        setN8nCreated(true);
        setN8nData(n8nResponse);
        setWorkspaceId(workspace.id);
        onWorkspaceCreated(workspace.id);

        toast.success("Workspace criado com sucesso!", {
          description: "O workspace foi configurado no N8N e salvo no sistema.",
        });
      } else {
        // Erro: N8N não retornou sucesso
        setLoadingStage(null);

        // Processar tipo de erro
        const errorType = (result as any).errorType || "UNKNOWN";
        const errorMessage = result.message || "Erro desconhecido";
        const errorDetails = (result as any).error || "N8N não confirmou a criação do workspace.";

        // Mapear mensagens amigáveis
        let friendlyMessage = errorMessage;
        let friendlyDetails = errorDetails;

        switch (errorType) {
          case "CONNECTION_ERROR":
            friendlyMessage = "Não foi possível conectar ao N8N";
            friendlyDetails = "O webhook do N8N pode estar desligado ou inacessível. Verifique se o fluxo está ativo no N8N.";
            break;
          case "HTTP_ERROR":
            const statusCode = (result as any).statusCode;
            if (statusCode === 404) {
              friendlyMessage = "Webhook do N8N não encontrado";
              friendlyDetails = "O fluxo pode estar desligado ou o webhook foi removido. Ative o fluxo no N8N e tente novamente.";
            } else if (statusCode >= 500) {
              friendlyMessage = "Erro interno no N8N";
              friendlyDetails = "O N8N está com problemas. Tente novamente em alguns instantes.";
            }
            break;
          case "N8N_REJECTED":
            friendlyMessage = "N8N rejeitou a criação do workspace";
            friendlyDetails = errorDetails || "Verifique os dados e tente novamente.";
            break;
          case "PARSE_ERROR":
            friendlyMessage = "Resposta inválida do N8N";
            friendlyDetails = "O N8N retornou uma resposta que não pôde ser processada.";
            break;
        }

        setErrorInfo({
          type: errorType,
          message: friendlyMessage,
          details: friendlyDetails,
        });

        toast.error(friendlyMessage, {
          description: friendlyDetails,
        });
      }
    } catch (error) {
      console.error("Erro ao criar workspace:", error);
      setLoadingStage(null);

      setErrorInfo({
        type: "UNKNOWN",
        message: "Erro interno",
        details: "Ocorreu um erro inesperado ao criar o workspace. Tente novamente.",
      });

      toast.error("Erro interno", {
        description: "Ocorreu um erro inesperado ao criar o workspace. Tente novamente.",
      });
    } finally {
      setCreatingN8N(false);
      setLoadingStage(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Se não há credenciais, mostrar aviso mas permitir continuar
  const hasNoCredentials = credentials.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Selecione as Credenciais (Opcional)</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha quais credenciais este workspace poderá utilizar. Você pode pular esta etapa e vincular credenciais depois.
        </p>
      </div>

      {/* Aviso quando não há credencial ChatGPT disponível */}
      {!hasChatGPTAvailable && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-red-200 dark:bg-red-700 flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5 text-red-600 dark:text-red-300" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-900 dark:text-red-100">
                Credencial ChatGPT Obrigatória
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Você precisa criar uma credencial do tipo <strong>ChatGPT</strong> antes de criar um workspace.
                Vá para <strong>Credenciais</strong> e crie uma integração ChatGPT primeiro.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Aviso quando não há credenciais mas tem ChatGPT */}
      {hasNoCredentials && hasChatGPTAvailable && (
        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-200 dark:bg-yellow-700 flex items-center justify-center shrink-0">
              <Key className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Outras Credenciais são Opcionais
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Apenas a credencial ChatGPT é obrigatória. As demais credenciais podem ser vinculadas depois através do menu do workspace.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Credenciais */}
      {!hasNoCredentials && (
      <div className="grid gap-3">
        {credentials.map((credential) => {
          const Icon = credentialIcons[credential.type] || Key;
          const isSelected = formData.selectedCredentials.includes(credential.id);

          return (
            <Card
              key={credential.id}
              className={`p-4 cursor-pointer transition-all border-2 ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-600"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              } ${n8nCreated ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => !n8nCreated && handleToggleCredential(credential.id)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => !n8nCreated && handleToggleCredential(credential.id)}
                  className="mt-1"
                  disabled={n8nCreated}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Icon
                      className={`h-4 w-4 ${
                        isSelected ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        isSelected ? "text-blue-900 dark:text-blue-100" : ""
                      }`}
                    >
                      {credential.name}
                    </span>
                    <Badge
                      className={`ml-auto ${
                        credentialTypeColors[credential.type] ||
                        credentialTypeColors.CUSTOM
                      }`}
                    >
                      {credential.type}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {credential.url || "URL configurada automaticamente"}
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {credential.method}
                    </Badge>
                    {credential.isActive && (
                      <Badge className="text-xs bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                        ✓ Ativa
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      )}

      {/* Resumo de Seleção */}
      <div className={`rounded-lg p-4 border ${
        hasChatGPTCredential
          ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
          : "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800"
      }`}>
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {hasChatGPTCredential ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <MessageSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${
              hasChatGPTCredential
                ? "text-green-900 dark:text-green-100"
                : "text-orange-900 dark:text-orange-100"
            }`}>
              {hasChatGPTCredential
                ? `${formData.selectedCredentials.length} credencial(is) selecionada(s) - ChatGPT incluído`
                : "Credencial ChatGPT não selecionada"}
            </h3>
            <p className={`mt-1 text-sm ${
              hasChatGPTCredential
                ? "text-green-700 dark:text-green-300"
                : "text-orange-700 dark:text-orange-300"
            }`}>
              {hasChatGPTCredential
                ? "O workspace está pronto para ser criado com as credenciais selecionadas."
                : "Selecione uma credencial ChatGPT para continuar. Esta credencial é obrigatória para o funcionamento do workspace."}
            </p>
          </div>
        </div>
      </div>

      {/* Integração N8N */}
      <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-6">
        <div className="flex flex-col items-center text-center gap-4">
          {/* Ícone Principal */}
          <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-all ${
            n8nCreated
              ? "bg-green-100 dark:bg-green-900/30"
              : loadingStage
              ? "bg-blue-100 dark:bg-blue-900/30"
              : "bg-orange-100 dark:bg-orange-900/30"
          }`}>
            {n8nCreated ? (
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            ) : loadingStage ? (
              <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
            ) : (
              <Rocket className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            )}
          </div>

          {/* Estado: Criando (Loading com estágios) */}
          {loadingStage && !n8nCreated && (
            <div className="space-y-4 w-full">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                {loadingStage === "sending" && "Enviando dados para N8N..."}
                {loadingStage === "waiting" && "Aguardando resposta do N8N..."}
                {loadingStage === "received" && "Resposta recebida com sucesso!"}
              </h3>

              {/* Barra de progresso visual */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    loadingStage === "sending" || loadingStage === "waiting" || loadingStage === "received"
                      ? "bg-blue-600 dark:bg-blue-400"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Enviando dados
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    loadingStage === "waiting" || loadingStage === "received"
                      ? "bg-blue-600 dark:bg-blue-400 animate-pulse"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Aguardando confirmação do N8N
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    loadingStage === "received"
                      ? "bg-green-600 dark:bg-green-400"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Salvando no sistema
                  </span>
                </div>
              </div>

              <p className="text-sm text-blue-700 dark:text-blue-300">
                Por favor, aguarde enquanto processamos sua solicitação...
              </p>
            </div>
          )}

          {/* Estado: Sucesso */}
          {n8nCreated && !loadingStage && (
            <div className="space-y-3 w-full">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                Workspace Criado com Sucesso!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                O workspace foi criado no N8N e salvo no sistema com todas as credenciais vinculadas.
              </p>
              {n8nData && (
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 text-left">
                  <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-2">
                    Resposta do N8N:
                  </p>
                  <p className="text-xs font-mono text-green-800 dark:text-green-200 break-all whitespace-pre-wrap">
                    {JSON.stringify(n8nData, null, 2)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Estado: Erro */}
          {errorInfo && !loadingStage && !n8nCreated && (
            <div className="space-y-3 w-full">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                {errorInfo.message}
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                {errorInfo.details}
              </p>

              {/* Ícones específicos por tipo de erro */}
              <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg
                      className="h-5 w-5 text-red-600 dark:text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-red-900 dark:text-red-100 mb-1">
                      O que fazer:
                    </p>
                    <ul className="text-xs text-red-800 dark:text-red-200 space-y-1 list-disc list-inside">
                      {errorInfo.type === "CONNECTION_ERROR" ? (
                        <>
                          <li>Verifique se o N8N está online e acessível</li>
                          <li>Confirme se o fluxo está ativo no N8N</li>
                          <li>Teste a URL do webhook manualmente</li>
                        </>
                      ) : errorInfo.type === "HTTP_ERROR" ? (
                        <>
                          <li>Ative o fluxo do workspace no N8N</li>
                          <li>Verifique se o webhook está configurado corretamente</li>
                          <li>Confirme que o fluxo não foi deletado</li>
                        </>
                      ) : errorInfo.type === "N8N_REJECTED" ? (
                        <>
                          <li>Revise os dados do workspace</li>
                          <li>Verifique se as credenciais são válidas</li>
                          <li>Consulte os logs do N8N para mais detalhes</li>
                        </>
                      ) : errorInfo.type === "PARSE_ERROR" ? (
                        <>
                          <li>Verifique se o fluxo do N8N está retornando JSON válido</li>
                          <li>Confirme que o webhook está configurado corretamente</li>
                        </>
                      ) : (
                        <>
                          <li>Verifique sua conexão com a internet</li>
                          <li>Tente novamente em alguns instantes</li>
                          <li>Entre em contato com o suporte se o problema persistir</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setErrorInfo(null);
                  handleCreateWorkspaceWithN8N();
                }}
                disabled={creatingN8N}
                variant="outline"
                className="mt-2"
              >
                <Rocket className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          )}

          {/* Estado: Inicial */}
          {!errorInfo && !loadingStage && !n8nCreated && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Criar Workspace
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {hasChatGPTCredential
                  ? "Crie o workspace no N8N e no sistema com as credenciais selecionadas."
                  : "Selecione uma credencial ChatGPT acima para habilitar a criação do workspace."}
              </p>
              <Button
                onClick={handleCreateWorkspaceWithN8N}
                disabled={creatingN8N || !hasChatGPTCredential}
                className="mt-2"
              >
                <Rocket className="h-4 w-4 mr-2" />
                Criar Workspace
              </Button>
              {!hasChatGPTCredential && (
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  A credencial ChatGPT é obrigatória
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
