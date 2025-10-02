"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";
import DealForm from "@/components/Deal/DealForm/DealForm";
import { ClientStatus, Client, Deal } from "@/types/index";
import { BsFileEarmarkPlus } from "react-icons/bs";
import { IoMdSearch } from "react-icons/io";
import { HiUserGroup } from "react-icons/hi2";
import { fetchDeals } from "@/utils/fetchDeals";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Deals() {
  const router = useRouter();
  const { token, permissions, isLoading } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [teamDeals, setTeamDeals] = useState(false);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchDealsData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchDeals(API!, token, {
        team: teamDeals,
        search,
        status: ["OLD_CLIENTS"],
      });
      setDeals(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, isLoading, search, teamDeals, router]);

  function openCreate() {
    setIsCreateOpen(true);
    setSelectedDeal(null);
  }

  function openEdit(deal: Deal) {
    setIsEditOpen(true);
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

    setDeals((prev) => prev.map((d) => (d.id === data.id ? data : d)));
    await fetchDealsData();
  };

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
  }, [fetchDealsData, isLoading, token]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>
            {teamDeals
              ? "Negociações arquivadas da equipe"
              : "Negociações arquivadas"}
          </h1>
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

        <div>
          {Object.values(ClientStatus)
            .filter((statusObj) =>
              deals.some((deal) => deal.statusClient === statusObj.dbValue)
            )
            .map((statusObj) => {
              const statusKey = statusObj.dbValue.toString().toLowerCase();
              const statusClass = (styles as any)[`status_${statusKey}`] ?? "";
              return (
                <div
                  className={`${styles.statusCard} ${statusClass}`}
                  key={statusObj.dbValue}
                >
                  <h4 className={styles.statusName}>{statusObj.label}</h4>
                  <div className={styles.dealList}>
                    {deals
                      .filter((deal) => deal.statusClient === statusObj.dbValue)
                      .map((deal, index) => (
                        <button
                          key={index}
                          type="button"
                          className={styles.deal}
                          onClick={() => openEdit(deal)}
                        >
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
                </div>
              );
            })}
          {/* {Object.values(ClientStatus)
            .filter(statusObj => 
              deals.some(deal => deal.statusClient === statusObj.dbValue)
            )
            .map(statusObj => (
              <div key={statusObj.dbValue}>
                <h4  className={styles.statusName}>{statusObj.label}</h4>
                <div className={styles.dealList}>
                  {deals
                    .filter(deal => deal.statusClient === statusObj.dbValue)
                    .map((deal, index) => (
                      <button
                        key={index}
                        type="button"
                        className={styles.deal}
                        onClick={() => openEdit(deal)}
                      >
                        <h3>{deal.client?.name || 'Cliente não informado'}</h3>
                        <h4>{statusObj.label}</h4>
                      </button>
                    ))
                  }
                </div>
              </div>
            ))
          } */}
          {deals.length === 0 && <p>Nenhuma negociação encontrada</p>}

          {isEditOpen && (
            <DealForm
              mode="edit"
              isOpen={isEditOpen}
              deal={selectedDeal}
              clients={clients}
              onClose={() => {
                setIsEditOpen(false);
                setSelectedDeal(null);
              }}
              onSubmit={handleEdit}
            />
          )}
        </div>
      </main>

      <footer className={styles.footer}></footer>
    </div>
  );
}
