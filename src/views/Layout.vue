<template>
  <div class="layout-container">
    <el-container>
      <el-aside width="200px">
        <div class="logo">
          <h3>CMS</h3>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409eff"
        >
          <el-menu-item index="/dashboard">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-sub-menu index="1">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/system/user">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
            <el-menu-item index="/system/role">
              <el-icon><UserFilled /></el-icon>
              <span>角色管理</span>
            </el-menu-item>
            <el-menu-item index="/system/module">
              <el-icon><Menu /></el-icon>
              <span>模块管理</span>
            </el-menu-item>
            <el-menu-item index="/system/dictionary">
              <el-icon><Collection /></el-icon>
              <span>字典管理</span>
            </el-menu-item>
            <el-menu-item index="/system/log">
              <el-icon><Document /></el-icon>
              <span>日志管理</span>
            </el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="2">
            <template #title>
              <el-icon><Folder /></el-icon>
              <span>基础数据</span>
            </template>
            <el-menu-item index="/base/company">
              <el-icon><OfficeBuilding /></el-icon>
              <span>公司管理</span>
            </el-menu-item>
            <el-menu-item index="/base/room">
              <el-icon><House /></el-icon>
              <span>房间管理</span>
            </el-menu-item>
            <el-menu-item index="/base/customer">
              <el-icon><Avatar /></el-icon>
              <span>客户管理</span>
            </el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="3">
            <template #title>
              <el-icon><Wallet /></el-icon>
              <span>收费管理</span>
            </template>
            <el-menu-item index="/fee/rental">
              <el-icon><Tickets /></el-icon>
              <span>出租管理</span>
            </el-menu-item>
            <el-menu-item index="/fee/bill">
              <el-icon><Money /></el-icon>
              <span>费用计划</span>
            </el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="4">
            <template #title>
              <el-icon><DataAnalysis /></el-icon>
              <span>报表查询</span>
            </template>
            <el-menu-item index="/report/rental-summary">
              <el-icon><List /></el-icon>
              <span>租赁汇总</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header>
          <div class="header-content">
            <span>{{ pageTitle }}</span>
            <div class="user-info">
              <el-dropdown @command="handleCommand">
                <span class="user-name">
                  {{ userStore.user.realName || userStore.user.username }}
                  <el-icon><ArrowDown /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="password">修改密码</el-dropdown-item>
                    <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-header>
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { changePassword } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const pageTitle = computed(() => route.meta?.title || '首页')

const passwordDialogVisible = ref(false)
const passwordFormRef = ref()
const passwordForm = ref({
  oldPassword: '',
  newPassword: ''
})
const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }]
}

const handleCommand = (command) => {
  if (command === 'password') {
    passwordDialogVisible.value = true
    passwordForm.value = { oldPassword: '', newPassword: '' }
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定退出登录？', '提示', {
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push('/login')
    })
  }
}

const handleChangePassword = async () => {
  const valid = await passwordFormRef.value.validate()
  if (!valid) return
  try {
    await changePassword(passwordForm.value)
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
  } catch (error) {
    console.error(error)
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.el-container {
  height: 100%;
}
.el-aside {
  background-color: #304156;
  overflow-y: auto;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background-color: #263445;
}
.logo h3 {
  margin: 0;
}
.el-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
}
.header-content {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 20px;
}
.user-name {
  cursor: pointer;
  display: flex;
  align-items: center;
}
.el-main {
  background-color: #f5f5f5;
  padding: 20px;
}
</style>