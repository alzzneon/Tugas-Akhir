"use client";

import { colors, radius, shadow } from "../../styles/tokens/admin";

export default function Card({ children, className = "", style }) {
  return (
    <div
      style={{
        background: colors.white,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        boxShadow: shadow.sm,
        padding: 16,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}
