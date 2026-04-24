import React, { useRef } from "react";

type CurrencyInputProps = {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  max?: number;
};

export default function CurrencyInput({
  value,
  onChange,
  placeholder,
  className,
  max = 99999999.99,
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <input
      ref={inputRef}
      type="text"
      className={className}
      placeholder={placeholder}
      value={value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}
      onChange={(e) => {
        const input = e.target;

        const raw = input.value;
        const cursor = input.selectionStart || 0;

        const digitsBeforeCursor = raw
          .slice(0, cursor)
          .replace(/\D/g, "").length;

        let numeric = Number(raw.replace(/\D/g, "")) / 100;

        if (numeric >= max) numeric = max;

        onChange(numeric);

        requestAnimationFrame(() => {
          const formatted = inputRef.current?.value || "";

          let digitCount = 0;
          let newCursor = formatted.length;

          for (let i = 0; i < formatted.length; i++) {
            if (/\d/.test(formatted[i])) {
              digitCount++;
            }

            if (digitCount === digitsBeforeCursor) {
              newCursor = i + 1;
              break;
            }
          }

          inputRef.current?.setSelectionRange(newCursor, newCursor);
        });
      }}
    />
  );
}
