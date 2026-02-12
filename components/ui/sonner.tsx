"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      duration={6000} // ✅ Auto-dismiss after 6s
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: ({ type }) =>
            `group toast group-[.toaster]:shadow-lg ${
              type === "success"
                ? "bg-green-600 text-white"
                : type === "error"
                ? "bg-red-600 text-white"
                : "bg-background text-foreground border border-border"
            }`,
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
