"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  MdOutlinePowerOff,
  MdOutlineEdit,
  MdDeleteForever,
  MdAutoDelete,
} from "react-icons/md";

import {
  FaUserEdit,
  FaUnlockAlt,
  FaUsersCog,
  FaUserPlus,
} from "react-icons/fa";

import styles from "./page.module.css";
import { User, RoleLabels } from "@/types";
import ConfigUsers from "@/components/config/users/page";
import Permissions from "@/components/config/permissions/page";
import EditMe from "@/components/config/editMe/page";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Config() {
  const router = useRouter();
  const { token, permissions, isLoading, logout } = useAuth();
  const [isConfigUser, setIsConfigUser] = useState(true);
  const [isConfigTeam, setIsConfigTeam] = useState(false);
  const [isOpenPermissions, setIsOpenPermissions] = useState(false);

  const [isOpenCreateUsers, setIsOpenCreateUsers] = useState(false);
  const [isOpenEditUsers, setIsOpenEditUsers] = useState(false);
  const [userEdit, setUserEdit] = useState<User | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(false);

  async function fetchMe() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar Usuário");
      setUser(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async () => {
    await fetchMe();
    await fetchUsers();
  };

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar Usuários");
      setUsers(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const deleteUser = async (UserDelete: User) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir ${UserDelete.name}?`
    );
    if (!confirmDelete) return;

    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/users/${UserDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;

      handleUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      logout();

      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    fetchMe();
  }, [isLoading, token, router]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>
            {isConfigUser && "Minhas "}
            Configurações
            {isConfigTeam && " da Equipe"}
            {isOpenPermissions && " das Permissões"}
          </h1>
        </div>

        <div className={styles.headerContent}>
          <div className={styles.headerIcons}>
            <button
              className={`${
                isConfigUser ? styles.btnSettingActive : styles.btnSetting
              }`}
              onClick={(e) => {
                setIsConfigUser(true);
                setIsConfigTeam(false);
                setIsOpenPermissions(false);
              }}
            >
              <FaUserEdit />
              <h3>Suas configurações</h3>
            </button>
            {permissions.includes("USER_UPDATE") && (
              <button
                className={`${
                  isConfigTeam ? styles.btnSettingActive : styles.btnSetting
                }`}
                onClick={(e) => {
                  setIsConfigUser(false);
                  setIsConfigTeam(true);
                  setIsOpenPermissions(false);
                }}
              >
                <FaUsersCog />
                <h3>Configurações da equipe</h3>
              </button>
            )}
            {user?.role === "ADMIN" && (
              <button
                className={`${
                  isOpenPermissions
                    ? styles.btnSettingActive
                    : styles.btnSetting
                }`}
                onClick={(e) => {
                  setIsConfigUser(false);
                  setIsConfigTeam(false);
                  setIsOpenPermissions(true);
                }}
              >
                <FaUnlockAlt />
                <h3>Permissões da equipe</h3>
              </button>
            )}
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.settings}>
            {isConfigTeam && (
              <div className={styles.contentConfig}>
                <button
                  className={styles.createUser}
                  type="button"
                  onClick={() => setIsOpenCreateUsers(true)}
                >
                  <h2>Criar usuário</h2>
                  <FaUserPlus />
                </button>
                <div className={styles.userList}>
                  {users.length === 0 ? (
                    <p>Nenhum usuário encontrado</p>
                  ) : (
                    users
                      .slice()
                      .reverse()
                      .map((u) => (
                        <div key={u.id} className={styles.editUser}>
                          {u.role === "ADMIN" ? (
                            <div className={styles.editUserLabels}>
                              <div className={styles.boxClose}>
                                <h3>{u.name}</h3>
                              </div>
                              <div className={styles.box}>
                                <h5>
                                  {RoleLabels[u.role || "Cargo não encontrado"]}
                                </h5>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className={styles.editUserLabels}>
                                <div className={styles.boxClose}>
                                  <h3>{u.name}</h3>
                                </div>
                                <div className={styles.box}>
                                  <p>{u.email}</p>
                                </div>
                                <div className={styles.box}>
                                  <h5>
                                    {
                                      RoleLabels[
                                        u.role || "Cargo não encontrado"
                                      ]
                                    }
                                  </h5>
                                </div>
                              </div>
                              <div className={styles.btnsUser}>
                                <button
                                  type="button"
                                  className={styles.btnEditUser}
                                  onClick={() => {
                                    setIsOpenEditUsers(true);
                                    setUserEdit(u);
                                  }}
                                >
                                  <MdOutlineEdit />
                                </button>
                                {user?.role === "ADMIN" && (
                                  <button
                                    type="button"
                                    className={styles.btnDeleteUser}
                                    onClick={() => {
                                      deleteUser(u);
                                    }}
                                  >
                                    <MdDeleteForever />
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {isConfigUser && user && (
          <div className={styles.editMe}>
            <EditMe u={user} onUpdate={() => handleUpdate()} />

            <button
              className={styles.btnLogout}
              onClick={handleLogout}
              type="button"
            >
              <h3>
                <MdOutlinePowerOff /> Desconectar
              </h3>
            </button>
          </div>
        )}

        {isOpenEditUsers && (
          <ConfigUsers
            mode="edit"
            u={userEdit}
            onUpdate={() => handleUpdate()}
            onClose={() => setIsOpenEditUsers(false)}
          />
        )}

        {isOpenCreateUsers && (
          <ConfigUsers
            mode="create"
            onUpdate={() => handleUpdate()}
            onClose={() => setIsOpenCreateUsers(false)}
          />
        )}

        {isOpenPermissions && (
          <Permissions
            userRole={user?.role || ""}
            onClose={() => setIsOpenPermissions(false)}
          />
        )}
      </main>

      <footer className={styles.footer}></footer>
    </div>
  );
}
