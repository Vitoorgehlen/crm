"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AuthContextType {
  token: string | null;
  userType: "user" | "superuser" | null;
  userId: number | null;
  planRules: string[] | null;
  login: (
    token: string,
    planRules: string[] | null,
    userType: "user" | "superuser",
  ) => void;
  permissions: string[];
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API = process.env.NEXT_PUBLIC_API_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<"user" | "superuser" | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [planRules, setPlanRules] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function getUserIdFromToken(token: string | null): number | null {
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id || payload.userId || payload.sub;
    } catch {
      return null;
    }
  }

  async function fetchPermissions(token: string) {
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/my-role-permission`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Falha ao carregar usuário");

      const data = await res.json();

      const perms: string[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.permissions)
          ? data.permissions
          : [];

      setPermissions(perms);
    } catch (err) {
      console.error(err);
      setToken(null);
      setUserType(null);
      setUserId(null);
      setPermissions([]);
      localStorage.removeItem("token");
      localStorage.removeItem("userType");
    } finally {
      setIsLoading(false);
    }
  }

  const login = (
    newToken: string,
    newPlanRules: string[] | null,
    newUserType: "user" | "superuser",
  ) => {
    setToken(newToken);
    setUserType(newUserType);
    setUserId(getUserIdFromToken(newToken));
    setPlanRules(newPlanRules);

    localStorage.setItem("token", newToken);
    localStorage.setItem("userType", newUserType);
    localStorage.setItem("planRules", JSON.stringify(newPlanRules));
    if (newUserType === "user") fetchPermissions(newToken);
  };

  const logout = () => {
    setToken(null);
    setUserType(null);
    setUserId(null);
    setPermissions([]);
    setPlanRules(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("companyPlan");
  };

  useEffect(() => {
    setIsLoading(true);
    const savedToken = localStorage.getItem("token");
    const savedPlanRules = localStorage.getItem("planRules");
    const savedUserType = localStorage.getItem("userType") as
      | "user"
      | "superuser"
      | null;
    if (savedToken && savedUserType) {
      setToken(savedToken);
      setUserType(savedUserType);
      setUserId(getUserIdFromToken(savedToken));
      if (savedPlanRules) setPlanRules(JSON.parse(savedPlanRules));
      if (savedUserType === "user") fetchPermissions(savedToken);
    }
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        userType,
        userId,
        planRules,
        login,
        permissions,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");

  return context;
}

export function useAuthFetch() {
  const { token, logout } = useAuth();

  return async (url: string, options: RequestInit = {}) => {
    if (!token) throw new Error("Token ausente");

    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      logout();
      window.location.href = "/login";
      throw new Error("Sessão expirada, faça login novamente");
    }

    return res;
  };
}
