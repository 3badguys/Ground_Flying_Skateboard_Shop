<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2 class="login-title">地面飞行滑板后台</h2>
      <p class="login-subtitle">Ground Flying Skateboard Admin</p>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="用户名 / 手机号" prop="credential">
          <el-input
            v-model="form.credential"
            placeholder="请输入用户名或手机号"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          :loading="loading"
          class="login-btn"
          native-type="submit"
        >
          登录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '../../api/auth'
import { setTokens, setUser } from '../../utils/auth'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  credential: '',
  password: '',
})

const rules: FormRules = {
  credential: [{ required: true, message: '请输入用户名或手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

// Determine if credential looks like a phone number
function isPhone(val: string): boolean {
  return /^1[3-9]\d{9}$/.test(val.trim())
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const credential = form.credential.trim()
    const isPhoneLogin = isPhone(credential)

    const data = await login({
      username: isPhoneLogin ? undefined : credential,
      phone: isPhoneLogin ? credential : undefined,
      password: form.password,
    })
    setTokens(data.accessToken, data.refreshToken)
    setUser(data.user)
    const homePath = data.user.role === 'USER' ? '/account' : '/students'
    router.push(homePath)
  } catch {
    // error handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #304156 0%, #1f2d3d 100%);
}
.login-card { width: 420px; max-width: 90vw; padding: 8px 16px; }
.login-title { text-align: center; margin-bottom: 4px; font-size: 24px; color: #303133; }
.login-subtitle { text-align: center; margin-bottom: 20px; color: #909399; font-size: 13px; }
.login-btn { width: 100%; margin-top: 8px; }
</style>
