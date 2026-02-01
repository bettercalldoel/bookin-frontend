"use client";

import { useEffect, useMemo, useState } from "react";
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

const MAX_GALLERY_IMAGES = 5;
const CATEGORY_SUGGESTIONS = [
  "Hotel",
  "Villa",
  "Apartemen",
  "Guest House",
  "Homestay",
  "Resort",
];

const parseGalleryUrls = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

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

export default function TenantPropertyForm() {
  const [propertyName, setPropertyName] = useState("");
  const [propertyDesc, setPropertyDesc] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [galleryText, setGalleryText] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [cityId, setCityId] = useState("");
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const galleryUrls = useMemo(() => parseGalleryUrls(galleryText), [galleryText]);

  useEffect(() => {
    if (!galleryUrls.length) {
      setCoverUrl("");
      return;
    }
    if (coverUrl && galleryUrls.includes(coverUrl)) return;
    setCoverUrl(galleryUrls[0]);
  }, [galleryUrls, coverUrl]);

  useEffect(() => {
    if (categoryQuery.trim().length < 2) {
      setCategoryOptions([]);
      setIsLoadingCategory(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsLoadingCategory(true);
      try {
        const result = await fetchCatalog<CategoryOption[]>(
          "categories",
          categoryQuery.trim(),
        );
        setCategoryOptions(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gagal memuat kategori.";
        setError(message);
      } finally {
        setIsLoadingCategory(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [categoryQuery]);

  useEffect(() => {
    if (!categoryOptions.length || !categoryQuery.trim()) return;
    const match = categoryOptions.find(
      (option) => option.name.toLowerCase() === categoryQuery.trim().toLowerCase(),
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
        const message = err instanceof Error ? err.message : "Gagal memuat kota.";
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
    const remaining = MAX_GALLERY_IMAGES - galleryUrls.length;
    if (remaining <= 0) {
      setError(`Maksimal ${MAX_GALLERY_IMAGES} foto untuk galeri.`);
      return;
    }
    setIsUploadingGallery(true);

    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, remaining)) {
        const signature = await fetchSignature();
        const url = await uploadToCloudinary(file, signature);
        uploaded.push(url);
      }
      const nextUrls = [...galleryUrls, ...uploaded];
      setGalleryText(nextUrls.join(", "));
      if (files.length > remaining) {
        setInfo(
          `Galeri berhasil diunggah (${uploaded.length}). Maksimal ${MAX_GALLERY_IMAGES} foto.`,
        );
      } else {
        setInfo("Galeri berhasil diunggah.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload gagal.";
      setError(message);
    } finally {
      setIsUploadingGallery(false);
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
    setCategoryMessage("");
    setIsCreatingCategory(true);
    try {
      const result = await createCategory(name);
      setCategoryId(result.id);
      setCategoryQuery(result.name);
      setCategoryOptions([]);
      const message = `Kategori "${result.name}" berhasil dibuat.`;
      setInfo(message);
      setCategoryMessage(message);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal membuat kategori.";
      setError(message);
      setCategoryMessage(message);
    } finally {
      setIsCreatingCategory(false);
    }
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
          err instanceof Error ? err.message : "Pilih kategori properti terlebih dahulu.";
        setError(message);
        return;
      }
    }
    if (!cityId) {
      setError("Pilih kota terlebih dahulu.");
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

    const token = getAuthToken();
    if (!token) {
      setError("Unauthorized.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await apiFetch<{ message: string; id: string }>(
        "/properties",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: propertyName.trim(),
            description: propertyDesc.trim(),
            address: propertyAddress.trim() || undefined,
            categoryId: resolvedCategoryId,
            cityId,
            coverUrl,
            galleryUrls,
          }),
        },
      );
      setInfo(result.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
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
              Kategori Properti (ID)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari kategori (min. 2 huruf) mis: Hotel, Villa"
                value={categoryQuery}
                onChange={(event) => {
                  setCategoryQuery(event.target.value);
                  setCategoryId("");
                  setError("");
                }}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
              />
              {categoryOptions.length ? (
                <div className="absolute z-10 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-lg">
                  {categoryOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setCategoryId(option.id);
                        setCategoryQuery(option.name);
                        setCategoryOptions([]);
                      }}
                      className="flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 last:border-b-0"
                    >
                      <span className="font-semibold text-slate-900">
                        {option.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {categoryOptions.length === 0 && categoryQuery.trim().length < 2 ? (
              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                {CATEGORY_SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setCategoryQuery(item);
                      setCategoryId("");
                      setError("");
                    }}
                    className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
            {isLoadingCategory ? (
              <p className="text-xs text-slate-400">Memuat kategori...</p>
            ) : null}
            {!isLoadingCategory &&
            categoryQuery.trim().length >= 2 &&
            categoryOptions.length === 0 ? (
              <div className="flex flex-wrap items-center gap-2 text-xs text-amber-600">
                <span>Kategori tidak ditemukan.</span>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={isCreatingCategory}
                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:border-amber-300 hover:text-amber-800"
                >
                  {isCreatingCategory
                    ? "Membuat..."
                    : `Buat "${categoryQuery.trim()}"`}
                </button>
              </div>
            ) : null}
            {categoryMessage ? (
              <p className="text-xs text-slate-500">{categoryMessage}</p>
            ) : null}
            {categoryId ? (
              <p className="text-xs text-slate-500">ID terpilih: {categoryId}</p>
            ) : (
              <p className="text-xs text-slate-400">
                Pilih kategori milik tenant.
              </p>
            )}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Kota (City ID)
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
              <p className="text-xs text-slate-500">ID terpilih: {cityId}</p>
            ) : (
              <p className="text-xs text-slate-400">Pilih kota dari daftar.</p>
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
              accept="image/*"
              multiple
              onChange={(event) => handleGalleryUpload(event.target.files)}
              disabled={galleryUrls.length >= MAX_GALLERY_IMAGES}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
            />
            <p className="text-xs text-slate-400">
              Unggah beberapa foto untuk galeri (maks {MAX_GALLERY_IMAGES}).
            </p>
          </div>
          <input
            type="text"
            placeholder="URL galeri dipisah dengan koma"
            value={galleryText}
            onChange={(event) => setGalleryText(event.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
          />
          {galleryUrls.length ? (
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {galleryUrls.map((url) => (
                <div
                  key={url}
                  className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1"
                >
                  <span>{url.length > 32 ? `${url.slice(0, 32)}...` : url}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = galleryUrls.filter((item) => item !== url);
                      setGalleryText(next.join(", "));
                      if (coverUrl === url) {
                        setCoverUrl(next[0] ?? "");
                      }
                    }}
                    className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          {isUploadingGallery ? (
            <p className="text-xs text-slate-500">Mengunggah galeri...</p>
          ) : null}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
          <p className="text-sm font-semibold text-slate-900">
            Pilih Foto Sampul
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Pilih satu foto dari galeri untuk dijadikan sampul properti.
          </p>
          {galleryUrls.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {galleryUrls.map((url) => {
                const selected = coverUrl === url;
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setCoverUrl(url)}
                    className={`group overflow-hidden rounded-2xl border text-left transition ${
                      selected
                        ? "border-emerald-400 ring-2 ring-emerald-200"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="relative h-24 w-full overflow-hidden bg-slate-100">
                      <img
                        src={url}
                        alt="Preview"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                    <div className="px-3 py-2 text-xs text-slate-600">
                      {selected ? "Sampul terpilih" : "Pilih jadi sampul"}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-400">
              Upload galeri terlebih dahulu.
            </p>
          )}
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

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Field mengikuti struktur `Property` di Prisma schema.
        </p>
        <button
          type="submit"
          disabled={isSaving || isUploadingGallery}
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        >
          {isSaving ? "Menyimpan..." : "Simpan Properti"}
        </button>
      </div>
    </form>
  );
}
