"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ClientStatus, Deal, CloseDealPayload, User } from "@/types/index";
import { IoCloseOutline, IoStar, IoStarOutline } from "react-icons/io5";
import { getDaysSinceLastContact } from "@/utils/getDaysLastContact";
import { useQueryState } from "nuqs";
import { fetchDealsList, fetchMultipleDeals } from "@/utils/fetchDeals";
import { getTotal } from "@/utils/sumPreviusDocs";
import { FaArrowAltCircleLeft, FaArrowAltCircleRight } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import HeaderPage from "@/components/searchbar/page";
import DealForm from "@/components/Deal/DealForm/DealForm";
import styles from "./page.module.css";
import Confetti from "@/components/Tools/Confetti/CloseConfetti";

const API = process.env.NEXT_PUBLIC_API_URL;
interface DealListProps {
  selectedStatusDeal: "POTENTIAL_CLIENTS" | "OLD_CLIENTS";
  title: string;
  limit: number;
}

export default function DealList({
  selectedStatusDeal,
  title,
  limit: initialLimit,
}: DealListProps) {
  const router = useRouter();
  const { token, permissions, isLoading } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);

  const [dealId, setDealId] = useQueryState("dealId");
  const [users, setUsers] = useState<User[]>([]);

  const [showConfetti, setShowConfetti] = useState(false);

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit] = useState(initialLimit);
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

  const [loading, setLoading] = useState(false);

  const [dealsByStatus, setDealsByStatus] = useState<Record<string, Deal[]>>(
    {},
  );
  const [currentPageByStatus, setCurrentPageByStatus] = useState<
    Record<string, number>
  >({});
  const [totalPagesByStatus, setTotalPagesByStatus] = useState<
    Record<string, number>
  >({});

  const statusList = useMemo(
    () =>
      selectedStatusDeal === "POTENTIAL_CLIENTS"
        ? Object.values(ClientStatus).filter(
            (statusObj) =>
              statusObj.dbValue !== "REJECTED" &&
              statusObj.dbValue !== "DROPPED_OUT",
          )
        : Object.values(ClientStatus).filter(
            (statusObj) =>
              statusObj.dbValue === "REJECTED" ||
              statusObj.dbValue === "DROPPED_OUT",
          ),
    [selectedStatusDeal],
  );

  const visibleStatusList = dealId
    ? statusList
    : statusList.filter(
        (statusObj) => (dealsByStatus[statusObj.dbValue] || []).length > 0,
      );

  function sumTotal(deal: Deal) {
    const total = getTotal(
      deal.paymentMethod,
      Number(deal.downPaymentValue || 0),
      Number(deal.subsidyValue || 0),
      Number(deal.cashValue || 0),
      Number(deal.fgtsValue || 0),
      Number(deal.financingValue || 0),
      Number(deal.creditLetterValue || 0),
    );
    if (total <= 0) return "R$ 0,00";
    const totalCash = total.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    const text =
      deal.paymentMethod === "FINANCING"
        ? "Financiado"
        : deal.paymentMethod === "CASH"
          ? "Á Vista"
          : deal.paymentMethod === "CREDIT_LETTER"
            ? "Com carta de crédito"
            : "";
    return `${totalCash} ${text}`;
  }

  function openCreate() {
    setIsCreateOpen(true);
    setSelectedDeal(null);
  }

  function openEdit(deal: Deal) {
    setIsEditOpen(true);
    setSelectedDeal(deal);
  }

  function handleDeleteDeal() {
    fetchAllStatusesData();
    setIsEditOpen(false);
    setSelectedDeal(null);
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

    await fetchAllStatusesData();
  };

  const handleEdit = async (payload: Partial<Deal>) => {
    if (!selectedDeal?.id) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const res = await fetch(`${API}/deals/${selectedDeal.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro");

    await fetchAllStatusesData();
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

    await fetchAllStatusesData();

    setShowConfetti(true);

    setTimeout(() => {
      setShowConfetti(false);
      setTimeout(() => {
        setSelectedDeal(null);
        router.push("/fechados");
      }, 300);
    }, 4500);

    return;
  };

  const fetchDealsByStatus = async (
    statusClient: string,
    pageToFetch: number = 1,
  ) => {
    if (!token) return;
    setLoading(true);

    if (dealId) {
      await fetchDealById();
      return;
    }

    try {
      const result = await fetchDealsList({
        token,
        apiUrl: API!,
        search,
        teamDeals,
        userId,
        limit,
        page: pageToFetch,
        status: selectedStatusDeal,
        statusClient,
        dealId,
      });

      setDealsByStatus((prev) => ({
        ...prev,
        [statusClient]: result.deals,
      }));

      setTotalPagesByStatus((prev) => ({
        ...prev,
        [statusClient]: Math.ceil(result.total / limit),
      }));

      setCurrentPageByStatus((prev) => ({
        ...prev,
        [statusClient]: pageToFetch,
      }));
    } catch (err: unknown) {
      console.error(`Erro ao buscar deals do status ${statusClient}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDealById = useCallback(async () => {
    if (!token || !dealId) return;
    setError(null);
    setLoading(true);

    const params = new URLSearchParams();
    params.append("dealId", dealId);

    try {
      const res = await fetch(`${API}/team-deals?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");

      if (data.data && data.data.length > 0) {
        setSelectedDeal(data.data[0]);
        // setIsEditOpen(true);
        setDealsByStatus({
          [data.data[0].statusClient]: [data.data[0]],
        });
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao buscar negociações.");
    } finally {
      setLoading(false);
    }
  }, [token, dealId]);

  const fetchAllStatusesData = useCallback(async () => {
    if (!token) return;
    setError(null);
    setLoading(true);

    if (dealId) {
      await fetchDealById();
      return;
    }

    try {
      const items = statusList.map((statusObj) => ({
        key: statusObj.dbValue,
        status: selectedStatusDeal,
        statusClient: statusObj.dbValue,
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

      const newDealsByStatus: Record<string, Deal[]> = {};
      const newTotalPagesByStatus: Record<string, number> = {};
      const newCurrentPageByStatus: Record<string, number> = {};

      results.forEach((result) => {
        newDealsByStatus[result.key] = result.deals;
        newTotalPagesByStatus[result.key] = result.totalPages;
        newCurrentPageByStatus[result.key] = 1;
      });

      setDealsByStatus(newDealsByStatus);
      setTotalPagesByStatus(newTotalPagesByStatus);
      setCurrentPageByStatus(newCurrentPageByStatus);
    } catch (err: unknown) {
      console.error("Erro ao buscar deals:", err);
      setError("Erro ao buscar negociações.");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [token, search, teamDeals, userId, limit, selectedStatusDeal, statusList]);

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

  const handlePageChange = (statusClient: string, newPage: number) => {
    const totalPages = totalPagesByStatus[statusClient] || 1;
    if (newPage < 1 || newPage > totalPages) return;

    fetchDealsByStatus(statusClient, newPage);
  };

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const timer = setTimeout(() => {
      if (dealId) {
        fetchDealById();
      } else {
        fetchAllStatusesData();
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    isLoading,
    token,
    search,
    teamDeals,
    userId,
    fetchAllStatusesData,
    router,
    fetchDealById,
  ]);

  useEffect(() => {
    if (!token) return;
    fetchUsers();
  }, [token]);

  useEffect(() => {
    if (!dealId) {
      setIsEditOpen(false);
      setSelectedDeal(null);
      return;
    }

    const allDeals = Object.values(dealsByStatus).flat();
    const deal = allDeals.find((d) => String(d.id) === dealId);

    if (deal && userId) {
      setSelectedDeal(deal);
      setIsEditOpen(true);
    }
  }, [dealId, dealsByStatus]);

  return (
    <div className={styles.page}>
      {showConfetti && <Confetti />}

      <main className={styles.main}>
        <HeaderPage
          title={title}
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
          showClearButton={!!dealId}
        />

        {dealId && (
          <div className={styles.btnUncheck}>
            <button
              className={`btn-action glass ${styles.uncheck}`}
              onClick={() => {
                setDealId(null);
                setTeamDeals(false);
              }}
            >
              <IoCloseOutline />
            </button>
          </div>
        )}

        {error ? (
          <div className={styles.noItens}>
            <h3>⚠️ Erro ao carregar negociações</h3>
            <p>Tente novamente ou entre em contato se persistir.</p>
          </div>
        ) : Object.values(dealsByStatus).every((deals) => deals.length === 0) &&
          !loading &&
          !initialLoading ? (
          <div className={styles.noItens}>
            <h3>😭 Nenhuma negociação encontrada...</h3>
            <p>Tente ajustar os filtros ou criar uma nova negociação.</p>
          </div>
        ) : (
          <div className={styles.cardsDeals}>
            {visibleStatusList.map((statusObj) => {
              const statusKey = statusObj.dbValue.toString().toLowerCase();
              const statusClass = (styles as any)[`status_${statusKey}`] ?? "";
              const currentDeals = dealsByStatus[statusObj.dbValue] || [];
              const currentPage = currentPageByStatus[statusObj.dbValue] || 1;
              const totalPages = totalPagesByStatus[statusObj.dbValue] || 1;

              return currentDeals.length === 0 ? null : (
                <div
                  className={`${styles.statusCard} ${statusClass}`}
                  key={statusObj.dbValue}
                >
                  {totalPages > 1 ? (
                    <div className={styles.pagination}>
                      <button
                        className={`
                            arrow-pagination ${
                              (currentPage <= 1 || loading) &&
                              "arrow-pagination-disable"
                            }
                            `}
                        onClick={() =>
                          handlePageChange(statusObj.dbValue, currentPage - 1)
                        }
                      >
                        <FaArrowAltCircleLeft />
                      </button>
                      <div className={styles.displayNamePage}>
                        <h4>{statusObj.label}</h4>
                        <span>
                          <span className={styles.currentPage}>
                            {currentPage}
                          </span>
                          /{totalPages}
                        </span>
                      </div>

                      <button
                        className={`
                            arrow-pagination ${
                              (currentPage >= totalPages || loading) &&
                              "arrow-pagination-disable"
                            }
                              `}
                        onClick={() =>
                          handlePageChange(statusObj.dbValue, currentPage + 1)
                        }
                      >
                        <FaArrowAltCircleRight />
                      </button>
                    </div>
                  ) : (
                    <h4 className={styles.statusName}>{statusObj.label}</h4>
                  )}
                  {loading && currentDeals.length === 0 ? (
                    <div className={styles.loadingStatus}>
                      <AiOutlineLoading3Quarters />
                    </div>
                  ) : (
                    <>
                      <div className={styles.dealList}>
                        {currentDeals
                          .slice()
                          .sort(
                            (a, b) =>
                              (b.client?.isPriority ? 1 : 0) -
                              (a.client?.isPriority ? 1 : 0),
                          )
                          .map((deal, index) => (
                            <button
                              key={deal.id || index}
                              type="button"
                              className={`glass ${styles.deal}
                              ${(deal.client?.deleteRequest || deal.deleteRequest) && "glass-danger"}`}
                              onClick={() => openEdit(deal)}
                            >
                              <div className={styles.dealInfos}>
                                <div className={styles.dealHeader}>
                                  {deal.client?.isPriority ? (
                                    <IoStar className={styles.btnPriority} />
                                  ) : (
                                    <IoStarOutline />
                                  )}

                                  <h5>
                                    {deal.client?.name ||
                                      "Cliente não informado"}
                                  </h5>
                                  <div></div>
                                </div>
                                <div className={styles.dealFooter}>
                                  <p className={styles.lastContact}>
                                    {getDaysSinceLastContact(
                                      deal.updatedAt ?? deal.createdAt ?? "",
                                    )}
                                  </p>
                                  <span>{sumTotal(deal)}</span>
                                  <p className={styles.lastContactInvisible}>
                                    {getDaysSinceLastContact(
                                      deal.updatedAt ?? deal.createdAt ?? "",
                                    )}
                                  </p>
                                </div>
                                {teamDeals && (
                                  <span className={styles.user}>
                                    {deal.creator?.name || ""}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedDeal && (
        <DealForm
          mode="edit"
          isOpen={isEditOpen}
          deal={selectedDeal}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedDeal(null);
          }}
          onSubmit={handleEdit}
          onCloseDeal={closeDealShares}
          onDelete={handleDeleteDeal}
        />
      )}

      {isCreateOpen && (
        <DealForm
          mode="create"
          isOpen={isCreateOpen}
          deal={undefined}
          onClose={() => {
            setIsCreateOpen(false);
            setSelectedDeal(null);
            setDealId(null);
          }}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
