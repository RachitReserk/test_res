// app/client/forgot-password/page.tsx
"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Lock, Loader, ArrowLeft, Mail } from "lucide-react"
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

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState("REQUEST_OTP") // REQUEST_OTP, VERIFY_OTP, SET_NEW_PASSWORD
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email_or_phone: "",
    otp: "",
    new_password: "",
    confirm_new_password: "",
    sms_consent: false,
  })
  const [resetToken, setResetToken] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleOtpChange = (value: string) => setFormData({ ...formData, otp: value })

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, email_or_phone: value })
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked })
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
        description: "Email or phone number is required.",
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
          email_or_phone: formData.email_or_phone,
          restaurant: RESTAURANT_ID,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.email_or_phone?.[0] || data.message || data.detail || "Failed to request OTP")
      }

      toast({
        title: "Success",
        description: data.message || "OTP sent successfully!",
      })
      setStep("VERIFY_OTP")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to request OTP.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.otp) {
      toast({
        title: "Error",
        description: "Please enter the OTP.",
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
        throw new Error(data.error || data.message || data.detail || "OTP verification failed.")
      }

      setResetToken(data.token)
      toast({
        title: "Success",
        description: "OTP verified successfully. Please set your new password.",
      })
      setStep("SET_NEW_PASSWORD")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "OTP verification failed.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.new_password || !formData.confirm_new_password) {
      toast({
        title: "Error",
        description: "Please enter and confirm your new password.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (formData.new_password !== formData.confirm_new_password) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/client/customer/set-new-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${resetToken}`,
        },
        body: JSON.stringify({
          new_password: formData.new_password,
          confirm_password: formData.confirm_new_password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.new_password?.[0] || data.message || data.detail || "Failed to set new password.")
      }

      toast({
        title: "Success",
        description: "Password updated successfully! Please log in with your new password.",
      })
      setResetToken(null)
      router.push("/client/login")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set new password.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col min-h-screen w-full bg-gray-50">
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-2 font-sans">
        <div className="text-center mb-6">
          <div className="inline-block rounded-full p-4 mb-2">
            <Image src="/TERIYAKI-logo.png" alt="TERIYAKI Logo" width={300} height={80} className="object-contain" />
          </div>
          <h1 className="text-4xl font-bold mb-1">Acai Island </h1>
        </div>

        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border">
          {step === "REQUEST_OTP" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Forgot Password</h2>
                <p className="text-gray-600 text-sm">Enter your phone number to reset your password.</p>
              </div>
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <PhoneInput
                    value={formData.email_or_phone}
                    onChange={handlePhoneChange}
                    placeholder="Enter your phone number"
                    disabled={loading}
                  />
                  <div className="flex items-start gap-2 mx-2 mt-2">
                    <input
                      type="checkbox"
                      id="sms_consent"
                      name="sms_consent"
                      checked={formData.sms_consent}
                      onChange={handleCheckboxChange}
                      disabled={loading}
                      className="mt-1"
                    />
                    <p style={{fontSize: '12px', color: '#666'}}>
                      By providing your mobile number, you agree to receive one-time passcodes by SMS for authentication purposes from Acai Island through the Quickbitenow platform. Message and data rates may apply. Message frequency may vary. Reply STOP to opt out. <a className="text-blue-500" href={process.env.NEXT_PUBLIC_WEBSITE_URL} target="_blank">Privacy Policy</a>
                    </p>
                  </div>
                </div>
                <Button
                  className="py-3 px-8 w-full rounded-md bg-black text-white hover:bg-gray-800 transition"
                  type="submit"
                  disabled={loading || !formData.sms_consent}
                >
                  {loading ? <Loader className="animate-spin mx-auto" size={20} /> : "Request OTP"}
                </Button>
                <button
                  type="button"
                  onClick={() => router.push("/client/login")}
                  className="py-3 px-8 w-full rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition mt-2 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <ArrowLeft size={16} /> Back to Login
                </button>
              </form>
            </>
          )}

          {step === "VERIFY_OTP" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Verify OTP</h2>
                <p className="text-gray-600 text-sm">Enter the OTP sent to {formData.email_or_phone}.</p>
              </div>
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3 text-center">Enter 6-digit OTP</label>
                  <OtpInput length={6} value={formData.otp} onChange={handleOtpChange} />
                </div>
                <button
                  className="py-3 px-8 w-full rounded-md bg-black text-white hover:bg-gray-800 transition"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <Loader className="animate-spin mx-auto" size={20} /> : "Verify OTP"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("REQUEST_OTP")}
                  className="py-3 px-8 w-full rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition mt-2 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <ArrowLeft size={16} /> Back
                </button>
              </form>
            </>
          )}

          {step === "SET_NEW_PASSWORD" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Set New Password</h2>
                <p className="text-gray-600 text-sm">Create a new password for your account.</p>
              </div>
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <InputField
                    icon={<Lock size={18} />}
                    type="password"
                    name="new_password"
                    placeholder="Enter new password"
                    value={formData.new_password}
                    onChange={handleChange}
                    className="mb-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                  <InputField
                    icon={<Lock size={18} />}
                    type="password"
                    name="confirm_new_password"
                    placeholder="Confirm new password"
                    value={formData.confirm_new_password}
                    onChange={handleChange}
                    className="mb-0"
                  />
                </div>
                <button
                  className="py-3 px-8 w-full rounded-md bg-black text-white hover:bg-gray-800 transition"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <Loader className="animate-spin mx-auto" size={20} /> : "Set New Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}