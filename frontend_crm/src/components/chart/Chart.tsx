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
import { useAuth } from "@/contexts/AuthContext";
import { DealShare } from "@/types";
const API = process.env.NEXT_PUBLIC_API_URL;

export default function ChartLayout() {
  const { token, isLoading } = useAuth();

  const router = useRouter();
  const [commissions, setCommissions] = useState<DealShare[] | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!commissions) return;

    const commissionList = Array.from({ length: 12 }, () => 0);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

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
  }, [commissions]);

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

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="var(--textBase)" />

          <YAxis stroke="var(--textBase)" />
          <Tooltip
            cursor={{ fill: "var(--sidebarBackground)" }}
            contentStyle={{
              backgroundColor: "var(--sidebarBackground)",
              border: "1px solid var(--primaryColor)",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "var(--primaryText)" }}
            itemStyle={{ color: "var(--primaryColor)" }}
          />
          <Bar
            dataKey="value"
            fill="var(--textBase)"
            activeBar={{ fill: "var(--primaryColor)" }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
