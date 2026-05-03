import React, { useState, useEffect } from 'react'
import { Card, List, Button, Modal, Form, Input, Select, Tag, message, Popconfirm, Empty } from 'antd'
import { PlusOutlined, MobileOutlined, SyncOutlined, LinkOutlined, UnlinkOutlined, DeleteOutlined } from '@ant-design/icons'
import { deviceApi } from '../services/api'

const { Option } = Select

function Devices() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    setLoading(true)
    try {
      const response = await deviceApi.getDevices()
      setDevices(response.data || [])
    } catch (error) {
      console.error('获取设备列表失败:', error)
      message.error('获取设备列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDevice = async (values) => {
    try {
      await deviceApi.createDevice({
        name: values.name,
        device_type: values.device_type,
        mac_address: values.mac_address,
        serial_number: values.serial_number,
        firmware_version: values.firmware_version,
      })
      message.success('设备创建成功')
      setModalVisible(false)
      form.resetFields()
      fetchDevices()
    } catch (error) {
      console.error('创建设备失败:', error)
      message.error('创建设备失败')
    }
  }

  const handlePairDevice = async (id) => {
    try {
      await deviceApi.pairDevice(id)
      message.success('设备配对成功')
      fetchDevices()
    } catch (error) {
      message.error('设备配对失败')
    }
  }

  const handleUnpairDevice = async (id) => {
    try {
      await deviceApi.unpairDevice(id)
      message.success('设备取消配对成功')
      fetchDevices()
    } catch (error) {
      message.error('取消配对失败')
    }
  }

  const handleSyncDevice = async (id) => {
    try {
      await deviceApi.syncDevice(id)
      message.success('设备同步成功')
      fetchDevices()
    } catch (error) {
      message.error('设备同步失败')
    }
  }

  const handleDeleteDevice = async (id) => {
    try {
      await deviceApi.deleteDevice(id)
      message.success('设备删除成功')
      fetchDevices()
    } catch (error) {
      message.error('设备删除失败')
    }
  }

  const getStatusTag = (status) => {
    const statusMap = {
      'ACTIVE': { color: 'green', text: '激活' },
      'INACTIVE': { color: 'default', text: '未激活' },
      'PAIRED': { color: 'blue', text: '已配对' },
      'UNPAIRED': { color: 'orange', text: '未配对' },
    }
    const info = statusMap[status] || { color: 'default', text: status }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const getDeviceTypeText = (type) => {
    const typeMap = {
      'SMART_BAND': '智能手环',
      'SMART_WATCH': '智能手表',
      'HEART_RATE_MONITOR': '心率监测仪',
      'SLEEP_TRACKER': '睡眠追踪器',
    }
    return typeMap[type] || type
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>设备管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          添加设备
        </Button>
      </div>

      {devices.length > 0 ? (
        <List
          grid={{ gutter: 16, column: 1, md: 2, lg: 3 }}
          dataSource={devices}
          renderItem={(device) => (
            <List.Item>
              <Card
                hoverable
                className="device-card"
                actions={[
                  device.status !== 'PAIRED' ? (
                    <Button type="link" icon={<LinkOutlined />} onClick={() => handlePairDevice(device.id)}>
                      配对
                    </Button>
                  ) : (
                    <Button type="link" icon={<UnlinkOutlined />} onClick={() => handleUnpairDevice(device.id)}>
                      取消配对
                    </Button>
                  ),
                  <Button type="link" icon={<SyncOutlined />} onClick={() => handleSyncDevice(device.id)}>
                    同步
                  </Button>,
                  <Popconfirm
                    title="确定要删除此设备吗？"
                    onConfirm={() => handleDeleteDevice(device.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="link" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <div className="device-info">
                  <div className="device-icon">
                    <MobileOutlined />
                  </div>
                  <div className="device-details">
                    <div className="device-name">{device.name}</div>
                    <div style={{ marginBottom: 8 }}>
                      {getStatusTag(device.status)}
                      <Tag color="purple" style={{ marginLeft: 8 }}>
                        {getDeviceTypeText(device.device_type)}
                      </Tag>
                    </div>
                    <div className="device-status">
                      <div className="battery">
                        <span>电量: </span>
                        <span style={{ 
                          color: device.battery_level > 20 ? '#52c41a' : '#ff4d4f',
                          fontWeight: 'bold'
                        }}>
                          {device.battery_level}%
                        </span>
                      </div>
                    </div>
                    {device.last_sync_time && (
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        最后同步: {new Date(device.last_sync_time).toLocaleString('zh-CN')}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无设备"
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            添加第一个设备
          </Button>
        </Empty>
      )}

      <Modal
        title="添加设备"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateDevice}
        >
          <Form.Item
            name="name"
            label="设备名称"
            rules={[{ required: true, message: '请输入设备名称' }]}
          >
            <Input placeholder="例如：我的智能手环" />
          </Form.Item>
          
          <Form.Item
            name="device_type"
            label="设备类型"
            rules={[{ required: true, message: '请选择设备类型' }]}
          >
            <Select placeholder="请选择设备类型">
              <Option value="SMART_BAND">智能手环</Option>
              <Option value="SMART_WATCH">智能手表</Option>
              <Option value="HEART_RATE_MONITOR">心率监测仪</Option>
              <Option value="SLEEP_TRACKER">睡眠追踪器</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="mac_address"
            label="MAC地址"
            rules={[{ required: true, message: '请输入MAC地址' }]}
          >
            <Input placeholder="例如：00:11:22:33:44:55" />
          </Form.Item>
          
          <Form.Item
            name="serial_number"
            label="序列号"
          >
            <Input placeholder="可选" />
          </Form.Item>
          
          <Form.Item
            name="firmware_version"
            label="固件版本"
          >
            <Input placeholder="例如：v1.0.0" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              添加设备
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Devices
