"use client"

import type React from "react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { useEffect, useState } from "react"

export function TooltipWrapper({ children }: { children: React.ReactNode }) {
  // Use this pattern to safely handle client/server differences
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Return a simplified version during SSR
  if (!isMounted) {
    return <>{children}</>
  }

  // Full component with all features on the client
  return <TooltipProvider>{children}</TooltipProvider>
}

