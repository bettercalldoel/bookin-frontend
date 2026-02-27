import type { PaymentCopy } from "./payment-types";

type PaymentActionsSectionProps = {
  copy: PaymentCopy;
  locale: "id" | "en";
  bookingId: string;
  proofFile: File | null;
  isManualTransfer: boolean;
  canUpload: boolean;
  uploading: boolean;
  redirectingToGateway: boolean;
  xenditInvoiceUrl: string;
  uploadError: string | null;
  uploadSuccess: string | null;
  uploadedImageUrl: string | null;
  onRequestUploadProof: () => void;
  onRequestGatewayRedirect: () => void;
  onCancelBooking: () => void;
  onBackToHome: () => void;
  onProofFileChange: (file: File | null) => void;
};

const renderFeedback = (message: string | null, type: "error" | "success") => {
  if (!message) return null;
  const className =
    type === "error"
      ? "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700";
  return <div className={className}>{message}</div>;
};

export const PaymentActionsSection = ({
  copy,
  locale,
  bookingId,
  proofFile,
  isManualTransfer,
  canUpload,
  uploading,
  redirectingToGateway,
  xenditInvoiceUrl,
  uploadError,
  uploadSuccess,
  uploadedImageUrl,
  onRequestUploadProof,
  onRequestGatewayRedirect,
  onCancelBooking,
  onBackToHome,
  onProofFileChange,
}: PaymentActionsSectionProps) => (
  <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
    {isManualTransfer ? (
      <>
        <div>
          <p className="text-sm font-semibold text-slate-900">{copy.uploadProofTitle}</p>
          <p className="text-xs text-slate-500">{copy.uploadProofHint}</p>
        </div>
        {!bookingId ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {copy.orderIdMissing}
          </div>
        ) : (
          <>
            <input
              type="file"
              accept=".jpg,.png,image/jpeg,image/png"
              onChange={(event) => onProofFileChange(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
            />
            {proofFile ? <p className="text-xs text-slate-500">{copy.fileLabel} {proofFile.name}</p> : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onRequestUploadProof}
                disabled={!canUpload}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white transition ${canUpload ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-300"}`}
              >
                {uploading ? copy.uploading : copy.uploadProofButton}
              </button>
              <button
                type="button"
                onClick={onCancelBooking}
                disabled={uploading}
                className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:bg-rose-300"
              >
                {copy.cancelBookingButton || (locale === "en" ? "Cancel booking" : "Batalkan booking")}
              </button>
            </div>
          </>
        )}
      </>
    ) : (
      <>
        <div>
          <p className="text-sm font-semibold text-slate-900">{copy.continuePayment}</p>
          <p className="text-xs text-slate-500">{copy.continuePaymentHint}</p>
        </div>
        <button
          type="button"
          onClick={onRequestGatewayRedirect}
          disabled={redirectingToGateway || !xenditInvoiceUrl}
          className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white transition ${xenditInvoiceUrl ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-300"}`}
        >
          {redirectingToGateway ? copy.redirecting : copy.toGateway}
        </button>
      </>
    )}

    {renderFeedback(uploadError, "error")}
    {renderFeedback(uploadSuccess, "success")}

    {isManualTransfer && uploadSuccess ? (
      <button
        type="button"
        onClick={onBackToHome}
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
);
