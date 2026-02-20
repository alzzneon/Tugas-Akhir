export default function DataTable({
  // ===== Properti Header =====
  title,           
  subtitle,         
  searchValue,      
  onSearchChange,  
  onCreate,        
  createLabel = "+ Tambah", 
  headerRight,    

  // ===== Properti Data =====
  columns,       
  rows,             
  loading,          

  // ===== Properti Interaksi =====
  clickableKey,     
  onClickCell,      
  renderCell,       

  // ===== Properti Aksi =====
  showActions = true, 
  onEdit,             
  onDelete,           
  actionsRender,     
}) {
  return (
    <div>
      {/* ================= HEADER ================= */}
      <div className="mb-4 flex items-start justify-between gap-3">
        {/* Judul dan subtitle */}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        {/* Area kanan header: slot tambahan + tombol tambah */}
        <div className="flex items-center gap-2">
          {headerRight}

          {/* Tombol tambah hanya muncul jika onCreate ada */}
          {onCreate && (
            <button
              onClick={onCreate}
              className="bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
            >
              {createLabel}
            </button>
          )}
        </div>
      </div>

      {/* ================= SEARCH ================= */}
      {/* Search hanya dirender jika onSearchChange dikirim */}
      {onSearchChange && (
        <div className="mb-4">
          <div className="flex w-full max-w-lg items-center border bg-white px-3 py-2">
            <input
              value={searchValue} // nilai input
              onChange={(e) => onSearchChange(e.target.value)} // kirim value ke parent
              placeholder="cari mobil"
              className="w-full text-sm outline-none"
            />
          </div>
        </div>
      )}

      {/* ================= TABLE ================= */}
      <div className="overflow-auto border bg-white">
        <table className="min-w-full text-sm">
          {/* ===== Header tabel ===== */}
          <thead className="bg-blue-400">
            <tr>
              {/* Render header kolom dari columns */}
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="border-b border-indigo-700 px-4 py-3 text-left font-semibold text-white"
                >
                  {c.label}
                </th>
              ))}

              {/* Kolom aksi (opsional) */}
              {showActions && (
                <th className="border-b border-indigo-700 px-4 py-3 text-left font-semibold text-white">
                  Aksi
                </th>
              )}
            </tr>
          </thead>

          {/* ===== Body tabel ===== */}
          <tbody>
            {/* Kondisi loading */}
            {loading && (
              <tr>
                <td
                  colSpan={columns.length + (showActions ? 1 : 0)}
                  className="px-4 py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}

            {/* Kondisi data kosong */}
            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (showActions ? 1 : 0)}
                  className="px-4 py-6 text-center text-gray-500" >
                  Data kosong
                </td>
              </tr>
            )}

            {/* Render data baris */}
            {!loading &&
              rows.map((row) => (
                <tr key={row.id} className="border-t">
                  {/* Render tiap kolom */}
                  {columns.map((col) => {
                    const val = row[col.key]; // ambil nilai dari row
                    const isClickable =
                      clickableKey === col.key && onClickCell;

                    // Isi sel: pakai renderCell jika ada, jika tidak pakai nilai default
                    const content = renderCell
                      ? renderCell({ row, col })
                      : String(val ?? "");

                    return (
                      <td key={col.key} className="px-4 py-3">
                        {/* Jika kolom bisa diklik */}
                        {isClickable ? (
                          <button
                            onClick={() => onClickCell(row)}
                            className="font-semibold text-indigo-600 hover:underline"
                          >
                            {content}
                          </button>
                        ) : (
                          content
                        )}
                      </td>
                    );
                  })}

                  {/* ===== Kolom Aksi ===== */}
                  {showActions && (
                    <td className="px-4 py-3">
                      {actionsRender ? (
                        actionsRender({ row })
                      ) : (
                        <div className="flex items-center gap-2">
                          {/* Tombol edit */}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="px-2 py-1 hover:bg-gray-100"
                              title="Edit"
                            >
                              <img
                                src="https://api.iconify.design/mdi:pencil.svg?color=%234f46e5"
                                alt="edit"
                                className="h-4 w-4"
                              />
                            </button>
                          )}

                          {/* Tombol hapus */}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className="px-2 py-1 hover:bg-red-50"
                              title="Hapus"
                            >
                              <img
                                src="https://api.iconify.design/mdi:trash-can-outline.svg?color=%23dc2626"
                                alt="hapus"
                                className="h-4 w-4"
                              />
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
  );
}
