import { defineStore } from 'pinia'
import { getUserInfo } from '@/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || '{}'),
    modules: []
  }),
  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },
    setUser(user) {
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    setModules(modules) {
      this.modules = modules
    },
    async fetchUserInfo() {
      try {
        const res = await getUserInfo()
        this.setUser(res.data)
        this.setModules(res.data.modules || [])
        return res.data
      } catch (error) {
        throw error
      }
    },
    logout() {
      this.token = ''
      this.user = {}
      this.modules = []
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})