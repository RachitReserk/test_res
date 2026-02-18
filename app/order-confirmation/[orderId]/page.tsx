"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Clock, MapPin, Truck, ExternalLink, Download } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export default function OrderConfirmationPage() {
  const router = useRouter()
  const { orderId } = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUserData] = useState<any>(null)

useEffect(() => {
    const fetchUser = async () => {
      // Removed setLoading(true) - User data shouldn't block the main UI
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("clientAuthToken="))
        ?.split("=")[1]

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client/customer/profile`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch profile data")
        }

        const result = await response.json()
        const profileData = result.data

        setUserData({
          name:
            profileData.first_name && profileData.last_name
              ? `${profileData.first_name} ${profileData.last_name}`
              : profileData.username || "User",
          email: profileData.email || "",
          phone: profileData.phone_number || "",
        })
      } catch (error) {
        console.error("Error fetching profile data:", error)
      } 
      // Removed finally { setLoading(false) } - Let the order fetch handle the loading state
    }
    fetchUser()
  }, [])

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("clientAuthToken="))
          ?.split("=")[1]

        const headers: any = {}
        if (token) {
          headers.Authorization = `Token ${token}`
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/order/history/?order_id=${orderId}`, { headers })
        const data = await res.json()
        setOrder(data.order)
      } catch (err) {
        console.error("Error fetching order:", err)
      } finally {
        setLoading(false) // Logic moved here: Loading finishes only when the order is fetched
      }
    }

    if (orderId) fetchOrderDetails()
  }, [orderId])

  
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pending" },
      confirmed: { variant: "default" as const, label: "Confirmed" },
      preparing: { variant: "default" as const, label: "Preparing" },
      ready: { variant: "default" as const, label: "Ready" },
      delivered: { variant: "default" as const, label: "Delivered" },
      cancelled: { variant: "destructive" as const, label: "Cancelled" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: "secondary" as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getModeBadge = (mode: string) => {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        {mode === "delivery" ? <Truck className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
        {mode === "delivery" ? "Delivery" : "Pickup"}
      </Badge>
    )
  }

  const generateReceipt = async () => {
    const receipt = document.getElementById(`print-receipt-${order.id}`)
    if (!receipt) {
      console.error("Receipt container not found")
      return
    }

    receipt.style.display = "block"
    receipt.style.position = "absolute"
    receipt.style.left = "-9999px"

    const canvas = await html2canvas(receipt, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL("image/png")

    const pdfWidth = 80
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const pdfHeight = (imgHeight * pdfWidth) / imgWidth

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [pdfWidth, pdfHeight],
    })

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
    pdf.save(`Receipt-${order.id}.pdf`)

    receipt.style.display = "none"
    receipt.style.position = ""
    receipt.style.left = ""
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 font-bold">Failed to load order.</p>
        <Button onClick={() => router.push("/")}>Go to Home</Button>
      </div>
    )
  }

  const { invoice } = order;
  const subtotal = Number(invoice.initial_price || 0);
  const deliveryFee = Number(invoice.delivery_fee || 0);
  const tip = Number(invoice.tip || 0);
  const discountApplied = Number(invoice.discount_applied || 0);
  const total = Number(invoice.total || 0);

  // Calculate tax based on the total, subtotal, delivery fee, tip, and discount
  const taxAmount = Number(invoice.restaurant_tax || 0);

  return (
    <div className="w-full min-h-screen bg-backgroundcolor flex flex-col">
      <header className="flex px-6 py-6 items-center justify-between p-4 bg-navbarcolor border-b border-navbarbordercolor sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer">
          <Image src="/TERIYAKI-logo.png" alt="TERIYAKI Logo" width={80} height={40} className="object-contain" />
        </div>
      </header>

      <div className="w-full max-w-4xl mx-auto px-4 py-6">
        <Link href="/client/orders" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft size={20} />
          <span>Go back</span>
        </Link>

        <div className="space-y-6">
          {/* Order Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl text-navbartextcolor">Order #{order.id}</CardTitle>
                  <p className="text-gray-600 mt-1">
                    Placed on {new Date(order.created_at).toLocaleDateString()} at{" "}
                    {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  {getStatusBadge(order.status)}
                  {getModeBadge(order.mode)}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Order Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Order Mode</p>
                  <p className="font-medium capitalize">{order.mode}</p>
                </div>

                {order.pickup_time && (
                  <div>
                    <p className="text-sm text-gray-600">Pickup Time</p>
                    <p className="font-medium">
                      {new Date(order.pickup_time).toLocaleDateString()} at{" "}
                      {new Date(order.pickup_time).toLocaleTimeString()}
                    </p>
                  </div>
                )}

                {order.restaurant_instructions && (
                  <div>
                    <p className="text-sm text-gray-600">Restaurant Instructions</p>
                    <p className="font-medium">{order.restaurant_instructions}</p>
                  </div>
                )}

                {order.delivery_instructions && (
                  <div>
                    <p className="text-sm text-gray-600">Delivery Instructions</p>
                    <p className="font-medium">{order.delivery_instructions}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium capitalize">{order.invoice.payment_method}</p>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            {order.mode === "delivery" && order.delivery && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Delivery ID</p>
                    <p className="font-medium">{order.delivery.external_delivery_id}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Delivery Status</p>
                    <Badge variant="outline" className="capitalize">
                      {order.delivery.delivery_status}
                    </Badge>
                  </div>

                  {order.delivery.tracking_url && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Track Your Order</p>
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={order.delivery.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Track Order
                        </a>
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Delivery Fee</p>
                      <p className="font-medium">${deliveryFee.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tip</p>
                      <p className="font-medium">${tip.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0 text-sm">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">
                        {item.quantity}x {item.item}
                      </span>
                      <span className="font-medium">
                        {item.price === 0 ? "Free" : `$${Number(item.price).toFixed(2)}`}
                      </span>
                    </div>
                    {item.variation && (
                      <p className="text-muted-foreground pl-2">
                        • {item.variation.name} (+${Number(item.variation.price_adjustment).toFixed(2)})
                      </p>
                    )}
                    <p className="text-muted-foreground pl-2">  • Base price (+${(Number(item.base_price)).toFixed(2)})</p>
                    {item.options?.map((opt: any, optIndex: number) => {
                      const qty = opt.quantity || 1;
                      return (
                        <p key={optIndex} className="text-muted-foreground pl-2">
                          • {qty > 1 ? `${qty}x ` : ""}{opt.name} (+${(Number(opt.price_adjustment) * qty).toFixed(2)})
                        </p>
                      )
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Order Summary</CardTitle>
                <Button onClick={generateReceipt} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoice.applied_offer && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Offer Applied</span>
                    <span>{invoice.applied_offer.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                {discountApplied > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${discountApplied.toFixed(2)}</span>
                  </div>
                )}

                {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                )}

                {deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                )}

                {tip > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tip</span>
                    <span>${tip.toFixed(2)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden Receipt for PDF Generation */}
      <div
        id={`print-receipt-${order.id}`}
        style={{
          display: "none",
          fontFamily: "monospace",
          width: "300px",
          padding: "10px",
          fontSize: "11px",
        }}
      >
        <div style={{ textAlign: "center", fontWeight: "bold", marginBottom: "10px" }}>
          Acai Island RECEIPT
        </div>
        <address style={{ textAlign: "center", fontStyle: "normal", lineHeight: 1.6 }}>
          173-10 Jamaica Ave,
          <br />
         Jamaica, NY 11432
        </address>

        {/* Customer Info Section */}
        <div style={{ textAlign: "center", fontSize: "11px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "5px" }}>Customer Information:</div>
          <div style={{ textAlign: "center" }}>Name: {user?.name}</div>
          <div style={{ textAlign: "center" }}>Phone: {user?.phone}</div>
        </div>

        <div style={{ textAlign: "center" }}>Order ID: {order.id}</div>
        <div style={{ textAlign: "center" }}>Mode: {order.mode}</div>
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          Date: {new Date(order.created_at).toLocaleString()}
        </div>

        {order.pickup_time && (
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            Pickup: {new Date(order.pickup_time).toLocaleString()}
          </div>
        )}

        <hr style={{ border: "none", borderTop: "2px dotted #000", margin: "20px 0" }} />

        {order.restaurant_instructions && (
          <>
            <div>
              <strong>Restaurant Instructions:</strong>
            </div>
            <div style={{ marginBottom: "10px" }}>{order.restaurant_instructions}</div>
            <hr style={{ border: "none", borderTop: "2px dotted #000", margin: "20px 0" }} />
          </>
        )}

        {order.delivery_instructions && (
          <>
            <div>
              <strong>Delivery Instructions:</strong>
            </div>
            <div style={{ marginBottom: "10px" }}>{order.delivery_instructions}</div>
            <hr style={{ border: "none", borderTop: "2px dotted #000", margin: "20px 0" }} />
          </>
        )}

        <div>
          <strong>Items:</strong>
        </div>
        {order.items.map((item: any, index: number) => (
          <div key={index} style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{item.quantity}x {item.item}</span>
              <span>{item.price === 0 ? "Free" : `$${Number(item.price).toFixed(2)}`}</span>
            </div>
            {item.variation && <div style={{ fontSize: "10px", color: "#666", marginLeft: "10px" }}>• {item.variation.name} (+${Number(item.variation.price_adjustment).toFixed(2)})</div>}
            {item.options?.map((opt: any, i: number) => {
              const qty = opt.quantity || 1;
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginLeft: "10px" }}>
                  <span>• {qty > 1 ? `${qty}x ` : ""}{opt.name}</span>
                  <span>+${(Number(opt.price_adjustment) * qty).toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        ))}

        <hr style={{ border: "none", borderTop: "2px dotted #000", margin: "20px 0" }} />
        <div>
          <strong>Summary:</strong>
        </div>
        {invoice.applied_offer && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Offer Applied ({invoice.applied_offer.name}):</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discountApplied > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Discount:</span>
            <span>-${discountApplied.toFixed(2)}</span>
          </div>
        )}
        {taxAmount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Taxes:</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        )}
        {deliveryFee > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Delivery Fee:</span>
            <span>${deliveryFee.toFixed(2)}</span>
          </div>
        )}
        {tip > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Tip:</span>
            <span>${tip.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginTop: "5px" }}>
          <span>TOTAL:</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <hr style={{ border: "none", borderTop: "2px dotted #000", margin: "20px 0" }} />
        <div>Payment: {order.invoice.payment_method}</div>

        <div style={{ textAlign: "center", marginTop: "15px", fontWeight: "bold" }}>THANK YOU FOR ORDERING!</div>
        <div style={{ textAlign: "center" }}>Visit Again</div>
      </div>
    </div>
  )
}