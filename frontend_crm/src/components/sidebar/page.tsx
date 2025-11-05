"use client";

import Link from "next/link";
import styles from "./page.module.css";
import { usePathname } from "next/navigation";
import { TiContacts } from "react-icons/ti";
import {
  TbSettings,
  TbContract,
  TbPigMoney,
  TbHomeSearch,
} from "react-icons/tb";
import { RxHamburgerMenu } from "react-icons/rx";
import { IoMdClose } from "react-icons/io";
import { FaRegFolderOpen } from "react-icons/fa";
import { FiUserX } from "react-icons/fi";
import { GrCompliance } from "react-icons/gr";
import { MdOutlineQueryStats } from "react-icons/md";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const Sidebar = () => {
  const pathname = usePathname();
  const { permissions } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {!isOpen && (
        <div className={styles.header}>
          <Link href="/home" onClick={() => setIsOpen(false)}>
            <div className={styles.logoH}>
              <h2 className={styles.logoTextH}>cloop</h2>
            </div>
          </Link>

          <button
            className={styles.menuButton}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <IoMdClose /> : <RxHamburgerMenu />}
          </button>
        </div>
      )}
      <div
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
        onClick={() => setIsOpen(false)}
      >
        <div className={styles.contentbar} onClick={(e) => e.stopPropagation()}>
          <div className={styles.sidebarMenu}>
            <Link href="/home" onClick={() => setIsOpen(false)}>
              <span
                className={`${styles.iconContainer} 
                        ${pathname === "/home" ? styles.logoActive : ""}`}
              >
                <div className={styles.logo}>
                  <h2 className={styles.logoText}>cloop</h2>
                </div>
              </span>
            </Link>
          </div>
          <div className={styles.sidebarActions}>
            <Link href="/clientes" onClick={() => setIsOpen(false)}>
              <span
                className={`${styles.iconContainer} 
                        ${pathname === "/clientes" ? styles.active : ""}`}
              >
                <TiContacts className={styles.logos} />
                <span className={styles.linkText}>Clientes</span>
              </span>
            </Link>
            <Link href="/arquivados" onClick={() => setIsOpen(false)}>
              <span
                className={`${styles.iconContainer} 
              ${pathname === "/arquivados" ? styles.active : ""}`}
              >
                <FaRegFolderOpen className={styles.logos} />
                <span className={styles.linkText}>Arquivados</span>
              </span>
            </Link>
            <Link href="/negociacoes" onClick={() => setIsOpen(false)}>
              <span
                className={`${styles.iconContainer} 
              ${pathname === "/negociacoes" ? styles.active : ""}`}
              >
                <TbHomeSearch className={styles.logos} />
                <span className={styles.linkText}>Negociações</span>
              </span>
            </Link>
            <Link href="/fechados" onClick={() => setIsOpen(false)}>
              <span
                className={`${styles.iconContainer} 
              ${pathname === "/fechados" ? styles.active : ""}`}
              >
                <TbContract className={styles.logos} />
                <span className={styles.linkText}>Fechados</span>
              </span>
            </Link>
            <Link href="/finalizados" onClick={() => setIsOpen(false)}>
              <span
                className={`${styles.iconContainer} 
              ${pathname === "/finalizados" ? styles.active : ""}`}
              >
                <GrCompliance className={styles.logos} />
                <span className={styles.linkText}>Finalizados</span>
              </span>
            </Link>
            <Link href="/comissoes" onClick={() => setIsOpen(false)}>
              <span
                className={`${styles.iconContainer} 
              ${pathname === "/comissoes" ? styles.active : ""}`}
              >
                <TbPigMoney className={styles.logos} />
                <span className={styles.linkText}>Comissões</span>
              </span>
            </Link>
            {permissions.includes("ALL_DEAL_DELETE") && (
              <Link href="/desempenho" onClick={() => setIsOpen(false)}>
                <span
                  className={`${styles.iconContainer} 
                ${pathname === "/desempenho" ? styles.active : ""}`}
                >
                  <MdOutlineQueryStats className={styles.logos} />
                  <span className={styles.linkText}>Desempenho</span>
                </span>
              </Link>
            )}
            {permissions.includes("ALL_DEAL_DELETE") && (
              <Link href="/requisicoes" onClick={() => setIsOpen(false)}>
                <span
                  className={`${styles.iconContainer} 
                ${pathname === "/requisicoes" ? styles.active : ""}`}
                >
                  <FiUserX className={styles.logos} />
                  <span className={styles.linkText}>Requisições</span>
                </span>
              </Link>
            )}
          </div>
          <div className={styles.sidebarSettings}>
            <Link href="/config" onClick={() => setIsOpen(false)}>
              <span
                className={`${styles.iconContainer} 
                ${pathname === "/config" ? styles.active : ""}`}
              >
                <TbSettings className={styles.logos} />
                <span className={styles.linkText}>Configurações</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
