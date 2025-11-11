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
  User,
} from "@/types/index";
import { BsFileEarmarkPlus } from "react-icons/bs";
import { PaymentMethod } from "@/types/index";
import { fetchDeals } from "@/utils/fetchDeals";
import DealsHeader from "@/components/searchbar/page";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Deals() {
  const router = useRouter();
  const { token, permissions, isLoading } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
    fetchUsers();
    return () => clearTimeout(t);
  }, [fetchDealsData, isLoading, selectedUser, token, fetchUsers, router]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Negociações em andamento{teamDeals ? " da equipe" : ""}</h1>
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

          {deals.length === 0 && (
            <div className={styles.divError}>
              <p>Nenhuma negociação encontrada</p>
            </div>
          )}

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
    </div>
  );
}
