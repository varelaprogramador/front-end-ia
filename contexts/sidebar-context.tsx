"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  isMobile: boolean
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detectar tamanho da tela
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024 // lg breakpoint
      setIsMobile(mobile)

      // Em mobile, deixar colapsado por padrão
      if (mobile) {
        setIsCollapsed(true)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Recuperar estado do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !isMobile) {
      const saved = localStorage.getItem('sidebar-collapsed')
      if (saved) {
        setIsCollapsed(JSON.parse(saved))
      }
    }
  }, [isMobile])

  // Salvar estado no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !isMobile) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
    }
  }, [isCollapsed, isMobile])

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        toggleSidebar,
        isMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}