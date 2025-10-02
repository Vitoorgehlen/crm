"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

import styles from "./page.module.css";
import {
  RolePermissions,
  RoleLabels,
  ConfigPermissionsProps,
  RolePermission,
  PermissionState,
  PermissionLabels,
  PermissionEnum,
} from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Permissions({
  userRole,
  onClose,
}: ConfigPermissionsProps) {
  const { token } = useAuth();

  const [usersRoles, setUsersRoles] = useState<RolePermission[]>([]);
  const [permissionsByRole, setPermissionsByRole] = useState<
    Record<string, PermissionState>
  >({});

  const [loading, setLoading] = useState<"save" | "reset" | null>(null);

  useEffect(() => {
    if (userRole === "ADMIN" && token) {
      async function fetchUserRoles() {
        setLoading("save");
        try {
          const res = await fetch(`${API}/role-permission`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = await res.json();
          if (!res.ok)
            throw new Error(data.error || "Erro ao buscar regras dos usuários");
          setUsersRoles(data);
        } catch (err: unknown) {
          console.error(err);
        } finally {
          setLoading(null);
        }
      }

      fetchUserRoles();
    }
  }, [userRole, token, API]);

  useEffect(() => {
    if (userRole === "ADMIN" && token) {
      if (usersRoles.length > 0) {
        const grouped: Record<string, PermissionState> = {};

        Object.keys(RolePermissions).forEach((role) => {
          const state: PermissionState = {};
          Object.values(PermissionEnum).forEach((perm) => {
            const rolePerm = usersRoles.find(
              (r: any) => r.permission === perm && r.role === role
            );
            state[perm] = rolePerm ? rolePerm.allowed : false;
          });
          grouped[role] = state;
        });
        setPermissionsByRole(grouped);
      }
    }
  }, [usersRoles]);

  const togglePermissionForRole = (role: string, perm: string) => {
    setPermissionsByRole((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [perm]: !prev[role]?.[perm],
      },
    }));
  };

  const handleSavePermissions = async () => {
    setLoading("save");
    try {
      const currentMap: Record<string, Record<string, boolean>> = {};
      usersRoles.forEach((r: any) => {
        const roleName = r.role;
        if (!roleName) return;
        if (!currentMap[roleName]) currentMap[roleName] = {};
        currentMap[roleName][r.permission] = !!r.allowed;
      });

      const roles = Object.keys(permissionsByRole);
      const requests: Promise<Response>[] = [];

      for (const role of roles) {
        const desired = permissionsByRole[role] || {};
        const updates: { permission: string; allowed: boolean }[] = [];

        Object.keys(desired).forEach((perm) => {
          const allowedNow = !!desired[perm];
          const allowedBefore = !!(currentMap[role] && currentMap[role][perm]);

          if (allowedNow !== allowedBefore) {
            updates.push({ permission: perm, allowed: allowedNow });
          }
        });

        if (updates.length === 0) continue;

        requests.push(
          fetch(`${API}/role-permission`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ role, updates }),
          })
        );
      }

      if (requests.length === 0) {
        setLoading(null);
        return;
      }

      const responses = await Promise.all(requests);

      for (const res of responses) {
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          const msg =
            errBody?.error ||
            `Erro ao salvar permissões (status ${res.status})`;
          throw new Error(msg);
        }
      }

      const refetch = await fetch(`${API}/role-permission`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newData = await refetch.json();
      if (!refetch.ok)
        throw new Error(newData?.error || "Erro ao recarregar regras");

      setUsersRoles(newData);

      const grouped: Record<string, PermissionState> = {};
      Object.keys(RolePermissions).forEach((r) => {
        const state: PermissionState = {};
        Object.values(PermissionEnum).forEach((p) => {
          const item = newData.find(
            (x: any) => x.role === r && x.permission === p
          );
          state[p] = item ? !!item.allowed : false;
        });
        grouped[r] = state;
      });
      setPermissionsByRole(grouped);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleResetPermissions = async () => {
    setLoading("reset");
    try {
      const res = await fetch(`${API}/role-permission/reset`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || "Erro ao resetar permissões");
      }

      const refetch = await fetch(`${API}/role-permission`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newData = await refetch.json();
      setUsersRoles(newData);

      const grouped: Record<string, PermissionState> = {};
      Object.keys(RolePermissions).forEach((r) => {
        const state: PermissionState = {};
        Object.values(PermissionEnum).forEach((p) => {
          const item = newData.find(
            (x: any) => x.role === r && x.permission === p
          );
          state[p] = item ? !!item.allowed : false;
        });
        grouped[r] = state;
      });
      setPermissionsByRole(grouped);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <form
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.labelsSettingPermissions}>
        {Object.entries(permissionsByRole).map(([role, state]) => (
          <div key={role} className={styles.btnPermissions}>
            <h3>{RoleLabels[role] || role}</h3>
            <div className={styles.permissions}>
              {Object.entries(state).map(([perm, allowed]) => (
                <button
                  key={perm}
                  type="button"
                  className={styles.permissionBtn}
                  onClick={() => togglePermissionForRole(role, perm)}
                >
                  <p>{PermissionLabels[perm] || perm}</p>
                  <div className={styles.slideBtn}>
                    <div
                      className={
                        allowed ? styles.slideBtnOff : styles.slideBtnOnOff
                      }
                    >
                      Off
                    </div>
                    <div
                      className={
                        allowed ? styles.slideBtnOn : styles.slideBtnOff
                      }
                    >
                      On
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.btnsEnd}>
        <button
          className={styles.btnSave}
          onClick={handleResetPermissions}
          type="button"
        >
          {loading === "reset" ? (
            <h3>Resetando...</h3>
          ) : (
            <h3>Resetar as permissões</h3>
          )}
        </button>
        <button
          className={styles.btnSave}
          onClick={handleSavePermissions}
          type="button"
        >
          {loading === "save" ? (
            <h3>Salvando...</h3>
          ) : (
            <h3>Salvar as permissões</h3>
          )}
        </button>
      </div>
    </form>
  );
}
