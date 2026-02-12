"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Printer, Plus, Trash2, Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { PrinterSettings } from "@/components/printer-settings"
import { ReceiptPreview } from "@/components/receipt-preview"
import Script from "next/script"

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

export function ReceiptPrinter() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("order")
  const [order, setOrder] = useState<Order>({
    id: 1,
    status: "confirmed",
    mode: "pickup",
    restaurant: 1,
    branch: 1,
    items: [],
    invoice: {
      initial_price: "0.00",
      restaurant_tax: "0.00",
      delivery_fee: "0.00",
      delivery_tax: "0.00",
      tip: "0.00",
      total: "0.00",
      payment_method: "online",
    },
  })

  const [newItem, setNewItem] = useState({
    id: 1,
    name: "",
    quantity: 1,
    price: "0.00",
  })

  const addItem = () => {
    if (!newItem.name) {
      toast({
        title: "Error",
        description: "Please enter an item name",
        variant: "destructive",
      })
      return
    }

    const updatedItems = [
      ...order.items,
      {
        menu_item: {
          id: newItem.id,
          name: newItem.name,
        },
        quantity: newItem.quantity,
        price: newItem.price,
      },
    ]

    const initialPrice = updatedItems.reduce((sum, item) => sum + Number.parseFloat(item.price) * item.quantity, 0).toFixed(3)

    setOrder({
      ...order,
      items: updatedItems,
      invoice: {
        ...order.invoice,
        initial_price: initialPrice,
        total: (
          Number.parseFloat(initialPrice) +
          Number.parseFloat(order.invoice.restaurant_tax) +
          Number.parseFloat(order.invoice.delivery_fee) +
          Number.parseFloat(order.invoice.delivery_tax) +
          Number.parseFloat(order.invoice.tip)
        ).toFixed(3),
      },
    })

    setNewItem({
      id: newItem.id + 1,
      name: "",
      quantity: 1,
      price: "0.00",
    })
  }

  const removeItem = (index: number) => {
    const updatedItems = [...order.items]
    updatedItems.splice(index, 1)

    const initialPrice = updatedItems.reduce((sum, item) => sum + Number.parseFloat(item.price) * item.quantity, 0).toFixed(3)

    setOrder({
      ...order,
      items: updatedItems,
      invoice: {
        ...order.invoice,
        initial_price: initialPrice,
        total: (
          Number.parseFloat(initialPrice) +
          Number.parseFloat(order.invoice.restaurant_tax) +
          Number.parseFloat(order.invoice.delivery_fee) +
          Number.parseFloat(order.invoice.delivery_tax) +
          Number.parseFloat(order.invoice.tip)
        ).toFixed(3),
      },
    })
  }

  const updateInvoice = (field: keyof Invoice, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    const updatedInvoice = {
      ...order.invoice,
      [field]: numValue.toFixed(3),
    }

    const total = (
      Number.parseFloat(updatedInvoice.initial_price) +
      Number.parseFloat(updatedInvoice.restaurant_tax) +
      Number.parseFloat(updatedInvoice.delivery_fee) +
      Number.parseFloat(updatedInvoice.delivery_tax) +
      Number.parseFloat(updatedInvoice.tip)
    ).toFixed(3)

    setOrder({
      ...order,
      invoice: {
        ...updatedInvoice,
        total,
      },
    })
  }

  const printReceipt = async () => {
    if (order.items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to print",
        variant: "destructive",
      })
      return
    }

    const printerUrl = localStorage.getItem("printerUrl") || ""
    if (!printerUrl) {
      toast({
        title: "Error",
        description: "Please configure printer settings first",
        variant: "destructive",
      })
      setActiveTab("settings")
      return
    }

    toast({
      title: "Connecting to printer...",
      description: "Attempting to connect to " + printerUrl,
    })

    try {
      // @ts-ignore
      const builder = new (window as any).StarWebPrintBuilder()

      let commands = ""
      commands += builder.createInitializationElement({ reset: true })
      commands += builder.createAlignmentElement({ position: "center" })
      commands += builder.createTextElement({ data: `ORDER #${order.id}\n`, emphasis: true })
      commands += builder.createTextElement({ data: new Date().toLocaleString() + "\n" })
      commands += builder.createTextElement({ data: `Status: ${order.status.toUpperCase()}\n` })
      commands += builder.createTextElement({ data: `Mode: ${order.mode.toUpperCase()}\n` })
      commands += builder.createTextElement({ data: "\nITEMS\n", emphasis: true })
      commands += builder.createTextElement({ data: "--------------------------------\n" })

      order.items.forEach((item) => {
        commands += builder.createTextElement({ data: `${item.quantity}x ${item.menu_item.name}\n` })
        commands += builder.createTextElement({ data: `  $${Number.parseFloat(item.price).toFixed(2)} each\n` })
      })

      commands += builder.createTextElement({ data: "--------------------------------\n" })
      commands += builder.createTextElement({ data: "PAYMENT DETAILS\n", emphasis: true })
      commands += builder.createTextElement({ data: `Subtotal: $${order.invoice.initial_price}\n` })
      commands += builder.createTextElement({ data: `Tax: $${order.invoice.restaurant_tax}\n` })
      commands += builder.createTextElement({ data: `Delivery Fee: $${order.invoice.delivery_fee}\n` })
      commands += builder.createTextElement({ data: `Delivery Tax: $${order.invoice.delivery_tax}\n` })
      commands += builder.createTextElement({ data: `Tip: $${order.invoice.tip}\n` })
      commands += builder.createTextElement({ data: "--------------------------------\n" })
      commands += builder.createTextElement({ data: `TOTAL: $${order.invoice.total}\n`, emphasis: true })
      commands += builder.createTextElement({ data: `Payment Method: ${order.invoice.payment_method.toUpperCase()}\n` })
      commands += builder.createTextElement({ data: "\nThank you for your order!\n", alignment: "center" })
      commands += builder.createCutPaperElement({ feed: true, type: "partial" })

      // @ts-ignore
      const trader = new (window as any).StarWebPrintTrader({ url: printerUrl })

      trader.sendMessage(
        commands,
        (response: any) => {
          if (response.traderSuccess) {
            toast({
              title: "Success",
              description: "Receipt printed successfully!",
            })
          } else {
            toast({
              title: "Error",
              description: "Failed to print: " + response.traderCode,
              variant: "destructive",
            })
          }
        },
        (error: any) => {
          toast({
            title: "Error",
            description: "Failed to connect to printer: " + error,
            variant: "destructive",
          })
        }
      )
    } catch (error) {
      toast({
        title: "Error",
        description: "Please configure your printer first.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
        <Script
        src="/star/StarWebPrintBuilder.js"
      />
        <Script
        src="/star/StarWebPrintTrader.js"
      />
      <CardHeader>
        <CardTitle>Receipt Printer</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="order">Order Details</TabsTrigger>
            <TabsTrigger value="preview">Receipt Preview</TabsTrigger>
            <TabsTrigger value="settings">Printer Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="order" className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order-id">Order ID</Label>
                <Input
                  id="order-id"
                  type="number"
                  value={order.id}
                  onChange={(e) => setOrder({ ...order, id: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-status">Status</Label>
                <Select value={order.status} onValueChange={(value) => setOrder({ ...order, status: value })}>
                  <SelectTrigger id="order-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-mode">Mode</Label>
                <Select value={order.mode} onValueChange={(value) => setOrder({ ...order, mode: value })}>
                  <SelectTrigger id="order-mode">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="dine-in">Dine-in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select
                  value={order.invoice.payment_method}
                  onValueChange={(value) =>
                    setOrder({
                      ...order,
                      invoice: { ...order.invoice, payment_method: value },
                    })
                  }
                >
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Items</h3>

              {order.items.length > 0 ? (
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <p className="font-medium">{item.menu_item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x ${Number.parseFloat(item.price).toFixed(2)}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No items added yet</p>
              )}

              {/* Add new item */}
              <div className="border rounded-md p-4 space-y-4">
                <h4 className="font-medium">Add New Item</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="item-name">Item Name</Label>
                    <Input
                      id="item-name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-quantity">Quantity</Label>
                    <Input
                      id="item-quantity"
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: Number.parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-price">Price</Label>
                    <Input
                      id="item-price"
                      type="number"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-2" /> Add Item
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Invoice</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initial-price">Initial Price</Label>
                  <Input id="initial-price" type="number" step="0.01" value={order.invoice.initial_price} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurant-tax">Restaurant Tax</Label>
                  <Input
                    id="restaurant-tax"
                    type="number"
                    step="0.01"
                    value={order.invoice.restaurant_tax}
                    onChange={(e) => updateInvoice("restaurant_tax", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-fee">Delivery Fee</Label>
                  <Input
                    id="delivery-fee"
                    type="number"
                    step="0.01"
                    value={order.invoice.delivery_fee}
                    onChange={(e) => updateInvoice("delivery_fee", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-tax">Delivery Tax</Label>
                  <Input
                    id="delivery-tax"
                    type="number"
                    step="0.01"
                    value={order.invoice.delivery_tax}
                    onChange={(e) => updateInvoice("delivery_tax", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tip">Tip</Label>
                  <Input
                    id="tip"
                    type="number"
                    step="0.01"
                    value={order.invoice.tip}
                    onChange={(e) => updateInvoice("tip", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total">Total</Label>
                  <Input
                    id="total"
                    type="number"
                    step="0.01"
                    value={order.invoice.total}
                    readOnly
                    className="font-bold"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <ReceiptPreview order={order} />
          </TabsContent>

          <TabsContent value="settings">
            <PrinterSettings />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const orderData = JSON.stringify(order, null, 2)
            navigator.clipboard.writeText(orderData)
            toast({
              title: "Copied",
              description: "Order data copied to clipboard",
            })
          }}
        >
          <Save className="h-4 w-4 mr-2" /> Save Order Data
        </Button>
        <Button onClick={printReceipt}>
          <Printer className="h-4 w-4 mr-2" /> Print Receipt
        </Button>
      </CardFooter>
    </Card>
  )
}
