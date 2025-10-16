"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { getAgents, Agent } from "@/lib/agents-real"
import { useUserId } from "@/lib/use-user-id"
import { systemConfigService, type PublicSystemConfig } from "@/lib/system-config-api"
import { useSidebar } from "@/contexts/sidebar-context"
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
  User,
} from "lucide-react"

export function SidebarNavigation() {
  const pathname = usePathname()
  const userId = useUserId()
  const { user } = useUser()
  const { isCollapsed, isMobile } = useSidebar()
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
    return (isDarkMode && systemConfig.logoUrlDark) ? systemConfig.logoUrlDark : systemConfig.logoUrl
  }

  // Componente Logo reutilizável
  const Logo = ({ size = "normal" }: { size?: "normal" | "small" }) => {
    const logoUrl = getCurrentLogo()
    const sizeClass = size === "small" ? "w-8 h-8" : "w-9 h-9"
    const iconSizeClass = size === "small" ? "h-4 w-4" : "h-5 w-5"

    if (logoUrl) {
      return (
        <div className={`${sizeClass} rounded-lg overflow-hidden bg-sidebar-accent flex-shrink-0`}>
          <img
            src={logoUrl}
            alt={systemConfig?.systemName || 'Logo'}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
          <div className="hidden p-2 bg-sidebar-primary rounded-lg">
            <Bot className={`${iconSizeClass} text-sidebar-primary-foreground`} />
          </div>
        </div>
      )
    }

    return (
      <div className={`p-2 bg-sidebar-primary rounded-lg flex-shrink-0 ${sizeClass}`}>
        <Bot className={`${iconSizeClass} text-sidebar-primary-foreground`} />
      </div>
    )
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

  const isCollapsedView = isCollapsed && !isMobile

  return (
    <div className={cn(
      "bg-sidebar border-r border-sidebar-border h-full flex flex-col transition-all duration-300",
      isCollapsedView ? 'w-16' : 'w-64'
    )}>
      {/* Logo/Brand */}
      <div className={cn(
        "border-b border-sidebar-border transition-all",
        isCollapsedView ? 'p-3' : 'p-4'
      )}>
        {isCollapsedView ? (
          // Layout colapsado - logo e theme toggle verticais
          <div className="flex flex-col items-center gap-3">
            <div title={systemConfig?.systemName || 'AI Manager'}>
              <Logo size="small" />
            </div>
            <ThemeToggle />
          </div>
        ) : (
          // Layout expandido - layout horizontal completo
          <div className="flex items-center gap-3">
            <Logo />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sidebar-foreground truncate">
                {systemConfig?.systemName || 'AI Manager'}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {systemConfig?.systemDescription || 'Sistema de Gestão'}
              </p>
            </div>
            <ThemeToggle />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className={cn(
        "flex-1 overflow-y-auto",
        isCollapsedView ? 'p-2' : 'p-3'
      )}>
        <nav className="space-y-1.5">
          {/* Main Navigation */}
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.href}
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={cn(
                    "w-full h-9 transition-all",
                    isCollapsedView ? "justify-center p-0" : "justify-start gap-3",
                    isActive(item.href) && "bg-sidebar-accent text-sidebar-accent-foreground",
                  )}
                  title={isCollapsedView ? item.title : undefined}
                  asChild
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsedView && (
                      <span className="flex-1 text-left text-sm">{item.title}</span>
                    )}
                  </Link>
                </Button>
              )
            })}
          </div>

          {/* Agents Section - Expandido */}
          {!isCollapsedView && (
            <div className="pt-3 border-t border-sidebar-border/50 mt-3">
              <Collapsible open={isAgentsOpen} onOpenChange={setIsAgentsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-2 h-8 text-xs font-medium hover:bg-sidebar-accent">
                    {isAgentsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    <span>Meus Agentes</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">
                      {isLoading ? "..." : agents.length}
                    </Badge>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5 mt-1.5">
                  {isLoading ? (
                    <div className="pl-6 py-2">
                      <p className="text-xs text-muted-foreground">Carregando agentes...</p>
                    </div>
                  ) : agents.map((agent) => (
                    <div key={agent.id} className="space-y-0.5">
                      <Button
                        variant={isActive(`/agent/${agent.id}`) ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-2.5 h-8 pl-5 text-sm hover:bg-sidebar-accent transition-all",
                          isActive(`/agent/${agent.id}`) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                        )}
                        asChild
                      >
                        <Link href={`/agent/${agent.id}`}>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                agent.status === "active" ? "bg-green-500" : "bg-gray-400"
                              )}
                            />
                            <span className="truncate">{agent.name}</span>
                          </div>
                          <BarChart3 className="h-3 w-3 opacity-50 flex-shrink-0" />
                        </Link>
                      </Button>
                      <Button
                        variant={isActive(`/agent/${agent.id}/chat`) ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-2 h-7 pl-7 text-xs hover:bg-sidebar-accent transition-all",
                          isActive(`/agent/${agent.id}/chat`) && "bg-sidebar-accent text-sidebar-accent-foreground",
                        )}
                        asChild
                      >
                        <Link href={`/agent/${agent.id}/chat`}>
                          <MessageSquare className="h-3 w-3 opacity-60" />
                          <span>Chat</span>
                        </Link>
                      </Button>
                    </div>
                  ))}

                  {!isLoading && agents.length === 0 && (
                    <div className="pl-5 py-2">
                      <p className="text-xs text-muted-foreground">Nenhum agente criado ainda</p>
                    </div>
                  )}



                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Agents collapsed - apenas ícones */}
          {isCollapsedView && agents.length > 0 && (
            <div className="pt-3 space-y-1 border-t border-sidebar-border/50 mt-3">
              {agents.slice(0, 4).map((agent) => (
                <Button
                  key={agent.id}
                  variant={isActive(`/agent/${agent.id}`) ? "secondary" : "ghost"}
                  className={cn(
                    "w-full h-9 justify-center p-0 transition-all",
                    isActive(`/agent/${agent.id}`) && "bg-sidebar-accent text-sidebar-accent-foreground",
                  )}
                  title={agent.name}
                  asChild
                >
                  <Link href={`/agent/${agent.id}`}>
                    <div className="relative">
                      <Bot className="h-4 w-4" />
                      <div
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-sidebar",
                          agent.status === "active" ? "bg-green-500" : "bg-gray-400"
                        )}
                      />
                    </div>
                  </Link>
                </Button>
              ))}
              {agents.length > 4 && (
                <div className="flex justify-center pt-1">
                  <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                    +{agents.length - 4}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* User Section */}
      {user && (
        <div className={cn(
          "border-t border-sidebar-border transition-all",
          isCollapsedView ? 'p-2' : 'p-3'
        )}>
          {isCollapsedView ? (
            // Layout colapsado - apenas avatar
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground overflow-hidden">
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
            </div>
          ) : (
            // Layout expandido - avatar + info
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground overflow-hidden flex-shrink-0">
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.fullName || user.firstName || 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.primaryEmailAddress?.emailAddress || ''}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
