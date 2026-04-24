"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { MdOutlinePowerOff, MdOutlineEdit } from "react-icons/md";
import { GrConfigure } from "react-icons/gr";

import {
  FaUserEdit,
  FaUnlockAlt,
  FaUsersCog,
  FaUserPlus,
} from "react-icons/fa";

import styles from "./page.module.css";
import { User, RoleLabels, DeleteContext } from "@/types";
import ConfigUsers from "@/components/config/users/page";
import Permissions from "@/components/config/permissions/page";
import EditMe from "@/components/config/editMe/page";
import Documentation from "@/components/config/documentation/page";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Config() {
  const router = useRouter();
  const { token, permissions, isLoading, logout } = useAuth();
  const [isConfigUser, setIsConfigUser] = useState(true);
  const [isConfigTeam, setIsConfigTeam] = useState(false);
  const [isOpenPermissions, setIsOpenPermissions] = useState(false);
  const [isConfigCompany, setIsConfigCompany] = useState(false);

  const [isOpenCreateUsers, setIsOpenCreateUsers] = useState(false);
  const [isOpenEditUsers, setIsOpenEditUsers] = useState(false);
  const [userEdit, setUserEdit] = useState<User | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(false);

  const fetchMe = useCallback(async () => {
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
  }, [token]);

  const handleUpdate = async () => {
    await fetchMe();
    await fetchUsers();
  };

  const fetchUsers = useCallback(async () => {
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
  }, [token]);

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
    fetchUsers();
  }, [isLoading, token]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.headerContent}>
          <div className={styles.title}>
            <h3>Configurações</h3>
            <h5>
              {isConfigTeam && "da equipe"}
              {isOpenPermissions && "das permissões"}
              {isConfigCompany && "de documentação"}
            </h5>
          </div>
          <div className={styles.headerIcons}>
            <button
              className={`${
                isConfigUser ? "btn-action-active" : "btn-action-inactive"
              } btn-action glass`}
              onClick={() => {
                setIsConfigUser(true);
                setIsConfigTeam(false);
                setIsOpenPermissions(false);
                setIsConfigCompany(false);
              }}
            >
              <FaUserEdit />
            </button>
            {permissions.includes("USER_UPDATE") && (
              <button
                className={`${
                  isConfigTeam ? "btn-action-active" : "btn-action-inactive"
                } btn-action glass`}
                onClick={() => {
                  setIsConfigUser(false);
                  setIsConfigTeam(true);
                  setIsOpenPermissions(false);
                  setIsConfigCompany(false);
                }}
              >
                <FaUsersCog />
              </button>
            )}
            {user?.role === "ADMIN" && (
              <button
                className={`${
                  isOpenPermissions
                    ? "btn-action-active"
                    : "btn-action-inactive"
                } btn-action glass`}
                onClick={() => {
                  setIsConfigUser(false);
                  setIsConfigTeam(false);
                  setIsOpenPermissions(true);
                  setIsConfigCompany(false);
                }}
              >
                <FaUnlockAlt />
              </button>
            )}
            {user?.role === "ADMIN" && (
              <button
                className={`${
                  isConfigCompany ? "btn-action-active" : "btn-action-inactive"
                } btn-action glass`}
                onClick={() => {
                  setIsConfigUser(false);
                  setIsConfigTeam(false);
                  setIsOpenPermissions(false);
                  setIsConfigCompany(true);
                }}
              >
                <GrConfigure />
              </button>
            )}
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.settings}>
            {isConfigTeam && (
              <div className={styles.contentConfig}>
                <button
                  className={`glass ${styles.createUser}`}
                  type="button"
                  onClick={() => setIsOpenCreateUsers(true)}
                >
                  <h5>Criar usuário</h5>
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
                        <div key={u.id} className={`glass ${styles.editUser}`}>
                          {u.role === "ADMIN" ? (
                            <div className={styles.editUserLabels}>
                              <div className={styles.boxClose}>
                                <h5>{u.name}</h5>
                              </div>
                              <div className={styles.box}>
                                <p>
                                  {RoleLabels[u.role || "Cargo não encontrado"]}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className={styles.editUserLabels}>
                                <div className={styles.boxClose}>
                                  <h5>{u.name}</h5>
                                </div>
                                <div className={styles.box}>
                                  <p>{u.email}</p>
                                </div>
                                <div className={styles.box}>
                                  <span>
                                    {
                                      RoleLabels[
                                        u.role || "Cargo não encontrado"
                                      ]
                                    }
                                  </span>
                                </div>
                              </div>
                              <div className={styles.btnsUser}>
                                <button
                                  type="button"
                                  className={`btn-action glass ${styles.btnEditUser}`}
                                  onClick={() => {
                                    setIsOpenEditUsers(true);
                                    setUserEdit(u);
                                  }}
                                >
                                  <MdOutlineEdit />
                                </button>
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
              className={`btn-action glass ${styles.btnLogout}`}
              onClick={handleLogout}
              type="button"
            >
              <h5>
                <MdOutlinePowerOff /> Desconectar
              </h5>
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

        {isConfigCompany && <Documentation />}
      </main>
    </div>
  );
}
