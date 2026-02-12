"use client"

import type React from "react"
import { memo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  ArrowUpRight,
  Coffee,
  DollarSign,
  Layers,
  LayoutGrid,
  Package,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"

// Import the chart components
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Define branch type
interface Branch {
  id: number
  name: string
  address: string
  phone_number: string
  email: string
  opening_time: string
  closing_time: string
  restaurant_name: string
  manager_email: string
}

// Reusable stat card component - made responsive
const StatCard = memo(
  ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    isLoading = false,
    className,
    variant = "default",
    useWhiteBackground = false,
  }: {
    title: string
    value: string | number
    subtitle: string
    icon: React.ElementType
    trend?: "up" | "down" | "neutral"
    trendValue?: string
    isLoading?: boolean
    className?: string
    variant?: "default" | "primary" | "secondary" | "success" | "warning"
    useWhiteBackground?: boolean
  }) => {
    const variantStyles = {
      default: "bg-card",
      primary: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20",
      secondary: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/20",
      success: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/20",
      warning: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20",
    }

    // Use orange color for all icons regardless of variant
    const iconStyles = {
      default: "text-orange-500 dark:text-orange-400",
      primary: "text-orange-500 dark:text-orange-400",
      secondary: "text-orange-500 dark:text-orange-400",
      success: "text-orange-500 dark:text-orange-400",
      warning: "text-orange-500 dark:text-orange-400",
    }

    return (
      <Card
        className={cn(
          "overflow-hidden border shadow-sm",
          useWhiteBackground ? "bg-white dark:bg-gray-950" : variantStyles[variant],
          className,
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
          <div className={cn("rounded-full p-1.5 bg-background/80", iconStyles[variant])}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">
            {isLoading ? <div className="h-6 sm:h-7 w-14 sm:w-16 animate-pulse rounded bg-muted"></div> : value}
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
            {trend && trendValue && (
              <div
                className={cn(
                  "flex items-center text-xs font-medium",
                  trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground",
                )}
              >
                {trend === "up" ? <ArrowUpRight className="mr-1 h-3 w-3" /> : null}
                {trendValue}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  },
)
StatCard.displayName = "StatCard"

// Reusable action item component - made responsive
const ActionItem = memo(
  ({
    icon: Icon,
    title,
    subtitle,
    onClick,
  }: {
    icon: React.ElementType
    title: string
    subtitle: string
    onClick?: () => void
  }) => (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        aria-label={`Go to ${title}`}
        className="ml-2 flex-shrink-0 h-8 w-8 rounded-full"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  ),
)
ActionItem.displayName = "ActionItem"

// Reusable feature card component - made responsive
const FeatureCard = memo(
  ({
    title,
    icon: Icon,
    children,
    className,
  }: {
    title: string
    icon: React.ElementType
    children: React.ReactNode
    className?: string
  }) => (
    <Card className={cn("h-full border shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm sm:text-base">{title}</CardTitle>
          <CardDescription className="text-xs hidden sm:block">Manage your {title.toLowerCase()}</CardDescription>
        </div>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">{children}</CardContent>
    </Card>
  ),
)
FeatureCard.displayName = "FeatureCard"

// Quick action button component - made responsive
const QuickActionButton = memo(
  ({
    children,
    onClick,
    icon: Icon,
  }: {
    children: React.ReactNode
    onClick?: () => void
    icon?: React.ElementType
  }) => (
    <Button className="w-full text-xs sm:text-sm h-10 justify-start font-medium" variant="outline" onClick={onClick}>
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </Button>
  ),
)
QuickActionButton.displayName = "QuickActionButton"

// Add this new component for chart cards
const ChartCard = memo(
  ({
    title,
    subtitle,
    children,
    className,
    action,
  }: {
    title: string
    subtitle?: string
    children: React.ReactNode
    className?: string
    action?: React.ReactNode
  }) => (
    <Card className={cn("overflow-hidden border shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm sm:text-base">{title}</CardTitle>
          {subtitle && <CardDescription className="text-xs mt-1">{subtitle}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="p-0 pt-4">{children}</CardContent>
    </Card>
  ),
)
ChartCard.displayName = "ChartCard"

// Helper function to get cookie value
const getCookieValue = (name: string) => {
  const cookies = document.cookie.split("; ")
  const cookie = cookies.find((c) => c.startsWith(`${name}=`))
  return cookie ? cookie.split("=")[1] : null
}

// Helper function to make authenticated API requests
const fetchWithAuth = async (url: string) => {
  const token = getCookieValue("authToken")

  if (!token) {
    throw new Error("Authentication token not found")
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  return await response.json()
}

// Main dashboard content component
export function DashboardContent() {
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [managers, setManagers] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [salesData, setSalesData] = useState<any>({
    daily: [],
    weekly: [],
    monthly: [],
  })
  const [salesChartData, setSalesChartData] = useState<any[]>([])

  const router = useRouter()

  const [isLoadingMenu, setIsLoadingMenu] = useState(true)
  const [isLoadingBranches, setIsLoadingBranches] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(true)
  const [isLoadingManagers, setIsLoadingManagers] = useState(true)
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)

  const [error, setError] = useState<string | null>(null)
  const [newItemsCount, setNewItemsCount] = useState(0)
  const [newBranchesCount, setNewBranchesCount] = useState(0)

  // Base API URL
  const baseApiUrl = process.env.NEXT_PUBLIC_API_URL

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setIsLoadingMenu(true)

        const responseData = await fetchWithAuth(`${baseApiUrl}/menu/items/`)

        // Check if the response has the expected structure
        if (responseData && responseData.data && Array.isArray(responseData.data)) {
          setMenuItems(responseData.data)

          // Calculate new items added this month
          const currentDate = new Date()
          const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

          const newItems = responseData.data.filter((item: any) => {
            // Check if createdAt exists before trying to create a date
            if (!item.createdAt) return false

            const itemDate = new Date(item.createdAt)
            return itemDate >= firstDayOfMonth
          })

          setNewItemsCount(newItems.length)
        } else {
          console.warn("Unexpected menu API response structure:", responseData)
          setMenuItems(Array.isArray(responseData) ? responseData : [])
          setNewItemsCount(0)
        }

        setError(null)
      } catch (err: any) {
        console.error("Error fetching menu items:", err)
        setError(err.message || "Failed to fetch menu items")
      } finally {
        setIsLoadingMenu(false)
      }
    }

    fetchMenuItems()
  }, [baseApiUrl])

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setIsLoadingBranches(true)

        const responseData = await fetchWithAuth(`${baseApiUrl}/client/owner/list/branch/`)

        // Check if the response has the expected structure
        if (responseData && responseData.data && Array.isArray(responseData.data)) {
          setBranches(responseData.data)

          // Generate dummy sales data based on real branch names
          generateSalesData(responseData.data)

          // Calculate new branches added this quarter
          const currentDate = new Date()
          const firstDayOfQuarter = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1)

          const newBranches = responseData.data.filter((branch: any) => {
            // Check if createdAt exists before trying to create a date
            if (!branch.createdAt) return false

            const branchDate = new Date(branch.createdAt)
            return branchDate >= firstDayOfQuarter
          })

          setNewBranchesCount(newBranches.length)
        } else {
          console.warn("Unexpected branch API response structure:", responseData)
          setBranches(Array.isArray(responseData) ? responseData : [])
          setNewBranchesCount(0)
        }
      } catch (err) {
        console.error("Error fetching branches:", err)
        // Don't set the main error state to avoid overriding menu errors
      } finally {
        setIsLoadingBranches(false)
      }
    }

    fetchBranches()
  }, [baseApiUrl])

  // Generate sales data based on real branch names
  const generateSalesData = (branchData: Branch[]) => {
    if (!branchData || branchData.length === 0) return

    // Generate random sales data for each branch
    const generateRandomSales = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
    const generateRandomItems = (sales: number) => Math.floor(sales / (Math.random() * 5 + 10))

    const dailyData = branchData.map((branch) => {
      const sales = generateRandomSales(1500, 3500)
      const items = generateRandomItems(sales)
      const profit = Math.floor(sales * 0.4)
      return { branch: branch.name, sales, items, profit }
    })

    const weeklyData = branchData.map((branch) => {
      const sales = generateRandomSales(10000, 20000)
      const items = generateRandomItems(sales)
      const profit = Math.floor(sales * 0.4)
      return { branch: branch.name, sales, items, profit }
    })

    const monthlyData = branchData.map((branch) => {
      const sales = generateRandomSales(40000, 70000)
      const items = generateRandomItems(sales)
      const profit = Math.floor(sales * 0.4)
      return { branch: branch.name, sales, items, profit }
    })

    setSalesData({
      daily: dailyData,
      weekly: weeklyData,
      monthly: monthlyData,
    })

    // Generate sales chart data
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const chartData = days.map((day) => {
      const dataPoint: any = { name: day }
      let total = 0

      branchData.forEach((branch) => {
        const sales = generateRandomSales(1500, 3500)
        dataPoint[branch.name] = sales
        total += sales
      })

      dataPoint.total = total
      return dataPoint
    })

    setSalesChartData(chartData)
  }

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true)

        const responseData = await fetchWithAuth(`${baseApiUrl}/menu/categories/`)

        // Check if the response has the expected structure
        if (responseData && responseData.data && Array.isArray(responseData.data)) {
          setCategories(responseData.data)
        } else {
          console.warn("Unexpected categories API response structure:", responseData)
          setCategories(Array.isArray(responseData) ? responseData : [])
        }
      } catch (err) {
        console.error("Error fetching categories:", err)
        // Don't set the main error state to avoid overriding other errors
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [baseApiUrl])

  // Fetch subcategories
  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        setIsLoadingSubcategories(true)

        const responseData = await fetchWithAuth(`${baseApiUrl}/menu/subcategories/`)

        // Check if the response has the expected structure
        if (responseData && responseData.data && Array.isArray(responseData.data)) {
          setSubcategories(responseData.data)
        } else {
          console.warn("Unexpected subcategories API response structure:", responseData)
          setSubcategories(Array.isArray(responseData) ? responseData : [])
        }
      } catch (err) {
        console.error("Error fetching subcategories:", err)
        // Don't set the main error state to avoid overriding other errors
      } finally {
        setIsLoadingSubcategories(false)
      }
    }

    fetchSubcategories()
  }, [baseApiUrl])

  // Fetch managers
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setIsLoadingManagers(true)

        const responseData = await fetchWithAuth(`${baseApiUrl}/client/owner/list/manager`)

        // Check if the response has the expected structure
        if (responseData && responseData.data && Array.isArray(responseData.data)) {
          setManagers(responseData.data)
        } else {
          console.warn("Unexpected managers API response structure:", responseData)
          setManagers(Array.isArray(responseData) ? responseData : [])
        }
      } catch (err) {
        console.error("Error fetching managers:", err)
        // Don't set the main error state to avoid overriding other errors
      } finally {
        setIsLoadingManagers(false)
      }
    }

    fetchManagers()
  }, [baseApiUrl])

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoadingEmployees(true)

        const responseData = await fetchWithAuth(`${baseApiUrl}/client/list/employee/`)

        // Check if the response has the expected structure
        if (responseData && responseData.data && Array.isArray(responseData.data)) {
          setEmployees(responseData.data)
        } else {
          console.warn("Unexpected employees API response structure:", responseData)
          setEmployees(Array.isArray(responseData) ? responseData : [])
        }
      } catch (err) {
        console.error("Error fetching employees:", err)
        // Don't set the main error state to avoid overriding other errors
      } finally {
        setIsLoadingEmployees(false)
      }
    }

    fetchEmployees()
  }, [baseApiUrl])

  // Stats with dynamic data
  const stats = [
    {
      title: "Menu Items",
      value: isLoadingMenu ? "..." : menuItems.length,
      subtitle: `+${newItemsCount} new items this month`,
      icon: Coffee,
      isLoading: isLoadingMenu,
    },
    {
      title: "Active Branches",
      value: isLoadingBranches ? "..." : branches.length,
      subtitle: `+${newBranchesCount} new branch${newBranchesCount !== 1 ? "es" : ""} this quarter`,
      icon: Store,
      isLoading: isLoadingBranches,
    },
    {
      title: "Total Staff",
      value: isLoadingManagers || isLoadingEmployees ? "..." : managers.length + employees.length,
      subtitle: `${managers.length} managers, ${employees.length} employees`,
      icon: Users,
      isLoading: isLoadingManagers || isLoadingEmployees,
    },
  ]

  // Dummy data for top selling menu items
  const dummyTopSellingItems = [
    { name: "Cheeseburger", quantity: 245, revenue: 1225, profit: 490 },
    { name: "Chicken Wings", quantity: 210, revenue: 1470, profit: 588 },
    { name: "Pizza Margherita", quantity: 180, revenue: 1620, profit: 648 },
    { name: "French Fries", quantity: 320, revenue: 960, profit: 384 },
    { name: "Iced Coffee", quantity: 290, revenue: 870, profit: 348 },
  ]

  // Add this new dummy data for the pie chart
  const dummyCategoryData = [
    { name: "Burgers", value: 35 },
    { name: "Sides", value: 25 },
    { name: "Beverages", value: 20 },
    { name: "Desserts", value: 15 },
    { name: "Other", value: 5 },
  ]

  // Add this array of colors for the pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

  const menuActions = [
    {
      title: "Categories",
      subtitle: isLoadingCategories ? "Loading..." : `${categories.length} categories`,
      icon: LayoutGrid,
      onClick: () => router.push("/menu/categories"),
    },
    {
      title: "Subcategories",
      subtitle: isLoadingSubcategories ? "Loading..." : `${subcategories.length} subcategories`,
      icon: Layers,
      onClick: () => router.push("/menu/subcategories"),
    },
    {
      title: "Menu Items",
      subtitle: isLoadingMenu ? "Loading..." : `${menuItems.length} items`,
      icon: Coffee,
      onClick: () => router.push("/menu/items"),
    },
  ]

  const branchActions = [
    {
      title: "Branches",
      subtitle: isLoadingBranches ? "Loading..." : `${branches.length} active branches`,
      icon: Store,
      onClick: () => router.push("/menu/branches"),
    },
    {
      title: "Managers",
      subtitle: isLoadingManagers ? "Loading..." : `${managers.length} managers`,
      icon: Users,
      onClick: () => router.push("/management/managers"),
    },
    {
      title: "Employees",
      subtitle: isLoadingEmployees ? "Loading..." : `${employees.length} employees`,
      icon: Users,
      onClick: () => router.push("/management/employees"),
    },
  ]

  const quickActions = [
    { title: "Add New Menu Item", onClick: () => router.push("/menu/items") },
    { title: "Add New Category", onClick: () => router.push("/menu/categories") },
    { title: "Add New Employee", onClick: () => router.push("/management/employees") },
  ]

  const [salesPeriod, setSalesPeriod] = useState("daily")
  const [selectedBranch, setSelectedBranch] = useState("all")

  // Filter sales data based on selected branch
  const filteredSalesData =
    selectedBranch === "all"
      ? salesData[salesPeriod]
      : salesData[salesPeriod]?.filter((item: any) => item.branch === selectedBranch) || []

  // Calculate totals for filtered data
  const totalSales = filteredSalesData.reduce((sum: number, branch: any) => sum + branch.sales, 0)
  const totalItems = filteredSalesData.reduce((sum: number, branch: any) => sum + branch.items, 0)
  const totalProfit = filteredSalesData.reduce((sum: number, branch: any) => sum + branch.profit, 0)
  const avgOrderValue = totalItems > 0 ? Math.round((totalSales / totalItems) * 10) : 0

  // Add this to the return statement, after the existing grid of feature cards
  return (
    <div className="flex-1 space-y-6 p-3 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6 bg-background/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 mb-2">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      {/* Error message if API request fails - made responsive */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="flex flex-col sm:flex-row">
            <div className="flex-shrink-0 mb-2 sm:mb-0 sm:mr-3">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-destructive">Error</h3>
              <div className="mt-1 text-xs sm:text-sm text-destructive/90">
                <p>{error}</p>
              </div>
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="h-8 text-xs">
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Original Stats Grid - Menu Items, Branches, Staff */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <StatCard
            key={`stat-${index}`}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            isLoading={stat.isLoading}
            variant={index === 0 ? "primary" : index === 1 ? "secondary" : "success"}
            useWhiteBackground={true}
          />
        ))}
      </div>

      {/* Stats Grid - made responsive and more modern */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sales"
          value={`$${totalSales.toLocaleString()}`}
          subtitle={`${salesPeriod} ${selectedBranch === "all" ? "across all branches" : `for ${selectedBranch}`}`}
          icon={DollarSign}
          trend="up"
          trendValue="+12.5%"
          variant="primary"
          useWhiteBackground={true}
        />
        <StatCard
          title="Items Sold"
          value={totalItems.toLocaleString()}
          subtitle={`${salesPeriod} ${selectedBranch === "all" ? "across all branches" : `for ${selectedBranch}`}`}
          icon={ShoppingBag}
          trend="up"
          trendValue="+8.2%"
          variant="secondary"
          useWhiteBackground={true}
        />
        <StatCard
          title="Gross Profit"
          value={`$${totalProfit.toLocaleString()}`}
          subtitle={`${salesPeriod} ${selectedBranch === "all" ? "across all branches" : `for ${selectedBranch}`}`}
          icon={TrendingUp}
          trend="up"
          trendValue="+10.3%"
          variant="success"
          useWhiteBackground={true}
        />
        <StatCard
          title="Avg. Order Value"
          value={`$${avgOrderValue.toLocaleString()}`}
          subtitle={`${salesPeriod} average`}
          icon={Package}
          trend="up"
          trendValue="+4.1%"
          variant="warning"
          useWhiteBackground={true}
        />
      </div>

      {/* Sales Period and Branch Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
        <h3 className="text-lg font-semibold">Sales Overview</h3>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-full sm:w-[180px] h-9">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.name}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={salesPeriod} onValueChange={setSalesPeriod}>
            <SelectTrigger className="w-full sm:w-[140px] h-9">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sales Trend and Branch Breakdown */}
      {/* Sales Trend Chart */}
      <ChartCard title="Sales Trend" subtitle="Daily sales performance by branch">
        <div className="h-[300px] w-full px-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value}`} />
              <Tooltip
                formatter={(value) => [`$${value.toLocaleString()}`, "Sales"]}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "6px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  border: "1px solid #e5e7eb",
                }}
              />
              <Legend />
              {branches.map((branch, index) => (
                <Line
                  key={branch.id}
                  type="monotone"
                  dataKey={branch.name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Management Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Menu Management Card */}
        <FeatureCard title="Menu Management" icon={Coffee}>
          <div className="space-y-1">
            {menuActions.map((action, index) => (
              <ActionItem
                key={`menu-action-${index}`}
                icon={action.icon}
                title={action.title}
                subtitle={action.subtitle}
                onClick={action.onClick}
              />
            ))}
          </div>
        </FeatureCard>

        {/* Branch Management Card */}
        <FeatureCard title="Branch Management" icon={Store}>
          <div className="space-y-1">
            {branchActions.map((action, index) => (
              <ActionItem
                key={`branch-action-${index}`}
                icon={action.icon}
                title={action.title}
                subtitle={action.subtitle}
                onClick={action.onClick}
              />
            ))}
          </div>
        </FeatureCard>

        {/* Quick Actions Card */}
        <FeatureCard title="Quick Actions" icon={TrendingUp}>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <QuickActionButton
                key={`quick-action-${index}`}
                onClick={action.onClick}
                icon={index === 0 ? Coffee : index === 1 ? LayoutGrid : Users}
              >
                {action.title}
              </QuickActionButton>
            ))}
          </div>
        </FeatureCard>
      </div>
    </div>
  )
}
