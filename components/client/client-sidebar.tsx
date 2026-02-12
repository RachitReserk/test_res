"use client"
import { usePathname } from "next/navigation"
import { Home, ShoppingCart, Calendar, CreditCard, Heart, History, Settings, HelpCircle, Utensils } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

export function ClientSidebar() {
  const pathname = usePathname()

  // Check if the current path matches or is a subpath
  const isActive = (path: string) => {
    if (path === "/client/dashboard") {
      return pathname === "/client/dashboard"
    }
    return pathname?.startsWith(path)
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/client/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Utensils className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">QuickBiteNow </span>
                  <span className="text-xs">Client Portal</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/client/dashboard")}>
                <a href="/client/dashboard">
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/client/orders")}>
                <a href="/client/orders">
                  <ShoppingCart className="h-4 w-4" />
                  <span>My Orders</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/client/reservations")}>
                <a href="/client/reservations">
                  <Calendar className="h-4 w-4" />
                  <span>Reservations</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/client/payments")}>
                <a href="/client/payments">
                  <CreditCard className="h-4 w-4" />
                  <span>Payments</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/client/favorites")}>
                <a href="/client/favorites">
                  <Heart className="h-4 w-4" />
                  <span>Favorites</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/client/history")}>
                <a href="/client/history">
                  <History className="h-4 w-4" />
                  <span>Order History</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/client/settings")}>
                <a href="/client/settings">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/client/help")}>
                <a href="/client/help">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help & Support</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

