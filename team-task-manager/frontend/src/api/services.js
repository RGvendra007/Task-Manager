import api from './client';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
};

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projectApi = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  updateMember: (id, memberId, data) => api.patch(`/projects/${id}/members/${memberId}`, data),
  removeMember: (id, memberId) => api.delete(`/projects/${id}/members/${memberId}`),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const taskApi = {
  myTasks: () => api.get('/tasks/my'),
  projectTasks: (projectId, params) => api.get(`/tasks/project/${projectId}`, { params }),
  get: (id) => api.get(`/tasks/${id}`),
  create: (projectId, data) => api.post(`/tasks/project/${projectId}`, data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const userApi = {
  search: (q) => api.get('/users/search', { params: { q } }),
};
