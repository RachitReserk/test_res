"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProfileUpdate?: (updatedProfile: any) => void
  userRole?: "owner" | "manager" | "employee"
}

export interface OwnerProfile {
  id: number
  name: string
  description: string
  landing_image?: string
  owner_id: number
  is_active: boolean
  first_name: string
  last_name: string
  email: string
}

export interface ManagerProfile {
  id: number
  first_name: string
  last_name: string
  email: string
  username: string
  restaurant?: {
    id: number
    name: string
    description: string
    is_active: boolean
  }
  branch?: {
    id: number
    name: string
    address: string
    phone_number: string
    email: string
    opening_time: string
    closing_time: string
    is_active: boolean
  }
}

export interface EmployeeProfile {
  id: number
  first_name: string
  last_name: string
  email: string
  username: string
  position: string
  hire_date: string
  restaurant?: {
    id: number
    name: string
    description: string
    is_active: boolean
  }
  branch?: {
    id: number
    name: string
    address: string
    phone_number: string
    email: string
    opening_time: string
    closing_time: string
    is_active: boolean
  }
}

export function ProfileDialog({ open, onOpenChange, onProfileUpdate, userRole = "owner" }: ProfileDialogProps) {
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("personal")
  const [bannerImage, setBannerImage] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null)

  useEffect(() => {
    if (open) fetchProfile()
  }, [open, userRole])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const authToken = getAuthToken()
      if (!authToken) return

      // Use the appropriate endpoint based on user role
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/client/${userRole}/login/`

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`)
      }

      const data = await response.json()

      if (userRole === "owner") {
        // Set the landing image if it exists
        if (data.landing_image) {
          setExistingBannerUrl(`${process.env.NEXT_PUBLIC_API_URL}${data.landing_image}`)
          setBannerPreview(`${process.env.NEXT_PUBLIC_API_URL}${data.landing_image}`)
        } else {
          setExistingBannerUrl(null)
          setBannerPreview(null)
        }

        setProfile({
          id: data.id,
          name: data.name,
          description: data.description,
          landing_image: data.landing_image,
          owner_id: data.owner_id,
          is_active: data.is_active,
          first_name: data.owner?.first_name || "",
          last_name: data.owner?.last_name || "",
          email: data.owner?.email || "",
        })
      } else if (userRole === "manager") {
        setProfile({
          id: data.id,
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          username: data.username || "",
          restaurant: data.restaurant || null,
          branch: data.branch || null,
        })
      } else if (userRole === "employee") {
        setProfile({
          id: data.id,
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          username: data.username || "",
          position: data.position || "",
          hire_date: data.hire_date || "",
          restaurant: data.restaurant || null,
          branch: data.branch || null,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to load ${userRole} profile.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getAuthToken = () => {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1]
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile((prev: any) => (prev ? { ...prev, [name]: value } : null))
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      setBannerImage(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setBannerPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)

    try {
      const authToken = getAuthToken()
      if (!authToken) return

      if (userRole === "owner") {
        // Owner profile update
        const personalInfoPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/client/owner/login/`, {
          method: "PATCH",
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            first_name: profile.first_name,
            last_name: profile.last_name,
          }),
        })

        const restaurantFormData = new FormData()
        restaurantFormData.append("name", profile.name)
        restaurantFormData.append("description", profile.description)
        if (bannerImage) restaurantFormData.append("landing_image", bannerImage)

        const restaurantInfoPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/client/owner/create/restaurant/`, {
          method: "PATCH",
          headers: {
            Authorization: `Token ${authToken}`,
          },
          credentials: "include",
          body: restaurantFormData,
        })

        const [personalRes, restaurantRes] = await Promise.all([personalInfoPromise, restaurantInfoPromise])

        if (!personalRes.ok || !restaurantRes.ok) throw new Error("Update failed")

        const personalData = await personalRes.json()
        const restaurantData = await restaurantRes.json()

        const updatedProfile = {
          ...profile,
          first_name: personalData.first_name,
          last_name: personalData.last_name,
          name: restaurantData.name,
          description: restaurantData.description,
          landing_image: restaurantData.landing_image,
        }

        // Update the banner preview with the new image from the server
        if (restaurantData.landing_image) {
          setExistingBannerUrl(`${process.env.NEXT_PUBLIC_API_URL}${restaurantData.landing_image}`)
          if (!bannerImage) {
            setBannerPreview(`${process.env.NEXT_PUBLIC_API_URL}${restaurantData.landing_image}`)
          }
        }

        setProfile(updatedProfile)
        if (onProfileUpdate) onProfileUpdate(updatedProfile)
      } else if (userRole === "manager") {
        // Manager profile update
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client/manager/login/`, {
          method: "PATCH",
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            first_name: profile.first_name,
            last_name: profile.last_name,
          }),
        })

        if (!response.ok) throw new Error("Update failed")

        const updatedData = await response.json()

        const updatedProfile = {
          ...profile,
          first_name: updatedData.first_name,
          last_name: updatedData.last_name,
        }

        setProfile(updatedProfile)
        if (onProfileUpdate) onProfileUpdate(updatedProfile)
      } else if (userRole === "employee") {
        // Employee profile update
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client/employee/update/`, {
          method: "PATCH",
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            first_name: profile.first_name,
            last_name: profile.last_name,
          }),
        })

        if (!response.ok) throw new Error("Update failed")

        const updatedData = await response.json()

        const updatedProfile = {
          ...profile,
          first_name: updatedData.first_name,
          last_name: updatedData.last_name,
        }

        setProfile(updatedProfile)
        if (onProfileUpdate) onProfileUpdate(updatedProfile)
      }

      toast({ title: "Success", description: "Profile updated successfully" })
      setBannerImage(null)
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Format date to a more readable format
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not available"

    // Use a fixed date format to avoid hydration errors
    try {
      const date = new Date(dateString)
      // Use a fixed format that doesn't depend on locale
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    } catch (e) {
      return dateString
    }
  }

  // Get the appropriate title based on user role
  const getProfileTitle = () => {
    switch (userRole) {
      case "employee":
        return "Employee Profile"
      case "manager":
        return "Manager Profile"
      case "owner":
        return "Owner Profile"
      default:
        return "User Profile"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">{getProfileTitle()}</DialogTitle>
          <DialogDescription>Edit your profile information below.</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto pr-1" style={{ maxHeight: "calc(85vh - 180px)" }}>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : profile ? (
            <>
              {/* Banner upload section for owner role only */}
              {userRole === "owner" && (
                <div className="mb-6">
                  <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden mb-2">
                    {bannerPreview ? (
                      <img
                        src={bannerPreview || "/placeholder.svg"}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">No banner image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <label htmlFor="banner-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-primary hover:text-primary/80">
                        <Upload className="h-4 w-4" />
                        <span>{existingBannerUrl ? "Change Banner" : "Upload Banner"}</span>
                      </div>
                      <input
                        id="banner-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {userRole === "owner" && (
                <div className="grid gap-4 py-4">
                  {[
                    { label: "ID", value: profile.id?.toString(), disabled: true },
                    { label: "Restaurant Name", name: "name", value: profile.name },
                    { label: "Description", name: "description", value: profile.description, textarea: true },
                    { label: "Email", value: profile.email, disabled: true },
                    { label: "First Name", name: "first_name", value: profile.first_name },
                    { label: "Last Name", name: "last_name", value: profile.last_name },
                  ].map(({ label, name, value, disabled = false, textarea = false }, i) => (
                    <div className="grid grid-cols-4 items-center gap-4" key={i}>
                      <Label className="text-right">{label}</Label>
                      {textarea ? (
                        <Textarea
                          name={name}
                          value={value ?? ""}
                          onChange={handleInputChange}
                          disabled={disabled}
                          className={`col-span-3 min-h-[80px] ${disabled ? "bg-muted" : ""}`}
                        />
                      ) : (
                        <Input
                          name={name}
                          value={value ?? ""}
                          onChange={handleInputChange}
                          disabled={disabled}
                          className={`col-span-3 ${disabled ? "bg-muted" : ""}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {userRole === "manager" && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="personal">Personal Info</TabsTrigger>
                    <TabsTrigger value="work">Work Info</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4 mt-4">
                    <div className="grid gap-4">
                      {[
                        { label: "ID", value: profile.id?.toString(), disabled: true },
                        { label: "Username", value: profile.username, disabled: true },
                        { label: "Email", value: profile.email, disabled: true },
                        { label: "First Name", name: "first_name", value: profile.first_name },
                        { label: "Last Name", name: "last_name", value: profile.last_name },
                      ].map(({ label, name, value, disabled = false }, i) => (
                        <div className="grid grid-cols-4 items-center gap-4" key={i}>
                          <Label className="text-right">{label}</Label>
                          <Input
                            name={name}
                            value={value ?? ""}
                            onChange={handleInputChange}
                            disabled={disabled}
                            className={`col-span-3 ${disabled ? "bg-muted" : ""}`}
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="work" className="space-y-4 mt-4">
                    <div className="grid gap-4">
                      {profile.restaurant && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Restaurant</Label>
                          <div className="col-span-3 p-3 bg-muted rounded-md">
                            <p className="text-lg font-medium">{profile.restaurant.name}</p>
                            <p className="text-sm text-muted-foreground">{profile.restaurant.description}</p>
                          </div>
                        </div>
                      )}

                      {profile.branch && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Branch</Label>
                          <div className="col-span-3 p-3 bg-muted rounded-md">
                            <p className="text-lg font-medium">{profile.branch.name}</p>
                            <p className="text-sm text-muted-foreground">{profile.branch.address}</p>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Phone: </span>
                                <span>{profile.branch.phone_number}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Email: </span>
                                <span>{profile.branch.email}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Opens: </span>
                                <span>{profile.branch.opening_time}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Closes: </span>
                                <span>{profile.branch.closing_time}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {userRole === "employee" && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="personal">Personal Info</TabsTrigger>
                    <TabsTrigger value="work">Work Info</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4 mt-4">
                    <div className="grid gap-4">
                      {[
                        { label: "ID", value: profile.id?.toString(), disabled: true },
                        { label: "Username", value: profile.username, disabled: true },
                        { label: "Email", value: profile.email, disabled: true },
                        { label: "First Name", name: "first_name", value: profile.first_name },
                        { label: "Last Name", name: "last_name", value: profile.last_name },
                      ].map(({ label, name, value, disabled = false }, i) => (
                        <div className="grid grid-cols-4 items-center gap-4" key={i}>
                          <Label className="text-right">{label}</Label>
                          <Input
                            name={name}
                            value={value ?? ""}
                            onChange={handleInputChange}
                            disabled={disabled}
                            className={`col-span-3 ${disabled ? "bg-muted" : ""}`}
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="work" className="space-y-4 mt-4">
                    <div className="grid gap-4">
                      {profile.restaurant && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Restaurant</Label>
                          <div className="col-span-3 p-3 bg-muted rounded-md">
                            <p className="text-lg font-medium">{profile.restaurant.name}</p>
                            <p className="text-sm text-muted-foreground">{profile.restaurant.description}</p>
                          </div>
                        </div>
                      )}

                      {profile.branch && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Branch</Label>
                          <div className="col-span-3 p-3 bg-muted rounded-md">
                            <p className="text-lg font-medium">{profile.branch.name}</p>
                            <p className="text-sm text-muted-foreground">{profile.branch.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">Failed to load profile.</div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

