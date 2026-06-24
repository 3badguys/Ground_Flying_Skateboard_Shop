<template>
  <div class="users-page">
    <div class="users-header">
      <h3>用户管理</h3>
      <div class="header-actions">
        <el-button
          v-if="isSuperAdmin"
          type="warning"
          :icon="Plus"
          @click="openCreateDialog('ADMIN')"
        >
          添加管理员
        </el-button>
        <el-button
          type="primary"
          :icon="Plus"
          @click="openStudentSelectDialog"
        >
          添加用户
        </el-button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户名或手机号"
        clearable
        style="width: 280px"
      />
    </div>

    <el-table :data="filteredUsers" stripe v-loading="loading">
      <el-table-column prop="username" label="用户名" width="140">
        <template #default="{ row }">
          {{ row.username || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="140">
        <template #default="{ row }">
          {{ row.phone || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="角色" width="110">
        <template #default="{ row }">
          <el-tag :type="roleTag(row.role)" size="small">{{ roleLabel(row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="240">
        <template #default="{ row }">
          <el-button size="small" @click="editUser(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          <el-button
            v-if="canViewPwd(row)"
            size="small"
            type="info"
            @click="handleViewPassword(row)"
          >
            密码
          </el-button>
          <el-button
            v-if="row.role === 'USER' && row.phone"
            size="small"
            type="success"
            @click="handleViewStudents(row)"
          >
            学生
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建管理员弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="420px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
        <el-form-item label="用户名" prop="username" v-if="createForm.role === 'ADMIN'">
          <el-input v-model="createForm.username" placeholder="字母开头" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createForm.password" type="password" show-password placeholder="密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 选择学生手机号创建用户 -->
    <el-dialog
      v-model="studentDialogVisible"
      title="添加用户 — 通过学生手机号"
      width="700px"
    >
      <div class="student-filter">
        <el-input
          v-model="studentKeyword"
          placeholder="搜索学生姓名或手机号"
          clearable
          style="width: 280px"
        />
      </div>
      <el-table
        :data="filteredStudents"
        stripe
        size="small"
        max-height="360"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="grade" label="年级" width="90" />
        <el-table-column prop="gender" label="性别" width="70" />
      </el-table>

      <el-divider />

      <el-form :model="userForm" label-width="100px" v-if="selectedPhones.length > 0">
        <el-form-item label="密码">
          <el-input v-model="userForm.password" type="password" show-password placeholder="留空则默认为手机号后6位" />
        </el-form-item>
        <el-form-item label="已选手机号">
          <el-tag v-for="p in selectedPhones" :key="p" size="small" style="margin-right: 8px">{{ p }}</el-tag>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="studentDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="savingBatch"
          :disabled="selectedPhones.length === 0"
          @click="handleBatchCreate"
        >
          创建 {{ selectedPhones.length }} 个用户
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑用户弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑用户" width="420px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="用户名" v-if="editForm.role !== 'USER'">
          <el-input
            v-model="editForm.username"
            placeholder="用户名"
            :disabled="editForm.role === 'SUPER_ADMIN'"
          />
        </el-form-item>
        <el-form-item label="手机号" v-if="editForm.role === 'USER'">
          <el-input v-model="editForm.phone" placeholder="手机号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="editForm.password"
            type="password"
            show-password
            :placeholder="editForm.role === 'SUPER_ADMIN' ? '超级管理员不允许修改密码' : '留空则不修改'"
            :disabled="editForm.role === 'SUPER_ADMIN'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleEditSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 查看关联学生弹窗 -->
    <el-dialog
      v-model="studentsDialogVisible"
      :title="`关联学生 — ${studentViewPhone}`"
      width="600px"
    >
      <el-table :data="viewStudents" stripe size="small" v-loading="studentsLoading">
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="grade" label="年级" width="100" />
        <el-table-column prop="gender" label="性别" width="80" />
        <el-table-column prop="phone" label="手机号" width="140" />
      </el-table>
      <el-empty v-if="!studentsLoading && !viewStudents.length" description="暂无关联学生" />
    </el-dialog>

    <!-- 查看密码弹窗 -->
    <el-dialog v-model="pwdDialogVisible" title="密码" width="360px">
      <p v-if="pwdLoading">加载中...</p>
      <p v-else><strong>密码哈希：</strong> {{ pwdHash }}</p>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getUsers, createUser, updateUser, deleteUser } from '../../api/auth'
import { getStudents } from '../../api/student'
import request from '../../api/request'
import { currentUser } from '../../utils/auth'
import type { UserInfo } from '../../utils/auth'

const isSuperAdmin = computed(() => currentUser.value?.role === 'SUPER_ADMIN')

function roleLabel(role: string) {
  switch (role) {
    case 'SUPER_ADMIN': return '超级管理员'
    case 'ADMIN': return '管理员'
    default: return '普通用户'
  }
}

function roleTag(role: string) {
  switch (role) {
    case 'SUPER_ADMIN': return 'danger'
    case 'ADMIN': return 'warning'
    default: return 'info'
  }
}

function canViewPwd(row: UserInfo) {
  const role = currentUser.value?.role
  if (role === 'SUPER_ADMIN') return true
  if (role === 'ADMIN' && row.role === 'USER') return true
  return false
}

// ── 用户列表 + 搜索 ────────────────────────────────────────
const users = ref<UserInfo[]>([])
const loading = ref(false)
const searchKeyword = ref('')

const filteredUsers = computed(() => {
  if (!searchKeyword.value) return users.value
  const kw = searchKeyword.value.toLowerCase()
  return users.value.filter(
    (u) =>
      (u.username && u.username.toLowerCase().includes(kw)) ||
      (u.phone && u.phone.includes(kw)),
  )
})

async function fetchUsers() {
  loading.value = true
  try {
    users.value = await getUsers()
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)

// ── 创建管理员弹窗 ────────────────────────────────────────
const createFormRef = ref<FormInstance>()
const dialogVisible = ref(false)
const dialogTitle = ref('添加管理员')
const saving = ref(false)
const createForm = reactive({
  username: '',
  password: '',
  role: 'ADMIN' as string,
})

const createRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z]/, message: '用户名必须以字母开头', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
}

function openCreateDialog(role: string) {
  dialogTitle.value = role === 'ADMIN' ? '添加管理员' : '添加用户'
  createForm.username = ''
  createForm.password = ''
  createForm.role = role
  createFormRef.value?.resetFields()
  dialogVisible.value = true
}

async function handleCreate() {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await createUser({
      username: createForm.username || undefined,
      password: createForm.password,
      role: createForm.role,
    })
    ElMessage.success('用户已创建')
    dialogVisible.value = false
    fetchUsers()
  } catch { /* handled */ } finally {
    saving.value = false
  }
}

// ── 通过学生手机号创建用户 ────────────────────────────────
const studentDialogVisible = ref(false)
const allStudents = ref<any[]>([])
const existingPhones = ref<Set<string>>(new Set())
const studentKeyword = ref('')
const selectedPhones = ref<string[]>([])
const savingBatch = ref(false)
const userForm = reactive({ password: '' })

// Filter: only students without existing user accounts
const filteredStudents = computed(() => {
  let list = allStudents.value

  // Exclude phones that already have a user
  if (existingPhones.value.size > 0) {
    list = list.filter((s: any) => !existingPhones.value.has(s.phone))
  }

  if (studentKeyword.value) {
    const kw = studentKeyword.value.toLowerCase()
    list = list.filter(
      (s: any) => s.name.includes(kw) || s.phone.includes(kw),
    )
  }

  return list
})

async function openStudentSelectDialog() {
  studentKeyword.value = ''
  selectedPhones.value = []
  userForm.password = ''
  try {
    // Fetch students and users in parallel
    const [studentRes] = await Promise.all([
      getStudents({ page: 1, pageSize: 9999 }),
      fetchUsers(),
    ])
    allStudents.value = (studentRes as any).list || []
    // Build set of phones that already have a user account
    existingPhones.value = new Set(
      users.value.filter((u) => u.phone).map((u) => u.phone!),
    )
  } catch {
    allStudents.value = []
  }
  studentDialogVisible.value = true
}

function handleSelectionChange(rows: any[]) {
  selectedPhones.value = [...new Set(rows.map((r) => r.phone))]
}

async function handleBatchCreate() {
  savingBatch.value = true
  try {
    for (const phone of selectedPhones.value) {
      const password = userForm.password || phone.slice(-6)
      try {
        await createUser({ phone, password, role: 'USER' })
      } catch (e: any) {
        if (e?.message?.includes('already taken') || e?.message?.includes('Conflict')) {
          // skip
        } else {
          throw e
        }
      }
    }
    ElMessage.success(`已创建 ${selectedPhones.value.length} 个用户`)
    studentDialogVisible.value = false
    fetchUsers()
  } catch { /* handled */ } finally {
    savingBatch.value = false
  }
}

// ── 编辑用户 ──────────────────────────────────────────────
const editDialogVisible = ref(false)
const editTargetId = ref(0)
const editForm = reactive({
  username: '',
  phone: '',
  password: '',
  role: '',
})

function editUser(row: UserInfo) {
  editTargetId.value = row.id
  editForm.username = row.username || ''
  editForm.phone = row.phone || ''
  editForm.password = ''
  editForm.role = row.role
  editDialogVisible.value = true
}

async function handleEditSave() {
  saving.value = true
  try {
    const data: Record<string, any> = {}
    if (editForm.username) data.username = editForm.username
    if (editForm.phone) data.phone = editForm.phone
    if (editForm.password) data.password = editForm.password
    await updateUser(editTargetId.value, data)
    ElMessage.success('用户已更新')
    editDialogVisible.value = false
    fetchUsers()
  } catch { /* handled */ } finally {
    saving.value = false
  }
}

// ── 删除用户 ──────────────────────────────────────────────
async function handleDelete(row: UserInfo) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.username || row.phone}" 吗？`,
      '确认删除',
      { type: 'warning' },
    )
  } catch {
    return
  }
  try {
    await deleteUser(row.id)
    ElMessage.success('用户已删除')
    fetchUsers()
  } catch { /* handled */ }
}

