<template>
  <div class="sidebar">
    <div class="logo">
      <span v-if="!isCollapse">地面飞行滑板</span>
      <span v-else>飞</span>
    </div>
    <div class="menu-list">
      <div class="menu-top">
        <!-- 管理员/超级管理员可见 -->
        <template v-if="isAdmin">
          <router-link to="/students" class="menu-item" :class="{ active: $route.path === '/students' }" @click="onClick">
            <el-icon><User /></el-icon>
            <span v-if="!isCollapse" class="menu-title">学生信息</span>
          </router-link>
          <router-link to="/statistics" class="menu-item" :class="{ active: $route.path === '/statistics' }" @click="onClick">
            <el-icon><TrendCharts /></el-icon>
            <span v-if="!isCollapse" class="menu-title">数据统计</span>
          </router-link>
        </template>

        <!-- 所有用户可见 -->
        <router-link to="/booking" class="menu-item" :class="{ active: $route.path === '/booking' }" @click="onClick">
          <el-icon><Calendar /></el-icon>
          <span v-if="!isCollapse" class="menu-title">预约上课</span>
        </router-link>
        <router-link to="/calendar" class="menu-item" :class="{ active: $route.path === '/calendar' }" @click="onClick">
          <el-icon><Clock /></el-icon>
          <span v-if="!isCollapse" class="menu-title">课程表</span>
        </router-link>
      </div>

      <div class="menu-bottom">
        <!-- 管理员/超级管理员可见 -->
        <template v-if="isAdmin">
          <router-link to="/settings" class="menu-item" :class="{ active: $route.path === '/settings' }" @click="onClick">
            <el-icon><Setting /></el-icon>
            <span v-if="!isCollapse" class="menu-title">系统设置</span>
          </router-link>
          <router-link to="/backup" class="menu-item" :class="{ active: $route.path === '/backup' }" @click="onClick">
            <el-icon><Box /></el-icon>
            <span v-if="!isCollapse" class="menu-title">系统备份</span>
          </router-link>
          <router-link to="/users" class="menu-item" :class="{ active: $route.path === '/users' }" @click="onClick">
            <el-icon><UserFilled /></el-icon>
            <span v-if="!isCollapse" class="menu-title">用户管理</span>
          </router-link>
        </template>
        <router-link to="/account" class="menu-item" :class="{ active: $route.path === '/account' }" @click="onClick">
          <el-icon><Avatar /></el-icon>
          <span v-if="!isCollapse" class="menu-title">账号信息</span>
        </router-link>
        <a class="menu-item logout-item" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          <span v-if="!isCollapse" class="menu-title">退出登录</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { clearTokens, currentUser } from '../../utils/auth'
import { logout as logoutApi } from '../../api/auth'

const router = useRouter()
const emit = defineEmits<{ select: [] }>()
defineProps<{ isCollapse: boolean }>()
function onClick() { emit('select') }

const isAdmin = computed(() => {
  const role = currentUser.value?.role
  return role === 'SUPER_ADMIN' || role === 'ADMIN'
})

async function handleLogout() {
  try { await logoutApi() } catch { /* ignore */ }
  clearTokens()
  router.push('/login')
}
</script>

<style scoped lang="scss">
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  white-space: nowrap;
}

.menu-list {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.menu-top {
  flex: 1;
  padding-top: 8px;
}

.menu-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 4px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 20px;
  color: #bfcbd9;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    color: #fff;
    background-color: rgba(255, 255, 255, 0.05);
  }

  &.active {
    color: #409eff;
  }

  .el-icon {
    font-size: 18px;
    flex-shrink: 0;
  }
}

.menu-title {
  margin-left: 10px;
  white-space: nowrap;
}

.logout-item {
  &:hover {
    color: #f56c6c !important;
  }
}
</style>
