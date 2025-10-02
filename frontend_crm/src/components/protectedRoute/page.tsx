'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";

export default function ProtectedRoute({ children }: {children : ReactNode}) {
    const { token, userType, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const publicPaths = ["/login"];
    const SUPaths = ["/super-user-dashboard"];

    useEffect(() => { 
        if (isLoading) return;

        if (!token) {
            if (!publicPaths.includes(pathname)) {
                router.push("/login");
            }
            return;
        }

        if (token && userType === 'user' && SUPaths.some(path => pathname.startsWith(path))) {
            router.push("/home");
            return;
        }

        if (token && userType === 'superuser' && !pathname.startsWith('/super-user')) {
            router.push("/super-user-dashboard");
            return;
        }
    }, [token, userType, isLoading, pathname, router]);

    if (isLoading) {
        return (
            <div className="loading">
                Carregando...
            </div>
        )
    }

    if (!token && publicPaths.includes(pathname)) return <>{children}</>;
    if (token && userType === 'superuser' && pathname.startsWith('/super-user')) return <>{children}</>;
    if (token && userType === 'user') return <>{children}</>;

    return null;
}