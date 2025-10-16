import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import { MainLayout } from "@/components/main-layout"
import { ThemeProvider } from "@/components/theme-provider"
import { DynamicLayout } from "@/components/dynamic-layout"
import { Toaster } from "sonner"
import "./globals.css"

import { ClerkProvider } from "@clerk/nextjs"
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Sistema de Gestão de Agentes IA",
  description: "Plataforma profissional para gerenciamento de agentes de IA empresariais",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="pt-BR" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <ThemeProvider defaultTheme="system" storageKey="ai-agent-theme">
            <Suspense fallback={null}>
              {children}
            </Suspense>
            <Toaster position="top-right" richColors expand={true} />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
