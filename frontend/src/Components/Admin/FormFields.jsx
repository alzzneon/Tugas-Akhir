export default function FormFields({ fields, form, setForm }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((f) => {
        // ✅ CHECKBOX
        if (f.type === "checkbox") {
          return (
            <label key={f.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(form[f.key])}
                onChange={(e) =>
                  setForm({ ...form, [f.key]: e.target.checked })
                }
              />
              <span className="text-sm">{f.label}</span>
            </label>
          );
        }

        // ✅ FILE
        if (f.type === "file") {
          return (
            <div key={f.key} className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                {f.label}{f.required ? " *" : ""}
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setForm({ ...form, [f.key]: e.target.files?.[0] || null })
                }
                className="mt-2 w-full text-sm"
              />
            </div>
          );
        }

        // ✅ SELECT
        if (f.type === "select") {
          return (
            <div key={f.key}>
              <label className="text-sm font-medium text-gray-700">
                {f.label}{f.required ? " *" : ""}
              </label>

              <select
                value={form[f.key] ?? ""}
                onChange={(e) =>
                  setForm({ ...form, [f.key]: e.target.value })
                }
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
              >
                <option value="">{f.placeholder ?? "Select"}</option>
                {(f.options ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        // ✅ INPUT
        return (
          <div key={f.key}>
            <label className="text-sm font-medium text-gray-700">
              {f.label}{f.required ? " *" : ""}
            </label>

            <input
              type={f.inputType ?? "text"}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder={f.placeholder ?? ""}
            />
          </div>
        );
      })}
    </div>
  );
}
