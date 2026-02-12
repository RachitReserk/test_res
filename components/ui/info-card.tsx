import type React from "react"
import { InfoIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface InfoCardProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function InfoCard({ title, children, className }: InfoCardProps) {
  return (
    <div className={cn("bg-blue-50 border border-blue-200 rounded-md p-4", className)}>
      <div className="flex items-start gap-3">
        <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          {title && <h4 className="font-medium text-blue-700 mb-1">{title}</h4>}
          <div className="text-sm text-blue-700">{children}</div>
        </div>
      </div>
    </div>
  )
}

