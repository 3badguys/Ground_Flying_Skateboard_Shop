<template>
  <div class="backup-page">
    <!-- ── 备份 ─────────────────────────────────────────────── -->
    <el-card class="backup-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">📥 备份（点击即下载）</span>
        </div>
      </template>

      <el-button type="primary" :loading="creating" :disabled="creating" @click="handleCreate">
        <template v-if="creating">生成中，请稍候...</template>
        <template v-else>备份数据库</template>
      </el-button>

      <el-divider />

      <div class="sub-title">📋 最近备份记录</div>
      <el-table :data="backups" v-loading="loading" empty-text="暂无备份记录" size="default">
        <el-table-column prop="name" label="文件名" min-width="240" />
        <el-table-column label="大小" width="100">
          <template #default="{ row }">{{ formatSize(row.size) }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDownload(row)">下载</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="tip">💡 备份文件存储在服务器本地，保留最近 30 天</div>
    </el-card>

    <!-- ── 恢复 ─────────────────────────────────────────────── -->
    <el-card class="backup-card restore-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">📤 恢复（⚠️ 危险操作，会覆盖当前数据）</span>
        </div>
      </template>

      <div class="restore-row">
        <span class="restore-label">数据库恢复：</span>
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :limit="1"
          accept=".sql"
          :on-change="onFileChange"
          :on-remove="onFileRemove"
        >
          <el-button>选择 .sql 文件</el-button>
        </el-upload>
        <el-button
          type="danger"
          :loading="restoring"
          :disabled="!selectedFile || restoring"
          @click="handleRestore"
        >
          <template v-if="restoring">恢复中，请稍候...</template>
          <template v-else>上传恢复</template>
        </el-button>
      </div>

      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="恢复前请确保已备份当前数据，此操作不可逆！"
        description="恢复过程中请勿刷新页面或关闭浏览器。"
        style="margin-top: 16px"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadFile, UploadInstance } from 'element-plus'
import {
  createBackup,
  getBackups,
  deleteBackup,
  restoreBackup,
  downloadBackup,
  type BackupItem,
} from '../../api/backup'

const backups = ref<BackupItem[]>([])
const loading = ref(false)
const creating = ref(false)
const restoring = ref(false)
const uploadRef = ref<UploadInstance>()
const selectedFile = ref<File>()

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

async function fetchBackups() {
  loading.value = true
  try {
    backups.value = await getBackups()
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  creating.value = true
  try {
    const item = await createBackup()
    ElMessage.success('备份成功')
    await downloadBackup(item.name)
    await fetchBackups()
  } finally {
    creating.value = false
  }
}

async function handleDownload(row: BackupItem) {
  await downloadBackup(row.name)
}

async function handleDelete(row: BackupItem) {
  await ElMessageBox.confirm(
    `确定要删除备份文件「${row.name}」吗？`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
  )
  await deleteBackup(row.name)
  ElMessage.success('已删除')
  await fetchBackups()
}

function onFileChange(file: UploadFile) {
  selectedFile.value = file.raw
}

function onFileRemove() {
  selectedFile.value = undefined
}

async function handleRestore() {
  if (!selectedFile.value) return
  await ElMessageBox.confirm(
    '确定要恢复数据库吗？\n当前所有数据将被覆盖，此操作不可逆！\n💡 建议：恢复前请先执行「备份数据库」。',
    '恢复确认',
    {
      type: 'warning',
      confirmButtonText: '确认恢复',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
    },
  )
  restoring.value = true
  try {
    await restoreBackup(selectedFile.value)
    ElMessage.success('恢复成功')
    uploadRef.value?.clearFiles()
    selectedFile.value = undefined
    await fetchBackups()
  } finally {
    restoring.value = false
  }
}

onMounted(fetchBackups)
</script>

<style scoped lang="scss">
.backup-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 860px;
}

.card-header {
  display: flex;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.sub-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
}

.tip {
  margin-top: 12px;
  font-size: 13px;
  color: #909399;
}

.restore-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.restore-label {
  font-size: 14px;
  color: #303133;
  flex-shrink: 0;
}
</style>
