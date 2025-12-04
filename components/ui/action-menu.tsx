"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface ActionMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: "default" | "destructive"
}

interface ActionMenuProps {
  trigger: React.ReactNode
  items: ActionMenuItem[]
  align?: "start" | "end"
}

export function ActionMenu({ trigger, items, align = "end" }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const menuWidth = 160

      setPosition({
        top: rect.bottom + 4,
        left: align === "end" ? rect.right - menuWidth : rect.left,
      })
    }
  }, [isOpen, align])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsOpen(!isOpen)
  }

  const handleItemClick = (item: ActionMenuItem) => {
    setIsOpen(false)
    item.onClick()
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleTriggerClick}
      >
        {trigger}
      </div>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 min-w-[160px] bg-popover border border-border rounded-md shadow-lg py-1 animate-in fade-in-0 zoom-in-95"
            style={{ top: position.top, left: position.left }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left",
                  "hover:bg-accent hover:text-accent-foreground",
                  "transition-colors cursor-pointer",
                  item.variant === "destructive" && "text-destructive hover:text-destructive"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}
