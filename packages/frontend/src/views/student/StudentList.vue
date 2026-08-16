<template>
  <div class="student-page">
    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索姓名/家长/电话"
        clearable
        style="width: 240px"
        @input="onKeywordChange"
        @clear="handleSearch"
      />
      <el-select
        v-model="genderFilter"
        placeholder="性别筛选"
        clearable
        style="width: 100px"
        @change="handleSearch"
      >
        <el-option label="男" value="男" />
        <el-option label="女" value="女" />
      </el-select>
      <el-select
        v-model="gradeFilter"
        placeholder="年级筛选"
        clearable
        style="width: 140px"
        @change="handleSearch"
      >
        <el-option v-for="g in grades" :key="g" :label="g" :value="g" />
      </el-select>
      <el-button type="success" @click="openCreate">新建学生</el-button>
    </div>

    <el-table
      ref="tableRef"
      :data="list"
      stripe
      v-loading="loading"
      style="width: 100%"
      row-key="id"
      highlight-current-row
      @row-click="selectRow"
      @sort-change="onSortChange"
    >
      <el-table-column type="index" label="序号" width="50" fixed="left" />
      <el-table-column label="学生姓名" min-width="85" fixed="left">
        <template #default="{ row }"><b>{{ row.name }}</b></template>
      </el-table-column>
      <el-table-column prop="parentName" label="家长姓名" min-width="85" />
      <el-table-column label="性别" width="55">
        <template #default="{ row }">
          <el-tag :type="row.gender === '男' ? 'primary' : 'danger'" size="small" effect="dark">
            {{ row.gender }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="grade" label="年级" min-width="75" />
      <el-table-column prop="phone" label="联系方式" min-width="115" />
      <el-table-column label="报名日期" min-width="100" sortable="custom"prop="enrollmentDate">
        <template #default="{ row }">{{ formatDate(row.enrollmentDate) }}</template>
      </el-table-column>
      <el-table-column label="总课时" width="75" sortable="custom"prop="totalHours" />
      <el-table-column label="已用课时" width="75" sortable="custom" prop="usedHours" />
      <el-table-column label="剩余课时" width="80" sortable="custom" prop="remainingHours">
        <template #default="{ row }">
          <el-tag :type="row.remainingHours < warningThreshold ? 'danger' : 'success'" size="small">
            {{ row.remainingHours }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="报课费用" width="85" sortable="custom" prop="totalTuition">
        <template #default="{ row }">¥{{ row.totalTuition }}</template>
      </el-table-column>
      <el-table-column label="完成费用" width="85" sortable="custom" prop="completedTuition">
        <template #default="{ row }">¥{{ row.completedTuition }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click.stop="openEdit(row)">修改</el-button>
          <el-button size="small" type="danger" @click.stop="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer
      v-model="drawerVisible"
      :title="selectedStudent?.name"
      size="min(700px, 100%)"
      @close="selectedStudent = null"
    >
      <div v-if="selectedStudent" class="drawer-student-info">
        <div class="info-line"><span class="info-label">家长</span><span>{{ selectedStudent.parentName }}</span></div>
        <div class="info-line"><span class="info-label">性别</span><span>{{ selectedStudent.gender }}</span></div>
        <div class="info-line"><span class="info-label">年级</span><span>{{ selectedStudent.grade }}</span></div>
        <div class="info-line"><span class="info-label">电话</span><span>{{ selectedStudent.phone }}</span></div>
        <div class="info-line"><span class="info-label">报名日期</span><span>{{ formatDate(selectedStudent.enrollmentDate) }}</span></div>
        <div class="info-divider"></div>
        <div class="info-line hours-line">
          <span class="info-label">总课时</span><b>{{ selectedStudent.totalHours }}</b>
          <span class="info-label">已用课时</span><b>{{ selectedStudent.usedHours }}</b>
          <span class="info-label">剩余课时</span><b :class="{ 'text-danger': selectedStudent.remainingHours < warningThreshold }">{{ selectedStudent.remainingHours }}</b>
        </div>
        <div class="info-line hours-line">
          <span class="info-label">报课费用</span><b>¥{{ selectedStudent.totalTuition }}</b>
          <span class="info-label">完成费用</span><b>¥{{ selectedStudent.completedTuition }}</b>
        </div>
      </div>
      <el-tabs v-if="selectedStudent">
        <el-tab-pane label="课程信息">
          <CourseInfoTable :student-id="selectedStudent.id" :key="'course-' + selectedStudent.id" @refresh="fetchList" />
        </el-tab-pane>
        <el-tab-pane label="上课记录">
          <ClassRecordTable :student-id="selectedStudent.id" :key="'record-' + selectedStudent.id" @refresh="fetchList" />
        </el-tab-pane>
      </el-tabs>
    </el-drawer>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        :pager-count="5"
        size="small"
        @current-change="fetchList"
        @size-change="onSizeChange"
      />
    </div>

    <StudentDialog
      v-model:visible="dialogVisible"
      :data="editingStudent"
      @success="fetchList"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { getStudents, deleteStudent } from '../../api/student'
import type { Student } from '../../types/student'
import { formatDate } from '../../utils/format'
import { getSettings } from '../../api/settings'
import StudentDialog from '../../components/student/StudentDialog.vue'
import CourseInfoTable from '../../components/student/CourseInfoTable.vue'
import ClassRecordTable from '../../components/student/ClassRecordTable.vue'

const grades = [
  '幼儿园', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '初一', '初二', '初三', '高一', '高二', '高三', '其他',
]

const list = ref<Student[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const keyword = ref('')
const gradeFilter = ref('')
const genderFilter = ref('')
const dialogVisible = ref(false)
const editingStudent = ref<Student | null>(null)
const selectedStudent = ref<Student | null>(null)
const drawerVisible = ref(false)
const warningThreshold = ref(3)
const sortBy = ref('')
const sortOrder = ref('')

function onSortChange({ prop, order }: { prop: string; order: string }) {
  sortBy.value = order ? prop : ''
  sortOrder.value = order === 'ascending' ? 'asc' : order === 'descending' ? 'desc' : ''
  page.value = 1
  fetchList()
}

function selectRow(row: Student) {
  selectedStudent.value = row
  drawerVisible.value = true
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getStudents({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      grade: gradeFilter.value || undefined,
      gender: genderFilter.value || undefined,
      sortBy: sortBy.value || undefined,
      sortOrder: sortOrder.value || undefined,
    } as any)
    const data = res as any
    list.value = data.list
    total.value = data.total
    if (selectedStudent.value) {
      const updated = data.list.find((s: any) => s.id === selectedStudent.value!.id)
      if (updated) selectedStudent.value = updated
    }
  } finally {
    loading.value = false
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null

function onKeywordChange() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    handleSearch()
  }, 300)
}

function onSizeChange() {
  page.value = 1
  fetchList()
}

function handleSearch() {
  page.value = 1
  fetchList()
}

function openCreate() {
  editingStudent.value = null
  dialogVisible.value = true
}

function openEdit(row: Student) {
  editingStudent.value = row
  dialogVisible.value = true
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('删除学生将同时删除其所有课程和上课记录，确定继续？', '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
  await deleteStudent(id)
  if (selectedStudent.value?.id === id) {
    drawerVisible.value = false
    selectedStudent.value = null
  }
  fetchList()
}

async function loadSettings() {
  const data = (await getSettings()) as unknown as Record<string, string>
  warningThreshold.value = parseInt(data.warning_hours || '3', 10)
}

onMounted(() => {
  loadSettings()
  fetchList()
})
</script>

<style scoped lang="scss">
.student-page {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
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

  .hours-line {
    gap: 16px;
    flex-wrap: wrap;
  }

  .info-divider {
    border-top: 1px solid #e4e7ed;
    margin: 4px 0;
  }

  b {
    color: #303133;
  }

  .text-danger {
    color: #f56c6c;
  }
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .pagination-wrap {
    justify-content: center;
  }
  .search-bar {
    flex-direction: column;
    .el-input,
    .el-select {
      width: 100% !important;
    }
  }
}
</style>
