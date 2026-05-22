<template>
  <div>
    <div v-if="!readonly" class="toolbar">
      <el-button type="primary" size="small" @click="openAdd">添加课程</el-button>
    </div>
    <el-table :data="list" border stripe size="small">
      <el-table-column label="报名日期">
        <template #default="{ row }">{{ formatDate(row.enrollmentDate) }}</template>
      </el-table-column>
      <el-table-column prop="hours" label="课时" width="80" />
      <el-table-column label="单价">
        <template #default="{ row }">¥{{ row.unitPrice }}</template>
      </el-table-column>
      <el-table-column label="学费">
        <template #default="{ row }">¥{{ row.tuition }}</template>
      </el-table-column>
      <el-table-column v-if="!readonly" label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="openEdit(row)">修改</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <CourseInfoDialog
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
import { getCourseInfos, deleteCourseInfo } from '../../api/course-info'
import type { CourseInfo } from '../../types/student'
import CourseInfoDialog from './CourseInfoDialog.vue'
import { formatDate } from '../../utils/format'

const props = defineProps<{ studentId: number; readonly?: boolean }>()
const emit = defineEmits<{ refresh: [] }>()

const list = ref<CourseInfo[]>([])
const dialogVisible = ref(false)
const currentData = ref<CourseInfo | null>(null)

async function fetchList() {
  list.value = (await getCourseInfos(props.studentId)) as unknown as CourseInfo[]
}

async function onSuccess() {
  await fetchList()
  emit('refresh')
}

function openAdd() {
  currentData.value = null
  dialogVisible.value = true
}

function openEdit(row: CourseInfo) {
  currentData.value = row
  dialogVisible.value = true
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定要删除该课程信息吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  await deleteCourseInfo(id)
  await onSuccess()
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.toolbar {
  margin-bottom: 10px;
}
</style>
