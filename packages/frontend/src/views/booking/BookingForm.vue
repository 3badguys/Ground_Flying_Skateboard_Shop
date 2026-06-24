<template>
  <div class="booking-page">
    <el-card class="booking-card">
      <template #header>
        <h3>预约上课</h3>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        style="max-width: 500px"
      >
        <el-form-item label="学生" prop="studentId">
          <el-select
            v-model="form.studentId"
            placeholder="请选择学生"
            filterable
            style="width: 100%"
            @change="onStudentChange"
          >
            <el-option
              v-for="s in eligibleStudents"
              :key="s.id"
              :label="`${s.name} (剩余${s.remainingHours}课时)`"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="家长">
          <el-input :model-value="parentName" disabled />
        </el-form-item>
        <el-form-item label="剩余课时">
          <el-input :model-value="remainingHours" disabled />
        </el-form-item>
        <el-form-item label="上课日期" prop="classDate">
          <el-date-picker
            v-model="form.classDate"
            type="date"
            placeholder="请选择上课日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-time-select
            v-model="form.startTime"
            start="00:00"
            step="00:30"
            end="23:30"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="请选择开始时间"
            style="width: 100%"
            @change="onStartTimeChange"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-time-select
            v-model="form.endTime"
            start="00:00"
            step="00:30"
            end="23:30"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="请选择结束时间"
            style="width: 100%"
            @change="onTimeChange"
          />
        </el-form-item>
        <el-form-item label="课时" prop="hours">
          <el-input-number v-model="form.hours" :min="1" style="width: 100%" disabled />
          <span v-if="maxHours > 0" style="margin-left: 8px; color: #999">
            最多{{ maxHours }}课时
          </span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            确认预约上课
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getEligibleStudents, bookClass } from '../../api/booking'
import type { EligibleStudent } from '../../types/student'

const formRef = ref<FormInstance>()
const loading = ref(false)
const eligibleStudents = ref<EligibleStudent[]>([])

const form = ref({
  studentId: null as number | null,
  classDate: new Date().toISOString().slice(0, 10),
  startTime: '09:00',
  endTime: '10:00',
  hours: 1,
})

const selectedStudent = computed(() =>
  eligibleStudents.value.find((s) => s.id === form.value.studentId),
)

const parentName = computed(() => selectedStudent.value?.parentName ?? '')
const remainingHours = computed(() => selectedStudent.value?.remainingHours ?? 0)
const maxHours = computed(() => selectedStudent.value?.remainingHours ?? 9999)

const rules: FormRules = {
  studentId: [{ required: true, message: '请选择学生', trigger: 'change' }],
  classDate: [{ required: true, message: '请选择上课日期', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    {
      validator: (_rule, value, callback) => {
        if (form.value.startTime && value && value <= form.value.startTime) {
          callback(new Error('结束时间必须大于开始时间'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
  hours: [
    { required: true, message: '课时需自动计算', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value > maxHours.value) {
          callback(new Error(`课时不能超过剩余课时(${maxHours.value})`))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

function onStartTimeChange() {
  if (!form.value.startTime) {
    form.value.endTime = ''
    form.value.hours = 1
    return
  }
  const [sh, sm] = form.value.startTime.split(':').map(Number)
  let eh = sh + 1
  const em = sm
  if (eh >= 24) eh -= 24
  const end = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`
  form.value.endTime = end
  onTimeChange()
}

function onTimeChange() {
  if (!form.value.startTime || !form.value.endTime) return
  const [sh, sm] = form.value.startTime.split(':').map(Number)
  const [eh, em] = form.value.endTime.split(':').map(Number)
  let minutes = (eh * 60 + em) - (sh * 60 + sm)
  if (minutes <= 0) minutes += 24 * 60
  form.value.hours = Math.ceil(minutes / 60)
}

function onStudentChange() {
  formRef.value?.validateField('hours')
}

async function fetchEligibleStudents() {
  eligibleStudents.value = (await getEligibleStudents()) as unknown as EligibleStudent[]
  // Auto-select if only one student
  if (eligibleStudents.value.length === 1) {
    form.value.studentId = eligibleStudents.value[0].id
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await bookClass({
        studentId: form.value.studentId!,
        classDate: form.value.classDate,
        hours: form.value.hours,
        startTime: form.value.startTime,
        endTime: form.value.endTime,
      })
      ElMessage.success('预约成功！')
      handleReset()
      fetchEligibleStudents()
    } finally {
      loading.value = false
    }
  })
}

function handleReset() {
  form.value = { studentId: null, classDate: new Date().toISOString().slice(0, 10), startTime: '09:00', endTime: '10:00', hours: 1 }
  formRef.value?.resetFields()
}

onMounted(fetchEligibleStudents)
</script>

<style scoped lang="scss">
.booking-page {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}

.booking-card {
  width: 100%;
  max-width: 600px;

  h3 {
    margin: 0;
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .booking-page {
    padding-top: 0;
  }

  .el-form {
    max-width: 100% !important;
  }
}
</style>
