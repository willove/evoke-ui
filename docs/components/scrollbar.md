# Scrollbar 滚动条

自绘滚动条容器：细滚动条样式与页面整体观感一致，支持横向 + 纵向双向 thumb；`native` 时退回系统滚动条。对应轴向没有溢出时不会出现假滚动条。

## 基础用法

固定高度，内容溢出出现纵向滚动条（滚动试试）：

<DemoBlock>
  <eb-scrollbar height="160px">
    <div style="display:grid;gap:8px;padding-right:8px">
      <div v-for="i in 12" :key="i" style="border:1px solid var(--eb-border-color);border-radius:6px;padding:8px 12px;font-size:13px">列表项 {{ i }}</div>
    </div>
  </eb-scrollbar>
</DemoBlock>

## 常驻滚动条与系统样式

`always` 让 thumb 不随滚动消失；`native` 走系统滚动条样式：

<DemoBlock>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
    <eb-scrollbar height="140px" always>
      <div style="display:grid;gap:8px;padding-right:8px">
        <div v-for="i in 8" :key="i" style="border:1px solid var(--eb-border-color);border-radius:6px;padding:8px 12px;font-size:13px">常驻 thumb {{ i }}</div>
      </div>
    </eb-scrollbar>
    <eb-scrollbar height="140px" native>
      <div style="display:grid;gap:8px;padding-right:8px">
        <div v-for="i in 8" :key="i" style="border:1px solid var(--eb-border-color);border-radius:6px;padding:8px 12px;font-size:13px">系统滚动条 {{ i }}</div>
      </div>
    </eb-scrollbar>
  </div>
</DemoBlock>

<ApiTable title="Scrollbar Props" :rows="[
  { name: 'height / maxHeight', desc: '容器高度（数字按 px，字符串原样）', type: 'string | number', default: '—' },
  { name: 'native', desc: '使用系统滚动条样式', type: 'boolean', default: 'false' },
  { name: 'always', desc: 'thumb 常驻显示（默认滚动停止后淡出）', type: 'boolean', default: 'false' },
  { name: 'minSize', desc: 'thumb 最小尺寸（px）', type: 'number', default: '20' },
  { name: 'tag', desc: '内容层渲染的元素标签', type: 'string', default: 'div' },
  { name: 'wrapClass / wrapStyle', desc: '滚动容器层类名与样式', type: 'string | array | object', default: '' },
  { name: 'viewClass / viewStyle', desc: '内容层类名与样式', type: 'string | array | object', default: '' },
]" />
