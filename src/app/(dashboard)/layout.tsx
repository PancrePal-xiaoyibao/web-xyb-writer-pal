import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/jwt";
import { DashboardNav } from "@/components/layout/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav user={user} />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
