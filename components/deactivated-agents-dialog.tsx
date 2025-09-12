"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, PhoneOff, Phone } from "lucide-react"
import {
  getDeactivatedAgentsByConfig,
  createDeactivatedAgent,
  deleteDeactivatedAgent,
  updateDeactivatedAgent,
  type DeactivatedAgent,
} from "@/lib/deactivated-agents-api"
import type { Agent } from "@/lib/agents-real"

interface DeactivatedAgentsDialogProps {
  agent: Agent
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeactivatedAgentsDialog({
  agent,
  open,
  onOpenChange,
}: DeactivatedAgentsDialogProps) {
  const [deactivatedAgents, setDeactivatedAgents] = useState<DeactivatedAgent[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newPhoneNumber, setNewPhoneNumber] = useState("")
  const [newReason, setNewReason] = useState("")

  // Carregar números desativados quando o dialog abrir
  useEffect(() => {
    if (open && agent.id) {
      loadDeactivatedAgents()
    }
  }, [open, agent.id])

  const loadDeactivatedAgents = async () => {
    setLoading(true)
    try {
      const agents = await getDeactivatedAgentsByConfig(agent.id, true) // apenas ativos
      setDeactivatedAgents(agents)
    } catch (error) {
      console.error("Error loading deactivated agents:", error)
      toast.error("Erro ao carregar números bloqueados")
    } finally {
      setLoading(false)
    }
  }

  const handleAddNumber = async () => {
    if (!newPhoneNumber.trim()) {
      toast.error("Digite um número de telefone")
      return
    }

    // Validação básica do número de telefone
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,20}$/
    if (!phoneRegex.test(newPhoneNumber.trim())) {
      toast.error("Formato de número inválido")
      return
    }

    setSubmitting(true)
    try {
      const newAgent = await createDeactivatedAgent({
        configIAId: agent.id,
        phoneNumber: newPhoneNumber.trim(),
        reason: newReason.trim() || undefined,
        blockedBy: "user", // TODO: usar dados do usuário logado
      })

      if (newAgent) {
        toast.success("Número adicionado à lista de bloqueados")
        setNewPhoneNumber("")
        setNewReason("")
        await loadDeactivatedAgents() // Recarregar lista
      } else {
        toast.error("Erro ao adicionar número à lista")
      }
    } catch (error) {
      console.error("Error creating deactivated agent:", error)
      toast.error("Este número já está na lista ou ocorreu um erro")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus
      const updated = await updateDeactivatedAgent(id, { isActive: newStatus })

      if (updated) {
        toast.success(
          newStatus 
            ? "Número reativado na lista de bloqueados" 
            : "Número desativado da lista de bloqueados"
        )
        await loadDeactivatedAgents()
      } else {
        toast.error("Erro ao alterar status do número")
      }
    } catch (error) {
      console.error("Error toggling agent status:", error)
      toast.error("Erro ao alterar status")
    }
  }

  const handleDeleteNumber = async (id: string) => {
    try {
      const success = await deleteDeactivatedAgent(id)

      if (success) {
        toast.success("Número removido da lista de bloqueados")
        await loadDeactivatedAgents()
      } else {
        toast.error("Erro ao remover número")
      }
    } catch (error) {
      console.error("Error deleting deactivated agent:", error)
      toast.error("Erro ao remover número")
    }
  }

  const formatPhoneNumber = (phone: string) => {
    // Formatação básica para visualização
    if (phone.startsWith("+55")) {
      return phone.replace(/(\+55)(\d{2})(\d{5})(\d{4})/, "$1 ($2) $3-$4")
    }
    return phone
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneOff className="h-5 w-5" />
            Números Bloqueados - {agent.name}
          </DialogTitle>
          <DialogDescription>
            Gerencie os números de telefone que não devem receber respostas deste agente IA.
            Quando uma mensagem chegar de um número bloqueado, o agente não processará nem responderá.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário para adicionar novo número */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold">Adicionar Número à Lista</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phoneNumber">Número de Telefone *</Label>
                <Input
                  id="phoneNumber"
                  placeholder="Ex: +5511999999999 ou 11999999999"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Input
                  id="reason"
                  placeholder="Ex: Solicitação do cliente, spam, etc."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={handleAddNumber} 
              disabled={submitting || !newPhoneNumber.trim()}
              className="w-full md:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar à Lista
                </>
              )}
            </Button>
          </div>

          {/* Lista de números bloqueados */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Números Bloqueados ({deactivatedAgents.length})
              </h3>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>

            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Carregando números bloqueados...</p>
              </div>
            ) : deactivatedAgents.length === 0 ? (
              <div className="text-center py-8">
                <PhoneOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold">Nenhum número bloqueado</p>
                <p className="text-muted-foreground">
                  Adicione números que não devem receber respostas deste agente
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Bloqueado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deactivatedAgents.map((deactivated) => (
                      <TableRow key={deactivated.id}>
                        <TableCell className="font-mono">
                          {formatPhoneNumber(deactivated.phoneNumber)}
                        </TableCell>
                        <TableCell>
                          {deactivated.reason ? (
                            <span className="text-sm text-muted-foreground">
                              {deactivated.reason}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">
                              Sem motivo especificado
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={deactivated.isActive ? "destructive" : "secondary"}>
                            {deactivated.isActive ? "Bloqueado" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(deactivated.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(deactivated.id, deactivated.isActive)}
                            >
                              {deactivated.isActive ? (
                                <>
                                  <Phone className="h-4 w-4 mr-1" />
                                  Reativar
                                </>
                              ) : (
                                <>
                                  <PhoneOff className="h-4 w-4 mr-1" />
                                  Bloquear
                                </>
                              )}
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover número</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja remover o número{" "}
                                    <strong>{formatPhoneNumber(deactivated.phoneNumber)}</strong>{" "}
                                    da lista de bloqueados? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteNumber(deactivated.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}