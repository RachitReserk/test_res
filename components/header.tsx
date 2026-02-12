"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ShoppingCart, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { CartModal } from "@/components/cart-modal"
import { LoginPopup } from "@/components/login-popup"
import { ProfilePopup } from "@/components/profile-popup"

interface HeaderProps {
  cartItems?: number
  initialIsAuthenticated?: boolean
  initialUserData?: {
    name: string
    email: string
    avatarUrl: string
  }
}

export function Header({
  cartItems = 0,
  initialIsAuthenticated = false,
  initialUserData = {
    name: "John Doe",
    email: "john@example.com",
    avatarUrl: "",
  },
}: HeaderProps) {
  const router = useRouter()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false)
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(initialIsAuthenticated)
  const [userData, setUserData] = useState(initialUserData)

  useEffect(() => {
    const checkAuth = () => {
      const clientAuthToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("clientAuthToken="))
        ?.split("=")[1]

      setIsAuthenticated(!!clientAuthToken)

      // In a real app, you would fetch user data from your API
      if (clientAuthToken) {
        // This is mock data - in a real app you'd fetch this from your backend
        setUserData({
          name: "John Doe",
          email: "john@example.com",
          avatarUrl: "",
        })
      }
    }

    checkAuth()
  }, [])

  const handleOpenCart = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Show login popup if not authenticated
      setIsLoginPopupOpen(true)
      return
    }

    // If authenticated, open cart
    setIsCartOpen(true)
  }

  const toggleProfilePopup = () => {
    setIsProfilePopupOpen(!isProfilePopupOpen)
  }

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex items-center justify-between p-4 bg-black sticky top-0 z-10 shadow-sm"
      >
        <div className="flex items-center gap-2 cursor-pointer">
          <Image src="/TERIYAKI-logo.png" alt="TERIYAKI Logo" width={180} height={40} className="object-contain" />
          {/* <span className="font-medium text-white">TERIYAKI BOWL</span> */}
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-md">
          <Input type="text" placeholder="Search..." className="w-full rounded-full border-gray-300" />
        </div>

        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="primary"
              className="rounded-full flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleOpenCart}
            >
              <ShoppingCart size={18} />
              <motion.span
                key={cartItems}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                {cartItems}
              </motion.span>
            </Button>
          </motion.div>

          {isAuthenticated ? (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <div
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300"
                onClick={toggleProfilePopup}
              >
                <User size={18} />
              </div>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => router.push(`/client/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)}
              >
                Login
              </Button>
            </motion.div>
          )}
        </div>
      </motion.header>

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <AnimatePresence>
        {isLoginPopupOpen && (
          <LoginPopup
            isOpen={isLoginPopupOpen}
            onClose={() => setIsLoginPopupOpen(false)}
            currentPath={typeof window !== "undefined" ? window.location.pathname : "/client/home"}
          />
        )}
      </AnimatePresence>

      <ProfilePopup isOpen={isProfilePopupOpen} onClose={() => setIsProfilePopupOpen(false)} userData={userData} />
    </>
  )
}

