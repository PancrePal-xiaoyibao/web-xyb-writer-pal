import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/jwt";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { AdminNav } from "@/components/layout/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/jobs");

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav user={user} />
      <div className="container mx-auto px-4 py-8">
        <AdminNav />
        <main className="mt-6">{children}</main>
      </div>
    </div>
  );
}
