"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info } from "lucide-react";

interface WorkspaceFormData {
  name: string;
  status: "active" | "inactive" | "development";
  prompt: string;
  description: string;
  kommoEnabled: boolean;
  kommoSubdomain: string;
  kommoAccessToken: string;
  kommodPipelineId: string;
  selectedCredentials: string[];
}

interface WorkspaceFormStep1Props {
  formData: WorkspaceFormData;
  updateFormData: (data: Partial<WorkspaceFormData>) => void;
}

export default function WorkspaceFormStep1({ formData, updateFormData }: WorkspaceFormStep1Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Informações Básicas</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure as informações essenciais do workspace
        </p>
      </div>

      <div className="space-y-4">
        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Nome do Workspace <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="Ex: Agente de Vendas"
            required
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">
            Status <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value: "active" | "inactive" | "development") =>
              updateFormData({ status: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="development">Em Desenvolvimento</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Workspaces em desenvolvimento não serão executados automaticamente
          </p>
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="prompt">
            Prompt de Inicialização <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="prompt"
            value={formData.prompt}
            onChange={(e) => updateFormData({ prompt: e.target.value })}
            className="min-h-[120px] resize-y"
            placeholder="Descreva como o agente deve se comportar e quais são suas responsabilidades..."
            required
          />
          <p className="text-xs text-muted-foreground">
            Este prompt será usado como base para todas as interações do agente
          </p>
        </div>

        {/* Descrição (opcional) */}
        <div className="space-y-2">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            className="min-h-[80px] resize-y"
            placeholder="Uma breve descrição sobre o propósito deste workspace..."
          />
        </div>
      </div>

      {/* Dica */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Dica de Configuração
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Seja específico no prompt de inicialização. Quanto mais claro você for sobre o
              comportamento esperado do agente, melhores serão os resultados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
