"use client";

import Select from "react-select";
import styles from "./select.module.css";
import { User } from "@/types";
import { useMemo } from "react";

interface UserSelectProps {
  users: User[];
  value: User | null;
  onChange: (user: User | null) => void;
}

export default function UserSelect({
  users,
  value,
  onChange,
}: UserSelectProps) {
  const options = useMemo(
    () => [
      { value: "", label: "Todos" },
      ...users.map((user) => ({
        value: user.id,
        label: user.name,
      })),
    ],
    [users],
  );

  return (
    <Select
      options={options}
      value={
        value
          ? { value: value.id, label: value.name }
          : { value: "", label: "Todos" }
      }
      onChange={(option) => {
        if (!option || option.value === "") {
          onChange(null);
          return;
        }

        const user = users.find((u) => u.id === option.value);
        onChange(user || null);
      }}
      className={styles.container}
      classNames={{
        control: () => styles.control,
        menu: () => styles.menu,
        option: (state) =>
          `${styles.option} ${state.isFocused ? styles.optionFocused : ""} ${
            state.isSelected ? styles.optionSelected : ""
          }`,
        singleValue: () => styles.singleValue,
        placeholder: () => styles.placeholder,
        input: () => styles.input,
        indicatorSeparator: () => styles.indicatorSeparator,
        dropdownIndicator: () => styles.dropdownIndicator,
      }}
    />
  );
}
