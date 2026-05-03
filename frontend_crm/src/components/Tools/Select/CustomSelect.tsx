"use client";

import Select from "react-select";
import styles from "./select.module.css";

export interface Option<T = unknown> {
  value: T;
  label: string;
}

interface CustomSelectProps<T> {
  options: Option<T>[];
  value: Option<T> | null;
  onChange: (value: Option<T> | null) => void;
  isDisabled?: boolean;
}

export default function CustomSelect<T>({
  options,
  value,
  onChange,
  isDisabled,
}: CustomSelectProps<T>) {
  return (
    <Select<Option<T>, false>
      options={options}
      value={value}
      onChange={(option) => onChange(option as Option<T> | null)}
      isDisabled={isDisabled}
      className={styles.container}
      menuPortalTarget={typeof window !== "undefined" ? document.body : null}
      menuPosition="fixed"
      styles={{
        menuPortal: (base) => ({
          ...base,
          zIndex: 9999,
        }),
      }}
      classNames={{
        menuList: () => styles.menuList,
        control: () => styles.control,
        menu: () => styles.menu,
        option: (state) => {
          const index = options.findIndex(
            (opt) => opt.value === state.data.value,
          );

          const isFirst = index === 0;
          const isLast = index === options.length - 1;

          return `
    ${styles.option}
    ${state.isFocused ? styles.optionFocused : ""}
    ${state.isSelected ? styles.optionSelected : ""}
    ${isFirst && state.isSelected ? styles.firstSelected : ""}
    ${isLast && state.isSelected ? styles.lastSelected : ""}
  `;
        },
        singleValue: () => styles.singleValue,
        placeholder: () => styles.placeholder,
        input: () => styles.input,
        indicatorSeparator: () => styles.indicatorSeparator,
        dropdownIndicator: () => styles.dropdownIndicator,
      }}
    />
  );
}
