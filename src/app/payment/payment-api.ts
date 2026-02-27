import { API_BASE_URL } from "@/lib/api";
import type { PaymentCopy } from "./payment-types";

type MessagePayload = {
  message?: string;
  imageUrl?: string;
};

const parseResponsePayload = async (response: Response) =>
  ((await response.json().catch(() => ({}))) as MessagePayload);

export const uploadPaymentProof = async ({
  bookingId,
  token,
  file,
  failedMessage,
}: {
  bookingId: string;
  token: string;
  file: File;
  failedMessage: string;
}) => {
  const formData = new FormData();
  formData.append("proof", file);
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/payment-proof`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const payload = await parseResponsePayload(response);
  if (!response.ok) throw new Error(payload.message || failedMessage);
  return payload;
};

export const cancelBookingByUser = async ({
  bookingId,
  token,
  copy,
}: {
  bookingId: string;
  token: string;
  copy: PaymentCopy;
}) => {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-user-approval": "true",
    },
    body: JSON.stringify({ cancelledBy: "USER" }),
  });
  const payload = await parseResponsePayload(response);
  if (!response.ok) throw new Error(payload.message ?? copy.cancelBookingFailed);
  return payload;
};
