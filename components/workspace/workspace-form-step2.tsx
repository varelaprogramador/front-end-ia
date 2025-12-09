"use client";

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, CheckCircle, AlertCircle, Info } from "lucide-react";
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
  selectedCredentials: string[];
}

interface WorkspaceFormStep2Props {
  formData: WorkspaceFormData;
  updateFormData: (data: Partial<WorkspaceFormData>) => void;
}

interface KommoPipeline {
  id: number;
  name: string;
  sort: number;
  is_main: boolean;
  is_unsorted_on: boolean;
  is_archive: boolean;
  account_id: number;
  _embedded?: {
    statuses: Array<{
      id: number;
      name: string;
      sort: number;
      is_editable: boolean;
      pipeline_id: number;
      color: string;
      type: number;
      account_id: number;
    }>;
  };
}

export default function WorkspaceFormStep2({ formData, updateFormData }: WorkspaceFormStep2Props) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [pipelines, setPipelines] = useState<KommoPipeline[]>([]);
  const [isVerifyingRdstation, setIsVerifyingRdstation] = useState(false);
  const [isRdstationVerified, setIsRdstationVerified] = useState(false);

  // Verificar credenciais automaticamente se já existem dados
  useEffect(() => {
    if (formData.kommoEnabled && formData.kommoSubdomain && formData.kommoAccessToken && !isVerified) {
      handleVerifyKommo();
    }
  }, []);

  // Listener para receber código de autorização do RD Station via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'RDSTATION_AUTH_CODE' && event.data?.code) {
        updateFormData({ rdstationCode: event.data.code });
        setIsRdstationVerified(true);
        toast.success("Código de autorização obtido com sucesso!");
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [updateFormData]);

  const handleVerifyKommo = async () => {
    if (!formData.kommoSubdomain || !formData.kommoAccessToken) {
      toast.error("Preencha o subdomínio e o access token");
      return;
    }

    setIsVerifying(true);
    const loadingToast = toast.loading("Verificando credenciais Kommo...");

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/kommo/verify`, {
        subdomain: formData.kommoSubdomain,
        accessToken: formData.kommoAccessToken,
      });

      const data = response.data.data;

      if (data._embedded && data._embedded.pipelines) {
        const pipelinesList = data._embedded.pipelines as KommoPipeline[];
        setPipelines(pipelinesList);
        setIsVerified(true);

        toast.success("Credenciais verificadas com sucesso!", {
          id: loadingToast,
          description: `${pipelinesList.length} pipeline(s) encontrado(s)`,
        });
      } else {
        toast.warning("Nenhum pipeline encontrado", {
          id: loadingToast,
          description: "A conta não possui pipelines configurados",
        });
        setIsVerified(true);
        setPipelines([]);
      }
    } catch (error) {
      console.error("Error verifying Kommo:", error);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ success: boolean; message: string }>;

        if (axiosError.response) {
          const message = axiosError.response.data?.message || "Erro ao verificar credenciais";
          toast.error("Erro ao verificar credenciais", {
            id: loadingToast,
            description: message,
          });
        } else if (axiosError.request) {
          toast.error("Erro de conexão", {
            id: loadingToast,
            description: "Não foi possível conectar ao servidor. Verifique sua conexão.",
          });
        } else {
          toast.error("Erro interno", {
            id: loadingToast,
            description: "Erro ao configurar a requisição. Tente novamente.",
          });
        }
      } else {
        toast.error("Erro desconhecido", {
          id: loadingToast,
          description: "Ocorreu um erro inesperado. Tente novamente.",
        });
      }

      setIsVerified(false);
      setPipelines([]);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Integração Kommo CRM</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure a integração com Kommo CRM (opcional)
        </p>
      </div>

      {/* Toggle para ativar/desativar integração */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
        <div className="space-y-0.5">
          <Label htmlFor="kommo-enabled" className="text-base">
            Ativar Integração Kommo
          </Label>
          <p className="text-sm text-muted-foreground">
            Conecte este workspace ao Kommo CRM
          </p>
        </div>
        <Switch
          id="kommo-enabled"
          checked={formData.kommoEnabled}
          onCheckedChange={(checked) => {
            updateFormData({ kommoEnabled: checked });
            if (!checked) {
              // Limpar dados se desativado
              updateFormData({
                kommoSubdomain: "",
                kommoAccessToken: "",
                kommodPipelineId: "",
              });
              setIsVerified(false);
              setPipelines([]);
            }
          }}
        />
      </div>

      {/* Campos de configuração (aparecem apenas se ativado) */}
      {formData.kommoEnabled && (
        <div className="space-y-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
          <div className="space-y-2">
            <Label htmlFor="kommoSubdomain">
              Subdomínio Kommo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="kommoSubdomain"
              value={formData.kommoSubdomain}
              onChange={(e) => {
                updateFormData({ kommoSubdomain: e.target.value });
                setIsVerified(false);
                setPipelines([]);
              }}
              placeholder="Ex: minhaempresa"
              disabled={isVerifying}
            />
            <p className="text-xs text-muted-foreground">
              O subdomínio da sua conta Kommo (ex: minhaempresa.kommo.com)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kommoAccessToken">
              Access Token <span className="text-red-500">*</span>
            </Label>
            <Input
              id="kommoAccessToken"
              type="password"
              value={formData.kommoAccessToken}
              onChange={(e) => {
                updateFormData({ kommoAccessToken: e.target.value });
                setIsVerified(false);
                setPipelines([]);
              }}
              placeholder="Access token da API Kommo"
              disabled={isVerifying}
            />
            <p className="text-xs text-muted-foreground">
              Token de acesso gerado nas configurações da API do Kommo
            </p>
          </div>

          <Button
            type="button"
            variant={isVerified ? "outline" : "default"}
            onClick={handleVerifyKommo}
            disabled={isVerifying || !formData.kommoSubdomain || !formData.kommoAccessToken}
            className="w-full gap-2"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : isVerified ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                Credenciais Verificadas
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                Verificar Credenciais
              </>
            )}
          </Button>

          {isVerified && pipelines.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="kommodPipelineId">Selecione o Pipeline</Label>
              <Select
                value={formData.kommodPipelineId}
                onValueChange={(value) => updateFormData({ kommodPipelineId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {pipeline.name}
                          {pipeline.is_main && (
                            <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                              (Principal)
                            </span>
                          )}
                        </span>
                        {pipeline._embedded?.statuses && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {pipeline._embedded.statuses.length} etapas
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.kommodPipelineId && (
                <p className="text-xs text-muted-foreground">
                  Pipeline ID: {formData.kommodPipelineId}
                </p>
              )}
            </div>
          )}

          {isVerified && pipelines.length === 0 && (
            <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                Nenhum pipeline encontrado nesta conta Kommo.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Separador entre integrações */}
      <div className="border-t my-8" />

      {/* RD Station Section */}
      <div>
        <h3 className="text-lg font-medium">Integração RD Station</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure a integração com RD Station Marketing (opcional)
        </p>
      </div>

      {/* Toggle para ativar/desativar integração RD Station */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
        <div className="space-y-0.5">
          <Label htmlFor="rdstation-enabled" className="text-base">
            Ativar Integração RD Station
          </Label>
          <p className="text-sm text-muted-foreground">
            Conecte este workspace ao RD Station Marketing
          </p>
        </div>
        <Switch
          id="rdstation-enabled"
          checked={formData.rdstationEnabled}
          onCheckedChange={(checked) => {
            updateFormData({ rdstationEnabled: checked });
            if (!checked) {
              // Limpar dados se desativado
              updateFormData({
                rdstationClientId: "",
                rdstationClientSecret: "",
                rdstationCode: "",
              });
              setIsRdstationVerified(false);
            }
          }}
        />
      </div>

      {/* Campos de configuração RD Station (aparecem apenas se ativado) */}
      {formData.rdstationEnabled && (
        <div className="space-y-4 pl-4 border-l-2 border-orange-200 dark:border-orange-800">
          <div className="space-y-2">
            <Label htmlFor="rdstationClientId">
              Client ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="rdstationClientId"
              value={formData.rdstationClientId}
              onChange={(e) => {
                updateFormData({ rdstationClientId: e.target.value });
                setIsRdstationVerified(false);
              }}
              placeholder="Client ID da aplicação RD Station"
              disabled={isVerifyingRdstation}
            />
            <p className="text-xs text-muted-foreground">
              O Client ID da sua aplicação criada no RD Station
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rdstationClientSecret">
              Client Secret <span className="text-red-500">*</span>
            </Label>
            <Input
              id="rdstationClientSecret"
              type="password"
              value={formData.rdstationClientSecret}
              onChange={(e) => {
                updateFormData({ rdstationClientSecret: e.target.value });
                setIsRdstationVerified(false);
              }}
              placeholder="Client Secret da aplicação RD Station"
              disabled={isVerifyingRdstation}
            />
            <p className="text-xs text-muted-foreground">
              O Client Secret gerado ao criar a aplicação no RD Station
            </p>
          </div>

          <Button
            type="button"
            variant={formData.rdstationCode ? "outline" : "default"}
            onClick={() => {
              if (!formData.rdstationClientId) {
                toast.error("Preencha o Client ID primeiro");
                return;
              }
              // URL de autorização do RD Station
              const redirectUri = encodeURIComponent(`${window.location.origin}/api/rdstation/callback`);
              const authUrl = `https://api.rd.services/auth/dialog?client_id=${formData.rdstationClientId}&redirect_uri=${redirectUri}`;
              window.open(authUrl, "_blank", "width=600,height=700");
              toast.info("Uma nova janela foi aberta para autorização", {
                description: "Após autorizar, o código será preenchido automaticamente.",
              });
            }}
            disabled={!formData.rdstationClientId || !formData.rdstationClientSecret}
            className="w-full gap-2"
          >
            {formData.rdstationCode ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                Código de Autorização Obtido
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                Gerar Código de Autorização
              </>
            )}
          </Button>

          {formData.rdstationCode && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-800 dark:text-green-200">
                <strong>Código obtido!</strong> O access token será gerado automaticamente ao criar o workspace.
              </p>
            </div>
          )}

          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 p-3 border border-orange-200 dark:border-orange-800">
            <p className="text-xs text-orange-800 dark:text-orange-200">
              <strong>Nota:</strong> Clique no botão acima para autorizar a integração com sua conta RD Station.
              O código de autorização será usado para gerar os tokens de acesso automaticamente.
            </p>
          </div>
        </div>
      )}

      {/* Informações sobre as integrações */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {formData.kommoEnabled || formData.rdstationEnabled ? "Sobre as Integrações" : "Integrações Opcionais"}
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              {formData.kommoEnabled && formData.rdstationEnabled
                ? "O workspace terá acesso ao Kommo CRM e RD Station Marketing simultaneamente."
                : formData.kommoEnabled
                ? "O workspace terá acesso aos leads e negociações do pipeline selecionado no Kommo CRM."
                : formData.rdstationEnabled
                ? "O workspace terá acesso aos leads e eventos de conversão do RD Station Marketing."
                : "As integrações com CRM são opcionais. Você pode configurá-las agora ou adicionar depois."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
