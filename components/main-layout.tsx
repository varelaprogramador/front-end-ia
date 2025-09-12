"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { SidebarNavigation } from "./sidebar-navigation"
import { BreadcrumbNavigation } from "./breadcrumb-navigation"
import { WorkspaceHeader } from "./workspace-header"
import { DynamicLayout } from "./dynamic-layout"
import { AIHeadPreloader } from "./ai-head-preloader"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {


  return (
    <DynamicLayout>
      <div className="flex h-screen bg-background">
        <SidebarNavigation />
        <div className="flex-1 flex flex-col overflow-hidden">


          <div className="border-b bg-card px-6 py-3">
            <BreadcrumbNavigation />
          </div>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </DynamicLayout>
  )
}
