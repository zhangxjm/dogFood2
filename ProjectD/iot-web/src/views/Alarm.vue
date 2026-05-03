<template>
  <div class="alarm-page">
    <div class="card mb-20">
      <div class="flex-between mb-20">
        <h3>告警规则管理</h3>
        <el-button type="primary" @click="showAddDialog">
          <i class="el-icon-plus"></i> 新建规则
        </el-button>
      </div>
      <el-table :data="alarmRules" stripe border v-loading="loading">
        <el-table-column prop="ruleName" label="规则名称" min-width="150"></el-table-column>
        <el-table-column prop="deviceId" label="适用设备" width="150">
          <template slot-scope="scope">
            {{ scope.row.deviceId || '所有设备' }}
          </template>
        </el-table-column>
        <el-table-column prop="metric" label="指标" width="120"></el-table-column>
        <el-table-column prop="operator" label="条件" width="120">
          <template slot-scope="scope">
            {{ getOperatorText(scope.row.operator) }} {{ scope.row.threshold }}
          </template>
        </el-table-column>
        <el-table-column prop="severity" label="级别" width="100">
          <template slot-scope="scope">
            <el-tag :type="getSeverityType(scope.row.severity)">
              {{ getSeverityText(scope.row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isEnabled" label="状态" width="100">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.isEnabled"
              active-color="#13ce66"
              inactive-color="#ff4949"
              @change="toggleRule(scope.row)">
            </el-switch>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" @click="editRule(scope.row)">编辑</el-button>
            <el-button size="mini" type="danger" @click="deleteRule(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card">
      <div class="flex-between mb-20">
        <h3>告警记录</h3>
        <el-button type="text" @click="refreshLogs">
          <i class="el-icon-refresh"></i> 刷新
        </el-button>
      </div>
      <el-table :data="alarmLogs" stripe border v-loading="logsLoading">
        <el-table-column prop="deviceId" label="设备ID" width="150"></el-table-column>
        <el-table-column prop="metric" label="指标" width="100"></el-table-column>
        <el-table-column prop="message" label="告警信息" min-width="300"></el-table-column>
        <el-table-column prop="actualValue" label="当前值" width="100">
          <template slot-scope="scope">
            {{ scope.row.actualValue }} ({{ getOperatorText(scope.row.operator) }} {{ scope.row.threshold }})
          </template>
        </el-table-column>
        <el-table-column prop="severity" label="级别" width="80">
          <template slot-scope="scope">
            <el-tag :type="getSeverityType(scope.row.severity)" size="mini">
              {{ getSeverityText(scope.row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isRead" label="状态" width="80">
          <template slot-scope="scope">
            <el-tag :type="scope.row.isRead ? 'info' : 'danger'" size="mini">
              {{ scope.row.isRead ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="alarmTime" label="时间" width="180"></el-table-column>
        <el-table-column label="操作" width="80">
          <template slot-scope="scope">
            <el-button v-if="!scope.row.isRead" size="mini" type="text" @click="markAsRead(scope.row.id)">
              标记已读
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="mt-20"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total">
      </el-pagination>
    </div>

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="600px">
      <el-form :model="ruleForm" :rules="ruleRules" ref="ruleFormRef" label-width="100px">
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="ruleForm.ruleName" placeholder="请输入规则名称"></el-input>
        </el-form-item>
        <el-form-item label="适用设备" prop="deviceId">
          <el-select v-model="ruleForm.deviceId" placeholder="选择设备（不选则应用到所有设备）" clearable filterable style="width: 100%;">
            <el-option v-for="device in deviceList" :key="device.deviceId" :label="`${device.deviceName} (${device.deviceId})`" :value="device.deviceId"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="监控指标" prop="metric">
          <el-input v-model="ruleForm.metric" placeholder="例如: temperature, humidity, pressure"></el-input>
        </el-form-item>
        <el-form-item label="触发条件" prop="operator">
          <el-row :gutter="10">
            <el-col :span="8">
              <el-select v-model="ruleForm.operator" placeholder="操作符" style="width: 100%;">
                <el-option label="大于 (gt)" value="gt"></el-option>
                <el-option label="大于等于 (gte)" value="gte"></el-option>
                <el-option label="小于 (lt)" value="lt"></el-option>
                <el-option label="小于等于 (lte)" value="lte"></el-option>
                <el-option label="等于 (eq)" value="eq"></el-option>
                <el-option label="不等于 (neq)" value="neq"></el-option>
              </el-select>
            </el-col>
            <el-col :span="16">
              <el-input v-model.number="ruleForm.threshold" type="number" placeholder="阈值">
                <template slot="append">
                  <span style="padding: 0 10px;">{{ getOperatorText(ruleForm.operator) }}</span>
                </template>
              </el-input>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="告警级别" prop="severity">
          <el-radio-group v-model="ruleForm.severity">
            <el-radio label="low">低</el-radio>
            <el-radio label="medium">中</el-radio>
            <el-radio label="high">高</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="通知方式" prop="notificationType">
          <el-radio-group v-model="ruleForm.notificationType">
            <el-radio label="none">仅记录</el-radio>
            <el-radio label="email">邮件</el-radio>
            <el-radio label="sms">短信</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="启用状态" prop="isEnabled">
          <el-switch
            v-model="ruleForm.isEnabled"
            active-text="启用"
            inactive-text="禁用">
          </el-switch>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Alarm',
  data() {
    return {
      loading: false,
      logsLoading: false,
      deviceList: [],
      alarmRules: [],
      alarmLogs: [],
      currentPage: 1,
      pageSize: 20,
      total: 0,
      dialogVisible: false,
      dialogTitle: '新建规则',
      editingRule: null,
      ruleForm: {
        ruleName: '',
        deviceId: null,
        metric: '',
        operator: 'gt',
        threshold: 0,
        severity: 'medium',
        notificationType: 'none',
        isEnabled: true
      },
      ruleRules: {
        ruleName: [
          { required: true, message: '请输入规则名称', trigger: 'blur' }
        ],
        metric: [
          { required: true, message: '请输入监控指标', trigger: 'blur' }
        ],
        operator: [
          { required: true, message: '请选择操作符', trigger: 'change' }
        ],
        threshold: [
          { required: true, message: '请输入阈值', trigger: 'blur' },
          { type: 'number', message: '阈值必须是数字', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const [rulesRes, devicesRes] = await Promise.all([
          axios.get('/api/alarm/rules'),
          axios.get('/api/device/list')
        ])
        
        if (rulesRes.data.code === 200) {
          this.alarmRules = rulesRes.data.data
        }
        if (devicesRes.data.code === 200) {
          this.deviceList = devicesRes.data.data
        }
        
        this.loadAlarmLogs()
      } catch (e) {
        console.error('加载数据失败', e)
        this.$message.error('加载数据失败')
      } finally {
        this.loading = false
      }
    },
    async loadAlarmLogs() {
      this.logsLoading = true
      try {
        const res = await axios.get('/api/alarm/logs', {
          params: {
            page: this.currentPage - 1,
            size: this.pageSize
          }
        })
        if (res.data.code === 200) {
          this.alarmLogs = res.data.data.content || []
          this.total = res.data.data.totalElements || 0
        }
      } catch (e) {
        console.error('加载告警记录失败', e)
      } finally {
        this.logsLoading = false
      }
    },
    refreshLogs() {
      this.currentPage = 1
      this.loadAlarmLogs()
    },
    handleSizeChange(val) {
      this.pageSize = val
      this.loadAlarmLogs()
    },
    handleCurrentChange(val) {
      this.currentPage = val
      this.loadAlarmLogs()
    },
    showAddDialog() {
      this.editingRule = null
      this.dialogTitle = '新建规则'
      this.ruleForm = {
        ruleName: '',
        deviceId: null,
        metric: '',
        operator: 'gt',
        threshold: 0,
        severity: 'medium',
        notificationType: 'none',
        isEnabled: true
      }
      this.dialogVisible = true
    },
    editRule(row) {
      this.editingRule = row
      this.dialogTitle = '编辑规则'
      this.ruleForm = {
        ruleName: row.ruleName,
        deviceId: row.deviceId,
        metric: row.metric,
        operator: row.operator,
        threshold: row.threshold,
        severity: row.severity,
        notificationType: row.notificationType || 'none',
        isEnabled: row.isEnabled
      }
      this.dialogVisible = true
    },
    async saveRule() {
      this.$refs.ruleFormRef.validate(async (valid) => {
        if (valid) {
          try {
            let res
            if (this.editingRule) {
              res = await axios.put(`/api/alarm/rules/${this.editingRule.id}`, this.ruleForm)
            } else {
              res = await axios.post('/api/alarm/rules', this.ruleForm)
            }
            
            if (res.data.code === 200) {
              this.$message.success(this.editingRule ? '更新成功' : '创建成功')
              this.dialogVisible = false
              this.loadData()
            } else {
              this.$message.error(res.data.message || '操作失败')
            }
          } catch (e) {
            console.error('保存规则失败', e)
            this.$message.error(e.response?.data?.message || '保存失败')
          }
        }
      })
    },
    async toggleRule(row) {
      try {
        await axios.put(`/api/alarm/rules/${row.id}/toggle`, null, {
          params: { enabled: row.isEnabled }
        })
        this.$message.success('状态已更新')
      } catch (e) {
        console.error('更新规则状态失败', e)
        this.$message.error('更新失败')
        row.isEnabled = !row.isEnabled
      }
    },
    async deleteRule(row) {
      this.$confirm(`确定要删除规则 "${row.ruleName}" 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const res = await axios.delete(`/api/alarm/rules/${row.id}`)
          if (res.data.code === 200) {
            this.$message.success('删除成功')
            this.loadData()
          } else {
            this.$message.error(res.data.message || '删除失败')
          }
        } catch (e) {
          console.error('删除规则失败', e)
          this.$message.error('删除失败')
        }
      }).catch(() => {})
    },
    async markAsRead(id) {
      try {
        await axios.put(`/api/alarm/logs/${id}/read`)
        this.$message.success('已标记为已读')
        this.loadAlarmLogs()
      } catch (e) {
        console.error('标记已读失败', e)
        this.$message.error('操作失败')
      }
    },
    getOperatorText(operator) {
      const map = {
        'gt': '大于',
        'gte': '大于等于',
        'lt': '小于',
        'lte': '小于等于',
        'eq': '等于',
        'neq': '不等于'
      }
      return map[operator] || operator
    },
    getSeverityText(severity) {
      const map = {
        'low': '低',
        'medium': '中',
        'high': '高'
      }
      return map[severity] || severity
    },
    getSeverityType(severity) {
      const map = {
        'low': 'info',
        'medium': 'warning',
        'high': 'danger'
      }
      return map[severity] || 'info'
    }
  }
}
</script>

<style lang="scss" scoped>
.alarm-page {
}
</style>
