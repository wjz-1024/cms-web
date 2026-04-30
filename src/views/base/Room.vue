<template>
  <div class="page-container">
    <el-card>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="公司">
          <el-select v-model="searchForm.companyId" placeholder="请选择" clearable style="width: 150px">
            <el-option v-for="c in companies" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="楼栋">
          <el-input v-model="searchForm.building" clearable style="width: 100px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 100px">
            <el-option label="空置" value="0" />
            <el-option label="出租" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新增房间</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="tableData" v-loading="loading" border stripe @sort-change="handleSortChange" style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="companyName" label="所属公司" width="120" sortable="custom" />
        <el-table-column label="位置" width="200" sortable="custom">
          <template #default="{ row }">
            <span style="font-weight: 600">{{ row.building }}-{{ row.floor }}-{{ row.roomNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="area" label="面积" width="80">
          <template #default="{ row }">{{ row.area }}㎡</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '出租' : '空置' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="承租人" min-width="120">
          <template #default="{ row }">
            <div v-if="row.rental" style="font-weight: 600">
              {{ row.rental.customerName }}
            </div>
            <div v-else style="color: #909399">-</div>
          </template>
        </el-table-column>
        <el-table-column label="租金" min-width="130">
          <template #default="{ row }">
            <div v-if="row.rental" class="fee-info">
              <div class="fee-highlight"><span style="color:#909399;font-size:12px">日/㎡：</span><span class="fee">{{ (row.rental.rentTotal / 365 / row.area).toFixed(4) }}</span></div>
              <div class="fee-detail"><span style="color:#909399;font-size:12px">月：</span><span>{{ formatMoney(row.rental.rentTotal / 12) }}</span><span style="color:#909399;font-size:12px;margin-left:8px">年：</span><span>{{ formatMoney(row.rental.rentTotal) }}</span></div>
            </div>
            <div v-else style="color: #909399">-</div>
          </template>
        </el-table-column>
        <el-table-column label="物业费" min-width="130">
          <template #default="{ row }">
            <div v-if="row.rental" class="fee-info">
              <div class="fee-highlight"><span style="color:#909399;font-size:12px">月/㎡：</span><span class="fee">{{ formatMoney(row.rental.propertyFeeTotal / row.area) }}</span></div>
              <div class="fee-detail"><span style="color:#909399;font-size:12px">月：</span><span>{{ formatMoney(row.rental.propertyFeeTotal) }}</span><span style="color:#909399;font-size:12px;margin-left:8px">年：</span><span>{{ formatMoney(row.rental.propertyFeeTotal * 12) }}</span></div>
            </div>
            <div v-else style="color: #909399">-</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="handleRental(row)" v-if="row.status === 0">出租</el-button>
            <el-button type="primary" link size="small" @click="handleViewRental(row)" v-if="row.status === 1">详情</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)" v-if="row.status === 0">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="edit-form">
        <el-form-item label="所属公司" prop="companyId">
          <el-select v-model="form.companyId" placeholder="请选择" style="width: 100%">
            <el-option v-for="c in companies" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="楼栋" prop="building">
          <el-select v-model="form.building" placeholder="请选择" style="width: 100%">
            <el-option v-for="b in buildingOptions" :key="b.value" :label="b.label" :value="b.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="楼层" prop="floor">
          <el-input v-model="form.floor" placeholder="请输入楼层" />
        </el-form-item>
        <el-form-item label="房号" prop="roomNo">
          <el-input v-model="form.roomNo" placeholder="请输入房号" />
        </el-form-item>
        <el-form-item label="面积 (㎡)" prop="area">
          <el-input v-model="form.area" type="number" placeholder="请输入面积" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rentalDialogVisible" title="出租登记" width="950px" top="5vh">
      <el-form ref="rentalFormRef" :model="rentalForm" :rules="rentalRules" label-width="120px" class="rental-form">
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="承租客户" prop="customerId">
              <el-select v-model="rentalForm.customerId" placeholder="请选择" style="width: 100%">
                <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="起租日期" prop="startDate">
              <el-date-picker v-model="rentalForm.startDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="结束日期" prop="endDate">
              <el-date-picker v-model="rentalForm.endDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">租金板块</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="年租金 (元)" prop="rentTotal">
              <el-input v-model="rentalForm.rentTotal" type="number" @input="calcRentDetails" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="日租金 (元/㎡)">
              <el-input v-model="rentDetails.dailyRent" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="收费周期" prop="rentCycle">
              <el-select v-model="rentalForm.rentCycle" style="width: 100%" @change="calcRentDetails">
                <el-option label="月" :value="1" />
                <el-option label="季" :value="2" />
                <el-option label="半年" :value="3" />
                <el-option label="年" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每期租金 (元)">
              <el-input v-model="rentPeriodAmount.rent" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="押金 (元)" prop="rentDeposit">
              <el-input v-model="rentalForm.rentDeposit" type="number" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="首次收费日" prop="rentFirstBillDate">
              <el-date-picker v-model="rentalForm.rentFirstBillDate" type="date" placeholder="选择" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="增长起始年">
              <el-select v-model="rentalForm.rentGrowthYear" placeholder="不增长" clearable style="width: 100%">
                <el-option v-for="y in growthYearOptions" :key="y.value" :label="y.label" :value="y.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="增长率 (%)">
              <el-input v-model="rentalForm.rentGrowthRate" type="number" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="rentalForm.note" type="textarea" :rows="2" placeholder="请输入备注信息" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">物业费板块</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="月/平方 (元)" prop="propertyFeePerSqm">
              <el-input v-model="rentalForm.propertyFeePerSqm" type="number" @input="calcPropertyFromSqm" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="月物业费 (元)" prop="propertyFeeTotal">
              <el-input v-model="rentalForm.propertyFeeTotal" type="number" @input="calcPropertyFromTotal" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="收费周期" prop="propertyFeeCycle">
              <el-select v-model="rentalForm.propertyFeeCycle" style="width: 100%" @change="calcPropertyPeriod">
                <el-option label="月" :value="1" />
                <el-option label="季" :value="2" />
                <el-option label="半年" :value="3" />
                <el-option label="年" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每期物业费 (元)">
              <el-input :value="rentPeriodAmount.property" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="电费押金 (元)" prop="propertyFeeDeposit">
              <el-input v-model="rentalForm.propertyFeeDeposit" type="number" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="首次收费日" prop="propertyFeeFirstBillDate">
              <el-date-picker v-model="rentalForm.propertyFeeFirstBillDate" type="date" placeholder="选择" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="增长起始年">
              <el-select v-model="rentalForm.propertyFeeGrowthYear" placeholder="不增长" clearable style="width: 100%">
                <el-option v-for="y in growthYearOptions" :key="y.value" :label="y.label" :value="y.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="增长率 (%)">
              <el-input v-model="rentalForm.propertyFeeGrowthRate" type="number" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">
          费用计划预览
          <el-button type="primary" size="small" @click="generatePreview" style="margin-left: 20px">生成预览</el-button>
        </el-divider>
        
        <el-table :data="previewBills" border stripe max-height="300" v-if="previewBills.length > 0" style="width: 100%">
          <el-table-column prop="feeType" label="费用类型" width="100">
            <template #default="{ row }">{{ feeTypeMap[row.feeType] }}</template>
          </el-table-column>
          <el-table-column prop="year" label="年份" width="80" />
          <el-table-column prop="period" label="收费周期" width="140" />
          <el-table-column label="应收日期" width="120">
            <template #default="{ row, $index }">
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
        <el-button @click="rentalDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRental" :disabled="previewBills.length === 0">确认保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rentalDetailVisible" title="出租详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="承租客户">{{ rentalDetail.customer?.name }}</el-descriptions-item>
        <el-descriptions-item label="公司名称">{{ rentalDetail.customer?.companyName }}</el-descriptions-item>
        <el-descriptions-item label="起租日期">{{ formatDate(rentalDetail.startDate) }}</el-descriptions-item>
        <el-descriptions-item label="结束日期">{{ formatDate(rentalDetail.endDate) }}</el-descriptions-item>
        <el-descriptions-item label="租金押金">{{ formatMoney(rentalDetail.rentDeposit) }}元</el-descriptions-item>
        <el-descriptions-item label="电费押金">{{ formatMoney(rentalDetail.propertyFeeDeposit) }}元</el-descriptions-item>
        <el-descriptions-item label="月租金">{{ formatMoney(rentalDetail.rentTotal / 12) }}元</el-descriptions-item>
        <el-descriptions-item label="月物业费">{{ formatMoney(rentalDetail.propertyFeeTotal) }}元</el-descriptions-item>
        <el-descriptions-item label="年租金">{{ formatMoney(rentalDetail.rentTotal) }}元</el-descriptions-item>
        <el-descriptions-item label="年物业费">{{ formatMoney(rentalDetail.propertyFeeTotal * 12) }}元</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="rentalDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRooms, getRoom, createRoom, updateRoom, deleteRoom, getAllCompanies, getAllCustomers, createRental, getRoomRental } from '@/api'
import { getDictionaryByType } from '@/api'
import { formatDate, formatMoney } from '@/utils/format'

const loading = ref(false)
const tableData = ref([])
const companies = ref([])
const customers = ref([])
const buildingOptions = ref([])
const floorOptions = ref([])
const growthYearOptions = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增房间')
const formRef = ref()
const rentalDialogVisible = ref(false)
const rentalFormRef = ref()
const currentRoomId = ref(null)
const currentRoom = ref({})
const rentalDetailVisible = ref(false)
const rentalDetail = ref({})
const previewBills = ref([])
const rentPeriodAmount = ref({ rent: 0, property: 0 })
const rentDetails = ref({ dailyRent: 0 })

const searchForm = ref({ companyId: '', building: '', status: '' })
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const sortInfo = ref({ prop: '', order: '' })
const form = ref({ id: null, companyId: '', building: '', floor: 1, roomNo: '', area: 0 })
const rentalForm = ref({
  customerId: '', startDate: '', endDate: '', rentDeposit: 0, rentTotal: 0, rentCycle: 1, 
  rentFirstBillDate: '', rentGrowthYear: null, rentGrowthRate: 5, propertyFeePerSqm: 0,
  propertyFeeTotal: 0, propertyFeeCycle: 1, propertyFeeFirstBillDate: '', 
  propertyFeeGrowthYear: null, propertyFeeGrowthRate: 5, propertyFeeDeposit: 0
})

const feeTypeMap = { 1: '租金', 2: '物业费', 3: '水费', 4: '电费', 5: '其他' }

const rules = {
  companyId: [{ required: true, message: '请选择公司', trigger: 'change' }],
  building: [{ required: true, message: '请选择楼栋', trigger: 'change' }],
  floor: [{ required: true, message: '请选择楼层', trigger: 'change' }],
  roomNo: [{ required: true, message: '请输入房号', trigger: 'blur' }],
  area: [{ required: true, message: '请输入面积', trigger: 'blur' }]
}

const rentalRules = {
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择起租日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
  rentTotal: [{ required: true, message: '请输入年租金', trigger: 'blur' }],
  rentCycle: [{ required: true, message: '请选择收费周期', trigger: 'change' }],
  rentFirstBillDate: [{ required: true, message: '请选择首次收费日期', trigger: 'change' }],
  propertyFeeTotal: [{ required: true, message: '请输入月物业费', trigger: 'blur' }],
  propertyFeeCycle: [{ required: true, message: '请选择收费周期', trigger: 'change' }],
  propertyFeeFirstBillDate: [{ required: true, message: '请选择首次收费日期', trigger: 'change' }],
  propertyFeeDeposit: [{ required: true, message: '请输入电费押金', trigger: 'blur' }]
}

const fetchDictionaries = async () => {
  try {
    const [buildings, floorMax, growthYears] = await Promise.all([
      getDictionaryByType('building'),
      getDictionaryByType('floor_max'),
      getDictionaryByType('growth_year')
    ])
    buildingOptions.value = buildings.data
    const maxFloor = parseInt(floorMax.data[0]?.value || '19')
    floorOptions.value = Array.from({ length: maxFloor }, (_, i) => i + 1)
    growthYearOptions.value = growthYears.data
  } catch (error) {
    console.error(error)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: pagination.value.page, pageSize: pagination.value.pageSize, ...searchForm.value }
    if (sortInfo.value.prop && sortInfo.value.order) {
      params.sortBy = sortInfo.value.prop
      params.sortOrder = sortInfo.value.order === 'ascending' ? 'asc' : 'desc'
    }
    const res = await getRooms(params)
    tableData.value = res.data.list
    pagination.value.total = res.data.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchCompanies = async () => {
  try {
    const res = await getAllCompanies()
    companies.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const fetchCustomers = async () => {
  try {
    const res = await getAllCustomers()
    customers.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const handleSortChange = ({ prop, order }) => {
  sortInfo.value = { prop, order }
  fetchData()
}

const handleSearch = () => { pagination.value.page = 1; fetchData() }
const handleReset = () => { searchForm.value = { companyId: '', building: '', status: '' }; handleSearch() }
const handleSizeChange = (size) => { pagination.value.pageSize = size; fetchData() }
const handleCurrentChange = (page) => { pagination.value.page = page; fetchData() }

const handleAdd = () => {
  dialogTitle.value = '新增房间'
  form.value = { id: null, companyId: '', building: '', floor: '', roomNo: '', area: 0 }
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  dialogTitle.value = '编辑房间'
  try {
    const res = await getRoom(row.id)
    form.value = { ...res.data }
    dialogVisible.value = true
  } catch (error) { console.error(error) }
}

const handleSave = async () => {
  const valid = await formRef.value.validate()
  if (!valid) return
  try {
    if (form.value.id) {
      await updateRoom(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await createRoom(form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (error) { console.error(error) }
}

const handleDelete = async (row) => {
  ElMessageBox.confirm('确定删除该房间？', '提示', { type: 'warning' }).then(async () => {
    try {
      await deleteRoom(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) { console.error(error) }
  })
}

const handleRental = async (row) => {
  currentRoomId.value = row.id
  currentRoom.value = row
  const area = row.area || 0
  rentalForm.value = {
    customerId: '', startDate: '', endDate: '', rentDeposit: 0,
    rentTotal: area * 20 * 12, rentCycle: 1, rentFirstBillDate: '',
    rentGrowthYear: null, rentGrowthRate: 5, propertyFeePerSqm: 2,
    propertyFeeTotal: area * 2, propertyFeeCycle: 1, propertyFeeFirstBillDate: '',
    propertyFeeGrowthYear: null, propertyFeeGrowthRate: 5, propertyFeeDeposit: 0, note: ''
  }
  rentPeriodAmount.value = { rent: 0, property: 0 }
  previewBills.value = []
  calcRentDetails()
  rentalDialogVisible.value = true
}

const calcRentDetails = () => {
  const area = currentRoom.value?.area || 0
  const yearRent = parseFloat(rentalForm.value.rentTotal) || 0
  const dailyRent = area > 0 ? (yearRent / 365 / area).toFixed(4) : 0
  rentDetails.value.dailyRent = dailyRent
  
  const cycleMonths = { 1: 1, 2: 3, 3: 6, 4: 12 }
  const months = cycleMonths[rentalForm.value.rentCycle] || 1
  rentPeriodAmount.value.rent = (yearRent * months / 12).toFixed(2)
}

const calcPropertyPeriod = () => {
  const cycleMonths = { 1: 1, 2: 3, 3: 6, 4: 12 }
  const months = cycleMonths[rentalForm.value.propertyFeeCycle] || 1
  rentPeriodAmount.value.property = (parseFloat(rentalForm.value.propertyFeeTotal) || 0) * months
}

const calcPropertyFromSqm = () => {
  const area = currentRoom.value?.area || 0
  rentalForm.value.propertyFeeTotal = ((parseFloat(rentalForm.value.propertyFeePerSqm) || 0) * area).toFixed(2)
  calcPropertyPeriod()
}

const calcPropertyFromTotal = () => {
  const area = currentRoom.value?.area || 0
  if (area > 0) {
    rentalForm.value.propertyFeePerSqm = ((parseFloat(rentalForm.value.propertyFeeTotal) || 0) / area).toFixed(2)
  }
  calcPropertyPeriod()
}

const generatePreview = () => {
  if (!rentalForm.value.startDate || !rentalForm.value.endDate) {
    ElMessage.warning('请先填写起租和结束日期')
    return
  }
  if (!rentalForm.value.rentTotal || !rentalForm.value.propertyFeeTotal) {
    ElMessage.warning('请填写租金和物业费')
    return
  }
  
  const bills = []
  const startDate = new Date(rentalForm.value.startDate)
  const endDate = new Date(rentalForm.value.endDate)
  const rentFirstBillDate = new Date(rentalForm.value.rentFirstBillDate || rentalForm.value.startDate)
  const propertyFirstBillDate = new Date(rentalForm.value.propertyFeeFirstBillDate || rentalForm.value.startDate)
  const rentGrowthYear = rentalForm.value.rentGrowthYear
  const rentGrowthRate = parseFloat(rentalForm.value.rentGrowthRate) || 0
  const propertyGrowthYear = rentalForm.value.propertyFeeGrowthYear
  const propertyGrowthRate = parseFloat(rentalForm.value.propertyFeeGrowthRate) || 0
  const cycleMonthsMap = { 1: 1, 2: 3, 3: 6, 4: 12 }
  const rentMonths = cycleMonthsMap[rentalForm.value.rentCycle] || 1
  const propertyMonths = cycleMonthsMap[rentalForm.value.propertyFeeCycle] || 1
  
  const yearRentTotal = parseFloat(rentalForm.value.rentTotal)
  const yearPropertyTotal = parseFloat(rentalForm.value.propertyFeeTotal) * 12
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
    if (dueDate && dueDate <= endDate) {
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
    if (dueDate && dueDate <= endDate) {
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
  
  previewBills.value = bills
  if (bills.length > 0) {
    ElMessage.success('已生成 ' + bills.length + ' 条费用计划')
  } else {
    ElMessage.warning('未生成费用计划，请检查日期设置')
  }
}

const handleSaveRental = async () => {
  const valid = await rentalFormRef.value.validate()
  if (!valid) return
  if (previewBills.value.length === 0) {
    ElMessage.warning('请先生成费用计划预览')
    return
  }
  ElMessageBox.confirm('确认保存后将生成实际费用计划，是否继续？', '提示', { type: 'warning' }).then(async () => {
    try {
      await createRental(currentRoomId.value, {
        ...rentalForm.value,
        bills: previewBills.value
      })
      ElMessage.success('出租登记成功')
      rentalDialogVisible.value = false
      previewBills.value = []
      fetchData()
    } catch (error) { 
      console.error(error)
      ElMessage.error('保存失败：' + (error.message || '未知错误'))
    }
  })
}

const handleViewRental = async (row) => {
  try {
    const res = await getRoomRental(row.id)
    rentalDetail.value = res.data || {}
    rentalDetailVisible.value = true
  } catch (error) { 
    console.error(error)
    ElMessage.error('获取出租详情失败')
  }
}

onMounted(() => {
  fetchDictionaries()
  fetchCompanies()
  fetchCustomers()
  fetchData()
})
</script>

<style scoped>
.page-container { padding: 20px; }
.search-form { margin-bottom: 20px; }
.el-pagination { margin-top: 20px; }
.edit-form .el-form-item { margin-bottom: 20px; }
.rental-form .el-divider { margin: 20px 0; }
.rental-form .el-form-item { margin-bottom: 18px; }
.fee-info { line-height: 1.6; }
.fee { color: #e6a23c; font-weight: 600; }
.fee-highlight { margin-bottom: 4px; }
.fee-highlight .fee { font-size: 14px; }
.fee-detail { font-size: 12px; color: #606266; }
</style>
