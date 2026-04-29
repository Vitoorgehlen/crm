"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

import styles from "./page.module.css";
import { ConfigMeProps } from "@/types";
import { MdKeyboardArrowRight, MdKeyboardArrowDown } from "react-icons/md";
import ThemeSwitcher from "../switchTheme/page";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function EditMe({ u, onUpdate }: ConfigMeProps) {
  const { token } = useAuth();

  const [myNewName, setMyNewName] = useState("");
  const [isOpenEmail, setIsOpenEmail] = useState(false);
  const [myNewEmail, setMyNewEmail] = useState("");
  const [myNewEmail2, setMyNewEmail2] = useState("");
  const [isOpenPassword, setIsOpenPassword] = useState(false);
  const [myNewPassword, setMyNewPassword] = useState("");
  const [myNewPassword2, setMyNewPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setMyNewName(u.name || "");
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [u]);

  const handleEditMe = async () => {
    setLoading(true);
    try {
      const finalName = (myNewName ?? "").trim();
      const finalEmail = (myNewEmail ?? "").trim();
      const finalEmail2 = (myNewEmail2 ?? "").trim();
      const finalPassword = (myNewPassword ?? "").trim();
      const finalPassword2 = (myNewPassword2 ?? "").trim();

      const payload = await verify(
        finalName,
        finalEmail,
        finalEmail2,
        finalPassword,
        finalPassword2,
      );

      if (!payload) {
        setError("Dados inválidos para atualização");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API}/users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error || "Erro ao atualizar usuário";
        setError(msg);
        return;
      }

      setMyNewName(data.name ?? "");
      setMyNewEmail(data.email ?? "");
      setMyNewEmail2("");
      setMyNewPassword("");
      setMyNewPassword2("");
      setError("");

      setIsOpenEmail(false);
      setIsOpenPassword(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao salvar seus dados",
      );
    } finally {
      setLoading(false);
    }
  };

  const verify = async (
    name: string,
    email: string,
    email2: string,
    password: string,
    password2: string,
  ) => {
    try {
      if (name.length < 4 || name.length > 25) {
        setError("Nome precisa ter entre 4 e 25 caracteres");
        return;
      }

      const payload: any = { name };

      if (email || email2) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          setError("E-mail inválido");
          return;
        }
        if (email !== email2) {
          setError("Os e-mails precisam ser iguais");
          return;
        }

        payload.email = email.toLowerCase();
      }

      if (password || password2) {
        if (password.length < 6 || password.length > 25) {
          setError("Senha precisa ter entre 6 e 25 caracteres");
          return;
        }
        if (password !== password2) {
          setError("As senhas precisam ser iguais");
          return;
        }
        const passReq = /(?=.*[a-z])(?=.*[A-Z])/;
        if (!passReq.test(password)) {
          setError(
            "Senha precisa conter ao menos uma letra maiúscula e uma minúscula",
          );
          return;
        }

        payload.password = password;
      }

      setError("");
      return payload;
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao verfificar os dados",
      );
      return null;
    }
  };

  return (
    <form className={styles.overlay}>
      <ThemeSwitcher />

      <input
        className={`${styles.labelSetting} ${styles.title} form-base`}
        value={myNewName}
        onChange={(e) => setMyNewName(e.target.value)}
      />

      <button
        className={`${styles.btnSetting} 
        ${isOpenEmail && styles.btnSettingActive} form-base`}
        type="button"
        onClick={() => setIsOpenEmail((prev) => !prev)}
      >
        <h5>
          Alterar seu e-mail{" "}
          {isOpenEmail ? (
            <MdKeyboardArrowDown className={styles.active} />
          ) : (
            <MdKeyboardArrowRight />
          )}
        </h5>
      </button>
      {isOpenEmail && (
        <div className={styles.labelsSetting}>
          <p>
            E-mail atual: <span>{u?.email}</span>
          </p>

          <input
            className={`${styles.labelSetting} form-base`}
            type="email"
            placeholder="Novo e-mail"
            onChange={(e) => setMyNewEmail(e.target.value)}
          />
          <input
            className={`${styles.labelSetting} form-base`}
            type="email"
            placeholder="Confirme e-mail"
            onChange={(e) => setMyNewEmail2(e.target.value)}
          />
        </div>
      )}

      <button
        className={`${styles.btnSetting} 
        ${isOpenEmail && styles.btnSettingActive} form-base`}
        type="button"
        onClick={() => setIsOpenPassword((prev) => !prev)}
      >
        <h5>
          Alterar sua senha{" "}
          {isOpenPassword ? (
            <MdKeyboardArrowDown className={styles.active} />
          ) : (
            <MdKeyboardArrowRight />
          )}
        </h5>
      </button>
      {isOpenPassword && (
        <div className={styles.labelsSetting}>
          <input
            className={`${styles.labelSetting} form-base`}
            type="password"
            placeholder="Nova senha"
            onChange={(e) => setMyNewPassword(e.target.value)}
          />
          <input
            className={`${styles.labelSetting} form-base`}
            type="password"
            placeholder="Confirme a senha"
            onChange={(e) => setMyNewPassword2(e.target.value)}
          />
        </div>
      )}

      {error && <p className="erro">{error}</p>}
      <button
        className={`btn-action glass ${styles.btnSave}`}
        onClick={handleEditMe}
        type="button"
      >
        {loading ? <h5>Salvando...</h5> : <h5>Salvar alterações</h5>}
      </button>
    </form>
  );
}
