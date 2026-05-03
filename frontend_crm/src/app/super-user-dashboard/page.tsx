"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";
import { MdEdit, MdOutlinePowerOff } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";
import { IoMdCheckmark, IoMdClose } from "react-icons/io";
import { docsNames, Documentation, NotePad, User } from "@/types";
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
    undefined,
  );

  const [newNote, setNewNote] = useState<string>("");
  const [notes, setNotes] = useState<NotePad[]>([]);
  const [selectedNote, setSelectedNote] = useState<NotePad | null>(null);

  const [docValues, setDocValues] = useState<Record<string, number>>({});

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

      console.log("NEW COMPANY:", data);

      if (selectedCompany) {
        setCompanies((prev) => prev.map((c) => (c.id === data.id ? data : c)));
        setSelectedCompany(null);
      } else {
        setCompanies((prev) => [...prev, data.newCompany]);
      }

      setCompanyName("");
      setCompanyUsers(undefined);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Erro inesperado");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(company: Company) {
    if (loading) return;

    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir ${company.name}?`,
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
        setError(err instanceof Error ? err.message : "Erro inesperado");
      }
    } finally {
      setLoading(false);
    }
  }

  const fetchUsers = useCallback(async () => {
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
  }, [selectedCompany, token]);

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

  async function handleSaveNote(note?: NotePad) {
    if (loading) return;

    setLoading(true);
    setError("");

    let content;
    if (note) {
      content = { ...note, content: newNote };
    } else content = { content: newNote };

    try {
      const response = await fetch(`${API}/notepad-global`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(content),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao salvar nota");

      if (note) {
        setNotes((prev) =>
          prev.map((n) => (n.id === note.id ? { ...n, content: newNote } : n)),
        );
        setSelectedNote(null);
      } else {
        setNotes((prev) => [...prev, data]);
      }

      setNewNote("");
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

  const fetchNotes = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API}/notepad-global/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar a notas");

      setNotes(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  async function handleDeleteNote(slot: number) {
    if (loading) return;

    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir a nota?`,
    );
    if (!confirmDelete) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/notepad-global/${slot}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao apagar nota");

      setNotes((prev) => prev.filter((n) => n.slot !== slot));
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

  async function handleSaveDocs() {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const payload = docsNames.map((doc) => ({
        documentation: doc.key,
        value: docValues[doc.key] ?? 0,
      }));

      const response = await fetch(`${API}/documentation-default`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Erro ao apagar a empresa");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Erro inesperado");
      }
    } finally {
      setLoading(false);
    }
  }

  const fetchDocs = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API}/documentation-default-SU/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Erro ao buscar a documentação");

      const map: Record<string, number> = {};

      data.forEach((d: Documentation) => {
        map[d.documentation] = d.value;
      });

      setDocValues(map);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

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
  }, [fetchUsers, selectedCompany]);

  useEffect(() => {
    fetchDocs();
    fetchNotes();
  }, [fetchDocs, fetchNotes]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Configurações</h1>
        </div>

        <div className={styles.content}>
          <div className={styles.contentBox}>
            <div className={`glass ${styles.companyBox}`}>
              <div className={styles.createCompany}>
                <h4 className={styles.title}>Empresas</h4>
                <div className={styles.createCompanyBox}>
                  <input
                    className={`form-base ${styles.inputComp}`}
                    type="text"
                    placeholder="Nome"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                  <input
                    className={`form-base ${styles.inputMaxUser}`}
                    type="number"
                    placeholder="MaxUsers"
                    value={companyUsers ?? ""}
                    onChange={(e) => setCompanyUsers(Number(e.target.value))}
                  />

                  <button
                    className={`btn-action glass ${styles.btnSave}`}
                    style={{ width: 80 }}
                    onClick={(e) => handleSubmit(e)}
                  >
                    <h4>Criar</h4>
                  </button>
                </div>
                {error && <p className="error">{error}</p>}
              </div>

              <div className={styles.companies}>
                {companies.length === 0 ? (
                  <p>Nenhuma empresa cadastrada</p>
                ) : (
                  companies.map((company) => {
                    const isSelected = selectedCompany?.id === company.id;

                    return (
                      <div key={company.id} className={styles.company}>
                        {isSelected ? (
                          <>
                            <div className={styles.companyContent}>
                              <div className={styles.companyInfos}>
                                <input
                                  className={`form-base ${styles.inputComp}`}
                                  type="text"
                                  value={companyName}
                                  onChange={(e) =>
                                    setCompanyName(e.target.value)
                                  }
                                />

                                <input
                                  className={`form-base ${styles.inputMaxUser}`}
                                  type="number"
                                  value={companyUsers}
                                  onChange={(e) =>
                                    setCompanyUsers(Number(e.target.value))
                                  }
                                />
                              </div>

                              <button
                                onClick={handleSubmit}
                                className={`btn-action glass ${styles.btnCompany} ${styles.btnCompEnv}`}
                              >
                                <IoMdCheckmark />
                              </button>

                              <button
                                className={`btn-action glass ${styles.btnCompany} ${styles.btnCompDel}`}
                                onClick={() => setSelectedCompany(null)}
                              >
                                <IoMdClose />
                              </button>

                              <button
                                className={`btn-action glass ${styles.btnCompany} ${styles.btnCompEnv}`}
                                onClick={() => setIsOpenCreateUsers(true)}
                              >
                                <IoMdPersonAdd />
                              </button>
                            </div>

                            <div className={styles.companyContent}>
                              <div className={styles.companyInfosUsers}>
                                {users.length > 0 ? (
                                  users.map((u) => (
                                    <span key={u.id}>{u.name}</span>
                                  ))
                                ) : (
                                  <span>Nenhum usuário</span>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className={styles.companyContent}>
                            <div className={styles.companyInfos}>
                              <h4>{company.name}</h4>
                              <h5>{company.maxUsers}</h5>
                            </div>

                            <button
                              className={`btn-action glass ${styles.btnCompany} ${styles.btnCompEnv}`}
                              onClick={() => {
                                setSelectedCompany(company);
                                setCompanyName(company.name);
                                setCompanyUsers(company.maxUsers);
                              }}
                            >
                              <MdEdit />
                            </button>

                            <button
                              className={`btn-action glass ${styles.btnCompany} ${styles.btnCompDel}`}
                              onClick={() => handleDelete(company)}
                            >
                              <FaRegTrashCan />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className={`glass ${styles.companyBox}`}>
              <h4 className={styles.title}>Notas</h4>

              {selectedNote ? (
                <div className={styles.createNote}>
                  <span>Editando...</span>
                </div>
              ) : (
                <div className={styles.createNote}>
                  <textarea
                    className={`form-base ${styles.formNote}`}
                    placeholder="Nota"
                    onChange={(e) => setNewNote(e.target.value)}
                    value={newNote}
                  />
                  <div className={styles.noteBtns}>
                    <button
                      className={`btn-action glass ${styles.btnCompany} ${styles.btnCompEnv}`}
                      onClick={() => handleSaveNote()}
                    >
                      <IoMdCheckmark />
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.companies}>
                {notes.length === 0 ? (
                  <p>Nenhuma nota cadastrada</p>
                ) : (
                  notes.map((note: NotePad) => {
                    const isSelected = selectedNote?.id === note.id;

                    return (
                      <div key={note.id} className={styles.company}>
                        {isSelected ? (
                          <>
                            <div className={styles.companyContent}>
                              <textarea
                                className={`form-base ${styles.formNote}`}
                                placeholder="Nota"
                                onChange={(e) => setNewNote(e.target.value)}
                                value={newNote}
                              />

                              <div className={styles.noteBtns}>
                                <button
                                  className={`btn-action glass ${styles.btnCompany} ${styles.btnCompEnv}`}
                                  onClick={() => handleSaveNote(note)}
                                >
                                  <IoMdCheckmark />
                                </button>
                                <button
                                  className={`btn-action glass ${styles.btnCompany} ${styles.btnCompDel}`}
                                  onClick={() => {
                                    setSelectedNote(null);
                                    setNewNote("");
                                  }}
                                >
                                  <IoMdClose />
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className={styles.companyContent}>
                            <div className={styles.companyInfos}>
                              <p>{note.content}</p>
                            </div>

                            <div className={styles.noteBtns}>
                              <button
                                className={`btn-action glass ${styles.btnCompany} ${styles.btnCompEnv}`}
                                onClick={() => {
                                  setNewNote(note.content);
                                  setSelectedNote(note);
                                }}
                              >
                                <MdEdit />
                              </button>

                              <button
                                className={`btn-action glass ${styles.btnCompany} ${styles.btnCompDel}`}
                                onClick={() => handleDeleteNote(note.slot)}
                              >
                                <FaRegTrashCan />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className={`glass ${styles.docs}`}>
            <h4 className={styles.title}>Documentos</h4>

            <div className={styles.docs}>
              {docsNames.map((doc) => (
                <div key={doc.key} className={styles.doc}>
                  <p>{doc.label}</p>
                  <div className={styles.inputAndPercent}>
                    <div className={styles.inputWrapper}>
                      <input
                        type="text"
                        className={`form-base ${
                          doc.type === "percent"
                            ? styles.inputPercent
                            : styles.inputValue
                        }`}
                        value={
                          docValues[doc.key] !== undefined
                            ? doc.type === "percent"
                              ? docValues[doc.key].toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : docValues[doc.key].toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })
                            : ""
                        }
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "");
                          const numeric = Number(raw) / 100;

                          if (doc.type === "percent" && numeric > 100) return;

                          setDocValues((prev) => ({
                            ...prev,
                            [doc.key]: numeric,
                          }));
                        }}
                      />
                      {doc.type === "percent" && (
                        <span className={styles.suffix}>%</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className={`btn-action glass ${styles.btnSave}`}
              onClick={handleSaveDocs}
            >
              <p>Salvar</p>
            </button>

            {isOpenCreateUsers && (
              <AddAdmin
                company={selectedCompany}
                onClose={() => setIsOpenCreateUsers(false)}
              />
            )}
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.contentBox}>
            <button
              className={`btn-action glass ${`btn-action glass ${styles.btnSave}`} ${styles.btnLogout}`}
              onClick={handleLogout}
              type="button"
            >
              <p>
                <MdOutlinePowerOff /> Desconectar
              </p>
            </button>
          </div>

          <div className={styles.docs}></div>
        </div>
      </main>
    </div>
  );
}
