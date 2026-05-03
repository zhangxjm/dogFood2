import React, { useState, useEffect } from 'react'
import { Card, Form, Input, InputNumber, Select, Button, message, Avatar, Row, Col, Statistic } from 'antd'
import { UserOutlined, EditOutlined } from '@ant-design/icons'
import useAuthStore from '../store/authStore'
import { authApi } from '../services/api'

const { Option } = Select

function Profile() {
  const { user, setUser } = useAuthStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
      })
    }
  }, [user, form])

  const handleUpdateProfile = async (values) => {
    setLoading(true)
    try {
      const response = await authApi.updateUser(values)
      setUser(response.data)
      message.success('个人资料更新成功')
      setEditing(false)
    } catch (error) {
      console.error('更新失败:', error)
      message.error('更新失败')
    } finally {
      setLoading(false)
    }
  }

  const calculateBMI = () => {
    if (user?.height && user?.weight) {
      const heightM = user.height / 100
      const bmi = user.weight / (heightM * heightM)
      return bmi.toFixed(1)
    }
    return '--'
  }

  const getBMICategory = () => {
    const bmi = parseFloat(calculateBMI())
    if (isNaN(bmi)) return { text: '--', color: '#999' }
    if (bmi < 18.5) return { text: '偏瘦', color: '#1890ff' }
    if (bmi < 24) return { text: '正常', color: '#52c41a' }
    if (bmi < 28) return { text: '偏胖', color: '#faad14' }
    return { text: '肥胖', color: '#ff4d4f' }
  }

  const bmiCategory = getBMICategory()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>个人资料</h2>
        <Button 
          type={editing ? 'default' : 'primary'} 
          icon={editing ? null : <EditOutlined />}
          onClick={() => setEditing(!editing)}
        >
          {editing ? '取消编辑' : '编辑资料'}
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Avatar 
                size={120} 
                icon={<UserOutlined />} 
                style={{ 
                  backgroundColor: '#1890ff',
                  fontSize: 48,
                  marginBottom: 16
                }}
              >
                {user?.username?.charAt(0)?.toUpperCase()}
              </Avatar>
              <h2 style={{ marginBottom: 8 }}>{user?.username}</h2>
              <p style={{ color: '#666', marginBottom: 24 }}>{user?.email || '未设置邮箱'}</p>
              
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic 
                    title="BMI指数" 
                    value={calculateBMI()} 
                    valueStyle={{ color: bmiCategory.color }}
                  />
                  <p style={{ color: bmiCategory.color, fontWeight: 'bold' }}>
                    {bmiCategory.text}
                  </p>
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="年龄" 
                    value={user?.age || '--'} 
                    suffix="岁"
                  />
                </Col>
              </Row>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card title="基本信息">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              initialValues={{
                username: user?.username,
                email: user?.email,
                phone: user?.phone,
                age: user?.age,
                gender: user?.gender,
                height: user?.height,
                weight: user?.weight,
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="username"
                    label="用户名"
                  >
                    <Input disabled placeholder="用户名不可修改" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                  >
                    <Input placeholder="请输入邮箱" disabled={!editing} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="phone"
                    label="手机号"
                  >
                    <Input placeholder="请输入手机号" disabled={!editing} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="gender"
                    label="性别"
                  >
                    <Select placeholder="请选择性别" disabled={!editing}>
                      <Option value="M">男</Option>
                      <Option value="F">女</Option>
                      <Option value="O">其他</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="age"
                    label="年龄"
                  >
                    <InputNumber 
                      placeholder="请输入年龄" 
                      min={1} 
                      max={150}
                      style={{ width: '100%' }}
                      disabled={!editing}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="height"
                    label="身高 (cm)"
                  >
                    <InputNumber 
                      placeholder="请输入身高" 
                      min={50} 
                      max={250}
                      precision={1}
                      style={{ width: '100%' }}
                      disabled={!editing}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="weight"
                    label="体重 (kg)"
                  >
                    <InputNumber 
                      placeholder="请输入体重" 
                      min={20} 
                      max={300}
                      precision={1}
                      style={{ width: '100%' }}
                      disabled={!editing}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {editing && (
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    保存修改
                  </Button>
                </Form.Item>
              )}
            </Form>
          </Card>

          <Card title="健康小贴士" style={{ marginTop: 16 }}>
            <div style={{ lineHeight: 1.8 }}>
              <p><strong>BMI指数说明：</strong></p>
              <ul style={{ paddingLeft: 24 }}>
                <li>BMI < 18.5：体重偏轻，建议适当增加营养摄入</li>
                <li>18.5 ≤ BMI < 24：体重正常，继续保持</li>
                <li>24 ≤ BMI < 28：体重偏重，建议增加运动</li>
                <li>BMI ≥ 28：肥胖，建议咨询医生制定健康计划</li>
              </ul>
              <p style={{ marginTop: 16 }}><strong>建议：</strong>成年人每天应保持7-9小时的睡眠时间，每周进行至少150分钟的中等强度有氧运动，每天步数建议达到7000步以上。</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Profile
