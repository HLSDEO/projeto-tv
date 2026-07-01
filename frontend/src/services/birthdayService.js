import api from './api';

export const birthdayService = {
  /**
   * Fetches birthdays for the specified month or period from the API.
   * @param {Object} params - Query parameters, e.g. { month } or { start_month, end_month }.
   * @returns {Promise<Array>} List of servers with birthdays.
   */
  getBirthdays: async (params) => {
    const response = await api.get('/api/birthdays', {
      params
    });
    console.log(response);
    return response.data;
  }
};

export default birthdayService;
