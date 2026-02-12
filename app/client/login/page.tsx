// app/client/login/page.tsx
"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Lock, Loader, ArrowLeft, User, Mail } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { PhoneInput } from "@/components/phone-input"
import Image from "next/image"
import { isValidPhoneNumber } from "libphonenumber-js"
import { Button } from "@/components/ui/button"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://quickbitenow-backend-production.up.railway.app"
const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID || "1"

const InputField = ({
  icon,
  type = "text",
  name,
  placeholder,
  required = true,
  value,
  onChange,
  className = "",
}: {
  icon: React.ReactNode
  type?: string
  name: string
  placeholder: string
  required?: boolean
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
}) => (
  <div className="relative flex items-center mb-4">
    <span className="absolute left-3 text-gray-500">{icon}</span>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full p-3 pl-10 border rounded-md bg-white ${className}`}
    />
  </div>
)

const InputFieldSkeleton = () => (
  <div className="relative flex items-center mb-4">
    <Skeleton className="absolute left-3 w-5 h-5 rounded-full" />
    <Skeleton className="w-full h-11 rounded-md" />
  </div>
)

const OtpInput = ({
  length = 6,
  value,
  onChange,
}: {
  length?: number
  value: string
  onChange: (value: string) => void
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  if (inputRefs.current.length !== length) {
    inputRefs.current = Array(length).fill(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = [...(value || "").padEnd(length, "")]
    newValue[index] = e.target.value

    if (e.target.value && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus()
    }

    onChange(newValue.join(""))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="flex justify-center gap-2 mb-6">
      {Array(length)
        .fill(0)
        .map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            maxLength={1}
            placeholder={`${index + 1}`}
            aria-label={`OTP Digit ${index + 1}`}
            value={(value || "")[index] || ""}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-12 h-12 text-center text-xl border rounded-md"
          />
        ))}
    </div>
  )
}

const OtpInputSkeleton = ({ length = 6 }: { length?: number }) => (
  <div className="flex justify-center gap-2 mb-6">
    {Array(length)
      .fill(0)
      .map((_, index) => (
        <Skeleton key={index} className="w-12 h-12 rounded-md" />
      ))}
  </div>
)

const ButtonSkeleton = () => <Skeleton className="w-full h-12 rounded-md" />

export default function UpdatedClientLogin() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/order"
  const { toast } = useToast()
  const [step, setStep] = useState("LOGIN") // LOGIN, OTP_VERIFY, SIGNUP
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isOtpLogin, setIsOtpLogin] = useState(false)
  const [formData, setFormData] = useState({
    email_or_phone: "",
    email: "",
    otp: "",
    password: "",
    confirm_password: "",
    login_phone: "",
    login_email: "",
    login_password: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    anniversary_date: "",
    sms_consent: false,
  })
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState("")

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked })
  }

  useEffect(() => {
    const checkAuth = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const authToken = document.cookie.split("; ").find((row) => row.startsWith("clientAuthToken="))

      if (authToken) {
        router.push(decodeURIComponent(callbackUrl))
      } else {
        setInitialLoading(false)
      }
    }

    checkAuth()
  }, [router, callbackUrl])

  useEffect(() => {
    if (otpExpiry) {
      const interval = setInterval(() => {
        const now = new Date().getTime()
        const distance = otpExpiry - now

        if (distance <= 0) {
          clearInterval(interval)
          setTimeRemaining("Expired")
        } else {
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((distance % (1000 * 60)) / 1000)
          setTimeRemaining(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [otpExpiry])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleOtpChange = (value: string) => setFormData({ ...formData, otp: value })

  const handlePhoneChange = (field: string) => (value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const validatePhoneNumber = (phone: string) => {
    if (!phone) return false
    try {
      return isValidPhoneNumber(phone)
    } catch {
      return false
    }
  }

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.sms_consent) {
      toast({
        title: "Consent Required",
        description: "Please agree to receive SMS messages to continue",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (!formData.email_or_phone) {
      toast({
        title: "Error",
        description: "Phone number is required",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (!validatePhoneNumber(formData.email_or_phone)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/client/customer/request-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant: RESTAURANT_ID,
          email_or_phone: formData.email_or_phone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.detail || "Failed to request OTP")
      }

      const expiryTime = new Date().getTime() + 2 * 60 * 1000
      setOtpExpiry(expiryTime)

      toast({
        title: "Success",
        description: "OTP sent successfully!",
      })

      setStep("OTP_VERIFY")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to request OTP",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if ((!formData.login_phone && !formData.login_email) || !formData.login_password) {
      toast({
        title: "Error",
        description: "Phone number and password are required",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (formData.login_phone && !validatePhoneNumber(formData.login_phone)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/client/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_or_phone: formData.login_phone || undefined,
          password: formData.login_password,
          restaurant: RESTAURANT_ID,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.detail || "Invalid credentials")
      }

      document.cookie = `clientAuthToken=${data.token}; path=/; Secure; SameSite=Strict`
      document.cookie = `clientName=${data.name || "Client"}; path=/; Secure; SameSite=Strict`

      const preservedHasSelectedLocation = localStorage.getItem("hasSelectedLocation")
      const preservedBranchId = localStorage.getItem("selectedBranchId")

      localStorage.clear()

      if (preservedHasSelectedLocation !== null) {
        localStorage.setItem("hasSelectedLocation", preservedHasSelectedLocation)
      }
      if (preservedBranchId !== null) {
        localStorage.setItem("selectedBranchId", preservedBranchId)
      }

      toast({
        title: "Success",
        description: "Login successful!",
      })

      setTimeout(() => router.push(decodeURIComponent(callbackUrl)), 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid credentials.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setFormData({
        ...formData,
        login_phone: "",
        login_email: "",
        login_password: "",
      })
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.otp) {
      toast({
        title: "Error",
        description: "Please enter OTP",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/client/customer/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_or_phone: formData.email_or_phone,
          otp: formData.otp,
          restaurant: RESTAURANT_ID,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.detail || "OTP verification failed")
      }

      document.cookie = `clientAuthToken=${data.token}; path=/; Secure; SameSite=Strict`
      document.cookie = `clientName=${data.name || "Client"}; path=/; Secure; SameSite=Strict`

      toast({
        title: "Success",
        description: "Login successful!",
      })

      setTimeout(() => router.push(decodeURIComponent(callbackUrl)), 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "OTP verification failed",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (
      !formData.email_or_phone ||
      !formData.password ||
      !formData.confirm_password ||
      !formData.first_name.trim() ||
      !formData.last_name.trim()
    ) {
      toast({
        title: "Error",
        description: "Phone number, password, confirm password, first name, and last name are required.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (formData.password.length < 5) {
      toast({
        title: "Error",
        description: "Password must be at least 5 characters long",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (!validatePhoneNumber(formData.email_or_phone)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirm_password) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const requestBody: any = {
        phone_number: formData.email_or_phone,
        email: formData.email || undefined,
        password: formData.password,
        restaurant: RESTAURANT_ID,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
      }

      if (formData.date_of_birth) {
        requestBody.date_of_birth = formData.date_of_birth
      }
      if (formData.anniversary_date) {
        requestBody.anniversary_date = formData.anniversary_date
      }

      const response = await fetch(`${API_BASE_URL}/client/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.detail || "This phone number is already registered for this restaurant.")
      }

      toast({
        title: "Success",
        description: "Account created successfully! Please log in.",
      })
      setFormData({
        email_or_phone: "",
        email: "",
        otp: "",
        password: "",
        confirm_password: "",
        login_phone: "",
        login_email: "",
        login_password: "",
        first_name: "",
        last_name: "",
        date_of_birth: "",
        anniversary_date: "",
        sms_consent: false,
      })
      setStep("LOGIN")
      setIsOtpLogin(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Registration failed",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleLoginMethod = () => {
    setIsOtpLogin(!isOtpLogin)
    setFormData({
      ...formData,
      email_or_phone: "",
      login_phone: "",
      login_password: "",
    })
  }

  const handleResendOTP = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/client/customer/request-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant: RESTAURANT_ID,
          email_or_phone: formData.email_or_phone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.detail || "Failed to resend OTP")
      }

      const expiryTime = new Date().getTime() + 2 * 60 * 1000
      setOtpExpiry(expiryTime)

      toast({
        title: "Success",
        description: "OTP resent successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend OTP",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="relative flex flex-col min-h-screen w-full bg-gray-50">
        <div className="absolute top-6 right-6">
          <Skeleton className="w-32 h-10 rounded-full" />
        </div>

        <main className="flex-grow flex flex-col items-center justify-center px-6 py-6 font-sans">
          <div className="text-center mb-6">
            <Skeleton className="inline-block w-16 h-16 rounded-full mb-4" />
            <Skeleton className="h-10 w-48 mx-auto mb-1" />
            <Skeleton className="h-5 w-64 mx-auto" />
          </div>

          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border">
            <div className="text-center mb-6">
              <Skeleton className="h-8 w-40 mx-auto mb-2" />
              <Skeleton className="h-4 w-56 mx-auto" />
            </div>

            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <InputFieldSkeleton />
              </div>
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <InputFieldSkeleton />
              </div>
              <ButtonSkeleton />
            </div>

            <div className="mt-4 text-center">
              <Skeleton className="h-4 w-32 mx-auto mb-4" />
              <div className="relative flex items-center justify-center">
                <div className="border-t w-full absolute"></div>
                <Skeleton className="h-4 w-8 mx-auto relative bg-white" />
              </div>
            </div>

            <div className="mt-4">
              <ButtonSkeleton />
            </div>

            <div className="text-center mt-6">
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col min-h-screen w-full bg-gray-50">
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-2 font-sans">
        <div className="text-center mb-6">
          <div className="inline-block rounded-full p-4 mb-2">
            <Image src="/TERIYAKI-logo.png" alt="TERIYAKI Logo" width={120} height={80} className="object-contain" />
          </div>
          <h1 className="text-4xl font-bold mb-1">Acai Island </h1>
          <p className="text-gray-600">Welcome to your dining experience</p>
        </div>

        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border">
          {step === "LOGIN" && (
            <>
              {isOtpLogin ? (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">OTP Login</h2>
                    <p className="text-gray-600 text-sm">Quick access with OTP. No registration required.</p>
                  </div>
                  <form onSubmit={handleRequestOTP} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      {loading ? (
                        <InputFieldSkeleton />
                      ) : (
                        <PhoneInput
                          value={formData.email_or_phone}
                          onChange={handlePhoneChange("email_or_phone")}
                          placeholder="Enter your phone number"
                          disabled={loading}
                        />
                      )}
                    </div>
                    <button
                      className="py-3 px-8 w-full rounded-md bg-black text-white hover:bg-gray-800 transition"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? <Loader className="animate-spin mx-auto" size={20} /> : "Send OTP"}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">Sign In</h2>
                    <p className="text-gray-600 text-sm">Welcome back! Please enter your details</p>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      {loading ? (
                        <InputFieldSkeleton />
                      ) : (
                        <PhoneInput
                          value={formData.login_phone}
                          onChange={handlePhoneChange("login_phone")}
                          placeholder="Enter your phone number"
                          disabled={loading}
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Password <span className="text-red-500">*</span>
                      </label>
                      {loading ? (
                        <InputFieldSkeleton />
                      ) : (
                        <InputField
                          icon={<Lock size={18} />}
                          type="password"
                          name="login_password"
                          placeholder="••••••••"
                          value={formData.login_password}
                          onChange={handleChange}
                          className="mb-0"
                        />
                      )}
                    </div>
                    <div className="text-right">
                      <a href="/forgot-password">
                        <span className="text-sm text-blue-600 hover:underline">Forgot Password?</span>
                      </a>
                    </div>
                    <button
                      className="py-3 px-8 w-full rounded-md bg-black text-white hover:bg-gray-800 transition"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? <Loader className="animate-spin mx-auto" size={20} /> : "Sign in"}
                    </button>
                  </form>
                </>
              )}

              <p className="text-center mt-6 text-sm text-gray-600">
                New user?{" "}
                <button
                  onClick={() => setStep("SIGNUP")}
                  className="text-blue-600 font-semibold hover:underline"
                  disabled={loading}
                >
                  Sign up
                </button>
              </p>
            </>
          )}

          {step === "OTP_VERIFY" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">OTP Login</h2>
                <p className="text-gray-600 text-sm mb-4">Quick access with OTP. No registration required.</p>
                <p className="text-sm">
                  We've sent a 6-digit code to
                  <br />
                  <span className="font-medium">{formData.email_or_phone}</span>
                </p>
              </div>
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3 text-center">
                    Enter 6-digit OTP <span className="text-red-500">*</span>
                  </label>
                  {loading ? (
                    <OtpInputSkeleton length={6} />
                  ) : (
                    <OtpInput length={6} value={formData.otp} onChange={handleOtpChange} />
                  )}
                </div>

                <div className="flex justify-between items-center text-sm mb-4">
                  <p className="text-gray-600">Code expires in {timeRemaining}</p>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-blue-600 hover:underline"
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                </div>

                <button
                  className="py-3 px-8 w-full rounded-md bg-black text-white hover:bg-gray-800 transition"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <Loader className="animate-spin mx-auto" size={20} /> : "Verify & Login"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("LOGIN")}
                  className="py-3 px-8 w-full rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition mt-2 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <ArrowLeft size={16} /> Back
                </button>
              </form>

              <p className="text-center mt-6 text-sm text-gray-600">
                Already registered?{" "}
                <button
                  onClick={() => {
                    setStep("LOGIN")
                    setIsOtpLogin(false)
                  }}
                  className="text-blue-600 font-semibold hover:underline"
                  disabled={loading}
                >
                  Sign in
                </button>
              </p>
            </>
          )}

          {step === "SIGNUP" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Sign Up</h2>
                <p className="text-gray-600 text-sm">Complete your account setup</p>
              </div>
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  {loading ? (
                    <InputFieldSkeleton />
                  ) : (
                    <PhoneInput
                      value={formData.email_or_phone}
                      onChange={handlePhoneChange("email_or_phone")}
                      placeholder="Enter your phone number"
                      disabled={loading}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email (optional)</label>
                  {loading ? (
                    <InputFieldSkeleton />
                  ) : (
                    <InputField
                      icon={<Mail size={18} />}
                      type="email"
                      required={false}
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mb-0"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  {loading ? (
                    <InputFieldSkeleton />
                  ) : (
                    <InputField
                      icon={<User size={18} />}
                      type="text"
                      name="first_name"
                      placeholder="Enter your first name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="mb-0"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  {loading ? (
                    <InputFieldSkeleton />
                  ) : (
                    <InputField
                      icon={<User size={18} />}
                      type="text"
                      name="last_name"
                      placeholder="Enter your last name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="mb-0"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth (optional)</label>
                  {loading ? (
                    <InputFieldSkeleton />
                  ) : (
                    <InputField
                      icon={<User size={18} />}
                      type="date"
                      name="date_of_birth"
                      placeholder="Select your date of birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      required={false}
                      className="mb-0"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Anniversary Date (optional)</label>
                  {loading ? (
                    <InputFieldSkeleton />
                  ) : (
                    <InputField
                      icon={<User size={18} />}
                      type="date"
                      name="anniversary_date"
                      placeholder="Select your anniversary date"
                      value={formData.anniversary_date}
                      onChange={handleChange}
                      required={false}
                      className="mb-0"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  {loading ? (
                    <InputFieldSkeleton />
                  ) : (
                    <InputField
                      icon={<Lock size={18} />}
                      type="password"
                      name="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      className="mb-0"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  {loading ? (
                    <InputFieldSkeleton />
                  ) : (
                    <InputField
                      icon={<Lock size={18} />}
                      type="password"
                      name="confirm_password"
                      placeholder="Confirm your password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      className="mb-0"
                    />
                  )}
                </div>
                <button
                  className="py-3 px-8 w-full rounded-md bg-black text-white hover:bg-gray-800 transition"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <Loader className="animate-spin mx-auto" size={20} /> : "Complete Setup"}
                </button>
              </form>
              <p className="text-center mt-6 text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setStep("LOGIN")
                    setIsOtpLogin(false)
                  }}
                  className="text-blue-600 font-semibold hover:underline"
                  disabled={loading}
                >
                  Login
                </button>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}