import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  List, 
  Tag, 
  Spin, 
  Empty, 
  Button,
  message,
  Space,
  Tooltip
} from 'antd';
import { 
  DollarOutlined, 
  WalletOutlined, 
  RiseOutlined, 
  ReloadOutlined,
  SendOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { assetAPI, transactionAPI } from '../services/api';
import dayjs from 'dayjs';

const Dashboard = ({ currentWallet, onWalletChange, wallets, refreshWallets }) => {
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [refreshLoading, setRefreshLoading] = useState(false);

  useEffect(() => {
    if (currentWallet) {
      fetchData();
    }
  }, [currentWallet]);

  const fetchData = async () => {
    if (!currentWallet) return;
    
    setLoading(true);
    try {
      const [assetRes, txRes] = await Promise.all([
        assetAPI.getByWallet(currentWallet.id),
        transactionAPI.getByWallet(currentWallet.id, { limit: 5 })
      ]);

      if (assetRes.data.success) {
        setAssets(assetRes.data.data.assets || []);
        setTotalValue(assetRes.data.data.totalValueInUSD || 0);
      }

      if (txRes.data.success) {
        setRecentTransactions(txRes.data.data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!currentWallet) return;
    
    setRefreshLoading(true);
    try {
      const response = await assetAPI.refresh(currentWallet.id);
      if (response.data.success) {
        setAssets(response.data.data.assets || []);
        setTotalValue(response.data.data.totalValueInUSD || 0);
        message.success('资产价格已刷新');
      }
    } catch (error) {
      console.error('Failed to refresh assets:', error);
      message.error('刷新资产价格失败');
    } finally {
      setRefreshLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const colorMap = {
      success: 'success',
      pending: 'warning',
      failed: 'error'
    };
    const textMap = {
      success: '成功',
      pending: '处理中',
      failed: '失败'
    };
    return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
  };

  const getTypeIcon = (type) => {
    return type === 'send' ? (
      <ArrowUpOutlined style={{ color: '#ff4d4f' }} />
    ) : (
      <ArrowDownOutlined style={{ color: '#52c41a' }} />
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!currentWallet) {
    return (
      <div className="empty-container">
        <Empty description="请先创建或导入钱包" />
      </div>
    );
  }

  return (
    <div>
      <Row gutter={[16, 16]} className="mb-24">
        <Col span={6}>
          <Card className="card-hover">
            <Statistic
              title="总资产价值 (USD)"
              value={totalValue}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="card-hover">
            <Statistic
              title="钱包地址"
              value={currentWallet.address}
              prefix={<WalletOutlined />}
              valueStyle={{ fontSize: '14px', color: '#1890ff' }}
              formatter={(value) => (
                <Tooltip title={value}>
                  <span className="truncate" style={{ maxWidth: 200, display: 'inline-block' }}>
                    {value}
                  </span>
                </Tooltip>
              )}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="card-hover">
            <Statistic
              title="资产种类"
              value={assets.length}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="card-hover">
            <Statistic
              title="钱包数量"
              value={wallets.length}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={14}>
          <Card
            title="资产列表"
            extra={
              <Button 
                icon={<ReloadOutlined spin={refreshLoading} />} 
                onClick={handleRefresh}
                loading={refreshLoading}
              >
                刷新价格
              </Button>
            }
          >
            {assets.length === 0 ? (
              <Empty description="暂无资产" />
            ) : (
              <List
                dataSource={assets}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Space key="actions">
                        <span style={{ color: '#666' }}>
                          ${item.priceInUSD.toFixed(2)}
                        </span>
                        <span style={{ fontWeight: 'bold' }}>
                          ${(item.balance * item.priceInUSD).toFixed(2)}
                        </span>
                      </Space>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: 14
                        }}>
                          {item.symbol.substring(0, 2)}
                        </div>
                      }
                      title={
                        <Space>
                          <span style={{ fontWeight: 'bold' }}>{item.symbol}</span>
                          <Tag color="blue">{item.name}</Tag>
                        </Space>
                      }
                      description={
                        <span>
                          余额: <strong>{item.balance.toFixed(4)}</strong> {item.symbol}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col span={10}>
          <Card title="最近交易">
            {recentTransactions.length === 0 ? (
              <Empty description="暂无交易记录" />
            ) : (
              <List
                dataSource={recentTransactions}
                renderItem={(item) => (
                  <List.Item
                    className="transaction-item"
                    actions={[getStatusTag(item.status)]}
                  >
                    <List.Item.Meta
                      avatar={getTypeIcon(item.type)}
                      title={
                        <Space>
                          <span style={{ color: item.type === 'send' ? '#ff4d4f' : '#52c41a' }}>
                            {item.type === 'send' ? '发送' : '接收'}
                          </span>
                          <span style={{ fontWeight: 'bold' }}>
                            {item.type === 'send' ? '-' : '+'}{item.amount} {item.symbol}
                          </span>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <span className="address-text">
                            {item.type === 'send' ? 'To' : 'From'}: {item.to.substring(0, 10)}...{item.to.substring(38)}
                          </span>
                          <span style={{ color: '#999', fontSize: 12 }}>
                            {dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                          </span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
