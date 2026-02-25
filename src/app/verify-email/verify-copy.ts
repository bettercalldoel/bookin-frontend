import type { AppLocale } from "@/lib/app-locale";

export const VERIFY_EMAIL_COPY = {
  id: {
    nameMin: "Nama minimal 2 karakter.",
    missingToken: "Token verifikasi tidak ditemukan. Silakan buka link dari email.",
    passwordMin: "Password minimal 8 karakter.",
    confirmMismatch: "Konfirmasi password tidak sama.",
    failed: "Verifikasi gagal.",
    title: "Lengkapi Akun",
    subtitle: "Isi nama dan buat password untuk menyelesaikan verifikasi.",
    name: "Nama",
    fullNamePlaceholder: "Masukkan nama lengkap",
    password: "Password",
    passwordPlaceholder: "Masukkan password",
    confirmPassword: "Konfirmasi Password",
    confirmPlaceholder: "Ulangi password",
    processing: "Memproses...",
    save: "Simpan",
    alreadyHave: "Sudah punya akun?",
    login: "Masuk",
  },
  en: {
    nameMin: "Name must be at least 2 characters.",
    missingToken: "Verification token is missing. Please open the link from email.",
    passwordMin: "Password must be at least 8 characters.",
    confirmMismatch: "Password confirmation does not match.",
    failed: "Verification failed.",
    title: "Complete Account",
    subtitle: "Fill in your name and create password to complete verification.",
    name: "Name",
    fullNamePlaceholder: "Enter full name",
    password: "Password",
    passwordPlaceholder: "Enter password",
    confirmPassword: "Confirm Password",
    confirmPlaceholder: "Repeat password",
    processing: "Processing...",
    save: "Save",
    alreadyHave: "Already have an account?",
    login: "Sign in",
  },
} as const;

export const getVerifyEmailCopy = (locale: AppLocale) =>
  VERIFY_EMAIL_COPY[locale];

export type VerifyEmailCopy =
  (typeof VERIFY_EMAIL_COPY)[keyof typeof VERIFY_EMAIL_COPY];
