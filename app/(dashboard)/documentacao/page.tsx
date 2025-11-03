"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  MessageSquare,
  Bot,
  Settings,
  Users,
  Workflow,
  Briefcase,
  Lock,
  Video,
  Key
} from "lucide-react"

export default function DocumentacaoPage() {
  return (
    <div className="container mx-auto py-6 px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentação do Sistema</h1>
          <p className="text-muted-foreground mt-2">
            Guia completo de todas as funcionalidades e páginas do sistema
          </p>
        </div>
        <FileText className="h-12 w-12 text-muted-foreground" />
      </div>

      <Tabs defaultValue="workspace" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-10">
          <TabsTrigger value="workspace">
            <Briefcase className="h-4 w-4 mr-2" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="agents">
            <Bot className="h-4 w-4 mr-2" />
            Agentes
          </TabsTrigger>
          <TabsTrigger value="config-ia">
            <Workflow className="h-4 w-4 mr-2" />
            Config IA
          </TabsTrigger>
          <TabsTrigger value="instances">
            <MessageSquare className="h-4 w-4 mr-2" />
            Instâncias
          </TabsTrigger>
          <TabsTrigger value="credentials">
            <Key className="h-4 w-4 mr-2" />
            Credenciais
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Config
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="auth">
            <Lock className="h-4 w-4 mr-2" />
            Autenticação
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="videos">
            <Video className="h-4 w-4 mr-2" />
            Vídeos
          </TabsTrigger>
        </TabsList>

        {/* Workspace */}
        <TabsContent value="workspace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Workspace - Página Inicial
              </CardTitle>
              <CardDescription>
                <Badge variant="outline" className="mb-2">Rota: /workspace</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground">
                  Página principal do sistema onde você visualiza todos os seus agentes de IA cadastrados.
                  Esta é a primeira página que aparece após o login.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Funcionalidades</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Visualização de todos os agentes em cards organizados</li>
                  <li>Busca de agentes por nome</li>
                  <li>Filtro por status (Ativo, Inativo, Em Desenvolvimento)</li>
                  <li>Botão para criar novo agente</li>
                  <li>Acesso rápido ao chat com cada agente</li>
                  <li>Visualização do status de cada agente com badges coloridos</li>
                  <li>Edição rápida das informações do agente</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Como Usar</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Use a barra de busca para encontrar agentes específicos</li>
                  <li>Filtre por status usando o seletor de status</li>
                  <li>Clique em "Novo Agente" para criar um agente</li>
                  <li>Clique em "Abrir Chat" em qualquer card para conversar com o agente</li>
                  <li>Clique nos três pontos para editar ou excluir um agente</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agentes */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Agentes de IA
              </CardTitle>
              <CardDescription>
                <Badge variant="outline" className="mb-2">Rota: /agent/[id]</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground">
                  Página de detalhes de um agente específico, mostrando todas as informações e configurações.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Informações do Agente</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li><strong>Nome:</strong> Identificação do agente</li>
                  <li><strong>Status:</strong> Ativo, Inativo ou Em Desenvolvimento</li>
                  <li><strong>Webhooks:</strong> URLs de desenvolvimento e produção</li>
                  <li><strong>Prompt:</strong> Instruções de comportamento do agente</li>
                  <li><strong>Descrição:</strong> Informações adicionais sobre o agente</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Integração Kommo (Opcional)</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li><strong>Subdomínio:</strong> Seu subdomínio do Kommo CRM</li>
                  <li><strong>Access Token:</strong> Chave de API do Kommo</li>
                  <li><strong>Pipeline:</strong> Funil de vendas onde o agente irá operar</li>
                  <li>Clique em "Verificar Credenciais" para validar a integração</li>
                  <li>Após verificação, selecione o pipeline desejado</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Como Criar/Editar</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Preencha o nome do agente</li>
                  <li>Configure as URLs de webhook (dev e prod)</li>
                  <li>Escreva o prompt de inicialização</li>
                  <li>Selecione o status apropriado</li>
                  <li>Opcionalmente, configure a integração com Kommo</li>
                  <li>Clique em "Criar Agente" ou "Atualizar"</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Config IA */}
        <TabsContent value="config-ia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Configurações de IA
              </CardTitle>
              <CardDescription>
                <Badge variant="outline" className="mb-2">Rota: /config-ia</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground">
                  Gerenciamento de configurações de IA que definem como os agentes se comportam e interagem
                  com as instâncias do Evolution.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Funcionalidades</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Criar novas configurações de IA</li>
                  <li>Editar configurações existentes</li>
                  <li>Atribuir/desatribuir instâncias do Evolution</li>
                  <li>Visualizar status de conexão das instâncias</li>
                  <li>Buscar configurações por nome</li>
                  <li>Filtrar por status (Ativa/Inativa)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Campos da Configuração</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li><strong>Nome:</strong> Identificação da configuração</li>
                  <li><strong>Tipo de IA:</strong> Modelo de IA a ser utilizado</li>
                  <li><strong>Temperatura:</strong> Controla criatividade das respostas (0-1)</li>
                  <li><strong>Max Tokens:</strong> Limite de tokens por resposta</li>
                  <li><strong>Status:</strong> Ativa ou Inativa</li>
                  <li><strong>Instâncias Evolution:</strong> WhatsApp conectados</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Gerenciar Instâncias</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Clique no ícone de configuração na linha da Config IA</li>
                  <li>Veja as instâncias atualmente atribuídas</li>
                  <li>Selecione novas instâncias disponíveis</li>
                  <li>Clique em "Atribuir Selecionadas" para adicionar</li>
                  <li>Ou selecione instâncias atribuídas e clique em "Desatribuir"</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instâncias */}
        <TabsContent value="instances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Instâncias Evolution
              </CardTitle>
              <CardDescription>
                <Badge variant="outline" className="mb-2">Rota: /instances</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground">
                  Gerenciamento de instâncias do Evolution API - conexões WhatsApp que podem ser
                  controladas pelos agentes de IA.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Funcionalidades</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Visualizar todas as instâncias cadastradas</li>
                  <li>Ver status de conexão em tempo real</li>
                  <li>Criar novas instâncias</li>
                  <li>Editar configurações de instâncias</li>
                  <li>Excluir instâncias</li>
                  <li>Buscar por nome de instância</li>
                  <li>Filtrar por status de conexão</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Status de Conexão</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li><Badge variant="outline" className="bg-green-100 text-green-800">CONNECTED</Badge> - Conectado e funcionando</li>
                  <li><Badge variant="outline" className="bg-yellow-100 text-yellow-800">CONNECTING</Badge> - Conectando ao WhatsApp</li>
                  <li><Badge variant="outline" className="bg-red-100 text-red-800">ERROR</Badge> - Erro na conexão</li>
                  <li><Badge variant="outline" className="bg-gray-100 text-gray-800">DISCONNECTED</Badge> - Desconectado</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Campos da Instância</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li><strong>Nome da Instância:</strong> Identificador único</li>
                  <li><strong>Nome de Exibição:</strong> Nome amigável</li>
                  <li><strong>Estado de Conexão:</strong> Status atual da conexão</li>
                  <li><strong>Config IA:</strong> Configuração de IA atribuída (se houver)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                <Badge variant="outline" className="mb-2">Rota: /settings</Badge>
                <Badge variant="destructive" className="mb-2 ml-2">Requer Permissão Admin</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground">
                  Página de configurações gerais do sistema. Acesso restrito apenas para usuários com
                  permissão de administrador (is_admin: true no publicMetadata).
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Configurações Disponíveis</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li><strong>Nome do Sistema:</strong> Nome exibido no cabeçalho</li>
                  <li><strong>Logo URL:</strong> URL da logo do sistema</li>
                  <li><strong>Favicon URL:</strong> URL do ícone do navegador</li>
                  <li><strong>Cor Primária:</strong> Cor principal do tema</li>
                  <li><strong>Email de Contato:</strong> Email para suporte</li>
                  <li><strong>Timezone:</strong> Fuso horário do sistema</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Permissão de Acesso</h3>
                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-4 rounded-md">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>⚠️ Importante:</strong> Esta página só pode ser acessada por usuários
                    com a permissão is_admin definida como true no publicMetadata.
                    Usuários sem permissão serão redirecionados automaticamente.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Como Usar</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Verifique se você tem permissão de administrador</li>
                  <li>Altere as configurações desejadas</li>
                  <li>Clique em "Salvar Configurações"</li>
                  <li>As mudanças serão aplicadas imediatamente no sistema</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gerenciamento de Usuários
              </CardTitle>
              <CardDescription>
                <Badge variant="outline" className="mb-2">Rota: /settings/users</Badge>
                <Badge variant="destructive" className="mb-2 ml-2">Requer Permissão Admin</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground">
                  Gerenciamento completo de usuários do sistema. Permite visualizar, editar e excluir
                  usuários. Acesso restrito apenas para administradores.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Funcionalidades</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Visualizar todos os usuários cadastrados</li>
                  <li>Buscar usuários por nome ou email</li>
                  <li>Editar nome e metadados públicos dos usuários</li>
                  <li>Excluir usuários do sistema</li>
                  <li>Ver status de verificação de email</li>
                  <li>Gerenciar permissões através do publicMetadata</li>
                  <li>Clicar na linha para edição rápida</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Informações do Usuário</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li><strong>Nome:</strong> Primeiro e último nome</li>
                  <li><strong>Email:</strong> Endereço de email principal</li>
                  <li><strong>Status Email:</strong> Verificado ou não verificado</li>
                  <li><strong>Public Metadata:</strong> JSON com dados públicos e permissões</li>
                  <li><strong>Data de Criação:</strong> Quando o usuário foi criado</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Public Metadata - Permissões</h3>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-md space-y-2">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    O campo publicMetadata é um JSON que pode conter permissões e dados adicionais:
                  </p>
                  <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded border">
                    {`{
  "is_admin": true,
  "role": "administrator",
  "department": "IT"
}`}
                  </pre>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>is_admin: true</strong> concede acesso às páginas de configuração.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Como Editar um Usuário</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Clique na linha do usuário ou no botão de editar</li>
                  <li>Altere o primeiro nome e/ou último nome</li>
                  <li>Edite o publicMetadata (deve ser um JSON válido)</li>
                  <li>Clique em "Salvar" para aplicar as mudanças</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Como Excluir um Usuário</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Clique no ícone da lixeira na linha do usuário</li>
                  <li>Confirme a exclusão no diálogo</li>
                  <li>O usuário será permanentemente removido do sistema</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auth */}
        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Autenticação
              </CardTitle>
              <CardDescription>
                <Badge variant="outline" className="mb-2">Rotas: /sign-in e /sign-up</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground">
                  Sistema de autenticação gerenciado pelo Clerk. Permite login e cadastro de novos usuários
                  de forma segura.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Login (/sign-in)</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Login com email e senha</li>
                  <li>Login social (Google, GitHub, etc)</li>
                  <li>Recuperação de senha</li>
                  <li>Verificação de email automática</li>
                  <li>Redirecionamento automático após login</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Cadastro (/sign-up)</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Cadastro com email e senha</li>
                  <li>Cadastro social (Google, GitHub, etc)</li>
                  <li>Validação de força da senha</li>
                  <li>Envio automático de email de verificação</li>
                  <li>Criação automática de perfil de usuário</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Segurança</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Senhas criptografadas com bcrypt</li>
                  <li>Proteção contra ataques de força bruta</li>
                  <li>Verificação de email obrigatória</li>
                  <li>Tokens JWT seguros</li>
                  <li>Sessões gerenciadas automaticamente</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Fluxo de Autenticação</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Usuário acessa /sign-in ou /sign-up</li>
                  <li>Preenche credenciais ou usa login social</li>
                  <li>Sistema valida e cria sessão segura</li>
                  <li>Usuário é redirecionado para /workspace</li>
                  <li>Sessão mantida automaticamente</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat com Agente
              </CardTitle>
              <CardDescription>
                <Badge variant="outline" className="mb-2">Rota: /agent/[id]/chat</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground">
                  Interface de chat em tempo real para interagir com os agentes de IA. Cada agente tem
                  seu próprio chat isolado com histórico de conversas.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Funcionalidades</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Conversação em tempo real com o agente</li>
                  <li>Histórico completo de mensagens</li>
                  <li>Envio de mensagens de texto</li>
                  <li>Indicador de digitação do agente</li>
                  <li>Auto-scroll para última mensagem</li>
                  <li>Formatação de markdown nas respostas</li>
                  <li>Timestamp de cada mensagem</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Como Usar o Chat</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Acesse o workspace e selecione um agente</li>
                  <li>Clique em "Abrir Chat"</li>
                  <li>Digite sua mensagem no campo de texto</li>
                  <li>Pressione Enter ou clique no botão enviar</li>
                  <li>Aguarde a resposta do agente</li>
                  <li>Continue a conversa naturalmente</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Comportamento do Agente</h3>
                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-4 rounded-md">
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    O comportamento e personalidade do agente são definidos pelo <strong>Prompt de Inicialização</strong>
                    configurado na criação/edição do agente. Este prompt instrui o agente sobre como
                    responder, qual tom usar e quais tarefas pode executar.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Integração com Kommo</h3>
                <p className="text-sm text-muted-foreground">
                  Se o agente estiver integrado com o Kommo CRM, ele poderá:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Acessar informações de leads</li>
                  <li>Atualizar status no funil de vendas</li>
                  <li>Criar tarefas e lembretes</li>
                  <li>Registrar interações com clientes</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Videos */}
        <TabsContent value="videos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Vídeos Tutoriais
              </CardTitle>
              <CardDescription>
                <Badge variant="secondary" className="mb-2">Em Breve</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="rounded-full bg-primary/10 p-6">
                  <Video className="h-16 w-16 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">Vídeos Tutoriais em Desenvolvimento</h3>
                  <p className="text-muted-foreground max-w-md">
                    Estamos preparando uma série completa de vídeos tutoriais para ajudá-lo a
                    aproveitar ao máximo todas as funcionalidades do sistema.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Criando Seu Primeiro Agente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Aprenda passo a passo como criar e configurar seu primeiro agente de IA,
                      incluindo integração com Kommo CRM.
                    </p>
                    <Badge variant="outline" className="mt-3">Em breve</Badge>
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Workflow className="h-4 w-4" />
                      Configurando IA e Instâncias
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Veja como criar configurações de IA e atribuir instâncias do Evolution
                      para automação completa.
                    </p>
                    <Badge variant="outline" className="mt-3">Em breve</Badge>
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Gerenciando Conversas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Tutorial completo sobre como gerenciar e monitorar conversas dos seus
                      agentes com clientes.
                    </p>
                    <Badge variant="outline" className="mt-3">Em breve</Badge>
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Administração do Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Guia para administradores sobre gerenciamento de usuários, permissões
                      e configurações avançadas.
                    </p>
                    <Badge variant="outline" className="mt-3">Em breve</Badge>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800 p-6 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3">
                    <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                      Enquanto isso, use a documentação escrita
                    </h4>
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      Todas as funcionalidades estão completamente documentadas nas abas acima.
                      Navegue pelas diferentes seções para aprender sobre cada recurso do sistema.
                    </p>
                    <p className="text-sm text-purple-800 dark:text-purple-200 mt-3">
                      <strong>💡 Dica:</strong> Use as abas no topo desta página para encontrar
                      informações detalhadas sobre Workspace, Agentes, Config IA, Instâncias e muito mais!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
