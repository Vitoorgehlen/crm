"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";
import DealForm from "@/components/Deal/DealForm/DealForm";
import { ClientStatus, Deal, CloseDealPayload, User } from "@/types/index";
import { BsFileEarmarkPlus } from "react-icons/bs";
import { IoStar, IoStarOutline } from "react-icons/io5";
import { getDaysSinceLastContact } from "@/utils/getDaysLastContact";
import { useQueryState } from "nuqs";
import DealsHeader from "@/components/searchbar/page";
import { fetchDealsList, fetchMultipleDeals } from "@/utils/fetchDeals";

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

  const [users, setUsers] = useState<User[]>([]);

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [limit, setLimit] = useState(initialLimit);

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
    setSelectedDeal(null);
    router.push("/fechados");
    return;
  };

  const fetchDealsByStatus = async (
    statusClient: string,
    pageToFetch: number = 1,
  ) => {
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
        status: selectedStatusDeal,
        statusClient,
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

  const fetchAllStatusesData = useCallback(async () => {
    if (!token) return;
    setLoading(true);

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
    } finally {
      setLoading(false);
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
    const handleResize = () => {
      setLimit(window.innerWidth <= 768 ? 6 : 10);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const timer = setTimeout(() => {
      fetchAllStatusesData();
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
  ]);

  useEffect(() => {
    if (!token) return;
    fetchUsers();
  }, [token]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>
            {title}
            {teamDeals && " da equipe"}
          </h1>
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
              setSelectedUser={(user) => setUserId(user?.id?.toString() || "")}
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
              onClose={() => {
                setIsCreateOpen(false);
                setSelectedDeal(null);
              }}
              onSubmit={handleCreate}
            />
          )}
        </div>

        <div>
          {statusList.map((statusObj) => {
            const statusKey = statusObj.dbValue.toString().toLowerCase();
            const statusClass = (styles as any)[`status_${statusKey}`] ?? "";
            const currentDeals = dealsByStatus[statusObj.dbValue] || [];
            const currentPage = currentPageByStatus[statusObj.dbValue] || 1;
            const totalPages = totalPagesByStatus[statusObj.dbValue] || 1;

            return (
              <div
                className={`${styles.statusCard} ${statusClass}`}
                key={statusObj.dbValue}
              >
                <h4 className={styles.statusName}>{statusObj.label}</h4>

                {loading && currentDeals.length === 0 ? (
                  <div className={styles.loadingStatus}>
                    <p>Carregando negociações...</p>
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
                            className={`
                            ${
                              deal.client?.deleteRequest
                                ? styles.dealDelete
                                : deal.deleteRequest
                                  ? styles.dealDelete
                                  : styles.deal
                            }`}
                            onClick={() => openEdit(deal)}
                          >
                            {deal.client?.isPriority ? (
                              <div className={styles.titleCard}>
                                <IoStar
                                  className={styles.btnPriorityActiveCard}
                                />
                                <h4 className={styles.lastContact}>
                                  {getDaysSinceLastContact(
                                    deal.updatedAt ?? deal.createdAt ?? "",
                                  )}
                                </h4>
                              </div>
                            ) : (
                              <div className={styles.titleCard}>
                                <IoStarOutline
                                  className={styles.btnPriorityCard}
                                />
                                <h4 className={styles.lastContact}>
                                  {getDaysSinceLastContact(
                                    deal.updatedAt ?? deal.createdAt ?? "",
                                  )}
                                </h4>
                              </div>
                            )}

                            <h3>
                              {deal.client?.name || "Cliente não informado"}
                            </h3>
                            <h4>{statusObj.label}</h4>
                            {teamDeals && (
                              <h6>
                                {deal.creator?.name || "Usuário não encontrado"}
                              </h6>
                            )}
                          </button>
                        ))}
                    </div>

                    {totalPages > 1 && (
                      <div className={styles.pagination}>
                        <button
                          disabled={currentPage <= 1 || loading}
                          onClick={() =>
                            handlePageChange(statusObj.dbValue, currentPage - 1)
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
                            handlePageChange(statusObj.dbValue, currentPage + 1)
                          }
                        >
                          Próxima
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* Verificar se todos os status estão vazios */}
          {Object.values(dealsByStatus).every((deals) => deals.length === 0) &&
            !loading && (
              <div className={styles.noItens}>
                <p>Nenhuma negociação encontrada</p>
              </div>
            )}

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
        </div>
      </main>
    </div>
  );
}
