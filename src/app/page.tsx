"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import { clearAuthToken, getAuthToken } from "@/lib/auth-client";
import {
  BUTTON_THEME,
  HOMEPAGE_PRIMARY_BUTTON,
  INPUT_THEME,
} from "@/lib/button-theme";

const fallbackCarouselImages = [
  "/images/property-1.jpg",
  "/images/property-2.jpg",
  "/images/property-3.jpg",
];

const carouselImages = (process.env.NEXT_PUBLIC_CAROUSEL_IMAGES ?? "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const slides = [
  {
    title: "Liburan Akhir Pekan Lebih Hemat",
    subtitle: "Hemat hingga 25% untuk pemesanan 2 malam atau lebih.",
    description:
      "Nikmati pilihan properti kurasi terbaik dengan lokasi premium dan fasilitas lengkap.",
    overlay: "from-black/50 via-black/25 to-black/10",
    image: carouselImages[0] ?? fallbackCarouselImages[0],
    stats: ["Batal gratis", "Konfirmasi instan", "Harga transparan"],
  },
  {
    title: "Pengalaman Staycation Premium",
    subtitle: "Kamar luas, pemandangan kota, dan layanan 24 jam.",
    description:
      "BookIn menghadirkan opsi akomodasi favorit untuk perjalanan bisnis maupun liburan keluarga.",
    overlay: "from-black/50 via-black/25 to-black/10",
    image: carouselImages[1] ?? fallbackCarouselImages[1],
    stats: ["Sarapan premium", "Wi-Fi cepat", "Layanan antar jemput"],
  },
  {
    title: "Destinasi Favorit Sepanjang Tahun",
    subtitle: "Eksplor kota populer dengan promo khusus member.",
    description:
      "Dapatkan rekomendasi destinasi yang relevan dengan preferensi dan jadwal Anda.",
    overlay: "from-black/50 via-black/25 to-black/10",
    image: carouselImages[2] ?? fallbackCarouselImages[2],
    stats: ["Pilihan fleksibel", "Poin reward", "Layanan 24/7"],
  },
];

type PublicCity = {
  id: string;
  name: string;
  province?: string | null;
};

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

const propertyVisuals = [
  {
    gradient: "from-emerald-100 via-white to-cyan-100",
    glow: "bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.28),transparent_62%)]",
  },
  {
    gradient: "from-amber-100 via-white to-orange-100",
    glow: "bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.26),transparent_62%)]",
  },
  {
    gradient: "from-sky-100 via-white to-blue-100",
    glow: "bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.24),transparent_62%)]",
  },
] as const;

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultSearchForm = () => {
  const start = new Date();
  return {
    cityId: "",
    startDate: formatLocalDate(start),
    nights: 2,
    adults: 2,
    children: 0,
    rooms: 1,
  };
};

const addDays = (value: string, days: number) => {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
};

