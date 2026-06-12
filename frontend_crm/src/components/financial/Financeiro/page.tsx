"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";
import {
  DeleteContext,
  Expense,
  ExpensePayload,
  FinancialMovement,
} from "@/types/index";
import { RiPencilFill, RiEraserFill } from "react-icons/ri";
import { BsCash } from "react-icons/bs";
import { FaArrowDownLong, FaArrowUpLong } from "react-icons/fa6";
import { FaTimes, FaCheck } from "react-icons/fa";
import CustomSelect, { Option } from "@/components/Tools/Select/CustomSelect";
import CustomDatePicker from "@/components/Tools/DatePicker/DayPicker/DayPicker";
import WarningDeal from "@/components/Warning/DefaultWarning";
import CurrencyInput from "@/components/Tools/InputValue/CurrencyInput";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ExpenseCard() {
  const router = useRouter();
  const { token, isLoading } = useAuth();

  const [isOpenIncome, setIsOpenIncome] = useState(false);
  const [isOpenExpense, setIsOpenExpense] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState<number | null>(null);
  const [isOpenEditRecurrence, setIsOpenEditRecurrence] = useState<
    number | null
  >(null);
  const [initialRangeExpense, setInitialRangeExpense] = useState("");
  const [finalRangeExpense, setFinalRangeExpense] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurreingExpenses, setRecurringExpenses] = useState<Expense[]>([]);
  const [movements, setMovements] = useState<FinancialMovement[]>([]);
  const [startMovements, setStartMovements] = useState<string>(() => {
    return `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
  });

  const [endMovements, setEndMovements] = useState<string>(() => {
    return `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
  });
  const [deleteContext, setDeleteContext] = useState<DeleteContext>(null);

  const [newExpense, setNewExpense] = useState("");
  const [newExpenseValue, setNewExpenseValue] = useState<number | null>(null);
  const [newDueDate, setNewDueDate] = useState<Date | null>(null);
  const [recurrenceType, setRecurrenceType] = useState("NONE");
  const [errorExpense, setErrorExpense] = useState<string | null>(null);
  const [errorExpenseEdit, setErrorExpenseEdit] = useState<string | null>(null);
  const [errorIsIncome, setErrorIsIncome] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return `${new Date().getFullYear()} - ${new Date().getMonth() + 1}`;
  });

  function reset() {
    setIsOpenIncome(false);
    setIsOpenExpense(false);
    setIsOpenEdit(null);
    setIsOpenEditRecurrence(null);

    setNewExpense("");
    setNewExpenseValue(null);
    setNewDueDate(null);
    setRecurrenceType("NONE");

    setErrorExpense(null);
    setErrorExpenseEdit(null);
    setErrorIsIncome(null);
    setError(null);
  }

  function reFetch() {
    fetchFirstExpense();
    fetchExpense();
    fetchRecurringExpense();
    fetchFinancialMovement();
  }

  const rangeOfExpenses = useCallback(() => {
    const start = new Date(initialRangeExpense);
    const end = new Date(finalRangeExpense);

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
  }, [initialRangeExpense, finalRangeExpense]);

  function real(v: number | undefined | null): string {
    if (typeof v !== "number" || !Number.isFinite(v)) return "R$ 0,00";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  async function handleAddExpense(income: boolean = false) {
    if (newExpense === "") throw new Error("O nome deve ser preenchido");
    if (newExpenseValue === null)
      throw new Error("O valor deve ser preenchido");
    if (newDueDate === null) throw new Error("A data deve ser preenchida");
    const payload: ExpensePayload = {
      label: newExpense,
      isIncome: income,
      value: newExpenseValue,
      newDueDate: newDueDate?.toISOString(),
      isRecurringActive: recurrenceType !== "NONE",
      recurrenceType,
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar despesa");

      reset();
      reFetch();
    } catch (err) {
      if (income) {
        setErrorIsIncome(
          err instanceof Error ? err.message : "Erro ao criar despesa",
        );
      } else {
        setErrorExpense(
          err instanceof Error ? err.message : "Erro ao criar despesa",
        );
      }
    }
  }

  async function handleEditExpense(expense: Expense) {
    const payload: ExpensePayload = {
      label: newExpense !== "" ? newExpense : expense.label,
      value: newExpenseValue !== null ? newExpenseValue : expense.value,
      isIncome: expense.isIncome,
      newDueDate:
        newDueDate !== null ? newDueDate.toISOString() : expense.newDueDate,
      isRecurringActive: recurrenceType !== "NONE",
      recurrenceType,
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro editar despesa");

      reset();
      reFetch();
    } catch (err) {
      if (expense.isIncome) {
        setErrorIsIncome(
          err instanceof Error ? err.message : "Erro ao editar despesa",
        );
      } else {
        setErrorExpense(
          err instanceof Error ? err.message : "Erro ao editar despesa",
        );
      }
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro excluir despesa");
      fetchExpense();
      fetchFirstExpense();
      fetchRecurringExpense();
      fetchFinancialMovement();
    } catch (err) {
      setErrorExpenseEdit(
        err instanceof Error ? err.message : "Erro ao excluir despesa",
      );
    }
  }

  async function handleUpdateRecurringStatus(expense: Expense) {
    try {
      const res = await fetch(`${API}/expense/${expense.id}/recurrence/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isRecurringActive: !expense.isRecurringActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro parar recorrência");

      reset();
      reFetch();
    } catch (err) {
      setErrorExpense(
        err instanceof Error ? err.message : "Erro ao parar recorrência",
      );
    }
  }

  const fetchFirstExpense = useCallback(async () => {
    try {
      const res = await fetch(`${API}/expense-range/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Erro buscar data inicial da despesa");
      const data = await res.json();
      setInitialLoading(false);
      setInitialRangeExpense(data?.createdCompany?.createdAt ?? "");
      setFinalRangeExpense(data?.lastExpense?.newDueDate ?? "");
    } catch (err) {
      console.error(err);
      setError("Erro ao ler despesa.");
    }
  }, [token]);

  const fetchExpense = useCallback(async () => {
    try {
      const res = await fetch(
        `${API}/expense/?year=${selectedYear}&month=${selectedMonthNumber}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) throw new Error("Erro buscar despesa");
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error(err);
      setError("Erro ao ler despesa.");
    }
  }, [token, selectedMonth]);

  const fetchRecurringExpense = useCallback(async () => {
    try {
      const res = await fetch(`${API}/recurring-expense`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Erro buscar despesa");
      const data = await res.json();
      setRecurringExpenses(data);
    } catch (err) {
      console.error(err);
      setError("Erro ao ler despesa.");
    }
  }, [token]);

  const fetchFinancialMovement = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      if (startMovements) params.append("startDate", startMovements);
      if (endMovements) params.append("endDate", endMovements);

      const res = await fetch(
        `${API}/financial-movement?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro buscar extrato");
      setMovements(data.financialMovements);
    } catch (err) {
      console.error(err);
      setError("Erro ao ler extrato.");
    }
  }, [startMovements, endMovements, token]);

  const getMonthName = useMemo(() => {
    if (!selectedMonth) return "";

    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr.trim());
    const month = Number(monthStr.trim());

    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }, [selectedMonth]);

  const [selectedYear, selectedMonthNumber] = selectedMonth
    .split("-")
    .map((v) => Number(v.trim()));

  const months = useMemo(() => {
    if (!initialRangeExpense) return [];
    return rangeOfExpenses();
  }, [initialRangeExpense, rangeOfExpenses]);

  const recurrenceOptions: Option<string>[] = [
    {
      value: "NONE",
      label: "Sem recorrência",
    },
    {
      value: "WEEKLY",
      label: "Semanal",
    },
    {
      value: "BIWEEKLY",
      label: "Quinzenal",
    },
    {
      value: "MONTHLY",
      label: "Mensal",
    },
    {
      value: "BIMONTHLY",
      label: "Bienal",
    },
    {
      value: "QUARTERLY",
      label: "Trimestral",
    },
    {
      value: "SEMIANNUAL",
      label: "Semestral",
    },
    {
      value: "YEARLY",
      label: "Anual",
    },
  ];

  const RECURRENCE_LABELS: Record<string, string> = {
    NONE: "Sem recorrência",
    WEEKLY: "Semanal",
    BIWEEKLY: "Quinzenal",
    MONTHLY: "Mensal",
    BIMONTHLY: "Bienal",
    QUARTERLY: "Trimestral",
    SEMIANNUAL: "Semestral",
    YEARLY: "Anual",
  };

  const RecurrenceSelected = useMemo(() => {
    return recurrenceOptions.find((o) => o.value === recurrenceType) || null;
  }, [recurrenceOptions, recurrenceType]);

  const options: Option<string>[] = months.map((m) => ({
    value: `${m.year}-${m.month + 1}`,
    label: `${m.month + 1}/${m.year}`,
  }));

  const selected = useMemo(() => {
    return options.find((o) => o.value === selectedMonth) || null;
  }, [options, selectedMonth]);

  const selectedStart = useMemo(() => {
    return options.find((o) => o.value === startMovements) || null;
  }, [options, startMovements]);

  const selectedEnd = useMemo(() => {
    return options.find((o) => o.value === endMovements) || null;
  }, [options, endMovements]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    fetchExpense();
    fetchRecurringExpense();
    fetchFirstExpense();
  }, [
    isLoading,
    token,
    router,
    fetchExpense,
    fetchRecurringExpense,
    fetchFirstExpense,
  ]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    fetchFinancialMovement();
  }, [isLoading, token, router, fetchFinancialMovement]);

  useEffect(() => {
    if (options.length > 0 && !selected) {
      const currentMonth = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
      const currentOption = options.find((opt) => opt.value === currentMonth);

      if (currentOption) {
        setSelectedMonth(currentMonth);
      } else if (options.length > 0) {
        setSelectedMonth(options[options.length - 1].value);
      }
    }
  }, [options, selected]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.expenseMain}>
          <div>
            <div className={`glass ${styles.cashStatsCardExpense}`}>
              <div className={`glass ${styles.cardGoal}`}>
                <strong>Extrato da empresa</strong>
                <div className={styles.selectMovements}>
                  <div className={styles.selectMovement}>
                    <h5>De:</h5>
                    <CustomSelect
                      options={options}
                      value={selectedStart}
                      onChange={(opt) => {
                        if (!opt) return;
                        setStartMovements(opt.value);
                      }}
                    />
                  </div>

                  <div className={styles.selectMovement}>
                    <h5>Até:</h5>
                    <CustomSelect
                      options={options}
                      value={selectedEnd}
                      onChange={(opt) => {
                        if (!opt) return;
                        setEndMovements(opt.value);
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className={`glass ${styles.tableContainer}`}>
                <table className={`glass ${styles.dealsTable}`}>
                  <thead>
                    <tr>
                      <th className={styles.onlyDesktop}></th>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th className={styles.onlyDesktop}>Movimentação</th>
                      <th className={styles.onlyDesktop}>Responsável</th>
                      <th>Valor</th>
                      <th>Saldo após movimentação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements
                      .slice()
                      .reverse()
                      .map((mov) => (
                        <tr key={mov.id}>
                          <td className={styles.onlyDesktop}>
                            <div className={styles.iconRecived}>
                              <BsCash className={styles.icon} />
                              {mov.type === "EXPENSE" ? (
                                <FaArrowUpLong className={styles.arrowUp} />
                              ) : (
                                <FaArrowDownLong className={styles.arrowDown} />
                              )}
                            </div>
                          </td>
                          <td className={styles.infoMovements}>
                            {new Date(mov.createdAt).toLocaleDateString(
                              "pt-BR",
                            )}
                          </td>
                          <td>{mov.description || "Não encontrada"}</td>
                          <td
                            className={`${styles.infoMovements} ${styles.onlyDesktop}`}
                          >
                            {mov.type === "EXPENSE" ? "Despesa" : "Entrada"}
                          </td>
                          <td
                            className={`${styles.infoMovements} ${styles.onlyDesktop}`}
                          >
                            {mov.creator?.name ||
                              `Usuário ${mov.creator?.name}`}
                          </td>
                          <td>
                            <div
                              className={`${styles.accountBalance} ${mov.type === "EXPENSE" ? styles.isExpense : styles.isIncome}`}
                            >
                              <strong>
                                {mov.type === "EXPENSE" ? "- " : "+ "}
                                {real(Number(mov.amount)) ||
                                  "Valor não encontrado"}
                              </strong>
                            </div>
                          </td>
                          <td>
                            <div
                              className={`${styles.accountBalance} ${Number(mov.balanceAfter) < 0 && styles.isExpense}`}
                            >
                              <strong>
                                {real(Number(mov.balanceAfter)) ||
                                  "Valor não encontrado"}
                              </strong>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div>
            <div className={`glass ${styles.cashStatsCardExpense}`}>
              <button
                type="button"
                className={`glass ${styles.cardGoal} ${styles.btnAdd}`}
                onClick={() => {
                  reset();
                  setIsOpenIncome((prev) => !prev);
                }}
              >
                <strong>Adicionar entrada</strong>
              </button>
              {errorIsIncome && <p className="error">{errorIsIncome}</p>}
              {isOpenIncome && (
                <>
                  <div className={styles.card}>
                    <input
                      type="text"
                      className={`form-base ${styles.form}`}
                      placeholder="Entrada"
                      value={newExpense}
                      onChange={(e) => setNewExpense(e.target.value)}
                    />
                  </div>
                  <div className={styles.cardAddExpense}>
                    <CurrencyInput
                      className={`form-base ${styles.payment}`}
                      placeholder="Valor"
                      value={newExpenseValue || 0}
                      onChange={setNewExpenseValue}
                    />

                    <CustomDatePicker
                      value={newDueDate}
                      placeholder="Selecione uma data"
                      onChange={setNewDueDate}
                      startYear={new Date().getFullYear() - 2}
                      endYear={new Date().getFullYear() + 10}
                    />

                    {newExpense.length > 1 &&
                      newExpenseValue !== null &&
                      newDueDate !== null && (
                        <button
                          type="button"
                          className={`glass ${styles.btnExpense} ${styles.btnSave}`}
                          onClick={() => handleAddExpense(true)}
                        >
                          <strong>Criar</strong>
                        </button>
                      )}
                  </div>
                </>
              )}
            </div>

            <div className={`glass ${styles.cashStatsCardExpense}`}>
              <button
                type="button"
                className={`glass ${styles.cardGoal} ${styles.btnAdd}`}
                onClick={() => {
                  reset();
                  setIsOpenExpense((prev) => !prev);
                }}
              >
                <strong>Adicionar despesa</strong>
              </button>

              {errorExpense && <p className="error">{errorExpense}</p>}

              {isOpenExpense && (
                <>
                  <div className={styles.card}>
                    <input
                      type="text"
                      className={`form-base ${styles.form}`}
                      placeholder="Despesa"
                      value={newExpense}
                      onChange={(e) => setNewExpense(e.target.value)}
                    />
                  </div>
                  <div className={styles.cardAddExpense}>
                    <CurrencyInput
                      className={`form-base ${styles.payment}`}
                      placeholder="Valor"
                      value={newExpenseValue || 0}
                      onChange={setNewExpenseValue}
                    />

                    <CustomDatePicker
                      value={newDueDate}
                      onChange={setNewDueDate}
                      startYear={new Date().getFullYear() - 2}
                      endYear={new Date().getFullYear() + 10}
                    />

                    <CustomSelect
                      options={recurrenceOptions}
                      value={RecurrenceSelected}
                      onChange={(opt) => {
                        if (!opt) return;
                        setRecurrenceType(opt.value);
                      }}
                    />
                    {newExpense.length > 1 &&
                      newExpenseValue !== null &&
                      newDueDate !== null && (
                        <button
                          type="button"
                          className={`glass ${styles.btnExpense} ${styles.btnSave}`}
                          onClick={() => handleAddExpense()}
                        >
                          <strong>Criar</strong>
                        </button>
                      )}
                  </div>
                </>
              )}
            </div>

            {(!error || expenses.length > 0) && !initialLoading ? (
              <div className={`glass ${styles.cashStatsCardExpense}`}>
                <div className={styles.infoCardExpense}>
                  {selected ? (
                    <h5>{getMonthName}</h5>
                  ) : (
                    <h5>Selecione um mês</h5>
                  )}
                  <CustomSelect
                    options={options}
                    value={selected}
                    onChange={(opt) => {
                      if (!opt) return;
                      setSelectedMonth(opt.value);
                    }}
                  />
                </div>

                <div className={styles.tableContainer}>
                  <table className={`glass ${styles.dealsTable}`}>
                    <thead>
                      <tr>
                        <th>Conta</th>
                        <th>Dia</th>
                        <th>Recorrencia</th>
                        <th>Valor</th>
                        <th>Pago</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses
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
                                    onChange={(e) =>
                                      setNewExpense(e.target.value)
                                    }
                                  />
                                </td>
                                <td>
                                  <CustomDatePicker
                                    value={newDueDate}
                                    onChange={setNewDueDate}
                                    startYear={new Date().getFullYear() - 2}
                                    endYear={new Date().getFullYear() + 10}
                                  />
                                </td>
                                <td>
                                  <CustomSelect
                                    options={recurrenceOptions}
                                    value={RecurrenceSelected}
                                    onChange={(opt) => {
                                      if (!opt) return;
                                      setRecurrenceType(opt.value);
                                    }}
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
                                <td></td>
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
                                      onClick={() => reset()}
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
                                  {exp.recurrenceType !== "NONE" &&
                                  !exp.isIncome
                                    ? RECURRENCE_LABELS[
                                        exp.recurrenceType ?? ""
                                      ]
                                    : "Não"}
                                </td>
                                <td
                                  className={
                                    !exp.isIncome
                                      ? styles.isExpense
                                      : styles.isIncome
                                  }
                                >
                                  {real(Number(exp.value)) ||
                                    "Valor não encontrado"}
                                </td>
                                <td>
                                  {exp.isIncome ? (
                                    ""
                                  ) : (
                                    <button
                                      className={`glass ${styles.btnIsPaid} 
                                ${!exp.isPaid && styles.btnIsPaidActive}`}
                                      onClick={() => {
                                        handleEditExpense({
                                          ...exp,
                                          isPaid: !exp.isPaid,
                                        });
                                      }}
                                    >
                                      {exp.isPaid ? "Pago" : "Pagar"}
                                    </button>
                                  )}
                                </td>
                                <td>
                                  <div className={styles.edit}>
                                    <button
                                      className={styles.btnEdit}
                                      onClick={() => {
                                        setIsOpenExpense(false);
                                        setIsOpenEdit(exp.id);
                                        setIsOpenEditRecurrence(null);
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
                                          onConfirm: () =>
                                            handleDeleteExpense(exp),
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
            ) : (
              <>
                {error ? (
                  <div className={styles.noItens}>
                    <h3>⚠️ Erro ao carregar despesas</h3>
                    <p>Tente novamente ou entre em contato se persistir.</p>
                  </div>
                ) : (
                  <div className={styles.noItens}>
                    <h3>😭 Nenhuma despesa encontrada...</h3>
                    <p>Tente ajustar os filtros ou criar uma nova despesa.</p>
                  </div>
                )}
              </>
            )}

            {!error && recurreingExpenses.length > 0 && !initialLoading && (
              <div className={`glass ${styles.cashStatsCardExpense}`}>
                <div className={styles.infoCardExpense}>
                  <h3>Despesas recorrentes ativas</h3>
                </div>
                <div className={styles.tableContainer}>
                  <table className={`glass ${styles.dealsTable}`}>
                    <thead>
                      <tr>
                        <th>Conta</th>
                        <th>Valor</th>
                        <th>Recorrencia</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recurreingExpenses
                        .slice()
                        .reverse()
                        .map((exp) => (
                          <tr key={exp.id}>
                            <td>{exp.label || "Não encontrada"}</td>
                            <td>
                              {real(Number(exp.value)) ||
                                "Valor não encontrado"}
                            </td>
                            <td>
                              {RECURRENCE_LABELS[exp.recurrenceType ?? ""]}
                            </td>
                            <td>
                              <div className={styles.edit}>
                                <button
                                  className={`glass ${styles.btnIsPaid} 
                                ${styles.btnIsPaidActive}`}
                                  onClick={() => {
                                    reset();
                                    handleUpdateRecurringStatus(exp);
                                  }}
                                >
                                  Parar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
