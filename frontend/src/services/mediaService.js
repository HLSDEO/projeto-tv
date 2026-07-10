import api from './api';

export const mediaService = {
  getAllMedia: async () => {
    const response = await api.get('/api/media');
    return response.data;
  },

  uploadMedia: async (file, duration) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('duration', duration);

    const response = await api.post('/api/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateMedia: async (id, duration, active, order, scheduledStart = null) => {
    const response = await api.put(`/api/media/${id}`, {
      duration,
      active,
      order,
      scheduled_start: scheduledStart,
    });
    return response.data;
  },

  deleteMedia: async (id) => {
    const response = await api.delete(`/api/media/${id}`);
    return response.data;
  },

  reorderMedia: async (ids) => {
    const response = await api.put('/api/media/reorder', ids);
    return response.data;
  }
};

export default mediaService;
