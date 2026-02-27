import { redirect } from "next/navigation";
import { getServerMe } from "@/lib/auth-server";
import MyReviewClient from "@/components/my-review/my-review-client";

export default async function MyReviewPage() {
  const me = await getServerMe();

  if (!me) {
    redirect("/?auth=required");
  }

  if (me.type !== "USER") {
    redirect("/?auth=forbidden");
  }

  return <MyReviewClient />;
}
