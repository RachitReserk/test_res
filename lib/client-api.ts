// Client API utility functions

// Base URL for API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

// Generic fetch function with error handling
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error)
    throw error
  }
}

// Client Dashboard API functions
export async function getClientDashboardStats() {
  return fetchAPI<any>("/api/client/dashboard/stats")
}

export async function getClientOrders() {
  return fetchAPI<any[]>("/api/client/dashboard/orders")
}

export async function getClientFavorites() {
  return fetchAPI<any[]>("/api/client/dashboard/favorites")
}

// Client Reservations API functions
export async function getClientReservations() {
  return fetchAPI<any[]>("/api/client/reservations")
}

export async function createClientReservation(reservationData: any) {
  return fetchAPI<any>("/api/client/reservations", {
    method: "POST",
    body: JSON.stringify(reservationData),
  })
}

// Client Profile API functions
export async function getClientProfile() {
  return fetchAPI<any>("/api/client/profile")
}

export async function updateClientProfile(profileData: any) {
  return fetchAPI<any>("/api/client/profile", {
    method: "PUT",
    body: JSON.stringify(profileData),
  })
}

