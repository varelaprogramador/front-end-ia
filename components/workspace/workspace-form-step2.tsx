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
  webhookDev: string;
  webhookProd: string;
  kommoEnabled: boolean;
  kommoSubdomain: string;
  kommoAccessToken: string;
  kommodPipelineId: string;
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

  // Verificar credenciais automaticamente se já existem dados
  useEffect(() => {
    if (formData.kommoEnabled && formData.kommoSubdomain && formData.kommoAccessToken && !isVerified) {
      handleVerifyKommo();
    }
  }, []);

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

      {/* Informações sobre a integração */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {formData.kommoEnabled ? "Sobre a Integração" : "Integração Opcional"}
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              {formData.kommoEnabled
                ? "O workspace terá acesso aos leads e negociações do pipeline selecionado no Kommo CRM."
                : "A integração com Kommo CRM é opcional. Você pode configurá-la agora ou adicionar depois."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
