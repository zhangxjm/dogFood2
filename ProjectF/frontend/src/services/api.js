import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const walletAPI = {
  getList: () => api.get('/wallet/list'),
  getById: (walletId) => api.get(`/wallet/${walletId}`),
  create: (name) => api.post('/wallet/create', { name }),
  importPrivateKey: (privateKey, name) => 
    api.post('/wallet/import/privateKey', { privateKey, name }),
  importMnemonic: (mnemonic, name) => 
    api.post('/wallet/import/mnemonic', { mnemonic, name }),
  update: (walletId, name) => api.put(`/wallet/${walletId}`, { name }),
  delete: (walletId) => api.delete(`/wallet/${walletId}`),
};

export const assetAPI = {
  getByWallet: (walletId) => api.get(`/assets/${walletId}`),
  getBySymbol: (walletId, symbol) => api.get(`/assets/${walletId}/${symbol}`),
  refresh: (walletId) => api.post(`/assets/refresh/${walletId}`),
};

export const transactionAPI = {
  getByWallet: (walletId, params = {}) => 
    api.get(`/transactions/${walletId}`, { params }),
  getByHash: (walletId, txHash) => 
    api.get(`/transactions/${walletId}/${txHash}`),
  send: (data) => api.post('/transactions/send', data),
  receive: (data) => api.post('/transactions/receive', data),
  simulate: (data) => api.post('/transactions/simulate', data),
};

export default api;
