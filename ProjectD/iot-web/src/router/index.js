import Vue from 'vue'
import VueRouter from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Device from '../views/Device.vue'
import Monitor from '../views/Monitor.vue'
import Command from '../views/Command.vue'
import Alarm from '../views/Alarm.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/device',
    name: 'Device',
    component: Device
  },
  {
    path: '/monitor',
    name: 'Monitor',
    component: Monitor
  },
  {
    path: '/command',
    name: 'Command',
    component: Command
  },
  {
    path: '/alarm',
    name: 'Alarm',
    component: Alarm
  }
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router
