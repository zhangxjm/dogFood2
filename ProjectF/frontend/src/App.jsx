import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, theme, Dropdown, Avatar, message } from 'antd';
import { 
  WalletOutlined, 
  DashboardOutlined, 
  SwapOutlined, 
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import WalletManage from './pages/WalletManage';
import Transaction from './pages/Transaction';
import TransactionHistory from './pages/TransactionHistory';
import { walletAPI } from './services/api';

const { Header, Sider, Content } = Layout;

function App() {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [collapsed, setCollapsed] = useState(false);
  const [currentWallet, setCurrentWallet] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const response = await walletAPI.getList();
      if (response.data.success) {
        const walletList = response.data.data;
        setWallets(walletList);
        if (walletList.length > 0 && !currentWallet) {
          setCurrentWallet(walletList[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletChange = (wallet) => {
    setCurrentWallet(wallet);
  };

  const userMenuItems = [
    {
      key: '1',
      label: (
        <span>
          <UserOutlined /> 个人设置
        </span>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <LogoutOutlined /> 退出登录
        </span>
      ),
    },
  ];

  const sidebarItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '资产概览',
    },
    {
      key: '/wallet',
      icon: <WalletOutlined />,
      label: '钱包管理',
    },
    {
      key: '/transaction',
      icon: <SwapOutlined />,
      label: '发起交易',
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: '交易历史',
    },
  ];

  const getSelectedKey = () => {
    const path = window.location.pathname;
    if (path === '/' || path === '/dashboard') return '/dashboard';
    if (path.startsWith('/wallet')) return '/wallet';
    if (path.startsWith('/transaction')) return '/transaction';
    if (path.startsWith('/history')) return '/history';
    return '/dashboard';
  };

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed}
          theme="light"
          style={{
            background: colorBgContainer,
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div className="logo">
            {collapsed ? '钱包' : '区块链数字钱包'}
          </div>
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            items={sidebarItems}
            style={{ borderRight: 0 }}
            onClick={({ key }) => {
              window.location.pathname = key;
            }}
          />
        </Sider>
        <Layout>
          <Header 
            style={{ 
              padding: '0 24px', 
              background: colorBgContainer,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div>
                {currentWallet ? (
                  <span>
                    当前钱包: <strong>{currentWallet.name}</strong>
                    <span className="address-text" style={{ marginLeft: 8, color: '#666' }}>
                      ({currentWallet.address.substring(0, 10)}...{currentWallet.address.substring(38)})
                    </span>
                  </span>
                ) : (
                  <span>暂无钱包，请先创建或导入钱包</span>
                )}
              </div>
            </div>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} />
                <span>用户</span>
              </div>
            </Dropdown>
          </Header>
          <Content
            style={{
              margin: '24px',
              padding: 24,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Routes>
              <Route 
                path="/" 
                element={
                  currentWallet 
                    ? <Navigate to="/dashboard" replace />
                    : <Navigate to="/wallet" replace />
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <Dashboard 
                    currentWallet={currentWallet} 
                    onWalletChange={handleWalletChange}
                    wallets={wallets}
                    refreshWallets={fetchWallets}
                  />
                } 
              />
              <Route 
                path="/wallet" 
                element={
                  <WalletManage 
                    currentWallet={currentWallet} 
                    onWalletChange={handleWalletChange}
                    wallets={wallets}
                    refreshWallets={fetchWallets}
                  />
                } 
              />
              <Route 
                path="/transaction" 
                element={
                  <Transaction 
                    currentWallet={currentWallet}
                    wallets={wallets}
                    onWalletChange={handleWalletChange}
                  />
                } 
              />
              <Route 
                path="/history" 
                element={
                  <TransactionHistory 
                    currentWallet={currentWallet}
                    wallets={wallets}
                    onWalletChange={handleWalletChange}
                  />
                } 
              />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App;
