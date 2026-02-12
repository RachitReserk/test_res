"use client"

import { useState, useEffect, useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User } from "lucide-react"
import { useAuth } from "../components/auth-provider"
import { ProfileDialog } from "./profile-dialog"

// Cache user data to prevent unnecessary fetches
const userDataCache = new Map()
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes

export function UserNav() {
  const { userName, userRole, logout: authLogout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Memoize the auth token getter to avoid recalculating on every render
  const getAuthToken = useMemo(() => {
    return () => {
      return document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1]
    }
  }, [])

  useEffect(() => {
    const fetchUserEmail = async () => {
      if (!userRole) {
        setUserEmail("user@quickbitenow.com")
        return
      }

      // Check cache first
      const cacheKey = `${userRole}_${getAuthToken()}`
      const cachedData = userDataCache.get(cacheKey)

      if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
        setUserEmail(cachedData.email)
        return
      }

      setIsLoading(true)
      const authToken = getAuthToken()

      if (!authToken) {
        setUserEmail(`${userRole}@quickbitenow.com`)
        setIsLoading(false)
        return
      }

      try {
        // Determine endpoint based on role
        const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/client/${userRole}/login/`

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${authToken}`,
          },
          credentials: "include",
        })

        if (!response.ok) {
          setUserEmail(`${userRole}@quickbitenow.com`)
          setIsLoading(false)
          return
        }

        const data = await response.json()
        let email = `${userRole}@quickbitenow.com` // Default fallback

        // Extract email based on response structure
        if (data.email) {
          email = data.email
        } else if (data[userRole]?.email) {
          email = data[userRole].email
        }

        // Cache the result
        userDataCache.set(cacheKey, {
          email,
          timestamp: Date.now(),
        })

        setUserEmail(email)
      } catch (err) {
        setUserEmail(`${userRole}@quickbitenow.com`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserEmail()
  }, [userRole, getAuthToken])

  // Memoize display name and initials to avoid recalculating on every render
  const { displayName, initials } = useMemo(() => {
    const name = userName || (userRole ? `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} User` : "Admin User")
    const initials = name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)

    return { displayName: name, initials }
  }, [userName, userRole])

  // Enhanced logout function that calls the API
  const logout = async () => {
    try {
      const authToken = getAuthToken()

      if (authToken) {
        // Call the logout API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${authToken}`,
          },
          credentials: "include",
        })

        if (!response.ok) {
          console.error("Logout API call failed:", response.status)
        }
      }
    } catch (error) {
      console.error("Error during API logout:", error)
    } finally {
      // Always proceed with the auth logout regardless of API success
      authLogout()
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">{isLoading ? "Loading email..." : userEmail}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setProfileOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {profileOpen && (
        <ProfileDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          userRole={(userRole as "owner" | "manager" | "employee") || "owner"}
        />
      )}
    </>
  )
}

