import React from 'react'
import { Layout, Menu, Dropdown, Avatar, Badge } from 'antd'
import { 
  DashboardOutlined, 
  MobileOutlined, 
  LineChartOutlined,
  FileTextOutlined,
  TargetOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { goalApi } from '../services/api'

const { Header, Sider, Content } = Layout

function MainLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [collapsed, setCollapsed] = React.useState(false)

  React.useEffect(() => {
    const fetchUnread = async () => {
      try {
        const response = await goalApi.getUnreadNotifications()
        setUnreadCount(response.data.count || 0)
      } catch (error) {
        console.error('获取未读通知失败:', error)
      }
    }
    fetchUnread()
  }, [])

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '数据看板',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '/devices',
      icon: <MobileOutlined />,
      label: '设备管理',
      onClick: () => navigate('/devices'),
    },
    {
      key: '/health-data',
      icon: <LineChartOutlined />,
      label: '健康数据',
      onClick: () => navigate('/health-data'),
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: '健康报告',
      onClick: () => navigate('/reports'),
    },
    {
      key: '/goals',
      icon: <TargetOutlined />,
      label: '目标与提醒',
      onClick: () => navigate('/goals'),
    },
  ]

  const userMenu = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  const selectedKey = location.pathname === '/' ? '/dashboard' : location.pathname

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 'bold',
          background: 'rgba(255, 255, 255, 0.1)'
        }}>
          {collapsed ? '健康' : '智慧健康平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={unreadCount} showZero>
              <BellOutlined style={{ fontSize: 20, color: '#666', cursor: 'pointer' }} onClick={() => navigate('/goals')} />
            </Badge>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
                  {user?.username?.charAt(0)?.toUpperCase()}
                </Avatar>
                <span style={{ color: '#333' }}>{user?.username || '用户'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: 24, borderRadius: 8, minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
