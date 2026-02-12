"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter , usePathname } from "next/navigation"

interface AuthContextType {
  token: string | null
  userRole: string | null
  login: (token: string, userRole: string) => void
  logout: () => void
  checkOwnerHasRestaurants: (token: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  userRole: null,
  login: () => {},
  logout: () => {},
  checkOwnerHasRestaurants: async () => false,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const pathname = usePathname()
  const isLoginPage = pathname.startsWith("/client/login")
  const isOrderPage = pathname === "/order"
  const isForgotPassword = pathname === "/forgot-password"
  const isDefaultPage = pathname === "/"
  const router = useRouter()

  // Initialize from cookies on mount
  useEffect(() => {
    const storedToken = getCookie("authToken")
    const storedRole = getCookie("userRole")

    if (storedToken) {
      // Removed console.log
      setToken(storedToken)
    }

    if (storedRole) {
      // Removed console.log
      setUserRole(storedRole)
    }
  }, [])

  const getCookie = (name: string) => {
    if (typeof document !== "undefined") {
      return document.cookie
        .split("; ")
        .find((row) => row.startsWith(name + "="))
        ?.split("=")[1]
    }
    return null
  }

  const login = (newToken: string, newUserRole: string) => {
    // Removed console.log
    setToken(newToken)
    setUserRole(newUserRole)

    // Also set cookies for persistence
    document.cookie = `authToken=${newToken}; path=/; Secure; SameSite=Strict`
    document.cookie = `userRole=${newUserRole}; path=/; Secure; SameSite=Strict`
  }

  const logout = () => {
  // Clear the auth token cookie
    document.cookie = "clientAuthToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    const preservedHasSelectedLocation = localStorage.getItem("hasSelectedLocation");
    const preservedBranchId = localStorage.getItem("selectedBranchId");

    localStorage.clear()
    
    if (preservedHasSelectedLocation !== null) {
      localStorage.setItem("hasSelectedLocation", preservedHasSelectedLocation);
    }
    if (preservedBranchId !== null) {
      localStorage.setItem("selectedBranchId", preservedBranchId);
    }
    // Redirect to home page
      if( !isLoginPage && !isOrderPage && !isDefaultPage && !isForgotPassword) {
      router.push("/client/login")
    }
  }

    useEffect(() => {
     const getAuthTokenFromCookie = () => {
     if (typeof document !== "undefined") {
       return document.cookie
         .split("; ")
         .find((row) => row.startsWith("clientAuthToken="))
         ?.split("=")[1]
     }
     return null
   }
 
   (async () => {
     const token = getAuthTokenFromCookie();
  
     try {
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client/login/`, {
         method: "GET",
         headers: {
           Authorization: `Token ${token}`,
           "Content-Type": "application/json",
         },
         credentials: "include",
       });

       if(res.status === 401)
        logout()

     } catch (err) {
       console.error(err);
     }
   })();
 }, []);

  // Function to check if owner has restaurants
  const checkOwnerHasRestaurants = async (checkToken: string): Promise<boolean> => {
    try {
      // Removed console.log
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://quickbitenow-backend-production.up.railway.app"

      // First try the create/restaurant endpoint
      try {
        const response = await fetch(`${API_BASE_URL}/client/owner/create/restaurant/`, {
          method: "GET",
          headers: {
            Authorization: `Token ${checkToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        // Removed console.log

        // If response is OK, process it
        if (response.ok) {
          const data = await response.json()
          // Removed console.log

          // Check if data has a status of success and contains a data object with restaurant info
          if (data.status === "success" && data.data) {
            // Check if data.data has id and name properties (indicating a restaurant)
            if (data.data.id && data.data.name) {
              // Removed console.log
              return true
            }
          }

          // Check if restaurants array exists and has items
          if (data.restaurants && Array.isArray(data.restaurants) && data.restaurants.length > 0) {
            // Removed console.log
            return true
          }

          // Check if data itself is an array of restaurants
          if (Array.isArray(data) && data.length > 0) {
            // Removed console.log
            return true
          }
        }
      } catch (error) {
        // Removed console.error
        // Continue to try the fallback endpoint
      }

      // Fallback to the restaurants endpoint if the first one fails
      try {
        const fallbackResponse = await fetch(`${API_BASE_URL}/client/owner/restaurants/`, {
          method: "GET",
          headers: {
            Authorization: `Token ${checkToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        // Removed console.log

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          // Removed console.log

          // Check if we have restaurants in the response
          if (Array.isArray(fallbackData) && fallbackData.length > 0) {
            // Removed console.log
            return true
          }

          if (
            fallbackData.restaurants &&
            Array.isArray(fallbackData.restaurants) &&
            fallbackData.restaurants.length > 0
          ) {
            // Removed console.log
            return true
          }

          if (fallbackData.data && Array.isArray(fallbackData.data) && fallbackData.data.length > 0) {
            // Removed console.log
            return true
          }
        }
      } catch (error) {
        // Removed console.error
      }

      // If we get here, no restaurants were found
      // Removed console.log
      return false
    } catch (error) {
      // Removed console.error
      return false
    }
  }

  const value = {
    token,
    userRole,
    login,
    logout,
    checkOwnerHasRestaurants,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}
