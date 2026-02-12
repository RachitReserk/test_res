import type React from "react"
import { ClientSidebar } from "@/components/client/client-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"

export function ClientDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full">
      <ClientSidebar />
      <SidebarInset className="flex-1 overflow-auto">{children}</SidebarInset>
    </div>
  )
}

