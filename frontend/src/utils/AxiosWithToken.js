import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8001/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const plainApi = axios.create({
    baseURL: "http://localhost:8001", // örnek: /auth/google gibi kök URL
});

export default api;