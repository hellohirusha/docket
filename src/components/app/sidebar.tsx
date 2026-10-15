"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarCheck,
  Boxes,
  Users,
  Tag,
} from "lucide-react";

const NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    href: "/dashboard/reservations",
    label: "Reservations",
    icon: CalendarCheck,
    adminOnly: false,
  },
  {
    href: "/dashboard/resources",
    label: "Resources",
    icon: Boxes,
    adminOnly: false,
  },
  {
    href: "/dashboard/categories",
    label: "Categories",
    icon: Tag,
    adminOnly: true,
  },
  { href: "/dashboard/users", label: "Users", icon: Users, adminOnly: true },
];

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r flex flex-col shrink-0">
      <div className="h-14 flex items-center px-5 border-b">
        <span className="font-bold text-lg tracking-tight">Docket</span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.filter((n) => !n.adminOnly || role === "ADMIN").map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
