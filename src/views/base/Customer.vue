<template>
  <div class="page-container">
    <el-card>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="客户简称/公司名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新增客户</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="客户简称" />
        <el-table-column prop="companyName" label="公司名称" />
        <el-table-column prop="contactPerson" label="联系人" />
        <el-table-column prop="contactPhone" label="联系电话" />
        <el-table-column prop="taxNo" label="税号" />
        <el-table-column label="创建时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="客户简称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="公司名称" prop="companyName">
          <el-input v-model="form.companyName" />
        </el-form-item>
        <el-form-item label="税务登记号" prop="taxNo">
          <el-input v-model="form.taxNo" />
        </el-form-item>
        <el-form-item label="开户银行" prop="bankName">
          <el-input v-model="form.bankName" />
        </el-form-item>
        <el-form-item label="银行账号" prop="bankAccount">
          <el-input v-model="form.bankAccount" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="form.contactPerson" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="form.contactPhone" />
        </el-form-item>
        <el-form-item label="备用联系人" prop="backupContact">
          <el-input v-model="form.backupContact" />
        </el-form-item>
        <el-form-item label="备用联系电话" prop="backupPhone">
          <el-input v-model="form.backupPhone" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '@/api'
import { formatDate } from '@/utils/format'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增客户')
const formRef = ref()

const searchForm = ref({ keyword: '' })
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const form = ref({
  id: null, name: '', companyName: '', taxNo: '', bankName: '', bankAccount: '',
  contactPerson: '', contactPhone: '', backupContact: '', backupPhone: '', remark: ''
})
const rules = {
  name: [{ required: true, message: '请输入客户简称', trigger: 'blur' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getCustomers({ page: pagination.value.page, pageSize: pagination.value.pageSize, keyword: searchForm.value.keyword })
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
  searchForm.value = { keyword: '' }
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  fetchData()
}

const handleCurrentChange = (page) => {
  pagination.value.page = page
  fetchData()
}

const handleAdd = () => {
  dialogTitle.value = '新增客户'
  form.value = {
    id: null, name: '', companyName: '', taxNo: '', bankName: '', bankAccount: '',
    contactPerson: '', contactPhone: '', backupContact: '', backupPhone: '', remark: ''
  }
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  dialogTitle.value = '编辑客户'
  try {
    const res = await getCustomer(row.id)
    form.value = { ...res.data }
    dialogVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

const handleSave = async () => {
  const valid = await formRef.value.validate()
  if (!valid) return
  try {
    if (form.value.id) {
      await updateCustomer(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await createCustomer(form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (row) => {
  ElMessageBox.confirm('确定删除该客户？', '提示', { type: 'warning' }).then(async () => {
    try {
      await deleteCustomer(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      console.error(error)
    }
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.search-form {
  margin-bottom: 20px;
}
.el-pagination {
  margin-top: 20px;
}
</style>