"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmModal from "@/components/ui/confirm-modal";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import { getAuthToken } from "@/lib/auth-client";
import { cancelBookingByUser, uploadPaymentProof } from "./payment-api";
import { PaymentActionsSection } from "./payment-actions-section";
import { PAYMENT_COPY } from "./payment-copy";
import { PaymentOverviewSection } from "./payment-overview-section";
import { getPaymentQueryData } from "./payment-query";
import { validateProofFile } from "./payment-helpers";

const requiresBookingId = (bookingId: string, onError: (message: string) => void, message: string) => {
  if (bookingId) return true;
  onError(message);
  return false;
};

export const PaymentContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useAppLocaleValue();
  const copy = PAYMENT_COPY[locale];
  const query = getPaymentQueryData(searchParams);
  const isManualTransfer = query.paymentMethod !== "XENDIT";

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [redirectingToGateway, setRedirectingToGateway] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [showGatewayConfirm, setShowGatewayConfirm] = useState(false);

  const canUpload = Boolean(query.bookingId && proofFile && !uploading && isManualTransfer);

  const ensureProofFileValid = (file: File | null) => {
    if (!file) return setUploadError(copy.chooseProofFirst), false;
    const fileError = validateProofFile(file, copy);
    if (!fileError) return true;
    setUploadError(fileError);
    return false;
  };

  const handleProofFileChange = (nextFile: File | null) => {
    if (!nextFile) return setProofFile(null), setUploadError(null), setUploadSuccess(null);
    const fileError = validateProofFile(nextFile, copy);
    if (!fileError) return setProofFile(nextFile), setUploadError(null), setUploadSuccess(null);
    setProofFile(null);
    setUploadError(fileError);
    setUploadSuccess(null);
  };

  const handleRequestUploadProof = () => {
    if (!isManualTransfer) return setUploadError(copy.gatewayOrderError);
    if (!requiresBookingId(query.bookingId, setUploadError, copy.orderIdNotFound)) return;
    if (!ensureProofFileValid(proofFile)) return;
    setShowUploadConfirm(true);
  };

  const resolveUploadContext = () => {
    if (!isManualTransfer) return setUploadError(copy.gatewayOrderError), null;
    if (!requiresBookingId(query.bookingId, setUploadError, copy.orderIdNotFound)) return null;
    if (!ensureProofFileValid(proofFile)) return null;
    const token = getAuthToken();
    if (!proofFile) return setUploadError(copy.chooseProofFirst), null;
    if (!token) return setUploadError(copy.reloginUpload), null;
    return { proofFile, token };
  };

  const startUploadState = () => {
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const applyUploadPayload = (payload: { message?: string; imageUrl?: string }) => {
    setUploadSuccess(payload.message || copy.uploadSuccess);
    setUploadedImageUrl(payload.imageUrl ?? null);
    setProofFile(null);
  };

  const handleUploadProof = async () => {
    const context = resolveUploadContext();
    if (!context) return;
    startUploadState();
    await uploadPaymentProof({
      bookingId: query.bookingId,
      token: context.token,
      file: context.proofFile,
      failedMessage: copy.failedUpload,
    })
      .then(applyUploadPayload)
      .catch((error) => setUploadError(error instanceof Error ? error.message : copy.failedUpload));
    setUploading(false);
  };

  const handleCancelBooking = async () => {
    if (!requiresBookingId(query.bookingId, setUploadError, copy.orderIdNotFound)) return;
    const token = getAuthToken();
    if (!token) return setUploadError(copy.reloginUpload);
    try {
      await cancelBookingByUser({ bookingId: query.bookingId, token, copy });
      router.push("/");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : copy.cancelBookingFailed);
    }
  };

  const handleRequestGatewayRedirect = () =>
    query.xenditInvoiceUrl ? setShowGatewayConfirm(true) : setUploadError(copy.failedGatewayNoUrl);

  const handleOpenXenditInvoice = () => {
    if (!query.xenditInvoiceUrl) return setUploadError(copy.failedGatewayNoUrl);
    setRedirectingToGateway(true);
    window.location.href = query.xenditInvoiceUrl;
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">{copy.payment}</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{copy.finishPayment}</h1>
        </div>

        <PaymentOverviewSection
          copy={copy}
          locale={locale}
          query={query}
          isManualTransfer={isManualTransfer}
        />

        <PaymentActionsSection
          copy={copy}
          locale={locale}
          bookingId={query.bookingId}
          proofFile={proofFile}
          isManualTransfer={isManualTransfer}
          canUpload={canUpload}
          uploading={uploading}
          redirectingToGateway={redirectingToGateway}
          xenditInvoiceUrl={query.xenditInvoiceUrl}
          uploadError={uploadError}
          uploadSuccess={uploadSuccess}
          uploadedImageUrl={uploadedImageUrl}
          onRequestUploadProof={handleRequestUploadProof}
          onRequestGatewayRedirect={handleRequestGatewayRedirect}
          onCancelBooking={() => void handleCancelBooking()}
          onBackToHome={() => router.push("/")}
          onProofFileChange={handleProofFileChange}
        />
      </div>

      <ConfirmModal
        open={showUploadConfirm}
        title={copy.confirmUploadTitle}
        description={copy.confirmUploadDescription}
        onCancel={() => setShowUploadConfirm(false)}
        onConfirm={() => (setShowUploadConfirm(false), void handleUploadProof())}
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
        onConfirm={() => (setShowGatewayConfirm(false), handleOpenXenditInvoice())}
        loading={redirectingToGateway}
        confirmLabel={copy.confirmGatewayButton}
        cancelLabel={copy.cancelAction}
        busyLabel={copy.redirecting}
      />
    </div>
  );
};
