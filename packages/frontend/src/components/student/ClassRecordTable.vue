<template>
  <div>
    <div v-if="!readonly" class="toolbar">
      <el-button type="primary" size="small" @click="openAdd">添加上课记录</el-button>
    </div>
    <el-table :data="list" border stripe size="small">
      <el-table-column label="上课日期">
        <template #default="{ row }">{{ formatDate(row.classDate) }}</template>
      </el-table-column>
      <el-table-column label="起止时间" width="120">
        <template #default="{ row }">
          <span v-if="row.startTime && row.endTime">{{ row.startTime }} - {{ row.endTime }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="hours" label="课时" width="60" />
      <el-table-column label="上课费用">
        <template #default="{ row }">¥{{ row.classFee }}</template>
      </el-table-column>
      <el-table-column v-if="!readonly" label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="openEdit(row)">修改</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <ClassRecordDialog
      v-model:visible="dialogVisible"
      :student-id="studentId"
      :data="currentData"
      @success="onSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { getClassRecords, deleteClassRecord } from '../../api/class-record'
import type { ClassRecord } from '../../types/student'
import ClassRecordDialog from './ClassRecordDialog.vue'
import { formatDate } from '../../utils/format'

const props = defineProps<{ studentId: number; readonly?: boolean }>()
const emit = defineEmits<{ refresh: [] }>()

const list = ref<ClassRecord[]>([])
const dialogVisible = ref(false)
const currentData = ref<ClassRecord | null>(null)

async function fetchList() {
  list.value = (await getClassRecords(props.studentId)) as unknown as ClassRecord[]
}

async function onSuccess() {
  await fetchList()
  emit('refresh')
}

function openAdd() {
  currentData.value = null
  dialogVisible.value = true
}

function openEdit(row: ClassRecord) {
  currentData.value = row
  dialogVisible.value = true
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定要删除该上课记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  await deleteClassRecord(id)
  await onSuccess()
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.toolbar {
  margin-bottom: 10px;
}
</style>
