"use client";

import React, { useEffect, useState } from "react";
import {
  Client,
  ClientStatus,
  Deal,
  DealFormProps,
  DealStatus,
  Note,
  PaymentMethod,
} from "@/types";
import { MdClose } from "react-icons/md";
import { formatDateForCards } from "@/utils/dateUtils";
import { RiSave3Fill, RiPencilFill, RiEraserFill } from "react-icons/ri";
import styles from "./DealForm.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import CloseDealForm from "@/components/Deal/CloseDeal/CloseDealForm";
import { IoStar, IoStarOutline } from "react-icons/io5";
import { FaTimes, FaCheck } from "react-icons/fa";
import ClientsForm from "@/components/clients/ClientForm";
import { AiOutlineUserAdd } from "react-icons/ai";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function DealForm({
  mode,
  isOpen,
  deal = null,
  clients: clientsProp,
  onClose,
  onSubmit,
  onCloseDeal,
  onClientUpdated,
  onDelete,
}: DealFormProps) {
  const router = useRouter();
  const { token, isLoading } = useAuth();

  const [clients, setClients] = useState<Client[]>(clientsProp ?? []);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);

  const [clientId, setClientId] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<DealStatus>("POTENTIAL_CLIENTS");
  const [statusClient, setStatusClient] = useState<ClientStatus>("INTERESTED");
  const [isPriority, setIsPriority] = useState(false);
  const [searchProfile, setSearchProfile] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("FINANCING");
  const [cashValue, setCashValue] = useState<number>(0);
  const [fgtsValue, setFgtsValue] = useState<number>(0);
  const [financingValue, setFinancingValue] = useState<number>(0);
  const [creditLetterValue, setCreditLetterValue] = useState<number>(0);

  const [isOpenNote, setIsOpenNote] = useState<number | undefined>(undefined);
  const [newNote, setNewNote] = useState("");
  const [note, setNote] = useState<Array<Note>>([]);

  const [loading, setLoading] = useState<
    "read" | "addNote" | "save" | "del" | null
  >(null);
  const [error, setError] = useState("");

  function clearForm() {
    setClientId(undefined);
    setStatus("POTENTIAL_CLIENTS");
    setStatusClient("INTERESTED");
    setSearchProfile("");
    setIsPriority(false);
    setPaymentMethod("FINANCING");
    setCashValue(0);
    setFgtsValue(0);
    setFinancingValue(0);
    setCreditLetterValue(0);
    setError("");
  }

  const handleCreateClient = async (payload: Partial<Client>) => {
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

    setClients((prev) => [...prev, data]);
  };

  const handleSubmit = async (
    e: React.FormEvent,
    submitFunction: (payload: Partial<Deal>) => Promise<void> | void,
    isClosingDeal: boolean = false
  ) => {
    e.preventDefault();
    if (loading !== null) return;
    setLoading("save");
    setError("");

    try {
      const payload: Partial<Deal> = {
        clientId,
        statusClient,
        searchProfile,
        paymentMethod,
        cashValue: cashValue ?? 0,
        fgtsValue: fgtsValue ?? 0,
        financingValue: financingValue ?? 0,
        creditLetterValue: Number(creditLetterValue) ?? 0,
      };

      if (isClosingDeal) payload.status = status;

      const maybePromise = submitFunction(payload);
      await Promise.resolve(maybePromise);

      if (typeof clientId === "number") {
        const currentPriority = deal?.client?.isPriority ?? false;
        if (isPriority !== currentPriority) {
          const res = await fetch(`${API}/clients/${clientId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isPriority }),
          });

          if (!res.ok) throw new Error("Falha ao atualizar a prioridade");

          const updatedClient: Client = await res.json();
          if (onClientUpdated) onClientUpdated(updatedClient);
        }
      }

      if (mode === "create") clearForm();
      onClose();
    } catch (err) {
      console.log(err);
      setError("Erro ao enviar formuário");
    } finally {
      setLoading(null);
    }
  };

  async function handleAddNote() {
    if (!newNote.trim()) return;
    if (!deal) return;

    try {
      const res = await fetch(`${API}/note/${deal.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newNote }),
      });

      if (!res.ok) throw new Error("Erro ao criar nota");
      const data = await res.json();
      setNote((prev) => [data, ...prev]);
      setNewNote("");
    } catch (err) {
      console.error(err);
    }
  }

  async function handleEditNote(noteId?: number) {
    if (typeof noteId !== "number") return;

    try {
      const res = await fetch(`${API}/note/${noteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newNote }),
      });

      if (!res.ok) throw new Error("Erro ao editar valores de documentação");
      const data = await res.json();
      setNote((prev) => prev.map((item) => (item.id === noteId ? data : item)));
      setIsOpenNote(undefined);
      setNewNote("");
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteNote(noteId?: number) {
    if (typeof noteId !== "number") return;
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir essa nota?`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API}/note/${noteId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Erro ao apagar nota");
      setNote((prev) => prev.filter((item) => item.id !== noteId));
    } catch (err) {
      console.error(err);
    }
  }

  const deleteDeal = async () => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir ${deal?.client?.name}?`
    );
    if (!confirmDelete) return;

    if (loading !== null) return;
    setLoading("del");
    try {
      const res = await fetch(`${API}/deal/${deal?.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "Erro ao excluir negociação";
        setError(msg);
        return;
      }

      setError("");
      if (onDelete && deal?.id) {
        onDelete(deal.id);
      } else {
        onClose();
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao apagar o usuário");
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    async function fetchClients() {
      setLoading("read");
      try {
        const res = await fetch(`${API}/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erro ao buscar clientes");
        const data = await res.json();
        if (!mounted) return;
        setClients(data);
      } catch (err) {
        console.log(err);
        setError("Erro ao carregar lista de clientes");
      } finally {
        setLoading(null);
      }
    }

    fetchClients();
    return () => {
      mounted = false;
    };
  }, [isLoading, token, router, clientsProp]);

  useEffect(() => {
    if (deal) {
      setClientId(deal.clientId ?? undefined);
      setStatus(deal.status ?? "POTENTIAL_CLIENTS");
      setStatusClient(deal.statusClient ?? "INTERESTED");
      setSearchProfile(deal.searchProfile ?? "");
      setIsPriority(deal.client?.isPriority ?? false);
      setPaymentMethod(deal.paymentMethod ?? "FINANCING");
      setCashValue(Number(deal.cashValue ?? 0));
      setFgtsValue(Number(deal.fgtsValue ?? 0));
      setFinancingValue(Number(deal.financingValue ?? 0));
      setCreditLetterValue(Number(deal.creditLetterValue ?? 0));
      setError("");
    } else if (mode === "create") {
      clearForm();
    }
  }, [deal, mode]);

  useEffect(() => {
    if (!isOpen || !deal?.id || !token) return;

    async function fetchNote() {
      try {
        if (!deal?.id) return;
        const res = await fetch(`${API}/note/${deal.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erro ao buscar notas");
        const data = await res.json();
        setNote(data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchNote();
  }, [isOpen, deal?.id, token]);

  if (!isOpen) return null;

  return (
    <form
      className={mode === "create" ? styles.overlay : styles.overlayEdit}
      onClick={(e) => {
        if (mode === "edit") {
          if (e.target === e.currentTarget) handleSubmit(e, onSubmit, false);
        } else if (mode === "create") {
          onClose();
        }
      }}
    >
      <div
        className={mode === "create" ? styles.modal : styles.modalEdit}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.innerModal}>
          <div className={styles.modalLeft}>
            <div className={styles.titleCard}>
              <button
                className={
                  mode === "create" ? styles.closeBtn : styles.closeBtnEdit
                }
                type="button"
                onClick={() => onClose()}
              >
                <MdClose />
              </button>

              <div>
                {mode === "create" ? (
                  <h2>Adicionar negociação</h2>
                ) : (
                  <>
                    <h4>Editar negociação</h4>
                    <h2>{deal?.client?.name ?? ""}</h2>
                  </>
                )}
              </div>

              <button
                type="button"
                className={styles.btnPriority}
                onClick={() => setIsPriority(!isPriority)}
              >
                {isPriority ? (
                  <IoStar className={styles.btnPriorityActive} />
                ) : (
                  <IoStarOutline />
                )}
              </button>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.box}>
              <select
                className={styles.changeClient}
                onChange={(e) => setClientId(Number(e.target.value))}
                value={clientId || ""}
              >
                <option value="">Selecione um cliente</option>
                {clients
                  .slice()
                  .reverse()
                  .map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name || "Cliente não encontrado"}
                    </option>
                  ))}
              </select>
              {mode === "create" && (
                <button
                  className={styles.addClient}
                  onClick={() => setIsCreateOpen(true)}
                  type="button"
                >
                  <AiOutlineUserAdd />
                </button>
              )}
            </div>

            <h3>Status do cliente</h3>
            <select
              value={statusClient}
              onChange={(e) => setStatusClient(e.target.value as ClientStatus)}
              required
            >
              {Object.entries(ClientStatus)
                .filter(([key]) => {
                  if (mode === "create")
                    return key !== "REJECTED" && key !== "DROPPED_OUT";
                  return true;
                })
                .map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
            </select>

            <h3>Imóvel desejado</h3>
            <input
              type="text"
              placeholder="O que o cliente busca em um imóvel?"
              onChange={(e) => setSearchProfile(e.target.value)}
              value={searchProfile}
            />

            <h3>Método de pagamento</h3>
            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }
              required
            >
              {Object.entries(PaymentMethod).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {paymentMethod === "CASH" && (
              <>
                <div className={styles.paymentTitle}>
                  <h3>Valor a vista</h3>
                  <h3>FGTS</h3>
                </div>
                <div className={styles.payment}>
                  <input
                    type="text"
                    placeholder="Valor a vista"
                    value={cashValue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    onChange={(e) => {
                      const numeric =
                        Number(e.target.value.replace(/\D/g, "")) / 100;
                      setCashValue(numeric);
                    }}
                  />
                  <input
                    type="text"
                    placeholder="FGTS"
                    value={fgtsValue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    onChange={(e) => {
                      const numeric =
                        Number(e.target.value.replace(/\D/g, "")) / 100;
                      setFgtsValue(numeric);
                    }}
                  />
                </div>
              </>
            )}

            {paymentMethod === "FINANCING" && (
              <>
                <div className={styles.paymentTitle}>
                  <h3>Valor de entrada </h3>
                  <h3>FGTS</h3>
                  <h3>Valor de financiamento</h3>
                </div>
                <div className={styles.payment}>
                  <input
                    type="text"
                    placeholder="Valor de entrada"
                    value={cashValue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    onChange={(e) => {
                      const numeric =
                        Number(e.target.value.replace(/\D/g, "")) / 100;
                      setCashValue(numeric);
                    }}
                  />
                  <input
                    type="text"
                    placeholder="FGTS"
                    value={fgtsValue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    onChange={(e) => {
                      const numeric =
                        Number(e.target.value.replace(/\D/g, "")) / 100;
                      setFgtsValue(numeric);
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Valor de Financiamento"
                    value={financingValue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    onChange={(e) => {
                      const numeric =
                        Number(e.target.value.replace(/\D/g, "")) / 100;
                      setFinancingValue(numeric);
                    }}
                  />
                </div>
              </>
            )}

            {paymentMethod === "CREDIT_LETTER" && (
              <>
                <div className={styles.paymentTitle}>
                  <h3>Valor de entrada</h3>
                  <h3>FGTS</h3>
                  <h3>Valor da carta de crédito</h3>
                </div>
                <div className={styles.payment}>
                  <input
                    type="text"
                    placeholder="Valor de entrada"
                    value={cashValue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    onChange={(e) => {
                      const numeric =
                        Number(e.target.value.replace(/\D/g, "")) / 100;
                      setCashValue(numeric);
                    }}
                  />
                  <input
                    type="text"
                    placeholder="FGTS"
                    value={fgtsValue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    onChange={(e) => {
                      const numeric =
                        Number(e.target.value.replace(/\D/g, "")) / 100;
                      setFgtsValue(numeric);
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Valor da carta de crédito"
                    value={creditLetterValue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    onChange={(e) => {
                      const numeric =
                        Number(e.target.value.replace(/\D/g, "")) / 100;
                      setCreditLetterValue(numeric);
                    }}
                  />
                </div>
              </>
            )}

            <h2>
              {(
                (Number(cashValue) || 0) +
                (Number(fgtsValue) || 0) +
                (Number(financingValue) || 0) +
                (Number(creditLetterValue) || 0)
              ).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </h2>

            {mode === "create" ? (
              <button
                className={styles.btnDeal}
                type="button"
                onClick={(e) => handleSubmit(e, onSubmit, false)}
              >
                {loading === "save" ? "Enviando..." : "Enviar"}
              </button>
            ) : (
              <div className={styles.btnUpdateAndSell}>
                {deal?.deleteRequest ? (
                  <div className={styles.deleteRequest}>Solicitado</div>
                ) : (
                  <button
                    className={styles.btnDelete}
                    type="button"
                    onClick={() => deleteDeal()}
                  >
                    {loading === "del" ? "Apagando..." : "Apagar"}
                  </button>
                )}

                <button
                  className={styles.btnUpdate}
                  type="button"
                  onClick={(e) => handleSubmit(e, onSubmit, false)}
                >
                  {loading === "save" ? "Atualizando..." : "Atualizar"}
                </button>
                <button
                  className={styles.btnSell}
                  type="button"
                  onClick={() => {
                    if (!onCloseDeal) return setError("Função não disponível");
                    setIsCloseOpen(true);
                  }}
                >
                  Vender
                </button>
              </div>
            )}
          </div>
          {mode === "edit" && (
            <div className={styles.modalRight}>
              <div className={styles.noteSection}>
                <h2>Notas</h2>

                <div className={styles.addNote}>
                  {isOpenNote ? (
                    <>
                      <h3>Editando</h3>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Nota"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                      />

                      <button
                        type="button"
                        className={styles.btnSave}
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                      >
                        <RiSave3Fill />
                      </button>
                    </>
                  )}
                </div>

                <div className={styles.noteList}>
                  {note.length === 0 && (
                    <p>Nenhuma nota do cliente encontrada.</p>
                  )}
                  {note.map((note) => (
                    <div key={note.id} className={styles.noteItem}>
                      {isOpenNote === note.id ? (
                        <>
                          <input
                            type="text"
                            placeholder="Nota"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                          />

                          <button
                            className={styles.btnEditDocValue}
                            type="button"
                            onClick={() => handleEditNote(note.id)}
                          >
                            <FaCheck />
                          </button>
                          <button
                            className={styles.btnDelDocValue}
                            type="button"
                            onClick={() => {
                              setIsOpenNote(undefined);
                              setNewNote("");
                            }}
                          >
                            <FaTimes />
                          </button>
                        </>
                      ) : (
                        <>
                          <h3>{note.content}</h3>

                          <button
                            className={styles.btnEditDocValue}
                            type="button"
                            onClick={() => {
                              setIsOpenNote(note.id);
                              setNewNote(note.content);
                            }}
                          >
                            <RiPencilFill />
                          </button>
                          <button
                            className={styles.btnDelDocValue}
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <RiEraserFill />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {mode === "edit" && (
          <div className={styles.footerCard}>
            <h6>
              Atualizado a última vez por: {deal?.updater?.name ?? "—"} ·{" "}
              {deal?.updatedAt ? formatDateForCards(deal.updatedAt) : "—"}
            </h6>
            <h6>
              {" "}
              Criado por: {deal?.creator?.name ?? "—"} ·{" "}
              {deal?.createdAt ? formatDateForCards(deal.createdAt) : "—"}
            </h6>
          </div>
        )}

        {isCloseOpen && deal && (
          <CloseDealForm
            isOpen={isCloseOpen}
            deal={deal}
            onClose={() => setIsCloseOpen(false)}
            onSubmit={onCloseDeal!}
            initialPaymentMethod={paymentMethod}
            initialCashValue={cashValue}
            initialFgtsValue={fgtsValue}
            initialFinancingValue={financingValue}
            initialCreditLetterValue={creditLetterValue}
            newStep={async () => {
              /* noop */
            }}
          />
        )}
        {isCreateOpen && (
          <ClientsForm
            mode="create"
            client={undefined}
            onSubmit={handleCreateClient}
            onClose={() => setIsCreateOpen(false)}
          />
        )}
      </div>
    </form>
  );
}
