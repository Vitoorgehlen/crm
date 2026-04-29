"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

import { FaSearch, FaTimes } from "react-icons/fa";

import styles from "./page.module.css";
import { User, Client, Deal, DealStatus } from "@/types";
import { formatDateForFinish } from "@/utils/dateUtils";
import { useQueryState } from "nuqs";
import UserSelect from "@/components/Tools/Select/UserSelect";
import MonthPicker from "@/components/Tools/DatePicker/MonthPicker/MonthPicker";
import Tooltip from "@/components/Tools/Tooltip/Tooltip";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Config() {
  const router = useRouter();
  const { token, permissions, isLoading } = useAuth();

  const [hasSearched, setHasSearched] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [startMonth, setStartMonth] = useQueryState("month", {
    defaultValue: "",
  });
  const [endDate, setEndDate] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useQueryState("user", {
    defaultValue: "ALL",
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  const selectedUserObject =
    users.find((u) => String(u.id) === selectedUser) || null;

  const startMonthDate = startMonth ? new Date(startMonth + "-01") : null;

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar Usuários");
      setUsers(data);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [token]);

  const fetchClientsAndDeals = useCallback(async () => {
    if (startDate === "" || endDate === "") {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString());
      setEndDate(lastDay.toISOString());
    }

    if (selectedUser === "INVALID") return alert("Usuário inválido!");

    try {
      const params = new URLSearchParams();
      params.append("startDate", startDate);
      params.append("endDate", endDate);
      if (selectedUser && selectedUser !== "ALL") {
        params.append("selectedUser", selectedUser);
      }
      const res = await fetch(`${API}/team-performace?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      console.log("API retorno:", data);
      if (!res.ok) throw new Error(data.error || "Erro ao buscar a performace");
      const { dealsAndClients, clientsWithoutDeals } = data;
      setDeals(dealsAndClients);
      setClients(clientsWithoutDeals);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [token, startDate, endDate, selectedUser]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    fetchUsers();
  }, [isLoading, token, router, fetchUsers, permissions]);

  useEffect(() => {
    if (!startMonth) return;

    const [year, month] = startMonth.split("-");
    const firstDay = new Date(Number(year), Number(month) - 1, 1);
    const lastDay = new Date(Number(year), Number(month), 0);

    setStartDate(firstDay.toISOString());
    setEndDate(lastDay.toISOString());
  }, [startMonth]);

  return (
    <main className={styles.main}>
      <div className={styles.headerContent}>
        <div className={styles.title}>
          <h3>Desempenho</h3>
          <h5>da Equipe</h5>
        </div>
        <div className={styles.headerIcons}>
          {!hasSearched && (
            <>
              <UserSelect
                users={users}
                value={selectedUserObject}
                onChange={(user) => {
                  setSelectedUser(user?.id?.toString() || "ALL");
                }}
              />
              <MonthPicker
                value={startMonthDate}
                onChange={(date) => {
                  if (!date) {
                    setStartMonth("");
                    return;
                  }

                  const formatted = `${date.getFullYear()}-${String(
                    date.getMonth() + 1,
                  ).padStart(2, "0")}`;

                  setStartMonth(formatted);

                  const firstDay = new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    1,
                  );
                  const lastDay = new Date(
                    date.getFullYear(),
                    date.getMonth() + 1,
                    0,
                  );

                  setStartDate(firstDay.toISOString());
                  setEndDate(lastDay.toISOString());
                }}
              />
            </>
          )}

          {!hasSearched ? (
            startMonth && (
              <Tooltip label={"Pesquisar"}>
                <button
                  className={`glass btn-action ${styles.search}`}
                  onClick={() => {
                    fetchClientsAndDeals();
                    setHasSearched(true);
                  }}
                >
                  <FaSearch />
                </button>
              </Tooltip>
            )
          ) : (
            <Tooltip label={"Limpar"}>
              <button
                className={`glass btn-action ${styles.search}`}
                onClick={() => {
                  setStartMonth("");
                  setDeals([]);
                  setClients([]);
                  setHasSearched(false);
                }}
              >
                <FaTimes />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
      <div className={deals.length === 0 ? styles.listEmpty : styles.list}>
        {deals.length === 0 ? (
          <p>Selecione um mês e pesquise o desempenho da equipe.</p>
        ) : (
          <table className={`glass ${styles.dealsTable}`}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Valor total</th>
                <th>Status</th>
                <th>Criado em</th>
                <th>Criado por</th>
              </tr>
            </thead>
            <tbody>
              {deals
                .slice()
                .reverse()
                .map((d) => {
                  const totalValue =
                    d.paymentMethod === "CASH"
                      ? Number(d.cashValue ?? 0) +
                        Number(d.fgtsValue ?? 0) +
                        Number(d.downPaymentValue ?? 0)
                      : d.paymentMethod === "FINANCING"
                        ? Number(d.financingValue ?? 0) +
                          Number(d.subsidyValue ?? 0) +
                          Number(d.fgtsValue ?? 0) +
                          Number(d.downPaymentValue ?? 0)
                        : d.paymentMethod === "CREDIT_LETTER"
                          ? Number(d.creditLetterValue ?? 0) +
                            Number(d.subsidyValue ?? 0) +
                            Number(d.fgtsValue ?? 0) +
                            Number(d.downPaymentValue ?? 0)
                          : 0;

                  return (
                    <tr key={d.id}>
                      <td>{d.client?.name || "Não encontrado"}</td>
                      <td>
                        {totalValue.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td>
                        {DealStatus[d.status as keyof typeof DealStatus]
                          ?.label || "Não encontrado"}
                      </td>
                      <td>
                        {d.createdAt
                          ? formatDateForFinish(d.createdAt)
                          : "Não encontrado"}
                      </td>
                      <td>{d.creator?.name || "Não encontrado"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.list}>
        {clients.length > 0 && (
          <>
            <h4>Clientes criados sem negociação</h4>
            <table className={`glass ${styles.dealsTable}`}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Investidor</th>
                  <th>Criado em</th>
                  <th>Criado por</th>
                </tr>
              </thead>
              <tbody>
                {clients
                  .slice()
                  .reverse()
                  .map((c) => (
                    <tr key={c.id}>
                      <td>{c.name || "Não encontrado"}</td>
                      <td>{c.isInvestor ? "Sim" : "Não"}</td>
                      <td>
                        {c.createdAt
                          ? formatDateForFinish(c.createdAt)
                          : "Não encontrado"}
                      </td>
                      <td>{c.creator?.name || "Não encontrado"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </main>
  );
}
