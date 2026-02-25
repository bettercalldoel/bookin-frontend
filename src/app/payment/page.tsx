"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import type { AppLocale } from "@/lib/app-locale";
import ConfirmModal from "@/components/ui/confirm-modal";

type PaymentMethod = "MANUAL_TRANSFER" | "XENDIT";
const MAX_PROOF_FILE_SIZE = 1024 * 1024;
const ALLOWED_PROOF_EXTENSIONS = [".jpg", ".jpeg", ".png"];
const ALLOWED_PROOF_MIME_TYPES = ["image/jpeg", "image/png"];

const formatIDR = (value: string, locale: AppLocale) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const hasAllowedProofExtension = (fileName: string) =>
  ALLOWED_PROOF_EXTENSIONS.some((ext) => fileName.toLowerCase().endsWith(ext));

const PAYMENT_COPY = {
  id: {
    payment: "Pembayaran",
    finishPayment: "Selesaikan pembayaran pesanan Anda",
    orderNo: "No. Pesanan",
    total: "Total",
    method: "Metode",
    paymentLimit: "Batas pembayaran",
    manualTransfer: "Transfer Manual",
    paymentGateway: "Gateway Pembayaran",
    roomSubtotal: "Subtotal kamar",
    breakfast: "Sarapan",
    subtotal: "Subtotal",
    appServiceFee: "Biaya layanan aplikasi (2%)",
    tax: "Pajak (11%)",
    paymentInstructions: "Instruksi pembayaran",
    uploadProofTitle: "Unggah Bukti Transfer",
    uploadProofHint: "Format: JPG/JPEG/PNG, maksimal 1MB.",
    uploadProofButton: "Unggah Bukti Pembayaran",
    uploading: "Mengunggah...",
    continuePayment: "Lanjutkan Pembayaran",
    continuePaymentHint:
      "Setelah pembayaran sukses, status pesanan akan diproses otomatis.",
    toGateway: "Lanjutkan ke Gateway Pembayaran",
    redirecting: "Mengarahkan...",
    backToHome: "Back to Home",
    viewUploadedFile: "Lihat berkas yang diunggah",
    transferInstruction1: "Transfer sesuai total ke rekening yang ditentukan.",
    transferInstruction2: "Unggah bukti transfer di bawah ini.",
    transferInstruction3:
      "Pesanan akan diproses setelah pembayaran terverifikasi tenant.",
    gatewayInstruction1: "Klik tombol bayar untuk lanjut ke halaman gateway pembayaran.",
    gatewayInstruction2: "Pilih channel pembayaran yang tersedia.",
    gatewayInstruction3:
      "Status pesanan diperbarui otomatis saat pembayaran berhasil.",
    orderIdMissing: "ID pesanan tidak tersedia. Ulangi proses dari halaman konfirmasi pesanan.",
    fileLabel: "Berkas:",
    checkInOutArrow: "→",
    failedGatewayNoUrl:
      "URL invoice gateway pembayaran tidak tersedia. Silakan ulangi pesanan dari halaman sebelumnya.",
    gatewayOrderError:
      "Pesanan ini menggunakan gateway pembayaran. Lanjutkan pembayaran melalui gateway.",
    orderIdNotFound: "ID pesanan tidak ditemukan. Ulangi dari halaman konfirmasi.",
    chooseProofFirst: "Pilih file bukti transfer terlebih dahulu.",
    reloginUpload: "Silakan login kembali untuk mengunggah bukti transfer.",
    failedUpload: "Gagal mengunggah bukti pembayaran.",
    uploadSuccess: "Bukti pembayaran berhasil diunggah.",
    invalidProofType: "Format file harus JPG/JPEG/PNG.",
    invalidProofSize: "Ukuran file maksimum 1MB.",
    confirmUploadTitle: "Konfirmasi upload bukti",
    confirmUploadDescription: "Pastikan bukti transfer yang diunggah sudah benar.",
    confirmUploadButton: "Ya, upload",
    confirmGatewayTitle: "Konfirmasi lanjut ke gateway",
    confirmGatewayDescription:
      "Anda akan diarahkan ke halaman pembayaran gateway untuk menyelesaikan transaksi.",
    confirmGatewayButton: "Lanjutkan",
    cancelAction: "Batal",
  },
  en: {
    payment: "Payment",
    finishPayment: "Complete your booking payment",
    orderNo: "Order No.",
    total: "Total",
    method: "Method",
    paymentLimit: "Payment deadline",
    manualTransfer: "Manual transfer",
    paymentGateway: "Payment gateway",
    roomSubtotal: "Room subtotal",
    breakfast: "Breakfast",
    subtotal: "Subtotal",
    appServiceFee: "App service fee (2%)",
    tax: "Tax (11%)",
    paymentInstructions: "Payment instructions",
    uploadProofTitle: "Upload transfer proof",
    uploadProofHint: "Format: JPG/JPEG/PNG, max 1MB.",
    uploadProofButton: "Upload payment proof",
    uploading: "Uploading...",
    continuePayment: "Continue payment",
    continuePaymentHint: "After successful payment, booking status updates automatically.",
    toGateway: "Continue to payment gateway",
    redirecting: "Redirecting...",
    backToHome: "Back to Home",
    viewUploadedFile: "View uploaded file",
    transferInstruction1: "Transfer the exact total to the designated account.",
    transferInstruction2: "Upload payment proof below.",
    transferInstruction3: "Booking is processed after tenant verifies payment.",
    gatewayInstruction1: "Click pay to continue to the payment gateway page.",
    gatewayInstruction2: "Choose an available payment channel.",
    gatewayInstruction3: "Booking status updates automatically after success.",
    orderIdMissing: "Order ID is unavailable. Repeat from booking confirmation page.",
    fileLabel: "File:",
    checkInOutArrow: "→",
    failedGatewayNoUrl:
      "Payment gateway invoice URL is unavailable. Please repeat booking from previous page.",
    gatewayOrderError:
      "This booking uses payment gateway. Please continue through the gateway.",
    orderIdNotFound: "Order ID not found. Please repeat from confirmation page.",
    chooseProofFirst: "Please choose transfer proof file first.",
    reloginUpload: "Please sign in again to upload transfer proof.",
    failedUpload: "Failed to upload payment proof.",
    uploadSuccess: "Payment proof uploaded successfully.",
    invalidProofType: "File format must be JPG/JPEG/PNG.",
    invalidProofSize: "Maximum file size is 1MB.",
    confirmUploadTitle: "Confirm proof upload",
    confirmUploadDescription: "Make sure the transfer proof is correct before upload.",
    confirmUploadButton: "Yes, upload",
    confirmGatewayTitle: "Confirm continue to gateway",
    confirmGatewayDescription:
      "You will be redirected to the payment gateway page to complete this transaction.",
    confirmGatewayButton: "Continue",
    cancelAction: "Cancel",
  },
} as const;

