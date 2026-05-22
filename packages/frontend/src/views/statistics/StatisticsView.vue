<template>
  <div class="stats-page">
    <div class="year-bar">
      <div class="picker-card">
        <el-icon class="picker-icon"><Calendar /></el-icon>
        <el-date-picker
          v-model="year"
          type="year"
          placeholder="选择年份"
          format="YYYY 年"
          value-format="YYYY"
          :clearable="false"
          :editable="false"
          size="large"
          @change="onYearChange"
        />
      </div>
    </div>
    <div class="charts-grid">
      <el-card class="chart-card">
        <template #header>月度收入情况</template>
        <v-chart :option="incomeOption" autoresize style="height: 320px" />
      </el-card>
      <el-card class="chart-card">
        <template #header>月度课时情况</template>
        <v-chart :option="hoursOption" autoresize style="height: 320px" />
      </el-card>
      <el-card class="chart-card">
        <template #header>月度报课学生数</template>
        <v-chart :option="enrollOption" autoresize style="height: 320px" />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { getMonthlyIncome, getMonthlyHours, getMonthlyEnrollment } from '../../api/statistics'

use([CanvasRenderer, BarChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const year = ref(new Date().getFullYear().toString())
const incomeOption = ref({})
const hoursOption = ref({})
const enrollOption = ref({})

async function fetchIncome() {
  const data = (await getMonthlyIncome(parseInt(year.value))) as unknown as any[]
  incomeOption.value = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['报课收入', '完课收入'] },
    xAxis: { type: 'category', data: data.map((d: any) => d.month) },
    yAxis: { type: 'value' },
    series: [
      { name: '报课收入', type: 'line', data: data.map((d: any) => d.income), smooth: true, color: '#409eff' },
      { name: '完课收入', type: 'line', data: data.map((d: any) => d.completed), smooth: true, color: '#67c23a' },
    ],
  }
}

async function fetchHours() {
  const data = (await getMonthlyHours(parseInt(year.value))) as unknown as any[]
  hoursOption.value = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['报课课时', '完课课时'] },
    xAxis: { type: 'category', data: data.map((d: any) => d.month) },
    yAxis: { type: 'value', name: '课时' },
    series: [
      { name: '报课课时', type: 'bar', data: data.map((d: any) => d.enrolled), itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] } },
      { name: '完课课时', type: 'bar', data: data.map((d: any) => d.completed), itemStyle: { color: '#67c23a', borderRadius: [4, 4, 0, 0] } },
    ],
  }
}

async function fetchEnrollment() {
  const data = (await getMonthlyEnrollment(parseInt(year.value))) as unknown as any[]
  enrollOption.value = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['新注册学生', '续课学生'] },
    xAxis: { type: 'category', data: data.map((d: any) => d.month) },
    yAxis: { type: 'value', name: '人' },
    series: [
      { name: '新注册学生', type: 'bar', data: data.map((d: any) => d.newStudents), itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] } },
      { name: '续课学生', type: 'bar', data: data.map((d: any) => d.continuing), itemStyle: { color: '#e6a23c', borderRadius: [4, 4, 0, 0] } },
    ],
  }
}

function onYearChange() {
  fetchIncome()
  fetchHours()
  fetchEnrollment()
}

onMounted(() => {
  fetchIncome()
  fetchHours()
  fetchEnrollment()
})
</script>

<style scoped lang="scss">
.stats-page {
  .year-bar {
    text-align: center;
    margin-bottom: 16px;

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

    :deep(.el-input) { width: 180px; }
    :deep(.el-input__inner) { font-size: 18px; font-weight: 600; text-align: center; }
    :deep(.el-input__prefix) { display: none; }
  }

  .charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .chart-card {
    :deep(.el-card__header) {
      font-weight: 600;
      font-size: 15px;
    }
  }

  @media (max-width: 768px) {
    .charts-grid { grid-template-columns: 1fr; }
  }
}
</style>
