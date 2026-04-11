"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";
import DealForm from "@/components/Deal/DealForm/DealForm";
import { Deal } from "@/types/index";
import { BsFileEarmarkPlus } from "react-icons/bs";
import { FaCashRegister } from "react-icons/fa";
import { BsCashCoin } from "react-icons/bs";

import ExpenseCard from "@/components/commissions/Despesas/page";
import CommissionCard from "@/components/commissions/Comissoes/page";
import { useQueryState } from "nuqs";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Commissions() {
  const router = useRouter();
  const { token, permissions, isLoading } = useAuth();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [selectedYear, setSelectedYear] = useQueryState("year", {
    defaultValue: String(new Date().getFullYear()),
  });

  const [tab, setTab] = useQueryState("tab", {
    defaultValue: "commission",
  });
  const isOpenCommission = tab === "commission";
  const isOpenExpense = tab === "expense";

  const lastDay = new Date();
  lastDay.setMonth(lastDay.getMonth() + 1);
  lastDay.setDate(0);

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

  function getDealPaidTimestamp(deal: Deal): number | null {
    const dates = (deal.DealShare ?? [])
      .map((s) => s.paidAt)
      .filter(Boolean)
      .map((d) => new Date(d as string).getTime());

    if (dates.length === 0) return null;
    return Math.max(...dates);
  }

  const { paidDeals } = useMemo(() => {
    const paid: Deal[] = [];
    const pend: Deal[] = [];

    for (const d of deals) {
      const ts = getDealPaidTimestamp(d);
      if (ts !== null) paid.push(d);
      else pend.push(d);
    }

    return { paidDeals: paid };
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
    const year = Number(selectedYear) || new Date().getFullYear();
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

    if (currentYear === year) {
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

    try {
      const basePath = "/commissions";
      const params = new URLSearchParams();

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
    }
  }, [token]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const t = setTimeout(fetchDealsData, 150);
    return () => clearTimeout(t);
  }, [fetchDealsData, isLoading, token, router]);

  useEffect(() => {
    if (yearsSortedDesc.length > 0 && !selectedYear) {
      const lastYear = yearsSortedDesc[yearsSortedDesc.length - 1];
      setSelectedYear(String(lastYear));
    }
  }, [yearsSortedDesc, selectedYear]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.headerContent}>
          <div className={styles.title}>
            <h3>{isOpenCommission ? "Comissões" : "Despesas"}</h3>
          </div>
          <div className={styles.headerIcons}>
            <button
              className={`btn-action glass ${styles.btn}
                ${isOpenCommission && styles.btnActive}
              }`}
              onClick={() => {
                setTab("commission");
              }}
              type="button"
            >
              <BsCashCoin />
            </button>
            <button
              className={`btn-action glass ${styles.btn}
                ${isOpenExpense && styles.btnActive}
              }`}
              onClick={() => {
                setTab("expense");
              }}
              type="button"
            >
              <FaCashRegister />
            </button>
            {permissions.includes("DEAL_CREATE") && (
              <button
                className={`${styles.addDeal} btn-action glass`}
                onClick={openCreate}
                type="button"
              >
                <BsFileEarmarkPlus />
              </button>
            )}
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
        <div className={styles.cardBox}>
          {isOpenCommission && <CommissionCard deals={deals} />}
          {isOpenExpense && (
            <ExpenseCard selectedYearStats={selectedYearStats} />
          )}
        </div>
      </main>
    </div>
  );
}
