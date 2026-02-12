"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface RestaurantData {
  name: string
  description: string
  landing_image: string | null
}

export default function Home() {
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get restaurant ID from environment variable
    const restaurantId = process.env.NEXT_PUBLIC_RESTAURANT_ID as string
    localStorage.setItem("restaurantId", restaurantId)

    router.push("/order")

    const fetchRestaurantInfo = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/customer/restaurant-info?restaurant=${restaurantId}`
        )
        const data = await res.json()
        if (data?.restaurant) setRestaurant(data.restaurant)
      } catch (err) {
        console.error("Failed to fetch restaurant info", err)
      } finally {
        
      }
    }

    fetchRestaurantInfo()
  }, [])

  const handleOrderNow = () => {
    router.push("/order")
  }

  const bannerImage = restaurant?.landing_image || "/hero-tkbowl.jpg"

  if (loading) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 text-base font-medium tracking-wide">Fetching restaurant details...</p>
            </div>
        </div>      
    )
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-white">
      {/* Hero Section */}
      <div className="relative w-full h-[75vh]">
        <Image
          src={bannerImage}
          alt="Teriyaki Bowl Banner"
          fill
          className="object-cover brightness-50"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold drop-shadow-lg mb-4">
            Welcome to {restaurant?.name}
          </h1>
          <p className="text-lg md:text-2xl max-w-2xl mb-6 drop-shadow-md">
            {restaurant?.description}
          </p>
          <Button
            className="bg-blue-600 text-white px-6 py-3 text-lg rounded-full hover:bg-blue-700 shadow-md"
            onClick={handleOrderNow}
          >
            Order Now
          </Button>
        </div>
      </div>

      {/* About Section */}
      <section className="py-16 px-6 md:px-16 text-center">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Our Story</h2>
        <p className="text-gray-600 max-w-3xl mx-auto text-base md:text-lg">
          At {restaurant?.name}, we believe in delivering joy through flavor. From our humble
          beginnings in 1974, we've passionately crafted delicious dishes using fresh, high-quality ingredients
          that keep our customers coming back for more.
        </p>
      </section>

      {/* Footer CTA */}
      <section className="bg-gray-100 py-12 px-6 text-center">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Ready to get started?</h3>
        <Button
          className="bg-blue-600 text-white px-6 py-3 text-lg rounded-full hover:bg-blue-700 shadow"
          onClick={handleOrderNow}
        >
          Start Your Order Now
        </Button>
      </section>
    </div>
  )
}