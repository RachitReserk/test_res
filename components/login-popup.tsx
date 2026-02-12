"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"

interface LoginPopupProps {
  isOpen: boolean
  onClose: () => void
  currentPath: string
}

export function LoginPopup({ isOpen, onClose, currentPath }: LoginPopupProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setLoading(true)

    // Redirect to login page with callback URL
    const callbackUrl = encodeURIComponent(currentPath)
    router.push(`/client/login?callbackUrl=${callbackUrl}`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="relative w-full max-w-md bg-white rounded-lg p-6 shadow-xl"
      >
        <motion.button
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </motion.button>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <h2 className="text-2xl font-bold mb-2">Login Required</h2>
          <p className="text-gray-600">Please login to continue with your order</p>
        </motion.div>

        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <Button
            className="w-full bg-navbartextcolor hover:bg-navbartextcolor/80 text-white py-6"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader className="mr-2 h-4 w-4 animate-spin" /> Redirecting...
              </span>
            ) : (
              "Login to Continue"
            )}
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Don't have an account? You can create one during login.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

