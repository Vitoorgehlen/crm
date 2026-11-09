"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryState, parseAsString, parseAsBoolean } from "nuqs";
import type { GeneratedContractResponse, SavedContract } from "@/types";

import ContractDefault from "@/components/contract/page";
import { FiFolder, FiFolderPlus } from "react-icons/fi";
import styles from "./page.module.css";
import Tooltip from "@/components/Tools/Tooltip/Tooltip";

const API = process.env.NEXT_PUBLIC_API_URL;

function upsertContract<T extends { id: number }>(prev: T[], saved: T): T[] {
  const exists = prev.some((contract) => contract.id === saved.id);

  if (exists) {
    return prev.map((contract) =>
      contract.id === saved.id ? saved : contract,
    );
  }

  return [...prev, saved];
}

export default function Contrato() {
  const router = useRouter();
  const { token, isLoading } = useAuth();

  const [contractsDefault, setContractsDefault] = useState<SavedContract[]>([]);
  const [generated, setGenerated] = useState<GeneratedContractResponse[]>([]);

  const [mode, setMode] = useQueryState("mode", parseAsString.withDefault(""));
  const [contractId, setContractId] = useQueryState("id", parseAsString); // string | null
  const [templateIdParam, setTemplateIdParam] = useQueryState(
    "templateId",
    parseAsString,
  );
  const [chooseTemplate, setChooseTemplate] = useQueryState(
    "chooseTemplate",
    parseAsBoolean.withDefault(false),
  );

  const [error, setError] = useState("");

  const fetchContracts = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API}/contractTemplate/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao buscar modelos.");
      }

      setContractsDefault(data);
    } catch (err) {
      console.error("Erro ao buscar modelos:", err);
      setError(err instanceof Error ? err.message : "Erro ao buscar modelos.");
    }
  }, [token]);

  const fetchGeneratedContract = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API}/generatedContract/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "Erro ao buscar contratos particulares.",
        );
      }

      setGenerated(data);
    } catch (err) {
      console.error("Erro ao buscar contratos particulares:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao buscar contratos particulares.",
      );
    }
  }, [token]);

  useEffect(() => {
    if (isLoading) return;

    if (!token) {
      router.replace("/login");
      return;
    }

    fetchContracts();
    fetchGeneratedContract();
  }, [isLoading, token, fetchContracts, fetchGeneratedContract, router]);

  function reset() {
    setMode(null);
    setContractId(null);
    setTemplateIdParam(null);
    setChooseTemplate(null);
    setError("");
  }

  function openNewTemplate() {
    setError("");
    setMode("template");
    setContractId(null);
    setTemplateIdParam(null);
    setChooseTemplate(null);
  }

  function openTemplate(contract: SavedContract) {
    setError("");
    setMode("template");
    setContractId(String(contract.id));
    setTemplateIdParam(null);
    setChooseTemplate(null);
  }

  function openTemplateSelection() {
    setError("");
    setMode(null);
    setContractId(null);
    setTemplateIdParam(null);
    setChooseTemplate(true);
  }

  function createGeneratedFromTemplate(template: SavedContract) {
    setError("");
    setMode("generated");
    setContractId(null);
    setTemplateIdParam(String(template.id));
    setChooseTemplate(null);
  }

  function openGeneratedContract(contract: GeneratedContractResponse) {
    setError("");
    setMode("generated");
    setContractId(String(contract.id));
    setTemplateIdParam(null);
    setChooseTemplate(null);
  }

  const isChoosingTemplate = chooseTemplate === true;

  const activeTemplateEditor =
    mode === "template"
      ? {
          mode: "template" as const,
          contract:
            contractId != null
              ? (contractsDefault.find((c) => String(c.id) === contractId) ??
                null)
              : null,
        }
      : null;

  const activeGeneratedEditor =
    mode === "generated"
      ? {
          mode: "generated" as const,
          contract:
            contractId != null
              ? (generated.find((c) => String(c.id) === contractId) ?? null)
              : null,
          template:
            templateIdParam != null
              ? (contractsDefault.find(
                  (c) => String(c.id) === templateIdParam,
                ) ?? null)
              : null,
        }
      : null;

  async function handleTemplateSaved(saved: SavedContract) {
    await fetchContracts();
    setMode("template");
    setContractId(String(saved.id));
    setTemplateIdParam(null);
    setChooseTemplate(null);
  }

  function handleGeneratedSaved(contract: GeneratedContractResponse) {
    setGenerated((prev) => upsertContract(prev, contract));
    setMode("generated");
    setContractId(String(contract.id));
    setTemplateIdParam(null);
    setChooseTemplate(null);
    // ou reset();
  }

  function handleTemplateDeleted(deletedId: number) {
    setContractsDefault((prev) =>
      prev.filter((contract) => contract.id !== deletedId),
    );
    reset();
  }

  function handleGeneratedDeleted(deletedId: number) {
    setGenerated((prev) =>
      prev.filter((contract) => contract.id !== deletedId),
    );
    reset();
  }

  const generatedContract = activeGeneratedEditor?.contract;
  const generatedTemplate = activeGeneratedEditor?.template;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.headerContent}>
          <div className={styles.title}>
            <h3>Gerador</h3>
            <h5>de contrato</h5>
          </div>
        </div>

        <p className="error">{error}</p>
        {!activeTemplateEditor && !activeGeneratedEditor && (
          <div className={styles.content}>
            <div className={`glass ${styles.contracts}`}>
              <h4>Modelos</h4>

              <div className={styles.folders}>
                <Tooltip label="Criar um contrato modelo">
                  <button
                    className={`glass ${styles.addContract}`}
                    type="button"
                    onClick={openNewTemplate}
                  >
                    <FiFolderPlus className={styles.icon} />
                    Novo modelo
                  </button>
                </Tooltip>

                {contractsDefault.map((contract) => (
                  <Tooltip key={contract.id} label={contract.name}>
                    <button
                      type="button"
                      className="glass"
                      onClick={() => openTemplate(contract)}
                    >
                      <FiFolder className={styles.icon} />
                      {contract.name.length > 45
                        ? `${contract.name.slice(0, 45)}...`
                        : contract.name}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>

            {(contractsDefault.length > 0 || generated.length > 0) && (
              <div className={`glass ${styles.contracts}`}>
                <h4>Particulares</h4>
                {isChoosingTemplate && (
                  <span>
                    Selecione um modelo para o contrato para usar de base
                  </span>
                )}

                {isChoosingTemplate ? (
                  <div className={styles.folders}>
                    <button
                      type="button"
                      className={`glass ${styles.back}`}
                      onClick={reset}
                    >
                      Voltar
                    </button>

                    {contractsDefault.map((contract) => (
                      <Tooltip key={contract.id} label={contract.name}>
                        <button
                          key={contract.id}
                          type="button"
                          className="glass"
                          onClick={() => createGeneratedFromTemplate(contract)}
                        >
                          <FiFolder className={styles.icon} />
                          {contract.name.length > 45
                            ? `${contract.name.slice(0, 45)}...`
                            : contract.name}
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                ) : (
                  <div className={styles.folders}>
                    <Tooltip label="Criar um contrato a partir de modelo">
                      <button
                        type="button"
                        className={`glass ${styles.addContract}`}
                        onClick={openTemplateSelection}
                      >
                        <FiFolderPlus className={styles.icon} />
                        Novo contrato
                      </button>
                    </Tooltip>

                    {generated.map((contract) => (
                      <Tooltip key={contract.id} label={contract.name}>
                        <button
                          type="button"
                          className="glass"
                          onClick={() => openGeneratedContract(contract)}
                        >
                          <FiFolder className={styles.icon} />
                          {contract.name.length > 45
                            ? `${contract.name.slice(0, 45)}...`
                            : contract.name}
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTemplateEditor && (
          <ContractDefault
            mode="template"
            contractId={activeTemplateEditor.contract?.id ?? null}
            contractName={activeTemplateEditor.contract?.name ?? null}
            contractContent={activeTemplateEditor.contract?.content ?? null}
            createdBy={
              activeTemplateEditor.contract?.creator?.name ?? "Não informado"
            }
            updatedBy={
              activeTemplateEditor.contract?.updater?.name ?? "Não informado"
            }
            createdAt={activeTemplateEditor.contract?.createdAt ?? ""}
            updatedAt={activeTemplateEditor.contract?.updatedAt ?? ""}
            onBack={reset}
            onDeleted={handleTemplateDeleted}
            onSaved={handleTemplateSaved}
          />
        )}
        {activeGeneratedEditor && (
          <ContractDefault
            mode="generated"
            contractId={generatedContract?.id ?? null}
            contractName={
              generatedContract?.name ?? generatedTemplate?.name ?? null
            }
            contractContent={
              generatedContract?.content ?? generatedTemplate?.content ?? null
            }
            templateId={
              generatedContract?.templateId ?? generatedTemplate?.id ?? 0
            }
            dealId={generatedContract?.dealId ?? null}
            sellerType={generatedContract?.sellerType ?? "SINGULAR_M"}
            buyerType={generatedContract?.buyerType ?? "SINGULAR_M"}
            status={generatedContract?.status ?? "DRAFT"}
            createdBy={generatedContract?.creator?.name ?? "—"}
            updatedBy={generatedContract?.updater?.name ?? "—"}
            createdAt={generatedContract?.createdAt ?? ""}
            updatedAt={generatedContract?.updatedAt ?? ""}
            onBack={reset}
            onDeleted={handleGeneratedDeleted}
            onSaved={handleGeneratedSaved}
          />
        )}
      </main>
    </div>
  );
}
