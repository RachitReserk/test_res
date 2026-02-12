"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { AnimatePresence } from "framer-motion"
import { CartModal } from "@/components/cart-modal"
import { LoginPopup } from "@/components/login-popup"
import { ProfilePopup } from "@/components/profile-popup"
import { LocationPopup } from "./components/location-popup"
import { RestaurantInfo } from "./components/restaurant-info"
import Categories from "./components/categories"
import { Header } from "./components/header"
import { Loader2, X, Minus, Plus } from "lucide-react"
import {
  addToCart as addToCartAPI,
  getCart,
  updateCartItemQuantity as updateCartItemQuantityAPI,
  removeCartItem as removeCartItemAPI,
} from "@/lib/api/cart"
import { motion } from "framer-motion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import Image from "next/image"
import { AnnouncementBar } from "@/components/announcement-bar"
import { fetchPublicOffers, Offer } from "@/lib/api/offers"
import { OffersSheet } from "./components/offers-sheet"
import { Button } from "@/components/ui/button"
import { Tag } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

// Updated interface to match the actual data structure from the API
interface CartItemOption {
  id: number
  name: string
  price_adjustment: number
  quantity?: number
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

interface Branch {
  id: number
  name: string
  address: string
  phoneNumber: string
  hours: string
}

export default function OrderPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL
  const [cartItemsCount, setCartItemsCount] = useState(0)
  const [cartData, setCartData] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false)
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [addToCartLoading, setAddToCartLoading] = useState(false)
  const [addToCartError, setAddToCartError] = useState<string | null>(null)
  const [isCartLoading, setIsCartLoading] = useState(false)
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null)
  const [isOffersSheetOpen, setIsOffersSheetOpen] = useState(false)

  // Location popup state
  const [isLocationPopupOpen, setIsLocationPopupOpen] = useState(false)
  const [restaurantData, setRestaurantData] = useState<{
    name: string
    tagline: string
    branches: Branch[]
  } | null>(null)
  const [publicOffers, setPublicOffers] = useState<Offer[]>([])

  // Use a ref to track if a fetch is in progress
  const isFetchingCart = useRef(false)
  // Use a ref to track the last fetch time
  const lastCartFetchTime = useRef(0)
  // Track items that have been removed but might still be in the API response
  const removedItemIds = useRef<Set<number>>(new Set())
  const groupErrorTimers = useRef<{ [key: number]: NodeJS.Timeout }>({})

  const [userData, setUserData] = useState({
    name: "John Doe",
    email: "john@example.com",
    avatarUrl: "",
  })

  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [itemLoading, setItemLoading] = useState(false)
  const [selectedVariationId, setSelectedVariationId] = useState<number | null>(null)
  
  // Store quantity for each option: { groupId: { optionId: quantity } }
  const [selectedOptions, setSelectedOptions] = useState<Record<number, Record<number, number>>>({})
  
  const [groupErrors, setGroupErrors] = useState<{ [key: number]: string }>({})
  
  // Quantity state for the main item
  const [quantity, setQuantity] = useState(1)

  // Reset quantity when modal opens or item changes
  useEffect(() => {
    setQuantity(1)
  }, [selectedItem, isItemModalOpen])

  // Calculate dynamic total price including option quantities
  const calculateTotal = useMemo(() => {
    if (!selectedItem) return 0

    let total = Number(selectedItem.price) || 0

    // Add variation price
    if (selectedVariationId) {
      const variation = selectedItem.variations?.find((v: any) => v.id === selectedVariationId)
      if (variation) {
        total += Number(variation.price_adjustment) || 0
      }
    }

    // Add options price * quantity
    Object.entries(selectedOptions).forEach(([groupId, optionsMap]) => {
      const group = selectedItem.option_groups?.find((g: any) => g.id === Number(groupId))
      if (group) {
        Object.entries(optionsMap).forEach(([optId, qty]) => {
          const option = group.options?.find((o: any) => o.id === Number(optId))
          if (option) {
            total += (Number(option.price_adjustment) || 0) * qty
          }
        })
      }
    })

    return total * quantity
  }, [selectedItem, selectedVariationId, selectedOptions, quantity])

  // Group Requirement Badge Component
  const GroupRequirement = ({ group }: { group: any }) => {
    const { is_required, max_selections } = group
    let label = ""

    if (is_required) {
      label = "REQUIRED"
    } else {
      label = "OPTIONAL"
    }

    if (max_selections > 1) {
      label += ` (MAX ${max_selections})`
    }

    return (
      <Badge 
        variant="outline" 
        className="text-[10px] px-2 py-0.5 h-6 font-medium tracking-wide text-gray-500 border-gray-300 bg-white uppercase"
      >
        {label}
      </Badge>
    )
  }

  const validationState = useMemo(() => {
    if (!selectedItem?.option_groups) {
      return { isValid: true, message: "" }
    }

    for (const group of selectedItem.option_groups) {
      // Calculate total DISTINCT selections for this group
      const groupSelections = selectedOptions[group.id] || {}
      const selectionCount = Object.keys(groupSelections).length

      if (group.is_required && selectionCount < 1) {
        return {
          isValid: false,
          message: `"${group.name}" is required. Please make a selection.`,
        }
      }

      if (selectionCount < group.min_selections) {
        return {
          isValid: false,
          message: `For "${group.name}", you need to select at least ${group.min_selections} option(s).`,
        }
      }

      if (group.max_selections > 0 && selectionCount > group.max_selections) {
        return {
          isValid: false,
          message: `For "${group.name}", you can select at most ${group.max_selections} option(s).`,
        }
      }
    }

    return { isValid: true, message: "" }
  }, [selectedItem, selectedOptions])

  const updateSelectedBranchId = useCallback((branchId: number) => {
    setSelectedBranchId(branchId)
  }, [])

  const fetchRestaurantData = async () => {
    try {
      const restaurantId = process.env.NEXT_PUBLIC_RESTAURANT_ID || "4"
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/restaurant-info?restaurant=${restaurantId}`)
      const data = await res.json()

      const restaurant = data?.restaurant
      const branches = data?.branches || []

      const formattedBranches = branches.map((b: any) => ({
        id: b.id,
        name: b.name,
        address: b.address,
        phoneNumber: b.phone_number || "N/A",
        hours: `${b.opening_time?.slice(0, 5) || "00:00"} - ${b.closing_time?.slice(0, 5) || "00:00"}`,
      }))

      const restaurantInfo = {
        name: restaurant?.name,
        tagline: restaurant?.description,
        branches: formattedBranches,
      }

      setRestaurantData(restaurantInfo)
      return restaurantInfo
    } catch (err) {
      console.error("Failed to load restaurant data:", err)
      return null
    }
  }

  useEffect(() => {
    const checkLocationSelection = async () => {
      const hasSelectedLocation = localStorage.getItem("hasSelectedLocation")
      const storedBranchId = localStorage.getItem("selectedBranchId")

      const restaurantInfo = await fetchRestaurantData()

      if (!hasSelectedLocation || !storedBranchId) {
        setIsLocationPopupOpen(true)
      } else {
        setSelectedBranchId(Number(storedBranchId))
      }
    }

    checkLocationSelection()
  }, [])

  useEffect(() => {
    const getPublicOffers = async () => {
      try {
        const offers = await fetchPublicOffers()
        setPublicOffers(offers)
      } catch (error) {
        console.error("Failed to fetch public offers:", error)
      }
    }
    getPublicOffers()
  }, [])

  const handleLocationSelect = (branchId: number) => {
    setSelectedBranchId(branchId)
    setIsLocationPopupOpen(false)
  }

  useEffect(() => {
    const checkAuth = () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("clientAuthToken="))
        ?.split("=")[1]

      setIsAuthenticated(!!token)

      if (token) {
        setUserData({
          name: "John Doe",
          email: "john@example.com",
          avatarUrl: "",
        })

        if (cartData.length === 0 && cartItemsCount === 0) {
          fetchCartData()
        }
      } else {
        setCartData([])
        setCartItemsCount(0)
      }
    }

    checkAuth()
    const interval = setInterval(checkAuth, 3000)
    return () => clearInterval(interval)
  }, [cartData.length, cartItemsCount])

  const handleOpenCart = () => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("clientAuthToken="))
      ?.split("=")[1]

    if (!token) {
      setIsLoginPopupOpen(true)
      return
    }

    setIsCartOpen(true)
    setIsMobileMenuOpen(false)

    const now = Date.now()
    if (now - lastCartFetchTime.current > 5000) {
      setIsCartLoading(true)
      fetchCartData().finally(() => {
        setIsCartLoading(false)
      })
    }
  }

  const handleLogin = () => {
    setIsMobileMenuOpen(false)
    window.location.href = `/client/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
  }

  const handleProfileClick = () => {
    setIsProfilePopupOpen((prev) => !prev)
    setIsMobileMenuOpen(false)
  }

  const handleMobileMenuToggle = (isOpen: boolean) => {
    setIsMobileMenuOpen(isOpen)
  }

  const handleAddItemToOrderClick = async (itemId: number) => {
    if (!isAuthenticated) {
      setIsLoginPopupOpen(true)
      return
    }

    setIsOffersSheetOpen(false)

    setItemLoading(true)
    try {
      const res = await fetch(`${API_URL}/customer/item/${itemId}/?restaurant=${process.env.NEXT_PUBLIC_RESTAURANT_ID}`)
      const json = await res.json()
      if (json.status === "success") {
        setSelectedItem(json.data)
        setIsItemModalOpen(true)
      }
    } catch (err) {
      console.error("Error fetching item", err)
    } finally {
      setItemLoading(false)
    }
  }

  useEffect(() => {
    if (selectedItem?.variations?.length > 0) {
      setSelectedVariationId(selectedItem.variations[0].id)
    }
  }, [selectedItem])

  const fetchCartData = async () => {
    if (isFetchingCart.current) {
      return { success: false, reason: "fetch-in-progress" }
    }

    isFetchingCart.current = true
    lastCartFetchTime.current = Date.now()

    try {
      const response = await getCart()
      if (response.status === "success") {
        const filteredItems = response.items
          .filter((item: any) => !removedItemIds.current.has(item.id))
          .map((item: any) => ({
            id: item.id,
            name: item.menu_item.name,
            options: item.options || [],
            variation: item.variation || [],
            price: item.item_total / item.quantity,
            quantity: item.quantity,
            image: item.image,
          }))

        const totalQty = filteredItems.reduce((sum: number, item: CartItem) => sum + item.quantity, 0)

        setCartData(response.items)
        setCartItemsCount(totalQty)

        return { success: true, items: filteredItems, count: totalQty }
      }
      return { success: false }
    } catch (err) {
      console.error("Failed to fetch cart", err)
      return { success: false, error: err }
    } finally {
      isFetchingCart.current = false
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return

    if (cartData.length === 0 && cartItemsCount === 0) {
      fetchCartData()
    }

    const interval = setInterval(() => {
      if (!isFetchingCart.current && !isCartOpen) {
        fetchCartData()
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [isAuthenticated, isCartOpen, cartData.length, cartItemsCount])

  const updateCartItemQuantity = async (itemId: number, quantity: number) => {
    try {
      if (quantity < 1) {
        await removeCartItem(itemId)
        return
      }

      await updateCartItemQuantityAPI(itemId, quantity)

      const currentItem = cartData.find((item) => item.id === itemId)
      if (currentItem) {
        const quantityDiff = quantity - currentItem.quantity
        setCartData((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)))
        setCartItemsCount((prev) => prev + quantityDiff)
      }

      setTimeout(() => {
        if (!isFetchingCart.current) {
          fetchCartData()
        }
      }, 1000)
    } catch (err) {
      console.error("Failed to update cart item", err)
      fetchCartData()
    }
  }

  const removeCartItem = async (itemId: number) => {
    try {
      if (itemId === 7999) {
        cartData.forEach((item) => {
          removedItemIds.current.add(item.id)
        })

        setCartData([])
        setCartItemsCount(0)

        try {
          const removePromises = cartData.map((item) => removeCartItemAPI(item.id))
          await Promise.all(removePromises)
          showToast("Cart emptied successfully", "success")
        } catch (error) {
          console.error("Error emptying cart:", error)
          showToast("Failed to empty cart", "error")
        }

        return
      }

      removedItemIds.current.add(itemId)

      const itemToRemove = cartData.find((item) => item.id === itemId)
      if (itemToRemove) {
        setCartData((prev) => prev.filter((item) => item.id !== itemId))
        setCartItemsCount((prev) => prev - itemToRemove.quantity)
      }

      await removeCartItemAPI(itemId)

      setTimeout(() => {
        if (!isFetchingCart.current) {
          fetchCartData()
        }
      }, 2000)
    } catch (err) {
      console.error("Failed to remove cart item", err)
      fetchCartData()
    }
  }

  const showToast = (message: string, type: "success" | "error" = "success") => {
    if (type === "success") {
      toast.success(message)
    } else {
      toast.error(message)
    }
  }

  // Handle generic option change (Quantity or Toggle)
  const handleOptionChange = (
    groupId: number, 
    optionId: number, 
    delta: number, 
    groupMax: number, 
    optionMax: number, 
    isRadio: boolean
  ) => {
    // Clear existing error for this group on interaction
    if (groupErrorTimers.current[groupId]) {
      clearTimeout(groupErrorTimers.current[groupId])
    }
    setGroupErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[groupId]
      return newErrors
    })

    // Validation against current state BEFORE queueing state update
    const currentGroupSelections = selectedOptions[groupId] || {}
    const currentQty = currentGroupSelections[optionId] || 0
    const newQty = currentQty + delta

    // 1. Validation: Min/Max per option
    if (newQty < 0) return
    if (optionMax > 0 && newQty > optionMax) return

    // 2. Validation: Max for Group (DISTINCT options count)
    // Only check if we are adding a NEW option (i.e. distinct count increases)
    if (delta > 0 && currentQty === 0) {
      const currentDistinctCount = Object.keys(currentGroupSelections).length
      
      // If Radio, we don't sum, we just replace.
      // If Checkbox/Stepper, we check limit.
      if (!isRadio && groupMax > 0 && currentDistinctCount >= groupMax) {
        const errorMessage = `You can select at most ${groupMax} different options for this group.`
        
        setGroupErrors((prev) => ({ ...prev, [groupId]: errorMessage }))
        
        groupErrorTimers.current[groupId] = setTimeout(() => {
          setGroupErrors((prev) => {
            const newErrors = { ...prev }
            if (newErrors[groupId] === errorMessage) delete newErrors[groupId]
            return newErrors
          })
        }, 3000)
        
        return // Abort update
      }
    }

    setSelectedOptions((prev) => {
      const newState = { ...prev }
      const groupSelections = { ...(newState[groupId] || {}) }
      
      const prevQty = groupSelections[optionId] || 0
      const nextQty = prevQty + delta

      // Double check safety (should be covered by outer check)
      if (nextQty < 0) return prev

      if (nextQty === 0) {
        delete groupSelections[optionId]
      } else {
        if (isRadio) {
          // If radio, clear all others in this group and set this one to 1
          return { ...newState, [groupId]: { [optionId]: 1 } }
        }
        groupSelections[optionId] = nextQty
      }

      // Cleanup empty groups
      if (Object.keys(groupSelections).length === 0) {
        delete newState[groupId]
      } else {
        newState[groupId] = groupSelections
      }

      return newState
    })
  }

  const clearGroupSelections = (groupId: number) => {
    setSelectedOptions((prev) => {
      const newState = { ...prev }
      delete newState[groupId]
      return newState
    })
  }

  useEffect(() => {
    if (!isCartOpen) {
      setTimeout(() => {
        removedItemIds.current.clear()
      }, 500)
    }
  }, [isCartOpen])

  useEffect(() => {
    return () => {
      Object.values(groupErrorTimers.current).forEach(clearTimeout)
    }
  }, [])

  return (
    <div className="w-full bg-backgroundcolor">
      <Toaster />
      {publicOffers.length > 0 && <AnnouncementBar offers={publicOffers} />}
      <LocationPopup
        isOpen={isLocationPopupOpen}
        onClose={() => setIsLocationPopupOpen(false)}
        branches={restaurantData?.branches || []}
        onSelectBranch={handleLocationSelect}
        restaurantName={restaurantData?.name}
      />

      <Header
        cartItems={cartItemsCount}
        isAuthenticated={isAuthenticated}
        onCartClick={handleOpenCart}
        onProfileClick={handleProfileClick}
        onLoginClick={handleLogin}
        onMobileMenuToggle={handleMobileMenuToggle}
        updateSelectedBranchId={updateSelectedBranchId}
        selectedBranchIdPassed={selectedBranchId}
      />

      <AnimatePresence>
        {isLoginPopupOpen && (
          <LoginPopup
            isOpen={isLoginPopupOpen}
            onClose={() => setIsLoginPopupOpen(false)}
            currentPath={typeof window !== "undefined" ? window.location.pathname : "/order"}
          />
        )}
      </AnimatePresence>

      <ProfilePopup isOpen={isProfilePopupOpen} onClose={() => setIsProfilePopupOpen(false)} />

      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartData}
        updateQuantity={updateCartItemQuantity}
        removeItem={removeCartItem}
        isLoading={isCartLoading}
      />

      {itemLoading && (
        <div className="fixed inset-0 bg-black/40 z-[98] flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-md flex flex-col items-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-navbartextcolor" />
            <p className="text-gray-700 font-medium">Loading item details...</p>
          </div>
        </div>
      )}

      <Dialog
        open={isItemModalOpen && selectedItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsItemModalOpen(false)
            setSelectedOptions({})
          }
        }}
      >
        <DialogContent className="p-0 max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
          {selectedItem && (
            <form 
              className="relative flex-1 flex flex-col"
              onSubmit={(e) => e.preventDefault()}
            >
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 pb-24">
                <DialogHeader className="pr-8">
                  <DialogTitle className="text-2xl font-bold">{selectedItem.name}</DialogTitle>
                  <DialogDescription className="text-gray-500">
                    {selectedItem.description}
                  </DialogDescription>
                </DialogHeader>

                {selectedItem.image && (
                  <div className="relative w-full h-60 rounded mt-4 mb-4 overflow-hidden">
                    <Image
                      src={`${selectedItem.image}` || "/placeholder.svg"}
                      alt={selectedItem.name}
                      layout="fill"
                      objectFit="cover"
                      className="rounded"
                    />
                  </div>
                )}
                <p className="text-lg font-semibold mb-2">Price: ${selectedItem.price}</p>
                {selectedItem.calories > 0 && (
                  <p className="text-sm text-gray-600 mb-2">Calories: {selectedItem.calories}</p>
                )}
                {selectedItem.preparation_time > 0 && (
                  <p className="text-sm text-gray-600 mb-4">Prep Time: {selectedItem.preparation_time} min</p>
                )}

                {selectedItem.variations?.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Variations</h3>
                    <ul className="space-y-2">
                      {selectedItem.variations.map((v: any) => (
                        <li key={v.id} className="flex items-center gap-2">
                          <input
                            type="radio"
                            id={`variation-${v.id}`}
                            name="variation"
                            value={v.id}
                            checked={selectedVariationId === v.id}
                            onChange={() => setSelectedVariationId(v.id)}
                            className="accent-orange-600"
                            disabled={addToCartLoading}
                          />
                          <label htmlFor={`variation-${v.id}`} className="text-sm text-gray-700">
                            {v.name} (+${v.price_adjustment})
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedItem.option_groups?.map((group: any) => {
                  // Determine logic: Radio if group max is 1. Checkbox/Stepper if > 1.
                  const isRadio = group.max_selections === 1
                  const groupSelections = selectedOptions[group.id] || {}
                  const hasSelections = Object.keys(groupSelections).length > 0

                  return (
                    <motion.div
                      layout
                      key={group.id}
                      className={`mb-6 ${!group.is_active ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      {/* Header for Option Group */}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`font-semibold text-base ${!group.is_active ? "text-gray-400" : "text-gray-900"}`}>
                          {group.name}
                        </h3>
                        
                        <div className="flex items-center gap-3">
                          <GroupRequirement group={group} />
                          {hasSelections && (
                            <button
                              type="button"
                              className="text-gray-400 hover:text-red-500 transition-colors text-xs font-medium"
                              onClick={(e) => {
                                e.preventDefault()
                                if (!addToCartLoading) {
                                  clearGroupSelections(group.id)
                                }
                              }}
                              disabled={addToCartLoading || !group.is_active}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {groupErrors[group.id] && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Alert variant="destructive" className="mt-2 mb-2">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>{groupErrors[group.id]}</AlertDescription>
                            </Alert>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <ul className="space-y-1 text-sm text-gray-700">
                        {group.options.map((opt: any) => {
                          const currentQty = groupSelections[opt.id] || 0
                          const isSelected = currentQty > 0
                          const optionMax = opt.max_quantity ?? 1
                          const optionMin = opt.min_quantity ?? 0
                          // Use stepper if option allows > 1 quantity. Use check/radio if max is 1.
                          const showStepper = optionMax > 1

                          return (
                            <li
                              key={opt.id}
                              className={`flex items-center gap-2 ${
                                !opt.is_active && group.is_active ? "opacity-60 pointer-events-none" : ""
                              }`}
                            >
                              <div
                                className={`p-3 flex items-center justify-between gap-3 w-full rounded-md border transition-all ${
                                  isSelected 
                                    ? "bg-blue-50 border-blue-500" 
                                    : "border-transparent hover:bg-gray-50"
                                } ${!opt.is_active ? "" : "cursor-pointer"}`}
                                onClick={() => {
                                  // For non-stepper rows (checkbox/radio), clicking the row toggles selection
                                  if (!showStepper && !addToCartLoading && opt.is_active) {
                                    const delta = isSelected ? -1 : 1
                                    if(isRadio && isSelected) return; // Don't unselect radio by clicking same
                                    handleOptionChange(group.id, opt.id, delta, group.max_selections, optionMax, isRadio)
                                  }
                                }}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  {/* Left Icon (Radio/Checkbox) - Only show if NOT using stepper or if stepper quantity is 0 */}
                                  {!showStepper && (
                                    isRadio ? (
                                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                        isSelected ? "border-blue-500" : "border-gray-300"
                                      }`}>
                                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                                      </div>
                                    ) : (
                                      <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                                        isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"
                                      }`}>
                                        {isSelected && <div className="w-3 h-3 bg-white mask-check">
                                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        </div>}
                                      </div>
                                    )
                                  )}

                                  <div className="flex flex-col">
                                    <span className={`font-medium ${!opt.is_active ? "text-gray-400" : "text-gray-700"}`}>
                                      {opt.name}
                                    </span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {opt.price_adjustment > 0 && (
                                        <span className="text-xs text-gray-500">
                                          +${Number(opt.price_adjustment).toFixed(2)}
                                        </span>
                                      )}
                                      
                                      {/* Updated Badge to show limits properly */}
                                      {(optionMin > 0 || optionMax > 1) && (
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-gray-500 border-gray-200">
                                          {optionMin > 0 ? `Min: ${optionMin}` : ''} {optionMin > 0 && optionMax > 1 ? '•' : ''} {optionMax > 1 ? `Max: ${optionMax}` : ''}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Right Side: Stepper for Quantity Options */}
                                {showStepper && (
                                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                    {currentQty > 0 ? (
                                      <div className="flex items-center bg-white rounded-md border border-gray-200 shadow-sm h-8">
                                        <button
                                          type="button"
                                          className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-md transition-colors disabled:opacity-50"
                                          onClick={() => handleOptionChange(group.id, opt.id, -1, group.max_selections, optionMax, isRadio)}
                                          disabled={addToCartLoading}
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-8 text-center text-sm font-semibold">{currentQty}</span>
                                        <button
                                          type="button"
                                          className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-md transition-colors disabled:opacity-50"
                                          onClick={() => handleOptionChange(group.id, opt.id, 1, group.max_selections, optionMax, isRadio)}
                                          disabled={addToCartLoading || (optionMax > 0 && currentQty >= optionMax)}
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 px-3 text-xs"
                                        onClick={() => handleOptionChange(group.id, opt.id, 1, group.max_selections, optionMax, isRadio)}
                                        disabled={addToCartLoading}
                                      >
                                        Add
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </motion.div>
                  )
                })}

                {addToCartError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                    {addToCartError}
                  </div>
                )}
              </div>

              {/* NEW: Sticky Footer with Quantity and Add Button */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 flex items-center gap-4">
                {/* Quantity Selector */}
                <div className="flex items-center justify-between bg-gray-100 rounded-full px-4 py-2 min-w-[120px]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      if (quantity > 1) setQuantity(q => q - 1)
                    }}
                    disabled={addToCartLoading || quantity <= 1}
                    className="text-gray-600 hover:text-gray-900 disabled:opacity-30 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="font-semibold text-lg w-8 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setQuantity(q => q + 1)
                    }}
                    disabled={addToCartLoading}
                    className="text-gray-600 hover:text-gray-900 disabled:opacity-30 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Add to Order Button */}
                <button
                  type="submit"
                  className={`flex-1 ${
                    addToCartLoading || !validationState.isValid
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-navbartextcolor hover:bg-navbartextcolor/90"
                  } text-white px-6 py-3 rounded-full transition-all font-bold text-lg flex items-center justify-between shadow-md hover:shadow-lg`}
                  onClick={async (e) => {
                    e.preventDefault()

                    setAddToCartError(null)

                    if (!validationState.isValid) {
                      showToast(validationState.message, "error")
                      return
                    }

                    if (!isAuthenticated) {
                      setIsItemModalOpen(false)
                      setTimeout(() => setIsLoginPopupOpen(true), 100)
                      return
                    }

                    setAddToCartLoading(true)

                    try {
                      // NEW: Transform options map into required backend format [{id: 1, quantity: 2}, ...]
                      const option_items = Object.values(selectedOptions).flatMap(groupOpts => 
                        Object.entries(groupOpts).map(([id, qty]) => ({ id: Number(id), quantity: qty }))
                      )

                      // Pass the quantity to the API call
                      // Note: We cast option_items to any here to satisfy the API definition if it hasn't been updated in this context yet
                      await addToCartAPI(selectedItem.id, quantity, selectedVariationId ?? undefined, option_items as any)

                      setCartItemsCount((prev) => prev + quantity)
                      setSelectedOptions({})
                      setQuantity(1) // Reset quantity

                      setTimeout(() => {
                        if (!isFetchingCart.current) {
                          fetchCartData()
                        }
                      }, 500)

                      setIsItemModalOpen(false)
                      showToast("Added to order!", "success")
                      setAddToCartLoading(false)
                    } catch (err: any) {
                      if (err.message?.includes("Invalid token")) {
                        setAddToCartLoading(false)
                        setIsItemModalOpen(false)
                        setTimeout(() => setIsLoginPopupOpen(true), 100)
                        return
                      }

                      const errorMessage = err.message || "Failed to add to cart"
                      setAddToCartError(errorMessage)
                      showToast(errorMessage, "error")
                      setAddToCartLoading(false)
                    }
                  }}
                  disabled={addToCartLoading || !validationState.isValid}
                >
                  {addToCartLoading ? (
                    <div className="flex items-center justify-center w-full">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" /> 
                      <span>Adding...</span>
                    </div>
                  ) : (
                    <>
                      <span>Add to Order</span>
                      <span>${calculateTotal.toFixed(2)}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <main className="flex-1 container mx-auto px-4 pb-24 pt-4 md:pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 lg:col-span-3">
            <div className="sticky top-20">
              <RestaurantInfo
                isAuthenticated={isAuthenticated}
                setLoginPopupOpen={setIsLoginPopupOpen}
                selectedBranchIdPassed={selectedBranchId}
                setCartOpen={setIsCartOpen}
                updateSelectedBranchId={updateSelectedBranchId}
              />
            </div>
          </div>
          <div className="md:col-span-8 lg:col-span-9">
            <Categories onItemClick={handleAddItemToOrderClick} selectedBranchId={selectedBranchId} />
          </div>
        </div>
      </main>
      <span className="ml-2 flex items-center justify-center space-x-2">
        <span>Powered by</span>
        <span className="text-orange-600 font-semibold">QuickBiteNow</span>
      </span>

      {/* Offers Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          className="rounded-full w-14 h-14 flex items-center justify-center shadow-lg bg-navbartextcolor hover:bg-navbartextcolor/80 text-white"
          onClick={() => setIsOffersSheetOpen(true)}
          aria-label="View Offers"
        >
          <Tag className="h-6 w-6" />
        </Button>
      </div>

      {/* Offers Sheet */}
      <OffersSheet
        isOpen={isOffersSheetOpen}
        onClose={() => setIsOffersSheetOpen(false)}
        offers={publicOffers}
        onApplyOfferClick={handleAddItemToOrderClick}
      />
    </div>
  )
}