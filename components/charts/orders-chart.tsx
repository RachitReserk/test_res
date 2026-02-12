"use client"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type OrdersChartProps = {
  data: Array<{
    name: string
    total: number
  }>
}

export function OrdersChart({ data = [] }: OrdersChartProps) {
  // Fallback data if no data is provided
  const chartData =
    data.length > 0
      ? data
      : [
          { name: "Week 1", total: 320 },
          { name: "Week 2", total: 450 },
          { name: "Week 3", total: 380 },
          { name: "Week 4", total: 520 },
        ]

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip />
        <Bar dataKey="total" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

