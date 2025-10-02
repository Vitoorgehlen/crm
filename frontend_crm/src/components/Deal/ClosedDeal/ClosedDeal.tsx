"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MdClose } from "react-icons/md";
import styles from "./ClosedDeal.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateForCards } from "@/utils/dateUtils";
import {
  PaymentMethod,
  CloseDealPayload,
  CommissionSplit,
  CloseDealFormProps,
  DealStepType,
  DocumentationCost,
  Note,
  DEAL_STEP_TYPE_LABEL,
  WORKFLOW_BY_METHOD,
} from "@/types";
import { RiSave3Fill, RiPencilFill, RiEraserFill } from "react-icons/ri";
import { FaTimes, FaCheck } from "react-icons/fa";

import { IoRemoveCircle } from "react-icons/io5";
import {
  MdOutlineAddCircle,
  MdCheckBoxOutlineBlank,
  MdCheckBox,
} from "react-icons/md";
import { GiCheckMark } from "react-icons/gi";

export default function ClosedDeal({
  isOpen,
  deal,
  onClose,
  onSubmit,
  newStep,
}: CloseDealFormProps) {
  const { token, isLoading } = useAuth();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [companyUsers, setCompanyUsers] = useState<
    Array<{ id: number; name?: string }>
  >([]);

  const [propertyValue, setPropertyValue] = useState<number>(
    Number(deal.propertyValue ?? 0)
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    deal.paymentMethod ?? "FINANCING"
  );
  const [cashValue, setCashValue] = useState<number>(
    Number(deal.cashValue ?? 0)
  );
  const [fgtsValue, setFgtsValue] = useState<number>(
    Number(deal.fgtsValue ?? 0)
  );
  const [financingValue, setFinancingValue] = useState<number>(
    Number(deal.financingValue ?? 0)
  );
  const [creditLetterValue, setCreditLetterValue] = useState<number>(
    Number(deal.creditLetterValue ?? 0)
  );
  const [installment, setInstallment] = useState(false);
  const [installmentValue, setInstallmentValue] = useState<number>(
    Number(deal.installmentValue ?? 0)
  );
  const [installmentCount, setInstallmentCount] = useState<number>(
    Number(deal.installmentCount ?? 0)
  );
  const [bonusInstallmentValue, setBonusInstallmentValue] = useState<number>(
    Number(deal.bonusInstallmentValue ?? 0)
  );
  const [bonusInstallmentCount, setBonusInstallmentCount] = useState<number>(
    Number(deal.bonusInstallmentCount ?? 0)
  );

  const [commissionAmount, setCommissionAmount] = useState<number>(
    Number(deal.commissionAmount ?? 0)
  );
  const [isFirstStep, setIsFirstStep] = useState(false);
  const [isLastStep, setIsLastStep] = useState(false);

  const [isOpenDocCost, setIsOpenDocCost] = useState<number | undefined>(
    undefined
  );
  const [docCostLabel, setDocCostLabel] = useState("");
  const [docCostValue, setDocCostValue] = useState<number>(0);
  const [docCostNote, setDocCostNote] = useState("");
  const [docCost, setDocCost] = useState<Array<DocumentationCost>>([]);
  const [docCostTotal, setDocCostTotal] = useState<number>(0);

  const [isOpenNote, setIsOpenNote] = useState<number | undefined>(undefined);
  const [newNote, setNewNote] = useState("");
  const [note, setNote] = useState<Array<Note>>([]);

  const [splitMethod, setSplitMethod] = useState<"percentage" | "amount">(
    "percentage"
  );
  const [splits, setSplits] = useState<CommissionSplit[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPercentage = useMemo(() => {
    return splits.reduce((acc, s) => acc + (s.percentage ?? 0), 0);
  }, [splits]);

  const totalAmounts = useMemo(() => {
    return splits.reduce((acc, s) => acc + (s.amount ?? 0), 0);
  }, [splits]);

  function addSplit() {
    setSplits((prev) => [
      ...prev,
      {
        userId: companyUsers.length > 0 ? companyUsers[0].id : undefined,
        isCompany: false,
        percentage: 0,
        amount: 0,
        received: 0,
        isPaid: false,
        notes: "",
      },
    ]);
  }

  function removeSplit(index: number) {
    setSplits((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSplit(index: number, patch: Partial<CommissionSplit>) {
    setSplits((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  }

  function computedAmountFor(index: number) {
    const s = splits[index];
    if (!s) return 0;
    if (splitMethod === "percentage") {
      const pct = s.percentage ?? 0;
      const valueNumber = (commissionAmount * pct) / 100;
      const valueString = real(valueNumber);
      return valueString;
    }
    return +(s.amount ?? 0);
  }

  function real(v: number | undefined | null): string {
    if (typeof v !== "number" || !Number.isFinite(v)) return "R$ 0,00";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function validate(): string | null {
    if (
      !commissionAmount ||
      Number.isNaN(commissionAmount) ||
      commissionAmount <= 0
    ) {
      return "Informe o valor total da comissão.";
    }
    if (!propertyValue || Number.isNaN(propertyValue) || propertyValue <= 0) {
      return "Informe o valor do imóvel.";
    }

    if (splitMethod === "percentage") {
      const rounded = Math.round(totalPercentage * 100) / 100;
      if (rounded !== 100) {
        return `A soma dos percentuais deve ser 100% (atualmente: ${rounded}%).`;
      }
    } else {
      const roundedTotal = Math.round(totalAmounts * 100) / 100;
      const roundedCom = Math.round(commissionAmount * 100) / 100;
      if (roundedTotal !== roundedCom) {
        return `A soma dos valores dos splits deve ser igual ao valor da comissão (${roundedCom.toFixed(
          2
        )}).`;
      }
    }

    for (const s of splits) {
      if (!s.isCompany && !s.userId)
        return "Cada split deve apontar para um usuário ou para a empresa.";
      if (
        splitMethod === "percentage" &&
        (s.percentage === undefined || s.percentage === null)
      )
        return "Preencha todos os percentuais.";
      if (
        splitMethod === "amount" &&
        (s.amount === undefined || s.amount === null)
      )
        return "Preencha todos os valores dos splits.";
    }

    return null;
  }

  function buildPayload(): CloseDealPayload {
    const normalizedSplits = splits.map((s) => {
      const amount =
        splitMethod === "percentage"
          ? (commissionAmount * (s.percentage ?? 0)) / 100
          : +(s.amount ?? 0);
      const received = s.received ?? 0;
      const isPaid = s.isPaid || (received === amount && amount > 0);

      if (splitMethod === "percentage") {
        const pct = s.percentage ?? 0;
        return {
          userId: s.isCompany ? null : s.userId ?? null,
          isCompany: !!s.isCompany,
          percentage: pct,
          received: s.received ?? undefined,
          isPaid: isPaid,
          notes: s.notes ?? undefined,
        };
      } else {
        return {
          userId: s.isCompany ? null : s.userId ?? null,
          isCompany: !!s.isCompany,
          percentage: undefined,
          amount: +(s.amount ?? 0),
          received: s.received ?? undefined,
          isPaid: isPaid,
          notes: s.notes ?? undefined,
        };
      }
    });

    return {
      paymentMethod,
      cashValue,
      fgtsValue,
      financingValue,
      creditLetterValue,
      installmentValue,
      installmentCount,
      bonusInstallmentValue,
      bonusInstallmentCount,
      propertyValue,
      commissionAmount,
      splits: normalizedSplits,
    };
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    if (loading) return;
    setLoading(true);
    try {
      const payload = buildPayload();
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Erro ao atualizar negociação.");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeStep(e: React.FormEvent, step: string) {
    if (e) e.preventDefault();
    setError(null);

    if (step === "next" && isLastStep) {
      await handleSubmit();
      const hasUnpaidCommission = splits.some((s) => !s.isPaid);
      if (hasUnpaidCommission) {
        setError(
          "Não é possível finalizar a negociação com comissões pendentes."
        );
        return;
      }
    }

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

  function calculateStepPosition() {
    const steps = WORKFLOW_BY_METHOD[deal.paymentMethod];
    const currentIndex = steps.indexOf(deal.currentStep!);
    setIsFirstStep(currentIndex === 0);
    setIsLastStep(currentIndex === steps.length - 1);
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
        prev.map((item) => (item.id === docId ? data : item))
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
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir essa documentação?`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API}/documentationcost/${docId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Erro ao apagar valor de documentação");
      const data = await res.json();
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
      const data = await res.json();
      setNote((prev) => prev.filter((item) => item.id !== noteId));
    } catch (err) {
      console.error(err);
    }
  }

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
        setCompanyUsers(data || []);
      } catch (err) {
        console.error(err);
      }
    }

    loadUsers();
    return () => {
      mounted = false;
    };
  }, [isOpen, token, isLoading]);

  useEffect(() => {
    if (!isOpen) return;
    setCommissionAmount(Number(deal.commissionAmount ?? 0));

    if (deal.DealShare && deal.DealShare.length > 0) {
      const shares = deal.DealShare.map((ds) => ({
        userId: ds.userId ?? null,
        isCompany: !!ds.isCompany,
        amount: Number(ds.amount ?? 0),
        received: Number(ds.received ?? 0),
        isPaid: !!ds.isPaid,
        percentage: 0,
        notes: ds.notes ?? "",
      })) as CommissionSplit[];

      const comAmt = Number(deal.commissionAmount ?? 0);
      if (comAmt > 0) {
        shares.forEach((s) => {
          s.percentage = +(((s.amount ?? 0) / comAmt) * 100);
        });

        const hasInstallmentValue = Number(installmentValue ?? 0) > 0;
        setInstallment(hasInstallmentValue);
        setSplitMethod("percentage");
      } else {
        setSplitMethod("percentage");
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
    calculateStepPosition();

    async function fetchDocumentationCost() {
      try {
        const res = await fetch(`${API}/documentationcost/${deal.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erro ao buscar valores de documentação");
        const data = await res.json();
        setDocCost(data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchDocumentationCost();
  }, [isOpen, deal?.id, token]);

  useEffect(() => {
    const total = docCost.reduce(
      (sum: number, item: DocumentationCost) => sum + Number(item.value ?? 0),
      0
    );
    setDocCostTotal(total);
  }, [docCost]);

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

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSubmit();
      }}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.innerModal}>
          <div className={styles.modalLeft}>
            <h1>{DEAL_STEP_TYPE_LABEL[deal.currentStep as DealStepType]}</h1>
            <h2>{deal?.client?.name ?? ""}</h2>

            <button
              className={styles.closeBtn}
              type="button"
              onClick={(e) => handleSubmit(e)}
            >
              <MdClose />
            </button>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.paymentTitle}>
              <div className={styles.paymentBox}>
                <h3>Valor do imóvel</h3>
                <input
                  type="text"
                  value={real(propertyValue)}
                  onChange={(e) => {
                    const numeric =
                      Number(e.target.value.replace(/\D/g, "")) / 100;
                    setPropertyValue(numeric);
                  }}
                  placeholder="Valor do imóvel"
                />
              </div>

              <div className={styles.paymentBox}>
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
              </div>

              <div className={styles.paymentBox}>
                <h3> Valor total da comissão </h3>
                <input
                  type="text"
                  value={real(commissionAmount)}
                  onChange={(e) => {
                    const numeric =
                      Number(e.target.value.replace(/\D/g, "")) / 100;
                    setCommissionAmount(numeric);
                  }}
                  placeholder="Valor da comissão"
                />
              </div>
            </div>

            {paymentMethod === "CASH" && (
              <>
                <div className={styles.paymentMethodStyle}>
                  <div className={styles.paymentBox}>
                    <h3>Em dinheiro</h3>
                    <input
                      type="text"
                      placeholder="Valor a vista"
                      value={real(cashValue)}
                      onChange={(e) => {
                        const numeric =
                          Number(e.target.value.replace(/\D/g, "")) / 100;
                        setCashValue(numeric);
                      }}
                    />
                  </div>
                  <div className={styles.paymentBox}>
                    <h3>FGTS</h3>
                    <input
                      type="text"
                      placeholder="FGTS"
                      value={real(fgtsValue)}
                      onChange={(e) => {
                        const numeric =
                          Number(e.target.value.replace(/\D/g, "")) / 100;
                        setFgtsValue(numeric);
                      }}
                    />
                  </div>
                </div>
                <div className={styles.nameBtnInstallment}>
                  <button
                    className={`${styles.btnInstallment} ${
                      installment ? styles.btnInstallmentActive : ""
                    }`}
                    onClick={() => setInstallment((prev) => !prev)}
                    type="button"
                  >
                    <div className={styles.nameBtnInstallment}>
                      <h2>Parcelar entrada</h2>
                      {installment ? (
                        <MdCheckBox />
                      ) : (
                        <MdCheckBoxOutlineBlank />
                      )}
                    </div>
                  </button>
                </div>

                {installment && (
                  <>
                    <div className={styles.paymentMethodStyle}>
                      <div className={styles.paymentBox}>
                        <h3>Valor da parcela</h3>
                        <input
                          type="text"
                          placeholder="Parcelamento"
                          value={installmentValue.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          onChange={(e) => {
                            const numeric =
                              Number(e.target.value.replace(/\D/g, "")) / 100;
                            setInstallmentValue(numeric);
                          }}
                        />
                      </div>
                      <div className={styles.paymentBox}>
                        <h3>Qtd. Parcelas</h3>
                        <input
                          type="text"
                          placeholder="Qtd de parcelas"
                          value={installmentCount}
                          onChange={(e) =>
                            setInstallmentCount(Number(e.target.value))
                          }
                        />
                      </div>
                      <div className={styles.paymentBox}>
                        <h3>Valor do reforço</h3>
                        <input
                          type="text"
                          placeholder="Reforço"
                          value={bonusInstallmentValue.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          onChange={(e) => {
                            const numeric =
                              Number(e.target.value.replace(/\D/g, "")) / 100;
                            setBonusInstallmentValue(numeric);
                          }}
                        />
                      </div>
                      <div className={styles.paymentBox}>
                        <h3>Qtd. Reforços</h3>
                        <input
                          type="text"
                          placeholder="Qtd de reforços"
                          value={bonusInstallmentCount}
                          onChange={(e) =>
                            setBonusInstallmentCount(Number(e.target.value))
                          }
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {paymentMethod === "FINANCING" && (
              <>
                <div className={styles.paymentMethodStyle}>
                  <div className={styles.paymentBox}>
                    <h3>Entrada</h3>
                    <input
                      type="text"
                      placeholder="Valor de entrada"
                      value={real(cashValue)}
                      onChange={(e) => {
                        const numeric =
                          Number(e.target.value.replace(/\D/g, "")) / 100;
                        setCashValue(numeric);
                      }}
                    />
                  </div>
                  <div className={styles.paymentBox}>
                    <h3>FGTS</h3>
                    <input
                      type="text"
                      placeholder="FGTS"
                      value={real(fgtsValue)}
                      onChange={(e) => {
                        const numeric =
                          Number(e.target.value.replace(/\D/g, "")) / 100;
                        setFgtsValue(numeric);
                      }}
                    />
                  </div>
                  <div className={styles.paymentBox}>
                    <h3>Financiado</h3>
                    <input
                      type="text"
                      placeholder="Valor de Financiamento"
                      value={real(financingValue)}
                      onChange={(e) => {
                        const numeric =
                          Number(e.target.value.replace(/\D/g, "")) / 100;
                        setFinancingValue(numeric);
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {paymentMethod === "CREDIT_LETTER" && (
              <>
                <div className={styles.paymentMethodStyle}>
                  <div className={styles.paymentBox}>
                    <h3>Entrada</h3>
                    <input
                      type="text"
                      placeholder="Valor de entrada"
                      value={real(cashValue)}
                      onChange={(e) => {
                        const numeric =
                          Number(e.target.value.replace(/\D/g, "")) / 100;
                        setCashValue(numeric);
                      }}
                    />
                  </div>
                  <div className={styles.paymentBox}>
                    <h3>FGTS</h3>
                    <input
                      type="text"
                      placeholder="FGTS"
                      value={real(fgtsValue)}
                      onChange={(e) => {
                        const numeric =
                          Number(e.target.value.replace(/\D/g, "")) / 100;
                        setFgtsValue(numeric);
                      }}
                    />
                  </div>
                  <div className={styles.paymentBox}>
                    <h3>Carta de crédito</h3>
                    <input
                      type="text"
                      placeholder="Valor da carta de crédito"
                      value={real(creditLetterValue)}
                      onChange={(e) => {
                        const numeric =
                          Number(e.target.value.replace(/\D/g, "")) / 100;
                        setCreditLetterValue(numeric);
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            <div className={styles.boxCommissionShare}>
              <div className={styles.splitCommissionTitle}>
                <h2>Divisão da comissão</h2>
                <button
                  className={`
                                    ${styles.btnCommission} ${
                    splitMethod === "percentage" ? styles.btnActive : ""
                  }`}
                  type="button"
                  onClick={() => setSplitMethod("percentage")}
                >
                  por %
                </button>
                <button
                  className={`
                                    ${styles.btnCommission} ${
                    splitMethod === "amount" ? styles.btnActive : ""
                  }`}
                  type="button"
                  onClick={() => setSplitMethod("amount")}
                >
                  por valor
                </button>
                <button
                  className={styles.addSplit}
                  type="button"
                  onClick={addSplit}
                >
                  <MdOutlineAddCircle />
                </button>
              </div>

              {splits.map((s, i) => (
                <div key={i} className={styles.border}>
                  <div className={styles.boxSplitCommission}>
                    <div className={styles.paymentBox}>
                      <h3>Quem deve receber</h3>
                      {!s.isPaid ? (
                        <select
                          style={{ width: 160 }}
                          value={s.isCompany ? "company" : s.userId ?? ""}
                          onChange={(e) => {
                            const isCompany = e.target.value === "company";
                            updateSplit(i, {
                              isCompany,
                              userId: isCompany ? null : Number(e.target.value),
                            });
                          }}
                        >
                          <option value="company">Empresa</option>
                          {companyUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name ?? `Usuário ${u.id}`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <h4>
                          {companyUsers.find((user) => user.id === s.userId)
                            ?.name ?? "Empresa"}
                        </h4>
                      )}
                    </div>
                    {splitMethod === "percentage" ? (
                      !s.isPaid ? (
                        <div className={styles.paymentBox}>
                          <h3>Porcentagem</h3>
                          <div className={styles.percentCommission}>
                            <input
                              type="type"
                              style={{ width: 80 }}
                              value={s.percentage === 0 ? "" : s.percentage}
                              onChange={(e) =>
                                updateSplit(i, {
                                  percentage: Number(e.target.value),
                                })
                              }
                              placeholder="%"
                            />
                            <h3 className={styles.textSplit}>
                              {" "}
                              ≈ {computedAmountFor(i)}
                            </h3>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.paymentBox}>
                          <h3>Valor</h3>
                          <h2>{real(Number(s.amount))}</h2>
                        </div>
                      )
                    ) : !s.isPaid ? (
                      <div className={styles.paymentBox}>
                        <h3>Valor</h3>
                        <input
                          type="text"
                          style={{ width: 100 }}
                          value={real(Number(s.amount))}
                          onChange={(e) => {
                            const numeric =
                              Number(e.target.value.replace(/\D/g, "")) / 100;
                            updateSplit(i, { amount: numeric });
                          }}
                          placeholder="Valor"
                        />
                      </div>
                    ) : (
                      <div className={styles.paymentBox}>
                        <h3>Valor</h3>
                        <h4>{real(Number(s.amount))}</h4>
                      </div>
                    )}
                    {!s.isPaid && (
                      <div className={styles.paymentBox}>
                        <h3>Valor já recebido</h3>
                        <input
                          type="text"
                          style={{ width: 100 }}
                          value={real(Number(s.received))}
                          onChange={(e) => {
                            const numeric =
                              Number(e.target.value.replace(/\D/g, "")) / 100;
                            const maxAllowed = s.amount ?? 0;
                            if (numeric > maxAllowed) {
                              updateSplit(i, { received: maxAllowed });
                            } else {
                              updateSplit(i, { received: numeric });
                            }
                          }}
                          placeholder="Pago"
                        />
                      </div>
                    )}
                    <div className={styles.paymentBox}>
                      <h3>Observação</h3>
                      <input
                        className={styles.textObs}
                        type="text"
                        placeholder="Observação"
                        value={s.notes ?? ""}
                        onChange={(e) =>
                          updateSplit(i, { notes: e.target.value })
                        }
                      />
                    </div>
                    <div className={styles.paymentBox}>
                      <h3>Recebido</h3>
                      <button
                        className={`
                                                    ${styles.btnIsPaid} ${
                          s.isPaid ? styles.btnIsPaidActive : ""
                        }`}
                        type="button"
                        onClick={() => updateSplit(i, { isPaid: !s.isPaid })}
                      >
                        {s.isPaid ? (
                          <>
                            <GiCheckMark /> Recebido!
                          </>
                        ) : (
                          <>Receber</>
                        )}
                      </button>
                    </div>

                    <button
                      className={styles.removeSplit}
                      type="button"
                      onClick={() => removeSplit(i)}
                    >
                      <IoRemoveCircle />
                    </button>
                  </div>
                </div>
              ))}

              <div>
                {splitMethod === "percentage" ? (
                  <h3>Somatório: {totalPercentage.toFixed(2)}%</h3>
                ) : (
                  <h3>
                    Somatório: R$ {totalAmounts.toFixed(2)} / Comissão R${" "}
                    {commissionAmount.toFixed(2)}
                  </h3>
                )}
              </div>
            </div>
          </div>

          <div className={styles.modalRight}>
            <div className={styles.docCostSection}>
              <h2>Valor de documentação</h2>

              <div className={styles.addDoc}>
                {isOpenDocCost ? (
                  <>
                    <h3>Editando</h3>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              <div className={styles.docList}>
                {docCost.length === 0 && (
                  <p>Nenhuma documentação encontrada.</p>
                )}
                {docCost.map((doc) => (
                  <div key={doc.id} className={styles.docItem}>
                    {isOpenDocCost === doc.id ? (
                      <>
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
                          className={styles.btnEditDocValue}
                          type="button"
                          onClick={() => handleEditDocCost(doc.id)}
                        >
                          <FaCheck />
                        </button>
                        <button
                          className={styles.btnDelDocValue}
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
                      </>
                    ) : (
                      <>
                        <h3>{doc.label}</h3>
                        <h3>{real(Number(doc.value))}</h3>
                        <h3>{doc.notes}</h3>

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
                          className={styles.btnDelDocValue}
                          type="button"
                          onClick={() => handleDeleteDocCost(doc.id)}
                        >
                          <RiEraserFill />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <h3 className={styles.docCost}>Total: {real(docCostTotal)}</h3>
            </div>

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
        </div>

        <div className={styles.footerCard}>
          <div className={styles.btnUpdateAndStep}>
            <button
              className={styles.btnBackStep}
              type="button"
              onClick={(e) => {
                handleChangeStep(e, "back");
              }}
            >
              {isFirstStep ? "Cancelar negociação" : "Voltar etapa"}
            </button>

            <button
              className={styles.btnUpdate}
              type="button"
              onClick={(e) => handleSubmit(e)}
            >
              Atualizar
            </button>

            <button
              className={styles.btnNextStep}
              type="button"
              onClick={(e) => {
                handleChangeStep(e, "next");
              }}
            >
              {isLastStep ? "Finalizar negociação" : "Próxima etapa"}
            </button>
          </div>
          <div className={styles.updateBox}>
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
    </div>
  );
}
