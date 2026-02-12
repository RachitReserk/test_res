"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Branch {
  id: number
  name: string
  address: string
  phoneNumber: string
  hours: string
}

interface LocationPopupProps {
  isOpen: boolean
  onClose: () => void
  branches: Branch[]
  onSelectBranch: (branchId: number) => void
  restaurantName?: string
}

export function LocationPopup({
  isOpen,
  onClose,
  branches,
  onSelectBranch,
  restaurantName = "Restaurant",
}: LocationPopupProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null)

  const handleConfirm = () => {
    if (selectedBranchId) {
      onSelectBranch(selectedBranchId)
      localStorage.setItem("hasSelectedLocation", "true")
      localStorage.setItem("selectedBranchId", selectedBranchId.toString())
      onClose()
    }
  }

  const handleBranchSelect = (branchId: number) => {
    setSelectedBranchId(branchId)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-navbarcolor rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-navbartextcolor" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Select Your Location</CardTitle>
              <p className="text-gray-600 mt-2">
                Choose your preferred {restaurantName} location to get started with your order
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-3">
                {branches.map((branch) => (
                  <motion.div
                    key={branch.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedBranchId === branch.id
                        ? "border-orange-500 bg-orange-50 shadow-md"
                        : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                    }`}
                    onClick={() => handleBranchSelect(branch.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{branch.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{branch.address}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>📞 {branch.phoneNumber}</span>
                          <span>🕒 {branch.hours}</span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedBranchId === branch.id ? "border-orange-500 bg-orange-500" : "border-gray-300"
                        }`}
                      >
                        {selectedBranchId === branch.id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  onClick={handleConfirm}
                  disabled={!selectedBranchId}
                  className="w-full bg-navbartextcolor hover:bg-navbartextcolor/70 text-white py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Menu
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  You can change your location anytime .
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
