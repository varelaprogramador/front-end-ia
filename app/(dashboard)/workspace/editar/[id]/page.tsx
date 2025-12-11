"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Agent } from "@/lib/adapters";
import { getAgentById, updateAgent } from "@/lib/agents-real";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import WorkspaceFormStep1 from "@/components/workspace/workspace-form-step1";
import WorkspaceFormStep2 from "@/components/workspace/workspace-form-step2";

// Interface para os dados do formulário
interface WorkspaceFormData {
  // Step 1: Informações Básicas
  name: string;
  status: "active" | "inactive" | "development";
  prompt: string;
  description: string;

  // Step 2: Integrações CRM
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

  // Não usado na edição, mas necessário para compatibilidade
  selectedCredentials: string[];
}

const steps = [
  {
    id: 1,
    name: "Informações Básicas",
    description: "Nome, status e configurações iniciais"
  },
  {
    id: 2,
    name: "Integrações CRM",
    description: "Configurar integrações com Kommo e RD Station (opcional)"
  },
];

export default function EditarWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [originalAgent, setOriginalAgent] = useState<Agent | null>(null);

  const [formData, setFormData] = useState<WorkspaceFormData>({
    // Step 1
    name: "",
    status: "development",
    prompt: "",
    description: "",

    // Step 2 - Kommo
    kommoEnabled: false,
    kommoSubdomain: "",
    kommoAccessToken: "",
    kommodPipelineId: "",
    // Step 2 - RD Station
    rdstationEnabled: false,
    rdstationClientId: "",
    rdstationClientSecret: "",
    rdstationCode: "",
    rdstationAccessToken: "",
    rdstationRefreshToken: "",

    // Não usado na edição
    selectedCredentials: [],
  });

  // Carregar dados do workspace
  useEffect(() => {
    const loadWorkspace = async () => {
      if (!workspaceId) return;

      try {
        const agent = await getAgentById(workspaceId);

        if (agent) {
          setOriginalAgent(agent);

          // DEBUG: Verificar valores recebidos do backend
          console.log("🔍 [EDIT] Dados do agente recebidos do backend:", {
            rdstationClientId: agent.rdstationClientId,
            rdstationClientSecret: agent.rdstationClientSecret,
            areEqual: agent.rdstationClientId === agent.rdstationClientSecret,
          });

          const rdEnabled = !!(agent.rdstationClientId || agent.rdstationClientSecret || agent.rdstationCode);
          setFormData({
            name: agent.name,
            status: agent.status,
            prompt: agent.prompt,
            description: agent.description || "",
            kommoEnabled: !!(agent.kommoSubdomain || agent.kommoAccessToken),
            kommoSubdomain: agent.kommoSubdomain || "",
            kommoAccessToken: agent.kommoAccessToken || "",
            kommodPipelineId: agent.kommodPipelineId || "",
            rdstationEnabled: rdEnabled,
            rdstationClientId: agent.rdstationClientId || "",
            rdstationClientSecret: agent.rdstationClientSecret || "",
            rdstationCode: agent.rdstationCode || "",
            rdstationAccessToken: agent.rdstationAccessToken || "",
            rdstationRefreshToken: agent.rdstationRefreshToken || "",
            selectedCredentials: agent.credentialIds || [],
          });
        } else {
          toast.error("Workspace não encontrado");
          router.push("/workspace");
        }
      } catch (error) {
        console.error("Error loading workspace:", error);
        toast.error("Erro ao carregar workspace");
        router.push("/workspace");
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  }, [workspaceId, router]);

  const updateFormData = (data: Partial<WorkspaceFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const validateStep1 = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Nome do workspace é obrigatório");
      return false;
    }
    if (!formData.prompt.trim()) {
      toast.error("Prompt é obrigatório");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (formData.kommoEnabled) {
      if (!formData.kommoSubdomain.trim()) {
        toast.error("Subdomínio Kommo é obrigatório quando a integração está ativada");
        return false;
      }
      if (!formData.kommoAccessToken.trim()) {
        toast.error("Access Token Kommo é obrigatório quando a integração está ativada");
        return false;
      }
    }
    if (formData.rdstationEnabled) {
      if (!formData.rdstationClientId.trim()) {
        toast.error("Client ID é obrigatório quando a integração RD Station está ativada");
        return false;
      }
      if (!formData.rdstationClientSecret.trim()) {
        toast.error("Client Secret é obrigatório quando a integração RD Station está ativada");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    // Validar step atual
    if (currentStep === 1 && !validateStep1()) return;

    // Avançar para o próximo step
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    // Validar step atual
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;

    setIsSaving(true);
    const loadingToast = toast.loading("Salvando alterações...");

    try {
      const updateData: Partial<Agent> = {
        name: formData.name,
        status: formData.status,
        prompt: formData.prompt,
        description: formData.description,
        kommoSubdomain: formData.kommoEnabled ? formData.kommoSubdomain : undefined,
        kommoAccessToken: formData.kommoEnabled ? formData.kommoAccessToken : undefined,
        kommodPipelineId: formData.kommoEnabled ? formData.kommodPipelineId : undefined,
        rdstationClientId: formData.rdstationEnabled ? formData.rdstationClientId : undefined,
        rdstationClientSecret: formData.rdstationEnabled ? formData.rdstationClientSecret : undefined,
        rdstationCode: formData.rdstationEnabled ? formData.rdstationCode : undefined,
        rdstationAccessToken: formData.rdstationEnabled ? formData.rdstationAccessToken : undefined,
        rdstationRefreshToken: formData.rdstationEnabled ? formData.rdstationRefreshToken : undefined,
      };

      const result = await updateAgent(workspaceId, updateData);

      if (result) {
        toast.success("Workspace atualizado com sucesso!", {
          id: loadingToast,
        });
        router.push("/workspace");
      } else {
        toast.error("Erro ao atualizar workspace", {
          id: loadingToast,
          description: "Falha ao salvar alterações. Tente novamente.",
        });
      }
    } catch (error) {
      console.error("Error updating workspace:", error);
      toast.error("Erro interno", {
        id: loadingToast,
        description: "Ocorreu um erro ao salvar. Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/workspace")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Editar Workspace</h1>
        <p className="text-muted-foreground mt-2">
          Atualize as configurações do workspace "{originalAgent?.name}"
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <nav aria-label="Progresso">
          <ol className="flex items-center justify-between">
            {steps.map((step, index) => (
              <li
                key={step.id}
                className={`flex items-center ${
                  index !== steps.length - 1 ? "flex-1" : ""
                }`}
              >
                <div className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        currentStep > step.id
                          ? "bg-blue-600 border-blue-600"
                          : currentStep === step.id
                          ? "border-blue-600 text-blue-600"
                          : "border-gray-300 dark:border-gray-600 text-gray-400"
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : (
                        <span
                          className={`text-sm font-medium ${
                            currentStep === step.id ? "text-blue-600" : ""
                          }`}
                        >
                          {step.id}
                        </span>
                      )}
                    </div>
                    {index !== steps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 ${
                          currentStep > step.id
                            ? "bg-blue-600"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p
                      className={`text-sm font-medium ${
                        currentStep === step.id
                          ? "text-blue-600"
                          : currentStep > step.id
                          ? "text-gray-900 dark:text-gray-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {step.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Form Content */}
      <Card className="p-6">
        {currentStep === 1 && (
          <WorkspaceFormStep1
            formData={formData}
            updateFormData={updateFormData}
          />
        )}
        {currentStep === 2 && (
          <WorkspaceFormStep2
            formData={formData}
            updateFormData={updateFormData}
          />
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isSaving}
        >
          Voltar
        </Button>

        <div className="flex gap-2">
          {currentStep < steps.length ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSaving}
              >
                Próximo
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
