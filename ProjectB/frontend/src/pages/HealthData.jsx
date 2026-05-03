import React, { useState, useEffect } from 'react'
import { Card, Tabs, Select, DatePicker, Button, Form, Input, InputNumber, message, Row, Col, Statistic, Empty } from 'antd'
import { UploadOutlined, HeartOutlined, StepForwardOutlined, MoonOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { healthDataApi } from '../services/api'

const { RangePicker } = DatePicker
const { TextArea } = Input

function HealthData() {
  const [activeTab, setActiveTab] = useState('heart-rate')
  const [heartRateData, setHeartRateData] = useState([])
  const [stepData, setStepData] = useState([])
  const [sleepData, setSleepData] = useState([])
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(7)
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [uploadForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [heartRateRes, stepRes, sleepRes] = await Promise.all([
        healthDataApi.getHeartRateDaily(days),
        healthDataApi.getStepDaily(days),
        healthDataApi.getSleepDaily(days),
      ])
      
      setHeartRateData(heartRateRes.data || [])
      setStepData(stepRes.data || [])
      setSleepData(sleepRes.data || [])
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [days])

  const getHeartRateChartOption = () => {
    const dates = heartRateData.map(item => item.date)
    const avgValues = heartRateData.map(item => item.mean)
    const minValues = heartRateData.map(item => item.min)
    const maxValues = heartRateData.map(item => item.max)
    
    return {
      title: { text: '心率趋势分析', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['平均心率', '最低心率', '最高心率'], bottom: 10 },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value', name: 'bpm' },
      series: [
        { name: '平均心率', type: 'line', data: avgValues, smooth: true, color: '#1890ff', lineStyle: { width: 3 } },
        { name: '最低心率', type: 'line', data: minValues, lineStyle: { type: 'dashed' }, color: '#52c41a' },
        { name: '最高心率', type: 'line', data: maxValues, lineStyle: { type: 'dashed' }, color: '#ff4d4f' },
      ],
    }
  }

  const getStepChartOption = () => {
    const dates = stepData.map(item => item.date)
    const steps = stepData.map(item => item.steps)
    const calories = stepData.map(item => item.calories)
    
    return {
      title: { text: '步数与卡路里', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['步数', '卡路里'], bottom: 10 },
      xAxis: { type: 'category', data: dates },
      yAxis: [
        { type: 'value', name: '步' },
        { type: 'value', name: 'kcal', position: 'right' }
      ],
      series: [
        { name: '步数', type: 'bar', data: steps, itemStyle: { color: '#1890ff' } },
        { name: '卡路里', type: 'line', data: calories, yAxisIndex: 1, color: '#fa8c16' },
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
      title: { text: '睡眠结构分析', left: 'center' },
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

  const handleUploadData = async (values) => {
    try {
      const data = {}
      
      if (values.heart_rate) {
        data.heart_rate = values.heart_rate.map(hr => ({
          recorded_at: dayjs(values.date).toISOString(),
          heart_rate: hr,
          confidence: 1.0
        }))
      }
      
      if (values.steps) {
        data.steps = [{
          recorded_at: dayjs(values.date).toISOString(),
          steps: values.steps,
          distance: values.distance || 0,
          calories: values.calories || 0
        }]
      }
      
      if (values.sleep_stage) {
        data.sleep = [{
          recorded_at: dayjs(values.date).toISOString(),
          stage: values.sleep_stage,
          duration: values.sleep_duration || 0,
          respiratory_rate: values.respiratory_rate || null
        }]
      }
      
      if (Object.keys(data).length > 0) {
        await healthDataApi.uploadBatchData(data)
        message.success('数据上传成功')
        uploadForm.resetFields()
        fetchData()
      } else {
        message.warning('请至少填写一种数据')
      }
    } catch (error) {
      console.error('上传数据失败:', error)
      message.error('数据上传失败')
    }
  }

  const tabItems = [
    {
      key: 'heart-rate',
      label: '心率数据',
      icon: <HeartOutlined />,
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="平均心率" 
                  value={heartRateData.length > 0 ? 
                    (heartRateData.reduce((sum, item) => sum + item.mean, 0) / heartRateData.length).toFixed(1) : '--'} 
                  suffix="bpm" 
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="最高心率" 
                  value={heartRateData.length > 0 ? 
                    Math.max(...heartRateData.map(item => item.max || 0)) : '--'} 
                  suffix="bpm"
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="最低心率" 
                  value={heartRateData.length > 0 ? 
                    Math.min(...heartRateData.map(item => item.min || 200)) : '--'} 
                  suffix="bpm"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="数据条数" 
                  value={heartRateData.length} 
                  suffix="天"
                />
              </Card>
            </Col>
          </Row>
          
          {heartRateData.length > 0 ? (
            <Card>
              <ReactECharts option={getHeartRateChartOption()} style={{ height: 400 }} />
            </Card>
          ) : (
            <Card>
              <Empty description="暂无心率数据" />
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'steps',
      label: '步数数据',
      icon: <StepForwardOutlined />,
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="总步数" 
                  value={stepData.reduce((sum, item) => sum + (item.steps || 0), 0)} 
                  suffix="步"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="日均步数" 
                  value={stepData.length > 0 ? 
                    Math.round(stepData.reduce((sum, item) => sum + (item.steps || 0), 0) / stepData.length) : 0} 
                  suffix="步"
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="总卡路里" 
                  value={stepData.reduce((sum, item) => sum + (item.calories || 0), 0).toFixed(0)} 
                  suffix="kcal"
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="总距离" 
                  value={(stepData.reduce((sum, item) => sum + (item.distance || 0), 0) / 1000).toFixed(2)} 
                  suffix="km"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
          
          {stepData.length > 0 ? (
            <Card>
              <ReactECharts option={getStepChartOption()} style={{ height: 400 }} />
            </Card>
          ) : (
            <Card>
              <Empty description="暂无步数数据" />
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'sleep',
      label: '睡眠数据',
      icon: <MoonOutlined />,
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="平均睡眠" 
                  value={sleepData.length > 0 ? 
                    (sleepData.reduce((sum, item) => sum + (item.total || 0), 0) / sleepData.length / 60).toFixed(1) : '--'} 
                  suffix="小时"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="深睡占比" 
                  value={sleepData.length > 0 ? 
                    (sleepData.reduce((sum, item) => sum + (item.DEEP || 0), 0) / 
                     Math.max(1, sleepData.reduce((sum, item) => sum + (item.total || 0), 0)) * 100).toFixed(1) : 0} 
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="数据天数" 
                  value={sleepData.length} 
                  suffix="天"
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="清醒时间" 
                  value={sleepData.length > 0 ? 
                    (sleepData.reduce((sum, item) => sum + (item.AWAKE || 0), 0) / sleepData.length).toFixed(0) : 0} 
                  suffix="分钟/天"
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>
          
          {sleepData.length > 0 ? (
            <Card>
              <ReactECharts option={getSleepChartOption()} style={{ height: 400 }} />
            </Card>
          ) : (
            <Card>
              <Empty description="暂无睡眠数据" />
            </Card>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>健康数据</h2>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Select
            value={days}
            onChange={setDays}
            style={{ width: 120 }}
            options={[
              { value: 7, label: '最近7天' },
              { value: 14, label: '最近14天' },
              { value: 30, label: '最近30天' },
            ]}
          />
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)}>
            手动上传数据
          </Button>
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <Modal
        title="手动上传健康数据"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={uploadForm}
          layout="vertical"
          onFinish={handleUploadData}
          initialValues={{ date: dayjs() }}
        >
          <Form.Item
            name="date"
            label="数据日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Card size="small" title="心率数据" style={{ marginBottom: 16 }}>
            <Form.List name="heart_rate">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <Form.Item
                        {...restField}
                        name={[name]}
                        rules={[{ required: true, message: '请输入心率' }]}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <InputNumber
                          placeholder="心率 (bpm)"
                          min={30}
                          max={200}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                      <Button danger onClick={() => remove(name)}>删除</Button>
                    </div>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block>
                      + 添加心率数据
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Card>

          <Card size="small" title="步数数据" style={{ marginBottom: 16 }}>
            <Form.Item name="steps" label="步数">
              <InputNumber placeholder="步数" min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="distance" label="距离 (米)">
              <InputNumber placeholder="距离" min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="calories" label="卡路里 (kcal)">
              <InputNumber placeholder="卡路里" min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Card>

          <Card size="small" title="睡眠数据">
            <Form.Item name="sleep_stage" label="睡眠阶段">
              <Select placeholder="选择睡眠阶段">
                <Select.Option value="AWAKE">清醒</Select.Option>
                <Select.Option value="LIGHT">浅睡</Select.Option>
                <Select.Option value="DEEP">深睡</Select.Option>
                <Select.Option value="REM">REM</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="sleep_duration" label="持续时间 (分钟)">
              <InputNumber placeholder="持续时间" min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="respiratory_rate" label="呼吸频率">
              <InputNumber placeholder="呼吸频率" min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Card>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" block>
              上传数据
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default HealthData
