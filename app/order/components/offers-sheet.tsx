"use client"

import React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Offer } from "@/lib/api/offers"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface OffersSheetProps {
  isOpen: boolean
  onClose: () => void
  offers: Offer[]
  onApplyOfferClick: (menuItemId: number) => void
}

export function OffersSheet({ isOpen, onClose, offers, onApplyOfferClick }: OffersSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Available Offers</SheetTitle>
          <SheetDescription>
            Explore the latest deals and discounts.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 pr-4">
          {offers.length === 0 ? (
            <p className="text-center text-gray-500 mt-8">No offers available at the moment.</p>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => (
                <div key={offer.id} className="border rounded-lg p-4 shadow-sm bg-white">
                  <h3 className="text-lg font-semibold text-gray-800">{offer.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
                  <div className="mt-3 text-sm text-gray-700">
                    {offer.offer_type === "FLAT" && offer.value && (
                      <p>Get ${offer.value} OFF</p>
                    )}
                    {offer.min_order_value && offer.min_order_value !== "0.00" && (
                      <p>Min. Order: ${offer.min_order_value}</p>
                    )}
                    {offer.applicable_products && offer.applicable_products.length > 0 && (
                      <p>Applicable on: {offer.applicable_products.map((p) => p.menu_item_name).join(", ")}</p>
                    )}
                    {/* Add more offer type specific details if needed */}
                  </div>
                  {(offer.offer_type === "FREE_ITEM_ADDITION" || offer.offer_type === "BOGO") && !offer.applies_to_dob && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (offer.offer_type === "BOGO" && offer.conditions && offer.conditions.length > 0) {
                            onApplyOfferClick(offer.conditions[0].menu_item)
                          } else if (offer.offer_type === "FREE_ITEM_ADDITION" && offer.applicable_products && offer.applicable_products.length > 0) {
                            onApplyOfferClick(offer.applicable_products[0].menu_item)
                          }
                        }}
                      >
                        Apply Offer
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
