"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

import styles from "./page.module.css";
import { docsNames, type Documentation } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Documentation() {
  const { token } = useAuth();
  const [loading, setLoading] = useState<"read" | "save" | "reset" | null>(
    null,
  );
  const [docValues, setDocValues] = useState<Record<string, number>>({});

  const [error, setError] = useState("");

  async function handleSaveDocs() {
    if (loading) return;

    setLoading("save");
    setError("");

    try {
      const payload = docsNames.map((doc) => {
        const raw = String(docValues[doc.key] ?? "").replace(",", ".");
        const parsed = parseFloat(raw);

        return {
          documentation: doc.key,
          value: isNaN(parsed) ? 0 : parsed,
        };
      });

      const response = await fetch(`${API}/documentation-custom`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Erro ao salvar as documentações personalizadas",
        );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro inesperado");
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleResetDocs() {
    if (loading) return;

    setLoading("reset");
    setError("");

    try {
      const response = await fetch(`${API}/documentation-custom`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Erro ao apagar as documentações personalizadas",
        );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro inesperado");
      }
    } finally {
      setLoading(null);
      fetchDocs();
    }
  }

  const fetchDocs = useCallback(async () => {
    setLoading("read");

    try {
      const res = await fetch(`${API}/documentation-default/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Erro ao buscar a documentação");

      const map: Record<string, number> = {};

      data.forEach((d: Documentation) => {
        map[d.documentation] = Number(d.value);
      });

      setDocValues(map);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }, [token]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  return (
    <div className={styles.page}>
      <main className={`glass ${styles.main}`}>
        <div className={styles.description}>
          <h4>Configurar valor padrão de documentação</h4>
          <p>Configure aqui os valores médios praticados na sua região.</p>
          <span className={styles.warning}>
            Esses valores serão utilizados apenas como referência para gerar uma
            estimativa de valor de documentação.
          </span>
          {error && <p className={styles.error}>{error}</p>}
        </div>
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
        <div className={styles.btns}>
          <button
            className={`btn-action glass ${styles.btnSave} ${styles.btnReset}`}
            onClick={handleResetDocs}
            type="button"
          >
            {loading === "reset" ? <h5>Restaurando...</h5> : <h5>Restaurar</h5>}
          </button>
          <button
            className={`btn-action glass ${styles.btnSave}`}
            onClick={handleSaveDocs}
            type="button"
          >
            {loading === "save" ? <h5>Salvando...</h5> : <h5>Salvar</h5>}
          </button>
        </div>
      </main>
    </div>
  );
}
