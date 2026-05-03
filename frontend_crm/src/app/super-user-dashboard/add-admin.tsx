"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MdClose } from "react-icons/md";

import styles from "./add-admin.module.css";
import { CreateAdmin } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL;

export function AddAdmin({ company, onClose }: CreateAdmin) {
  const { token } = useAuth();

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newEmail2, setNewEmail2] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateUser = async () => {
    setLoading(true);
    try {
      const finalName = newName.trim();
      const finalEmail = newEmail.trim();
      const finalEmail2 = newEmail2.trim();
      const finalPassword = newPassword.trim();
      const finalPassword2 = newPassword2.trim();
      const finalUserRole = "ADMIN";

      const payload = await verify(
        finalName,
        finalEmail,
        finalEmail2,
        finalPassword,
        finalPassword2,
      );

      if (!payload) {
        setLoading(false);
        return;
      }

      payload.role = finalUserRole;

      const res = await fetch(`${API}/super-user/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error || "Erro ao criar usuário";
        setError(msg);
        setLoading(false);
        return;
      }

      setNewName("");
      setNewEmail("");
      setNewEmail2("");
      setNewPassword("");
      setNewPassword2("");
      setError("");
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Erro inesperado ao salvar",
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
      payload.companyId = company.id;

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
    <form
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.innerModal}>
          <div className={styles.box}>
            <input
              className={`form-base ${styles.input}`}
              type="text"
              placeholder="Nome"
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              className={styles.closeBtn}
              type="button"
              onClick={() => onClose()}
            >
              <MdClose />
            </button>
          </div>
          {error && <p className="error">{error}</p>}
          <div className={styles.box}>
            <input
              className={`form-base ${styles.input}`}
              type="email"
              placeholder="Novo e-mail"
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <input
              className={`form-base ${styles.input}`}
              type="email"
              placeholder="Confirme e-mail"
              onChange={(e) => setNewEmail2(e.target.value)}
            />
          </div>
          <div className={styles.box}>
            <input
              className={`form-base ${styles.input}`}
              type="text"
              placeholder="Nova senha"
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              className={`form-base ${styles.input}`}
              type="text"
              placeholder="Confirme a senha"
              onChange={(e) => setNewPassword2(e.target.value)}
            />
          </div>
          <div className={styles.box}>
            <button
              className={`btn-action glass ${styles.btnSave}`}
              type="button"
              onClick={() => handleCreateUser()}
            >
              {loading ? <h4>Criando...</h4> : <h4>Criar usuário</h4>}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
