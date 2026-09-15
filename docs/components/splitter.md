# Splitter 分隔面板

可拖拽的分栏容器：子面板 [SplitterPanel](#splitterpanel-props) 自渲染拖拽条，尺寸在 min/max 之间夹角互不越界，支持面板折叠与受控尺寸。

## 基础分栏

横向分栏（左右），拖中间的拖拽条调整比例：

<DemoBlock>
  <eb-splitter style="height:180px;border:1px solid var(--eb-border-color);border-radius:8px;overflow:hidden">
    <eb-splitter-panel :default-size="30" min="15%">
      <div style="padding:12px;font-size:13px">导航区 30%</div>
    </eb-splitter-panel>
    <eb-splitter-panel>
      <div style="padding:12px;font-size:13px">内容区（自动分摊）</div>
    </eb-splitter-panel>
    <eb-splitter-panel :default-size="20" min="10%" max="40%">
      <div style="padding:12px;font-size:13px">详情区（10%–40%）</div>
    </eb-splitter-panel>
  </eb-splitter>
</DemoBlock>

## 纵向分栏与折叠

layout 取 `vertical` 上下分栏；`collapsible` 面板出现折叠钮：

<DemoBlock>
  <eb-splitter layout="vertical" style="height:220px;border:1px solid var(--eb-border-color);border-radius:8px;overflow:hidden">
    <eb-splitter-panel :default-size="55" collapsible>
      <div style="padding:12px;font-size:13px">编辑区（可折叠）</div>
    </eb-splitter-panel>
    <eb-splitter-panel :default-size="45">
      <div style="padding:12px;font-size:13px">预览区</div>
    </eb-splitter-panel>
  </eb-splitter>
</DemoBlock>

<ApiTable title="Splitter Props" :rows="[
  { name: 'layout', desc: '分栏方向', type: 'horizontal | vertical', default: 'horizontal' },
]" />

<ApiTable title="Splitter Events" :rows="[
  { name: 'resize', desc: '拖拽后回传各面板尺寸（百分比数组）', type: '(sizes: number[]) => void', default: '—' },
]" />

<ApiTable title="SplitterPanel Props" :rows="[
  { name: 'defaultSize', desc: '初始尺寸（数字按 px，百分比传字符串），未设置时自动分摊', type: 'number | string', default: '—' },
  { name: 'size', desc: '受控尺寸（v-sync 场景）', type: 'number | string', default: '—' },
  { name: 'min / max', desc: '尺寸下限 / 上限', type: 'number | string', default: '—' },
  { name: 'resizable', desc: '是否可拖拽', type: 'boolean', default: 'true' },
  { name: 'collapsible', desc: '显示折叠钮；对象形态可配置折叠方向', type: 'boolean | object', default: 'false' },
]" />
