// src/lib/api.js
export const API_BASE_URL = "http://localhost:8000"; 
// ↑ ganti sesuai backend kamu (Laravel biasanya http://127.0.0.1:8000)

export async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });

  // Laravel kadang balikin error json
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}
