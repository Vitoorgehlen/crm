"use client";

import DatePicker from "react-datepicker";
import styles from "./datepicker.module.css";
import { ptBR } from "date-fns/locale";

interface CustomDatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

export default function DayPicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
}: CustomDatePickerProps) {
  return (
    <DatePicker
      selected={value}
      onChange={(date: Date | null) => onChange(date)}
      placeholderText={placeholder}
      className={styles.input}
      calendarClassName={styles.calendar}
      dayClassName={(date) => styles.day}
      popperPlacement="bottom-end"
      locale={ptBR}
      onKeyDown={(e) => e.preventDefault()}
      onFocus={(e) => e.target.blur()}
    />
  );
}
