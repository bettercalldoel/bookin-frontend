"use client";

import { useAppLocaleValue } from "@/hooks/use-app-locale";
import { BookingPageContent } from "./booking-page-content";

export default function BookingPage() {
  const locale = useAppLocaleValue();
  return <BookingPageContent locale={locale} />;
}
