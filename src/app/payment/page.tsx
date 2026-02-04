"use client";

import { useSearchParams } from "next/navigation";

const formatIDR = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(parsed);
};

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get("orderNo") ?? "";
  const total = searchParams.get("total") ?? "";
  const paymentDueAt = searchParams.get("paymentDueAt") ?? "";
  const propertyName = searchParams.get("propertyName") ?? "";
  const roomName = searchParams.get("roomName") ?? "";
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
            Pembayaran
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Selesaikan pembayaran booking kamu
          </h1>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">{propertyName}</p>
          <p>{roomName}</p>
          <p>
            {checkIn} &rarr; {checkOut}
          </p>
        </div>
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>Order No</span>
            <span className="font-semibold text-slate-900">{orderNo}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Total</span>
            <span className="font-semibold text-slate-900">
              {total ? formatIDR(total) : "-"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Batas pembayaran</span>
            <span className="font-semibold text-slate-900">
              {paymentDueAt || "-"}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Instruksi pembayaran</p>
          <ul className="mt-2 list-disc pl-4 text-sm text-slate-600">
            <li>Transfer sesuai total ke rekening yang ditentukan.</li>
            <li>Unggah bukti pembayaran di halaman booking.</li>
            <li>Booking akan diproses setelah pembayaran terverifikasi.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
