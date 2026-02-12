"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { confirmOrder } from "@/lib/api/checkout"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem , DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { getAuthToken } from "@/lib/api/auth"
import { CreditCard, PlusCircle } from "lucide-react"

interface Props {
  amount: number
  orderId?: number
  branch?: number
  checkoutData?: any
  onPaymentProcessing?: (isProcessing: boolean) => void
}

const getCardType = (cardNumber: string): string | null => {
  const cleaned = cardNumber.replace(/\D/g, "")
  if (/^4/.test(cleaned)) return "visa"
  if (/^(5[1-5]|2[2-7])/.test(cleaned)) return "mastercard"
  if (/^3[47]/.test(cleaned)) return "amex"
  if (/^6(?:011|5|4[4-9])/.test(cleaned)) return "discover"
  if (/^3(?:0[0-5]|[68])/.test(cleaned)) return "diners"
  if (/^35(2[89]|[3-8][0-9])/.test(cleaned)) return "jcb"
  if (/^62/.test(cleaned)) return "unionpay"
  if (/^(50|5[6-9]|6[0-9])/.test(cleaned)) return "maestro"
  return null
}

const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, "")
  const formatted = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ")
  return formatted.substring(0, 19)
}

const cardTypeIcons: Record<string, string> = {
  visa: "https://img.icons8.com/color/48/visa.png",
  mastercard: "https://img.icons8.com/color/48/mastercard.png",
  amex: "https://img.icons8.com/color/48/amex.png",
  discover: "https://img.icons8.com/color/48/discover.png",
  diners: "https://img.icons8.com/color/48/diners-club.png",
  jcb: "https://img.icons8.com/color/48/jcb.png",
  unionpay: "https://img.icons8.com/color/48/unionpay.png",
  maestro: "https://img.icons8.com/color/48/maestro.png",
}

const months = [
    { value: "01", label: "01" }, { value: "02", label: "02" }, { value: "03", label: "03" },
    { value: "04", label: "04" }, { value: "05", label: "05" }, { value: "06", label: "06" },
    { value: "07", label: "07" }, { value: "08", label: "08" }, { value: "09", label: "09" },
    { value: "10", label: "10" }, { value: "11", label: "11" }, { value: "12", label: "12" },
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 16 }, (_, i) => {
  const year = currentYear + i
  return {
    value: year.toString().slice(-2),
    label: year.toString(),
  }
})

