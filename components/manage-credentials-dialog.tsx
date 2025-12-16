"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Credential } from "@/types/credential";
import { getCredentials } from "@/lib/credentials-api";
import { updateAgent, type Agent } from "@/lib/agents-real";
import { Calendar, MessageSquare, Workflow, Key, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ManageCredentialsDialogProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
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

export function ManageCredentialsDialog({ agent, open, onOpenChange, onSuccess }: ManageCredentialsDialogProps) {
  const { user } = useUser();
  const userId = user?.id;

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredentials, setSelectedCredentials] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && agent && userId) {
      loadCredentials();
      // Inicializar com as credenciais já atribuídas ao agente
      setSelectedCredentials(agent.credentialIds || []);
    }
  }, [open, agent, userId]);

  const loadCredentials = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await getCredentials(userId);
      // Filtrar apenas credenciais ativas
      setCredentials(data.filter((c) => c.isActive));
    } catch (error) {
      console.error("Erro ao carregar credenciais:", error);
      toast.error("Erro ao carregar credenciais", {
        description: "Não foi possível carregar a lista de credenciais.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCredential = (credentialId: string) => {
    setSelectedCredentials((prev) =>
      prev.includes(credentialId)
        ? prev.filter((id) => id !== credentialId)
        : [...prev, credentialId]
    );
  };

  const handleSave = async () => {
    if (!agent) return;

    setSaving(true);
    const loadingToast = toast.loading("Atualizando credenciais...");

    try {
      const result = await updateAgent(agent.id, {
        credentialIds: selectedCredentials,
      });

      if (result) {
        toast.success("Credenciais atualizadas!", {
          id: loadingToast,
          description: `${selectedCredentials.length} credencial(is) vinculada(s) ao workspace.`,
        });

        // Atualizar a lista
        await onSuccess();

        // Fechar dialog
        onOpenChange(false);
      } else {
        toast.error("Erro ao atualizar", {
          id: loadingToast,
          description: "Não foi possível atualizar as credenciais.",
        });
      }
    } catch (error) {
      console.error("Erro ao salvar credenciais:", error);
      toast.error("Erro interno", {
        id: loadingToast,
        description: "Ocorreu um erro ao salvar as credenciais.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Atribuir Credenciais</DialogTitle>
          <DialogDescription>
            Selecione as credenciais que o workspace "{agent.name}" poderá utilizar
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : credentials.length === 0 ? (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-8 border border-yellow-200 dark:border-yellow-800 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-yellow-200 dark:bg-yellow-700 flex items-center justify-center">
                  <Key className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Nenhuma Credencial Disponível
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Você precisa criar credenciais antes de atribuí-las.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {credentials.map((credential) => {
                const Icon = credentialIcons[credential.type] || Key;
                const isSelected = selectedCredentials.includes(credential.id);

                return (
                  <Card
                    key={credential.id}
                    className={`p-4 cursor-pointer transition-all border-2 ${
                      isSelected
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950 dark:border-purple-600"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => handleToggleCredential(credential.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleCredential(credential.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Icon
                            className={`h-4 w-4 ${
                              isSelected ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground"
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              isSelected ? "text-purple-900 dark:text-purple-100" : ""
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

          {/* Resumo */}
          {!loading && credentials.length > 0 && (
            <div className="mt-4 rounded-lg bg-purple-50 dark:bg-purple-950 p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg
                    className="h-5 w-5 text-purple-600 dark:text-purple-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    {selectedCredentials.length === 0
                      ? "Nenhuma credencial selecionada"
                      : `${selectedCredentials.length} credencial(is) selecionada(s)`}
                  </h3>
                  <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
                    {selectedCredentials.length === 0
                      ? "Selecione as credenciais que o workspace usará para se conectar a serviços externos."
                      : "O workspace terá acesso a estas credenciais para realizar integrações."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
