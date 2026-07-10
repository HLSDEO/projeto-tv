import api from './api';

export const adminService = {
  getUsers: async () => {
    const response = await api.get('/api/admin/users');
    return response.data.users;
  },

  createUser: async (username, password) => {
    const response = await api.post('/api/admin/users', { username, password });
    return response.data;
  },

  resetPassword: async (username, newPassword) => {
    const response = await api.put(`/api/admin/users/${username}/password`, {
      new_password: newPassword
    });
    return response.data;
  },

  deleteUser: async (username) => {
    const response = await api.delete(`/api/admin/users/${username}`);
    return response.data;
  },

  getAuditLogs: async () => {
    const response = await api.get('/api/admin/audit-logs');
    return response.data.logs;
  },

  getServerLogs: async (params = {}) => {
    const response = await api.get('/api/admin/logs', { params });
    return response.data.logs;
  },

  clearServerLogs: async () => {
    const response = await api.delete('/api/admin/logs/clear');
    return response.data;
  },

  downloadServerLogs: async () => {
    const response = await api.get('/api/admin/logs/download', {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default adminService;
