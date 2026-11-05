"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ConditionalVariable,
  ContractVariable,
  conditionalProtectionKey,
} from "@/components/config/contractVariables/ContractVariable";
import CustomSelect from "@/components/Tools/Select/CustomSelect";
import Tooltip from "@/components/Tools/Tooltip/Tooltip";
import WarningDeal from "@/components/Warning/DefaultWarning";

import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { Fragment, Slice } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { TextSelection } from "@tiptap/pm/state";
import { PaginationPlus } from "tiptap-pagination-plus";

import {
  BsJustify,
  BsTextCenter,
  BsTextLeft,
  BsTextRight,
} from "react-icons/bs";
import { IoPrintSharp } from "react-icons/io5";
import {
  FaCircleCheck,
  FaCircleXmark,
  FaRegTrashCan,
  FaSquareRootVariable,
} from "react-icons/fa6";

import { FaTrashAlt } from "react-icons/fa";
import { HiVariable } from "react-icons/hi2";
import { IoIosSave } from "react-icons/io";
import { IoReturnUpBackOutline } from "react-icons/io5";
import styles from "./page.module.css";
import {
  ContractProps,
  ContractStatus,
  ContractVariableData,
  PartyValues,
  PersonContext,
  PersonType,
} from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ContractEditor(props: ContractProps) {
  const { contractId, contractName, contractContent, onBack, onDeleted } =
    props;
  const router = useRouter();
  const { token, isLoading } = useAuth();

  const [name, setName] = useState(contractName ?? "");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);

  const [status, setStatus] = useState<ContractStatus>(
    props.mode === "generated" ? props.status : "DRAFT",
  );
  const [sellerType, setSellerType] = useState<PersonType>(
    props.mode === "generated" ? props.sellerType : "SINGULAR_M",
  );

  const [buyerType, setBuyerType] = useState<PersonType>(
    props.mode === "generated" ? props.buyerType : "SINGULAR_M",
  );
  const [personContext, setPersonContext] = useState<PersonContext>("seller");

  const [isOpenVariables, setIsOpenVariables] = useState(false);
  const [cardPosition, setCardPosition] = useState({ top: 0 });
  const [variables, setVariables] = useState<ContractVariableData[]>([]);
  const [selectedVariableId, setSelectedVariableId] = useState("");
  const [conditionalVersion, setConditionalVersion] = useState(0);
  const [hasTextSelection, setHasTextSelection] = useState(false);
  const [variableToDelete, setVariableToDelete] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const [isOpenCreateVariables, setIsOpenCreateVariables] = useState(false);
  const [isOpenCreateConditional, setOpenIsCreateConditional] = useState(false);

  const [variableType, setVariableType] = useState<"party" | "conditional">(
    "party",
  );
  const [newVariableName, setNewVariableName] = useState("");
  const personTypes: { value: PersonType; label: string }[] = [
    { value: "SINGULAR_M", label: "Comprador" },
    { value: "SINGULAR_F", label: "Compradora" },
    { value: "PLURAL_M", label: "Compradores" },
    { value: "PLURAL_F", label: "Compradoras" },
  ];

  const partyOptions = {
    buyer: personTypes,
    seller: personTypes.map((option) => ({
      ...option,
      label: option.label.replace("Comprador", "Vendedor"),
    })),
  };

  const emptyPartyValues = {
    buyer: Object.fromEntries(personTypes.map(({ value }) => [value, ""])),
    seller: Object.fromEntries(personTypes.map(({ value }) => [value, ""])),
  } as PartyValues;

  const [partyValues, setPartyValues] = useState<PartyValues>(emptyPartyValues);

  const contextOptions: { value: PersonContext; label: string }[] = [
    { value: "seller", label: getPersonLabel("seller") },
    { value: "buyer", label: getPersonLabel("buyer") },
  ];

  const statusOptions: {
    label: string;
    value: ContractStatus;
  }[] = [
    { label: "Rascunho", value: "DRAFT" },
    { label: "Finalizado", value: "FINALIZED" },
    { label: "Assinado", value: "SIGNED" },
  ];

  const variableContextQuery = (() => {
    if (props.mode === "template") {
      return props.contractId !== null
        ? `templateId=${props.contractId}`
        : null;
    }

    if (props.contractId !== null) {
      return `generatedContractId=${props.contractId}`;
    }

    return props.templateId > 0 ? `templateId=${props.templateId}` : null;
  })();

  const [error, setError] = useState("");

  function resetVariables() {
    setNewVariableName("");
    setPartyValues(emptyPartyValues);

    setIsOpenCreateVariables(false);
    setOpenIsCreateConditional(false);
    setIsOpenVariables(false);
  }

  function getPersonLabel(context: PersonContext): string {
    const personType = context === "seller" ? sellerType : buyerType;
    const options = partyOptions[context];

    return options.find((option) => option.value === personType)?.label ?? "";
  }

  function applyTextColor(color: string) {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .command(({ tr, state }) => {
        const textStyleType = state.schema.marks.textStyle;

        if (!textStyleType) return false;

        const { from, to, empty } = state.selection;

        if (empty) {
          const currentMarks =
            state.storedMarks ?? state.selection.$from.marks();

          const currentStyle = currentMarks.find(
            (mark) => mark.type === textStyleType,
          );

          tr.addStoredMark(
            textStyleType.create({
              ...(currentStyle?.attrs ?? {}),
              color,
            }),
          );

          return true;
        }

        state.doc.nodesBetween(from, to, (node, pos) => {
          if (!node.isText && node.type.name !== "contractVariable") {
            return;
          }

          const start = Math.max(from, pos);
          const end = Math.min(to, pos + node.nodeSize);

          if (start >= end) return;

          const currentStyle = node.marks.find(
            (mark) => mark.type === textStyleType,
          );

          tr.addMark(
            start,
            end,
            textStyleType.create({
              ...(currentStyle?.attrs ?? {}),
              color,
            }),
          );
        });

        return true;
      })
      .run();
  }

  function applyFontSize(fontSize: string) {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .command(({ tr, state }) => {
        const textStyleType = state.schema.marks.textStyle;

        if (!textStyleType) return false;

        const { from, to, empty } = state.selection;

        // Quando não existe seleção, aplica ao próximo texto digitado.
        if (empty) {
          const currentMarks =
            state.storedMarks ?? state.selection.$from.marks();

          const currentStyle = currentMarks.find(
            (mark) => mark.type === textStyleType,
          );

          tr.addStoredMark(
            textStyleType.create({
              ...(currentStyle?.attrs ?? {}),
              fontSize,
            }),
          );

          return true;
        }

        // Aplica tanto aos textos quanto aos nós contractVariable.
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (!node.isText && node.type.name !== "contractVariable") {
            return;
          }

          const start = Math.max(from, pos);
          const end = Math.min(to, pos + node.nodeSize);

          if (start >= end) return;

          const currentStyle = node.marks.find(
            (mark) => mark.type === textStyleType,
          );

          tr.addMark(
            start,
            end,
            textStyleType.create({
              ...(currentStyle?.attrs ?? {}),
              fontSize,
            }),
          );
        });

        return true;
      })
      .run();
  }

  const variableInsert = (variableId: string) => {
    if (!editor) return;

    const variable = variables.find((item) => String(item.id) === variableId);

    if (!variable || variable.variableType !== "party") return;

    editor
      .chain()
      .focus()
      .insertContent({
        type: "contractVariable",
        attrs: {
          variableId: `${personContext}.${variable.id}`,
          variableName: variable.label,
          displayText: getVariableText(variable, personContext),
        },
      })
      .insertContent(" ")
      .run();
  };

  function refreshVariables(context: PersonContext, personType: PersonType) {
    if (!editor) return;

    const variablesById = new Map(
      variables.map((variable) => [String(variable.id), variable]),
    );

    const options = partyOptions[context];
    const index = options.findIndex((option) => option.value === personType);

    if (index === -1) return;

    editor.commands.command(({ tr, state }) => {
      state.doc.descendants((node, pos) => {
        if (node.type.name !== "contractVariable") return;

        const conditionalIds = Array.isArray(node.attrs.conditionalVariables)
          ? (node.attrs.conditionalVariables as string[])
          : [];

        const belongsToConditional =
          conditionalIds.length > 0 ||
          node.marks.some((mark) => mark.type.name === "conditionalVariable");

        if (belongsToConditional) return;

        const [nodeContext, nodeId] = String(node.attrs.variableId ?? "").split(
          ".",
        );

        if (nodeContext !== context) return;

        const variable = variablesById.get(nodeId);

        if (!variable || variable.variableType !== "party") return;

        const optionIndex = index + (context === "buyer" ? 4 : 0);
        const displayText = variable.options[optionIndex] ?? variable.label;

        if (node.attrs.displayText === displayText) return;

        tr.setNodeMarkup(
          pos,
          undefined,
          {
            ...node.attrs,
            displayText,
          },
          node.marks,
        );
      });

      return true;
    });
  }

  function getVariableText(
    variable: ContractVariableData,
    context: PersonContext,
  ): string {
    if (variable.variableType === "conditional") {
      return variable.options[0] ?? variable.label;
    }

    const personType = context === "seller" ? sellerType : buyerType;
    const options = partyOptions[context];

    const index = options.findIndex((option) => option.value === personType);
    const contextOffset = context === "buyer" ? 4 : 0;

    return variable.options[contextOffset + index] ?? variable.label;
  }

  function openVariablesPanel() {
    const button = variablesButtonRef.current;

    if (!button) return;

    const rect = button.getBoundingClientRect();

    setCardPosition({
      top: rect.bottom + 3,
    });

    setIsOpenVariables(true);
  }

  function openCreateConditionalVariable() {
    if (!editor) return;

    const { from, to } = editor.state.selection;

    if (from === to) {
      setError("Selecione um trecho do contrato primeiro.");
      return;
    }

    const slice = editor.state.doc.slice(from, to);

    const text = slice.content.textBetween(
      0,
      slice.content.size,
      " ",
      (leafNode) => {
        if (leafNode.type.name === "contractVariable") {
          return (
            leafNode.attrs.displayText || `[${leafNode.attrs.variableName}]`
          );
        }

        return "";
      },
    );

    if (!text.trim()) {
      setError("Selecione um trecho de texto válido.");
      return;
    }

    conditionalSelectionRef.current = {
      from,
      to,
      text,
      content: {
        content: slice.content.toJSON() as JSONContent[],
        openStart: slice.openStart,
        openEnd: slice.openEnd,
      },
    };

    resetVariables();
    setVariableType("conditional");
    setOpenIsCreateConditional(true);
  }

  function toggleConditionalVariable(variableId: string) {
    if (!editor) return;

    const markType = editor.schema.marks.conditionalVariable;
    if (!markType) return;

    const fullId = `conditional.${variableId}`;

    const matches: {
      from: number;
      to: number;
      enabled: boolean;
    }[] = [];

    editor.state.doc.descendants((node, pos) => {
      if (!node.isText && node.type.name !== "contractVariable") {
        return;
      }

      const mark = node.marks.find(
        (item) =>
          item.type.name === "conditionalVariable" &&
          item.attrs.variableId === fullId,
      );

      const hasInAttrs =
        node.type.name === "contractVariable" &&
        Array.isArray(node.attrs.conditionalVariables) &&
        node.attrs.conditionalVariables.includes(fullId);

      if (!mark && !hasInAttrs) return;

      matches.push({
        from: pos,
        to: pos + node.nodeSize,
        enabled: mark?.attrs.enabled === true,
      });
    });

    if (matches.length === 0) {
      const variable = variables.find((item) => String(item.id) === variableId);

      if (!variable || variable.variableType !== "conditional") {
        return;
      }

      insertConditionalAtCursor(variable);
      return;
    }

    const currentlyEnabled = matches.some((match) => match.enabled);
    const nextEnabled = !currentlyEnabled;

    const tr = editor.state.tr;

    for (const match of matches) {
      tr.addMark(
        match.from,
        match.to,
        markType.create({
          variableId: fullId,
          variableName:
            variables.find((item) => String(item.id) === variableId)?.label ??
            "",
          enabled: nextEnabled,
        }),
      );
    }

    if (tr.docChanged) {
      editor.view.dispatch(tr);
    }

    setConditionalVersion((prev) => prev + 1);
  }

  function addConditionalToContent(
    nodes: JSONContent[],
    conditionalId: string,
    variableName: string,
  ): JSONContent[] {
    return nodes.map((node) => {
      const updatedNode: JSONContent = { ...node };

      if (node.type === "contractVariable") {
        const attrs = node.attrs ?? {};

        const current = Array.isArray(attrs.conditionalVariables)
          ? (attrs.conditionalVariables as string[])
          : [];

        updatedNode.attrs = {
          ...attrs,
          conditionalVariables: current.includes(conditionalId)
            ? current
            : [...current, conditionalId],
        };
      }

      if (node.type === "text") {
        const marks = (node.marks ?? []).filter(
          (mark) => mark.type !== "conditionalVariable",
        );

        updatedNode.marks = [
          ...marks,
          {
            type: "conditionalVariable",
            attrs: {
              variableId: conditionalId,
              variableName,
              enabled: false,
            },
          },
        ];
      }

      if (node.content?.length) {
        updatedNode.content = addConditionalToContent(
          node.content,
          conditionalId,
          variableName,
        );
      }

      return updatedNode;
    });
  }

  function insertConditionalAtCursor(variable: ContractVariableData) {
    if (!editor) return;

    const savedContent = variable.content;

    if (!savedContent?.content?.length) {
      setError(
        "Esta variável condicional não possui o conteúdo estruturado salvo. Recrie a variável para preservar os promitentes.",
      );
      return;
    }

    const conditionalId = `conditional.${variable.id}`;

    const content = addConditionalToContent(
      savedContent.content,
      conditionalId,
      variable.label,
    );

    const fragment = Fragment.fromJSON(editor.schema, content);

    const slice = new Slice(
      fragment,
      savedContent.openStart,
      savedContent.openEnd,
    );

    const selection = editor.state.selection;

    const position = selection.empty ? selection.from : selection.to;

    try {
      const transaction = editor.state.tr.replaceRange(
        position,
        position,
        slice,
      );

      const cursorPosition = transaction.mapping.map(position, 1);

      const cursorSelection = TextSelection.near(
        transaction.doc.resolve(cursorPosition),
        1,
      );

      transaction.setSelection(cursorSelection);

      transaction.setStoredMarks(
        cursorSelection.$from
          .marks()
          .filter((mark) => mark.type.name !== "conditionalVariable"),
      );

      editor.view.dispatch(transaction.scrollIntoView());
      editor.view.focus();

      setError("");
    } catch (error) {
      console.error("Erro ao inserir a variável condicional:", error);
      setError("Não foi possível inserir a variável condicional.");
    }
  }

  function isConditionalVariableEnabled(variableId: string): boolean {
    if (!editor) return false;

    const fullId = `conditional.${variableId}`;
    let enabled = false;

    editor.state.doc.descendants((node) => {
      if (!node.isText && node.type.name !== "contractVariable") {
        return;
      }

      const mark = node.marks.find(
        (item) =>
          item.type.name === "conditionalVariable" &&
          item.attrs.variableId === fullId,
      );

      if (mark?.attrs.enabled === true) {
        enabled = true;
      }
    });

    return enabled;
  }

  async function handleDeleteVariable(variableId: string) {
    if (!token || !editor) return;

    if (props.contractId === null) {
      setError("Salve o contrato antes de remover variáveis.");
      return;
    }

    const context =
      props.mode === "template"
        ? { templateId: props.contractId }
        : { generatedContractId: props.contractId };

    try {
      setError("");
      removeConditionalFromEditor(variableId);

      const saved = await handleSaveContract(contractId);
      if (!saved)
        throw new Error("Não foi possível salvar a remoção da condicional.");

      const params = new URLSearchParams({
        ...(props.mode === "template"
          ? { templateId: String(context.templateId) }
          : {
              generatedContractId: String(context.generatedContractId),
            }),
      });

      const res = await fetch(
        `${API}/variables/${variableId}?${params.toString()}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao remover variável.");
      }

      await fetchVariable();

      setSelectedVariableId((prev) =>
        prev === String(variableId) ? "" : prev,
      );

      setConditionalVersion((prev) => prev + 1);
    } catch (err) {
      console.error("Erro ao remover variável:", err);

      setError(
        err instanceof Error ? err.message : "Erro ao remover variável.",
      );
    }
  }

  async function handleSaveContract(
    contractId: number | null,
  ): Promise<boolean> {
    if (!editor || !token) return false;

    if (!name.trim()) {
      setError("Escolha um nome para o contrato.");
      return false;
    }

    try {
      const content = editor.getJSON();

      const resource =
        props.mode === "generated" ? "generatedContract" : "contractTemplate";

      const payload =
        props.mode === "generated"
          ? {
              name: name.trim(),
              content,

              ...(contractId === null ? { templateId: props.templateId } : {}),

              dealId: props.dealId,
              sellerType,
              buyerType,
              status,
            }
          : {
              name: name.trim(),
              content,
            };

      const res = await fetch(
        `${API}/${resource}${contractId !== null ? `/${contractId}` : ""}`,
        {
          method: contractId !== null ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar contrato.");
      }

      const savedId = data.id ?? contractId;

      if (savedId === null) {
        throw new Error("O servidor não retornou o ID do contrato.");
      }

      savedContentRef.current = JSON.stringify(content);

      savedMetadataRef.current = JSON.stringify({
        name: payload.name,
        ...(props.mode === "generated"
          ? {
              status,
              sellerType,
              buyerType,
            }
          : {}),
      });

      setHasUnsavedChanges(false);

      if (props.mode === "generated") {
        await props.onSaved({
          ...data,
          id: savedId,
          name: data.name ?? payload.name,
          content: data.content ?? content,
        });
      } else {
        await props.onSaved({
          id: savedId,
          name: data.name ?? payload.name,
          content: data.content ?? content,
          creator: data.creator ?? null,
          updater: data.updater ?? null,
          createdAt: data.createdAt ?? new Date().toISOString(),
          updatedAt: data.updatedAt ?? new Date().toISOString(),
        });
      }

      setError("");

      return true;
    } catch (err) {
      console.error("Erro ao salvar contrato:", err);

      setError(err instanceof Error ? err.message : "Erro ao salvar contrato.");

      return false;
    }
  }

  async function handleDeleteContract(contractId: number) {
    if (!token) return;

    try {
      const resource =
        props.mode === "generated" ? "generatedContract" : "contractTemplate";

      const res = await fetch(`${API}/${resource}/${contractId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao apagar contrato.");
      }

      onDeleted(contractId);
      setError("");
      onBack();
    } catch (err) {
      console.error("Erro ao apagar contrato:", err);

      setError(err instanceof Error ? err.message : "Erro ao apagar contrato.");
    }
  }

  function removeConditionalFromEditor(variableId: string) {
    if (!editor) return;

    const conditionalId = `conditional.${variableId}`;

    const ranges: {
      from: number;
      to: number;
    }[] = [];

    // Localiza todos os textos e variáveis pertencentes à condicional.
    editor.state.doc.descendants((node, pos) => {
      const hasConditionalMark = node.marks.some(
        (mark) =>
          mark.type.name === "conditionalVariable" &&
          mark.attrs.variableId === conditionalId,
      );

      const hasConditionalAttribute =
        node.type.name === "contractVariable" &&
        Array.isArray(node.attrs.conditionalVariables) &&
        node.attrs.conditionalVariables.includes(conditionalId);

      if (!hasConditionalMark && !hasConditionalAttribute) {
        return;
      }

      const from = pos;
      const to = pos + node.nodeSize;

      const previous = ranges[ranges.length - 1];

      // Agrupa trechos adjacentes para evitar operações desnecessárias.
      if (previous && from <= previous.to) {
        previous.to = Math.max(previous.to, to);
      } else {
        ranges.push({ from, to });
      }
    });

    if (ranges.length === 0) return;

    const tr = editor.state.tr;

    // Exclui de trás para frente para não deslocar as posições restantes.
    for (const range of [...ranges].reverse()) {
      tr.delete(range.from, range.to);
    }

    // Autoriza esta exclusão, mesmo estando dentro de uma área protegida.
    tr.setMeta(conditionalProtectionKey, "remove-conditional");

    if (tr.docChanged) {
      editor.view.dispatch(tr.scrollIntoView());
    }
  }

  const variablesRef = useRef<ContractVariableData[]>([]);
  const variablesPanelRef = useRef<HTMLDivElement>(null);
  const variablesButtonRef = useRef<HTMLButtonElement>(null);
  const savedContentRef = useRef<string>("");
  const contentInitializedRef = useRef(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  const conditionalSelectionRef = useRef<{
    from: number;
    to: number;
    text: string;
    content: {
      content: JSONContent[];
      openStart: number;
      openEnd: number;
    };
  } | null>(null);
  const lastTextSelectionRef = useRef<{
    from: number;
    to: number;
  } | null>(null);

  const savedMetadataRef = useRef(
    JSON.stringify({
      name: (contractName ?? "").trim(),
      ...(props.mode === "generated"
        ? {
            status: props.status,
            sellerType: props.sellerType,
            buyerType: props.buyerType,
          }
        : {}),
    }),
  );

  const canCreateVariable =
    newVariableName.trim() !== "" &&
    (variableType === "party"
      ? Object.values(partyValues.buyer).every(
          (value) => value.trim() !== "",
        ) &&
        Object.values(partyValues.seller).every((value) => value.trim() !== "")
      : Boolean(conditionalSelectionRef.current?.text.trim()));

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyleKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      ContractVariable,
      ConditionalVariable,

      PaginationPlus.configure({
        pageWidth: 794,
        pageHeight: 1123,

        pageGap: 40,

        pageGapBorderSize: 1,
        pageGapBorderColor: "var(--primaryColor)",
        pageBreakBackground: "var(--mainBg)",

        marginTop: 95,
        marginBottom: 95,
        marginLeft: 95,
        marginRight: 95,

        contentMarginTop: 0,
        contentMarginBottom: 0,

        footerRight: "",
      }),
    ],
    content: "",
  });

  const toolbarState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      underline: editor?.isActive("underline") ?? false,

      fontSize: editor?.getAttributes("textStyle").fontSize ?? "12px",
      color: editor?.getAttributes("textStyle").color ?? "#141519",
    }),
  });

  const fetchVariable = useCallback(async () => {
    if (!token) return;

    if (!variableContextQuery) {
      setVariables([]);
      return;
    }

    try {
      const res = await fetch(`${API}/variables?${variableContextQuery}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Erro ao buscar variáveis");
        return;
      }

      setError("");
      setVariables(data);
    } catch (err) {
      console.error(err);
    }
  }, [token, variableContextQuery]);

  const createVariable = useCallback(async () => {
    if (!token) return;

    if (props.contractId === null) {
      setError(
        props.mode === "template"
          ? "Salve o modelo antes de criar variáveis."
          : "Salve o contrato padrão antes de criar variáveis particulares.",
      );
      return;
    }
    setError("");

    const label = newVariableName.trim();

    if (!label) {
      setError("Informe o nome da variável.");
      return;
    }

    let options: string[];

    if (variableType === "party") {
      options = [
        ...Object.values(partyValues.seller).map((value) => value.trim()),
        ...Object.values(partyValues.buyer).map((value) => value.trim()),
      ];

      if (options.some((option) => !option)) {
        setError("Preencha todas as opções antes de continuar.");
        return;
      }
    } else {
      const selectedText = conditionalSelectionRef.current?.text;

      if (!selectedText) {
        setError("Selecione um trecho do contrato primeiro.");
        return;
      }

      options = [selectedText];
    }

    const conditionalSelection =
      variableType === "conditional" ? conditionalSelectionRef.current : null;

    const variableOwner =
      props.mode === "template"
        ? { templateId: props.contractId }
        : { generatedContractId: props.contractId };

    const payload = {
      label,
      variableType,
      options,
      ...variableOwner,

      ...(conditionalSelection
        ? { content: conditionalSelection.content }
        : {}),
    };

    try {
      const res = await fetch(`${API}/variables`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Erro ao criar variável.");
        return;
      }

      if (variableType === "conditional") {
        const selection = conditionalSelectionRef.current;

        if (!editor || !selection || !data.id) {
          setError("Não foi possível aplicar a variável ao texto.");
          return;
        }

        const conditionalId = `conditional.${data.id}`;

        editor
          .chain()
          .setTextSelection({
            from: selection.from,
            to: selection.to,
          })
          .setMark("conditionalVariable", {
            variableId: conditionalId,
            variableName: label,
            enabled: false,
          })
          .run();

        const { from, to } = selection;
        const tr = editor.state.tr;

        editor.state.doc.nodesBetween(from, to, (node, pos) => {
          if (node.type.name !== "contractVariable") return;

          const current = Array.isArray(node.attrs.conditionalVariables)
            ? node.attrs.conditionalVariables
            : [];

          if (current.includes(conditionalId)) return;

          tr.setNodeMarkup(
            pos,
            undefined,
            {
              ...node.attrs,
              conditionalVariables: [...current, conditionalId],
            },
            node.marks,
          );
        });

        if (tr.docChanged) {
          editor.view.dispatch(tr);
        }

        editor
          .chain()
          .setTextSelection(selection.to)
          .unsetMark("conditionalVariable")
          .focus()
          .run();

        conditionalSelectionRef.current = null;
      }

      await fetchVariable();
      resetVariables();
      if (variableType === "party") setIsOpenVariables(true);
    } catch (err) {
      console.error(err);
      setError("Erro ao conectar com o servidor.");
    }
  }, [
    token,
    editor,
    newVariableName,
    variableType,
    partyValues,
    fetchVariable,
  ]);

  useEffect(() => {
    variablesRef.current = variables;
  }, [variables]);

  useEffect(() => {
    if (!editor) return;

    const updateUnsavedChanges = () => {
      if (!contentInitializedRef.current) return;

      const currentContent = JSON.stringify(editor.getJSON());

      const currentMetadata = JSON.stringify({
        name: name.trim(),
        ...(props.mode === "generated"
          ? {
              status,
              sellerType,
              buyerType,
            }
          : {}),
      });

      const contentChanged = currentContent !== savedContentRef.current;

      const metadataChanged = currentMetadata !== savedMetadataRef.current;

      setHasUnsavedChanges(contentChanged || metadataChanged);
    };

    editor.on("update", updateUnsavedChanges);

    updateUnsavedChanges();

    return () => {
      editor.off("update", updateUnsavedChanges);
    };
  }, [editor, name, status, sellerType, buyerType, props.mode]);

  useEffect(() => {
    if (!editor) return;

    const updateSelection = () => {
      const { from, to } = editor.state.selection;

      setHasTextSelection(from !== to);

      if (from !== to) {
        lastTextSelectionRef.current = { from, to };
      }
    };

    editor.on("selectionUpdate", updateSelection);

    updateSelection();

    return () => {
      editor.off("selectionUpdate", updateSelection);
    };
  }, [editor]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function handleInternalNavigation(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) return;

      const link = target.closest("a[href]") as HTMLAnchorElement | null;

      if (!link) return;

      if (link.target && link.target !== "_self") return;

      if (link.hasAttribute("download")) return;

      const destination = new URL(link.href, window.location.href);

      if (destination.origin !== window.location.origin) return;

      if (destination.href === window.location.href) return;

      event.preventDefault();

      pendingNavigationRef.current = () => {
        router.push(
          `${destination.pathname}${destination.search}${destination.hash}`,
        );
      };

      setShowUnsavedWarning(true);
    }

    document.addEventListener("click", handleInternalNavigation, true);

    return () => {
      document.removeEventListener("click", handleInternalNavigation, true);
    };
  }, [hasUnsavedChanges, router]);

  useEffect(() => {
    if (!isOpenVariables && !isOpenCreateVariables) return;

    function updatePosition() {
      const button = variablesButtonRef.current;

      if (!button) return;

      const rect = button.getBoundingClientRect();

      setCardPosition({
        top: rect.bottom + 3,
      });
    }

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpenVariables, isOpenCreateVariables]);

  useEffect(() => {
    if (isLoading) return;

    if (!token) {
      router.push("/login");
    }

    fetchVariable();
  }, [isLoading, token, fetchVariable, router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        variablesPanelRef.current &&
        !variablesPanelRef.current.contains(event.target as Node)
      ) {
        setIsOpenVariables(false);
        setIsOpenCreateVariables(false);
        setOpenIsCreateConditional(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!editor) return;

    let cancelled = false;

    const nextContent: JSONContent = contractContent ?? {
      type: "doc",
      content: [{ type: "paragraph" }],
    };

    queueMicrotask(() => {
      if (cancelled || editor.isDestroyed) return;

      const currentContent = JSON.stringify(editor.getJSON());
      const incomingContent = JSON.stringify(nextContent);

      // Evita recriar os NodeViews se o conteúdo já estiver atualizado
      if (currentContent !== incomingContent) {
        editor.commands.setContent(nextContent, {
          emitUpdate: false,
        });
      }

      savedContentRef.current = JSON.stringify(editor.getJSON());

      contentInitializedRef.current = true;

      setHasUnsavedChanges(false);
    });

    return () => {
      cancelled = true;
    };
  }, [editor, contractContent]);

  if (isLoading || !token || !editor) return null;

  return (
    <>
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.contractInfos}>
            <div className={`glass ${styles.contractInfo}`}>
              <div className={styles.contractHeader}>
                <button
                  type="button"
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      pendingNavigationRef.current = onBack;
                      setShowUnsavedWarning(true);
                      return;
                    }

                    onBack();
                  }}
                  className={styles.back}
                >
                  <IoReturnUpBackOutline />
                  Voltar às pastas
                </button>

                {contractId !== null && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteWarning(true)}
                    className={styles.back}
                  >
                    <FaRegTrashCan />
                    Apagar contrato
                  </button>
                )}
              </div>
              <input
                type="text"
                className={`form-base ${styles.formTitle}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nome do contrato"
              />
              <p className="error">{error}</p>

              <p>Ajuste os dados dos promitentes e da negociação abaixo</p>
              <div className={styles.personsInfos}>
                <div className={styles.personInfos}>
                  <h4>Promitente</h4>
                  <CustomSelect<PersonType>
                    options={partyOptions.seller}
                    value={
                      partyOptions.seller.find(
                        (option) => option.value === sellerType,
                      ) ?? null
                    }
                    onChange={(option) => {
                      if (!option) return;

                      setSellerType(option.value);
                      refreshVariables("seller", option.value);
                    }}
                  />
                </div>

                <div className={styles.personInfos}>
                  <h4>Promitente</h4>
                  <CustomSelect<PersonType>
                    options={partyOptions.buyer}
                    value={
                      partyOptions.buyer.find(
                        (option) => option.value === buyerType,
                      ) ?? null
                    }
                    onChange={(option) => {
                      if (!option) return;

                      setBuyerType(option.value);
                      refreshVariables("buyer", option.value);
                    }}
                  />
                </div>
              </div>
              <div className={styles.personsInfos}>
                <div className={styles.personInfos}>
                  <h4>Status</h4>
                  <CustomSelect<ContractStatus>
                    options={statusOptions}
                    value={
                      statusOptions.find((option) => option.value === status) ??
                      null
                    }
                    onChange={(option) => {
                      if (!option) return;
                      setStatus(option.value);
                    }}
                  />
                </div>
              </div>
              {variables
                .filter((variable) => variable.variableType !== "party")
                .map((variable) => (
                  <div
                    key={String(variable.id)}
                    className={styles.conditionalVariable}
                  >
                    <button
                      type="button"
                      className={`glass ${styles.inputConditional}`}
                      onClick={() =>
                        toggleConditionalVariable(String(variable.id))
                      }
                    >
                      {variable.label}
                      {conditionalVersion >= 0 &&
                        (isConditionalVariableEnabled(String(variable.id)) ? (
                          <FaCircleCheck className={styles.variableCheck} />
                        ) : (
                          <FaCircleXmark className={styles.variableMark} />
                        ))}
                    </button>

                    <div className={styles.conditionalInfos}>
                      <span>{variable.options}</span>

                      <button
                        type="button"
                        className={styles.deleteConditional}
                        onClick={() =>
                          setVariableToDelete({
                            id: String(variable.id),
                            label: variable.label,
                          })
                        }
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                ))}
              {isOpenCreateConditional && (
                <div className={styles.variableCreate}>
                  <div className={styles.variableCreateColumn}>
                    <p>Nome da variável:</p>

                    <input
                      type="text"
                      placeholder="Ex: Imóvel financiado"
                      className={`form-base ${styles.form}`}
                      value={newVariableName}
                      onChange={(event) =>
                        setNewVariableName(event.target.value)
                      }
                    />
                  </div>
                  <div className={styles.variableCreateColumn}>
                    <p>Trecho selecionado:</p>

                    <p>{conditionalSelectionRef.current?.text}</p>
                  </div>
                </div>
              )}
              {isOpenCreateConditional && (
                <div className={styles.btnSaveCancelConditional}>
                  <button
                    type="button"
                    className={`${styles.variableBtn} ${styles.visibleBtn} ${styles.cancelCreate}`}
                    onClick={() => setOpenIsCreateConditional(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className={`${styles.variableBtn} ${newVariableName !== "" && styles.visibleBtn}`}
                    onClick={() => createVariable()}
                  >
                    {newVariableName === "" ? "Crie um nome" : "Salvar"}
                  </button>
                </div>
              )}

              {props.contractId !== null && (
                <div className={styles.footer}>
                  <p>
                    Criado por: <span>{props.createdBy}</span> em{" "}
                    {new Date(props.createdAt).toLocaleString("pt-BR")}
                  </p>

                  <p>
                    Última edição: <span>{props.updatedBy}</span> em{" "}
                    {new Date(props.updatedAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className={styles.word}>
            <div className={`glass ${styles.toolbar}`}>
              <Tooltip label="Negrito">
                <button
                  type="button"
                  className={toolbarState?.bold ? styles.active : ""}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                >
                  <strong>B</strong>
                </button>
              </Tooltip>

              <Tooltip label="Itálico">
                <button
                  type="button"
                  className={toolbarState?.italic ? styles.active : ""}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                  <em>I</em>
                </button>
              </Tooltip>

              <Tooltip label="Sublinhado">
                <button
                  type="button"
                  className={toolbarState?.underline ? styles.active : ""}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                  <u>U</u>
                </button>
              </Tooltip>

              <span className={styles.separator} />

              <Tooltip label="Tamanho da fonte">
                <select
                  value={toolbarState?.fontSize ?? "12px"}
                  className={styles.fontSizeSelect}
                  onChange={(e) => {
                    applyFontSize(e.target.value);
                  }}
                >
                  <option value="10px">10 px</option>
                  <option value="12px">12 px</option>
                  <option value="14px">14 px</option>
                  <option value="16px">16 px</option>
                  <option value="18px">18 px</option>
                  <option value="24px">24 px</option>
                </select>
              </Tooltip>

              <Tooltip label="Cor da fonte">
                <div className={styles.colorPicker}>
                  {["#141519", "#FF0000", "#0000FF", "#FFFF00"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Cor ${color}`}
                      title={color}
                      className={`${styles.colorOption} ${
                        toolbarState?.color === color
                          ? styles.colorSelected
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyTextColor(color)}
                    />
                  ))}
                </div>
              </Tooltip>

              <span className={styles.separator} />

              <Tooltip label="Alinhar à esquerda">
                <button
                  type="button"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                  }
                >
                  <BsTextLeft />
                </button>
              </Tooltip>

              <Tooltip label="Centralizar">
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    console.log(JSON.stringify(editor.getJSON(), null, 2));

                    editor.chain().focus().setTextAlign("center").run();
                  }}
                >
                  <BsTextCenter />
                </button>
              </Tooltip>

              <Tooltip label="Justificar">
                <button
                  type="button"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("justify").run()
                  }
                >
                  <BsJustify />
                </button>
              </Tooltip>

              <Tooltip label="Alinhar à direita">
                <button
                  type="button"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("right").run()
                  }
                >
                  <BsTextRight />
                </button>
              </Tooltip>

              <span className={styles.separator} />

              <Tooltip label="Variáveis">
                <button
                  ref={variablesButtonRef}
                  type="button"
                  onClick={openVariablesPanel}
                >
                  <FaSquareRootVariable />
                </button>
              </Tooltip>

              <Tooltip
                label={
                  hasTextSelection
                    ? "Adicionar condicional"
                    : "Selecione um trecho do texto"
                }
              >
                <button
                  ref={variablesButtonRef}
                  type="button"
                  className={
                    hasTextSelection
                      ? styles.conditionalActive
                      : styles.conditionalDesactive
                  }
                  onClick={openCreateConditionalVariable}
                >
                  <HiVariable />
                </button>
              </Tooltip>

              <Tooltip label="Salvar">
                <button
                  type="button"
                  onClick={() => handleSaveContract(contractId)}
                  className={hasUnsavedChanges ? styles.unsaved : styles.saved}
                >
                  <IoIosSave />
                </button>
              </Tooltip>

              <Tooltip label="Imprimir">
                <button type="button" onClick={() => window.print()}>
                  <IoPrintSharp />
                </button>
              </Tooltip>
            </div>

            <div
              className={styles.editorContainer}
              onMouseDownCapture={(event) => {
                if (event.button !== 0) return;

                const target = event.target as HTMLElement;

                if (target.closest(".ProseMirror")) return;

                const view = editor.view;
                const rect = view.dom.getBoundingClientRect();

                if (!rect.width || !rect.height) return;

                const left = Math.max(
                  rect.left + 1,
                  Math.min(event.clientX, rect.right - 1),
                );

                const top = Math.max(
                  rect.top + 1,
                  Math.min(event.clientY, rect.bottom - 1),
                );

                const result = view.posAtCoords({ left, top });

                if (!result) return;

                event.preventDefault();

                const selection = TextSelection.near(
                  view.state.doc.resolve(result.pos),
                  1,
                );

                view.dispatch(
                  view.state.tr.setSelection(selection).scrollIntoView(),
                );

                view.focus();
              }}
            >
              <EditorContent editor={editor} className={styles.editor} />
            </div>
          </div>

          {isOpenVariables && (
            <div
              ref={variablesPanelRef}
              className={`${styles.variablePanel} ${styles.test}`}
              style={{
                top: cardPosition.top,
              }}
            >
              <h3>Variáveis</h3>

              <div className={styles.variableLine}>
                <span>Atribuir a:</span>
                <CustomSelect<PersonContext>
                  options={contextOptions}
                  value={
                    contextOptions.find(
                      (option) => option.value === personContext,
                    ) ?? null
                  }
                  onChange={(option) => {
                    if (!option) return;
                    setPersonContext(option.value);
                  }}
                />
              </div>

              <div className={styles.variableLine}>
                <span>Variável</span>
                <CustomSelect<string>
                  options={variables
                    .filter((variable) => variable.variableType === "party")
                    .map((variable) => ({
                      value: String(variable.id),
                      label: variable.label,
                    }))}
                  value={
                    variables
                      .filter((variable) => variable.variableType === "party")
                      .map((variable) => ({
                        value: String(variable.id),
                        label: variable.label,
                      }))
                      .find((option) => option.value === selectedVariableId) ??
                    null
                  }
                  onChange={(option) => {
                    if (!option) return;
                    setSelectedVariableId(option.value);
                  }}
                />
              </div>

              {variables.find(
                (item) => String(item.id) === selectedVariableId,
              ) && (
                <span className={styles.variableSpan}>
                  Prévia:{" "}
                  <strong className={styles.variableBold}>
                    {getVariableText(
                      variables.find(
                        (item) => String(item.id) === selectedVariableId,
                      )!,
                      personContext,
                    )}
                  </strong>
                </span>
              )}

              <div className={styles.variablesBtns}>
                <button
                  type="button"
                  className={`${styles.variableBtn} ${styles.createVariable}`}
                  onClick={() => {
                    setIsOpenCreateVariables(true);
                    setOpenIsCreateConditional(false);
                    setIsOpenVariables(false);
                    setVariableType("party");
                    setNewVariableName("");
                  }}
                >
                  + Criar nova
                </button>

                <button
                  type="button"
                  className={`${styles.variableBtn} ${
                    selectedVariableId !== "" && styles.visibleBtn
                  }`}
                  onClick={() => variableInsert(selectedVariableId)}
                >
                  Inserir ao contrato
                </button>
              </div>
            </div>
          )}

          {isOpenCreateVariables && (
            <div
              ref={variablesPanelRef}
              className={`${styles.variablePanel} ${styles.createVariablePanel}`}
              style={{
                top: cardPosition.top,
              }}
            >
              <h3>Criar variáveis</h3>

              <div className={styles.variableLine}>
                <p>Nome da variável:</p>
                <input
                  id="newVariableName"
                  type="text"
                  placeholder="Nomeie essa variável"
                  className={`form-base ${styles.form}`}
                  value={newVariableName}
                  onChange={(event) => setNewVariableName(event.target.value)}
                />
              </div>

              <div className={styles.titleCreateVariables}>
                <h4>Comprador</h4>
                <h4>Vendedor</h4>
              </div>

              <div className={styles.titleCreateVariables}>
                <div className={styles.createVariablesInputs}>
                  {partyOptions.buyer.map((person) => (
                    <div key={`buyer-${person.value}`}>
                      <input
                        id={`buyer-${person.value}`}
                        type="text"
                        placeholder={person.label}
                        className={`form-base ${styles.form}`}
                        value={partyValues.buyer[person.value]}
                        onChange={(event) => {
                          setPartyValues((prev) => ({
                            ...prev,
                            buyer: {
                              ...prev.buyer,
                              [person.value]: event.target.value,
                            },
                          }));
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className={styles.createVariablesInputs}>
                  {partyOptions.seller.map((person) => (
                    <div key={`seller-${person.value}`}>
                      <input
                        id={`seller-${person.value}`}
                        type="text"
                        placeholder={person.label}
                        className={`form-base ${styles.form}`}
                        value={partyValues.seller[person.value]}
                        onChange={(event) => {
                          setPartyValues((prev) => ({
                            ...prev,
                            seller: {
                              ...prev.seller,
                              [person.value]: event.target.value,
                            },
                          }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {canCreateVariable ? (
                <div>
                  <button
                    type="button"
                    className={`${styles.variableBtn} ${styles.visibleBtn}`}
                    onClick={() => createVariable()}
                  >
                    Salvar
                  </button>
                </div>
              ) : (
                <span>Por favor, preencha todas as opções.</span>
              )}
            </div>
          )}

          {showUnsavedWarning && (
            <WarningDeal
              message="O arquivo não foi salvo. Deseja salvar"
              name={name ? name : "este contrato"}
              cancelDelete={true}
              onClose={() => {
                pendingNavigationRef.current = null;
                setShowUnsavedWarning(false);
              }}
              onCancel={() => {
                const navigate = pendingNavigationRef.current;

                pendingNavigationRef.current = null;
                setShowUnsavedWarning(false);

                if (navigate) {
                  navigate();
                } else {
                  onBack();
                }
              }}
              onConfirm={async () => {
                const saved = await handleSaveContract(contractId);

                if (!saved) {
                  throw new Error("Não foi possível salvar o contrato.");
                }

                const navigate = pendingNavigationRef.current;

                pendingNavigationRef.current = null;
                setShowUnsavedWarning(false);

                if (navigate) {
                  navigate();
                } else {
                  onBack();
                }
              }}
            />
          )}

          {showDeleteWarning && contractId !== null && (
            <WarningDeal
              message="Você tem certeza que deseja apagar"
              name={name ? name : "este contrato"}
              onClose={() => setShowDeleteWarning(false)}
              onConfirm={async () => {
                await handleDeleteContract(contractId);
              }}
            />
          )}
        </main>
      </div>

      <div
        className={styles.printDocument}
        dangerouslySetInnerHTML={{
          __html: editor.getHTML(),
        }}
      />
    </>
  );
}
