"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Info, Workflow } from "lucide-react";

// Interface para estágios do RD Station
export interface RDStationStage {
  id: string;
  name: string;
  nickname?: string;
  order?: number;
  created_at?: string;
  updated_at?: string;
}

// Interface para estágios do Kommo
export interface KommoStage {
  id: number;
  name: string;
  sort: number;
  color: string;
}

// Interface para deals do RD Station
// Status do RD Station: won (ganho), lost (perdido), ongoing (em andamento)
export interface RDStationDeal {
  id: string;
  name: string;
  recurrence_price?: number;
  one_time_price?: number;
  total_price?: number;
  expected_close_date?: string | null;
  rating?: number;
  status?: "won" | "lost" | "pending" | "ongoing";
  pipeline_id: string;
  stage_id: string;
  owner_id?: string | null;
  source_id?: string | null;
  organization_id?: string | null;
  contact_ids?: string[];
  custom_fields?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface FunnelFormData {
  name: string;
  description: string;
  isActive: boolean;
  configIaId: string | null;
  kommoPipelineId: string | null;
  kommoPipelineName: string | null;
  kommoStages: KommoStage[];
  rdstationPipelineId: string | null;
  rdstationPipelineName: string | null;
  rdstationOwnerId: string | null;
  rdstationOwnerName: string | null;
  rdstationStages: RDStationStage[];
  rdstationDeals: RDStationDeal[];
}

interface FunnelFormStep1Props {
  formData: FunnelFormData;
  updateFormData: (data: Partial<FunnelFormData>) => void;
}

export default function FunnelFormStep1({ formData, updateFormData }: FunnelFormStep1Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Workflow className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium">Informacoes do Funil</h3>
          <p className="text-sm text-muted-foreground">
            Configure o nome e descricao do seu funil de vendas
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Nome do Funil <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="Ex: Vendas B2B, Captacao de Clientes, Renovacoes..."
            required
          />
          <p className="text-xs text-muted-foreground">
            Escolha um nome que identifique facilmente o objetivo deste funil
          </p>
        </div>

        {/* Descricao */}
        <div className="space-y-2">
          <Label htmlFor="description">Descricao (opcional)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            className="min-h-[100px] resize-y"
            placeholder="Descreva o objetivo deste funil, quais tipos de leads ele vai gerenciar..."
          />
        </div>

        {/* Status Ativo */}
        <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg border">
          <div className="space-y-0.5">
            <Label htmlFor="isActive" className="cursor-pointer font-medium">
              Funil Ativo
            </Label>
            <p className="text-xs text-muted-foreground">
              Funis inativos nao processam follow-ups automaticos
            </p>
          </div>
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => updateFormData({ isActive: checked })}
          />
        </div>
      </div>

      {/* Dica */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Proximo Passo
            </h4>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Na proxima etapa, voce podera vincular este funil a um agente e sincronizar
              com pipelines do Kommo CRM ou RD Station CRM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
