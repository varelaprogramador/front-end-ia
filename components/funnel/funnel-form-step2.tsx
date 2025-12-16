"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bot, Link2, Building2, Info, CheckCircle2, AlertCircle, ListOrdered, Users, DollarSign, User } from "lucide-react";
import { getAgents, type Agent } from "@/lib/agents-real";
import type { FunnelFormData, RDStationStage, KommoStage, RDStationDeal } from "./funnel-form-step1";

interface KommoPipeline {
  id: number;
  name: string;
  sort: number;
  is_main: boolean;
  statuses: Array<{
    id: number;
    name: string;
    sort: number;
    color: string;
  }>;
}

// RD Station CRM v2 API - estrutura de resposta de pipelines
// Documentação: https://developers.rdstation.com/reference/crm-v2-list-pipelines
// A API retorna { data: [...], links: {...} } onde data é um array de pipelines
interface RDStationPipeline {
  id: string;
  name: string;
  order?: number;
  stage_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

// RD Station CRM v2 API - estrutura de resposta de usuários
// Documentação: https://developers.rdstation.com/reference/crm-v2-list-users
interface RDStationUser {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface FunnelFormStep2Props {
  formData: FunnelFormData;
  updateFormData: (data: Partial<FunnelFormData>) => void;
  userId: string | null;
}

export default function FunnelFormStep2({
  formData,
  updateFormData,
  userId,
}: FunnelFormStep2Props) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Pipelines
  const [kommoPipelines, setKommoPipelines] = useState<KommoPipeline[]>([]);
  const [rdstationPipelines, setRdstationPipelines] = useState<RDStationPipeline[]>([]);
  const [loadingKommoPipelines, setLoadingKommoPipelines] = useState(false);
  const [loadingRdstationPipelines, setLoadingRdstationPipelines] = useState(false);

  // Stages do RD Station
  const [loadingRdstationStages, setLoadingRdstationStages] = useState(false);
  const [rdstationStagesError, setRdstationStagesError] = useState<string | null>(null);

  // Deals do RD Station
  const [loadingRdstationDeals, setLoadingRdstationDeals] = useState(false);
  const [rdstationDealsError, setRdstationDealsError] = useState<string | null>(null);

  // Usuários do RD Station
  const [rdstationUsers, setRdstationUsers] = useState<RDStationUser[]>([]);
  const [loadingRdstationUsers, setLoadingRdstationUsers] = useState(false);
  const [rdstationUsersError, setRdstationUsersError] = useState<string | null>(null);

  // Erros
  const [kommoError, setKommoError] = useState<string | null>(null);
  const [rdstationError, setRdstationError] = useState<string | null>(null);

  // Carregar lista de agentes
  useEffect(() => {
    const loadAgents = async () => {
      if (!userId) return;
      setLoadingAgents(true);
      try {
        const agentsList = await getAgents(userId);
        setAgents(agentsList);
      } catch (error) {
        console.error("Error loading agents:", error);
      } finally {
        setLoadingAgents(false);
      }
    };
    loadAgents();
  }, [userId]);

  // Atualizar agente selecionado quando mudar
  useEffect(() => {
    if (formData.configIaId) {
      const agent = agents.find((a) => a.id === formData.configIaId);
      console.log("🔍 Agente selecionado:", agent);
      console.log("🔍 RD Station dados:", {
        clientId: agent?.rdstationClientId,
        clientSecret: agent?.rdstationClientSecret ? "***" : null,
        accessToken: agent?.rdstationAccessToken ? "***" : null,
        code: agent?.rdstationCode,
      });
      setSelectedAgent(agent || null);
    } else {
      setSelectedAgent(null);
    }
  }, [formData.configIaId, agents]);

