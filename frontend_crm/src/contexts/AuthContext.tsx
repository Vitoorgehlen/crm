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
  login: (token: string, userType: "user" | "superuser") => void;
  permissions: string[];
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API = process.env.NEXT_PUBLIC_API_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<"user" | "superuser" | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      setPermissions([]);
      localStorage.removeItem("token");
      localStorage.removeItem("userType");
    } finally {
      setIsLoading(false);
    }
  }

  const login = (newToken: string, newUserType: "user" | "superuser") => {
    setToken(newToken);
    setUserType(newUserType);
    localStorage.setItem("token", newToken);
    localStorage.setItem("userType", newUserType);
    if (newUserType === "user") fetchPermissions(newToken);
  };

  const logout = () => {
    setToken(null);
    setUserType(null);
    setPermissions([]);
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
  };

  useEffect(() => {
    setIsLoading(true);
    const savedToken = localStorage.getItem("token");
    const savedUserType = localStorage.getItem("userType") as
      | "user"
      | "superuser"
      | null;
    if (savedToken && savedUserType) {
      setToken(savedToken);
      setUserType(savedUserType);
    }
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, userType, login, permissions, logout, isLoading }}
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
