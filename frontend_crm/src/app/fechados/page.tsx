"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";
import DealForm from "@/components/Deal/DealForm/DealForm";
import ClosedDeal from "@/components/Deal/ClosedDeal/ClosedDeal";
import {
  Client,
  Deal,
  CloseDealPayload,
  DEAL_STEP_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  WORKFLOW_BY_METHOD,
} from "@/types/index";
import { BsFileEarmarkPlus } from "react-icons/bs";
import { IoMdSearch } from "react-icons/io";
import { HiUserGroup } from "react-icons/hi2";
import { PaymentMethod } from "@/types/index";
import { fetchDeals } from "@/utils/fetchDeals";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Deals() {
  const router = useRouter();
  const { token, permissions, isLoading } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [teamDeals, setTeamDeals] = useState(false);

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

  const fetchDealsData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchDeals(API!, token, {
        team: teamDeals,
        search,
        status: ["CLOSED"],
      });
      setDeals(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, search, teamDeals]);

  useEffect(() => {
    let mounted = true;
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    async function fetchClients() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erro ao buscar clientes");
        const data = await res.json();
        if (!mounted) return;
        setClients(data);
      } catch (err: unknown) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchClients();
    return () => {
      mounted = false;
    };
  }, [token, isLoading, router]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const t = setTimeout(fetchDealsData, 150);
    return () => clearTimeout(t);
  }, [fetchDealsData, isLoading, token, router]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Negociações em andamento{teamDeals ? " da equipe" : ""}</h1>
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

          <div className={styles.headerIcons}>
            {permissions.includes("ALL_DEAL_READ") && (
              <button
                className={`${styles.btnFilter} ${
                  teamDeals ? styles.btnFilterActive : ""
                }`}
                onClick={() => setTeamDeals((prev) => !prev)}
                type="button"
              >
                <HiUserGroup />
              </button>
            )}
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
              clients={clients}
              onClose={() => {
                setIsCreateOpen(false);
                setSelectedDeal(null);
              }}
              onSubmit={handleCreate}
            />
          )}
        </div>

        <div className={styles.boxSteps}>
          {(Object.keys(WORKFLOW_BY_METHOD) as PaymentMethod[]).map(
            (method) => {
              const steps = WORKFLOW_BY_METHOD[method];
              const dealsForMethod = deals.filter(
                (d) => d.paymentMethod === method
              );
              if (dealsForMethod.length === 0) return null;

              return (
                <section key={method} className={styles.methodSection}>
                  <header className={styles.methodHeader}>
                    <h3>{PAYMENT_METHOD_LABEL[method]}</h3>
                    <h4 className={styles.methodCount}>
                      {dealsForMethod.length}{" "}
                      {dealsForMethod.length === 1
                        ? "negociação"
                        : "negociações"}
                    </h4>
                  </header>

                  <div className={styles.methodWorkflow}>
                    {steps.map((step) => {
                      const columnDeals = dealsForMethod.filter(
                        (d) => d.currentStep === step
                      );
                      return (
                        <div className={styles.column} key={String(step)}>
                          <h5 className={styles.stepName}>
                            {DEAL_STEP_TYPE_LABEL[step]}
                          </h5>
                          <div className={styles.dealList}>
                            {columnDeals.map((dealItem) => (
                              <button
                                key={dealItem.id}
                                type="button"
                                className={styles.card}
                                onClick={() => openEdit(dealItem)}
                              >
                                <h3>
                                  {dealItem.client?.name ||
                                    "Cliente não informado"}
                                </h3>
                                {teamDeals && (
                                  <h6>
                                    {dealItem.creator?.name ||
                                      "Usuário não encontrado"}
                                  </h6>
                                )}
                              </button>
                            ))}

                            {columnDeals.length === 0 && (
                              <div className={styles.noDeals}>—</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            }
          )}

          {deals.length === 0 && <p>Nenhuma negociação encontrada</p>}

          {selectedDeal && (
            <ClosedDeal
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

      <footer className={styles.footer}></footer>
    </div>
  );
}
