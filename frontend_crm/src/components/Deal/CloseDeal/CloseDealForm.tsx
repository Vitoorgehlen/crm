"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MdClose } from "react-icons/md";
import styles from "./CloseDealForm.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateForCards } from "@/utils/dateUtils";
import {
  PaymentMethod,
  CloseDealPayload,
  CommissionSplit,
  CloseDealFormProps,
} from "@/types";
import { IoRemoveCircle } from "react-icons/io5";
import {
  MdOutlineAddCircle,
  MdCheckBoxOutlineBlank,
  MdCheckBox,
} from "react-icons/md";
import CustomSelect from "@/components/Tools/Select/CustomSelect";
import CurrencyInput from "@/components/Tools/InputValue/CurrencyInput";

export default function CloseDealForm({
  isOpen,
  deal,
  onClose,
  onSubmit,
  initialPaymentMethod,
  initialFinancialInstitution,
  initialDownPaymentValue,
  initialSubsidyValue,
  initialCashValue,
  initialFgtsValue,
  initialFinancingValue,
  initialCreditLetterValue,
  initialInstallmentValue,
  initialInstallmentCount,
  initialBonusInstallmentValue,
  initialBonusInstallmentCount,
  initialPropertyValue,
  initialCommissionAmount,
}: CloseDealFormProps) {
  const { token, isLoading } = useAuth();
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
  const [cashValue, setCashValue] = useState<number>(
    Number(deal.cashValue ?? 0),
  );
  const [subsidyValue, setSubsidyValue] = useState<number>(
    Number(deal.subsidyValue ?? 0),
  );
  const [downPaymentValue, setDownPaymentValue] = useState<number>(
    Number(deal.downPaymentValue ?? 0),
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
  const [splitMethod, setSplitMethod] = useState<"percentage" | "amount">(
    "percentage",
  );
  const [splits, setSplits] = useState<CommissionSplit[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isMouseDownInside, setIsMouseDownInside] = useState(false);

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
    { value: 0, label: "Empresa" },
    ...companyUsers.map((u) => ({
      value: u.id,
      label: u.name ?? `Usuário ${u.id}`,
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
        notes: "",
        isPaid: false,
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

  function computedAmountFor(index: number) {
    const s = splits[index];
    if (!s) return 0;
    if (splitMethod === "percentage") {
      const pct = s.percentage ?? 0;
      const valueNumber = (commissionAmount * pct) / 100;
      const valueString = valueNumber?.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return valueString;
    }
    return +(s.amount ?? 0);
  }

  function safeNumber(v: number | undefined | null): number {
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  }

  function real(v: number | undefined | null): string {
    if (typeof v !== "number" || !Number.isFinite(v)) return "R$ 0,00";
    return v.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function totalReceived() {
    let total = 0;
    if (paymentMethod === "CASH") {
      total =
        safeNumber(downPaymentValue) +
        safeNumber(cashValue) +
        safeNumber(fgtsValue) +
        safeNumber(installmentValue) * installmentCount +
        safeNumber(bonusInstallmentValue) * bonusInstallmentCount;
      return total;
    } else if (paymentMethod === "FINANCING") {
      total =
        safeNumber(downPaymentValue) +
        safeNumber(subsidyValue) +
        safeNumber(fgtsValue) +
        safeNumber(financingValue) +
        safeNumber(installmentValue) * installmentCount +
        safeNumber(bonusInstallmentValue) * bonusInstallmentCount;
      return total;
    } else if (paymentMethod === "CREDIT_LETTER") {
      total =
        safeNumber(downPaymentValue) +
        safeNumber(fgtsValue) +
        safeNumber(creditLetterValue) +
        safeNumber(installmentValue) * installmentCount +
        safeNumber(bonusInstallmentValue) * bonusInstallmentCount;
      return total;
    }
    return total;
  }

  let diff = totalReceived();
  if (typeof propertyValue === "number" && propertyValue > 0) {
    diff -= safeNumber(propertyValue);
  }

  const isPositive = diff > 0;
  const isNegative = diff < 0;
  const diffFormatted = Math.abs(diff).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const balanceText = isPositive
    ? `Sobrando ${diffFormatted}`
    : isNegative
      ? `Faltando ${diffFormatted}`
      : safeNumber(propertyValue) === 0
        ? "Ajuste os valores"
        : "Valores conferem";
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

  function buildPayload(): CloseDealPayload {
    const normalizedSplits = splits.map((s) => {
      if (splitMethod === "percentage") {
        const pct = s.percentage ?? 0;
        return {
          userId: s.isCompany ? null : (s.userId ?? null),
          isCompany: !!s.isCompany,
          percentage: pct,
          notes: s.notes ?? undefined,
          isPaid: s.isPaid ?? false,
        };
      } else {
        return {
          userId: s.isCompany ? null : (s.userId ?? null),
          isCompany: !!s.isCompany,
          percentage: undefined,
          amount: +(s.amount ?? 0),
          notes: s.notes ?? undefined,
          isPaid: s.isPaid ?? false,
        };
      }
    });

    return {
      paymentMethod,
      financialInstitution,
      cashValue: cashValue ?? null,
      downPaymentValue: downPaymentValue ?? null,
      subsidyValue: subsidyValue ?? null,
      fgtsValue: fgtsValue ?? null,
      financingValue: financingValue ?? null,
      creditLetterValue: creditLetterValue ?? null,
      installmentValue: installmentValue ?? null,
      installmentCount: installmentCount ?? null,
      bonusInstallmentValue: bonusInstallmentValue ?? null,
      bonusInstallmentCount: bonusInstallmentCount ?? null,
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
      setError(err?.message ?? "Erro ao fechar negociação.");
    } finally {
      setLoading(false);
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
  }, [isOpen, token, isLoading, API]);

  useEffect(() => {
    if (!isOpen) return;
    const initial: CommissionSplit[] = [];

    if (deal.createdBy) {
      initial.push({
        userId: Number(deal.createdBy),
        isCompany: false,
        percentage: 0,
        amount: 0,
        notes: "",
        isPaid: false,
      });
    }

    initial.push({
      userId: null,
      isCompany: true,
      percentage: 0,
      amount: 0,
      notes: "",
      isPaid: false,
    });

    setSplits(initial);
    setPaymentMethod(
      typeof initialPaymentMethod !== "undefined"
        ? initialPaymentMethod
        : (deal.paymentMethod ?? "FINANCING"),
    );
    setPropertyValue(Number(initialPropertyValue ?? deal.propertyValue ?? 0));
    setCommissionAmount(
      Number(initialCommissionAmount ?? deal.commissionAmount ?? 0),
    );
    setFinancialInstitution(
      initialFinancialInstitution ?? deal.financialInstitution ?? "",
    );
    setDownPaymentValue(
      Number(initialDownPaymentValue ?? deal.downPaymentValue ?? 0),
    );
    setSubsidyValue(Number(initialSubsidyValue ?? deal.subsidyValue ?? 0));
    setFgtsValue(Number(initialFgtsValue ?? deal.fgtsValue ?? 0));
    setFinancingValue(
      Number(initialFinancingValue ?? deal.financingValue ?? 0),
    );
    setCreditLetterValue(
      Number(initialCreditLetterValue ?? deal.creditLetterValue ?? 0),
    );
    setInstallmentValue(
      Number(initialInstallmentValue ?? deal.installmentValue ?? 0),
    );
    setInstallmentCount(
      Number(initialInstallmentCount ?? deal.installmentCount ?? 0),
    );
    setBonusInstallmentValue(
      Number(initialBonusInstallmentValue ?? deal.bonusInstallmentValue ?? 0),
    );
    setBonusInstallmentCount(
      Number(initialBonusInstallmentCount ?? deal.bonusInstallmentCount ?? 0),
    );

    setError(null);
  }, [
    isOpen,
    deal,
    initialBonusInstallmentCount,
    initialBonusInstallmentValue,
    initialFinancialInstitution,
    initialDownPaymentValue,
    initialSubsidyValue,
    initialCashValue,
    initialCommissionAmount,
    initialCreditLetterValue,
    initialFgtsValue,
    initialFinancingValue,
    initialInstallmentCount,
    initialInstallmentValue,
    initialPaymentMethod,
    initialPropertyValue,
  ]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onDragStart={handleDragStart}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>
          <p>Fechar com:</p>
          <h4>{deal?.client?.name ?? ""}</h4>

          <button
            className={styles.closeBtn}
            type="button"
            onClick={() => {
              onClose();
            }}
          >
            <MdClose />
          </button>
        </div>

        <div className={styles.titleCash}>
          <h5
            className={`${
              isPositive
                ? styles.positive
                : isNegative
                  ? styles.negative
                  : styles.ok
            }`}
          >
            {balanceText}
          </h5>
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
              placeholder="Valor de comissão"
              value={commissionAmount}
              onChange={setCommissionAmount}
            />
          </div>
          {paymentMethod === "FINANCING" && (
            <div className={styles.payment}>
              <p>Instituição</p>
              <p>financeira</p>
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
              placeholder="Entrada"
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
              <p>À vista</p>
              <CurrencyInput
                className={`form-base ${styles.form}`}
                placeholder="Valor à vista"
                value={cashValue}
                onChange={setCashValue}
              />
            </div>
          )}

          {paymentMethod === "FINANCING" && (
            <div className={styles.payment}>
              <p>Financiado</p>
              <CurrencyInput
                className={`form-base ${styles.form}`}
                placeholder="Valor de financiamento"
                value={financingValue}
                onChange={setFinancingValue}
              />
            </div>
          )}

          {paymentMethod === "FINANCING" && (
            <div className={styles.payment}>
              <p>Subsídio</p>
              <CurrencyInput
                className={`form-base ${styles.form}`}
                placeholder="Valor de financiamento"
                value={subsidyValue}
                onChange={setSubsidyValue}
              />
            </div>
          )}

          {paymentMethod === "CREDIT_LETTER" && (
            <div className={styles.payment}>
              <p>Carta de crédito</p>
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
                  onChange={(e) => setInstallmentCount(Number(e.target.value))}
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
              className={`btn-action
                ${styles.btnCommission} 
                ${splitMethod === "percentage" && styles.btnActive}`}
              type="button"
              onClick={() => setSplitMethod("percentage")}
            >
              %
            </button>
            <button
              className={`btn-action
                ${styles.btnCommission} 
                ${splitMethod === "amount" && styles.btnActive}`}
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
                    onChange={(option) => {
                      if (!option) return;

                      const isCompany = option.value === null;

                      updateSplit(i, {
                        isCompany,
                        userId: isCompany ? null : Number(option.value),
                      });
                    }}
                  />

                  {splitMethod === "percentage" ? (
                    <>
                      <input
                        type="type"
                        className={`form-base ${styles.form}`}
                        style={{ width: 90 }}
                        value={s.percentage === 0 ? "" : s.percentage}
                        onChange={(e) => {
                          let value = e.target.value;
                          value = value.replace(",", ".");

                          if (value === "") {
                            updateSplit(i, { percentage: 0 });
                            return;
                          }

                          const parsed = parseFloat(value);

                          if (!isNaN(parsed)) {
                            updateSplit(i, {
                              percentage: Math.min(parseFloat(value), 100),
                            });
                          }
                        }}
                      />
                      <span> ≈ R$ {computedAmountFor(i)}</span>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        className={`form-base ${styles.form}`}
                        style={{ width: 120 }}
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
                    </>
                  )}

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

                  <button
                    className={`${styles.addSplit} ${styles.removeSplit}`}
                    type="button"
                    onClick={() => removeSplit(i)}
                  >
                    <IoRemoveCircle />
                  </button>
                </div>
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
          <button
            className={`btn-action glass ${styles.btnDeal} ${styles.btnCancel}`}
            type="button"
            onClick={() => onClose()}
          >
            Cancelar
          </button>

          <button
            className={`btn-action glass ${styles.btnDeal} ${styles.btnConfirm}`}
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading}
          >
            {loading ? <span>Confirmando...</span> : "Confirmar"}
          </button>
        </div>

        <div className={styles.footerCard}>
          <span>
            Atualizado a última vez por: {deal?.updater?.name ?? "—"} ·{" "}
            {deal?.updatedAt ? formatDateForCards(deal.updatedAt) : "—"}
          </span>
          <span>
            {" "}
            Criado por: {deal?.creator?.name ?? "—"} ·{" "}
            {deal?.createdAt ? formatDateForCards(deal.createdAt) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
