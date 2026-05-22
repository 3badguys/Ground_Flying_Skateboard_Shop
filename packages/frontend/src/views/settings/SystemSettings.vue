<template>
  <div class="settings-page">
    <el-card>
      <template #header>
        <h3>系统设置</h3>
      </template>
      <el-form label-width="140px" style="max-width: 500px">
        <el-form-item label="课时预警数">
          <el-input-number
            v-model="warningHours"
            :min="1"
            :max="99"
            @change="handleSave"
          />
          <span style="margin-left: 8px; color: #999; font-size: 13px">
            学生剩余课时低于此数时，列表行标红
          </span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettings, updateSetting } from '../../api/settings'

const warningHours = ref(3)

async function fetchSettings() {
  const data = (await getSettings()) as unknown as Record<string, string>
  warningHours.value = parseInt(data.warning_hours || '3', 10)
}

async function handleSave() {
  await updateSetting('warning_hours', String(warningHours.value))
  ElMessage.success('已保存')
}

onMounted(fetchSettings)
</script>

<style scoped lang="scss">
.settings-page {
  h3 {
    margin: 0;
    font-size: 16px;
  }
}
</style>
