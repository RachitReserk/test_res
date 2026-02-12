"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, X, AlertTriangle, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

interface Option {
  id: number
  name: string
  price_adjustment: number
  is_active: boolean
}

interface OptionGroup {
  id: number
  name: string
  is_required: boolean
  min_selections: number
  max_selections: number
  options: Option[]
  is_active: boolean
}

interface Variation {
  id: number
  name: string
  price_adjustment: number
}

interface Item {
  id: number
  name: string
  description: string
  price: string
  image: string | null
  preparation_time: number
  calories: number
  variations: Variation[]
  option_groups: OptionGroup[]
  tags: any[]
}

interface CheckoutItemModalProps {
  isOpen: boolean
  onClose: () => void
  item: Item | null
  offerId: string
  onApplyOffer: (offerId: string, variationId?: number, optionIds?: number[]) => Promise<void>
  isApplyingOffer: boolean
}

const GroupRequirement = ({ group }: { group: OptionGroup }) => {
  const { is_required, min_selections, max_selections } = group
  const parts = []

  if (is_required) {
    parts.push("Required")
  }

  if (min_selections > 0 && max_selections > 0 && min_selections === max_selections) {
    if (min_selections === 1 && is_required) {
      // This is a standard required radio button, no extra text needed
    } else {
      parts.push(`Select ${min_selections}`)
    }
  } else {
    if (min_selections > 0) {
      parts.push(`select at least ${min_selections}`)
    }
    if (max_selections > 0) {
      // Avoid showing "select up to 1" for required radio buttons
      if (!is_required || max_selections > 1) {
        parts.push(`select up to ${max_selections}`)
      }
    }
  }

  if (parts.length === 0 || (parts.length === 1 && parts[0] === "Required" && max_selections === 1)) {
    return null
  }

  return <p className="text-sm text-gray-500 -mt-1 mb-2">{parts.join(" • ")}</p>
}

