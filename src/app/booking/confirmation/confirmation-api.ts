import { API_BASE_URL } from "@/lib/api";
import type {
  AuthMeResponse,
  BookingPreviewResponse,
  CreateBookingResponse,
  PaymentMethod,
} from "./confirmation-types";

const parsePayload = async (response: Response) =>
  ((await response.json().catch(() => ({}))) as { message?: string });

export const fetchAuthMe = async (token: string, fallbackMessage: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = (await parsePayload(response)) as AuthMeResponse & { message?: string };
  if (!response.ok) throw new Error(payload.message || fallbackMessage);
  return payload;
};

export const fetchBookingPreview = async ({
  token,
  body,
  fallbackMessage,
  signal,
}: {
  token: string;
  body: {
    propertyId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms: number;
    paymentMethod: PaymentMethod;
    breakfastSelected: boolean;
    breakfastPax: number;
  };
  fallbackMessage: string;
  signal: AbortSignal;
}) => {
  const response = await fetch(`${API_BASE_URL}/bookings/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal,
  });
  const payload = (await parsePayload(response)) as BookingPreviewResponse & { message?: string };
  if (!response.ok) throw new Error(payload.message || fallbackMessage);
  return payload;
};

export const createBooking = async ({
  token,
  body,
  fallbackMessage,
}: {
  token: string;
  body: {
    propertyId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms: number;
    paymentMethod: PaymentMethod;
    breakfastSelected: boolean;
    breakfastPax: number;
  };
  fallbackMessage: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const payload = (await parsePayload(response)) as CreateBookingResponse;
  if (!response.ok) throw new Error(payload.message || fallbackMessage);
  return payload;
};
