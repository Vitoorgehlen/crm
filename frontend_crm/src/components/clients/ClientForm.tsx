"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Client, ClientFormProps } from "@/types/index";
import { formatDateForCards } from "@/utils/dateUtils";
import { MdClose } from "react-icons/md";
import { IoStar, IoStarOutline } from "react-icons/io5";

import styles from "./ClientForm.module.css";
import DayPicker from "../Tools/DatePicker/DayPicker/DayPicker";
import { parseISO } from "date-fns";
import { format } from "date-fns";
import WarningClient from "../Warning/ClientWarning";
import CancelDelete from "../Warning/CancelDelete";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ClientsForm({
  mode,
  client = null,
  onClose,
  onSubmit,
  onDelete,
}: ClientFormProps) {
  const { token } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [isInvestor, setIsInvestor] = useState(false);
  const [isPriority, setIsPriority] = useState(false);

  const [dealsToDelete, setDealsToDelete] = useState<any[] | null>(null);
  const [isMouseDownInside, setIsMouseDownInside] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelDeleteModal, setShowCancelDeleteModal] = useState(false);
  const [loading, setLoading] = useState<"read" | "save" | "delete" | null>(
    null,
  );
  const [hovering, setHovering] = useState(false);
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
      if (mode === "create") {
        onClose();
      } else if (mode === "edit") {
        handleSubmit(e, onSubmit);
      }
    }
    setIsMouseDownInside(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  function clearForm() {
    setName("");
    setPhone("");
    setDateOfBirth(null);
    setIsInvestor(false);
    setIsPriority(false);
    setError("");
  }

  async function fetchDealByClient(client: Client) {
    setLoading("read");
    try {
      const res = await fetch(`${API}/deals-by-client/${client.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar clientes");
      return data;
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  const handleSubmit = async (
    e: React.FormEvent,
    submitFunction: (payload: Partial<Client>) => Promise<void> | void,
  ) => {
    e.preventDefault();
    if (loading !== null) return;
    setLoading("save");
    setError("");

    if (name.length <= 2) {
      setError("O nome do cliente precisa ter mais de 3 letras.");
      setLoading(null);
      return;
    }

    if (name.length >= 60) {
      setError("O nome do cliente é muito longo.");
      setLoading(null);
      return;
    }

    try {
      const payload: Partial<Client> = {
        name,
        dateOfBirth: dateOfBirth
          ? format(dateOfBirth, "yyyy-MM-dd")
          : undefined,
        isInvestor,
        isPriority,
      };

      if (phone.trim() !== "") payload.phone = phone;
      const maybePromise = submitFunction(payload);
      await Promise.resolve(maybePromise);

      if (mode === "create") clearForm();
      onClose();
    } catch (err) {
      console.log(err);
      setError(err instanceof Error ? err.message : "Erro ao enviar formuário");
    } finally {
      setLoading(null);
    }
  };

  const deleteClient = async () => {
    if (!client) return;

    if (loading) return;
    setLoading("delete");
    try {
      const res = await fetch(`${API}/clients/${client.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "Erro ao excluir client";
        setError(msg);
        return;
      }

      setError("");
      onDelete?.(client?.id || 0);
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao apagar cliente",
      );
    } finally {
      setLoading(null);
    }
  };

  const rejectedRequest = async () => {
    if (!client) return;

    if (loading) return;
    setLoading("delete");
    try {
      const res = await fetch(`${API}/clients/${client.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deleteRequest: false,
          deleteRequestBy: null,
          deleteRequestAt: null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "Erro ao cancelar exclusão";
        setError(msg);
        return;
      }

      setError("");
      onDelete?.(client?.id || 0);
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao apagar cliente",
      );
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    if (client) {
      setName(client.name || "");
      setPhone(client.phone || "");
      setDateOfBirth(client.dateOfBirth ? parseISO(client.dateOfBirth) : null);
      setIsInvestor(client.isInvestor || false);
      setIsPriority(client.isPriority || false);
    }
  }, [client]);

  return (
    <div
      className={styles.overlay}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onDragStart={handleDragStart}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.innerModal}>
          <div className={styles.titleForm}>
            <button
              type="button"
              className={styles.btnPriority}
              onClick={() => setIsPriority(!isPriority)}
            >
              {isPriority ? (
                <IoStar className={styles.btnPriorityActive} />
              ) : (
                <IoStarOutline />
              )}
            </button>
            {mode === "create" ? (
              <h4 className={styles.name}>Adicionar cliente</h4>
            ) : (
              <div className={styles.titleName}>
                <span>Editar: </span>
                <h4 className={styles.name}>{client?.name}</h4>
              </div>
            )}
            <button type="button" onClick={onClose} className={styles.closeBtn}>
              <MdClose />
            </button>
          </div>

          {error && <p className="error">{error}</p>}
          <div className={styles.line}>
            <input
              type="text"
              className={`form-base ${styles.form}`}
              placeholder="Nome"
              onChange={(e) => setName(e.target.value)}
              value={name}
              required
            />

            <input
              type="tel"
              className={`form-base ${styles.form}`}
              placeholder="Contato (opcional)"
              value={phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const input = e.target;
                let value = input.value.replace(/\D/g, "");

                if (value.length > 11) value = value.slice(0, 11);

                const nativeEvent = e.nativeEvent as InputEvent;
                const isDeleting =
                  nativeEvent.inputType === "deleteContentBackward";

                if (!isDeleting) {
                  if (value.length > 6) {
                    value = value.replace(
                      /^(\d{2})(\d)(\d{4})(\d{0,4}).*/,
                      "($1) $2 $3-$4",
                    );
                  } else if (value.length > 2) {
                    value = value.replace(
                      /^(\d{2})(\d{0,1})(\d{0,4}).*/,
                      "($1) $2 $3",
                    );
                  } else if (value.length > 0) {
                    value = value.replace(/^(\d{0,2}).*/, "($1");
                  }
                }

                setPhone(value);
              }}
            />
          </div>
          <div className={styles.line}>
            <DayPicker
              value={dateOfBirth}
              onChange={(date) => setDateOfBirth(date)}
              placeholder="Data de nascimento (opcional)"
            />

            <label>
              <button
                className={`form-base ${styles.form} ${styles.btnIvestor} 
                ${isInvestor && styles.btnInvestorActive}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsInvestor((prev) => !prev);
                }}
              >
                <p>Investidor: </p>

                {isInvestor ? <p>Sim</p> : <p>Não</p>}
              </button>
              <input
                type="checkbox"
                className={styles.investorInput}
                checked={isInvestor}
                onChange={(e) => setIsInvestor(e.target.checked)}
              />
            </label>
          </div>

          {mode === "create" ? (
            <div className={styles.btnDelAndUp}>
              <button
                className={`btn-action glass ${styles.btnDeal} ${styles.btnUpdate}`}
                type="button"
                onClick={(e) => handleSubmit(e, onSubmit)}
              >
                {loading === "save" ? <span>Enviando...</span> : "Enviar"}
              </button>
            </div>
          ) : (
            <div className={styles.btnDelAndUp}>
              {client && client.deleteRequest ? (
                <button
                  className={`btn-action glass ${styles.btnDeal} ${styles.deleteRequest}`}
                  type="button"
                  onMouseEnter={() => setHovering(true)}
                  onMouseLeave={() => setHovering(false)}
                  onClick={async () => {
                    if (!client) return;

                    const deals = await fetchDealByClient(client);

                    setDealsToDelete(deals);
                    setShowCancelDeleteModal(true);
                  }}
                >
                  {loading === "delete" ? (
                    <span>Cancelando...</span>
                  ) : hovering ? (
                    <span>Cancelar solicitação</span>
                  ) : (
                    <span>Solicitação enviada</span>
                  )}
                </button>
              ) : (
                <button
                  className={`btn-action glass ${styles.btnDeal} ${styles.btnDelete}`}
                  type="button"
                  onClick={async () => {
                    if (!client) return;

                    const deals = await fetchDealByClient(client);

                    setDealsToDelete(deals);
                    setShowDeleteModal(true);
                  }}
                >
                  {loading === "delete" ? <span>Apagando...</span> : "Apagar"}
                </button>
              )}
              <button
                className={`btn-action glass ${styles.btnDeal} ${styles.btnUpdate}`}
                type="button"
                onClick={(e) => handleSubmit(e, onSubmit)}
              >
                {loading === "save" ? <span>Atualizando...</span> : "Atualizar"}
              </button>
            </div>
          )}
        </div>

        {mode === "edit" && (
          <div className={styles.footerCard}>
            <span>
              Atualizado a última vez por: {client?.updater?.name ?? "—"}.{" "}
              {formatDateForCards(client?.updatedAt)}
            </span>
            <span>
              Criado por: {client?.creator?.name ?? "—"}.{" "}
              {formatDateForCards(client?.createdAt)}
            </span>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <WarningClient
          message={`Tem certeza que deseja excluir`}
          name={`${client?.name}`}
          deals={!dealsToDelete ? [] : dealsToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setDealsToDelete(null);
          }}
          onConfirm={async () => {
            await deleteClient();
            setShowDeleteModal(false);
            setDealsToDelete(null);
          }}
        />
      )}

      {showCancelDeleteModal && (
        <CancelDelete
          message={`Cancelar exclusão de`}
          name={`${client?.name}`}
          onClose={() => {
            setShowCancelDeleteModal(false);
            setDealsToDelete(null);
          }}
          onConfirm={async () => {
            await rejectedRequest();
            setShowCancelDeleteModal(false);
            setDealsToDelete(null);
          }}
        />
      )}
    </div>
  );
}
