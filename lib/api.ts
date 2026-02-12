// // API utility functions

// // Base URL for API calls
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

// // Generic fetch function with error handling
// async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
//   const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint

//   try {
//     const response = await fetch(url, {
//       ...options,
//       headers: {
//         "Content-Type": "application/json",
//         ...options.headers,
//       },
//     })

//     if (!response.ok) {
//       const error = await response.json().catch(() => ({}))
//       throw new Error(error.message || `API error: ${response.status}`)
//     }

//     return await response.json()
//   } catch (error) {
//     console.error(`Error fetching ${endpoint}:`, error)
//     throw error
//   }
// }

// // Dashboard API functions
// export async function getDashboardStats() {
//   return fetchAPI<any>("/api/dashboard/stats")
// }

// export async function getOrders(status = "all") {
//   return fetchAPI<any[]>(`/api/dashboard/orders?status=${status}`)
// }

// export async function getChartData(chartType: string) {
//   return fetchAPI<any[]>(`/api/dashboard/charts?type=${chartType}`)
// }

// // Menu API functions
// export async function getCategories() {
//   return fetchAPI<any[]>("/api/menu/categories")
// }

// export async function getSubcategories(categoryId?: number) {
//   const endpoint = categoryId ? `/api/menu/subcategories?category=${categoryId}` : "/api/menu/subcategories"
//   return fetchAPI<any[]>(endpoint)
// }

// export async function getMenuItems(subcategoryId?: number) {
//   const endpoint = subcategoryId ? `/api/menu/items?subcategory=${subcategoryId}` : "/api/menu/items"
//   return fetchAPI<any[]>(endpoint)
// }

// export async function getBranches() {
//   return fetchAPI<any[]>("/api/menu/branches")
// }

// // Management API functions
// export async function getManagers(branchId?: number) {
//   const endpoint = branchId ? `/api/management/managers?branch=${branchId}` : "/api/management/managers"
//   return fetchAPI<any[]>(endpoint)
// }

// export async function getEmployees(branchId?: number) {
//   const endpoint = branchId ? `/api/management/employees?branch=${branchId}` : "/api/management/employees"
//   return fetchAPI<any[]>(endpoint)
// }

