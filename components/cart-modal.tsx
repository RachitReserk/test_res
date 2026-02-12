"use client"
import { useState, useEffect, useRef } from "react"
import { X, Minus, Plus, Loader2, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { initiateCheckout } from "@/lib/api/checkout"
import { useRouter } from "next/navigation"

// Updated interface to match your actual data structure
interface CartItemOption {
  id: number
  name: string
  price_adjustment: number
  quantity?: number // Added quantity field
}

interface MenuItem {
  id: number
  name: string
  price: number
}

interface CartItem {
  id: number
  menu_item: MenuItem
  variation: any | null
  options: CartItemOption[]
  quantity: number
  item_total: number
  image?: string
}

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
  cartItems?: CartItem[]
  updateQuantity?: (itemId: number, newQuantity: number) => void
  removeItem?: (itemId: number) => void
  isLoading?: boolean
}

export function CartModal({
  isOpen,
  onClose,
  cartItems = [],
  updateQuantity,
  removeItem,
  isLoading = false,
}: CartModalProps) {
  const [subtotal, setSubtotal] = useState(0)
  const [localCartItems, setLocalCartItems] = useState<CartItem[]>(cartItems)
  const [isLoadingCart, setIsLoadingCart] = useState(false)
  const [processingItems, setProcessingItems] = useState<Set<number>>(new Set())
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const removedItemIds = useRef<Set<number>>(new Set())
  const deliveryFee = 0
  const router = useRouter()

  const isAnyOperationInProgress = processingItems.size > 0

  useEffect(() => {
    const filteredItems = cartItems.filter((item) => !removedItemIds.current.has(item.id))

    const isSame =
      filteredItems.length === localCartItems.length &&
      filteredItems.every((item, index) => item.id === localCartItems[index].id)

    if (!isSame) {
      setLocalCartItems(filteredItems)
    }
  }, [cartItems, localCartItems])

  useEffect(() => {
    // This calculation is correct, as `item_total` is the total for the line item.
    const newSubtotal = localCartItems.reduce((sum, item) => sum + item.item_total, 0)
    setSubtotal(newSubtotal)
  }, [localCartItems])

  const toggleItemExpansion = (itemId: number) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const getItemDescription = (item: CartItem) => {
    const hasOptions = item.options && item.options.length > 0
    if (!hasOptions) return "Standard preparation"

    const optionNames = item.options.map((opt) => {
      const qty = opt.quantity || 1
      return qty > 1 ? `${qty}x ${opt.name}` : opt.name
    }).join(", ")
    
    return `With: ${optionNames}`
  }

  const calculatePriceBreakdown = (item: CartItem) => {
    const basePrice = item.menu_item.price
    // Calculate options total considering quantity
    const optionsTotal = item.options?.reduce((sum, opt) => {
      const qty = opt.quantity || 1
      return sum + (opt.price_adjustment * qty)
    }, 0) || 0
    
    // Add variation price if present
    const variationPrice = item.variation ? Number(item.variation.price_adjustment) : 0
    
    const finalPricePerItem = basePrice + optionsTotal + variationPrice

    return {
      basePrice,
      optionsTotal,
      variationPrice,
      finalPrice: finalPricePerItem,
    }
  }

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (isAnyOperationInProgress) return;

    setProcessingItems((prev) => new Set(prev).add(itemId));

    try {
      if (newQuantity < 1) {
        await handleRemoveItem(itemId);
        return;
      }

      // Optimistically update the local state with the new quantity AND recalculated total
      setLocalCartItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            const priceBreakdown = calculatePriceBreakdown(item);
            const newItemTotal = priceBreakdown.finalPrice * newQuantity;
            return { ...item, quantity: newQuantity, item_total: newItemTotal };
          }
          return item;
        })
      );

      // Call the parent update function to sync with the server
      if (updateQuantity) {
        await updateQuantity(itemId, newQuantity);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      // On error, revert the optimistic update by resetting to the original prop data
      setLocalCartItems(cartItems);
    } finally {
      setProcessingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (isAnyOperationInProgress) return

    const isEmptyCart = itemId === 7999

    if (isEmptyCart) {
      const allItemIds = new Set(localCartItems.map((item) => item.id))
      setProcessingItems(allItemIds)
    } else {
      setProcessingItems((prev) => new Set(prev).add(itemId))
    }

    try {
      if (isEmptyCart) {
        localCartItems.forEach((item) => {
          removedItemIds.current.add(item.id)
        })
        setLocalCartItems([])
        if (removeItem) {
          await removeItem(7999)
        }
      } else {
        setLocalCartItems((prev) => prev.filter((item) => item.id !== itemId))
        removedItemIds.current.add(itemId)
        if (removeItem) {
          await removeItem(itemId)
        }
      }
    } catch (error) {
      console.error("Error removing item:", error)
    } finally {
      setProcessingItems(new Set())
    }
  }

  useEffect(() => {
    if (!isOpen) {
      removedItemIds.current.clear()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white h-full flex flex-col shadow-xl">
        <div className="p-4 border-b sticky top-0 bg-navbartextcolor text-white z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Your Cart</h2>
            <p className="text-orange-100 text-sm">
              {localCartItems.length} {localCartItems.length === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading || isLoadingCart || isAnyOperationInProgress}
            className="p-1 rounded-full hover:bg-orange-500 text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-grow overflow-auto p-4">
          {isLoading || isLoadingCart ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-40"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="w-12 h-12 border-4 border-navbartextcolor border-t-transparent rounded-full mb-4"
              />
              <p className="text-gray-600">Loading your cart...</p>
            </motion.div>
          ) : localCartItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-40 text-gray-500"
            >
              <svg
                className="w-16 h-16 mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm">Add some delicious items to get started!</p>
            </motion.div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Order Summary</h3>
                <button
                  onClick={() => !isAnyOperationInProgress && handleRemoveItem(7999)}
                  disabled={isAnyOperationInProgress}
                  className={`text-sm flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                    isAnyOperationInProgress
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-red-50 text-red-600 hover:bg-red-100"
                  }`}
                >
                  {isAnyOperationInProgress && processingItems.size === localCartItems.length ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Emptying...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Clear All</span>
                    </>
                  )}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {localCartItems.map((item) => {
                  const isProcessing = processingItems.has(item.id)
                  const isExpanded = expandedItems.has(item.id)
                  const priceBreakdown = calculatePriceBreakdown(item)

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
                      transition={{ duration: 0.3 }}
                      className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm"
                    >
                      <div className="flex gap-3">
                        {item.image && ( <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0"> 
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.menu_item.name}
                              fill
                              className="object-cover"
                            />
                          </div> )}

                        <div className="flex-grow min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-grow min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">{item.menu_item.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{getItemDescription(item)}</p>

                              {item.options && item.options.length > 0 && (
                                <button
                                  onClick={() => toggleItemExpansion(item.id)}
                                  className="flex items-center gap-1 text-xs text-navbartextcolor hover:text-navbartextcolor/70 mt-2"
                                >
                                  <span>{isExpanded ? "Hide" : "Show"} details</span>
                                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                              )}
                            </div>

                            <div className="text-right ml-2">
                              <div className="font-bold text-gray-900">${(item.item_total / item.quantity).toFixed(2)}</div>
                              <div className="text-xs text-gray-500">each</div>
                            </div>
                          </div>

                          {isExpanded && item.options && item.options.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 p-3 bg-gray-50 rounded-md"
                            >
                              <div className="text-xs font-medium text-gray-700 mb-2">Price Breakdown:</div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Base price:</span>
                                  <span>${priceBreakdown.basePrice.toFixed(2)}</span>
                                </div>
                                {item.variation && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">+ {item.variation.name}:</span>
                                    <span>${Number(item.variation.price_adjustment).toFixed(2)}</span>
                                  </div>
                                )}
                                {item.options.map((option, index) => {
                                  const qty = option.quantity || 1
                                  const totalAdj = option.price_adjustment * qty
                                  
                                  return (
                                    <div key={index} className="flex justify-between">
                                      <span className="text-gray-600">
                                        + {qty > 1 ? `${qty}x ` : ""}{option.name}:
                                      </span>
                                      <span
                                        className={
                                          option.price_adjustment > 0
                                            ? "text-green-600"
                                            : option.price_adjustment < 0
                                              ? "text-red-600"
                                              : ""
                                        }
                                      >
                                        {totalAdj > 0 ? "+" : ""}{totalAdj.toFixed(2)}
                                      </span>
                                    </div>
                                  )
                                })}
                                <div className="flex justify-between font-medium pt-1 border-t border-gray-200">
                                  <span>Item total:</span>
                                  <span>${priceBreakdown.finalPrice.toFixed(2)}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <button
                                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                                  isAnyOperationInProgress
                                    ? "bg-gray-100 cursor-not-allowed opacity-50 border-gray-200"
                                    : "hover:bg-orange-50 border-orange-200 hover:border-orange-300"
                                }`}
                                onClick={() =>
                                  !isAnyOperationInProgress && handleUpdateQuantity(item.id, item.quantity - 1)
                                }
                                disabled={isAnyOperationInProgress}
                                aria-label="Decrease quantity"
                              >
                                {isProcessing ? (
                                  <Loader2 size={14} className="animate-spin text-gray-400" />
                                ) : (
                                  <Minus size={14} className="text-gray-600" />
                                )}
                              </button>

                              <div className="px-3 py-1 bg-gray-100 rounded-md min-w-[3rem] text-center">
                                <span className="font-medium">{item.quantity}</span>
                              </div>

                              <button
                                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                                  isAnyOperationInProgress
                                    ? "bg-gray-100 cursor-not-allowed opacity-50 border-gray-200"
                                    : "hover:bg-orange-50 border-orange-200 hover:border-orange-300"
                                }`}
                                onClick={() =>
                                  !isAnyOperationInProgress && handleUpdateQuantity(item.id, item.quantity + 1)
                                }
                                disabled={isAnyOperationInProgress}
                                aria-label="Increase quantity"
                              >
                                {isProcessing ? (
                                  <Loader2 size={14} className="animate-spin text-gray-400" />
                                ) : (
                                  <Plus size={14} className="text-gray-600" />
                                )}
                              </button>
                            </div>

                            <div className="text-right">
                              <div className="font-bold text-lg text-gray-900">
                                ${item.item_total.toFixed(2)}
                              </div>
                              <button
                                className={`text-xs transition-colors ${
                                  isAnyOperationInProgress
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-red-500 hover:text-red-700 hover:underline"
                                }`}
                                onClick={() => !isAnyOperationInProgress && handleRemoveItem(item.id)}
                                disabled={isAnyOperationInProgress}
                              >
                                {isProcessing ? "Removing..." : "Remove"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4">
          {isAnyOperationInProgress && (
            <div className="mb-3 p-3 bg-orange-50 text-orange-700 text-sm rounded-lg flex items-center justify-center">
              <Loader2 size={16} className="animate-spin mr-2" />
              Processing your cart changes... Please wait
            </div>
          )}

          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold">Order Total</span>
              <span className="font-bold text-xl text-navbartextcolor">${(subtotal + deliveryFee).toFixed(2)}</span>
            </div>

            {localCartItems.length > 0 && (
              <div className="text-xs text-gray-500 text-center">
                {localCartItems.reduce((sum, item) => sum + item.quantity, 0)} items • Prices include all customizations
              </div>
            )}
          </div>

          <Button
            className="w-full bg-navbartextcolor hover:bg-navbartextcolor/70 text-white py-3 text-lg font-semibold"
            disabled={localCartItems.length === 0 || isLoading || isLoadingCart || isAnyOperationInProgress}
            onClick={async () => {
              if (localCartItems.length === 0 || isLoading || isLoadingCart || isAnyOperationInProgress) return

              try {
                setIsLoadingCart(true)
                console.log("Initiating checkout process...")
                const branchId = Number(localStorage.getItem("selectedBranchId"))
                console.log("Calling initiateCheckout with branchId:", branchId)
                const response = await initiateCheckout(branchId)
                console.log("Checkout response:", response)
                onClose()
                window.location.href = "/checkout"
              } catch (error: any) {
                alert(error)
                if (error.message === "You already have an active checkout.") {
                  window.location.href = "/checkout"
                }
              } finally {
                setIsLoadingCart(false)
              }
            }}
          >
            {isAnyOperationInProgress || isLoadingCart ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                {isLoadingCart ? "Preparing checkout..." : "Processing..."}
              </>
            ) : (
              "Continue to Checkout"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}