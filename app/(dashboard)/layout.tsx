import type React from "react"

import { MainLayout } from "@/components/main-layout"
import { SocketProvider } from "@/lib/socket-context"

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <SocketProvider>
            <MainLayout>{children}</MainLayout>
        </SocketProvider>
    )
}
