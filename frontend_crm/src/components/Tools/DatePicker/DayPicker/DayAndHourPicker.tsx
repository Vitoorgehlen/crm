"use client";

import DatePicker from "react-datepicker";
import styles from "./datepicker.module.css";
import { ptBR } from "date-fns/locale";

interface CustomDatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

export default function DayAndHourPicker({
  value,
  onChange,
  placeholder = "Selecione data e hora",
}: CustomDatePickerProps) {
  return (
    <DatePicker
      selected={value}
      onChange={(date: Date | null) => onChange(date)}
      placeholderText={placeholder}
      className={styles.input}
      calendarClassName={styles.calendar}
      dayClassName={() => styles.day}
      popperPlacement="bottom-end"
      locale={ptBR}
      showTimeSelect
      timeFormat="HH:mm"
      timeIntervals={15}
      dateFormat="dd/MM/yyyy HH:mm"
      onKeyDown={(e) => e.preventDefault()}
      onFocus={(e) => e.target.blur()}
    />
  );
}
