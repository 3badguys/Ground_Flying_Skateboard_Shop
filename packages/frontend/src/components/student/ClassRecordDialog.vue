<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '修改上课记录' : '添加上课记录'"
    width="460px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="上课日期" prop="classDate">
        <el-date-picker
          v-model="form.classDate"
          type="date"
          placeholder="请选择上课日期"
          style="width: 100%"
          value-format="YYYY-MM-DD"
          :disabled="isEdit && readonlyDate"
        />
      </el-form-item>
      <el-form-item label="开始时间" prop="startTime">
        <el-time-picker
          v-model="form.startTime"
          format="HH:mm"
          value-format="HH:mm"
          placeholder="请选择开始时间"
          style="width: 100%"
          @change="onTimeChange"
        />
      </el-form-item>
      <el-form-item label="结束时间" prop="endTime">
        <el-time-picker
          v-model="form.endTime"
          format="HH:mm"
          value-format="HH:mm"
          placeholder="请选择结束时间"
          style="width: 100%"
          @change="onTimeChange"
        />
      </el-form-item>
      <el-form-item label="课时" prop="hours">
        <el-input-number v-model="form.hours" :min="1" style="width: 100%" disabled />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { createClassRecord, updateClassRecord } from '../../api/class-record'
import type { ClassRecord } from '../../types/student'

const props = defineProps<{
  visible: boolean
  studentId: number
  data?: ClassRecord | null
  readonlyDate?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const isEdit = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()

const initialForm = { classDate: '', startTime: '', endTime: '', hours: 1 }

const form = reactive({ ...initialForm })

const rules: FormRules = {
  classDate: [{ required: true, message: '请选择上课日期', trigger: 'change' }],
  hours: [{ required: true, message: '请输入课时', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    {
      validator: (_rule, value, callback) => {
        if (form.startTime && value && value <= form.startTime) {
          callback(new Error('结束时间必须大于开始时间'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
}

function onTimeChange() {
  if (!form.startTime || !form.endTime) return
  const [sh, sm] = form.startTime.split(':').map(Number)
  const [eh, em] = form.endTime.split(':').map(Number)
  let minutes = (eh * 60 + em) - (sh * 60 + sm)
  if (minutes <= 0) minutes += 24 * 60
  form.hours = Math.ceil(minutes / 60)
}

watch(
  () => props.visible,
  (val) => {
    if (val && props.data) {
      isEdit.value = true
      const d = props.data as any
      Object.assign(form, {
        classDate: d.classDate,
        startTime: d.startTime || '',
        endTime: d.endTime || '',
        hours: d.hours,
      })
    } else if (val) {
      isEdit.value = false
      Object.assign(form, initialForm)
    }
  },
)

function handleClose() {
  emit('update:visible', false)
  formRef.value?.resetFields()
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const payload: any = { classDate: form.classDate, hours: form.hours }
      if (form.startTime) payload.startTime = form.startTime
      if (form.endTime) payload.endTime = form.endTime
      if (isEdit.value && props.data) {
        await updateClassRecord(props.data.id, payload)
      } else {
        await createClassRecord(props.studentId, payload)
      }
      emit('success')
      handleClose()
    } finally {
      loading.value = false
    }
  })
}
</script>
