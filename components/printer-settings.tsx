"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Printer, RefreshCw } from "lucide-react"
import Script from "next/script"

export function PrinterSettings() {
  const { toast } = useToast()
  const [printerUrl, setPrinterUrl] = useState("")
  const [isBuilderLoaded, setIsBuilderLoaded] = useState(false)
  const [isTraderLoaded, setIsTraderLoaded] = useState(false)

  const isScriptLoaded = isBuilderLoaded && isTraderLoaded

  useEffect(() => {
    const savedUrl = localStorage.getItem("printerUrl")
    if (savedUrl) {
      setPrinterUrl(savedUrl)
    }
  }, [])

  const savePrinterSettings = () => {
    if (!printerUrl) {
      toast({
        title: "Error",
        description: "Please enter a printer URL",
        variant: "destructive",
      })
      return
    }

    localStorage.setItem("printerUrl", printerUrl)
    toast({
      title: "Success",
      description: "Printer settings saved successfully",
    })
  }

  const testPrinterConnection = async () => {
    if (!printerUrl) {
      toast({
        title: "Error",
        description: "Please enter a printer URL",
        variant: "destructive",
      })
      return
    }

    if (!isScriptLoaded) {
      toast({
        title: "Error",
        description: "Printer library is still loading",
        variant: "destructive",
      })
      return
    }

    try {
      toast({
        title: "Testing connection...",
        description: "Attempting to connect to " + printerUrl,
      })

      // @ts-ignore - StarWebPrintBuilder is loaded from external script
      const builder = new StarWebPrintBuilder()

      // Build commands using v1 API
      let commands = ""
      commands += builder.createInitializationElement()
      commands += builder.createTextElement([
        { text: "TEST PRINT", emphasis: true, alignment: "center" },
        { text: new Date().toLocaleString(), alignment: "center" },
        { text: "Connection successful!", alignment: "center" },
        { text: "" },
        { text: "" }
      ])
      commands += builder.createCutPaperElement()

      // @ts-ignore - StarWebPrintTrader is loaded from external script
      const trader = new StarWebPrintTrader({ url: printerUrl })

      trader.sendMessage(
        commands,
        (response:any) => {
          if (response.traderSuccess) {
            toast({
              title: "Success",
              description: "Printer connection successful!",
            })
            localStorage.setItem("printerUrl", printerUrl)
          } else {
            toast({
              title: "Error",
              description: "Failed to connect: " + response.traderCode,
              variant: "destructive",
            })
          }
        },
        (error:any) => {
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
        description: "Failed to test printer: " + (error as Error).message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Load local Star WebPRNT libraries */}
      <Script
        src="/star/StarWebPrintBuilder.js"
        onLoad={() => setIsBuilderLoaded(true)}
      />
      <Script
        src="/star/StarWebPrintTrader.js"
        onLoad={() => setIsTraderLoaded(true)}
      />

      <div className="space-y-2">
        <Label htmlFor="printer-url">Printer URL</Label>
        <Input
          id="printer-url"
          placeholder="http://192.168.1.10:8080/StarWebPRNT/SendMessage"
          value={printerUrl}
          onChange={(e) => setPrinterUrl(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Enter the URL of your Star WebPRNT printer. Example: http://192.168.1.10:8080/StarWebPRNT/SendMessage
        </p>
      </div>

      <div className="flex space-x-4">
        <Button onClick={savePrinterSettings}>
          <Printer className="h-4 w-4 mr-2" /> Save Settings
        </Button>
      </div>

      <div className="border rounded-md p-4 bg-muted/50">
        <h3 className="font-medium mb-2">Star WebPRNT Setup Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Ensure your Star printer is connected to the same network as your device.</li>
          <li>Find the IP address of your Star printer from its network settings.</li>
          <li>Enter the printer's URL above in the format shown.</li>
          <li>Click "Test Connection" to verify connectivity and printing capability.</li>
          <li>If successful, click "Save Settings" to store the printer URL for future use.</li>
        </ol>
      </div>
    </div>
  )
}
