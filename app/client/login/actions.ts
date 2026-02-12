export async function requestOTP(phoneNumber: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbitenow-backend-production.up.railway.app';
  
  try {
    const response = await fetch(`${API_URL}/client/customer/request-otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email_or_phone: phoneNumber,
        restaurant: "1"  // Default restaurant ID
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to request OTP')
    }

    const data = await response.json()
    return data

  } catch (error) {
    console.error('Error requesting OTP:', error)
    throw error
  }
}