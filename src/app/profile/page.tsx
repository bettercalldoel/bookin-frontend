import { redirect } from "next/navigation";
import { getServerMe } from "@/lib/auth-server";
import UserProfileClient from "@/components/user-profile/user-profile-client";

export default async function ProfilePage() {
  const me = await getServerMe();

  if (!me) {
    redirect("/?auth=required");
  }

  if (me.type !== "USER") {
    redirect("/?auth=forbidden");
  }

  return <UserProfileClient me={me} />;
}
