// components/SidebarWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./page";

export default function SidebarWrapper() {
  const pathname = usePathname();

  if (pathname === "/login") return null;
  if (pathname === "/super-user-dashboard") return null;

  return <Sidebar />;
}
