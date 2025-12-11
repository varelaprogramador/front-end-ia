"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Workflow, ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { Funnel } from "@/lib/funnel-api";
import FunnelFormStep1, { type FunnelFormData } from "./funnel-form-step1";
import FunnelFormStep2 from "./funnel-form-step2";

interface FunnelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funnel?: Funnel | null;
  userId?: string | null;
  onSave: (data: FunnelFormData) => Promise<void>;
}

const STEPS = [
  { id: 1, title: "Informacoes", description: "Nome e descricao" },
  { id: 2, title: "Integracoes", description: "Agente e pipelines" },
];

export function FunnelDialog({
  open,
  onOpenChange,
  funnel,
  userId,
  onSave,
}: FunnelDialogProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FunnelFormData>({
    name: "",
    description: "",
    isActive: true,
    configIaId: null,
    kommoPipelineId: null,
    kommoPipelineName: null,
    kommoStages: [],
    rdstationPipelineId: null,
    rdstationPipelineName: null,
    rdstationOwnerId: null,
    rdstationOwnerName: null,
    rdstationStages: [],
    rdstationDeals: [],
  });

  // Reset form quando abrir/fechar
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      if (funnel) {
        setFormData({
          name: funnel.name,
          description: funnel.description || "",
          isActive: funnel.isActive,
          configIaId: funnel.configIaId || null,
          kommoPipelineId: funnel.kommoPipelineId || null,
          kommoPipelineName: funnel.kommoPipelineName || null,
          kommoStages: [],
          rdstationPipelineId: funnel.rdstationPipelineId || null,
          rdstationPipelineName: funnel.rdstationPipelineName || null,
          rdstationOwnerId: funnel.rdstationOwnerId || null,
          rdstationOwnerName: funnel.rdstationOwnerName || null,
          rdstationStages: [],
          rdstationDeals: [],
        });
      } else {
        setFormData({
          name: "",
          description: "",
          isActive: true,
          configIaId: null,
          kommoPipelineId: null,
          kommoPipelineName: null,
          kommoStages: [],
          rdstationPipelineId: null,
          rdstationPipelineName: null,
          rdstationOwnerId: null,
          rdstationOwnerName: null,
          rdstationStages: [],
          rdstationDeals: [],
        });
      }
    }
  }, [open, funnel]);

  const updateFormData = (data: Partial<FunnelFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Validacao basica
    if (!formData.name.trim()) {
      setCurrentStep(1);
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving funnel:", error);
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = formData.name.trim().length > 0;
  const canProceed = currentStep === 1 ? isStep1Valid : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            {funnel ? "Editar Funil" : "Novo Funil de Vendas"}
          </DialogTitle>
          <DialogDescription>
            {funnel
              ? "Atualize as informacoes do seu funil de vendas."
              : "Crie um novo funil para gerenciar seus leads e oportunidades."}
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de Etapas */}
        <div className="flex items-center justify-center gap-2 py-4 border-b">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (step.id < currentStep || (step.id === 2 && isStep1Valid)) {
                    setCurrentStep(step.id);
                  }
                }}
                disabled={step.id > currentStep && !isStep1Valid}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep > step.id
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-muted text-muted-foreground"
                } ${
                  step.id <= currentStep || (step.id === 2 && isStep1Valid)
                    ? "cursor-pointer hover:opacity-80"
                    : "cursor-not-allowed"
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-medium rounded-full border">
                    {step.id}
                  </span>
                )}
                <span className="hidden sm:inline">{step.title}</span>
              </button>
              {index < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* Conteudo do Step */}
        <div className="flex-1 overflow-y-auto py-4 px-1">
          {currentStep === 1 && (
            <FunnelFormStep1 formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 2 && (
            <FunnelFormStep2
              formData={formData}
              updateFormData={updateFormData}
              userId={userId || null}
            />
          )}
        </div>

        {/* Footer com navegacao */}
        <DialogFooter className="shrink-0 border-t pt-4">
          <div className="flex w-full justify-between">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed || loading}
                >
                  Proximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canProceed || loading}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {funnel ? "Salvar" : "Criar Funil"}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
