import { redirect } from "next/navigation";
import { getServerMe } from "@/lib/auth-server";
import MyTransactionClient from "@/components/my-transaction/my-transaction-client";

export default async function MyTransactionPage() {
  const me = await getServerMe();

  if (!me) {
    redirect("/?auth=required");
  }

  if (me.type !== "USER") {
    redirect("/?auth=forbidden");
  }

  return <MyTransactionClient />;
}
