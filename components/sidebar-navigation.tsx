"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { getAgents, Agent } from "@/lib/agents-real"
import { useUserId } from "@/lib/use-user-id"
import { systemConfigService, type PublicSystemConfig } from "@/lib/system-config-api"
import {
  Bot,
  ChevronDown,
  ChevronRight,
  Home,
  MessageSquare,
  BarChart3,
  Settings,
  HelpCircle,
  Plus,
  Smartphone,
} from "lucide-react"

export function SidebarNavigation() {
  const pathname = usePathname()
  const userId = useUserId()
  const [isAgentsOpen, setIsAgentsOpen] = useState(true)
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [systemConfig, setSystemConfig] = useState<PublicSystemConfig | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Carregar configurações do sistema (sem autenticação necessária)
        const configResponse = await systemConfigService.getPublicSystemConfig()
        if (configResponse.success && configResponse.data) {
          setSystemConfig(configResponse.data)
        }

        // Carregar agentes se usuário logado
        if (userId) {
          setIsLoading(true)
          const agentsList = await getAgents(userId)
          setAgents(agentsList)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setAgents([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [userId])

  // Detectar mudanças de tema
  useEffect(() => {
    const detectTheme = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }

    // Detectar tema inicial
    detectTheme()

    // Observar mudanças no tema
    const observer = new MutationObserver(() => {
      detectTheme()
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  const isActive = (path: string) => pathname === path || pathname.startsWith(path)

  // Determinar qual logo usar baseado no tema
  const getCurrentLogo = () => {
    if (!systemConfig) return null
    
    // Se há logo específica para modo escuro e estamos no modo escuro, use ela
    if (isDarkMode && systemConfig.logoUrlDark) {
      return systemConfig.logoUrlDark
    }
    
    // Caso contrário, use a logo padrão
    return systemConfig.logoUrl
  }

  const mainNavItems = [
    {
      title: "Workspace",
      href: "/workspace",
      icon: Home,
      description: "Visão geral dos agentes",
    },
    {
      title: "Instâncias",
      href: "/instances",
      icon: Smartphone,
      description: "Gerenciar instâncias Evolution",
    },
    {
      title: "Configurações",
      href: "/settings",
      icon: Settings,
      description: "Configurações do sistema",
    },
  ]

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-full flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          {getCurrentLogo() ? (
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-sidebar-accent flex-shrink-0">
              <img 
                src={getCurrentLogo()!} 
                alt={systemConfig?.systemName || 'Logo'}
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback para ícone padrão se a imagem falhar
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
              <div className="hidden p-2 bg-sidebar-primary rounded-lg">
                <Bot className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
            </div>
          ) : (
            <div className="p-2 bg-sidebar-primary rounded-lg flex-shrink-0">
              <Bot className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sidebar-foreground text-balance truncate">
              {systemConfig?.systemName || 'AI Manager'}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {systemConfig?.systemDescription || 'Sistema de Gestão'}
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {/* Main Navigation */}
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.href}
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10",
                    isActive(item.href) && "bg-sidebar-accent text-sidebar-accent-foreground",
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.title}</span>
                    {/* {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )} */}
                  </Link>
                </Button>
              )
            })}
          </div>

          {/* Agents Section */}
          <div className="pt-4">
            <Collapsible open={isAgentsOpen} onOpenChange={setIsAgentsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 h-8 text-sm font-medium">
                  {isAgentsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span>Meus Agentes</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {isLoading ? "..." : agents.length}
                  </Badge>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-2">
                {isLoading ? (
                  <div className="pl-6 py-2">
                    <p className="text-xs text-muted-foreground">Carregando agentes...</p>
                  </div>
                ) : agents.map((agent) => (
                  <div key={agent.id} className="space-y-1">
                    <Button
                      variant={isActive(`/agent/${agent.id}`) ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-9 pl-6",
                        isActive(`/agent/${agent.id}`) && "bg-sidebar-accent text-sidebar-accent-foreground",
                      )}
                      asChild
                    >
                      <Link href={`/agent/${agent.id}`}>
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className={`w-2 h-2 rounded-full ${agent.status === "active" ? "bg-green-500" : "bg-gray-400"
                              }`}
                          />
                          <span className="text-sm truncate text-balance">{agent.name}</span>
                        </div>
                        <BarChart3 className="h-3 w-3 opacity-60" />
                      </Link>
                    </Button>
                    <Button
                      variant={isActive(`/agent/${agent.id}/chat`) ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-8 pl-8 text-xs",
                        isActive(`/agent/${agent.id}/chat`) && "bg-sidebar-accent text-sidebar-accent-foreground",
                      )}
                      asChild
                    >
                      <Link href={`/agent/${agent.id}/chat`}>
                        <MessageSquare className="h-3 w-3" />
                        <span>Chat</span>
                      </Link>
                    </Button>
                  </div>
                ))}

                {!isLoading && agents.length === 0 && (
                  <div className="pl-6 py-2">
                    <p className="text-xs text-muted-foreground text-pretty">Nenhum agente criado ainda</p>
                  </div>
                )}

                <Button variant="ghost" className="w-full justify-start gap-3 h-8 pl-6 text-xs" asChild>
                  <Link href="/workspace">
                    <Plus className="h-3 w-3" />
                    <span>Novo Agente</span>
                  </Link>
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Button variant="ghost" className="w-full justify-start gap-3 h-9" asChild>
          <Link href="/help">
            <HelpCircle className="h-4 w-4" />
            <span>Ajuda & Suporte</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
