"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

import { FaUserEdit, FaSearch } from "react-icons/fa";

import styles from "./page.module.css";
import {
  User,
  Client,
  Deal,
  ClientStatus,
  PaymentMethod,
  DealStatus,
} from "@/types";
import { formatDateForFinish } from "@/utils/dateUtils";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Config() {
  const router = useRouter();
  const { token, permissions, isLoading, logout } = useAuth();
  const [isConfigUser, setIsConfigUser] = useState(true);
  const [isConfigTeam, setIsConfigTeam] = useState(false);
  const [isOpenPermissions, setIsOpenPermissions] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [endDate, setEndDate] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | "ALL" | "INVALID">(
    "ALL"
  );
  const [searchUser, setSearchUser] = useState("");

  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar Usuários");
      setUsers(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleSearch = (foundUser: User | undefined) => {
    if (foundUser) {
      setSelectedUser(foundUser.id);
    } else if (searchUser === "") {
      setSelectedUser("ALL");
    } else {
      setSelectedUser("INVALID");
    }
  };

  const fetchClientsAndDeals = useCallback(async () => {
    setLoading(true);

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
      if (selectedUser) params.append("selectedUser", selectedUser.toString());

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
    } finally {
      setLoading(false);
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

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Desempenho da Equipe</h1>
        </div>

        <div className={styles.headerContent}>
          <div className={styles.headerBtns}>
            <input
              list="users"
              placeholder="Buscar usuário..."
              value={searchUser}
              onChange={(e) => {
                const value = e.target.value;
                setSearchUser(value);
                const foundUser = users.find((user) => user.name === value);
                handleSearch(foundUser);

                if (value === "" || value.toLowerCase() === "todos")
                  setSelectedUser("ALL");
              }}
            />

            <datalist id="users">
              <option value="Todos" />
              {users
                .slice()
                .reverse()
                .map((user) => (
                  <option
                    key={user.id}
                    value={user.name || "Usuário não encontrado"}
                  />
                ))}
            </datalist>
            <input
              type="month"
              value={startMonth}
              onChange={(e) => {
                const [year, month] = e.target.value.split("-");
                const firstDay = new Date(Number(year), Number(month) - 1, 1);
                const lastDay = new Date(Number(year), Number(month), 0);
                setStartDate(firstDay.toISOString());
                setEndDate(lastDay.toISOString());
                setStartMonth(e.target.value);
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
          {typeof selectedUser === "number" && (
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
        <div className={styles.list}>
          {deals.length === 0 ? (
            <p>Nenhum cliente encontrado</p>
          ) : (
            <table className={styles.dealsTable}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Forma de pagamento</th>
                  <th>Valor total</th>
                  <th>Status do Cliente</th>
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
                          {PaymentMethod[
                            d.paymentMethod as keyof typeof PaymentMethod
                          ]?.label || "Não encontrado"}
                        </td>
                        <td>
                          {totalValue.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </td>
                        <td>
                          {d.status === "OLD_CLIENTS" || d.status === "FINISHED"
                            ? "Vendido"
                            : ClientStatus[
                                d.statusClient as keyof typeof ClientStatus
                              ]?.label || "Não encontrado"}
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
