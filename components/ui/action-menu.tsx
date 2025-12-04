"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface ActionMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: "default" | "destructive"
  disabled?: boolean
  shortcut?: string
}

interface ActionMenuProps {
  trigger: React.ReactNode
  items: ActionMenuItem[]
  align?: "start" | "end"
  side?: "top" | "bottom"
  className?: string
}

export function ActionMenu({ trigger, items, align = "end", side = "bottom", className }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [activeIndex, setActiveIndex] = useState(-1)
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const menuWidth = 180
    const menuHeight = items.length * 40 + 8
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    let top = side === "bottom" ? rect.bottom + 4 : rect.top - menuHeight - 4
    let left = align === "end" ? rect.right - menuWidth : rect.left

    // Ajustar se sair da tela
    if (top + menuHeight > viewportHeight - 10) {
      top = rect.top - menuHeight - 4
    }
    if (top < 10) {
      top = rect.bottom + 4
    }
    if (left + menuWidth > viewportWidth - 10) {
      left = viewportWidth - menuWidth - 10
    }
    if (left < 10) {
      left = 10
    }

    setPosition({ top, left })
  }, [align, side, items.length])

  useEffect(() => {
    if (isOpen) {
      updatePosition()
      setActiveIndex(-1)
    }
  }, [isOpen, updatePosition])

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

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault()
          setIsOpen(false)
          triggerRef.current?.focus()
          break
        case "ArrowDown":
          e.preventDefault()
          setActiveIndex((prev) => {
            const nextIndex = prev + 1
            return nextIndex >= items.length ? 0 : nextIndex
          })
          break
        case "ArrowUp":
          e.preventDefault()
          setActiveIndex((prev) => {
            const nextIndex = prev - 1
            return nextIndex < 0 ? items.length - 1 : nextIndex
          })
          break
        case "Enter":
        case " ":
          e.preventDefault()
          if (activeIndex >= 0 && !items[activeIndex].disabled) {
            items[activeIndex].onClick()
            setIsOpen(false)
          }
          break
        case "Tab":
          setIsOpen(false)
          break
      }
    }

    const handleScroll = () => {
      updatePosition()
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    window.addEventListener("scroll", handleScroll, true)
    window.addEventListener("resize", updatePosition)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("scroll", handleScroll, true)
      window.removeEventListener("resize", updatePosition)
    }
  }, [isOpen, items, activeIndex, updatePosition])

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsOpen(!isOpen)
  }

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault()
      setIsOpen(true)
      setActiveIndex(0)
    }
  }

  const handleItemClick = (item: ActionMenuItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.disabled) return
    setIsOpen(false)
    item.onClick()
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={cn("inline-flex", className)}
      >
        {trigger}
      </div>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-orientation="vertical"
            className={cn(
              "fixed z-50 min-w-[180px] bg-popover border border-border rounded-lg shadow-lg py-1",
              "animate-in fade-in-0 zoom-in-95 duration-100",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            )}
            style={{ top: position.top, left: position.left }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {items.map((item, index) => (
              <button
                key={index}
                role="menuitem"
                tabIndex={activeIndex === index ? 0 : -1}
                onClick={(e) => handleItemClick(item, e)}
                onMouseEnter={() => setActiveIndex(index)}
                disabled={item.disabled}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left",
                  "transition-colors duration-75 cursor-pointer outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  activeIndex === index && "bg-accent text-accent-foreground",
                  item.variant === "destructive" && "text-destructive focus:text-destructive",
                  item.variant === "destructive" && activeIndex === index && "bg-destructive/10",
                  item.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
                {item.shortcut && (
                  <span className="text-xs text-muted-foreground ml-auto">{item.shortcut}</span>
                )}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}
