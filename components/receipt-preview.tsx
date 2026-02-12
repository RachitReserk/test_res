"use client"

import { Card } from "@/components/ui/card"

interface OrderItem {
  menu_item: {
    id: number
    name: string
  }
  quantity: number
  price: string
}

interface Invoice {
  initial_price: string
  restaurant_tax: string
  delivery_fee: string
  delivery_tax: string
  tip: string
  total: string
  payment_method: string
}

interface Order {
  id: number
  status: string
  mode: string
  restaurant: number
  branch: number
  items: OrderItem[]
  invoice: Invoice
}

interface ReceiptPreviewProps {
  order: Order
}

export function ReceiptPreview({ order }: ReceiptPreviewProps) {
  return (
    <Card className="p-6 bg-white text-black font-mono text-sm max-w-md mx-auto">
      <div className="space-y-4">
        <div className="text-center">
          <p className="font-bold text-lg">ORDER #{order.id}</p>
          <p>{new Date().toLocaleString()}</p>
          <p>Status: {order.status.toUpperCase()}</p>
          <p>Mode: {order.mode.toUpperCase()}</p>
        </div>

        <div className="border-t border-b border-dashed border-gray-300 py-4 space-y-2">
          <p className="font-bold">ITEMS</p>
          <div className="w-full border-b border-gray-300">
            {[...Array(32)].map((_, i) => (
              <span key={i}>-</span>
            ))}
          </div>

          {order.items.length > 0 ? (
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index}>
                  <p>
                    {item.quantity}x {item.menu_item.name}
                  </p>
                  <p className="pl-4">${Number.parseFloat(item.price).toFixed(2)} each</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="italic">No items</p>
          )}

          <div className="w-full border-b border-gray-300">
            {[...Array(32)].map((_, i) => (
              <span key={i}>-</span>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-bold">PAYMENT DETAILS</p>
          <div className="flex justify-between">
            <p>Subtotal:</p>
            <p>${Number.parseFloat(order.invoice.initial_price).toFixed(2)}</p>
          </div>
          <div className="flex justify-between">
            <p>Tax:</p>
            <p>${Number.parseFloat(order.invoice.restaurant_tax).toFixed(2)}</p>
          </div>
          <div className="flex justify-between">
            <p>Delivery Fee:</p>
            <p>${Number.parseFloat(order.invoice.delivery_fee).toFixed(2)}</p>
          </div>
          <div className="flex justify-between">
            <p>Delivery Tax:</p>
            <p>${Number.parseFloat(order.invoice.delivery_tax).toFixed(2)}</p>
          </div>
          <div className="flex justify-between">
            <p>Tip:</p>
            <p>${Number.parseFloat(order.invoice.tip).toFixed(2)}</p>
          </div>

          <div className="w-full border-b border-gray-300">
            {[...Array(32)].map((_, i) => (
              <span key={i}>-</span>
            ))}
          </div>

          <div className="flex justify-between font-bold">
            <p>TOTAL:</p>
            <p>${Number.parseFloat(order.invoice.total).toFixed(2)}</p>
          </div>
          <div className="flex justify-between">
            <p>Payment Method:</p>
            <p>{order.invoice.payment_method.toUpperCase()}</p>
          </div>
        </div>

        <div className="text-center pt-4">
          <p>Thank you for your order!</p>
        </div>
      </div>
    </Card>
  )
}
