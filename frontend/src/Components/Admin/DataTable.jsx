import { useEffect, useMemo, useState } from "react";

export default function DataTable({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  onCreate,
  createLabel = "+ Tambah",
  headerRight,
  columns,
  rows,
  loading,
  clickableKey,
  onClickCell,
  renderCell,
  showActions = true,
  onEdit,
  onDelete,
  actionsRender,
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  useEffect(() => {
    setPage(1);
  }, [rows.length, searchValue]);

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return rows.slice(start, start + perPage);
  }, [rows, page, perPage]);

  const startRow = rows.length === 0 ? 0 : (page - 1) * perPage + 1;
  const endRow = Math.min(page * perPage, rows.length);
  const colSpan = columns.length + (showActions ? 2 : 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>

      {/* Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          paddingBottom: "14px",
          borderBottom: "2px solid #E0E0E0",
        }}
      >
        <div style={{ borderLeft: "4px solid #C8102E", paddingLeft: "12px" }}>
          <h1
            style={{
              fontSize: "15px",
              fontWeight: "700",
              color: "#1A1A1A",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: 0,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ marginTop: "2px", fontSize: "11px", color: "#999999", letterSpacing: "0.02em" }}>
              {subtitle}
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {headerRight}
          {onCreate && (
            <button
              onClick={onCreate}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 16px",
                backgroundColor: "#C8102E",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: "700",
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {createLabel}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      {onSearchChange && (
        <div style={{ position: "relative", width: "100%", maxWidth: "280px" }}>
          <svg
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "13px",
              height: "13px",
              color: "#AAAAAA",
              pointerEvents: "none",
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari data..."
            style={{
              width: "100%",
              paddingTop: "7px",
              paddingBottom: "7px",
              paddingLeft: "32px",
              paddingRight: "10px",
              fontSize: "12px",
              color: "#333333",
              backgroundColor: "#FAFAFA",
              border: "1px solid #DDDDDD",
              borderRadius: "0",
              outline: "none",
              boxSizing: "border-box",
              letterSpacing: "0.02em",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#C8102E";
              e.target.style.backgroundColor = "#FFFFFF";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#DDDDDD";
              e.target.style.backgroundColor = "#FAFAFA";
            }}
          />
        </div>
      )}

      {/* Table */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E0E0E0",
          borderTop: "3px solid #C8102E",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto", maxHeight: "70vh", overflowY: "auto" }}>
          <table style={{ minWidth: "100%", borderCollapse: "collapse" }}>

            <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
              <tr style={{ backgroundColor: "#F5F5F5", borderBottom: "2px solid #E0E0E0" }}>
                <th
                  style={{
                    width: "52px",
                    padding: "10px 14px",
                    textAlign: "left",
                    fontSize: "10px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "#888888",
                    backgroundColor: "#F5F5F5",
                    whiteSpace: "nowrap",
                  }}
                >
                  No
                </th>

                {columns.map((c) => (
                  <th
                    key={c.key}
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontSize: "10px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "#888888",
                      backgroundColor: "#F5F5F5",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.label}
                  </th>
                ))}

                {showActions && (
                  <th
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontSize: "10px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "#888888",
                      backgroundColor: "#F5F5F5",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Aksi
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={colSpan}
                    style={{
                      padding: "40px 14px",
                      textAlign: "center",
                      fontSize: "12px",
                      color: "#AAAAAA",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Memuat data...
                  </td>
                </tr>
              )}

              {!loading && paginatedRows.length === 0 && (
                <tr>
                  <td
                    colSpan={colSpan}
                    style={{
                      padding: "40px 14px",
                      textAlign: "center",
                      fontSize: "12px",
                      color: "#BBBBBB",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Data tidak tersedia
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedRows.map((row, index) => (
                  <tr
                    key={row.id}
                    style={{ borderBottom: "1px solid #F0F0F0" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFAFA")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                  >
                    <td
                      style={{
                        padding: "9px 14px",
                        fontSize: "12px",
                        color: "#AAAAAA",
                        fontWeight: "600",
                      }}
                    >
                      {(page - 1) * perPage + index + 1}
                    </td>

                    {columns.map((col) => {
                      const val = row[col.key];
                      const isClickable = clickableKey === col.key && onClickCell;
                      const content = renderCell
                        ? renderCell({ row, col })
                        : String(val ?? "");

                      return (
                        <td
                          key={col.key}
                          style={{
                            padding: "9px 14px",
                            fontSize: "12.5px",
                            color: "#333333",
                          }}
                        >
                          {isClickable ? (
                            <button
                              onClick={() => onClickCell(row)}
                              style={{
                                fontWeight: "700",
                                color: "#C8102E",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                fontSize: "12.5px",
                                textDecoration: "underline",
                                letterSpacing: "0.01em",
                              }}
                            >
                              {content}
                            </button>
                          ) : (
                            content
                          )}
                        </td>
                      );
                    })}

                    {showActions && (
                      <td style={{ padding: "9px 14px" }}>
                        {actionsRender ? (
                          actionsRender({ row })
                        ) : (
                          <div style={{ display: "flex", gap: "6px" }}>
                            {onEdit && (
                              <button
                                onClick={() => onEdit(row)}
                                style={{
                                  padding: "4px 12px",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  color: "#444444",
                                  backgroundColor: "#FFFFFF",
                                  border: "1px solid #CCCCCC",
                                  cursor: "pointer",
                                  letterSpacing: "0.04em",
                                  textTransform: "uppercase",
                                }}
                              >
                                Edit
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => onDelete(row)}
                                style={{
                                  padding: "4px 12px",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  color: "#C8102E",
                                  backgroundColor: "#FFFFFF",
                                  border: "1px solid #F5CCCC",
                                  cursor: "pointer",
                                  letterSpacing: "0.04em",
                                  textTransform: "uppercase",
                                }}
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>

          </table>
        </div>

        {/* Pagination */}
        {!loading && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              padding: "10px 14px",
              borderTop: "1px solid #E0E0E0",
              backgroundColor: "#FAFAFA",
            }}
          >
            <div style={{ fontSize: "11px", color: "#888888", letterSpacing: "0.02em" }}>
              Menampilkan{" "}
              <span style={{ fontWeight: "700", color: "#333333" }}>{startRow}</span>
              {" – "}
              <span style={{ fontWeight: "700", color: "#333333" }}>{endRow}</span>
              {" dari "}
              <span style={{ fontWeight: "700", color: "#333333" }}>{rows.length}</span>
              {" data"}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  color: "#444444",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #DDDDDD",
                  borderRadius: "0",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>

              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                style={{
                  padding: "4px 12px",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: page === 1 ? "#CCCCCC" : "#444444",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #DDDDDD",
                  borderRadius: "0",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                ← Prev
              </button>

              <span
                style={{
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#FFFFFF",
                  backgroundColor: "#C8102E",
                  letterSpacing: "0.05em",
                  minWidth: "60px",
                  textAlign: "center",
                  display: "inline-block",
                }}
              >
                {page} / {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                style={{
                  padding: "4px 12px",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: page === totalPages ? "#CCCCCC" : "#444444",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #DDDDDD",
                  borderRadius: "0",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}