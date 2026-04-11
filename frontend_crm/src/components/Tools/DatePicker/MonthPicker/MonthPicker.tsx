"use client";

import DatePicker from "react-datepicker";
import styles from "./datepicker.module.css";
import { ptBR } from "date-fns/locale";

interface CustomMonthPickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

export default function MonthPicker({
  value,
  onChange,
  placeholder = "Selecione um mês",
}: CustomMonthPickerProps) {
  return (
    <DatePicker
      selected={value}
      onChange={(date: Date | null) => onChange(date)}
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
