"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CartModal } from "@/components/cart-modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { User, Phone, MapPin, Save, ArrowLeft, Loader2, Plus } from "lucide-react"
import Link from "next/link"
import { ProfilePopup } from "@/components/profile-popup"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false)
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [cartItems, setCartItems] = useState(0)
  const [userData, setUserData] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St, New York, NY 10001",
    avatarUrl: "",
  })
  const [phoneError, setPhoneError] = useState("")
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [newAddress, setNewAddress] = useState({
    name: "",
    street_address: "",
    sub_premise: "",
    city: "",
    state: "",
    zip_code: "",
    phone_number: "",
  })
  const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Check if user is authenticated and fetch profile data
  useEffect(() => {
    const checkAuth = async () => {
      const clientAuthToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("clientAuthToken="))
        ?.split("=")[1]

      if (!clientAuthToken) {
        router.push("/client/login?callbackUrl=/client/profile")
        return
      }

      setIsAuthenticated(true)
      setIsLoading(true)

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client/customer/profile`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${clientAuthToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch profile data")
        }

        const result = await response.json()
        const profileData = result.data

        setUserData({
          name:
            profileData.first_name && profileData.last_name
              ? `${profileData.first_name} ${profileData.last_name}`
              : profileData.username || "User",
          email: profileData.email || "",
          phone: profileData.phone_number || "",
          address: "", // Not provided in the API response
          avatarUrl: "", // Not provided in the API response
        })

        // Fetch addresses
        await fetchAddresses()
      } catch (error) {
        console.error("Error fetching profile data:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, toast])

  // Fetch user addresses
  const fetchAddresses = async () => {
    try {
      const clientAuthToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("clientAuthToken="))
        ?.split("=")[1]

      if (!clientAuthToken) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/address/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${clientAuthToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch addresses")
      }

      const result = await response.json()
      if (result && result.addresses) {
        setAddresses(result.addresses)

        // If there's a default address, select it
        const defaultAddress = result.addresses.find((addr: any) => addr.is_default)
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id)
        } else if (result.addresses.length > 0) {
          setSelectedAddressId(result.addresses[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error)
      toast({
        title: "Error",
        description: "Failed to load addresses. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleOpenCart = () => {
    setIsCartOpen(true)
  }

  const toggleProfilePopup = () => {
    setIsProfilePopupOpen(!isProfilePopupOpen)
  }

  const handleSignOut = () => {
    // Clear the auth token cookie
    document.cookie = "clientAuthToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    const preservedHasSelectedLocation = localStorage.getItem("hasSelectedLocation");
    const preservedBranchId = localStorage.getItem("selectedBranchId");

    localStorage.clear()
    
    if (preservedHasSelectedLocation !== null) {
      localStorage.setItem("hasSelectedLocation", preservedHasSelectedLocation);
    }
    if (preservedBranchId !== null) {
      localStorage.setItem("selectedBranchId", preservedBranchId);
    }
    // Redirect to home page
    router.push("/")
  }

  const validatePhoneNumber = (phone: string): boolean => {
    // Regex for international phone format: +CountryCodeNumbers
    // Example: +14185438090
    const phoneRegex = /^\+[1-9]\d{1,14}$/

    if (!phone.trim()) return true // Allow empty phone for form validation step
    if (!phoneRegex.test(phone)) {
      setPhoneError("Phone number must be in international format (e.g., +14185438090)")
      return false
    }

    setPhoneError("")
    return true
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    const formData = new FormData(e.target as HTMLFormElement)
    const fullName = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string

    // Validate phone number
    if (!validatePhoneNumber(phone)) {
      return
    }

    // Parse name into first and last name
    const nameParts = fullName.split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    // Create an object to track modified fields only
    const updatedProfile: Record<string, string> = {}

    // Only add fields that have changed
    const currentName = userData.name || ""
    const [currentFirst, ...currentLastParts] = currentName.split(" ")
    const currentLast = currentLastParts.join(" ")

    if (firstName !== currentFirst) {
      updatedProfile.first_name = firstName
    }

    if (lastName !== currentLast) {
      updatedProfile.last_name = lastName
    }

    if (email !== userData.email) {
      updatedProfile.email = email
    }

    if (phone !== userData.phone) {
      updatedProfile.phone_number = phone
    }

    // If no fields were modified, don't make the API call
    if (Object.keys(updatedProfile).length === 0) {
      toast({
        title: "No changes detected",
        description: "You haven't made any changes to your profile.",
        variant: "default",
      })
      return
    }

    const clientAuthToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("clientAuthToken="))
      ?.split("=")[1]

    if (!clientAuthToken) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to update your profile.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client/customer/profile/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${clientAuthToken}`,
        },
        body: JSON.stringify(updatedProfile),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const result = await response.json()

      // Update local state with the new values
      setUserData({
        ...userData,
        name: firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName ? firstName : userData.name,
        email: email || userData.email,
        phone: phone || userData.phone,
      })

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle creating a new address
  const handleCreateAddress = async () => {
    // Validate all required fields
    const errors: Record<string, string> = {}
    const requiredFields = [
      { key: "name", label: "Address Name" },
      { key: "street_address", label: "Street Address" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "zip_code", label: "ZIP Code" },
      { key: "phone_number", label: "Phone Number" },
    ]

    // Check for empty required fields
    requiredFields.forEach((field) => {
      if (!newAddress[field.key as keyof typeof newAddress]?.trim()) {
        errors[field.key] = `${field.label} is required`
      }
    })

    // Validate phone number format
    if (newAddress.phone_number && !validatePhoneNumber(newAddress.phone_number)) {
      errors.phone_number = "Please enter a valid phone number in international format (e.g., +14185438090)"
    }

    // If there are validation errors, display them and stop submission
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    // Clear any previous errors
    setFormErrors({})
    setPhoneNumberError(null)

    try {
      setIsSubmitting(true)

      const clientAuthToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("clientAuthToken="))
        ?.split("=")[1]

      if (!clientAuthToken) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to add an address.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/address/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${clientAuthToken}`,
        },
        body: JSON.stringify(newAddress),
      })

      if (!response.ok) {
        throw new Error("Failed to create address")
      }

      // Reset form and close dialog
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

      // Refresh addresses
      await fetchAddresses()

      toast({
        title: "Address added",
        description: "Your address has been added successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error creating address:", error)
      toast({
        title: "Error",
        description: "Failed to add address. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle address selection
  const handleAddressSelect = async (addressId: number) => {
    try {
      setIsSubmitting(true)
      setSelectedAddressId(addressId)

      const clientAuthToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("clientAuthToken="))
        ?.split("=")[1]

      if (!clientAuthToken) return

      // Set as default address
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/client/customer/addresses/${addressId}/default`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${clientAuthToken}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to set default address")
      }

      // Refresh addresses to update UI
      await fetchAddresses()

      toast({
        title: "Default address updated",
        description: "Your default address has been updated.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error selecting address:", error)
      toast({
        title: "Error",
        description: "Failed to update default address. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle address deletion
  const handleDeleteAddress = async (addressId: number) => {
    try {
      setIsSubmitting(true)

      const clientAuthToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("clientAuthToken="))
        ?.split("=")[1]

      if (!clientAuthToken) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/address/${addressId}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${clientAuthToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete address")
      }

      // Refresh addresses
      await fetchAddresses()

      toast({
        title: "Address deleted",
        description: "Your address has been deleted successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error deleting address:", error)
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const home_url = process.env.NEXT_PUBLIC_WEBSITE_URL || ""

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Header Component - Full Width */}
      <header className="flex items-center justify-between px-6 py-6 bg-navbarcolor border-b border-navbarbordercolor sticky top-0 z-10 shadow-sm w-full">
        <Link  href="/" className="flex items-center gap-2 cursor-pointer">
          <Image src="/TERIYAKI-logo.png" alt="TERIYAKI Logo" width={80} height={40} className="object-contain" />
        </Link>

        <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-md">
          {/*<input
            type="text"
            placeholder="Search..."
            className="w-full rounded-full border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />*/}
        </div>

        <div className="flex items-center gap-4">
          {/*<motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="primary"
              className="rounded-full flex items-center gap-2 bg-orange-600 text-white hover:bg-blue-700"
              onClick={handleOpenCart}
            >
              <ShoppingCart size={18} />
              <motion.span
                key={cartItems}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                {cartItems}
              </motion.span>
            </Button>
          </motion.div>*/}
          <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

          <div className="relative">
            <div
              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300"
              onClick={toggleProfilePopup}
            >
              <User size={18} />
            </div>

            {/* Implement the ProfilePopup component */}
            <ProfilePopup isOpen={isProfilePopupOpen} onClose={() => setIsProfilePopupOpen(false)} />
          </div>
        </div>
      </header>

      {/* Profile Page Content - Centered */}
      <div className="flex-1 bg-backgroundcolor">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to home</span>
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">My Profile</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage alt={userData.name} />
                      <AvatarFallback className="bg-orange-600 text-white text-2xl">
                        {userData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <CardTitle>{userData.name}</CardTitle>
                <CardDescription>{userData.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <span>{userData.phone}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </CardFooter>
            </Card>

            <div className="md:col-span-2">
              <Tabs defaultValue="personal">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="addresses">Addresses</TabsTrigger>
                  {/*<TabsTrigger value="security">Security</TabsTrigger>*/}
                </TabsList>
                <TabsContent value="personal" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your personal details here.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                              <Input disabled={true} id="name" name="name" className="pl-10" defaultValue={userData.name} />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                              <Input
                                disabled={true}
                                id="phone"
                                name="phone"
                                className={`pl-10 ${phoneError ? "border-red-500" : ""}`}
                                defaultValue={userData.phone}
                                placeholder="+14185438090"
                                onChange={(e) => validatePhoneNumber(e.target.value)}
                              />
                            </div>
                            {phoneError && <p className="text-sm text-red-500 mt-1">{phoneError}</p>}
                          </div>
                        </div>

                        <Separator />
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="addresses" className="mt-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>My Addresses</CardTitle>
                        <CardDescription>Manage your delivery addresses.</CardDescription>
                      </div>
                      <Button
                        onClick={() => setShowAddressDialog(true)}
                        className="bg-navbartextcolor hover:bg-navbartextcolor/70"
                        disabled={isSubmitting}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {addresses.length > 0 ? (
                        <div className="space-y-4">
                          {addresses.map((address) => (
                            <div key={address.id} className="flex flex-col space-y-2 border rounded-lg p-4 relative">
                              <div className="flex items-start gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 font-medium">
                                    {address.name}
                                    {address.is_default && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    <p>{address.street_address}</p>
                                    {address.sub_premise && <p>{address.sub_premise}</p>}
                                    <p>
                                      {address.city}, {address.state} {address.zip_code}
                                    </p>
                                    <p className="mt-1">Phone: {address.phone_number}</p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                    onClick={() => handleDeleteAddress(address.id)}
                                    disabled={isSubmitting}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-8 border border-dashed rounded-lg">
                          <MapPin className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                          <h3 className="text-lg font-medium mb-1">No addresses found</h3>
                          <p className="text-gray-500 mb-4">Add your first address to get started</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                      <CardDescription>Manage your password and security preferences.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Current Password</Label>
                          <Input id="current-password" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input id="new-password" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <Input id="confirm-password" type="password" />
                        </div>

                        <Separator />

                        <Button type="submit" className="flex gap-2 bg-orange-500 hover:bg-orange-600">
                          <Save className="h-4 w-4" />
                          Update Password
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="address-name">Address Name</Label>
              <Input
                id="address-name"
                value={newAddress.name}
                onChange={(e) => {
                  setNewAddress({ ...newAddress, name: e.target.value })
                  if (e.target.value.trim()) {
                    setFormErrors({ ...formErrors, name: "" })
                  }
                }}
                placeholder="Home, Work, etc."
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="street-address">Street Address</Label>
              <Input
                id="street-address"
                value={newAddress.street_address}
                onChange={(e) => {
                  setNewAddress({ ...newAddress, street_address: e.target.value })
                  if (e.target.value.trim()) {
                    setFormErrors({ ...formErrors, street_address: "" })
                  }
                }}
                placeholder="123 Main St"
                className={formErrors.street_address ? "border-red-500" : ""}
              />
              {formErrors.street_address && <p className="text-sm text-red-500">{formErrors.street_address}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apartment">Apartment/Suite/Unit</Label>
              <Input
                id="apartment"
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
                  onChange={(e) => {
                    setNewAddress({ ...newAddress, city: e.target.value })
                    if (e.target.value.trim()) {
                      setFormErrors({ ...formErrors, city: "" })
                    }
                  }}
                  placeholder="San Francisco"
                  className={formErrors.city ? "border-red-500" : ""}
                />
                {formErrors.city && <p className="text-sm text-red-500">{formErrors.city}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={newAddress.state}
                  onChange={(e) => {
                    setNewAddress({ ...newAddress, state: e.target.value })
                    if (e.target.value.trim()) {
                      setFormErrors({ ...formErrors, state: "" })
                    }
                  }}
                  placeholder="California"
                  className={formErrors.state ? "border-red-500" : ""}
                />
                {formErrors.state && <p className="text-sm text-red-500">{formErrors.state}</p>}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={newAddress.zip_code}
                onChange={(e) => {
                  setNewAddress({ ...newAddress, zip_code: e.target.value })
                  if (e.target.value.trim()) {
                    setFormErrors({ ...formErrors, zip_code: "" })
                  }
                }}
                placeholder="94105"
                className={formErrors.zip_code ? "border-red-500" : ""}
              />
              {formErrors.zip_code && <p className="text-sm text-red-500">{formErrors.zip_code}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address-phone">Phone Number</Label>
              <Input
                id="address-phone"
                value={newAddress.phone_number}
                onChange={(e) => {
                  setNewAddress({ ...newAddress, phone_number: e.target.value })
                  setPhoneNumberError(null)
                  if (e.target.value.trim()) {
                    setFormErrors({ ...formErrors, phone_number: "" })
                  }
                }}
                placeholder="+14185438090"
                className={formErrors.phone_number || phoneNumberError ? "border-red-500" : ""}
              />
              {(formErrors.phone_number || phoneNumberError) && (
                <p className="text-sm text-red-500">{formErrors.phone_number || phoneNumberError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddressDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAddress} disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Address"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
