let wallets = [];
let assets = [];
let transactions = [];

const DataStore = {
  wallets: {
    find: async (query = {}) => {
      let result = [...wallets];
      if (query.id) {
        result = result.filter(w => w.id === query.id);
      }
      if (query.privateKey) {
        result = result.filter(w => w.privateKey === query.privateKey);
      }
      return result;
    },
    
    findOne: async (query = {}) => {
      let result = [...wallets];
      if (query.id) {
        result = result.filter(w => w.id === query.id);
      }
      if (query.privateKey) {
        result = result.filter(w => w.privateKey === query.privateKey);
      }
      return result[0] || null;
    },
    
    create: async (data) => {
      const newWallet = {
        ...data,
        _id: data.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      wallets.push(newWallet);
      return newWallet;
    },
    
    updateOne: async (query, update) => {
      const index = wallets.findIndex(w => w.id === query.id);
      if (index !== -1) {
        wallets[index] = {
          ...wallets[index],
          ...update.$set,
          updatedAt: new Date()
        };
        return { nModified: 1 };
      }
      return { nModified: 0 };
    },
    
    deleteOne: async (query) => {
      const index = wallets.findIndex(w => w.id === query.id);
      if (index !== -1) {
        wallets.splice(index, 1);
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    }
  },
  
  assets: {
    find: async (query = {}) => {
      let result = [...assets];
      if (query.walletId) {
        result = result.filter(a => a.walletId === query.walletId);
      }
      if (query.symbol) {
        result = result.filter(a => a.symbol === query.symbol);
      }
      return result;
    },
    
    findOne: async (query = {}) => {
      let result = [...assets];
      if (query.walletId) {
        result = result.filter(a => a.walletId === query.walletId);
      }
      if (query.symbol) {
        result = result.filter(a => a.symbol === query.symbol);
      }
      return result[0] || null;
    },
    
    create: async (data) => {
      const newAsset = {
        ...data,
        _id: data.id || Date.now().toString(),
        updatedAt: new Date()
      };
      assets.push(newAsset);
      return newAsset;
    },
    
    deleteMany: async (query) => {
      if (query.walletId) {
        const originalLength = assets.length;
        assets = assets.filter(a => a.walletId !== query.walletId);
        return { deletedCount: originalLength - assets.length };
      }
      return { deletedCount: 0 };
    },
    
    save: async (asset) => {
      const index = assets.findIndex(a => a.id === asset.id);
      if (index !== -1) {
        assets[index] = {
          ...assets[index],
          ...asset,
          updatedAt: new Date()
        };
        return assets[index];
      }
      const newAsset = {
        ...asset,
        _id: asset.id || Date.now().toString(),
        updatedAt: new Date()
      };
      assets.push(newAsset);
      return newAsset;
    }
  },
  
  transactions: {
    find: async (query = {}, options = {}) => {
      let result = [...transactions];
      
      if (query.walletId) {
        result = result.filter(t => t.walletId === query.walletId);
      }
      if (query.symbol) {
        result = result.filter(t => t.symbol === query.symbol);
      }
      if (query.type) {
        result = result.filter(t => t.type === query.type);
      }
      if (query.hash) {
        result = result.filter(t => t.hash === query.hash);
      }
      
      result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return result;
    },
    
    findOne: async (query = {}) => {
      let result = [...transactions];
      
      if (query.walletId) {
        result = result.filter(t => t.walletId === query.walletId);
      }
      if (query.hash) {
        result = result.filter(t => t.hash === query.hash);
      }
      
      return result[0] || null;
    },
    
    create: async (data) => {
      const newTransaction = {
        ...data,
        _id: data.id || Date.now().toString(),
        timestamp: new Date()
      };
      transactions.push(newTransaction);
      return newTransaction;
    },
    
    countDocuments: async (query = {}) => {
      let result = [...transactions];
      
      if (query.walletId) {
        result = result.filter(t => t.walletId === query.walletId);
      }
      if (query.symbol) {
        result = result.filter(t => t.symbol === query.symbol);
      }
      if (query.type) {
        result = result.filter(t => t.type === query.type);
      }
      
      return result.length;
    }
  },
  
  clearAll: () => {
    wallets = [];
    assets = [];
    transactions = [];
  }
};

module.exports = DataStore;
