"use client";

import { useState } from "react";
import { MdClose } from "react-icons/md";

import styles from "./WarningCard.module.css";
import { Deal } from "@/types";
import Logo from "@/utils/Logo";

type WarningCardProps = {
  message: string;
  name: string;
  deals?: Deal[];
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

export default function WarningClient({
  message,
  name,
  deals = [],
  onClose,
  onConfirm,
}: WarningCardProps) {
  const [loading, setLoading] = useState<"confirm" | "cancel" | null>(null);
  const [confirmStep, setConfirmStep] = useState(false);
  const [error, setError] = useState("");

  const hasClosedDeal = deals?.some(
    (deal) => deal.status === "FINISHED" || deal.status === "CLOSED",
  );

  const handleConfirm = async () => {
    if (loading) return;

    try {
      setLoading("confirm");
      await Promise.resolve(onConfirm());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={styles.overlay}>
      <div
        className={`${styles.modal} ${confirmStep && styles.modalConfirm}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.innerModal}>
          <div className={styles.titleForm}>
            <button
              type="button"
              onClick={onClose}
              className={styles.closeBtnInvisible}
            >
              <MdClose />
            </button>

            <div className={styles.boxLogoName}>
              <Logo className={styles.logoName} />
              <h1 className={styles.nameLogo}>cloop</h1>
            </div>

            <button type="button" onClick={onClose} className={styles.closeBtn}>
              <MdClose />
            </button>
          </div>

          {error && <p className="error">{error}</p>}
          <div className={styles.line}>
            {hasClosedDeal && (
              <p>
                <span className={styles.name}>
                  Você não pode excluir clientes com negociações fechadas
                </span>
                ?
              </p>
            )}

            {!hasClosedDeal && confirmStep && (
              <>
                <p className={styles.text}>
                  <span className={styles.name}>{name}</span> possui{" "}
                  <span className={styles.name}>{deals.length}</span>{" "}
                  {deals.length > 1 ? "negociações" : "negociação"}!
                </p>
                <p className={styles.text}>
                  Ao excluir o cliente, todas as negociações dele serão
                  excluídas também.
                </p>
              </>
            )}

            {!hasClosedDeal && !confirmStep && (
              <p>
                {message} <span className={styles.name}>{name}</span>?
              </p>
            )}
          </div>

          <div className={styles.footerCard}>
            <button
              type="button"
              className={`btn-action glass ${styles.btnDeal} ${styles.btnUpdate}`}
              onClick={onClose}
            >
              {hasClosedDeal ? (
                "Ok"
              ) : loading === "cancel" ? (
                <span>Cancelando...</span>
              ) : (
                "Cancelar"
              )}
            </button>

            {!hasClosedDeal && (
              <button
                type="button"
                className={`btn-action glass ${styles.btnDeal} ${styles.btnDelete}`}
                onClick={() => {
                  if (deals.length > 0 && !confirmStep) setConfirmStep(true);
                  else handleConfirm();
                }}
              >
                {loading === "confirm" ? <span>Apagando</span> : "Apagar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
