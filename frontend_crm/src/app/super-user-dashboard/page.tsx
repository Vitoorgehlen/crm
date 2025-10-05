"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";
import { MdEdit, MdOutlinePowerOff } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";
import { IoMdCheckmark, IoMdClose } from "react-icons/io";
import { User } from "@/types";
import { IoMdPersonAdd } from "react-icons/io";
import { AddAdmin } from "./add-admin";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Company {
  id: number;
  name: string;
  maxUsers: number;
}

export default function SuperUserPage() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyUsers, setCompanyUsers] = useState<number | undefined>(
    undefined
  );
  const [users, setUsers] = useState<User[]>([]);
  const [isOpenCreateUsers, setIsOpenCreateUsers] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const payload = {
        name: companyName,
        maxUsers: companyUsers,
      };

      let response: Response;
      if (selectedCompany && selectedCompany.id) {
        response = await fetch(`${API}/company/${selectedCompany.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${API}/company`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Erro ao salvar o empresa");

      if (selectedCompany) {
        setCompanies((prev) => prev.map((c) => (c.id === data.id ? data : c)));
        setSelectedCompany(null);
      } else {
        setCompanies((prev) => [...prev, data]);
      }

      setCompanyName("");
      setCompanyUsers(undefined);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro inesperado");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(company: Company) {
    if (loading) return;

    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir ${company.name}?`
    );
    if (!confirmDelete) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/company/${company.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Erro ao apagar a empresa");

      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
      setSelectedCompany(null);

      setCompanyName("");
      setCompanyUsers(undefined);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro inesperado");
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    if (!selectedCompany) return;
    setLoading(true);

    try {
      const res = await fetch(`${API}/super-user/users/${selectedCompany.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar Usuários");
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.users)
        ? data.users
        : [];
      setUsers(list);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      logout();

      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;

    const fetchCompanies = async () => {
      try {
        const res = await fetch(`${API}/company`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.companies)
          ? data.companies
          : [];
        setCompanies(list);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [token, fetchUsers]);

  useEffect(() => {
    if (!selectedCompany) {
      setUsers([]);
      return;
    }
    fetchUsers();
  }, [selectedCompany]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Configurações</h1>
        </div>

        <div className={styles.content}>
          <div className={styles.createCompany}>
            <div className={styles.createCompanyBox}>
              <input
                className={styles.labelCreateCompany}
                type="text"
                placeholder="Nome"
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <input
                className={styles.labelCreateCompany}
                type="number"
                placeholder="MaxUsers"
                onChange={(e) => setCompanyUsers(Number(e.target.value))}
              />

              <button
                className={styles.btnSave}
                onClick={(e) => handleSubmit(e)}
              >
                <h4>Criar compania</h4>
              </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
          </div>
          <div className={styles.companies}>
            {companies.length === 0 ? (
              <p>Nenhuma empresa cadastrada</p>
            ) : (
              companies.map((company) => {
                const isSelected = selectedCompany?.id === company.id;

                return isSelected ? (
                  <div key={company.id} className={styles.company}>
                    <div key={company.id} className={styles.companyContent}>
                      <div className={styles.companyInfos}>
                        <input
                          className={styles.labelCreateCompany}
                          type="text"
                          placeholder="Nome"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                        />
                        <input
                          className={styles.labelCreateCompany}
                          type="number"
                          placeholder="MaxUsers"
                          value={companyUsers}
                          onChange={(e) =>
                            setCompanyUsers(Number(e.target.value))
                          }
                        />
                      </div>
                      <button
                        className={styles.btnOpenCompany}
                        onClick={(e) => handleSubmit(e)}
                      >
                        <IoMdCheckmark />
                      </button>
                      <button
                        className={styles.btnOpenCompany}
                        onClick={() => setSelectedCompany(null)}
                      >
                        <IoMdClose />
                      </button>
                      <button
                        className={styles.btnOpenCompany}
                        type="button"
                        onClick={() => setIsOpenCreateUsers(true)}
                      >
                        <IoMdPersonAdd />
                      </button>
                    </div>
                    <div className={styles.companyContent}>
                      <div className={styles.companyInfos}>
                        {Array.isArray(users) && users.length > 0 ? (
                          users.map((u) => <h3 key={u.id}>{u.name}</h3>)
                        ) : (
                          <p>Nenhum usuário</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={company.id} className={styles.company}>
                    <div key={company.id} className={styles.companyContent}>
                      <div className={styles.companyInfos}>
                        <h3>{company.name}</h3>
                        <h3>{company.maxUsers}</h3>
                      </div>
                      <button
                        className={styles.btnOpenCompany}
                        onClick={() => {
                          setSelectedCompany(company);
                          setCompanyName(company.name);
                          setCompanyUsers(company.maxUsers);
                        }}
                      >
                        <MdEdit />
                      </button>
                      <button
                        className={styles.btnOpenCompany}
                        onClick={() => handleDelete(company)}
                      >
                        <FaRegTrashCan />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            className={styles.btnLogout}
            onClick={handleLogout}
            type="button"
          >
            <h3>
              <MdOutlinePowerOff /> Desconectar
            </h3>
          </button>

          {isOpenCreateUsers && (
            <AddAdmin
              company={selectedCompany}
              onClose={() => setIsOpenCreateUsers(false)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
