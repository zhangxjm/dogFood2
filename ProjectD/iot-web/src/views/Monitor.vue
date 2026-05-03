<template>
  <div class="monitor-page">
    <div class="card mb-20">
      <div class="flex-between mb-20">
        <h3>数据监控</h3>
        <el-button type="primary" @click="refreshData" :loading="loading">
          <i class="el-icon-refresh"></i> 刷新
        </el-button>
      </div>
      <el-form :inline="true" class="mb-20">
        <el-form-item label="选择设备">
          <el-select v-model="selectedDeviceId" placeholder="请选择设备" @change="onDeviceChange" style="width: 200px;">
            <el-option v-for="device in deviceList" :key="device.deviceId" :label="device.deviceName" :value="device.deviceId"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="选择指标">
          <el-select v-model="selectedMetric" placeholder="请选择指标" multiple style="width: 300px;">
            <el-option v-for="metric in metrics" :key="metric" :label="metric" :value="metric"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="yyyy-MM-dd HH:mm:ss"
            style="width: 350px;">
          </el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadChartData">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="selectedDeviceId" class="card mb-20">
      <h4 class="card-title mb-20">实时数据</h4>
      <el-row :gutter="20">
        <el-col :span="6" v-for="(value, key) in latestMetrics" :key="key">
          <div class="metric-card">
            <div class="metric-name">{{ key }}</div>
            <div class="metric-value">{{ value }}</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div v-if="selectedDeviceId && selectedMetric.length > 0" class="card">
      <h4 class="card-title mb-20">趋势图表</h4>
      <div id="monitor-chart" class="chart-container"></div>
    </div>

    <div v-else-if="!selectedDeviceId" class="card flex-center" style="height: 200px;">
      <el-empty description="请先选择设备"></el-empty>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

export default {
  name: 'Monitor',
  data() {
    return {
      loading: false,
      deviceList: [],
      selectedDeviceId: '',
      metrics: [],
      selectedMetric: [],
      timeRange: [],
      latestMetrics: {},
      chartData: [],
      monitorChart: null
    }
  },
  created() {
    this.loadDeviceList()
  },
  mounted() {
    const chartDom = document.getElementById('monitor-chart')
    if (chartDom) {
      this.monitorChart = echarts.init(chartDom)
    }
  },
  methods: {
    async loadDeviceList() {
      try {
        const res = await axios.get('/api/device/list')
        if (res.data.code === 200) {
          this.deviceList = res.data.data
        }
      } catch (e) {
        console.error('加载设备列表失败', e)
      }
    },
    async onDeviceChange(deviceId) {
      this.selectedMetric = []
      this.latestMetrics = {}
      this.metrics = []
      
      try {
        const [metricsRes, latestRes] = await Promise.all([
          axios.get(`/api/monitor/telemetry/${deviceId}/metrics`),
          axios.get(`/api/monitor/telemetry/${deviceId}/latest-values`)
        ])
        
        if (metricsRes.data.code === 200) {
          this.metrics = metricsRes.data.data
        }
        if (latestRes.data.code === 200) {
          this.latestMetrics = latestRes.data.data
        }
      } catch (e) {
        console.error('加载设备数据失败', e)
      }
    },
    refreshData() {
      if (this.selectedDeviceId) {
        this.onDeviceChange(this.selectedDeviceId)
      }
      if (this.selectedDeviceId && this.selectedMetric.length > 0) {
        this.loadChartData()
      }
    },
    async loadChartData() {
      if (!this.selectedDeviceId || this.selectedMetric.length === 0) {
        this.$message.warning('请选择设备和指标')
        return
      }
      
      this.loading = true
      try {
        const allData = {}
        
        for (const metric of this.selectedMetric) {
          let params = {}
          if (this.timeRange && this.timeRange.length === 2) {
            params.startTime = this.timeRange[0]
            params.endTime = this.timeRange[1]
          } else {
            const endTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
            const startTime = dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss')
            params.startTime = startTime
            params.endTime = endTime
          }
          
          const res = await axios.get(`/api/monitor/telemetry/${this.selectedDeviceId}/${metric}/range`, { params })
          if (res.data.code === 200) {
            allData[metric] = res.data.data
          }
        }
        
        this.renderChart(allData)
      } catch (e) {
        console.error('加载图表数据失败', e)
        this.$message.error('加载图表数据失败')
      } finally {
        this.loading = false
      }
    },
    renderChart(allData) {
      if (!this.monitorChart) return
      
      const colors = ['#409EFF', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#00d4ff']
      let colorIndex = 0
      
      const series = []
      let allTimestamps = new Set()
      
      for (const metric in allData) {
        const data = allData[metric]
        data.forEach(item => {
          allTimestamps.add(item.timestamp)
        })
      }
      
      const sortedTimestamps = Array.from(allTimestamps).sort()
      
      for (const metric in allData) {
        const data = allData[metric]
        const color = colors[colorIndex++ % colors.length]
        
        const dataMap = {}
        data.forEach(item => {
          dataMap[item.timestamp] = item.value
        })
        
        const seriesData = sortedTimestamps.map(timestamp => {
          return dataMap[timestamp] != null ? dataMap[timestamp] : null
        })
        
        series.push({
          name: metric,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color },
          itemStyle: { color },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color + '40' },
              { offset: 1, color: color + '10' }
            ])
          },
          data: seriesData
        })
      }
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' }
        },
        legend: {
          data: Object.keys(allData)
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: sortedTimestamps.map(t => dayjs(t).format('MM-DD HH:mm:ss'))
        },
        yAxis: {
          type: 'value'
        },
        series
      }
      
      this.monitorChart.setOption(option, true)
    }
  }
}
</script>

<style lang="scss" scoped>
.monitor-page {
  .card-title {
    margin: 0;
    font-size: 16px;
    color: #303133;
  }
  
  .metric-card {
    background: #f5f7fa;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    
    .metric-name {
      font-size: 14px;
      color: #909399;
      margin-bottom: 10px;
    }
    
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      color: #409EFF;
    }
  }
}
</style>
