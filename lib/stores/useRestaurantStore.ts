import { create } from "zustand"

interface RestaurantData {
  id: number
  name: string
  description: string
  landing_image?: string
}

interface RestaurantStore {
  restaurant: RestaurantData | null
  isLoading: boolean
  fetchRestaurant: () => Promise<void>
  setRestaurant: (data: RestaurantData) => void
  clearRestaurant: () => void
}

export const useRestaurantStore = create<RestaurantStore>((set) => ({
  restaurant: null,
  isLoading: false,

  fetchRestaurant: async () => {
    set({ isLoading: true })
    try {
      const token = document.cookie
        .split("; ")
        .find((r) => r.startsWith("authToken="))
        ?.split("=")[1]

      if (!token) throw new Error("Missing token")

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client/owner/create/restaurant/`, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      const data = await res.json()
      set({ restaurant: data })
    } catch (err) {
      set({ restaurant: null })
    } finally {
      set({ isLoading: false })
    }
  },

  setRestaurant: (data) => set({ restaurant: data }),
  clearRestaurant: () => set({ restaurant: null }),
}))
