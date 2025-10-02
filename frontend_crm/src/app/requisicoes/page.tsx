"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FaUserEdit, FaUsersCog } from "react-icons/fa";

import styles from "./page.module.css";
import { ClientDeletedRequest, Deal, User } from "@/types";
import { formatDateForCards } from "@/utils/dateUtils";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function DeleteRequest() {
  const router = useRouter();
  const { token, permissions, isLoading } = useAuth();
  const [isRequestClient, setIsRequestClient] = useState(true);
  const [isRequestDeal, setIsRequestDeal] = useState(false);

  const [clientRequest, setClientRequest] = useState<ClientDeletedRequest[]>(
    []
  );
  const [dealRequest, setDealRequest] = useState<Deal[]>([]);
  const [loading, setLoading] = useState<"read" | "canc" | "del" | null>(null);

  async function fetchClientRequest() {
    setLoading("read");
    try {
      const res = await fetch(`${API}/clients-deleted-request`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar clientes");
      console.log("clients-deleted-request parsed:", data);
      const clients = Array.isArray(data) ? data : data?.clients ?? [];
      setClientRequest(clients);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  async function fetchDealRequest() {
    setLoading("read");
    try {
      const res = await fetch(`${API}/deals-deleted-request`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar negociações");
      const deals = Array.isArray(data) ? data : data?.deals ?? [];
      setDealRequest(deals);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  async function fetchDeleteRequest() {
    await fetchClientRequest();
    await fetchDealRequest();
  }

  const approvedRequestClient = async (client: ClientDeletedRequest) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir ${client.name}?`
    );
    if (!confirmDelete) return;

    if (client.deals?.length) {
      const confirmDelete = window.confirm(
        `${client.name} possui ${client.deals?.length} negociações em aberto`
      );
      if (!confirmDelete) return;
    }

    if (loading !== null) return;
    setLoading("del");
    try {
      const res = await fetch(`${API}/clients/${client.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;

      await fetchClientRequest();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const rejectedRequestClient = async (client: ClientDeletedRequest) => {
    const confirmDelete = window.confirm(
      `Cancelar solicitação para excluir ${client.name}?`
    );
    if (!confirmDelete) return;

    if (loading !== null) return;
    setLoading("canc");
    try {
      const res = await fetch(`${API}/clients/${client.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deleteRequest: false,
          deleteRequestBy: null,
          deleteRequestAt: null,
        }),
      });

      if (!res.ok) return;

      await fetchClientRequest();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const approvedRequestDeal = async (deal: Deal) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir ${deal.client?.name}?`
    );
    if (!confirmDelete) return;

    if (loading !== null) return;
    setLoading("del");
    try {
      const res = await fetch(`${API}/deal/${deal.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;

      await fetchDealRequest();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const rejectedRequestDeal = async (client: Deal) => {
    const confirmDelete = window.confirm(
      `Cancelar solicitação para excluir ${client.client?.name}?`
    );
    if (!confirmDelete) return;

    setLoading("canc");
    try {
      const res = await fetch(`${API}/deals/${client.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deleteRequest: false,
          deleteRequestBy: null,
          deleteRequestAt: null,
        }),
      });

      if (!res.ok) return;

      await fetchDealRequest();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    fetchDeleteRequest();
  }, [isLoading, token, router]);

  return (
    <div className={styles.page}>
      {permissions.includes("ALL_DEAL_DELETE") && (
        <>
          <main className={styles.main}>
            <div className={styles.header}>
              <h1>Apagar{isRequestClient ? " Clientes" : " Negociações"}</h1>
            </div>

            <div className={styles.headerContent}>
              <div className={styles.headerIcons}>
                <button
                  className={`${
                    isRequestClient
                      ? styles.btnSettingActive
                      : styles.btnSetting
                  }`}
                  onClick={() => {
                    setIsRequestClient(true);
                    setIsRequestDeal(false);
                  }}
                >
                  <FaUserEdit />
                  <h3>Clientes</h3>
                </button>
                {permissions.includes("USER_UPDATE") && (
                  <button
                    className={`${
                      isRequestDeal
                        ? styles.btnSettingActive
                        : styles.btnSetting
                    }`}
                    onClick={() => {
                      setIsRequestClient(false);
                      setIsRequestDeal(true);
                    }}
                  >
                    <FaUsersCog />
                    <h3>Negociações</h3>
                  </button>
                )}
              </div>
            </div>

            <div className={styles.content}>
              {isRequestClient && (
                <div className={styles.list}>
                  {clientRequest.length === 0 ? (
                    <p>Nenhum cliente para apagar</p>
                  ) : (
                    clientRequest
                      .slice()
                      .reverse()
                      .map((c) => (
                        <div key={c.id} className={styles.deleteItem}>
                          <div className={styles.deleteItemLabels}>
                            <div className={styles.title}>
                              <h3>{c.name || "Cliente não encontrado"}</h3>
                            </div>
                            <div className={styles.box}>
                              <p>Negociações ativas:</p>
                              <h3>{c.deals?.length ?? 0}</h3>
                            </div>
                            <div className={styles.box}>
                              <p>
                                Solicitação feita por: {c.deleteRequester?.name}
                              </p>
                            </div>
                            <div className={styles.box}>
                              <h6>{formatDateForCards(c.deleteRequestAt)}</h6>
                            </div>
                          </div>
                          <div className={styles.boxBtns}>
                            <button
                              className={styles.btnDelClient}
                              type="button"
                              onClick={() => approvedRequestClient(c)}
                            >
                              {loading === "del" ? "Apagando..." : "Apagar"}
                            </button>
                            <button
                              className={styles.btnCancelClient}
                              type="button"
                              onClick={() => rejectedRequestClient(c)}
                            >
                              {loading === "canc"
                                ? "Cancelando..."
                                : "Cancelar"}
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {isRequestDeal && (
                <div className={styles.list}>
                  {dealRequest.length === 0 ? (
                    <p>Nenhuma negociação para apagar</p>
                  ) : (
                    dealRequest
                      .slice()
                      .reverse()
                      .map((d) => (
                        <div key={d.id} className={styles.deleteItem}>
                          <div className={styles.deleteItemLabels}>
                            <div className={styles.title}>
                              <h3>
                                {d.client?.name || "Negociação não encontrada"}
                              </h3>
                            </div>
                            <div className={styles.box}>
                              <p>
                                Solicitação feita por: {d.deleteRequester?.name}
                              </p>
                            </div>
                            <div className={styles.box}>
                              <h6>{formatDateForCards(d.deleteRequestAt)}</h6>
                            </div>
                          </div>
                          <div className={styles.boxBtns}>
                            <button
                              className={styles.btnDelClient}
                              type="button"
                              onClick={() => approvedRequestDeal(d)}
                            >
                              {loading === "del" ? "Apagando..." : "Apagar"}
                            </button>
                            <button
                              className={styles.btnCancelClient}
                              type="button"
                              onClick={() => rejectedRequestDeal(d)}
                            >
                              {loading === "canc"
                                ? "Cancelando..."
                                : "Cancelar"}
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          </main>
        </>
      )}
      <footer className={styles.footer}></footer>
    </div>
  );
}
