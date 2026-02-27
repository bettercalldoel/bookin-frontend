"use client";

import { useSearchParams } from "next/navigation";
import type { HomeCopy } from "./home-copy";

type Props = {
  copy: HomeCopy;
};

export const HomeAuthNotice = ({ copy }: Props) => {
  const searchParams = useSearchParams();
  const authReason = searchParams.get("auth");
  if (!authReason) return null;
  return (
    <div className="relative z-10 mx-auto mt-6 w-full max-w-7xl px-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        {authReason === "required" && copy.authRequired}
        {authReason === "unverified" && copy.authUnverified}
        {authReason === "forbidden" && copy.authForbidden}
      </div>
    </div>
  );
};
