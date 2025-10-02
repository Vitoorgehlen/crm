"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { MdOutlineEdit, MdOutlineCancel } from "react-icons/md";import { MdClose } from "react-icons/md";

import styles from "./page.module.css";
import { User, RolePermissions, RoleLabels, ConfigUsersProps} from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ConfigUsers({mode, u, onClose, onUpdate }: ConfigUsersProps) {
  const router = useRouter();
  const { token, isLoading } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmail2, setNewEmail2] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [newRole, setNewRole] = useState('');
  
  const [isOpenEditEmail, setIsOpenEditEmail] = useState(false);
  const [isOpenEditPassword, setIsOpenEditPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push('/login'); return; }

    async function fetchMe() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao buscar Usuário');
        setUser(data);
      } catch (err: unknown) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchCompany() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/company-max-users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao buscar empresa');
        setCompany(data);
      } catch (err: unknown) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (u) {
      setUserToEdit(u);
      setNewName(u?.name || '');
      setNewRole(u?.role || '');
    }
    
    fetchMe();
    fetchCompany()
  }, [isLoading, token, router, u])
  
  const handleCreateUser = async () => {
    setLoading(true);
    try {
      const finalName = (newName).trim();
      const finalEmail = (newEmail).trim();
      const finalEmail2 = (newEmail2).trim();
      const finalPassword = (newPassword).trim();
      const finalPassword2 = (newPassword2).trim();
      const finalUserRole = (newRole ?? '').trim() || userToEdit?.role || '';

      const payload = await verify(
        finalName,
        finalEmail,
        finalEmail2,
        finalPassword,
        finalPassword2,
        false
      );

      if (!payload) {
        setLoading(false);
        return;
      }
      
      payload.role = finalUserRole;

      const res = await fetch(`${API}/users`, {
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
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao salvar");
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const finalName = (newName ?? "").trim() || userToEdit?.name || "";
      const finalEmail = (newEmail ?? "").trim() || userToEdit?.email || "";
      const finalEmail2 = (newEmail2 ?? "").trim() || userToEdit?.email || "";
      const finalPassword = (newPassword ?? "").trim() || '';
      const finalPassword2 = (newPassword2 ?? "").trim() || '';
      const finalUserRole = (newRole ?? "").trim() || userToEdit?.role;

      const payload = await verify(
        finalName,
        finalEmail,
        finalEmail2,
        finalPassword,
        finalPassword2,
        true
      );

      if (!payload) {
        setError('Erro ao fazer o payload');
        return;
      }
      
      payload.role = finalUserRole
        
      const res = await fetch(`${API}/users/${userToEdit?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        const msg = data?.error || "Erro ao atualizar usuários";
        setError(msg);
        return;
      }
      
      setNewName(data.name ?? "");
      setNewEmail(data.email ?? "");
      setNewEmail2("");
      setNewPassword("");
      setNewPassword2("");
      setError("");

      setIsOpenEditEmail(false);
      setIsOpenEditPassword(false);
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao salvar");
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
    isEdit =  false
  ) => {
    try {
      if (name.length < 4 || name.length > 25) {
        setError("Nome precisa ter entre 4 e 25 caracteres");
        return;
      }

      const payload: any = { name }

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
          setError("Senha precisa conter ao menos uma letra maiúscula e uma minúscula");
          return;
        }

        payload.password = password;
      }

      if (!isEdit) {
        if (!company) {
          setError('Erro ao encontrar a empresa');
          return;
        }
  
        if ((company.users?.length || 0) >= company.maxUsers) {
          setError('Você atingiu o limite máximo de usuários');
          return;
        }
      }

      setError('');
      return payload;
    } catch (err) {
      console.error(err);
      setError('Erro inesperado ao verificar os dados');
      return null;
    } 
  };

  return (
    <form className={styles.overlay} 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} 
        onClick={(e) => e.stopPropagation()}>
        <div className={styles.innerModal}>
          {mode === 'create' ? 
          <div className={styles.createUserLabels}>
            <div className={styles.box}>
              <input
                className={styles.labelSettingUser}
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
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.box}>
              <input
                className={styles.labelSettingUser}
                type="email"
                placeholder="Novo e-mail"
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <input
                className={styles.labelSettingUser}
                type="email"
                placeholder="Confirme e-mail"
                onChange={(e) => setNewEmail2(e.target.value)}
              />
            </div>
            <div className={styles.box}>
              <input
                className={styles.labelSettingUser}
                type="password"
                placeholder="Nova senha"
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                className={styles.labelSettingUser}
                type="password"
                placeholder="Confirme a senha"
                onChange={(e) => setNewPassword2(e.target.value)}
              />
            </div>
            <div className={styles.box}>
              <select 
                className={styles.labelSettingUser}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="">Selecione um cargo</option>
                {Object.keys(RolePermissions).map((roleKey) => (
                  <option key={roleKey} value={roleKey}>
                    {RoleLabels[roleKey] || roleKey}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.box}>
              <button 
              className={styles.btnUpdate}
              type="button"
              onClick={() => handleCreateUser()}
              >
                {loading ? <h3>Criando...</h3> : <h3>Criar usuário</h3>}
              </button>
            </div>
          </div>
          : 
          <div className={styles.createUserLabels}>
            <div className={styles.box}>
              <input
                className={styles.labelSettingUser}
                type="text"
                value={newName}
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
            {error && <p className={styles.error}>{error}</p>}
            {isOpenEditEmail ? 
              <div className={styles.box}>
                <input
                  className={styles.labelSettingUser}
                  type="email"
                  placeholder="Novo e-mail"
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <input
                  className={styles.labelSettingUser}
                  type="email"
                  placeholder="Confirme e-mail"
                  onChange={(e) => setNewEmail2(e.target.value)}
                />
                <button
                type="button"
                className={styles.btnEditUserActive}
                onClick={() => setIsOpenEditEmail(prev => !prev)}
                >
                <MdOutlineCancel/>
                </button>
              </div>
              : <div className={styles.boxClose}>
                <h2>Alterar E-mail</h2>
                <button
                type="button"
                className={styles.btnEditUser}
                onClick={() => setIsOpenEditEmail(prev => !prev)}
                >
                <MdOutlineEdit />
                </button>
              </div>}
            {isOpenEditPassword ? <div className={styles.box}>
              <input
                className={styles.labelSettingUser}
                type="password"
                placeholder="Nova senha"
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                className={styles.labelSettingUser}
                type="password"
                placeholder="Confirme a senha"
                onChange={(e) => setNewPassword2(e.target.value)}
              />
              <button
              type="button"
              className={styles.btnEditUserActive}
              onClick={() => setIsOpenEditPassword(prev => !prev)}
              >
              <MdOutlineCancel/>
              </button>
            </div>
            : <div className={styles.boxClose}>
              <h2>Alterar senha</h2>
              <button
              type="button"
              className={styles.btnEditUser}
              onClick={() => setIsOpenEditPassword(prev => !prev)}
              >
              <MdOutlineEdit />
              </button>
            </div>
            }
            <div className={styles.box}>
              <select 
                className={styles.labelSettingUser}
                value={newRole || user?.role}
                onChange={(e) => setNewRole(e.target.value)}
            >
                <option value="">Selecione um cargo</option>
                {Object.keys(RolePermissions).map((roleKey) => (
                  <option key={roleKey} value={roleKey}>
                    {RoleLabels[roleKey] || roleKey}
                  </option>
                ))}
            </select>
            </div>
            <div className={styles.box}>
              <button 
              className={styles.btnUpdate}
              type="button"
              onClick={() => handleEditUsers()}
              >
                {loading ? <h3>Editando...</h3> : <h3>Editar usuário</h3>}
              </button>
            </div>
          </div>
          }
        </div>
      </div>
    </form>
  );
}
