"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Tooltip.module.css";

export default function Tooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [align, setAlign] = useState<"center" | "left" | "right">("center");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updatePosition() {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;

      if (rect.right > screenWidth - 80) {
        setAlign("right");
      } else if (rect.left < 80) {
        setAlign("left");
      } else {
        setAlign("center");
      }
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, []);

  return (
    <div ref={ref} className={styles.wrapper}>
      {children}
      <span className={`${styles.tooltip} ${styles[align]}`}>{label}</span>
    </div>
  );
}
