// src/Components/Admin/StatusBadge.jsx
"use client";

import { colors, radius } from "../../styles/tokens/admin";

export default function StatusBadge({ status }) {
  const map = {
    available: { bg: "#dcfce7", fg: "#166534", label: "Tersedia" },
    rented: { bg: "#fef9c3", fg: "#854d0e", label: "Disewa" },
    maintenance: { bg: "#fee2e2", fg: "#991b1b", label: "Maintenance" },
  };

  const s = map[status] || { bg: colors.primarySoft, fg: colors.text, label: status };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: radius.lg,
        background: s.bg,
        color: s.fg,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}
