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
import { FaRegFolderOpen } from "react-icons/fa";
import { FiUserX } from "react-icons/fi";
import { GrCompliance } from "react-icons/gr";
import { MdOutlineQueryStats } from "react-icons/md";

import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

const Sidebar = () => {
  const pathname = usePathname();
  const { permissions } = useAuth();

  return (
    <div className={styles.sidebar}>
      <div className={styles.contentbar}>
        <div className={styles.sidebarMenu}>
          <Link href="/home">
            <Image
              src="/images/logo.png"
              alt="Lodo do sistema"
              className={styles.logo}
              width={35}
              height={58.84}
            />
          </Link>
        </div>
        <div className={styles.sidebarActions}>
          <Link href="/clientes">
            <span
              className={`${styles.iconContainer} 
                        ${pathname === "/clientes" ? styles.active : ""}`}
            >
              <TiContacts className={styles.logos} />
            </span>
          </Link>
          <Link href="/arquivados">
            <span
              className={`${styles.iconContainer} 
                        ${pathname === "/arquivados" ? styles.active : ""}`}
            >
              <FaRegFolderOpen className={styles.logos} />
            </span>
          </Link>
          <Link href="/negociacoes">
            <span
              className={`${styles.iconContainer} 
                        ${pathname === "/negociacoes" ? styles.active : ""}`}
            >
              <TbHomeSearch className={styles.logos} />
            </span>
          </Link>
          <Link href="/fechados">
            <span
              className={`${styles.iconContainer} 
                        ${pathname === "/fechados" ? styles.active : ""}`}
            >
              <TbContract className={styles.logos} />
            </span>
          </Link>
          <Link href="/finalizados">
            <span
              className={`${styles.iconContainer} 
                        ${pathname === "/finalizados" ? styles.active : ""}`}
            >
              <GrCompliance className={styles.logos} />
            </span>
          </Link>
          <Link href="/comissoes">
            <span
              className={`${styles.iconContainer} 
                        ${pathname === "/comissoes" ? styles.active : ""}`}
            >
              <TbPigMoney className={styles.logos} />
            </span>
          </Link>
          {permissions.includes("ALL_DEAL_DELETE") && (
            <Link href="/desempenho">
              <span
                className={`${styles.iconContainer} 
                            ${pathname === "/desempenho" ? styles.active : ""}`}
              >
                <MdOutlineQueryStats className={styles.logos} />
              </span>
            </Link>
          )}
          {permissions.includes("ALL_DEAL_DELETE") && (
            <Link href="/requisicoes">
              <span
                className={`${styles.iconContainer} 
                            ${
                              pathname === "/requisicoes" ? styles.active : ""
                            }`}
              >
                <FiUserX className={styles.logos} />
              </span>
            </Link>
          )}
        </div>
        <div className={styles.sidebarSettings}>
          <Link href="/config">
            <TbSettings className={styles.logos} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
