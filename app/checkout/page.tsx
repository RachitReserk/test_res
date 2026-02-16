"use client"
import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  MapPin,
  ShoppingCart,
  CheckCircle2,
  Edit2,
  Clock,
  Loader2,
  AlertCircle,
  Tag,
  X,
  Gift,
  Sparkles,
  Car,
} from "lucide-react"
import { PhoneInput } from "@/components/phone-input"
import { isValidPhoneNumber } from "libphonenumber-js"
import {
  getCheckout,
  setMode,
  addInstruction,
  setPaymentMethod,
  setTip,
  selectAddress,
  createAddress,
  confirmOrder,
  requestDeliveryQuote,
  cancelCheckout,
  getAddresses,
  getDeliveryProviders,
} from "@/lib/api/checkout"
import { toast } from "sonner"
import AuthorizeNetForm from "./component/AuthorizeNetForm"
import { cn } from "@/lib/utils"
import { fetchEligibleOffers, applyOffer, removeOffer, type Offer } from "@/lib/api/offers"
import { Toaster } from "@/components/ui/sonner"
import { CheckoutItemModal } from "./component/CheckoutItemModal"
// Import Shadcn Select components
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

const US_STATES = [
  { value: "Alabama", label: "Alabama" },
  { value: "Alaska", label: "Alaska" },
  { value: "Arizona", label: "Arizona" },
  { value: "Arkansas", label: "Arkansas" },
  { value: "California", label: "California" },
  { value: "Colorado", label: "Colorado" },
  { value: "Connecticut", label: "Connecticut" },
  { value: "Delaware", label: "Delaware" },
  { value: "District Of Columbia", label: "District Of Columbia" },
  { value: "Florida", label: "Florida" },
  { value: "Georgia", label: "Georgia" },
  { value: "Hawaii", label: "Hawaii" },
  { value: "Idaho", label: "Idaho" },
  { value: "Illinois", label: "Illinois" },
  { value: "Indiana", label: "Indiana" },
  { value: "Iowa", label: "Iowa" },
  { value: "Kansas", label: "Kansas" },
  { value: "Kentucky", label: "Kentucky" },
  { value: "Louisiana", label: "Louisiana" },
  { value: "Maine", label: "Maine" },
  { value: "Maryland", label: "Maryland" },
  { value: "Massachusetts", label: "Massachusetts" },
  { value: "Michigan", label: "Michigan" },
  { value: "Minnesota", label: "Minnesota" },
  { value: "Mississippi", label: "Mississippi" },
  { value: "Missouri", label: "Missouri" },
  { value: "Montana", label: "Montana" },
  { value: "Nebraska", label: "Nebraska" },
  { value: "Nevada", label: "Nevada" },
  { value: "New Hampshire", label: "New Hampshire" },
  { value: "New Jersey", label: "New Jersey" },
  { value: "New Mexico", label: "New Mexico" },
  { value: "New York", label: "New York" },
  { value: "North Carolina", label: "North Carolina" },
  { value: "North Dakota", label: "North Dakota" },
  { value: "Ohio", label: "Ohio" },
  { value: "Oklahoma", label: "Oklahoma" },
  { value: "Oregon", label: "Oregon" },
  { value: "Pennsylvania", label: "Pennsylvania" },
  { value: "Rhode Island", label: "Rhode Island" },
  { value: "South Carolina", label: "South Carolina" },
  { value: "South Dakota", label: "South Dakota" },
  { value: "Tennessee", label: "Tennessee" },
  { value: "Texas", label: "Texas" },
  { value: "Utah", label: "Utah" },
  { value: "Vermont", label: "Vermont" },
  { value: "Virginia", label: "Virginia" },
  { value: "Washington", label: "Washington" },
  { value: "West Virginia", label: "West Virginia" },
  { value: "Wisconsin", label: "Wisconsin" },
  { value: "Wyoming", label: "Wyoming" },
];

