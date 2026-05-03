const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  walletId: {
    type: String,
    required: true,
    ref: 'Wallet'
  },
  type: {
    type: String,
    required: true,
    enum: ['send', 'receive']
  },
  symbol: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'success', 'failed'],
    default: 'success'
  },
  hash: {
    type: String,
    required: true
  },
  gasPrice: {
    type: Number
  },
  gasLimit: {
    type: Number
  },
  nonce: {
    type: Number
  },
  blockNumber: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
