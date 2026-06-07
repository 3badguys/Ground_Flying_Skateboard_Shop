<template>
  <el-container class="app-layout">
    <div
      v-if="isMobile && mobileOpen"
      class="mobile-overlay"
      @click="mobileOpen = false"
    />
    <el-aside
      :width="sidebarWidth"
      class="app-aside"
      :class="{ 'aside-mobile': isMobile, 'aside-open': isMobile && mobileOpen }"
    >
      <Sidebar :is-collapse="isCollapse && !isMobile" @select="mobileOpen = false" />
    </el-aside>
    <el-container>
      <el-header class="app-header">
        <div class="header-left">
          <el-icon class="menu-icon" @click="toggleMenu">
            <Menu v-if="isMobile" />
            <Expand v-else-if="isCollapse" />
            <Fold v-else />
          </el-icon>
          <span class="header-title">后台管理系统</span>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Menu, Expand, Fold } from '@element-plus/icons-vue'
import Sidebar from './Sidebar.vue'

const isCollapse = ref(false)
const mobileOpen = ref(false)
const isMobile = ref(false)

const sidebarWidth = computed(() => {
  if (isMobile.value) return '200px'
  return isCollapse.value ? '64px' : '200px'
})

function toggleMenu() {
  if (isMobile.value) {
    mobileOpen.value = !mobileOpen.value
  } else {
    isCollapse.value = !isCollapse.value
  }
}

function onResize() {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) mobileOpen.value = false
}

onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))
onResize()
</script>

<style scoped lang="scss">
.app-layout { height: 100vh; }

.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 99;
}

.app-aside {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
  flex-shrink: 0;
  padding-top: env(safe-area-inset-top);
}

.aside-mobile {
  width: 0 !important;
  position: fixed;
  left: 0; top: 0; bottom: 0;
  z-index: 100;
  padding-top: env(safe-area-inset-top);
}

.aside-open {
  width: 200px !important;
}

.app-header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 56px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-icon {
  font-size: 22px;
  cursor: pointer;
  color: #666;
  &:hover { color: #409eff; }
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.app-main {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .header-title { font-size: 14px; }
  .app-main { padding: 10px; }
}
</style>