// ── 查看关联学生 ──────────────────────────────────────────
const studentsDialogVisible = ref(false)
const studentViewPhone = ref('')
const viewStudents = ref<any[]>([])
const studentsLoading = ref(false)

async function handleViewStudents(row: UserInfo) {
  studentViewPhone.value = row.phone || ''
  studentsDialogVisible.value = true
  studentsLoading.value = true
  viewStudents.value = []
  try {
    const res: any = await request.get(`/users/${row.id}/students`)
    viewStudents.value = res || []
  } catch { /* handled */ } finally {
    studentsLoading.value = false
  }
}

// ── 查看密码 ──────────────────────────────────────────────
const pwdDialogVisible = ref(false)
const pwdHash = ref('')
const pwdLoading = ref(false)

async function handleViewPassword(row: UserInfo) {
  pwdDialogVisible.value = true
  pwdLoading.value = true
  pwdHash.value = ''
  try {
    const res: any = await request.get(`/users/${row.id}/password`)
    pwdHash.value = res.password
  } catch { /* handled */ } finally {
    pwdLoading.value = false
  }
}
</script>

<style scoped>
.users-page h3 { margin-bottom: 0; }
.users-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.header-actions { display: flex; gap: 8px; }
.search-bar { margin-bottom: 12px; }
.student-filter { margin-bottom: 12px; }
</style>
