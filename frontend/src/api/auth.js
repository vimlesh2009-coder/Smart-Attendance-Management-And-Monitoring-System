import api from './axios';

export const authAPI = {
  login:          (data)   => api.post('/auth/login', data),
  logout:         ()       => api.post('/auth/logout'),
  getMe:          ()       => api.get('/auth/me'),
  refreshToken:   (data)   => api.post('/auth/refresh', data),
  changePassword: (data)   => api.put('/auth/change-password', data),
  updateProfile:  (data)   => api.put('/auth/update-profile', data),
};
