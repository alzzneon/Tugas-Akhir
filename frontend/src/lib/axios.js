// import axios from "axios";

// const instance = axios.create({
//   baseURL: import.meta.env.VITE_BACKEND_URL,
//   headers: {
//     "X-Requested-With": "XMLHttpRequest",
//     Accept: "application/json",
//     "Content-Type": "application/json",
//   },
// });

// export default instance;

import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// otomatis tempelin token admin kalau ada
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
