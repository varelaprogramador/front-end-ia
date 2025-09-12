"use client"

import { useEffect, useState } from 'react'
import { systemConfigService, type PublicSystemConfig } from '@/lib/system-config-api'

interface DynamicLayoutProps {
  children: React.ReactNode
}

export function DynamicLayout({ children }: DynamicLayoutProps) {
  const [systemConfig, setSystemConfig] = useState<PublicSystemConfig | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    async function loadSystemConfig() {
      try {
        const response = await systemConfigService.getPublicSystemConfig()
        if (response.success && response.data) {
          setSystemConfig(response.data)
          
          // Atualizar título da página
          if (response.data.systemTitle) {
            document.title = response.data.systemTitle
          }
          
          // Atualizar favicon se disponível
          if (response.data.faviconUrl) {
            console.log('Aplicando favicon inicial:', response.data.faviconUrl)
            updateFavicon(response.data.faviconUrl)
          } else if (response.data.logoUrl) {
            console.log('Usando logo como favicon:', response.data.logoUrl)
            updateFavicon(response.data.logoUrl)
          }
          
          // Atualizar meta tags SEO
          updateMetaTags(response.data)
        }
      } catch (error) {
        console.error('Erro ao carregar configurações do sistema:', error)
      }
    }

    loadSystemConfig()
  }, [])

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

  // Atualizar favicon quando tema muda (se há diferentes logos para temas)
  useEffect(() => {
    if (!systemConfig) return
    
    console.log('🎨 Mudança de tema detectada - isDarkMode:', isDarkMode)
    console.log('📁 Configurações disponíveis:', {
      faviconUrl: systemConfig.faviconUrl,
      logoUrl: systemConfig.logoUrl,
      logoUrlDark: systemConfig.logoUrlDark
    })
    
    // Se há favicon específico para modo escuro
    if (isDarkMode && systemConfig.logoUrlDark) {
      console.log('🌙 Aplicando logo dark como favicon')
      updateFavicon(systemConfig.logoUrlDark)
    } else if (systemConfig.faviconUrl) {
      console.log('🔗 Aplicando favicon específico')
      updateFavicon(systemConfig.faviconUrl)
    } else if (systemConfig.logoUrl) {
      console.log('☀️ Aplicando logo normal como favicon')
      updateFavicon(systemConfig.logoUrl)
    } else {
      console.log('⚠️ Nenhum favicon disponível')
    }
  }, [isDarkMode, systemConfig])

  const updateFavicon = (faviconUrl: string) => {
    console.log('🔄 Iniciando atualização do favicon:', faviconUrl)
    
    // Remove favicons existentes
    const existingFavicons = document.querySelectorAll('link[rel*="icon"], link[rel*="shortcut"]')
    console.log('🗑️ Removendo', existingFavicons.length, 'favicons existentes')
    existingFavicons.forEach(favicon => {
      console.log('Removendo:', favicon.getAttribute('rel'), favicon.getAttribute('href'))
      favicon.remove()
    })

    // Determina o tipo do favicon baseado na URL
    const isIco = faviconUrl.toLowerCase().includes('.ico')
    const isPng = faviconUrl.toLowerCase().includes('.png')
    const isSvg = faviconUrl.toLowerCase().includes('.svg')
    
    let mimeType = 'image/x-icon'
    if (isPng) mimeType = 'image/png'
    if (isSvg) mimeType = 'image/svg+xml'

    console.log('📋 Tipo detectado:', mimeType)

    // Adiciona timestamp para forçar atualização
    const timestamp = Date.now()
    const faviconUrlWithTimestamp = `${faviconUrl}${faviconUrl.includes('?') ? '&' : '?'}t=${timestamp}`

    // Adiciona favicon principal
    const favicon = document.createElement('link')
    favicon.rel = 'icon'
    favicon.type = mimeType
    favicon.href = faviconUrlWithTimestamp
    document.head.appendChild(favicon)
    console.log('✅ Favicon principal adicionado:', favicon.href)

    // Adiciona shortcut icon para compatibilidade
    const shortcut = document.createElement('link')
    shortcut.rel = 'shortcut icon'
    shortcut.type = mimeType
    shortcut.href = faviconUrlWithTimestamp
    document.head.appendChild(shortcut)
    console.log('✅ Shortcut icon adicionado:', shortcut.href)

    // Para PNG/SVG, adiciona também versões para diferentes contextos
    if (isPng || isSvg) {
      const appleTouchIcon = document.createElement('link')
      appleTouchIcon.rel = 'apple-touch-icon'
      appleTouchIcon.href = faviconUrlWithTimestamp
      document.head.appendChild(appleTouchIcon)
      console.log('✅ Apple touch icon adicionado:', appleTouchIcon.href)
    }

    // Força recarga do favicon no navegador
    setTimeout(() => {
      const head = document.head
      const favicon16 = document.createElement('link')
      favicon16.rel = 'icon'
      favicon16.type = mimeType
      favicon16.sizes = '16x16'
      favicon16.href = faviconUrlWithTimestamp
      head.appendChild(favicon16)
      
      const favicon32 = document.createElement('link')
      favicon32.rel = 'icon'
      favicon32.type = mimeType
      favicon32.sizes = '32x32'
      favicon32.href = faviconUrlWithTimestamp
      head.appendChild(favicon32)
      
      console.log('✅ Favicons com tamanhos específicos adicionados')
    }, 100)

    console.log('🎉 Favicon atualizado com sucesso!')
  }

  const updateMetaTags = (config: PublicSystemConfig) => {
    // Atualizar meta description
    if (config.seoDescription) {
      let metaDescription = document.querySelector('meta[name="description"]')
      if (!metaDescription) {
        metaDescription = document.createElement('meta')
        metaDescription.setAttribute('name', 'description')
        document.head.appendChild(metaDescription)
      }
      metaDescription.setAttribute('content', config.seoDescription)
    }

    // Atualizar meta keywords
    if (config.seoKeywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]')
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta')
        metaKeywords.setAttribute('name', 'keywords')
        document.head.appendChild(metaKeywords)
      }
      metaKeywords.setAttribute('content', config.seoKeywords)
    }

    // Open Graph tags
    if (config.seoTitle) {
      updateMetaProperty('og:title', config.seoTitle)
    }
    if (config.seoDescription) {
      updateMetaProperty('og:description', config.seoDescription)
    }
    if (config.websiteUrl) {
      updateMetaProperty('og:url', config.websiteUrl)
    }
    if (config.logoUrl) {
      updateMetaProperty('og:image', config.logoUrl)
    }

    // Twitter Card tags
    updateMetaName('twitter:card', 'summary_large_image')
    if (config.seoTitle) {
      updateMetaName('twitter:title', config.seoTitle)
    }
    if (config.seoDescription) {
      updateMetaName('twitter:description', config.seoDescription)
    }
    if (config.logoUrl) {
      updateMetaName('twitter:image', config.logoUrl)
    }
  }

  const updateMetaProperty = (property: string, content: string) => {
    let metaTag = document.querySelector(`meta[property="${property}"]`)
    if (!metaTag) {
      metaTag = document.createElement('meta')
      metaTag.setAttribute('property', property)
      document.head.appendChild(metaTag)
    }
    metaTag.setAttribute('content', content)
  }

  const updateMetaName = (name: string, content: string) => {
    let metaTag = document.querySelector(`meta[name="${name}"]`)
    if (!metaTag) {
      metaTag = document.createElement('meta')
      metaTag.setAttribute('name', name)
      document.head.appendChild(metaTag)
    }
    metaTag.setAttribute('content', content)
  }

  return <>{children}</>
}