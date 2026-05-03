<template>
  <div class="command-page">
    <div class="card mb-20">
      <h3 class="mb-20">指令下发</h3>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="单设备指令" name="single">
          <el-form :model="commandForm" :rules="commandRules" ref="commandFormRef" label-width="120px">
            <el-form-item label="目标设备" prop="deviceId">
              <el-select v-model="commandForm.deviceId" placeholder="请选择目标设备" filterable style="width: 300px;">
                <el-option v-for="device in deviceList" :key="device.deviceId" :label="`${device.deviceName} (${device.deviceId})`" :value="device.deviceId">
                  <span style="float: left">{{ device.deviceName }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    <el-tag :type="device.status === 'online' ? 'success' : 'info'" size="mini">
                      {{ device.status === 'online' ? '在线' : '离线' }}
                    </el-tag>
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="指令类型" prop="commandType">
              <el-select v-model="commandForm.commandType" placeholder="请选择指令类型" style="width: 300px;">
                <el-option label="重启设备" value="restart"></el-option>
                <el-option label="设置参数" value="set_param"></el-option>
                <el-option label="获取状态" value="get_status"></el-option>
                <el-option label="开启设备" value="turn_on"></el-option>
                <el-option label="关闭设备" value="turn_off"></el-option>
                <el-option label="自定义指令" value="custom"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="指令数据" prop="data">
              <el-input
                v-model="commandDataText"
                type="textarea"
                :rows="8"
                placeholder="请输入JSON格式的指令数据，例如：&#10;{&#10;  \"param1\": 100,&#10;  \"param2\": \"test\"&#10;}"
              ></el-input>
              <div class="form-tip">
                <el-button type="text" size="small" @click="formatJson">格式化JSON</el-button>
                <el-button type="text" size="small" @click="loadExample">加载示例</el-button>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="sendCommand" :loading="sending">发送指令</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="广播指令" name="broadcast">
          <el-alert title="广播指令将发送给所有在线设备，请谨慎操作" type="warning" :closable="false" show-icon class="mb-20"></el-alert>
          <el-form :model="broadcastForm" :rules="commandRules" ref="broadcastFormRef" label-width="120px">
            <el-form-item label="指令类型" prop="commandType">
              <el-select v-model="broadcastForm.commandType" placeholder="请选择指令类型" style="width: 300px;">
                <el-option label="重启设备" value="restart"></el-option>
                <el-option label="获取状态" value="get_status"></el-option>
                <el-option label="时间同步" value="sync_time"></el-option>
                <el-option label="自定义指令" value="custom"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="指令数据" prop="data">
              <el-input
                v-model="broadcastDataText"
                type="textarea"
                :rows="8"
                placeholder="请输入JSON格式的指令数据"
              ></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="danger" @click="sendBroadcastCommand" :loading="sending">发送广播指令</el-button>
              <el-button @click="resetBroadcastForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>

    <div class="card">
      <h3 class="mb-20">发送记录</h3>
      <el-table :data="commandHistory" stripe border>
        <el-table-column prop="commandId" label="指令ID" width="180"></el-table-column>
        <el-table-column prop="deviceId" label="设备ID" width="150"></el-table-column>
        <el-table-column prop="commandType" label="指令类型" width="120"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag type="success">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="发送时间" width="180"></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import dayjs from 'dayjs'

export default {
  name: 'Command',
  data() {
    return {
      activeTab: 'single',
      sending: false,
      deviceList: [],
      commandForm: {
        deviceId: '',
        commandType: '',
        data: {}
      },
      commandDataText: '',
      broadcastForm: {
        commandType: '',
        data: {}
      },
      broadcastDataText: '',
      commandRules: {
        deviceId: [
          { required: true, message: '请选择目标设备', trigger: 'change' }
        ],
        commandType: [
          { required: true, message: '请选择指令类型', trigger: 'change' }
        ]
      },
      commandHistory: []
    }
  },
  created() {
    this.loadDeviceList()
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
    async sendCommand() {
      this.$refs.commandFormRef.validate(async (valid) => {
        if (valid) {
          try {
            let data = {}
            if (this.commandDataText.trim()) {
              data = JSON.parse(this.commandDataText)
            }
            
            this.sending = true
            const res = await axios.post('/api/command/send', {
              deviceId: this.commandForm.deviceId,
              commandType: this.commandForm.commandType,
              data
            })
            
            if (res.data.code === 200) {
              this.$message.success('指令发送成功')
              this.addToHistory(res.data.data)
            } else {
              this.$message.error(res.data.message || '发送失败')
            }
          } catch (e) {
            console.error('发送指令失败', e)
            if (e.response?.data?.message) {
              this.$message.error(e.response.data.message)
            } else if (e instanceof SyntaxError) {
              this.$message.error('JSON格式错误')
            } else {
              this.$message.error('发送失败')
            }
          } finally {
            this.sending = false
          }
        }
      })
    },
    async sendBroadcastCommand() {
      this.$confirm('确定要发送广播指令吗？该指令将发送给所有在线设备。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          let data = {}
          if (this.broadcastDataText.trim()) {
            data = JSON.parse(this.broadcastDataText)
          }
          
          this.sending = true
          const res = await axios.post('/api/command/broadcast', {
            deviceId: 'broadcast',
            commandType: this.broadcastForm.commandType,
            data
          })
          
          if (res.data.code === 200) {
            this.$message.success('广播指令发送成功')
            this.addToHistory({
              ...res.data.data,
              deviceId: '所有设备'
            })
          } else {
            this.$message.error(res.data.message || '发送失败')
          }
        } catch (e) {
          console.error('发送广播指令失败', e)
          this.$message.error(e.response?.data?.message || '发送失败')
        } finally {
          this.sending = false
        }
      }).catch(() => {})
    },
    addToHistory(item) {
      this.commandHistory.unshift({
        ...item,
        status: '已发送',
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss')
      })
      if (this.commandHistory.length > 10) {
        this.commandHistory.pop()
      }
    },
    resetForm() {
      this.commandForm = {
        deviceId: '',
        commandType: '',
        data: {}
      }
      this.commandDataText = ''
      this.$refs.commandFormRef.resetFields()
    },
    resetBroadcastForm() {
      this.broadcastForm = {
        commandType: '',
        data: {}
      }
      this.broadcastDataText = ''
      this.$refs.broadcastFormRef.resetFields()
    },
    formatJson() {
      try {
        if (this.commandDataText.trim()) {
          const obj = JSON.parse(this.commandDataText)
          this.commandDataText = JSON.stringify(obj, null, 2)
          this.$message.success('JSON格式化成功')
        }
      } catch (e) {
        this.$message.error('JSON格式错误，无法格式化')
      }
    },
    loadExample() {
      const examples = {
        restart: '{}',
        set_param: JSON.stringify({
          temperature: 25,
          humidity: 60,
          mode: 'auto'
        }, null, 2),
        get_status: '{}',
        turn_on: JSON.stringify({ delay: 0 }, null, 2),
        turn_off: JSON.stringify({ delay: 0 }, null, 2),
        custom: JSON.stringify({
          action: 'custom_action',
          params: {
            key1: 'value1',
            key2: 123
          }
        }, null, 2)
      }
      
      const type = this.commandForm.commandType
      if (examples[type]) {
        this.commandDataText = examples[type]
        this.$message.success('已加载示例数据')
      } else {
        this.$message.warning('请先选择指令类型')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.command-page {
  .form-tip {
    margin-top: 5px;
    
    .el-button {
      padding-left: 0;
      padding-right: 10px;
    }
  }
}
</style>
