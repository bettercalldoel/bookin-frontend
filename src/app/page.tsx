"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    title: "Weekend Escape yang Lebih Hemat",
    subtitle: "Hemat hingga 25% untuk pemesanan 2 malam atau lebih.",
    description:
      "Nikmati pilihan properti kurasi terbaik dengan lokasi premium dan fasilitas lengkap.",
    overlay: "from-black/50 via-black/25 to-black/10",
    image: "/images/property-1.jpg",
    stats: ["Batal gratis", "Konfirmasi instan", "Harga transparan"],
  },
  {
    title: "Pengalaman Staycation Premium",
    subtitle: "Kamar luas, pemandangan kota, dan layanan 24 jam.",
    description:
      "BookIn menghadirkan opsi akomodasi favorit untuk perjalanan bisnis maupun liburan keluarga.",
    overlay: "from-black/50 via-black/25 to-black/10",
    image: "/images/property-2.jpg",
    stats: ["Sarapan premium", "Wi-Fi cepat", "Layanan antar jemput"],
  },
  {
    title: "Destinasi Favorit Sepanjang Tahun",
    subtitle: "Eksplor kota populer dengan promo khusus member.",
    description:
      "Dapatkan rekomendasi destinasi yang relevan dengan preferensi dan jadwal Anda.",
    overlay: "from-black/50 via-black/25 to-black/10",
    image: "/images/property-3.jpg",
    stats: ["Pilihan fleksibel", "Point reward", "Support 24/7"],
  },
];

const destinations = [
  "Jakarta",
  "Bandung",
  "Yogyakarta",
  "Surabaya",
  "Bali",
  "Labuan Bajo",
  "Makassar",
];

