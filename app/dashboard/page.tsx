import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "@/lib/auth";
import DashboardClient from "@/app/dashboard/dashboard-client";

export default async function DashboardPage() {
  const user = await getCurrentSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardClient
      initialUser={{
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      }}
    />
  );
}
