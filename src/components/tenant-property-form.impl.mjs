"use client";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
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
  normalizeAmenityKeys
} from "@/lib/amenities";
const MAX_GALLERY_IMAGES = 5;
const MAX_GALLERY_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp"];
const validateGalleryFile = (file) => {
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
const sanitizeNumberInput = (value) => value.replace(/[^\d]/g, "");
const normalizeCityTerm = (value) => value.toLowerCase().replace(/\bkab\.?\b/g, "kabupaten").replace(/\s+/g, " ").trim();
const buildUniqueCandidates = (values) => Array.from(
  new Set(
    values.map((value) => value?.trim()).filter((value) => Boolean(value && value.length >= 2))
  )
);
const formatIDR = (value) => {
  const numericValue = typeof value === "number" ? value : Number(value.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(numericValue)) return "Rp -";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(numericValue);
};
const asErrorMessage = (error, fallback) => error instanceof Error ? error.message : fallback;
const dedupeRoomItems = (rooms) => {
  const roomMap = /* @__PURE__ */ new Map();
  const roomIdentityMap = /* @__PURE__ */ new Map();
  const normalizeText = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";
  const roomList = Array.isArray(rooms) ? rooms : [];
  for (const rawRoom of roomList) {
    const room = rawRoom && typeof rawRoom === "object" ? rawRoom : null;
    const roomId = typeof room?.id === "string" ? room.id.trim() : "";
    const roomIdentity = [
      normalizeText(room?.name),
      normalizeText(room?.price),
      typeof room?.totalUnits === "number" ? String(room.totalUnits) : "",
      typeof room?.maxGuests === "number" ? String(room.maxGuests) : ""
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
      totalUnits: typeof room?.totalUnits === "number" ? room.totalUnits : prev?.totalUnits ?? 0,
      maxGuests: typeof room?.maxGuests === "number" ? room.maxGuests : prev?.maxGuests ?? 1
    });
  }
  return Array.from(roomMap.values());
};
const normalizeGalleryUrls = (galleryUrls) => Array.from(
  new Set(
    (Array.isArray(galleryUrls) ? galleryUrls : []).filter(
      (url) => typeof url === "string" && url.trim().length > 0
    )
  )
);
const mergeUniqueStrings = (first, second) => Array.from(/* @__PURE__ */ new Set([...first ?? [], ...second ?? []]));
const mergeExistingPropertyItem = (current, item, propertyId, normalizedRooms, normalizedGalleryUrls) => ({
  ...item,
  ...current,
  id: propertyId,
  name: current.name || item.name,
  description: current.description || item.description || "",
  galleryUrls: mergeUniqueStrings(current.galleryUrls, normalizedGalleryUrls),
  amenityKeys: mergeUniqueStrings(current.amenityKeys, item.amenityKeys),
  rooms: dedupeRoomItems([...current.rooms, ...normalizedRooms])
});
const mergePropertyItem = (current, item, propertyId) => {
  const normalizedRooms = dedupeRoomItems(item.rooms);
  const normalizedGalleryUrls = normalizeGalleryUrls(item.galleryUrls);
  if (!current) return { ...item, id: propertyId, galleryUrls: normalizedGalleryUrls, rooms: normalizedRooms };
  return mergeExistingPropertyItem(current, item, propertyId, normalizedRooms, normalizedGalleryUrls);
};
const dedupePropertyItems = (items) => {
  const propertyMap = /* @__PURE__ */ new Map();
  for (const item of items) {
    const propertyId = typeof item?.id === "string" ? item.id.trim() : "";
    if (!propertyId) continue;
    propertyMap.set(propertyId, mergePropertyItem(propertyMap.get(propertyId), item, propertyId));
  }
  return Array.from(propertyMap.values()).sort((a, b) => a.name.localeCompare(b.name, "id-ID"));
};
async function fetchSignature() {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized.");
  }
  return apiFetch("/media/signature", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
async function fetchCatalog(path, search) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized.");
  }
  const query = new URLSearchParams({ search, limit: "10" }).toString();
  const response = await apiFetch(
    `/catalog/${path}?${query}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return Array.isArray(response) ? response : response.data ?? [];
}
const requireToken = () => {
  const token = getAuthToken();
  if (!token) throw new Error("Unauthorized.");
  return token;
};
const fetchPropertyPage = async (token, page, limit) => {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiFetch(`/properties?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
const fetchAllPropertyPages = async (token) => {
  const aggregated = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await fetchPropertyPage(token, page, 50);
    aggregated.push(...response.data ?? []);
    totalPages = Math.max(1, response.meta?.totalPages ?? 1);
    page += 1;
  } while (page <= totalPages);
  return aggregated;
};
async function fetchProperties() {
  const token = requireToken();
  return dedupePropertyItems(await fetchAllPropertyPages(token));
}
async function createCategory(name) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized.");
  }
  return apiFetch("/catalog/categories", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name })
  });
}
async function updatePropertyRequest(id, payload) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized.");
  }
  return apiFetch(`/properties/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}
async function deletePropertyRequest(id) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized.");
  }
  return apiFetch(`/properties/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-user-approval": "true"
    }
  });
}
async function createRoomRequest(propertyId, payload) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized.");
  }
  return apiFetch(
    `/properties/${propertyId}/rooms`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }
  );
}
async function updateRoomRequest(roomId, payload) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized.");
  }
  return apiFetch(
    `/properties/rooms/${roomId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }
  );
}
async function deleteRoomRequest(roomId) {
  const token = requireToken();
  return apiFetch(`/properties/rooms/${roomId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, "x-user-approval": "true" }
  });
}
const appendSignatureOptionalFields = (formData, signature) => {
  if (signature.folder) formData.append("folder", signature.folder);
  if (signature.allowedFormats?.length) formData.append("allowed_formats", signature.allowedFormats.join(","));
  if (typeof signature.maxFileSize === "number") formData.append("max_file_size", String(signature.maxFileSize));
};
const buildUploadFormData = (file, signature) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", signature.timestamp.toString());
  formData.append("signature", signature.signature);
  appendSignatureOptionalFields(formData, signature);
  return formData;
};
const parseUploadResponse = async (response) => {
  const data = await response.json();
  if (!response.ok || !data.secure_url) throw new Error(data.error?.message || "Upload gambar gagal.");
  return data.secure_url;
};
async function uploadToCloudinary(file, signature) {
  const uploadUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`;
  const response = await fetch(uploadUrl, { method: "POST", body: buildUploadFormData(file, signature) });
  return parseUploadResponse(response);
}
function TenantPropertyForm({
  showManagement = true,
  showForm = true,
  showRoomManagement = true,
  redirectOnCreateTo
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useAppLocaleValue();
  const isEnglish = locale === "en";
  const copy = useMemo(
    () => ({
      loadPropertyFailed: isEnglish ? "Failed to load properties." : "Gagal memuat properti.",
      propertyNotFound: isEnglish ? "Property to edit was not found." : "Properti yang ingin diedit tidak ditemukan.",
      editModeNotReady: isEnglish ? "Edit target is not ready yet. Reload this page and try again." : "Data properti untuk edit belum siap. Muat ulang halaman lalu coba lagi.",
      confirmDeleteProperty: isEnglish ? "Delete this property?" : "Hapus properti ini?",
      confirmDeleteRoom: isEnglish ? "Delete this room?" : "Hapus kamar ini?",
      deleteFailed: isEnglish ? "Failed to delete." : "Gagal menghapus.",
      roomDeleteFailed: isEnglish ? "Failed to delete room." : "Gagal menghapus kamar.",
      selectPropertyBeforeRoom: isEnglish ? "Select a property first to add a room." : "Pilih properti terlebih dahulu untuk menambah kamar.",
      roomNameDescRequired: isEnglish ? "Room name and description are required." : "Nama dan deskripsi kamar wajib diisi.",
      roomPriceRequired: isEnglish ? "Room price is required." : "Harga kamar wajib diisi.",
      roomUnitsGuestsRequired: isEnglish ? "Total units and max guests are required." : "Total unit dan maksimal tamu wajib diisi.",
      roomSaveFailed: isEnglish ? "Failed to save room." : "Gagal menyimpan kamar.",
      roomDescriptionRequired: isEnglish ? "Room description is required." : "Deskripsi kamar wajib diisi.",
      maxGuestRequired: isEnglish ? "Max guests is required." : "Maksimal tamu wajib diisi.",
      fullPropertyRoomName: isEnglish ? "Entire Property" : "Properti Utuh",
      coverSuccess: isEnglish ? "Image successfully set as cover." : "Foto berhasil dijadikan sampul.",
      close: isEnglish ? "Close" : "Tutup",
      manageProperty: isEnglish ? "Manage Properties" : "Kelola Properti",
      propertyListTitle: isEnglish ? "List of properties you created" : "Daftar properti yang sudah dibuat",
      reload: isEnglish ? "Reload" : "Muat Ulang",
      loadingProperties: isEnglish ? "Loading properties..." : "Memuat properti...",
      noPropertyYet: isEnglish ? "No properties yet. Create a new property using the form below." : "Belum ada properti. Silakan buat properti baru di form bawah.",
      categoryFallback: isEnglish ? "Category" : "Kategori",
      noImage: isEnglish ? "No image" : "Tidak ada gambar",
      edit: isEnglish ? "Edit" : "Ubah",
      manageRoom: isEnglish ? "Manage Rooms" : "Kelola Kamar",
      delete: isEnglish ? "Delete" : "Hapus",
      roomManagement: isEnglish ? "Manage Rooms" : "Kelola Kamar",
      roomManagementTitle: isEnglish ? "Manage rooms for selected property" : "Kelola kamar untuk properti terpilih",
      cancelRoomEdit: isEnglish ? "Cancel room edit" : "Batalkan edit kamar",
      selectPropertyToManageRoom: isEnglish ? "Select a property from the list above to manage rooms." : "Pilih properti dari daftar di atas untuk mengelola kamar.",
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
      fullRentalOption: isEnglish ? "This property is rented as an entire unit" : "Properti ini disewakan secara keseluruhan",
      partialRentalOption: isEnglish ? "This property has multiple rooms" : "Properti ini memiliki beberapa kamar",
      saving: isEnglish ? "Saving..." : "Menyimpan...",
      perUnit: isEnglish ? "units" : "unit",
      guests: isEnglish ? "guests" : "tamu",
      roomDraftList: isEnglish ? "Room drafts to be created" : "Draft kamar yang akan dibuat",
      noRoomDraft: isEnglish ? "No room drafts have been added." : "Belum ada draft kamar ditambahkan.",
      roomTypeSchemaHint: isEnglish ? "Fields follow the `RoomType` structure in Prisma schema." : "Field mengikuti struktur `RoomType` di Prisma schema.",
      roomList: isEnglish ? "Room List" : "Daftar Kamar",
      noRoomInProperty: isEnglish ? "No rooms available for this property yet." : "Belum ada kamar untuk properti ini."
    }),
    [isEnglish]
  );
  const editPropertyIdFromUrl = (searchParams.get("edit") ?? "").trim();
  const [propertyName, setPropertyName] = useState("");
  const [propertyDesc, setPropertyDesc] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyLatitude, setPropertyLatitude] = useState(null);
  const [propertyLongitude, setPropertyLongitude] = useState(
    null
  );
  const [coverUrl, setCoverUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState([]);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [lastCategorySearch, setLastCategorySearch] = useState(
    null
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
  const [properties, setProperties] = useState([]);
  const [editingPropertyId, setEditingPropertyId] = useState(
    null
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    null
  );
  const [stagedFiles, setStagedFiles] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [roomPrice, setRoomPrice] = useState("");
  const [roomUnits, setRoomUnits] = useState("");
  const [roomGuests, setRoomGuests] = useState("");
  const [roomDrafts, setRoomDrafts] = useState([]);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [roomDraftMode, setRoomDraftMode] = useState(
    "PARTIAL"
  );
  const [selectedAmenityKeys, setSelectedAmenityKeys] = useState(
    []
  );
  const [breakfastEnabled, setBreakfastEnabled] = useState(false);
  const [breakfastPricePerPax, setBreakfastPricePerPax] = useState("");
  const [amenityToAdd, setAmenityToAdd] = useState("");
  const [isSelectingCover, setIsSelectingCover] = useState(false);
  const [showCoverSuccessPopup, setShowCoverSuccessPopup] = useState(false);
  const coverSuccessTimerRef = useRef(null);
  const selectedProperty = useMemo(
    () => properties.find((item) => item.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId]
  );
  const availableAmenityOptions = useMemo(
    () => ALL_AMENITY_OPTIONS.filter(
      (option) => !selectedAmenityKeys.includes(option.key)
    ),
    [selectedAmenityKeys]
  );
  const locationSearchQuery = useMemo(
    () => propertyAddress.trim(),
    [propertyAddress]
  );
  const normalizedCategoryQuery = categoryQuery.trim();
  const hasCategoryQuery = normalizedCategoryQuery.length >= 2;
  const categoryExactMatch = categoryOptions.some(
    (option) => option.name.toLowerCase() === normalizedCategoryQuery.toLowerCase()
  );
  const showCategoryDropdown = isCategoryMenuOpen && (hasCategoryQuery || categoryOptions.length > 0);
  const showCreateCategoryOption = hasCategoryQuery && !categoryExactMatch && normalizedCategoryQuery.length >= 2;
  const clearEditQueryParam = useCallback(() => {
    if (!editPropertyIdFromUrl) return;
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("edit")) return;
    params.delete("edit");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/tenant-property?${nextQuery}` : "/tenant-property");
  }, [editPropertyIdFromUrl, router, searchParams]);
  const applyLoadedCategoryOptions = (options, trimmedSearch) => {
    setCategoryOptions(options);
    setLastCategorySearch(trimmedSearch);
  };
  const loadCategoryOptions = async (search) => {
    const trimmedSearch = search.trim();
    setIsLoadingCategory(true);
    try {
      const options = await fetchCatalog("categories", trimmedSearch);
      applyLoadedCategoryOptions(options, trimmedSearch);
    } catch (error2) {
      setError(asErrorMessage(error2, "Gagal memuat kategori."));
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
  const applyLoadedProperties = (items) => {
    setProperties(items);
    if (items.length && !selectedPropertyId) setSelectedPropertyId(items[0].id);
  };
  const loadProperties = async () => {
    setIsLoadingProperties(true);
    try {
      applyLoadedProperties(await fetchProperties());
    } catch (error2) {
      setError(asErrorMessage(error2, copy.loadPropertyFailed));
    } finally {
      setIsLoadingProperties(false);
    }
  };
  useEffect(() => {
    if (!showManagement && !showRoomManagement && !editPropertyIdFromUrl) return;
    loadProperties();
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
      if (isCategoryMenuOpen && !isLoadingCategory && lastCategorySearch !== "") {
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
    lastCategorySearch
  ]);
  useEffect(() => {
    if (!categoryOptions.length || !categoryQuery.trim()) return;
    const match = categoryOptions.find(
      (option) => option.name.toLowerCase() === categoryQuery.trim().toLowerCase()
    );
    if (match && categoryId !== match.id) {
      setCategoryId(match.id);
    }
  }, [categoryOptions, categoryQuery, categoryId]);
  const getRemainingGallerySlots = () => MAX_GALLERY_IMAGES - galleryUrls.length - stagedFiles.length;
  const toStagedFiles = (files) => files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
  const hasInvalidGalleryFile = (files) => files.some((file) => Boolean(validateGalleryFile(file)));
  const handleGalleryUpload = async (files) => {
    if (!files || files.length === 0) return;
    setError("");
    setInfo("");
    const remaining = getRemainingGallerySlots();
    if (remaining <= 0) return setError(`Maksimal ${MAX_GALLERY_IMAGES} foto untuk galeri.`);
    const filesToStage = Array.from(files).slice(0, remaining);
    if (hasInvalidGalleryFile(filesToStage)) return setError("Gambar tidak sesuai dengan ketentuan.");
    setStagedFiles((prev) => [...prev, ...toStagedFiles(filesToStage)]);
    if (files.length > remaining) setInfo(`Maksimal ${MAX_GALLERY_IMAGES} foto untuk galeri.`);
  };
  const uploadStagedFiles = async (files) => {
    const uploaded = [];
    for (const staged of files) {
      uploaded.push(await uploadToCloudinary(staged.file, await fetchSignature()));
    }
    return uploaded;
  };
  const clearStagedFiles = (files) => {
    files.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setStagedFiles([]);
  };
  const handleUploadStaged = async () => {
    if (!stagedFiles.length) return;
    setError("");
    setInfo("");
    setIsUploadingGallery(true);
    try {
      const uploadedUrls = await uploadStagedFiles(stagedFiles);
      setGalleryUrls((prev) => [...prev, ...uploadedUrls]);
      setInfo("Galeri berhasil diunggah.");
      clearStagedFiles(stagedFiles);
    } catch (error2) {
      setError(asErrorMessage(error2, "Upload gagal."));
    } finally {
      setIsUploadingGallery(false);
    }
  };
  const handleRemoveStaged = (previewUrl) => {
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
  const handleSelectCoverFromGallery = (url) => {
    if (!isSelectingCover) return;
    setCoverUrl(url);
    setIsSelectingCover(false);
    showCoverSuccessMessage();
  };
  const handleRemoveGalleryImage = (url) => {
    const next = galleryUrls.filter((item) => item !== url);
    setGalleryUrls(next);
    if (coverUrl === url) {
      setCoverUrl(next[0] ?? "");
    }
  };
  const applyCreatedCategory = (option) => {
    setCategoryId(option.id);
    setCategoryQuery(option.name);
    setCategoryOptions([]);
    setIsCategoryMenuOpen(false);
  };
  const handleCreateCategory = async () => {
    const name = categoryQuery.trim();
    if (name.length < 2) return setError("Nama kategori minimal 2 karakter.");
    if (isCreatingCategory) return;
    setError("");
    setInfo("");
    setIsCreatingCategory(true);
    try {
      applyCreatedCategory(await createCategory(name));
    } catch (error2) {
      setError(asErrorMessage(error2, "Gagal membuat kategori."));
    } finally {
      setIsCreatingCategory(false);
    }
  };
  const applyAutoDetectedCity = useCallback((option) => {
    setCityId(option.id);
    setCityQuery(
      option.province ? `${option.name}, ${option.province}` : option.name
    );
  }, []);
  const resolveCityOptionFromCandidates = useCallback(
    async (rawCandidates, provinceHint) => {
      const candidates = buildUniqueCandidates(rawCandidates);
      if (candidates.length === 0) return null;
      const normalizedProvinceHint = provinceHint ? normalizeCityTerm(provinceHint) : "";
      for (const candidate of candidates) {
        try {
          const result = await fetchCatalog("cities", candidate);
          if (!Array.isArray(result) || result.length === 0) continue;
          const normalizedCandidate = normalizeCityTerm(candidate);
          const byExact = result.find(
            (option) => normalizeCityTerm(option.name) === normalizedCandidate
          );
          if (byExact) return byExact;
          const byContains = result.find((option) => {
            const normalizedOption = normalizeCityTerm(option.name);
            return normalizedOption.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedOption);
          });
          if (byContains) return byContains;
          if (normalizedProvinceHint) {
            const byProvince = result.find(
              (option) => normalizeCityTerm(option.province ?? "").includes(
                normalizedProvinceHint
              )
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
    []
  );
  const detectCityFromAddressOrMap = useCallback(async () => {
    const candidates = [];
    let provinceHint = null;
    const pushCandidates = (...values) => {
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
            "Accept-Language": "id,en"
          }
        });
        if (response.ok) {
          const payload = await response.json();
          const firstResult = payload[0];
          const nextLatitude = Number(firstResult?.lat);
          const nextLongitude = Number(firstResult?.lon);
          const hasCurrentCoordinates = typeof propertyLatitude === "number" && Number.isFinite(propertyLatitude) && typeof propertyLongitude === "number" && Number.isFinite(propertyLongitude);
          if (!hasCurrentCoordinates && Number.isFinite(nextLatitude) && Number.isFinite(nextLongitude)) {
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
            details?.state_district
          );
          provinceHint = details?.state?.trim() || provinceHint;
        }
      } catch {
      }
    }
    const hasCoordinates = typeof propertyLatitude === "number" && Number.isFinite(propertyLatitude) && typeof propertyLongitude === "number" && Number.isFinite(propertyLongitude);
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
            "Accept-Language": "id,en"
          }
        });
        if (reverseResponse.ok) {
          const reversePayload = await reverseResponse.json();
          const details = reversePayload.address;
          pushCandidates(
            details?.city,
            details?.town,
            details?.municipality,
            details?.village,
            details?.county,
            details?.state_district
          );
          provinceHint = details?.state?.trim() || provinceHint;
        }
      } catch {
      }
    }
    pushCandidates(cityQuery.split(",")[0], trimmedAddress);
    const option = await resolveCityOptionFromCandidates(
      candidates,
      provinceHint
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
    resolveCityOptionFromCandidates
  ]);
  const handlePickPropertyLocation = useCallback(
    (location) => {
      setPropertyLatitude(location.latitude);
      setPropertyLongitude(location.longitude);
      setCityId("");
      setCityQuery("");
      if (location.resolvedAddress) {
        setPropertyAddress(location.resolvedAddress);
      }
      const candidates = buildUniqueCandidates([
        location.cityCandidate,
        location.districtCandidate
      ]);
      if (candidates.length === 0) return;
      void (async () => {
        setIsLoadingCity(true);
        try {
          const option = await resolveCityOptionFromCandidates(
            candidates,
            location.provinceCandidate ?? null
          );
          if (!option) return;
          applyAutoDetectedCity(option);
        } finally {
          setIsLoadingCity(false);
        }
      })();
    },
    [applyAutoDetectedCity, resolveCityOptionFromCandidates]
  );
  const handleAddAmenity = (amenityKey) => {
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
  const handleRemoveAmenity = (amenityKey) => {
    setError("");
    setSelectedAmenityKeys(
      (prev) => prev.filter((item) => item !== amenityKey)
    );
  };
  const clearCoverSuccessTimer = () => {
    if (!coverSuccessTimerRef.current) return;
    window.clearTimeout(coverSuccessTimerRef.current);
    coverSuccessTimerRef.current = null;
  };
  const resetPropertyIdentityFields = () => {
    setPropertyName("");
    setPropertyDesc("");
    setPropertyAddress("");
    setPropertyLatitude(null);
    setPropertyLongitude(null);
    setCategoryQuery("");
    setCategoryId("");
    setCategoryOptions([]);
    setCityQuery("");
    setCityId("");
  };
  const resetPropertyVisualFields = () => {
    setIsSelectingCover(false);
    setShowCoverSuccessPopup(false);
    setCoverUrl("");
    setGalleryUrls([]);
    setSelectedAmenityKeys([]);
    setBreakfastEnabled(false);
    setBreakfastPricePerPax("");
    setAmenityToAdd("");
  };
  const resetPropertyForm = () => {
    clearCoverSuccessTimer();
    resetPropertyIdentityFields();
    resetPropertyVisualFields();
    clearStagedFiles(stagedFiles);
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
  const handleRoomDraftModeChange = (mode) => {
    setRoomDraftMode(mode);
    setRoomDrafts([]);
    resetRoomDraftForm();
  };
  const buildFullPropertyDraft = () => ({
    name: propertyName.trim() ? `${propertyName.trim()} \xB7 ${copy.fullPropertyRoomName}` : copy.fullPropertyRoomName,
    description: roomDescription.trim(),
    price: roomPrice.trim(),
    totalUnits: "1",
    maxGuests: roomGuests.trim()
  });
  const getRoomDraftValidationError = () => {
    if (!roomDescription.trim()) return copy.roomDescriptionRequired;
    if (!roomPrice.trim()) return copy.roomPriceRequired;
    if (!roomGuests.trim()) return copy.maxGuestRequired;
    if (roomDraftMode === "PARTIAL" && !roomName.trim()) return "Nama kamar wajib diisi.";
    if (roomDraftMode === "PARTIAL" && !roomUnits.trim()) return "Total unit wajib diisi.";
    return "";
  };
  const buildPartialRoomDraft = () => ({
    name: roomName.trim(),
    description: roomDescription.trim(),
    price: roomPrice.trim(),
    totalUnits: roomUnits.trim(),
    maxGuests: roomGuests.trim()
  });
  const handleAddRoomDraft = () => {
    setError("");
    setInfo("");
    const errorMessage = getRoomDraftValidationError();
    if (errorMessage) return setError(errorMessage);
    if (roomDraftMode === "FULL") return setRoomDrafts([buildFullPropertyDraft()]);
    setRoomDrafts((prev) => [...prev, buildPartialRoomDraft()]);
    resetRoomDraftForm();
  };
  const toFiniteCoordinate = (value) => typeof value === "number" && Number.isFinite(value) ? value : null;
  const buildPropertyCityLabel = (property) => property.cityName ? property.province ? `${property.cityName}, ${property.province}` : property.cityName : property.cityId;
  const applyPropertyLocationToForm = (property) => {
    setPropertyAddress(property.address ?? "");
    setPropertyLatitude(toFiniteCoordinate(property.latitude));
    setPropertyLongitude(toFiniteCoordinate(property.longitude));
    setCategoryId(property.categoryId);
    setCategoryQuery(property.categoryName ?? property.categoryId);
    setCityId(property.cityId);
    setCityQuery(buildPropertyCityLabel(property));
  };
  const applyPropertyMediaToForm = (property) => {
    setGalleryUrls(property.galleryUrls);
    setCoverUrl(property.coverUrl ?? property.galleryUrls[0] ?? "");
    clearStagedFiles(stagedFiles);
  };
  const applyPropertyAmenitiesToForm = (property) => {
    setSelectedAmenityKeys(normalizeAmenityKeys(property.amenityKeys ?? []));
    setBreakfastEnabled(Boolean(property.breakfast?.enabled));
    setBreakfastPricePerPax(property.breakfast?.pricePerPax ? sanitizeNumberInput(property.breakfast.pricePerPax) : "");
    setAmenityToAdd("");
  };
  const handleEditProperty = (property) => {
    setEditingPropertyId(property.id);
    setSelectedPropertyId(property.id);
    setPropertyName(property.name);
    setPropertyDesc(property.description);
    applyPropertyLocationToForm(property);
    applyPropertyMediaToForm(property);
    applyPropertyAmenitiesToForm(property);
    setInfo("Mode edit properti aktif.");
  };
  const appliedUrlEditIdRef = useRef(null);
  useEffect(() => {
    if (!editPropertyIdFromUrl) {
      appliedUrlEditIdRef.current = null;
      return;
    }
    if (appliedUrlEditIdRef.current === editPropertyIdFromUrl) return;
    if (isLoadingProperties || properties.length === 0) return;
    const targetProperty = properties.find(
      (property) => property.id === editPropertyIdFromUrl
    );
    if (!targetProperty) {
      setError(copy.propertyNotFound);
      appliedUrlEditIdRef.current = editPropertyIdFromUrl;
      clearEditQueryParam();
      return;
    }
    handleEditProperty(targetProperty);
    appliedUrlEditIdRef.current = editPropertyIdFromUrl;
  }, [clearEditQueryParam, copy.propertyNotFound, editPropertyIdFromUrl, isLoadingProperties, properties]);
  const handleEditRoom = (room) => {
    setEditingRoomId(room.id);
    setRoomName(room.name);
    setRoomDescription(room.description);
    setRoomPrice(sanitizeNumberInput(String(room.price)));
    setRoomUnits(String(room.totalUnits));
    setRoomGuests(String(room.maxGuests));
    setInfo("Mode edit kamar aktif.");
  };
  const getPropertySubmitBaseError = () => {
    if (editPropertyIdFromUrl && !editingPropertyId) return copy.editModeNotReady;
    if (!propertyName.trim() || !propertyDesc.trim()) return "Nama dan deskripsi properti wajib diisi.";
    if (!propertyAddress.trim()) return "Alamat properti wajib diisi.";
    return "";
  };
  const applyAutoCreatedCategoryForSubmit = (created) => {
    setCategoryId(created.id);
    setCategoryQuery(created.name);
    setCategoryOptions([]);
    setInfo(`Kategori "${created.name}" berhasil dibuat.`);
  };
  const resolveCategoryIdForSubmit = async () => {
    if (categoryId) return categoryId;
    const categoryName = categoryQuery.trim();
    if (!categoryName) throw new Error("Pilih kategori properti terlebih dahulu.");
    const created = await createCategory(categoryName);
    applyAutoCreatedCategoryForSubmit(created);
    return created.id;
  };
  const resolveCityIdForSubmit = async () => {
    if (cityId) return cityId;
    setIsLoadingCity(true);
    try {
      return await detectCityFromAddressOrMap() ?? "";
    } finally {
      setIsLoadingCity(false);
    }
  };
  const getSubmitRequirementsError = (resolvedCityId) => {
    if (!resolvedCityId) return "Lokasi belum terdeteksi otomatis. Pilih titik di peta atau lengkapi alamat.";
    if (stagedFiles.length > 0) return "Unggah foto terlebih dahulu.";
    if (!galleryUrls.length) return "Upload minimal 1 foto untuk galeri.";
    if (!coverUrl) return "Pilih foto sampul dari galeri.";
    if (!selectedAmenityKeys.length) return "Pilih minimal satu fasilitas properti.";
    return "";
  };
  const resolveRoomDraftsForSubmit = () => {
    if (editingPropertyId || roomDraftMode !== "FULL") return roomDrafts;
    if (!roomDescription.trim() || !roomPrice.trim() || !roomGuests.trim()) {
      throw new Error("Lengkapi harga, maksimal tamu, dan deskripsi kamar.");
    }
    return [buildFullPropertyDraft()];
  };
  const buildPropertyPayloadForSubmit = (resolvedCategoryId, resolvedCityId) => ({
    name: propertyName.trim(),
    description: propertyDesc.trim(),
    address: propertyAddress.trim() || void 0,
    latitude: propertyLatitude ?? void 0,
    longitude: propertyLongitude ?? void 0,
    categoryId: resolvedCategoryId,
    cityId: resolvedCityId,
    coverUrl,
    galleryUrls,
    amenityKeys: selectedAmenityKeys,
    breakfastEnabled,
    breakfastPricePerPax: Number(breakfastPricePerPax || "0")
  });
  const savePropertyRecord = async (token, payload) => {
    if (editingPropertyId) return updatePropertyRequest(editingPropertyId, payload);
    return apiFetch("/properties", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
  };
  const createRoomsFromDrafts = async (propertyId, drafts) => {
    for (const draft of drafts) {
      await createRoomRequest(propertyId, draft);
    }
  };
  const savePropertyAndDraftRooms = async (token, resolvedCategoryId, resolvedCityId, draftsToCreate) => {
    const result = await savePropertyRecord(token, buildPropertyPayloadForSubmit(resolvedCategoryId, resolvedCityId));
    if (!editingPropertyId && draftsToCreate.length > 0) await createRoomsFromDrafts(result.id, draftsToCreate);
    return result;
  };
  const finalizeSuccessfulPropertySubmit = async (message, isCreating) => {
    setInfo(message);
    if (showManagement || showRoomManagement) await loadProperties();
    if (isCreating && redirectOnCreateTo) return void router.push(redirectOnCreateTo);
    if (editingPropertyId && editPropertyIdFromUrl) clearEditQueryParam();
    resetPropertyForm();
  };
  const runPropertySubmit = async () => {
    const token = requireToken();
    const resolvedCategoryId = await resolveCategoryIdForSubmit();
    const resolvedCityId = await resolveCityIdForSubmit();
    const requirementsError = getSubmitRequirementsError(resolvedCityId);
    if (requirementsError) throw new Error(requirementsError);
    const draftsToCreate = resolveRoomDraftsForSubmit();
    const result = await savePropertyAndDraftRooms(token, resolvedCategoryId, resolvedCityId, draftsToCreate);
    await finalizeSuccessfulPropertySubmit(result.message, !editingPropertyId);
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSaving || isUploadingGallery) return;
    setError("");
    setInfo("");
    const baseError = getPropertySubmitBaseError();
    if (baseError) return setError(baseError);
    setIsSaving(true);
    try {
      await runPropertySubmit();
    } catch (error2) {
      setError(asErrorMessage(error2, "Gagal menyimpan."));
    } finally {
      setIsSaving(false);
    }
  };
  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm(copy.confirmDeleteProperty)) return;
    setError("");
    setInfo("");
    try {
      const result = await deletePropertyRequest(propertyId);
      setInfo(result.message);
      await loadProperties();
      if (editingPropertyId === propertyId) resetPropertyForm();
    } catch (error2) {
      setError(asErrorMessage(error2, copy.deleteFailed));
    }
  };
  const handleCancelPropertyEdit = () => {
    setError("");
    setInfo("");
    resetPropertyForm();
    clearEditQueryParam();
  };
  const getRoomSubmitValidationError = () => {
    if (!selectedPropertyId) return copy.selectPropertyBeforeRoom;
    if (!roomName.trim() || !roomDescription.trim()) return copy.roomNameDescRequired;
    if (!roomPrice.trim()) return copy.roomPriceRequired;
    if (!roomUnits.trim() || !roomGuests.trim()) return copy.roomUnitsGuestsRequired;
    return "";
  };
  const buildRoomPayload = () => ({
    name: roomName.trim(),
    description: roomDescription.trim(),
    price: roomPrice.trim(),
    totalUnits: roomUnits.trim(),
    maxGuests: roomGuests.trim()
  });
  const saveRoomForSubmit = async (payload) => {
    if (editingRoomId) return updateRoomRequest(editingRoomId, payload);
    if (!selectedPropertyId) throw new Error(copy.selectPropertyBeforeRoom);
    return createRoomRequest(selectedPropertyId, payload);
  };
  const handleRoomSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    const errorMessage = getRoomSubmitValidationError();
    if (errorMessage) return setError(errorMessage);
    setIsSavingRoom(true);
    try {
      const result = await saveRoomForSubmit(buildRoomPayload());
      setInfo(result.message);
      await loadProperties();
      resetRoomForm();
    } catch (error2) {
      setError(asErrorMessage(error2, copy.roomSaveFailed));
    } finally {
      setIsSavingRoom(false);
    }
  };
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm(copy.confirmDeleteRoom)) return;
    setError("");
    setInfo("");
    try {
      const result = await deleteRoomRequest(roomId);
      setInfo(result.message);
      await loadProperties();
      if (editingRoomId === roomId) resetRoomForm();
    } catch (error2) {
      setError(asErrorMessage(error2, copy.roomDeleteFailed));
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "mt-8 space-y-10", children: [
    showCoverSuccessPopup ? /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm rounded-2xl border border-emerald-200 bg-white px-6 py-5 text-center shadow-2xl", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-emerald-700", children: copy.coverSuccess }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setShowCoverSuccessPopup(false),
          className: "mt-4 w-full rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800",
          children: copy.close
        }
      )
    ] }) }) : null,
    showManagement ? /* @__PURE__ */ jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white/80 p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: copy.manageProperty }),
          /* @__PURE__ */ jsx("h2", { className: "mt-2 text-xl font-semibold text-slate-900", children: copy.propertyListTitle })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: loadProperties,
            className: "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900",
            children: copy.reload
          }
        )
      ] }),
      isLoadingProperties ? /* @__PURE__ */ jsx("p", { className: "mt-4 text-xs text-slate-500", children: copy.loadingProperties }) : null,
      !isLoadingProperties && properties.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-slate-500", children: copy.noPropertyYet }) : null,
      properties.length ? /* @__PURE__ */ jsx("div", { className: "mt-4 grid gap-4 md:grid-cols-2", children: properties.map((property) => {
        const isSelected = selectedPropertyId === property.id;
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: `rounded-2xl border p-4 transition ${isSelected ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-white"}`,
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.2em] text-slate-400", children: property.categoryName ?? copy.categoryFallback }),
                  /* @__PURE__ */ jsx("h3", { className: "mt-1 text-base font-semibold text-slate-900", children: property.name }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: property.cityName ? `${property.cityName}${property.province ? `, ${property.province}` : ""}` : `ID Kota: ${property.cityId}` })
                ] }),
                property.coverUrl ? /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: property.coverUrl,
                    alt: property.name,
                    className: "h-16 w-20 rounded-xl object-cover"
                  }
                ) : /* @__PURE__ */ jsx("div", { className: "flex h-16 w-20 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400", children: copy.noImage })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
                showForm ? /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleEditProperty(property),
                    className: "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900",
                    children: copy.edit
                  }
                ) : null,
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setSelectedPropertyId(property.id),
                    className: "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800",
                    children: copy.manageRoom
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleDeleteProperty(property.id),
                    className: "rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:text-rose-800",
                    children: copy.delete
                  }
                )
              ] })
            ]
          },
          property.id
        );
      }) }) : null
    ] }) : null,
    showForm ? /* @__PURE__ */ jsxs("form", { className: "space-y-8", onSubmit: handleSubmit, children: [
      editingPropertyId ? /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700", children: [
        /* @__PURE__ */ jsx("span", { children: "Mode edit properti aktif." }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleCancelPropertyEdit,
            className: "rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700",
            children: "Batalkan"
          }
        )
      ] }) : null,
      /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: "Nama Properti" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Contoh: Oceanview Serenity Villas",
                value: propertyName,
                onChange: (event) => setPropertyName(event.target.value),
                className: "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: "Kategori Properti" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "Pilih atau ketik kategori (min. 2 huruf)",
                  value: categoryQuery,
                  onChange: (event) => {
                    setCategoryQuery(event.target.value);
                    setCategoryId("");
                    setError("");
                  },
                  onFocus: () => {
                    setIsCategoryMenuOpen(true);
                    if (!categoryOptions.length && !isLoadingCategory) {
                      void loadCategoryOptions("");
                    }
                  },
                  onBlur: () => {
                    window.setTimeout(() => {
                      setIsCategoryMenuOpen(false);
                    }, 150);
                  },
                  className: "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                }
              ),
              showCategoryDropdown ? /* @__PURE__ */ jsxs("div", { className: "absolute z-10 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-lg", children: [
                categoryOptions.map((option) => /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      setCategoryId(option.id);
                      setCategoryQuery(option.name);
                      setCategoryOptions([]);
                      setIsCategoryMenuOpen(false);
                    },
                    className: "flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 last:border-b-0",
                    children: /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-900", children: option.name })
                  },
                  option.id
                )),
                showCreateCategoryOption ? /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: handleCreateCategory,
                    disabled: isCreatingCategory,
                    className: "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-amber-700 transition hover:bg-amber-50",
                    children: [
                      /* @__PURE__ */ jsx("span", { children: `Buat kategori "${normalizedCategoryQuery}"` }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs text-amber-600", children: isCreatingCategory ? "Membuat..." : "Buat" })
                    ]
                  }
                ) : null
              ] }) : null
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2 md:col-span-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: "Alamat" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              required: true,
              placeholder: "Masukkan alamat properti selengkap mungkin",
              value: propertyAddress,
              onChange: (event) => {
                setPropertyAddress(event.target.value);
                setCityId("");
                setCityQuery("");
              },
              className: "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: /* @__PURE__ */ jsx(
          TenantPropertyLocationPicker,
          {
            latitude: propertyLatitude,
            longitude: propertyLongitude,
            searchQuery: locationSearchQuery,
            onPickLocation: handlePickPropertyLocation
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-5", children: [
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-start justify-between gap-3", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold uppercase tracking-[0.3em] text-slate-400", children: "Pengaturan Sarapan" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-slate-500", children: "Harga berlaku sama untuk semua tipe kamar di properti ini." })
        ] }) }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700", children: [
          /* @__PURE__ */ jsx("span", { children: "Aktifkan opsi sarapan" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: breakfastEnabled,
              onChange: (event) => setBreakfastEnabled(event.target.checked),
              className: "h-4 w-4 rounded border-slate-300 text-slate-900"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: "Harga sarapan per pax per malam (IDR)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              inputMode: "numeric",
              placeholder: "Contoh: 50000",
              value: breakfastPricePerPax ? formatIDR(breakfastPricePerPax) : "",
              onChange: (event) => setBreakfastPricePerPax(
                sanitizeNumberInput(event.target.value)
              ),
              className: "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "User tetap bisa memilih kamar tanpa sarapan." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold uppercase tracking-[0.3em] text-slate-400", children: "Deskripsi Properti" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            rows: 5,
            placeholder: "Tuliskan deskripsi properti, fasilitas utama, dan keunikan yang ditawarkan.",
            value: propertyDesc,
            onChange: (event) => setPropertyDesc(event.target.value),
            className: "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "space-y-5 rounded-3xl border border-slate-200 bg-white/80 p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold uppercase tracking-[0.3em] text-slate-400", children: "Fasilitas Properti" }) }),
          /* @__PURE__ */ jsxs("span", { className: "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600", children: [
            "Terpilih: ",
            selectedAmenityKeys.length,
            " fasilitas"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3 rounded-2xl border border-slate-200 bg-white p-4", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-[220px_1fr] md:items-start", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: /* @__PURE__ */ jsxs(
            "select",
            {
              value: amenityToAdd,
              onChange: (event) => {
                const nextValue = event.target.value;
                setAmenityToAdd(nextValue);
                handleAddAmenity(nextValue);
              },
              className: "mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-teal-500 focus:outline-none",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Pilih fasilitas..." }),
                availableAmenityOptions.map((option) => /* @__PURE__ */ jsx("option", { value: option.key, children: option.label }, option.key))
              ]
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-slate-200 bg-slate-50 p-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500", children: "Fasilitas yang tersedia" }),
            selectedAmenityKeys.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Belum ada fasilitas dipilih." }) : /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: selectedAmenityKeys.map((key) => /* @__PURE__ */ jsxs(
              "span",
              {
                className: "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700",
                children: [
                  AMENITY_LABEL_BY_KEY[key],
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleRemoveAmenity(key),
                      className: "inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] text-slate-600 transition hover:bg-rose-100 hover:text-rose-700",
                      "aria-label": `Hapus fasilitas ${AMENITY_LABEL_BY_KEY[key]}`,
                      children: "x"
                    }
                  )
                ]
              },
              key
            )) })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center justify-between gap-3", children: /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold uppercase tracking-[0.3em] text-slate-400", children: "Unggah gambar properti" }) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2", children: /* @__PURE__ */ jsx(
            "input",
            {
              type: "file",
              accept: ".jpg,.jpeg,.png,.gif,.webp",
              multiple: true,
              onChange: (event) => handleGalleryUpload(event.target.files),
              disabled: galleryUrls.length + stagedFiles.length >= MAX_GALLERY_IMAGES,
              className: "block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
            }
          ) }),
          stagedFiles.length ? /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white/80 p-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-slate-700", children: "Staging foto (klik untuk hapus)" }),
            /* @__PURE__ */ jsx("div", { className: "mt-2 grid gap-3 sm:grid-cols-3", children: stagedFiles.map((item) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => handleRemoveStaged(item.previewUrl),
                className: "group relative overflow-hidden rounded-2xl border border-slate-200",
                children: [
                  /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: item.previewUrl,
                      alt: item.file.name,
                      className: "h-24 w-full object-cover transition group-hover:scale-105"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "absolute inset-0 flex items-center justify-center bg-slate-900/40 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100", children: copy.delete })
                ]
              },
              item.previewUrl
            )) }),
            /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Pastikan gambar sesuai ketentuan sebelum diunggah." }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: handleUploadStaged,
                  disabled: isUploadingGallery || stagedFiles.length === 0,
                  className: "rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600",
                  children: isUploadingGallery ? "Mengunggah..." : "Unggah Foto"
                }
              )
            ] })
          ] }) : null,
          galleryUrls.length ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-slate-700", children: "Galeri yang sudah diunggah" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setIsSelectingCover((prev) => !prev),
                  className: `rounded-full border px-3 py-1.5 text-xs font-semibold transition ${isSelectingCover ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"}`,
                  children: isSelectingCover ? "Batalkan pilih sampul" : "Pilih foto sampul"
                }
              )
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: isSelectingCover ? "Klik foto di galeri untuk dijadikan sampul." : "Gunakan tombol pilih foto sampul lalu klik foto galeri." }),
            /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-3", children: galleryUrls.map((url, index) => {
              const selected = coverUrl === url;
              return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleSelectCoverFromGallery(url),
                    className: `group relative w-full overflow-hidden rounded-2xl border text-left transition ${selected ? "border-emerald-400 ring-2 ring-emerald-200" : "border-slate-200 hover:border-slate-300"} ${isSelectingCover ? "" : "cursor-default"}`,
                    children: [
                      /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: url,
                          alt: `Galeri properti ${index + 1}`,
                          className: "h-28 w-full object-cover transition group-hover:scale-105"
                        }
                      ),
                      selected ? /* @__PURE__ */ jsx("span", { className: "absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white", children: "Sampul" }) : null,
                      isSelectingCover ? /* @__PURE__ */ jsx("span", { className: "absolute inset-x-2 bottom-2 rounded-full bg-slate-900/70 px-2 py-1 text-center text-[10px] font-semibold text-white", children: "Klik jadikan sampul" }) : null
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleRemoveGalleryImage(url),
                    className: "absolute right-2 top-2 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:text-slate-900",
                    children: copy.delete
                  }
                )
              ] }, url);
            }) })
          ] }) : null,
          isUploadingGallery ? /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Mengunggah galeri..." }) : null
        ] })
      ] }),
      error ? /* @__PURE__ */ jsx("p", { className: "rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600", children: error }) : null,
      info ? /* @__PURE__ */ jsx("p", { className: "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700", children: info }) : null,
      !editingPropertyId ? /* @__PURE__ */ jsxs("section", { className: "space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: "Draft Kamar" }),
            /* @__PURE__ */ jsx("h2", { className: "mt-2 text-xl font-semibold text-slate-900", children: "Atur kamar saat membuat properti" })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: handleAddRoomDraft,
              className: "rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800",
              children: roomDraftMode === "FULL" ? copy.saveRoom : copy.addRoomDraft
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: copy.propertyRentalType }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: roomDraftMode,
              onChange: (event) => handleRoomDraftModeChange(
                event.target.value
              ),
              className: "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900",
              children: [
                /* @__PURE__ */ jsx("option", { value: "FULL", children: copy.fullRentalOption }),
                /* @__PURE__ */ jsx("option", { value: "PARTIAL", children: copy.partialRentalOption })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
          roomDraftMode === "PARTIAL" ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: copy.roomTypeName }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: roomName,
                onChange: (event) => setRoomName(event.target.value),
                className: "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
              }
            )
          ] }) : null,
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: copy.roomPrice }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                inputMode: "numeric",
                placeholder: "Rp 1.000.000",
                value: roomPrice ? formatIDR(roomPrice) : "",
                onChange: (event) => setRoomPrice(sanitizeNumberInput(event.target.value)),
                className: "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 md:col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: copy.roomDescription }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                rows: 3,
                value: roomDescription,
                onChange: (event) => setRoomDescription(event.target.value),
                className: "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: copy.maxGuest }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: 1,
                value: roomGuests,
                onChange: (event) => setRoomGuests(event.target.value),
                className: "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
              }
            )
          ] }),
          roomDraftMode === "PARTIAL" ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: copy.totalUnits }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: 1,
                value: roomUnits,
                onChange: (event) => setRoomUnits(event.target.value),
                className: "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
              }
            )
          ] }) : null
        ] }),
        roomDraftMode === "PARTIAL" ? roomDrafts.length ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-slate-600", children: copy.roomDraftList }),
          roomDrafts.map((draft, index) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3",
              children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-900", children: draft.name }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: draft.description }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
                    formatIDR(draft.price),
                    " \u2022 ",
                    draft.totalUnits,
                    " ",
                    copy.perUnit,
                    " \u2022",
                    " ",
                    draft.maxGuests,
                    " ",
                    copy.guests
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setRoomDrafts(
                      (prev) => prev.filter((_, idx) => idx !== index)
                    ),
                    className: "rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:text-rose-800",
                    children: copy.delete
                  }
                )
              ]
            },
            `${draft.name}-${index}`
          ))
        ] }) : /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: copy.noRoomDraft }) : null
      ] }) : null,
      /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: isSaving || isUploadingGallery,
          className: "rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600",
          children: isSaving ? copy.saving : editingPropertyId ? copy.updateProperty : copy.saveProperty
        }
      ) })
    ] }) : null,
    showRoomManagement ? /* @__PURE__ */ jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white/80 p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: copy.roomManagement }),
          /* @__PURE__ */ jsx("h2", { className: "mt-2 text-xl font-semibold text-slate-900", children: copy.roomManagementTitle })
        ] }),
        editingRoomId ? /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: resetRoomForm,
            className: "rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700",
            children: copy.cancelRoomEdit
          }
        ) : null
      ] }),
      !selectedProperty ? /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-slate-500", children: copy.selectPropertyToManageRoom }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600", children: [
          copy.activeProperty,
          ":",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-900", children: selectedProperty.name })
        ] }),
        /* @__PURE__ */ jsxs(
          "form",
          {
            className: "mt-4 grid gap-4 md:grid-cols-2",
            onSubmit: handleRoomSubmit,
            children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: copy.roomTypeName }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: roomName,
                    onChange: (event) => setRoomName(event.target.value),
                    className: "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: copy.roomPrice }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    inputMode: "numeric",
                    placeholder: "Rp 1.000.000",
                    value: roomPrice ? formatIDR(roomPrice) : "",
                    onChange: (event) => setRoomPrice(sanitizeNumberInput(event.target.value)),
                    className: "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 md:col-span-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: copy.roomDescription }),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    rows: 3,
                    value: roomDescription,
                    onChange: (event) => setRoomDescription(event.target.value),
                    className: "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: copy.totalUnits }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    min: 1,
                    value: roomUnits,
                    onChange: (event) => setRoomUnits(event.target.value),
                    className: "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: copy.maxGuest }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    min: 1,
                    value: roomGuests,
                    onChange: (event) => setRoomGuests(event.target.value),
                    className: "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 flex flex-wrap items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: copy.roomTypeSchemaHint }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "submit",
                    disabled: isSavingRoom,
                    className: "rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600",
                    children: isSavingRoom ? copy.saving : editingRoomId ? copy.updateRoom : copy.addRoom
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-slate-700", children: copy.roomList }),
          selectedProperty.rooms.length ? /* @__PURE__ */ jsx("div", { className: "mt-3 space-y-3", children: selectedProperty.rooms.map((room) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3",
              children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-900", children: room.name }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: room.description }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
                    formatIDR(room.price),
                    " \u2022 ",
                    room.totalUnits,
                    " ",
                    copy.perUnit,
                    " \u2022",
                    " ",
                    room.maxGuests,
                    " ",
                    copy.guests
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleEditRoom(room),
                      className: "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900",
                      children: copy.edit
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleDeleteRoom(room.id),
                      className: "rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:text-rose-800",
                      children: copy.delete
                    }
                  )
                ] })
              ]
            },
            room.id
          )) }) : /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-slate-500", children: copy.noRoomInProperty })
        ] })
      ] })
    ] }) : null
  ] });
}
export {
  TenantPropertyForm as default
};
