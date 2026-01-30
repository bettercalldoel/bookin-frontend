const TOKEN_COOKIE = "bookin_token";

export function setAuthToken(token: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=86400`;
  localStorage.setItem(TOKEN_COOKIE, token);
}

export function clearAuthToken() {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
  localStorage.removeItem(TOKEN_COOKIE);
}

export function getAuthToken() {
  if (typeof document === "undefined") return null;
  const token = localStorage.getItem(TOKEN_COOKIE);
  if (token) return token;

  const match = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${TOKEN_COOKIE}=`));
  return match ? match.split("=")[1] : null;
}
