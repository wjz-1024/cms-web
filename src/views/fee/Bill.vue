<template>
  <div class="page-container">
    <el-card class="bill-card">
      <div class="card-content">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="选择出租">
            <el-select 
              v-model="rentalId" 
              filterable 
              remote 
              :remote-method="searchRentals"
              placeholder="输入房号或客户名称搜索" 
              clearable 
              style="width: 280px"
            >
              <el-option 
                v-for="item in rentalOptions" 
                :key="item.id" 
                :label="`${item.room.roomNo} - ${item.customer.name}`" 
                :value="item.id"
              >
                <div style="display: flex; justify-content: space-between">
                  <span>{{ item.room.building }} {{ item.room.floor }} {{ item.room.roomNo }}</span>
                  <span style="color: #909399; font-size: 12px">{{ item.customer.name }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="客户信息">
            <el-input v-model="searchForm.keyword" placeholder="客户/房号" clearable style="width: 150px" />
          </el-form-item>
          <el-form-item label="费用类型">
            <el-select v-model="searchForm.feeType" placeholder="请选择" clearable style="width: 120px">
              <el-option label="租金" value="1" />
              <el-option label="物业费" value="2" />
              <el-option label="水费" value="3" />
              <el-option label="电费" value="4" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 100px">
              <el-option label="待收" value="0" />
              <el-option label="已收" value="1" />
              <el-option label="逾期" value="2" />
              <el-option label="终止" value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="应收日期≤">
            <el-date-picker v-model="searchForm.dueDateMax" type="date" placeholder="选择日期" clearable style="width: 140px" value-format="YYYY-MM-DD" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button type="success" @click="handleExport" :loading="exportLoading">导出Excel</el-button>
            <el-button @click="handleAddBill" type="success" :disabled="!rentalId">新增费用单</el-button>
          </el-form-item>
        </el-form>
        
        <el-row :gutter="25" class="statistics" v-if="rentalId && stats.totalBills > 0">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">应收总额</div>
              <div class="stat-value">{{ formatMoney(stats.totalDue) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">实收总额</div>
              <div class="stat-value">{{ formatMoney(stats.totalPaid) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">违约金总额</div>
              <div class="stat-value penalty">{{ formatMoney(stats.totalPenalty) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">待收账单数</div>
              <div class="stat-value">{{ stats.unpaidCount }}</div>
            </div>
          </el-col>
        </el-row>
        
        <el-empty v-if="tableData.length === 0 && !loading" description="暂无数据" />
        
        <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
          <el-table-column label="客户信息" width="150" fixed>
            <template #default="{ row }">
              <div v-if="row.customer || row.rental">
                <div style="font-weight: 600">{{ row.customer?.name || row.rental?.customer?.name || '-' }}</div>
                <div style="color: #909399; font-size: 12px">{{ row.customer?.companyName || row.rental?.customer?.companyName || '-' }}</div>
              </div>
              <div v-else>-</div>
            </template>
          </el-table-column>
          <el-table-column label="房间信息" width="140">
            <template #default="{ row }">
              <div v-if="row.room">
                <span>{{ row.room.building }} {{ row.room.floor }} {{ row.room.roomNo }}</span>
              </div>
              <div v-else>-</div>
            </template>
          </el-table-column>
          <el-table-column prop="feeType" label="费用类型" width="100" align="center">
            <template #default="{ row }">
              {{ feeTypeMap[row.feeType] }}
            </template>
          </el-table-column>
          <el-table-column label="周期开始" width="110">
            <template #default="{ row }">
              {{ formatDate(row.periodStart) }}
            </template>
          </el-table-column>
          <el-table-column label="周期结束" width="110">
            <template #default="{ row }">
              {{ formatDate(row.periodEnd) }}
            </template>
          </el-table-column>
          <el-table-column label="应收日期" width="110">
            <template #default="{ row }">
              {{ formatDate(row.dueDate) }}
            </template>
          </el-table-column>
          <el-table-column label="应收金额" width="110">
            <template #default="{ row }">
              <span class="fee-amount">{{ formatMoney(row.dueAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="实收金额" width="110">
            <template #default="{ row }">
              <span v-if="row.paidAmount">{{ formatMoney(row.paidAmount) }}</span>
              <span v-else style="color: #909399">-</span>
            </template>
          </el-table-column>
          <el-table-column label="实收日期" width="110">
            <template #default="{ row }">
              {{ formatDate(row.paidDate) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="违约金" width="100">
            <template #default="{ row }">
              <span v-if="row.penaltyAmount" class="penalty-amount">{{ formatMoney(row.penaltyAmount) }}</span>
              <span v-else style="color: #909399">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="statusTypeMap[row.status]" size="small">
                {{ statusMap[row.status] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleEdit(row)" v-if="row.status !== 3">收款</el-button>
              <el-button type="warning" link size="small" @click="handleCalcPenalty(row)" v-if="row.status === 0 || row.status === 2">违约金</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          v-if="pagination.total > 0"
        />
      </div>
    </el-card>
    
    <el-dialog v-model="dialogVisible" title="收款登记" width="400px">
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item label="应收金额">
          <el-input-number v-model="form.dueAmount" :min="0" :precision="2" disabled style="width: 100%" />
        </el-form-item>
        <el-form-item label="实收金额">
          <el-input-number v-model="form.paidAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="实收日期">
          <el-date-picker v-model="form.paidDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="违约金金额">
          <el-input-number v-model="form.penaltyAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="addBillDialogVisible" title="新增费用单" width="450px">
      <el-form ref="addBillFormRef" :model="addBillForm" :rules="addBillRules" label-width="100px">
        <el-form-item label="费用类型" prop="feeType">
          <el-select v-model="addBillForm.feeType" placeholder="请选择" style="width: 100%">
            <el-option label="水费" :value="3" />
            <el-option label="电费" :value="4" />
            <el-option label="其他" :value="5" />
          </el-select>
        </el-form-item>
        <el-row :gutter="15">
          <el-col :span="12">
            <el-form-item label="周期开始" prop="periodStart">
              <el-date-picker v-model="addBillForm.periodStart" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="周期结束" prop="periodEnd">
              <el-date-picker v-model="addBillForm.periodEnd" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="应收日期" prop="dueDate">
          <el-date-picker v-model="addBillForm.dueDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-row :gutter="15">
          <el-col :span="12">
            <el-form-item label="用量" prop="usageAmount">
              <el-input-number v-model="addBillForm.usageAmount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单价" prop="unitPrice">
              <el-input-number v-model="addBillForm.unitPrice" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="总金额">
          <el-input-number v-model="addBillDueAmount" :min="0" :precision="2" disabled style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addBillDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAddBill">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getBills, getBillStatistics, updateBill, createBill, calculatePenalty, getRentals, getGlobalBills, exportGlobalBills } from '@/api'
import { formatDate, formatMoney } from '@/utils/format'

const route = useRoute()
const loading = ref(false)
const exportLoading = ref(false)
const tableData = ref([])
const stats = ref({ totalDue: 0, totalPaid: 0, totalPenalty: 0, unpaidCount: 0, totalBills: 0 })
const dialogVisible = ref(false)
const addBillDialogVisible = ref(false)
const formRef = ref()
const addBillFormRef = ref()
const rentalOptions = ref([])

const rentalId = ref(route.query.rentalId || '')
const searchForm = ref({ keyword: '', feeTypeList: [], status: '', dueDateMax: '' })
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const form = ref({ id: null, dueAmount: 0, paidAmount: 0, paidDate: '', penaltyAmount: 0, remark: '' })
const addBillForm = ref({
  feeType: 3, periodStart: '', periodEnd: '', dueDate: '', usageAmount: 0, unitPrice: 0
})

const feeTypeMap = { 1: '租金', 2: '物业费', 3: '水费', 4: '电费', 5: '其他' }
const statusMap = { 0: '待收', 1: '已收', 2: '逾期', 3: '终止' }
const statusTypeMap = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }

const addBillDueAmount = computed(() => addBillForm.value.usageAmount * addBillForm.value.unitPrice)

const addBillRules = {
  feeType: [{ required: true, message: '请选择费用类型', trigger: 'change' }],
  periodStart: [{ required: true, message: '请选择周期开始', trigger: 'change' }],
  periodEnd: [{ required: true, message: '请选择周期结束', trigger: 'change' }],
  dueDate: [{ required: true, message: '请选择应收日期', trigger: 'change' }],
  usageAmount: [{ required: true, message: '请输入用量', trigger: 'blur' }],
  unitPrice: [{ required: true, message: '请输入单价', trigger: 'blur' }]
}

const searchRentals = async (keyword) => {
  if (!keyword) {
    rentalOptions.value = []
    return
  }
  try {
    const res = await getRentals({ keyword, pageSize: 20 })
    rentalOptions.value = res.data.list
  } catch (error) {
    console.error(error)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    if (rentalId.value) {
      const res = await getBills(rentalId.value, { page: pagination.value.page, pageSize: pagination.value.pageSize, feeType: searchForm.value.feeType, status: searchForm.value.status })
      tableData.value = res.data.list
      pagination.value.total = res.data.total
    } else {
      const res = await getGlobalBills({ page: pagination.value.page, pageSize: pagination.value.pageSize, ...searchForm.value })
      tableData.value = res.data.list
      pagination.value.total = res.data.total
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  if (!rentalId.value) return
  try {
    const res = await getBillStatistics(rentalId.value)
    stats.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  fetchData()
}

const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  fetchData()
}

const handleCurrentChange = (page) => {
  pagination.value.page = page
  fetchData()
}

const handleEdit = (row) => {
  form.value = {
    id: row.id,
    dueAmount: row.dueAmount,
    paidAmount: row.paidAmount || 0,
    paidDate: row.paidDate || '',
    penaltyAmount: row.penaltyAmount || 0,
    remark: row.remark || ''
  }
  dialogVisible.value = true
}

const handleSave = async () => {
  try {
    const submitData = {
      ...form.value,
      paidDate: form.value.paidDate || null
    }
    await updateBill(form.value.id, submitData)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchData()
    fetchStats()
  } catch (error) {
    console.error(error)
  }
}

const handleCalcPenalty = async (row) => {
  try {
    const res = await calculatePenalty(row.id)
    ElMessage.success(`逾期 ${res.data.overdueDays} 天，违约金 ${res.data.penaltyAmount} 元`)
    form.value = { ...form.value, id: row.id, penaltyAmount: res.data.penaltyAmount }
  } catch (error) {
    console.error(error)
  }
}

const handleAddBill = () => {
  if (!rentalId.value) {
    ElMessage.warning('请先选择出租记录')
    return
  }
  addBillForm.value = { feeType: 3, periodStart: '', periodEnd: '', dueDate: '', usageAmount: 0, unitPrice: 0 }
  addBillDialogVisible.value = true
}

const handleSaveAddBill = async () => {
  const valid = await addBillFormRef.value.validate()
  if (!valid) return
  try {
    const submitData = {
      ...addBillForm.value,
      periodStart: addBillForm.value.periodStart || '',
      periodEnd: addBillForm.value.periodEnd || '',
      dueDate: addBillForm.value.dueDate || ''
    }
    await createBill(rentalId.value, submitData)
    ElMessage.success('新增成功')
    addBillDialogVisible.value = false
    fetchData()
    fetchStats()
  } catch (error) {
    console.error(error)
  }
}

const handleExport = async () => {
  exportLoading.value = true
  try {
    const feeTypes = searchForm.value.feeTypeList.join(',')
    const res = await exportGlobalBills({ keyword: searchForm.value.keyword, feeType: feeTypes, status: searchForm.value.status, dueDateMax: searchForm.value.dueDateMax })
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = `费用计划-${new Date().toISOString().slice(0, 10)}.xlsx`
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

watch(rentalId, () => {
  pagination.value.page = 1
  fetchData()
  if (rentalId.value) {
    fetchStats()
  } else {
    stats.value = { totalDue: 0, totalPaid: 0, totalPenalty: 0, unpaidCount: 0, totalBills: 0 }
  }
})

onMounted(() => {
  fetchData()
  if (rentalId.value) {
    searchRentals(route.query.rentalId)
    fetchStats()
  }
})
</script>

<style scoped>
.page-container {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background: #f0f2f5;
}
.bill-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}
.card-content {
  padding: 30px 35px;
}
.search-form {
  margin-bottom: 35px;
}
.statistics {
  margin-bottom: 35px;
  display: flex;
}
.stat-item {
  text-align: center;
  padding: 20px;
  border-right: 1px solid #e4e7ed;
}
.stat-item:last-child {
  border-right: none;
}
.stat-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 15px;
}
.stat-value {
  color: #303133;
  font-size: 28px;
  font-weight: 600;
}
.stat-value.penalty {
  color: #f56c6c;
}
.el-table {
  width: 100%;
  margin-bottom: 20px;
}
.el-table th.el-table__cell {
  background-color: #f5f7fa;
  color: #303133;
  font-weight: 600;
  padding: 20px 15px;
}
.el-table td.el-table__cell {
  padding: 18px 15px;
}
.el-pagination {
  margin-top: 25px;
  padding: 20px 25px;
  background: #fafafa;
  border-radius: 6px;
  justify-content: flex-end;
}
.fee-amount {
  color: #e6a23c;
  font-weight: 600;
  font-size: 15px;
}
.penalty-amount {
  color: #f56c6c;
  font-weight: 600;
  font-size: 15px;
}
.el-dialog .el-form-item {
  margin-bottom: 25px;
}
.el-dialog .el-dialog__body {
  padding: 30px;
}
</style>