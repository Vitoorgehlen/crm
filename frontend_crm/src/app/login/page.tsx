"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";
import { IoReturnUpBackOutline } from "react-icons/io5";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { MdOutlineMail, MdLockOpen } from "react-icons/md";
import Logo from "@/utils/Logo";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        },
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro ao fazer login");

      const { userType, planRules } = data;
      login(data.token, planRules, userType);

      if (userType === "user") {
        router.push("/home");
      } else if (userType === "superuser") {
        router.push("/super-user-dashboard");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          err instanceof Error ? err.message : "Erro inesperado ao fazer login",
        );
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
        },
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Erro ao recuperar a senha");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Erro inesperado ao resetar a senha",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.boxTotal}>
        <div className={styles.boxLogoName}>
          <Logo className={styles.logoName} />
          <h1 className={styles.nameLogo}>cloop</h1>
        </div>

        <div className={`glass ${styles.box}`}>
          {!passwordReset ? (
            <>
              <h2 className={styles.title}>Login</h2>
              <form className={styles.form} onSubmit={handleLogin}>
                {error && <p className="error">{error}</p>}
                <div className={styles.line}>
                  <MdOutlineMail className={styles.icon} />

                  <input
                    type="email"
                    className={styles.inputForm}
                    placeholder="E-mail"
                    onChange={(e) =>
                      setEmail(e.target.value.toLocaleLowerCase())
                    }
                    required
                  />
                </div>
                <div className={styles.line}>
                  <MdLockOpen className={styles.icon} />

                  <input
                    type={showPassword ? "text" : "password"}
                    className={styles.inputForm}
                    placeholder="Senha"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className={`btn-action glass ${styles.eyeButton}`}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>

                <button
                  className={styles.resetPassword}
                  type="button"
                  onClick={() => setPasswordReset(!passwordReset)}
                  disabled={loading}
                >
                  Esqueceu sua senha, clique aqui
                </button>

                <div className={styles.lineBtn}>
                  <button
                    className={`btn-action glass ${styles.send}`}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? <p>Entrando...</p> : "Entrar"}
                  </button>
                </div>
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
              <span className={styles.title}>Recuperar senha</span>
              <form className={styles.form} onSubmit={resetPassword}>
                {error && <p className="error">{error}</p>}

                <div className={styles.line}>
                  <MdOutlineMail className={styles.icon} />

                  <input
                    type="email"
                    className={styles.inputForm}
                    placeholder="E-mail"
                    onChange={(e) =>
                      setEmail(e.target.value.toLocaleLowerCase())
                    }
                    required
                  />

                  <div className={styles.gapEye}></div>
                </div>

                <div className={styles.lineBtn}>
                  <button
                    className={`btn-action glass ${styles.send}`}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? <p>Enviando...</p> : "Enviar"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