const properties = [
  {
    name: "Skyline Executive Suites",
    location: "Sudirman, Jakarta",
    price: "Rp 1.450.000 / malam",
    rating: "4.9",
    tag: "Bisnis",
  },
  {
    name: "Oceanview Serenity Villas",
    location: "Uluwatu, Bali",
    price: "Rp 2.850.000 / malam",
    rating: "4.8",
    tag: "Pantai",
  },
  {
    name: "Heritage City Boutique",
    location: "Malioboro, Yogyakarta",
    price: "Rp 980.000 / malam",
    rating: "4.7",
    tag: "Budaya",
  },
  {
    name: "Alpine Lake Retreat",
    location: "Lembang, Bandung",
    price: "Rp 1.250.000 / malam",
    rating: "4.8",
    tag: "Pegunungan",
  },
  {
    name: "Harborfront Loft Hotel",
    location: "Tunjungan, Surabaya",
    price: "Rp 1.150.000 / malam",
    rating: "4.6",
    tag: "Kota",
  },
  {
    name: "Sunset Horizon Resort",
    location: "Labuan Bajo",
    price: "Rp 2.300.000 / malam",
    rating: "4.9",
    tag: "Liburan",
  },
];

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(id);
  }, []);

  const handlePrev = () => {
    setActiveSlide((current) =>
      current === 0 ? slides.length - 1 : current - 1,
    );
  };

  const handleNext = () => {
    setActiveSlide((current) => (current + 1) % slides.length);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-teal-200/70 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-sky-200/70 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-grid-slate" />

      <header className="relative z-10">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:rounded-full md:border md:border-white/60 md:bg-white/70 md:shadow-lg md:shadow-slate-200/70 md:backdrop-blur">
          <div>
            <p className="text-lg font-semibold">BookIn</p>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a className="transition hover:text-slate-900" href="#hero">
              Beranda
            </a>
            <a className="transition hover:text-slate-900" href="#search">
              Cari Properti
            </a>
            <a className="transition hover:text-slate-900" href="#properties">
              Properti
            </a>
            <a className="transition hover:text-slate-900" href="#support">
              Bantuan
            </a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:text-slate-900 md:hidden"
              aria-label="Buka menu"
            >
              <span className="flex flex-col gap-1.5">
                <span className="h-0.5 w-5 rounded-full bg-slate-900" />
                <span className="h-0.5 w-5 rounded-full bg-slate-900" />
                <span className="h-0.5 w-5 rounded-full bg-slate-900" />
              </span>
            </button>
            <a
              href="/login"
              className="hidden rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 md:inline-flex"
            >
              Masuk
            </a>
          </div>
        </nav>
      </header>

      <div
        className={`fixed inset-0 z-20 bg-slate-900/40 transition ${
          isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={handleCloseSidebar}
        aria-hidden={!isSidebarOpen}
      />
      <aside
        className={`fixed right-0 top-0 z-30 h-full w-72 border-l border-slate-200 bg-white/90 px-5 py-6 shadow-xl backdrop-blur transition-transform ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isSidebarOpen}
      >
        <div className="flex items-center justify-end">
          <button
            onClick={handleCloseSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="Tutup menu"
          >
            ✕
          </button>
        </div>
        <nav className="mt-5 flex flex-col gap-2 text-sm font-semibold text-slate-700">
          {[
            { label: "Beranda", href: "#hero" },
            { label: "Cari Properti", href: "#search" },
            { label: "Properti", href: "#properties" },
            { label: "Bantuan", href: "#support" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={handleCloseSidebar}
              className="rounded-2xl border border-transparent px-3 py-2 transition hover:border-slate-200 hover:bg-slate-50"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-6">
          <a
            href="/login"
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Masuk
          </a>
        </div>
      </aside>

      <main className="relative z-10">
        <section id="hero" className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8">
          <div className="flex flex-col gap-12">
            <div className="relative">
              <div className="rounded-[32px] border border-slate-200/80 bg-gradient-to-br from-white/95 via-slate-50 to-slate-100/80 p-7 shadow-2xl shadow-slate-200/80 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div />
                </div>

                <div className="relative mt-6 h-80 overflow-hidden md:h-96">
                  {slides.map((slide, index) => (
                    <div
                      key={slide.title}
                      className={`absolute inset-0 rounded-3xl border border-white/15 p-7 text-white transition-all duration-700 ${
                        index === activeSlide
                          ? "translate-y-0 opacity-100"
                          : "translate-y-4 opacity-0"
                      }`}
                      aria-hidden={index !== activeSlide}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${slide.image})` }}
                      />
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${slide.overlay}`}
                      />
                      <div className="relative z-10 flex h-full flex-col justify-between drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]">
                        <div className="space-y-3">
                          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">
                            Highlight
                          </p>
                          <h2 className="text-2xl font-semibold leading-tight">
                            {slide.title}
                          </h2>
                          <p className="text-sm text-white/85">{slide.subtitle}</p>
                          <p className="text-sm text-white/80">
                            {slide.description}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {slide.stats.map((item) => (
                            <span
                              key={item}
                              className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    {slides.map((_, index) => (
                      <button
                        key={`dot-${index}`}
                        onClick={() => setActiveSlide(index)}
                        className={`h-2.5 w-8 rounded-full transition ${
                          index === activeSlide
                            ? "bg-slate-900"
                            : "bg-slate-200"
                        }`}
                        aria-label={`Slide ${index + 1}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    {activeSlide + 1} / {slides.length}
                  </p>
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-10 left-1/2 h-24 w-72 -translate-x-1/2 rounded-full bg-teal-200/70 blur-3xl" />
            </div>

            <div className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { title: "1200+", label: "Properti terverifikasi" },
                  { title: "98%", label: "Tamu puas" },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-slate-100/80 px-5 py-4 shadow-md shadow-slate-200/80"
                  >
                    <p className="text-xl font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <p className="text-sm text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="search" className="mx-auto w-full max-w-6xl px-6 pb-16">
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-slate-100/70 p-8 shadow-2xl shadow-slate-200/70">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                  Form destinasi
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Pilih kota tujuan dan tanggal perjalanan Anda
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Gunakan kalender untuk memilih tanggal berangkat serta durasi menginap.
                </p>
              </div>
              <button className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                Cari properti
              </button>
            </div>
            <form className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Kota destinasi
                </label>
                <select className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none">
                  {destinations.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Tanggal berangkat
                </label>
                <input
                  type="date"
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Durasi (malam)
                </label>
                <input
                  type="number"
                  min={1}
                  defaultValue={2}
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
            </form>
          </div>
        </section>

        <section id="properties" className="mx-auto w-full max-w-6xl px-6 pb-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Property list
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                Properti pilihan dengan lokasi strategis
              </h2>
            </div>
            <button className="rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
              Lihat semua properti
            </button>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <article
                key={property.name}
                className="group rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-slate-100/80 p-5 shadow-md shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-40 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 via-white to-slate-200">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.25),_transparent_60%)]" />
                  <div className="absolute bottom-4 left-4 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    {property.tag}
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {property.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {property.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                      <span>&#9733;</span>
                      {property.rating}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {property.price}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full border border-slate-200 px-3 py-1">
                      Sarapan
                    </span>
                    <span className="rounded-full border border-slate-200 px-3 py-1">
                      Wi-Fi
                    </span>
                    <span className="rounded-full border border-slate-200 px-3 py-1">
                      Free cancel
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer id="support" className="relative z-10 border-t border-slate-200 bg-white/80">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <p className="text-lg font-semibold text-slate-900">Tentang BookIn</p>
            <p className="text-sm text-slate-500">
              Aplikasi pemesanan akomodasi dengan kurasi properti terbaik dan proses
              booking yang transparan.
            </p>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Fitur Utama
            </p>
            <p>Pencarian destinasi & kalender terpadu</p>
            <p>Rekomendasi properti terverifikasi</p>
            <p>Ringkasan harga real-time</p>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Informasi
            </p>
            <p>Jam layanan: 08.00 - 22.00 WIB</p>
            <p>Email: support@bookin.id</p>
            <p>WhatsApp: +62 812-3456-7890</p>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Navigasi
            </p>
            <a className="block transition hover:text-slate-900" href="#hero">
              Beranda
            </a>
            <a className="block transition hover:text-slate-900" href="#search">
              Pencarian
            </a>
            <a className="block transition hover:text-slate-900" href="#properties">
              Properti
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
