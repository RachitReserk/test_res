"use client"

import { CartModal } from "@/components/cart-modal"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Package,
  ArrowLeft,
  Truck,
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ProfilePopup } from "@/components/profile-popup"
import { motion } from "framer-motion"

interface Invoice {
  initial_price: string
  total: string
  payment_method: string
}

interface Order {
  id: number
  status: string
  mode: string | null
  branch: number
  created_at: string
  updated_at: string
  invoice: Invoice | null
}

export default function OrdersPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState(0)
  const home_url = process.env.NEXT_PUBLIC_WEBSITE_URL || ""

  useEffect(() => {
    const checkAuthAndFetchOrders = async () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("clientAuthToken="))
        ?.split("=")[1]
      if (!token) {
        router.push("/client/login?callbackUrl=/client/orders")
        return
      }

      setIsAuthenticated(true)

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/order/summary/`, {
          headers: { Authorization: `Token ${token}` },
        })
        const data = await res.json()
        console.log("Fetched orders:", data.orders)
        if (data?.orders) setOrders(data.orders)
      } catch (err) {
        console.error("Error fetching orders:", err)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthAndFetchOrders()
  }, [router])

  const toggleProfilePopup = () => setIsProfilePopupOpen(!isProfilePopupOpen)
  const handleOpenCart = () => setIsCartOpen(true)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "confirmed":
        return <Package2 className="h-4 w-4" />
      case "processing":
        return <Clock className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getModeIcon = (mode: string | null) => {
    if (mode === "delivery") return <Truck className="h-4 w-4" />
    if (mode === "pickup") return <MapPin className="h-4 w-4" />
    return null
  }

  const getPaymentIcon = (paymentMethod: string) => {
    return paymentMethod === "online" ? <CreditCard className="h-4 w-4" /> : <Banknote className="h-4 w-4" />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-backgroundcolor text-navbartextcolor">
      <header className="flex items-center justify-between px-6 py-6  bg-navbarcolor border-b border-navbarbordercolor  sticky top-0 z-10 shadow-sm w-full">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <Image src="/TERIYAKI-logo.png" alt="TERIYAKI Logo" width={80} height={40} className="object-contain" />
        </Link>

        <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-md">
          {/*<input
            type="text"
            placeholder="Search..."
            className="w-full rounded-full border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />*/}
        </div>

        <div className="flex items-center gap-4">
          <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

          <div className="relative">
            <div
              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300"
              onClick={toggleProfilePopup}
            >
              <User size={18} />
            </div>

            <ProfilePopup isOpen={isProfilePopupOpen} onClose={() => setIsProfilePopupOpen(false)} />
          </div>
        </div>
      </header>

      <div className="container max-w-4xl py-8 px-4  bg-backgroundcolor">
        <Link
          href="/order"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Go back</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your order history</p>
        </div>

        {orders.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-8 text-center max-w-sm">
                You haven't placed any orders. Start exploring our delicious menu!
              </p>
              <Button asChild className="bg-orange-600 hover:bg-orange-700">
                <Link href="/">Browse Menu</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  onClick={() => router.push(`/order-confirmation/${order.id}`)}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 shadow-sm hover:shadow-md bg-white"
                >
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold">Order #{order.id}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(order.created_at)}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {/* Order Mode */}
                      {order.mode && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {getModeIcon(order.mode)}
                          <span className="capitalize font-medium">{order.mode}</span>
                        </div>
                      )}

                      {/* Payment Method */}
                      {order.invoice?.payment_method && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {getPaymentIcon(order.invoice.payment_method)}
                          <span className="capitalize font-medium">
                            {order.invoice.payment_method === "online" ? "Online Payment" : "Cash Payment"}
                          </span>
                        </div>
                      )}

                    </div>

                    {order.invoice ? (
                      <>
                        <Separator className="my-4" />
                        <div className="flex flex-row-reverse items-center">
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              ${Number.parseFloat(order.invoice.total).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">Total Amount</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Separator className="my-4" />
                        <div className="flex items-center justify-center py-2">
                          <Badge variant="outline" className="text-gray-500">
                            Order Incomplete
                          </Badge>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getStatusBadge(status: string) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "delivered":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle className="h-3 w-3" />,
          label: "Delivered",
        }
      case "confirmed":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <Package2 className="h-3 w-3" />,
          label: "Confirmed",
        }
      case "processing":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <Clock className="h-3 w-3" />,
          label: "Processing",
        }
      case "pending":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: <AlertCircle className="h-3 w-3" />,
          label: "Pending",
        }
      case "cancelled":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <XCircle className="h-3 w-3" />,
          label: "Cancelled",
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <AlertCircle className="h-3 w-3" />,
          label: status.charAt(0).toUpperCase() + status.slice(1),
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge className={`${config.color} border flex items-center gap-1 font-medium px-3 py-1`}>
      {config.icon}
      {config.label}
    </Badge>
  )
}
