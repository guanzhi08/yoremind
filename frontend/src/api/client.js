import axios from "axios";
import { getToken, clearAuth } from "../store/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!getToken();
      clearAuth();
      // Only force-redirect if the user had a valid session that expired.
      // If there was no token, the 401 is expected (e.g. GPS upload while logged out)
      // and we should NOT redirect away from public pages like /register.
      if (hadToken) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default client;
