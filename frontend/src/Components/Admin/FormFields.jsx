export default function FormFields({ fields, form, setForm }) {
  const base =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-800 " +
    "placeholder-gray-400 outline-none transition " +
    "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 " +
    "disabled:bg-gray-50 disabled:text-gray-400";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {fields.map((f) => {
        /* ── CHECKBOX ── */
        if (f.type === "checkbox") {
          return (
            <label
              key={f.key}
              className="col-span-1 inline-flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 transition hover:bg-gray-100"
            >
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={Boolean(form[f.key])}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                  className="peer sr-only"
                />
                {/* track */}
                <div className="h-[18px] w-8 rounded-full bg-gray-300 transition peer-checked:bg-indigo-500" />
                {/* thumb */}
                <div
                  className="absolute top-0.5 left-0.5 h-[14px] w-[14px] rounded-full bg-white shadow transition-transform peer-checked:translate-x-[14px]"
                />
              </div>
              <span className="text-[13px] font-medium text-gray-700">{f.label}</span>
            </label>
          );
        }

        /* ── FILE ── */
        if (f.type === "file") {
          return (
            <div key={f.key} className="md:col-span-2">
              <FieldLabel label={f.label} required={f.required} />
              <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 transition hover:border-indigo-400 hover:bg-indigo-50">
                <svg className="h-5 w-5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-[12.5px] text-gray-500">
                  {form[f.key]?.name ?? (
                    <span>
                      <span className="font-medium text-indigo-600">Klik untuk upload</span>
                      {" "}atau seret file ke sini
                    </span>
                  )}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.files?.[0] || null })}
                />
              </label>
            </div>
          );
        }

        /* ── SELECT ── */
        if (f.type === "select") {
          return (
            <div key={f.key}>
              <FieldLabel label={f.label} required={f.required} />
              <select
                value={form[f.key] ?? ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className={base + " mt-1.5 appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_10px_center] bg-[length:16px] pr-8"}
              >
                <option value="">{f.placeholder ?? "— Pilih —"}</option>
                {(f.options ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          );
        }

        /* ── INPUT (default) ── */
        return (
          <div key={f.key} className={f.fullWidth ? "md:col-span-2" : ""}>
            <FieldLabel label={f.label} required={f.required} />
            <input
              type={f.inputType ?? "text"}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              placeholder={f.placeholder ?? ""}
              className={base + " mt-1.5"}
            />
          </div>
        );
      })}
    </div>
  );
}

function FieldLabel({ label, required }) {
  return (
    <label className="block text-[12px] font-semibold uppercase tracking-wide text-gray-400">
      {label}
      {required && <span className="ml-0.5 text-red-400">*</span>}
    </label>
  );
}