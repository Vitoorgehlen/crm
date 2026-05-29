"use client";

import styles from "./page.module.css";
import packageJson from "../../../package.json";

const Footer = () => {
  return (
    <div className={styles.content}>
      <span></span>
      <span>© 2026 Cloop. CRM imobiliário inteligente.</span>
      <span>V{packageJson.version}</span>
    </div>
  );
};

export default Footer;
