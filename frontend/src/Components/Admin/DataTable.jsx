// ─── DataTable ────────────────────────────────────────────────────────────────

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
  const colSpan = columns.length + (showActions ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[12.5px] text-gray-400">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {headerRight}
          {onCreate && (
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-[13px] font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.98]"
            >
              {createLabel}
            </button>
          )}
        </div>
      </div>

      {/* ── Search ── */}
      {onSearchChange && (
        <div className="relative w-full max-w-xs">
          <svg
            className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-[13px] text-gray-700 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wider text-gray-400"
                  >
                    {c.label}
                  </th>
                ))}
                {showActions && (
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-10 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-gray-400">
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                      </svg>
                      <span className="text-[12.5px]">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-gray-400">
                      <svg className="h-8 w-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <span className="text-[13px]">Data kosong</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-gray-50/60">
                  {columns.map((col) => {
                    const val = row[col.key];
                    const isClickable = clickableKey === col.key && onClickCell;
                    const content = renderCell ? renderCell({ row, col }) : String(val ?? "");

                    return (
                      <td key={col.key} className="px-4 py-3 align-middle text-[13px] text-gray-700">
                        {isClickable ? (
                          <button
                            onClick={() => onClickCell(row)}
                            className="font-medium text-indigo-600 transition hover:text-indigo-800 hover:underline"
                          >
                            {content}
                          </button>
                        ) : content}
                      </td>
                    );
                  })}

                  {showActions && (
                    <td className="px-4 py-3 align-middle">
                      {actionsRender ? (
                        actionsRender({ row })
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              title="Edit"
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[12px] font-medium text-gray-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
                              </svg>
                              Edit
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              title="Hapus"
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[12px] font-medium text-gray-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0h10" />
                              </svg>
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
      </div>
    </div>
  );
}


// ─── AdminTable ───────────────────────────────────────────────────────────────

export function AdminTable({
  headers = [],
  data = [],
  onEdit,
  onDelete,
  renderCell,
}) {
  const hasActions = onEdit || onDelete;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {headers.map((h) => (
                <th
                  key={h.name}
                  style={{ width: h.width }}
                  className="px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400"
                  style={{ textAlign: h.align || "left", width: h.width }}
                >
                  {h.label}
                </th>
              ))}
              {hasActions && (
                <th className="w-28 px-4 py-3 text-right text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">
                  Aksi
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length + (hasActions ? 1 : 0)}
                  className="px-4 py-12 text-center"
                >
                  <div className="inline-flex flex-col items-center gap-2 text-gray-400">
                    <svg className="h-8 w-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span className="text-[13px]">Belum ada data</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="transition hover:bg-gray-50/60">
                  {headers.map((h) => (
                    <td
                      key={h.name}
                      className="px-4 py-3 align-middle text-[13px] text-gray-700"
                      style={{ textAlign: h.align || "left" }}
                    >
                      {renderCell ? renderCell(h, row) : (row[h.name] ?? "-")}
                    </td>
                  ))}

                  {hasActions && (
                    <td className="px-4 py-3 text-right align-middle">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[12px] font-medium text-gray-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
                            </svg>
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[12px] font-medium text-gray-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0h10" />
                            </svg>
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}