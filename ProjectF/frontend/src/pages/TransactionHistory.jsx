import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Tag,
  Select,
  DatePicker,
  Button,
  Pagination,
  Empty,
  Spin,
  Descriptions,
  Modal,
  Space,
  Input,
  Tooltip,
  message,
  Divider
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
  CopyOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { transactionAPI } from '../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const TransactionHistory = ({ currentWallet, wallets, onWalletChange }) => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedType, setSelectedType] = useState(undefined);
  const [selectedSymbol, setSelectedSymbol] = useState(undefined);
  const [searchHash, setSearchHash] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    if (currentWallet) {
      fetchTransactions();
    }
  }, [currentWallet, currentPage, pageSize, selectedType, selectedSymbol]);

  const fetchTransactions = async () => {
    if (!currentWallet) return;

    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize
      };

      if (selectedType) {
        params.type = selectedType;
      }

      if (selectedSymbol) {
        params.symbol = selectedSymbol;
      }

      const response = await transactionAPI.getByWallet(currentWallet.id, params);
      
      if (response.data.success) {
        setTransactions(response.data.data.transactions || []);
        setTotal(response.data.data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      message.error('获取交易记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (transaction) => {
    setSelectedTransaction(transaction);
    setDetailModalVisible(true);
  };

  const handleCopyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(`${label}已复制到剪贴板`);
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const handleSearchByHash = () => {
    if (searchHash && searchHash.trim()) {
      fetchTransactions();
    }
  };

  const handleReset = () => {
    setSelectedType(undefined);
    setSelectedSymbol(undefined);
    setSearchHash('');
    setCurrentPage(1);
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
      <ArrowUpOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
    ) : (
      <ArrowDownOutlined style={{ color: '#52c41a', fontSize: 20 }} />
    );
  };

  const getTypeTag = (type) => {
    return (
      <Tag color={type === 'send' ? 'red' : 'green'}>
        {type === 'send' ? '发送' : '接收'}
      </Tag>
    );
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 10)}...${address.substring(38)}`;
  };

  const symbolOptions = [
    { value: '', label: '全部资产' },
    { value: 'ETH', label: 'ETH - Ethereum' },
    { value: 'USDT', label: 'USDT - Tether USD' },
    { value: 'USDC', label: 'USDC - USD Coin' },
    { value: 'LINK', label: 'LINK - Chainlink' },
    { value: 'UNI', label: 'UNI - Uniswap' }
  ];

  const typeOptions = [
    { value: '', label: '全部类型' },
    { value: 'send', label: '发送' },
    { value: 'receive', label: '接收' }
  ];

  const getUniqueSymbols = () => {
    const symbols = new Set(transactions.map(t => t.symbol));
    return Array.from(symbols);
  };

  return (
    <div>
      <Card
        title="交易历史"
        extra={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchTransactions}
            loading={loading}
          >
            刷新
          </Button>
        }
      >
        {!currentWallet ? (
          <div className="empty-container">
            <Card style={{ maxWidth: 400, textAlign: 'center' }}>
              <WalletOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
              <h3>请先选择钱包</h3>
              <p>请在钱包管理页面选择一个钱包查看交易历史</p>
            </Card>
          </div>
        ) : (
          <div>
            {/* 筛选条件 */}
            <div style={{ 
              marginBottom: 24, 
              padding: 16, 
              background: '#fafafa', 
              borderRadius: 8 
            }}>
              <Space wrap size={16}>
                <Select
                  style={{ width: 150 }}
                  placeholder="交易类型"
                  allowClear
                  value={selectedType}
                  onChange={(value) => {
                    setSelectedType(value || undefined);
                    setCurrentPage(1);
                  }}
                  options={typeOptions}
                />
                <Select
                  style={{ width: 200 }}
                  placeholder="资产类型"
                  allowClear
                  value={selectedSymbol}
                  onChange={(value) => {
                    setSelectedSymbol(value || undefined);
                    setCurrentPage(1);
                  }}
                  options={symbolOptions}
                />
                <Input
                  style={{ width: 300 }}
                  placeholder="搜索交易哈希"
                  value={searchHash}
                  onChange={(e) => setSearchHash(e.target.value)}
                  prefix={<SearchOutlined style={{ color: '#999' }} />}
                  onPressEnter={handleSearchByHash}
                  suffix={
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={handleSearchByHash}
                    >
                      搜索
                    </Button>
                  }
                />
                <Button onClick={handleReset}>
                  重置筛选
                </Button>
              </Space>
            </div>

            {/* 统计信息 */}
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Tag color="blue">共 {total} 条记录</Tag>
                {currentPage && (
                  <Tag color="green">第 {currentPage} 页</Tag>
                )}
              </Space>
            </div>

            {/* 交易列表 */}
            {loading ? (
              <div className="loading-container">
                <Spin size="large" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="empty-container">
                <Empty description="暂无交易记录" />
              </div>
            ) : (
              <List
                dataSource={transactions}
                renderItem={(item) => (
                  <List.Item
                    className="transaction-item"
                    actions={[
                      <Button 
                        type="link" 
                        size="small"
                        onClick={() => handleViewDetail(item)}
                      >
                        查看详情
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: item.type === 'send' 
                            ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)'
                            : 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {getTypeIcon(item.type)}
                        </div>
                      }
                      title={
                        <Space>
                          {getTypeTag(item.type)}
                          <span style={{ fontWeight: 'bold' }}>
                            {item.symbol}
                          </span>
                          <span style={{ 
                            color: item.type === 'send' ? '#ff4d4f' : '#52c41a',
                            fontWeight: 'bold',
                            fontSize: 16
                          }}>
                            {item.type === 'send' ? '-' : '+'}{item.amount.toFixed(6)}
                          </span>
                          {getStatusTag(item.status)}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space>
                              <Text type="secondary">交易哈希：</Text>
                              <Tooltip title={item.hash}>
                                <Text className="address-text" code>
                                  {formatAddress(item.hash)}
                                </Text>
                              </Tooltip>
                              <Button
                                type="text"
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopyToClipboard(item.hash, '交易哈希')}
                              />
                            </Space>
                            <Text type="secondary">
                              区块号：{item.blockNumber}
                            </Text>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space>
                              <Text type="secondary">
                                {item.type === 'send' ? '发送至' : '接收自'}：
                              </Text>
                              <Tooltip title={item.type === 'send' ? item.to : item.from}>
                                <Text className="address-text" code>
                                  {formatAddress(item.type === 'send' ? item.to : item.from)}
                                </Text>
                              </Tooltip>
                            </Space>
                            <Text type="secondary">
                              {dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                            </Text>
                          </div>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}

            {/* 分页 */}
            {total > 0 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginTop: 24 
              }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={total}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 交易详情模态框 */}
      <Modal
        title="交易详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedTransaction(null);
        }}
        width={700}
        footer={[
          <Button 
            key="close" 
            onClick={() => {
              setDetailModalVisible(false);
              setSelectedTransaction(null);
            }}
          >
            关闭
          </Button>
        ]}
      >
        {selectedTransaction && (
          <div>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: 24,
              padding: 20,
              background: selectedTransaction.status === 'success' ? '#f6ffed' : '#fff2f0',
              borderRadius: 8
            }}>
              <div style={{ marginBottom: 12 }}>
                {getTypeIcon(selectedTransaction.type)}
              </div>
              <div style={{ marginBottom: 8 }}>
                <Tag 
                  color={selectedTransaction.status === 'success' ? 'success' : 'error'}
                  style={{ fontSize: 16, padding: '4px 16px' }}
                >
                  {selectedTransaction.status === 'success' ? '交易成功' : '交易失败'}
                </Tag>
              </div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: selectedTransaction.type === 'send' ? '#ff4d4f' : '#52c41a' }}>
                {selectedTransaction.type === 'send' ? '-' : '+'}
                {selectedTransaction.amount.toFixed(6)} {selectedTransaction.symbol}
              </div>
            </div>

            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="交易类型">
                {getTypeTag(selectedTransaction.type)}
              </Descriptions.Item>
              <Descriptions.Item label="资产类型">
                <Tag color="blue">{selectedTransaction.symbol}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="交易金额">
                <span style={{ fontWeight: 'bold' }}>
                  {selectedTransaction.amount.toFixed(8)} {selectedTransaction.symbol}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="发送方地址">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text className="address-text">{selectedTransaction.from}</Text>
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyToClipboard(selectedTransaction.from, '发送方地址')}
                  />
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="接收方地址">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text className="address-text">{selectedTransaction.to}</Text>
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyToClipboard(selectedTransaction.to, '接收方地址')}
                  />
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="交易哈希 (TxHash)">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text className="address-text">{selectedTransaction.hash}</Text>
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyToClipboard(selectedTransaction.hash, '交易哈希')}
                  />
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="区块号 (Block Number)">
                {selectedTransaction.blockNumber}
              </Descriptions.Item>
              {selectedTransaction.gasPrice && (
                <Descriptions.Item label="Gas Price">
                  {selectedTransaction.gasPrice} Gwei
                </Descriptions.Item>
              )}
              {selectedTransaction.gasLimit && (
                <Descriptions.Item label="Gas Limit">
                  {selectedTransaction.gasLimit}
                </Descriptions.Item>
              )}
              {selectedTransaction.nonce !== undefined && (
                <Descriptions.Item label="Nonce">
                  {selectedTransaction.nonce}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="交易时间">
                {dayjs(selectedTransaction.timestamp).format('YYYY年MM月DD日 HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
              <Text type="secondary" strong>
                ⚠️ 注意：此为模拟交易演示
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                所有交易均为本地模拟，不会真正在区块链上广播。本系统仅用于演示和教育目的，
                不涉及真实的私钥管理和资产交易。
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionHistory;
