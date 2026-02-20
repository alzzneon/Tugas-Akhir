"use client";

import { colors, radius } from "../../styles/tokens/admin";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  ...props
}) {
  const isDisabled = disabled || loading;

  const base = {
    borderRadius: radius.md,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: isDisabled ? "not-allowed" : "pointer",
    opacity: isDisabled ? 0.7 : 1,
    transition: "all 150ms ease",
    userSelect: "none",
  };

  const sizes = {
    sm: { padding: "8px 12px", fontSize: 12 },
    md: { padding: "10px 14px", fontSize: 14 },
    lg: { padding: "12px 16px", fontSize: 14 },
  };

  const variants = {
    primary: {
      background: colors.primary,
      color: colors.white,
      border: `1px solid ${colors.primary}`,
    },
    outline: {
      background: colors.white,
      color: colors.text,
      border: `1px solid ${colors.border}`,
    },
    danger: {
      background: colors.danger,
      color: colors.white,
      border: `1px solid ${colors.danger}`,
    },
    ghost: {
      background: "transparent",
      color: colors.text,
      border: "1px solid transparent",
    },
  };

  return (
    <button
      {...props}
      disabled={isDisabled}
      style={{
        ...base,
        ...sizes[size],
        ...variants[variant],
      }}
      className={className}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
