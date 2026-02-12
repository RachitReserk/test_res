// Client authentication utility functions

// Get a cookie value by name
export function getClientCookie(name: string): string | null {
  if (typeof document === "undefined") return null

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null
  return null
}

// Set a cookie with the given name and value
export function setClientCookie(name: string, value: string, days = 7): void {
  if (typeof document === "undefined") return

  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; Secure; SameSite=Strict`
}

// Remove a cookie by name
export function removeClientCookie(name: string): void {
  if (typeof document === "undefined") return

  document.cookie = `${name}=; Max-Age=-99999999; path=/`
}

// Check if the client is authenticated
export function isClientAuthenticated(): boolean {
  return !!getClientCookie("clientAuthToken")
}

// Get the client's name
export function getClientName(): string | null {
  return getClientCookie("clientName") || "Client"
}

// Logout the client by removing all auth cookies
export function logoutClient(): void {
  removeClientCookie("clientAuthToken")
  removeClientCookie("clientName")
}

