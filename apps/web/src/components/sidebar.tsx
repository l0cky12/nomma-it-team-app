"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/devices", label: "Devices" },
  { href: "/repairs", label: "Repairs" },
  { href: "/users", label: "Users" },
  { href: "/assets", label: "Assets" },
  { href: "/reports", label: "Reports" },
  { href: "/voting", label: "Voting" },
  { href: "/settings", label: "Admin/Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full max-w-xs border-r border-slate-200 bg-slate-50 p-4">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">NOMMA IT Team App</h1>
        <p className="text-xs text-slate-600">IT workflow operations center</p>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm ${active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-200"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
