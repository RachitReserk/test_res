import { getAuthToken } from "@/lib/api/auth"

// Use environment variable instead of hardcoded URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function initiateCheckout(branchId: number) {
  const token = getAuthToken()

  const res = await fetch(`${API_BASE_URL}/customer/checkout/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ branch: branchId }),
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || "Failed to initiate checkout")
  }

  return await res.json()
}

export async function getCheckout() {
  const token = getAuthToken()

  console.log(`API call: Getting checkout data`)
  console.log(`Endpoint: ${API_BASE_URL}/customer/checkout/`)

  try {
    const res = await fetch(`${API_BASE_URL}/customer/checkout/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    console.log(`Response status: ${res.status}`)

    if (!res.ok) {
      const errorData = await res.json().catch(() => null)
      console.error("Error response:", errorData)
      throw new Error(errorData?.message || `Failed to fetch checkout data (Status: ${res.status})`)
    }

    const data = await res.json()
    console.log("Checkout data received:", data)
    return data
  } catch (error) {
    console.error("Error in getCheckout function:", error)
    throw error
  }
}

// In the setMode function, update the console.log to show the ISO format
export async function setMode(orderId: number, mode: "pickup" | "delivery", pickup_time?: string | null) {
  const token = getAuthToken()

  console.log(
    `API call: Setting mode for order ${orderId} to ${mode}${pickup_time ? ` with pickup time ${pickup_time}` : ""}`,
  )

  try {
    // Create the request body based on the mode and pickup time
    const requestBody: { mode: string; pickup_time?: string | null } = { mode }

    // Add pickup_time to the request body if provided and mode is pickup
    
      requestBody.pickup_time = pickup_time
    

    console.log("Request payload:", requestBody)

    const res = await fetch(`${API_BASE_URL}/customer/order/${orderId}/mode/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify(requestBody),
    })

    console.log(`Response status: ${res.status}`)

    if (!res.ok) {
      const errorData = await res.json().catch(() => null)
      console.error("Error response:", errorData)
      throw new Error(errorData?.message || `Failed to set mode (Status: ${res.status})`)
    }

    return await res.json()
  } catch (error) {
    console.error("Error in setMode function:", error)
    throw error
  }
}

export async function addInstruction(
  orderId: number,
  payload: { restaurant_instructions?: string; delivery_instructions?: string },
) {
  const token = getAuthToken()
  const res = await fetch(`${API_BASE_URL}/customer/order/${orderId}/instruction/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Failed to update instructions")
  return await res.json()
}

export async function getAddresses() {
  const token = getAuthToken()
  const res = await fetch(`${API_BASE_URL}/customer/address/`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  })
  if (!res.ok) throw new Error("Failed to fetch addresses")
  return await res.json()
}

export async function selectAddress(orderId: number, addressId: number) {
  const token = getAuthToken()
  const res = await fetch(`${API_BASE_URL}/customer/order/${orderId}/select-address/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ address_id: addressId }),
  })
  if (!res.ok) throw new Error("Failed to select address")
  return await res.json()
}

// Update the updatePhoneNumber function to use the correct endpoint
export async function updatePhoneNumber(phoneNumber: string) {
  const token = getAuthToken()
  const res = await fetch(`${API_BASE_URL}/client/customer/profile/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ phone_number: phoneNumber }),
  })
  if (!res.ok) throw new Error("Failed to update phone number")
  return await res.json()
}

export async function getDeliveryProviders(orderId: number) {
  const token = getAuthToken()
  const res = await fetch(`${API_BASE_URL}/order/delivery/providers/${orderId}/`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  })
  if (!res.ok) throw new Error("Failed to fetch delivery providers")
  return await res.json()
}

export async function requestDeliveryQuote(orderId: number, provider?: string) {
  const token = getAuthToken()
  
  const body: any = {}
  if (provider) {
    body.provider = provider
  }

  const res = await fetch(`${API_BASE_URL}/order/delivery/quote/${orderId}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json", // Ensure content type is set
    },
    body: JSON.stringify(body), // Send provider in body
  })
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || "Failed to get delivery quote")
  }
  return await res.json()
}

export async function setPaymentMethod(orderId: number, method: "online" | "offline") {
  const token = getAuthToken()
  const res = await fetch(`${API_BASE_URL}/customer/order/${orderId}/payment-method/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ payment_method: method }),
  })
  if (!res.ok) throw new Error("Failed to set payment method")
  return await res.json()
}

