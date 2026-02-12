"use client"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

type PopularItemsChartProps = {
  data: Array<{
    name: string
    value: number
  }>
}

export function PopularItemsChart({ data = [] }: PopularItemsChartProps) {
  // Fallback data if no data is provided
  const chartData =
    data.length > 0
      ? data
      : [
          { name: "Chicken Biryani", value: 540 },
          { name: "Butter Chicken", value: 420 },
          { name: "Garlic Naan", value: 380 },
          { name: "Tandoori Chicken", value: 300 },
          { name: "Mango Lassi", value: 250 },
        ]

  const COLORS = ["hsl(25, 95%, 53%)", "#ff7c43", "#faa75b", "#9d8189", "#66c2a5"]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

