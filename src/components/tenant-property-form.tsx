"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import TenantPropertyLocationPicker from "@/components/tenant-property-location-picker";
import {
  ALL_AMENITY_OPTIONS,
  AMENITY_LABEL_BY_KEY,
  isAmenityKey,
  type AmenityKey,
  normalizeAmenityKeys,
} from "@/lib/amenities";

type SignatureResponse = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder?: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  error?: { message?: string };
};

type CityOption = {
  id: string;
  name: string;
  province?: string | null;
};

type CategoryOption = {
  id: string;
  name: string;
};

type RoomItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  totalUnits: number;
  maxGuests: number;
};

type RoomDraft = {
  name: string;
  description: string;
  price: string;
  totalUnits: string;
  maxGuests: string;
};

type StagedFile = {
  file: File;
  previewUrl: string;
};

type PropertyItem = {
  id: string;
  name: string;
  description: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  categoryId: string;
  categoryName?: string | null;
  cityId: string;
  cityName?: string | null;
  province?: string | null;
  amenityKeys?: string[];
  breakfast?: {
    enabled: boolean;
    pricePerPax: string;
    currency: string;
  };
  coverUrl?: string | null;
  galleryUrls: string[];
  rooms: RoomItem[];
};

type PropertyListResponse = {
  data: PropertyItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type CatalogListResponse<T> = {
  data: T[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

const MAX_GALLERY_IMAGES = 5;
const MAX_GALLERY_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp"];

const validateGalleryFile = (file: File) => {
  if (!file.type.startsWith("image/")) {
    return `File ${file.name} bukan gambar.`;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
    return `Format file ${file.name} harus ${ALLOWED_IMAGE_EXTS.join(", ")}.`;
  }
  if (file.size > MAX_GALLERY_IMAGE_SIZE) {
    return `Ukuran file ${file.name} melebihi 5MB.`;
  }
  return null;
};

const sanitizeNumberInput = (value: string) => value.replace(/[^\d]/g, "");

const normalizeCityTerm = (value: string) =>
  value
    .toLowerCase()
    .replace(/\bkab\.?\b/g, "kabupaten")
    .replace(/\s+/g, " ")
    .trim();

const buildUniqueCandidates = (values: Array<string | null | undefined>) =>
  Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value && value.length >= 2)),
    ),
  );

const formatIDR = (value: string | number) => {
  const numericValue =
    typeof value === "number" ? value : Number(value.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(numericValue)) return "Rp -";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numericValue);
};

const dedupeRoomItems = (rooms: unknown): RoomItem[] => {
  const roomMap = new Map<string, RoomItem>();
  const roomIdentityMap = new Map<string, string>();
  const normalizeText = (value: unknown) =>
    typeof value === "string" ? value.trim().toLowerCase() : "";
  const roomList = Array.isArray(rooms) ? rooms : [];

  for (const rawRoom of roomList) {
    const room =
      rawRoom && typeof rawRoom === "object" ? (rawRoom as Partial<RoomItem>) : null;
    const roomId = typeof room?.id === "string" ? room.id.trim() : "";
    const roomIdentity = [
      normalizeText(room?.name),
      normalizeText(room?.price),
      typeof room?.totalUnits === "number" ? String(room.totalUnits) : "",
      typeof room?.maxGuests === "number" ? String(room.maxGuests) : "",
    ].join("|");
    const canonicalRoomId = (roomIdentityMap.get(roomIdentity) ?? roomId) || "";
    if (!canonicalRoomId) continue;

    if (roomIdentity && !roomIdentityMap.has(roomIdentity)) {
      roomIdentityMap.set(roomIdentity, canonicalRoomId);
    }

    const prev = roomMap.get(canonicalRoomId);
    roomMap.set(canonicalRoomId, {
      id: canonicalRoomId,
      name: room?.name ?? prev?.name ?? "-",
      description: room?.description ?? prev?.description ?? "",
      price: room?.price ?? prev?.price ?? "0",
      totalUnits:
        typeof room?.totalUnits === "number" ? room.totalUnits : prev?.totalUnits ?? 0,
      maxGuests:
        typeof room?.maxGuests === "number" ? room.maxGuests : prev?.maxGuests ?? 1,
    });
  }

  return Array.from(roomMap.values());
};

const dedupePropertyItems = (items: PropertyItem[]) => {
  const propertyMap = new Map<string, PropertyItem>();
  const propertyIdentityMap = new Map<string, string>();
  const normalizeText = (value: unknown) =>
    typeof value === "string" ? value.trim().toLowerCase() : "";

  const normalizeGalleryUrls = (galleryUrls: unknown) =>
    Array.from(
      new Set(
        (Array.isArray(galleryUrls) ? galleryUrls : []).filter(
          (url): url is string => typeof url === "string" && url.trim().length > 0,
        ),
      ),
    );

  for (const item of items) {
    const propertyId = typeof item?.id === "string" ? item.id.trim() : "";
    const propertyIdentity = [
      normalizeText(item?.name),
      normalizeText(item?.cityName),
      normalizeText(item?.province),
    ].join("|");
    const canonicalPropertyId =
      (propertyIdentityMap.get(propertyIdentity) ?? propertyId) || "";
    if (!canonicalPropertyId) continue;

    if (propertyIdentity && !propertyIdentityMap.has(propertyIdentity)) {
      propertyIdentityMap.set(propertyIdentity, canonicalPropertyId);
    }

    const normalizedRooms = dedupeRoomItems(item.rooms);
    const normalizedGalleryUrls = normalizeGalleryUrls(item.galleryUrls);
    const current = propertyMap.get(canonicalPropertyId);

    if (!current) {
      propertyMap.set(canonicalPropertyId, {
        ...item,
        id: canonicalPropertyId,
        galleryUrls: normalizedGalleryUrls,
        rooms: normalizedRooms,
      });
      continue;
    }

    propertyMap.set(canonicalPropertyId, {
      ...current,
      name: current.name || item.name,
      description: current.description || item.description || "",
      address: current.address ?? item.address ?? null,
      latitude: current.latitude ?? item.latitude ?? null,
      longitude: current.longitude ?? item.longitude ?? null,
      categoryId: current.categoryId || item.categoryId,
      categoryName: current.categoryName ?? item.categoryName ?? null,
      cityId: current.cityId || item.cityId,
      cityName: current.cityName ?? item.cityName ?? null,
      province: current.province ?? item.province ?? null,
      coverUrl: current.coverUrl ?? item.coverUrl ?? null,
      galleryUrls: Array.from(
        new Set([...(current.galleryUrls ?? []), ...normalizedGalleryUrls]),
      ),
      amenityKeys: Array.from(
        new Set([...(current.amenityKeys ?? []), ...(item.amenityKeys ?? [])]),
      ),
      breakfast: current.breakfast ?? item.breakfast,
      rooms: dedupeRoomItems([...current.rooms, ...normalizedRooms]),
    });
  }

  return Array.from(propertyMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "id-ID"),
  );
};

