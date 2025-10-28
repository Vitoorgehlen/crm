"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { ReactNode, useEffect, useMemo } from "react";
import styles from "./page.module.css";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, userType, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicPaths = useMemo(() => ["/login"], []);
  const SUPaths = useMemo(() => ["/super-user-dashboard"], []);

  useEffect(() => {
    if (isLoading) return;

    if (!token) {
      if (!publicPaths.includes(pathname)) {
        router.push("/login");
      }
      return;
    }

    if (
      token &&
      userType === "user" &&
      SUPaths.some((path) => pathname.startsWith(path))
    ) {
      router.push("/home");
      return;
    }

    if (
      token &&
      userType === "superuser" &&
      !pathname.startsWith("/super-user")
    ) {
      router.push("/super-user-dashboard");
      return;
    }
  }, [SUPaths, publicPaths, token, userType, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <AiOutlineLoading3Quarters className={styles.spinner} />
      </div>
    );
  }

  if (!token && publicPaths.includes(pathname)) return <>{children}</>;
  if (token && userType === "superuser" && pathname.startsWith("/super-user"))
    return <>{children}</>;
  if (token && userType === "user") return <>{children}</>;

  return null;
}
