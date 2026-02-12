export async function getCart() {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("clientAuthToken="))
    ?.split("=")[1]

  if (!token) {
    throw new Error("Authentication required")
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/cart/get/`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Failed to fetch cart: ${response.status}`)
  }

  return response.json()
}

export async function addToCart(menuItemId: number, quantity: number, variationId?: number, optionIds: number[] = []) {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("clientAuthToken="))
    ?.split("=")[1]

  if (!token) {
    throw new Error("Authentication required")
  }

  const payload = {
    menu_item_id: menuItemId,
    quantity,
    variation_id: variationId,
    option_ids: optionIds,
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/cart/add/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Failed to add to cart: ${response.status}`)
  }

  return response.json()
}

export async function updateCartItemQuantity(cartItemId: number, quantity: number) {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("clientAuthToken="))
    ?.split("=")[1]

  if (!token) {
    throw new Error("Authentication required")
  }

  const payload = {
    cart_item_id: cartItemId,
    quantity,
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/cart/update/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Failed to update cart item: ${response.status}`)
  }

  return response.json()
}

export async function removeCartItem(cartItemId: number) {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("clientAuthToken="))
    ?.split("=")[1]

  if (!token) {
    throw new Error("Authentication required")
  }

  const payload = {
    cart_item_id: cartItemId,
  }

  let url = ""
  if (cartItemId === 79997999) {
    url = `${process.env.NEXT_PUBLIC_API_URL}/customer/cart/remove/`
  } else {
    url = `${process.env.NEXT_PUBLIC_API_URL}/customer/cart/remove/?cart_item_id=${cartItemId}`
  }

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Failed to remove cart item: ${response.status}`)
  }

  return response.json()
}
