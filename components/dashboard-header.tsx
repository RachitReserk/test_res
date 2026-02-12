"use client"

import * as React from "react"
import { Bell, Search, X } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/user-nav"
import { cn } from "@/lib/utils"

export function DashboardHeader() {
  const [showSearch, setShowSearch] = React.useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center border-b bg-background px-2 sm:px-4">
      <SidebarTrigger className="mr-2 shrink-0 h-8 w-8 sm:h-9 sm:w-9" />

      {/* Mobile Search Expanded */}
      {showSearch ? (
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full h-9 pl-8"
              autoFocus
              onKeyDown={(e) => e.key === "Escape" && setShowSearch(false)}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(false)}
            className="shrink-0 h-9 w-9"
            aria-label="Close search"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="sr-only">Close search</span>
          </Button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-between gap-2">
          {/* Desktop Search */}
          <div className="hidden md:flex md:w-full md:max-w-xs lg:max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" placeholder="Search..." className="w-full h-9 pl-8" />
            </div>
          </div>

          {/* Actions */}
          <div className={cn("ml-auto flex items-center gap-0 sm:gap-1", showSearch && "hidden")}>
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setShowSearch(true)}
              aria-label="Search"
            >
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Search</span>
            </Button>

            <div className="flex items-center">
              <ModeToggle className="h-9 w-9 mx-0.5 sm:mx-1" />

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 mx-0.5 sm:mx-1 relative"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {/* Notification indicator */}
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
                <span className="sr-only">Notifications</span>
              </Button>

              <UserNav className="ml-0.5 sm:ml-1" />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