async function fetchSignature() {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized.");
  }

  return apiFetch<SignatureResponse>("/media/signature", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function fetchCatalog<T>(path: string, search: string): Promise<T[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized.");
  }

  const query = new URLSearchParams({ search, limit: "10" }).toString();
  const response = await apiFetch<CatalogListResponse<T> | T[]>(
    `/catalog/${path}?${query}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return Array.isArray(response) ? response : response.data ?? [];
}

async function fetchProperties() {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized.");
  }
  const limit = 50;
  let page = 1;
  let totalPages = 1;
  const aggregated: PropertyItem[] = [];

  do {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    const response = await apiFetch<PropertyListResponse>(
      `/properties?${query.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    aggregated.push(...(response.data ?? []));
    totalPages = Math.max(1, response.meta?.totalPages ?? 1);
    page += 1;
  } while (page <= totalPages);

  return dedupePropertyItems(aggregated);
}

async function createCategory(name: string) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized.");
  }

  return apiFetch<CategoryOption>("/catalog/categories", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
}

async function updatePropertyRequest(
  id: string,
  payload: Record<string, unknown>,
) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized.");
  }

  return apiFetch<{ message: string; id: string }>(`/properties/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

async function deletePropertyRequest(id: string) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized.");
  }

  return apiFetch<{ message: string; id: string }>(`/properties/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function createRoomRequest(
  propertyId: string,
  payload: Record<string, unknown>,
) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized.");
  }

  return apiFetch<{ message: string; id: string }>(
    `/properties/${propertyId}/rooms`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );
}

async function updateRoomRequest(
  roomId: string,
  payload: Record<string, unknown>,
) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized.");
  }

  return apiFetch<{ message: string; id: string }>(
    `/properties/rooms/${roomId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );
}

async function deleteRoomRequest(roomId: string) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized.");
  }

  return apiFetch<{ message: string; id: string }>(
    `/properties/rooms/${roomId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

async function uploadToCloudinary(file: File, signature: SignatureResponse) {
  const uploadUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", signature.timestamp.toString());
  formData.append("signature", signature.signature);
  if (signature.folder) {
    formData.append("folder", signature.folder);
  }

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });
  const data = (await response.json()) as CloudinaryUploadResponse;

  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Upload gambar gagal.");
  }

  return data.secure_url;
}

type TenantPropertyFormProps = {
  showManagement?: boolean;
  showForm?: boolean;
  showRoomManagement?: boolean;
  redirectOnCreateTo?: string;
};

