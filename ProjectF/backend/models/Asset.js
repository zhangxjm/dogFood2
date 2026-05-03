const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  walletId: {
    type: String,
    required: true,
    ref: 'Wallet'
  },
  symbol: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  decimals: {
    type: Number,
    default: 18
  },
  contractAddress: {
    type: String
  },
  priceInUSD: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Asset', assetSchema);
