<template>
  <div class="calendar-page">
    <div class="calendar-body">
      <div class="custom-picker">
        <div class="picker-card">
          <el-icon class="picker-icon"><Calendar /></el-icon>
          <el-date-picker
            v-model="pickerMonth"
            type="month"
            format="YYYY 年 MM 月"
            value-format="YYYY-MM"
            :clearable="false"
            :editable="false"
            size="large"
            @change="onMonthChange"
          />
        </div>
      </div>
      <el-calendar v-model="currentDate">
        <template #date-cell="{ data }">
          <div
            class="cell-day"
            :class="[heatClass(data.day), { 'other-month': !isCurrentMonth(data.day), 'is-today': isToday(data.day) }]"
            @click="onDateClick(data.day)"
          >
            <span class="day-num">{{ data.day.split('-').pop() }}</span>
            <div v-if="getDayTotal(data.day) > 0" class="day-info">
              <span>{{ getDayTotal(data.day) }}课时</span>
              <span>{{ getDayStudents(data.day) }}人</span>
              <span>¥{{ getDayFee(data.day) }}</span>
            </div>
          </div>
        </template>
      </el-calendar>
    </div>

    <div class="month-summary">
      <span>本月共 <b>{{ monthTotal }}课时</b></span>
      <span>上课 <b>{{ monthDays }}</b> 天</span>
      <span>涉及 <b>{{ monthStudents }}</b> 名学生</span>
      <span>学费 <b>¥{{ monthTotalFee }}</b></span>
    </div>

    <el-drawer
      v-model="drawerVisible"
      :title="selectedDate + ' 上课计划'"
      size="550px"
      @close="selectedDate = ''"
    >
      <div v-for="(group, name) in studentGroups" :key="name" class="student-group">
        <div class="student-name" @click="onStudentClick(group[0])">{{ name }}</div>
        <el-table :data="group" border stripe size="small">
          <el-table-column label="起止时间" width="130">
            <template #default="{ row }">
              <span v-if="row.startTime && row.endTime">{{ row.startTime }} - {{ row.endTime }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="hours" label="课时" width="60" align="center" />
          <el-table-column label="费用" width="80">
            <template #default="{ row }">¥{{ row.classFee }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="openEdit(row)">修改</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <ClassRecordDialog
      v-model:visible="dialogVisible"
      :student-id="editStudentId"
      :data="editingRecord"
      readonly-date
      @success="onRecordChanged"
    />

    <el-drawer
      v-model="studentDrawerVisible"
      :title="studentDrawerTitle"
      size="700px"
    >
      <div v-if="studentDetail" class="drawer-student-info">
        <div class="info-line"><span class="info-label">家长</span><span>{{ studentDetail.parentName }}</span></div>
        <div class="info-line"><span class="info-label">性别</span><span>{{ studentDetail.gender }}</span></div>
        <div class="info-line"><span class="info-label">年级</span><span>{{ studentDetail.grade }}</span></div>
        <div class="info-line"><span class="info-label">电话</span><span>{{ studentDetail.phone }}</span></div>
        <div class="info-line"><span class="info-label">报名日期</span><span>{{ formatDate(studentDetail.enrollmentDate) }}</span></div>
        <div class="info-divider"></div>
        <div class="info-line hours-line">
          <span class="info-label">总课时</span><b>{{ studentDetail.totalHours }}</b>
          <span class="info-label">已用课时</span><b>{{ studentDetail.usedHours }}</b>
          <span class="info-label">剩余课时</span><b>{{ studentDetail.remainingHours }}</b>
        </div>
        <div class="info-line hours-line">
          <span class="info-label">报课费用</span><b>¥{{ studentDetail.totalTuition }}</b>
          <span class="info-label">完成费用</span><b>¥{{ studentDetail.completedTuition }}</b>
        </div>
      </div>
      <el-tabs v-if="studentDrawerId">
        <el-tab-pane label="课程信息">
          <CourseInfoTable :student-id="studentDrawerId" :key="'cal-course-' + studentDrawerId + '-' + refreshKey" readonly />
        </el-tab-pane>
        <el-tab-pane label="上课记录">
          <ClassRecordTable :student-id="studentDrawerId" :key="'cal-record-' + studentDrawerId + '-' + refreshKey" readonly />
        </el-tab-pane>
      </el-tabs>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { getCalendar, deleteClassRecord } from '../../api/class-record'
import { getStudent } from '../../api/student'
import { formatDate } from '../../utils/format'
import ClassRecordDialog from '../../components/student/ClassRecordDialog.vue'
import CourseInfoTable from '../../components/student/CourseInfoTable.vue'
import ClassRecordTable from '../../components/student/ClassRecordTable.vue'

const now = new Date()
const currentDate = ref(new Date())
const pickerMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
const selectedDate = ref('')
const drawerVisible = ref(false)
const recordsMap = ref<any>({})

const dialogVisible = ref(false)
const editStudentId = ref(0)
const editingRecord = ref<any>(null)

const studentDrawerVisible = ref(false)
const studentDrawerId = ref(0)
const studentDrawerTitle = ref('')
const studentDetail = ref<any>(null)
const refreshKey = ref(0)

async function onStudentClick(row: any) {
  studentDrawerId.value = row.studentId
  studentDrawerTitle.value = row.studentName
  studentDetail.value = (await getStudent(row.studentId)) as any
  studentDrawerVisible.value = true
}

const monthTotal = computed(() => {
  let sum = 0
  for (const records of Object.values(recordsMap.value) as any[]) {
    sum += records.reduce((s: number, r: any) => s + r.hours, 0)
  }
  return sum
})
const monthTotalFee = computed(() => {
  let sum = 0
  for (const records of Object.values(recordsMap.value) as any[]) {
    sum += records.reduce((s: number, r: any) => s + (r.classFee || 0), 0)
  }
  return Math.round(sum * 100) / 100
})
const monthDays = computed(() => Object.keys(recordsMap.value).length)
const monthStudents = computed(() => {
  const set = new Set<number>()
  for (const records of Object.values(recordsMap.value) as any[]) {
    records.forEach((r: any) => set.add(r.studentId))
  }
  return set.size
})

function getDayTotal(day: string) {
  const recs = recordsMap.value[day] as any[] | undefined
  return recs?.reduce((s: number, r: any) => s + r.hours, 0) ?? 0
}
function getDayStudents(day: string) {
  const recs = recordsMap.value[day] as any[] | undefined
  if (!recs) return 0
  return new Set(recs.map((r: any) => r.studentId)).size
}
function getDayFee(day: string) {
  const recs = recordsMap.value[day] as any[] | undefined
  const sum = recs?.reduce((s: number, r: any) => s + (r.classFee || 0), 0) ?? 0
  return Math.round(sum * 100) / 100
}

const selectedRecords = ref<any[]>([])
const studentGroups = computed(() => {
  const map: Record<string, any[]> = {}
  for (const r of selectedRecords.value) {
    const name = r.studentName || '未知'
    if (!map[name]) map[name] = []
    map[name].push(r)
  }
  return map
})

function isToday(day: string) {
  return day === new Date().toISOString().slice(0, 10)
}

function isCurrentMonth(day: string) {
  const d = new Date(day)
  return d.getMonth() === currentDate.value.getMonth()
}

function heatClass(day: string) {
  const t = getDayTotal(day)
  if (t === 0) return ''
  if (t <= 2) return 'heat-low'
  if (t <= 5) return 'heat-mid'
  return 'heat-high'
}

watch(
  () => currentDate.value,
  (d) => {
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (pickerMonth.value !== val) {
      pickerMonth.value = val
      fetchMonth(val)
    }
  },
)

function onMonthChange(val: string) {
  const [y, m] = val.split('-').map(Number)
  currentDate.value = new Date(y, m - 1, 1)
  fetchMonth(val)
}

function onDateClick(day: string) {
  if (!getDayTotal(day)) return
  selectedDate.value = day
  selectedRecords.value = recordsMap.value[day] || []
  drawerVisible.value = true
}

function openEdit(row: any) {
  editingRecord.value = row
  editStudentId.value = row.studentId
  dialogVisible.value = true
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm('确定要删除该上课记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  await deleteClassRecord(row.id)
  onRecordChanged()
}

async function onRecordChanged() {
  const changedStudentId = editStudentId.value
  dialogVisible.value = false
  editingRecord.value = null
  refreshKey.value++
  if (studentDrawerVisible.value && studentDrawerId.value === changedStudentId) {
    studentDetail.value = (await getStudent(changedStudentId)) as any
  }
  const d = currentDate.value
  const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  await fetchMonth(m)
}

async function fetchMonth(month: string) {
  const data = (await getCalendar(month)) as unknown as Record<string, any>
  recordsMap.value = data
  if (selectedDate.value && !recordsMap.value[selectedDate.value]) {
    selectedDate.value = ''
  }
  if (selectedDate.value) {
    selectedRecords.value = recordsMap.value[selectedDate.value] || []
  }
}

onMounted(() => {
  const d = currentDate.value
  const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  fetchMonth(m)
})
</script>

<style scoped lang="scss">
.calendar-page {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
}

.custom-picker {
  text-align: center;
  margin-bottom: 12px;

  .picker-card {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #f0f5ff;
    border-radius: 12px;
    padding: 12px 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .picker-icon {
      font-size: 22px;
      color: #409eff;
    }
  }

  :deep(.el-input) { width: 220px; }
  :deep(.el-input__inner) { font-size: 18px; font-weight: 600; text-align: center; }
  :deep(.el-input__prefix) { display: none; }
}

.calendar-body {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  padding: 8px;

  :deep(.el-calendar__header) {
    display: flex;
    justify-content: flex-end;
  }
  :deep(.el-calendar__title) {
    display: none;
  }
  :deep(.el-calendar__body) {
    padding: 0 4px;
  }
}

.is-today .day-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #409eff;
  color: #fff !important;
}

.drawer-student-info {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #606266;

  .info-line {
    display: flex;
    padding: 4px 0;

    .info-label {
      width: 70px;
      color: #909399;
      text-align: right;
      margin-right: 12px;
      flex-shrink: 0;
    }
  }

  .info-divider {
    border-top: 1px solid #e4e7ed;
    margin: 4px 0;
  }

  .hours-line { gap: 16px; }

  b { color: #303133; }
}

.student-group {
  margin-bottom: 16px;

  .student-name {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 6px;
    color: #409eff;
    cursor: pointer;
    &:hover { text-decoration: underline; }
  }
}

.month-summary {
  display: flex;
  gap: 32px;
  margin-top: 14px;
  padding: 12px 20px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
  color: #606266;

  b { color: #409eff; font-size: 16px; }
}

.other-month {
  background: #fafafa !important;
  .day-num { color: #c0c4cc !important; }
  .day-info { color: #c0c4cc !important; }
  &.heat-low,
  &.heat-mid,
  &.heat-high { background: #fafafa !important; }
}

.cell-day {
  min-height: 60px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { box-shadow: inset 0 0 0 2px #409eff; }

  .day-num {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
  }

  .day-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin-top: 2px;
    font-size: 10px;
    line-height: 1.3;
  }
}

.heat-low {
  background: #d9ecff;
  .day-info { color: #409eff; }
}

.heat-mid {
  background: #79bbff;
  .day-num, .day-info { color: #fff; }
}

.heat-high {
  background: #337ecc;
  .day-num, .day-info { color: #fff; }
}
</style>
