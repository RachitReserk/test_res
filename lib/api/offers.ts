import { getAuthToken } from "@/lib/api/auth"

export interface ApplicableProduct {
  id: number;
  menu_item: number;
  menu_item_name: string;
}

export interface Condition {
  id: number;
  menu_item: number;
  menu_item_name: string;
  min_quantity: number;
}

export interface Offer {
  id: number
  name: string
  description: string
  offer_type: "PERCENTAGE" | "FLAT" | "FREE_ITEM" | "FREE_ITEM_ADDITION" | "BOGO"
  value: string | null // Value can be null for FREE_ITEM_ADDITION
  start_date: string
  end_date: string
  min_order_value: string
  applicable_products?: ApplicableProduct[]
  applicable_categories?: any[] // You might want to define a more specific interface for categories
  conditions?: Condition[] // Add conditions property
  free_items?: number[] // Optional array of item IDs for FREE_ITEM_ADDITION
  applies_to_dob: boolean
}

export const fetchEligibleOffers = async (orderId: string): Promise<{ eligible_offers: Offer[] }> => {
  const token = getAuthToken()

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers/eligible/${orderId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch offers: ${response.statusText}`)
  }

  return response.json()
}

export const applyOffer = async (
  orderId: string,
  offerCode?: string,
  offerId?: string,
  variationId?: number,
  optionIds?: number[],
  freeMenuItemId?: number, // Add freeMenuItemId parameter
) => {
  const token = getAuthToken()
  let payload: any = {}

  if (offerCode) {
    payload.offer_code = offerCode
  } else if (offerId) {
    payload.offer_id = offerId
  }

  if (variationId !== undefined) {
    payload.variation_id = variationId
  }
  if (optionIds !== undefined && optionIds.length > 0) {
    payload.option_ids = optionIds
  }
  if (freeMenuItemId !== undefined) {
    payload.free_menu_item_id = freeMenuItemId // Include free_menu_item_id in payload
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers/apply/${orderId}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || `Failed to apply offer: ${response.statusText}`)
  }

  return response.json()
}

export const removeOffer = async (orderId: string, offerCode?: string, offerId?: string) => {
  const token = getAuthToken()
  const payload = offerCode ? { offer_code: offerCode } : { offer_id: offerId }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers/remove/${orderId}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || `Failed to remove offer: ${response.statusText}`)
  }

  return response.json()
}

export const fetchPublicOffers = async (): Promise<Offer[]> => {
  const branchId = localStorage.getItem("selectedBranchId")
  const url = branchId
    ? `${process.env.NEXT_PUBLIC_API_URL}/offers/public/?branch_id=${branchId}`
    : `${process.env.NEXT_PUBLIC_API_URL}/offers/public/`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch public offers: ${response.statusText}`)
  }

  return response.json()
}
