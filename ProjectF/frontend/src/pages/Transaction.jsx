import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  message,
  Modal,
  Tabs,
  Descriptions,
  Divider,
  Tag,
  Typography,
  Space
} from 'antd';
import {
  SendOutlined,
  ArrowDownOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { transactionAPI, assetAPI } from '../services/api';

const { TextArea } = Input;
const { Text, Title } = Typography;

const Transaction = ({ currentWallet, wallets, onWalletChange }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulateLoading, setSimulateLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [activeTab, setActiveTab] = useState('send');

  const [sendForm] = Form.useForm();
  const [receiveForm] = Form.useForm();

  useEffect(() => {
    if (currentWallet) {
      fetchAssets();
    }
  }, [currentWallet]);

  const fetchAssets = async () => {
    if (!currentWallet) return;
    
    try {
      const response = await assetAPI.getByWallet(currentWallet.id);
      if (response.data.success) {
        setAssets(response.data.data.assets || []);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      message.error('获取资产列表失败');
    }
  };

  const handleSimulate = async (values) => {
    if (!currentWallet) {
      message.error('请先选择钱包');
      return;
    }

    setSimulateLoading(true);
    try {
      const response = await transactionAPI.simulate({
        walletId: currentWallet.id,
        to: values.toAddress,
        symbol: values.symbol,
        amount: parseFloat(values.amount)
      });

      if (response.data.success) {
        setSimulationResult(response.data.data);
        message.success('交易模拟完成');
      }
    } catch (error) {
      console.error('Failed to simulate transaction:', error);
      message.error(error.response?.data?.message || '模拟交易失败');
    } finally {
      setSimulateLoading(false);
    }
  };

  const handleSendTransaction = async (values) => {
    if (!currentWallet) {
      message.error('请先选择钱包');
      return;
    }

    setLoading(true);
    try {
      const response = await transactionAPI.send({
        walletId: currentWallet.id,
        to: values.toAddress,
        symbol: values.symbol,
        amount: parseFloat(values.amount)
      });

      if (response.data.success) {
        setTransactionResult({
          type: 'send',
          ...response.data.data
        });
        setResultModalVisible(true);
        sendForm.resetFields();
        setSimulationResult(null);
        fetchAssets();
      }
    } catch (error) {
      console.error('Failed to send transaction:', error);
      message.error(error.response?.data?.message || '发送交易失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveTransaction = async (values) => {
    if (!currentWallet) {
      message.error('请先选择钱包');
      return;
    }

    setLoading(true);
    try {
      const response = await transactionAPI.receive({
        walletId: currentWallet.id,
        from: values.fromAddress,
        symbol: values.symbol,
        amount: parseFloat(values.amount)
      });

      if (response.data.success) {
        setTransactionResult({
          type: 'receive',
          ...response.data.data
        });
        setResultModalVisible(true);
        receiveForm.resetFields();
        fetchAssets();
      }
    } catch (error) {
      console.error('Failed to receive transaction:', error);
      message.error(error.response?.data?.message || '接收交易失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(`${label}已复制到剪贴板`);
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const getSymbolBalance = (symbol) => {
    const asset = assets.find(a => a.symbol === symbol);
    return asset ? asset.balance : 0;
  };

  const getSymbolPrice = (symbol) => {
    const asset = assets.find(a => a.symbol === symbol);
    return asset ? asset.priceInUSD : 0;
  };

  const assetOptions = assets.map(asset => ({
    label: `${asset.symbol} (${asset.name}) - 余额: ${asset.balance.toFixed(4)}`,
    value: asset.symbol
  }));

  const tabItems = [
    {
      key: 'send',
      label: (
        <span>
          <SendOutlined /> 发送资产
        </span>
      ),
      children: (
        <Card>
          <Form
            form={sendForm}
            layout="vertical"
            onFinish={handleSendTransaction}
            initialValues={{ symbol: assets[0]?.symbol }}
          >
            <Form.Item
              name="symbol"
              label="选择资产"
              rules={[{ required: true, message: '请选择要发送的资产' }]}
            >
              <Select
                placeholder="请选择资产类型"
                options={assetOptions}
                onChange={(value) => {
                  sendForm.setFieldValue('symbol', value);
                }}
              />
            </Form.Item>

            <Form.Item
              name="toAddress"
              label="接收地址"
              rules={[
                { required: true, message: '请输入接收地址' },
                { pattern: /^0x[a-fA-F0-9]{40}$/, message: '请输入有效的以太坊地址' }
              ]}
            >
              <Input placeholder="请输入接收钱包地址（0x开头）" />
            </Form.Item>

            <Form.Item
              name="amount"
              label="发送数量"
              rules={[
                { required: true, message: '请输入发送数量' },
                { 
                  validator: (_, value) => {
                    const symbol = sendForm.getFieldValue('symbol');
                    if (parseFloat(value) > getSymbolBalance(symbol)) {
                      return Promise.reject('余额不足');
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input.Number
                style={{ width: '100%' }}
                placeholder="请输入发送数量"
                min={0}
                precision={6}
                addonAfter={
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => {
                      const symbol = sendForm.getFieldValue('symbol');
                      sendForm.setFieldValue('amount', getSymbolBalance(symbol));
                    }}
                  >
                    全部
                  </Button>
                }
              />
            </Form.Item>

            <Form.Item
              shouldUpdate={(prevValues, currentValues) => 
                prevValues.symbol !== currentValues.symbol || 
                prevValues.amount !== currentValues.amount
              }
            >
              {({ getFieldValue }) => {
                const symbol = getFieldValue('symbol');
                const amount = getFieldValue('amount');
                const balance = getSymbolBalance(symbol);
                const price = getSymbolPrice(symbol);
                
                return (
                  <div style={{ 
                    background: '#f5f5f5', 
                    padding: 16, 
                    borderRadius: 8,
                    marginBottom: 16
                  }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text type="secondary">可用余额：</Text>
                        <Text strong>
                          {balance.toFixed(4)} {symbol}
                        </Text>
                        {price > 0 && (
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            ≈ ${(balance * price).toFixed(2)} USD
                          </Text>
                        )}
                      </div>
                      {amount && amount > 0 && (
                        <div>
                          <Text type="secondary">预计发送金额：</Text>
                          <Text strong style={{ color: '#ff4d4f' }}>
                            {parseFloat(amount).toFixed(4)} {symbol}
                          </Text>
                          {price > 0 && (
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                              ≈ ${(parseFloat(amount) * price).toFixed(2)} USD
                            </Text>
                          )}
                        </div>
                      )}
                    </Space>
                  </div>
                );
              }}
            </Form.Item>

            {simulationResult && (
              <div style={{ 
                background: '#e6f7ff', 
                padding: 16, 
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid #91d5ff'
              }}>
                <Title level={5} style={{ marginBottom: 8, color: '#1890ff' }}>
                  模拟交易结果
                </Title>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="预估矿工费">
                    {simulationResult.estimatedGasFee.toFixed(8)} ETH
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      (≈ ${simulationResult.estimatedGasFeeInUSD.toFixed(4)} USD)
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Gas Price">
                    {simulationResult.gasPrice} Gwei
                  </Descriptions.Item>
                  <Descriptions.Item label="Gas Limit">
                    {simulationResult.gasLimit}
                  </Descriptions.Item>
                  <Descriptions.Item label="预估区块号">
                    {simulationResult.estimatedBlockNumber}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}

            <div style={{ background: '#fff7e6', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <Text type="warning" strong>
                <SafetyCertificateOutlined /> 模拟交易提示
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                此为模拟交易演示，所有交易均在本地模拟执行，不会真正在区块链上广播。
                用于演示交易流程和界面交互。
              </Text>
            </div>

            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button
                  onClick={() => {
                    sendForm.validateFields(['symbol', 'toAddress', 'amount'])
                      .then(values => handleSimulate(values))
                      .catch(info => console.log('Validate Failed:', info));
                  }}
                  loading={simulateLoading}
                >
                  模拟交易
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  发送交易
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )
    },
    {
      key: 'receive',
      label: (
        <span>
          <ArrowDownOutlined /> 接收资产
        </span>
      ),
      children: (
        <Card>
          <div style={{ marginBottom: 24 }}>
            <div className="wallet-card" style={{ padding: 24, borderRadius: 12 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                    <WalletOutlined /> 当前钱包地址
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text 
                    style={{ 
                      color: 'white', 
                      fontFamily: 'monospace',
                      fontSize: 16,
                      wordBreak: 'break-all'
                    }}
                  >
                    {currentWallet?.address || '请先选择钱包'}
                  </Text>
                  {currentWallet && (
                    <Button
                      type="text"
                      icon={<CopyOutlined style={{ color: 'white' }} />}
                      onClick={() => handleCopyToClipboard(currentWallet.address, '钱包地址')}
                    />
                  )}
                </div>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  请将此地址提供给付款方，用于接收加密货币
                </Text>
              </Space>
            </div>
          </div>

          <Divider>模拟接收（测试用）</Divider>

          <Form
            form={receiveForm}
            layout="vertical"
            onFinish={handleReceiveTransaction}
            initialValues={{ symbol: assets[0]?.symbol }}
          >
            <Form.Item
              name="symbol"
              label="选择资产类型"
              rules={[{ required: true, message: '请选择资产类型' }]}
            >
              <Select
                placeholder="请选择接收的资产类型"
                options={assetOptions}
              />
            </Form.Item>

            <Form.Item
              name="fromAddress"
              label="付款方地址"
              rules={[
                { required: true, message: '请输入付款方地址' },
                { pattern: /^0x[a-fA-F0-9]{40}$/, message: '请输入有效的以太坊地址' }
              ]}
            >
              <Input placeholder="请输入付款方钱包地址（0x开头）" />
            </Form.Item>

            <Form.Item
              name="amount"
              label="接收数量"
              rules={[
                { required: true, message: '请输入接收数量' },
                { min: 0, type: 'number', message: '请输入有效的数量' }
              ]}
            >
              <Input.Number
                style={{ width: '100%' }}
                placeholder="请输入接收数量"
                min={0}
                precision={6}
              />
            </Form.Item>

            <div style={{ background: '#e6fffb', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <Text type="success" strong>
                测试功能说明
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                此功能用于模拟接收资产，填写后将在您的钱包余额中增加相应数量的资产。
                仅用于测试和演示目的。
              </Text>
            </div>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={loading}>
                模拟接收
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )
    }
  ];

  return (
    <div>
      {!currentWallet ? (
        <div className="empty-container">
          <Card style={{ maxWidth: 400, textAlign: 'center' }}>
            <WalletOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={4}>请先选择钱包</Title>
            <Text type="secondary">
              请在钱包管理页面创建或导入钱包，然后选择一个钱包进行交易
            </Text>
          </Card>
        </div>
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      )}

      {/* 交易结果模态框 */}
      <Modal
        title="交易结果"
        open={resultModalVisible}
        onCancel={() => {
          setResultModalVisible(false);
          setTransactionResult(null);
        }}
        footer={[
          <Button 
            key="close" 
            type="primary" 
            onClick={() => {
              setResultModalVisible(false);
              setTransactionResult(null);
            }}
          >
            确定
          </Button>
        ]}
      >
        {transactionResult && (
          <div>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: 24,
              padding: 16,
              background: transactionResult.transaction.status === 'success' ? '#f6ffed' : '#fff2f0',
              borderRadius: 8
            }}>
              <Tag 
                color={transactionResult.transaction.status === 'success' ? 'success' : 'error'}
                style={{ fontSize: 16, padding: '4px 16px' }}
              >
                {transactionResult.transaction.status === 'success' ? '交易成功' : '交易失败'}
              </Tag>
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="交易类型">
                <Tag color={transactionResult.type === 'send' ? 'red' : 'green'}>
                  {transactionResult.type === 'send' ? '发送' : '接收'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="资产类型">
                {transactionResult.transaction.symbol}
              </Descriptions.Item>
              <Descriptions.Item label="交易数量">
                <Text strong style={{ 
                  color: transactionResult.type === 'send' ? '#ff4d4f' : '#52c41a'
                }}>
                  {transactionResult.type === 'send' ? '-' : '+'}
                  {transactionResult.transaction.amount} {transactionResult.transaction.symbol}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="发送方地址">
                <Text className="address-text">{transactionResult.transaction.from}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="接收方地址">
                <Text className="address-text">{transactionResult.transaction.to}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="交易哈希">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text className="address-text">{transactionResult.transaction.hash}</Text>
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyToClipboard(transactionResult.transaction.hash, '交易哈希')}
                  />
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="区块号">
                {transactionResult.transaction.blockNumber}
              </Descriptions.Item>
              <Descriptions.Item label="交易时间">
                {new Date(transactionResult.transaction.timestamp).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="更新后余额">
                <Text strong>{transactionResult.updatedBalance.toFixed(6)} {transactionResult.transaction.symbol}</Text>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Transaction;
