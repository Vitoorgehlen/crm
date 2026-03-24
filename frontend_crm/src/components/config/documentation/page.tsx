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

  const [docValues, setDocValues] = useState<Record<string, string>>({});

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

      const map: Record<string, string> = {};

      data.forEach((d: Documentation) => {
        map[d.documentation] = String(d.value);
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
      <main className={styles.main}>
        <div className={styles.description}>
          <h3>Configurar valor padrão de documentação</h3>
          <h5>Configure aqui os valores médios praticados na sua região.</h5>
          <p>
            Esses valores serão utilizados apenas como referência para gerar uma
            estimativa de valor de documentação.
          </p>
          {error && <p className={styles.error}>{error}</p>}
        </div>
        {docsNames.map((doc) => (
          <div key={doc.key} className={styles.doc}>
            <h4>{doc.label}</h4>
            <div className={styles.inputAndPercent}>
              <input
                type="text"
                className={styles.input}
                value={docValues[doc.key] ?? ""}
                onChange={(e) => {
                  let value = e.target.value;

                  if (!/^[\d.,]*$/.test(value)) return;

                  value = value.replace(/,/g, ".");

                  const parts = value.split(".");
                  if (parts.length > 2) return;

                  if (doc.type === "percent") {
                    const parsed = parseFloat(value);
                    if (!isNaN(parsed) && parsed > 100) return;
                  }

                  setDocValues((prev) => ({
                    ...prev,
                    [doc.key]: value,
                  }));
                }}
              />
              <h4>{doc.type === "percent" ? "%" : ""}</h4>
            </div>
          </div>
        ))}
        <div className={styles.btns}>
          <button
            className={styles.btnReset}
            onClick={handleResetDocs}
            type="button"
          >
            {loading === "reset" ? (
              <h4>Restaurando...</h4>
            ) : (
              <h4>Restaurar as documentações</h4>
            )}
          </button>
          <button
            className={styles.btnSave}
            onClick={handleSaveDocs}
            type="button"
          >
            {loading === "save" ? (
              <h4>Salvando...</h4>
            ) : (
              <h4>Salvar as documentações</h4>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
