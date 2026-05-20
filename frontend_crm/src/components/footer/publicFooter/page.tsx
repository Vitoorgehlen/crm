"use client";

import styles from "./page.module.css";
import { useRouter } from "next/navigation";

const PublicFooter = () => {
  const router = useRouter();

  return (
    <div className={styles.footerHome}>
      <div className={styles.footerColumn}>
        <h5>Institucional</h5>
        <button
          className={styles.btnFooter}
          onClick={() => router.push("/sobre")}
        >
          <p>Sobre o Cloop</p>
        </button>
      </div>

      <div className={styles.footerColumn}>
        <h5>Contato</h5>
        <button
          className={styles.btnFooter}
          onClick={() => router.push("/contato")}
        >
          <p>E-mail</p>
        </button>
        <button
          className={styles.btnFooter}
          onClick={() =>
            window.open(
              "https://wa.me/5554991963922?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20mais%20sobre%20o%20Cloop!",
              "_blank",
            )
          }
        >
          <p>WhatsApp</p>
        </button>
      </div>

      <div className={styles.footerColumn}>
        <h5>Jurídico</h5>
        <button
          className={styles.btnFooter}
          onClick={() => router.push("/termos")}
        >
          <p>Termos de Uso</p>
        </button>
        <button
          className={styles.btnFooter}
          onClick={() => router.push("/privacidade")}
        >
          <p>Política de Privacidade</p>
        </button>
      </div>
    </div>
  );
};

export default PublicFooter;
