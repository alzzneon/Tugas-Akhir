"use client";

import { colors, radius, shadow } from "../../styles/tokens/admin";

export default function AdminTable({
  headers = [],
  data = [],
  onEdit,
  onDelete,
  renderCell,
}) {
  return (
    <div
      style={{
        background: colors.white,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        boxShadow: shadow.sm,
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
        <thead style={{ background: colors.primarySoft }}>
          <tr>
            {headers.map((h) => (
              <th
                key={h.name}
                style={{
                  padding: "12px 14px",
                  fontSize: 12,
                  color: colors.muted,
                  textAlign: h.align || "left",
                  width: h.width,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                {h.label}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th
                style={{
                  width: 120,
                  textAlign: "right",
                  padding: "12px 14px",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                Aksi
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={headers.length + 1} style={{ padding: 16, color: colors.muted }}>
                Belum ada data
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.id}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                onMouseLeave={(e) => (e.currentTarget.style.background = colors.white)}
              >
                {headers.map((h) => (
                  <td
                    key={h.name}
                    style={{
                      padding: "12px 14px",
                      borderBottom: `1px solid ${colors.border}`,
                      textAlign: h.align || "left",
                      fontSize: 13,
                      verticalAlign: "middle",
                    }}
                  >
                    {renderCell ? renderCell(h, row) : row[h.name] ?? "-"}
                  </td>
                ))}

                {(onEdit || onDelete) && (
                  <td
                    style={{
                      textAlign: "right",
                      padding: "12px 14px",
                      borderBottom: `1px solid ${colors.border}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <button onClick={() => onEdit?.(row)} style={{ marginRight: 10 }}>
                      Edit
                    </button>
                    <button onClick={() => onDelete?.(row.id)} style={{ color: "#ef4444" }}>
                      Hapus
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
