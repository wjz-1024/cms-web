<template>
  <div class="page-container">
    <el-card>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="登录日志" name="login">
          <el-table :data="loginLogs" v-loading="loginLoading" border stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="ip" label="IP地址" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                  {{ row.status === 1 ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="消息" />
            <el-table-column prop="createdAt" label="时间" width="180" />
          </el-table>
          <el-pagination
            v-model:current-page="loginPagination.page"
            v-model:page-size="loginPagination.pageSize"
            :total="loginPagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchLoginLogs"
            @current-change="fetchLoginLogs"
          />
        </el-tab-pane>
        <el-tab-pane label="操作日志" name="operation">
          <el-table :data="operationLogs" v-loading="operationLoading" border stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="module" label="模块" />
            <el-table-column prop="action" label="操作" />
            <el-table-column prop="content" label="内容" show-overflow-tooltip />
            <el-table-column prop="ip" label="IP地址" />
            <el-table-column prop="createdAt" label="时间" width="180" />
          </el-table>
          <el-pagination
            v-model:current-page="operationPagination.page"
            v-model:page-size="operationPagination.pageSize"
            :total="operationPagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchOperationLogs"
            @current-change="fetchOperationLogs"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { getLoginLogs, getOperationLogs } from '@/api'

const activeTab = ref('login')
const loginLoading = ref(false)
const operationLoading = ref(false)
const loginLogs = ref([])
const operationLogs = ref([])
const loginPagination = ref({ page: 1, pageSize: 10, total: 0 })
const operationPagination = ref({ page: 1, pageSize: 10, total: 0 })

const fetchLoginLogs = async () => {
  loginLoading.value = true
  try {
    const res = await getLoginLogs({ page: loginPagination.value.page, pageSize: loginPagination.value.pageSize })
    loginLogs.value = res.data.list
    loginPagination.value.total = res.data.total
  } catch (error) {
    console.error(error)
  } finally {
    loginLoading.value = false
  }
}

const fetchOperationLogs = async () => {
  operationLoading.value = true
  try {
    const res = await getOperationLogs({ page: operationPagination.value.page, pageSize: operationPagination.value.pageSize })
    operationLogs.value = res.data.list
    operationPagination.value.total = res.data.total
  } catch (error) {
    console.error(error)
  } finally {
    operationLoading.value = false
  }
}

onMounted(() => {
  fetchLoginLogs()
})

watch(activeTab, (val) => {
  if (val === 'login') {
    fetchLoginLogs()
  } else {
    fetchOperationLogs()
  }
})
</script>

<style scoped>
.el-pagination {
  margin-top: 20px;
}
</style>