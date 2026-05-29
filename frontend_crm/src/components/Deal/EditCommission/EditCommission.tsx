"use client";

import { CommissionSplit } from "@/types";
import { MdClose, MdOutlineAddCircle, MdCheckBox } from "react-icons/md";
import { IoRemoveCircle } from "react-icons/io5";
import { GiCheckMark } from "react-icons/gi";

import styles from "./EditCommission.module.css";

import CustomSelect from "@/components/Tools/Select/CustomSelect";
import CurrencyInput from "@/components/Tools/InputValue/CurrencyInput";

interface EditCommissionProps {
  splits: CommissionSplit[];

  splitMethod: "percentage" | "amount";
  setSplitMethod: React.Dispatch<React.SetStateAction<"percentage" | "amount">>;

  commissionAmount: number;

  splitPlan?: boolean;

  userOptions: {
    label: string;
    value: number;
  }[];

  onAddSplit: () => void;
  onRemoveSplit: (index: number) => void;
  onUpdateSplit: (index: number, patch: Partial<CommissionSplit>) => void;

  computedAmountFor: (index: number) => number;

  totalPercentage: number;
  totalAmounts: number;

  onUpdateDealShare: (split: CommissionSplit) => Promise<void>;

  onClose: () => void;
}

export default function EditCommission({
  splits,
  splitMethod,
  setSplitMethod,
  commissionAmount,
  splitPlan,
  userOptions,
  onAddSplit,
  onRemoveSplit,
  onUpdateSplit,
  computedAmountFor,
  totalPercentage,
  totalAmounts,
  onUpdateDealShare,
  onClose,
}: EditCommissionProps) {
  function real(v: number | undefined | null): string {
    if (typeof v !== "number" || !Number.isFinite(v)) {
      return "R$ 0,00";
    }

    return v.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{splitPlan ? "Editar comissões" : "Comissão"}</h3>

          <button className={styles.closeBtn} type="button" onClick={onClose}>
            <MdClose />
          </button>
        </div>

        <div className={styles.actions}>
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
            onClick={onAddSplit}
          >
            <MdOutlineAddCircle />
          </button>
        </div>

        <div className={styles.content}>
          {splits.map((s, i) => {
            const selectedOption = s.isCompany
              ? userOptions.find((opt) => opt.value === 0) || null
              : userOptions.find((opt) => opt.value === s.userId) || null;

            return (
              <div key={i} className={styles.card}>
                <div className={styles.topRow}>
                  <CustomSelect
                    options={userOptions}
                    value={selectedOption}
                    isDisabled={s.isPaid}
                    onChange={(option) => {
                      if (!option) return;

                      const isCompany = option.value === 0;

                      onUpdateSplit(i, {
                        isCompany,
                        userId: isCompany ? null : Number(option.value),
                      });
                    }}
                  />

                  <button
                    className={styles.removeSplit}
                    type="button"
                    onClick={() => onRemoveSplit(i)}
                  >
                    <IoRemoveCircle />
                  </button>
                </div>

                <input
                  type="text"
                  className={`form-base ${styles.form}`}
                  placeholder="Observação"
                  value={s.notes ?? ""}
                  onChange={(e) =>
                    onUpdateSplit(i, {
                      notes: e.target.value,
                    })
                  }
                />

                <div className={styles.valuesRow}>
                  {splitMethod === "percentage" ? (
                    <div className={styles.inputPercentage}>
                      <div className={styles.inputWrapper}>
                        <input
                          type="text"
                          className={`form-base ${styles.form}`}
                          value={s.percentage === 0 ? "" : s.percentage}
                          onChange={(e) => {
                            let value = e.target.value.replace(",", ".");

                            if (value === "") {
                              onUpdateSplit(i, {
                                percentage: 0,
                              });

                              return;
                            }

                            const parsed = parseFloat(value);

                            if (!isNaN(parsed)) {
                              onUpdateSplit(i, {
                                percentage: Math.min(parsed, 100),
                              });
                            }
                          }}
                        />

                        <span className={styles.suffix}>%</span>
                      </div>

                      <span className={styles.preview}>
                        ≈ {real(computedAmountFor(i))}
                      </span>
                    </div>
                  ) : (
                    <CurrencyInput
                      className={`form-base ${styles.form}`}
                      placeholder="Valor"
                      value={Number(s.amount ?? 0)}
                      onChange={(numeric) =>
                        onUpdateSplit(i, {
                          amount: numeric,
                        })
                      }
                    />
                  )}

                  <CurrencyInput
                    className={`form-base ${styles.form}`}
                    placeholder="Recebido"
                    value={Number(s.received ?? 0)}
                    onChange={(numeric) => {
                      const maxAllowed =
                        splitMethod === "percentage"
                          ? computedAmountFor(i)
                          : (s.amount ?? 0);

                      onUpdateSplit(i, {
                        received: Math.min(numeric, maxAllowed),
                      });
                    }}
                  />
                </div>

                <button
                  className={`btn-action glass ${
                    s.isPaid ? styles.btnPaidActive : styles.btnPaid
                  }`}
                  type="button"
                  onClick={() => {
                    const total =
                      splitMethod === "percentage"
                        ? computedAmountFor(i)
                        : (splits[i].amount ?? 0);

                    const updated = {
                      ...splits[i],
                      received: s.isPaid ? 0 : total,
                      isPaid: !s.isPaid,
                    };

                    onUpdateSplit(i, updated);
                    onUpdateDealShare(updated);
                  }}
                >
                  <GiCheckMark />

                  {s.isPaid ? "Recebido" : "Receber"}
                </button>
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          {splitMethod === "percentage" ? (
            <span>Somatório: {totalPercentage.toFixed(2)}%</span>
          ) : (
            <span>
              Somatório: {real(totalAmounts)} / Comissão{" "}
              {real(commissionAmount)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
