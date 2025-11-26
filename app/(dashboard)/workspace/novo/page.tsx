"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Agent } from "@/lib/adapters";
import { createAgent } from "@/lib/agents-real";
import { useUserId } from "@/lib/use-user-id";
import { toast } from "sonner";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import WorkspaceFormStep1 from "@/components/workspace/workspace-form-step1";
import WorkspaceFormStep2 from "@/components/workspace/workspace-form-step2";
import WorkspaceFormStep3 from "@/components/workspace/workspace-form-step3";

// Interface para os dados do formulário
interface WorkspaceFormData {
  // Step 1: Informações Básicas
  name: string;
  status: "active" | "inactive" | "development";
  prompt: string;
  description: string;
  webhookDev: string;
  webhookProd: string;

  // Step 2: Integração Kommo
  kommoEnabled: boolean;
  kommoSubdomain: string;
  kommoAccessToken: string;
  kommodPipelineId: string;

  // Step 3: Credenciais
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
    name: "Integração Kommo",
    description: "Configurar integração com Kommo CRM (opcional)"
  },
  {
    id: 3,
    name: "Credenciais",
    description: "Vincular credenciais ao workspace"
  },
];

export default function NovoWorkspacePage() {
  const router = useRouter();
  const userId = useUserId();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);

  const [formData, setFormData] = useState<WorkspaceFormData>({
    // Step 1
    name: "",
    status: "development",
    prompt: "",
    description: "",
    webhookDev: "",
    webhookProd: "",

    // Step 2
    kommoEnabled: false,
    kommoSubdomain: "",
    kommoAccessToken: "",
    kommodPipelineId: "",

    // Step 3
    selectedCredentials: [],
  });

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
    if (!formData.webhookDev.trim()) {
      toast.error("Webhook Dev é obrigatório");
      return false;
    }
    if (!formData.webhookProd.trim()) {
      toast.error("Webhook Prod é obrigatório");
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
    return true;
  };

  const handleNext = async () => {
    // Validar step atual
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;

    // Apenas avançar para o próximo step
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCreateWorkspace = async (n8nData: any) => {
    if (!userId) {
      toast.error("Erro de autenticação", {
        description: "Usuário não autenticado. Faça login para continuar.",
      });
      return null;
    }

    setIsCreating(true);
    const loadingToast = toast.loading("Criando workspace no sistema...");

    try {
      // Preparar dados do workspace
      const workspaceData: Omit<Agent, "id" | "createdAt" | "totalMessages" | "confirmedAppointments"> = {
        name: formData.name,
        status: formData.status,
        prompt: formData.prompt,
        description: formData.description,
        webhookDev: formData.webhookDev,
        webhookProd: formData.webhookProd,
        kommoSubdomain: formData.kommoEnabled ? formData.kommoSubdomain : undefined,
        kommoAccessToken: formData.kommoEnabled ? formData.kommoAccessToken : undefined,
        kommodPipelineId: formData.kommoEnabled ? formData.kommodPipelineId : undefined,
        credentialIds: formData.selectedCredentials,
      };

      const result = await createAgent(workspaceData, userId);

      if (result) {
        setCreatedAgentId(result.id);

        toast.success("Workspace criado com sucesso!", {
          id: loadingToast,
          description: "Workspace criado no sistema e integrado com N8N.",
        });

        return result.id;
      } else {
        toast.error("Erro ao criar workspace", {
          id: loadingToast,
          description: "Falha ao criar workspace. Tente novamente.",
        });
        return null;
      }
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error("Erro interno", {
        id: loadingToast,
        description: "Ocorreu um erro ao criar o workspace. Tente novamente.",
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const handleFinish = () => {
    toast.success("Workspace configurado com sucesso!");
    router.push("/workspace");
  };

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
        <h1 className="text-3xl font-bold">Criar Novo Workspace</h1>
        <p className="text-muted-foreground mt-2">
          Configure seu workspace em 3 etapas simples
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
        {currentStep === 3 && (
          <WorkspaceFormStep3
            formData={formData}
            updateFormData={updateFormData}
            userId={userId}
            onWorkspaceCreated={(id) => setCreatedAgentId(id)}
            handleCreateWorkspace={handleCreateWorkspace}
          />
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isCreating}
        >
          Voltar
        </Button>

        {currentStep < steps.length ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isCreating}
          >
            {isCreating ? "Criando..." : currentStep === 2 ? "Criar e Continuar" : "Próximo"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleFinish}
          >
            Finalizar
          </Button>
        )}
      </div>
    </div>
  );
}
