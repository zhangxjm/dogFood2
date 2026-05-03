import React, { useState } from 'react'
import { Form, Input, Button, Card, message, Tabs } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { authApi } from '../services/api'

function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const { setTokens, setUser } = useAuthStore()

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const response = await authApi.login(values.username, values.password)
      setTokens(response.data.access, response.data.refresh)
      
      const userResponse = await authApi.getCurrentUser()
      setUser(userResponse.data)
      
      message.success('登录成功')
      navigate('/dashboard')
    } catch (error) {
      message.error(error.response?.data?.detail || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values) => {
    if (values.password !== values.password2) {
      message.error('两次输入的密码不一致')
      return
    }
    
    setLoading(true)
    try {
      await authApi.register({
        username: values.username,
        email: values.email,
        password: values.password,
        password2: values.password2,
        phone: values.phone,
      })
      
      message.success('注册成功，请登录')
      setActiveTab('login')
    } catch (error) {
      const errors = error.response?.data
      if (errors) {
        Object.keys(errors).forEach(key => {
          message.error(`${key}: ${errors[key]}`)
        })
      } else {
        message.error('注册失败')
      }
    } finally {
      setLoading(false)
    }
  }

  const loginFormItems = [
    {
      name: 'username',
      rules: [{ required: true, message: '请输入用户名' }],
      element: <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />,
    },
    {
      name: 'password',
      rules: [{ required: true, message: '请输入密码' }],
      element: <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />,
    },
  ]

  const registerFormItems = [
    {
      name: 'username',
      rules: [{ required: true, message: '请输入用户名' }],
      element: <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />,
    },
    {
      name: 'email',
      rules: [
        { required: true, message: '请输入邮箱' },
        { type: 'email', message: '请输入有效的邮箱地址' }
      ],
      element: <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />,
    },
    {
      name: 'phone',
      element: <Input prefix={<PhoneOutlined />} placeholder="手机号(可选)" size="large" />,
    },
    {
      name: 'password',
      rules: [{ required: true, message: '请输入密码' }],
      element: <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />,
    },
    {
      name: 'password2',
      rules: [{ required: true, message: '请确认密码' }],
      element: <Input.Password prefix={<LockOutlined />} placeholder="确认密码" size="large" />,
    },
  ]

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form name="login" onFinish={handleLogin} layout="vertical" size="large">
          {loginFormItems.map(item => (
            <Form.Item key={item.name} name={item.name} rules={item.rules}>
              {item.element}
            </Form.Item>
          ))}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form name="register" onFinish={handleRegister} layout="vertical" size="large">
          {registerFormItems.map(item => (
            <Form.Item key={item.name} name={item.name} rules={item.rules}>
              {item.element}
            </Form.Item>
          ))}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              注册
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ]

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="logo">
          <h1>智慧健康监测平台</h1>
          <p>管理您的健康数据，享受健康生活</p>
        </div>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} centered />
      </Card>
    </div>
  )
}

export default Login
