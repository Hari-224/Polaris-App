import api from './api';

const plannerService = {
  async createPlan(data) {
    const response = await api.post('/plans', data);
    return response.data;
  },

  async getPlans() {
    const response = await api.get('/plans');
    return response.data;
  },

  async getPlanDetails(id) {
    const response = await api.get(`/plans/${id}`);
    return response.data;
  },

  async updatePlan(id, data) {
    const response = await api.put(`/plans/${id}`, data);
    return response.data;
  },

  async deletePlan(id) {
    const response = await api.delete(`/plans/${id}`);
    return response.data;
  },

  async addDay(id, data) {
    const response = await api.post(`/plans/${id}/days`, data);
    return response.data;
  },

  async updateDay(id, dayId, data) {
    const response = await api.put(`/plans/${id}/days/${dayId}`, data);
    return response.data;
  },

  async completeDay(id, dayId, completed) {
    const response = await api.put(`/plans/${id}/days/${dayId}/complete`, { completed });
    return response.data;
  },

  async deleteDay(id, dayId) {
    const response = await api.delete(`/plans/${id}/days/${dayId}`);
    return response.data;
  },

  // Phase 6 Extensions
  async updateDayResource(id, dayId, resourceData) {
    const response = await api.put(`/plans/${id}/days/${dayId}/resource`, resourceData);
    return response.data;
  },
};

export default plannerService;
