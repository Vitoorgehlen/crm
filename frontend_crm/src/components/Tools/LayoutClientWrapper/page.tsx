"use client";

import { usePathname } from "next/navigation";
import SidebarWrapper from "@/components/sidebar/SidebarWrapper";
import Footer from "@/components/footer/page";
import ProtectedRoute from "@/components/Tools/protectedRoute/page";

export default function LayoutClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideSidebarRoutes = ["/", "/login", "/reset-password"];
  const shouldShowSidebar = !hideSidebarRoutes.includes(pathname);

  return (
    <ProtectedRoute>
      {shouldShowSidebar && <SidebarWrapper />}
      <main className="main-base">{children}</main>
      <Footer />
    </ProtectedRoute>
  );
}
