import React, { useRef, useEffect, useCallback } from "react";

type CurrencyInputProps = {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  max?: number;
  min?: number;
};

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "R$ 0,00",
  className,
  max = 99999999.99,
  min = 0,
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previousValueRef = useRef(value);

  const formatCurrency = (val: number): string => {
    return val.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    if (inputRef.current && value !== previousValueRef.current) {
      inputRef.current.value = formatCurrency(value);
      previousValueRef.current = value;
    }
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      let raw = input.value;

      const onlyDigits = raw.replace(/\D/g, "");
      let numeric = Number(onlyDigits) / 100;

      if (numeric > max) numeric = max;
      if (numeric < min) numeric = min;

      const newFormatted = formatCurrency(numeric);

      const cursorPosition = input.selectionStart ?? 0;
      const oldFormatted = input.value;

      onChange(numeric);

      requestAnimationFrame(() => {
        if (!inputRef.current) return;

        inputRef.current.value = newFormatted;

        let digitCount = 0;
        let newCursor = 0;

        for (let i = 0; i < cursorPosition && i < oldFormatted.length; i++) {
          if (/\d/.test(oldFormatted[i])) {
            digitCount++;
          }
        }

        for (let i = 0; i < newFormatted.length; i++) {
          if (/\d/.test(newFormatted[i])) {
            digitCount--;
            if (digitCount <= 0) {
              newCursor = i + 1;
              break;
            }
          }
        }

        if (cursorPosition >= oldFormatted.length - 1) {
          newCursor = newFormatted.length;
        }

        inputRef.current.setSelectionRange(newCursor, newCursor);
      });
    },
    [onChange, max, min],
  );

  return (
    <input
      ref={inputRef}
      type="tel"
      className={className}
      placeholder={placeholder}
      value={formatCurrency(value)}
      onChange={handleChange}
      onKeyPress={(e) => {
        if (
          !/[\d]/.test(e.key) &&
          e.key !== "Backspace" &&
          e.key !== "Delete"
        ) {
          e.preventDefault();
        }
      }}
    />
  );
}
