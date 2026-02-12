"use client"
import { useState } from "react"
import Image from "next/image"
import { Plus } from "lucide-react"
import { motion } from "framer-motion"

interface FoodItemProps {
  image: string
  alt: string
  title: string
  price: string
  description: string
  onAddToCart: () => void
  onClick?: () => void // ✅ NEW
}

export function FoodItem({ image, alt, title, price, description, onAddToCart, onClick }: FoodItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  console.log("FoodItem rendered with title:", title)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{
        y: -5,
        transition: { duration: 0.2 },
      }}
      onClick={() => {
        console.log("CARD CLICKED:", title)
        onClick?.()
      }}
      className="cursor-pointer rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-48 overflow-hidden">
        <motion.div
          animate={{
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ duration: 0.4 }}
          className="h-full w-full"
        >
          <Image
            src={image}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </motion.div>

        <motion.button
          initial={{ opacity: 0.8, scale: 0.9 }}
          whileHover={{
            scale: 1.1,
            opacity: 1,
            boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)",
          }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation()
            onAddToCart()
          }}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-md hover:bg-orange-700 transition-all duration-200"
          aria-label="Add to cart"
        >
          <Plus size={20} />
        </motion.button>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <motion.h3
            className="font-bold text-lg"
            animate={{ color: isHovered ? "#ea580c" : "#000000" }}
            transition={{ duration: 0.2 }}
          >
            {title}
          </motion.h3>
          <motion.span
            className="font-bold text-orange-600"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {price}
          </motion.span>
        </div>
        <p className="text-gray-600 text-sm mb-2">{description}</p>
      </div>
    </motion.div>
  )
}
