import axios from 'axios'

// In local dev, Vite proxies /api to localhost:8000 (see vite.config.js).
// In production, VITE_API_URL is set at build time to the real deployed
// backend URL (e.g. https://byumba-backend.onrender.com/api), since the
// frontend and backend are served from different domains once deployed.
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default client
