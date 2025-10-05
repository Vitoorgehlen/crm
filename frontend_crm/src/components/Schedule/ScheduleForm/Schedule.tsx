"use client";

import React, { useEffect, useState } from "react";
import {
  CreateSchedulePayload,
  Deal,
  DealStatus,
  Schedule,
  ScheduleFormProps,
} from "@/types";
import { IoTrashOutline } from "react-icons/io5";
import styles from "./Schedule.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { MdCheckBoxOutlineBlank, MdCheckBox } from "react-icons/md";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ScheduleForm({
  isOpen,
  day,
  schedule,
  onClose,
  onDelete,
}: ScheduleFormProps) {
  const router = useRouter();
  const { token, isLoading } = useAuth();

  const [deals, setDeals] = useState<Deal[]>([]);

  const [dealId, setDealId] = useState<number | undefined>(undefined);
  const [newLabel, setNewLabel] = useState("");
  const [newFinish, setNewFinish] = useState(false);
  const [newDate, setNewDate] = useState<Date | undefined>(
    schedule?.reminderAt ? new Date(schedule.reminderAt) : undefined
  );

  const [error, setError] = useState("");

  function formatDateForInput(date: Date | undefined): string {
    if (!date) return "";
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) {
      setError('O campo "label" é obrigatório.');
      return;
    }
    setError("");

    try {
      const payload: CreateSchedulePayload = {
        dealId: dealId ? dealId : undefined,
        label: newLabel,
        finish: newFinish,
        reminderAt: newDate ? newDate.toISOString() : undefined,
      };

      if (schedule) {
        await handleEdit(payload);
      } else {
        await handleCreate(payload);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro inesperado");
      }
    }
  }

  async function handleCreate(payload: CreateSchedulePayload) {
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro inesperado ao criar o compromisso");
      }
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro inesperado ao editar o compromisso");
      }
    }
  }

  const handleDelete = async (schedule: Schedule) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o compromisso?`
    );
    if (!confirmDelete) return;

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
      if (onDelete && schedule.id) {
        onDelete(schedule.id);
      } else {
        onClose();
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao apagar o compromisso");
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (schedule) {
        // Converte MouseEvent para FormEvent para o handleSubmit
        const formEvent = e as unknown as React.FormEvent;
        handleSubmit(formEvent);
      } else {
        onClose();
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    async function fetchDeals() {
      try {
        const res = await fetch(`${API}/deals`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erro ao buscar clientes");
        const data = await res.json();
        if (!mounted) return;
        setDeals(data);
      } catch (err) {
        console.log(err);
        setError("Erro ao carregar lista de clientes");
      }
    }

    fetchDeals();
    return () => {
      mounted = false;
    };
  }, [isLoading, token, router]);

  useEffect(() => {
    if (isOpen) {
      if (schedule) {
        setDealId(schedule.dealId || undefined);
        setNewLabel(schedule.label || "");
        setNewFinish(schedule.finish || false);
        setNewDate(
          schedule.reminderAt ? new Date(schedule.reminderAt) : undefined
        );
      } else {
        setDealId(undefined);
        setNewLabel("");
        setNewFinish(false);
        setNewDate(day ? new Date(day) : undefined);
      }
      setError("");
    }
  }, [schedule, day, isOpen]);

  if (!isOpen) return null;

  return (
    <form
      className={styles.overlay}
      onClick={handleOverlayClick}
      onSubmit={handleSubmit}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.innerModal}>
          <div className={styles.modalLeft}>
            <div className={styles.titleCard}>
              <div>
                {!schedule ? (
                  <h2>Adicionar compromisso</h2>
                ) : (
                  <>
                    <h4>Editar compromisso</h4>
                    <h2>com: {schedule.client?.name ?? ""}</h2>
                  </>
                )}
              </div>
              {schedule && (
                <button
                  className={styles.closeBtn}
                  type="button"
                  onClick={() => handleDelete(schedule)}
                >
                  <IoTrashOutline />
                </button>
              )}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <select
              onChange={(e) => setDealId(Number(e.target.value))}
              value={dealId || ""}
            >
              <option value="">Selecione um cliente</option>
              {deals
                .slice()
                .reverse()
                .map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.client?.name || "Cliente não encontrado"} -{" "}
                    {DealStatus[deal.status].label || ""}
                  </option>
                ))}
            </select>
            <input
              type="datetime-local"
              onChange={(e) => setNewDate(new Date(e.target.value))}
              value={formatDateForInput(newDate)}
            />

            <h3>Compromisso</h3>
            <input
              type="text"
              placeholder="O que o cliente busca em um imóvel?"
              onChange={(e) => setNewLabel(e.target.value)}
              value={newLabel}
            />
            <div className={styles.btns}>
              {schedule && (
                <button
                  type="button"
                  className={`${styles.btnFilter} ${
                    newFinish ? styles.btnFilterActive : ""
                  }`}
                  onClick={() => setNewFinish((prev) => !prev)}
                >
                  {newFinish ? <MdCheckBox /> : <MdCheckBoxOutlineBlank />}
                  {newFinish ? "Reativar" : "Finalizar"}
                </button>
              )}
              <button type="submit" className={styles.btnSave}>
                {schedule ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
