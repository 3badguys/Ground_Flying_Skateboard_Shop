<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '修改学生' : '新建学生'"
    width="520px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="学生姓名" prop="name">
        <el-input v-model="form.name" placeholder="请输入学生姓名" />
      </el-form-item>
      <el-form-item label="家长姓名" prop="parentName">
        <el-input v-model="form.parentName" placeholder="请输入家长姓名" />
      </el-form-item>
      <el-form-item label="性别" prop="gender">
        <el-select v-model="form.gender" placeholder="请选择性别" style="width: 100%">
          <el-option label="男" value="男" />
          <el-option label="女" value="女" />
        </el-select>
      </el-form-item>
      <el-form-item label="年级" prop="grade">
        <el-select v-model="form.grade" placeholder="请选择年级" style="width: 100%">
          <el-option
            v-for="g in grades"
            :key="g"
            :label="g"
            :value="g"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="联系方式" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入手机号" />
      </el-form-item>
      <el-form-item v-if="!isEdit" label="报名日期" prop="enrollmentDate">
        <el-date-picker
          v-model="form.enrollmentDate"
          type="date"
          placeholder="请选择报名日期"
          style="width: 100%"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <template v-if="!isEdit">
        <el-form-item label="课时">
          <el-input-number v-model="form.hours" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="学费">
          <el-input-number v-model="form.tuition" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单价">
          <el-input :model-value="unitPrice" disabled style="width: 100%" />
          <span style="margin-left: 6px; font-size: 13px; color: #909399">元/课时</span>
        </el-form-item>
      </template>
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
import { createStudent, updateStudent } from '../../api/student'

const props = defineProps<{
  visible: boolean
  data?: {
    id: number
    name: string
    parentName: string
    gender: string
    grade: string
    phone: string
    enrollmentDate: string
  } | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const isEdit = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()

const grades = [
  '幼儿园', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '初一', '初二', '初三', '高一', '高二', '高三', '其他',
]

const initialForm = {
  name: '',
  parentName: '',
  gender: '',
  grade: '',
  phone: '',
  enrollmentDate: '',
  hours: 0,
  tuition: 0,
}

const form = reactive({ ...initialForm })

const unitPrice = computed(() => {
  if (!form.hours || form.hours <= 0) return '0.00'
  return (form.tuition / form.hours).toFixed(2)
})

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: '请输入学生姓名', trigger: 'blur' }],
  parentName: [{ required: true, message: '请输入家长姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  grade: [{ required: true, message: '请选择年级', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入联系方式', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  ...(isEdit.value ? {} : { enrollmentDate: [{ required: true, message: '请选择报名日期', trigger: 'change' }] }),
}))

watch(
  () => props.visible,
  (val) => {
    if (val && props.data) {
      isEdit.value = true
      Object.assign(form, {
        name: props.data.name,
        parentName: props.data.parentName,
        gender: props.data.gender,
        grade: props.data.grade,
        phone: props.data.phone,
        enrollmentDate: props.data.enrollmentDate,
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
      if (isEdit.value && props.data) {
        const { enrollmentDate, hours, tuition, ...updateData } = form
        await updateStudent(props.data.id, updateData)
      } else {
        await createStudent({
          name: form.name,
          parentName: form.parentName,
          gender: form.gender,
          grade: form.grade,
          phone: form.phone,
          enrollmentDate: form.enrollmentDate,
          hours: form.hours,
          tuition: form.tuition,
        })
      }
      emit('success')
      handleClose()
    } finally {
      loading.value = false
    }
  })
}
</script>
