"use client";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-teal-200/70 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-sky-200/70 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-grid-slate" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-linear-to-br from-white via-slate-50 to-slate-100/70 p-8 shadow-2xl shadow-slate-200/70">
          <div className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              BookIn
            </p>
            <p className="text-sm text-slate-500">
              Yuk Liburan,kerja mulu nanti tipes !
            </p>
          </div>

          <form className="mt-8 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Login
              </label>
              <input
                type="email"
                placeholder="Masukkan Email anda"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Password
              </label>
              <input
                type="password"
                placeholder="Masukkan password anda"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-base">
                G
              </span>
              Lanjutkan dengan Google
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              atau
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="space-y-3">
            <button className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
              Daftar
            </button>
            <button className="w-full rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
              Sewakan Properti
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Dengan masuk, Anda menyetujui Kebijakan Privasi BookIn.
          </p>
        </div>
        <a
          href="/"
          className="fixed bottom-6 right-6 z-20 rounded-full border border-white/60 bg-white/80 px-5 py-2 text-sm font-semibold text-slate-700 shadow-lg shadow-slate-200/70 backdrop-blur transition hover:border-white/80 hover:text-slate-900"
        >
          Home
        </a>
      </main>
    </div>
  );
}