export function CheckoutItemModal({
  isOpen,
  onClose,
  item,
  offerId,
  onApplyOffer,
  isApplyingOffer,
}: CheckoutItemModalProps) {
  const [selectedVariationId, setSelectedVariationId] = useState<number | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: number]: Set<number>
  }>({})
  const [groupErrors, setGroupErrors] = useState<{ [key: number]: string }>({})
  const groupErrorTimers = useRef<{ [key: number]: NodeJS.Timeout }>({})

  useEffect(() => {
    if (isOpen && item) {
      // Reset states when modal opens with a new item
      if (item.variations?.length > 0) {
        setSelectedVariationId(item.variations[0].id)
      } else {
        setSelectedVariationId(null)
      }
      setSelectedOptions({})
      setGroupErrors({})
    }
  }, [isOpen, item])

  const validationState = useMemo(() => {
    if (!item?.option_groups) {
      return { isValid: true, message: "" }
    }

    for (const group of item.option_groups) {
      const selectionCount = selectedOptions[group.id]?.size || 0

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
  }, [item, selectedOptions])

  const handleCheckboxClick = (groupId: number, optionId: number) => {
    const group = item?.option_groups.find((g) => g.id === groupId)
    if (!group) return

    if (groupErrorTimers.current[groupId]) {
      clearTimeout(groupErrorTimers.current[groupId])
    }

    setGroupErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[groupId]
      return newErrors
    })

    setSelectedOptions((prev) => {
      const newState = { ...prev }
      const groupOptions = new Set(newState[groupId] || [])

      if (groupOptions.has(optionId)) {
        groupOptions.delete(optionId)
      } else {
        if (group.max_selections === 0 || groupOptions.size < group.max_selections) {
          groupOptions.add(optionId)
        } else {
          const errorMessage = `You can select at most ${group.max_selections} options for ${group.name}.`
          setGroupErrors((prev) => ({
            ...prev,
            [groupId]: errorMessage,
          }))

          groupErrorTimers.current[groupId] = setTimeout(() => {
            setGroupErrors((prev) => {
              const newErrors = { ...prev }
              if (newErrors[groupId] === errorMessage) {
                delete newErrors[groupId]
              }
              return newErrors
            })
          }, 3000)
        }
      }

      newState[groupId] = groupOptions
      return newState
    })
  }

  const handleRadioClick = (groupId: number, optionId: number) => {
    setSelectedOptions((prev) => {
      const newState = { ...prev }
      const groupOptions = new Set([optionId])
      newState[groupId] = groupOptions
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validationState.isValid) {
      toast.error(validationState.message)
      return
    }

    const option_ids = Object.values(selectedOptions).flatMap((set) => Array.from(set))
    await onApplyOffer(offerId, selectedVariationId ?? undefined, option_ids)
    onClose() // Close modal after applying offer
  }

  if (!isOpen || !item) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[99] flex items-center justify-center p-4"
      onClick={() => {
        onClose()
        setSelectedOptions({})
      }}
    >
      <form
        className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <button
          type="button"
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          onClick={() => {
            onClose()
            setSelectedOptions({})
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-2 pr-8">{item.name}</h2>
        <p className="text-gray-500 mb-4">{item.description}</p>
        {item.image && (
          <div className="relative w-full h-60 rounded mb-4 overflow-hidden">
            <Image
              src={`${item.image}` || "/placeholder.svg"}
              alt={item.name}
              layout="fill"
              objectFit="cover"
              className="rounded"
            />
          </div>
        )}
        <p className="text-lg font-semibold mb-2">Price: ${item.price}</p>
        {item.calories > 0 && <p className="text-sm text-gray-600 mb-2">Calories: {item.calories}</p>}
        {item.preparation_time > 0 && (
          <p className="text-sm text-gray-600 mb-4">Prep Time: {item.preparation_time} min</p>
        )}

        {item.variations?.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Variations</h3>
            <ul className="space-y-2">
              {item.variations.map((v) => (
                <li key={v.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    id={`variation-${v.id}`}
                    name="variation"
                    value={v.id}
                    checked={selectedVariationId === v.id}
                    onChange={() => setSelectedVariationId(v.id)}
                    className="accent-orange-600"
                    disabled={isApplyingOffer}
                  />
                  <label htmlFor={`variation-${v.id}`} className="text-sm text-gray-700">
                    {v.name} (+${v.price_adjustment})
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {item.option_groups?.map((group) => {
          const isRadio = group.max_selections === 1
          const hasSelections = selectedOptions[group.id]?.size > 0

          return (
            <motion.div
              layout
              key={group.id}
              className={`mb-4 ${!group.is_active ? "opacity-50 pointer-events-none" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className={`font-semibold ${!group.is_active ? "text-gray-400" : ""}`}>{group.name}</h3>
                {hasSelections && (
                  <button
                    type="button"
                    className="text-gray-500 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={(e) => {
                      e.preventDefault()
                      if (!isApplyingOffer) {
                        clearGroupSelections(group.id)
                      }
                    }}
                    disabled={isApplyingOffer || !group.is_active}
                    title="Clear selections"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <GroupRequirement group={group} />
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
              <ul className="space-y-1 text-sm text-gray-700 mt-2">
                {group.options.map((opt) => {
                  const isSelected = selectedOptions[group.id]?.has(opt.id) || false

                  return (
                    <li
                      key={opt.id}
                      className={`flex items-center gap-2 ${
                        !opt.is_active && group.is_active ? "opacity-60 pointer-events-none" : ""
                      }`}
                    >
                      {isRadio ? (
                        <div
                          className={`p-2 flex items-center gap-2 w-full rounded ${
                            !opt.is_active ? "" : "cursor-pointer hover:bg-gray-50"
                          } ${isSelected ? "bg-orange-50" : ""}`}
                          onClick={() => !isApplyingOffer && opt.is_active && handleRadioClick(group.id, opt.id)}
                        >
                          <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center">
                            {isSelected && <div className="w-2 h-2 rounded-full bg-orange-600"></div>}
                          </div>
                          <span className={`${!opt.is_active && group.is_active ? "text-gray-400" : ""}`}>
                            {opt.name} (+${opt.price_adjustment})
                          </span>
                        </div>
                      ) : (
                        <div
                          className={`p-2 flex items-center gap-2 w-full rounded ${
                            !opt.is_active ? "" : "cursor-pointer hover:bg-gray-50"
                          } ${isSelected ? "bg-orange-50" : ""}`}
                          onClick={() => !isApplyingOffer && opt.is_active && handleCheckboxClick(group.id, opt.id)}
                        >
                          <div
                            className={`w-4 h-4 rounded border ${
                              isSelected ? "bg-orange-600 border-orange-600" : "border-gray-300"
                            } flex items-center justify-center`}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`${!opt.is_active && group.is_active ? "text-gray-400" : ""}`}>
                            {opt.name} (+${opt.price_adjustment})
                          </span>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </motion.div>
          )
        })}

        <Button
          type="submit"
          className={`w-full ${
            isApplyingOffer || !validationState.isValid
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-navbartextcolor hover:bg-navbartextcolor/80"
          } text-white mt-4 px-4 py-2 rounded transition flex items-center justify-center`}
          disabled={isApplyingOffer || !validationState.isValid}
        >
          {isApplyingOffer ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Applying Offer...
            </>
          ) : (
            <>
              <Gift className="h-5 w-5 mr-2" /> Apply Offer
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
