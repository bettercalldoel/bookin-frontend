export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type ApiError = {
  message?: string;
};

type ApiFetchResult<T> = {
  data: T;
  headers: Headers;
  status: number;
};

async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      (isJson && (data as ApiError).message) || "Request gagal.";
    throw new Error(errorMessage);
  }

  return { data: data as T, response };
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { data } = await apiRequest<T>(path, options);
  return data;
}

export async function apiFetchWithHeaders<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiFetchResult<T>> {
  const { data, response } = await apiRequest<T>(path, options);
  return { data, headers: response.headers, status: response.status };
}
