import React, { useState, useEffect } from 'react'
import { Card, Tabs, Button, Modal, Form, Input, InputNumber, Select, DatePicker, message, List, Tag, Progress, Empty, Popconfirm, Statistic, Row, Col } from 'antd'
import { PlusOutlined, BellOutlined, TargetOutlined, CheckOutlined, PauseOutlined, ClockCircleOutlined, CoffeeOutlined, MedicineBoxOutlined, ThunderboltOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { goalApi } from '../services/api'

const { Option } = Select

function Goals() {
  const [activeTab, setActiveTab] = useState('goals')
  const [goals, setGoals] = useState([])
  const [reminders, setReminders] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [goalModalVisible, setGoalModalVisible] = useState(false)
  const [reminderModalVisible, setReminderModalVisible] = useState(false)
  const [goalForm] = Form.useForm()
  const [reminderForm] = Form.useForm()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [goalsRes, remindersRes, notificationsRes] = await Promise.all([
        goalApi.getActiveGoals(),
        goalApi.getTodayReminders(),
        goalApi.getUnreadNotifications(),
      ])
      
      setGoals(goalsRes.data || [])
      setReminders(remindersRes.data || [])
      setNotifications(notificationsRes.data?.notifications || [])
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async (values) => {
    try {
      await goalApi.createGoal({
        goal_type: values.goal_type,
        target_value: values.target_value,
        unit: values.unit,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD'),
      })
      message.success('目标创建成功')
      setGoalModalVisible(false)
      goalForm.resetFields()
      fetchData()
    } catch (error) {
      console.error('创建目标失败:', error)
      message.error('目标创建失败')
    }
  }

  const handleCreateReminder = async (values) => {
    try {
      await goalApi.createReminder({
        reminder_type: values.reminder_type,
        title: values.title,
        description: values.description,
        reminder_time: values.reminder_time.format('HH:mm'),
        repeat: values.repeat,
        active_days: values.active_days || [],
      })
      message.success('提醒创建成功')
      setReminderModalVisible(false)
      reminderForm.resetFields()
      fetchData()
    } catch (error) {
      console.error('创建提醒失败:', error)
      message.error('提醒创建失败')
    }
  }

  const handleToggleGoal = async (id, isActive) => {
    try {
      if (isActive) {
        await goalApi.deactivateGoal(id)
      } else {
        await goalApi.activateGoal(id)
      }
      message.success(isActive ? '目标已暂停' : '目标已激活')
      fetchData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleToggleReminder = async (id) => {
    try {
      await goalApi.toggleReminder(id)
      message.success('提醒状态已更新')
      fetchData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleMarkNotificationRead = async (id) => {
    try {
      await goalApi.markNotificationRead(id)
      message.success('已标记为已读')
      fetchData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleCreateDefaultSedentary = async () => {
    try {
      await goalApi.createDefaultSedentary()
      message.success('久坐提醒已创建')
      fetchData()
    } catch (error) {
      message.error(error.response?.data?.message || '创建失败')
    }
  }

  const handleCreateDefaultWater = async () => {
    try {
      await goalApi.createDefaultWater()
      message.success('饮水提醒已创建')
      fetchData()
    } catch (error) {
      message.error(error.response?.data?.message || '创建失败')
    }
  }

  const getGoalTypeText = (type) => {
    const map = {
      'STEPS': '步数目标',
      'CALORIES': '卡路里目标',
      'DISTANCE': '距离目标',
      'SLEEP': '睡眠目标',
      'HEART_RATE': '心率目标',
    }
    return map[type] || type
  }

  const getReminderTypeIcon = (type) => {
    const map = {
      'SEDENTARY': <CoffeeOutlined />,
      'WATER': <ThunderboltOutlined />,
      'MEDICATION': <MedicineBoxOutlined />,
      'EXERCISE': <ThunderboltOutlined />,
      'SLEEP': <ClockCircleOutlined />,
      'CUSTOM': <BellOutlined />,
    }
    return map[type] || <BellOutlined />
  }

  const getReminderTypeColor = (type) => {
    const map = {
      'SEDENTARY': '#fa8c16',
      'WATER': '#1890ff',
      'MEDICATION': '#722ed1',
      'EXERCISE': '#52c41a',
      'SLEEP': '#722ed1',
      'CUSTOM': '#13c2c2',
    }
    return map[type] || '#1890ff'
  }

  const tabItems = [
    {
      key: 'goals',
      label: '健康目标',
      icon: <TargetOutlined />,
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3>我的目标</h3>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setGoalModalVisible(true)}>
              创建目标
            </Button>
          </div>

          {goals.length > 0 ? (
            <Row gutter={[16, 16]}>
              {goals.map(goal => (
                <Col xs={24} md={12} key={goal.id}>
                  <Card
                    title={getGoalTypeText(goal.goal_type)}
                    extra={
                      <Button
                        icon={goal.is_active ? <PauseOutlined /> : <CheckOutlined />}
                        onClick={() => handleToggleGoal(goal.id, goal.is_active)}
                      >
                        {goal.is_active ? '暂停' : '激活'}
                      </Button>
                    }
                  >
                    <div className="progress-goal">
                      <div className="goal-header">
                        <span className="goal-title">{getGoalTypeText(goal.goal_type)}</span>
                        <span className="goal-percentage">{goal.progress_percentage}%</span>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <span>当前: {goal.current_value} {goal.unit}</span>
                        <span style={{ marginLeft: 16 }}>目标: {goal.target_value} {goal.unit}</span>
                      </div>
                      <Progress 
                        percent={goal.progress_percentage} 
                        status={goal.is_achieved ? 'success' : 'active'}
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068',
                        }}
                      />
                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', color: '#999', fontSize: 12 }}>
                        <span>开始: {goal.start_date}</span>
                        <span>结束: {goal.end_date || '未设置'}</span>
                      </div>
                      {goal.is_achieved && (
                        <Tag color="success" style={{ marginTop: 8 }}>
                          目标已达成！
                        </Tag>
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Card>
              <Empty 
                description="暂无进行中的目标"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setGoalModalVisible(true)}>
                  创建第一个目标
                </Button>
              </Empty>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'reminders',
      label: '提醒设置',
      icon: <BellOutlined />,
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3>今日提醒</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button onClick={handleCreateDefaultSedentary}>
                添加久坐提醒
              </Button>
              <Button onClick={handleCreateDefaultWater}>
                添加饮水提醒
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setReminderModalVisible(true)}>
                自定义提醒
              </Button>
            </div>
          </div>

          {reminders.length > 0 ? (
            <List
              grid={{ gutter: 16, column: 1, md: 2 }}
              dataSource={reminders}
              renderItem={(reminder) => (
                <List.Item>
                  <Card>
                    <div className="reminder-item">
                      <div 
                        className="reminder-icon"
                        style={{ backgroundColor: `${getReminderTypeColor(reminder.reminder_type)}20` }}
                      >
                        <span style={{ color: getReminderTypeColor(reminder.reminder_type), fontSize: 20 }}>
                          {getReminderTypeIcon(reminder.reminder_type)}
                        </span>
                      </div>
                      <div className="reminder-content">
                        <div className="reminder-title">
                          {reminder.title}
                          <Tag 
                            color={reminder.is_active ? 'success' : 'default'} 
                            style={{ marginLeft: 8 }}
                          >
                            {reminder.is_active ? '开启' : '关闭'}
                          </Tag>
                        </div>
                        <div className="reminder-time">
                          {reminder.reminder_time} · {reminder.repeat === 'DAILY' ? '每天' : 
                           reminder.repeat === 'WEEKDAYS' ? '工作日' : 
                           reminder.repeat === 'WEEKENDS' ? '周末' : 
                           reminder.repeat === 'WEEKLY' ? '每周' : '一次'}
                        </div>
                        {reminder.description && (
                          <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                            {reminder.description}
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={() => handleToggleReminder(reminder.id)}
                        type={reminder.is_active ? 'default' : 'primary'}
                      >
                        {reminder.is_active ? '关闭' : '开启'}
                      </Button>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <Card>
              <Empty 
                description="暂无今日提醒"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'notifications',
      label: '消息通知',
      icon: <BellOutlined />,
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3>消息通知</h3>
            {notifications.length > 0 && (
              <Button
                onClick={async () => {
                  await goalApi.markAllNotificationsRead()
                  message.success('已全部标记为已读')
                  fetchData()
                }}
              >
                全部已读
              </Button>
            )}
          </div>

          {notifications.length > 0 ? (
            <List
              dataSource={notifications}
              renderItem={(notification) => (
                <List.Item
                  actions={[
                    !notification.is_read && (
                      <Button 
                        type="link" 
                        onClick={() => handleMarkNotificationRead(notification.id)}
                      >
                        标记已读
                      </Button>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: notification.notification_type === 'GOAL_ACHIEVED' ? '#52c41a' :
                                   notification.notification_type === 'HEALTH_ALERT' ? '#ff4d4f' : '#1890ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 18
                      }}>
                        {notification.notification_type === 'GOAL_ACHIEVED' ? <CheckOutlined /> :
                         notification.notification_type === 'HEALTH_ALERT' ? <BellOutlined /> :
                         <BellOutlined />}
                      </div>
                    }
                    title={
                      <span>
                        {notification.title}
                        {!notification.is_read && (
                          <span style={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            background: '#ff4d4f',
                            display: 'inline-block',
                            marginLeft: 8
                          }} />
                        )}
                      </span>
                    }
                    description={
                      <div>
                        <p>{notification.message}</p>
                        <p style={{ color: '#999', fontSize: 12 }}>
                          {new Date(notification.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Card>
              <Empty 
                description="暂无通知消息"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>目标与提醒</h2>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <Modal
        title="创建健康目标"
        open={goalModalVisible}
        onCancel={() => setGoalModalVisible(false)}
        footer={null}
      >
        <Form
          form={goalForm}
          layout="vertical"
          onFinish={handleCreateGoal}
          initialValues={{
            start_date: dayjs(),
            goal_type: 'STEPS',
          }}
        >
          <Form.Item
            name="goal_type"
            label="目标类型"
            rules={[{ required: true, message: '请选择目标类型' }]}
          >
            <Select>
              <Option value="STEPS">步数目标</Option>
              <Option value="CALORIES">卡路里目标</Option>
              <Option value="DISTANCE">距离目标</Option>
              <Option value="SLEEP">睡眠目标</Option>
              <Option value="HEART_RATE">心率目标</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="target_value"
            label="目标值"
            rules={[{ required: true, message: '请输入目标值' }]}
          >
            <InputNumber placeholder="请输入目标值" min={0} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="unit"
            label="单位"
            rules={[{ required: true, message: '请输入单位' }]}
          >
            <Input placeholder="例如：步、kcal、米、分钟、bpm" />
          </Form.Item>
          
          <Form.Item
            name="start_date"
            label="开始日期"
            rules={[{ required: true, message: '请选择开始日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="end_date"
            label="结束日期 (可选)"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建目标
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="创建提醒"
        open={reminderModalVisible}
        onCancel={() => setReminderModalVisible(false)}
        footer={null}
      >
        <Form
          form={reminderForm}
          layout="vertical"
          onFinish={handleCreateReminder}
          initialValues={{
            reminder_type: 'CUSTOM',
            repeat: 'DAILY',
          }}
        >
          <Form.Item
            name="reminder_type"
            label="提醒类型"
            rules={[{ required: true, message: '请选择提醒类型' }]}
          >
            <Select>
              <Option value="SEDENTARY">久坐提醒</Option>
              <Option value="WATER">饮水提醒</Option>
              <Option value="MEDICATION">服药提醒</Option>
              <Option value="EXERCISE">运动提醒</Option>
              <Option value="SLEEP">睡眠提醒</Option>
              <Option value="CUSTOM">自定义提醒</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="title"
            label="提醒标题"
            rules={[{ required: true, message: '请输入提醒标题' }]}
          >
            <Input placeholder="例如：记得喝水" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="提醒描述 (可选)"
          >
            <Input.TextArea placeholder="详细描述" rows={3} />
          </Form.Item>
          
          <Form.Item
            name="reminder_time"
            label="提醒时间"
            rules={[{ required: true, message: '请选择提醒时间' }]}
          >
            <DatePicker.TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
          
          <Form.Item
            name="repeat"
            label="重复频率"
            rules={[{ required: true, message: '请选择重复频率' }]}
          >
            <Select>
              <Option value="ONCE">只一次</Option>
              <Option value="DAILY">每天</Option>
              <Option value="WEEKDAYS">工作日</Option>
              <Option value="WEEKENDS">周末</Option>
              <Option value="WEEKLY">每周</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建提醒
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Goals
