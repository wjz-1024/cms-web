<template>
  <div class="page-container">
    <el-card>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="角色名称/编码" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新增角色</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" />
        <el-table-column prop="code" label="角色编码" />
        <el-table-column prop="isSystem" label="系统预设" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isSystem === 1 ? 'warning' : 'info'">
              {{ row.isSystem === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="userCount" label="用户数" width="100" />
        <el-table-column prop="remark" label="备注" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)" v-if="row.isSystem !== 1">删除</el-button>
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
        <el-form-item label="权限模块" prop="moduleIds">
          <el-tree
            ref="treeRef"
            :data="moduleTree"
            show-checkbox
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            default-expand-all
          />
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
import { getRoles, getRole, createRole, updateRole, deleteRole, getModuleTree } from '@/api'

const loading = ref(false)
const tableData = ref([])
const moduleTree = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增角色')
const formRef = ref()
const treeRef = ref()

const searchForm = ref({ keyword: '' })
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const form = ref({ id: null, name: '', code: '', remark: '', moduleIds: [] })
const rules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getRoles({ page: pagination.value.page, pageSize: pagination.value.pageSize, keyword: searchForm.value.keyword })
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

const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  fetchData()
}

const handleCurrentChange = (page) => {
  pagination.value.page = page
  fetchData()
}

const handleAdd = () => {
  dialogTitle.value = '新增角色'
  form.value = { id: null, name: '', code: '', remark: '', moduleIds: [] }
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  dialogTitle.value = '编辑角色'
  try {
    const res = await getRole(row.id)
    form.value = { ...res.data, moduleIds: res.data.modules?.map(m => m.id) || [] }
    dialogVisible.value = true
    if (treeRef.value) {
      treeRef.value.setCheckedKeys(form.value.moduleIds)
    }
  } catch (error) {
    console.error(error)
  }
}

const handleSave = async () => {
  const valid = await formRef.value.validate()
  if (!valid) return
  form.value.moduleIds = treeRef.value?.getCheckedKeys() || []
  try {
    if (form.value.id) {
      await updateRole(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await createRole(form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (row) => {
  ElMessageBox.confirm('确定删除该角色？', '提示', { type: 'warning' }).then(async () => {
    try {
      await deleteRole(row.id)
      ElMessage.success('删除成功')
      fetchData()
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
.el-pagination {
  margin-top: 20px;
}
</style>