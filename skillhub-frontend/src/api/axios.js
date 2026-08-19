import axios from 'axios';

// ── Spring Boot (Auth) ────────────────────────────────────────────
// Pas d'intercepteur ici — register/login n'ont pas besoin de token
export const authApi = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: { 'Content-Type': 'application/json' },
});

// ── Laravel (API métier) ──────────────────────────────────────────
const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept':        'application/json',
    },
});

// Injecte automatiquement le JWT dans chaque requête Laravel
// Évite de répéter headers: { Authorization: ... } partout
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('skillhub_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// Si Laravel renvoie 401 (token expiré ou invalide)
// on vide le localStorage et on redirige vers l'accueil
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;