"use client"

import { useEffect, useState } from "react"
import { systemConfigService } from "@/lib/system-config-api"

export function DynamicFavicon() {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadFavicon = async () => {
      try {
        const response = await systemConfigService.getSystemConfig()
        if (response.success && response.data?.faviconUrl) {
          setFaviconUrl(response.data.faviconUrl)
        }
      } catch (error) {
        console.error("Error loading favicon:", error)
      }
    }

    loadFavicon()
  }, [])

  useEffect(() => {
    if (faviconUrl) {
      // Remover favicon antigo
      const existingFavicons = document.querySelectorAll("link[rel*='icon']")
      existingFavicons.forEach((link) => link.remove())

      // Adicionar novo favicon com timestamp para forçar atualização
      const link = document.createElement("link")
      link.rel = "icon"
      link.type = "image/x-icon"
      link.href = `${faviconUrl}?v=${Date.now()}`
      document.head.appendChild(link)

      // Também adicionar como shortcut icon
      const shortcutLink = document.createElement("link")
      shortcutLink.rel = "shortcut icon"
      shortcutLink.type = "image/x-icon"
      shortcutLink.href = `${faviconUrl}?v=${Date.now()}`
      document.head.appendChild(shortcutLink)
    }
  }, [faviconUrl])

  return null
}
