<template>
  <div class="page-container">
    <el-card>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="模块名称/编码" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新增模块</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="tableData" v-loading="loading" border stripe row-key="id">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="模块名称" />
        <el-table-column prop="code" label="模块编码" />
        <el-table-column prop="path" label="路径" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="父模块" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="moduleTree"
            check-strictly
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="请选择父模块"
            clearable
          />
        </el-form-item>
        <el-form-item label="模块名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="模块编码" prop="code">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="路径" prop="path">
          <el-input v-model="form.path" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
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
import { getModules, getModule, createModule, updateModule, deleteModule, getModuleTree } from '@/api'

const loading = ref(false)
const tableData = ref([])
const moduleTree = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增模块')
const formRef = ref()

const searchForm = ref({ keyword: '' })
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const form = ref({ id: null, parentId: null, name: '', code: '', path: '', icon: '', sort: 0, status: 1 })
const rules = {
  name: [{ required: true, message: '请输入模块名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入模块编码', trigger: 'blur' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getModules({ page: pagination.value.page, pageSize: pagination.value.pageSize, keyword: searchForm.value.keyword })
    tableData.value = res.data.list
    pagination.value.total = res.data.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchModules = async () => {
  try {
    const res = await getModuleTree()
    moduleTree.value = res.data
  } catch (error) {
    console.error(error)
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

const handleAdd = () => {
  dialogTitle.value = '新增模块'
  form.value = { id: null, parentId: null, name: '', code: '', path: '', icon: '', sort: 0, status: 1 }
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  dialogTitle.value = '编辑模块'
  try {
    const res = await getModule(row.id)
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
      await updateModule(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await createModule(form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
    fetchModules()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (row) => {
  ElMessageBox.confirm('确定删除该模块？', '提示', { type: 'warning' }).then(async () => {
    try {
      await deleteModule(row.id)
      ElMessage.success('删除成功')
      fetchData()
      fetchModules()
    } catch (error) {
      console.error(error)
    }
  })
}

onMounted(() => {
  fetchData()
  fetchModules()
})
</script>

<style scoped>
.search-form {
  margin-bottom: 20px;
}
</style>