"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import type { Offer } from "@/lib/api/offers"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel"
import { Sparkles, Gift, Zap, Star } from "lucide-react"

interface AnnouncementBarProps {
  offers: Offer[]
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ offers }) => {
  const [api, setApi] = useState<CarouselApi>()
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0)

  const scrollNext = useCallback(() => {
    if (api) {
      api.scrollNext()
    }
  }, [api])

  useEffect(() => {
    if (!api || offers.length <= 1) return

    const interval = setInterval(() => {
      scrollNext()
    }, 5000) // Change offer every 5 seconds

    return () => clearInterval(interval)
  }, [api, offers.length, scrollNext])

  if (!offers || offers.length === 0) {
    return null
  }

  return (
    <div
      className="w-full shadow-lg border-b relative overflow-hidden"
      style={{
        backgroundColor: "#2b3a67", // Using navbartextcolor as solid background, removed gradient and CSS containment
      }}
    >
      <div className="relative z-10 px-4 py-3 flex items-center justify-center gap-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Sparkles className="w-5 h-5 animate-pulse text-yellow-400" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
          </div>
          <span className="font-bold text-sm sm:text-base hidden sm:inline text-yellow-300">Special Offer</span>{" "}
        </div>

        <div className="flex-1 max-w-2xl">
          <Carousel setApi={setApi} className="w-full relative group">
            <CarouselContent>
              {offers.map((offer, index) => (
                <CarouselItem key={offer.id} className="flex items-center justify-center">
                  <div className="flex items-center gap-2 text-center">
                    <div className="hidden sm:flex">
                      {index % 4 === 0 && <Gift className="w-4 h-4 text-yellow-400" />}
                      {index % 4 === 1 && <Zap className="w-4 h-4 text-yellow-400" />}
                      {index % 4 === 2 && <Star className="w-4 h-4 text-yellow-400" />}
                      {index % 4 === 3 && <Sparkles className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-balance leading-tight text-white">
                      {" "}
                      {offer.name}
                    </span>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {offers.length > 1 && (
              <>
                <CarouselPrevious className="absolute left-0 sm:left-1 top-1/2 -translate-y-1/2 bg-slate-800 hover:bg-slate-700 text-white border-slate-600 hover:border-slate-500 w-8 h-8 transition-all duration-200 opacity-0 group-hover:opacity-100" />
                <CarouselNext className="absolute right-0 sm:right-1 top-1/2 -translate-y-1/2 bg-slate-800 hover:bg-slate-700 text-white border-slate-600 hover:border-slate-500 w-8 h-8 transition-all duration-200 opacity-0 group-hover:opacity-100" />
              </>
            )}
          </Carousel>
        </div>
      </div>
    </div>
  )
}