const formatDateTime = (value: string) => {
  return formatDateDDMMYYYY(value, value);
};

const validateProofFile = (
  file: File,
  copy: (typeof PAYMENT_COPY)[AppLocale],
) => {
  const mimeType = file.type.toLowerCase();
  const hasValidType =
    hasAllowedProofExtension(file.name) && ALLOWED_PROOF_MIME_TYPES.includes(mimeType);

  if (!hasValidType) {
    return copy.invalidProofType;
  }

  if (file.size > MAX_PROOF_FILE_SIZE) {
    return copy.invalidProofSize;
  }

  return null;
};

export default function PaymentPage() {
  return (
    <Suspense fallback={null}>
      <PaymentContent />
    </Suspense>
  );
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useAppLocaleValue();
  const copy = PAYMENT_COPY[locale];
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
  const subtotalAmount = searchParams.get("subtotalAmount") ?? "";
  const roomSubtotal = searchParams.get("roomSubtotal") ?? "";
  const breakfastSelected = searchParams.get("breakfastSelected") === "true";
  const breakfastPax = searchParams.get("breakfastPax") ?? "0";
  const breakfastUnitPrice = searchParams.get("breakfastUnitPrice") ?? "";
  const breakfastTotal = searchParams.get("breakfastTotal") ?? "";
  const appFeeAmount = searchParams.get("appFeeAmount") ?? "";
  const taxAmount = searchParams.get("taxAmount") ?? "";

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [redirectingToGateway, setRedirectingToGateway] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [showGatewayConfirm, setShowGatewayConfirm] = useState(false);

  const isManualTransfer = paymentMethod !== "XENDIT";
  const canUpload = Boolean(bookingId && proofFile && !uploading && isManualTransfer);

  const ensureProofFileValid = (file: File | null) => {
    if (!file) {
      setUploadError(copy.chooseProofFirst);
      return false;
    }

    const fileError = validateProofFile(file, copy);
    if (fileError) {
      setUploadError(fileError);
      return false;
    }

    return true;
  };

  const handleRequestUploadProof = () => {
    if (!isManualTransfer) {
      setUploadError(copy.gatewayOrderError);
      return;
    }

    if (!bookingId) {
      setUploadError(copy.orderIdNotFound);
      return;
    }

    if (!ensureProofFileValid(proofFile)) {
      return;
    }

    setShowUploadConfirm(true);
  };

  const handleUploadProof = async () => {
    if (!isManualTransfer) {
      setUploadError(copy.gatewayOrderError);
      return;
    }

    if (!bookingId) {
      setUploadError(copy.orderIdNotFound);
      return;
    }
    if (!ensureProofFileValid(proofFile)) {
      return;
    }
    const selectedProof = proofFile;
    if (!selectedProof) {
      setUploadError(copy.chooseProofFirst);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setUploadError(copy.reloginUpload);
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      const formData = new FormData();
      formData.append("proof", selectedProof);

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
        throw new Error(payload.message || copy.failedUpload);
      }

      setUploadSuccess(payload.message || copy.uploadSuccess);
      setUploadedImageUrl(payload.imageUrl ?? null);
      setProofFile(null);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : copy.failedUpload,
      );
    } finally {
      setUploading(false);
    }
  };

  const handleOpenXenditInvoice = () => {
    if (!xenditInvoiceUrl) {
      setUploadError(copy.failedGatewayNoUrl);
      return;
    }

    setRedirectingToGateway(true);
    window.location.href = xenditInvoiceUrl;
  };

  const handleRequestGatewayRedirect = () => {
    if (!xenditInvoiceUrl) {
      setUploadError(copy.failedGatewayNoUrl);
      return;
    }
    setShowGatewayConfirm(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
            {copy.payment}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            {copy.finishPayment}
          </h1>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">{propertyName}</p>
          <p>{roomName}</p>
          <p>
            {formatDateTime(checkIn)} {copy.checkInOutArrow} {formatDateTime(checkOut)}
          </p>
        </div>
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>{copy.orderNo}</span>
            <span className="font-semibold text-slate-900">{orderNo}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{copy.total}</span>
            <span className="font-semibold text-slate-900">
              {total ? formatIDR(total, locale) : "-"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>{copy.method}</span>
            <span className="font-semibold text-slate-900">
              {isManualTransfer ? copy.manualTransfer : copy.paymentGateway}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>{copy.paymentLimit}</span>
            <span className="font-semibold text-slate-900">
              {paymentDueAt ? formatDateTime(paymentDueAt) : "-"}
            </span>
          </div>
        </div>
        {(subtotalAmount || appFeeAmount || taxAmount || breakfastTotal) && (
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>{copy.roomSubtotal}</span>
              <span className="font-semibold text-slate-900">
                {roomSubtotal ? formatIDR(roomSubtotal, locale) : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>
                {copy.breakfast}
                {breakfastSelected && breakfastPax !== "0" && breakfastUnitPrice
                  ? ` (${breakfastPax} pax × ${formatIDR(breakfastUnitPrice, locale)}/${
                      locale === "en" ? "night" : "malam"
                    })`
                  : ""}
              </span>
              <span className="font-semibold text-slate-900">
                {breakfastTotal ? formatIDR(breakfastTotal, locale) : formatIDR("0", locale)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>{copy.subtotal}</span>
              <span className="font-semibold text-slate-900">
                {subtotalAmount ? formatIDR(subtotalAmount, locale) : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>{copy.appServiceFee}</span>
              <span className="font-semibold text-slate-900">
                {appFeeAmount ? formatIDR(appFeeAmount, locale) : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>{copy.tax}</span>
              <span className="font-semibold text-slate-900">
                {taxAmount ? formatIDR(taxAmount, locale) : "-"}
              </span>
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">{copy.paymentInstructions}</p>
          <ul className="mt-2 list-disc pl-4 text-sm text-slate-600">
            {isManualTransfer ? (
              <>
                <li>{copy.transferInstruction1}</li>
                <li>{copy.transferInstruction2}</li>
                <li>{copy.transferInstruction3}</li>
              </>
            ) : (
              <>
                <li>{copy.gatewayInstruction1}</li>
                <li>{copy.gatewayInstruction2}</li>
                <li>{copy.gatewayInstruction3}</li>
              </>
            )}
          </ul>
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          {isManualTransfer ? (
            <>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {copy.uploadProofTitle}
                </p>
                <p className="text-xs text-slate-500">
                  {copy.uploadProofHint}
                </p>
              </div>

              {!bookingId ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {copy.orderIdMissing}
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] ?? null;
                      if (!nextFile) {
                        setProofFile(null);
                        setUploadError(null);
                        setUploadSuccess(null);
                        return;
                      }

                      const fileError = validateProofFile(nextFile, copy);
                      if (fileError) {
                        setProofFile(null);
                        setUploadError(fileError);
                        setUploadSuccess(null);
                        event.target.value = "";
                        return;
                      }

                      setProofFile(nextFile);
                      setUploadError(null);
                      setUploadSuccess(null);
                    }}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                  />
                  {proofFile ? (
                    <p className="text-xs text-slate-500">
                      {copy.fileLabel} {proofFile.name}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleRequestUploadProof}
                    disabled={!canUpload}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white transition ${
                      canUpload ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-300"
                    }`}
                  >
                    {uploading ? copy.uploading : copy.uploadProofButton}
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {copy.continuePayment}
                </p>
                <p className="text-xs text-slate-500">
                  {copy.continuePaymentHint}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRequestGatewayRedirect}
                disabled={redirectingToGateway || !xenditInvoiceUrl}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white transition ${
                  xenditInvoiceUrl
                    ? "bg-slate-900 hover:bg-slate-800"
                    : "bg-slate-300"
                }`}
              >
                {redirectingToGateway ? copy.redirecting : copy.toGateway}
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

          {isManualTransfer && uploadSuccess ? (
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              {copy.backToHome}
            </button>
          ) : null}

          {uploadedImageUrl ? (
            <a
              href={uploadedImageUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              {copy.viewUploadedFile}
            </a>
          ) : null}
        </div>
      </div>
      <ConfirmModal
        open={showUploadConfirm}
        title={copy.confirmUploadTitle}
        description={copy.confirmUploadDescription}
        onCancel={() => setShowUploadConfirm(false)}
        onConfirm={() => {
          setShowUploadConfirm(false);
          void handleUploadProof();
        }}
        loading={uploading}
        confirmLabel={copy.confirmUploadButton}
        cancelLabel={copy.cancelAction}
        busyLabel={copy.uploading}
      />
      <ConfirmModal
        open={showGatewayConfirm}
        title={copy.confirmGatewayTitle}
        description={copy.confirmGatewayDescription}
        onCancel={() => setShowGatewayConfirm(false)}
        onConfirm={() => {
          setShowGatewayConfirm(false);
          handleOpenXenditInvoice();
        }}
        loading={redirectingToGateway}
        confirmLabel={copy.confirmGatewayButton}
        cancelLabel={copy.cancelAction}
        busyLabel={copy.redirecting}
      />
    </div>
  );
}
