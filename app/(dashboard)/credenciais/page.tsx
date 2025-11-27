"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Key,
  Plus,
  Pencil,
  Trash2,
  TestTube,
  Search,
  Calendar,
  MessageSquare,
  Workflow,
  RefreshCw,
  CheckCircle,
  XCircle,
  Copy,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Credential, CredentialType } from "@/types/credential";
import { CredentialForm } from "@/components/credentials/credential-form";
import { TestCredentialDialog } from "@/components/credentials/test-credential-dialog";
import { ResendCredentialDialog } from "@/components/credentials/resend-credential-dialog";

const credentialTypeLabels: Record<CredentialType, string> = {
  GOOGLE_CALENDAR: "Google Calendar",
  CHATGPT: "ChatGPT",
  N8N: "N8N",
  CUSTOM: "Personalizada",
};

const credentialTypeIcons: Record<CredentialType, any> = {
  GOOGLE_CALENDAR: Calendar,
  CHATGPT: MessageSquare,
  N8N: Workflow,
  CUSTOM: Key,
};

const credentialTypeColors: Record<CredentialType, string> = {
  GOOGLE_CALENDAR: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  CHATGPT: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  N8N: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  CUSTOM: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
};

export default function CredenciaisPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [isResendOpen, setIsResendOpen] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const { getCredentials } = await import("@/lib/credentials-api");
      const data = await getCredentials();
      setCredentials(data);
    } catch (error) {
      toast.error("Erro ao carregar credenciais");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedCredential(null);
    setIsFormOpen(true);
  };

  const handleEdit = (credential: Credential) => {
    setSelectedCredential(credential);
    setIsFormOpen(true);
  };

  const handleTest = (credential: Credential) => {
    setSelectedCredential(credential);
    setIsTestOpen(true);
  };

  const handleDelete = async () => {
    if (!credentialToDelete) return;

    try {
      const { deleteCredential } = await import("@/lib/credentials-api");
      await deleteCredential(credentialToDelete);
      toast.success("Credencial deletada com sucesso");
      fetchCredentials();
    } catch (error) {
      toast.error("Erro ao deletar credencial");
    } finally {
      setCredentialToDelete(null);
    }
  };

  const handleResend = (credential: Credential) => {
    setSelectedCredential(credential);
    setIsResendOpen(true);
  };

  const handleQuickResend = async (credential: Credential) => {
    setResendingId(credential.id);
    try {
      const { resendCredential } = await import("@/lib/credentials-api");
      await resendCredential(credential.id);
      toast.success("Credencial reenviada para N8N com sucesso");
      fetchCredentials();
    } catch (error) {
      toast.error("Erro ao reenviar credencial para N8N");
    } finally {
      setResendingId(null);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada para a área de transferência");
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedCredential(null);
    fetchCredentials();
  };

  const filteredCredentials = credentials.filter((cred) =>
    cred.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    credentialTypeLabels[cred.type].toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Credenciais</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas credenciais de API e integrações
            </p>
          </div>
          <Button onClick={handleCreateNew} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Nova Credencial
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar credenciais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="font-normal">
              {credentials.length} credencial(is)
            </Badge>
            <Badge variant="outline" className="font-normal text-green-600 dark:text-green-400">
              {credentials.filter(c => c.isActive).length} ativa(s)
            </Badge>
          </div>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredCredentials.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "Nenhuma credencial encontrada" : "Nenhuma credencial cadastrada"}
              </h3>
              <p className="text-muted-foreground text-center max-w-sm mb-4">
                {searchTerm
                  ? "Tente buscar por outro termo"
                  : "Comece criando sua primeira credencial para integrar com serviços externos"}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Credencial
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCredentials.map((credential) => {
              const Icon = credentialTypeIcons[credential.type];
              const colorClass = credentialTypeColors[credential.type];

              return (
                <Card
                  key={credential.id}
                  className="group hover:shadow-md transition-all duration-200 hover:border-primary/30"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg border ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold line-clamp-1">
                            {credential.name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            {credentialTypeLabels[credential.type]}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {credential.isActive ? (
                          <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-500/30 bg-green-500/10">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 dark:text-gray-400">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativa
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* URL Info */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>URL do Endpoint</span>
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {credential.method}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                        <code className="text-xs truncate flex-1 text-muted-foreground">
                          {credential.url}
                        </code>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => handleCopyUrl(credential.url)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copiar URL</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* N8N Status */}
                    {credential.id_n8n && (
                      <div className="flex items-center gap-2 text-xs">
                        <Workflow className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-muted-foreground">N8N ID:</span>
                        <code className="text-orange-600 dark:text-orange-400 font-mono">
                          {credential.id_n8n}
                        </code>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleTest(credential)}
                          >
                            <TestTube className="h-3.5 w-3.5 mr-1.5" />
                            Testar
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Testar conexão da credencial</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleQuickResend(credential)}
                            disabled={resendingId === credential.id}
                          >
                            {resendingId === credential.id ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            N8N
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reenviar para N8N</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(credential)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={() => setCredentialToDelete(credential.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Deletar</TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialog de Formulário */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedCredential ? "Editar Credencial" : "Nova Credencial"}
              </DialogTitle>
              <DialogDescription>
                {selectedCredential
                  ? "Atualize as informações da credencial"
                  : "Preencha os dados da nova credencial"}
              </DialogDescription>
            </DialogHeader>
            <CredentialForm
              credential={selectedCredential}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog de Teste */}
        {selectedCredential && (
          <TestCredentialDialog
            credential={selectedCredential}
            open={isTestOpen}
            onOpenChange={setIsTestOpen}
          />
        )}

        {/* Dialog de Reenvio para N8N */}
        {selectedCredential && (
          <ResendCredentialDialog
            credential={selectedCredential}
            open={isResendOpen}
            onOpenChange={setIsResendOpen}
            onSuccess={fetchCredentials}
          />
        )}

        {/* Alert Dialog de Confirmação */}
        <AlertDialog
          open={!!credentialToDelete}
          onOpenChange={() => setCredentialToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar esta credencial? Esta ação não pode
                ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
