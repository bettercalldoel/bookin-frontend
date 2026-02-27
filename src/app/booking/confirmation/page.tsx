"use client";

import { Suspense } from "react";
import { BookingConfirmationContent } from "./confirmation-content";

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <BookingConfirmationContent />
    </Suspense>
  );
}
