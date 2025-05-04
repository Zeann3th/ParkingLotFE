import { memoryStorage } from "@/storage";
import axios from "axios";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
axios.defaults.withCredentials = true;

axios.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const response = await axios.get("/auth/refresh");
                if (response.status === 200 && response.data.access_token) {
                    memoryStorage.setToken(response.data.access_token);
                    return axios(originalRequest);
                }
            } catch (err) {
                console.error("Error refreshing token:", err);
            }
        }
        return Promise.reject(error);

    }
)
