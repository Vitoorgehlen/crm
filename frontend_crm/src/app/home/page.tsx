"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";
import { User } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import ScheduleLayout from "@/components/Schedule/ScheduleLayout/ScheduleLayout";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar Usuário");
      setUser(data);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    fetchMe();
  }, [isLoading, token, router, fetchMe]);

  return (
    <main className={styles.main}>
      <div className={styles.title}>
        <h1>Bem vindo(a) {user?.name}</h1>
      </div>
      <div className={styles.calendar}>
        <ScheduleLayout />
      </div>
    </main>
  );
}
