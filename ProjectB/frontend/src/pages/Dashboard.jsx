import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Spin, message } from 'antd'
import {
  HeartOutlined,
  FireOutlined,
  StepForwardOutlined,
  MoonOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { healthDataApi, goalApi } from '../services/api'

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [heartRateData, setHeartRateData] = useState([])
  const [stepData, setStepData] = useState([])
  const [sleepData, setSleepData] = useState([])
  const [activeGoals, setActiveGoals] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [dashboardRes, heartRateRes, stepRes, sleepRes, goalsRes] = await Promise.all([
          healthDataApi.getDashboard(7),
          healthDataApi.getHeartRateDaily(7),
          healthDataApi.getStepDaily(7),
          healthDataApi.getSleepDaily(7),
          goalApi.getActiveGoals(),
        ])
        
        setDashboardData(dashboardRes.data)
        setHeartRateData(heartRateRes.data || [])
        setStepData(stepRes.data || [])
        setSleepData(sleepRes.data || [])
        setActiveGoals(goalsRes.data || [])
      } catch (error) {
        console.error('获取数据失败:', error)
        message.error('获取数据失败')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const getHeartRateChartOption = () => {
    const dates = heartRateData.map(item => item.date)
    const avgValues = heartRateData.map(item => item.mean)
    const minValues = heartRateData.map(item => item.min)
    const maxValues = heartRateData.map(item => item.max)
    
    return {
      title: { text: '心率趋势', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['平均', '最低', '最高'], bottom: 10 },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value', name: 'bpm' },
      series: [
        { name: '平均', type: 'line', data: avgValues, smooth: true, color: '#1890ff' },
        { name: '最低', type: 'line', data: minValues, lineStyle: { type: 'dashed' }, color: '#52c41a' },
        { name: '最高', type: 'line', data: maxValues, lineStyle: { type: 'dashed' }, color: '#ff4d4f' },
      ],
    }
  }

  const getStepChartOption = () => {
    const dates = stepData.map(item => item.date)
    const steps = stepData.map(item => item.steps)
    
    return {
      title: { text: '每日步数', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value', name: '步' },
      series: [
        {
          name: '步数',
          type: 'bar',
          data: steps,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#1890ff' },
                { offset: 1, color: '#36cfc9' }
              ]
            }
          },
          markLine: {
            data: [{ type: 'average', name: '平均值' }],
            label: { formatter: '平均: {c}' }
          }
        }
      ],
    }
  }

  const getSleepChartOption = () => {
    const dates = sleepData.map(item => item.date)
    const deepSleep = sleepData.map(item => item.DEEP || 0)
    const lightSleep = sleepData.map(item => item.LIGHT || 0)
    const remSleep = sleepData.map(item => item.REM || 0)
    const awake = sleepData.map(item => item.AWAKE || 0)
    
    return {
      title: { text: '睡眠构成', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['深睡', '浅睡', 'REM', '清醒'], bottom: 10 },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value', name: '分钟' },
      series: [
        { name: '深睡', type: 'bar', stack: 'sleep', data: deepSleep, color: '#722ed1' },
        { name: '浅睡', type: 'bar', stack: 'sleep', data: lightSleep, color: '#1890ff' },
        { name: 'REM', type: 'bar', stack: 'sleep', data: remSleep, color: '#13c2c2' },
        { name: '清醒', type: 'bar', stack: 'sleep', data: awake, color: '#ff4d4f' },
      ],
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    )
  }

  const heartRateStats = dashboardData?.heart_rate || {}
  const stepStats = dashboardData?.steps || {}
  const sleepStats = dashboardData?.sleep || {}

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>数据看板</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="平均心率"
              value={heartRateStats.avg || '--'}
              suffix="bpm"
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<HeartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="总步数"
              value={stepStats.total || 0}
              suffix="步"
              valueStyle={{ color: '#1890ff' }}
              prefix={<StepForwardOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="消耗卡路里"
              value={stepStats.calories || 0}
              suffix="kcal"
              valueStyle={{ color: '#fa8c16' }}
              prefix={<FireOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="睡眠时长"
              value={sleepStats.total_duration ? Math.round(sleepStats.total_duration / 60) : 0}
              suffix="小时"
              valueStyle={{ color: '#722ed1' }}
              prefix={<MoonOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <ReactECharts option={getHeartRateChartOption()} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <ReactECharts option={getStepChartOption()} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="睡眠数据">
            {sleepData.length > 0 ? (
              <ReactECharts option={getSleepChartOption()} style={{ height: 300 }} />
            ) : (
              <div className="empty-state">
                <MoonOutlined />
                <h3>暂无睡眠数据</h3>
                <p>绑定设备后即可查看睡眠数据</p>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="目标进度">
            {activeGoals.length > 0 ? (
              activeGoals.map(goal => (
                <div key={goal.id} className="progress-goal">
                  <div className="goal-header">
                    <span className="goal-title">{goal.goal_type === 'STEPS' ? '步数目标' : goal.goal_type}</span>
                    <span className="goal-percentage">{goal.progress_percentage}%</span>
                  </div>
                  <div className="goal-detail" style={{ marginBottom: 8 }}>
                    <span>当前: {goal.current_value} {goal.unit}</span>
                    <span style={{ marginLeft: 16 }}>目标: {goal.target_value} {goal.unit}</span>
                  </div>
                  <div style={{ 
                    height: 8, 
                    background: '#f0f0f0', 
                    borderRadius: 4, 
                    overflow: 'hidden' 
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${Math.min(goal.progress_percentage, 100)}%`,
                      background: 'linear-gradient(90deg, #1890ff, #36cfc9)',
                      borderRadius: 4,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <h3>暂无进行中的目标</h3>
                <p>去目标与提醒页面创建您的第一个目标吧</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
