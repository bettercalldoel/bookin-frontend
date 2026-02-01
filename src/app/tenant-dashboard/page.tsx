import { redirect } from "next/navigation";
import { getServerMe } from "@/lib/auth-server";
import TenantDashboardClient from "@/components/tenant-dashboard/tenant-dashboard-client";

export default async function TenantDashboardPage() {
  const me = await getServerMe();

  if (!me) {
    redirect("/?auth=required");
  }

  if (!me.emailVerifiedAt) {
    redirect("/?auth=unverified");
  }

  if (me.type !== "TENANT") {
    redirect("/?auth=forbidden");
  }

  return <TenantDashboardClient me={me} />;
}
