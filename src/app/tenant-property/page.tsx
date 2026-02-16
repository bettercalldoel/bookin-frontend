import { redirect } from "next/navigation";
import { getServerMe } from "@/lib/auth-server";
import TenantPropertyForm from "@/components/tenant-property-form";

export default async function TenantPropertyPage() {
  const me = await getServerMe();

  if (!me) {
    redirect("/?auth=required");
  }

  if (!me.emailVerifiedAt) {
    redirect("/?auth=unverified");
  }

  if (me.type !== "TENANT") {
    redirect("/?auth=forbidden");
  }

  return (
    <div className="relative min-h-screen bg-slate-50 py-16 text-slate-900">
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-teal-200/70 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-sky-200/70 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-grid-slate" />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur sm:p-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
            
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                Daftarkan properti mu disini.
              </h1>
            
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
              Akun: {me.email}
            </div>
          </div>

          <TenantPropertyForm
            showManagement={false}
            showRoomManagement={false}
            redirectOnCreateTo="/"
          />
        </div>
      </main>
    </div>
  );
}