  // Carregar pipelines do Kommo quando agente for selecionado
  // Usando POST /kommo/verify (mesmo método do workspace)
  useEffect(() => {
    const loadKommoPipelines = async () => {
      if (!selectedAgent?.kommoSubdomain || !selectedAgent?.kommoAccessToken) {
        setKommoPipelines([]);
        return;
      }

      setLoadingKommoPipelines(true);
      setKommoError(null);
      try {
        // Usar POST /kommo/verify com body (igual ao workspace)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/kommo/verify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              subdomain: selectedAgent.kommoSubdomain,
              accessToken: selectedAgent.kommoAccessToken,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Erro ao carregar pipelines do Kommo");
        }

        const responseData = await response.json();
        console.log("🔍 [Kommo Pipelines] Response data:", responseData);

        // Backend retorna: { success: true, data: { _embedded: { pipelines: [...] } } }
        const pipelines = responseData.data?._embedded?.pipelines || [];

        // Mapear pipelines para incluir statuses (etapas)
        const mappedPipelines: KommoPipeline[] = pipelines.map((p: any) => ({
          id: p.id,
          name: p.name,
          sort: p.sort,
          is_main: p.is_main,
          statuses: p._embedded?.statuses || [],
        }));

        console.log("🔍 [Kommo Pipelines] Parsed pipelines:", mappedPipelines);
        setKommoPipelines(mappedPipelines);
      } catch (error: any) {
        console.error("Error loading Kommo pipelines:", error);
        setKommoError(error.message || "Erro ao carregar pipelines");
        setKommoPipelines([]);
      } finally {
        setLoadingKommoPipelines(false);
      }
    };

    loadKommoPipelines();
  }, [selectedAgent]);

  // Carregar pipelines do RD Station quando agente for selecionado
  // Tenta carregar se tem accessToken OU se tem credenciais + code (backend fara o token exchange)
  useEffect(() => {
    const loadRdstationPipelines = async () => {
      const hasToken = !!selectedAgent?.rdstationAccessToken;
      const hasCredentialsAndCode = !!selectedAgent?.rdstationClientId &&
                                    !!selectedAgent?.rdstationClientSecret &&
                                    !!selectedAgent?.rdstationCode;

      if (!hasToken && !hasCredentialsAndCode) {
        setRdstationPipelines([]);
        return;
      }

      setLoadingRdstationPipelines(true);
      setRdstationError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/oauth/rdstation/pipelines/${selectedAgent.id}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Erro ao carregar pipelines do RD Station");
        }

        const responseData = await response.json();
        console.log("🔍 [RD Station Pipelines] Response data:", responseData);

        // Estrutura da resposta:
        // Backend retorna: { success: true, data: <resposta_rd_station> }
        // RD Station retorna: { data: [...], links: {...} }
        // Então o array de pipelines está em: responseData.data.data
        let pipelines: RDStationPipeline[] = [];

        if (responseData.data?.data && Array.isArray(responseData.data.data)) {
          // Backend wrapper + RD Station response format
          pipelines = responseData.data.data;
        } else if (Array.isArray(responseData.data)) {
          // Backend wrapper com array direto (fallback)
          pipelines = responseData.data;
        } else if (Array.isArray(responseData)) {
          // Array diretamente (fallback)
          pipelines = responseData;
        }

        console.log("🔍 [RD Station Pipelines] Parsed pipelines:", pipelines);
        setRdstationPipelines(pipelines);
      } catch (error: any) {
        console.error("Error loading RD Station pipelines:", error);
        setRdstationError(error.message || "Erro ao carregar pipelines");
        setRdstationPipelines([]);
      } finally {
        setLoadingRdstationPipelines(false);
      }
    };

