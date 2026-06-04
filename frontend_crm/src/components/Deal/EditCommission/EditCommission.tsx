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
  totalPercentage: number;
  totalAmounts: number;
  splitPlan?: boolean;
  userOptions: {
    label: string;
    value: number;
  }[];

  onAddSplit: () => void;
  setCommissionAmount: (value: number) => void;
  onRemoveSplit: (index: number) => void;
  onUpdateSplit: (index: number, patch: Partial<CommissionSplit>) => void;
  computedAmountFor: (index: number) => number;
  onUpdateDealShare: (split: CommissionSplit) => Promise<void>;
  onSubmit: () => Promise<void>;
  onClose: () => void;
}

export default function EditCommission({
  splits,
  splitMethod,
  setSplitMethod,
  commissionAmount,
  setCommissionAmount,
  splitPlan,
  userOptions,
  onAddSplit,
  onRemoveSplit,
  onUpdateSplit,
  computedAmountFor,
  totalPercentage,
  totalAmounts,
  onUpdateDealShare,
  onSubmit,
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
          <button className={styles.closeBtnInvisible}>
            <MdClose />
          </button>
          <h4>{splitPlan ? "Editar comissões" : "Comissão"}</h4>

          <button className={styles.closeBtn} type="button" onClick={onClose}>
            <MdClose />
          </button>
        </div>

        <div className={styles.payment}>
          <h4>Valor total da comissão</h4>
          <CurrencyInput
            className={`form-base ${styles.form} ${styles.formCash}`}
            placeholder="Valor da comissão"
            value={commissionAmount}
            onChange={setCommissionAmount}
          />
        </div>

        <div className={styles.actions}>
          <div className={styles.btnsActions}>
            <p>Dividir a comissão por:</p>
            <button
              className={`btn-action ${styles.btnCommission} ${
                splitMethod === "percentage" && styles.btnActive
              }`}
              type="button"
              onClick={() => {
                if (splitMethod === "amount") {
                  const totalAmount = splits.reduce(
                    (sum, s) => sum + (s.amount ?? 0),
                    0,
                  );
                  if (totalAmount > 0) {
                    splits.forEach((s, i) => {
                      const percentage = Number(
                        ((s.amount ?? 0) / totalAmount) * 100,
                      );
                      onUpdateSplit(i, { percentage });
                    });
                  }
                }
                setSplitMethod("percentage");
              }}
            >
              %
            </button>

            <button
              className={`btn-action ${styles.btnCommission} ${
                splitMethod === "amount" && styles.btnActive
              }`}
              type="button"
              onClick={() => {
                if (splitMethod === "percentage") {
                  splits.forEach((s, i) => {
                    const amount = Number(
                      ((commissionAmount * (s.percentage ?? 0)) / 100).toFixed(
                        2,
                      ),
                    );
                    onUpdateSplit(i, { amount });
                  });
                }
                setSplitMethod("amount");
              }}
            >
              R$
            </button>
          </div>

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
                <div className={styles.line}>
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
                    <div className={styles.underline}>
                      <p>Total:</p>
                      <CurrencyInput
                        className={`form-base ${styles.form} ${styles.formCash}`}
                        placeholder="Valor"
                        value={Number(s.amount ?? 0)}
                        onChange={(numeric) =>
                          onUpdateSplit(i, {
                            amount: numeric,
                          })
                        }
                      />
                    </div>
                  )}
                  <div className={styles.underline}>
                    <p>Recebido:</p>
                    <CurrencyInput
                      className={`form-base ${styles.form} ${styles.formCash}`}
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
                    className={styles.removeSplit}
                    type="button"
                    onClick={() => onRemoveSplit(i)}
                  >
                    <IoRemoveCircle />
                  </button>
                </div>

                <div className={styles.line}>
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

          <button
            className={`btn-action glass ${styles.btnDeal} ${styles.btnUpdate}`}
            type="button"
            onClick={async () => {
              await onSubmit();
              onClose();
            }}
          >
            <span>Atualizar</span>
          </button>

          {splitMethod === "percentage" ? (
            <span className={styles.closeBtnInvisible}>
              Somatório: {totalPercentage.toFixed(2)}%
            </span>
          ) : (
            <span className={styles.closeBtnInvisible}>
              Somatório: {real(totalAmounts)} / Comissão{" "}
              {real(commissionAmount)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
