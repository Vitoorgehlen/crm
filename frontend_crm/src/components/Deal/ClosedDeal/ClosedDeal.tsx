"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Documentation,
  DeleteContext,
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
import { getDaysSinceLastContact } from "@/utils/getDaysLastContact";
import { BsCashCoin } from "react-icons/bs";
import { sumDocs } from "@/utils/sumPreviusDocs";
import Link from "next/link";
import CustomSelect from "@/components/Tools/Select/CustomSelect";
import CurrencyInput from "@/components/Tools/InputValue/CurrencyInput";
import WarningDeal from "@/components/Warning/DefaultWarning";

export default function ClosedDeal({
  isOpen,
  deal,
  onClose,
  onSubmit,
  newStep,
  onUpdateDealShare,
}: CloseDealFormProps) {
  const { token, permissions, isLoading, userId } = useAuth();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [companyUsers, setCompanyUsers] = useState<
    Array<{ id: number; name?: string }>
  >([]);

  const [propertyValue, setPropertyValue] = useState<number>(
    Number(deal.propertyValue ?? 0),
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    deal.paymentMethod ?? "FINANCING",
  );
  const [financialInstitution, setFinancialInstitution] = useState(
    deal.financialInstitution ?? "",
  );
  const [downPaymentValue, setDownPaymentValue] = useState<number>(
    Number(deal.downPaymentValue ?? 0),
  );
  const [subsidyValue, setSubsidyValue] = useState<number>(
    Number(deal.subsidyValue ?? 0),
  );
  const [cashValue, setCashValue] = useState<number>(
    Number(deal.cashValue ?? 0),
  );
  const [fgtsValue, setFgtsValue] = useState<number>(
    Number(deal.fgtsValue ?? 0),
  );
  const [financingValue, setFinancingValue] = useState<number>(
    Number(deal.financingValue ?? 0),
  );
  const [creditLetterValue, setCreditLetterValue] = useState<number>(
    Number(deal.creditLetterValue ?? 0),
  );
  const [installment, setInstallment] = useState(false);
  const [installmentValue, setInstallmentValue] = useState<number>(
    Number(deal.installmentValue ?? 0),
  );
  const [installmentCount, setInstallmentCount] = useState<number>(
    Number(deal.installmentCount ?? 0),
  );
  const [bonusInstallmentValue, setBonusInstallmentValue] = useState<number>(
    Number(deal.bonusInstallmentValue ?? 0),
  );
  const [bonusInstallmentCount, setBonusInstallmentCount] = useState<number>(
    Number(deal.bonusInstallmentCount ?? 0),
  );

  const [commissionAmount, setCommissionAmount] = useState<number>(
    Number(deal.commissionAmount ?? 0),
  );
  const [isFirstStep, setIsFirstStep] = useState(false);
  const [isLastStep, setIsLastStep] = useState(false);

  const [isOpenDocCost, setIsOpenDocCost] = useState<number | undefined>(
    undefined,
  );
  const [docCostLabel, setDocCostLabel] = useState("");
  const [docCostValue, setDocCostValue] = useState<number>(0);
  const [docCostNote, setDocCostNote] = useState("");
  const [docCost, setDocCost] = useState<Array<DocumentationCost>>([]);
  const [docCostTotal, setDocCostTotal] = useState<number>(0);

  const [showClientPopup, setShowClientPopup] = useState(false);
  const [deleteContext, setDeleteContext] = useState<DeleteContext>(null);

  const [showPopup, setShowPopup] = useState(false);
  const [docValues, setDocValues] = useState<Record<string, number>>({});
  const [docsCalculated, setDocsCalculated] = useState<
    { label: string; value: number; description: string }[]
  >([]);

  const [isOpenNote, setIsOpenNote] = useState<number | undefined>(undefined);
  const [newNote, setNewNote] = useState("");
  const [note, setNote] = useState<Array<Note>>([]);

  const [splitMethod, setSplitMethod] = useState<"percentage" | "amount">(
    "percentage",
  );
  const [splits, setSplits] = useState<CommissionSplit[]>([]);

  const [isMouseDownInside, setIsMouseDownInside] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPercentage = useMemo(() => {
    return splits.reduce((acc, s) => acc + (s.percentage ?? 0), 0);
  }, [splits]);

  const totalAmounts = useMemo(() => {
    return splits.reduce((acc, s) => acc + (s.amount ?? 0), 0);
  }, [splits]);

  const paymentMethodOptions = useMemo(() => {
    return Object.entries(PaymentMethod).map(([key, { label }]) => ({
      value: key as PaymentMethod,
      label: label,
    }));
  }, []);

  const selectedPaymentMethodOption = paymentMethodOptions.find(
    (opt) => opt.value === paymentMethod,
  );

  const userOptions = [
    { label: "Empresa", value: 0 },
    ...companyUsers.map((u) => ({
      label: u.name ?? `Usuário ${u.id}`,
      value: u.id,
    })),
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsMouseDownInside(false);
    } else {
      setIsMouseDownInside(true);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDownInside && e.target === e.currentTarget) {
      onClose();
    }
    setIsMouseDownInside(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

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
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }

  async function updateDealShare(split: CommissionSplit) {
    if (!split.id) return;

    try {
      const res = await fetch(`${API}/deals-share/${split.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          received: split.received,
          isPaid: split.isPaid,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        throw new Error(data.error || "Erro ao atualizar comissão");
      }

      if (onUpdateDealShare) {
        const updatedDealShare = deal.DealShare?.map((existingShare) => {
          if (existingShare.id === split.id) {
            return {
              ...existingShare,
              received: split.received,
              isPaid: split.isPaid,
              userId: split.userId ?? undefined,
            };
          }
          return existingShare;
        });

        const updatedDeal = {
          ...deal,
          DealShare: updatedDealShare,
        };

        onUpdateDealShare(updatedDeal);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao atualizar comissão");
    }
  }

  function computedAmountFor(index: number): number {
    const s = splits[index];
    if (!s) return 0;

    if (splitMethod === "percentage") {
      const pct = s.percentage ?? 0;
      return (commissionAmount * pct) / 100;
    }

    return s.amount ?? 0;
  }

  function hasPendingCommissions() {
    return splits.some((s, i) => {
      const total =
        splitMethod === "percentage" ? computedAmountFor(i) : (s.amount ?? 0);

      return !s.isPaid || (s.received ?? 0) < total;
    });
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
          2,
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

  const fetchDocs = useCallback(async () => {
    setLoading(true);

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
      setLoading(false);
    }
  }, [token]);

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
          userId: s.isCompany ? null : (s.userId ?? null),
          isCompany: !!s.isCompany,
          percentage: pct,
          received: s.received ?? undefined,
          isPaid: isPaid,
          notes: s.notes ?? undefined,
        };
      } else {
        return {
          userId: s.isCompany ? null : (s.userId ?? null),
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
      financialInstitution,
      downPaymentValue,
      subsidyValue,
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

    if (step === "next" && isLastStep && hasPendingCommissions()) {
      setError(
        "Não é possível finalizar a negociação com comissões pendentes.",
      );
      return;
    }

    await handleSubmit();
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

  const calculateStepPosition = useCallback(() => {
    const steps = WORKFLOW_BY_METHOD[deal.paymentMethod];
    const currentIndex = steps.indexOf(deal.currentStep!);
    setIsFirstStep(currentIndex === 0);
    setIsLastStep(currentIndex === steps.length - 1);
  }, [deal.paymentMethod, deal.currentStep]);

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
  }, [isOpen, token, isLoading, API]);

  useEffect(() => {
    if (!isOpen) return;
    setCommissionAmount(Number(deal.commissionAmount ?? 0));

    if (deal.DealShare && deal.DealShare.length > 0) {
      const shares = deal.DealShare.map((ds) => ({
        id: ds.id,
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
  }, [isOpen, deal, installmentValue]);

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
  }, [API, isOpen, deal?.id, token, calculateStepPosition]);

  useEffect(() => {
    const total = docCost.reduce(
      (sum: number, item: DocumentationCost) => sum + Number(item.value ?? 0),
      0,
    );
    setDocCostTotal(total);
  }, [docCost]);

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
    <form
      className={styles.overlay}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onDragStart={handleDragStart}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
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
                <p>{DEAL_STEP_TYPE_LABEL[deal.currentStep as DealStepType]}</p>
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
                <span>
                  {`Fechada:
                      ${getDaysSinceLastContact(deal?.closedAt ?? "")}`}
                </span>
              </div>

              <div className={styles.btnPriorityAndDoc}>
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
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.paymentTitle}>
              <div className={styles.payment}>
                <p>Valor do imóvel</p>
                <CurrencyInput
                  className={`form-base ${styles.form}`}
                  placeholder="Valor do imóvel"
                  value={propertyValue}
                  onChange={setPropertyValue}
                />
              </div>
              <div className={styles.payment}>
                <p>Valor total da comissão</p>
                <CurrencyInput
                  className={`form-base ${styles.form}`}
                  placeholder="Valor da comissão"
                  value={commissionAmount}
                  onChange={setCommissionAmount}
                />
              </div>

              {paymentMethod === "FINANCING" && (
                <div className={styles.payment}>
                  <p>Instituição financeira</p>
                  <input
                    type="text"
                    className={`form-base ${styles.inputBank}`}
                    placeholder="Banco"
                    onChange={(e) => setFinancialInstitution(e.target.value)}
                    value={financialInstitution}
                  />
                </div>
              )}

              <div className={styles.payment}>
                <p>Método de pagamento</p>
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

            <div className={styles.paymentTitle}>
              <div className={styles.payment}>
                <p>Entrada</p>
                <CurrencyInput
                  className={`form-base ${styles.form}`}
                  placeholder="Valor de entrada"
                  value={downPaymentValue}
                  onChange={setDownPaymentValue}
                />
              </div>

              <div className={styles.payment}>
                <p>FGTS</p>
                <CurrencyInput
                  className={`form-base ${styles.form}`}
                  placeholder="FGTS"
                  value={fgtsValue}
                  onChange={setFgtsValue}
                />
              </div>

              {paymentMethod === "CASH" && (
                <div className={styles.payment}>
                  <p>Valor à vista</p>
                  <CurrencyInput
                    className={`form-base ${styles.form}`}
                    placeholder="Valor à vista"
                    value={cashValue}
                    onChange={setCashValue}
                  />
                </div>
              )}

              {paymentMethod === "FINANCING" && (
                <>
                  <div className={styles.payment}>
                    <p>Financiamento</p>
                    <CurrencyInput
                      className={`form-base ${styles.form}`}
                      placeholder="Valor de financiamento"
                      value={financingValue}
                      onChange={setFinancingValue}
                    />
                  </div>

                  <div className={styles.payment}>
                    <p>Subsídio</p>
                    <CurrencyInput
                      className={`form-base ${styles.form}`}
                      placeholder="Valor de subsídio"
                      value={subsidyValue}
                      onChange={setSubsidyValue}
                    />
                  </div>
                </>
              )}
              {paymentMethod === "CREDIT_LETTER" && (
                <div className={styles.payment}>
                  <p>Carta crédito</p>
                  <CurrencyInput
                    className={`form-base ${styles.form}`}
                    placeholder="Valor da carta de crédito"
                    value={creditLetterValue}
                    onChange={setCreditLetterValue}
                  />
                </div>
              )}
            </div>

            <div className={styles.nameBtnInstallment}>
              <button
                className={`${styles.btnInstallment} 
                  ${installment && styles.btnInstallmentActive}`}
                onClick={() => setInstallment((prev) => !prev)}
                type="button"
              >
                <div className={styles.nameBtnInstallment}>
                  {installment ? (
                    <p>Cancelar parcelamento</p>
                  ) : (
                    <p>Parcelar entrada</p>
                  )}
                  {installment ? <MdCheckBox /> : <MdCheckBoxOutlineBlank />}
                </div>
              </button>
            </div>

            {installment && (
              <>
                <div
                  className={`${styles.paymentTitle} ${styles.paymentTitleMobile}`}
                >
                  <div className={styles.payment}>
                    <p>Valor da parcela</p>
                    <CurrencyInput
                      className={`form-base ${styles.form}`}
                      placeholder="Parcelamento"
                      value={installmentValue}
                      onChange={setInstallmentValue}
                    />
                  </div>
                  <div className={styles.payment}>
                    <p>Quantidade de parcelas</p>
                    <input
                      type="text"
                      className={`form-base ${styles.form}`}
                      placeholder="Qtd de parcelas"
                      value={installmentCount}
                      onChange={(e) =>
                        setInstallmentCount(Number(e.target.value))
                      }
                    />
                  </div>
                  <div className={styles.payment}>
                    <p>Valor do reforço</p>
                    <CurrencyInput
                      className={`form-base ${styles.form}`}
                      placeholder="Reforço"
                      value={bonusInstallmentValue}
                      onChange={setBonusInstallmentValue}
                    />
                  </div>
                  <div className={styles.payment}>
                    <p>Quantidade de reforços</p>
                    <input
                      type="text"
                      className={`form-base ${styles.form}`}
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

            <div className={styles.boxCommissionShare}>
              <div className={styles.splitCommissionTitle}>
                <p>Divisão da comissão</p>

                <button
                  className={`btn-action ${styles.btnCommission} ${
                    splitMethod === "percentage" && styles.btnActive
                  }`}
                  type="button"
                  onClick={() => setSplitMethod("percentage")}
                >
                  %
                </button>

                <button
                  className={`btn-action ${styles.btnCommission} ${
                    splitMethod === "amount" && styles.btnActive
                  }`}
                  type="button"
                  onClick={() => setSplitMethod("amount")}
                >
                  R$
                </button>

                <button
                  className={styles.addSplit}
                  type="button"
                  onClick={addSplit}
                >
                  <MdOutlineAddCircle />
                </button>
              </div>

              {splits.map((s, i) => {
                const selectedOption = s.isCompany
                  ? userOptions.find((opt) => opt.value === 0) || null
                  : userOptions.find((opt) => opt.value === s.userId) || null;

                return (
                  <div key={i} className={styles.border}>
                    <div className={styles.boxSplitCommission}>
                      <CustomSelect
                        options={userOptions}
                        value={selectedOption}
                        isDisabled={s.isPaid}
                        onChange={(option) => {
                          if (!option) return;

                          const isCompany = option.value === 0;

                          updateSplit(i, {
                            isCompany,
                            userId: isCompany ? null : Number(option.value),
                          });
                        }}
                      />

                      <input
                        type="text"
                        className={`form-base ${styles.form}`}
                        placeholder="Observação"
                        value={s.notes ?? ""}
                        onChange={(e) =>
                          updateSplit(i, {
                            notes: e.target.value,
                          })
                        }
                      />
                      {s.isPaid && (
                        <>
                          <button
                            className={`btn-action glass ${styles.btnPaidActive}`}
                            type="button"
                            onClick={() => {
                              const total =
                                splitMethod === "percentage"
                                  ? computedAmountFor(i)
                                  : (splits[i].amount ?? 0);

                              const updated = {
                                ...splits[i],
                                received: 0,
                                isPaid: false,
                              };

                              updateSplit(i, updated);
                              updateDealShare(updated);
                            }}
                          >
                            <GiCheckMark /> Recebido
                          </button>

                          <button
                            className={`${styles.addSplit} ${styles.removeSplit}`}
                            type="button"
                            onClick={() => removeSplit(i)}
                          >
                            <IoRemoveCircle />
                          </button>
                        </>
                      )}
                    </div>

                    {!s.isPaid && (
                      <div className={styles.boxSplitCommission}>
                        {splitMethod === "percentage" ? (
                          <div className={styles.inputPercentage}>
                            <div className={styles.inputWrapper}>
                              <input
                                type="text"
                                className={`form-base ${styles.form}`}
                                style={{ width: 60 }}
                                disabled={s.isPaid}
                                value={s.percentage === 0 ? "" : s.percentage}
                                onChange={(e) => {
                                  let value = e.target.value.replace(",", ".");

                                  if (value === "") {
                                    updateSplit(i, { percentage: 0 });
                                    return;
                                  }

                                  const parsed = parseFloat(value);

                                  if (!isNaN(parsed)) {
                                    updateSplit(i, {
                                      percentage: Math.min(parsed, 100),
                                    });
                                  }
                                }}
                              />
                              <span className={styles.suffix}>%</span>
                            </div>
                            <span className={styles.totalPercentage}>
                              {" "}
                              ≈ <br />
                              R$ <br />
                              {computedAmountFor(i)}
                            </span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            className={`form-base ${styles.form}`}
                            style={{ width: 110 }}
                            disabled={s.isPaid}
                            value={real(Number(s.amount ?? 0))}
                            onChange={(e) => {
                              let numeric =
                                Number(e.target.value.replace(/\D/g, "")) / 100;

                              if (numeric >= 99999999.99) numeric = 99999999.99;

                              updateSplit(i, {
                                amount: numeric,
                              });
                            }}
                            placeholder="Valor"
                          />
                        )}

                        <div className={styles.paidValue}>
                          <p>Valor recebido:</p>
                          <CurrencyInput
                            className={`form-base ${styles.form}`}
                            placeholder="Pago"
                            value={Number(s.received ?? 0)}
                            onChange={(numeric) => {
                              const maxAllowed =
                                splitMethod === "percentage"
                                  ? computedAmountFor(i)
                                  : (s.amount ?? 0);

                              updateSplit(i, {
                                received: Math.min(numeric, maxAllowed),
                              });
                            }}
                          />
                        </div>

                        <button
                          className={`btn-action glass ${styles.btnPaid}`}
                          type="button"
                          onClick={() => {
                            const total =
                              splitMethod === "percentage"
                                ? computedAmountFor(i)
                                : (splits[i].amount ?? 0);

                            const updated = {
                              ...splits[i],
                              received: total,
                              isPaid: true,
                            };

                            updateSplit(i, updated);
                            updateDealShare(updated);
                          }}
                        >
                          Receber
                        </button>

                        <button
                          className={`${styles.addSplit} ${styles.removeSplit}`}
                          type="button"
                          onClick={() => removeSplit(i)}
                        >
                          <IoRemoveCircle />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className={styles.sum}>
                {splitMethod === "percentage" ? (
                  <span>Somatório: {totalPercentage.toFixed(2)}%</span>
                ) : (
                  <span>
                    Somatório: R$ {totalAmounts.toFixed(2)} / Comissão R${" "}
                    {commissionAmount.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.btnCancelAndConfirm}>
              {isFirstStep &&
                (deal.createdBy === userId
                  ? permissions.includes("DEAL_CLOSE_DELETE")
                  : permissions.includes("ALL_DEAL_CLOSE_DELETE")) && (
                  <button
                    className={`btn-action glass ${styles.btnDeal} ${styles.btnCancel}`}
                    type="button"
                    onClick={(e) => {
                      if (isFirstStep) {
                        setDeleteContext({
                          message: "Deseja cancelar a negociação com",
                          name: deal.client?.name ?? "",
                          onConfirm: () => handleChangeStep(e, "back"),
                        });
                      } else handleChangeStep(e, "back");
                    }}
                  >
                    <span>
                      {isFirstStep ? "Cancelar negociação" : "Voltar etapa"}
                    </span>
                  </button>
                )}

              <button
                className={`btn-action glass ${styles.btnDeal} ${styles.btnUpdate}`}
                type="button"
                onClick={(e) => handleSubmit(e)}
              >
                <span>Atualizar</span>
              </button>

              <button
                className={`btn-action glass ${styles.btnDeal} ${styles.btnNextStep}`}
                type="button"
                onClick={(e) => {
                  handleChangeStep(e, "next");
                }}
              >
                <span>
                  {isLastStep ? "Finalizar negociação" : "Próxima etapa"}
                </span>
              </button>
            </div>
          </div>

          <div className={`glass ${styles.modalRight}`}>
            <div className={styles.docCostSection}>
              <div className={styles.titleDocs}>
                <h5>Valor de documentação</h5>
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
                  onMouseLeave={() => setShowPopup(false)}
                  className={styles.btnDocValue2}
                >
                  <BsCashCoin className={styles.btnDocValue} />
                </div>
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
                        <CurrencyInput
                          className={`form-base ${styles.addNoteForm}`}
                          placeholder="Documentação"
                          value={docCostValue}
                          onChange={setDocCostValue}
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
    </form>
  );
}
