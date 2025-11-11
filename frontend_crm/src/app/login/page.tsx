"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";
import { IoReturnUpBackOutline } from "react-icons/io5";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordReset, setPasswordReset] = useState(false);
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

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/password-reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Erro ao recuperar a senha");
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
          {!passwordReset ? (
            <>
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
                <button
                  className={styles.resetPassword}
                  type="button"
                  onClick={() => setPasswordReset(!passwordReset)}
                  disabled={loading}
                >
                  Esqueceu sua senha, clique aqui
                </button>
                <button
                  className={styles.send}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                className={styles.resetPassword}
                type="button"
                onClick={() => setPasswordReset(!passwordReset)}
                disabled={loading}
              >
                {"Voltar e fazer login "}
                <IoReturnUpBackOutline />
              </button>
              <h1 className={styles.title}>Recuperar senha</h1>
              <form className={styles.form} onSubmit={resetPassword}>
                {error && <p className={styles.erro}>{error}</p>}
                <h4>E-mail:</h4>
                <input
                  type="email"
                  placeholder="E-mail"
                  onChange={(e) => setEmail(e.target.value.toLocaleLowerCase())}
                  required
                />
                <button
                  className={styles.send}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
