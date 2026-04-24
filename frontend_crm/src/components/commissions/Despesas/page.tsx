"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";
import {
  DeleteContext,
  Expense,
  ExpensePayload,
  ExpenseProps,
} from "@/types/index";
import { RiPencilFill, RiEraserFill } from "react-icons/ri";
import { FaTimes, FaCheck } from "react-icons/fa";
import CustomSelect, { Option } from "@/components/Tools/Select/CustomSelect";
import CustomDatePicker from "@/components/Tools/DatePicker/DayPicker/DayPicker";
import WarningDeal from "@/components/Warning/DefaultWarning";
import CurrencyInput from "@/components/Tools/InputValue/CurrencyInput";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ExpenseCard({ selectedYearStats }: ExpenseProps) {
  const router = useRouter();
  const { token, isLoading } = useAuth();

  const [isOpenEdit, setIsOpenEdit] = useState<number | null>(null);
  const [firstExpense, setFirstExpense] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectYear, setSelectYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [deleteContext, setDeleteContext] = useState<DeleteContext>(null);

  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);

  const [newExpense, setNewExpense] = useState("");
  const [newExpenseValue, setNewExpenseValue] = useState<number | null>(null);
  const [newDueDate, setNewDueDate] = useState<Date | null>(null);
  const [recurrenceType, setRecurrenceType] = useState("MONTHLY");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()} - ${now.getMonth()}`;
  });

  function resetExpense() {
    setNewExpense("");
    setNewExpenseValue(null);
    setNewDueDate(null);
    setRecurrenceType("MONTHLY");
  }

  const rangeOfExpenses = useCallback(() => {
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
  }, [firstExpense]);

  function real(v: number | undefined | null): string {
    if (typeof v !== "number" || !Number.isFinite(v)) return "R$ 0,00";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  async function handleAddExpense() {
    if (newExpense === "") throw new Error("O nome deve ser preenchido");
    if (newExpenseValue === null)
      throw new Error("O valor deve ser preenchido");
    if (newDueDate === null) throw new Error("A data deve ser preenchida");
    const payload: ExpensePayload = {
      label: newExpense,
      value: newExpenseValue,
      newDueDate: newDueDate?.toISOString(),
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
      newDueDate:
        newDueDate !== null ? newDueDate.toISOString() : expense.newDueDate,
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

  const options: Option<string>[] = months.map((m) => ({
    value: `${m.year}-${m.month}`,
    label: `${m.month + 1}/${m.year}`,
  }));

  const selected = useMemo(() => {
    return options.find((o) => o.value === selectedMonth) || null;
  }, [options, selectedMonth]);

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
          <div>
            <div className={`glass ${styles.cashStatsCardExpense}`}>
              <div className={`glass ${styles.cardGoal}`}>
                <div className={styles.infoCardExpense}>
                  <h3>Despesas</h3>
                  <CustomSelect
                    options={options}
                    value={selected}
                    onChange={(opt) => {
                      if (!opt) return;
                      setSelectedMonth(opt.value);
                    }}
                  />
                </div>
              </div>
              <div className={styles.card}>
                <p className={styles.received}>Média recebida:</p>
                <span>{real(Number(selectedYearStats.monthAverage))}</span>
              </div>
              <div className={styles.card}>
                <p className={styles.received}>Total de despesas:</p>
                <span>
                  {real(
                    Number(
                      expenses.reduce(
                        (acc, item) => acc + Number(item.value),
                        0,
                      ),
                    ),
                  )}
                </span>
              </div>
              <div className={styles.card}>
                <p className={styles.received}>Total de despesas pagas:</p>
                <span>
                  {real(
                    Number(
                      expenses
                        .filter((item) => item.isPaid)
                        .reduce((acc, item) => acc + Number(item.value), 0),
                    ),
                  )}
                </span>
              </div>
              <div className={styles.card}>
                <p className={styles.received}>Média líquida:</p>
                <span>
                  {real(
                    Number(selectedYearStats.monthAverage) -
                      Number(
                        expenses.reduce(
                          (acc, item) => acc + Number(item.value),
                          0,
                        ),
                      ),
                  )}
                </span>
              </div>
            </div>
            <div className={`glass ${styles.cashStatsCardExpense}`}>
              <div className={`glass ${styles.cardGoal}`}>
                <strong>Adicionar despesa</strong>
              </div>
              <div className={styles.card}>
                <input
                  type="text"
                  className="form-base"
                  placeholder="Despesa"
                  value={newExpense}
                  onChange={(e) => setNewExpense(e.target.value)}
                />
                <CurrencyInput
                  className={`form-base ${styles.payment}`}
                  placeholder="Valor"
                  value={newExpenseValue || 0}
                  onChange={setNewExpenseValue}
                />
              </div>
              <div className={styles.cardAddExpense}>
                <CustomDatePicker value={newDueDate} onChange={setNewDueDate} />

                {newExpense.length > 1 &&
                  newExpenseValue !== null &&
                  newDueDate !== null && (
                    <button
                      type="button"
                      className={`glass ${styles.btnSave}`}
                      onClick={handleAddExpense}
                    >
                      <strong>Criar</strong>
                    </button>
                  )}
              </div>
            </div>
          </div>
          <div>
            <div className={`glass ${styles.cashStatsCardExpense}`}>
              <table className={`glass ${styles.dealsTable}`}>
                <thead>
                  <tr>
                    <th>Conta</th>
                    <th>Dia Venc.</th>
                    <th>Valor</th>
                    <th>Pago</th>
                    <th></th>
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
                                className="form-base"
                                placeholder="Despesa"
                                value={newExpense}
                                onChange={(e) => setNewExpense(e.target.value)}
                              />
                            </td>
                            <td>
                              <CustomDatePicker
                                value={newDueDate}
                                onChange={setNewDueDate}
                              />
                            </td>
                            <td>
                              <CurrencyInput
                                className={`form-base ${styles.payment}`}
                                placeholder="Valor"
                                value={newExpenseValue || 0}
                                onChange={setNewExpenseValue}
                              />
                            </td>
                            <td>
                              <button
                                className={`glass ${styles.btnIsPaid} 
                                ${exp.isPaid && styles.btnIsPaidActive}`}
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
                            <td>
                              <div className={styles.edit}>
                                <button
                                  className={styles.btnEdit}
                                  onClick={() => handleEditExpense(exp)}
                                >
                                  <FaCheck />
                                </button>
                                <button
                                  className={styles.btnDel}
                                  onClick={() => {
                                    setIsOpenEdit(null);
                                    resetExpense();
                                  }}
                                >
                                  <FaTimes />
                                </button>
                              </div>
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
                                className={`glass ${styles.btnIsPaid} 
                                ${exp.isPaid && styles.btnIsPaidActive}`}
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
                            <td>
                              <div className={styles.edit}>
                                <button
                                  className={styles.btnEdit}
                                  onClick={() => {
                                    setIsOpenEdit(exp.id);
                                    setIsOpenEdit(exp.id);
                                    setNewExpense(exp.label);
                                    setNewExpenseValue(Number(exp.value));
                                    setNewDueDate(new Date(exp.newDueDate));
                                    setRecurrenceType(
                                      exp.recurrenceType ?? "NONE",
                                    );
                                  }}
                                >
                                  <RiPencilFill />
                                </button>
                                <button
                                  className={styles.btnDel}
                                  onClick={async () => {
                                    if (!exp) return;

                                    setDeleteContext({
                                      message:
                                        "Tem certeza que deseja excluir a despesa",
                                      name: exp.label ?? "",
                                      onConfirm: () => handleDeleteExpense(exp),
                                    });
                                  }}
                                >
                                  <RiEraserFill />
                                </button>
                              </div>
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
