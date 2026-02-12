"use client"

import { useRef, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { LogOut, User, ShoppingBag, HelpCircle, Loader, ShoppingCart, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface ProfilePopupProps {
  isOpen: boolean
  onClose: () => void
}

interface ProfileData {
  username: string
  email: string
  phone_number: string
  first_name: string
  last_name: string
}

export function ProfilePopup({ isOpen, onClose }: ProfilePopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://quickbitenow-backend-production.up.railway.app"

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isOpen) return

      // First check if we have data in localStorage
      const storedProfileData = localStorage.getItem("profileData")
      if (storedProfileData) {
        try {
          setProfileData(JSON.parse(storedProfileData))
          return
        } catch (err) {
          // If parsing fails, continue to fetch from API
          console.error("Failed to parse stored profile data", err)
        }
      }

      const clientAuthToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("clientAuthToken="))
        ?.split("=")[1]

      if (!clientAuthToken) {
        setError("Not authenticated")
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_BASE_URL}/client/customer/profile`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${clientAuthToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch profile data")
        }

        const result = await response.json()
        setProfileData(result.data)

        // Save to localStorage
        localStorage.setItem("profileData", JSON.stringify(result.data))
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileData()
  }, [isOpen, API_BASE_URL])

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  // Handle logout
  const handleLogout = () => {
    // Clear the auth token cookie
    document.cookie = "clientAuthToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    // Remove profile data from localStorage
    const preservedHasSelectedLocation = localStorage.getItem("hasSelectedLocation");
    const preservedBranchId = localStorage.getItem("selectedBranchId");
    
    localStorage.clear()
    
    if (preservedHasSelectedLocation !== null) {
      localStorage.setItem("hasSelectedLocation", preservedHasSelectedLocation);
    }
    if (preservedBranchId !== null) {
      localStorage.setItem("selectedBranchId", preservedBranchId);
    }
    // Reset state
    setProfileData(null)

    // Close the popup
    onClose()

    // Refresh the page to update the UI state
    window.location.href = "/"
  }

  const menuItems = [
    { icon: User, label: "My Profile", href: "/client/profile" },
    { icon: ShoppingCart, label: "Menu", href: "/order" },
    { icon: ShoppingBag, label: "My Orders", href: "/client/orders" },
    { icon: CreditCard, label: "Checkout", href: "/checkout" },
  ]

  // Get display name
  const getDisplayName = () => {
    if (profileData) {
      if (profileData.first_name && profileData.last_name) {
        return `${profileData.first_name} ${profileData.last_name}`
      } else if (profileData.first_name) {
        return profileData.first_name
      } else if (profileData.username) {
        return profileData.username
      } else {
        return "User"
      }
    }
    return "User"
  }

  // Get initials for avatar
  const getInitials = () => {
    if (profileData) {
      if (profileData.first_name && profileData.last_name) {
        return `${profileData.first_name[0]}${profileData.last_name[0]}`
      } else if (profileData.first_name) {
        return profileData.first_name[0]
      } else if (profileData.username) {
        return profileData.username[0].toUpperCase()
      }
    }
    return "U"
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20"
            onClick={onClose}
          />
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-16 right-4 w-72 bg-white rounded-lg shadow-lg overflow-hidden z-50"
          >
            <div className="p-4 bg-blue-50">
              {isLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader className="h-6 w-6 animate-spin text-orange-600" />
                </div>
              ) : error ? (
                <div className="text-center text-red-500 py-2">
                  <p>Failed to load profile</p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-white">
                    <AvatarFallback className="bg-orange-600 text-white">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{getDisplayName()}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {profileData?.email || profileData?.phone_number || ""}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="py-2">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                >
                  <item.icon size={18} className="text-gray-600" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <Separator />

            <div className="p-3">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 text-gray-700"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
