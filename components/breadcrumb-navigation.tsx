"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { getAgentById } from "@/lib/agents"

export function BreadcrumbNavigation() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const getBreadcrumbs = () => {
    const breadcrumbs = [
      {
        label: "Início",
        href: "/workspace",
        icon: Home,
      },
    ]

    if (segments.length === 0 || segments[0] === "workspace") {
      breadcrumbs.push({
        label: "Workspace",
        href: "/workspace",
      })
    } else if (segments[0] === "agent" && segments[1]) {
      const agent = getAgentById(segments[1])
      if (agent) {
        breadcrumbs.push({
          label: "Agentes",
          href: "/workspace",
        })
        breadcrumbs.push({
          label: agent.name,
          href: `/agent/${agent.id}`,
        })

        if (segments[2] === "chat") {
          breadcrumbs.push({
            label: "Chat",
            href: `/agent/${agent.id}/chat`,
          })
        }
      }
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1
        const Icon = breadcrumb.icon

        return (
          <div key={breadcrumb.href} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
            {isLast ? (
              <span className="font-medium text-foreground text-balance">
                {Icon && <Icon className="h-4 w-4 inline mr-1" />}
                {breadcrumb.label}
              </span>
            ) : (
              <Link href={breadcrumb.href} className="hover:text-foreground transition-colors text-balance">
                {Icon && <Icon className="h-4 w-4 inline mr-1" />}
                {breadcrumb.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
