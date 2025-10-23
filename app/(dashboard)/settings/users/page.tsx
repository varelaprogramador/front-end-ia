"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  Search,
  UserPlus,
  Edit,
  Trash2,
  Ban,
  Check,
  RefreshCw,
  Mail,
  Shield,
  ShieldAlert
} from "lucide-react"
import { toast } from "sonner"
import { usersService, type ClerkUser, type InviteUserRequest, type UpdateUserRequest } from "@/lib/users-api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Helper function to extract primary email from user
const getPrimaryEmail = (user: ClerkUser): string => {
  if (!user.emailAddresses || user.emailAddresses.length === 0) return "No email"
  const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)
  return primaryEmail?.emailAddress || user.emailAddresses[0]?.emailAddress || "No email"
}

export default function UsersPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [users, setUsers] = useState<ClerkUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  // Dialogs state
  const [inviteDialog, setInviteDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [metadataDialog, setMetadataDialog] = useState(false)

  const [selectedUser, setSelectedUser] = useState<ClerkUser | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [inviteEmail, setInviteEmail] = useState("")
  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [editPublicMetadata, setEditPublicMetadata] = useState("")
  const [metadataType, setMetadataType] = useState<'public' | 'private'>('public')
  const [metadataJson, setMetadataJson] = useState("")

  // Verificar permissão de admin
  useEffect(() => {
    if (isLoaded && user) {
      const isAdmin = user.publicMetadata?.is_admin === true
      if (!isAdmin) {
        toast.error("Você não tem permissão para acessar esta página")
        router.push("/")
      }
    }
  }, [isLoaded, user, router])

  useEffect(() => {
    loadUsers()
  }, [page, searchQuery])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const response = await usersService.listUsers(page, limit, searchQuery || undefined)
      if (response.success) {
        setUsers(response.data)
        setTotal(response.total)
      }
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Erro ao carregar usuários")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error("Digite um email válido")
      return
    }

    setIsSubmitting(true)
    try {
      const data: InviteUserRequest = {
        emailAddress: inviteEmail,
        redirectUrl: `${window.location.origin}/sign-up`
      }

      const response = await usersService.inviteUser(data)
      if (response.success) {
        toast.success("Convite enviado com sucesso!")
        setInviteDialog(false)
        setInviteEmail("")
        loadUsers()
      } else {
        toast.error(response.message || "Erro ao enviar convite")
      }
    } catch (error) {
      console.error("Error inviting user:", error)
      toast.error("Erro ao enviar convite")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      // Validar JSON do publicMetadata
      let publicMetadata = undefined
      if (editPublicMetadata.trim()) {
        try {
          publicMetadata = JSON.parse(editPublicMetadata)
        } catch (e) {
          toast.error("JSON inválido no Public Metadata")
          setIsSubmitting(false)
          return
        }
      }

      const data: UpdateUserRequest = {
        firstName: editFirstName || undefined,
        lastName: editLastName || undefined,
        publicMetadata: publicMetadata,
      }

      const response = await usersService.updateUser(selectedUser.id, data)
      if (response.success) {
        toast.success("Usuário atualizado com sucesso!")
        setEditDialog(false)
        setSelectedUser(null)
        loadUsers()
      } else {
        toast.error(response.message || "Erro ao atualizar usuário")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error("Erro ao atualizar usuário")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      const response = await usersService.deleteUser(selectedUser.id)
      if (response.success) {
        toast.success("Usuário excluído com sucesso!")
        setDeleteDialog(false)
        setSelectedUser(null)
        loadUsers()
      } else {
        toast.error(response.message || "Erro ao excluir usuário")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Erro ao excluir usuário")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBanToggle = async (user: ClerkUser) => {
    try {
      const response = user.banned
        ? await usersService.unbanUser(user.id)
        : await usersService.banUser(user.id)

      if (response.success) {
        toast.success(user.banned ? "Usuário desbloqueado" : "Usuário bloqueado")
        loadUsers()
      } else {
        toast.error(response.message || "Erro ao alterar status")
      }
    } catch (error) {
      console.error("Error toggling ban:", error)
      toast.error("Erro ao alterar status do usuário")
    }
  }

  const handleUpdateMetadata = async () => {
    if (!selectedUser) return

    try {
      const metadata = JSON.parse(metadataJson)
      const response = await usersService.updateMetadata(
        selectedUser.id,
        metadataType,
        metadata
      )

      if (response.success) {
        toast.success("Metadata atualizada com sucesso!")
        setMetadataDialog(false)
        setSelectedUser(null)
        setMetadataJson("")
        loadUsers()
      } else {
        toast.error(response.message || "Erro ao atualizar metadata")
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error("JSON inválido")
      } else {
        console.error("Error updating metadata:", error)
        toast.error("Erro ao atualizar metadata")
      }
    }
  }

  const openEditDialog = (user: ClerkUser) => {
    setSelectedUser(user)
    setEditFirstName(user.firstName || "")
    setEditLastName(user.lastName || "")
    setEditPublicMetadata(JSON.stringify(user.publicMetadata || {}, null, 2))
    setEditDialog(true)
  }

  const openMetadataDialog = (user: ClerkUser, type: 'public' | 'private') => {
    setSelectedUser(user)
    setMetadataType(type)
    setMetadataJson(JSON.stringify(
      type === 'public' ? user.publicMetadata : user.privateMetadata,
      null,
      2
    ))
    setMetadataDialog(true)
  }

  const openDeleteDialog = (user: ClerkUser) => {
    setSelectedUser(user)
    setDeleteDialog(true)
  }

  const getUserInitials = (user: ClerkUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    const email = getPrimaryEmail(user)
    if (email && email !== "No email") {
      return email.substring(0, 2).toUpperCase()
    }
    return "U"
  }

  const filteredUsers = users

  // Verificar se ainda está carregando
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Carregando...</p>
        </div>
      </div>
    )
  }

  // Verificar se o usuário é admin
  const isAdmin = user?.publicMetadata?.is_admin === true
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página. Apenas administradores podem gerenciar usuários.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/")} variant="outline" className="w-full">
              Voltar para o início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie usuários, convites e permissões do sistema
          </p>
        </div>
        <Button onClick={() => setInviteDialog(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Convidar Usuário
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={loadUsers} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários ({total})</CardTitle>
          <CardDescription>
            Lista de todos os usuários cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground mt-2">Carregando usuários...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground mt-2">Nenhum usuário encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        openEditDialog(user)
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.imageUrl || undefined} />
                            <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : getPrimaryEmail(user)}
                            </p>
                            {user.firstName && user.lastName && (
                              <p className="text-sm text-muted-foreground">{getPrimaryEmail(user)}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getPrimaryEmail(user)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.banned ? (
                            <Badge variant="destructive" className="gap-1">
                              <Ban className="h-3 w-3" />
                              Bloqueado
                            </Badge>
                          ) : (
                            <Badge variant="default" className="gap-1 bg-green-500">
                              <Check className="h-3 w-3" />
                              Ativo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDeleteDialog(user)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir usuário</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total} usuários
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * limit >= total}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Convidar Novo Usuário
            </DialogTitle>
            <DialogDescription>
              Envie um convite por email para um novo usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="usuario@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInvite} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Convite
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Usuário
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Primeiro Nome</Label>
                <Input
                  id="firstName"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="João"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input
                  id="lastName"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Silva"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPublicMetadata">Public Metadata (JSON)</Label>
              <Textarea
                id="editPublicMetadata"
                value={editPublicMetadata}
                onChange={(e) => setEditPublicMetadata(e.target.value)}
                placeholder='{"is_admin": true, "role": "manager"}'
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Formato JSON válido. Exemplo: {`{"is_admin": true}`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Excluir Usuário
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Avatar>
                  <AvatarImage src={selectedUser.imageUrl || undefined} />
                  <AvatarFallback>{getUserInitials(selectedUser)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedUser.firstName && selectedUser.lastName
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : getPrimaryEmail(selectedUser)}
                  </p>
                  <p className="text-sm text-muted-foreground">{getPrimaryEmail(selectedUser)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Metadata Dialog */}
      <Dialog open={metadataDialog} onOpenChange={setMetadataDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Editar Metadata {metadataType === 'public' ? 'Pública' : 'Privada'}
            </DialogTitle>
            <DialogDescription>
              Edite a metadata do usuário em formato JSON
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="metadata">JSON</Label>
              <Textarea
                id="metadata"
                value={metadataJson}
                onChange={(e) => setMetadataJson(e.target.value)}
                placeholder='{"role": "admin", "department": "IT"}'
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Formato JSON válido. Exemplo: {`{"key": "value"}`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMetadataDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateMetadata}>
              <Shield className="h-4 w-4 mr-2" />
              Salvar Metadata
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