const AuthorizeNetForm = ({ amount, branch, orderId, checkoutData, onPaymentProcessing }: Props) => {
  const [savedCards, setSavedCards] = useState<any[]>([])
  const [selectedCard, setSelectedCard] = useState<any | null>(null)
  const [saveCard, setSaveCard] = useState(false)
  const [cardNumber, setCardNumber] = useState("")
  const [expMonth, setExpMonth] = useState("")
  const [expYear, setExpYear] = useState("")
  const [cvv, setCvv] = useState("")
  const [cardType, setCardType] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const token = getAuthToken()

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://jstest.authorize.net/v1/Accept.js"
    script.async = true
    document.body.appendChild(script)

    const fetchSavedCards = async () => {
      // FIX: Use the dynamic customer ID from checkoutData
      if (checkoutData?.customer_id) {
        try {
          const response = await fetch(`https://api.quickbitenow.com/client/authorizenet/payment-profiles/${checkoutData.customer_id}/`, {
            method: "GET",
            headers: { Authorization: `Token ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setSavedCards(data);
          }
        } catch (error) {
          console.error("Failed to fetch saved cards:", error);
        }
      }
    };
    fetchSavedCards();
  }, [checkoutData, token])

  useEffect(() => {
    if (onPaymentProcessing) {
      onPaymentProcessing(loading)
    }
  }, [loading, onPaymentProcessing])

  const handleCardInput = (value: string) => {
    const formatted = formatCardNumber(value)
    setCardNumber(formatted)
    setCardType(getCardType(formatted))
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    if (selectedCard) {
      try {
        const response = await fetch("https://api.quickbitenow.com/client/authorizenet/charge-profile/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            // FIX: Use the dynamic customer ID from checkoutData
            customerId: checkoutData.customer_id,
            paymentProfileId: selectedCard.payment_profile_id,
            amount: amount,
            branch_id: checkoutData.branch.id,
            orderId: orderId,
          }),
        });
        const result = await response.json();

        if (response.ok) {
          setMessage("✅ Payment successful!");
          await confirmOrder(Number(orderId), checkoutData);
          router.push(`/order-confirmation/${orderId}`);
        } else {
          setMessage(`❌ Error: ${result.error || 'Payment failed'}`);
        }
      } catch (err: any) {
        setMessage(`❌ Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      const authData =
        branch === 16
    ? {
        clientKey: process.env.NEXT_PUBLIC_AUTHNET_CLIENT_KEY_16!,
        apiLoginID: process.env.NEXT_PUBLIC_AUTHNET_API_LOGIN_ID_16!,
      }
    : {
        clientKey: "",
        apiLoginID: "",
      }
       
     /* const authData = {
        clientKey: "4gA4PCx5uEU5epjEftTx4ca7sJ3af4dQsc5PD5GHBgJYjtJ3D828v2EH2Letk3a7",
        apiLoginID: "8rhz22PNqU5S"
      }*/
      const cardData = {
        cardNumber: cardNumber.replace(/\s/g, ""),
        month: expMonth,
        year: expYear,
        cardCode: cvv,
      }
      const secureData = { authData, cardData };
      (window as any).Accept.dispatchData(secureData, handleResponse);
    }
  }

  const handleResponse = async (response: any) => {
    if (response.messages.resultCode === "Error") {
      setMessage(`❌ ${response.messages.message[0].text}`);
      setLoading(false);
      return;
    }

    const { dataDescriptor, dataValue } = response.opaqueData;

    try {
      const res = await fetch("https://tcu2vucmnic6rlv44r2czxtgzi0alyan.lambda-url.us-east-2.on.aws/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opaqueData: { dataDescriptor, dataValue }, amount, orderId, branch}),
      });

      const result = await res.json();
      const responseCode = result.transactionResponse?.responseCode;

      if (responseCode === "1") {
        setMessage("✅ Payment successful!");
        await confirmOrder(Number(orderId), checkoutData);

        if (saveCard) {
          // Pass both transactionId and opaqueData to the save card function
          await saveCardDetails(result.transactionResponse.transId, response.opaqueData);
        }

        router.push(`/order-confirmation/${orderId}`);
      } else {
        const errorMessage = result.transactionResponse?.messages?.[0]?.description || "Transaction declined";
        setMessage(`❌ ${errorMessage}`);
      }
    } catch (err: any) {
      setMessage(`❌ Error: " + err.message`);
    } finally {
      setLoading(false);
    }
  }

  // UPDATED function to pass all required data
  const saveCardDetails = async (transactionId: string, opaqueData: any) => {
    if (!checkoutData?.customer_id) return;
    try {
      await fetch("https://api.quickbitenow.com/client/authorizenet/save-card/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          transactionId: transactionId,
          // FIX: Use the dynamic customer ID from checkoutData
          customerId: checkoutData.customer_id,
          branch_id: checkoutData.branch.id,
          dataDescriptor: opaqueData.dataDescriptor,
          dataValue: opaqueData.dataValue
        }),
      });
    } catch (error) {
      console.error("Error creating customer profile:", error);
    }
  };

  const selectedMonth = months.find((m) => m.value === expMonth);
  const selectedYear = years.find((y) => y.value === expYear);

  return (
    <form onSubmit={handlePayment} className="max-w-md p-6 space-y-6 border rounded-lg shadow-lg bg-white">
      {/* --- Saved Cards Dropdown --- */}
{savedCards.length > 0 && (
  <div>
    <label className="block text-sm font-medium mb-2 text-gray-700">Payment Method</label>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="border border-gray-300 p-3 w-full rounded-lg flex items-center justify-between bg-white text-left"
        >
          {selectedCard ? (
            <div className="flex items-center gap-3">
              <img
                src={cardTypeIcons[selectedCard.card_type.toLowerCase()] || 'https://img.icons8.com/color/48/generic-credit-card.png'}
                alt={`${selectedCard.card_type} logo`}
                className="h-6 w-auto"
              />
              <span className="font-medium">{selectedCard.card_type}</span>
              <span className="text-gray-500">ending in {selectedCard.last_four}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-gray-600">
               <CreditCard className="h-5 w-5 text-gray-400" />
               <span>Use a new card</span>
            </div>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
        {savedCards.map((card) => (
          <DropdownMenuItem key={card.id} onSelect={() => setSelectedCard(card)} className="py-2 px-3">
            <div className="flex items-center gap-3 w-full">
               <img
                  src={cardTypeIcons[card.card_type.toLowerCase()] || 'https://img.icons8.com/color/48/generic-credit-card.png'}
                  alt={`${card.card_type} logo`}
                  className="h-6 w-auto"
                />
                <span className="font-medium">{card.card_type}</span>
                <span className="text-gray-500">**** {card.last_four}</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setSelectedCard(null)} className="py-2 px-3">
            <div className="flex items-center gap-3">
                <PlusCircle className="h-5 w-5 text-gray-400"/>
                <span>Add a new payment method</span>
            </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)}

      {/* --- New Card Form (Conditional) --- */}
      {!selectedCard && (
        <>
          <div className="relative">
            <label className="block text-sm font-medium mb-2 text-gray-700">Card Number</label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => handleCardInput(e.target.value)}
              className="border border-gray-300 p-3 w-full pr-12 rounded-lg"
              required
              disabled={loading}
            />
            {cardType && cardTypeIcons[cardType] && (
              <img
                src={cardTypeIcons[cardType]}
                alt={`${cardType} logo`}
                className="absolute top-10 right-3 h-6 w-auto"
              />
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-gray-700">Expiry Month</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="border border-gray-300 p-3 w-full rounded-lg flex items-center justify-between bg-white" disabled={loading}>
                    <span>{selectedMonth ? selectedMonth.label : "Month"}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {months.map((month) => (
                    <DropdownMenuItem key={month.value} onSelect={() => setExpMonth(month.value)}>
                      {month.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-gray-700">Expiry Year</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="border border-gray-300 p-3 w-full rounded-lg flex items-center justify-between bg-white" disabled={loading}>
                    <span>{selectedYear ? selectedYear.label : "Year"}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {years.map((year) => (
                    <DropdownMenuItem key={year.value} onSelect={() => setExpYear(year.value)}>
                      {year.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">CVV</label>
            <input
              type="text"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              className="border border-gray-300 p-3 w-full rounded-lg"
              maxLength={4}
              required
              disabled={loading}
            />
          </div>
          
          {/* --- Save Card Checkbox --- */}
          <div className="flex items-center">
            <input
              id="save-card"
              type="checkbox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="save-card" className="ml-2 block text-sm text-gray-900">
              Save this card for future payments
            </label>
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading || (!selectedCard && (!expMonth || !expYear))}
        className={`bg-blue-600 text-white font-semibold p-3 w-full rounded-lg transition-all ${loading || (!selectedCard && (!expMonth || !expYear)) ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"}`}
      >
        {loading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
      </button>

      {message && (
        <div className={`text-center text-sm p-3 rounded-lg ${message.includes("✅") ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}`}>
          {message}
        </div>
      )}
    </form>
  )
}

export default AuthorizeNetForm