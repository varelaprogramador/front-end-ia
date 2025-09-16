import type React from "react"

import { MainLayout } from "@/components/main-layout"
import { WorkspaceProvider } from "@/lib/workspace-context"

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <>
            <WorkspaceProvider>
                <MainLayout>{children}</MainLayout>
            </WorkspaceProvider>
        </>

    )
}
