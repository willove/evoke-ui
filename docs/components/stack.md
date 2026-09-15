# Stack 卡片堆叠

层叠卡片交互件：卡片按方向堆叠，悬停剥离、点击循环/移除，适合待办池、牌组抽卡、相册精选这类「一摞东西」的界面。内容经 `item` 插槽完全自定义。

## 卡片堆叠（悬停剥离）

悬停时顶部卡片剥离露出下层，点击进入下一张（cycle）：

<DemoBlock>
  <div style="display:flex;justify-content:center;padding:20px 0">
    <eb-stack :items="cards" variant="card" direction="bottom" hover-peel>
      <template #item="{ item }">
        <div style="width:220px;height:100px;border-radius:10px;background:var(--eb-bg-color);border:1px solid var(--eb-border-color);display:flex;flex-direction:column;justify-content:center;padding:0 18px">
          <strong style="font-size:14px">{{ item.title }}</strong>
          <span style="font-size:12px;color:var(--eb-text-color-secondary)">{{ item.desc }}</span>
        </div>
      </template>
    </eb-stack>
  </div>
</DemoBlock>

## 圆形堆叠（点击移除）

variant 取 `circular`；`click-mode: remove` 点击即移除并回传 `remove` 事件：

<DemoBlock>
  <div style="display:flex;justify-content:center;padding:10px 0">
    <eb-stack :items="avatars" variant="circular" direction="right" click-mode="remove" :size="56">
      <template #item="{ item }">
        <div style="width:100%;height:100%;border-radius:50%;background:var(--eb-color-primary-light-7);color:var(--eb-color-primary);display:flex;align-items:center;justify-content:center;font-weight:600">{{ item.initial }}</div>
      </template>
    </eb-stack>
  </div>
  <eb-text size="small" type="info" style="display:block;text-align:center">剩余 {{ avatars.length }} 位（点击头像移除）</eb-text>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const cards = ref([
  { title: '需求评审', desc: '今天 14:00 · 3 号会议室' },
  { title: '版本发布', desc: '明天 20:00 · 灰度 20%' },
  { title: '季度复盘', desc: '周五 10:00 · 全员' },
])
const avatars = ref([
  { initial: '张' },
  { initial: '李' },
  { initial: '王' },
  { initial: '赵' },
])
</script>

<ApiTable title="Stack Props" :rows="[
  { name: 'items', desc: '卡片数据（内容经 item 插槽渲染）', type: 'array', default: '[]' },
  { name: 'variant', desc: '形态', type: 'card | circular', default: 'card' },
  { name: 'direction', desc: '堆叠方向（八向）', type: 'top | bottom | left | right | top-left | top-right | bottom-left | bottom-right', default: 'bottom' },
  { name: 'click-mode', desc: '点击行为：循环换位 / 移除', type: 'cycle | remove', default: 'cycle' },
  { name: 'hover-peel', desc: '悬停剥离顶层', type: 'boolean', default: 'false' },
  { name: 'size', desc: 'circular 直径（px）', type: 'number', default: '40' },
  { name: 'scale-step', desc: '层间缩放步长', type: 'number', default: '0.06' },
  { name: 'offset', desc: '层间偏移（px），缺省按 variant 内定', type: 'number', default: '—' },
  { name: 'duration', desc: '动效时长（毫秒）', type: 'number', default: '450' },
]" />

<ApiTable title="Stack Slots / Events / Exposes" :rows="[
  { name: 'item（插槽）', desc: '卡片内容，作用域：{ item, index }', type: '—', default: '—' },
  { name: 'cycle', desc: '点击循环换位后触发', type: '() => void', default: '—' },
  { name: 'remove', desc: '点击移除后触发', type: '() => void', default: '—' },
  { name: 'promote', desc: '置顶后触发', type: '() => void', default: '—' },
  { name: 'exposes', desc: 'cycle() / remove() / promoteToTop() 编程式操作', type: 'functions', default: '—' },
]" />
