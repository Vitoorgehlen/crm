"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";
import DealForm from "@/components/Deal/DealForm/DealForm";
import {
  Deal,
  CloseDealPayload,
  DEAL_STEP_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  WORKFLOW_BY_METHOD,
  User,
  DealStepType,
} from "@/types/index";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { PaymentMethod } from "@/types/index";
import HeaderPage from "@/components/searchbar/page";
import DraggableCard from "@/components/Tools/draggableAndDroppable/draggableCard";
import DroppableColumn from "@/components/Tools/draggableAndDroppable/droppable";
import { useQueryState } from "nuqs";
import { fetchDealsList, fetchMultipleDeals } from "@/utils/fetchDeals";
import { getDaysSinceLastContact } from "@/utils/getDaysLastContact";
import ClosedDeal from "@/components/Deal/ClosedDeal/ClosedDeal";

const API = process.env.NEXT_PUBLIC_API_URL;
const LIMIT = 5;

export default function Deals() {
  const router = useRouter();
  const { token, permissions, isLoading } = useAuth();
  const [initialIsLoadind, setInitialIsLoadind] = useState(true);

  const [users, setUsers] = useState<User[]>([]);

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [limit, setLimit] = useState(LIMIT);

  const [search, setSearch] = useQueryState("search", {
    defaultValue: "",
  });

  const [teamDeals, setTeamDeals] = useQueryState("team", {
    defaultValue: false,
    parse: (v) => v === "true",
    serialize: (v) => String(v),
  });

  const [userId, setUserId] = useQueryState("userId", {
    defaultValue: "",
  });

  const selectedUser = users.find((u) => String(u.id) === userId) || null;

  const [isMobile, setIsMobile] = useState(false);
  const [dealsByMethod, setDealsByMethod] = useState<
    Record<PaymentMethod, Deal[]>
  >(
    Object.keys(WORKFLOW_BY_METHOD).reduce(
      (acc, method) => {
        acc[method as PaymentMethod] = [];
        return acc;
      },
      {} as Record<PaymentMethod, Deal[]>,
    ),
  );
  const [currentPageByMethod, setCurrentPageByMethod] = useState<
    Record<PaymentMethod, number>
  >({} as Record<PaymentMethod, number>);
  const [totalPagesByMethod, setTotalPagesByMethod] = useState<
    Record<PaymentMethod, number>
  >({} as Record<PaymentMethod, number>);

  const [loading, setLoading] = useState(false);

  const handleUpdateDealShare = useCallback((updatedDeal: Deal) => {
    setSelectedDeal((prev) => {
      if (prev?.id === updatedDeal.id) {
        return updatedDeal;
      }
      return prev;
    });

    setDealsByMethod((prev) => {
      const newState = { ...prev };
      const targetMethod = updatedDeal.paymentMethod as PaymentMethod;

      const index = newState[targetMethod]?.findIndex(
        (d) => d.id === updatedDeal.id,
      );

      if (index !== undefined && index !== -1) {
        newState[targetMethod][index] = updatedDeal;
      }

      return newState;
    });
  }, []);

  const findDealById = (dealId: number): Deal | undefined => {
    for (const method of Object.keys(dealsByMethod) as PaymentMethod[]) {
      const found = dealsByMethod[method].find((d) => d.id === dealId);
      if (found) return found;
    }
    return undefined;
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!over) return;

    const dealId = Number(active.id);
    const [methodFromDrop, newStep] = String(over.id).split("-") as [
      PaymentMethod,
      DealStepType,
    ];

    const deal = findDealById(dealId);
    if (!deal) return;

    const steps = WORKFLOW_BY_METHOD[deal.paymentMethod];

    if (!steps.includes(newStep)) {
      console.warn("Step inválido para esse método");
      return;
    }

    if (deal.paymentMethod !== methodFromDrop) {
      console.warn("Não pode mover entre métodos");
      return;
    }

    if (deal.currentStep === newStep) return;

    console.log({
      activeId: active.id,
      overId: over.id,
    });

    await handleChangeStepById(dealId, newStep);
  };

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 500,
        tolerance: 5,
      },
    }),
  );

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

    if (data.paymentMethod) {
      await fetchDealsByMethod(data.paymentMethod as PaymentMethod, 1);
    }
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

    const updatedDeal = data;
    const originalMethod = selectedDeal.paymentMethod;

    setDealsByMethod((prev) => {
      const newState = { ...prev };

      if (originalMethod !== updatedDeal.paymentMethod) {
        newState[originalMethod] = newState[originalMethod].filter(
          (d) => d.id !== updatedDeal.id,
        );
      }

      const targetMethod = updatedDeal.paymentMethod as PaymentMethod;
      const index = newState[targetMethod].findIndex(
        (d) => d.id === updatedDeal.id,
      );

      if (index !== -1) {
        newState[targetMethod][index] = updatedDeal;
      } else {
        newState[targetMethod] = [updatedDeal, ...newState[targetMethod]];
      }

      return newState;
    });

    setIsCloseOpen(false);
    setSelectedDeal(null);

    if (updatedDeal.paymentMethod) {
      await fetchDealsByMethod(updatedDeal.paymentMethod as PaymentMethod, 1);
    }
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
      },
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao mudar de passo");

    if (data.paymentMethod) {
      const currentPage =
        currentPageByMethod[data.paymentMethod as PaymentMethod] || 1;
      await fetchDealsByMethod(
        data.paymentMethod as PaymentMethod,
        currentPage,
      );
    }
    await fetchAllMethodData();
    setIsCloseOpen(false);
    setSelectedDeal(null);
    router.push("/fechados");
    return;
  };

  const handleChangeStepById = async (dealId: number, step: string) => {
    if (!token) {
      router.push("/login");
      return;
    }

    const res = await fetch(`${API}/deals-close-change-step-dnd/${dealId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ changeStep: step }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao mudar de passo");

    setDealsByMethod((prev) => {
      const newState = { ...prev };

      for (const method of Object.keys(newState) as PaymentMethod[]) {
        newState[method] = newState[method].filter((d) => d.id !== dealId);
      }

      return newState;
    });
    if (data.paymentMethod) {
      const currentPage =
        currentPageByMethod[data.paymentMethod as PaymentMethod] || 1;
      await fetchDealsByMethod(
        data.paymentMethod as PaymentMethod,
        currentPage,
      );
    }
    await fetchAllMethodData();
  };

  const fetchDealsByMethod = useCallback(
    async (paymentMethod: PaymentMethod, pageToFetch: number = 1) => {
      if (!token) return;
      setLoading(true);

      try {
        const result = await fetchDealsList({
          token,
          apiUrl: API!,
          search,
          teamDeals,
          userId,
          limit,
          page: pageToFetch,
          status: "CLOSED",
          paymentMethod,
        });

        setDealsByMethod((prev) => ({
          ...prev,
          [paymentMethod]: result.deals,
        }));

        setTotalPagesByMethod((prev) => ({
          ...prev,
          [paymentMethod]: Math.ceil(result.total / limit),
        }));

        setCurrentPageByMethod((prev) => ({
          ...prev,
          [paymentMethod]: pageToFetch,
        }));
      } catch (err: unknown) {
        console.error(err);
      } finally {
        setLoading(false);
        setInitialIsLoadind(false);
      }
    },
    [token, search, teamDeals, userId, limit],
  );

  const fetchAllMethodData = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const methods = Object.keys(WORKFLOW_BY_METHOD) as PaymentMethod[];

      const items = methods.map((method) => ({
        key: method,
        status: "CLOSED",
        paymentMethod: method,
      }));

      const results = await fetchMultipleDeals({
        token,
        apiUrl: API!,
        search,
        teamDeals,
        userId,
        limit,
        items,
      });

      const newDealsByMethod: Record<PaymentMethod, Deal[]> = {} as Record<
        PaymentMethod,
        Deal[]
      >;
      const newTotalPagesByMethod: Record<PaymentMethod, number> = {} as Record<
        PaymentMethod,
        number
      >;
      const newCurrentPageByMethod: Record<PaymentMethod, number> =
        {} as Record<PaymentMethod, number>;

      results.forEach((result) => {
        newDealsByMethod[result.key as PaymentMethod] = result.deals;
        newTotalPagesByMethod[result.key as PaymentMethod] = result.totalPages;
        newCurrentPageByMethod[result.key as PaymentMethod] = 1;
      });

      setDealsByMethod(newDealsByMethod);
      setTotalPagesByMethod(newTotalPagesByMethod);
      setCurrentPageByMethod(newCurrentPageByMethod);
    } catch (err: unknown) {
      console.error("Erro ao buscar deals:", err);
    } finally {
      setLoading(false);
      setInitialIsLoadind(false);
    }
  }, [token, search, teamDeals, userId, limit]);

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

  const handlePageChange = (paymentMethod: PaymentMethod, newPage: number) => {
    const totalPages = totalPagesByMethod[paymentMethod] || 1;
    if (newPage < 1 || newPage > totalPages) return;

    fetchDealsByMethod(paymentMethod, newPage);
  };

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const t = setTimeout(fetchAllMethodData, 400);
    fetchUsers();
    return () => clearTimeout(t);
  }, [fetchAllMethodData, isLoading, userId, token, fetchUsers, router]);

  useEffect(() => {
    const handleResize = () => {
      setLimit(window.innerWidth <= 768 ? 4 : LIMIT);
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <HeaderPage
          title="Negociações em andamento"
          search={search}
          setSearch={setSearch}
          teamMode={teamDeals}
          add={true}
          setTeamMode={setTeamDeals}
          users={users}
          selectedUser={selectedUser}
          setSelectedUser={(user) => setUserId(user?.id?.toString() || "")}
          permissions={permissions}
          onCreate={openCreate}
        />

        <div className={styles.box}>
          {isCreateOpen && (
            <DealForm
              mode="create"
              isOpen={isCreateOpen}
              deal={undefined}
              // clients={clients}
              onClose={() => {
                setIsCreateOpen(false);
                setSelectedDeal(null);
              }}
              onSubmit={handleCreate}
            />
          )}
        </div>

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          modifiers={
            isMobile ? [restrictToVerticalAxis] : [restrictToHorizontalAxis]
          }
        >
          <div className={styles.boxSteps}>
            {(Object.keys(WORKFLOW_BY_METHOD) as PaymentMethod[]).map(
              (method) => {
                const steps = WORKFLOW_BY_METHOD[method];
                const currentDeals = dealsByMethod[method] || [];
                const currentPage = currentPageByMethod[method] || 1;
                const totalPages = totalPagesByMethod[method] || 1;

                if (currentDeals.length === 0) return null;

                return (
                  <section key={method} className={styles.methodSection}>
                    <header className={styles.methodHeader}>
                      <h5>{PAYMENT_METHOD_LABEL[method]}</h5>
                      <span className={styles.methodCount}>
                        ({currentDeals.length})
                      </span>
                    </header>

                    <div className={styles.methodWorkflow}>
                      {steps.map((step) => {
                        const columnDeals = currentDeals.filter(
                          (d) => d.currentStep === step,
                        );
                        return (
                          <DroppableColumn
                            key={`${method}-${step}`}
                            id={`${method}-${step}`}
                          >
                            <div className={`glass ${styles.column}`}>
                              <p className={styles.stepName}>
                                {DEAL_STEP_TYPE_LABEL[step]}
                              </p>
                              <div className={styles.dealList}>
                                {columnDeals.map((dealItem) => (
                                  <DraggableCard
                                    key={String(dealItem.id)}
                                    deal={dealItem}
                                  >
                                    <button
                                      type="button"
                                      className={`glass ${styles.card}`}
                                      onClick={() => openEdit(dealItem)}
                                    >
                                      <h5>
                                        {dealItem.client?.name ||
                                          "Cliente não informado"}
                                      </h5>
                                      <span className={styles.lastContact}>
                                        {`Fechada: ${getDaysSinceLastContact(
                                          dealItem.closedAt ??
                                            dealItem.createdAt ??
                                            "",
                                        )}`}
                                      </span>
                                      {teamDeals && (
                                        <span>
                                          {dealItem.creator?.name ||
                                            "Usuário não encontrado"}
                                        </span>
                                      )}
                                    </button>
                                  </DraggableCard>
                                ))}

                                {columnDeals.length === 0 && (
                                  <div className={styles.noDeals}>—</div>
                                )}
                              </div>
                            </div>
                          </DroppableColumn>
                        );
                      })}
                    </div>
                    {totalPages > 1 && (
                      <div className={styles.pagination}>
                        <button
                          disabled={currentPage <= 1 || loading}
                          onClick={() =>
                            handlePageChange(method, currentPage - 1)
                          }
                        >
                          Anterior
                        </button>

                        <span>
                          {currentPage} / {totalPages}
                        </span>

                        <button
                          disabled={currentPage >= totalPages || loading}
                          onClick={() =>
                            handlePageChange(method, currentPage + 1)
                          }
                        >
                          Próxima
                        </button>
                      </div>
                    )}
                  </section>
                );
              },
            )}

            {Object.values(dealsByMethod).every(
              (deals) => deals.length === 0,
            ) &&
              !loading &&
              !initialIsLoadind && (
                <div className={styles.noItens}>
                  <h3>😭 Desculpe não encotramos nenhuma negociação...</h3>
                  <p>
                    Se o problema persistir entre em contato para corrigirmos
                    este erro.
                  </p>
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
                onUpdateDealShare={handleUpdateDealShare}
              />
            )}
          </div>
        </DndContext>
      </main>
    </div>
  );
}
