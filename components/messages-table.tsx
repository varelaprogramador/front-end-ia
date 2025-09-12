"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { Message } from "@/lib/messages-real"
import { Calendar, MessageCircle } from "lucide-react"

interface MessagesTableProps {
  messages: Message[]
  appointmentMessages: Message[]
}

export function MessagesTable({ messages, appointmentMessages }: MessagesTableProps) {
  const [showOnlyAppointments, setShowOnlyAppointments] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const messagesPerPage = 10

  const displayMessages = showOnlyAppointments ? appointmentMessages : messages
  const totalPages = Math.ceil(displayMessages.length / messagesPerPage)
  const startIndex = (currentPage - 1) * messagesPerPage
  const paginatedMessages = displayMessages.slice(startIndex, startIndex + messagesPerPage)

  const getMessageTypeColor = (type: string) => {
    return type === "input" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
  }

  const getProcessedColor = (processed: boolean) => {
    return processed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-balance">
              <MessageCircle className="h-5 w-5" />
              Mensagens
            </CardTitle>
            <CardDescription className="text-pretty">Histórico completo de conversas do agente</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="appointment-filter" checked={showOnlyAppointments} onCheckedChange={setShowOnlyAppointments} />
            <Label htmlFor="appointment-filter" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Apenas agendamentos
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chat ID</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMessages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {showOnlyAppointments ? "Nenhum agendamento encontrado" : "Nenhuma mensagem encontrada"}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell className="font-mono text-sm">{message.chatId}</TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate text-pretty" title={message.message}>
                        {message.message}
                      </div>
                      {message.hasAppointment && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          Agendamento
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getMessageTypeColor(message.type)}>
                        {message.type === "input" ? "Recebida" : "Enviada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {message.createdAt.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getProcessedColor(message.processed)}>
                        {message.processed ? "Processada" : "Pendente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(startIndex + messagesPerPage, displayMessages.length)} de{" "}
              {displayMessages.length} mensagens
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
