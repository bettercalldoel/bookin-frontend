export type PaymentMethod = "MANUAL_TRANSFER" | "XENDIT";

export type BookingPreviewResponse = {
  roomTypeId: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guests: number;
  totalNights: number;
  totalAmount: string;
  pricing?: {
    currency: string;
    roomSubtotal: string;
    breakfast: {
      selected: boolean;
      pax: number;
      unitPrice: string;
      nights: number;
      total: string;
    };
    subtotal: string;
    appFeeRate: string;
    appFeeAmount: string;
    taxRate: string;
    taxAmount: string;
    tenantFeeRate: string;
    tenantFeeAmount: string;
    tenantPayoutAmount: string;
    totalAmount: string;
  };
};

export type CreateBookingResponse = {
  id?: string;
  orderNo?: string;
  totalAmount?: string;
  paymentDueAt?: string;
  paymentMethod?: PaymentMethod;
  xenditInvoiceUrl?: string | null;
  message?: string;
  pricing?: {
    subtotal?: string;
    appFeeAmount?: string;
    taxAmount?: string;
    tenantFeeAmount?: string;
    tenantPayoutAmount?: string;
    breakfastTotal?: string;
    currency?: string;
  };
};

export type AuthMeResponse = {
  name?: string;
  email?: string;
  userProfile?: {
    phone?: string | null;
  } | null;
};

export type BookerProfileData = {
  name: string;
  email: string;
  phone: string;
};

export type BookerForm = {
  name: string;
  email: string;
  phone: string;
  paymentMethod: PaymentMethod;
};

export type BookingConfirmationQuery = {
  propertyId: string;
  roomTypeId: string;
  propertyName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  breakfastEnabled: boolean;
  breakfastSelected: boolean;
  breakfastPax: number;
  breakfastPricePerPax: number;
};
