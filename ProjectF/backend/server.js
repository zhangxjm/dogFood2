require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

console.log('🚀 使用内存数据存储模式 (无需MongoDB)');

const walletRoutes = require('./routes/wallet');
const assetRoutes = require('./routes/asset');
const transactionRoutes = require('./routes/transaction');

app.use('/api/wallet', walletRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Crypto Wallet API is running', 
    version: '1.0.0',
    database: 'In-Memory Storage (No MongoDB required)'
  });
});

app.listen(PORT, () => {
  console.log(`✅ 服务器已启动，运行在端口 ${PORT}`);
  console.log(`🌐 访问地址: http://localhost:${PORT}`);
});
