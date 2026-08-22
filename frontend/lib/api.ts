/**
 * API client — thin axios wrapper.
 * Base URL reads from NEXT_PUBLIC_API_URL (set in .env.local).
 * Swap from mock → real by pointing that env var at the real backend.
 */
import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Attach access token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
