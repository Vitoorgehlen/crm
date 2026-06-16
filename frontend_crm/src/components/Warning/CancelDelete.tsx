"use client";

import { useState } from "react";
import { MdClose } from "react-icons/md";

import styles from "./WarningCard.module.css";
import Logo from "@/utils/Logo";

type WarningCardProps = {
  message: string;
  name: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

export default function CancelDelete({
  message,
  name,
  onClose,
  onConfirm,
}: WarningCardProps) {
  const [loading, setLoading] = useState<"confirm" | "cancel" | null>(null);
  const [error, setError] = useState("");

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
      <div className={`${styles.modal}`} onClick={(e) => e.stopPropagation()}>
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
            <p>
              {message} <span className={styles.name}>{name}</span>?
            </p>
          </div>

          <div className={styles.footerCard}>
            <button
              type="button"
              className={`btn-action glass ${styles.btnDeal} ${styles.btnDelete}`}
              onClick={onClose}
            >
              Não
            </button>

            <button
              type="button"
              className={`btn-action glass ${styles.btnDeal} ${styles.btnUpdate}`}
              onClick={() => {
                handleConfirm();
              }}
            >
              Sim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
