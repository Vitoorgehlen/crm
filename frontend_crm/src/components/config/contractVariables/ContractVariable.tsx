import { Node, mergeAttributes, Mark } from "@tiptap/core";
import {
  NodeSelection,
  Plugin,
  PluginKey,
  TextSelection,
} from "@tiptap/pm/state";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { ReplaceAroundStep, ReplaceStep } from "@tiptap/pm/transform";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { CSSProperties } from "react";

type ProtectedRange = {
  from: number;
  to: number;
  conditionalIds: string[];
};

export const conditionalProtectionKey = new PluginKey(
  "conditionalVariableProtection",
);
// Localiza os trechos protegidos dentro do documento.
function getConditionalProtectedRanges(doc: ProseMirrorNode): ProtectedRange[] {
  const ranges: ProtectedRange[] = [];

  doc.descendants((node, pos) => {
    if (!node.isInline) return;

    // IDs das marcas condicionais presentes no nó.
    const markIds = node.marks
      .filter((mark) => mark.type.name === "conditionalVariable")
      .map((mark) => {
        const id = mark.attrs.variableId;

        return id == null ? `__missing_${pos}` : String(id);
      });

    // IDs das condicionais associadas aos nós contractVariable.
    const attrIds =
      node.type.name === "contractVariable" &&
      Array.isArray(node.attrs.conditionalVariables)
        ? node.attrs.conditionalVariables.filter(
            (id: unknown): id is string =>
              typeof id === "string" && id.length > 0,
          )
        : [];

    const conditionalIds = [...new Set([...markIds, ...attrIds])];

    if (conditionalIds.length === 0) return;

    ranges.push({
      from: pos,
      to: pos + node.nodeSize,
      conditionalIds,
    });
  });

  // Ordena os intervalos.
  ranges.sort((a, b) => a.from - b.from || a.to - b.to);

  const merged: ProtectedRange[] = [];

  for (const range of ranges) {
    const previous = merged[merged.length - 1];

    if (!previous) {
      merged.push({ ...range });
      continue;
    }

    // Intervalos que realmente se sobrepõem.
    const overlaps = range.from < previous.to;

    // Intervalos contíguos que pertencem à mesma condicional.
    const sameConditionalAtBoundary =
      range.from === previous.to &&
      range.conditionalIds.some((id) => previous.conditionalIds.includes(id));

    if (overlaps || sameConditionalAtBoundary) {
      previous.to = Math.max(previous.to, range.to);

      previous.conditionalIds = [
        ...new Set([...previous.conditionalIds, ...range.conditionalIds]),
      ];
    } else {
      // Condicionais diferentes permanecem separadas.
      // O espaço entre elas pode receber texto.
      merged.push({ ...range });
    }
  }

  return merged;
}

// Verifica se uma alteração modifica algum trecho protegido.
function touchesProtectedRange(
  from: number,
  to: number,
  ranges: ProtectedRange[],
): boolean {
  return ranges.some((range) => {
    // Inserção: bloqueia somente quando acontece dentro do trecho.
    // Assim, ainda é possível escrever antes ou depois da variável.
    if (from === to) {
      return from > range.from && from < range.to;
    }

    // Exclusão ou substituição de texto.
    return from < range.to && to > range.from;
  });
}

function VariableView({ node }: { node: ProseMirrorNode }) {
  const marks = node.marks ?? [];

  const isBold = marks.some((mark) => mark.type.name === "bold");
  const isItalic = marks.some((mark) => mark.type.name === "italic");
  const isUnderline = marks.some((mark) => mark.type.name === "underline");

  const textStyleMark = marks.find((mark) => mark.type.name === "textStyle");

  const style: CSSProperties = {
    fontWeight: isBold ? 700 : undefined,
    fontStyle: isItalic ? "italic" : undefined,
    textDecoration: isUnderline ? "underline" : undefined,
    color: textStyleMark?.attrs.color || undefined,
    fontSize: textStyleMark?.attrs.fontSize || undefined,
  };

  return (
    <NodeViewWrapper
      as="span"
      className="contract-variable"
      contentEditable={false}
      title={`Variável: ${node.attrs.variableName}`}
      style={style}
    >
      {node.attrs.displayText || `[${node.attrs.variableName}]`}
    </NodeViewWrapper>
  );
}

