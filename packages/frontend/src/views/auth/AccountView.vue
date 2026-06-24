<template>
  <div class="account-page">
    <h3>账号信息</h3>

    <el-card class="info-card">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户ID">{{ user?.id }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag :type="roleTagType" size="small">{{ roleLabel }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatDate(user?.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="强制改密">
          <el-tag :type="user?.mustResetPassword ? 'warning' : 'success'" size="small">
            {{ user?.mustResetPassword ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="form-card">
      <template #header>修改资料</template>
      <el-form :model="form" label-width="100px" @submit.prevent="handleSave">
        <el-form-item v-if="isAdmin" label="用户名">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            :disabled="isSuperAdmin"
          />
        </el-form-item>

        <el-form-item v-if="!isAdmin" label="手机号">
          <el-input v-model="form.phone" placeholder="手机号" />
        </el-form-item>

        <el-form-item label="新密码">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="isSuperAdmin ? '超级管理员不允许修改密码' : '留空则不修改'"
            :disabled="isSuperAdmin"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" native-type="submit">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 关联学生（仅普通用户） -->
    <el-card v-if="!isAdmin" class="students-card">
      <template #header>关联学生（手机号：{{ user?.phone }}）</template>
      <el-table :data="students" stripe size="small">
        <el-table-column label="姓名">
          <template #default="{ row }"><b>{{ row.name }}</b></template>
        </el-table-column>
        <el-table-column label="性别" width="65">
          <template #default="{ row }">
            <el-tag :type="row.gender === '男' ? 'primary' : 'danger'" size="small" effect="dark">
              {{ row.gender }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" width="90" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column label="总课时" width="80">
          <template #default="{ row }">{{ row.totalHours }}</template>
        </el-table-column>
        <el-table-column label="已用课时" width="80">
          <template #default="{ row }">{{ row.usedHours }}</template>
        </el-table-column>
        <el-table-column label="剩余课时" width="90">
          <template #default="{ row }">
            <el-tag :type="row.remainingHours < warningThreshold ? 'danger' : 'success'" size="small">
              {{ row.remainingHours }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!students.length" description="暂无关联学生" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getProfile, updateProfile, getMyStudents } from '../../api/auth'
import { getSettings } from '../../api/settings'
import { currentUser, setUser } from '../../utils/auth'

const user = currentUser
const students = ref<any[]>([])
const saving = ref(false)
const warningThreshold = ref(3)

const isSuperAdmin = computed(() => user.value?.role === 'SUPER_ADMIN')
const isAdmin = computed(() => isSuperAdmin.value || user.value?.role === 'ADMIN')

const roleLabel = computed(() => {
  switch (user.value?.role) {
    case 'SUPER_ADMIN': return '超级管理员'
    case 'ADMIN': return '管理员'
    default: return '普通用户'
  }
})

const roleTagType = computed(() => {
  switch (user.value?.role) {
    case 'SUPER_ADMIN': return 'danger'
    case 'ADMIN': return 'warning'
    default: return 'info'
  }
})

const form = reactive({
  username: '',
  phone: '',
  password: '',
})

function formatDate(d?: string) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('zh-CN')
}

onMounted(async () => {
  try {
    const profile = await getProfile()
    setUser(profile)
    form.username = profile.username || ''
    form.phone = profile.phone || ''

    // Load warning threshold
    try {
      const settings = await getSettings() as any
      if ((settings as any)?.warning_hours !== undefined) warningThreshold.value = Number((settings as any).warning_hours)
    } catch { /* ignore */ }

    if (profile.role === 'USER') {
      const res = await getMyStudents()
      students.value = res || []
    }
  } catch { /* handled by interceptor */ }
})

async function handleSave() {
  saving.value = true
  try {
    const data: Record<string, any> = {}
    if (!isSuperAdmin.value) {
      if (form.username) data.username = form.username
      if (form.password) data.password = form.password
    }
    if (form.phone) data.phone = form.phone

    const updated = await updateProfile(data)
    setUser(updated)
    form.password = ''
    ElMessage.success('资料已更新')
  } catch { /* handled by interceptor */ } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.account-page { max-width: 800px; margin: 0 auto; }
.account-page h3 { margin-bottom: 16px; }
.info-card, .form-card, .students-card { margin-bottom: 16px; }
</style>
