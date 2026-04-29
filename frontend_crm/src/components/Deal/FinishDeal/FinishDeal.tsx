"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MdClose } from "react-icons/md";
import styles from "./FinishDeal.module.css";
import { useAuth } from "@/contexts/AuthContext";
import {
  calculateDuration,
  formatDateForCards,
  formatDateForFinish,
} from "@/utils/dateUtils";
import {
  CommissionSplit,
  CloseDealFormProps,
  DealStepType,
  DocumentationCost,
  Note,
  DEAL_STEP_TYPE_LABEL,
  DeleteContext,
} from "@/types";
import { RiSave3Fill, RiPencilFill, RiEraserFill } from "react-icons/ri";
import { FaTimes, FaCheck } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WarningDeal from "@/components/Warning/DefaultWarning";
import CurrencyInput from "@/components/Tools/InputValue/CurrencyInput";

export default function FinishDeal({
  isOpen,
  deal,
  onClose,
  newStep,
}: CloseDealFormProps) {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [isOpenDocCost, setIsOpenDocCost] = useState<number | undefined>(
    undefined,
  );

  const [showClientPopup, setShowClientPopup] = useState(false);
  const [deleteContext, setDeleteContext] = useState<DeleteContext>(null);

  const [docCostLabel, setDocCostLabel] = useState("");
  const [docCostValue, setDocCostValue] = useState<number>(0);
  const [docCostNote, setDocCostNote] = useState("");
  const [docCost, setDocCost] = useState<Array<DocumentationCost>>([]);
  const [docCostTotal, setDocCostTotal] = useState<number>(0);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);

  const [isOpenNote, setIsOpenNote] = useState<number | undefined>(undefined);
  const [newNote, setNewNote] = useState("");
  const [note, setNote] = useState<Array<Note>>([]);

  const [splitMethod, setSplitMethod] = useState<"percentage" | "amount">(
    "percentage",
  );
  const [splits, setSplits] = useState<CommissionSplit[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const negociationDuration = calculateDuration(deal.createdAt, deal.closedAt);
  const saleDuration = calculateDuration(deal.closedAt, deal.finalizedAt);
  const negociationTotal = calculateDuration(deal.closedAt, deal.finalizedAt);

  useEffect(() => {
    let mounted = true;
    if (!isOpen) return;
    if (isLoading) return;

    async function loadUsers() {
      if (!token) return;
      try {
        const res = await fetch(`${API}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erro ao buscar usuários");
        const data = await res.json();
        if (!mounted) return;
        setUsers(data);
      } catch (err) {
        console.error(err);
      }
    }

    loadUsers();
    return () => {
      mounted = false;
    };
  }, [isOpen, token, isLoading, API]);

  const userMap = useMemo(() => {
    const m = new Map<number, string>();
    users.forEach((u) => {
      if (u?.id != null) m.set(Number(u.id), u.name);
    });
    return m;
  }, [users]);

  function computedAmountFor(index: number) {
    const s = splits[index];
    if (!s) return 0;
    if (splitMethod === "percentage") {
      const pct = s.percentage ?? 0;
      const valueNumber = (Number(deal.commissionAmount) * pct) / 100;
      const valueString = real(valueNumber);
      return valueString;
    }
    return +(s.amount ?? 0);
  }

  function real(v: number | undefined | null): string {
    if (typeof v !== "number" || !Number.isFinite(v)) return "R$ 0,00";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  async function handleChangeStep(e: React.FormEvent, step: string) {
    if (e) e.preventDefault();
    setError(null);
    if (loading) return;

    setLoading(true);
    try {
      await newStep(step);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Erro ao atualizar passo da negociação.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDocCost() {
    if (!docCostLabel.trim()) return;

    try {
      const res = await fetch(`${API}/documentationcost/${deal.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label: docCostLabel,
          value: docCostValue,
          notes: docCostNote,
        }),
      });

      if (!res.ok) throw new Error("Erro ao criar valores de documentação");
      const data = await res.json();
      setDocCost((prev) => [data, ...prev]);
      setDocCostLabel("");
      setDocCostValue(0);
      setDocCostNote("");
    } catch (err) {
      console.error(err);
    }
  }

  async function handleEditDocCost(docId?: number) {
    if (!docCostLabel.trim()) return;
    if (typeof docId !== "number") return;

    try {
      const res = await fetch(`${API}/documentationcost/${docId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label: docCostLabel,
          value: docCostValue,
          notes: docCostNote,
        }),
      });

      if (!res.ok) throw new Error("Erro ao editar valores de documentação");
      const data = await res.json();
      setDocCost((prev) =>
        prev.map((item) => (item.id === docId ? data : item)),
      );
      setIsOpenDocCost(undefined);
      setDocCostLabel("");
      setDocCostValue(0);
      setDocCostNote("");
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteDocCost(docId?: number) {
    if (typeof docId !== "number") return;

    try {
      const res = await fetch(`${API}/documentationcost/${docId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Erro ao apagar valor de documentação");
      setDocCost((prev) => prev.filter((item) => item.id !== docId));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;

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

  useEffect(() => {
    if (!isOpen) return;

    if (deal.DealShare && deal.DealShare.length > 0) {
      const shares = deal.DealShare.map((ds) => {
        const amount = Number(ds.amount ?? 0);
        const isCompany = !!ds.isCompany;
        const userId = ds.userId ?? null;
        return {
          userId: userId,
          isCompany,
          amount,
          percentage: 0,
          notes: ds.notes ?? "",
        } as CommissionSplit;
      });
      const comAmt = Number(deal.commissionAmount ?? 0);
      if (comAmt > 0) {
        shares.forEach((s) => {
          s.percentage = +(((s.amount ?? 0) / comAmt) * 100);
        });
        setSplitMethod("amount");
      } else {
        setSplitMethod("amount");
      }

      setSplits(shares);
      return;
    }

    const initial: CommissionSplit[] = [];
    if (deal.createdBy) {
      initial.push({
        userId: Number(deal.createdBy),
        isCompany: false,
        percentage: 100,
        amount: 0,
        received: 0,
        isPaid: false,
        notes: "",
      });
    }
    initial.push({
      userId: null,
      isCompany: true,
      percentage: 0,
      amount: 0,
      received: 0,
      isPaid: false,
      notes: "",
    });
    setSplits(initial);
  }, [isOpen, deal]);

  useEffect(() => {
    if (!isOpen || !deal?.id || !token) return;

    async function fetchDocumentationCost() {
      try {
        const res = await fetch(`${API}/documentationcost/${deal.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erro ao buscar valores de documentação");
        const data = await res.json();
        setDocCost(data);
        const total = data.reduce(
          (sum: number, item: DocumentationCost) =>
            sum + Number(item.value ?? 0),
          0,
        );
        setDocCostTotal(total);
      } catch (err) {
        console.error(err);
      }
    }

    fetchDocumentationCost();
  }, [isOpen, deal?.id, token, API]);

  useEffect(() => {
    if (!isOpen || !deal?.id || !token) return;

    async function fetchNote() {
      try {
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
  }, [isOpen, deal?.id, token, API]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${styles.modal} ${deal.status === "CLOSED" && styles.modalRed}`}
        onClick={(e) => e.stopPropagation()}
      >
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
                {deal.status === "CLOSED" ? (
                  <h4>
                    {DEAL_STEP_TYPE_LABEL[deal.currentStep as DealStepType]}
                  </h4>
                ) : (
                  <h4>Negociação finalizada</h4>
                )}

                <div
                  onMouseEnter={() => {
                    setShowClientPopup(true);
                  }}
                  onMouseLeave={() => {
                    setShowClientPopup(false);
                  }}
                  className={styles.popupClient}
                >
                  {deal?.client?.id ? (
                    <Link
                      className={styles.clientBtn}
                      href={`/clientes?clientId=${deal.client.id}`}
                    >
                      <h4>{deal?.client?.name ?? ""}</h4>
                    </Link>
                  ) : (
                    <h4>{deal?.client?.name ?? ""}</h4>
                  )}
                </div>
              </div>

              <button
                className={styles.closeBtnInvisble}
                type="button"
                onClick={() => onClose()}
              >
                <MdClose />
              </button>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.paymentTitle}>
              <div className={styles.payment}>
                <p>Valor</p>
                <h5>{real(Number(deal.propertyValue ?? 0))}</h5>
              </div>

              <div className={styles.payment}>
                <p>Método</p>
                <h5>{deal.paymentMethod === "CASH" && "À Vista"}</h5>
                <h5>{deal.paymentMethod === "FINANCING" && "Financiado"}</h5>
                <h5>
                  {deal.paymentMethod === "CREDIT_LETTER" && "Carta de Crédito"}
                </h5>
              </div>

              <div className={styles.payment}>
                <p>Comissão</p>
                <h5>{real(Number(deal.commissionAmount))}</h5>
              </div>
            </div>

            <div className={styles.paymentTitle}>
              <div className={styles.payment}>
                <p>Entrada</p>
                <h5>{real(Number(deal.downPaymentValue))}</h5>
              </div>
              <div className={styles.payment}>
                <p>FGTS</p>
                <h5>{real(Number(deal.fgtsValue))}</h5>
              </div>

              {deal.paymentMethod === "CASH" && (
                <div className={styles.payment}>
                  <p>Em dinheiro</p>
                  <h5>{real(Number(deal.cashValue))}</h5>
                </div>
              )}

              {deal.paymentMethod === "FINANCING" && (
                <>
                  {Number(deal.subsidyValue) > 0 && (
                    <div className={styles.payment}>
                      <p>Subsídio</p>
                      <h5>{real(Number(deal.subsidyValue))}</h5>
                    </div>
                  )}

                  <div className={styles.payment}>
                    <p>Financiado</p>
                    <h5>{real(Number(deal.financingValue))}</h5>
                  </div>
                </>
              )}

              {deal.paymentMethod === "CREDIT_LETTER" && (
                <div className={styles.payment}>
                  <p>Carta de crédito</p>
                  <h5>{real(Number(deal.creditLetterValue))}</h5>
                </div>
              )}
            </div>

            {Number(deal.installmentValue) +
              Number(deal.bonusInstallmentValue) >
              0 && (
              <div className={styles.paymentTitle}>
                {Number(deal.installmentValue) > 0 && (
                  <div className={styles.payment}>
                    <p>Parcela</p>
                    <h5>
                      {real(Number(deal.installmentValue))} x
                      {deal.installmentCount}
                    </h5>
                  </div>
                )}

                {Number(deal.bonusInstallmentValue) > 0 && (
                  <div className={styles.payment}>
                    <p>Reforços</p>
                    <h5>
                      {real(Number(deal.bonusInstallmentValue))} x
                      {deal.bonusInstallmentCount}
                    </h5>
                  </div>
                )}
              </div>
            )}

            <div className={styles.boxInfos}>
              <p>Comissão</p>

              {splits.map((s, i) => (
                <div key={i} className={styles.border}>
                  <div className={styles.boxSplitCommission}>
                    <h5>
                      {s.isCompany
                        ? "Imobiliária"
                        : s.userId != null
                          ? (userMap.get(Number(s.userId)) ?? String(s.userId))
                          : "—"}
                    </h5>
                    <p>{real(Number(computedAmountFor(i)))}</p>
                    <span>{s.notes ?? ""}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.boxInfos}>
              <p>Resumo</p>

              <div className={styles.boxGrid}>
                <div className={`${styles.boxInfo} ${styles.firstLine}`}>
                  <p className={styles.text}>Criado:</p>
                  <span>{formatDateForFinish(deal.createdAt)}</span>
                </div>

                <div className={`${styles.boxInfo} ${styles.firstLine}`}>
                  <p className={styles.text}>Criado por:</p>
                  <span>{deal?.creator?.name ?? ""}</span>
                </div>

                <div className={`${styles.boxInfo} ${styles.firstLine}`}>
                  <p className={styles.text}>Finalizado:</p>
                  <span>
                    {deal.finalizedAt
                      ? formatDateForFinish(deal.finalizedAt)
                      : "Em andamento"}
                  </span>
                </div>

                <div className={styles.boxInfo}>
                  <p className={styles.text}>Venda feita em:</p>
                  <span>{negociationDuration}</span>
                </div>

                <div className={styles.boxInfo}>
                  <p className={styles.text}>Processo:</p>
                  <span>{saleDuration ? saleDuration : "Em andamento"}</span>
                </div>

                <div className={styles.boxInfo}>
                  <p className={styles.text}>Tempo total:</p>
                  <span>
                    {negociationTotal ? negociationTotal : "Em andamento"}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.boxInfos}>
              <p>Dados do cliente</p>

              <div className={styles.boxGrid}>
                <div className={styles.boxInfo}>
                  <p className={styles.text}>Contato:</p>
                  <span>{deal?.client?.phone ?? ""}</span>
                </div>

                <div className={styles.boxInfo}>
                  <p className={styles.text}>Cliente Investidor:</p>
                  <span>{deal?.client?.isInvestor ? "Sim" : "Não"}</span>
                </div>

                <div className={styles.boxInfo}>
                  <p className={styles.text}>Data de aniversário:</p>
                  <span>{formatDateForFinish(deal?.client?.dateOfBirth)}</span>
                </div>
              </div>
            </div>

            <div className={styles.btnCancelAndConfirm}>
              {deal.status === "FINISHED" && (
                <button
                  className={`btn-action glass ${styles.btnCancel}`}
                  type="button"
                  onClick={(e) => {
                    handleChangeStep(e, "back");
                  }}
                >
                  <span>Reativar negociação</span>
                </button>
              )}
            </div>
          </div>

          <div className={`glass ${styles.modalRight}`}>
            <div className={styles.docCostSection}>
              <div className={styles.titleDocs}>
                <h5>Valor de documentação</h5>
              </div>

              <div className={styles.addDoc}>
                {isOpenDocCost ? (
                  <>
                    <span>Editando</span>
                  </>
                ) : (
                  <div>
                    <div className={styles.divAddDoc}>
                      <input
                        type="text"
                        className={`form-base ${styles.addNoteForm}`}
                        placeholder="Documentação"
                        value={docCostLabel}
                        onChange={(e) => setDocCostLabel(e.target.value)}
                      />
                      <CurrencyInput
                        className={`form-base ${styles.addNoteForm}`}
                        placeholder="Documentação"
                        value={docCostValue}
                        onChange={setDocCostValue}
                      />
                    </div>
                    <div className={styles.divAddDoc}>
                      <input
                        type="text"
                        className={`form-base ${styles.addNoteForm}`}
                        placeholder="Obs"
                        value={docCostNote}
                        onChange={(e) => setDocCostNote(e.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.btnSave}
                        onClick={handleAddDocCost}
                        disabled={!docCostLabel.trim()}
                      >
                        <RiSave3Fill />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.list}>
                {docCost.length === 0 && (
                  <p>Nenhuma documentação encontrada.</p>
                )}
                {docCost.map((doc) => (
                  <div key={doc.id} className={styles.item}>
                    {isOpenDocCost === doc.id ? (
                      <>
                        <input
                          type="text"
                          className={`form-base ${styles.addNoteForm}`}
                          placeholder="Documentação"
                          value={docCostLabel}
                          onChange={(e) => setDocCostLabel(e.target.value)}
                        />
                        <input
                          type="text"
                          className={`form-base ${styles.addNoteForm}`}
                          placeholder="Documentação"
                          value={real(docCostValue)}
                          onChange={(e) => {
                            let numeric =
                              Number(e.target.value.replace(/\D/g, "")) / 100;

                            if (numeric >= 99999999.99) numeric = 99999999.99;
                            setDocCostValue(numeric);
                          }}
                        />
                        <input
                          type="text"
                          className={`form-base ${styles.addNoteForm}`}
                          placeholder="Obs"
                          value={docCostNote}
                          onChange={(e) => setDocCostNote(e.target.value)}
                        />

                        <div className={styles.btnsNote}>
                          <button
                            className={styles.btnEditDocValue}
                            type="button"
                            onClick={() => handleEditDocCost(doc.id)}
                          >
                            <FaCheck />
                          </button>
                          <button
                            className={`${styles.btnEditDocValue} ${styles.btnDelDocValue}`}
                            type="button"
                            onClick={() => {
                              setIsOpenDocCost(undefined);
                              setDocCostLabel("");
                              setDocCostValue(0);
                              setDocCostNote("");
                            }}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className={styles.doc}>
                        <div className={styles.titleDoc}>
                          <span>{doc.label}</span>
                          <span>{real(Number(doc.value))}</span>

                          <div className={styles.btnsNote}>
                            <button
                              className={styles.btnEditDocValue}
                              type="button"
                              onClick={() => {
                                setIsOpenDocCost(doc.id);
                                setDocCostLabel(doc.label);
                                setDocCostValue(Number(doc.value));
                                setDocCostNote(doc.notes || "");
                              }}
                            >
                              <RiPencilFill />
                            </button>
                            <button
                              className={`${styles.btnEditDocValue} ${styles.btnDelDocValue}`}
                              type="button"
                              onClick={() =>
                                setDeleteContext({
                                  message: "Deseja cancelar essa documentação",
                                  name: doc.label ?? "",
                                  onConfirm: () => handleDeleteDocCost(doc.id),
                                })
                              }
                            >
                              <RiEraserFill />
                            </button>
                          </div>
                        </div>
                        <div className={styles.lineDoc}>
                          <span>{doc.notes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className={styles.docCost}>Total: {real(docCostTotal)}</p>
            </div>
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

              <div className={`glass ${styles.list}`}>
                {note.length === 0 && (
                  <p>Nenhuma nota do cliente encontrada.</p>
                )}
                {note.map((note) => (
                  <div key={note.id} className={styles.item}>
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
                            onClick={() =>
                              setDeleteContext({
                                message: "Deseja cancelar essa nota",
                                name: note.content ?? "",
                                onConfirm: () => handleDeleteNote(note.id),
                              })
                            }
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
        </div>
      </div>

      {showClientPopup && (
        <div className={`glass ${styles.popup} ${styles.clientPopup}`}>
          <h5>{deal?.client?.name ?? ""}</h5>
          <span>{deal?.client?.phone ?? ""}</span>
        </div>
      )}

      {deleteContext && (
        <WarningDeal
          message={deleteContext.message}
          name={deleteContext.name}
          onClose={() => setDeleteContext(null)}
          onConfirm={async () => {
            await deleteContext.onConfirm();
            setDeleteContext(null);
          }}
        />
      )}
    </div>
  );
}
