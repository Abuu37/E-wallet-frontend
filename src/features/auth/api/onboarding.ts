import { apiClient } from '../../../lib/api/client'


interface RegisterCustomerResponse {
  userId: string
  message: string
  status: string
}

export async function registerCustomer(
  values: { 
    firstName: string; 
    middleName: string; 
    lastName: string; 
    email: string; 
    phone: string }) 
    {
  const middleName = values.middleName.trim()

  const { data } = await apiClient.post<RegisterCustomerResponse>('/auth/customer-registration', {
    firstName: values.firstName,
    middleName: middleName || undefined,
    lastName: values.lastName,
    email: values.email,
    phone: values.phone,
  })
  return data
}


export async function verifyOtp(email: string, otp: string) {
  const { data } = await apiClient.post('/otp/verify', {
     email, 
     otp 
    })
  return data
}

export async function resendOtp(email: string) {
  const { data } = await apiClient.post('/otp/resend', {
     email
     })
  return data
}

export async function setPin(email: string, pin: string, confirmPin: string) {
  const { data } = await apiClient.post('/auth/set-pin', {
    email,
    pin,
    confirmPin
  })
  return data
}

export async function login(phone: string, pin: string) {
  const { data } = await apiClient.post('/auth/login', {
    phone,
    pin
  })
  return data
}