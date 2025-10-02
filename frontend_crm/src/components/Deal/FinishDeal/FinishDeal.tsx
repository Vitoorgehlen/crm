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
} from "@/types";
import { RiSave3Fill } from "react-icons/ri";

export default function FinishDeal({
  isOpen,
  deal,
  onClose,
  newStep,
}: CloseDealFormProps) {
  const { token, isLoading } = useAuth();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [docCostLabel, setDocCostLabel] = useState("");
  const [docCostValue, setDocCostValue] = useState<number>(0);
  const [docCostNote, setDocCostNote] = useState("");
  const [docCost, setDocCost] = useState<Array<DocumentationCost>>([]);
  const [docCostTotal, setDocCostTotal] = useState<number>(0);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);

  const [newNote, setNewNote] = useState("");
  const [note, setNote] = useState<Array<Note>>([]);

  const [splitMethod, setSplitMethod] = useState<"percentage" | "amount">(
    "percentage"
  );
  const [splits, setSplits] = useState<CommissionSplit[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saleDuration = calculateDuration(deal.createdAt, deal.finalizedAt);

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
          0
        );
        setDocCostTotal(total);
      } catch (err) {
        console.error(err);
      }
    }

    fetchDocumentationCost();
  }, [isOpen, deal?.id, token]);

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
  }, [isOpen, deal?.id, token]);

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

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${styles.modal} ${
          deal.status === "CLOSED" ? styles.modalRed : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.innerModal}>
          <div className={styles.modalLeft}>
            {deal.status === "CLOSED" ? (
              <h1>{DEAL_STEP_TYPE_LABEL[deal.currentStep as DealStepType]}</h1>
            ) : (
              <h1>Negociação finalizada</h1>
            )}
            <h2>{deal?.client?.name ?? ""}</h2>

            <button
              className={styles.closeBtn}
              type="button"
              onClick={() => {
                onClose();
              }}
            >
              <MdClose />
            </button>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.paymentTitle}>
              <div className={styles.paymentBox}>
                <h3>Valor do imóvel</h3>
                <h4>{real(Number(deal.propertyValue ?? 0))}</h4>
              </div>

              <div className={styles.paymentBox}>
                <h3>Método de pagamento</h3>
                <h4>{deal.paymentMethod === "CASH" && "À Vista"}</h4>
                <h4>{deal.paymentMethod === "FINANCING" && "Financiado"}</h4>
                <h4>
                  {deal.paymentMethod === "CREDIT_LETTER" && "Carta de Crédito"}
                </h4>
              </div>

              <div className={styles.paymentBox}>
                <h3> Valor total da comissão </h3>
                <h4>{real(Number(deal.commissionAmount))}</h4>
              </div>
            </div>

            {deal.paymentMethod === "CASH" && (
              <>
                <div className={styles.paymentMethodStyle}>
                  <div className={styles.paymentBox}>
                    <h3>Em dinheiro</h3>
                    <h4>{real(Number(deal.cashValue))}</h4>
                  </div>
                  <div className={styles.paymentBox}>
                    <h3>FGTS</h3>
                    <h4>{real(Number(deal.fgtsValue))}</h4>
                  </div>
                </div>
              </>
            )}

            {deal.paymentMethod === "FINANCING" && (
              <>
                <div className={styles.paymentMethodStyle}>
                  <div className={styles.paymentBox}>
                    <h3>Entrada</h3>
                    <h4>{real(Number(deal.cashValue))}</h4>
                  </div>
                  <div className={styles.paymentBox}>
                    <h3>FGTS</h3>
                    <h4>{real(Number(deal.fgtsValue))}</h4>
                  </div>
                  <div className={styles.paymentBox}>
                    <h3>Financiado</h3>
                    <h4>{real(Number(deal.financingValue))}</h4>
                  </div>
                </div>
              </>
            )}

            {deal.paymentMethod === "CREDIT_LETTER" && (
              <>
                <div className={styles.paymentMethodStyle}>
                  <div className={styles.paymentBox}>
                    <h3>Entrada</h3>
                    <h4>{real(Number(deal.cashValue))}</h4>
                  </div>
                  <div className={styles.paymentBox}>
                    <h3>FGTS</h3>
                    <h4>{real(Number(deal.fgtsValue))}</h4>
                  </div>
                  <div className={styles.paymentBox}>
                    <h3>Carta de crédito</h3>
                    <h4>{real(Number(deal.creditLetterValue))}</h4>
                  </div>
                </div>
              </>
            )}

            <div className={styles.paymentMethodStyle}>
              {deal.installmentValue === null && (
                <>
                  <div className={styles.paymentBox}>
                    <h3>Parcela</h3>
                    <h4>{real(Number(deal.installmentValue))}</h4>
                  </div>
                  <div className={styles.paymentBox}>
                    <h3>N° parcelas</h3>
                    <h4>{deal.installmentCount}</h4>
                  </div>
                </>
              )}
              {deal.bonusInstallmentValue === null && (
                <>
                  <div className={styles.paymentBox}>
                    <h3>Reforços</h3>
                    <h4>{real(Number(deal.bonusInstallmentValue))}</h4>
                  </div>
                  <div className={styles.paymentBox}>
                    <h3>N° reforços</h3>
                    <h4>{deal.bonusInstallmentCount}</h4>
                  </div>
                </>
              )}
            </div>

            <div className={styles.boxCommissionShare}>
              <div className={styles.splitCommissionTitle}>
                <h2>Comissão</h2>
              </div>

              {splits.map((s, i) => (
                <div key={i} className={styles.border}>
                  <div className={styles.boxSplitCommission}>
                    <h3>
                      {s.isCompany
                        ? "Imobiliária"
                        : s.userId != null
                        ? userMap.get(Number(s.userId)) ?? String(s.userId)
                        : "—"}
                    </h3>
                    <h3>{real(Number(computedAmountFor(i)))}</h3>
                    <h3>{s.notes ?? ""}</h3>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.boxCommissionShare}>
              <div className={styles.splitCommissionTitle}>
                <h2>Resumo</h2>
              </div>
              <div className={styles.border}>
                <div className={styles.boxSplitCommission}>
                  <h3>Criado: {formatDateForFinish(deal.createdAt)}</h3>
                  <h3>Finalizado: {formatDateForFinish(deal.finalizedAt)}</h3>
                </div>
                <div className={styles.boxSplitCommission}>
                  <h3>Finalizado em: {saleDuration}</h3>
                </div>
              </div>
            </div>

            <div className={styles.btnUpdateAndStep}>
              {deal.status === "FINISHED" && (
                <button
                  className={styles.btnBackStep}
                  type="button"
                  onClick={(e) => {
                    handleChangeStep(e, "back");
                  }}
                >
                  Reativar negociação
                </button>
              )}
            </div>
          </div>

          <div className={styles.modalRight}>
            <div className={styles.docCostSection}>
              <h2>Valor de documentação</h2>

              <div className={styles.addDoc}>
                <input
                  type="text"
                  placeholder="Documentação"
                  value={docCostLabel}
                  onChange={(e) => setDocCostLabel(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Documentação"
                  value={real(docCostValue)}
                  onChange={(e) => {
                    const numeric =
                      Number(e.target.value.replace(/\D/g, "")) / 100;
                    setDocCostValue(numeric);
                  }}
                />
                <input
                  type="text"
                  placeholder="Obs"
                  value={docCostNote}
                  onChange={(e) => setDocCostNote(e.target.value)}
                />
                <button
                  className={styles.btnSave}
                  onClick={handleAddDocCost}
                  disabled={!docCostLabel.trim()}
                >
                  <RiSave3Fill />
                </button>
              </div>

              <div className={styles.docList}>
                {docCost.length === 0 && (
                  <p>Nenhuma documentação encontrada.</p>
                )}
                {docCost.map((doc) => (
                  <div key={doc.id} className={styles.docItem}>
                    <h3>{doc.label}</h3>
                    <h3>{real(Number(doc.value))}</h3>
                    <h3>{doc.notes}</h3>
                  </div>
                ))}
              </div>
              <h3 className={styles.docCost}>Total: {real(docCostTotal)}</h3>
            </div>

            <div className={styles.noteSection}>
              <h2>Notas</h2>

              <div className={styles.addNote}>
                <input
                  type="text"
                  placeholder="Nota"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />

                <button
                  className={styles.btnSave}
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                >
                  <RiSave3Fill />
                </button>
              </div>

              <div className={styles.noteList}>
                {note.length === 0 && (
                  <p>Nenhuma nota do cliente encontrada.</p>
                )}
                {note.map((nota) => (
                  <div key={nota.id} className={styles.noteItem}>
                    <h3>{nota.content}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

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
      </div>
    </div>
  );
}
