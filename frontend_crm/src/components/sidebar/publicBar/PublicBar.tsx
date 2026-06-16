"use client";

import Link from "next/link";
import styles from "./page.module.css";
import { RxHamburgerMenu } from "react-icons/rx";
import { IoMdClose } from "react-icons/io";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Logo from "@/utils/Logo";

const PublicBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    if (pathname !== "/") {
      router.replace(`/?scroll=${id}`);
      return;
    }

    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <div className={styles.sidebarContent}>
      <div className={styles.homebar}>
        <div className={styles.logo}>
          <Link href="/" onClick={() => setIsOpen(false)}>
            <Logo className={styles.logoHome} />
            <p className={styles.nameLogo}>cloop</p>
          </Link>
        </div>
        <div className={styles.menuButtonsDisplay}>
          <button
            className={styles.menuButtons}
            onClick={() => router.push("/sobre")}
          >
            <h5>Sobre o Cloop</h5>
          </button>

          <button
            className={styles.menuButtons}
            onClick={() => scrollToSection("planos")}
          >
            <h5>Planos</h5>
          </button>

          <button
            className={styles.menuButtonStart}
            onClick={() => router.push("/cadastro")}
          >
            <h5>Solicite acesso</h5>
          </button>

          <button
            className={styles.menuButtonLogin}
            onClick={() => router.push("/login")}
          >
            <h5>Entrar</h5>
          </button>
        </div>

        <button
          className={styles.menuButton}
          onClick={() => setIsOpen(!isOpen)}
        >
          <RxHamburgerMenu />
        </button>
      </div>

      {isOpen && (
        <div className={styles.sidebarOpen} onClick={() => setIsOpen(false)}>
          <div
            className={styles.contentbar}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.sidebarMenu}>
              <div className={styles.gapNull} />
              <div className={styles.logo}>
                <Link href="/" onClick={() => setIsOpen(false)}>
                  <Logo className={styles.logoHome} />
                  <p className={styles.nameLogo}>cloop</p>
                </Link>
              </div>

              {isOpen && (
                <button
                  className={styles.menuButton}
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <IoMdClose />
                </button>
              )}
            </div>

            <button
              className={styles.menuButtons}
              onClick={() => router.push("/sobre")}
            >
              <h5>Sobre o Cloop</h5>
            </button>

            <button
              className={styles.menuButtons}
              onClick={() => scrollToSection("planos")}
            >
              <h5>Planos</h5>
            </button>

            <button
              className={styles.menuButtonStart}
              onClick={() => router.push("/cadastro")}
            >
              <h5>Solicite acesso</h5>
            </button>

            <button
              className={styles.menuButtonLogin}
              onClick={() => router.push("/login")}
            >
              <h5>Entrar</h5>
            </button>

            {/* <div className={styles.sidebarActions}>
                <Link href="/clientes" onClick={() => setIsOpen(false)}>
                  <div
                    className={`${pathname === "/clientes" && styles.active} ${styles.icons}`}
                  >
                    <TiContacts className={styles.logos} />
                    <p className={styles.linkText}>Clientes</p>
                  </div>
                </Link>
              </div>
              <div className={styles.sidebarSettings}>
                <Link href="/config" onClick={() => setIsOpen(false)}>
                  <div
                    className={`  ${pathname === "/config" && styles.active} ${styles.icons}`}
                  >
                    <TbSettings className={styles.logos} />
                    <p className={styles.linkText}>Configurações</p>
                  </div>
                </Link>
              </div> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicBar;
