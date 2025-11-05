"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";
import DealForm from "@/components/Deal/DealForm/DealForm";
import FinishDeal from "@/components/Deal/FinishDeal/FinishDeal";
import { Deal, CloseDealPayload, User } from "@/types/index";
import { BsFileEarmarkPlus } from "react-icons/bs";
import { fetchDeals } from "@/utils/fetchDeals";
import { formatDateForFinish } from "@/utils/dateUtils";
import { IoHourglassOutline } from "react-icons/io5";
import DealsHeader from "@/components/searchbar/page";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function FinishDeals() {
  const router = useRouter();
  const { token, permissions, isLoading } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [progressDeals, setProgressDeals] = useState(true);
  const [teamDeals, setTeamDeals] = useState(false);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  function openCreate() {
    setIsCreateOpen(true);
    setSelectedDeal(null);
  }

  function openEdit(deal: Deal) {
    setIsCloseOpen(true);
    setSelectedDeal(deal);
  }

  const handleCreate = async (payload: Partial<Deal>) => {
    if (!token) {
      router.push("/login");
      return;
    }

    const res = await fetch(`${API}/deals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro");

    setDeals((prev) => [...prev, data]);
    await fetchDealsData();
  };

  const closeDealShares = async (payload: CloseDealPayload) => {
    if (!selectedDeal?.id) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const res = await fetch(`${API}/deals-close/${selectedDeal.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ dealData: payload }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao fechar negociação");

    setDeals((prev) => prev.map((d) => (d.id === data.id ? data : d)));
    await fetchDealsData();
    setIsCloseOpen(false);
    setSelectedDeal(null);
    router.push("/fechados");
    return;
  };

  const handleChangeStep = async (step: string) => {
    if (!selectedDeal?.id) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const res = await fetch(
      `${API}/deals-close-change-step/${selectedDeal.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ changeStep: step }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao mudar de passo");

    setDeals((prev) => prev.map((d) => (d.id === data.id ? data : d)));
    await fetchDealsData();
    setIsCloseOpen(false);
    setSelectedDeal(null);
    router.push("/fechados");
    return;
  };

  const monthNames = [
    "JAN",
    "FEV",
    "MAR",
    "ABR",
    "MAI",
    "JUN",
    "JUL",
    "AGO",
    "SET",
    "OUT",
    "NOV",
    "DEZ",
  ];

  function parseDealDate(deal: Deal) {
    const dateStr = deal.closedAt ?? new Date().toISOString();
    return new Date(dateStr);
  }

  const filteredDeals = useMemo(() => {
    const q = (search ?? "").trim().toLocaleLowerCase();
    const onlyFinished = deals.filter((d) => {
      const s = (d.status ?? "").toString().toUpperCase();
      return s === "FINISHED" || s === "CLOSED";
    });

    if (!q) return onlyFinished;

    return onlyFinished.filter((d) => {
      const clientName = (d.client?.name ?? "").toString().toLowerCase();
      return clientName.includes(q);
    });
  }, [deals, search]);

  const groupedByYearMonth = useMemo(() => {
    const acc: Record<number, Record<number, Deal[]>> = {};
    for (const d of filteredDeals) {
      const dt = parseDealDate(d);
      if (isNaN(dt.getTime())) continue;
      const y = dt.getFullYear();
      const m = dt.getMonth();
      acc[y] = acc[y] || {};
      acc[y][m] = acc[y][m] || [];
      acc[y][m].push(d);
    }
    return acc;
  }, [filteredDeals]);

  const yearsSortedDesc = useMemo(() => {
    return Object.keys(groupedByYearMonth)
      .map(Number)
      .sort((a, b) => a + b);
  }, [groupedByYearMonth]);

  function toggleYear(year: number) {
    if (selectedYear === year) {
      setSelectedYear(null);
    } else {
      setSelectedYear(year);
    }
  }

  function toggleMonth(year: number, month: number) {
    if (selectedYear !== year) {
      setSelectedYear(year);
      setSelectedMonth(month);
      return;
    }
    setSelectedMonth((prev) => (prev === month ? null : month));
  }

  const statsCash = useMemo(() => {
    let total = 0;
    let totalReceived = 0;
    let totalToReceive = 0;

    const yearlyStats: Record<
      number,
      {
        propertysValue: number;
        propertyMaxValue: number;
        propertyMinValue: number;
        propertyTotal: number;
        timeMax: number;
        timeMin: number;
        dealsFinish: number;
        dealsToFinish: number;
      }
    > = {};

    const ensureYear = (y: number) => {
      if (!yearlyStats[y]) {
        yearlyStats[y] = {
          propertysValue: 0,
          propertyMaxValue: 0,
          propertyMinValue: Number.MAX_SAFE_INTEGER,
          propertyTotal: 0,
          timeMax: 0,
          timeMin: Number.MAX_SAFE_INTEGER,
          dealsFinish: 0,
          dealsToFinish: 0,
        };
      }
      return yearlyStats[y];
    };

    for (const deal of deals) {
      if (!deal.DealShare || deal.DealShare.length === 0) continue;

      const startDate = new Date(String(deal.createdAt));
      const endDate = new Date(String(deal.updatedAt));
      const durationDays = Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const dealYear = endDate.getFullYear();
      ensureYear(dealYear);

      if (deal.status === "FINISHED") {
        yearlyStats[dealYear].dealsFinish += 1;
        yearlyStats[dealYear].timeMax = Math.max(
          yearlyStats[dealYear].timeMax,
          durationDays
        );
        yearlyStats[dealYear].timeMin =
          yearlyStats[dealYear].timeMin === 0
            ? durationDays
            : Math.min(yearlyStats[dealYear].timeMin, durationDays);
        yearlyStats[dealYear].propertysValue += Number(deal.propertyValue) ?? 0;
        yearlyStats[dealYear].propertyTotal += 1;

        if (
          typeof deal.propertyValue === "number" ||
          typeof deal.propertyValue === "string"
        ) {
          if (
            deal.propertyValue > yearlyStats[dealYear].propertyMaxValue ||
            yearlyStats[dealYear].propertyMaxValue === 0
          ) {
            yearlyStats[dealYear].propertyMaxValue = deal.propertyValue;
          }

          if (deal.propertyValue < yearlyStats[dealYear].propertyMinValue) {
            yearlyStats[dealYear].propertyMinValue = deal.propertyValue;
          }
        }
      } else {
        yearlyStats[dealYear].dealsToFinish += 1;
      }

      for (const share of deal.DealShare) {
        const amount = Number(share.amount) || 0;
        const received = Number(share.received) || 0;
        const toReceive = amount - received;

        total += amount;
        totalReceived += received;
        totalToReceive += toReceive;
      }

      for (const year of Object.keys(yearlyStats).map(Number)) {
        const stats = yearlyStats[year];
        if (stats.propertyMinValue === Number.MAX_SAFE_INTEGER)
          stats.propertyMinValue = 0;
        if (stats.timeMin === Number.MAX_SAFE_INTEGER) stats.timeMin = 0;
      }
    }

    return {
      total,
      totalReceived,
      totalToReceive,
      yearlyStats,
    };
  }, [deals]);

  const selectedYearStats = useMemo(() => {
    const year = selectedYear ?? new Date().getFullYear();
    const stats = statsCash.yearlyStats[year] || {
      total: 0,
      received: 0,
      toReceived: 0,
      dealsFinish: 0,
      dealsToFinish: 0,
    };

    return {
      year,
      propertysValue: stats.propertysValue,
      propertyMaxValue: stats.propertyMaxValue,
      propertyMinValue: stats.propertyMinValue,
      propertyTotal: stats.propertyTotal,
      timeMax: stats.timeMax,
      timeMin: stats.timeMin,
      dealsFinish: stats.dealsFinish,
      dealsToFinish: stats.dealsToFinish,
    };
  }, [statsCash.yearlyStats, selectedYear]);

  const dealsForSelectedMonth = useMemo(() => {
    if (selectedYear == null || selectedMonth == null) return [];
    return groupedByYearMonth[selectedYear]?.[selectedMonth] ?? [];
  }, [groupedByYearMonth, selectedYear, selectedMonth]);

  function real(v: number | undefined | null): string {
    if (typeof v !== "number" || !Number.isFinite(v)) return "R$ 0,00";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  const fetchDealsData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchDeals(API!, token, {
        team: teamDeals,
        search,
        status: ["FINISHED", "CLOSED"],
        selectedUser: selectedUser?.id,
      });
      setDeals(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, search, teamDeals, selectedUser]);

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

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const t = setTimeout(fetchDealsData, 150);
    fetchUsers();
    return () => clearTimeout(t);
  }, [fetchDealsData, isLoading, selectedUser, token, router]);

  useEffect(() => {
    if (yearsSortedDesc.length > 0) {
      const lastYear = yearsSortedDesc[yearsSortedDesc.length - 1];
      setSelectedYear(lastYear);
    }
  }, [yearsSortedDesc]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Negociações finalizadas{teamDeals ? " da equipe" : ""}</h1>
        </div>

        <div className={styles.headerContent}>
          <div className={styles.searchbar}>
            <DealsHeader
              search={search}
              setSearch={setSearch}
              teamDeals={teamDeals}
              setTeamDeals={setTeamDeals}
              users={users}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              permissions={permissions}
              onCreate={openCreate}
              loading={loading}
            />
            <button
              className={progressDeals ? styles.btnActive : styles.btnDisable}
              onClick={() => setProgressDeals((prev) => !prev)}
              type="button"
            >
              <IoHourglassOutline />
            </button>
            <button
              className={styles.addDeal}
              onClick={openCreate}
              type="button"
            >
              <BsFileEarmarkPlus />
            </button>
          </div>
        </div>

        <div className={styles.box}>
          {isCreateOpen && (
            <DealForm
              mode="create"
              isOpen={isCreateOpen}
              deal={undefined}
              onClose={() => {
                setIsCreateOpen(false);
                setSelectedDeal(null);
              }}
              onSubmit={handleCreate}
            />
          )}
        </div>

        <div className={styles.boxSteps}>
          <div className={styles.finishedDealsByYearWrap}>
            <div className={styles.yearButtons}>
              {yearsSortedDesc.length === 0 && (
                <p>Nenhuma negociação finalizada.</p>
              )}
              {yearsSortedDesc.map((year) => {
                const monthsObj = groupedByYearMonth[year] || {};
                const total = Object.values(monthsObj).reduce(
                  (s, arr) => s + arr.length,
                  0
                );
                const active = selectedYear === year;
                return (
                  <button
                    key={year}
                    type="button"
                    className={`${styles.yearBtn} ${
                      active ? styles.yearBtnActive : ""
                    }`}
                    onClick={() => toggleYear(year)}
                  >
                    {year} ({total})
                  </button>
                );
              })}
            </div>

            {selectedYear !== null && groupedByYearMonth[selectedYear] && (
              <>
                <div className={styles.monthsList}>
                  {Object.keys(groupedByYearMonth[selectedYear])
                    .map((k) => Number(k))
                    .sort((a, b) => a - b)
                    .map((monthIndex) => {
                      const list =
                        groupedByYearMonth[selectedYear][monthIndex] || [];
                      const active = selectedMonth === monthIndex;
                      return (
                        <div key={monthIndex} className={styles.monthItem}>
                          <div className={styles.monthHeader}>
                            <button
                              type="button"
                              onClick={() =>
                                toggleMonth(selectedYear, monthIndex)
                              }
                              className={`${styles.monthToggle} ${
                                active ? styles.monthToggleActive : ""
                              }`}
                            >
                              <h3>{monthNames[monthIndex]}</h3>
                              <h5>({list.length})</h5>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {selectedMonth !== null && (
                  <div className={styles.dealsOfMonth}>
                    {dealsForSelectedMonth
                      .filter((d) => {
                        if (progressDeals) return true;
                        return d.status === "FINISHED";
                      })
                      .sort((a) => {
                        const dateA = new Date(a.closedAt || "").getTime();
                        const dateB = new Date(a.updatedAt || "").getTime();

                        return dateB - dateA;
                      })
                      .map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className={`${styles.card} ${
                            d.status === "CLOSED" ? styles.inProgress : ""
                          }`}
                          onClick={() => openEdit(d)}
                        >
                          <div>
                            <h3>{d.client?.name ?? "— Cliente"}</h3>
                            {d.status === "FINISHED" ? (
                              <div>{formatDateForFinish(d.closedAt)}</div>
                            ) : (
                              <p>Em andamento</p>
                            )}
                            {teamDeals && (
                              <h6>
                                {d.creator?.name || "Usuário não encontrado"}
                              </h6>
                            )}
                          </div>
                        </button>
                      ))}
                    {dealsForSelectedMonth.length === 0 && (
                      <p>Nenhuma negociação neste mês.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <div className={styles.pendingSection}>
            <div className={styles.cashStatsCardDiv}>
              <p>
                <strong>Negociações finalizadas:</strong>{" "}
                {selectedYearStats.dealsFinish}
              </p>
              {selectedYearStats.dealsToFinish > 1 ? (
                <p>
                  <strong>Negociações em aberto:</strong>{" "}
                  {selectedYearStats.dealsToFinish}
                </p>
              ) : (
                ""
              )}
              <p>
                <strong>Valor de venda ano:</strong>{" "}
                {real(Number(selectedYearStats.propertysValue))}
              </p>
              <p>
                <strong>Imóvel mais caro:</strong>{" "}
                {real(Number(selectedYearStats.propertyMaxValue))}
              </p>
              <p>
                <strong>Imóvel mais barato:</strong>{" "}
                {real(Number(selectedYearStats.propertyMinValue))}
              </p>
              <p>
                <strong>Média dos imóveis:</strong>{" "}
                {real(
                  Number(
                    selectedYearStats.propertysValue /
                      selectedYearStats.propertyTotal
                  )
                )}
              </p>
              <p>
                <strong>Venda mais rápida:</strong> {selectedYearStats.timeMin}{" "}
                dias
              </p>
              <p>
                <strong>Venda mais demorada:</strong>{" "}
                {selectedYearStats.timeMax} dias
              </p>
            </div>
          </div>

          {selectedDeal && (
            <FinishDeal
              isOpen={isCloseOpen}
              deal={selectedDeal}
              onClose={() => {
                setIsCloseOpen(false);
                setSelectedDeal(null);
              }}
              onSubmit={closeDealShares}
              newStep={handleChangeStep}
            />
          )}
        </div>
      </main>
    </div>
  );
}
