const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const DataStore = require('../data/dataStore');
const { generateTransactionHash, generateBlockNumber, generateGasPrice, generateNonce } = require('../utils/walletUtils');

router.get('/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    const { symbol, type, limit = 20, page = 1 } = req.query;
    
    const wallet = await DataStore.wallets.findOne({ id: walletId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: '钱包不存在' });
    }
    
    let query = { walletId };
    
    if (symbol) {
      query.symbol = symbol.toUpperCase();
    }
    
    if (type) {
      query.type = type;
    }
    
    const skip = (page - 1) * limit;
    
    const total = await DataStore.transactions.countDocuments(query);
    let transactions = await DataStore.transactions.find(query);
    
    transactions = transactions.slice(skip, skip + parseInt(limit));
    
    res.json({
      success: true,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        transactions
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: '获取交易记录失败' });
  }
});

router.get('/:walletId/:txHash', async (req, res) => {
  try {
    const { walletId, txHash } = req.params;
    
    const wallet = await DataStore.wallets.findOne({ id: walletId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: '钱包不存在' });
    }
    
    const transaction = await DataStore.transactions.findOne({ walletId, hash: txHash });
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: '交易记录不存在' });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ success: false, message: '获取交易记录失败' });
  }
});

router.post('/send', async (req, res) => {
  try {
    const { walletId, to, symbol, amount, gasPrice, gasLimit } = req.body;
    
    if (!walletId || !to || !symbol || !amount) {
      return res.status(400).json({ success: false, message: '请提供必要的交易参数' });
    }
    
    const wallet = await DataStore.wallets.findOne({ id: walletId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: '钱包不存在' });
    }
    
    const asset = await DataStore.assets.findOne({ walletId, symbol: symbol.toUpperCase() });
    if (!asset) {
      return res.status(404).json({ success: false, message: '资产不存在' });
    }
    
    if (asset.balance < parseFloat(amount)) {
      return res.status(400).json({ success: false, message: '余额不足' });
    }
    
    const transaction = {
      id: uuidv4(),
      walletId: walletId,
      type: 'send',
      symbol: symbol.toUpperCase(),
      amount: parseFloat(amount),
      from: wallet.address,
      to: to,
      status: 'success',
      hash: generateTransactionHash(),
      gasPrice: gasPrice || generateGasPrice(),
      gasLimit: gasLimit || 21000,
      nonce: generateNonce(),
      blockNumber: generateBlockNumber(),
      timestamp: Date.now()
    };
    
    await DataStore.transactions.create(transaction);
    
    asset.balance = asset.balance - parseFloat(amount);
    asset.updatedAt = Date.now();
    await DataStore.assets.save(asset);
    
    res.json({
      success: true,
      message: '交易发送成功',
      data: {
        transaction: {
          id: transaction.id,
          hash: transaction.hash,
          type: transaction.type,
          symbol: transaction.symbol,
          amount: transaction.amount,
          from: transaction.from,
          to: transaction.to,
          status: transaction.status,
          blockNumber: transaction.blockNumber,
          timestamp: transaction.timestamp
        },
        updatedBalance: asset.balance
      }
    });
  } catch (error) {
    console.error('Error sending transaction:', error);
    res.status(500).json({ success: false, message: '发送交易失败' });
  }
});

router.post('/receive', async (req, res) => {
  try {
    const { walletId, from, symbol, amount } = req.body;
    
    if (!walletId || !from || !symbol || !amount) {
      return res.status(400).json({ success: false, message: '请提供必要的交易参数' });
    }
    
    const wallet = await DataStore.wallets.findOne({ id: walletId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: '钱包不存在' });
    }
    
    let asset = await DataStore.assets.findOne({ walletId, symbol: symbol.toUpperCase() });
    if (!asset) {
      return res.status(404).json({ success: false, message: '资产不存在' });
    }
    
    const transaction = {
      id: uuidv4(),
      walletId: walletId,
      type: 'receive',
      symbol: symbol.toUpperCase(),
      amount: parseFloat(amount),
      from: from,
      to: wallet.address,
      status: 'success',
      hash: generateTransactionHash(),
      gasPrice: generateGasPrice(),
      gasLimit: 21000,
      nonce: generateNonce(),
      blockNumber: generateBlockNumber(),
      timestamp: Date.now()
    };
    
    await DataStore.transactions.create(transaction);
    
    asset.balance = asset.balance + parseFloat(amount);
    asset.updatedAt = Date.now();
    await DataStore.assets.save(asset);
    
    res.json({
      success: true,
      message: '接收交易成功',
      data: {
        transaction: {
          id: transaction.id,
          hash: transaction.hash,
          type: transaction.type,
          symbol: transaction.symbol,
          amount: transaction.amount,
          from: transaction.from,
          to: transaction.to,
          status: transaction.status,
          blockNumber: transaction.blockNumber,
          timestamp: transaction.timestamp
        },
        updatedBalance: asset.balance
      }
    });
  } catch (error) {
    console.error('Error receiving transaction:', error);
    res.status(500).json({ success: false, message: '接收交易失败' });
  }
});

router.post('/simulate', async (req, res) => {
  try {
    const { walletId, to, symbol, amount } = req.body;
    
    if (!walletId || !to || !symbol || !amount) {
      return res.status(400).json({ success: false, message: '请提供必要的交易参数' });
    }
    
    const wallet = await DataStore.wallets.findOne({ id: walletId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: '钱包不存在' });
    }
    
    const asset = await DataStore.assets.findOne({ walletId, symbol: symbol.toUpperCase() });
    if (!asset) {
      return res.status(404).json({ success: false, message: '资产不存在' });
    }
    
    if (asset.balance < parseFloat(amount)) {
      return res.status(400).json({ success: false, message: '余额不足' });
    }
    
    const gasPrice = generateGasPrice();
    const gasLimit = 21000;
    const gasFee = (gasPrice * gasLimit) / 1e9;
    
    const estimatedFeeInUSD = gasFee * 3200;
    
    res.json({
      success: true,
      message: '交易模拟成功',
      data: {
        from: wallet.address,
        to: to,
        symbol: symbol.toUpperCase(),
        amount: parseFloat(amount),
        estimatedGasFee: gasFee,
        estimatedGasFeeInUSD: estimatedFeeInUSD,
        gasPrice,
        gasLimit,
        nonce: generateNonce(),
        estimatedBlockNumber: generateBlockNumber()
      }
    });
  } catch (error) {
    console.error('Error simulating transaction:', error);
    res.status(500).json({ success: false, message: '模拟交易失败' });
  }
});

module.exports = router;
