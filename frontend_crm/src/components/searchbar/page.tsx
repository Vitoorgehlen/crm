"use client";

import { User } from "@/types";
import { HiUserGroup } from "react-icons/hi2";
import { BsFileEarmarkPlus } from "react-icons/bs";
import { AiOutlineUserAdd } from "react-icons/ai";
import UserSelect from "../Tools/Select/UserSelect";
import styles from "./page.module.css";
import Tooltip from "../Tools/Tooltip/Tooltip";

interface HeaderProps {
  title: string;
  search: string;
  setSearch: (value: string) => void;
  add: boolean;
  teamMode: boolean;
  setTeamMode: (value: boolean) => void;
  users: User[];
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
  permissions: string[];
  onCreate: () => void;
  showClearButton?: boolean;
}

export default function HeaderPage({
  title,
  search,
  setSearch,
  teamMode: teamDeals,
  add,
  setTeamMode: setTeamDeals,
  users,
  selectedUser,
  setSelectedUser,
  permissions,
  onCreate,
  showClearButton,
}: HeaderProps) {
  const handleToggleTeamDeals = () => {
    const newValue = !teamDeals;
    setTeamDeals(newValue);

    if (!newValue) setSelectedUser(null);
  };
  return (
    <div className={styles.headerContent}>
      <div className={`${teamDeals && styles.titleTeam} ${styles.title}`}>
        <h3>{title}</h3>
        <h5>{teamDeals && " da equipe"}</h5>
      </div>
      <div className={styles.headerIcons}>
        {!showClearButton && (
          <>
            <input
              className={`${styles.serchDeal} form-base`}
              type="text"
              placeholder={`${
                title === "Clientes" ? "Buscar clientes" : "Buscar negociações"
              } ${teamDeals ? "da equipe" : ""}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {teamDeals && (
              <UserSelect
                users={users}
                value={selectedUser}
                onChange={setSelectedUser}
              />
            )}

            {permissions.includes("ALL_DEAL_READ") && (
              <Tooltip label={"Modo equipe"}>
                <button
                  className={`${
                    teamDeals ? "btn-action-active" : "btn-action-inactive"
                  } btn-action glass`}
                  onClick={handleToggleTeamDeals}
                  type="button"
                >
                  <HiUserGroup />
                </button>
              </Tooltip>
            )}

            {permissions.includes("DEAL_CREATE") && add && (
              <Tooltip
                label={`Adicionar ${
                  title === "Clientes" ? "cliente" : "negociação"
                }`}
              >
                <button
                  className={`${styles.addDeal} btn-action glass`}
                  onClick={onCreate}
                  type="button"
                >
                  {title === "Clientes" ? (
                    <AiOutlineUserAdd />
                  ) : (
                    <BsFileEarmarkPlus />
                  )}
                </button>
              </Tooltip>
            )}
          </>
        )}
      </div>
    </div>
  );
}
