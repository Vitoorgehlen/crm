'use client';

import styles from "./page.module.css";
import packageJson from "../../../package.json"; 

const Footer = () => {
  return (
    <div className={styles.content}>
        <h6></h6>
        <h6>Feito por Vitor Gehlen</h6>
        <h6>V{packageJson.version}</h6>
    </div>      
  );
};

export default Footer;