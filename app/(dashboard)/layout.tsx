import type React from "react"

import { MainLayout } from "@/components/main-layout"
import { SocketProvider } from "@/lib/socket-context"
import { ConfirmProvider } from "@/components/ui/confirm-dialog"

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <SocketProvider>
            <ConfirmProvider>
                <MainLayout>{children}</MainLayout>
            </ConfirmProvider>
        </SocketProvider>
    )
}