export default function TenantPropertyForm({
  showManagement = true,
  showForm = true,
  showRoomManagement = true,
  redirectOnCreateTo,
}: TenantPropertyFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useAppLocaleValue();
  const isEnglish = locale === "en";
  const copy = useMemo(
    () => ({
      loadPropertyFailed: isEnglish ? "Failed to load properties." : "Gagal memuat properti.",
      propertyNotFound:
        isEnglish
          ? "Property to edit was not found."
          : "Properti yang ingin diedit tidak ditemukan.",
      confirmDeleteProperty: isEnglish
        ? "Delete this property?"
        : "Hapus properti ini?",
      confirmDeleteRoom: isEnglish ? "Delete this room?" : "Hapus kamar ini?",
      deleteFailed: isEnglish ? "Failed to delete." : "Gagal menghapus.",
      roomDeleteFailed: isEnglish ? "Failed to delete room." : "Gagal menghapus kamar.",
      selectPropertyBeforeRoom: isEnglish
        ? "Select a property first to add a room."
        : "Pilih properti terlebih dahulu untuk menambah kamar.",
      roomNameDescRequired: isEnglish
        ? "Room name and description are required."
        : "Nama dan deskripsi kamar wajib diisi.",
      roomPriceRequired: isEnglish ? "Room price is required." : "Harga kamar wajib diisi.",
      roomUnitsGuestsRequired: isEnglish
        ? "Total units and max guests are required."
        : "Total unit dan maksimal tamu wajib diisi.",
      roomSaveFailed: isEnglish ? "Failed to save room." : "Gagal menyimpan kamar.",
      roomDescriptionRequired: isEnglish
        ? "Room description is required."
        : "Deskripsi kamar wajib diisi.",
      maxGuestRequired: isEnglish
        ? "Max guests is required."
        : "Maksimal tamu wajib diisi.",
      fullPropertyRoomName: isEnglish ? "Entire Property" : "Properti Utuh",
      coverSuccess: isEnglish
        ? "Image successfully set as cover."
        : "Foto berhasil dijadikan sampul.",
      close: isEnglish ? "Close" : "Tutup",
      manageProperty: isEnglish ? "Manage Properties" : "Kelola Properti",
      propertyListTitle: isEnglish
        ? "List of properties you created"
        : "Daftar properti yang sudah dibuat",
      reload: isEnglish ? "Reload" : "Muat Ulang",
      loadingProperties: isEnglish ? "Loading properties..." : "Memuat properti...",
      noPropertyYet: isEnglish
        ? "No properties yet. Create a new property using the form below."
        : "Belum ada properti. Silakan buat properti baru di form bawah.",
      categoryFallback: isEnglish ? "Category" : "Kategori",
      noImage: isEnglish ? "No image" : "Tidak ada gambar",
      edit: isEnglish ? "Edit" : "Ubah",
      manageRoom: isEnglish ? "Manage Rooms" : "Kelola Kamar",
      delete: isEnglish ? "Delete" : "Hapus",
      roomManagement: isEnglish ? "Manage Rooms" : "Kelola Kamar",
      roomManagementTitle: isEnglish
        ? "Manage rooms for selected property"
        : "Kelola kamar untuk properti terpilih",
      cancelRoomEdit: isEnglish ? "Cancel room edit" : "Batalkan edit kamar",
      selectPropertyToManageRoom: isEnglish
        ? "Select a property from the list above to manage rooms."
        : "Pilih properti dari daftar di atas untuk mengelola kamar.",
      activeProperty: isEnglish ? "Active property" : "Properti aktif",
      roomTypeName: isEnglish ? "Room Type / Name" : "Tipe / Nama Kamar",
      roomPrice: isEnglish ? "Price" : "Harga",
      roomDescription: isEnglish ? "Room Description" : "Deskripsi Kamar",
      maxGuest: isEnglish ? "Max Guests" : "Maksimal Tamu",
      totalUnits: isEnglish ? "Total Units" : "Total Unit",
      updateProperty: isEnglish ? "Update Property" : "Perbarui Properti",
      saveProperty: isEnglish ? "Save Property" : "Simpan Properti",
      saveRoom: isEnglish ? "Save Room" : "Simpan Kamar",
      updateRoom: isEnglish ? "Update Room" : "Perbarui Kamar",
      addRoom: isEnglish ? "Add Room" : "Tambah Kamar",
      addRoomDraft: isEnglish ? "Add Room Draft" : "Tambah Draft Kamar",
      propertyRentalType: isEnglish ? "Property rental type" : "Tipe sewa properti",
      fullRentalOption: isEnglish
        ? "This property is rented as an entire unit"
        : "Properti ini disewakan secara keseluruhan",
      partialRentalOption: isEnglish
        ? "This property has multiple rooms"
        : "Properti ini memiliki beberapa kamar",
      saving: isEnglish ? "Saving..." : "Menyimpan...",
      perUnit: isEnglish ? "units" : "unit",
      guests: isEnglish ? "guests" : "tamu",
      roomDraftList: isEnglish
        ? "Room drafts to be created"
        : "Draft kamar yang akan dibuat",
      noRoomDraft: isEnglish
        ? "No room drafts have been added."
        : "Belum ada draft kamar ditambahkan.",
      roomTypeSchemaHint: isEnglish
        ? "Fields follow the `RoomType` structure in Prisma schema."
        : "Field mengikuti struktur `RoomType` di Prisma schema.",
      roomList: isEnglish ? "Room List" : "Daftar Kamar",
      noRoomInProperty: isEnglish
        ? "No rooms available for this property yet."
        : "Belum ada kamar untuk properti ini.",
    }),
    [isEnglish],
  );
  const editPropertyIdFromUrl = (searchParams.get("edit") ?? "").trim();
  const [propertyName, setPropertyName] = useState("");
  const [propertyDesc, setPropertyDesc] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyLatitude, setPropertyLatitude] = useState<number | null>(null);
  const [propertyLongitude, setPropertyLongitude] = useState<number | null>(
    null,
  );
  const [coverUrl, setCoverUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [lastCategorySearch, setLastCategorySearch] = useState<string | null>(
    null,
  );
  const [cityQuery, setCityQuery] = useState("");
  const [cityId, setCityId] = useState("");
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(
    null,
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null,
  );
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [roomPrice, setRoomPrice] = useState("");
  const [roomUnits, setRoomUnits] = useState("");
  const [roomGuests, setRoomGuests] = useState("");
  const [roomDrafts, setRoomDrafts] = useState<RoomDraft[]>([]);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomDraftMode, setRoomDraftMode] = useState<"FULL" | "PARTIAL">(
    "PARTIAL",
  );
  const [selectedAmenityKeys, setSelectedAmenityKeys] = useState<AmenityKey[]>(
    [],
  );
  const [breakfastEnabled, setBreakfastEnabled] = useState(false);
  const [breakfastPricePerPax, setBreakfastPricePerPax] = useState("");
  const [amenityToAdd, setAmenityToAdd] = useState("");
  const [isSelectingCover, setIsSelectingCover] = useState(false);
  const [showCoverSuccessPopup, setShowCoverSuccessPopup] = useState(false);
  const coverSuccessTimerRef = useRef<number | null>(null);

  const selectedProperty = useMemo(
    () => properties.find((item) => item.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId],
  );
  const availableAmenityOptions = useMemo(
    () =>
      ALL_AMENITY_OPTIONS.filter(
        (option) => !selectedAmenityKeys.includes(option.key),
      ),
    [selectedAmenityKeys],
  );
  const locationSearchQuery = useMemo(
    () => propertyAddress.trim(),
    [propertyAddress],
  );
  const normalizedCategoryQuery = categoryQuery.trim();
  const hasCategoryQuery = normalizedCategoryQuery.length >= 2;
  const categoryExactMatch = categoryOptions.some(
    (option) =>
      option.name.toLowerCase() === normalizedCategoryQuery.toLowerCase(),
  );
  const showCategoryDropdown =
    isCategoryMenuOpen && (hasCategoryQuery || categoryOptions.length > 0);
  const showCreateCategoryOption =
    hasCategoryQuery && !categoryExactMatch && normalizedCategoryQuery.length >= 2;

  const loadCategoryOptions = async (search: string) => {
    const trimmedSearch = search.trim();
    setIsLoadingCategory(true);
    try {
      const result = await fetchCatalog<CategoryOption>(
        "categories",
        trimmedSearch,
      );
      setCategoryOptions(result);
      setLastCategorySearch(trimmedSearch);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memuat kategori.";
      setError(message);
    } finally {
      setIsLoadingCategory(false);
    }
  };

  useEffect(() => {
    if (!galleryUrls.length) {
      setIsSelectingCover(false);
      setCoverUrl("");
      return;
    }
    if (coverUrl && galleryUrls.includes(coverUrl)) return;
    setCoverUrl(galleryUrls[0]);
  }, [galleryUrls, coverUrl]);

  useEffect(() => {
    return () => {
      if (coverSuccessTimerRef.current) {
        window.clearTimeout(coverSuccessTimerRef.current);
      }
    };
  }, []);

  const loadProperties = async () => {
    setIsLoadingProperties(true);
    try {
      const data = await fetchProperties();
      setProperties(data);
      if (data.length && !selectedPropertyId) {
        setSelectedPropertyId(data[0].id);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : copy.loadPropertyFailed;
      setError(message);
    } finally {
      setIsLoadingProperties(false);
    }
  };

  useEffect(() => {
    if (!showManagement && !showRoomManagement && !editPropertyIdFromUrl) return;
    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showManagement, showRoomManagement, editPropertyIdFromUrl]);

  useEffect(() => {
    if (!selectedPropertyId) return;
    const exists = properties.some((item) => item.id === selectedPropertyId);
    if (!exists) {
      setSelectedPropertyId(properties[0]?.id ?? null);
    }
  }, [properties, selectedPropertyId]);

  useEffect(() => {
    const trimmedQuery = categoryQuery.trim();
    if (!trimmedQuery) {
      if (
        isCategoryMenuOpen &&
        !isLoadingCategory &&
        lastCategorySearch !== ""
      ) {
        void loadCategoryOptions("");
      }
      if (!isCategoryMenuOpen) {
        setCategoryOptions([]);
      }
      return;
    }
    if (trimmedQuery.length < 2) {
      setCategoryOptions([]);
      setIsLoadingCategory(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      await loadCategoryOptions(trimmedQuery);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [
    categoryQuery,
    isCategoryMenuOpen,
    isLoadingCategory,
    lastCategorySearch,
  ]);

  useEffect(() => {
    if (!categoryOptions.length || !categoryQuery.trim()) return;
    const match = categoryOptions.find(
      (option) =>
        option.name.toLowerCase() === categoryQuery.trim().toLowerCase(),
    );
    if (match && categoryId !== match.id) {
      setCategoryId(match.id);
    }
  }, [categoryOptions, categoryQuery, categoryId]);

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    setInfo("");
    const remaining =
      MAX_GALLERY_IMAGES - galleryUrls.length - stagedFiles.length;
    if (remaining <= 0) {
      setError(`Maksimal ${MAX_GALLERY_IMAGES} foto untuk galeri.`);
      return;
    }
    const filesToStage = Array.from(files).slice(0, remaining);
    const invalid = filesToStage
      .map((file) => validateGalleryFile(file))
      .find(Boolean);
    if (invalid) {
      setError("Gambar tidak sesuai dengan ketentuan.");
      return;
    }

    const staged = filesToStage.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setStagedFiles((prev) => [...prev, ...staged]);
    if (files.length > remaining) {
      setInfo(`Maksimal ${MAX_GALLERY_IMAGES} foto untuk galeri.`);
    }
  };

  const handleUploadStaged = async () => {
    if (!stagedFiles.length) return;
    setError("");
    setInfo("");
    setIsUploadingGallery(true);
    try {
      const uploaded: string[] = [];
      for (const staged of stagedFiles) {
        const signature = await fetchSignature();
        const url = await uploadToCloudinary(staged.file, signature);
        uploaded.push(url);
      }
      setGalleryUrls((prev) => [...prev, ...uploaded]);
      setInfo("Galeri berhasil diunggah.");
      stagedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setStagedFiles([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload gagal.";
      setError(message);
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleRemoveStaged = (previewUrl: string) => {
    setStagedFiles((prev) => {
      const next = prev.filter((item) => item.previewUrl !== previewUrl);
      const removed = prev.find((item) => item.previewUrl === previewUrl);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return next;
    });
  };

  const showCoverSuccessMessage = () => {
    setShowCoverSuccessPopup(true);
    if (coverSuccessTimerRef.current) {
      window.clearTimeout(coverSuccessTimerRef.current);
    }
    coverSuccessTimerRef.current = window.setTimeout(() => {
      setShowCoverSuccessPopup(false);
      coverSuccessTimerRef.current = null;
    }, 1800);
  };

  const handleSelectCoverFromGallery = (url: string) => {
    if (!isSelectingCover) return;
    setCoverUrl(url);
    setIsSelectingCover(false);
    showCoverSuccessMessage();
  };

  const handleRemoveGalleryImage = (url: string) => {
    const next = galleryUrls.filter((item) => item !== url);
    setGalleryUrls(next);
    if (coverUrl === url) {
      setCoverUrl(next[0] ?? "");
    }
  };

  const handleCreateCategory = async () => {
    const name = categoryQuery.trim();
    if (name.length < 2) {
      setError("Nama kategori minimal 2 karakter.");
      return;
    }
    if (isCreatingCategory) return;
    setError("");
    setInfo("");
    setIsCreatingCategory(true);
    try {
      const result = await createCategory(name);
      setCategoryId(result.id);
      setCategoryQuery(result.name);
      setCategoryOptions([]);
      setIsCategoryMenuOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal membuat kategori.";
      setError(message);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const applyAutoDetectedCity = useCallback((option: CityOption) => {
    setCityId(option.id);
    setCityQuery(
      option.province ? `${option.name}, ${option.province}` : option.name,
    );
  }, []);

  const resolveCityOptionFromCandidates = useCallback(
    async (rawCandidates: string[], provinceHint?: string | null) => {
      const candidates = buildUniqueCandidates(rawCandidates);
      if (candidates.length === 0) return null;

      const normalizedProvinceHint = provinceHint
        ? normalizeCityTerm(provinceHint)
        : "";

      for (const candidate of candidates) {
        try {
          const result = await fetchCatalog<CityOption>("cities", candidate);
          if (!Array.isArray(result) || result.length === 0) continue;

          const normalizedCandidate = normalizeCityTerm(candidate);
          const byExact = result.find(
            (option) => normalizeCityTerm(option.name) === normalizedCandidate,
          );
          if (byExact) return byExact;

          const byContains = result.find((option) => {
            const normalizedOption = normalizeCityTerm(option.name);
            return (
              normalizedOption.includes(normalizedCandidate) ||
              normalizedCandidate.includes(normalizedOption)
            );
          });
          if (byContains) return byContains;

          if (normalizedProvinceHint) {
            const byProvince = result.find((option) =>
              normalizeCityTerm(option.province ?? "").includes(
                normalizedProvinceHint,
              ),
            );
            if (byProvince) return byProvince;
          }

          return result[0];
        } catch {
          continue;
        }
      }

      return null;
    },
    [],
  );

  const detectCityFromAddressOrMap = useCallback(async () => {
    const candidates: string[] = [];
    let provinceHint: string | null = null;
    const pushCandidates = (...values: Array<string | null | undefined>) => {
      candidates.push(...buildUniqueCandidates(values));
    };

    const trimmedAddress = propertyAddress.trim();

    if (trimmedAddress) {
      try {
        const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
        searchUrl.searchParams.set("q", trimmedAddress);
        searchUrl.searchParams.set("format", "jsonv2");
        searchUrl.searchParams.set("limit", "1");
        searchUrl.searchParams.set("addressdetails", "1");

        const response = await fetch(searchUrl.toString(), {
          headers: {
            "Accept-Language": "id,en",
          },
        });
        if (response.ok) {
          const payload = (await response.json()) as Array<{
            lat?: string;
            lon?: string;
            address?: {
              city?: string;
              town?: string;
              municipality?: string;
              village?: string;
              county?: string;
              state_district?: string;
              state?: string;
            };
          }>;
          const firstResult = payload[0];
          const nextLatitude = Number(firstResult?.lat);
          const nextLongitude = Number(firstResult?.lon);
          const hasCurrentCoordinates =
            typeof propertyLatitude === "number" &&
            Number.isFinite(propertyLatitude) &&
            typeof propertyLongitude === "number" &&
            Number.isFinite(propertyLongitude);
          if (
            !hasCurrentCoordinates &&
            Number.isFinite(nextLatitude) &&
            Number.isFinite(nextLongitude)
          ) {
            setPropertyLatitude(Number(nextLatitude.toFixed(7)));
            setPropertyLongitude(Number(nextLongitude.toFixed(7)));
          }

          const details = firstResult?.address;
          pushCandidates(
            details?.city,
            details?.town,
            details?.municipality,
            details?.village,
            details?.county,
            details?.state_district,
          );
          provinceHint = details?.state?.trim() || provinceHint;
        }
      } catch {
        // noop, fallback ke kandidat lain
      }
    }

    const hasCoordinates =
      typeof propertyLatitude === "number" &&
      Number.isFinite(propertyLatitude) &&
      typeof propertyLongitude === "number" &&
      Number.isFinite(propertyLongitude);

    if (hasCoordinates && candidates.length === 0) {
      try {
        const reverseUrl = new URL("https://nominatim.openstreetmap.org/reverse");
        reverseUrl.searchParams.set("lat", String(propertyLatitude));
        reverseUrl.searchParams.set("lon", String(propertyLongitude));
        reverseUrl.searchParams.set("format", "jsonv2");
        reverseUrl.searchParams.set("zoom", "18");
        reverseUrl.searchParams.set("addressdetails", "1");

        const reverseResponse = await fetch(reverseUrl.toString(), {
          headers: {
            "Accept-Language": "id,en",
          },
        });
        if (reverseResponse.ok) {
          const reversePayload = (await reverseResponse.json()) as {
            address?: {
              city?: string;
              town?: string;
              municipality?: string;
              village?: string;
              county?: string;
              state_district?: string;
              state?: string;
            };
          };
          const details = reversePayload.address;
          pushCandidates(
            details?.city,
            details?.town,
            details?.municipality,
            details?.village,
            details?.county,
            details?.state_district,
          );
          provinceHint = details?.state?.trim() || provinceHint;
        }
      } catch {
        // noop
      }
    }

    pushCandidates(cityQuery.split(",")[0], trimmedAddress);

    const option = await resolveCityOptionFromCandidates(
      candidates,
      provinceHint,
    );
    if (!option) return null;
    applyAutoDetectedCity(option);
    return option.id;
  }, [
    applyAutoDetectedCity,
    cityQuery,
    propertyAddress,
    propertyLatitude,
    propertyLongitude,
    resolveCityOptionFromCandidates,
  ]);

  const handlePickPropertyLocation = useCallback(
    (location: {
      latitude: number;
      longitude: number;
      resolvedAddress?: string;
      cityCandidate?: string;
      districtCandidate?: string;
      provinceCandidate?: string;
    }) => {
      setPropertyLatitude(location.latitude);
      setPropertyLongitude(location.longitude);
      setCityId("");
      setCityQuery("");
      if (location.resolvedAddress) {
        setPropertyAddress(location.resolvedAddress);
      }

      const candidates = buildUniqueCandidates([
        location.cityCandidate,
        location.districtCandidate,
      ]);
      if (candidates.length === 0) return;

      void (async () => {
        setIsLoadingCity(true);
        try {
          const option = await resolveCityOptionFromCandidates(
            candidates,
            location.provinceCandidate ?? null,
          );
          if (!option) return;
          applyAutoDetectedCity(option);
        } finally {
          setIsLoadingCity(false);
        }
      })();
    },
    [applyAutoDetectedCity, resolveCityOptionFromCandidates],
  );

  const handleAddAmenity = (amenityKey: string) => {
    if (!isAmenityKey(amenityKey)) return;
    setError("");
    setSelectedAmenityKeys((prev) => {
      if (prev.includes(amenityKey)) {
        return prev;
      }
      return [...prev, amenityKey];
    });
    setAmenityToAdd("");
  };

  const handleRemoveAmenity = (amenityKey: AmenityKey) => {
    setError("");
    setSelectedAmenityKeys((prev) =>
      prev.filter((item) => item !== amenityKey),
    );
  };

  const resetPropertyForm = () => {
    if (coverSuccessTimerRef.current) {
      window.clearTimeout(coverSuccessTimerRef.current);
      coverSuccessTimerRef.current = null;
    }
    setPropertyName("");
    setPropertyDesc("");
    setPropertyAddress("");
    setPropertyLatitude(null);
    setPropertyLongitude(null);
    setIsSelectingCover(false);
    setShowCoverSuccessPopup(false);
    setCoverUrl("");
    setGalleryUrls([]);
    setCategoryQuery("");
    setCategoryId("");
    setCategoryOptions([]);
    setCityQuery("");
    setCityId("");
    setSelectedAmenityKeys([]);
    setBreakfastEnabled(false);
    setBreakfastPricePerPax("");
    setAmenityToAdd("");
    stagedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setStagedFiles([]);
    setRoomDrafts([]);
    setEditingPropertyId(null);
  };

  const resetRoomForm = () => {
    setRoomName("");
    setRoomDescription("");
    setRoomPrice("");
    setRoomUnits("");
    setRoomGuests("");
    setEditingRoomId(null);
  };

  const resetRoomDraftForm = () => {
    setRoomName("");
    setRoomDescription("");
    setRoomPrice("");
    setRoomUnits("");
    setRoomGuests("");
  };

  const handleRoomDraftModeChange = (mode: "FULL" | "PARTIAL") => {
    setRoomDraftMode(mode);
    setRoomDrafts([]);
    resetRoomDraftForm();
  };

  const buildFullPropertyDraft = (): RoomDraft => ({
    name: propertyName.trim()
      ? `${propertyName.trim()} · ${copy.fullPropertyRoomName}`
      : copy.fullPropertyRoomName,
    description: roomDescription.trim(),
    price: roomPrice.trim(),
    totalUnits: "1",
    maxGuests: roomGuests.trim(),
  });

  const handleAddRoomDraft = () => {
    setError("");
    setInfo("");
    if (!roomDescription.trim()) {
      setError(copy.roomDescriptionRequired);
      return;
    }
    if (!roomPrice.trim()) {
      setError(copy.roomPriceRequired);
      return;
    }
    if (!roomGuests.trim()) {
      setError(copy.maxGuestRequired);
      return;
    }

    if (roomDraftMode === "FULL") {
      const draft = buildFullPropertyDraft();
      setRoomDrafts([draft]);
      return;
    }

    if (!roomName.trim()) {
      setError("Nama kamar wajib diisi.");
      return;
    }
    if (!roomUnits.trim()) {
      setError("Total unit wajib diisi.");
      return;
    }

    setRoomDrafts((prev) => [
      ...prev,
      {
        name: roomName.trim(),
        description: roomDescription.trim(),
        price: roomPrice.trim(),
        totalUnits: roomUnits.trim(),
        maxGuests: roomGuests.trim(),
      },
    ]);
    resetRoomDraftForm();
  };

  const handleEditProperty = (property: PropertyItem) => {
    const normalizedAmenities = normalizeAmenityKeys(property.amenityKeys ?? []);

    setEditingPropertyId(property.id);
    setSelectedPropertyId(property.id);
    setPropertyName(property.name);
    setPropertyDesc(property.description);
    setPropertyAddress(property.address ?? "");
    setPropertyLatitude(
      typeof property.latitude === "number" && Number.isFinite(property.latitude)
        ? property.latitude
        : null,
    );
    setPropertyLongitude(
      typeof property.longitude === "number" &&
        Number.isFinite(property.longitude)
        ? property.longitude
        : null,
    );
    setCategoryId(property.categoryId);
    setCategoryQuery(property.categoryName ?? property.categoryId);
    setCityId(property.cityId);
    setCityQuery(
      property.cityName
        ? property.province
          ? `${property.cityName}, ${property.province}`
          : property.cityName
        : property.cityId,
    );
    setGalleryUrls(property.galleryUrls);
    setCoverUrl(property.coverUrl ?? property.galleryUrls[0] ?? "");
    setSelectedAmenityKeys(normalizedAmenities);
    setBreakfastEnabled(Boolean(property.breakfast?.enabled));
    setBreakfastPricePerPax(
      property.breakfast?.pricePerPax
        ? sanitizeNumberInput(property.breakfast.pricePerPax)
        : "",
    );
    setAmenityToAdd("");
    stagedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setStagedFiles([]);
    setInfo("Mode edit properti aktif.");
  };

  const appliedUrlEditIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editPropertyIdFromUrl) {
      appliedUrlEditIdRef.current = null;
      return;
    }

    if (appliedUrlEditIdRef.current === editPropertyIdFromUrl) return;
    if (isLoadingProperties || properties.length === 0) return;

    const targetProperty = properties.find(
      (property) => property.id === editPropertyIdFromUrl,
    );
    if (!targetProperty) {
      setError(copy.propertyNotFound);
      appliedUrlEditIdRef.current = editPropertyIdFromUrl;
      return;
    }

    handleEditProperty(targetProperty);
    appliedUrlEditIdRef.current = editPropertyIdFromUrl;
  }, [editPropertyIdFromUrl, isLoadingProperties, properties]);

  const handleEditRoom = (room: RoomItem) => {
    setEditingRoomId(room.id);
    setRoomName(room.name);
    setRoomDescription(room.description);
    setRoomPrice(sanitizeNumberInput(String(room.price)));
    setRoomUnits(String(room.totalUnits));
    setRoomGuests(String(room.maxGuests));
    setInfo("Mode edit kamar aktif.");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!propertyName.trim() || !propertyDesc.trim()) {
      setError("Nama dan deskripsi properti wajib diisi.");
      return;
    }
    if (!propertyAddress.trim()) {
      setError("Alamat properti wajib diisi.");
      return;
    }
    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId) {
      if (!categoryQuery.trim()) {
        setError("Pilih kategori properti terlebih dahulu.");
        return;
      }
      try {
        const created = await createCategory(categoryQuery.trim());
        resolvedCategoryId = created.id;
        setCategoryId(created.id);
        setCategoryQuery(created.name);
        setCategoryOptions([]);
        setInfo(`Kategori "${created.name}" berhasil dibuat.`);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Pilih kategori properti terlebih dahulu.";
        setError(message);
        return;
      }
    }
    let resolvedCityId = cityId;
    if (!resolvedCityId) {
      setIsLoadingCity(true);
      try {
        const autoDetectedCityId = await detectCityFromAddressOrMap();
        if (autoDetectedCityId) {
          resolvedCityId = autoDetectedCityId;
        }
      } finally {
        setIsLoadingCity(false);
      }
    }
    if (!resolvedCityId) {
      setError(
        "Lokasi belum terdeteksi otomatis. Pilih titik di peta atau lengkapi alamat.",
      );
      return;
    }
    if (stagedFiles.length > 0) {
      setError("Unggah foto terlebih dahulu.");
      return;
    }
    if (!galleryUrls.length) {
      setError("Upload minimal 1 foto untuk galeri.");
      return;
    }
    if (!coverUrl) {
      setError("Pilih foto sampul dari galeri.");
      return;
    }
    if (selectedAmenityKeys.length === 0) {
      setError("Pilih minimal satu fasilitas properti.");
      return;
    }

    let draftsToCreate = roomDrafts;
    if (!editingPropertyId && roomDraftMode === "FULL") {
      if (!roomDescription.trim() || !roomPrice.trim() || !roomGuests.trim()) {
        setError("Lengkapi harga, maksimal tamu, dan deskripsi kamar.");
        return;
      }
      draftsToCreate = [buildFullPropertyDraft()];
    }

    const token = getAuthToken();
    if (!token) {
      setError("Unauthorized.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: propertyName.trim(),
        description: propertyDesc.trim(),
        address: propertyAddress.trim() || undefined,
        latitude: propertyLatitude ?? undefined,
        longitude: propertyLongitude ?? undefined,
        categoryId: resolvedCategoryId,
        cityId: resolvedCityId,
        coverUrl,
        galleryUrls,
        amenityKeys: selectedAmenityKeys,
        breakfastEnabled,
        breakfastPricePerPax: Number(breakfastPricePerPax || "0"),
      };

      const isCreating = !editingPropertyId;
      const result = editingPropertyId
        ? await updatePropertyRequest(editingPropertyId, payload)
        : await apiFetch<{ message: string; id: string }>("/properties", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

      if (!editingPropertyId && draftsToCreate.length > 0) {
        for (const draft of draftsToCreate) {
          await createRoomRequest(result.id, {
            name: draft.name,
            description: draft.description,
            price: draft.price,
            totalUnits: draft.totalUnits,
            maxGuests: draft.maxGuests,
          });
        }
      }

      setInfo(result.message);
      if (showManagement || showRoomManagement) {
        await loadProperties();
      }
      if (isCreating && redirectOnCreateTo) {
        router.push(redirectOnCreateTo);
        return;
      }
      if (editingPropertyId) {
        setEditingPropertyId(null);
      } else {
        resetPropertyForm();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!window.confirm(copy.confirmDeleteProperty)) return;
    setError("");
    setInfo("");
    try {
      const result = await deletePropertyRequest(propertyId);
      setInfo(result.message);
      await loadProperties();
      if (editingPropertyId === propertyId) {
        resetPropertyForm();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.deleteFailed;
      setError(message);
    }
  };

  const handleRoomSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!selectedPropertyId) {
      setError(copy.selectPropertyBeforeRoom);
      return;
    }
    if (!roomName.trim() || !roomDescription.trim()) {
      setError(copy.roomNameDescRequired);
      return;
    }
    if (!roomPrice.trim()) {
      setError(copy.roomPriceRequired);
      return;
    }
    if (!roomUnits.trim() || !roomGuests.trim()) {
      setError(copy.roomUnitsGuestsRequired);
      return;
    }

    setIsSavingRoom(true);
    try {
      const payload = {
        name: roomName.trim(),
        description: roomDescription.trim(),
        price: roomPrice.trim(),
        totalUnits: roomUnits.trim(),
        maxGuests: roomGuests.trim(),
      };
      const result = editingRoomId
        ? await updateRoomRequest(editingRoomId, payload)
        : await createRoomRequest(selectedPropertyId, payload);
      setInfo(result.message);
      await loadProperties();
      resetRoomForm();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : copy.roomSaveFailed;
      setError(message);
    } finally {
      setIsSavingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm(copy.confirmDeleteRoom)) return;
    setError("");
    setInfo("");
    try {
      const result = await deleteRoomRequest(roomId);
      setInfo(result.message);
      await loadProperties();
      if (editingRoomId === roomId) {
        resetRoomForm();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : copy.roomDeleteFailed;
      setError(message);
    }
  };

  return (
    <div className="mt-8 space-y-10">
      {showCoverSuccessPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6">
          <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white px-6 py-5 text-center shadow-2xl">
            <p className="text-sm font-semibold text-emerald-700">
              {copy.coverSuccess}
            </p>
            <button
              type="button"
              onClick={() => setShowCoverSuccessPopup(false)}
              className="mt-4 w-full rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800"
            >
              {copy.close}
            </button>
          </div>
        </div>
      ) : null}
      {showManagement ? (
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                {copy.manageProperty}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                {copy.propertyListTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={loadProperties}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              {copy.reload}
            </button>
          </div>
          {isLoadingProperties ? (
            <p className="mt-4 text-xs text-slate-500">{copy.loadingProperties}</p>
          ) : null}
          {!isLoadingProperties && properties.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              {copy.noPropertyYet}
            </p>
          ) : null}
          {properties.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {properties.map((property) => {
                const isSelected = selectedPropertyId === property.id;
                return (
                  <div
                    key={property.id}
                    className={`rounded-2xl border p-4 transition ${
                      isSelected
                        ? "border-emerald-300 bg-emerald-50/40"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {property.categoryName ?? copy.categoryFallback}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-slate-900">
                          {property.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {property.cityName
                            ? `${property.cityName}${
                                property.province
                                  ? `, ${property.province}`
                                  : ""
                              }`
                            : `ID Kota: ${property.cityId}`}
                        </p>
                      </div>
                      {property.coverUrl ? (
                        <img
                          src={property.coverUrl}
                          alt={property.name}
                          className="h-16 w-20 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-20 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">
                          {copy.noImage}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {showForm ? (
                        <button
                          type="button"
                          onClick={() => handleEditProperty(property)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          {copy.edit}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setSelectedPropertyId(property.id)}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800"
                      >
                        {copy.manageRoom}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProperty(property.id)}
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:text-rose-800"
                      >
                        {copy.delete}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : null}

      {showForm ? (
        <form className="space-y-8" onSubmit={handleSubmit}>
          {editingPropertyId ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              <span>Mode edit properti aktif.</span>
              <button
                type="button"
                onClick={resetPropertyForm}
                className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700"
              >
                Batalkan
              </button>
            </div>
          ) : null}
          <section className="space-y-4">
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Nama Properti
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Oceanview Serenity Villas"
                  value={propertyName}
                  onChange={(event) => setPropertyName(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Kategori Properti
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Pilih atau ketik kategori (min. 2 huruf)"
                    value={categoryQuery}
                    onChange={(event) => {
                      setCategoryQuery(event.target.value);
                      setCategoryId("");
                      setError("");
                    }}
                    onFocus={() => {
                      setIsCategoryMenuOpen(true);
                      if (!categoryOptions.length && !isLoadingCategory) {
                        void loadCategoryOptions("");
                      }
                    }}
                    onBlur={() => {
                      window.setTimeout(() => {
                        setIsCategoryMenuOpen(false);
                      }, 150);
                    }}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                  />
                  {showCategoryDropdown ? (
                    <div className="absolute z-10 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-lg">
                      {categoryOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setCategoryId(option.id);
                            setCategoryQuery(option.name);
                            setCategoryOptions([]);
                            setIsCategoryMenuOpen(false);
                          }}
                          className="flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 last:border-b-0"
                        >
                          <span className="font-semibold text-slate-900">
                            {option.name}
                          </span>
                        </button>
                      ))}
                      {showCreateCategoryOption ? (
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          disabled={isCreatingCategory}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
                        >
                          <span>{`Buat kategori "${normalizedCategoryQuery}"`}</span>
                          <span className="text-xs text-amber-600">
                            {isCreatingCategory ? "Membuat..." : "Buat"}
                          </span>
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                  Alamat 
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan alamat properti selengkap mungkin"
                  value={propertyAddress}
                  onChange={(event) => {
                    setPropertyAddress(event.target.value);
                    setCityId("");
                    setCityQuery("");
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                />
                
              </div>
            </div>
            <div className="space-y-3">
              <TenantPropertyLocationPicker
                latitude={propertyLatitude}
                longitude={propertyLongitude}
                searchQuery={locationSearchQuery}
                onPickLocation={handlePickPropertyLocation}
              />
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Pengaturan Sarapan
                </h2>
                <p className="mt-2 text-xs text-slate-500">
                  Harga berlaku sama untuk semua tipe kamar di properti ini.
                </p>
              </div>
            </div>

            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
              <span>Aktifkan opsi sarapan</span>
              <input
                type="checkbox"
                checked={breakfastEnabled}
                onChange={(event) => setBreakfastEnabled(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900"
              />
            </label>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Harga sarapan per pax per malam (IDR)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 50000"
                value={breakfastPricePerPax ? formatIDR(breakfastPricePerPax) : ""}
                onChange={(event) =>
                  setBreakfastPricePerPax(
                    sanitizeNumberInput(event.target.value),
                  )
                }
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
              />
              <p className="text-xs text-slate-500">
                User tetap bisa memilih kamar tanpa sarapan.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Deskripsi Properti
            </h2>
            <textarea
              rows={5}
              placeholder="Tuliskan deskripsi properti, fasilitas utama, dan keunikan yang ditawarkan."
              value={propertyDesc}
              onChange={(event) => setPropertyDesc(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            />
          </section>

          <section className="space-y-5 rounded-3xl border border-slate-200 bg-white/80 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Fasilitas Properti
                </h2>
                
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Terpilih: {selectedAmenityKeys.length} fasilitas
              </span>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="grid gap-3 md:grid-cols-[220px_1fr] md:items-start">
                <label className="text-sm font-medium text-slate-700">
                  
                  <select
                    value={amenityToAdd}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setAmenityToAdd(nextValue);
                      handleAddAmenity(nextValue);
                    }}
                    className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">Pilih fasilitas...</option>
                    {availableAmenityOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Fasilitas yang tersedia
                  </p>
                  {selectedAmenityKeys.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">
                      Belum ada fasilitas dipilih.
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedAmenityKeys.map((key) => (
                        <span
                          key={key}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          {AMENITY_LABEL_BY_KEY[key]}
                          <button
                            type="button"
                            onClick={() => handleRemoveAmenity(key)}
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] text-slate-600 transition hover:bg-rose-100 hover:text-rose-700"
                            aria-label={`Hapus fasilitas ${AMENITY_LABEL_BY_KEY[key]}`}
                          >
                            x
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Unggah gambar properti
              </h2>
              
            </div>
            <div className="space-y-3">
              
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  multiple
                  onChange={(event) => handleGalleryUpload(event.target.files)}
                  disabled={
                    galleryUrls.length + stagedFiles.length >=
                    MAX_GALLERY_IMAGES
                  }
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
                />
              </div>
              {stagedFiles.length ? (
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-3">
                  <p className="text-xs font-semibold text-slate-700">
                    Staging foto (klik untuk hapus)
                  </p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {stagedFiles.map((item) => (
                      <button
                        key={item.previewUrl}
                        type="button"
                        onClick={() => handleRemoveStaged(item.previewUrl)}
                        className="group relative overflow-hidden rounded-2xl border border-slate-200"
                      >
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="h-24 w-full object-cover transition group-hover:scale-105"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/40 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                          {copy.delete}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      Pastikan gambar sesuai ketentuan sebelum diunggah.
                    </p>
                    <button
                      type="button"
                      onClick={handleUploadStaged}
                      disabled={isUploadingGallery || stagedFiles.length === 0}
                      className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                    >
                      {isUploadingGallery ? "Mengunggah..." : "Unggah Foto"}
                    </button>
                  </div>
                </div>
              ) : null}
              {galleryUrls.length ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-slate-700">
                      Galeri yang sudah diunggah
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSelectingCover((prev) => !prev)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        isSelectingCover
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
                      }`}
                    >
                      {isSelectingCover
                        ? "Batalkan pilih sampul"
                        : "Pilih foto sampul"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    {isSelectingCover
                      ? "Klik foto di galeri untuk dijadikan sampul."
                      : "Gunakan tombol pilih foto sampul lalu klik foto galeri."}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {galleryUrls.map((url, index) => {
                      const selected = coverUrl === url;
                      return (
                        <div key={url} className="relative">
                          <button
                            type="button"
                            onClick={() => handleSelectCoverFromGallery(url)}
                            className={`group relative w-full overflow-hidden rounded-2xl border text-left transition ${
                              selected
                                ? "border-emerald-400 ring-2 ring-emerald-200"
                                : "border-slate-200 hover:border-slate-300"
                            } ${isSelectingCover ? "" : "cursor-default"}`}
                          >
                            <img
                              src={url}
                              alt={`Galeri properti ${index + 1}`}
                              className="h-28 w-full object-cover transition group-hover:scale-105"
                            />
                            {selected ? (
                              <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                Sampul
                              </span>
                            ) : null}
                            {isSelectingCover ? (
                              <span className="absolute inset-x-2 bottom-2 rounded-full bg-slate-900/70 px-2 py-1 text-center text-[10px] font-semibold text-white">
                                Klik jadikan sampul
                              </span>
                            ) : null}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(url)}
                            className="absolute right-2 top-2 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:text-slate-900"
                          >
                            {copy.delete}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {isUploadingGallery ? (
                <p className="text-xs text-slate-500">Mengunggah galeri...</p>
              ) : null}
            </div>
          </section>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
              {info}
            </p>
          ) : null}

          {!editingPropertyId ? (
            <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Draft Kamar
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    Atur kamar saat membuat properti
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleAddRoomDraft}
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  {roomDraftMode === "FULL" ? copy.saveRoom : copy.addRoomDraft}
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {copy.propertyRentalType}
                </label>
                <select
                  value={roomDraftMode}
                  onChange={(event) =>
                    handleRoomDraftModeChange(
                      event.target.value as "FULL" | "PARTIAL",
                    )
                  }
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                >
                  <option value="FULL">
                    {copy.fullRentalOption}
                  </option>
                  <option value="PARTIAL">
                    {copy.partialRentalOption}
                  </option>
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {roomDraftMode === "PARTIAL" ? (
                  <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                      {copy.roomTypeName}
                      </label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(event) => setRoomName(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                    />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {copy.roomPrice}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Rp 1.000.000"
                    value={roomPrice ? formatIDR(roomPrice) : ""}
                    onChange={(event) =>
                      setRoomPrice(sanitizeNumberInput(event.target.value))
                    }
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    {copy.roomDescription}
                  </label>
                  <textarea
                    rows={3}
                    value={roomDescription}
                    onChange={(event) => setRoomDescription(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {copy.maxGuest}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={roomGuests}
                    onChange={(event) => setRoomGuests(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                  />
                </div>
                {roomDraftMode === "PARTIAL" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      {copy.totalUnits}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={roomUnits}
                      onChange={(event) => setRoomUnits(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                    />
                  </div>
                ) : null}
              </div>

              {roomDraftMode === "PARTIAL" ? (
                roomDrafts.length ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-600">
                      {copy.roomDraftList}
                    </p>
                    {roomDrafts.map((draft, index) => (
                      <div
                        key={`${draft.name}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {draft.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {draft.description}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatIDR(draft.price)} • {draft.totalUnits} {copy.perUnit} •{" "}
                            {draft.maxGuests} {copy.guests}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setRoomDrafts((prev) =>
                              prev.filter((_, idx) => idx !== index),
                            )
                          }
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:text-rose-800"
                        >
                          {copy.delete}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    {copy.noRoomDraft}
                  </p>
                )
              ) : null}
            </section>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            
            <button
              type="submit"
              disabled={isSaving || isUploadingGallery}
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              {isSaving
                ? copy.saving
                : editingPropertyId
                  ? copy.updateProperty
                  : copy.saveProperty}
            </button>
          </div>
        </form>
      ) : null}

      {showRoomManagement ? (
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                {copy.roomManagement}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                {copy.roomManagementTitle}
              </h2>
            </div>
            {editingRoomId ? (
              <button
                type="button"
                onClick={resetRoomForm}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700"
              >
                {copy.cancelRoomEdit}
              </button>
            ) : null}
          </div>

          {!selectedProperty ? (
              <p className="mt-4 text-sm text-slate-500">
                {copy.selectPropertyToManageRoom}
              </p>
          ) : (
            <>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                {copy.activeProperty}:{" "}
                <span className="font-semibold text-slate-900">
                  {selectedProperty.name}
                </span>
              </div>
              <form
                className="mt-4 grid gap-4 md:grid-cols-2"
                onSubmit={handleRoomSubmit}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {copy.roomTypeName}
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(event) => setRoomName(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {copy.roomPrice}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Rp 1.000.000"
                    value={roomPrice ? formatIDR(roomPrice) : ""}
                    onChange={(event) =>
                      setRoomPrice(sanitizeNumberInput(event.target.value))
                    }
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    {copy.roomDescription}
                  </label>
                  <textarea
                    rows={3}
                    value={roomDescription}
                    onChange={(event) => setRoomDescription(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {copy.totalUnits}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={roomUnits}
                    onChange={(event) => setRoomUnits(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {copy.maxGuest}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={roomGuests}
                    onChange={(event) => setRoomGuests(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                  />
                </div>
                <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {copy.roomTypeSchemaHint}
                  </p>
                  <button
                    type="submit"
                    disabled={isSavingRoom}
                    className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                  >
                    {isSavingRoom
                      ? copy.saving
                      : editingRoomId
                        ? copy.updateRoom
                        : copy.addRoom}
                  </button>
                </div>
              </form>
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-700">
                  {copy.roomList}
                </h3>
                {selectedProperty.rooms.length ? (
                  <div className="mt-3 space-y-3">
                    {selectedProperty.rooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {room.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {room.description}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatIDR(room.price)} • {room.totalUnits} {copy.perUnit} •{" "}
                            {room.maxGuests} {copy.guests}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditRoom(room)}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                          >
                            {copy.edit}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoom(room.id)}
                            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:text-rose-800"
                          >
                            {copy.delete}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    {copy.noRoomInProperty}
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
