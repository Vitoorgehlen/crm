"use client";

import React, { useState } from "react";
import { CreateSchedulePayload, Deal, DeleteContext, Schedule } from "@/types";
import { MdClose } from "react-icons/md";
import styles from "./Callback.module.css";
import { useAuth } from "@/contexts/AuthContext";
import WarningDeal from "@/components/Warning/DefaultWarning";
import DayAndHourPicker from "@/components/Tools/DatePicker/DayPicker/DayAndHourPicker";

const API = process.env.NEXT_PUBLIC_API_URL;

type callbackProps = {
  isOpen: boolean;
  schedule: Schedule | null;
  deal: Deal;
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
};

export default function Callback({
  schedule,
  deal,
  onClose,
  onSuccess,
}: callbackProps) {
  const { token } = useAuth();

  const [newDate, setNewDate] = useState<Date | null>(
    schedule?.reminderAt ? new Date(schedule?.reminderAt) : null,
  );

  const [deleteContext, setDeleteContext] = useState<DeleteContext>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!newDate) return;
    setError("");

    try {
      const payload: CreateSchedulePayload = {
        dealId: deal.id,
        label: `Chamar dia ${newDate.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        finish: false,
        type: "callback",
        reminderAt: newDate ? newDate.toISOString() : undefined,
      };

      if (schedule) await handleEdit(payload);
      else await handleCreate(payload);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    }
  }

  async function handleCreate(payload: CreateSchedulePayload) {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch(`${API}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Erro ao salvar a agenda");

      if (onSuccess) await onSuccess();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao criar compromisso",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(payload: CreateSchedulePayload) {
    if (!schedule?.id) throw new Error("ID do compromisso não encontrado");

    try {
      const response = await fetch(`${API}/schedule/${schedule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Erro ao editar a agenda");

      if (onSuccess) await onSuccess();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao editar compromisso",
      );
    }
  }

  const handleDelete = async (schedule: Schedule) => {
    try {
      const res = await fetch(`${API}/schedule/${schedule.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "Erro ao excluir negociação";
        setError(msg);
        return;
      }

      setError("");
      if (onSuccess) await onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao apagar compromisso",
      );
    }
  };

  return (
    <div className={styles.overlay} onSubmit={handleSubmit}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.titleCard}>
          <button className={styles.closeBtnInvisible} type="button">
            <MdClose />
          </button>

          {newDate ? (
            <div className={styles.title}>
              <h5>Retorno agendado</h5>
              <p>
                {deal.client?.name} •{" "}
                {newDate.toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ) : (
            <h5>Quando deseja retornar para {deal.client?.name}?</h5>
          )}

          <button
            className={styles.closeBtn}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <MdClose />
          </button>
        </div>

        {error && <p className="error">{error}</p>}
        <div className={styles.line}>
          {schedule && (
            <button
              type="button"
              className={`btn-action glass ${styles.btnDeal} ${styles.btnDelete}`}
              onClick={() =>
                setDeleteContext({
                  message: "Deseja cancelar esse compromisso",
                  name: schedule.label ?? "",
                  onConfirm: () => handleDelete(schedule),
                })
              }
            >
              Desmarcar
            </button>
          )}

          <div className={styles.dayPicker}>
            <DayAndHourPicker
              value={newDate}
              onChange={(date) => setNewDate(date)}
            />
          </div>

          <button
            type="button"
            className={`btn-action glass ${styles.btnDeal} ${styles.btnUpdate}`}
            onClick={handleSubmit}
          >
            {schedule ? "Remarcar" : "Marcar"}
          </button>
        </div>
      </div>

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