export default function CheckoutPage() {
  const router = useRouter()
  const [checkoutData, setCheckoutData] = useState<any>(null)
  const [addresses, setAddresses] = useState<any[]>([])
  const [addressValidationStatus, setAddressValidationStatus] = useState<
    Record<number, "checking" | "valid" | "invalid">
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(1)
  const [deliveryQuoteRequested, setDeliveryQuoteRequested] = useState(false)
  
  // --- Delivery Scheduling ---
  const [availableProviders, setAvailableProviders] = useState<string[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>("") 
  const [deliveryProvider, setDeliveryProvider] = useState<string | null>(null)
  const [deliveryTiming, setDeliveryTiming] = useState<"asap" | "scheduled">("asap")
  const [scheduledSlot, setScheduledSlot] = useState<string>("") // HH:MM
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  // --- Pickup Scheduling (NEW) ---
  const [pickupTiming, setPickupTiming] = useState<"asap" | "scheduled">("asap")
  const [pickupScheduledSlot, setPickupScheduledSlot] = useState<string>("") // HH:MM

  // State for item modal for free item offers
  const [isCheckoutItemModalOpen, setIsCheckoutItemModalOpen] = useState(false)
  const [selectedFreeItem, setSelectedFreeItem] = useState<any>(null)
  const [currentFreeItemOfferId, setCurrentFreeItemOfferId] = useState<string | null>(null)
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  // State for inputs
  const [restaurantInstructions, setRestaurantInstructions] = useState("")
  const [deliveryInstructions, setDeliveryInstructions] = useState("")
  const [tipAmount, setTipAmount] = useState(0)
  const [customTip, setCustomTip] = useState("")
  const [couponError, setCouponError] = useState<string | null>(null)

  const [eligibleOffers, setEligibleOffers] = useState<Offer[]>([])
  const [appliedOffer, setAppliedOffer] = useState<any>(null)
  const [offerCode, setOfferCode] = useState("")
  const [offerLoading, setOfferLoading] = useState(false)
  const [offerError, setOfferError] = useState<string | null>(null)
  const [showOffersSection, setShowOffersSection] = useState(false)

  // State for modals
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  
  // State for new address form
  const [newAddress, setNewAddress] = useState({
    name: "",
    street_address: "",
    sub_premise: "",
    city: "",
    state: "",
    zip_code: "",
    phone_number: "",
  })
  const [formErrors, setFormErrors] = useState<any>({})
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)

  const loadAddresses = async () => {
    try {
      const fetchedAddresses = await getAddresses()
      setAddresses(fetchedAddresses.addresses)
    } catch (err) {
      toast.error("Failed to load addresses.")
    }
  }

  const loadEligibleOffers = async (orderId: string) => {
    try {
      setOfferLoading(true)
      const response = await fetchEligibleOffers(orderId)
      setEligibleOffers(response.eligible_offers)
      setOfferError(null)
    } catch (err: any) {
      console.error("Error fetching offers:", err)
      setOfferError("Failed to load available offers")
      setEligibleOffers([])
    } finally {
      setOfferLoading(false)
    }
  }

  // --- Load Providers ---
  const loadDeliveryProviders = async (orderId: number) => {
    try {
        const response = await getDeliveryProviders(orderId)
        if (response.status === "success" && Array.isArray(response.providers)) {
            setAvailableProviders(response.providers)
            
            // If only one provider exists, force select it
            if (response.providers.length === 1) {
                setSelectedProvider(response.providers[0])
            } 
            // If multiple, and we don't have a selection yet, default to 'doordash' if available, else first
            else if (response.providers.length > 1 && !selectedProvider) {
                if (response.providers.includes("doordash")) setSelectedProvider("doordash")
                else setSelectedProvider(response.providers[0])
            }
        }
    } catch (err) {
        console.error("Failed to load delivery providers", err)
    }
  }

  const handleApplyOffer = async (code?: string, offerId?: string) => {
    if (!checkoutData?.order_id) return

    setOfferLoading(true)
    setOfferError(null)

    try {
      const offerToApply = eligibleOffers.find((offer) => offer.id.toString() === offerId)

      if (
        offerToApply?.offer_type === "FREE_ITEM_ADDITION" &&
        offerToApply.free_items &&
        offerToApply.free_items.length > 0
      ) {
        // Fetch item details and open modal
        const itemId = offerToApply.free_items[0]
        setCurrentFreeItemOfferId(offerId || null)
        const res = await fetch(
          `${API_URL}/customer/item/${itemId}/?restaurant=${process.env.NEXT_PUBLIC_RESTAURANT_ID}`,
        )
        const json = await res.json()
        if (json.status === "success") {
          setSelectedFreeItem(json.data)
          setIsCheckoutItemModalOpen(true)
        } else {
          throw new Error("Failed to fetch free item details.")
        }
      } else {
        const result = await applyOffer(checkoutData.order_id, code, offerId)
        setAppliedOffer(result.applied_offer)
        setOfferCode("")
        await fetchCheckoutData(false)
        toast.success(result.message || "Offer has been successfully applied to your order.")
      }
    } catch (err: any) {
      setOfferError(err.message)
      toast.error(err.message || "Failed to apply offer.")
    } finally {
      setOfferLoading(false)
    }
  }

  const handleApplyFreeItemOffer = async (offerId: string, variationId?: number, optionIds?: number[]) => {
    if (!checkoutData?.order_id || !selectedFreeItem) return

    setOfferLoading(true)
    setOfferError(null)

    try {
      const result = await applyOffer(
        checkoutData.order_id,
        undefined,
        offerId,
        variationId,
        optionIds,
        selectedFreeItem.id,
      )
      setAppliedOffer(result.applied_offer)
      setOfferCode("")
      await fetchCheckoutData(false)
      toast.success(result.message || "Offer has been successfully applied to your order.")
    } catch (err: any) {
      setOfferError(err.message)
      toast.error(err.message || "Failed to apply offer.")
    } finally {
      setOfferLoading(false)
      setIsCheckoutItemModalOpen(false)
      setSelectedFreeItem(null)
      setCurrentFreeItemOfferId(null)
    }
  }

  const handleRemoveOffer = async () => {
    if (!checkoutData?.order_id || !appliedOffer) return

    setOfferLoading(true)
    setOfferError(null)

    try {
      const result = await removeOffer(checkoutData.order_id, undefined, appliedOffer.id.toString())
      setAppliedOffer(null)
      await fetchCheckoutData(false)
      toast.success(result.message || "Offer has been successfully applied to your order.")
    } catch (err: any) {
      setOfferError(err.message)
      toast.error(err.message || "Failed to apply offer.")
    } finally {
      setOfferLoading(false)
    }
  }

  const updateActiveStep = (data: any) => {
    if (!data) return
    if (!data.mode) {
      setActiveStep(1)
    } else if (
      (data.mode === "delivery" && (!data.selected_address || !data.quote_created)) ||
      (data.mode === "pickup") // Pickup step logic handled inside step 2 rendering
    ) {
      setActiveStep(2)
    } else {
      setActiveStep(3)
    }
  }

  const fetchCheckoutData = async (showFullPageLoading = true) => {
    if (showFullPageLoading) setLoading(true)
    setProcessingAction("fetch")
    try {
      const response = await getCheckout()
      if (response.status === "success" && response.checkout) {
        const checkout = response.checkout
        setCheckoutData(checkout)
        setRestaurantInstructions(checkout.restaurant_instructions || "")
        setDeliveryInstructions(checkout.delivery_instructions || "")
        setTipAmount(checkout.invoice?.tip || 0)

        setAppliedOffer(checkout.invoice?.applied_offer || null)

        // Sync local provider state
        if (checkout.delivery && checkout.delivery.provider) {
             setSelectedProvider(checkout.delivery.provider)
             setDeliveryProvider(checkout.delivery.provider)
        }

        // --- SYNC DELIVERY TIMING ---
        if (checkout.mode === "delivery") {
          setDeliveryQuoteRequested(checkout.quote_created || false)
          
          if (checkout.order_id) {
            loadDeliveryProviders(checkout.order_id)
          }

          if (checkout.pickup_time) {
            setDeliveryTiming("scheduled")
            const existingDate = new Date(checkout.pickup_time)
            if (!isNaN(existingDate.getTime())) {
                const hour = String(existingDate.getHours()).padStart(2, '0')
                const minute = String(existingDate.getMinutes()).padStart(2, '0')
                setScheduledSlot(`${hour}:${minute}`)
            }
          } else {
            setDeliveryTiming("asap")
            setScheduledSlot("")
          }

          if (!checkout.quote_created && checkout.selected_address) {
            checkout.selected_address = null
            setCheckoutData(checkout)
          }
        } else if (checkout.mode === "pickup") {
            setDeliveryQuoteRequested(false)
            setDeliveryProvider(null)
            
            // --- SYNC PICKUP TIMING ---
            // Logic: Even ASAP has a pickup_time now (current time).
            // We differentiate by checking if the time is significantly in the future (e.g., > 30 mins)
            if (checkout.pickup_time) {
                const pickupDate = new Date(checkout.pickup_time)
                const now = new Date()
                const diffInMinutes = (pickupDate.getTime() - now.getTime()) / 60000

                // If pickup time is more than 30 mins away, assume Scheduled. 
                // Otherwise assume ASAP (as ASAP sets it to 'now').
                if (diffInMinutes > 30) {
                    setPickupTiming("scheduled")
                    const hour = String(pickupDate.getHours()).padStart(2, '0')
                    const minute = String(pickupDate.getMinutes()).padStart(2, '0')
                    setPickupScheduledSlot(`${hour}:${minute}`)
                } else {
                    setPickupTiming("asap")
                    setPickupScheduledSlot("")
                }
            } else {
                // Fallback for old orders with null time
                setPickupTiming("asap")
                setPickupScheduledSlot("")
            }
        }

        updateActiveStep(checkout)

        if (checkout.order_id) {
          loadEligibleOffers(checkout.order_id)
        }
      } else {
        setError("No active checkout.")
      }
    } catch (err: any) {
      console.error("Error fetching checkout:", err)
      setError("Failed to load checkout data.")
    } finally {
      setLoading(false)
      setProcessingAction(null)
    }
  }

  useEffect(() => {
    const token = document.cookie.split("; ").find((row) => row.startsWith("clientAuthToken="))
    if (!token) {
      router.push("/client/login")
      return
    }
    fetchCheckoutData()
    loadAddresses()
  }, [router])

  const handleModeChange = async (newMode: "pickup" | "delivery") => {
    if (!checkoutData?.order_id) return
    setProcessingAction("mode")
    try {
      if (newMode === "pickup") {
        // Set mode to pickup with CURRENT time (ASAP) instead of null
        await setMode(checkoutData.order_id, "pickup", new Date().toISOString())
        setPickupTiming("asap")
        setPickupScheduledSlot("")
        setDeliveryQuoteRequested(false)
        setDeliveryProvider(null)
        await fetchCheckoutData(false)
      } else {
        await setMode(checkoutData.order_id, newMode, undefined)
        setDeliveryQuoteRequested(false)
        setDeliveryProvider(null)
        await fetchCheckoutData(false)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update order type.")
    } finally {
      setProcessingAction(null)
    }
  }

  const handlePickupTimingToggle = async (value: "asap" | "scheduled") => {
      setPickupTiming(value)
      
      if (value === "asap" && checkoutData?.order_id) {
          setProcessingAction("pickupSchedule")
          try {
               // Send CURRENT TIME for ASAP
               await setMode(checkoutData.order_id, "pickup", new Date().toISOString())
               setPickupScheduledSlot("")
               await fetchCheckoutData(false)
          } catch(err:any) {
               toast.error("Failed to set pickup time to ASAP.")
          } finally {
               setProcessingAction(null)
          }
      }
  }

  const handlePickupSlotSelection = async (timeSlot: string) => {
      if (!checkoutData?.order_id || !timeSlot) return
      setPickupScheduledSlot(timeSlot)
      setProcessingAction("pickupSchedule")
      try {
          const today = new Date()
          const [hours, minutes] = timeSlot.split(":")
          today.setHours(Number(hours), Number(minutes), 0, 0)
          const isoTime = today.toISOString()
          await setMode(checkoutData.order_id, "pickup", isoTime)
          await fetchCheckoutData(false)
      } catch (err: any) {
          toast.error(err.message || "Failed to schedule pickup time.")
      } finally {
          setProcessingAction(null)
      }
  }

  const handleDeliveryTimingToggle = async (value: "asap" | "scheduled") => {
      setDeliveryTiming(value)
      setScheduleError(null)

      if (value === "asap" && checkoutData?.order_id) {
          setProcessingAction("schedule")
          try {
              // Revert to ASAP by sending null
              await setMode(checkoutData.order_id, "delivery", null)
              setScheduledSlot("")
              await fetchCheckoutData(false)
          } catch (err: any) {
              toast.error("Failed to update delivery time.")
          } finally {
              setProcessingAction(null)
          }
      }
  }

  const handleDeliverySlotSelection = async (timeSlot: string) => {
      if (!checkoutData?.order_id || !timeSlot) return
      
      setScheduledSlot(timeSlot)
      setScheduleError(null)
      setProcessingAction("schedule")

      // 1. Construct ISO Date for Today + Slot
      const today = new Date()
      const [hours, minutes] = timeSlot.split(":")
      today.setHours(Number(hours), Number(minutes), 0, 0)

      // 2. Frontend Validation: Buffer Check (45 mins) - Redundant if grid is generated correctly, but good for safety
      const minTime = new Date(Date.now() + 45 * 60000)
      if (today < minTime) {
         setScheduleError("Selected time is too soon. Please choose a later slot.")
         setProcessingAction(null)
         return
      }

      // 3. API Call
      try {
          const isoString = today.toISOString()
          await setMode(checkoutData.order_id, "delivery", isoString)
          toast.success(`Delivery scheduled for ${timeSlot}`)
          await fetchCheckoutData(false)
      } catch (err: any) {
          console.error("Scheduling failed:", err)
          setScheduleError(err.message || "Selected time is unavailable.")
          toast.error(err.message || "Failed to schedule delivery.")
          setScheduledSlot("") // Reset if failed
      } finally {
          setProcessingAction(null)
      }
  }

  const validateAddressForDelivery = async (addressId: number, providerOverride?: string): Promise<boolean> => {
    if (!checkoutData?.order_id) return false
    const providerToUse = providerOverride || selectedProvider
    
    if (!providerToUse) {
        toast.error("Please select a delivery service provider first.")
        return false
    }

    setAddressValidationStatus((prev) => ({ ...prev, [addressId]: "checking" }))
    try {
      await selectAddress(checkoutData.order_id, addressId)
      // Pass provider to quote request
      const quoteResult = await requestDeliveryQuote(checkoutData.order_id, providerToUse)
      
      if (quoteResult && quoteResult.provider) {
          setDeliveryProvider(quoteResult.provider)
      }

      setAddressValidationStatus((prev) => ({ ...prev, [addressId]: "valid" }))
      setDeliveryQuoteRequested(true)
      return true 
    } catch (err: any) {
      console.error("Address validation failed:", err)
      setAddressValidationStatus((prev) => ({ ...prev, [addressId]: "invalid" }))
      setDeliveryQuoteRequested(false)
      setDeliveryProvider(null)
      
      if (err.details?.reason === "distance_too_long" || err.details?.code === "invalid_delivery_parameters") {
        toast.error(`This address is outside our ${providerToUse === 'uber' ? 'Uber' : 'DoorDash'} delivery area.`)
      } else {
        toast.error(err.message || "Address validation failed.")
      }
      return false 
    }
  }
  
  const handleProviderChange = async (provider: string) => {
      setSelectedProvider(provider)
      
      // If an address is already selected, re-validate immediately with the new provider
      if (selectedAddressId) {
          setProcessingAction("address")
          const success = await validateAddressForDelivery(selectedAddressId, provider)
          if (success) {
             await fetchCheckoutData(false)
          }
          setProcessingAction(null)
      }
  }

  const handleAddressSelect = async (addressId: number) => {
    if (!checkoutData?.order_id) return

    const validationStatus = addressValidationStatus[addressId]
    if (validationStatus === "invalid") {
      toast.error("This address is outside our delivery area. Please select a different address.")
      return
    }

    setProcessingAction("address")
    try {
      const success = await validateAddressForDelivery(addressId)
      if (!success) {
        setActiveStep(2)
        return
      }
      await fetchCheckoutData(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to select address.")
      setActiveStep(2)
    } finally {
      setProcessingAction(null)
    }
  }

  const handleCreateAddress = async () => {
    const newFormErrors: any = {}
    if (!newAddress.name.trim()) newFormErrors.name = "Name is required"
    if (!newAddress.street_address.trim()) newFormErrors.street_address = "Street address is required"
    if (!newAddress.city.trim()) newFormErrors.city = "City is required"
    if (!newAddress.state.trim()) newFormErrors.state = "State is required"
    if (!newAddress.zip_code.trim()) newFormErrors.zip_code = "ZIP code is required"
    if (!newAddress.phone_number.trim()) {
      newFormErrors.phone_number = "Phone number is required"
    } else if (!isValidPhoneNumber(newAddress.phone_number)) {
      newFormErrors.phone_number = ""
    }

    if (Object.keys(newFormErrors).length > 0) {
      setFormErrors(newFormErrors)
      return
    }

    setProcessingAction("createAddress")
    try {
      await createAddress(newAddress)
      setShowAddressDialog(false)
      setNewAddress({
        name: "",
        street_address: "",
        sub_premise: "",
        city: "",
        state: "",
        zip_code: "",
        phone_number: "",
      })
      await loadAddresses()
      await fetchCheckoutData(false)
      toast.success("Address added successfully.")
    } catch (err: any) {
      toast.error("Failed to add address. Please check the ZIP code and state.")
    } finally {
      setProcessingAction(null)
    }
  }

  const handleTipChange = async (amount: number) => {
    if (!checkoutData?.order_id) return
    setProcessingAction("tip")
    try {
      await setTip(checkoutData.order_id, amount)
      await fetchCheckoutData(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to set tip.")
    } finally {
      setProcessingAction(null)
    }
  }

  const handlePaymentMethodChange = async (method: "online" | "offline") => {
    if (!checkoutData?.order_id) return
    setProcessingAction("payment")
    try {
      await setPaymentMethod(checkoutData.order_id, method)
      await fetchCheckoutData(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to update payment method.")
    } finally {
      setProcessingAction(null)
    }
  }

  const handlePlaceOrder = async () => {
    if (!checkoutData?.order_id) return
    setProcessingAction("confirm")
    try {
      await confirmOrder(checkoutData.order_id, checkoutData)
      router.push(`/order-confirmation/${checkoutData.order_id}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm your order.")
      setProcessingAction(null)
    }
  }

  const handleCancelCheckout = async () => {
    if (!checkoutData?.order_id) return
    setProcessingAction("cancel")
    try {
      await cancelCheckout()
      toast.success("Your order has been successfully canceled.")
      router.push("/")
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel checkout.")
    } finally {
      setProcessingAction(null)
    }
  }

  const handleCancelCheckout2 = async () => {
    if (!checkoutData?.order_id) return
    setProcessingAction("cancel")
    try {
      await cancelCheckout()
      router.push("/")
    } catch (err: any) {
      toast.error(err.message || "Failed")
    } finally {
      setProcessingAction(null)
    }
  }

  // --- Pickup Time Slots ---
  const generatePickupTimeSlots = useMemo(() => {
    if (!checkoutData?.branch?.opening_time || !checkoutData?.branch?.closing_time) return []
    const slots = []
    const now = new Date()
    const { opening_time, closing_time } = checkoutData.branch
    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(":").map(Number)
      const date = new Date(now)
      date.setHours(hours, minutes, 0, 0)
      return date
    }
    const openDate = parseTime(opening_time)
    const closeDate = parseTime(closing_time)
    if (closeDate <= openDate) closeDate.setDate(closeDate.getDate() + 1)
    
    // Pickup Buffer: 30 mins
    const startConstraint = new Date(openDate.getTime() + 30 * 60000)
    const endConstraint = new Date(closeDate.getTime() - 30 * 60000)
    
    const nextAvailableSlot = new Date(now)
    nextAvailableSlot.setSeconds(0, 0)
    
    // Round to next 30 min
    if (nextAvailableSlot.getMinutes() < 30) {
      nextAvailableSlot.setMinutes(30)
    } else {
      nextAvailableSlot.setHours(nextAvailableSlot.getHours() + 1)
      nextAvailableSlot.setMinutes(0)
    }
    
    // Ensure we are at least 30 mins from NOW for prep time (Standard ASAP is faster, scheduled has buffer)
    const bufferTime = new Date(now.getTime() + 30 * 60000) 
    let currentSlot = new Date(Math.max(startConstraint.getTime(), nextAvailableSlot.getTime(), bufferTime.getTime()))
    
    // Normalize minutes to 00 or 30 to keep grid clean
    if (currentSlot.getMinutes() !== 0 && currentSlot.getMinutes() !== 30) {
        if(currentSlot.getMinutes() < 30) currentSlot.setMinutes(30,0,0)
        else {
            currentSlot.setHours(currentSlot.getHours()+1)
            currentSlot.setMinutes(0,0,0)
        }
    }

    while (currentSlot <= endConstraint) {
       slots.push(currentSlot.toTimeString().slice(0, 5))
       currentSlot.setMinutes(currentSlot.getMinutes() + 30)
    }
    return slots
  }, [checkoutData])

  // --- Delivery Time Slots ---
  const generateDeliverySlots = useMemo(() => {
    if (!checkoutData?.branch?.opening_time || !checkoutData?.branch?.closing_time) return []
    const slots = []
    const now = new Date()
    const { opening_time, closing_time } = checkoutData.branch
    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(":").map(Number)
      const date = new Date(now)
      date.setHours(hours, minutes, 0, 0)
      return date
    }
    const openDate = parseTime(opening_time)
    const closeDate = parseTime(closing_time)
    if (closeDate <= openDate) closeDate.setDate(closeDate.getDate() + 1)
    
    // DELIVERY BUFFER: 45 mins
    const startConstraint = new Date(openDate.getTime() + 30 * 60000)
    const endConstraint = new Date(closeDate.getTime() - 30 * 60000)
    
    const minDeliveryTime = new Date(now.getTime() + 45 * 60000)

    if (minDeliveryTime.getMinutes() > 0 && minDeliveryTime.getMinutes() <= 30) {
        minDeliveryTime.setMinutes(30, 0, 0)
    } else if (minDeliveryTime.getMinutes() > 30) {
        minDeliveryTime.setHours(minDeliveryTime.getHours() + 1)
        minDeliveryTime.setMinutes(0, 0, 0)
    } else {
        minDeliveryTime.setSeconds(0, 0)
    }

    let currentSlot = new Date(Math.max(startConstraint.getTime(), minDeliveryTime.getTime()))
    
    while (currentSlot <= endConstraint) {
       slots.push(currentSlot.toTimeString().slice(0, 5))
       currentSlot.setMinutes(currentSlot.getMinutes() + 30)
    }
    return slots
  }, [checkoutData])


  const { invoice = {}, items: cartItems = [], mode, selected_address, pickup_time, branch } = checkoutData || {}

  const branchId = branch?.id

  const isDeliveryDisabled = useMemo(() => {
    if (!branchId) return false;
    const disabledIdsString = process.env.NEXT_PUBLIC_DISABLED_DELIVERY_BRANCH_IDS || "";
    const disabledIds = disabledIdsString.split(',').map(id => id.trim());
    return disabledIds.includes(branchId.toString());
  }, [branchId]);

  const isOrderingDisabled = useMemo(() => {
    if (!branchId) return false;
    const disabledIdsString = process.env.NEXT_PUBLIC_DISABLED_ORDERING_BRANCH_IDS || "";
    const disabledIds = disabledIdsString.split(',').map(id => id.trim());
    return disabledIds.includes(branchId.toString());
  }, [branchId]);

  const selectedAddressId = useMemo(() => {
    if (!selected_address || !addresses.length) return undefined
    const selected = addresses.find((addr) => addr.full_address === selected_address)
    return selected?.id
  }, [selected_address, addresses])

  if (loading)
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
        <div className="h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full p-4">
        <h2 className="text-xl font-bold text-red-600 mb-6">{error}</h2>
        <Button onClick={() => router.push("/")}>Return to Home</Button>
      </div>
    )

  if (!checkoutData)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Add items to your cart to start a checkout session.</p>
        <Button onClick={() => router.push("/order")} className="bg-orange-600 hover:bg-orange-700">
          Browse Menu
        </Button>
      </div>
    )

  const isModeSelected = !!mode
  const isDeliveryDetailsComplete =
    mode === "delivery" && !!selected_address && (checkoutData?.quote_created || deliveryQuoteRequested)
  // Logic updated: Pickup is complete if mode is pickup (default is ASAP), or if scheduled time is selected
  const isPickupDetailsComplete = mode === "pickup"
  const areCoreDetailsComplete = isDeliveryDetailsComplete || isPickupDetailsComplete
  const isPaymentSelected = !!invoice.payment_method

  const shouldShowTotal = mode === "pickup" || (mode === "delivery" && deliveryQuoteRequested)
  const total = shouldShowTotal ? invoice.total || 0 : 0

  const getStepVisitable = (stepNumber: number) => {
    if (stepNumber === 1) return true
    if (stepNumber === 2) return isModeSelected
    if (stepNumber === 3) return areCoreDetailsComplete
    return false
  }

  const renderStep = (
    stepNumber: number,
    title: string,
    completeCondition: boolean,
    children: React.ReactNode,
    summary?: React.ReactNode,
  ) => {
    const isComplete = completeCondition
    const isActive = activeStep === stepNumber
    const isVisitable = getStepVisitable(stepNumber)

    return (
      <Card className={cn("transition-all", !isVisitable && "bg-gray-50 opacity-60")}>
        <CardHeader
          className={cn("flex flex-row items-center justify-between", isVisitable && "cursor-pointer")}
          onClick={() => isVisitable && setActiveStep(stepNumber)}
        >
          <div className="flex items-center gap-4">
            {isComplete ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <div
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-sm font-bold",
                  isActive ? "bg-black text-white" : "bg-gray-200",
                )}
              >
                {stepNumber}
              </div>
            )}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {isComplete && !isActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                if (isVisitable) setActiveStep(stepNumber)
              }}
            >
              <Edit2 className="h-4 w-4 mr-2" /> Edit
            </Button>
          )}
        </CardHeader>
        {isActive && <CardContent>{children}</CardContent>}
        {isComplete && !isActive && summary && (
          <CardContent className="text-sm text-muted-foreground">{summary}</CardContent>
        )}
      </Card>
    )
  }

  const subtotal = invoice.initial_price || 0
  const taxAmount = shouldShowTotal
    ? total - subtotal - (invoice.delivery_fee || 0) - (invoice.tip || 0) + (invoice.discount_applied || 0)
    : 0

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          {renderStep(
            1,
            "Order Type",
            isModeSelected,
            <div>
              <RadioGroup
                value={mode || ""}
                onValueChange={(value: "pickup" | "delivery") => handleModeChange(value)}
                className="flex gap-4"
                disabled={!!processingAction}
              >
                <Label
                  htmlFor="pickup"
                  className={cn(
                    "flex-1 p-4 border rounded-lg cursor-pointer transition-colors",
                    mode === "pickup" && "border-orange-500 bg-orange-50",
                  )}
                >
                  <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
                  Pickup
                </Label>
                <Label
                  htmlFor="delivery"
                  className={cn(
                    "flex-1 p-4 border rounded-lg cursor-pointer transition-colors",
                    mode === "delivery" && "border-orange-500 bg-orange-50",
                    isDeliveryDisabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <RadioGroupItem value="delivery" id="delivery" className="sr-only" disabled={isDeliveryDisabled} />
                  Delivery
                </Label>
              </RadioGroup>
              {isDeliveryDisabled && (
                <p className="text-sm text-red-500 mt-2">Delivery is currently disabled for this location.</p>
              )}
            </div>,
            <p className="font-medium capitalize">{mode}</p>,
          )}

          {renderStep(
            2,
            mode === "pickup" ? "Pickup Details" : "Delivery Details",
            areCoreDetailsComplete,
            <>
              {mode === "pickup" && (
                <div className="space-y-6">
                   {/* --- Pickup Scheduling (Grid View) --- */}
                  <div className="border-b pb-6">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        When would you like to pickup?
                      </h3>
                      
                      <RadioGroup
                          value={pickupTiming}
                          onValueChange={(val: "asap" | "scheduled") => handlePickupTimingToggle(val)}
                          className="flex gap-4 mb-4"
                          disabled={!!processingAction}
                      >
                           <Label
                              htmlFor="pickup-asap"
                              className={cn(
                                "flex-1 p-3 border rounded-lg cursor-pointer transition-colors text-center text-sm font-medium",
                                pickupTiming === "asap" && "border-orange-500 bg-orange-50 text-orange-700",
                              )}
                            >
                              <RadioGroupItem value="asap" id="pickup-asap" className="sr-only" />
                              Standard Pickup (ASAP)
                            </Label>
                            <Label
                              htmlFor="pickup-scheduled"
                              className={cn(
                                "flex-1 p-3 border rounded-lg cursor-pointer transition-colors text-center text-sm font-medium",
                                pickupTiming === "scheduled" && "border-orange-500 bg-orange-50 text-orange-700",
                              )}
                            >
                              <RadioGroupItem value="scheduled" id="pickup-scheduled" className="sr-only" />
                              Schedule for Later
                            </Label>
                      </RadioGroup>

                      {/* PICKUP TIME SLOT GRID */}
                      {pickupTiming === "scheduled" && (
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
                             <div className="mb-3">
                                 <p className="text-sm font-medium text-gray-700 mb-2">Select a time for today:</p>
                                 {generatePickupTimeSlots.length > 0 ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                        {generatePickupTimeSlots.map((time) => (
                                          <Button
                                            key={time}
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                              "w-full",
                                              pickupScheduledSlot === time && "bg-orange-600 border-orange-600 text-white hover:bg-orange-700 hover:text-white"
                                            )}
                                            onClick={() => handlePickupSlotSelection(time)}
                                            disabled={processingAction === "pickupSchedule"}
                                          >
                                            {new Date(`1970-01-01T${time}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                                          </Button>
                                        ))}
                                    </div>
                                 ) : (
                                     <div className="text-center p-4 bg-white rounded border border-gray-200">
                                         <p className="text-sm text-gray-500">No scheduled slots available for today.</p>
                                     </div>
                                 )}
                             </div>
                          </div>
                      )}
                  </div>
                </div>
              )}
              {mode === "delivery" && (
                <div className="space-y-6">

                  {/* --- Delivery Scheduling (Grid View) --- */}
                  <div className="border-b pb-6">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        When would you like your order?
                      </h3>
                      
                      <RadioGroup
                          value={deliveryTiming}
                          onValueChange={(val: "asap" | "scheduled") => handleDeliveryTimingToggle(val)}
                          className="flex gap-4 mb-4"
                          disabled={!!processingAction}
                      >
                           <Label
                              htmlFor="timing-asap"
                              className={cn(
                                "flex-1 p-3 border rounded-lg cursor-pointer transition-colors text-center text-sm font-medium",
                                deliveryTiming === "asap" && "border-orange-500 bg-orange-50 text-orange-700",
                              )}
                            >
                              <RadioGroupItem value="asap" id="timing-asap" className="sr-only" />
                              Standard Delivery (ASAP)
                            </Label>
                            <Label
                              htmlFor="timing-scheduled"
                              className={cn(
                                "flex-1 p-3 border rounded-lg cursor-pointer transition-colors text-center text-sm font-medium",
                                deliveryTiming === "scheduled" && "border-orange-500 bg-orange-50 text-orange-700",
                              )}
                            >
                              <RadioGroupItem value="scheduled" id="timing-scheduled" className="sr-only" />
                              Schedule for Later
                            </Label>
                      </RadioGroup>

                      {/* DELIVERY TIME SLOT GRID */}
                      {deliveryTiming === "scheduled" && (
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
                             <div className="mb-3">
                                 <p className="text-sm font-medium text-gray-700 mb-2">Select a time for today:</p>
                                 {generateDeliverySlots.length > 0 ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                        {generateDeliverySlots.map((time) => (
                                          <Button
                                            key={time}
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                              "w-full",
                                              scheduledSlot === time && "bg-orange-600 border-orange-600 text-white hover:bg-orange-700 hover:text-white"
                                            )}
                                            onClick={() => handleDeliverySlotSelection(time)}
                                            disabled={processingAction === "schedule"}
                                          >
                                            {new Date(`1970-01-01T${time}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                                          </Button>
                                        ))}
                                    </div>
                                 ) : (
                                     <div className="text-center p-4 bg-white rounded border border-gray-200">
                                         <p className="text-sm text-gray-500">No scheduled slots available for today.</p>
                                     </div>
                                 )}
                             </div>
                             
                             {scheduleError && (
                                 <div className="mt-3 flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded text-sm">
                                     <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                     <p>{scheduleError}</p>
                                 </div>
                             )}
                          </div>
                      )}
                  </div>
                  
                  {/* --- Delivery Service Provider Selection --- */}
                  {availableProviders.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-medium mb-3">Select Delivery Service</h3>
                        <RadioGroup
                            value={selectedProvider || ""}
                            onValueChange={handleProviderChange}
                            className="flex gap-4"
                        >
                            {availableProviders.includes("doordash") && (
                                <Label
                                    htmlFor="doordash"
                                    className={cn(
                                        "flex-1 p-3 border rounded-lg cursor-pointer transition-colors flex items-center gap-2",
                                        selectedProvider === "doordash" && "border-orange-500 bg-orange-50"
                                    )}
                                >
                                    <RadioGroupItem value="doordash" id="doordash" className="sr-only" />
                                    <span className="font-semibold">DoorDash</span>
                                </Label>
                            )}
                            {availableProviders.includes("uber") && (
                                <Label
                                    htmlFor="uber"
                                    className={cn(
                                        "flex-1 p-3 border rounded-lg cursor-pointer transition-colors flex items-center gap-2",
                                        selectedProvider === "uber" && "border-black bg-gray-50 text-black"
                                    )}
                                >
                                    <RadioGroupItem value="uber" id="uber" className="sr-only" />
                                    <span className="font-semibold">Uber Direct</span>
                                </Label>
                            )}
                        </RadioGroup>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Select Delivery Address</h3>
                    <Button variant="outline" onClick={() => setShowAddressDialog(true)}>
                      Add New
                    </Button>
                  </div>
                  {!deliveryQuoteRequested && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Please select an address to see delivery pricing and continue with your order.
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {addresses.map((address) => {
                      const validationStatus = addressValidationStatus[address.id]
                      const isSelected = selectedAddressId === address.id
                      const isInvalid = validationStatus === "invalid"
                      const isChecking = validationStatus === "checking"

                      return (
                        <div
                          key={address.id}
                          className={cn(
                            "flex items-start p-3 border rounded-lg transition-colors",
                            isSelected && !isInvalid && "border-orange-500 bg-orange-50",
                            isInvalid && "border-red-200 bg-red-50 opacity-60",
                            !isInvalid && !isSelected && "cursor-pointer hover:border-gray-300",
                          )}
                          onClick={() => !isInvalid && !isChecking && handleAddressSelect(address.id)}
                        >
                          <div className="flex items-center mt-1">
                            {isChecking ? (
                              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                            ) : isInvalid ? (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            ) : isSelected ? (
                              <div className="h-4 w-4 rounded-full bg-orange-500 flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-white" />
                              </div>
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <p className={cn("font-semibold", isInvalid && "text-red-600")}>{address.name}</p>
                            <p className={cn("text-sm", isInvalid ? "text-red-500" : "text-muted-foreground")}>
                              {address.full_address}
                            </p>
                            {isInvalid && <p className="text-xs text-red-500 mt-1">Out of service area</p>}
                            {isChecking && <p className="text-xs text-orange-600 mt-1">Checking availability...</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {deliveryQuoteRequested && (
                    <Textarea
                      placeholder="Delivery Instructions (e.g. leave at door, optional)"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      onBlur={() => {
                        if (deliveryInstructions !== checkoutData.delivery_instructions) {
                          addInstruction(checkoutData.order_id, { delivery_instructions: deliveryInstructions })
                        }
                      }}
                    />
                  )}
                </div>
              )}
            </>,
            <>
              {isPickupDetailsComplete && (
                <div className="space-y-1">
                    {pickupTiming === "scheduled" && checkoutData?.pickup_time ? (
                        <p className="flex items-center font-medium text-orange-700">
                          <Clock className="h-4 w-4 mr-2" />
                          Scheduled Pickup: {new Date(checkoutData.pickup_time).toLocaleTimeString([], {
                              hour: "numeric", minute: "2-digit"
                          })}
                        </p>
                    ) : (
                        <p className="flex items-center font-medium">
                          <Clock className="h-4 w-4 mr-2" />
                          Standard Pickup (ASAP)
                        </p>
                    )}
                </div>
              )}
              {isDeliveryDetailsComplete && (
                <div className="space-y-1">
                   {checkoutData?.pickup_time && (
                      <p className="flex items-center font-medium text-orange-700">
                          <Clock className="h-4 w-4 mr-2" />
                          Scheduled: {new Date(checkoutData.pickup_time).toLocaleTimeString([], {
                              hour: "numeric", minute: "2-digit"
                          })}
                      </p>
                   )}
                   <p className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {selected_address}
                   </p>
                </div>
              )}
            </>,
          )}

          {renderStep(
            3,
            "Final Details & Payment",
            isPaymentSelected,
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Restaurant Instructions (optional)</h3>
                <Textarea
                  placeholder=""
                  value={restaurantInstructions}
                  onChange={(e) => setRestaurantInstructions(e.target.value)}
                  onBlur={() => {
                    if (restaurantInstructions !== checkoutData.restaurant_instructions) {
                      addInstruction(checkoutData.order_id, { restaurant_instructions: restaurantInstructions })
                    }
                  }}
                />
              </div>

              <div className="space-y-4">
                {/* Offers & Discounts Section */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-3 text-orange-800">
                      <div className="p-2 bg-orange-100 rounded-full">
                        <Tag className="h-5 w-5 text-orange-600" />
                      </div>
                      Offers & Discounts
                      <span className="text-sm font-normal bg-orange-200 text-orange-700 px-2 py-1 rounded-full">
                        Save More!
                      </span>
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOffersSection(!showOffersSection)}
                      className="font-bold text-orange-700 hover:bg-orange-100 border border-orange-300"
                    >
                      {showOffersSection ? "Hide" : "Show"} Offers
                    </Button>
                  </div>

                  {/* Applied Offer Display */}
                  {appliedOffer && (
                    <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl mb-4 shadow-md">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-green-100 rounded-full">
                            <Gift className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-green-800 text-lg">{appliedOffer.name}</h4>
                            <p className="text-sm text-green-700 mb-2">{appliedOffer.description}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full shadow-sm">
                                {appliedOffer.offer_type === "PERCENTAGE"
                                  ? `${appliedOffer.value}% OFF`
                                  : appliedOffer.offer_type === "FLAT"
                                    ? `$${appliedOffer.value} OFF`
                                    : "FREE ITEM"}
                              </span>
                              {appliedOffer.min_order_value && Number(appliedOffer.min_order_value) > 0 && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">
                                  Min. order: ${appliedOffer.min_order_value}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveOffer}
                          disabled={offerLoading}
                          className="text-green-700 hover:text-green-800 hover:bg-green-100 border border-green-300 rounded-full p-2"
                          title="Click to remove this offer"
                        >
                          {offerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="mt-3 p-2 bg-green-100 rounded-lg">
                        <p className="text-xs text-green-700 font-medium">
                          ✨ Offer successfully applied! Click × to remove
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Available Offers Section */}
                  {showOffersSection && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-orange-200">
                        <Sparkles className="h-5 w-5 text-orange-600" />
                        <h4 className="text-lg font-bold text-orange-800">Available Offers</h4>
                      </div>

                      {offerLoading && eligibleOffers.length === 0 ? (
                        <div className="flex items-center justify-center p-6 border-2 border-dashed border-orange-200 rounded-xl bg-orange-25">
                          <Loader2 className="h-5 w-5 animate-spin mr-3 text-orange-600" />
                          <span className="text-sm text-orange-700 font-medium">Loading amazing offers...</span>
                        </div>
                      ) : eligibleOffers.length > 0 ? (
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                          {eligibleOffers.map((offer) => (
                            <div
                              key={offer.id}
                              className={cn(
                                "p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer shadow-sm",
                                appliedOffer?.id === offer.id
                                  ? "border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md"
                                  : "border-orange-200 hover:border-orange-400 bg-white hover:shadow-lg",
                              )}
                              onClick={() => !appliedOffer && handleApplyOffer(undefined, offer.id.toString())}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Gift className="h-4 w-4 text-orange-600" />
                                    <h5 className="font-bold text-base text-gray-800">{offer.name}</h5>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">{offer.description}</p>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-sm font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full shadow-sm">
                                      {offer.offer_type === "PERCENTAGE"
                                        ? `${offer.value}% OFF`
                                        : offer.offer_type === "FLAT"
                                          ? `$${offer.value} OFF`
                                          : "FREE ITEM"}
                                    </span>
                                    {Number(offer.min_order_value) > 0 && (
                                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full border">
                                        Min. ${offer.min_order_value}
                                      </span>
                                    )}
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                                      Expires: {new Date(offer.end_date).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                {appliedOffer?.id !== offer.id && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleApplyOffer(undefined, offer.id.toString())
                                    }}
                                    disabled={offerLoading || !!appliedOffer}
                                    className="ml-3 border-2 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 font-medium rounded-lg"
                                  >
                                    Apply
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center bg-gray-50">
                          <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-3">
                            <Gift className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-base font-medium text-gray-600 mb-1">No offers available right now</p>
                          <p className="text-sm text-gray-500">Check back later for amazing deals! 🎉</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {mode === "delivery" && deliveryQuoteRequested && (
                <div>
                  <h3 className="font-medium mb-2">Add a tip for your driver</h3>
                  <div className="flex flex-wrap gap-2">
                    {[10, 15, 20].map((p) => {
                      const tipValue = Number.parseFloat(((subtotal * p) / 100).toFixed(2))
                      return (
                        <Button
                          key={p}
                          variant="outline"
                          className={cn(
                            tipAmount === tipValue && "bg-orange-600 border-orange-600 text-white hover:bg-orange-700",
                          )}
                          onClick={() => handleTipChange(tipValue)}
                        >
                          ${tipValue.toFixed(2)} ({p}%)
                        </Button>
                      )
                    })}
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Custom"
                        value={customTip}
                        onChange={(e) => setCustomTip(e.target.value)}
                        className="max-w-[100px]"
                      />
                      <Button onClick={() => handleTipChange(Number(customTip))} disabled={!customTip}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <h3 className="font-medium mb-2">Payment Method</h3>
                {isOrderingDisabled && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <p className="text-sm text-red-800">Ordering is currently disabled for this location.</p>
                  </div>
                )}
                <RadioGroup
                  value={invoice.payment_method || ""}
                  onValueChange={(v: "online" | "offline") => handlePaymentMethodChange(v)}
                  className="flex gap-4"
                  disabled={isOrderingDisabled}
                >
                  <Label
                    htmlFor="online"
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-colors",
                      invoice.payment_method === "online" && "border-orange-500 bg-orange-50",
                      isOrderingDisabled && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <RadioGroupItem value="online" id="online" className="sr-only" disabled={isOrderingDisabled} />
                    Credit Card
                  </Label>
                </RadioGroup>
              </div>
              {invoice.payment_method === "online" && shouldShowTotal && !isOrderingDisabled && (
                <div className="mt-4">
                  <AuthorizeNetForm
                    orderId={checkoutData.order_id}
                    checkoutData={checkoutData}
                    amount={total}
                    branch={branch.id}
                    onPaymentProcessing={setIsPaymentProcessing}
                  />
                </div>
              )}
            </div>,
            <p className="font-medium capitalize">
              {invoice.payment_method === "online" ? "Credit Card" : "Pay at Restaurant"}
            </p>,
          )}
        </div>

        <div className="space-y-6 sticky top-8">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>From {branch.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {item.quantity}x {item.menu_item.name}
                      </span>
                      <span className="font-medium">{item.price === 0 ? "Free" : `$${item.price.toFixed(2)}`}</span>
                    </div>
                    {/* Add Base Price display */}
                    <p className="text-xs text-muted-foreground pl-2 mb-1">
                      Base Price: ${Number(item.menu_item.price).toFixed(2)}
                    </p>
                    {item.variation && (
                      <p className="text-muted-foreground pl-2">
                        • {item.variation.name} (+${Number(item.variation.price_adjustment).toFixed(2)})
                      </p>
                    )}
                    {item.options?.map((opt: any) => {
                      const quantity = opt.quantity || 1;
                      return (
                        <p key={opt.id} className="text-muted-foreground pl-2">
                          • {quantity > 1 ? `${quantity}x ` : ""}{opt.name} (+${(Number(opt.price_adjustment) * quantity).toFixed(2)})
                        </p>
                      );
                    })}
                  </div>
                ))}
              </div>

              {mode === "delivery" && !deliveryQuoteRequested && (
                <div className="border-t pt-4">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium">Select a delivery address to see pricing</p>
                  </div>
                </div>
              )}

              {shouldShowTotal && (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.discount_applied > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {appliedOffer ? `${appliedOffer.name}` : `Discount`}
                      </span>
                      <span>-${invoice.discount_applied.toFixed(2)}</span>
                    </div>
                  )}
                  {appliedOffer && appliedOffer.offer_type === "FREE_ITEM_ADDITION" && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Gift className="h-3 w-3" />
                        {appliedOffer.name}
                      </span>
                      <span>Free Item</span>
                    </div>
                  )}
                  {appliedOffer && appliedOffer.offer_type === "BOGO" && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {appliedOffer.name}
                      </span>
                      <span>Offer Applied</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Taxes</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.delivery_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Delivery Fee</span>
                      <span>${invoice.delivery_fee.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Display delivery provider if available */}
                  {mode === "delivery" && deliveryProvider && (
                    <div className="flex justify-end items-center text-xs text-muted-foreground mt-[-4px] mb-2">
                        <Car className="h-3 w-3 mr-1" />
                        Powered by {deliveryProvider === 'uber' ? 'Uber' : 'DoorDash'}
                    </div>
                  )}

                  {invoice.tip > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tip</span>
                      <span>${invoice.tip.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {couponError && <p className="text-red-500 text-sm">{couponError}</p>}

              <Button
                variant="default"
                className="w-full"
                onClick={handleCancelCheckout2}
                disabled={!!processingAction || isPaymentProcessing || isOrderingDisabled}
              >
                Need to add something else ?
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleCancelCheckout}
                disabled={!!processingAction || isPaymentProcessing || isOrderingDisabled}
              >
                Cancel Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newAddress.name}
                onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                placeholder="Home, Work, etc."
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={newAddress.street_address}
                onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                placeholder="123 Main St"
                className={formErrors.street_address ? "border-red-500" : ""}
              />
              {formErrors.street_address && <p className="text-sm text-red-500">{formErrors.street_address}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apt">Apartment/Suite/Unit</Label>
              <Input
                id="apt"
                value={newAddress.sub_premise}
                onChange={(e) => setNewAddress({ ...newAddress, sub_premise: e.target.value })}
                placeholder="Apt 4B"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  placeholder="San Francisco"
                  className={formErrors.city ? "border-red-500" : ""}
                />
                {formErrors.city && <p className="text-sm text-red-500">{formErrors.city}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Select
                  value={newAddress.state}
                  onValueChange={(value) => {
                    setNewAddress({ ...newAddress, state: value })
                    if (formErrors.state) {
                        setFormErrors({ ...formErrors, state: "" })
                    }
                  }}
                >
                  <SelectTrigger id="state" className={formErrors.state ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.state && <p className="text-sm text-red-500">{formErrors.state}</p>}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={newAddress.zip_code}
                onChange={(e) => setNewAddress({ ...newAddress, zip_code: e.target.value })}
                placeholder="94105"
                className={formErrors.zip_code ? "border-red-500" : ""}
              />
              {formErrors.zip_code && <p className="text-sm text-red-500">{formErrors.zip_code}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <PhoneInput
                value={newAddress.phone_number}
                onChange={(value) => setNewAddress({ ...newAddress, phone_number: value })}
                placeholder="Enter phone number"
                className={formErrors.phone_number ? "border-red-500" : ""}
              />
              {formErrors.phone_number && <p className="text-sm text-red-500">{formErrors.phone_number}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddressDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAddress} disabled={processingAction === "createAddress"}>
              {processingAction === "createAddress" ? "Saving..." : "Save Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />

      {isCheckoutItemModalOpen && selectedFreeItem && currentFreeItemOfferId && (
        <CheckoutItemModal
          isOpen={isCheckoutItemModalOpen}
          onClose={() => {
            setIsCheckoutItemModalOpen(false)
            setSelectedFreeItem(null)
            setCurrentFreeItemOfferId(null)
          }}
          item={selectedFreeItem}
          offerId={currentFreeItemOfferId}
          onApplyOffer={handleApplyFreeItemOffer}
          isApplyingOffer={offerLoading}
        />
      )}
    </div>
  )
}