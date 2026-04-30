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
      <div className={`glass ${styles.contant}`}>
        <h5>Personalize o tema do seu CRM!</h5>
        <div className={styles.btns}>
          <button
            className={`glass ${styles.btn} ${styles.btnDefaultDark}`}
            onClick={() => setTheme("default-dark")}
          >
            Padrão
            <span>Escuro</span>
          </button>
          <button
            className={`glass ${styles.btn} ${styles.btnBlueDark}`}
            onClick={() => setTheme("blue-dark")}
          >
            Azul
            <span>Escuro</span>
          </button>
          <button
            className={`glass ${styles.btn} ${styles.btnPinkDark}`}
            onClick={() => setTheme("pink-dark")}
          >
            Rosa
            <span>Escuro</span>
          </button>
          <button
            className={`glass ${styles.btn} ${styles.btnRedDark}`}
            onClick={() => setTheme("red-dark")}
          >
            Vermelho
            <span>Escuro</span>
          </button>
        </div>
        <div className={styles.btns}>
          <button
            className={`glass ${styles.btn} ${styles.btnDefault}`}
            onClick={() => setTheme("default-light")}
          >
            Padrão
            <span>Claro</span>
          </button>
          <button
            className={`glass ${styles.btn} ${styles.btnBlue}`}
            onClick={() => setTheme("blue-light")}
          >
            Azul
            <span>Claro</span>
          </button>
          <button
            className={`glass ${styles.btn} ${styles.btnPink}`}
            onClick={() => setTheme("pink-light")}
          >
            Rosa
            <span>Claro</span>
          </button>
          <button
            className={`glass ${styles.btn} ${styles.btnRed}`}
            onClick={() => setTheme("red-light")}
          >
            Vermelho
            <span>Claro</span>
          </button>
        </div>
      </div>
    </div>
  );
}