    loadRdstationPipelines();
  }, [selectedAgent]);

  // Carregar stages do RD Station quando pipeline for selecionado
  useEffect(() => {
    const loadRdstationStages = async () => {
      if (!formData.rdstationPipelineId || !selectedAgent?.id) {
        updateFormData({ rdstationStages: [] });
        return;
      }

      setLoadingRdstationStages(true);
      setRdstationStagesError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/oauth/rdstation/pipelines/${formData.rdstationPipelineId}/stages/${selectedAgent.id}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Erro ao carregar etapas do RD Station");
        }

        const responseData = await response.json();
        console.log("🔍 [RD Station Stages] Response data:", responseData);

        // Estrutura da resposta:
        // Backend retorna: { success: true, data: <resposta_rd_station> }
        // RD Station retorna: { data: [...], links: {...} }
        let stages: RDStationStage[] = [];

        if (responseData.data?.data && Array.isArray(responseData.data.data)) {
          stages = responseData.data.data;
        } else if (Array.isArray(responseData.data)) {
          stages = responseData.data;
        } else if (Array.isArray(responseData)) {
          stages = responseData;
        }

        console.log("🔍 [RD Station Stages] Parsed stages:", stages);
        updateFormData({ rdstationStages: stages });
      } catch (error: any) {
        console.error("Error loading RD Station stages:", error);
        setRdstationStagesError(error.message || "Erro ao carregar etapas");
        updateFormData({ rdstationStages: [] });
      } finally {
        setLoadingRdstationStages(false);
      }
    };

    loadRdstationStages();
  }, [formData.rdstationPipelineId, selectedAgent?.id]);

  // Carregar usuários do RD Station quando pipeline for selecionado
  useEffect(() => {
    const loadRdstationUsers = async () => {
      if (!formData.rdstationPipelineId || !selectedAgent?.id) {
        setRdstationUsers([]);
        return;
      }

      setLoadingRdstationUsers(true);
      setRdstationUsersError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/oauth/rdstation/users/${selectedAgent.id}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Erro ao carregar usuários do RD Station");
        }

        const responseData = await response.json();
        console.log("🔍 [RD Station Users] Response data:", responseData);

        // Estrutura da resposta:
        // Backend retorna: { success: true, data: <resposta_rd_station> }
        // RD Station retorna: { data: [...], links: {...} }
        let users: RDStationUser[] = [];

        if (responseData.data?.data && Array.isArray(responseData.data.data)) {
          users = responseData.data.data;
        } else if (responseData.data?.users && Array.isArray(responseData.data.users)) {
          users = responseData.data.users;
        } else if (Array.isArray(responseData.data)) {
          users = responseData.data;
        } else if (Array.isArray(responseData)) {
          users = responseData;
        }

        console.log("🔍 [RD Station Users] Parsed users:", users);
        setRdstationUsers(users);
      } catch (error: any) {
        console.error("Error loading RD Station users:", error);
        setRdstationUsersError(error.message || "Erro ao carregar usuários");
        setRdstationUsers([]);
      } finally {
        setLoadingRdstationUsers(false);
      }
    };

    loadRdstationUsers();
  }, [formData.rdstationPipelineId, selectedAgent?.id]);

  // Carregar deals do RD Station quando pipeline e stages forem carregados
  useEffect(() => {
    const loadRdstationDeals = async () => {
      if (!formData.rdstationPipelineId || !selectedAgent?.id || formData.rdstationStages.length === 0) {
        updateFormData({ rdstationDeals: [] });
        return;
      }

      setLoadingRdstationDeals(true);
      setRdstationDealsError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/oauth/rdstation/pipelines/${formData.rdstationPipelineId}/deals/${selectedAgent.id}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Erro ao carregar negociações do RD Station");
        }

        const responseData = await response.json();
        console.log("🔍 [RD Station Deals] Response data:", responseData);

        // Estrutura da resposta:
        // Backend retorna: { success: true, data: { deals: [...], total, pages } }
        // Ou formato antigo: { success: true, data: { data: [...] } }
        let deals: RDStationDeal[] = [];

        if (responseData.data?.deals && Array.isArray(responseData.data.deals)) {
          // Nova estrutura com paginacao completa
          deals = responseData.data.deals;
        } else if (responseData.data?.data && Array.isArray(responseData.data.data)) {
          // Estrutura antiga do RD Station
          deals = responseData.data.data;
        } else if (Array.isArray(responseData.data)) {
          deals = responseData.data;
        } else if (Array.isArray(responseData)) {
          deals = responseData;
        }

        console.log("🔍 [RD Station Deals] Parsed deals:", deals);
        updateFormData({ rdstationDeals: deals });
      } catch (error: any) {
        console.error("Error loading RD Station deals:", error);
        setRdstationDealsError(error.message || "Erro ao carregar negociações");
        updateFormData({ rdstationDeals: [] });
      } finally {
        setLoadingRdstationDeals(false);
      }
    };

    loadRdstationDeals();
  }, [formData.rdstationPipelineId, formData.rdstationStages, selectedAgent?.id]);

  // Carregar stages do Kommo quando pipeline for selecionado
  useEffect(() => {
    if (!formData.kommoPipelineId) {
      updateFormData({ kommoStages: [] });
      return;
    }

    // Os stages do Kommo já vem junto com o pipeline (statuses)
    const selectedPipeline = kommoPipelines.find(
      (p) => String(p.id) === formData.kommoPipelineId
    );

    if (selectedPipeline?.statuses) {
      const stages: KommoStage[] = selectedPipeline.statuses.map((s) => ({
        id: s.id,
        name: s.name,
        sort: s.sort,
        color: s.color,
      }));
      console.log("🔍 [Kommo Stages] Parsed stages:", stages);
      updateFormData({ kommoStages: stages });
    } else {
      updateFormData({ kommoStages: [] });
    }
  }, [formData.kommoPipelineId, kommoPipelines]);

  const hasKommoIntegration = selectedAgent?.kommoSubdomain && selectedAgent?.kommoAccessToken;

  // RD Station pode estar em diferentes estados:
  // 1. Totalmente conectado: tem accessToken
  // 2. Parcialmente configurado: tem clientId + clientSecret (pode ou nao ter code)
  // 3. Nao configurado: nao tem clientId nem clientSecret
  const hasRdstationAccessToken = !!selectedAgent?.rdstationAccessToken;
  const hasRdstationCredentials = !!selectedAgent?.rdstationClientId && !!selectedAgent?.rdstationClientSecret;
  const hasRdstationCode = !!selectedAgent?.rdstationCode;

  // Consideramos como "integrado" se tem as credenciais configuradas (pode buscar pipelines se tiver token)
  // ou se tem o code que pode ser trocado por token
  const hasRdstationIntegration = hasRdstationAccessToken || (hasRdstationCredentials && hasRdstationCode);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Link2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium">Vincular Integracoes</h3>
          <p className="text-sm text-muted-foreground">
            Conecte este funil a um agente e sincronize com CRMs externos
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Selecao de Agente */}
        <div className="space-y-2">
          <Label htmlFor="configIaId" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Vincular a um Agente
          </Label>
          <Select
            value={formData.configIaId || "none"}
            onValueChange={(value) => {
              updateFormData({
                configIaId: value === "none" ? null : value,
                // Limpar pipelines e stages ao trocar de agente
                kommoPipelineId: null,
                kommoPipelineName: null,
                kommoStages: [],
                rdstationPipelineId: null,
                rdstationPipelineName: null,
                rdstationOwnerId: null,
                rdstationOwnerName: null,
                rdstationStages: [],
              });
            }}
            disabled={loadingAgents}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={loadingAgents ? "Carregando agentes..." : "Selecione um agente"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">Nenhum agente vinculado</span>
              </SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span>{agent.name}</span>
                    <div className="flex gap-1 ml-2">
                      {agent.kommoSubdomain && (
                        <Badge variant="outline" className="text-xs">
                          Kommo
                        </Badge>
                      )}
                      {agent.rdstationAccessToken && (
                        <Badge variant="outline" className="text-xs">
                          RD Station
                        </Badge>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Selecione um agente para acessar suas integracoes com CRMs
          </p>
        </div>

        {/* Mostrar integracoes disponiveis do agente selecionado */}
        {selectedAgent && (
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Integracoes do Agente</h4>
              <Badge variant="secondary">{selectedAgent.name}</Badge>
            </div>

            {/* Status das integracoes */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`p-3 rounded-lg border ${
                  hasKommoIntegration
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {hasKommoIntegration ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium">Kommo CRM</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasKommoIntegration ? "Conectado" : "Nao configurado"}
                </p>
              </div>

              <div
                className={`p-3 rounded-lg border ${
                  hasRdstationAccessToken
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    : hasRdstationIntegration
                    ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
                    : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {hasRdstationAccessToken ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : hasRdstationIntegration ? (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium">RD Station CRM</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasRdstationAccessToken
                    ? "Conectado"
                    : hasRdstationIntegration
                    ? "Aguardando autorizacao"
                    : hasRdstationCredentials
                    ? "Credenciais configuradas"
                    : "Nao configurado"}
                </p>
              </div>
            </div>

            {/* Selecao de Pipeline Kommo */}
            {hasKommoIntegration && (
              <div className="space-y-3 pt-2 border-t">
                <Label htmlFor="kommoPipeline" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Pipeline do Kommo
                </Label>
                {loadingKommoPipelines ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando pipelines...
                  </div>
                ) : kommoError ? (
                  <div className="text-sm text-red-600 py-2">{kommoError}</div>
                ) : (
                  <>
                    <Select
                      value={formData.kommoPipelineId || "none"}
                      onValueChange={(value) => {
                        if (value === "none") {
                          updateFormData({
                            kommoPipelineId: null,
                            kommoPipelineName: null,
                            kommoStages: [],
                          });
                        } else {
                          const pipeline = kommoPipelines.find((p) => String(p.id) === value);
                          updateFormData({
                            kommoPipelineId: value,
                            kommoPipelineName: pipeline?.name || null,
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um pipeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">Nenhum pipeline vinculado</span>
                        </SelectItem>
                        {kommoPipelines.map((pipeline) => (
                          <SelectItem key={pipeline.id} value={String(pipeline.id)}>
                            <div className="flex items-center gap-2">
                              <span>{pipeline.name}</span>
                              {pipeline.is_main && (
                                <Badge variant="secondary" className="text-xs">
                                  Principal
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Mostrar etapas do Kommo */}
                    {formData.kommoStages && formData.kommoStages.length > 0 && (
                      <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                          <ListOrdered className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Etapas do Pipeline ({formData.kommoStages.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.kommoStages
                            .sort((a, b) => a.sort - b.sort)
                            .map((stage, index) => (
                              <Badge
                                key={stage.id}
                                variant="outline"
                                className="text-xs"
                                style={{
                                  borderColor: stage.color,
                                  backgroundColor: `${stage.color}20`,
                                }}
                              >
                                {index + 1}. {stage.name}
                              </Badge>
                            ))}
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                          O funil sera criado com estas etapas sincronizadas do Kommo
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Selecao de Pipeline RD Station */}
            {hasRdstationIntegration && (
              <div className="space-y-3 pt-2 border-t">
                <Label htmlFor="rdstationPipeline" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-orange-600" />
                  Pipeline do RD Station CRM
                </Label>
                {loadingRdstationPipelines ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando pipelines...
                  </div>
                ) : rdstationError ? (
                  <div className="text-sm text-red-600 py-2">{rdstationError}</div>
                ) : (
                  <>
                    <Select
                      value={formData.rdstationPipelineId || "none"}
                      onValueChange={(value) => {
                        if (value === "none") {
                          updateFormData({
                            rdstationPipelineId: null,
                            rdstationPipelineName: null,
                            rdstationOwnerId: null,
                            rdstationOwnerName: null,
                            rdstationStages: [],
                          });
                        } else {
                          const pipeline = rdstationPipelines.find((p) => p.id === value);
                          updateFormData({
                            rdstationPipelineId: value,
                            rdstationPipelineName: pipeline?.name || null,
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um pipeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">Nenhum pipeline vinculado</span>
                        </SelectItem>
                        {rdstationPipelines
                          .filter((pipeline) => pipeline.id) // Filtrar pipelines sem ID
                          .map((pipeline) => (
                            <SelectItem key={pipeline.id} value={pipeline.id}>
                              {pipeline.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    {/* Mostrar etapas do RD Station */}
                    {loadingRdstationStages ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando etapas...
                      </div>
                    ) : rdstationStagesError ? (
                      <div className="text-sm text-red-600 py-2">{rdstationStagesError}</div>
                    ) : formData.rdstationStages && formData.rdstationStages.length > 0 ? (
                      <div className="mt-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-2 mb-2">
                          <ListOrdered className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                            Etapas do Pipeline ({formData.rdstationStages.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.rdstationStages
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .map((stage, index) => (
                              <Badge
                                key={stage.id}
                                variant="outline"
                                className="text-xs border-orange-300 bg-orange-100/50 dark:bg-orange-900/30"
                              >
                                {index + 1}. {stage.name}
                              </Badge>
                            ))}
                        </div>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                          O funil sera criado com estas etapas sincronizadas do RD Station
                        </p>
                      </div>
                    ) : null}

                    {/* Seleção de usuário responsável do RD Station */}
                    {formData.rdstationPipelineId && (
                      <div className="mt-3 space-y-2">
                        <Label htmlFor="rdstationUser" className="flex items-center gap-2">
                          <User className="h-4 w-4 text-orange-600" />
                          Usuário Responsável <span className="text-red-500">*</span>
                        </Label>
                        {loadingRdstationUsers ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando usuários...
                          </div>
                        ) : rdstationUsersError ? (
                          <div className="text-sm text-red-600 py-2">{rdstationUsersError}</div>
                        ) : (
                          <>
                            <Select
                              value={formData.rdstationOwnerId || "none"}
                              onValueChange={(value) => {
                                if (value === "none") {
                                  updateFormData({
                                    rdstationOwnerId: null,
                                    rdstationOwnerName: null,
                                  });
                                } else {
                                  const user = rdstationUsers.find((u) => u.id === value);
                                  updateFormData({
                                    rdstationOwnerId: value,
                                    rdstationOwnerName: user?.name || null,
                                  });
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um usuário" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  <span className="text-muted-foreground">Selecione um usuário</span>
                                </SelectItem>
                                {rdstationUsers
                                  .filter((user) => user.id)
                                  .map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>{user.name}</span>
                                        {user.email && (
                                          <span className="text-xs text-muted-foreground">
                                            ({user.email})
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Este usuário será definido como responsável pelos deals criados no RD Station
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    {/* Mostrar negociações do RD Station */}
                    {loadingRdstationDeals ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando negociações...
                      </div>
                    ) : rdstationDealsError ? (
                      <div className="text-sm text-red-600 py-2">{rdstationDealsError}</div>
                    ) : formData.rdstationDeals && formData.rdstationDeals.length > 0 ? (
                      <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900 dark:text-green-100">
                            Negociações a Importar ({formData.rdstationDeals.length})
                          </span>
                        </div>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {formData.rdstationDeals.map((deal) => {
                            // Encontrar o nome da etapa do deal
                            const stage = formData.rdstationStages.find((s) => s.id === deal.stage_id);
                            return (
                              <div
                                key={deal.id}
                                className="flex items-center justify-between p-2 rounded bg-white dark:bg-gray-800 border border-green-100 dark:border-green-900"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{deal.name}</span>
                                  {stage && (
                                    <Badge variant="outline" className="text-xs">
                                      {stage.nickname || stage.name}
                                    </Badge>
                                  )}
                                  {deal.status === "won" && (
                                    <Badge className="text-xs bg-green-500">Ganho</Badge>
                                  )}
                                  {deal.status === "lost" && (
                                    <Badge className="text-xs bg-red-500">Perdido</Badge>
                                  )}
                                  {deal.status === "ongoing" && (
                                    <Badge className="text-xs bg-blue-500">Em Andamento</Badge>
                                  )}
                                </div>
                                {deal.total_price !== undefined && deal.total_price > 0 && (
                                  <div className="flex items-center gap-1 text-sm text-green-700 dark:text-green-300">
                                    <DollarSign className="h-3 w-3" />
                                    {deal.total_price.toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                          Estas negociações serão importadas como leads no funil
                        </p>
                      </div>
                    ) : formData.rdstationStages.length > 0 ? (
                      <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-muted-foreground">
                            Nenhuma negociação encontrada neste pipeline
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            )}

            {/* Mensagem se nenhuma integracao disponivel */}
            {!hasKommoIntegration && !hasRdstationIntegration && (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/30 p-3 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Este agente nao possui integracoes com CRM configuradas.
                  Edite o agente para adicionar Kommo ou RD Station.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Dica quando nenhum agente selecionado */}
        {!selectedAgent && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Vinculacao Opcional
                </h4>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  Voce pode criar o funil sem vincular a um agente. Os pipelines de CRM
                  ficarao disponiveis quando voce selecionar um agente com integracoes configuradas.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
