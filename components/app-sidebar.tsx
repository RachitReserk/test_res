"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { ChevronDown, Coffee, Home, Layers, LayoutGrid, Menu, Receipt, Store, Users, Utensils } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = React.useState(true)
  const [managementOpen, setManagementOpen] = React.useState(true)
  const [taxesOpen, setTaxesOpen] = React.useState(true)
  const [restaurantName, setRestaurantName] = React.useState("Admin Dashboard")
  const [isLoading, setIsLoading] = React.useState(true)

  const getAuthToken = () => {
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1] ?? null
    )
  }

  React.useEffect(() => {
    const fetchRestaurant = async () => {
      setIsLoading(true)
      try {
        const authToken = getAuthToken()
        if (!authToken) return

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client/owner/login/`, {
          method: "GET",
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        })

        if (!response.ok) throw new Error(`Error: ${response.status}`)

        const data = await response.json()
        if (data?.name) {
          setRestaurantName(data.name)
        }
      } catch (err) {
        // Silent fail — optional: setRestaurantName("Unknown")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRestaurant()
  }, [])

  const isActive = React.useCallback(
    (path: string) => {
      return path === "/" ? pathname === "/" : pathname.startsWith(path)
    },
    [pathname],
  )

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Utensils className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">QuickBiteNow</span>
                  <span className="text-xs text-muted-foreground">
                    {isLoading ? "Loading..." : restaurantName || "My Restaurant"}
                  </span>
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
              <SidebarMenuButton asChild isActive={isActive("/")}>
                <a href="/dashboard">
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setMenuOpen(!menuOpen)} isActive={isActive("/menu")}>
                <Menu className="h-4 w-4" />
                <span>Menu</span>
                <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
              </SidebarMenuButton>
              {menuOpen && (
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={isActive("/menu/overview")}>
                      <a href="/menu/overview">
                        <LayoutGrid className="h-3 w-3" />
                        Overview
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={isActive("/menu/branches")}>
                      <a href="/menu/branches">
                        <Store className="h-3 w-3" />
                        Branches
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={isActive("/menu/categories")}>
                      <a href="/menu/categories">
                        <LayoutGrid className="h-3 w-3" />
                        Categories
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={isActive("/menu/subcategories")}>
                      <a href="/menu/subcategories">
                        <Layers className="h-3 w-3" />
                        Subcategories
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={isActive("/menu/items")}>
                      <a href="/menu/items">
                        <Coffee className="h-3 w-3" />
                        Menu Items
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setManagementOpen(!managementOpen)} isActive={isActive("/management")}>
                <Users className="h-4 w-4" />
                <span>Management</span>
                <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${managementOpen ? "rotate-180" : ""}`} />
              </SidebarMenuButton>
              {managementOpen && (
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={isActive("/management/managers")}>
                      <a href="/management/managers">
                        <Users className="h-3 w-3" />
                        Managers
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={isActive("/management/employees")}>
                      <a href="/management/employees">
                        <Users className="h-3 w-3" />
                        Employees
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setTaxesOpen(!taxesOpen)} isActive={isActive("/taxes")}>
                <Receipt className="h-4 w-4" />
                <span>Taxes</span>
                <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${taxesOpen ? "rotate-180" : ""}`} />
              </SidebarMenuButton>
              {taxesOpen && (
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={isActive("/taxes/settings")}>
                      <a href="/taxes/settings">
                        <Receipt className="h-3 w-3" />
                        Tax Settings
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>

            {/* <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setOrdersOpen(!ordersOpen)} isActive={isActive("/orders")}>
                <ListOrdered className="h-4 w-4" />
                <span>Orders</span>
                <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${ordersOpen ? "rotate-180" : ""}`} />
              </SidebarMenuButton>
              {ordersOpen && (
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={isActive("/orders")}>
                      <a href="/dashboard/orders">
                        <PlusCircle className="h-3 w-3" />
                        New Order
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={isActive("/orders/all-order")}>
                      <a href="/dashboard/orders/all-order">
                        <ListOrdered className="h-3 w-3" />
                        All Orders
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem> */}

            {/* <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/analytics")}>
                <a href="/analytics">
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem> */}

            {/* <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/restaurant")}>
                <a href="/restaurant">
                  <Store className="h-4 w-4" />
                  <span>My Restaurant</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem> */}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
