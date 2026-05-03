"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FaUserEdit, FaUsersCog } from "react-icons/fa";

import styles from "./page.module.css";
import { ClientDeletedRequest, Deal, DeleteContext } from "@/types";
import { formatDateForCards } from "@/utils/dateUtils";
import WarningDeal from "@/components/Warning/DefaultWarning";
import WarningClient from "@/components/Warning/ClientWarning";
import Tooltip from "@/components/Tools/Tooltip/Tooltip";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function DeleteRequest() {
  const router = useRouter();
  const { token, permissions, isLoading } = useAuth();
  const [isRequestClient, setIsRequestClient] = useState(true);
  const [isRequestDeal, setIsRequestDeal] = useState(false);

  const [deleteContextDeal, setDeleteContextDeal] =
    useState<DeleteContext>(null);
  const [deleteContextClient, setDeleteContextClient] =
    useState<DeleteContext>(null);
  const [dealsToDelete, setDealsToDelete] = useState<Deal[] | null>(null);
  const [showDeleteModalClient, setShowDeleteModalClient] = useState(false);

  const [clientRequest, setClientRequest] = useState<ClientDeletedRequest[]>(
    [],
  );
  const [dealRequest, setDealRequest] = useState<Deal[]>([]);
  const [loading, setLoading] = useState<"read" | "canc" | "del" | null>(null);

  const approvedRequestClient = async (client: ClientDeletedRequest) => {
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

  const fetchClientRequest = useCallback(async () => {
    setLoading("read");
    try {
      const res = await fetch(`${API}/clients-deleted-request`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar clientes");
      const clients = Array.isArray(data) ? data : (data?.clients ?? []);
      setClientRequest(clients);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }, [token]);

  async function fetchDealByClient(client: ClientDeletedRequest) {
    setLoading("read");
    try {
      const res = await fetch(`${API}/deals-by-client/${client.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar clientes");
      return data;
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  const fetchDealRequest = useCallback(async () => {
    setLoading("read");
    try {
      const res = await fetch(`${API}/deals-deleted-request`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar negociações");
      const deals = Array.isArray(data) ? data : (data?.deals ?? []);
      setDealRequest(deals);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }, [token]);

  const fetchDeleteRequest = useCallback(async () => {
    await fetchClientRequest();
    await fetchDealRequest();
  }, [fetchClientRequest, fetchDealRequest]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    fetchDeleteRequest();
  }, [isLoading, token, router, fetchDeleteRequest]);

  return (
    <div className={styles.page}>
      {permissions.includes("ALL_DEAL_DELETE") && (
        <>
          <main className={styles.main}>
            <div className={styles.headerContent}>
              <div className={styles.title}>
                <h3>Apagar</h3>
                <h5>{isRequestClient ? " Clientes" : " Negociações"}</h5>
              </div>
              <div className={styles.headerIcons}>
                <Tooltip label={"Apagar cliente"}>
                  <button
                    className={`${
                      isRequestClient && "btn-action-active"
                    } btn-action glass`}
                    onClick={() => {
                      setIsRequestClient(true);
                      setIsRequestDeal(false);
                    }}
                  >
                    <FaUserEdit />
                  </button>
                </Tooltip>

                <Tooltip label={"Apagar negociação"}>
                  <button
                    className={`${
                      isRequestDeal && "btn-action-active"
                    } btn-action glass`}
                    onClick={() => {
                      setIsRequestClient(false);
                      setIsRequestDeal(true);
                    }}
                  >
                    <FaUsersCog />
                  </button>
                </Tooltip>
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
                        <div
                          key={c.id}
                          className={`glass ${styles.deleteItem}`}
                          onClick={() =>
                            router.push(`/clientes?team=true&clientId=${c.id}`)
                          }
                        >
                          <div className={styles.deleteItemLabels}>
                            <div className={styles.titleCard}>
                              <h5>{c.name || "Cliente não encontrado"}</h5>
                            </div>
                            <div className={styles.box}>
                              <p>Negociações ativas:</p>
                              <p>{c.deals?.length ?? 0}</p>
                            </div>
                            <div className={styles.box}>
                              <p>
                                Solicitação feita por: {c.deleteRequester?.name}
                              </p>
                            </div>
                            <div className={styles.box}>
                              <span>
                                {formatDateForCards(c.deleteRequestAt)}
                              </span>
                            </div>
                          </div>
                          <div className={styles.boxBtns}>
                            <button
                              className={styles.btnDel}
                              type="button"
                              onClick={async (e) => {
                                if (!c) return;

                                e.stopPropagation();
                                const deals = await fetchDealByClient(c);

                                setDealsToDelete(deals);

                                setDeleteContextClient({
                                  message:
                                    "Tem certeza que deseja excluir o cliente",
                                  name: c.name ?? "",
                                  onConfirm: () => approvedRequestClient(c),
                                });

                                setShowDeleteModalClient(true);
                              }}
                            >
                              Apagar
                            </button>
                            <button
                              className={`${styles.btnDel} ${styles.btnCancel}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                rejectedRequestClient(c);
                              }}
                            >
                              Cancelar
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
                        <div
                          key={d.id}
                          className={`glass ${styles.deleteItem}`}
                          onClick={() => {
                            if (d.status === "POTENTIAL_CLIENTS") {
                              router.push(
                                `/negociacoes?team=true&dealId=${d.id}`,
                              );
                            } else {
                              router.push(
                                `/arquivados?team=true&dealId=${d.id}`,
                              );
                            }
                          }}
                        >
                          <div className={styles.deleteItemLabels}>
                            <div className={styles.titleCard}>
                              <h5>
                                {d.client?.name || "Negociação não encontrada"}
                              </h5>
                            </div>
                            <div className={styles.box}>
                              <p>
                                Solicitação feita por: {d.deleteRequester?.name}
                              </p>
                            </div>
                            <div className={styles.box}>
                              <span>
                                {formatDateForCards(d.deleteRequestAt)}
                              </span>
                            </div>
                          </div>
                          <div className={styles.boxBtns}>
                            <button
                              className={styles.btnDel}
                              type="button"
                              onClick={async (e) => {
                                if (!d) return;

                                e.stopPropagation();
                                setDeleteContextDeal({
                                  message:
                                    "Tem certeza que deseja excluir a negociação com",
                                  name: d.client?.name ?? "",
                                  onConfirm: () => approvedRequestDeal(d),
                                });
                              }}
                            >
                              Apagar
                            </button>
                            <button
                              className={`${styles.btnDel} ${styles.btnCancel}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                rejectedRequestDeal(d);
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          </main>

          {deleteContextDeal && (
            <WarningDeal
              message={deleteContextDeal.message}
              name={deleteContextDeal.name}
              onClose={() => setDeleteContextDeal(null)}
              onConfirm={async () => {
                await deleteContextDeal.onConfirm();
                setDeleteContextDeal(null);
              }}
            />
          )}

          {showDeleteModalClient && (
            <WarningClient
              message="Tem certeza que deseja excluir o cliente"
              name={deleteContextClient?.name || ""}
              deals={!dealsToDelete ? [] : dealsToDelete}
              onClose={() => {
                setShowDeleteModalClient(false);
                setDealsToDelete(null);
                setDeleteContextClient(null);
              }}
              onConfirm={async () => {
                if (deleteContextClient?.onConfirm) {
                  await deleteContextClient.onConfirm();
                }
                setShowDeleteModalClient(false);
                setDealsToDelete(null);
                setDeleteContextClient(null);
              }}
            />
          )}

          {deleteContextDeal && (
            <WarningDeal
              message={deleteContextDeal.message}
              name={deleteContextDeal.name}
              onClose={() => setDeleteContextDeal(null)}
              onConfirm={async () => {
                await deleteContextDeal.onConfirm();
                setDeleteContextDeal(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
