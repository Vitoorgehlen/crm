"use client";

import { IoMdSearch } from "react-icons/io";
import { HiUserGroup } from "react-icons/hi2";
import styles from "./page.module.css";
import { User } from "@/types";

interface DealsHeaderProps {
  search: string;
  setSearch: (value: string) => void;
  teamDeals: boolean;
  setTeamDeals: (value: boolean) => void;
  users: User[];
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
  permissions: string[];
  onCreate: () => void;
  loading: boolean;
}

export default function DealsHeader({
  search,
  setSearch,
  teamDeals,
  setTeamDeals,
  users,
  selectedUser,
  setSelectedUser,
  permissions,
  loading,
}: DealsHeaderProps) {
  return (
    <div className={styles.headerContent}>
      <div className={styles.serchDeal}>
        <button className={styles.btnSearch} type="button" disabled={loading}>
          <IoMdSearch />
        </button>
        <input
          type="text"
          placeholder="Pesquise pelo nome"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {teamDeals && (
        <div className={styles.selectUser}>
          <select
            value={selectedUser ? selectedUser.id : ""}
            onChange={(e) => {
              const user = users.find((u) => u.id === Number(e.target.value));
              setSelectedUser(user || null);
            }}
          >
            <option value={""}>Todos</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.headerIcons}>
        {permissions.includes("ALL_DEAL_READ") && (
          <button
            className={`${styles.btnFilter} ${
              teamDeals ? styles.btnFilterActive : ""
            }`}
            onClick={() => setTeamDeals(!teamDeals)}
            type="button"
          >
            <HiUserGroup />
          </button>
        )}
      </div>
    </div>
  );
}
