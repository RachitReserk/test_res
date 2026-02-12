import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface HelpTooltipProps {
  text: string
  side?: "top" | "right" | "bottom" | "left"
}

export function HelpTooltip({ text, side = "top" }: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help ml-1" />
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  )
}

