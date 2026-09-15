# JsonViewer JSON 查看器

JSON 结构化展示：语法着色、层级折叠、一键复制，适合接口调试面板、配置回显。

## 基础用法

<DemoBlock>
  <eb-json-viewer :data="payload" />
</DemoBlock>

## 折叠深度与工具条

`expanded-depth` 控制默认展开层级（0 为全收起）；`toolbar` / `copyable` 可关：

<DemoBlock>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
    <eb-json-viewer :data="payload" :expanded-depth="0" />
    <eb-json-viewer :data="payload" :toolbar="false" :copyable="false" />
  </div>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const payload = ref({
  code: 0,
  message: 'ok',
  data: {
    user: { id: 42, name: 'willove', tags: ['admin', 'beta'] },
    pages: [
      { path: '/dashboard', pv: 12840 },
      { path: '/report', pv: 5210 },
    ],
    extras: null,
  },
})
</script>

<ApiTable title="JsonViewer Props" :rows="[
  { name: 'data', desc: 'JSON 数据（对象 / 数组 / 基础值）', type: 'any', default: '—' },
  { name: 'expanded-depth', desc: '默认展开层级，0 为全收起', type: 'number', default: '2' },
  { name: 'toolbar', desc: '显示工具条', type: 'boolean', default: 'true' },
  { name: 'copyable', desc: '显示复制按钮', type: 'boolean', default: 'true' },
]" />
