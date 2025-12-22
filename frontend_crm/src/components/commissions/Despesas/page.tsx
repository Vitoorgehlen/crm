"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";
import { Expense, ExpensePayload, ExpenseProps } from "@/types/index";
import { RiPencilFill, RiEraserFill } from "react-icons/ri";
import { FaTimes, FaCheck } from "react-icons/fa";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ExpenseCard({ selectedYearStats }: ExpenseProps) {
  const router = useRouter();
  const { token, isLoading } = useAuth();

  const [isOpenEdit, setIsOpenEdit] = useState<number | null>(null);
  const [firstExpense, setFirstExpense] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectYear, setSelectYear] = useState(
    new Date().getFullYear().toString()
  );

  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);

  const [newExpense, setNewExpense] = useState("");
  const [newExpenseValue, setNewExpenseValue] = useState<number | null>(null);
  const [newDueDate, setNewDueDate] = useState("");
  const [recurrenceType, setRecurrenceType] = useState("MONTHLY");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()} - ${now.getMonth()}`;
  });

  function resetExpense() {
    setNewExpense("");
    setNewExpenseValue(null);
    setNewDueDate("");
    setRecurrenceType("MONTHLY");
  }

  function rangeOfExpenses() {
    const start = new Date(firstExpense);
    const end = new Date();

    let startYear = start.getFullYear();
    let startMonth = start.getMonth();

    const endYear = end.getFullYear();
    const endMonth = end.getMonth();

    const result = [];

    while (
      startYear < endYear ||
      (startYear === endYear && startMonth <= endMonth)
    ) {
      result.push({ year: startYear, month: startMonth });

      startMonth++;

      if (startMonth > 11) {
        startMonth = 0;
        startYear++;
      }
    }

    return result;
  }

  function updateRangeByMonth(value: string) {
    const [yearStr, monthStr] = value.split("-");
    const year = Number(yearStr.trim());
    const month = Number(monthStr.trim());

    const filtered = expenses.filter((exp) => {
      const expenseDate = new Date(exp.newDueDate);
      const expenseMonth = expenseDate.getMonth();
      const expenseYear = expenseDate.getFullYear();

      return expenseMonth === month && expenseYear === year;
    });

    setFilteredExpenses(filtered);

    if (yearStr !== selectYear) {
      setSelectYear(yearStr);
      fetchExpense();
    }
  }

  function real(v: number | undefined | null): string {
    if (typeof v !== "number" || !Number.isFinite(v)) return "R$ 0,00";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  async function handleAddExpense() {
    if (newExpense === "") throw new Error("O nome deve ser preenchido");
    if (newExpenseValue === null)
      throw new Error("O valor deve ser preenchido");
    if (newDueDate === "") throw new Error("A data deve ser preenchida");
    const payload: ExpensePayload = {
      label: newExpense,
      value: newExpenseValue,
      newDueDate: newDueDate,
      isRecurring: recurrenceType !== "NONE",
      recurrenceType: recurrenceType !== "NONE" ? recurrenceType : undefined,
      isPaid: false,
    };

    try {
      const res = await fetch(`${API}/expense/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro criar despesa");
      await res.json();
      resetExpense();
      fetchExpense();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleEditExpense(expense: Expense) {
    const payload: ExpensePayload = {
      label: newExpense !== "" ? newExpense : expense.label,
      value: newExpenseValue !== null ? newExpenseValue : expense.value,
      newDueDate: newDueDate !== "" ? newDueDate : expense.newDueDate,
      isRecurring: recurrenceType !== "NONE",
      recurrenceType: recurrenceType !== "NONE" ? recurrenceType : undefined,
      isPaid: expense.isPaid,
    };

    try {
      const res = await fetch(`${API}/expense/${expense.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro editar despesa");
      await res.json();
      resetExpense();
      fetchExpense();
      setIsOpenEdit(null);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteExpense(expense: Expense) {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir a despesa ${expense.label}?`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API}/expense/${expense.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Erro apagar despesa");
      await res.json();
      fetchExpense();
    } catch (err) {
      console.error(err);
    }
  }

  const fetchFirstExpense = useCallback(async () => {
    try {
      const res = await fetch(`${API}/first-expense/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Erro buscar data inicial da despesa");
      const data = await res.json();
      setFirstExpense(data?.createdAt ?? "");
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchExpense = useCallback(async () => {
    try {
      const res = await fetch(`${API}/expense/?year=${selectYear}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Erro buscar despesa");
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    }
  }, [selectYear, token]);

  const months = useMemo(() => {
    if (!firstExpense) return [];
    return rangeOfExpenses();
  }, [firstExpense, rangeOfExpenses]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    fetchExpense();
    fetchFirstExpense();
  }, [isLoading, token, router, fetchExpense, fetchFirstExpense]);

  useEffect(() => {
    if (expenses.length === 0) return;

    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr.trim());
    const month = Number(monthStr.trim());

    const filtered = expenses.filter((exp) => {
      const expenseDate = new Date(exp.newDueDate);
      const expenseMonth = expenseDate.getMonth();
      const expenseYear = expenseDate.getFullYear();

      return expenseMonth === month && expenseYear === year;
    });

    setFilteredExpenses(filtered);
  }, [expenses, selectedMonth]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.expenseMain}>
          <div className={styles.expenseBox}>
            <div className={styles.cashStatsCardExpense}>
              <div className={styles.cashStatsCardDiv}>
                <div className={styles.cardGoal}>
                  <div className={styles.infoCardExpense}>
                    <strong>Despesas</strong>
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        updateRangeByMonth(e.target.value);
                      }}
                    >
                      {months.map((m, index) => (
                        <option key={index} value={`${m.year} - ${m.month}`}>
                          {m.month + 1}/{m.year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.card}>
                  <h4 className={styles.received}>Média recebida:</h4>
                  <p>{real(Number(selectedYearStats.monthAverage))}</p>
                </div>
                <div className={styles.card}>
                  <h4 className={styles.received}>Total de despesas:</h4>
                  <p>
                    {real(
                      Number(
                        expenses.reduce(
                          (acc, item) => acc + Number(item.value),
                          0
                        )
                      )
                    )}
                  </p>
                </div>
                <div className={styles.card}>
                  <h4 className={styles.received}>Total de despesas pagas:</h4>
                  <p>
                    {real(
                      Number(
                        expenses
                          .filter((item) => item.isPaid)
                          .reduce((acc, item) => acc + Number(item.value), 0)
                      )
                    )}
                  </p>
                </div>
                <div className={styles.card}>
                  <h4 className={styles.received}>Média líquida:</h4>
                  <p>
                    {real(
                      Number(selectedYearStats.monthAverage) -
                        Number(
                          expenses.reduce(
                            (acc, item) => acc + Number(item.value),
                            0
                          )
                        )
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className={styles.cashStatsCardExpense}>
              <div className={styles.cashStatsCardDiv}>
                <div className={styles.cardGoal}>
                  <strong>Adicionar despesa</strong>
                </div>
                <div className={styles.card}>
                  <input
                    type="text"
                    placeholder="Despesa"
                    value={newExpense}
                    onChange={(e) => setNewExpense(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Valor"
                    value={real(newExpenseValue)}
                    onChange={(e) => {
                      const numeric =
                        Number(e.target.value.replace(/\D/g, "")) / 100;
                      setNewExpenseValue(numeric);
                    }}
                  />
                </div>
                <div className={styles.cardAddExpense}>
                  <input
                    type="date"
                    onChange={(e) => setNewDueDate(e.target.value)}
                    value={newDueDate}
                  />
                  {newExpense.length > 1 &&
                    newExpenseValue !== null &&
                    newDueDate.length > 1 && (
                      <button
                        type="button"
                        className={styles.btnSave}
                        onClick={handleAddExpense}
                      >
                        <strong>Criar</strong>
                      </button>
                    )}
                  {/*                   
                  <select
                    value={recurrenceType}
                    onChange={(e) => setRecurrenceType(e.target.value)}
                  >
                    <option value="NONE">Eventual</option>
                    <option value="WEEKLY">Semanal</option>
                    <option value="MONTHLY">Mensal</option>
                    <option value="YEARLY">Anual</option>
                  </select> */}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.expenseBox}>
            <div className={styles.cashStatsCardExpense}>
              <table className={styles.dealsTable}>
                <thead>
                  <tr>
                    <th>Conta</th>
                    <th>Dia Venc.</th>
                    <th>Valor</th>
                    <th>Pago</th>
                    {/* <th>Recorrência</th> */}
                    {isOpenEdit ? (
                      <>
                        <th>Confirmar</th>
                        <th>Cancelar</th>
                      </>
                    ) : (
                      <>
                        <th>Editar</th>
                        <th>Excluir</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses
                    .slice()
                    .reverse()
                    .map((exp) => (
                      <tr key={exp.id}>
                        {isOpenEdit === exp.id ? (
                          <>
                            <td>
                              <input
                                type="text"
                                placeholder="Despesa"
                                value={newExpense}
                                onChange={(e) => setNewExpense(e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="date"
                                value={newDueDate}
                                onChange={(e) => setNewDueDate(e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                placeholder="Valor"
                                value={real(newExpenseValue)}
                                onChange={(e) => {
                                  const numeric =
                                    Number(e.target.value.replace(/\D/g, "")) /
                                    100;
                                  setNewExpenseValue(numeric);
                                }}
                              />
                            </td>
                            <td>
                              <button
                                className={`${styles.btnIsPaid} ${
                                  exp.isPaid ? styles.btnIsPaidActive : ""
                                }`}
                                onClick={() => {
                                  handleEditExpense({
                                    ...exp,
                                    isPaid: !exp.isPaid,
                                  });
                                }}
                              >
                                {exp.isPaid ? "Pago" : "Pagar"}
                              </button>
                            </td>
                            {/* <td>
                              <select
                                value={recurrenceType}
                                onChange={(e) =>
                                  setRecurrenceType(e.target.value)
                                }
                              >
                                <option value="NONE">Eventual</option>
                                <option value="WEEKLY">Semanal</option>
                                <option value="MONTHLY">Mensal</option>
                                <option value="YEARLY">Anual</option>
                              </select>
                            </td> */}
                            <td>
                              <button
                                className={styles.btnEdit}
                                onClick={() => handleEditExpense(exp)}
                              >
                                <FaCheck />
                              </button>
                            </td>
                            <td>
                              <button
                                className={styles.btnDel}
                                onClick={() => {
                                  setIsOpenEdit(null);
                                  resetExpense();
                                }}
                              >
                                <FaTimes />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{exp.label || "Não encontrada"}</td>
                            <td>
                              {new Date(exp.newDueDate).getDate() ||
                                "Não encontrado"}
                            </td>
                            <td>
                              {real(Number(exp.value)) ||
                                "Valor não encontrado"}
                            </td>
                            <td>
                              <button
                                className={`${styles.btnIsPaid} ${
                                  exp.isPaid ? styles.btnIsPaidActive : ""
                                }`}
                                onClick={() => {
                                  handleEditExpense({
                                    ...exp,
                                    isPaid: !exp.isPaid,
                                  });
                                }}
                              >
                                {exp.isPaid ? "Pago" : "Pagar"}
                              </button>
                            </td>
                            {/* <td>
                              {exp.isRecurring ? exp.recurrenceType : "Não"}
                            </td> */}
                            <td>
                              <button
                                className={styles.btnEdit}
                                onClick={() => {
                                  setIsOpenEdit(exp.id);
                                  setIsOpenEdit(exp.id);
                                  setNewExpense(exp.label);
                                  setNewExpenseValue(Number(exp.value));
                                  setNewDueDate(exp.newDueDate.split("T")[0]);
                                  setRecurrenceType(
                                    exp.recurrenceType ?? "NONE"
                                  );
                                }}
                              >
                                <RiPencilFill />
                              </button>
                            </td>
                            <td>
                              <button
                                className={styles.btnDel}
                                onClick={() => handleDeleteExpense(exp)}
                              >
                                <RiEraserFill />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
