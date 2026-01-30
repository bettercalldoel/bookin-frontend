import { redirect } from "next/navigation";
import { getServerMe } from "@/lib/auth-server";

export default async function ProfilePage() {
  const me = await getServerMe();

  if (!me) {
    redirect("/?auth=required");
  }

  if (!me.emailVerifiedAt) {
    redirect("/?auth=unverified");
  }

  if (me.type !== "USER") {
    redirect("/?auth=forbidden");
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
            Profil User
          </p>
          <h1 className="mt-3 text-2xl font-semibold">{me.name}</h1>
          <p className="mt-2 text-sm text-slate-500">{me.email}</p>
          <div className="mt-6 grid gap-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-900">Status Verifikasi</p>
              <p>
                {me.emailVerifiedAt ? "Terverifikasi" : "Belum terverifikasi"}
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Role</p>
              <p>{me.type}</p>
            </div>
          </div>
        </div>

        <a
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
        >
          Kembali ke Beranda
        </a>
      </div>
    </div>
  );
}
