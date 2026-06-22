<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '修改课程信息' : '添加课程'"
    width="460px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="报名日期" prop="enrollmentDate">
        <el-date-picker
          v-model="form.enrollmentDate"
          type="date"
          placeholder="请选择报名日期"
          style="width: 100%"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item label="课时" prop="hours">
        <el-input-number v-model="form.hours" :min="1" style="width: 100%" />
      </el-form-item>
      <el-form-item label="学费" prop="tuition">
        <el-input-number v-model="form.tuition" :min="0" :precision="2" style="width: 100%" />
      </el-form-item>
      <el-form-item label="单价">
        <el-input :model-value="unitPrice" disabled style="width: 100%" />
        <span style="margin-left: 6px; font-size: 13px; color: #909399">元/课时</span>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { createCourseInfo, updateCourseInfo } from '../../api/course-info'
import type { CourseInfo } from '../../types/student'

const props = defineProps<{
  visible: boolean
  studentId: number
  data?: CourseInfo | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const isEdit = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()

const initialForm = { hours: 1, tuition: 0, enrollmentDate: '' }

const form = reactive({ ...initialForm })

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

const unitPrice = computed(() => {
  if (!form.hours || form.hours <= 0) return '0.00'
  return (form.tuition / form.hours).toFixed(2)
})

const rules: FormRules = {
  hours: [{ required: true, message: '请输入课时', trigger: 'blur' }],
  tuition: [{ required: true, message: '请输入学费', trigger: 'blur' }],
  enrollmentDate: [{ required: true, message: '请选择报名日期', trigger: 'change' }],
}

watch(
  () => props.visible,
  (val) => {
    if (val && props.data) {
      isEdit.value = true
      Object.assign(form, {
        hours: props.data.hours,
        tuition: props.data.tuition,
        enrollmentDate: props.data.enrollmentDate,
      })
    } else if (val) {
      isEdit.value = false
      Object.assign(form, { ...initialForm, enrollmentDate: getToday() })
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
      if (isEdit.value && props.data) {
        await updateCourseInfo(props.data.id, { ...form })
      } else {
        await createCourseInfo(props.studentId, { ...form })
      }
      emit('success')
      handleClose()
    } finally {
      loading.value = false
    }
  })
}
</script>
