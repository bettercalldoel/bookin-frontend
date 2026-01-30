import "server-only";

import { cookies } from "next/headers";
import { API_BASE_URL } from "./api";

export type AuthMe = {
  id: string;
  email: string;
  name: string;
  type: "USER" | "TENANT";
  emailVerifiedAt: string | null;
  userProfile?: { avatarUrl?: string | null } | null;
  tenantProfile?: { companyName?: string | null; avatarUrl?: string | null } | null;
};

export async function getServerMe(): Promise<AuthMe | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("bookin_token")?.value;
  if (!token) return null;

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as AuthMe;
}
