<template>
  <div class="page-container">
    <el-card>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="房间号/客户名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 120px">
            <el-option label="生效" value="1" />
            <el-option label="终止" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column label="房间信息" min-width="180">
          <template #default="{ row }">
            <div class="cell-content">
              <div><span class="label">公司：</span>{{ row.room.companyName }}</div>
              <div><span class="label">位置：</span>{{ row.room.building }} {{ row.room.floor }} {{ row.room.roomNo }}<span class="label" style="margin-left:8px">面积：</span>{{ row.room.area }}㎡</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="承租客户" min-width="150">
          <template #default="{ row }">
            <div class="cell-content">
              <div><span class="label">名称：</span>{{ row.customer.name }}</div>
              <div><span class="label">公司：</span>{{ row.customer.companyName || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="租金" min-width="130">
          <template #default="{ row }">
            <div class="cell-content fee-cell">
              <div><span class="label">日/㎡：</span><span class="fee">{{ (row.rentTotal / 365 / row.room.area).toFixed(4) }}</span></div>
              <div><span class="label">月：</span>{{ formatMoney(row.rentTotal / 12) }}<span class="label" style="margin-left:8px">年：</span>{{ formatMoney(row.rentTotal) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="物业费" min-width="130">
          <template #default="{ row }">
            <div class="cell-content fee-cell">
              <div><span class="label">月/㎡：</span><span class="fee">{{ formatMoney(row.propertyFeeTotal / row.room.area) }}</span></div>
              <div><span class="label">月：</span>{{ formatMoney(row.propertyFeeTotal) }}<span class="label" style="margin-left:8px">年：</span>{{ formatMoney(row.propertyFeeTotal * 12) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="期限" min-width="100">
          <template #default="{ row }">
            <div class="cell-content">
              <div><span class="label">起：</span>{{ formatDate(row.startDate) }}</div>
              <div><span class="label">止：</span>{{ formatDate(row.endDate) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '生效' : '终止' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewBills(row)">费用</el-button>
            <el-button type="warning" link size="small" @click="handleModify(row)" v-if="row.status === 1">修改</el-button>
            <el-button type="danger" link size="small" @click="handleTerminate(row)" v-if="row.status === 1">终止</el-button>
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
      />
    </el-card>

    <el-dialog v-model="terminateDialogVisible" title="终止合同" width="400px">
      <el-form label-width="100px">
        <el-form-item label="终止日期">
          <el-date-picker v-model="terminateDate" type="date" placeholder="选择终止日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="terminateDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmTerminate">确定终止</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="modifyDialogVisible" title="修改出租信息" width="950px" top="5vh">
      <el-form ref="modifyFormRef" :model="modifyForm" label-width="120px" class="modify-form">
        <el-divider content-position="left">租金板块</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="年租金 (元)">
              <el-input v-model="modifyForm.rentTotal" type="number" @input="calcModifyRent" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="日租金 (元/㎡)">
              <el-input :value="modifyRentDetails.dailyRent" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="收费周期">
              <el-select v-model="modifyForm.rentCycle" style="width: 100%" @change="calcModifyRent">
                <el-option label="月" :value="1" />
                <el-option label="季" :value="2" />
                <el-option label="半年" :value="3" />
                <el-option label="年" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每期租金 (元)">
              <el-input :value="modifyRentDetails.periodRent" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="押金 (元)">
              <el-input v-model="modifyForm.rentDeposit" type="number" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="首次收费日">
              <el-date-picker v-model="modifyForm.rentFirstBillDate" type="date" placeholder="选择" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="增长起始年">
              <el-select v-model="modifyForm.rentGrowthYear" placeholder="不增长" clearable style="width: 100%">
                <el-option v-for="y in growthYearOptions" :key="y.value" :label="y.label" :value="y.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="增长率 (%)">
              <el-input v-model="modifyForm.rentGrowthRate" type="number" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="modifyForm.note" type="textarea" :rows="2" placeholder="请输入备注信息" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">物业费板块</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="月/平方 (元)">
              <el-input v-model="modifyForm.propertyFeePerSqm" type="number" @input="calcModifyProperty" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="月物业费 (元)">
              <el-input v-model="modifyForm.propertyFeeTotal" type="number" @input="calcModifyPropertyFromTotal" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="收费周期">
              <el-select v-model="modifyForm.propertyFeeCycle" style="width: 100%" @change="calcModifyPropertyPeriod">
                <el-option label="月" :value="1" />
                <el-option label="季" :value="2" />
                <el-option label="半年" :value="3" />
                <el-option label="年" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每期物业费 (元)">
              <el-input :value="modifyRentDetails.periodProperty" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="电费押金 (元)">
              <el-input v-model="modifyForm.propertyFeeDeposit" type="number" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="首次收费日">
              <el-date-picker v-model="modifyForm.propertyFeeFirstBillDate" type="date" placeholder="选择" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="增长起始年">
              <el-select v-model="modifyForm.propertyFeeGrowthYear" placeholder="不增长" clearable style="width: 100%">
                <el-option v-for="y in growthYearOptions" :key="y.value" :label="y.label" :value="y.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="增长率 (%)">
              <el-input v-model="modifyForm.propertyFeeGrowthRate" type="number" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">
          费用计划预览
          <el-button type="primary" size="small" @click="generateModifyPreview" style="margin-left: 20px">生成预览</el-button>
        </el-divider>
        
        <el-table :data="modifyPreviewBills" border stripe max-height="300" v-if="modifyPreviewBills.length > 0" style="width: 100%">
          <el-table-column prop="feeType" label="费用类型" width="100">
            <template #default="{ row }">{{ feeTypeMap[row.feeType] }}</template>
          </el-table-column>
          <el-table-column prop="year" label="年份" width="80" />
          <el-table-column prop="period" label="收费周期" width="140" />
          <el-table-column label="应收日期" width="120">
            <template #default="{ row }">
              <el-date-picker v-model="row.dueDate" type="date" size="small" style="width: 110px" value-format="YYYY-MM-DD" />
            </template>
          </el-table-column>
          <el-table-column label="应收金额 (元)" width="120">
            <template #default="{ row }">
              <el-input v-model="row.dueAmount" type="number" size="small" style="width: 110px" />
            </template>
          </el-table-column>
          <el-table-column prop="note" label="备注">
            <template #default="{ row }">
              <el-input v-model="row.note" size="small" />
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="请点击'生成预览'查看费用计划" :image-size="80" />
      </el-form>
      <template #footer>
        <el-button @click="modifyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmModify" :disabled="modifyPreviewBills.length === 0">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRentals, getRental, terminateRental, modifyRental, getDictionaryByType, exportRentals } from '@/api'
import { formatDate, formatMoney } from '@/utils/format'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const terminateDialogVisible = ref(false)
const terminateDate = ref('')
const currentRentalId = ref(null)
const currentRental = ref(null)
const modifyDialogVisible = ref(false)
const modifyFormRef = ref()
const modifyForm = ref({})
const modifyPreviewBills = ref([])
const growthYearOptions = ref([])
const modifyRentDetails = ref({ dailyRent: 0, periodRent: 0, periodProperty: 0 })

const searchForm = ref({ keyword: '', status: '' })
const pagination = ref({ page: 1, pageSize: 10, total: 0 })

const feeTypeMap = { 1: '租金', 2: '物业费', 3: '水费', 4: '电费', 5: '其他' }

const fetchDictionaries = async () => {
  try {
    const res = await getDictionaryByType('growth_year')
    growthYearOptions.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getRentals({ page: pagination.value.page, pageSize: pagination.value.pageSize, ...searchForm.value })
    tableData.value = res.data.list
    pagination.value.total = res.data.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.value = { keyword: '', status: '' }
  handleSearch()
}

const handleExport = async () => {
  try {
    const res = await exportRentals(searchForm.value)
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `出租管理_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error(error)
    ElMessage.error('导出失败')
  }
}

const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  fetchData()
}

const handleCurrentChange = (page) => {
  pagination.value.page = page
  fetchData()
}

const handleViewBills = (row) => {
  router.push({ path: '/fee/bill', query: { rentalId: row.id } })
}

const handleTerminate = (row) => {
  currentRentalId.value = row.id
  currentRental.value = row
  terminateDate.value = ''
  terminateDialogVisible.value = true
}

const confirmTerminate = async () => {
  if (!terminateDate.value) {
    ElMessage.warning('请选择终止日期')
    return
  }
  ElMessageBox.confirm('确定终止该合同？终止后的未收账单将作废。', '提示', { type: 'warning' }).then(async () => {
    try {
      await terminateRental(currentRentalId.value, { terminateDate: terminateDate.value })
      ElMessage.success('终止成功')
      terminateDialogVisible.value = false
      fetchData()
    } catch (error) {
      console.error(error)
    }
  })
}

const handleModify = async (row) => {
  currentRentalId.value = row.id
  currentRental.value = row
  try {
    const res = await getRental(row.id)
    const data = res.data
    modifyForm.value = {
      endDate: formatDate(data.endDate),
      rentTotal: data.rentTotal,
      rentCycle: data.rentCycle,
      rentDeposit: data.rentDeposit || 0,
      rentFirstBillDate: formatDate(data.rentFirstBillDate),
      rentGrowthYear: null,
      rentGrowthRate: 5,
      propertyFeePerSqm: data.propertyFeePerSqm || 0,
      propertyFeeTotal: data.propertyFeeTotal,
      propertyFeeCycle: data.propertyFeeCycle,
      propertyFeeDeposit: data.propertyFeeDeposit || 0,
      propertyFeeFirstBillDate: formatDate(data.propertyFeeFirstBillDate),
      propertyFeeGrowthYear: null,
      propertyFeeGrowthRate: 5,
      note: data.note || ''
    }
    calcModifyRent()
    calcModifyProperty()
    modifyPreviewBills.value = []
    modifyDialogVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

const calcModifyRent = () => {
  const area = currentRental.value?.room?.area || 0
  const yearRent = parseFloat(modifyForm.value.rentTotal) || 0
  modifyRentDetails.value.dailyRent = area > 0 ? (yearRent / 365 / area).toFixed(4) : 0
  
  const cycleMonths = { 1: 1, 2: 3, 3: 6, 4: 12 }
  const months = cycleMonths[modifyForm.value.rentCycle] || 1
  modifyRentDetails.value.periodRent = (yearRent * months / 12).toFixed(2)
}

const calcModifyProperty = () => {
  const area = currentRental.value?.room?.area || 0
  modifyForm.value.propertyFeeTotal = ((parseFloat(modifyForm.value.propertyFeePerSqm) || 0) * area).toFixed(2)
  calcModifyPropertyPeriod()
}

const calcModifyPropertyFromTotal = () => {
  const area = currentRental.value?.room?.area || 0
  if (area > 0) {
    modifyForm.value.propertyFeePerSqm = ((parseFloat(modifyForm.value.propertyFeeTotal) || 0) / area).toFixed(2)
  }
  calcModifyPropertyPeriod()
}

const calcModifyPropertyPeriod = () => {
  const cycleMonths = { 1: 1, 2: 3, 3: 6, 4: 12 }
  const months = cycleMonths[modifyForm.value.propertyFeeCycle] || 1
  modifyRentDetails.value.periodProperty = ((parseFloat(modifyForm.value.propertyFeeTotal) || 0) * months).toFixed(2)
}

const generateModifyPreview = () => {
  if (!currentRental.value) {
    ElMessage.warning('未找到出租记录')
    return
  }
  
  const bills = []
  const startDate = new Date(currentRental.value.startDate)
  const endDate = new Date(modifyForm.value.endDate || currentRental.value.endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const rentFirstBillDate = new Date(modifyForm.value.rentFirstBillDate || currentRental.value.rentFirstBillDate)
  const propertyFirstBillDate = new Date(modifyForm.value.propertyFeeFirstBillDate || currentRental.value.propertyFeeFirstBillDate)
  
  if (rentFirstBillDate <= today) {
    ElMessage.warning('租金首次收费日应大于今天')
    return
  }
  
  if (propertyFirstBillDate <= today) {
    ElMessage.warning('物业费首次收费日应大于今天')
    return
  }
  
  const cycleMonthsMap = { 1: 1, 2: 3, 3: 6, 4: 12 }
  const rentMonths = cycleMonthsMap[modifyForm.value.rentCycle || currentRental.value.rentCycle] || 1
  const propertyMonths = cycleMonthsMap[modifyForm.value.propertyFeeCycle || currentRental.value.propertyFeeCycle] || 1
  
  const rentGrowthYear = modifyForm.value.rentGrowthYear
  const rentGrowthRate = parseFloat(modifyForm.value.rentGrowthRate) || 0
  const propertyGrowthYear = modifyForm.value.propertyFeeGrowthYear
  const propertyGrowthRate = parseFloat(modifyForm.value.propertyFeeGrowthRate) || 0
  
  const yearRentTotal = parseFloat(modifyForm.value.rentTotal) || currentRental.value.rentTotal
  const yearPropertyTotal = (parseFloat(modifyForm.value.propertyFeeTotal) || currentRental.value.propertyFeeTotal) * 12
  const rentPerPeriod = yearRentTotal / (12 / rentMonths)
  const propertyPerPeriod = yearPropertyTotal / (12 / propertyMonths)
  
  const generatePeriods = (baseDate, finalDate, months) => {
    const periods = []
    let periodStart = new Date(baseDate)
    
    while (periodStart <= finalDate) {
      let periodEnd = new Date(periodStart)
      periodEnd.setMonth(periodEnd.getMonth() + months)
      periodEnd.setDate(periodEnd.getDate() - 1)
      
      if (periodEnd > finalDate) {
        periodEnd = new Date(finalDate)
      }
      
      periods.push({ start: new Date(periodStart), end: new Date(periodEnd) })
      
      periodStart = new Date(periodEnd)
      periodStart.setDate(periodStart.getDate() + 1)
    }
    
    return periods
  }
  
  const rentPeriods = generatePeriods(startDate, endDate, rentMonths)
  const propertyPeriods = generatePeriods(startDate, endDate, propertyMonths)
  
  const calcDueDates = (firstBillDate, count, months) => {
    const dates = []
    let dueDate = new Date(firstBillDate)
    
    for (let i = 0; i < count; i++) {
      dates.push(new Date(dueDate))
      dueDate.setMonth(dueDate.getMonth() + months)
    }
    
    return dates
  }
  
  const rentDueDates = calcDueDates(rentFirstBillDate, rentPeriods.length, rentMonths)
  const propertyDueDates = calcDueDates(propertyFirstBillDate, propertyPeriods.length, propertyMonths)
  
  rentPeriods.forEach((period, index) => {
    const dueDate = rentDueDates[index]
    if (dueDate && dueDate >= today && dueDate <= endDate) {
      const year = Math.floor((period.start - startDate) / (365 * 24 * 60 * 60 * 1000)) + 1
      const rentMultiplier = rentGrowthYear && year >= rentGrowthYear ? Math.pow(1 + rentGrowthRate / 100, year - rentGrowthYear + 1) : 1
      
      bills.push({
        feeType: 1,
        year,
        period: formatDate(period.start) + ' ~ ' + formatDate(period.end),
        dueDate: formatDate(dueDate),
        dueAmount: parseFloat((rentPerPeriod * rentMultiplier).toFixed(2)),
        note: ''
      })
    }
  })
  
  propertyPeriods.forEach((period, index) => {
    const dueDate = propertyDueDates[index]
    if (dueDate && dueDate >= today && dueDate <= endDate) {
      const year = Math.floor((period.start - startDate) / (365 * 24 * 60 * 60 * 1000)) + 1
      const propertyMultiplier = propertyGrowthYear && year >= propertyGrowthYear ? Math.pow(1 + propertyGrowthRate / 100, year - propertyGrowthYear + 1) : 1
      
      bills.push({
        feeType: 2,
        year,
        period: formatDate(period.start) + ' ~ ' + formatDate(period.end),
        dueDate: formatDate(dueDate),
        dueAmount: parseFloat((propertyPerPeriod * propertyMultiplier).toFixed(2)),
        note: ''
      })
    }
  })
  
  bills.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  
  modifyPreviewBills.value = bills
  if (bills.length > 0) {
    ElMessage.success('已生成 ' + bills.length + ' 条费用计划')
  } else {
    ElMessage.warning('未生成费用计划，请检查首次收费日是否大于今天')
  }
}

const confirmModify = async () => {
  if (modifyPreviewBills.value.length === 0) {
    ElMessage.warning('请先生成费用计划预览')
    return
  }
  ElMessageBox.confirm('确认修改后，未收取的费用将按新条款重新生成，原未收取的作废。是否继续？', '提示', { type: 'warning' }).then(async () => {
    try {
      await modifyRental(currentRentalId.value, {
        ...modifyForm.value,
        bills: modifyPreviewBills.value
      })
      ElMessage.success('修改成功')
      modifyDialogVisible.value = false
      fetchData()
    } catch (error) {
      console.error(error)
    }
  })
}

onMounted(() => {
  fetchDictionaries()
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
.cell-content {
  padding: 6px 0;
  line-height: 1.8;
  font-size: 13px;
}
.cell-content .label {
  color: #909399;
  font-size: 13px;
}
.fee-cell .fee {
  color: #e6a23c;
  font-weight: 600;
  font-size: 14px;
}
.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
.modify-form .el-divider {
  margin: 20px 0;
}
.modify-form .el-form-item {
  margin-bottom: 18px;
}
</style>
