import { API_BASE_URL } from "@/lib/api";
import type { AppLocale } from "@/lib/app-locale";
import type { SearchCopy } from "./search-copy";
import type { SearchFormState, SearchResponse, SearchResultsMeta } from "./search-types";
import { mapSearchResultsToDisplay, normalizePublicCategories } from "./search-utils";

const DEFAULT_RESULTS_META: SearchResultsMeta = {
  page: 1,
  limit: 8,
  total: 0,
  totalPages: 1,
};

const readApiResponse = async <T,>(url: string, fallbackError: string) => {
  const response = await fetch(url);
  const fallbackPayload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((fallbackPayload as { message?: string }).message || fallbackError);
  return fallbackPayload as T;
};

export const fetchSearchResults = async (
  paramsSnapshot: string,
  locale: AppLocale,
  copy: SearchCopy,
  fallbackImages: string[],
) => {
  const baseUrl = `${API_BASE_URL}/properties/search`;
  const url = paramsSnapshot ? `${baseUrl}?${paramsSnapshot}` : baseUrl;
  const payload = await readApiResponse<SearchResponse>(url, copy.failedLoadResults);
  const results = mapSearchResultsToDisplay(payload.data ?? [], locale, copy, fallbackImages);
  const meta = payload.meta ?? DEFAULT_RESULTS_META;
  return { results, meta };
};

export const fetchPublicCategories = async () => {
  try {
    const payload = await readApiResponse<
      Array<{ name?: string }> | { data?: Array<{ name?: string }> }
    >(
      `${API_BASE_URL}/properties/categories?page=1&limit=100&sortBy=name&sortOrder=asc`,
      "",
    );
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
    return normalizePublicCategories(rows);
  } catch {
    return [];
  }
};

export const withPage = (form: SearchFormState, page: number): SearchFormState => ({
  ...form,
  page,
});
