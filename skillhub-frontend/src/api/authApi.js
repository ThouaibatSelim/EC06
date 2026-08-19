import axios from 'axios';

// Instance Axios dédiée à Spring Boot (port 8080)
// Séparée de api.js (Laravel 8000) pour bien distinguer
// les deux services dans les appels réseau
const authApi = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept':        'application/json',
    },
});

export default authApi;