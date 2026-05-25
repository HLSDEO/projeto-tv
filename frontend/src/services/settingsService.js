import api from './api';

export const settingsService = {
  getSettings: async () => {
    const response = await api.get('/api/settings');
    return response.data;
  },

  updateSettings: async (news_enabled, weather_enabled, weather_city, sync_interval) => {
    const response = await api.put('/api/settings', {
      news_enabled,
      weather_enabled,
      weather_city,
      sync_interval,
    });
    return response.data;
  },

  triggerSync: async () => {
    const response = await api.post('/api/settings/sync');
    return response.data;
  },

  getWeather: async () => {
    const response = await api.get('/api/settings/weather');
    return response.data;
  },

  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteLogo: async () => {
    const response = await api.delete('/api/settings/logo');
    return response.data;
  }
};

export default settingsService;
