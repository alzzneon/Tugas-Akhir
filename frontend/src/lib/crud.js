import axios from "./axios";

export const crud = {
  list: (endpoint, params) => axios.get(`/api/${endpoint}`, { params }),
  detail: (endpoint, id) => axios.get(`/api/${endpoint}/${id}`),
  create: (endpoint, payload) => axios.post(`/api/${endpoint}`, payload),
  update: (endpoint, id, payload) => axios.put(`/api/${endpoint}/${id}`, payload),
  remove: (endpoint, id) => axios.delete(`/api/${endpoint}/${id}`),
};
