<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #409eff">
              <el-icon size="30"><House /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalRooms }}</div>
              <div class="stat-label">房间总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon size="30"><Avatar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.rentedRooms }}</div>
              <div class="stat-label">已出租</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon size="30"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatMoney(stats.totalDue) }}</div>
              <div class="stat-label">当年应收</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon size="30"><Wallet /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatMoney(stats.totalPaid) }}</div>
              <div class="stat-label">当年实收</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-card class="welcome-card">
      <h3>欢迎使用全场景收费管理系统</h3>
      <p>当前用户：{{ userStore.user.realName || userStore.user.username }}</p>
      <p>角色：{{ userStore.user.roles?.map(r => r.name).join('、') || '无' }}</p>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { getDashboardStats } from '@/api'
import { formatMoney } from '@/utils/format'

const userStore = useUserStore()
const stats = ref({
  totalRooms: 0,
  rentedRooms: 0,
  totalDue: 0,
  totalPaid: 0
})

const fetchStats = async () => {
  try {
    const res = await getDashboardStats()
    stats.value = res.data
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}
.stat-card {
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
  color: #fff;
}
.stat-info {
  margin-left: 20px;
}
.stat-value {
  font-size: 24px;
  font-weight: bold;
}
.stat-label {
  font-size: 14px;
  color: #909399;
}
.welcome-card {
  margin-top: 20px;
}
.welcome-card h3 {
  margin: 0 0 10px 0;
}
.welcome-card p {
  margin: 5px 0;
  color: #606266;
}
</style>