"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface FoodItemProps {
  image: string
  alt: string
  title: string
  price: string
  description: string
  onAddToCart: () => void
  onClick?: () => void
  isNew?: boolean
  isPopular?: boolean
}

export function FoodItem({
  image,
  alt,
  title,
  price,
  description,
  onAddToCart,
  onClick,
  isNew = false,
  isPopular = false,
}: FoodItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-48 overflow-hidden">
        <Image
          src={image}
          alt={alt}
          fill
          className={`object-cover transition-transform duration-500 ${isHovered ? "scale-110" : "scale-100"}`}
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {isNew && <Badge className="bg-orange-600 hover:bg-orange-700">New</Badge>}
          {isPopular && <Badge className="bg-orange-500 hover:bg-orange-600">Popular</Badge>}
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-900 line-clamp-1">{title}</h3>
          <span className="font-semibold text-orange-600">{price}</span>
        </div>

        <p className="text-gray-600 text-sm line-clamp-2 mb-4 h-10">{description}</p>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            className="text-orange-600 border-orange-200 hover:bg-orange-50 bg-transparent"
            onClick={onClick}
          >
            Details
          </Button>

          <Button size="icon" className="rounded-full h-8 w-8 bg-orange-600 hover:bg-orange-700" onClick={onClick}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