export default function Home() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userType, setUserType] = useState<"USER" | "TENANT" | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const isTenant = userType === "TENANT";
  const [searchForm, setSearchForm] = useState(() => getDefaultSearchForm());
  const [publicCities, setPublicCities] = useState<PublicCity[]>([]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const updatePosition = () => {
      if (!userMenuButtonRef.current) return;
      const rect = userMenuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    };
    updatePosition();
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-user-menu]")) {
        return;
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isUserMenuOpen]);

  const handleSearchSubmit = () => {
    const params = new URLSearchParams();
    if (searchForm.cityId) {
      params.set("city_id", searchForm.cityId);
    }
    params.set("start_date", searchForm.startDate);
    const nights = Math.max(1, Math.min(30, searchForm.nights));
    params.set("nights", String(nights));
    const endDate = addDays(searchForm.startDate, nights);
    if (endDate) {
      params.set("end_date", endDate);
    }
    params.set("adults", String(searchForm.adults));
    params.set("children", String(searchForm.children));
    params.set("rooms", String(searchForm.rooms));
    params.set("page", "1");
    router.push(`/search?${params.toString()}`);
  };

  useEffect(() => {
    const loadPublicCities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/properties/cities?limit=300`);
        if (!response.ok) return;
        const payload = (await response.json()) as PublicCity[];
        if (!Array.isArray(payload)) return;
        setPublicCities(
          payload
            .filter((item): item is PublicCity => {
              return (
                typeof item?.id === "string" &&
                item.id.trim().length > 0 &&
                typeof item?.name === "string" &&
                item.name.trim().length > 0
              );
            })
            .map((item) => ({
              id: item.id,
              name: item.name.trim(),
              province: item.province?.trim() || null,
            })),
        );
      } catch {
        setPublicCities([]);
      }
    };

    loadPublicCities();
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    let isMounted = true;

    apiFetch<{ name: string; type: "USER" | "TENANT" }>("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((data) => {
        if (isMounted) {
          setUserName(data.name);
          setUserType(data.type);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUserName(null);
          setUserType(null);
        }
      });

    return () => {
      isMounted = false;
    };
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

  const handleLogout = () => {
    clearAuthToken();
    setUserName(null);
    setUserType(null);
    setIsUserMenuOpen(false);
    window.location.href = "/";
  };

  const navItems = isTenant
    ? [
        { label: "Beranda", href: "#hero" },
        { label: "Sewakan Properti", href: "/tenant-property" },
        { label: "Bantuan", href: "#support" },
      ]
    : [
        { label: "Beranda", href: "#hero" },
        { label: "Cari Properti", href: "#search" },
        { label: "Properti", href: "#properties" },
        { label: "Bantuan", href: "#support" },
      ];
  const selectedCity =
    publicCities.find((city) => city.id === searchForm.cityId) ?? null;
  const estimatedCheckOut = addDays(
    searchForm.startDate,
    Math.max(1, searchForm.nights),
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent text-slate-900">
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-teal-200/60 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-cyan-200/55 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-1/3 h-64 w-64 rounded-full bg-amber-200/35 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-grid-slate" />

      <header className="fixed inset-x-0 top-0 z-[200]">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:rounded-full md:border md:border-white/65 md:bg-white/78 md:shadow-[0_20px_40px_-28px_rgba(15,23,42,0.55)] md:backdrop-blur">
          <div>
            <p className="font-display text-xl font-semibold text-slate-900">
              BookIn
            </p>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                className="transition hover:text-cyan-800"
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900 md:hidden"
              aria-label="Buka menu"
            >
              <span className="flex flex-col gap-1.5">
                <span className="h-0.5 w-5 rounded-full bg-cyan-900" />
                <span className="h-0.5 w-5 rounded-full bg-cyan-900" />
                <span className="h-0.5 w-5 rounded-full bg-cyan-900" />
              </span>
            </button>
            {userName ? (
              <div
                ref={userMenuRef}
                data-user-menu
                className="relative hidden items-center gap-2 md:flex"
              >
                <span className="rounded-full bg-linear-to-r from-cyan-900 to-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                  Halo, {userName}
                </span>
                <button
                  type="button"
                  ref={userMenuButtonRef}
                  onClick={() => setIsUserMenuOpen((current) => !current)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-900"
                >
                  Menu
                </button>
                {isUserMenuOpen && menuPosition
                  ? createPortal(
                      <div
                        data-user-menu
                        className="fixed z-[1000] w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/15"
                        style={{
                          top: menuPosition.top,
                          right: menuPosition.right,
                        }}
                      >
                        {isTenant ? (
                          <a
                            href="/tenant-dashboard"
                            className="block px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-cyan-50"
                          >
                            Dashboard Tenant
                          </a>
                        ) : (
                          <>
                              <a
                                href="/profile"
                                className="block px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-cyan-50"
                              >
                                Profil Saya
                              </a>
                              <a
                                href="/my-transaction"
                                className="block px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-cyan-50"
                              >
                                Transaksi Saya
                              </a>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="block w-full px-4 py-3 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          Keluar
                        </button>
                      </div>,
                      document.body,
                    )
                  : null}
              </div>
            ) : (
              <a
                href="/login"
                className="hidden rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900 md:inline-flex"
              >
                Masuk
              </a>
            )}
          </div>
        </nav>
      </header>
      <Suspense fallback={null}>
        <AuthNotice />
      </Suspense>

      <div
        className={`fixed inset-0 z-20 bg-slate-900/40 transition ${
          isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={handleCloseSidebar}
        aria-hidden={!isSidebarOpen}
      />
      <aside
        className={`fixed right-0 top-0 z-30 h-full w-72 border-l border-slate-200 bg-white/92 px-5 py-6 shadow-xl backdrop-blur transition-transform ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isSidebarOpen}
      >
        <div className="flex items-center justify-end">
          <button
            onClick={handleCloseSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-cyan-300 hover:text-cyan-900"
            aria-label="Tutup menu"
          >
            ✕
          </button>
        </div>
        <nav className="mt-5 flex flex-col gap-2 text-sm font-semibold text-slate-700">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={handleCloseSidebar}
              className="rounded-2xl border border-transparent px-3 py-2 transition hover:border-cyan-200 hover:bg-cyan-50"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-6">
          {userName ? (
            <div className="space-y-2">
              <div className="rounded-full bg-linear-to-r from-cyan-900 to-teal-800 px-4 py-2 text-center text-sm font-semibold text-white">
                Halo, {userName}
              </div>

              {isTenant ? (
                <a
                  href="/tenant-dashboard"
                  onClick={handleCloseSidebar}
                  className="block rounded-full border border-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900"
                >
                  Dashboard Tenant
                </a>
              ) : (
                <>
                  <a
                    href="/profile"
                    onClick={handleCloseSidebar}
                    className="block rounded-full border border-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900"
                  >
                    Profil Saya
                  </a>
                  <a
                    href="/my-transaction"
                    onClick={handleCloseSidebar}
                    className="block rounded-full border border-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900"
                  >
                    Transaksi Saya
                  </a>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  handleCloseSidebar();
                  handleLogout();
                }}
                className="w-full rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-900"
              >
                Keluar
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900"
            >
              Masuk
            </a>
          )}
        </div>
      </aside>

      <main className="relative z-0 pt-24 md:pt-28">
        <section id="hero" className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8">
          <div className="flex flex-col gap-12">
            <div className="relative animate-rise-in">
              <div className="surface-panel rounded-4xl p-7 backdrop-blur">
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
                        className={`absolute inset-0 bg-linear-to-br ${slide.overlay}`}
                      />
                      <div className="relative z-10 flex h-full flex-col justify-between drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]">
                        <div className="space-y-3">
                          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">
                            Pilihan Editor
                          </p>
                          <h2 className="font-display text-3xl leading-tight md:text-4xl">
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
                            ? "bg-cyan-800"
                            : "bg-slate-300"
                        }`}
                        aria-label={`Slide ke-${index + 1}`}
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
                    className="surface-panel animate-rise-in rounded-2xl px-5 py-4"
                    style={{
                      animationDelay: item.title === "1200+" ? "90ms" : "170ms",
                    }}
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

        {!isTenant ? (
          <>
            <section id="search" className="mx-auto w-full max-w-6xl px-6 pb-16">
              <div className="surface-panel animate-rise-in rounded-3xl p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                      Form destinasi
                    </p>
                    <h2 className="font-display mt-2 text-3xl text-slate-900">
                      Pilih kota tujuan dan tanggal perjalanan Anda
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Gunakan kalender untuk memilih tanggal berangkat serta durasi menginap.
                    </p>
                    {selectedCity && (
                      <p className="mt-1 text-xs text-slate-500">
                        Destinasi terpilih: {selectedCity.name}
                        {selectedCity.province ? `, ${selectedCity.province}` : ""}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className={`${HOMEPAGE_PRIMARY_BUTTON} ${BUTTON_THEME.solid}`}
                  >
                    Cari properti
                  </button>
                </div>
                <form
                  className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-6"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSearchSubmit();
                  }}
                >
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Kota destinasi
                    </label>
                    <select
                      value={searchForm.cityId}
                      onChange={(event) =>
                        setSearchForm((prev) => ({
                          ...prev,
                          cityId: event.target.value,
                        }))
                      }
                      className={`h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm ${INPUT_THEME.focus}`}
                    >
                      <option value="">Semua kota</option>
                      {publicCities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.province ? `${city.name}, ${city.province}` : city.name}
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
                      value={searchForm.startDate}
                      onChange={(event) =>
                        setSearchForm((prev) => ({
                          ...prev,
                          startDate: event.target.value,
                        }))
                      }
                      className={`h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm ${INPUT_THEME.focus}`}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Durasi
                    </label>
                    <select
                      value={String(searchForm.nights)}
                      onChange={(event) =>
                        setSearchForm((prev) => ({
                          ...prev,
                          nights: Math.max(1, Number(event.target.value) || 1),
                        }))
                      }
                      className={`h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm ${INPUT_THEME.focus}`}
                    >
                      {Array.from({ length: 30 }, (_, index) => index + 1).map(
                        (night) => (
                          <option key={night} value={night}>
                            {night} malam
                          </option>
                        ),
                      )}
                    </select>
                    <p className="text-xs text-slate-500">
                      Check-out: {estimatedCheckOut || "-"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Dewasa
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={searchForm.adults}
                      onChange={(event) =>
                        setSearchForm((prev) => ({
                          ...prev,
                          adults: Number(event.target.value),
                        }))
                      }
                      className={`h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm ${INPUT_THEME.focus}`}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Anak
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={searchForm.children}
                      onChange={(event) =>
                        setSearchForm((prev) => ({
                          ...prev,
                          children: Number(event.target.value),
                        }))
                      }
                      className={`h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm ${INPUT_THEME.focus}`}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Kamar
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={searchForm.rooms}
                      onChange={(event) =>
                        setSearchForm((prev) => ({
                          ...prev,
                          rooms: Number(event.target.value),
                        }))
                      }
                      className={`h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm ${INPUT_THEME.focus}`}
                    />
                  </div>
                </form>
              </div>
            </section>

            <section id="properties" className="mx-auto w-full max-w-6xl px-6 pb-16">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">
                    Daftar Properti
                  </p>
                  <h2 className="font-display mt-2 text-4xl text-slate-900">
                    Properti pilihan dengan lokasi strategis
                  </h2>
                </div>
                <button className="rounded-full border border-slate-200 bg-white/80 px-6 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900">
                  Lihat semua properti
                </button>
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {properties.map((property, index) => (
                  <article
                    key={property.name}
                    className="surface-panel animate-rise-in group rounded-3xl p-5 transition hover:-translate-y-1 hover:shadow-xl"
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <div
                      className={`relative h-40 overflow-hidden rounded-2xl bg-linear-to-br ${propertyVisuals[index % propertyVisuals.length].gradient}`}
                    >
                      <div
                        className={`absolute inset-0 ${propertyVisuals[index % propertyVisuals.length].glow}`}
                      />
                      <div className="absolute bottom-4 left-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
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
                      <p className="text-sm font-semibold text-cyan-900">
                        {property.price}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full border border-cyan-100 bg-white/90 px-3 py-1">
                          Sarapan
                        </span>
                        <span className="rounded-full border border-cyan-100 bg-white/90 px-3 py-1">
                          Wi-Fi
                        </span>
                        <span className="rounded-full border border-cyan-100 bg-white/90 px-3 py-1">
                          Pembatalan gratis
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section id="lease" className="mx-auto w-full max-w-6xl px-6 pb-16">
            <div className="surface-panel animate-rise-in rounded-3xl p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                    Sewakan Properti
                  </p>
                  <h2 className="font-display text-3xl text-slate-900">
                    Kelola properti dan jadwal ketersediaan Anda dalam satu
                    dasbor
                  </h2>
                  <p className="text-sm text-slate-500">
                    Tambahkan properti baru, lengkapi detail, dan mulai menerima
                    pemesanan dari pelanggan BookIn.
                  </p>
                </div>
                <a
                  href="/tenant-property"
                  className={`inline-flex items-center justify-center ${HOMEPAGE_PRIMARY_BUTTON} ${BUTTON_THEME.solid}`}
                >
                  Isi Detail Properti
                </a>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Lengkapi Profil Properti",
                    desc: "Isi kategori, alamat, serta deskripsi yang menarik.",
                  },
                  {
                    title: "Atur Foto & Media",
                    desc: "Unggah foto cover dan galeri untuk meningkatkan konversi.",
                  },
                  {
                    title: "Siap Menerima Pesanan",
                    desc: "Aktifkan properti agar langsung tampil di aplikasi.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200/80 bg-white/88 px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer
        id="support"
        className="relative z-10 border-t border-slate-200 bg-white/82 backdrop-blur"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <p className="font-display text-2xl text-slate-900">Tentang BookIn</p>
            <p className="text-sm text-slate-500">
              Aplikasi pemesanan akomodasi dengan kurasi properti terbaik dan proses
              pemesanan yang transparan.
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

function AuthNotice() {
  const searchParams = useSearchParams();
  const authReason = searchParams.get("auth");

  if (!authReason) return null;

  return (
    <div className="relative z-10 mx-auto mt-6 w-full max-w-6xl px-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        {authReason === "required" &&
          "Silakan login terlebih dahulu untuk mengakses halaman tersebut."}
        {authReason === "unverified" &&
          "Akun Anda belum terverifikasi. Silakan verifikasi email terlebih dahulu."}
        {authReason === "forbidden" &&
          "Anda tidak memiliki akses ke halaman tersebut."}
      </div>
    </div>
  );
}
