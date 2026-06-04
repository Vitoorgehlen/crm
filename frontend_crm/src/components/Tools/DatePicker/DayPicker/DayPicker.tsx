"use client";

import DatePicker from "react-datepicker";
import styles from "./datepicker.module.css";
import { ptBR } from "date-fns/locale";
import CustomSelect, { Option } from "../../Select/CustomSelect";

interface CustomDatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

const months: Option<number>[] = [
  { value: 0, label: "Janeiro" },
  { value: 1, label: "Fevereiro" },
  { value: 2, label: "Março" },
  { value: 3, label: "Abril" },
  { value: 4, label: "Maio" },
  { value: 5, label: "Junho" },
  { value: 6, label: "Julho" },
  { value: 7, label: "Agosto" },
  { value: 8, label: "Setembro" },
  { value: 9, label: "Outubro" },
  { value: 10, label: "Novembro" },
  { value: 11, label: "Dezembro" },
];

const years: Option<number>[] = Array.from({ length: 50 }, (_, i) => ({
  value: 2000 + i,
  label: String(2000 + i),
}));

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
      dateFormat="dd/MM/yyyy"
      onKeyDown={(e) => e.preventDefault()}
      onFocus={(e) => e.target.blur()}
      renderCustomHeader={({ date, changeYear, changeMonth }) => (
        <div
          className={styles.customHeaderSelect}
          style={{
            display: "flex",
            gap: "8px",
            backgroundColor: "var(--mainBg)",
            margin: "0 8px",
            borderRadius: "3px",
          }}
        >
          <CustomSelect
            options={months}
            value={
              months.find((month) => month.value === date.getMonth()) ?? null
            }
            onChange={(option) => {
              if (option) {
                changeMonth(option.value);
              }
            }}
          />

          <CustomSelect
            options={years}
            value={
              years.find((year) => year.value === date.getFullYear()) ?? null
            }
            onChange={(option) => {
              if (option) {
                changeYear(option.value);
              }
            }}
          />
        </div>
      )}
    />
  );
}
