import type { ReactNode } from "react";

type UserProfileShellProps = {
  children: ReactNode;
};

export function UserProfileShell({ children }: UserProfileShellProps) {
  return (
    <div className="relative min-h-screen bg-slate-50 py-10 text-slate-900 sm:py-16">
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-teal-200/70 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-sky-200/70 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-grid-slate" />
      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-2xl shadow-slate-200/70 backdrop-blur sm:rounded-[32px] sm:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
