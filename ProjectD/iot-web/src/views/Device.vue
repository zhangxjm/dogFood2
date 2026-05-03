<template>
  <div class="device-page">
    <div class="card mb-20">
      <div class="flex-between mb-20">
        <h3>设备列表</h3>
        <el-button type="primary" @click="showRegisterDialog">
          <i class="el-icon-plus"></i> 注册设备
        </el-button>
      </div>
      <el-table :data="deviceList" stripe border style="width: 100%" v-loading="loading">
        <el-table-column prop="deviceId" label="设备ID" min-width="150"></el-table-column>
        <el-table-column prop="deviceName" label="设备名称" min-width="120"></el-table-column>
        <el-table-column prop="deviceType" label="设备类型" width="100"></el-table-column>
        <el-table-column prop="secret" label="密钥" width="200">
          <template slot-scope="scope">
            <el-input :value="scope.row.secret" disabled size="mini" style="width: 160px;"></el-input>
            <el-button size="mini" type="text" @click="copySecret(scope.row.secret)">复制</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === 'online' ? 'success' : 'info'">
              {{ scope.row.status === 'online' ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastOnlineTime" label="最后在线时间" width="180"></el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" type="danger" @click="deleteDevice(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog title="注册新设备" :visible.sync="registerDialogVisible" width="500px">
      <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-width="100px">
        <el-form-item label="设备ID" prop="deviceId">
          <el-input v-model="registerForm.deviceId" placeholder="请输入设备ID"></el-input>
        </el-form-item>
        <el-form-item label="设备名称" prop="deviceName">
          <el-input v-model="registerForm.deviceName" placeholder="请输入设备名称"></el-input>
        </el-form-item>
        <el-form-item label="设备类型" prop="deviceType">
          <el-select v-model="registerForm.deviceType" placeholder="请选择设备类型" style="width: 100%;">
            <el-option label="传感器" value="sensor"></el-option>
            <el-option label="控制器" value="controller"></el-option>
            <el-option label="网关" value="gateway"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="registerForm.description" type="textarea" :rows="3" placeholder="请输入设备描述"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="registerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="registerDevice">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="设备注册成功" :visible.sync="successDialogVisible" width="450px">
      <el-alert title="设备注册成功！请保存以下密钥信息" type="success" :closable="false" show-icon class="mb-20"></el-alert>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="设备ID">{{ newDevice.deviceId }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ newDevice.deviceName }}</el-descriptions-item>
        <el-descriptions-item label="密钥">
          <el-input :value="newDevice.secret" disabled></el-input>
          <el-button type="text" @click="copySecret(newDevice.secret)">复制密钥</el-button>
        </el-descriptions-item>
      </el-descriptions>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="successDialogVisible = false">我已保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Device',
  data() {
    return {
      loading: false,
      deviceList: [],
      registerDialogVisible: false,
      successDialogVisible: false,
      newDevice: {},
      registerForm: {
        deviceId: '',
        deviceName: '',
        deviceType: 'sensor',
        description: ''
      },
      registerRules: {
        deviceId: [
          { required: true, message: '请输入设备ID', trigger: 'blur' }
        ],
        deviceName: [
          { required: true, message: '请输入设备名称', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.loadDeviceList()
  },
  methods: {
    async loadDeviceList() {
      this.loading = true
      try {
        const res = await axios.get('/api/device/list')
        if (res.data.code === 200) {
          this.deviceList = res.data.data
        }
      } catch (e) {
        console.error('加载设备列表失败', e)
        this.$message.error('加载设备列表失败')
      } finally {
        this.loading = false
      }
    },
    showRegisterDialog() {
      this.registerForm = {
        deviceId: '',
        deviceName: '',
        deviceType: 'sensor',
        description: ''
      }
      this.registerDialogVisible = true
    },
    async registerDevice() {
      this.$refs.registerFormRef.validate(async (valid) => {
        if (valid) {
          try {
            const res = await axios.post('/api/device/register', this.registerForm)
            if (res.data.code === 200) {
              this.newDevice = res.data.data
              this.registerDialogVisible = false
              this.successDialogVisible = true
              this.loadDeviceList()
            } else {
              this.$message.error(res.data.message || '注册失败')
            }
          } catch (e) {
            console.error('注册设备失败', e)
            this.$message.error(e.response?.data?.message || '注册失败')
          }
        }
      })
    },
    deleteDevice(row) {
      this.$confirm(`确定要删除设备 "${row.deviceName}" 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const res = await axios.delete(`/api/device/${row.deviceId}`)
          if (res.data.code === 200) {
            this.$message.success('删除成功')
            this.loadDeviceList()
          } else {
            this.$message.error(res.data.message || '删除失败')
          }
        } catch (e) {
          console.error('删除设备失败', e)
          this.$message.error(e.response?.data?.message || '删除失败')
        }
      }).catch(() => {})
    },
    copySecret(secret) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(secret).then(() => {
          this.$message.success('已复制到剪贴板')
        })
      } else {
        const input = document.createElement('input')
        input.value = secret
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        this.$message.success('已复制到剪贴板')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.device-page {
  .mb-20 {
    margin-bottom: 20px;
  }
}
</style>
