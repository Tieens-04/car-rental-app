import axios from 'axios';

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          if (data.success) {
            localStorage.setItem('accessToken', data.data.accessToken);
            if (data.data.refreshToken) {
              localStorage.setItem('refreshToken', data.data.refreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return api(originalRequest);
          }
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else {
        // No refresh token available, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/password', data),
  getUsers: (params) => api.get('/auth/users', { params }),
  updateUser: (userId, data) => api.put(`/auth/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/auth/users/${userId}`),
};

// Car API
export const carAPI = {
  getAll: (params) => api.get('/v1/cars', { params }),
  getByNumber: (carNumber) => api.get(`/v1/cars/${encodeURIComponent(carNumber)}`),
  create: (data) => api.post('/v1/cars', data),
  update: (carNumber, data) => api.put(`/v1/cars/${encodeURIComponent(carNumber)}`, data),
  delete: (carNumber) => api.delete(`/v1/cars/${encodeURIComponent(carNumber)}`),
  getStats: () => api.get('/v1/cars/stats'),
};

// Booking API
export const bookingAPI = {
  getAll: (params) => api.get('/v1/bookings', { params }),
  getById: (id) => api.get(`/v1/bookings/${id}`),
  create: (data) => api.post('/v1/bookings', data),
  update: (id, data) => api.put(`/v1/bookings/${id}`, data),
  delete: (id) => api.delete(`/v1/bookings/${id}`),
  pickup: (id) => api.patch(`/v1/bookings/${id}/pickup`),
  complete: (id) => api.patch(`/v1/bookings/${id}/complete`),
  cancel: (id, reason) => api.patch(`/v1/bookings/${id}/cancel`, { reason }),
  getStats: () => api.get('/v1/bookings/stats'),
};

export default api;
