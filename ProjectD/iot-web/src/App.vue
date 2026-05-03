<template>
  <div id="app">
    <el-container class="app-container">
      <el-aside width="200px" class="app-aside">
        <div class="logo">
          <h2>物联网管理系统</h2>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/dashboard">
            <i class="el-icon-data-analysis"></i>
            <span slot="title">监控面板</span>
          </el-menu-item>
          <el-menu-item index="/device">
            <i class="el-icon-cpu"></i>
            <span slot="title">设备管理</span>
          </el-menu-item>
          <el-menu-item index="/monitor">
            <i class="el-icon-monitor"></i>
            <span slot="title">数据监控</span>
          </el-menu-item>
          <el-menu-item index="/command">
            <i class="el-icon-s-promotion"></i>
            <span slot="title">指令下发</span>
          </el-menu-item>
          <el-menu-item index="/alarm">
            <i class="el-icon-warning"></i>
            <span slot="title">告警管理</span>
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="alarm-badge"></el-badge>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="app-header">
          <h3>{{ pageTitle }}</h3>
        </el-header>
        <el-main class="app-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'App',
  data() {
    return {
      unreadCount: 0
    }
  },
  computed: {
    activeMenu() {
      return this.$route.path
    },
    pageTitle() {
      const titles = {
        '/dashboard': '监控面板',
        '/device': '设备管理',
        '/monitor': '数据监控',
        '/command': '指令下发',
        '/alarm': '告警管理'
      }
      return titles[this.$route.path] || '物联网管理系统'
    }
  },
  created() {
    this.getUnreadCount()
    this.startPolling()
  },
  beforeDestroy() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
    }
  },
  methods: {
    async getUnreadCount() {
      try {
        const res = await axios.get('/api/alarm/logs/unread/count')
        if (res.data && res.data.code === 200) {
          this.unreadCount = res.data.data.count || 0
        }
      } catch (e) {
        console.error('获取未读告警数量失败', e)
      }
    },
    startPolling() {
      this.pollingTimer = setInterval(() => {
        this.getUnreadCount()
      }, 30000)
    }
  }
}
</script>

<style lang="scss">
#app {
  height: 100vh;
  width: 100%;
}

.app-container {
  height: 100%;

  .app-aside {
    background-color: #304156;
    
    .logo {
      height: 60px;
      line-height: 60px;
      text-align: center;
      background-color: #263445;
      
      h2 {
        color: #fff;
        margin: 0;
        font-size: 18px;
      }
    }
    
    .el-menu {
      border-right: none;
      
      .el-menu-item {
        position: relative;
        
        .alarm-badge {
          position: absolute;
          right: 20px;
          top: 10px;
        }
      }
    }
  }

  .app-header {
    background-color: #fff;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    display: flex;
    align-items: center;
    
    h3 {
      margin: 0;
      color: #303133;
    }
  }

  .app-main {
    background-color: #f0f2f5;
    padding: 20px;
    overflow-y: auto;
  }
}
</style>
