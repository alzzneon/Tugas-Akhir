// src/Components/Admin/Input.jsx
"use client";

import { colors, radius } from "../../styles/tokens/admin";

export default function Input({
  error,
  className = "",
  style,
  ...props
}) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: radius.md,
        border: `1px solid ${error ? colors.danger : colors.border}`,
        outline: "none",
        color: colors.text,
        background: colors.white,
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primarySoft}`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
      className={className}
    />
  );
}
