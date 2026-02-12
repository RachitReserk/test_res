"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { parsePhoneNumber, isValidPhoneNumber, type CountryCode } from "libphonenumber-js"
import { ChevronDown, Phone } from "lucide-react"
// CHANGE: Using react-number-format
import { PatternFormat, type OnValueChange } from "react-number-format"

// The country list remains the same
const countries = [
  { code: "IN", name: "India", callingCode: "+91" },
  { code: "US", name: "United States", callingCode: "+1" },
  { code: "GB", name: "United Kingdom", callingCode: "+44" },
  { code: "CA", name: "Canada", callingCode: "+1" },
  { code: "AU", name: "Australia", callingCode: "+61" },
  { code: "DE", name: "Germany", callingCode: "+49" },
]

interface Country {
  code: CountryCode
  name: string
  callingCode: string
}

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  defaultCountry?: CountryCode
}

// CHANGE: Helper to provide a format pattern for react-number-format
// It uses '#' as the digit placeholder.
const getFormatForCountry = (countryCode: CountryCode): string => {
  switch (countryCode) {
    case "US":
    case "CA":
      return "(###) ###-####"
    case "IN":
      return "##### #####"
    case "GB":
      return "##### ######"
    case "AU":
      return "# #### ####"
    default:
      return "+## ### ### ####"
  }
}

export function PhoneInput({
  value,
  onChange,
  className = "",
  disabled = false,
  defaultCountry = "US",
}: PhoneInputProps) {
  const defaultCountryData = countries.find((c) => c.code === defaultCountry) || countries[0]
  const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountryData)
  // This state will hold the raw, unmasked digits
  const [inputValue, setInputValue] = useState("")
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [validationMessage, setValidationMessage] = useState("")

  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Parse the initial `value` prop
  useEffect(() => {
    if (value) {
      try {
        const parsed = parsePhoneNumber(value)
        if (parsed?.country) {
          const country = countries.find((c) => c.code === parsed.country)
          if (country) {
            setSelectedCountry(country)
            setInputValue(parsed.nationalNumber)
            return
          }
        }
      } catch (error) { /* Ignore parsing errors */ }
    }
  }, [value])

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Validation logic
  useEffect(() => {
    const rawNumber = inputValue.replace(/\D/g, "")
    if (!rawNumber) {
      setIsValid(null)
      setValidationMessage("")
      return
    }
    const fullNumber = `${selectedCountry.callingCode}${rawNumber}`
    const isValidNumber = isValidPhoneNumber(fullNumber, selectedCountry.code)
    setIsValid(isValidNumber)
    setValidationMessage(isValidNumber ? "Valid phone number" : `Invalid ${selectedCountry.name} phone number`)
  }, [selectedCountry, inputValue])

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country)
    setInputValue("")
    onChange(country.callingCode)
    setIsDropdownOpen(false)
    inputRef.current?.focus()
  }

  // CHANGE: The event handler now uses `onValueChange`
  const handleValueChange: OnValueChange = (values) => {
    const { value: unmaskedValue } = values
    setInputValue(unmaskedValue)
    onChange(`${selectedCountry.callingCode}${unmaskedValue}`)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative flex">
        {/* Country Code Dropdown (unchanged) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            className={`h-[49.5px] flex items-center gap-2 px-3 py-3 border border-r-0 rounded-l-md bg-gray-50 hover:bg-gray-100 transition-colors ${
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            } ${isValid === false ? "border-red-300" : isValid === true ? "border-green-300" : "border-gray-300"}`}
          >
            <span className="text-sm font-medium">{selectedCountry.callingCode}</span>
            <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {isDropdownOpen && (
            <div className="absolute top-full left-0 z-50 w-64 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {countries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountryChange(country)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between text-sm"
                >
                  <span>{country.name}</span>
                  <span className="text-gray-500">{country.callingCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Phone Number Input */}
        <div className="relative flex-1">
          <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10" />
          {/* CHANGE: Replaced with PatternFormat */}
          <PatternFormat
            format={getFormatForCountry(selectedCountry.code)}
            value={inputValue}
            onValueChange={handleValueChange}
            mask="_"
            disabled={disabled}
            getInputRef={inputRef}
            className={`w-full pl-10 pr-3 py-3 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
            } ${
              isValid === false
                ? "border-red-300 focus:ring-red-500"
                : isValid === true
                ? "border-green-300 focus:ring-green-500"
                : "border-gray-300"
            }`}
          />
        </div>
      </div>

      {validationMessage && (
        <p className={`text-sm ${isValid ? "text-green-600" : "text-red-600"}`}>{validationMessage}</p>
      )}
    </div>
  )
}