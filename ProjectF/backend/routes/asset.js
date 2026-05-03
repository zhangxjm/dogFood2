const express = require('express');
const router = express.Router();
const DataStore = require('../data/dataStore');

router.get('/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    
    const wallet = await DataStore.wallets.findOne({ id: walletId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: '钱包不存在' });
    }
    
    const assets = await DataStore.assets.find({ walletId });
    
    let totalValueInUSD = 0;
    assets.forEach(asset => {
      totalValueInUSD += asset.balance * asset.priceInUSD;
    });
    
    res.json({
      success: true,
      data: {
        walletId: wallet.id,
        walletAddress: wallet.address,
        totalValueInUSD,
        assets
      }
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ success: false, message: '获取资产信息失败' });
  }
});

router.get('/:walletId/:symbol', async (req, res) => {
  try {
    const { walletId, symbol } = req.params;
    
    const wallet = await DataStore.wallets.findOne({ id: walletId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: '钱包不存在' });
    }
    
    const asset = await DataStore.assets.findOne({ walletId, symbol: symbol.toUpperCase() });
    
    if (!asset) {
      return res.status(404).json({ success: false, message: '资产不存在' });
    }
    
    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ success: false, message: '获取资产信息失败' });
  }
});

router.post('/refresh/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    
    const wallet = await DataStore.wallets.findOne({ id: walletId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: '钱包不存在' });
    }
    
    const assets = await DataStore.assets.find({ walletId });
    
    for (const asset of assets) {
      const fluctuation = (Math.random() - 0.5) * 0.1;
      asset.priceInUSD = asset.priceInUSD * (1 + fluctuation);
      asset.updatedAt = Date.now();
      await DataStore.assets.save(asset);
    }
    
    const updatedAssets = await DataStore.assets.find({ walletId });
    
    let totalValueInUSD = 0;
    updatedAssets.forEach(asset => {
      totalValueInUSD += asset.balance * asset.priceInUSD;
    });
    
    res.json({
      success: true,
      message: '资产价格已刷新',
      data: {
        walletId: wallet.id,
        totalValueInUSD,
        assets: updatedAssets
      }
    });
  } catch (error) {
    console.error('Error refreshing assets:', error);
    res.status(500).json({ success: false, message: '刷新资产价格失败' });
  }
});

module.exports = router;
