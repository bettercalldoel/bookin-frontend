"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import { useRouter } from "next/navigation";

type PaymentMethod = "MANUAL_TRANSFER" | "XENDIT";

const formatIDR = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const formatDateTime = (value: string) => {
  return formatDateDDMMYYYY(value, value);
};

export default function PaymentPage() {
  return (
    <Suspense fallback={null}>
      <PaymentContent />
    </Suspense>
  );
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") ?? "";
  const orderNo = searchParams.get("orderNo") ?? "";
  const total = searchParams.get("total") ?? "";
  const paymentDueAt = searchParams.get("paymentDueAt") ?? "";
  const propertyName = searchParams.get("propertyName") ?? "";
  const roomName = searchParams.get("roomName") ?? "";
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";
  const paymentMethod = (searchParams.get("paymentMethod") ??
    "MANUAL_TRANSFER") as PaymentMethod;
  const xenditInvoiceUrl = searchParams.get("xenditInvoiceUrl") ?? "";

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [redirectingToGateway, setRedirectingToGateway] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const router = useRouter();

  const isManualTransfer = paymentMethod !== "XENDIT";
  const canUpload = Boolean(bookingId && proofFile && !uploading && isManualTransfer);

  const handleUploadProof = async () => {
    if (!isManualTransfer) {
      setUploadError(
        "Pesanan ini menggunakan gateway pembayaran. Lanjutkan pembayaran melalui gateway.",
      );
      return;
    }

    if (!bookingId) {
      setUploadError("ID pesanan tidak ditemukan. Ulangi dari halaman konfirmasi.");
      return;
    }
    if (!proofFile) {
      setUploadError("Pilih file bukti transfer terlebih dahulu.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setUploadError("Silakan login kembali untuk mengunggah bukti transfer.");
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      const formData = new FormData();
      formData.append("proof", proofFile);

      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/payment-proof`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        imageUrl?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Gagal mengunggah bukti pembayaran.");
      }

      setUploadSuccess(payload.message || "Bukti pembayaran berhasil diunggah.");
      setUploadedImageUrl(payload.imageUrl ?? null);
      setProofFile(null);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Gagal mengunggah bukti pembayaran.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleOpenXenditInvoice = () => {
    if (!xenditInvoiceUrl) {
      setUploadError(
        "URL invoice gateway pembayaran tidak tersedia. Silakan ulangi pesanan dari halaman sebelumnya.",
      );
      return;
    }

    setRedirectingToGateway(true);
    window.location.href = xenditInvoiceUrl;
  };

  const handleCancelBooking = async () => {
    console.log("Cancel booking");

    const url = `${API_BASE_URL}/bookings/${bookingId}/cancel`;

    const token = getAuthToken();
    if (!token) {
      setUploadError("Silakan login kembali untuk upload bukti transfer.");
      return;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`, 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cancelledBy: "USER"
      })
    })

    if (!response.ok) {
      setUploadError("Gagal membatalkan booking. Silakan coba lagi.");
      return;
    }

    router.push("/")
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
            Pembayaran
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Selesaikan pembayaran pesanan Anda
          </h1>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">{propertyName}</p>
          <p>{roomName}</p>
          <p>
            {formatDateTime(checkIn)} &rarr; {formatDateTime(checkOut)}
          </p>
        </div>
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>No. Pesanan</span>
            <span className="font-semibold text-slate-900">{orderNo}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Total</span>
            <span className="font-semibold text-slate-900">
              {total ? formatIDR(total) : "-"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Metode</span>
            <span className="font-semibold text-slate-900">
              {isManualTransfer ? "Transfer Manual" : "Gateway Pembayaran"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Batas pembayaran</span>
            <span className="font-semibold text-slate-900">
              {paymentDueAt ? formatDateTime(paymentDueAt) : "-"}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Instruksi pembayaran</p>
          <ul className="mt-2 list-disc pl-4 text-sm text-slate-600">
            {isManualTransfer ? (
              <>
                <li>Transfer sesuai total ke rekening yang ditentukan.</li>
                <li>Unggah bukti transfer di bawah ini.</li>
                <li>Pesanan akan diproses setelah pembayaran terverifikasi tenant.</li>
              </>
            ) : (
              <>
                <li>Klik tombol bayar untuk lanjut ke halaman gateway pembayaran.</li>
                <li>Pilih channel pembayaran yang tersedia.</li>
                <li>Status pesanan diperbarui otomatis saat pembayaran berhasil.</li>
              </>
            )}
          </ul>
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          {isManualTransfer ? (
            <>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Unggah Bukti Transfer
                </p>
                <p className="text-xs text-slate-500">
                  Format: JPG/JPEG/PNG, maksimal 1MB.
                </p>
              </div>

              {!bookingId ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  ID pesanan tidak tersedia. Ulangi proses dari halaman konfirmasi
                  pesanan.
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] ?? null;
                      setProofFile(nextFile);
                      setUploadError(null);
                      setUploadSuccess(null);
                    }}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                  />
                  {proofFile ? (
                    <p className="text-xs text-slate-500">Berkas: {proofFile.name}</p>
                  ) : null}
<<<<<<< Updated upstream
                  <button
                    type="button"
                    onClick={handleUploadProof}
                    disabled={!canUpload}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white transition ${
                      canUpload ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-300"
                    }`}
                  >
                    {uploading ? "Mengunggah..." : "Unggah Bukti Pembayaran"}
                  </button>
=======
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handleUploadProof}
                      disabled={!canUpload}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white transition ${
                        canUpload ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-300"
                      }`}
                    >
                      {uploading ? "Mengunggah..." : "Upload Bukti Pembayaran"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelBooking} // Implement cancel booking logic
                      className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition"
                    >
                        Cancel Booking
                    </button>
                  </div>
>>>>>>> Stashed changes
                </>
              )}
            </>
          ) : (
            <>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Lanjutkan Pembayaran
                </p>
                <p className="text-xs text-slate-500">
                  Setelah pembayaran sukses, status pesanan akan diproses otomatis.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenXenditInvoice}
                disabled={redirectingToGateway || !xenditInvoiceUrl}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white transition ${
                  xenditInvoiceUrl
                    ? "bg-slate-900 hover:bg-slate-800"
                    : "bg-slate-300"
                }`}
              >
                {redirectingToGateway ? "Mengarahkan..." : "Lanjutkan ke Gateway Pembayaran"}
              </button>
            </>
          )}

          {uploadError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {uploadError}
            </div>
          ) : null}

          {uploadSuccess ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {uploadSuccess}
            </div>
          ) : null}

          {uploadedImageUrl ? (
            <a
              href={uploadedImageUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Lihat berkas yang diunggah
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
