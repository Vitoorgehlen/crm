"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MdClose } from "react-icons/md";
import styles from "./CloseDealForm.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateForCards } from "@/utils/dateUtils";
import {
  PaymentMethod,
  Deal,
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

export default function CloseDealForm({
  isOpen,
  deal,
  onClose,
  onSubmit,
  initialPaymentMethod,
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
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
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
        safeNumber(cashValue) +
        safeNumber(fgtsValue) +
        safeNumber(installmentValue) * installmentCount +
        safeNumber(bonusInstallmentValue) * bonusInstallmentCount;
      return total;
    } else if (paymentMethod === "FINANCING") {
      total =
        safeNumber(cashValue) +
        safeNumber(fgtsValue) +
        safeNumber(financingValue) +
        safeNumber(installmentValue) * installmentCount +
        safeNumber(bonusInstallmentValue) * bonusInstallmentCount;
      return total;
    } else if (paymentMethod === "CREDIT_LETTER") {
      total =
        safeNumber(cashValue) +
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
    ? `Sobrando${diffFormatted}`
    : isNegative
    ? `Faltando${diffFormatted}`
    : `${diffFormatted}`;
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
      if (splitMethod === "percentage") {
        const pct = s.percentage ?? 0;
        return {
          userId: s.isCompany ? null : s.userId ?? null,
          isCompany: !!s.isCompany,
          percentage: pct,
          notes: s.notes ?? undefined,
          isPaid: s.isPaid ?? false,
        };
      } else {
        return {
          userId: s.isCompany ? null : s.userId ?? null,
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
      cashValue: cashValue ?? null,
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
        : deal.paymentMethod ?? "FINANCING"
    );
    setPropertyValue(Number(initialPropertyValue ?? deal.propertyValue ?? 0));
    setCommissionAmount(
      Number(initialCommissionAmount ?? deal.commissionAmount ?? 0)
    );
    setCashValue(Number(initialCashValue ?? deal.cashValue ?? 0));
    setFgtsValue(Number(initialFgtsValue ?? deal.fgtsValue ?? 0));
    setFinancingValue(
      Number(initialFinancingValue ?? deal.financingValue ?? 0)
    );
    setCreditLetterValue(
      Number(initialCreditLetterValue ?? deal.creditLetterValue ?? 0)
    );
    setInstallmentValue(
      Number(initialInstallmentValue ?? deal.installmentValue ?? 0)
    );
    setInstallmentCount(
      Number(initialInstallmentCount ?? deal.installmentCount ?? 1)
    );
    setBonusInstallmentValue(
      Number(initialBonusInstallmentValue ?? deal.bonusInstallmentValue ?? 0)
    );
    setBonusInstallmentCount(
      Number(initialBonusInstallmentCount ?? deal.bonusInstallmentCount ?? 1)
    );

    setError(null);
  }, [isOpen, deal]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>
          <h4>Fechar com:</h4>
          <h2>{deal?.client?.name ?? ""}</h2>
        </div>

        <h2
          className={`${styles.balance} ${
            isPositive
              ? styles.positive
              : isNegative
              ? styles.negative
              : styles.ok
          }`}
        >
          {balanceText}
        </h2>

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
          <h3>Valor do imóvel</h3>
          <h3>Valor total da comissão</h3>
          <h3>Método de pagamento</h3>
        </div>
        <div className={styles.payment}>
          <input
            type="text"
            value={propertyValue.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
            onChange={(e) => {
              const numeric = Number(e.target.value.replace(/\D/g, "")) / 100;
              setPropertyValue(numeric);
            }}
            placeholder="Valor do imóvel"
          />
          <input
            type="text"
            value={commissionAmount.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
            onChange={(e) => {
              const numeric = Number(e.target.value.replace(/\D/g, "")) / 100;
              setCommissionAmount(numeric);
            }}
            placeholder="Valor da comissão"
          />

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            required
          >
            {Object.entries(PaymentMethod).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

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
                  {installment ? <MdCheckBox /> : <MdCheckBoxOutlineBlank />}
                </div>
              </button>
            </div>
            {installment && (
              <>
                <div className={styles.paymentTitle}>
                  <h3>Valor da parcela</h3>
                  <h3>Qtd. Parcelas</h3>
                  <h3>Valor do reforço</h3>
                  <h3>Qtd. Reforços</h3>
                </div>
                <div className={styles.payment}>
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
                  <input
                    type="text"
                    placeholder="Qtd de parcelas"
                    value={installmentCount}
                    onChange={(e) =>
                      setInstallmentCount(Number(e.target.value))
                    }
                  />
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
                  <input
                    type="text"
                    placeholder="Qtd de reforços"
                    value={bonusInstallmentCount}
                    onChange={(e) =>
                      setBonusInstallmentCount(Number(e.target.value))
                    }
                  />
                </div>
              </>
            )}
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
                  {installment ? <MdCheckBox /> : <MdCheckBoxOutlineBlank />}
                </div>
              </button>
            </div>
            {installment && (
              <>
                <div className={styles.paymentTitle}>
                  <h3>Valor da parcela</h3>
                  <h3>Qtd. Parcelas</h3>
                  <h3>Valor do reforço</h3>
                  <h3>Qtd. Reforços</h3>
                </div>
                <div className={styles.payment}>
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
                  <input
                    type="text"
                    placeholder="Qtd de parcelas"
                    value={installmentCount}
                    onChange={(e) =>
                      setInstallmentCount(Number(e.target.value))
                    }
                  />
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
                  <input
                    type="text"
                    placeholder="Qtd de reforços"
                    value={bonusInstallmentCount}
                    onChange={(e) =>
                      setBonusInstallmentCount(Number(e.target.value))
                    }
                  />
                </div>
              </>
            )}
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
                  {installment ? <MdCheckBox /> : <MdCheckBoxOutlineBlank />}
                </div>
              </button>
            </div>

            {installment && (
              <>
                <div className={styles.paymentTitle}>
                  <h3>Valor da parcela</h3>
                  <h3>Qtd. Parcelas</h3>
                  <h3>Valor do reforço</h3>
                  <h3>Qtd. Reforços</h3>
                </div>
                <div className={styles.payment}>
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
                  <input
                    type="text"
                    placeholder="Qtd de parcelas"
                    value={installmentCount}
                    onChange={(e) =>
                      setInstallmentCount(Number(e.target.value))
                    }
                  />
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
                  <input
                    type="text"
                    placeholder="Qtd de reforços"
                    value={bonusInstallmentCount}
                    onChange={(e) =>
                      setBonusInstallmentCount(Number(e.target.value))
                    }
                  />
                </div>
              </>
            )}
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
                <select
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

                {splitMethod === "percentage" ? (
                  <>
                    <input
                      type="type"
                      style={{ width: 90 }}
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
                      ≈ R$ {computedAmountFor(i)}
                    </h3>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      style={{ width: 120 }}
                      value={real(Number(s.amount ?? 0))}
                      onChange={(e) => {
                        const numeric =
                          Number(e.target.value.replace(/\D/g, "")) / 100;
                        updateSplit(i, {
                          amount: numeric,
                        });
                      }}
                      placeholder="Valor"
                    />
                  </>
                )}

                <input
                  className={styles.textObs}
                  type="text"
                  placeholder="Observação"
                  value={s.notes ?? ""}
                  onChange={(e) =>
                    updateSplit(i, {
                      notes: e.target.value,
                    })
                  }
                />

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

          <div style={{ marginTop: 8 }}>
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

        <div className={styles.btnCancelAndConfirm}>
          <button
            className={styles.btnCancel}
            type="button"
            onClick={() => {
              onClose();
            }}
          >
            Cancelar
          </button>

          <button
            className={styles.btnConfirm}
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading}
          >
            {loading ? "Enviando..." : "Fechar negociação"}
          </button>
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
