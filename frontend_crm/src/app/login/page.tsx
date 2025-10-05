"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tokens`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro ao fazer login");

      const { userType } = data;
      login(data.token, userType);

      if (userType === "user") {
        router.push("/home");
      } else if (userType === "superuser") {
        router.push("/super-user-dashboard");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro inesperado");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.box}>
          <h1 className={styles.title}>Login</h1>
          <form className={styles.form} onSubmit={handleLogin}>
            {error && <p className={styles.erro}>{error}</p>}
            <input
              type="email"
              placeholder="E-mail"
              onChange={(e) => setEmail(e.target.value.toLocaleLowerCase())}
              required
            />
            <input
              type="password"
              placeholder="Senha"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Link href="/" className={styles.esqueceuSenha}>
              Esqueceu sua senha, clique aqui
            </Link>
            <button type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
