"use client"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type RevenueChartProps = {
  data: Array<{
    name: string
    total: number
  }>
}

export function RevenueChart({ data = [] }: RevenueChartProps) {
  // Fallback data if no data is provided
  const chartData =
    data.length > 0
      ? data
      : [
          { name: "Jan", total: 4000 },
          { name: "Feb", total: 3000 },
          { name: "Mar", total: 5000 },
          { name: "Apr", total: 4000 },
          { name: "May", total: 6000 },
          { name: "Jun", total: 5500 },
          { name: "Jul", total: 7000 },
          { name: "Aug", total: 8000 },
          { name: "Sep", total: 7500 },
          { name: "Oct", total: 9000 },
          { name: "Nov", total: 8500 },
          { name: "Dec", total: 10000 },
        ]

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip />
        <Area type="monotone" dataKey="total" stroke="hsl(25, 95%, 53%)" fill="hsl(25, 95%, 53%)" fillOpacity={0.2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

