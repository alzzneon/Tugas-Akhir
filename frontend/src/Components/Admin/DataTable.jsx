import { useEffect, useMemo, useState } from "react";

export default function DataTable({
  title,
  subtitle,
  searchValue = "",
  onSearchChange,
  searchRight,
  onCreate,
  createLabel = "+ Tambah",
  headerRight,
  columns = [],
  rows = [],
  loading = false,
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
    <div className="flex flex-col gap-4 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#E0E0E0] pb-3.5">
        <div className="border-l-4 border-l-[#C8102E] pl-3">
          <h1 className="m-0 text-[15px] font-bold uppercase tracking-[0.06em] text-[#1A1A1A]">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-0.5 text-[11px] tracking-[0.02em] text-[#999999]">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {headerRight}

          {onCreate && (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 bg-[#C8102E] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.05em] text-white transition hover:opacity-95"
            >
              {createLabel}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      {onSearchChange && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-[280px]">
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-[#AAAAAA]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari data..."
              className="w-full border border-[#DDDDDD] bg-[#FAFAFA] px-2.5 py-2 pl-8 text-[12px] tracking-[0.02em] text-[#333333] outline-none transition focus:border-[#C8102E] focus:bg-white"
            />
          </div>

          {searchRight && <div className="relative">{searchRight}</div>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden border border-[#E0E0E0] border-t-4 border-t-[#C8102E] bg-white">
        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b-2 border-[#E0E0E0] bg-[#F5F5F5]">
                <th className="w-[52px] whitespace-nowrap bg-[#F5F5F5] px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#888888]">
                  No
                </th>

                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="whitespace-nowrap bg-[#F5F5F5] px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#888888]"
                  >
                    {c.label}
                  </th>
                ))}

                {showActions && (
                  <th className="whitespace-nowrap bg-[#F5F5F5] px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#888888]">
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
                    className="px-3.5 py-10 text-center text-[12px] tracking-[0.03em] text-[#AAAAAA]"
                  >
                    Memuat data...
                  </td>
                </tr>
              )}

              {!loading && paginatedRows.length === 0 && (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="px-3.5 py-10 text-center text-[12px] tracking-[0.03em] text-[#BBBBBB]"
                  >
                    Data tidak tersedia
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedRows.map((row, index) => (
                  <tr
                    key={row.id || row.booking_code || index}
                    className="border-b border-[#F0F0F0] transition hover:bg-[#FAFAFA]"
                  >
                    <td className="px-3.5 py-2.5 text-[12px] font-semibold text-[#AAAAAA]">
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
                          className="px-3.5 py-2.5 text-[12.5px] text-[#333333]"
                        >
                          {isClickable ? (
                            <button
                              type="button"
                              onClick={() => onClickCell(row)}
                              className="p-0 text-[12.5px] font-bold tracking-[0.01em] text-[#C8102E] underline"
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
                      <td className="px-3.5 py-2.5">
                        {actionsRender ? (
                          actionsRender({ row })
                        ) : (
                          <div className="flex gap-1.5">
                            {onEdit && (
                              <button
                                type="button"
                                onClick={() => onEdit(row)}
                                className="border border-[#CCCCCC] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#444444] transition hover:bg-[#F5F5F5]"
                              >
                                Edit
                              </button>
                            )}

                            {onDelete && (
                              <button
                                type="button"
                                onClick={() => onDelete(row)}
                                className="border border-[#F5CCCC] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#C8102E] transition hover:bg-[#FFF5F5]"
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
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[#E0E0E0] bg-[#FAFAFA] px-3.5 py-2.5">
            <div className="text-[11px] tracking-[0.02em] text-[#888888]">
              Menampilkan{" "}
              <span className="font-bold text-[#333333]">{startRow}</span>
              {" – "}
              <span className="font-bold text-[#333333]">{endRow}</span>
              {" dari "}
              <span className="font-bold text-[#333333]">{rows.length}</span>
              {" data"}
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="cursor-pointer border border-[#DDDDDD] bg-white px-2 py-1 text-[11px] text-[#444444] outline-none focus:border-[#C8102E]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>

              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="border border-[#DDDDDD] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#444444] transition hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:text-[#CCCCCC] disabled:hover:bg-white"
              >
                ← Prev
              </button>

              <span className="inline-block min-w-[60px] bg-[#C8102E] px-2.5 py-1 text-center text-[11px] font-bold tracking-[0.05em] text-white">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="border border-[#DDDDDD] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#444444] transition hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:text-[#CCCCCC] disabled:hover:bg-white"
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