"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Trash2, Info, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type ConfirmVariant = "default" | "destructive" | "warning" | "info"

interface ConfirmOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider")
  }
  return context.confirm
}

interface ConfirmProviderProps {
  children: ReactNode
}

const variantConfig: Record<ConfirmVariant, { icon: ReactNode; iconClass: string; buttonClass: string }> = {
  default: {
    icon: <HelpCircle className="h-5 w-5" />,
    iconClass: "text-primary bg-primary/10",
    buttonClass: "",
  },
  destructive: {
    icon: <Trash2 className="h-5 w-5" />,
    iconClass: "text-destructive bg-destructive/10",
    buttonClass: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    iconClass: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
    buttonClass: "bg-yellow-600 text-white hover:bg-yellow-700",
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    iconClass: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    buttonClass: "bg-blue-600 text-white hover:bg-blue-700",
  },
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts)
    setIsOpen(true)

    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    setIsOpen(false)
    resolvePromise?.(true)
    setResolvePromise(null)
    setOptions(null)
  }, [resolvePromise])

  const handleCancel = useCallback(() => {
    setIsOpen(false)
    resolvePromise?.(false)
    setResolvePromise(null)
    setOptions(null)
  }, [resolvePromise])

  const variant = options?.variant || "default"
  const config = variantConfig[variant]

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <div className="flex items-start gap-4">
              <div className={cn("p-2 rounded-full", config.iconClass)}>
                {config.icon}
              </div>
              <div className="flex-1">
                <AlertDialogTitle className="text-left">
                  {options?.title}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-left mt-2">
                  {options?.description}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={handleCancel}>
              {options?.cancelText || "Cancelar"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={cn(config.buttonClass)}
            >
              {options?.confirmText || "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}
