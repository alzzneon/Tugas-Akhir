export async function adminFetch(url, options = {}) {
  const token = localStorage.getItem("admin_token");

  const isFormData = options.body instanceof FormData;

  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");

  if (!res.ok) {
    let data = {};
    try { data = await res.json(); } catch {}
    throw new Error(data.message || `Error ${res.status}`);
  }

  if (res.status === 204) return null;

  const json = await res.json();

  if (json && typeof json === "object" && "data" in json) {
    return json.data;
  }
  
  return json;
}
