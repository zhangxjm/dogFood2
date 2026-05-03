const { ethers } = require('ethers');
const { v4: uuidv4 } = require('uuid');
const bip39 = require('bip39');

const generateWallet = () => {
  const mnemonic = bip39.generateMnemonic();
  const wallet = ethers.Wallet.fromPhrase(mnemonic);
  
  return {
    id: uuidv4(),
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: mnemonic
  };
};

const importWalletFromPrivateKey = (privateKey) => {
  try {
    const wallet = new ethers.Wallet(privateKey);
    return {
      id: uuidv4(),
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: null
    };
  } catch (error) {
    throw new Error('无效的私钥');
  }
};

const importWalletFromMnemonic = (mnemonic) => {
  try {
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    return {
      id: uuidv4(),
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: mnemonic
    };
  } catch (error) {
    throw new Error('无效的助记词');
  }
};

const generateTransactionHash = () => {
  return '0x' + Array.from({length: 64}, () => 
    Math.floor(Math.random() * 16).toString(16)).join('');
};

const generateBlockNumber = () => {
  return Math.floor(Math.random() * 10000000) + 18000000;
};

const generateGasPrice = () => {
  return Math.floor(Math.random() * 50) + 10;
};

const generateNonce = () => {
  return Math.floor(Math.random() * 100);
};

const DEFAULT_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', balance: 10.5, decimals: 18, contractAddress: null, priceInUSD: 3200.50 },
  { symbol: 'USDT', name: 'Tether USD', balance: 1500, decimals: 6, contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', priceInUSD: 1.00 },
  { symbol: 'USDC', name: 'USD Coin', balance: 850, decimals: 6, contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', priceInUSD: 1.00 },
  { symbol: 'LINK', name: 'Chainlink', balance: 150, decimals: 18, contractAddress: '0x514910771AF9Ca656af840dff83E8264EcF986', priceInUSD: 18.75 },
  { symbol: 'UNI', name: 'Uniswap', balance: 75, decimals: 18, contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', priceInUSD: 12.30 }
];

const getDefaultTokens = () => {
  return DEFAULT_TOKENS.map(token => ({
    ...token,
    id: uuidv4()
  }));
};

module.exports = {
  generateWallet,
  importWalletFromPrivateKey,
  importWalletFromMnemonic,
  generateTransactionHash,
  generateBlockNumber,
  generateGasPrice,
  generateNonce,
  getDefaultTokens
};
