"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

import { FaSearch } from "react-icons/fa";

import styles from "./page.module.css";
import { User, Client, Deal, DealStatus } from "@/types";
import { formatDateForFinish } from "@/utils/dateUtils";
import { useQueryState } from "nuqs";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Config() {
  const router = useRouter();
  const { token, permissions, isLoading } = useAuth();

  const [startDate, setStartDate] = useState("");
  const [startMonth, setStartMonth] = useQueryState("month", {
    defaultValue: "",
  });
  const [endDate, setEndDate] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useQueryState("user", {
    defaultValue: "ALL",
  });
  const [searchUser, setSearchUser] = useQueryState("search", {
    defaultValue: "",
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

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
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Desempenho da Equipe</h1>
        </div>

        <div className={styles.headerContent}>
          <div className={styles.headerBtns}>
            <select
              value={selectedUser ?? "ALL"}
              onChange={(e) => {
                setSelectedUser(e.target.value);
              }}
            >
              <option value="ALL">Todos</option>
              {users
                .slice()
                .reverse()
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || "Usuário não encontrado"}
                  </option>
                ))}
            </select>

            <input
              type="month"
              value={startMonth ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setStartMonth(value);

                const [year, month] = value.split("-");
                const firstDay = new Date(Number(year), Number(month) - 1, 1);
                const lastDay = new Date(Number(year), Number(month), 0);

                setStartDate(firstDay.toISOString());
                setEndDate(lastDay.toISOString());
              }}
            />

            <button
              className={styles.btnSetting}
              onClick={() => {
                fetchClientsAndDeals();
              }}
            >
              <FaSearch />
              <h3>Buscar</h3>
            </button>
          </div>
        </div>
        <div className={styles.list}>
          {deals.length === 0 ? (
            <p>Nenhum cliente encontrado</p>
          ) : (
            <table className={styles.dealsTable}>
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
              <h2>Clientes criados sem negociação</h2>
              <table className={styles.dealsTable}>
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
    </div>
  );
}
