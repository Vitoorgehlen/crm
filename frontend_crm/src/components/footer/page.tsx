"use client";

import styles from "./page.module.css";
import packageJson from "../../../package.json";

const Footer = () => {
  return (
    <div className={styles.content}>
      <span></span>
      <span>Feito por Vitor Gehlen</span>
      <span>V{packageJson.version}</span>
    </div>
  );
};

export default Footer;
