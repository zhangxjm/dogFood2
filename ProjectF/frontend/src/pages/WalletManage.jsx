import React, { useState } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Radio,
  List,
  Tag,
  Popconfirm,
  message,
  Tooltip,
  Space,
  Divider,
  Typography
} from 'antd';
import {
  PlusOutlined,
  WalletOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  KeyOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { walletAPI } from '../services/api';

const { TextArea } = Input;
const { Title, Text } = Typography;

const WalletManage = ({ currentWallet, onWalletChange, wallets, refreshWallets }) => {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [importType, setImportType] = useState('privateKey');
  const [loading, setLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [newWalletInfo, setNewWalletInfo] = useState(null);
  const [mnemonicModalVisible, setMnemonicModalVisible] = useState(false);

  const [createForm] = Form.useForm();
  const [importForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const handleCreateWallet = async (values) => {
    setLoading(true);
    try {
      const response = await walletAPI.create(values.name);
      if (response.data.success) {
        message.success('钱包创建成功');
        setNewWalletInfo(response.data.data);
        setCreateModalVisible(false);
        setMnemonicModalVisible(true);
        createForm.resetFields();
        refreshWallets();
      }
    } catch (error) {
      console.error('Failed to create wallet:', error);
      message.error(error.response?.data?.message || '创建钱包失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImportWallet = async (values) => {
    setLoading(true);
    try {
      let response;
      if (importType === 'privateKey') {
        response = await walletAPI.importPrivateKey(values.privateKey, values.name);
      } else {
        response = await walletAPI.importMnemonic(values.mnemonic, values.name);
      }
      
      if (response.data.success) {
        message.success('钱包导入成功');
        setImportModalVisible(false);
        importForm.resetFields();
        refreshWallets();
      }
    } catch (error) {
      console.error('Failed to import wallet:', error);
      message.error(error.response?.data?.message || '导入钱包失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEditWallet = async (values) => {
    if (!selectedWallet) return;
    
    setLoading(true);
    try {
      const response = await walletAPI.update(selectedWallet.id, values.name);
      if (response.data.success) {
        message.success('钱包更新成功');
        setEditModalVisible(false);
        editForm.resetFields();
        refreshWallets();
        if (currentWallet?.id === selectedWallet.id) {
          onWalletChange({ ...selectedWallet, name: values.name });
        }
      }
    } catch (error) {
      console.error('Failed to update wallet:', error);
      message.error(error.response?.data?.message || '更新钱包失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWallet = async (walletId) => {
    setLoading(true);
    try {
      const response = await walletAPI.delete(walletId);
      if (response.data.success) {
        message.success('钱包删除成功');
        refreshWallets();
        if (currentWallet?.id === walletId) {
          onWalletChange(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete wallet:', error);
      message.error(error.response?.data?.message || '删除钱包失败');
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

  const handleSelectWallet = (wallet) => {
    onWalletChange(wallet);
  };

  const openEditModal = (wallet) => {
    setSelectedWallet(wallet);
    editForm.setFieldsValue({ name: wallet.name });
    setEditModalVisible(true);
  };

  return (
    <div>
      <Card
        title="钱包管理"
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setCreateModalVisible(true)}
            >
              创建新钱包
            </Button>
            <Button 
              icon={<KeyOutlined />} 
              onClick={() => setImportModalVisible(true)}
            >
              导入钱包
            </Button>
          </Space>
        }
      >
        {wallets.length === 0 ? (
          <div className="empty-container">
            <WalletOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={4}>暂无钱包</Title>
            <Text type="secondary">点击上方按钮创建或导入钱包</Text>
          </div>
        ) : (
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }}
            dataSource={wallets}
            renderItem={(wallet) => (
              <List.Item>
                <Card
                  className={`card-hover ${currentWallet?.id === wallet.id ? 'wallet-card' : ''}`}
                  style={{
                    background: currentWallet?.id === wallet.id 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#fff',
                    color: currentWallet?.id === wallet.id ? '#fff' : 'inherit'
                  }}
                  actions={[
                    <Tooltip key="select" title={currentWallet?.id === wallet.id ? '当前选中' : '切换至此钱包'}>
                      <Button
                        type={currentWallet?.id === wallet.id ? 'primary' : 'default'}
                        size="small"
                        onClick={() => handleSelectWallet(wallet)}
                        disabled={currentWallet?.id === wallet.id}
                      >
                        {currentWallet?.id === wallet.id ? '已选中' : '切换'}
                      </Button>
                    </Tooltip>,
                    <Tooltip key="edit" title="编辑">
                      <EditOutlined 
                        style={{ cursor: 'pointer' }} 
                        onClick={() => openEditModal(wallet)}
                      />
                    </Tooltip>,
                    <Tooltip key="delete" title="删除">
                      <Popconfirm
                        title="确定要删除此钱包吗？"
                        description="删除后将无法恢复，请谨慎操作"
                        onConfirm={() => handleDeleteWallet(wallet.id)}
                        okText="确定"
                        cancelText="取消"
                        okType="danger"
                      >
                        <DeleteOutlined style={{ cursor: 'pointer', color: '#ff4d4f' }} />
                      </Popconfirm>
                    </Tooltip>
                  ]}
                >
                  <Card.Meta
                    title={
                      <Space>
                        <WalletOutlined />
                        <span style={{ fontWeight: 'bold' }}>{wallet.name}</span>
                        {currentWallet?.id === wallet.id && (
                          <Tag color="green">当前</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text 
                            className="address-text"
                            style={{ 
                              fontSize: 12, 
                              color: currentWallet?.id === wallet.id ? 'rgba(255,255,255,0.8)' : '#666'
                            }}
                          >
                            {wallet.address}
                          </Text>
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => handleCopyToClipboard(wallet.address, '地址')}
                          />
                        </div>
                        <Text 
                          type="secondary"
                          style={{ 
                            fontSize: 12, 
                            color: currentWallet?.id === wallet.id ? 'rgba(255,255,255,0.6)' : '#999'
                          }}
                        >
                          创建时间: {new Date(wallet.createdAt).toLocaleString('zh-CN')}
                        </Text>
                      </Space>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 创建钱包模态框 */}
      <Modal
        title="创建新钱包"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateWallet}
        >
          <Form.Item
            name="name"
            label="钱包名称"
            rules={[{ required: true, message: '请输入钱包名称' }]}
          >
            <Input placeholder="请输入钱包名称，如：我的主钱包" />
          </Form.Item>
          <Divider />
          <div style={{ background: '#fff7e6', padding: 16, borderRadius: 8 }}>
            <Text type="warning" strong>
              <SafetyCertificateOutlined /> 安全提示
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              创建钱包后，请务必备份好助记词和私钥。助记词是恢复钱包的唯一方式，
              丢失或泄露助记词将可能导致资产损失。本系统仅为模拟演示，不涉及真实资产。
            </Text>
          </div>
          <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              创建钱包
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 助记词展示模态框 */}
      <Modal
        title="请备份您的助记词"
        open={mnemonicModalVisible}
        onCancel={() => {
          setMnemonicModalVisible(false);
          setNewWalletInfo(null);
        }}
        footer={[
          <Button 
            key="confirm" 
            type="primary" 
            onClick={() => {
              setMnemonicModalVisible(false);
              setNewWalletInfo(null);
            }}
          >
            我已备份
          </Button>
        ]}
      >
        {newWalletInfo && (
          <div>
            <div style={{ background: '#fff2f0', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <Text type="danger" strong>
                ⚠️ 重要提示：请立即备份以下信息
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                助记词和私钥是恢复钱包的唯一方式，请妥善保管，不要泄露给任何人。
              </Text>
            </div>

            <Divider>钱包信息</Divider>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>钱包名称：</Text>
              <Text>{newWalletInfo.name}</Text>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>钱包地址：</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Text className="address-text">{newWalletInfo.address}</Text>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyToClipboard(newWalletInfo.address, '钱包地址')}
                />
              </div>
            </div>

            {newWalletInfo.mnemonic && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>助记词（12个单词）：</Text>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: 16, 
                  borderRadius: 8, 
                  marginTop: 8,
                  fontFamily: 'monospace'
                }}>
                  <Text>{newWalletInfo.mnemonic}</Text>
                </div>
                <Button
                  type="link"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyToClipboard(newWalletInfo.mnemonic, '助记词')}
                >
                  复制助记词
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 导入钱包模态框 */}
      <Modal
        title="导入钱包"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
      >
        <Form
          form={importForm}
          layout="vertical"
          onFinish={handleImportWallet}
        >
          <Form.Item label="导入方式">
            <Radio.Group 
              value={importType} 
              onChange={(e) => setImportType(e.target.value)}
            >
              <Radio value="privateKey">私钥导入</Radio>
              <Radio value="mnemonic">助记词导入</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="name"
            label="钱包名称"
            rules={[{ required: true, message: '请输入钱包名称' }]}
          >
            <Input placeholder="请输入钱包名称" />
          </Form.Item>

          {importType === 'privateKey' ? (
            <Form.Item
              name="privateKey"
              label="私钥"
              rules={[{ required: true, message: '请输入私钥' }]}
            >
              <TextArea
                rows={3}
                placeholder="请输入以太坊私钥（以0x开头的64位十六进制字符串）"
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="mnemonic"
              label="助记词"
              rules={[{ required: true, message: '请输入助记词' }]}
            >
              <TextArea
                rows={3}
                placeholder="请输入12个或24个助记词，用空格分隔"
              />
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              导入钱包
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑钱包模态框 */}
      <Modal
        title="编辑钱包"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditWallet}
        >
          <Form.Item
            name="name"
            label="钱包名称"
            rules={[{ required: true, message: '请输入钱包名称' }]}
          >
            <Input placeholder="请输入新的钱包名称" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              保存更改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WalletManage;
