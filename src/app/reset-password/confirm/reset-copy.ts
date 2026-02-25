import type { AppLocale } from "@/lib/app-locale";

export const RESET_CONFIRM_COPY = {
  id: {
    tokenRequired: "Token atur ulang wajib diisi.",
    passwordMin: "Password baru minimal 8 karakter.",
    confirmMismatch: "Konfirmasi password tidak sama.",
    failed: "Atur ulang password gagal.",
    title: "Konfirmasi Atur Ulang Password",
    resetToken: "Token Atur Ulang",
    pasteToken: "Tempel token atur ulang",
    newPassword: "Password Baru",
    min8: "Minimal 8 karakter",
    confirmPassword: "Konfirmasi Password",
    repeatNew: "Ulangi password baru",
    processing: "Memproses...",
    resetAction: "Atur Ulang Password",
    resendReset: "Kirim ulang link atur ulang",
  },
  en: {
    tokenRequired: "Reset token is required.",
    passwordMin: "New password must be at least 8 characters.",
    confirmMismatch: "Password confirmation does not match.",
    failed: "Password reset failed.",
    title: "Confirm Password Reset",
    resetToken: "Reset Token",
    pasteToken: "Paste reset token",
    newPassword: "New Password",
    min8: "Minimum 8 characters",
    confirmPassword: "Confirm Password",
    repeatNew: "Repeat new password",
    processing: "Processing...",
    resetAction: "Reset Password",
    resendReset: "Resend reset link",
  },
} as const;

export const getResetConfirmCopy = (locale: AppLocale) =>
  RESET_CONFIRM_COPY[locale];

export type ResetConfirmCopy =
  (typeof RESET_CONFIRM_COPY)[keyof typeof RESET_CONFIRM_COPY];
