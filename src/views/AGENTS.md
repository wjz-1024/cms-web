# Vue 3 组件开发指南

**位置**: `cms-web/src/views/`  
**技术栈**: Vue 3 + Composition API + Element Plus + Pinia

## 目录结构

```
src/views/
├── Login.vue           # 登录页面
├── Layout.vue          # 主布局（侧边栏 + 头部）
├── Dashboard.vue       # 首页仪表盘
├── system/             # 系统管理模块
│   ├── User.vue       # 用户管理
│   ├── Role.vue       # 角色管理
│   ├── Module.vue     # 模块管理
│   ├── Dictionary.vue # 字典管理
│   └── Log.vue        # 日志管理
├── base/               # 基础数据模块
│   ├── Company.vue    # 公司管理
│   ├── Room.vue       # 房间管理
│   └── Customer.vue   # 客户管理
└── fee/                # 收费管理模块
    ├── Rental.vue     # 出租管理
    └── Bill.vue       # 费用计划
```

## 组件命名规范

| 类型 | 命名规则 | 示例 |
|------|---------|------|
| 页面组件 | PascalCase.vue | `User.vue`, `RoomManagement.vue` |
| 布局组件 | PascalCase.vue | `Layout.vue` |
| 按功能模块组织 | 小写目录 | `system/`, `base/`, `fee/` |

## 标准组件结构

```vue
<template>
  <div class="page-container">
    <el-card>
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <!-- 搜索字段 -->
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <!-- 表单字段 -->
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
import { getList, getById, create, update, remove } from '@/api'

// ========== 状态 ==========
const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()

const searchForm = ref({ keyword: '' })
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const form = ref({ id: null, ... })

const rules = {
  // 验证规则
}

// ========== API 调用 ==========
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getList({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      ...searchForm.value
    })
    tableData.value = res.data.list
    pagination.value.total = res.data.total
  } catch (error) {
    console.error(error)
    ElMessage.error('获取失败')
  } finally {
    loading.value = false
  }
}

// ========== 事件处理 ==========
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
  dialogTitle.value = '新增'
  form.value = { id: null, ... }
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  dialogTitle.value = '编辑'
  try {
    const res = await getById(row.id)
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
      await update(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await create(form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (row) => {
  ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' }).then(async () => {
    try {
      await remove(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      console.error(error)
    }
  })
}

// ========== 生命周期 ==========
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}
.search-form {
  margin-bottom: 20px;
}
.el-pagination {
  margin-top: 20px;
}
</style>
```

## 代码规范

### 导入顺序
```javascript
import { ref, onMounted } from 'vue'           // Vue 核心
import { ElMessage, ElMessageBox } from 'element-plus'  // Element Plus
import { useRouter } from 'vue-router'        // Vue Router
import { useUserStore } from '@/stores/user'  // Pinia stores
import { getList } from '@/api'               // API 调用
import { formatDate } from '@/utils/format'   // 工具函数
```

### 状态命名
```javascript
const loading = ref(false)           // 加载状态
const tableData = ref([])            // 表格数据
const dialogVisible = ref(false)     // 弹窗显示
const searchForm = ref({})           // 搜索表单
const form = ref({})                 // 编辑表单
const pagination = ref({})           // 分页参数
```

### 事件处理命名
```javascript
const handleSearch = () => {}        // 搜索
const handleReset = () => {}         // 重置
const handleAdd = () => {}           // 新增
const handleEdit = async (row) => {} // 编辑
const handleSave = async () => {}    // 保存
const handleDelete = async (row) => {} // 删除
const handleSizeChange = (size) => {}  // 分页大小变化
const handleCurrentChange = (page) => {} // 页码变化
```

## API 调用规范

```javascript
// ✅ 正确：使用封装的 request（包含认证 token）
import { getUsers } from '@/api'
const res = await getUsers({ page: 1, pageSize: 10 })

// ❌ 错误：直接使用 axios（绕过认证）
import axios from 'axios'
const res = await axios.get('/api/users')
```

## 表单验证规范

```javascript
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^\d{11}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

// 提交前验证
const handleSave = async () => {
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交逻辑
}
```

## 常用模式

### 分页查询模式
```javascript
const pagination = ref({ page: 1, pageSize: 10, total: 0 })

const fetchData = async () => {
  const res = await getList({
    page: pagination.value.page,
    pageSize: pagination.value.pageSize
  })
  tableData.value = res.data.list
  pagination.value.total = res.data.total
}

// 分页事件
const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  fetchData()
}
const handleCurrentChange = (page) => {
  pagination.value.page = page
  fetchData()
}
```

### 弹窗编辑模式
```javascript
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const form = ref({ id: null, ... })

const handleAdd = () => {
  dialogTitle.value = '新增'
  form.value = { id: null, ... }
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  dialogTitle.value = '编辑'
  const res = await getById(row.id)
  form.value = { ...res.data }
  dialogVisible.value = true
}

const handleSave = async () => {
  const valid = await formRef.value.validate()
  if (!valid) return
  if (form.value.id) {
    await update(form.value.id, form.value)
  } else {
    await create(form.value)
  }
  dialogVisible.value = false
  fetchData()
}
```

### 删除确认模式
```javascript
const handleDelete = async (row) => {
  ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' }).then(async () => {
    await remove(row.id)
    ElMessage.success('删除成功')
    fetchData()
  })
}
```

## 样式规范

```vue
<style scoped>
.page-container {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
```

## 模块划分

### system/ - 系统管理
- `User.vue` - 用户管理（CRUD + 角色分配 + 密码重置）
- `Role.vue` - 角色管理（CRUD + 权限配置）
- `Module.vue` - 模块管理（CRUD + 树形结构）
- `Dictionary.vue` - 字典管理（CRUD + 类型管理）
- `Log.vue` - 日志管理（登录日志 + 操作日志）

### base/ - 基础数据
- `Company.vue` - 公司管理（CRUD）
- `Room.vue` - 房间管理（CRUD + 出租状态 + 计算逻辑）
- `Customer.vue` - 客户管理（CRUD + 联系信息）

### fee/ - 收费管理
- `Rental.vue` - 出租管理（CRUD + 费用预览 + 终止逻辑）
- `Bill.vue` - 费用计划（查询 + 收款登记 + 违约金计算）

## 特殊组件注意事项

### Room.vue - 复杂计算逻辑
- 包含出租登记弹窗（租金/物业费计算）
- 费用计划预览功能
- 租金增长计算逻辑
- 需要特别注意：`calcRentPeriod()`, `calcPropertyPeriod()` 等计算函数

### Rental.vue - 状态管理
- 出租状态流转（生效 → 终止）
- 费用状态管理（待收 → 已收/逾期/终止）
- 修改功能需要重新生成未收取的费用计划

## 开发注意事项

1. **所有 API 调用必须通过 `@/api` 导入** - 确保认证 token 被包含
2. **使用 `ElMessage` 和 `ElMessageBox`** - 保持用户体验一致
3. **所有异步操作必须 try-catch** - 避免未捕获错误
4. **表单提交前必须验证** - `await formRef.value.validate()`
5. **删除操作必须确认** - 使用 `ElMessageBox.confirm`
6. **分页参数必须验证** - `Math.max(1, page)`, `Math.min(100, pageSize)`

## 相关文档

- 根目录 `/AGENTS.md` - 项目总体开发指南
- 根目录 `/README.md` - 项目说明文档
- 根目录 `/TESTING_GUIDE.md` - 测试编写指南
