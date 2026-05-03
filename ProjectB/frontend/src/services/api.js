import axios from 'axios'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (username, password) => 
    api.post('/token/', { username, password }),
  
  register: (userData) => 
    api.post('/users/', userData),
  
  getCurrentUser: () => 
    api.get('/users/me/'),
  
  updateUser: (userData) => 
    api.put('/users/update_me/', userData),
}

export const deviceApi = {
  getDevices: () => 
    api.get('/devices/my_devices/'),
  
  createDevice: (deviceData) => 
    api.post('/devices/', deviceData),
  
  updateDevice: (id, deviceData) => 
    api.patch(`/devices/${id}/`, deviceData),
  
  deleteDevice: (id) => 
    api.delete(`/devices/${id}/`),
  
  pairDevice: (id) => 
    api.post(`/devices/${id}/pair/`),
  
  unpairDevice: (id) => 
    api.post(`/devices/${id}/unpair/`),
  
  syncDevice: (id) => 
    api.post(`/devices/${id}/sync/`),
}

export const healthDataApi = {
  getHeartRateData: (params) => 
    api.get('/health/heart-rate/', { params }),
  
  getStepData: (params) => 
    api.get('/health/steps/', { params }),
  
  getSleepData: (params) => 
    api.get('/health/sleep/', { params }),
  
  uploadBatchData: (data) => 
    api.post('/health/batch/upload/', data),
  
  getDashboard: (days = 7) => 
    api.get('/health/batch/dashboard/', { params: { days } }),
  
  getHeartRateDaily: (days = 7) => 
    api.get('/health/heart-rate/daily_average/', { params: { days } }),
  
  getStepDaily: (days = 7) => 
    api.get('/health/steps/daily_total/', { params: { days } }),
  
  getSleepDaily: (days = 7) => 
    api.get('/health/sleep/daily_sleep/', { params: { days } }),
  
  getSleepQuality: (days = 7) => 
    api.get('/health/sleep/sleep_quality/', { params: { days } }),
}

export const reportApi = {
  getReports: () => 
    api.get('/reports/'),
  
  getLatestReport: () => 
    api.get('/reports/latest/'),
  
  generateReport: (reportType, reportDate) => 
    api.post('/reports/generate/', { report_type: reportType, report_date: reportDate }),
  
  getReport: (id) => 
    api.get(`/reports/${id}/`),
}

export const goalApi = {
  getGoals: () => 
    api.get('/goals/goals/'),
  
  getActiveGoals: () => 
    api.get('/goals/goals/active/'),
  
  getAchievedGoals: () => 
    api.get('/goals/goals/achieved/'),
  
  createGoal: (goalData) => 
    api.post('/goals/goals/', goalData),
  
  updateGoalProgress: (id) => 
    api.post(`/goals/goals/${id}/update_progress/`),
  
  activateGoal: (id) => 
    api.post(`/goals/goals/${id}/activate/`),
  
  deactivateGoal: (id) => 
    api.post(`/goals/goals/${id}/deactivate/`),
  
  getReminders: () => 
    api.get('/goals/reminders/'),
  
  getTodayReminders: () => 
    api.get('/goals/reminders/today/'),
  
  createReminder: (reminderData) => 
    api.post('/goals/reminders/', reminderData),
  
  toggleReminder: (id) => 
    api.post(`/goals/reminders/${id}/toggle/`),
  
  createDefaultSedentary: () => 
    api.post('/goals/reminders/create_default_sedentary/'),
  
  createDefaultWater: () => 
    api.post('/goals/reminders/create_default_water/'),
  
  getNotifications: () => 
    api.get('/goals/notifications/'),
  
  getUnreadNotifications: () => 
    api.get('/goals/notifications/unread/'),
  
  markNotificationRead: (id) => 
    api.put(`/goals/notifications/${id}/mark_read/`),
  
  markAllNotificationsRead: () => 
    api.put('/goals/notifications/mark_all_read/'),
}

export default api
