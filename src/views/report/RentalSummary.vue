<template>
  <div class="page-container">
    <el-card>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="客户/楼栋/房间" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleExport" :loading="exportLoading">导出Excel</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%" max-height="600" show-summary :summary-method="getSummaries">
        <el-table-column label="客户" width="120" fixed>
          <template #default="{ row }">
            <div style="font-weight: 600">{{ row.customer }}</div>
            <div style="color: #909399; font-size: 12px">{{ row.customerName }}</div>
          </template>
        </el-table-column>
        <el-table-column label="物业信息" width="140">
          <template #default="{ row }">{{ row.propertyInfo }}</template>
        </el-table-column>
        <el-table-column label="面积(㎡)" width="80" align="right">
          <template #default="{ row }">{{ row.area }}</template>
        </el-table-column>
        <el-table-column label="房租单价(日/㎡)" width="110" align="right">
          <template #default="{ row }">{{ row.dailyRentPerSqm }}</template>
        </el-table-column>
        <el-table-column label="开始时间" width="100">
          <template #default="{ row }">{{ formatDate(row.startDate) }}</template>
        </el-table-column>
        <el-table-column label="到期时间" width="100">
          <template #default="{ row }">{{ formatDate(row.endDate) }}</template>
        </el-table-column>
        <el-table-column label="租赁保证金" width="100" align="right" prop="rentDeposit">
          <template #default="{ row }">{{ formatMoney(row.rentDeposit) }}</template>
        </el-table-column>
        <el-table-column label="电费押金" width="100" align="right" prop="propertyDeposit">
          <template #default="{ row }">{{ formatMoney(row.propertyDeposit) }}</template>
        </el-table-column>
        <el-table-column label="总房租费" width="100" align="right" prop="totalRentFee">
          <template #default="{ row }">{{ formatMoney(row.totalRentFee) }}</template>
        </el-table-column>
        <el-table-column label="总物业费" width="100" align="right" prop="totalPropertyFee">
          <template #default="{ row }">{{ formatMoney(row.totalPropertyFee) }}</template>
        </el-table-column>
        <el-table-column label="年租金" width="100" align="right" prop="yearRent">
          <template #default="{ row }">{{ formatMoney(row.yearRent) }}</template>
        </el-table-column>
        <el-table-column label="最近应缴时间" width="100">
          <template #default="{ row }">{{ row.earliestDueDate ? formatDate(row.earliestDueDate) : '-' }}</template>
        </el-table-column>
        <el-table-column label="截止当前应缴租金" width="120" align="right" prop="dueRent">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.dueRent > 0 }">{{ formatMoney(row.dueRent) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="截止当前实收租金" width="120" align="right" prop="paidRent">
          <template #default="{ row }">{{ formatMoney(row.paidRent) }}</template>
        </el-table-column>
        <el-table-column label="截止当前应缴物业费" width="120" align="right" prop="duePropertyFee">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.duePropertyFee > 0 }">{{ formatMoney(row.duePropertyFee) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="截止当前实收物业费" width="120" align="right" prop="paidPropertyFee">
          <template #default="{ row }">{{ formatMoney(row.paidPropertyFee) }}</template>
        </el-table-column>
        <el-table-column label="待收款" width="100" align="right" prop="gap">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.gap > 0, 'text-success': row.gap <= 0 }">{{ formatMoney(row.gap) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="当年应收租金" width="110" align="right" prop="yearDueRent">
          <template #default="{ row }">{{ formatMoney(row.yearDueRent) }}</template>
        </el-table-column>
        <el-table-column label="当年实收租金" width="110" align="right" prop="yearPaidRent">
          <template #default="{ row }">{{ formatMoney(row.yearPaidRent) }}</template>
        </el-table-column>
        <el-table-column label="当年应收物业费" width="110" align="right" prop="yearDuePropertyFee">
          <template #default="{ row }">{{ formatMoney(row.yearDuePropertyFee) }}</template>
        </el-table-column>
        <el-table-column label="当年实收物业费" width="110" align="right" prop="yearPaidPropertyFee">
          <template #default="{ row }">{{ formatMoney(row.yearPaidPropertyFee) }}</template>
        </el-table-column>
        <el-table-column label="当年待收款" width="100" align="right" prop="yearGap">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.yearGap > 0, 'text-success': row.yearGap <= 0 }">{{ formatMoney(row.yearGap) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" width="180">
          <template #default="{ row }">{{ row.remark }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRentalSummary, exportRentalSummary } from '@/api'
import { formatDate, formatMoney } from '@/utils/format'

const loading = ref(false)
const exportLoading = ref(false)
const tableData = ref([])
const searchForm = ref({ keyword: '' })

// 需要汇总的金额列
const sumColumns = ['rentDeposit', 'propertyDeposit', 'totalRentFee', 'totalPropertyFee', 'yearRent', 'dueRent', 'paidRent', 'duePropertyFee', 'paidPropertyFee', 'gap', 'yearDueRent', 'yearPaidRent', 'yearDuePropertyFee', 'yearPaidPropertyFee', 'yearGap']

// 汇总方法
const getSummaries = (param) => {
  const { columns, data } = param
  const sums = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '汇总'
      return
    }
    const prop = column.property
    if (sumColumns.includes(prop)) {
      const values = data.map(item => Number(item[prop]) || 0)
      const sum = values.reduce((prev, curr) => prev + curr, 0)
      sums[index] = formatMoney(sum)
    } else {
      sums[index] = ''
    }
  })
  return sums
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getRentalSummary(searchForm.value.keyword)
    tableData.value = res.data
  } catch (error) {
    console.error(error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchData()
}

const handleReset = () => {
  searchForm.value = { keyword: '' }
  fetchData()
}

const handleExport = async () => {
  exportLoading.value = true
  try {
    const res = await exportRentalSummary(searchForm.value.keyword)
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = `租赁汇总-${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(link.href)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error(error)
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background: #f0f2f5;
}
.el-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}
.search-form {
  margin-bottom: 20px;
}
.text-danger {
  color: #f56c6c;
  font-weight: 600;
}
.text-success {
  color: #67c23a;
  font-weight: 600;
}
</style>