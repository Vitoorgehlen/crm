"use client";

import DatePicker from "react-datepicker";
import styles from "./datepicker.module.css";
import { ptBR } from "date-fns/locale";

type MonthYear = {
  month: number;
  year: number;
};

interface CustomMonthPickerProps {
  value: MonthYear | null;
  onChange: (date: MonthYear | null) => void;
  placeholder?: string;
}

export default function MonthPicker({
  value,
  onChange,
  placeholder = "Selecione um mês",
}: CustomMonthPickerProps) {
  const selectedDate = value ? new Date(value.year, value.month, 1) : null;

  return (
    <DatePicker
      selected={selectedDate}
      onChange={(date: Date | null) => {
        if (!date) return onChange(null);

        onChange({
          month: date.getMonth(),
          year: date.getFullYear(),
        });
      }}
      dateFormat="MM/yyyy"
      showMonthYearPicker
      placeholderText={placeholder}
      className={styles.input}
      calendarClassName={styles.calendar}
      popperPlacement="bottom-end"
      locale={ptBR}
      onKeyDown={(e) => e.preventDefault()}
      onFocus={(e) => e.target.blur()}
    />
  );
}