export const ContractVariable = Node.create({
  name: "contractVariable",

  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  marks: "_",

  addAttributes() {
    return {
      variableId: { default: null },
      variableName: { default: "" },
      displayText: { default: "" },
      optionIndex: { default: 0 },
      conditionalVariables: { default: [] },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-contract-variable]",
        getAttrs: (element) => {
          const el = element as HTMLElement;

          return {
            variableId: el.getAttribute("data-variable-id"),
            variableName: el.getAttribute("data-variable-name") || "",
            displayText:
              el.getAttribute("data-display-text") || el.textContent || "",
            optionIndex: Number(el.getAttribute("data-option-index") || 0),
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-contract-variable": "",
        "data-variable-id": node.attrs.variableId,
        "data-variable-name": node.attrs.variableName,
        "data-display-text": node.attrs.displayText,
        "data-option-index": node.attrs.optionIndex,
        class: "contract-variable",
      }),
      node.attrs.displayText || `[${node.attrs.variableName}]`,
    ];
  },

  renderText({ node }) {
    return node.attrs.displayText || `[${node.attrs.variableName}]`;
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { selection } = editor.state;
        if (
          selection instanceof NodeSelection &&
          selection.node.type.name === "contractVariable"
        ) {
          return editor
            .chain()
            .focus()
            .setTextSelection(selection.to)
            .splitBlock()
            .run();
        }
        return false;
      },
      ArrowRight: ({ editor }) => {
        const { selection } = editor.state;
        if (
          selection instanceof NodeSelection &&
          selection.node.type.name === "contractVariable"
        ) {
          return editor.chain().focus().setTextSelection(selection.to).run();
        }
        return false;
      },
      ArrowLeft: ({ editor }) => {
        const { selection } = editor.state;
        if (
          selection instanceof NodeSelection &&
          selection.node.type.name === "contractVariable"
        ) {
          return editor.chain().focus().setTextSelection(selection.from).run();
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          // Clique na metade esquerda → cursor ANTES.
          // Clique na metade direita → cursor DEPOIS.
          handleClick(view, _pos, event) {
            const target = event.target as HTMLElement;
            const varEl = target.closest(
              "[data-contract-variable]",
            ) as HTMLElement | null;
            if (!varEl) return false;

            const posAt = view.posAtDOM(varEl, 0);
            const node = view.state.doc.nodeAt(posAt);
            if (!node || node.type.name !== "contractVariable") return false;

            const rect = varEl.getBoundingClientRect();
            const goAfter = event.clientX > rect.left + rect.width / 2;
            const targetPos = goAfter ? posAt + node.nodeSize : posAt;

            try {
              const $target = view.state.doc.resolve(targetPos);
              const selection = TextSelection.near($target, goAfter ? -1 : 1);
              view.dispatch(view.state.tr.setSelection(selection));
              view.focus();
              return true;
            } catch {
              return false;
            }
          },
        },
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableView);
  },
});

export const ConditionalVariable = Mark.create({
  name: "conditionalVariable",

  inclusive: false,
  exitable: true,
  keepOnSplit: false,

  addAttributes() {
    return {
      variableId: {
        default: null,

        parseHTML: (element) => element.getAttribute("data-variable-id"),

        renderHTML: (attributes) => ({
          "data-variable-id": attributes.variableId,
        }),
      },

      variableName: {
        default: "",

        parseHTML: (element) =>
          element.getAttribute("data-variable-name") || "",

        renderHTML: (attributes) => ({
          "data-variable-name": attributes.variableName,
        }),
      },

      enabled: {
        default: false,

        parseHTML: (element) => element.getAttribute("data-enabled") === "true",

        renderHTML: (attributes) => ({
          "data-enabled": String(attributes.enabled),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-conditional-variable]",
      },
    ];
  },

  renderHTML({ mark, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-conditional-variable": "",
        class: mark.attrs.enabled
          ? "conditional-variable-enabled"
          : "conditional-variable-disabled",
      }),
      0,
    ];
  },

  // Impede a modificação do conteúdo protegido.
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: conditionalProtectionKey,

        filterTransaction(transaction) {
          if (
            transaction.getMeta(conditionalProtectionKey) ===
            "remove-conditional"
          ) {
            return true;
          }

          if (!transaction.docChanged) {
            return true;
          }

          for (let index = 0; index < transaction.steps.length; index++) {
            const step = transaction.steps[index];

            // Verifica somente operações de inserção,
            // exclusão ou substituição de conteúdo.
            if (
              !(step instanceof ReplaceStep) &&
              !(step instanceof ReplaceAroundStep)
            ) {
              continue;
            }

            // Cada operação pode usar posições diferentes
            // após as etapas anteriores da transação.
            const docBeforeStep = transaction.docs[index];

            if (!docBeforeStep) {
              continue;
            }

            const protectedRanges =
              getConditionalProtectedRanges(docBeforeStep);

            const touchesProtected =
              step instanceof ReplaceAroundStep
                ? touchesProtectedRange(
                    step.from,
                    step.gapFrom,
                    protectedRanges,
                  ) ||
                  touchesProtectedRange(step.gapTo, step.to, protectedRanges)
                : touchesProtectedRange(step.from, step.to, protectedRanges);

            if (touchesProtected) {
              return false;
            }
          }

          return true;
        },
      }),
    ];
  },
});
