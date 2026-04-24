"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Client, User } from "@/types/index";
import { IoStar, IoStarOutline } from "react-icons/io5";
import styles from "./page.module.css";
import ClientsForm from "@/components/clients/ClientForm";
import { useQueryState } from "nuqs";
import HeaderPage from "@/components/searchbar/page";
import { FaArrowAltCircleLeft, FaArrowAltCircleRight } from "react-icons/fa";
import { IoCloseOutline } from "react-icons/io5";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Clients() {
  const router = useRouter();
  const { token, permissions, isLoading } = useAuth();

  const [users, setUsers] = useState<User[]>([]);

  const [ignoreClientEffect, setIgnoreClientEffect] = useState(false);
  const [clientIdRaw, setClientId] = useQueryState("clientId");
  const clientId = clientIdRaw ?? null;

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [teamClients, setTeamClients] = useQueryState("team", {
    defaultValue: false,
    parse: (v) => v === "true",
    serialize: (v) => String(v),
  });
  const [userId, setUserId] = useQueryState("userId", {
    defaultValue: "",
  });
  const selectedUser = users.find((u) => String(u.id) === userId) || null;

  const fetchClientsData = useCallback(
    async (pageToFetch: number = 1) => {
      if (!token) {
        router.push("/login");
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams();

        if (search.trim()) params.append("search", search.trim());
        params.append("page", String(pageToFetch));
        params.append("limit", String(limit));
        if (teamClients && selectedUser)
          params.append("userId", String(selectedUser.id));
        if (clientId) params.append("clientId", clientId);

        const url = teamClients
          ? `${API}/team-clients?${params.toString()}`
          : `${API}/clients?${params.toString()}`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Erro ao buscar clientes");

        const clientsData = data.data || [];

        setClients(clientsData);
        setTotal(Math.ceil(data.total / limit));
      } catch (err: unknown) {
        console.error(err);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [token, teamClients, search, selectedUser, limit, clientId],
  );

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

    await fetchClientsData(page);
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
    await fetchClientsData(page);
  };

  function handleDeleteDeal() {
    fetchClientsData(page);
    setIsEditOpen(false);
    setSelectedClient(null);
  }

  function openCreate() {
    setIsCreateOpen(true);
    setSelectedClient(null);
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > total) return;
    setPage(newPage);
  };

  useEffect(() => {
    if (!token || isLoading) return;

    const timer = setTimeout(() => {
      fetchClientsData(page);
    }, 300);

    return () => clearTimeout(timer);
  }, [page, token, clientId, teamClients, selectedUser, search]);

  useEffect(() => {
    if (token) fetchUsers();
  }, [token, fetchUsers]);

  useEffect(() => {
    if (ignoreClientEffect) return;
    if (!clientId || clients.length === 0) return;
    if (clientId === null) return;

    const client = clients.find((c) => String(c.id) === clientId);

    if (client) {
      setSelectedClient(client);
      setIsEditOpen(true);
    }
  }, [clientId, clients]);

  useEffect(() => {
    setPage(1);
  }, [teamClients, selectedUser, search]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <HeaderPage
          title="Clientes"
          search={search}
          setSearch={setSearch}
          teamMode={teamClients}
          add={true}
          setTeamMode={setTeamClients}
          users={users}
          selectedUser={selectedUser}
          setSelectedUser={(user) => setUserId(user?.id?.toString() || "")}
          permissions={permissions}
          onCreate={openCreate}
          showClearButton={!!clientId}
        />

        <div>
          {clientId && (
            <div className={styles.btnUncheck}>
              <button
                className={`btn-action glass ${styles.uncheck}`}
                onClick={() => router.push("/clientes")}
              >
                <IoCloseOutline />
              </button>
            </div>
          )}

          {clients.length === 0 && !initialLoading ? (
            <div className={styles.noItens}>
              <h3>😭 Desculpe não encotramos nenhum cliente...</h3>
              <p>
                Se o problema persistir entre em contato para corrigirmos este
                erro.
              </p>
            </div>
          ) : (
            <div className={styles.clientList}>
              {clients.map((client, index) => {
                return (
                  <button
                    key={index}
                    type="button"
                    className={`
                  glass ${styles.client} 
                  ${client.deleteRequest && "glass-danger"} 
                  ${client.isPriority && styles.clientPriority}
                `}
                    onClick={() => {
                      setIsEditOpen(true);
                      setSelectedClient(client);
                    }}
                  >
                    <div className={styles.clientHeader}>
                      {client.isPriority ? (
                        <IoStar className={styles.btnPriorityActiveCard} />
                      ) : (
                        <IoStarOutline className={styles.btnPriorityCard} />
                      )}
                      <IoStarOutline className={styles.starInvisible} />
                    </div>

                    <div className={styles.clientInfos}>
                      <h5>{client.name}</h5>
                      <span>{client.phone}</span>
                    </div>
                    {teamClients && (
                      <span className={styles.user}>
                        {client.creator?.name || "Usuário não encontrado"}
                      </span>
                    )}
                  </button>
                );
              })}

              {total > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={`
                            arrow-pagination ${
                              (page <= 1 || loading) &&
                              "arrow-pagination-disable"
                            }
                            `}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    <FaArrowAltCircleLeft />
                  </button>

                  <span>
                    <span className={styles.currentPage}>{page}</span>/{total}
                  </span>

                  <button
                    className={`
                            arrow-pagination ${
                              (page >= total || loading) &&
                              "arrow-pagination-disable"
                            }
                              `}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    <FaArrowAltCircleRight />
                  </button>
                </div>
              )}
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
