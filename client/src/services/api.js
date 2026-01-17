import axios from "axios";
import store from '../store/authStore'
import router from "../router/routes";

const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

api.interceptors.request.use(
    (config) => {
        const token = store.getters.token || localStorage.getItem('token')

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

api.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            store.dispatch('logout')

            if (router.currentRoute.value.name !== 'Login') {
                router.push({
                    name: 'Login',
                    query: { redirect: router.currentRoute.value.fullPath }
                })
            }
        }

        if (error.response && error.response.status === 403) {
            console.error('Access forbidden:', error.response.data.error)
        }

        return Promise.reject(error)
    }
)

export default api;
