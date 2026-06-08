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

  const totalPages = Math.max(
    1,
    Math.ceil(rows.length / perPage)
  );

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * perPage;

    return rows.slice(
      start,
      start + perPage
    );
  }, [rows, page, perPage]);

  const startRow =
    rows.length === 0
      ? 0
      : (page - 1) * perPage + 1;

  const endRow = Math.min(
    page * perPage,
    rows.length
  );

  const colSpan =
    columns.length +
    (showActions ? 2 : 1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-0.5 text-[12.5px] text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {headerRight}

          {onCreate && (
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-[13px] font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
            >
              {createLabel}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      {onSearchChange && (
        <div className="relative w-full max-w-xs">
          <svg
            className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle
              cx="11"
              cy="11"
              r="8"
            />
            <line
              x1="21"
              y1="21"
              x2="16.65"
              y2="16.65"
            />
          </svg>

          <input
            value={searchValue}
            onChange={(e) =>
              onSearchChange(
                e.target.value
              )
            }
            placeholder="Cari..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-[13px] text-gray-700 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

        <div className="overflow-auto max-h-[70vh]">

          <table className="min-w-full border-collapse">

            <thead className="sticky top-0 z-10">

              <tr className="border-b border-gray-100 bg-gray-50">

                <th className="w-16 bg-gray-50 px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">
                  No
                </th>

                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="bg-gray-50 px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wider text-gray-400"
                  >
                    {c.label}
                  </th>
                ))}

                {showActions && (
                  <th className="bg-gray-50 px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">

              {loading && (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="px-4 py-10 text-center"
                  >
                    Memuat data...
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedRows.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={colSpan}
                      className="px-4 py-10 text-center text-gray-400"
                    >
                      Data kosong
                    </td>
                  </tr>
                )}

              {!loading &&
                paginatedRows.map(
                  (
                    row,
                    index
                  ) => (
                    <tr
                      key={row.id}
                      className="transition hover:bg-gray-50/60"
                    >
                      <td className="px-4 py-3 text-[13px] text-gray-600">
                        {(page - 1) *
                          perPage +
                          index +
                          1}
                      </td>

                      {columns.map(
                        (col) => {
                          const val =
                            row[
                              col.key
                            ];

                          const isClickable =
                            clickableKey ===
                              col.key &&
                            onClickCell;

                          const content =
                            renderCell
                              ? renderCell(
                                  {
                                    row,
                                    col,
                                  }
                                )
                              : String(
                                  val ??
                                    ""
                                );

                          return (
                            <td
                              key={
                                col.key
                              }
                              className="px-4 py-3 text-[13px] text-gray-700"
                            >
                              {isClickable ? (
                                <button
                                  onClick={() =>
                                    onClickCell(
                                      row
                                    )
                                  }
                                  className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                                >
                                  {
                                    content
                                  }
                                </button>
                              ) : (
                                content
                              )}
                            </td>
                          );
                        }
                      )}

                      {showActions && (
                        <td className="px-4 py-3">
                          {actionsRender ? (
                            actionsRender(
                              {
                                row,
                              }
                            )
                          ) : (
                            <div className="flex gap-2">
                              {onEdit && (
                                <button
                                  onClick={() =>
                                    onEdit(
                                      row
                                    )
                                  }
                                  className="rounded-md border px-2.5 py-1 text-[12px]"
                                >
                                  Edit
                                </button>
                              )}

                              {onDelete && (
                                <button
                                  onClick={() =>
                                    onDelete(
                                      row
                                    )
                                  }
                                  className="rounded-md border px-2.5 py-1 text-[12px] text-red-600"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                )}
            </tbody>

          </table>

        </div>

        {/* Pagination */}

        {!loading && (
          <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">

            <div className="text-sm text-gray-500">
              Menampilkan{" "}
              <b>{startRow}</b>
              {" - "}
              <b>{endRow}</b>
              {" dari "}
              <b>{rows.length}</b>
              {" data"}
            </div>

            <div className="flex items-center gap-3">

              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(
                    Number(
                      e.target.value
                    )
                  );
                  setPage(1);
                }}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
              >
                <option value={10}>
                  10
                </option>
                <option value={20}>
                  20
                </option>
                <option value={50}>
                  50
                </option>
                <option value={100}>
                  100
                </option>
              </select>

              <button
                disabled={
                  page === 1
                }
                onClick={() =>
                  setPage(
                    page - 1
                  )
                }
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Prev
              </button>

              <span className="text-sm font-medium">
                {page} /{" "}
                {totalPages}
              </span>

              <button
                disabled={
                  page ===
                  totalPages
                }
                onClick={() =>
                  setPage(
                    page + 1
                  )
                }
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next
              </button>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}