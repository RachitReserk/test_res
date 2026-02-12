"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(({ id, title, description, action, variant = "default", ...props }) => (
        <Toast
          key={id}
          {...props}
          aria-live="assertive"
          className={cn(
            "group toast shadow-md border transition-all duration-300 ease-in-out",
            variant === "success" && "bg-green-600 text-white border-green-700",
            variant === "destructive" && "bg-red-600 text-white border-red-700",
            variant === "default" && "bg-white text-black border-gray-200"
          )}
        >
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport className="fixed bottom-4 right-4 z-50" />
    </ToastProvider>
  )
}
