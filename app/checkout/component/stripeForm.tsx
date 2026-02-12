"use client";

import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation"
import {
  confirmOrder
} from "@/lib/api/checkout"

export default function StripePaymentForm({ clientSecret , checkoutData }: { clientSecret: string , checkoutData:string }) {
  const router = useRouter()
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      },
    });

    if (result.error) {
      console.error(result.error.message);
      alert(result.error.message);
    } else {
      if (result.paymentIntent?.status === "succeeded") {
        await confirmOrder(checkoutData.order_id)
        router.push(`/order-confirmation/${checkoutData.order_id}`)
        // redirect to success page
      }
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement />
      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
}
