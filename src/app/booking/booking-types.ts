export type BookingStatus =
  | "MENUNGGU_PEMBAYARAN"
  | "MENUNGGU_KONFIRMASI_PEMBAYARAN"
  | "DIPROSES"
  | "DIBATALKAN"
  | "SELESAI";

export type Booking = {
  id: string;
  orderNo: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  totalAmount: number | string;
  status: BookingStatus;
  createdAt: string;
};

export type BookingPreviewNight = {
  date: string;
  basePrice: string;
  adjustment: string;
  finalPrice: string;
  availableUnits: number;
  isClosed: boolean;
};

export type BookingPreview = {
  roomTypeId: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guests: number;
  totalNights: number;
  totalAmount: string;
  nights: BookingPreviewNight[];
};

export type RoomTypeOption = {
  id: string;
  name: string;
  basePrice: string;
  totalUnits: number;
  maxGuests: number;
};

export type PropertyOption = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  roomTypes: RoomTypeOption[];
};

export type BookingForm = {
  propertyId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
};
