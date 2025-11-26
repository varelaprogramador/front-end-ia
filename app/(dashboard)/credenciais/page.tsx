"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Key, Plus, MoreVertical, Pencil, Trash2, TestTube, Search, Calendar, MessageSquare, Workflow, RefreshCw } from "lucide-react";
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

export default function CredenciaisPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [isResendOpen, setIsResendOpen] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchCredentials();
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const target = event.target as HTMLElement;
        if (!target.closest('.action-menu-popup') && !target.closest('.action-menu-trigger')) {
          setOpenMenuId(null);
          setMenuPosition(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

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

  const handleOpenMenu = (credentialId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();

    const position = {
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX - 200, // 200px é a largura do menu
    };

    console.log('Opening menu:', { credentialId, position, rect, mounted });

    setMenuPosition(position);
    setOpenMenuId(credentialId);
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
    <div className="container mx-auto py-6 px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credenciais</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas credenciais de API e integrações
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Credencial
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Minhas Credenciais</CardTitle>
              <CardDescription>
                Total de {credentials.length} credencial(is) cadastrada(s)
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar credenciais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredCredentials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "Nenhuma credencial encontrada"
                : "Nenhuma credencial cadastrada. Clique em 'Nova Credencial' para começar."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCredentials.map((credential) => {
                  const Icon = credentialTypeIcons[credential.type];
                  return (
                    <TableRow key={credential.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {credential.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {credentialTypeLabels[credential.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {credential.url}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{credential.method}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={credential.isActive ? "default" : "secondary"}
                        >
                          {credential.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0 action-menu-trigger"
                          onClick={(e) => handleOpenMenu(credential.id, e)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Menu Popup Global (Portal) */}
      {typeof window !== 'undefined' && mounted && openMenuId && menuPosition && createPortal(
        <div
          className="action-menu-popup fixed z-[9999] min-w-[200px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
        >
          <div className="px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
            Ações
          </div>
          <div className="py-1">
            <button
              onClick={() => {
                const credential = credentials.find(c => c.id === openMenuId);
                if (credential) handleTest(credential);
                setOpenMenuId(null);
                setMenuPosition(null);
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Testar
            </button>
            <button
              onClick={() => {
                const credential = credentials.find(c => c.id === openMenuId);
                if (credential) handleResend(credential);
                setOpenMenuId(null);
                setMenuPosition(null);
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reenviar para N8N
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            <button
              onClick={() => {
                const credential = credentials.find(c => c.id === openMenuId);
                if (credential) handleEdit(credential);
                setOpenMenuId(null);
                setMenuPosition(null);
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </button>
            <button
              onClick={() => {
                setCredentialToDelete(openMenuId);
                setOpenMenuId(null);
                setMenuPosition(null);
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
