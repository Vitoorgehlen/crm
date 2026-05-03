"use client";

import React, { useEffect, useState } from "react";
import {
  CreateSchedulePayload,
  Deal,
  DealStatus,
  DeleteContext,
  Schedule,
  ScheduleFormProps,
} from "@/types";
import { MdClose } from "react-icons/md";
import styles from "./Schedule.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { MdCheckBoxOutlineBlank, MdCheckBox } from "react-icons/md";
import WarningDeal from "@/components/Warning/DefaultWarning";
import DayAndHourPicker from "@/components/Tools/DatePicker/DayPicker/DayAndHourPicker";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ScheduleForm({
  isOpen,
  day,
  schedule,
  onClose,
  onDelete,
  onCreate,
  onUpdate,
}: ScheduleFormProps) {
  const router = useRouter();
  const { token, isLoading } = useAuth();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [searchClient, setSearchClient] = useState("");

  const [dealId, setDealId] = useState<number | undefined>(undefined);
  const [newLabel, setNewLabel] = useState("");
  const [newFinish, setNewFinish] = useState(false);
  const [newDate, setNewDate] = useState<Date | null>(
    schedule?.reminderAt ? new Date(schedule.reminderAt) : null,
  );

  const [deleteContext, setDeleteContext] = useState<DeleteContext>(null);

  const [isMouseDownInside, setIsMouseDownInside] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsMouseDownInside(false);
    } else {
      setIsMouseDownInside(true);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDownInside && e.target === e.currentTarget) {
      if (schedule) {
        const formEvent = e as unknown as React.FormEvent;
        handleSubmit(formEvent);
      } else onClose();
    }
    setIsMouseDownInside(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

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

      if (onCreate) onCreate(data);
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

      if (onUpdate) onUpdate(data);
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
      if (onDelete && schedule.id) {
        onDelete(schedule.id);
      } else {
        onClose();
      }
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
        setDeals(data.data);
      } catch (err) {
        console.log(err);
        setError(
          err instanceof Error
            ? err.message
            : "Erro inesperado ao carregar lista de clientes",
        );
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
        setNewDate(schedule.reminderAt ? new Date(schedule.reminderAt) : null);
      } else {
        setDealId(undefined);
        setNewLabel("");
        setNewFinish(false);
        setNewDate(day ? new Date(day) : null);
      }
      setError("");
    }
  }, [schedule, day, isOpen]);

  useEffect(() => {
    if (dealId) {
      const selected = deals.find((d) => d.id === dealId);
      if (selected && selected.client?.name !== searchClient) {
        setSearchClient(selected.client?.name || "");
      }
    }
  }, [dealId, deals, searchClient]);

  if (!isOpen) return null;

  return (
    <form
      className={styles.overlay}
      onSubmit={handleSubmit}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onDragStart={handleDragStart}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.titleCard}>
          {!schedule && (
            <button className={styles.closeBtnInvisible} type="button">
              <MdClose />
            </button>
          )}
          {!schedule ? (
            <h5>Adicionar compromisso</h5>
          ) : (
            <div>
              <p>Editar compromisso</p>
              <h5>com: {schedule.deal?.client.name ?? ""}</h5>
            </div>
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
          <input
            list="deals"
            className={`form-base ${styles.changeClient}`}
            placeholder="Buscar cliente"
            value={searchClient}
            onChange={(e) => {
              const value = e.target.value;
              setSearchClient(value);

              const foundClient = deals.find(
                (deal) =>
                  deal.client?.name.toLowerCase().trim() ===
                  value.toLowerCase().trim(),
              );

              setDealId(foundClient ? foundClient.id : undefined);
            }}
          />

          <datalist id="deals">
            {deals
              .slice()
              .reverse()
              .map((deal) => (
                <option
                  key={deal.id}
                  value={deal.client?.name || "Cliente não encontrado"}
                >
                  {DealStatus[deal.status].label || ""}
                </option>
              ))}
          </datalist>

          <DayAndHourPicker
            value={newDate}
            onChange={(date) => setNewDate(date)}
          />
        </div>

        <p>Compromisso</p>
        <textarea
          className={`form-base ${styles.inputSchedule}`}
          placeholder="Qual compromisso vamos agendar?"
          onChange={(e) => setNewLabel(e.target.value)}
          value={newLabel}
        />

        <div className={styles.btns}>
          {schedule ? (
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
              Apagar
            </button>
          ) : (
            <div></div>
          )}
          <button
            type="submit"
            className={`btn-action glass ${styles.btnDeal} ${styles.btnUpdate}`}
          >
            {schedule ? "Salvar" : "Criar"}
          </button>
          {schedule ? (
            <button
              type="button"
              className={`btn-action glass ${styles.btnDeal} ${styles.btnFinish} ${styles.btnFinish} ${newFinish && styles.finish}`}
              onClick={() => setNewFinish((prev) => !prev)}
            >
              {newFinish ? (
                <MdCheckBox className={styles.active} />
              ) : (
                <MdCheckBoxOutlineBlank />
              )}
              {newFinish ? "Reativar" : "Finalizar"}
            </button>
          ) : (
            <div></div>
          )}
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
    </form>
  );
}
