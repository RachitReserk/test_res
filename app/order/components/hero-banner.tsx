"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Clock, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeroBannerProps {
  promoText?: string
}

export function HeroBanner({ promoText = "Welcome to our restaurant" }: HeroBannerProps) {
  const [landingImage, setLandingImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRestaurantInfo = async () => {
      try {
        const restaurantId = process.env.NEXT_PUBLIC_RESTAURANT_ID || "4"

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/customer/restaurant-info?restaurant=${restaurantId}`,
        )
        if (!res.ok) throw new Error("Failed to fetch restaurant info")
        const data = await res.json()
        const image = data?.restaurant?.landing_image || null
        setLandingImage(image)
      } catch (error) {
        console.error("Error fetching restaurant info:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurantInfo()
  }, [])

  const fallbackImage = "/hero-tkbowl.jpg"

  const bannerImage = landingImage?.startsWith("http")
    ? landingImage
    : landingImage
      ? `${process.env.NEXT_PUBLIC_API_URL}${landingImage}`
      : fallbackImage

  return (
    <div className="relative bg-white overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center w-full h-40 bg-gray-50">
          
        </div>
      ) : (
        <div className="relative h-[280px] md:h-[320px] lg:h-[300px] overflow-hidden">
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent z-10" />

          {/* Background image */}
          <Image
            src={bannerImage || "/placeholder.svg"}
            alt="Restaurant Hero Banner"
            fill
            className="object-cover object-center"
            priority
          />

          {/* Content container */}
          <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-center h-full max-w-lg">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <span className="inline-block bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  SPECIAL OFFER
                </span>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3">{promoText}</h1>
                <p className="text-gray-200 mb-6 max-w-md">
                  Experience authentic flavors crafted with the finest ingredients. Order online for pickup or delivery.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
