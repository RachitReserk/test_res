"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Mock data for orders
const mockOrders = [
  {
    id: "ORD-001",
    customer: "John Doe",
    branch: "Downtown",
    total: "$24.50",
    status: "completed",
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    branch: "Uptown",
    total: "$32.75",
    status: "ongoing",
  },
  {
    id: "ORD-003",
    customer: "Robert Johnson",
    branch: "Riverside",
    total: "$18.25",
    status: "completed",
  },
  {
    id: "ORD-004",
    customer: "Emily Davis",
    branch: "Downtown",
    total: "$27.50",
    status: "ongoing",
  },
  {
    id: "ORD-005",
    customer: "Michael Wilson",
    branch: "Uptown",
    total: "$29.99",
    status: "cancelled",
  },
]

export function RecentOrdersTable() {
  const [orders, setOrders] = useState(mockOrders)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate API loading delay
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return <p className="text-center py-4 text-muted-foreground">Loading orders...</p>
  }

  if (error) {
    return <p className="text-center py-4 text-destructive">{error}</p>
  }

  if (orders.length === 0) {
    return <p className="text-center py-4 text-muted-foreground">No orders found.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Branch</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.id}</TableCell>
            <TableCell>{order.customer}</TableCell>
            <TableCell>{order.branch}</TableCell>
            <TableCell>{order.total}</TableCell>
            <TableCell>
              <Badge
                variant={
                  order.status === "completed" ? "default" : order.status === "ongoing" ? "outline" : "destructive"
                }
              >
                {order.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

