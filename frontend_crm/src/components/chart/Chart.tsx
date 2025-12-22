"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import styles from "./Chart.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { DealShare } from "@/types";
const API = process.env.NEXT_PUBLIC_API_URL;

export default function ChartLayout() {
  const { token, isLoading } = useAuth();

  const router = useRouter();
  const [commissions, setCommissions] = useState<DealShare[] | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  function formatCommission() {
    const commissionList = Array.from({ length: 12 }, () => 0);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    if (commissions !== null) {
      for (const commission of commissions) {
        if (typeof commission.paidAt !== "string") continue;

        const paidDate = new Date(commission.paidAt);
        const paidMonth = paidDate.getMonth();
        const paidYear = paidDate.getFullYear();

        const monthDiff =
          (currentYear - paidYear) * 12 + (currentMonth - paidMonth);

        if (monthDiff >= 0 && monthDiff < 12) {
          commissionList[monthDiff] += Number(commission.amount);
        }
      }
    }

    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    const formatted = commissionList.map((value, index) => {
      const monthIndex = (currentMonth - index + 12) % 12;

      return {
        name: months[monthIndex],
        value: value,
      };
    });

    setChartData(formatted);
  }

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    async function fetchCommissions() {
      try {
        const res = await fetch(`${API}/chart-commissions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erro ao buscar compromissos");
        const data = await res.json();
        setCommissions(data);
      } catch (err) {
        console.log(err);
      }
    }

    fetchCommissions();
  }, [isLoading, token, router]);

  useEffect(() => {
    formatCommission();
  }, [commissions, formatCommission]);

  return (
    <div className={styles.main}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value) => {
              if (typeof value !== "number") return value ?? "R$ 0,00";

              return value.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              });
            }}
          />
          <Bar dataKey="value" fill="var(--accentColor)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
