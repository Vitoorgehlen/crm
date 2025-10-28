"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Client, ClientFormProps } from "@/types/index";
import { formatDateForCards } from "@/utils/dateUtils";
import { MdClose } from "react-icons/md";
import { IoStar, IoStarOutline } from "react-icons/io5";
import { MdRadioButtonChecked, MdRadioButtonUnchecked } from "react-icons/md";

import styles from "./ClientForm.module.css";

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
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isInvestor, setIsInvestor] = useState(false);
  const [isPriority, setIsPriority] = useState(false);
  const [loading, setLoading] = useState<"read" | "save" | "delete" | null>(
    null
  );
  const [error, setError] = useState("");

  function clearForm() {
    setName("");
    setPhone("");
    setDateOfBirth("");
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
    submitFunction: (payload: Partial<Client>) => Promise<void> | void
  ) => {
    e.preventDefault();
    if (loading !== null) return;
    setLoading("save");
    setError("");

    try {
      const payload: Partial<Client> = {
        name,
        dateOfBirth: dateOfBirth
          ? new Date(dateOfBirth).toISOString()
          : undefined,
        isInvestor,
        isPriority,
      };

      if (phone.trim() !== "") payload.phone = phone;
      if (dateOfBirth.trim() !== "") payload.dateOfBirth = dateOfBirth;

      const maybePromise = submitFunction(payload);
      await Promise.resolve(maybePromise);

      if (mode === "create") clearForm();
      onClose();
    } catch (err) {
      console.log(err);
      setError("Erro ao enviar formuário");
    } finally {
      setLoading(null);
    }
  };

  const deleteClient = async () => {
    if (!client) return;
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir ${client.name}?`
    );
    if (!confirmDelete) return;
    const deals = await fetchDealByClient(client);
    if (deals.length > 0) {
      const confirm2Delete = window.confirm(
        `O ${client.name} possui ${deals.length} negociação que vai ser apagado juntos com ele.`
      );
      if (!confirm2Delete) return;
    }

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
      setError("Erro inesperado ao apagar o usuário");
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    if (client) {
      setName(client.name || "");
      setPhone(client.phone || "");
      setDateOfBirth(client.dateOfBirth || "");
      setIsInvestor(client.isInvestor || false);
      setIsPriority(client.isPriority || false);
    }
  }, [client]);

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (mode === "edit") {
          if (e.target === e.currentTarget) handleSubmit(e, onSubmit);
        } else if (mode === "create") {
          onClose();
        }
      }}
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
              <h2>Adicionar novo cliente</h2>
            ) : (
              <h2>Editar: {client?.name}</h2>
            )}
            <button type="button" onClick={onClose} className={styles.closeBtn}>
              <MdClose />
            </button>
          </div>

          {error && <p className={styles.erro}>{error}</p>}

          <input
            type="text"
            placeholder="Nome"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
          />

          <input
            type="tel"
            placeholder="Contato (opcional)"
            onChange={(e) => setPhone(e.target.value)}
            value={phone}
          />

          <input
            type="date"
            placeholder="Data de nascimento (opcional)"
            onChange={(e) => setDateOfBirth(e.target.value)}
            value={dateOfBirth}
          />

          <label>
            <h3>Investidor{isInvestor ? ": Sim" : "?"}</h3>
            <button
              className={styles.investorBtn}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsInvestor((prev) => !prev);
              }}
            >
              {isInvestor ? (
                <MdRadioButtonChecked className={styles.investorBtnCheck} />
              ) : (
                <MdRadioButtonUnchecked className={styles.investorBtnUnC} />
              )}
            </button>
            <input
              type="checkbox"
              className={styles.investorInput}
              checked={isInvestor}
              onChange={(e) => setIsInvestor(e.target.checked)}
            />
          </label>
          {mode === "create" ? (
            <button
              className={styles.btnAddClient}
              type="button"
              onClick={(e) => handleSubmit(e, onSubmit)}
            >
              {loading === "save" ? "Enviando..." : "Enviar"}
            </button>
          ) : (
            <div className={styles.btnDelAndUp}>
              {client && client.deleteRequest ? (
                <div className={styles.delClient}>Solicitação enviada</div>
              ) : (
                <button
                  className={styles.btnDelClient}
                  type="button"
                  onClick={() => deleteClient()}
                >
                  {loading === "delete" ? "Apagando..." : "Apagar"}
                </button>
              )}
              <button
                className={styles.btnAddClient}
                type="button"
                onClick={(e) => handleSubmit(e, onSubmit)}
              >
                {loading === "save" ? "Atualizando..." : "Atualizar"}
              </button>
            </div>
          )}
        </div>
        {mode === "edit" && (
          <div className={styles.footerCard}>
            <h6>
              Atualizado a última vez por: {client?.updater?.name ?? "—"}.{" "}
              {formatDateForCards(client?.updatedAt)}
            </h6>
            <h6>
              Criado por: {client?.creator?.name ?? "—"}.{" "}
              {formatDateForCards(client?.createdAt)}
            </h6>
          </div>
        )}
      </div>
    </div>
  );
}
