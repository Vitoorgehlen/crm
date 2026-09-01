"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { ReactNode, useEffect, useMemo } from "react";
import styles from "./page.module.css";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, userType, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicPaths = useMemo(
    () => ["/", "/contato", "/cadastro", "/sobre", "/termos", "/privacidade"],
    [],
  );
  const authPages = useMemo(() => ["/login", "/reset-password"], []);
  const SUPaths = useMemo(() => ["/super-user-dashboard"], []);
  useEffect(() => {
    if (isLoading) return;

    if (!token) {
      if (!publicPaths.includes(pathname) && !authPages.includes(pathname)) {
        router.push("/login");
      }
      return;
    }

    if (token && authPages.includes(pathname)) {
      if (userType === "superuser") {
        router.push("/super-user-dashboard");
      } else {
        router.push("/home");
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
  }, [SUPaths, authPages, token, userType, isLoading, pathname, router]);

  useEffect(() => {
    import("ldrs").then(({ infinity }) => {
      infinity.register();
    });
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <l-infinity
          size="120"
          stroke="5"
          stroke-length="0.9"
          bg-opacity="0"
          speed="2.5"
          color="var(--textBase)"
        />
      </div>
    );
  }

  if (pathname === "/") return <>{children}</>;
  if (publicPaths.includes(pathname)) return <>{children}</>;
  if (!token && authPages.includes(pathname)) return <>{children}</>;
  if (token && userType === "superuser" && pathname.startsWith("/super-user"))
    return <>{children}</>;
  if (token && userType === "user") return <>{children}</>;

  return null;
}
