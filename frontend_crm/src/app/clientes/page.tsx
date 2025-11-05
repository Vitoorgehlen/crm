"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Client, User } from "@/types/index";
import { AiOutlineUserAdd } from "react-icons/ai";
import { IoStar, IoStarOutline } from "react-icons/io5";
import { IoMdSearch } from "react-icons/io";
import { HiUserGroup } from "react-icons/hi2";
import styles from "./page.module.css";
import ClientsForm from "@/components/clients/ClientForm";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Clients() {
  const router = useRouter();
  const { token, permissions, isLoading } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [teamClients, setTeamClients] = useState(false);
  const [isPriorityBtn, setIsPriorityBtn] = useState(false);
  const [search, setSearch] = useState("");

  const fetchClientsData = useCallback(async () => {
    try {
      let url = "";

      if (teamClients) {
        const userParam = selectedUser ? `&userId=${selectedUser.id}` : "";
        url =
          search.trim() === ""
            ? `${API}/team-clients?${userParam}`
            : `${API}/team-clients-by-search?name=${encodeURIComponent(
                search
              )}${userParam}`;
      } else {
        url =
          search.trim() === ""
            ? `${API}/clients`
            : `${API}/clients-by-search?name=${encodeURIComponent(search)}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar clientes");
      setClients(data);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [token, teamClients, search, selectedUser]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar Usuários");
      setUsers(data);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [token]);

  const displayClients = isPriorityBtn
    ? [...clients]
        .sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        )
        .sort((a, b) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0))
    : [...clients].sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime()
      );

  const handleCreate = async (payload: Partial<Client>) => {
    if (!token) {
      router.push("/login");
      return;
    }

    const res = await fetch(`${API}/clients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro");

    await fetchClientsData();
  };

  const handleEdit = async (payload: Partial<Client>) => {
    if (!selectedClient?.id) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const res = await fetch(`${API}/clients/${selectedClient.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro");

    setClients((prev) => prev.map((c) => (c.id === data.id ? data : c)));
    await fetchClientsData();
  };

  function handleDeleteDeal() {
    fetchClientsData();
    setIsEditOpen(false);
    setSelectedClient(null);
  }

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const timeout = setTimeout(fetchClientsData, 150);
    fetchUsers();
    return () => clearTimeout(timeout);
  }, [
    token,
    isLoading,
    search,
    teamClients,
    selectedUser,
    router,
    fetchClientsData,
  ]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>{teamClients ? "Clientes da equipe" : "Clientes"}</h1>
        </div>

        <div className={styles.headerContent}>
          <div className={styles.serchClient}>
            <button className={styles.btnSearch} type="button">
              <IoMdSearch />
            </button>
            <input
              type="text"
              placeholder="Pesquise pelo nome"
              value={search}
              className={styles.inputSearch}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {teamClients && (
            <div className={styles.selectUser}>
              <select
                value={selectedUser ? selectedUser.id : ""}
                onChange={(e) => {
                  const user = users.find(
                    (u) => u.id === Number(e.target.value)
                  );
                  setSelectedUser(user || null);
                }}
              >
                <option value={""}>Todos</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.headerIcons}>
            {permissions.includes("ALL_DEAL_READ") && (
              <button
                className={`${styles.btnTeam} ${
                  teamClients ? styles.btnTeamActive : ""
                }`}
                onClick={() => setTeamClients((prev) => !prev)}
                type="button"
              >
                <HiUserGroup />
              </button>
            )}
            <button
              type="button"
              className={styles.btnPriority}
              onClick={() => setIsPriorityBtn((prev) => !prev)}
            >
              {isPriorityBtn ? (
                <IoStar className={styles.btnPriorityActive} />
              ) : (
                <IoStarOutline />
              )}
            </button>
            <button
              className={styles.addClient}
              onClick={() => setIsCreateOpen(true)}
              type="button"
            >
              <AiOutlineUserAdd />
            </button>
          </div>
        </div>

        <div>
          {clients.length === 0 ? (
            <div className={styles.noItens}>
              <p>Nenhuma cliente encontrado.</p>
            </div>
          ) : (
            <div className={styles.clientList}>
              {displayClients.map((client, index) => (
                <button
                  key={index}
                  type="button"
                  className={`
                  ${client.deleteRequest ? styles.clientDelete : styles.client} 
                  ${
                    client.isPriority && isPriorityBtn && !client.deleteRequest
                      ? styles.clientPriority
                      : ""
                  }
                `}
                  onClick={() => {
                    setIsEditOpen(true);
                    setSelectedClient(client);
                  }}
                >
                  {client.isPriority ? (
                    <IoStar className={styles.btnPriorityActiveCard} />
                  ) : (
                    <IoStarOutline className={styles.btnPriorityCard} />
                  )}
                  <h3>{client.name}</h3>
                  <h4>{client.phone}</h4>
                  {teamClients && (
                    <h6>{client.creator?.name || "Usuário não encontrado"}</h6>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={styles.box}>
          {isCreateOpen && (
            <ClientsForm
              mode="create"
              client={undefined}
              onSubmit={handleCreate}
              onClose={() => setIsCreateOpen(false)}
            />
          )}
          {isEditOpen && selectedClient && (
            <ClientsForm
              mode="edit"
              client={selectedClient}
              onClose={() => {
                setIsEditOpen(false);
                setSelectedClient(null);
              }}
              onSubmit={handleEdit}
              onDelete={handleDeleteDeal}
            />
          )}
        </div>
      </main>
    </div>
  );
}
