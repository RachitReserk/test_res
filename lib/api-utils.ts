// API utility functions with caching and optimization

// Cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

// Debounce function to prevent multiple API calls
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Generic fetch function with caching and proper auth headers
export async function fetchWithCache<T>(
  url: string,
  options: RequestInit = {},
  cacheKey?: string,
  cacheDuration: number = CACHE_DURATION,
): Promise<T> {
  // Generate cache key if not provided
  const effectiveCacheKey = cacheKey || `${url}_${JSON.stringify(options.body || {})}`
  const now = Date.now()

  // Check cache first
  const cachedData = apiCache.get(effectiveCacheKey)
  if (cachedData && now - cachedData.timestamp < cacheDuration) {
    console.log(`Using cached data for ${url}`)
    return cachedData.data as T
  }

  // Get auth token based on URL path
  let authToken: string | null = null

  if (url.includes("/client/owner/") || url.includes("/menu/") || url.includes("/management/")) {
    // Admin token
    authToken =
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1] || null
  } else if (url.includes("/client/customer/")) {
    // Client token
    authToken =
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("clientAuthToken="))
        ?.split("=")[1] || null
  }

  // Set up headers with auth token if available
  const headers = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Token ${authToken}` } : {}),
    ...options.headers,
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || errorData.detail || `API error: ${response.status}`)
    }

    const data = await response.json()

    // Cache the successful response
    apiCache.set(effectiveCacheKey, {
      data,
      timestamp: now,
    })

    return data as T
  } catch (error) {
    console.error(`Error fetching ${url}:`, error)
    throw error
  }
}

// Clear cache for a specific key or pattern
export function clearCache(keyPattern?: string): void {
  if (!keyPattern) {
    apiCache.clear()
    return
  }

  // Clear specific keys matching the pattern
  for (const key of apiCache.keys()) {
    if (key.includes(keyPattern)) {
      apiCache.delete(key)
    }
  }
}

// Function to handle API errors consistently
export function handleApiError(error: any, toast: any): void {
  console.error("API Error:", error)

  let errorMessage = "An unexpected error occurred. Please try again."

  if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === "object" && error !== null) {
    errorMessage = error.message || error.detail || errorMessage
  }

  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive",
  })
}

