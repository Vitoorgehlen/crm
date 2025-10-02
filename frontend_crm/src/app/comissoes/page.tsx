"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";
import DealForm from "@/components/Deal/DealForm/DealForm";
import { Deal } from "@/types/index";
import { BsFileEarmarkPlus } from "react-icons/bs";
import { IoMdSearch } from "react-icons/io";
import { formatDateForFinish } from "@/utils/dateUtils";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function FinishDeals() {
  const router = useRouter();
  const { token, isLoading } = useAuth();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  function openCreate() {
    setIsCreateOpen(true);
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

  function getDealPaidTimestamp(deal: Deal): number | null {
    const dates = (deal.DealShare ?? [])
      .map((s) => s.paidAt)
      .filter(Boolean)
      .map((d) => new Date(d as string).getTime());

    if (dates.length === 0) return null;
    return Math.max(...dates);
  }

  const { paidDeals, pendingDeals } = useMemo(() => {
    const paid: Deal[] = [];
    const pend: Deal[] = [];

    for (const d of deals) {
      const ts = getDealPaidTimestamp(d);
      if (ts !== null) paid.push(d);
      else pend.push(d);
    }

    return { paidDeals: paid, pendingDeals: pend };
  }, [deals]);

  const groupedByYearMonth = useMemo(() => {
    const acc: Record<number, Record<number, Deal[]>> = {};
    for (const d of paidDeals) {
      const ts = getDealPaidTimestamp(d);
      if (ts === null) continue;
      const dt = new Date(ts);
      if (isNaN(dt.getTime())) continue;
      const y = dt.getFullYear();
      const m = dt.getMonth();
      acc[y] = acc[y] || {};
      acc[y][m] = acc[y][m] || [];
      acc[y][m].push(d);
    }
    return acc;
  }, [paidDeals]);

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

  const dealsForSelectedMonth = useMemo(() => {
    if (selectedYear == null || selectedMonth == null) return [];
    return groupedByYearMonth[selectedYear]?.[selectedMonth] ?? [];
  }, [groupedByYearMonth, selectedYear, selectedMonth]);

  const translateDealStep = (step: string | null | undefined): string => {
    if (!step) return "— Etapa";

    const stepTranslations: Record<string, string> = {
      CONTRACT_SIGNING: "Assinatura do Contrato",
      ENGINEERING_REVIEW: "Engenharia",
      BANK_APPROVAL: "Dossiê",
      ITBI: "ITBI",
      NOTARY_SIGNING: "Assinatura da Escritura",
      REGISTRATION: "Registro de Imóveis",
      AWAITING_PAYMENT: "Aguardando pagamento",
    };

    return stepTranslations[step] || step;
  };

  function real(v: number | undefined | null): string {
    if (typeof v !== "number" || !Number.isFinite(v)) return "R$ 0,00";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  const statsCash = useMemo(() => {
    let total = 0;
    let totalReceived = 0;
    let totalToReceive = 0;

    const yearlyStats: Record<
      number,
      {
        total: number;
        received: number;
        toReceived: number;
      }
    > = {};

    const monthlyStats: Record<
      number,
      Record<
        number,
        {
          total: number;
          received: number;
          toReceived: number;
        }
      >
    > = {};

    const ensureYear = (y: number) => {
      if (!yearlyStats[y]) {
        yearlyStats[y] = { total: 0, received: 0, toReceived: 0 };
      }
      if (!monthlyStats[y]) {
        monthlyStats[y] = {};
      }
      return yearlyStats[y];
    };

    const ensureMonth = (y: number, m: number) => {
      if (!monthlyStats[y]) monthlyStats[y] = {};
      if (!monthlyStats[y][m]) {
        monthlyStats[y][m] = { total: 0, received: 0, toReceived: 0 };
      }

      return monthlyStats[y][m];
    };

    for (const deal of deals) {
      if (!deal.DealShare || deal.DealShare.length === 0) continue;

      const endDate = new Date(String(deal.updatedAt));
      const dealYear = endDate.getFullYear();
      ensureYear(dealYear);

      for (const share of deal.DealShare) {
        const amount = Number(share.amount) || 0;
        const received = Number(share.received) || 0;
        const toReceive = amount - received;

        total += amount;
        totalReceived += received;
        totalToReceive += toReceive;

        const dateStr =
          share.paidAt ?? deal.updatedAt ?? deal.createdAt ?? null;
        const date = dateStr ? new Date(dateStr) : endDate;
        const year = date.getFullYear();
        const month = date.getMonth();
        const ystat = ensureYear(year);
        const mstat = ensureMonth(year, month);

        ystat.total += amount;
        ystat.received += received;
        ystat.toReceived += toReceive;

        mstat.total += amount;
        mstat.received += received;
        mstat.toReceived += toReceive;
      }
    }

    return {
      total,
      totalReceived,
      totalToReceive,
      yearlyStats,
      monthlyStats,
    };
  }, [deals]);

  const selectedYearStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const year = selectedYear ?? new Date().getFullYear();
    const stats = statsCash.yearlyStats[year] || {
      total: 0,
      received: 0,
      toReceived: 0,
      dealsFinish: 0,
      dealsToFinish: 0,
    };

    const lastYearStats = statsCash.yearlyStats[year - 1] || {
      total: 0,
      received: 0,
      toReceived: 0,
      dealsFinish: 0,
      dealsToFinish: 0,
    };

    const comparStats =
      lastYearStats.total > 0
        ? (Number(stats.total) * 100) / Number(lastYearStats.total)
        : 0;

    let comparStatsFair = 0;

    if (currentYear === selectedYear) {
      let currentYearSum = 0;
      let lastYearSum = 0;
      for (let month = 0; month <= currentMonth; month++) {
        const currentMonthData = statsCash.monthlyStats[year]?.[month] || {
          total: 0,
          received: 0,
          toReceived: 0,
          dealsFinish: 0,
          dealsToFinish: 0,
        };
        const lastMonthData = statsCash.monthlyStats[year - 1]?.[month] || {
          total: 0,
          received: 0,
          toReceived: 0,
          dealsFinish: 0,
          dealsToFinish: 0,
        };

        currentYearSum += Number(currentMonthData.total || 0);
        lastYearSum += Number(lastMonthData.total || 0);

        comparStatsFair =
          lastYearSum > 0 ? (currentYearSum * 100) / lastYearSum : 0;
      }
    }

    const isCurrentYear = year === new Date().getFullYear();
    const monthsInYear = isCurrentYear ? new Date().getMonth() + 1 : 12;
    const monthAverage = stats.received / Math.max(1, monthsInYear);

    return {
      year,
      total: stats.total,
      received: stats.received,
      toReceived: stats.toReceived,
      comparStats,
      comparStatsFair,
      monthAverage,
    };
  }, [statsCash.yearlyStats, statsCash.monthlyStats, selectedYear]);

  const fetchDealsData = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const basePath = "/commissions";
      const params = new URLSearchParams();
      if (search.trim()) params.set("name", search.trim());

      const url = `${API!}${basePath}${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Erro ao buscar as comissões.");
      const data = await response.json();

      setDeals(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, isLoading, search, router]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const t = setTimeout(fetchDealsData, 150);
    return () => clearTimeout(t);
  }, [fetchDealsData, isLoading, token]);

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
          <h1>Comissões</h1>
          {/* <h1>Comissões{teamDeals ? ' da equipe' : ''}</h1> */}
        </div>

        <div className={styles.headerContent}>
          <div className={styles.serchDeal}>
            <button
              className={styles.btnSearch}
              type="button"
              disabled={loading}
            >
              <IoMdSearch />
            </button>
            <input
              type="text"
              placeholder="Pesquise pelo nome"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.cashStatsCardRight}>
            <h2>{selectedYear ?? selectedYearStats.year}</h2>
          </div>

          <div className={styles.headerIcons}>
            {/* {permissions.includes('ALL_DEAL_READ') && (
              <button 
              className={`${styles.btnFilter} ${teamDeals ? styles.btnFilterActive : ''}`}
              onClick={() => setTeamDeals(prev => !prev)} 
              type="button">
                <HiUserGroup />
              </button>
            )} */}
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
              }}
              onSubmit={handleCreate}
            />
          )}
        </div>

        <div className={styles.boxSteps}>
          <div className={styles.finishedDealsByYearWrap}>
            <div className={styles.cashStatsCard}>
              <div className={styles.cashStatsCardLeft}>
                <div className={styles.cashStatsCardDiv}>
                  <div className={styles.cardLeft}>
                    <strong>Total de comissões: </strong>
                    <p>{real(Number(selectedYearStats.total))}</p>
                  </div>
                  <div className={styles.cardLeft1}>
                    <strong>Recebido:</strong>
                    <p>{real(Number(selectedYearStats.received))}</p>
                  </div>
                  <div className={styles.cardLeft2}>
                    <strong>Valor a receber:</strong>
                    <p>{real(Number(selectedYearStats.toReceived))}</p>
                  </div>
                  <div className={styles.cardLeft}>
                    <strong>Média mensal:</strong>
                    <p>{real(Number(selectedYearStats.monthAverage))}</p>
                  </div>
                  <div className={styles.cardLeft}>
                    <strong>
                      Comparação com {new Date().getFullYear() - 1}:
                    </strong>
                    <p>{selectedYearStats.comparStats.toFixed(2)}%</p>
                  </div>
                  <div className={styles.cardLeft}>
                    <strong>
                      Comparação até {monthNames[new Date().getMonth()]} de{" "}
                      {new Date().getFullYear() - 1}:
                    </strong>
                    <p>{selectedYearStats.comparStatsFair.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.yearButtons}>
              {yearsSortedDesc.length === 0 && (
                <p>Nenhuma comissão encontrada.</p>
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
                      .sort((a, b) => {
                        const paidAtA = getDealPaidTimestamp(a);
                        const paidAtB = getDealPaidTimestamp(b);

                        if (paidAtA !== null && paidAtB === null) return 1;
                        if (paidAtA === null && paidAtB !== null) return -1;

                        if (paidAtA !== null && paidAtB !== null) {
                          return paidAtB - paidAtA;
                        }
                        const updatedAtA = new Date(
                          a.updatedAt || a.createdAt || ""
                        ).getTime();
                        const updatedAtB = new Date(
                          b.updatedAt || b.createdAt || ""
                        ).getTime();
                        return updatedAtB - updatedAtA;
                      })
                      .map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className={styles.card}
                          onClick={() => router.push("/finalizados")}
                        >
                          <div>
                            <h3>{d.client?.name ?? "— Cliente"}</h3>
                            <div>
                              {formatDateForFinish(d.DealShare?.[0]?.paidAt)}
                            </div>
                            <div>
                              {d.DealShare?.map((share) => (
                                <div key={share.id}>
                                  <p>
                                    <strong>Recebido:</strong>{" "}
                                    {real(Number(share.amount))}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </button>
                      ))}
                    {dealsForSelectedMonth.length === 0 && (
                      <p>Selecione o mês desejado.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className={styles.pendingSection}>
            <h2>A receber</h2>
            {pendingDeals.length === 0 ? (
              <p>Sem comissões a receber.</p>
            ) : (
              <div className={styles.pendingList}>
                {pendingDeals
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt || b.updatedAt || 0).getTime() -
                      new Date(a.createdAt || a.updatedAt || 0).getTime()
                  )
                  .map((d) => (
                    <div
                      key={d.id}
                      className={styles.pendingCard}
                      onClick={() => router.push("/fechados")}
                    >
                      <div>
                        <h4>{d.client?.name ?? "— Cliente"}</h4>
                        <p>
                          <strong>Etapa:</strong>{" "}
                          {translateDealStep(d.currentStep)}
                        </p>
                        <div>
                          {d.DealShare?.map((share) => (
                            <div key={share.id}>
                              <h6>
                                <strong>Total:</strong>{" "}
                                {real(Number(share.amount))}
                              </h6>
                              <h6>
                                <strong>Recebido:</strong>{" "}
                                {real(Number(share.received))}
                              </h6>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className={styles.footer}></footer>
    </div>
  );
}
