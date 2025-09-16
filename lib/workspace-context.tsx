"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { WorkspaceAPI } from './workspace-api'
import { Workspace } from './api-config'
import { useToast } from '@/components/ui/use-toast'

interface WorkspaceContextType {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  loading: boolean
  error: string | null
  setCurrentWorkspace: (workspace: Workspace | null) => void
  refreshWorkspaces: () => Promise<void>
  createWorkspace: (data: {
    name: string
    description?: string
    slug: string
    logoUrl?: string
    primaryColor?: string
  }) => Promise<Workspace | null>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

interface WorkspaceProviderProps {
  children: ReactNode
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Load workspaces from localStorage and API
  const loadWorkspaces = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await WorkspaceAPI.getWorkspaces()

      if (response.success && response.data) {
        setWorkspaces(response.data)

        // If no current workspace is set, try to load from localStorage or use first workspace
        if (!currentWorkspace) {
          const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')
          let workspaceToSet: Workspace | null = null

          if (savedWorkspaceId) {
            workspaceToSet = response.data.find(w => w.id === savedWorkspaceId) || null
          }

          // If no saved workspace or saved workspace not found, use the first one
          if (!workspaceToSet && response.data.length > 0) {
            workspaceToSet = response.data[0]
          }

          if (workspaceToSet) {
            setCurrentWorkspace(workspaceToSet)
            localStorage.setItem('currentWorkspaceId', workspaceToSet.id)
          }
        }
      } else {
        setError(response.message || 'Erro ao carregar workspaces')
        toast({
          title: "Erro ao carregar workspaces",
          description: response.message || "Não foi possível carregar a lista de workspaces.",
          variant: "destructive",
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Error loading workspaces:', err)
      toast({
        title: "Erro ao carregar workspaces",
        description: "Ocorreu um erro inesperado ao carregar os workspaces.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Create a new workspace
  const createWorkspace = async (data: {
    name: string
    description?: string
    slug: string
    logoUrl?: string
    primaryColor?: string
  }): Promise<Workspace | null> => {
    try {
      const response = await WorkspaceAPI.createWorkspace(data)

      if (response.success && response.data) {
        // Add to workspaces list
        setWorkspaces(prev => [...prev, response.data])

        // Set as current workspace if it's the first one
        if (workspaces.length === 0) {
          setCurrentWorkspace(response.data)
          localStorage.setItem('currentWorkspaceId', response.data.id)
        }

        toast({
          title: "Workspace criado",
          description: `O workspace "${response.data.name}" foi criado com sucesso.`,
        })

        return response.data
      } else {
        toast({
          title: "Erro ao criar workspace",
          description: response.message || "Não foi possível criar o workspace.",
          variant: "destructive",
        })
        return null
      }
    } catch (err) {
      console.error('Error creating workspace:', err)
      toast({
        title: "Erro ao criar workspace",
        description: "Ocorreu um erro inesperado ao criar o workspace.",
        variant: "destructive",
      })
      return null
    }
  }

  // Set current workspace and save to localStorage
  const handleSetCurrentWorkspace = (workspace: Workspace | null) => {
    setCurrentWorkspace(workspace)
    if (workspace) {
      localStorage.setItem('currentWorkspaceId', workspace.id)
    } else {
      localStorage.removeItem('currentWorkspaceId')
    }
  }

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces()
  }, [])

  const contextValue: WorkspaceContextType = {
    currentWorkspace,
    workspaces,
    loading,
    error,
    setCurrentWorkspace: handleSetCurrentWorkspace,
    refreshWorkspaces: loadWorkspaces,
    createWorkspace,
  }

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}

// Hook for getting current workspace ID safely
export function useCurrentWorkspaceId(): string | null {
  const { currentWorkspace } = useWorkspace()
  return currentWorkspace?.id || null
}