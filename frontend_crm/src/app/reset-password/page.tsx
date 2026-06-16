"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { MdLockOpen } from "react-icons/md";
import styles from "./page.module.css";
import Logo from "@/utils/Logo";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const finalPassword1 = (newPassword1 ?? "").trim();
    const finalPassword2 = (newPassword2 ?? "").trim();

    const passwordVerified = await verify(finalPassword1, finalPassword2);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/password-reset/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword: passwordVerified }),
        },
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Erro ao redefinir senha");

      setMessage(
        "Senha redefinida com sucesso! Você será redirecionado para fazer o login",
      );
      setTimeout(() => router.push("/login"));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage(err.message);
      } else {
        setMessage("Erro inesperado");
      }
    } finally {
      setLoading(false);
    }
  }

  const verify = async (password: string, password2: string) => {
    try {
      if (password || password2) {
        if (password.length < 6 || password.length > 25) {
          setMessage("Senha precisa ter entre 6 e 25 caracteres");
          return;
        }
        if (password !== password2) {
          setMessage("As senhas precisam ser iguais");
          return;
        }
        const passReq = /(?=.*[a-z])(?=.*[A-Z])/;
        if (!passReq.test(password)) {
          setMessage(
            "Senha precisa conter ao menos uma letra maiúscula e uma minúscula",
          );
          return;
        }
      }

      setMessage("");
      return password;
    } catch (err) {
      console.error(err);
      setMessage("Erro inesperado ao verificar os dados");
      return null;
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.boxTotal}>
          <div className={styles.boxLogoName}>
            <Logo className={styles.logoName} />
            <h1 className={styles.nameLogo}>cloopa</h1>
          </div>

          <div className={`glass ${styles.box}`}>
            <div className={styles.upLine}>
              <h3 className={styles.title}>Recuperar senha</h3>
              <button
                type="button"
                className={`btn-action glass ${styles.eyeButton}`}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            {message ? (
              <span>{message}</span>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.line}>
                  <MdLockOpen className={styles.icon} />

                  <input
                    type={showPassword ? "text" : "password"}
                    className={styles.inputForm}
                    placeholder="Nova senha"
                    onChange={(e) => setNewPassword1(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.line}>
                  <MdLockOpen className={styles.icon} />

                  <input
                    type={showPassword ? "text" : "password"}
                    className={styles.inputForm}
                    placeholder="Confirme a senha"
                    onChange={(e) => setNewPassword2(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.lineBtn}>
                  <button
                    className={`btn-action glass ${styles.send}`}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? <span>Enviando...</span> : "Enviar"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
