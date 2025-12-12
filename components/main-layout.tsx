"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { SidebarNavigation } from "./sidebar-navigation"
import { BreadcrumbNavigation } from "./breadcrumb-navigation"
import { WorkspaceHeader } from "./workspace-header"
import { DynamicLayout } from "./dynamic-layout"
import { AIHeadPreloader } from "./ai-head-preloader"
import { NotificationBell } from "./notification-bell"
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context"
import { Button } from "@/components/ui/button"
import { Menu, PanelLeftClose } from "lucide-react"

interface MainLayoutProps {
  children: React.ReactNode
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const { isCollapsed, toggleSidebar, isMobile } = useSidebar()

  return (
    <DynamicLayout>
      <div className="flex h-screen bg-background">
        {/* Overlay para mobile */}
        {isMobile && !isCollapsed && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => toggleSidebar()}
          />
        )}

        {/* Sidebar - fixed position para não scrollar com o conteúdo */}
        <div className={`
          ${isCollapsed ? 'w-0 lg:w-16' : 'w-64'}
          transition-all duration-300 ease-in-out flex-shrink-0
          ${isMobile ? 'fixed left-0 top-0 h-full z-50' : 'fixed left-0 top-0 h-screen z-30'}
          ${isMobile && isCollapsed ? '-translate-x-full' : 'translate-x-0'}
        `}>
          <div className={`h-full ${isCollapsed && !isMobile ? 'overflow-hidden' : ''}`}>
            <SidebarNavigation />
          </div>
        </div>

        {/* Spacer para compensar a sidebar fixed */}
        {!isMobile && (
          <div className={`
            ${isCollapsed ? 'w-0 lg:w-16' : 'w-64'}
            transition-all duration-300 ease-in-out flex-shrink-0
          `} />
        )}

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="border-b bg-card px-6 py-3 relative z-40">
            <div className="flex items-center gap-4">
              {/* Botão toggle sidebar */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 flex-shrink-0"
                title={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
              >
                {isCollapsed ? (
                  <Menu className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>

              <div className="flex-1 min-w-0">
                <BreadcrumbNavigation />
              </div>

              {/* Sino de notificações */}
              <NotificationBell />
            </div>
          </div>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </DynamicLayout>
  )
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  )
}
