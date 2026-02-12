"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ItemOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  item: {
    id: number
    name: string
    price: string
    description: string
    image: string
  }
  onAddToCart: (options: any) => void
}

export function ItemOptionsModal({ isOpen, onClose, item, onAddToCart }: ItemOptionsModalProps) {
  const [selectedSize, setSelectedSize] = useState("regular")
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [specialInstructions, setSpecialInstructions] = useState("")

  const handleAddToCart = () => {
    onAddToCart({
      ...item,
      size: selectedSize,
      extras: selectedExtras,
      specialInstructions
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3, bounce: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl w-full max-w-md shadow-xl my-4"
        >
          {/* Item Image section */}
          <div className="relative h-48 w-full">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover rounded-t-xl"
            />
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable content section */}
          <div className="max-h-[calc(100vh-24rem)] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">{item.name}</h2>
              <p className="text-gray-600 text-sm mb-6">{item.description}</p>

              <div className="space-y-6">
                {/* Size Selection */}
                <div>
                  <h3 className="font-medium mb-3">Size</h3>
                  <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="regular" id="regular" />
                          <Label htmlFor="regular">Regular</Label>
                        </div>
                        <span>${item.price}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="large" id="large" />
                          <Label htmlFor="large">Large</Label>
                        </div>
                        <span>${(parseFloat(item.price) * 1.5).toFixed(2)}</span>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Extras Selection */}
                <div>
                  <h3 className="font-medium mb-3">Extras</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="extra-cheese"
                          checked={selectedExtras.includes("cheese")}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedExtras([...selectedExtras, "cheese"])
                            } else {
                              setSelectedExtras(selectedExtras.filter(e => e !== "cheese"))
                            }
                          }}
                        />
                        <Label htmlFor="extra-cheese">Extra Cheese</Label>
                      </div>
                      <span>+$1.00</span>
                    </div>
                    {/* Add more extras options as needed */}
                  </div>
                </div>

                {/* Special Instructions */}
                <div>
                  <h3 className="font-medium mb-3">Special Instructions</h3>
                  <Textarea
                    placeholder="Any special requests?"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fixed bottom section */}
          <div className="border-t p-4 bg-white rounded-b-xl">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-lg"
              onClick={handleAddToCart}
            >
              Add to Cart - ${calculateTotal()}
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )

  function calculateTotal() {
    let total = parseFloat(item.price)
    if (selectedSize === "large") total *= 1.5
    total += selectedExtras.length * 1.00 // $1 per extra
    return total.toFixed(2)
  }
}
