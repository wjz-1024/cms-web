import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/views/Layout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'system/user',
        name: 'User',
        component: () => import('@/views/system/User.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'system/role',
        name: 'Role',
        component: () => import('@/views/system/Role.vue'),
        meta: { title: '角色管理' }
      },
      {
        path: 'system/module',
        name: 'Module',
        component: () => import('@/views/system/Module.vue'),
        meta: { title: '模块管理' }
      },
      {
        path: 'system/dictionary',
        name: 'Dictionary',
        component: () => import('@/views/system/Dictionary.vue'),
        meta: { title: '字典管理' }
      },
      {
        path: 'system/log',
        name: 'Log',
        component: () => import('@/views/system/Log.vue'),
        meta: { title: '日志管理' }
      },
      {
        path: 'base/company',
        name: 'Company',
        component: () => import('@/views/base/Company.vue'),
        meta: { title: '公司管理' }
      },
      {
        path: 'base/room',
        name: 'Room',
        component: () => import('@/views/base/Room.vue'),
        meta: { title: '房间管理' }
      },
      {
        path: 'base/customer',
        name: 'Customer',
        component: () => import('@/views/base/Customer.vue'),
        meta: { title: '客户管理' }
      },
      {
        path: 'fee/rental',
        name: 'Rental',
        component: () => import('@/views/fee/Rental.vue'),
        meta: { title: '出租管理' }
      },
      {
        path: 'fee/bill',
        name: 'Bill',
        component: () => import('@/views/fee/Bill.vue'),
        meta: { title: '费用计划' }
      },
      {
        path: 'report/rental-summary',
        name: 'RentalSummary',
        component: () => import('@/views/report/RentalSummary.vue'),
        meta: { title: '租赁汇总' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path === '/login') {
    next()
  } else if (!token) {
    next('/login')
  } else {
    next()
  }
})

export default router