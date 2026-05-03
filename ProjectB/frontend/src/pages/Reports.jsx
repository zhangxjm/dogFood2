import React, { useState, useEffect } from 'react'
import { Card, Button, Select, DatePicker, Descriptions, Tag, Empty, message, Spin, Row, Col, Statistic } from 'antd'
import { FileTextOutlined, ReloadOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { reportApi } from '../services/api'

const { RangePicker } = DatePicker

function Reports() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [latestReport, setLatestReport] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [reportType, setReportType] = useState('DAILY')
  const [reportDate, setReportDate] = useState(dayjs())

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const [reportsRes, latestRes] = await Promise.all([
        reportApi.getReports(),
        reportApi.getLatestReport().catch(() => null),
      ])
      
      setReports(reportsRes.data || [])
      if (latestRes?.data) {
        setLatestReport(latestRes.data)
      }
    } catch (error) {
      console.error('获取报告失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    setGenerating(true)
    try {
      const response = await reportApi.generateReport(reportType, reportDate.format('YYYY-MM-DD'))
      message.success('报告生成成功')
      setLatestReport(response.data)
      fetchReports()
    } catch (error) {
      console.error('生成报告失败:', error)
      message.error('报告生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const getHealthScoreColor = (score) => {
    if (score >= 80) return '#52c41a'
    if (score >= 60) return '#faad14'
    return '#ff4d4f'
  }

  const getReportTypeText = (type) => {
    const map = {
      'DAILY': '日报',
      'WEEKLY': '周报',
      'MONTHLY': '月报',
    }
    return map[type] || type
  }

  const getStatusTag = (status) => {
    const map = {
      'COMPLETED': { color: 'success', text: '已完成' },
      'GENERATING': { color: 'processing', text: '生成中' },
      'PENDING': { color: 'default', text: '待生成' },
      'FAILED': { color: 'error', text: '生成失败' },
    }
    const info = map[status] || { color: 'default', text: status }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const getReportChartOption = () => {
    if (!latestReport?.heart_rate_summary?.available) return null
    
    const hr = latestReport.heart_rate_summary
    return {
      title: { text: '心率分布', left: 'center' },
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          data: [
            { value: hr.avg, name: '平均心率', itemStyle: { color: '#1890ff' } },
            { value: hr.max - hr.avg || 0, name: '波动范围', itemStyle: { color: '#f0f0f0' } },
          ],
          label: { show: false },
        },
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>健康报告</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Select
            value={reportType}
            onChange={setReportType}
            style={{ width: 120 }}
            options={[
              { value: 'DAILY', label: '日报' },
              { value: 'WEEKLY', label: '周报' },
              { value: 'MONTHLY', label: '月报' },
            ]}
          />
          <DatePicker
            value={reportDate}
            onChange={setReportDate}
            style={{ width: 200 }}
          />
          <Button 
            type="primary" 
            icon={<FileTextOutlined />} 
            onClick={generateReport}
            loading={generating}
          >
            生成报告
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchReports}>
            刷新
          </Button>
        </div>
      </div>

      {latestReport ? (
        <div>
          <Card className="report-card" title="最新健康报告">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center', padding: 24 }}>
                <div 
                  className="report-score"
                  style={{ color: getHealthScoreColor(latestReport.health_score) }}
                >
                  {latestReport.health_score}
                </div>
                <div className="report-score-label">健康评分</div>
                <div style={{ marginTop: 16 }}>
                  <Tag color={getHealthScoreColor(latestReport.health_score) === '#52c41a' ? 'success' : 
                       getHealthScoreColor(latestReport.health_score) === '#faad14' ? 'warning' : 'error'}>
                    {latestReport.health_score >= 80 ? '优秀' : 
                     latestReport.health_score >= 60 ? '良好' : '需改善'}
                  </Tag>
                </div>
              </div>
            </Col>
            
            <Col xs={24} md={8}>
              <Descriptions title="报告信息" column={1} size="small">
                <Descriptions.Item label="报告类型">
                  {getReportTypeText(latestReport.report_type)}
                </Descriptions.Item>
                <Descriptions.Item label="报告日期">
                  {latestReport.report_date}
                </Descriptions.Item>
                <Descriptions.Item label="统计周期">
                  {latestReport.start_date} 至 {latestReport.end_date}
                </Descriptions.Item>
                <Descriptions.Item label="生成时间">
                  {latestReport.generated_at ? 
                    new Date(latestReport.generated_at).toLocaleString('zh-CN') : '未生成'}
                </Descriptions.Item>
              </Descriptions>
            </Col>
            
            <Col xs={24} md={8}>
              {latestReport.heart_rate_summary?.available && (
                <ReactECharts option={getReportChartOption()} style={{ height: 200 }} />
              )}
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={8}>
            <Card title="心率统计">
              {latestReport.heart_rate_summary?.available ? (
                <>
                  <Statistic 
                    title="平均心率" 
                    value={latestReport.heart_rate_summary.avg} 
                    suffix="bpm"
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                    <span>最高: {latestReport.heart_rate_summary.max} bpm</span>
                    <span>最低: {latestReport.heart_rate_summary.min} bpm</span>
                  </div>
                  <div style={{ marginTop: 8, color: '#666' }}>
                    共 {latestReport.heart_rate_summary.count} 条记录
                  </div>
                  {latestReport.heart_rate_summary.high_count > 0 && (
                    <div style={{ marginTop: 8, color: '#ff4d4f' }}>
                      心率偏高记录: {latestReport.heart_rate_summary.high_count} 次
                    </div>
                  )}
                  {latestReport.heart_rate_summary.low_count > 0 && (
                    <div style={{ marginTop: 8, color: '#fa8c16' }}>
                      心率偏低记录: {latestReport.heart_rate_summary.low_count} 次
                    </div>
                  )}
                </>
              ) : (
                <Empty description="暂无心率数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card title="步数统计">
              {latestReport.step_summary?.available ? (
                <>
                  <Statistic 
                    title="总步数" 
                    value={latestReport.step_summary.total_steps} 
                    suffix="步"
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <div style={{ marginTop: 16 }}>
                    <div>日均步数: {latestReport.step_summary.avg_daily_steps} 步</div>
                    <div style={{ marginTop: 8 }}>
                      距离: {(latestReport.step_summary.total_distance / 1000).toFixed(2)} km
                    </div>
                    <div style={{ marginTop: 8 }}>
                      消耗卡路里: {latestReport.step_summary.total_calories} kcal
                    </div>
                    <div style={{ marginTop: 8, color: '#666' }}>
                      活跃天数: {latestReport.step_summary.active_days} 天
                    </div>
                  </div>
                </>
              ) : (
                <Empty description="暂无步数数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card title="睡眠统计">
              {latestReport.sleep_summary?.available ? (
                <>
                  <Statistic 
                    title="平均睡眠" 
                    value={latestReport.sleep_summary.avg_total_sleep_minutes / 60} 
                    suffix="小时"
                    precision={1}
                    valueStyle={{ color: '#722ed1' }}
                  />
                  <div style={{ marginTop: 16 }}>
                    <div>深睡: {latestReport.sleep_summary.avg_deep_sleep_minutes} 分钟</div>
                    <div style={{ marginTop: 8 }}>
                      浅睡: {latestReport.sleep_summary.avg_light_sleep_minutes} 分钟
                    </div>
                    <div style={{ marginTop: 8 }}>
                      REM: {latestReport.sleep_summary.avg_rem_sleep_minutes} 分钟
                    </div>
                    <div style={{ marginTop: 8 }}>
                      清醒: {latestReport.sleep_summary.avg_awake_minutes} 分钟
                    </div>
                    {latestReport.sleep_summary.avg_deep_sleep_ratio && (
                      <div style={{ marginTop: 8, color: '#666' }}>
                        深睡占比: {latestReport.sleep_summary.avg_deep_sleep_ratio}%
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Empty description="暂无睡眠数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Card title="健康建议">
              {latestReport.suggestions ? (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {latestReport.suggestions}
                </div>
              ) : (
                <Empty description="暂无建议" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="健康警告">
              {latestReport.warnings ? (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#ff4d4f' }}>
                  {latestReport.warnings}
                </div>
              ) : (
                <div style={{ color: '#52c41a', textAlign: 'center', padding: 24 }}>
                  暂无健康警告，继续保持良好的生活习惯。
                </div>
              )}
            </Card>
          </Col>
        </Row>
        </div>
      ) : (
        <Card>
          <Empty 
          description="暂无健康报告，请先生成一份报告"
        >
          <Button type="primary" icon={<FileTextOutlined />} onClick={generateReport} loading={generating}>
            生成报告
          </Button>
        </Empty>
        </Card>
      )}

      {reports.length > 0 && (
          <Card title="历史报告" style={{ marginTop: 24 }}>
            {reports.map(report => (
              <Card.Grid key={report.id} style={{ marginBottom: 8, padding: 12, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', marginRight: 12 }}>
                      {getReportTypeText(report.report_type)}
                    </span>
                    <span style={{ color: '#666' }}>
                      {report.report_date}
                    </span>
                    {getStatusTag(report.status)}
                  </div>
                  <div>
                    <span style={{ 
                      fontSize: 24, 
                      fontWeight: 'bold', 
                      color: getHealthScoreColor(report.health_score)
                    }}>
                      {report.health_score}
                    </span>
                    <span style={{ color: '#999', marginLeft: 4 }}>分</span>
                  </div>
                </div>
              </Card.Grid>
            ))}
          </Card>
        )}
    </div>
  )
}

export default Reports
