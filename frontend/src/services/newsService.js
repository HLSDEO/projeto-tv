import api from './api';

export const newsService = {
  getNews: async () => {
    const response = await api.get('/api/news');
    return response.data;
  }
};

export default newsService;
