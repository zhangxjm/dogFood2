<template>
  <div class="dashboard">
    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <div class="card stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409EFF;">
              <i class="el-icon-cpu"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalDevices }}</div>
              <div class="stat-label">设备总数</div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67c23a;">
              <i class="el-icon-check-circle"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.onlineDevices }}</div>
              <div class="stat-label">在线设备</div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #909399;">
              <i class="el-icon-remove-circle"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.offlineDevices }}</div>
              <div class="stat-label">离线设备</div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f56c6c;">
              <i class="el-icon-warning"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ alarmUnreadCount }}</div>
              <div class="stat-label">未读告警</div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card">
          <h4 class="card-title">设备状态列表</h4>
          <el-table :data="deviceStatusList" stripe border style="width: 100%">
            <el-table-column prop="deviceId" label="设备ID" min-width="150"></el-table-column>
            <el-table-column prop="deviceName" label="设备名称" min-width="120"></el-table-column>
            <el-table-column prop="deviceType" label="设备类型" width="100"></el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template slot-scope="scope">
                <el-tag :type="scope.row.status === 'online' ? 'success' : 'info'">
                  {{ scope.row.status === 'online' ? '在线' : '离线' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastOnlineTime" label="最后在线时间" min-width="180"></el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card">
          <h4 class="card-title">设备状态分布</h4>
          <div id="status-chart" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import axios from 'axios'
import * as echarts from 'echarts'

export default {
  name: 'Dashboard',
  data() {
    return {
      stats: {
        totalDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0
      },
      deviceStatusList: [],
      alarmUnreadCount: 0,
      statusChart: null
    }
  },
  created() {
    this.loadData()
  },
  mounted() {
    this.initChart()
  },
  methods: {
    async loadData() {
      try {
        const [statsRes, devicesRes, alarmRes] = await Promise.all([
          axios.get('/api/monitor/dashboard/stats'),
          axios.get('/api/monitor/dashboard/devices'),
          axios.get('/api/alarm/logs/unread/count')
        ])
        
        if (statsRes.data.code === 200) {
          this.stats = statsRes.data.data
        }
        if (devicesRes.data.code === 200) {
          this.deviceStatusList = devicesRes.data.data
        }
        if (alarmRes.data.code === 200) {
          this.alarmUnreadCount = alarmRes.data.data.count
        }
        
        this.updateChart()
      } catch (e) {
        console.error('加载数据失败', e)
        this.$message.error('加载数据失败')
      }
    },
    initChart() {
      const chartDom = document.getElementById('status-chart')
      if (chartDom) {
        this.statusChart = echarts.init(chartDom)
      }
    },
    updateChart() {
      if (!this.statusChart) return
      
      const option = {
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: '设备状态',
            type: 'pie',
            radius: '60%',
            data: [
              { value: this.stats.onlineDevices, name: '在线设备', itemStyle: { color: '#67c23a' } },
              { value: this.stats.offlineDevices, name: '离线设备', itemStyle: { color: '#909399' } }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
      
      this.statusChart.setOption(option)
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard {
  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
    }
    
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      i {
        font-size: 32px;
        color: #fff;
      }
    }
    
    .stat-info {
      margin-left: 20px;
      
      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #303133;
      }
      
      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-top: 5px;
      }
    }
  }
  
  .card-title {
    margin: 0 0 20px 0;
    font-size: 16px;
    color: #303133;
  }
}
</style>
