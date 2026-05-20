"use client";

import Link from "next/link";
import { useState } from "react";

export default function NotFound() {
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
        color: "var(--primaryText)",
      }}
    >
      <h2>404</h2>
      <p>Página não encontrada</p>

      <Link
        href="/home"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          color: hover ? "var(--primaryColor)" : "var(--textBase)",
          transition: "0.2s",
        }}
      >
        Voltar para Home
      </Link>
    </div>
  );
}
