// Authentication utility functions

// Get a cookie value by name
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null
  return null
}

// Set a cookie with the given name and value
export function setCookie(name: string, value: string, days = 30): void {
  if (typeof document === "undefined") return

  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; Secure; SameSite=Strict`
}

// Remove a cookie by name
export function removeCookie(name: string): void {
  if (typeof document === "undefined") return

  document.cookie = `${name}=; Max-Age=-99999999; path=/`
}

// Check if the user is authenticated
export function isAuthenticated(): boolean {
  return !!getCookie("authToken")
}

// Get the user's role
export function getUserRole(): string | null {
  return getCookie("userRole")
}

// Get the user's name
export function getUserName(): string | null {
  return getCookie("userName") || "User"
}

// Get the user's email
export function getUserEmail(): string | null {
  return getCookie("userEmail") || null
}

// Get the appropriate dashboard URL based on user role
export function getDashboardUrl(): string {
  const role = getUserRole()

  if (role === "manager") {
    return "/manager-dashboard"
  } else if (role === "employee") {
    return "/employee-dashboard"
  } else {
    return "/dashboard" // Default for owner or unknown roles
  }
}

// Logout the user by removing all auth cookies
export function logout(redirectUrl = "/auth/login"): void {
  removeCookie("authToken")
  removeCookie("userRole")
  removeCookie("userName")
  removeCookie("userEmail")

  // Optional redirect after logout
  if (typeof window !== "undefined" && redirectUrl) {
    window.location.href = redirectUrl
  }
}