// Update the setTip function to handle potential errors better
export async function setTip(orderId: number, tip: number) {
  const token = getAuthToken()

  // Log the request details
  console.log(`API call: Setting tip for order ${orderId} to ${tip}`)
  console.log(`Endpoint: ${API_BASE_URL}/customer/order/${orderId}/tip/`)

  // Create the payload exactly as specified
  const payload = { tip: tip }
  console.log("Request payload:", payload)

  try {
    const res = await fetch(`${API_BASE_URL}/customer/order/${orderId}/tip/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify(payload),
    })

    // Log the response status
    console.log(`Response status: ${res.status}`)

    if (!res.ok) {
      // Try to get more detailed error information
      const errorData = await res.json().catch(() => null)
      console.error("Error response:", errorData)
      throw new Error(errorData?.message || `Failed to set tip (Status: ${res.status})`)
    }

    return await res.json()
  } catch (error) {
    console.error("Error in setTip function:", error)
    throw error
  }
}

// Add function to create a new address
export async function createAddress(addressData: {
  name: string
  street_address: string
  sub_premise?: string
  city: string
  state: string
  zip_code: string
  phone_number: string
}) {
  const token = getAuthToken()

  try {
    const res = await fetch(`${API_BASE_URL}/customer/address/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify(addressData),
    })

    const data = await res.json()

    if (!res.ok) {
      // If the server returns an error status, throw an error
      throw new Error(data.message || `Failed to create address (Status: ${res.status})`)
    }

    return data
  } catch (error: any) {
    console.error("Error in createAddress function:", error)
    throw error // Re-throw the error to be caught by the caller
  }
}

// Add function to update an address
export async function updateAddress(
  addressId: number,
  addressData: {
    name?: string
    street_address?: string
    sub_premise?: string
    city?: string
    state?: string
    zip_code?: string
  },
) {
  const token = getAuthToken()
  const res = await fetch(`${API_BASE_URL}/customer/address/${addressId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(addressData),
  })
  if (!res.ok) throw new Error("Failed to update address")
  return await res.json()
}

// Add function to delete an address
export async function deleteAddress(addressId: number) {
  const token = getAuthToken()
  const res = await fetch(`${API_BASE_URL}/customer/address/${addressId}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Token ${token}`,
    },
  })
  if (!res.ok) throw new Error("Failed to delete address")
  return await res.json()
}

// Add function to get delivery quote
export async function getDeliveryQuote(orderId: number) {
  const token = getAuthToken()
  const res = await fetch(`${API_BASE_URL}/order/delivery/quote/${orderId}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
  })
  if (!res.ok) throw new Error("Failed to get delivery quote")
  return await res.json()
}


export async function confirmOrder(orderId: number, checkoutData: any) {
  const token = getAuthToken()

  try {
    const res = await fetch(`${API_BASE_URL}/order/confirm/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => null)
      console.error("Error confirming order:", errorData)
      throw new Error(errorData?.message || `Failed to confirm order (Status: ${res.status})`)
    }

    // 1. Parse the response immediately to get the new ID
    const responseData = await res.json()

    // Add socket here .
    if (!checkoutData.pickup_time) {
      checkoutData.order_status = "confirmed"
      
      // 2. Attach the branch_order_id from the backend response to checkoutData
      if (responseData.branch_order_id) {
        checkoutData.branch_order_id = responseData.branch_order_id
      }

      const branch = localStorage.getItem("selectedBranchId")
      const restaurantId = process.env.NEXT_PUBLIC_RESTAURANT_ID

      const roomName = `restaurants/${restaurantId}/branches/${branch}/orders`;

      const socket = await fetch(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_SOCKET_API_KEY || "",
        },
        body: JSON.stringify({
          room: roomName,
          event: 'new-order',
          data: checkoutData, 
        }),
      });

      console.log("Socket response:", socket.status, await socket.text());
    }

    return responseData
  } catch (error) {
    console.error("Error in confirmOrder function:", error)
    throw error
  }
}
// Add this new function to your existing checkout.ts file
export async function createPaymentIntent(checkoutId: number) {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("clientAuthToken="))
    ?.split("=")[1]

  if (!token) {
    throw new Error("Authentication required")
  }

  const payload = {
    checkout_id: checkoutId,
  }

  const response = await fetch(`${API_BASE_URL}/order/create-payment/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Failed to create payment intent: ${response.status}`)
  }

  return response.json()
}

// Add this new function at the end of the file to handle coupon application
export async function applyCoupon(couponCode: string) {
  const token = getAuthToken()

  try {
    const res = await fetch(`${API_BASE_URL}/order/coupon/apply/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ coupon: couponCode }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => null)
      console.error("Error applying coupon:", errorData)
      throw new Error(errorData?.message || `Failed to apply coupon (Status: ${res.status})`)
    }

    return await res.json()
  } catch (error) {
    console.error("Error in applyCoupon function:", error)
    throw error
  }
}

export async function cancelCheckout() {
  const token = getAuthToken()

  try {
    const res = await fetch(`${API_BASE_URL}/customer/checkout/cancel/`, {
      method: "DELETE",
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => null)
      console.error("Error canceling checkout:", errorData)
      throw new Error(errorData?.message || `Failed to cancel checkout (Status: ${res.status})`)
    }

    return await res.json()
  } catch (error) {
    console.error("Error in cancelCheckout function:", error)
    throw error
  }
}
