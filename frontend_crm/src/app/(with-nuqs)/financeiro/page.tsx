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
import { HiMiniUserGroup } from "react-icons/hi2";
import { FaPeopleRoof } from "react-icons/fa6";

import ExpenseCard from "@/components/financial/Financeiro/page";
import CommissionCard from "@/components/financial/Comissoes/page";
import { useQueryState } from "nuqs";
import Tooltip from "@/components/Tools/Tooltip/Tooltip";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Commissions() {
  const router = useRouter();
  const { token, permissions, isLoading, planRules } = useAuth();

  const expensePlan = planRules?.includes("EXPENSE_DASHBOARD");

  const [deals, setDeals] = useState<Deal[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [selectedYear, setSelectedYear] = useQueryState("year", {
    defaultValue: String(new Date().getFullYear()),
  });

  const [tab, setTab] = useQueryState("tab", {
    defaultValue: "commission",
  });
  const isOpenCommission = tab === "commission";
  const isOpenTeamCommission = tab === "team-commission";
  const isOpenCompanyCommission = tab === "company-commission";
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

  // const statsCash = useMemo(() => {
  //   let total = 0;
  //   let totalReceived = 0;
  //   let totalToReceive = 0;

  //   const yearlyStats: Record<
  //     number,
  //     {
  //       total: number;
  //       received: number;
  //       toReceived: number;
  //     }
  //   > = {};

  //   const monthlyStats: Record<
  //     number,
  //     Record<
  //       number,
  //       {
  //         total: number;
  //         received: number;
  //         toReceived: number;
  //       }
  //     >
  //   > = {};

  //   const ensureYear = (y: number) => {
  //     if (!yearlyStats[y]) {
  //       yearlyStats[y] = { total: 0, received: 0, toReceived: 0 };
  //     }
  //     if (!monthlyStats[y]) {
  //       monthlyStats[y] = {};
  //     }
  //     return yearlyStats[y];
  //   };

  //   const ensureMonth = (y: number, m: number) => {
  //     if (!monthlyStats[y]) monthlyStats[y] = {};
  //     if (!monthlyStats[y][m]) {
  //       monthlyStats[y][m] = { total: 0, received: 0, toReceived: 0 };
  //     }

  //     return monthlyStats[y][m];
  //   };

  //   for (const deal of deals) {
  //     if (!deal.DealShare || deal.DealShare.length === 0) continue;

  //     const endDate = new Date(String(deal.updatedAt));
  //     const dealYear = endDate.getFullYear();
  //     ensureYear(dealYear);

  //     for (const share of deal.DealShare) {
  //       const amount = Number(share.amount) || 0;
  //       const received = Number(share.received) || 0;
  //       const toReceive = amount - received;

  //       total += amount;
  //       totalReceived += received;
  //       totalToReceive += toReceive;

  //       const dateStr =
  //         share.paidAt ?? deal.updatedAt ?? deal.createdAt ?? null;
  //       const date = dateStr ? new Date(dateStr) : endDate;
  //       const year = date.getFullYear();
  //       const month = date.getMonth();
  //       const ystat = ensureYear(year);
  //       const mstat = ensureMonth(year, month);

  //       ystat.total += amount;
  //       ystat.received += received;
  //       ystat.toReceived += toReceive;

  //       mstat.total += amount;
  //       mstat.received += received;
  //       mstat.toReceived += toReceive;
  //     }
  //   }

  //   return {
  //     total,
  //     totalReceived,
  //     totalToReceive,
  //     yearlyStats,
  //     monthlyStats,
  //   };
  // }, [deals]);

  const fetchDealsData = useCallback(async () => {
    if (!token) return;

    try {
      const params = new URLSearchParams();
      if (isOpenCompanyCommission) params.set("company", "true");
      if (isOpenTeamCommission) params.set("team", "true");

      const url = `${API!}/commissions${
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
  }, [token, isOpenCommission, isOpenCompanyCommission, isOpenTeamCommission]);

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
            <h3>{isOpenExpense ? "Despesas" : "Comissões"}</h3>
            <h5>{isOpenCommission && "próprias"}</h5>
            <h5>{isOpenTeamCommission && "da equipe"}</h5>
            <h5>
              {(isOpenCompanyCommission || isOpenExpense) && "da empresa"}
            </h5>
          </div>
          <div className={styles.headerIcons}>
            <Tooltip label={"Suas comissões"}>
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
            </Tooltip>

            {permissions.includes("EXPENSE_READ") && expensePlan && (
              <Tooltip label={"Comissões da equipe"}>
                <button
                  className={`btn-action glass ${styles.btn}
                ${isOpenTeamCommission && styles.btnActive}
              }`}
                  onClick={() => {
                    setTab("team-commission");
                  }}
                  type="button"
                >
                  <HiMiniUserGroup />
                </button>
              </Tooltip>
            )}

            {permissions.includes("EXPENSE_READ") && expensePlan && (
              <Tooltip label={"Comissões da empresa"}>
                <button
                  className={`btn-action glass ${styles.btn}
                ${isOpenCompanyCommission && styles.btnActive}
              }`}
                  onClick={() => {
                    setTab("company-commission");
                  }}
                  type="button"
                >
                  <FaPeopleRoof />
                </button>
              </Tooltip>
            )}

            {permissions.includes("EXPENSE_READ") && expensePlan && (
              <Tooltip label={"Despesas"}>
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
              </Tooltip>
            )}

            {permissions.includes("DEAL_CREATE") && (
              <Tooltip label={"Adicionar negociação"}>
                <button
                  className={`btn-action glass ${styles.addDeal}`}
                  onClick={openCreate}
                  type="button"
                >
                  <BsFileEarmarkPlus />
                </button>
              </Tooltip>
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
          {isOpenCommission && (
            <CommissionCard deals={deals} mode={"default"} />
          )}
          {isOpenCompanyCommission && (
            <CommissionCard deals={deals} mode={"company"} />
          )}
          {isOpenTeamCommission && (
            <CommissionCard deals={deals} mode={"team"} />
          )}
          {isOpenExpense && expensePlan && <ExpenseCard />}
        </div>
      </main>
    </div>
  );
}
