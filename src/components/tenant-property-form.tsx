"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";

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
  categoryId: string;
  categoryName?: string | null;
  cityId: string;
  cityName?: string | null;
  province?: string | null;
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

async function fetchCatalog<T>(path: string, search: string) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized.");
  }

  const query = new URLSearchParams({ search, limit: "10" }).toString();
  return apiFetch<T>(`/catalog/${path}?${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
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

  return aggregated;
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
  const [propertyName, setPropertyName] = useState("");
  const [propertyDesc, setPropertyDesc] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
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
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
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
  const [isSelectingCover, setIsSelectingCover] = useState(false);
  const [showCoverSuccessPopup, setShowCoverSuccessPopup] = useState(false);
  const coverSuccessTimerRef = useRef<number | null>(null);

  const selectedProperty = useMemo(
    () => properties.find((item) => item.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId],
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
      const result = await fetchCatalog<CategoryOption[]>(
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
        err instanceof Error ? err.message : "Gagal memuat properti.";
      setError(message);
    } finally {
      setIsLoadingProperties(false);
    }
  };

  useEffect(() => {
    if (!showManagement && !showRoomManagement) return;
    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showManagement, showRoomManagement]);

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

  useEffect(() => {
    if (cityQuery.trim().length < 2) {
      setCityOptions([]);
      setIsLoadingCity(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsLoadingCity(true);
      try {
        const result = await fetchCatalog<CityOption[]>(
          "cities",
          cityQuery.trim(),
        );
        setCityOptions(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gagal memuat kota.";
        setError(message);
      } finally {
        setIsLoadingCity(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [cityQuery]);

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

  const resetPropertyForm = () => {
    if (coverSuccessTimerRef.current) {
      window.clearTimeout(coverSuccessTimerRef.current);
      coverSuccessTimerRef.current = null;
    }
    setPropertyName("");
    setPropertyDesc("");
    setPropertyAddress("");
    setIsSelectingCover(false);
    setShowCoverSuccessPopup(false);
    setCoverUrl("");
    setGalleryUrls([]);
    setCategoryQuery("");
    setCategoryId("");
    setCategoryOptions([]);
    setCityQuery("");
    setCityId("");
    setCityOptions([]);
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
      ? `${propertyName.trim()} · Properti Utuh`
      : "Properti Utuh",
    description: roomDescription.trim(),
    price: roomPrice.trim(),
    totalUnits: "1",
    maxGuests: roomGuests.trim(),
  });

  const handleAddRoomDraft = () => {
    setError("");
    setInfo("");
    if (!roomDescription.trim()) {
      setError("Deskripsi kamar wajib diisi.");
      return;
    }
    if (!roomPrice.trim()) {
      setError("Harga kamar wajib diisi.");
      return;
    }
    if (!roomGuests.trim()) {
      setError("Maksimal tamu wajib diisi.");
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
    setEditingPropertyId(property.id);
    setSelectedPropertyId(property.id);
    setPropertyName(property.name);
    setPropertyDesc(property.description);
    setPropertyAddress(property.address ?? "");
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
    stagedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setStagedFiles([]);
    setInfo("Mode edit properti aktif.");
  };

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
    if (!cityId) {
      setError("Pilih kota terlebih dahulu.");
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
        categoryId: resolvedCategoryId,
        cityId,
        coverUrl,
        galleryUrls,
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
    if (!window.confirm("Hapus properti ini?")) return;
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
      const message = err instanceof Error ? err.message : "Gagal menghapus.";
      setError(message);
    }
  };

  const handleRoomSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!selectedPropertyId) {
      setError("Pilih properti terlebih dahulu untuk menambah kamar.");
      return;
    }
    if (!roomName.trim() || !roomDescription.trim()) {
      setError("Nama dan deskripsi kamar wajib diisi.");
      return;
    }
    if (!roomPrice.trim()) {
      setError("Harga kamar wajib diisi.");
      return;
    }
    if (!roomUnits.trim() || !roomGuests.trim()) {
      setError("Total unit dan maksimal tamu wajib diisi.");
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
        err instanceof Error ? err.message : "Gagal menyimpan kamar.";
      setError(message);
    } finally {
      setIsSavingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm("Hapus kamar ini?")) return;
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
        err instanceof Error ? err.message : "Gagal menghapus kamar.";
      setError(message);
    }
  };

  return (
    <div className="mt-8 space-y-10">
      {showCoverSuccessPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6">
          <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white px-6 py-5 text-center shadow-2xl">
            <p className="text-sm font-semibold text-emerald-700">
              Foto berhasil dijadikan sampul.
            </p>
            <button
              type="button"
              onClick={() => setShowCoverSuccessPopup(false)}
              className="mt-4 w-full rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800"
            >
              Tutup
            </button>
          </div>
        </div>
      ) : null}
      {showManagement ? (
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Kelola Properti
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Daftar properti yang sudah dibuat
              </h2>
            </div>
            <button
              type="button"
              onClick={loadProperties}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Muat Ulang
            </button>
          </div>
          {isLoadingProperties ? (
            <p className="mt-4 text-xs text-slate-500">Memuat properti...</p>
          ) : null}
          {!isLoadingProperties && properties.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Belum ada properti. Silakan buat properti baru di form bawah.
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
                          {property.categoryName ?? "Kategori"}
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
                          Tidak ada gambar
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
                          Ubah
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setSelectedPropertyId(property.id)}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800"
                      >
                        Kelola Kamar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProperty(property.id)}
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:text-rose-800"
                      >
                        Hapus
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
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Informasi Utama
            </h2>
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Kota (ID Kota)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari kota (min. 2 huruf)"
                    value={cityQuery}
                    onChange={(event) => {
                      setCityQuery(event.target.value);
                      setCityId("");
                      setError("");
                    }}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                  />
                  {cityOptions.length ? (
                    <div className="absolute z-10 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-lg">
                      {cityOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setCityId(option.id);
                            setCityQuery(
                              option.province
                                ? `${option.name}, ${option.province}`
                                : option.name,
                            );
                            setCityOptions([]);
                          }}
                          className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 last:border-b-0"
                        >
                          <span className="font-semibold text-slate-900">
                            {option.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {option.province ?? "Indonesia"}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                {isLoadingCity ? (
                  <p className="text-xs text-slate-400">Memuat kota...</p>
                ) : null}
                {cityId ? (
                  <p className="text-xs text-slate-500">
                    ID terpilih: {cityId}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Pilih kota dari daftar.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Alamat (opsional)
                </label>
                <input
                  type="text"
                  placeholder="Alamat lengkap properti"
                  value={propertyAddress}
                  onChange={(event) => setPropertyAddress(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                />
              </div>
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

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Media Properti
              </h2>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                Cloudinary Signed Upload
              </span>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">
                Galeri Properti
              </label>
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
                <p className="text-xs text-slate-400">
                  Unggah beberapa foto (maks {MAX_GALLERY_IMAGES}) dengan ukuran
                  maks 5MB.
                </p>
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
                          Hapus
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
              ) : (
                <p className="text-xs text-slate-400">
                  Pilih gambar untuk staging, lalu klik Unggah Foto.
                </p>
              )}
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
                            Hapus
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
                  {roomDraftMode === "FULL" ? "Simpan Kamar" : "Tambah Draft Kamar"}
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Tipe sewa properti
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
                    Properti ini disewakan secara menyeluruh
                  </option>
                  <option value="PARTIAL">
                    Properti ini bisa disewakan sebagian saja
                  </option>
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {roomDraftMode === "PARTIAL" ? (
                  <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                      Tipe / Nama Kamar
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
                    Harga
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
                    Deskripsi Kamar
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
                    Maksimal Tamu
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
                      Total Unit
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
                      Draft kamar yang akan dibuat
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
                            {formatIDR(draft.price)} • {draft.totalUnits} unit •{" "}
                            {draft.maxGuests} tamu
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
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Belum ada draft kamar ditambahkan.
                  </p>
                )
              ) : null}
            </section>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Field mengikuti struktur `Property` di Prisma schema.
            </p>
            <button
              type="submit"
              disabled={isSaving || isUploadingGallery}
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              {isSaving
                ? "Menyimpan..."
                : editingPropertyId
                  ? "Perbarui Properti"
                  : "Simpan Properti"}
            </button>
          </div>
        </form>
      ) : null}

      {showRoomManagement ? (
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Kelola Kamar
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Kelola kamar untuk properti terpilih
              </h2>
            </div>
            {editingRoomId ? (
              <button
                type="button"
                onClick={resetRoomForm}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700"
              >
                Batalkan edit kamar
              </button>
            ) : null}
          </div>

          {!selectedProperty ? (
              <p className="mt-4 text-sm text-slate-500">
                Pilih properti dari daftar di atas untuk mengelola kamar.
              </p>
          ) : (
            <>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                Properti aktif:{" "}
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
                    Tipe / Nama Kamar
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
                    Harga
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
                    Deskripsi Kamar
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
                    Total Unit
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
                    Maksimal Tamu
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
                    Field mengikuti struktur `RoomType` di Prisma schema.
                  </p>
                  <button
                    type="submit"
                    disabled={isSavingRoom}
                    className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                  >
                    {isSavingRoom
                      ? "Menyimpan..."
                      : editingRoomId
                        ? "Perbarui Kamar"
                        : "Tambah Kamar"}
                  </button>
                </div>
              </form>
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-700">
                  Daftar Kamar
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
                            {formatIDR(room.price)} • {room.totalUnits} unit •{" "}
                            {room.maxGuests} tamu
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditRoom(room)}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                          >
                            Ubah
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoom(room.id)}
                            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:text-rose-800"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Belum ada kamar untuk properti ini.
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
