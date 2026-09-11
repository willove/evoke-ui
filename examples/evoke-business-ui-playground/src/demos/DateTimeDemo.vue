<template>
  <section class="demo">
    <h2>EbDatePicker / EbTimePicker / EbTimeSelect / EbCascader</h2>

    <h3>EbDatePicker</h3>
    <div class="demo-row">
      <span class="demo-label">日期</span>
      <eb-date-picker v-model="date" placeholder="选择日期" style="width: 220px" />
      <eb-date-picker v-model="dateStr" value-format="YYYY-MM-DD" placeholder="value-format" style="width: 200px" />
    </div>
    <div class="demo-row">
      <span class="demo-label">日期时间</span>
      <eb-date-picker v-model="datetime" type="datetime" default-time="09:30:00" style="width: 240px" />
    </div>
    <div class="demo-row">
      <span class="demo-label">区间</span>
      <eb-date-picker v-model="range" type="daterange" style="width: 320px" :shortcuts="rangeShortcuts" />
    </div>
    <div class="demo-row">
      <span class="demo-label">月/年</span>
      <eb-date-picker v-model="month" type="month" style="width: 180px" />
      <eb-date-picker v-model="year" type="year" style="width: 160px" />
    </div>
    <div class="demo-row">
      <span class="demo-label">禁用</span>
      <eb-date-picker
        v-model="date"
        :disabled-date="(d) => d.getDay() === 0 || d.getDay() === 6"
        placeholder="禁用周末"
        style="width: 220px"
      />
    </div>
    <p class="hint">date={{ date ? String(date) : null }} / range={{ range }}</p>

    <h3>EbTimePicker / EbTimeSelect</h3>
    <div class="demo-row">
      <span class="demo-label">时间</span>
      <eb-time-picker v-model="time" style="width: 200px" />
      <eb-time-picker v-model="timeStr" value-format="HH:mm" format="HH:mm" style="width: 180px" />
    </div>
    <div class="demo-row">
      <span class="demo-label">区间</span>
      <eb-time-picker v-model="timeRange" is-range style="width: 280px" />
    </div>
    <div class="demo-row">
      <span class="demo-label">下拉</span>
      <eb-time-select v-model="timeSel" start="08:00" end="20:00" step="01:00" style="width: 200px" />
    </div>

    <h3>EbCascader</h3>
    <div class="demo-row">
      <span class="demo-label">基础</span>
      <eb-cascader v-model="region" :options="regionOptions" placeholder="选择区域" style="width: 280px" />
      <eb-cascader v-model="regionLeaf" :options="regionOptions" :props="{ emitPath: false }" placeholder="emitPath=false" style="width: 220px" />
    </div>
    <div class="demo-row">
      <span class="demo-label">多选</span>
      <eb-cascader v-model="regionMulti" :options="regionOptions" multiple collapse-tags style="width: 320px" />
    </div>
    <div class="demo-row">
      <span class="demo-label">过滤</span>
      <eb-cascader v-model="region" :options="regionOptions" filterable placeholder="输入过滤" style="width: 280px" />
    </div>
    <p class="hint">region={{ region }} / multi={{ regionMulti }}</p>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const date = ref(new Date())
const dateStr = ref('')
const datetime = ref(null)
const range = ref(null)
const month = ref(null)
const year = ref(null)

const rangeShortcuts = [
  { text: '最近 7 天', value: () => { const e = new Date(); const s = new Date(Date.now() - 6 * 864e5); return [s, e] } },
  { text: '本月', value: () => { const d = new Date(); return [new Date(d.getFullYear(), d.getMonth(), 1), d] } },
]

const time = ref(new Date())
const timeStr = ref('09:30')
const timeRange = ref(null)
const timeSel = ref('09:00')

const region = ref(null)
const regionLeaf = ref(null)
const regionMulti = ref([])

const regionOptions = [
  {
    value: 'zhejiang', label: '浙江', children: [
      { value: 'hangzhou', label: '杭州', children: [{ value: 'xihu', label: '西湖区' }, { value: 'binjiang', label: '滨江区' }] },
      { value: 'ningbo', label: '宁波', children: [{ value: 'haishu', label: '海曙区' }] },
    ],
  },
  {
    value: 'jiangsu', label: '江苏', children: [
      { value: 'nanjing', label: '南京', children: [{ value: 'xuanwu', label: '玄武区' }] },
      { value: 'suzhou', label: '苏州' },
    ],
  },
]
</script>
