"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import { clearAuthToken, getAuthToken } from "@/lib/auth-client";
import { HOME_COPY } from "./home-copy";
import { HomeAuthNotice } from "./home-auth-notice";
import { HomeFooter } from "./home-footer";
import { HomeGuestSections } from "./home-guest-sections";
import { HomeHeader } from "./home-header";
import { HomeSidebar } from "./home-sidebar";
import { HomeTenantSection } from "./home-tenant-section";
import type { HomeHeroSlide, HomeLocale, HomePropertyCard, HomeSearchItem, HomeSearchResponse, HomeSearchForm, PublicCategory, PublicCity, PublicCityListResponse } from "./home-types";
import { ALL_CATEGORY_KEY, HOME_LOCALE_STORAGE_KEY, FALLBACK_HOME_IMAGES, addDays, clamp, formatSearchDate, getDefaultSearchForm, mapHomeItems } from "./home-utils";

export const HomePageContent = () => {
  const router = useRouter();
  const [locale, setLocale] = useState<HomeLocale>("id");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userType, setUserType] = useState<"USER" | "TENANT" | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [searchForm, setSearchForm] = useState<HomeSearchForm>(() => getDefaultSearchForm());
  const [publicCities, setPublicCities] = useState<PublicCity[]>([]);
  const [publicCategories, setPublicCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY_KEY);
  const [homeProperties, setHomeProperties] = useState<HomePropertyCard[]>([]);
  const [homeTotalProperties, setHomeTotalProperties] = useState(0);
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeError, setHomeError] = useState<string | null>(null);
  const [homeDestinationNotice, setHomeDestinationNotice] = useState<string | null>(null);
  const [debouncedDestination, setDebouncedDestination] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [openSearchPanel, setOpenSearchPanel] = useState<"when" | "who" | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const copy = HOME_COPY[locale];
  const isTenant = userType === "TENANT";
  const discoveryCategories = useMemo(() => [ALL_CATEGORY_KEY, ...Array.from(new Set(publicCategories))], [publicCategories]);
  const heroSlides = useMemo<HomeHeroSlide[]>(() => homeProperties.length === 0 ? [{ id: "home-default", title: copy.defaultHeroTitle, subtitle: homeLoading ? copy.defaultHeroLoadingSubtitle : copy.defaultHeroEmptySubtitle, description: copy.defaultHeroDescription, image: FALLBACK_HOME_IMAGES[0], badge: "BookIn" }] : homeProperties.slice(0, 3).map((property) => ({ id: property.id, title: property.name, subtitle: property.location, description: property.minPrice !== null ? `${copy.defaultHeroPricePrefix} ${property.minPriceLabel} ${copy.defaultHeroPriceSuffix}` : copy.defaultHeroNoPrice, image: property.image, badge: property.category })), [copy, homeLoading, homeProperties]);

  useEffect(() => { const stored = window.localStorage.getItem(HOME_LOCALE_STORAGE_KEY); if (stored === "id" || stored === "en") setLocale(stored); }, []);
  useEffect(() => { window.localStorage.setItem(HOME_LOCALE_STORAGE_KEY, locale); document.documentElement.lang = locale; }, [locale]);
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedDestination(searchForm.destination.trim()), 450); return () => window.clearTimeout(timer); }, [searchForm.destination]);
  useEffect(() => { if (activeCategory !== ALL_CATEGORY_KEY && !discoveryCategories.includes(activeCategory)) setActiveCategory(ALL_CATEGORY_KEY); }, [activeCategory, discoveryCategories]);
  useEffect(() => { if (activeSlide >= heroSlides.length) setActiveSlide(0); }, [activeSlide, heroSlides.length]);
  useEffect(() => { if (isTenant || heroSlides.length <= 1) return; const id = window.setInterval(() => setActiveSlide((current) => (current + 1) % heroSlides.length), 5500); return () => window.clearInterval(id); }, [heroSlides.length, isTenant]);
  useEffect(() => { if (!isUserMenuOpen) return; const updatePosition = () => { if (!userMenuButtonRef.current) return; const rect = userMenuButtonRef.current.getBoundingClientRect(); setMenuPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right }); }; const onClick = (event: MouseEvent) => { const target = event.target as HTMLElement | null; if (target?.closest("[data-user-menu]")) return; if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false); }; updatePosition(); document.addEventListener("click", onClick); window.addEventListener("resize", updatePosition); window.addEventListener("scroll", updatePosition, true); return () => { document.removeEventListener("click", onClick); window.removeEventListener("resize", updatePosition); window.removeEventListener("scroll", updatePosition, true); }; }, [isUserMenuOpen]);
  useEffect(() => { if (!openSearchPanel) return; const onOutside = (event: MouseEvent) => { if (searchPanelRef.current && !searchPanelRef.current.contains(event.target as Node)) setOpenSearchPanel(null); }; document.addEventListener("click", onOutside); return () => document.removeEventListener("click", onOutside); }, [openSearchPanel]);
  useEffect(() => { const loadCities = async () => { try { const response = await fetch(`${API_BASE_URL}/properties/cities?limit=300&page=1&sortBy=name&sortOrder=asc`); if (!response.ok) return; const payload = (await response.json()) as PublicCity[] | PublicCityListResponse; const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []; setPublicCities(rows.filter((item): item is PublicCity => Boolean(item?.id?.trim() && item?.name?.trim())).map((item) => ({ id: item.id, name: item.name.trim(), province: item.province?.trim() || null }))); } catch { setPublicCities([]); } }; void loadCities(); }, []);
  useEffect(() => { const loadCategories = async () => { try { const response = await fetch(`${API_BASE_URL}/properties/categories?page=1&limit=100&sortBy=name&sortOrder=asc`); if (!response.ok) return; const payload = (await response.json()) as PublicCategory[] | { data?: PublicCategory[] }; const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []; setPublicCategories(rows.map((item) => item?.name?.trim()).filter((name): name is string => Boolean(name))); } catch { setPublicCategories([]); } }; void loadCategories(); }, []);
  useEffect(() => { if (isTenant) return; const controller = new AbortController(); const fetchSearchPayload = async (params: URLSearchParams) => { const response = await fetch(`${API_BASE_URL}/properties/search?${params.toString()}`, { signal: controller.signal }); const payload = (await response.json().catch(() => ({}))) as HomeSearchResponse & { message?: string }; if (!response.ok) throw new Error(payload.message || copy.failedLoadProperties); return payload; }; const resolveDestinationCoordinates = async (destination: string) => { const url = new URL("https://nominatim.openstreetmap.org/search"); url.searchParams.set("q", destination); url.searchParams.set("format", "jsonv2"); url.searchParams.set("limit", "1"); url.searchParams.set("addressdetails", "0"); url.searchParams.set("countrycodes", "id"); const response = await fetch(url.toString(), { signal: controller.signal, headers: { "Accept-Language": locale === "en" ? "en,id" : "id,en" } }); if (!response.ok) return null; const payload = (await response.json()) as Array<{ lat?: string; lon?: string }>; const latitude = Number(payload[0]?.lat); const longitude = Number(payload[0]?.lon); return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null; }; const load = async () => { setHomeLoading(true); setHomeError(null); try { const params = new URLSearchParams({ page: "1", limit: "12", sort_by: "price", sort_order: "asc" }); if (activeCategory !== ALL_CATEGORY_KEY) params.set("category", activeCategory); if (debouncedDestination) params.set("loc_term", debouncedDestination); const exactPayload = await fetchSearchPayload(params); const exactMapped = mapHomeItems(Array.isArray(exactPayload.data) ? exactPayload.data : [], locale, copy); if (exactMapped.length > 0) { setHomeProperties(exactMapped); setHomeTotalProperties(typeof exactPayload.meta?.total === "number" ? exactPayload.meta.total : exactMapped.length); setHomeDestinationNotice(null); return; } if (!debouncedDestination) { setHomeProperties([]); setHomeTotalProperties(0); setHomeDestinationNotice(null); return; } const geo = await resolveDestinationCoordinates(debouncedDestination); if (!geo) { setHomeProperties([]); setHomeTotalProperties(0); setHomeDestinationNotice(`${copy.destinationNoExactPrefix} ${debouncedDestination}. ${copy.destinationNoExactSuffix}`); return; } const near = new URLSearchParams({ page: "1", limit: "12", sort_by: "price", sort_order: "asc", lat: geo.latitude.toFixed(7), lng: geo.longitude.toFixed(7), radius_km: "1" }); if (activeCategory !== ALL_CATEGORY_KEY) near.set("category", activeCategory); const nearbyPayload = await fetchSearchPayload(near); const nearbyMapped = mapHomeItems(Array.isArray(nearbyPayload.data) ? nearbyPayload.data : [], locale, copy); setHomeProperties(nearbyMapped); setHomeTotalProperties(typeof nearbyPayload.meta?.total === "number" ? nearbyPayload.meta.total : nearbyMapped.length); setHomeDestinationNotice(nearbyMapped.length > 0 ? `${copy.destinationNearbyPrefix} ${debouncedDestination}. ${copy.destinationNearbySuffix}` : `${copy.destinationNoExactPrefix} ${debouncedDestination} ${copy.destinationNearbyEmptySuffix}`); } catch (error) { if ((error as Error).name === "AbortError") return; setHomeProperties([]); setHomeTotalProperties(0); setHomeDestinationNotice(null); setHomeError(error instanceof Error ? error.message : copy.failedLoadProperties); } finally { setHomeLoading(false); } }; void load(); return () => controller.abort(); }, [activeCategory, copy, debouncedDestination, isTenant, locale]);
  useEffect(() => { const token = getAuthToken(); if (!token) return; let mounted = true; apiFetch<{ name: string; type: "USER" | "TENANT" }>("/auth/me", { headers: { Authorization: `Bearer ${token}` } }).then((data) => { if (!mounted) return; setUserName(data.name); setUserType(data.type); }).catch(() => { if (!mounted) return; setUserName(null); setUserType(null); }); return () => { mounted = false; }; }, []);

  const navItems = isTenant ? [{ label: copy.navTenantHome, href: "#hero" }, { label: copy.navTenantProperty, href: "/tenant-property" }, { label: copy.navSupport, href: "#support" }] : [{ label: copy.navStay, href: "#properties" }, { label: copy.navExplore, href: "#discover" }, { label: copy.navSupport, href: "#support" }];
  const guestCount = clamp(searchForm.adults, 1, 10) + clamp(searchForm.children, 0, 10);
  const nights = clamp(searchForm.nights, 1, 30);
  const whenSummary = `${formatSearchDate(searchForm.startDate, locale, copy.searchDateEmpty)} · ${nights} ${nights === 1 ? copy.nightSingular : copy.nightPlural}`;
  const whoSummary = `${guestCount} ${guestCount === 1 ? copy.guestSingular : copy.guestPlural}`;
  const onSubmitSearch = () => { const params = new URLSearchParams(); const destination = searchForm.destination.trim(); if (destination) params.set("loc_term", destination); const safeNights = clamp(searchForm.nights, 1, 30); const endDate = addDays(searchForm.startDate, safeNights); params.set("start_date", searchForm.startDate); params.set("nights", String(safeNights)); if (endDate) params.set("end_date", endDate); params.set("adults", String(clamp(searchForm.adults, 1, 10))); params.set("children", String(clamp(searchForm.children, 0, 10))); params.set("rooms", String(clamp(searchForm.rooms, 1, 8))); params.set("page", "1"); setOpenSearchPanel(null); router.push(`/search?${params.toString()}`); };
  const onLogout = () => { clearAuthToken(); setUserName(null); setUserType(null); setIsUserMenuOpen(false); window.location.href = "/"; };

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <HomeHeader copy={copy} locale={locale} onChangeLocale={setLocale} isTenant={isTenant} userName={userName} isUserMenuOpen={isUserMenuOpen} setIsUserMenuOpen={setIsUserMenuOpen} menuPosition={menuPosition} setSidebarOpen={setIsSidebarOpen} userMenuRef={userMenuRef} userMenuButtonRef={userMenuButtonRef} onLogout={onLogout} />
      <Suspense fallback={null}><HomeAuthNotice copy={copy} /></Suspense>
      <HomeSidebar copy={copy} locale={locale} onChangeLocale={setLocale} navItems={navItems} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} userName={userName} isTenant={isTenant} onLogout={onLogout} />
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 md:pt-12">
        {!isTenant ? <HomeGuestSections copy={copy} heroSlides={heroSlides} activeSlide={activeSlide} setActiveSlide={setActiveSlide} searchForm={searchForm} setSearchForm={setSearchForm} openSearchPanel={openSearchPanel} setOpenSearchPanel={setOpenSearchPanel} searchPanelRef={searchPanelRef} whenSummary={whenSummary} whoSummary={whoSummary} onSubmitSearch={onSubmitSearch} onUpdateNights={(delta) => setSearchForm((prev) => ({ ...prev, nights: clamp(prev.nights + delta, 1, 30) }))} onUpdateAdults={(delta) => setSearchForm((prev) => ({ ...prev, adults: clamp(prev.adults + delta, 1, 10) }))} onUpdateChildren={(delta) => setSearchForm((prev) => ({ ...prev, children: clamp(prev.children + delta, 0, 10) }))} categories={discoveryCategories} activeCategory={activeCategory} onSelectCategory={setActiveCategory} allCategoryKey={ALL_CATEGORY_KEY} properties={homeProperties} loading={homeLoading} error={homeError} destinationNotice={homeDestinationNotice} totalProperties={homeTotalProperties} categoryCount={publicCategories.length} cityCount={publicCities.length} /> : <HomeTenantSection copy={copy} locale={locale} />}
      </main>
      <HomeFooter copy={copy} isTenant={isTenant} />
    </div>
  );
};
