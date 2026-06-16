"use client";

import Link from "next/link";
import styles from "./page.module.css";
import { usePathname } from "next/navigation";
import { TiContacts } from "react-icons/ti";
import { TbSettings, TbContract, TbHomeSearch } from "react-icons/tb";
import { RxHamburgerMenu } from "react-icons/rx";
import { IoMdClose } from "react-icons/io";
import { FaRegFolderOpen } from "react-icons/fa";
import { LuCalculator } from "react-icons/lu";
import { FiUserX } from "react-icons/fi";
import { GrCompliance } from "react-icons/gr";
import { MdOutlineQueryStats } from "react-icons/md";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import Logo from "@/utils/Logo";

const Sidebar = () => {
  const pathname = usePathname();
  const { permissions, planRules } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const expensePlan = planRules?.includes("EXPENSE_DASHBOARD");
  const requestPlan = planRules?.includes("DELETE_REQUESTS");

  return (
    <>
      <div className={styles.mobile}>
        <div className={styles.logo}>
          <Link href="/home" onClick={() => setIsOpen(false)}>
            <Logo
              className={
                pathname === "/home" ? styles.logoHome : styles.logoAll
              }
            />
            <p className={styles.nameLogo}>cloop</p>
          </Link>
        </div>

        <button
          className={styles.menuButton}
          onClick={() => setIsOpen(!isOpen)}
        >
          <RxHamburgerMenu />
        </button>
      </div>
      <div
        className={`${styles.sidebar} ${isOpen && styles.sidebarOpen}`}
        onClick={() => setIsOpen(false)}
      >
        <div className={styles.contentbar} onClick={(e) => e.stopPropagation()}>
          <div className={styles.sidebarMenu}>
            {isOpen && <div className={styles.gapNull}></div>}
            <div className={styles.logo}>
              <Link href="/home" onClick={() => setIsOpen(false)}>
                <Logo
                  className={
                    pathname === "/home" ? styles.logoHome : styles.logoAll
                  }
                />
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
          <div className={styles.sidebarActions}>
            <Link href="/clientes" onClick={() => setIsOpen(false)}>
              <div
                className={`${pathname === "/clientes" && styles.active} ${styles.icons} ${styles.hoverUnderline}`}
              >
                <TiContacts className={styles.logos} />
                <p className={`linkText ${styles.linkText}`}>Clientes</p>
              </div>
            </Link>
            <Link href="/negociacoes" onClick={() => setIsOpen(false)}>
              <div
                className={`${pathname === "/negociacoes" && styles.active} ${styles.icons} ${styles.hoverUnderline}`}
              >
                <TbHomeSearch className={styles.logos} />
                <p className={`linkText ${styles.linkText}`}>Negociações</p>
              </div>
            </Link>
            <Link href="/fechados" onClick={() => setIsOpen(false)}>
              <div
                className={`${pathname === "/fechados" && styles.active} ${styles.icons} ${styles.hoverUnderline}`}
              >
                <TbContract className={styles.logos} />
                <p className={`linkText ${styles.linkText}`}>Fechados</p>
              </div>
            </Link>
            <Link href="/finalizados" onClick={() => setIsOpen(false)}>
              <div
                className={`${pathname === "/finalizados" && styles.active} ${styles.icons} ${styles.hoverUnderline}`}
              >
                <GrCompliance className={styles.logos} />
                <p className={`linkText ${styles.linkText}`}>Finalizados</p>
              </div>
            </Link>
            <Link href="/financeiro" onClick={() => setIsOpen(false)}>
              <div
                className={`${pathname === "/financeiro" && styles.active} ${styles.icons} ${styles.hoverUnderline}`}
              >
                <LuCalculator className={styles.logos} />
                <p className={`linkText ${styles.linkText}`}>Financeiro</p>
              </div>
            </Link>
            {permissions.includes("ALL_DEAL_DELETE") && expensePlan && (
              <Link href="/desempenho" onClick={() => setIsOpen(false)}>
                <div
                  className={`${pathname === "/desempenho" && styles.active} ${styles.icons} ${styles.hoverUnderline}`}
                >
                  <MdOutlineQueryStats className={styles.logos} />
                  <p className={`linkText ${styles.linkText}`}>Desempenho</p>
                </div>
              </Link>
            )}
            <Link href="/arquivados" onClick={() => setIsOpen(false)}>
              <div
                className={`${pathname === "/arquivados" && styles.active} ${styles.icons} ${styles.hoverUnderline}`}
              >
                <FaRegFolderOpen className={styles.logos} />
                <p className={`linkText ${styles.linkText}`}>Arquivados</p>
              </div>
            </Link>
            {permissions.includes("ALL_DEAL_DELETE") && requestPlan && (
              <Link href="/requisicoes" onClick={() => setIsOpen(false)}>
                <div
                  className={`${pathname === "/requisicoes" && styles.active} ${styles.icons} ${styles.hoverUnderline}`}
                >
                  <FiUserX className={styles.logos} />
                  <p className={`linkText ${styles.linkText}`}>Requisições</p>
                </div>
              </Link>
            )}
          </div>
          <div className={styles.sidebarSettings}>
            <Link href="/config" onClick={() => setIsOpen(false)}>
              <div
                className={`  ${pathname === "/config" && styles.active} ${styles.icons} ${styles.hoverUnderline}`}
              >
                <TbSettings className={styles.logos} />
                <p className={`linkText ${styles.linkText}`}>Configurações</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
