"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./page";

export default function SidebarWrapper() {
  const pathname = usePathname();

  const publicPaths = [
    "/",
    "/login",
    "/contato",
    "/cadastro",
    "/sobre",
    "/termos",
    "/privacidade",
  ];
  if (publicPaths.includes(pathname)) return null;
  if (pathname === "/super-user-dashboard") return null;

  return <Sidebar />;
}
