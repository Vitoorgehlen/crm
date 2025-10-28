"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  return (
    <div className={styles.main}>
      <div className={styles.contant}>
        <h2>Personalize o tema do seu CRM!</h2>
        <div className={styles.btns}>
          <button
            className={styles.btnDefaultDark}
            onClick={() => setTheme("default-dark")}
          >
            Padrão
            <p>Escuro</p>
          </button>
          <button
            className={styles.btnBlueDark}
            onClick={() => setTheme("blue-dark")}
          >
            Azul
            <p>Escuro</p>
          </button>
          <button
            className={styles.btnPinkDark}
            onClick={() => setTheme("pink-dark")}
          >
            Rosa
            <p>Escuro</p>
          </button>
        </div>
        <div className={styles.btns}>
          <button
            className={styles.btnDefault}
            onClick={() => setTheme("default-light")}
          >
            Padrão
            <p>Claro</p>
          </button>
          <button
            className={styles.btnBlue}
            onClick={() => setTheme("blue-light")}
          >
            Azul
            <p>Claro</p>
          </button>
          <button
            className={styles.btnPink}
            onClick={() => setTheme("pink-light")}
          >
            Rosa
            <p>Claro</p>
          </button>
        </div>
      </div>
    </div>
  );
}
