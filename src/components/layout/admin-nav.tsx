"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, BarChart3 } from "lucide-react";

export function AdminNav() {
  const pathname = usePathname();

  const items = [
    { href: "/admin/users", label: "用户管理", icon: Users },
    { href: "/admin/stats", label: "统计与监控", icon: BarChart3 },
  ];

  return (
    <div className="flex gap-1 border-b">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            pathname === href
              ? "border-purple-600 text-purple-700"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </div>
  );
}
