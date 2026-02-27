"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { formatDetailedLocation } from "@/lib/location-format";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import { LISTING_COPY } from "./listing-copy";
import { AMENITY_CATEGORY_CONFIG_EN, AMENITY_CATEGORY_CONFIG_ID } from "./listing-amenity-meta";
import { AMENITY_HINT_BY_KEY_EN, AMENITY_HINT_BY_KEY_ID } from "./listing-amenity-hints";
import { FALLBACK_GALLERY, WEEKDAY_LABELS, addDays, formatDate, formatMonthYear, sanitizeLocationSegments } from "./listing-utils";
import { buildAmenitySections, buildPropertyAmenities, getSelectedNights, isRangeAvailable } from "./listing-computations";
import type { AvailabilityItem, AvailabilityResponse, ListingDetail } from "./listing-types";
import { ListingGallerySection } from "./listing-gallery-section";
import { ListingAmenitiesSection } from "./listing-amenities-section";
import { ListingAmenitiesModal } from "./listing-amenities-modal";
import { ListingBookingPanel } from "./listing-booking-panel";
import { ListingLocationSection } from "./listing-location-section";
import { ListingRoomOptionsSection } from "./listing-room-options-section";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useAppLocaleValue();
  const copy = LISTING_COPY[locale];
  const listingId = params?.id as string | undefined;
  const [data, setData] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState({ adults: 2, children: 1 });
  const [breakfastSelected, setBreakfastSelected] = useState(false);
  const [breakfastPax, setBreakfastPax] = useState(1);
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const calendarStart = useMemo(() => formatDate(new Date()), []);
  const calendarEnd = useMemo(() => formatDate(addDays(new Date(), 30)), []);
  const amenityHints = locale === "en" ? AMENITY_HINT_BY_KEY_EN : AMENITY_HINT_BY_KEY_ID;
  const amenityCategoryConfig = locale === "en" ? AMENITY_CATEGORY_CONFIG_EN : AMENITY_CATEGORY_CONFIG_ID;
  const weekdayLabels = WEEKDAY_LABELS[locale];

  useEffect(() => { if (!listingId) return; const controller = new AbortController(); const loadDetail = async () => { try { setLoading(true); setError(null); const response = await fetch(`${API_BASE_URL}/properties/public/${listingId}`, { signal: controller.signal }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error((payload as { message?: string }).message || copy.failedLoadDetail); setData(payload as ListingDetail); } catch (err) { if ((err as Error).name === "AbortError") return; setError(err instanceof Error ? err.message : copy.failedLoadDetail); } finally { setLoading(false); } }; void loadDetail(); return () => controller.abort(); }, [copy.failedLoadDetail, listingId]);
  useEffect(() => { if (!data?.rooms?.length || selectedRoomId) return; setSelectedRoomId(data.rooms[0].id); }, [data, selectedRoomId]);
  useEffect(() => { setActiveGalleryIndex(0); }, [listingId]);
  useEffect(() => { if (!selectedRoomId) return; const controller = new AbortController(); const loadAvailability = async () => { try { setAvailabilityLoading(true); setAvailabilityError(null); const paramsQuery = new URLSearchParams({ startDate: calendarStart, endDate: calendarEnd }); const response = await fetch(`${API_BASE_URL}/availability/public/room-types/${selectedRoomId}?${paramsQuery.toString()}`, { signal: controller.signal }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error((payload as { message?: string }).message || copy.failedLoadCalendar); setAvailability(payload as AvailabilityResponse); } catch (err) { if ((err as Error).name === "AbortError") return; setAvailability(null); setAvailabilityError(err instanceof Error ? err.message : copy.failedLoadCalendar); } finally { setAvailabilityLoading(false); } }; void loadAvailability(); setCheckIn(""); setCheckOut(""); return () => controller.abort(); }, [calendarEnd, calendarStart, copy.failedLoadCalendar, selectedRoomId]);
  useEffect(() => { if (!showAmenitiesModal) return; const previous = document.body.style.overflow; const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setShowAmenitiesModal(false); }; document.body.style.overflow = "hidden"; window.addEventListener("keydown", onKeyDown); return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); }; }, [showAmenitiesModal]);

  const gallery = useMemo(() => { if (!data) return FALLBACK_GALLERY; const images = [data.coverUrl, ...data.galleryUrls].filter((item): item is string => Boolean(item)); return images.length > 0 ? images : FALLBACK_GALLERY; }, [data]);
  useEffect(() => { setActiveGalleryIndex((prev) => Math.min(prev, Math.max(gallery.length - 1, 0))); }, [gallery.length]);
  const locationText = useMemo(() => (!data ? "" : formatDetailedLocation({ address: data.address, city: data.cityName, province: data.province })), [data]);
  const locationSegments = useMemo(() => sanitizeLocationSegments(locationText), [locationText]);
  const locationSummary = useMemo(() => (locationSegments.length > 0 ? locationSegments.slice(0, 3).join(", ") : locationText), [locationSegments, locationText]);
  const locationQuery = useMemo(() => { if (!data) return null; const combined = locationSegments.join(", "); if (combined.trim()) return combined; const fallback = locationText.trim(); return fallback ? fallback : null; }, [data, locationSegments, locationText]);
  const selectedRoom = useMemo(() => data?.rooms.find((room) => room.id === selectedRoomId) ?? null, [data, selectedRoomId]);
  const propertyAmenities = useMemo(() => buildPropertyAmenities(data, locale, amenityHints), [amenityHints, data, locale]);
  const amenitySections = useMemo(() => buildAmenitySections(propertyAmenities, amenityCategoryConfig), [amenityCategoryConfig, propertyAmenities]);
  const activeGalleryImage = useMemo(() => (!gallery.length ? null : gallery[Math.min(Math.max(activeGalleryIndex, 0), gallery.length - 1)] ?? gallery[0]), [activeGalleryIndex, gallery]);
  const sideGalleryImages = useMemo(() => gallery.map((image, index) => ({ image, index })).filter((item) => item.index !== activeGalleryIndex).slice(0, 4), [gallery, activeGalleryIndex]);
  const locationHeadline = useMemo(() => [data?.cityName, data?.province].map((part) => part?.trim()).filter((part): part is string => Boolean(part)).join(", "), [data?.cityName, data?.province]);
  const totalGuests = guests.adults + guests.children;
  const breakfastEnabled = Boolean(data?.breakfast?.enabled);
  const breakfastPricePerPax = Number(data?.breakfast?.pricePerPax ?? 0) > 0 ? Number(data?.breakfast?.pricePerPax ?? 0) : 0;
  useEffect(() => { if (!breakfastEnabled) { setBreakfastSelected(false); return; } setBreakfastPax((prev) => Math.min(Math.max(1, Number.isFinite(prev) ? prev : 1), Math.max(1, totalGuests))); }, [breakfastEnabled, totalGuests]);

  const availabilityMap = useMemo(() => { const map = new Map<string, AvailabilityItem>(); availability?.items.forEach((item) => map.set(item.date, item)); return map; }, [availability]);
  const rangeAvailable = checkIn && checkOut ? isRangeAvailable(checkIn, checkOut, availabilityMap) : false;
  const selectedNights = useMemo(() => getSelectedNights(checkIn, checkOut), [checkIn, checkOut]);
  const calendarMonthLabel = useMemo(() => formatMonthYear(calendarStart, locale), [calendarStart, locale]);
  const guestExceedsCapacity = Boolean(selectedRoom && totalGuests > selectedRoom.maxGuests);
  const canBook = Boolean(selectedRoomId && checkIn && checkOut && totalGuests > 0 && !guestExceedsCapacity && rangeAvailable);
  const bookingHelperText = useMemo(() => { if (!selectedRoomId) return copy.roomSelectionRequired; if (!checkIn || !checkOut) return copy.dateSelectionRequired; if (guestExceedsCapacity && selectedRoom) return `${copy.capacityExceededPrefix} (${selectedRoom.maxGuests} ${copy.guestUnit}).`; if (!rangeAvailable) return copy.rangeUnavailable; return copy.bookingReady; }, [checkIn, checkOut, copy, guestExceedsCapacity, rangeAvailable, selectedRoom, selectedRoomId]);

  const onDateClick = (item: AvailabilityItem) => { if (item.isClosed || item.availableUnits <= 0) return; if (!checkIn || checkOut) { setCheckIn(item.date); setCheckOut(""); setAvailabilityError(null); return; } if (item.date <= checkIn) { setCheckIn(item.date); setCheckOut(""); setAvailabilityError(null); return; } if (!isRangeAvailable(checkIn, item.date, availabilityMap)) { setAvailabilityError(copy.failedLoadDate); return; } setCheckOut(item.date); setAvailabilityError(null); };
  const onBook = () => { if (!data || !selectedRoomId || !canBook) return; const paramsQuery = new URLSearchParams({ propertyId: data.id, roomTypeId: selectedRoomId, propertyName: data.name, roomName: selectedRoom?.name ?? "", checkIn, checkOut, adults: String(guests.adults), children: String(guests.children), breakfastSelected: String(breakfastSelected && breakfastEnabled), breakfastPax: String(breakfastSelected && breakfastEnabled ? breakfastPax : 0), breakfastEnabled: String(breakfastEnabled), breakfastPricePerPax: String(breakfastPricePerPax) }); router.push(`/booking/confirmation?${paramsQuery.toString()}`); };

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        {loading ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">{copy.loadingDetail}</div> : null}
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div> : null}
        {!loading && data ? (
          <div className="animate-rise-in space-y-10">
            <header className="rounded-[30px] border border-slate-200 bg-white/90 px-6 py-6 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.35)] sm:px-8"><div className="space-y-3"><h1 className="break-words text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{data.name}</h1><p className="text-sm text-slate-600">{data.categoryName ?? copy.featuredProperty} · {locationHeadline || locationSummary || copy.indonesia}</p></div></header>
            <ListingGallerySection copy={copy} activeImage={activeGalleryImage} gallery={gallery} sideGalleryImages={sideGalleryImages} activeGalleryIndex={activeGalleryIndex} onSelect={setActiveGalleryIndex} onNavigate={(direction) => setActiveGalleryIndex((prev) => (prev + direction + gallery.length) % gallery.length)} />
            <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
              <div className="space-y-8">
                <section className="surface-panel rounded-3xl p-6 sm:p-7"><h2 className="text-2xl font-semibold text-slate-900">{data.categoryName ?? copy.featuredProperty} {locale === "en" ? "in" : "di"} {locationHeadline || locationSummary || copy.indonesia}</h2><p className="mt-2 text-sm text-slate-600">{data.rooms.length} {copy.roomsAvailableSuffix}</p><p className="mt-4 text-sm leading-7 text-slate-700">{data.description?.trim() ? data.description : copy.noDescription}</p></section>
                <ListingAmenitiesSection copy={copy} propertyAmenities={propertyAmenities} onOpenModal={() => setShowAmenitiesModal(true)} />
                <ListingRoomOptionsSection copy={copy} locale={locale} rooms={data.rooms} selectedRoomId={selectedRoomId} onSelectRoom={setSelectedRoomId} />
                <ListingLocationSection copy={copy} locationQuery={locationQuery} latitude={data.latitude ?? null} longitude={data.longitude ?? null} propertyName={data.name} />
              </div>
              <aside className="self-start lg:sticky lg:top-24">
                <ListingBookingPanel copy={copy} locale={locale} rooms={data.rooms} selectedRoomId={selectedRoomId} selectedRoom={selectedRoom} onSelectRoom={setSelectedRoomId} availability={availability} availabilityLoading={availabilityLoading} availabilityError={availabilityError} showCalendar={showCalendar} setShowCalendar={setShowCalendar} checkIn={checkIn} checkOut={checkOut} selectedNights={selectedNights} calendarMonthLabel={calendarMonthLabel} weekdayLabels={weekdayLabels} calendarStart={calendarStart} onDateClick={onDateClick} guests={guests} totalGuests={totalGuests} onChangeGuest={(key, delta) => setGuests((prev) => ({ ...prev, [key]: Math.max(0, prev[key] + delta) }))} breakfastEnabled={breakfastEnabled} breakfastSelected={breakfastSelected} breakfastPricePerPax={breakfastPricePerPax} breakfastPax={breakfastPax} onSelectBreakfast={(selected) => { setBreakfastSelected(selected); if (selected) setBreakfastPax((prev) => Math.min(Math.max(1, prev), Math.max(1, totalGuests))); }} onChangeBreakfastPax={(delta) => setBreakfastPax((prev) => Math.min(Math.max(1, totalGuests), Math.max(1, prev + delta)))} guestExceedsCapacity={guestExceedsCapacity} canBook={canBook} bookingHelperText={bookingHelperText} onBook={onBook} />
              </aside>
            </section>
          </div>
        ) : null}
      </main>
      <ListingAmenitiesModal open={showAmenitiesModal} copy={copy} sections={amenitySections} onClose={() => setShowAmenitiesModal(false)} />
    </div>
  );
}
