const express = require('express');
const router = express.Router();
const DataStore = require('../data/dataStore');
const { generateWallet, importWalletFromPrivateKey, importWalletFromMnemonic, getDefaultTokens } = require('../utils/walletUtils');

router.get('/list', async (req, res) => {
  try {
    const wallets = await DataStore.wallets.find();
    const sanitizedWallets = wallets.map(wallet => ({
      id: wallet.id,
      name: wallet.name,
      address: wallet.address,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt
    }));
    res.json({ success: true, data: sanitizedWallets });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    res.status(500).json({ success: false, message: '获取钱包列表失败' });
  }
});

router.get('/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    const wallet = await DataStore.wallets.findOne({ id: walletId });
    
    if (!wallet) {
      return res.status(404).json({ success: false, message: '钱包不存在' });
    }
    
    const sanitizedWallet = {
      id: wallet.id,
      name: wallet.name,
      address: wallet.address,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt
    };
    
    res.json({ success: true, data: sanitizedWallet });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ success: false, message: '获取钱包信息失败' });
  }
});

router.post('/create', async (req, res) => {
  try {
    const { name } = req.body;
    const walletData = generateWallet();
    
    const wallet = {
      id: walletData.id,
      name: name || '我的钱包',
      address: walletData.address,
      privateKey: walletData.privateKey,
      mnemonic: walletData.mnemonic
    };
    
    await DataStore.wallets.create(wallet);
    
    const defaultTokens = getDefaultTokens();
    for (const token of defaultTokens) {
      const asset = {
        id: token.id,
        walletId: wallet.id,
        symbol: token.symbol,
        name: token.name,
        balance: token.balance,
        decimals: token.decimals,
        contractAddress: token.contractAddress,
        priceInUSD: token.priceInUSD
      };
      await DataStore.assets.create(asset);
    }
    
    res.json({
      success: true,
      message: '钱包创建成功',
      data: {
        id: wallet.id,
        name: wallet.name,
        address: wallet.address,
        mnemonic: wallet.mnemonic
      }
    });
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({ success: false, message: '创建钱包失败' });
  }
});

router.post('/import/privateKey', async (req, res) => {
  try {
    const { privateKey, name } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ success: false, message: '请提供私钥' });
    }
    
    const existingWallet = await DataStore.wallets.findOne({ privateKey });
    if (existingWallet) {
      return res.status(400).json({ success: false, message: '该钱包已存在' });
    }
    
    const walletData = importWalletFromPrivateKey(privateKey);
    
    const wallet = {
      id: walletData.id,
      name: name || '导入的钱包',
      address: walletData.address,
      privateKey: walletData.privateKey,
      mnemonic: walletData.mnemonic
    };
    
    await DataStore.wallets.create(wallet);
    
    const defaultTokens = getDefaultTokens();
    for (const token of defaultTokens) {
      const asset = {
        id: token.id,
        walletId: wallet.id,
        symbol: token.symbol,
        name: token.name,
        balance: token.balance,
        decimals: token.decimals,
        contractAddress: token.contractAddress,
        priceInUSD: token.priceInUSD
      };
      await DataStore.assets.create(asset);
    }
    
    res.json({
      success: true,
      message: '钱包导入成功',
      data: {
        id: wallet.id,
        name: wallet.name,
        address: wallet.address
      }
    });
  } catch (error) {
    console.error('Error importing wallet:', error);
    res.status(400).json({ success: false, message: error.message || '导入钱包失败' });
  }
});

router.post('/import/mnemonic', async (req, res) => {
  try {
    const { mnemonic, name } = req.body;
    
    if (!mnemonic) {
      return res.status(400).json({ success: false, message: '请提供助记词' });
    }
    
    const walletData = importWalletFromMnemonic(mnemonic);
    
    const existingWallet = await DataStore.wallets.findOne({ privateKey: walletData.privateKey });
    if (existingWallet) {
      return res.status(400).json({ success: false, message: '该钱包已存在' });
    }
    
    const wallet = {
      id: walletData.id,
      name: name || '导入的钱包',
      address: walletData.address,
      privateKey: walletData.privateKey,
      mnemonic: walletData.mnemonic
    };
    
    await DataStore.wallets.create(wallet);
    
    const defaultTokens = getDefaultTokens();
    for (const token of defaultTokens) {
      const asset = {
        id: token.id,
        walletId: wallet.id,
        symbol: token.symbol,
        name: token.name,
        balance: token.balance,
        decimals: token.decimals,
        contractAddress: token.contractAddress,
        priceInUSD: token.priceInUSD
      };
      await DataStore.assets.create(asset);
    }
    
    res.json({
      success: true,
      message: '钱包导入成功',
      data: {
        id: wallet.id,
        name: wallet.name,
        address: wallet.address
      }
    });
  } catch (error) {
    console.error('Error importing wallet:', error);
    res.status(400).json({ success: false, message: error.message || '导入钱包失败' });
  }
});

router.put('/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    const { name } = req.body;
    
    const wallet = await DataStore.wallets.findOne({ id: walletId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: '钱包不存在' });
    }
    
    await DataStore.wallets.updateOne(
      { id: walletId },
      { $set: { name: name || wallet.name } }
    );
    
    const updatedWallet = await DataStore.wallets.findOne({ id: walletId });
    
    res.json({
      success: true,
      message: '钱包更新成功',
      data: {
        id: updatedWallet.id,
        name: updatedWallet.name,
        address: updatedWallet.address
      }
    });
  } catch (error) {
    console.error('Error updating wallet:', error);
    res.status(500).json({ success: false, message: '更新钱包失败' });
  }
});

router.delete('/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    
    const wallet = await DataStore.wallets.findOne({ id: walletId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: '钱包不存在' });
    }
    
    await DataStore.wallets.deleteOne({ id: walletId });
    await DataStore.assets.deleteMany({ walletId });
    
    res.json({ success: true, message: '钱包删除成功' });
  } catch (error) {
    console.error('Error deleting wallet:', error);
    res.status(500).json({ success: false, message: '删除钱包失败' });
  }
});

module.exports = router;
