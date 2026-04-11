"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Client,
  ClientStatus,
  Deal,
  DealFormProps,
  DealStatus,
  Documentation,
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
import { getDaysSinceLastContact } from "@/utils/getDaysLastContact";
import { BsCashCoin } from "react-icons/bs";
import { getTotal, sumDocs } from "@/utils/sumPreviusDocs";
import CustomSelect from "@/components/Tools/Select/CustomSelect";

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
  const [showPopup, setShowPopup] = useState(false);
  const [showClientPopup, setShowClientPopup] = useState(false);

  const [searchClient, setSearchClient] = useState("");
  const [clientId, setClientId] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<DealStatus>("POTENTIAL_CLIENTS");
  const [statusClient, setStatusClient] = useState<ClientStatus>("INTERESTED");
  const [isPriority, setIsPriority] = useState(false);
  const [searchProfile, setSearchProfile] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("FINANCING");
  const [financialInstitution, setFinancialInstitution] = useState("");
  const [subsidyValue, setSubsidyValue] = useState<number>(0);
  const [downPaymentValue, setDownPaymentValue] = useState<number>(0);
  const [cashValue, setCashValue] = useState<number>(0);
  const [fgtsValue, setFgtsValue] = useState<number>(0);
  const [financingValue, setFinancingValue] = useState<number>(0);
  const [creditLetterValue, setCreditLetterValue] = useState<number>(0);

  const [docValues, setDocValues] = useState<Record<string, number>>({});
  const [docsCalculated, setDocsCalculated] = useState<
    { label: string; value: number; description: string }[]
  >([]);

  const [isOpenNote, setIsOpenNote] = useState<number | undefined>(undefined);
  const [newNote, setNewNote] = useState("");
  const [note, setNote] = useState<Array<Note>>([]);

  const [isMouseDownInside, setIsMouseDownInside] = useState(false);
  const [loading, setLoading] = useState<
    "read" | "addNote" | "save" | "del" | null
  >(null);
  const [error, setError] = useState("");

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsMouseDownInside(false);
    } else {
      setIsMouseDownInside(true);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDownInside && e.target === e.currentTarget) {
      if (mode === "create") {
        onClose();
      } else if (mode === "edit") {
        handleSubmit(e, onSubmit, false);
      }
    }
    setIsMouseDownInside(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  function clearForm() {
    setClientId(undefined);
    setStatus("POTENTIAL_CLIENTS");
    setStatusClient("INTERESTED");
    setSearchProfile("");
    setIsPriority(false);
    setPaymentMethod("FINANCING");
    setFinancialInstitution("");
    setDownPaymentValue(0);
    setSubsidyValue(0);
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
    isClosingDeal: boolean = false,
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
        financialInstitution,
        downPaymentValue: downPaymentValue ?? 0,
        subsidyValue: subsidyValue ?? 0,
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
      `Tem certeza que deseja excluir essa nota?`,
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
      `Tem certeza que deseja excluir ${deal?.client?.name}?`,
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

  const fetchDocs = useCallback(async () => {
    setLoading("read");

    try {
      const res = await fetch(`${API}/documentation-default/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Erro ao buscar a documentação");

      const map: Record<string, number> = {};

      data.forEach((d: Documentation) => {
        map[d.documentation] = d.value;
      });

      setDocValues(map);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }, [token]);

  const statusOptions = useMemo(() => {
    return Object.entries(ClientStatus)
      .filter(([key]) => {
        if (mode === "create")
          return key !== "REJECTED" && key !== "DROPPED_OUT";
        return true;
      })
      .map(([key, { label }]) => ({
        value: key as ClientStatus,
        label: label,
      }));
  }, [mode]);

  const selectedStatusOption = statusOptions.find(
    (opt) => opt.value === statusClient,
  );

  const paymentMethodOptions = useMemo(() => {
    return Object.entries(PaymentMethod).map(([key, { label }]) => ({
      value: key as PaymentMethod,
      label: label,
    }));
  }, []);

  const selectedPaymentMethodOption = paymentMethodOptions.find(
    (opt) => opt.value === paymentMethod,
  );

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  useEffect(() => {
    const result = sumDocs(
      docValues,
      paymentMethod,
      downPaymentValue,
      subsidyValue,
      cashValue,
      fgtsValue,
      financingValue,
      creditLetterValue,
    );

    setDocsCalculated(result ?? []);
  }, [
    docValues,
    paymentMethod,
    downPaymentValue,
    cashValue,
    subsidyValue,
    fgtsValue,
    financingValue,
    creditLetterValue,
  ]);

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
        setClients(data.data);
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
      setFinancialInstitution(deal.financialInstitution ?? "");
      setDownPaymentValue(Number(deal.downPaymentValue ?? 0));
      setSubsidyValue(Number(deal.subsidyValue ?? 0));
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
    if (paymentMethod === "CASH") {
      setFinancingValue(0);
      setCreditLetterValue(0);
      setSubsidyValue(0);
    }

    if (paymentMethod === "FINANCING") {
      setCashValue(0);
    }

    if (paymentMethod === "CREDIT_LETTER") {
      setFinancingValue(0);
      setCashValue(0);
    }
  }, [paymentMethod]);

  useEffect(() => {
    if (clientId) {
      const selected = clients.find((c) => c.id === clientId);
      if (selected && selected.name !== searchClient) {
        setSearchClient(selected.name);
      }
    }
  }, [clientId, clients, searchClient]);

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
      className={`${styles.overlay} ${mode === "edit" && styles.overlayEdit}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onDragStart={handleDragStart}
    >
      <div
        className={mode === "create" ? styles.modal : styles.modalEdit}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.cardDeals}>
          <div className={styles.innerModal}>
            <div className={styles.modalLeft}>
              <div className={styles.titleCard}>
                <button
                  className={styles.closeBtn}
                  type="button"
                  onClick={() => onClose()}
                >
                  <MdClose />
                </button>

                <div className={styles.titleCardEdit}>
                  {mode === "create" ? (
                    <h4>Adicionar negociação</h4>
                  ) : (
                    <>
                      <p>Editar negociação</p>
                      <div
                        onMouseEnter={() => {
                          setShowClientPopup(true);
                        }}
                        onMouseLeave={() => {
                          setShowClientPopup(false);
                        }}
                        className={styles.popupClient}
                      >
                        <button
                          className={styles.clientBtn}
                          onClick={() => {
                            if (!deal?.client?.name) return;

                            router.push(
                              `/clientes?clientId=${deal.client.id}&team=true`,
                            );
                          }}
                        >
                          <h4>{deal?.client?.name ?? ""}</h4>
                        </button>
                      </div>
                      <span>
                        {`Último contato:
                      ${getDaysSinceLastContact(
                        deal?.updatedAt ?? deal?.createdAt ?? "",
                      )}`}
                      </span>
                    </>
                  )}
                </div>

                <div className={styles.btnPriorityAndDoc}>
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
                  {mode === "edit" && (
                    <div
                      onMouseEnter={() => {
                        setShowPopup(true);
                        sumDocs(
                          docValues,
                          paymentMethod,
                          downPaymentValue,
                          subsidyValue,
                          cashValue,
                          fgtsValue,
                          financingValue,
                          creditLetterValue,
                        );
                      }}
                      onMouseLeave={() => {
                        setShowPopup(false);
                      }}
                    >
                      <BsCashCoin className={styles.btnDocValue} />
                    </div>
                  )}
                </div>
              </div>

              {error && <p className={styles.error}>{error}</p>}
              {mode === "create" && (
                <div className={styles.boxTitle}>
                  <input
                    list="clients"
                    className={`form-base ${styles.changeClient}`}
                    placeholder="Buscar cliente"
                    value={searchClient}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchClient(value);

                      const foundClient = clients.find(
                        (client) =>
                          client.name.toLowerCase() === value.toLowerCase(),
                      );
                      setClientId(foundClient ? foundClient.id : undefined);
                    }}
                  />

                  <datalist id="clients">
                    {clients
                      .slice()
                      .reverse()
                      .map((client) => (
                        <option
                          key={client.id}
                          value={client.name || "Cliente não encontrado"}
                        />
                      ))}
                  </datalist>

                  <button
                    className={styles.addClient}
                    onClick={() => setIsCreateOpen(true)}
                    type="button"
                  >
                    <AiOutlineUserAdd />
                  </button>
                </div>
              )}
              <div className={styles.box}>
                <p>Status do cliente:</p>
                <CustomSelect
                  options={statusOptions}
                  value={selectedStatusOption || null}
                  onChange={(option) => {
                    if (option) {
                      setStatusClient(option.value);
                    }
                  }}
                />
              </div>

              <div className={styles.box}>
                <p>Imóvel desejado:</p>
                <textarea
                  className={`form-base ${styles.formSearch}`}
                  placeholder="O que o cliente busca em um imóvel?"
                  onChange={(e) => setSearchProfile(e.target.value)}
                  value={searchProfile}
                />
              </div>

              <div className={styles.box}>
                <p>Método de pagamento:</p>
                <div className={styles.paymentMethod}>
                  {paymentMethod === "FINANCING" && (
                    <input
                      type="text"
                      className={`form-base ${styles.inputBank}`}
                      placeholder="Banco"
                      onChange={(e) => setFinancialInstitution(e.target.value)}
                      value={financialInstitution}
                    />
                  )}
                  <CustomSelect
                    options={paymentMethodOptions}
                    value={selectedPaymentMethodOption || null}
                    onChange={(option) => {
                      if (option) {
                        setPaymentMethod(option.value);
                      }
                    }}
                  />
                </div>
              </div>

              {paymentMethod === "CASH" && (
                <div>
                  <div className={styles.box}>
                    <p>Valor à vista</p>
                    <p>FGTS</p>
                  </div>
                  <div className={styles.payment}>
                    <input
                      type="text"
                      className={`form-base ${styles.payment}`}
                      placeholder="Valor à vista"
                      value={downPaymentValue.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      onChange={(e) => {
                        const numeric =
                          Number(e.target.value.replace(/\D/g, "")) / 100;
                        setDownPaymentValue(numeric);
                      }}
                    />
                    <input
                      type="text"
                      className={`form-base ${styles.payment}`}
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
                </div>
              )}

              {paymentMethod === "FINANCING" && (
                <div>
                  <div className={styles.box}>
                    <p>Entrada </p>
                    <p>Subsídio</p>
                    <p>FGTS</p>
                    <p>Financiamento</p>
                  </div>
                  <div className={styles.payment}>
                    <input
                      className={`form-base ${styles.payment}`}
                      type="text"
                      placeholder="Valor de entrada"
                      value={downPaymentValue.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      onChange={(e) => {
                        const numeric =
                          Number(e.target.value.replace(/\D/g, "")) / 100;
                        setDownPaymentValue(numeric);
                      }}
                    />
                    <input
                      className={`form-base ${styles.payment}`}
                      type="text"
                      placeholder="Valor de subsídio"
                      value={subsidyValue.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      onChange={(e) => {
                        const numeric =
                          Number(e.target.value.replace(/\D/g, "")) / 100;
                        setSubsidyValue(numeric);
                      }}
                    />
                    <input
                      className={`form-base ${styles.payment}`}
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
                      className={`form-base ${styles.payment}`}
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
                </div>
              )}

              {paymentMethod === "CREDIT_LETTER" && (
                <div>
                  <div className={styles.box}>
                    <p>Valor de entrada</p>
                    <p>FGTS</p>
                    <p>Valor da carta de crédito</p>
                  </div>
                  <div className={styles.payment}>
                    <input
                      className={`form-base ${styles.payment}`}
                      type="text"
                      placeholder="Valor de entrada"
                      value={downPaymentValue.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      onChange={(e) => {
                        const numeric =
                          Number(e.target.value.replace(/\D/g, "")) / 100;
                        setDownPaymentValue(numeric);
                      }}
                    />
                    <input
                      type="text"
                      className={`form-base ${styles.payment}`}
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
                      className={`form-base ${styles.payment}`}
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
                </div>
              )}

              <h3>
                {getTotal(
                  paymentMethod,
                  downPaymentValue,
                  subsidyValue,
                  cashValue,
                  fgtsValue,
                  financingValue,
                  creditLetterValue,
                ).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </h3>

              {mode === "create" ? (
                <button
                  className={`btn-action glass ${styles.btnDeal}`}
                  type="button"
                  onClick={(e) => handleSubmit(e, onSubmit, false)}
                >
                  {loading === "save" ? "Enviando" : "Enviar"}
                </button>
              ) : (
                <div className={styles.footerCard}>
                  {deal?.deleteRequest ? (
                    <button
                      className={`btn-action glass ${styles.btnDeal} ${styles.deleteRequest}`}
                      onClick={() => router.push("/requisicoes")}
                    >
                      Solicitado
                    </button>
                  ) : (
                    <button
                      className={`btn-action glass ${styles.btnDeal} ${styles.btnDelete}`}
                      type="button"
                      onClick={() => deleteDeal()}
                    >
                      {loading === "del" ? "Apagando" : "Apagar"}
                    </button>
                  )}

                  <button
                    className={`btn-action glass ${styles.btnDeal} ${styles.btnUpdate}`}
                    type="button"
                    onClick={(e) => handleSubmit(e, onSubmit, false)}
                  >
                    {loading === "save" ? "Atualizando" : "Atualizar"}
                  </button>
                  <button
                    className={`btn-action glass ${styles.btnDeal} ${styles.btnSell}`}
                    type="button"
                    onClick={() => {
                      if (!onCloseDeal)
                        return setError("Função não disponível");
                      setIsCloseOpen(true);
                    }}
                  >
                    Vender
                  </button>
                </div>
              )}
            </div>
            {mode === "edit" && (
              <div className={`glass ${styles.modalRight}`}>
                <div className={styles.noteSection}>
                  <h5>Notas</h5>
                  <div className={styles.addNote}>
                    {isOpenNote ? (
                      <>
                        <span>Editando</span>
                      </>
                    ) : (
                      <>
                        <input
                          className={`form-base ${styles.addNoteForm}`}
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

                  <div className={`glass ${styles.noteList}`}>
                    {note.length === 0 && (
                      <p>Nenhuma nota do cliente encontrada.</p>
                    )}
                    {note.map((note) => (
                      <div key={note.id} className={styles.noteItem}>
                        {isOpenNote === note.id ? (
                          <>
                            <input
                              className={`form-base ${styles.inputNote}`}
                              type="text"
                              placeholder="Nota"
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                            />

                            <div className={styles.btnsNote}>
                              <button
                                className={styles.btnEditDocValue}
                                type="button"
                                onClick={() => handleEditNote(note.id)}
                              >
                                <FaCheck />
                              </button>
                              <button
                                className={`${styles.btnEditDocValue} ${styles.btnDelDocValue}`}
                                type="button"
                                onClick={() => {
                                  setIsOpenNote(undefined);
                                  setNewNote("");
                                }}
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span>{note.content}</span>

                            <div className={styles.btnsNote}>
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
                                className={`${styles.btnEditDocValue} ${styles.btnDelDocValue}`}
                                type="button"
                                onClick={() => handleDeleteNote(note.id)}
                              >
                                <RiEraserFill />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.updateBox}>
                  <span>
                    Atualizado a última vez por: {deal?.updater?.name ?? "—"}.{" "}
                    {deal?.updatedAt ? formatDateForCards(deal.updatedAt) : "—"}
                  </span>
                  <span>
                    Criado por: {deal?.creator?.name ?? "—"}·{" "}
                    {deal?.createdAt ? formatDateForCards(deal.createdAt) : "—"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {showClientPopup && (
          <div className={`glass ${styles.popup} ${styles.clientPopup}`}>
            <h5>{deal?.client?.name ?? ""}</h5>
            <span>{deal?.client?.phone ?? ""}</span>
          </div>
        )}

        {showPopup && (
          <div className={`glass ${styles.popup} ${styles.docPopUp}`}>
            <h5>Documentação aproximada</h5>
            {docsCalculated.map((doc) => {
              return (
                <div key={doc.label} className={styles.boxDoc}>
                  <div className={styles.nameValue}>
                    <p>{doc.label}:</p>
                    <span>
                      R$
                      {doc.value.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className={styles.description}>
                    <span>{doc.description}</span>
                  </div>
                </div>
              );
            })}

            {paymentMethod === "FINANCING" && (
              <>
                {Number(downPaymentValue) +
                  Number(subsidyValue) +
                  Number(cashValue) +
                  Number(fgtsValue) +
                  Number(financingValue) +
                  Number(creditLetterValue) <
                  500000 && (
                  <div className={styles.boxDocTotal}>
                    <h5>Total MCMV:</h5>
                    <p>
                      R$
                      {docsCalculated
                        .reduce((acc, item) => {
                          if (item.label === "Financiar SBPE") return acc;
                          return acc + item.value;
                        }, 0)
                        .toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </p>
                  </div>
                )}
                <div className={styles.boxDocTotal}>
                  <h5>Total SBPE:</h5>
                  <p>
                    R$
                    {docsCalculated
                      .reduce((acc, item) => {
                        if (item.label === "Financiar MCMV") return acc;
                        return acc + item.value;
                      }, 0)
                      .toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </p>
                </div>
              </>
            )}

            {paymentMethod === "CASH" && (
              <div className={styles.boxDocTotal}>
                <h5>Total:</h5>
                <p>
                  R$
                  {docsCalculated
                    .reduce((acc, item) => {
                      if (
                        item.label === "Financiar MCMV" ||
                        item.label === "Financiar SBPE"
                      )
                        return acc;
                      return acc + item.value;
                    }, 0)
                    .toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </p>
              </div>
            )}

            {paymentMethod === "CREDIT_LETTER" && (
              <div className={styles.boxDocTotal}>
                <h4>Total:</h4>
                <p>
                  R$
                  {docsCalculated
                    .reduce((acc, item) => {
                      if (
                        item.label === "Financiar MCMV" ||
                        item.label === "Financiar SBPE"
                      )
                        return acc;
                      return acc + item.value;
                    }, 0)
                    .toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </p>
              </div>
            )}
          </div>
        )}

        {isCloseOpen && deal && (
          <CloseDealForm
            isOpen={isCloseOpen}
            deal={deal}
            onClose={() => setIsCloseOpen(false)}
            onSubmit={onCloseDeal!}
            initialPaymentMethod={paymentMethod}
            initialFinancialInstitution={financialInstitution}
            initialDownPaymentValue={downPaymentValue}
            initialSubsidyValue={subsidyValue}
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
