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

layout 取 `vertical` 上下分栏；`collapsible` 面板在拖拽条上出现折叠钮，点击把面板尺寸折叠进相邻面板：

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

## 受控尺寸与 resize 事件

面板传 `size` 即受控，外部改值后重新分摊；`resize` 在拖拽、折叠及初始化后回传各面板占比（如 `30.00%` 的字符串数组）：

<DemoBlock>
  <eb-space wrap style="margin-bottom: 8px">
    <eb-button @click="navSize = 160">导航 160px</eb-button>
    <eb-button @click="navSize = 260">导航 260px</eb-button>
    <eb-text size="small" type="info">各面板占比：{{ splitRatio }}</eb-text>
  </eb-space>
  <eb-splitter style="height:180px;border:1px solid var(--eb-border-color);border-radius:8px;overflow:hidden" @resize="onSplitResize">
    <eb-splitter-panel :size="navSize" min="10%">
      <div style="padding:12px;font-size:13px">导航区（受控）</div>
    </eb-splitter-panel>
    <eb-splitter-panel>
      <div style="padding:12px;font-size:13px">内容区（自动分摊）</div>
    </eb-splitter-panel>
  </eb-splitter>
</DemoBlock>

## 嵌套分栏

Splitter 可嵌套使用（内层给满高度），组合出经典的三栏工作台布局：

<DemoBlock>
  <eb-splitter style="height:260px;border:1px solid var(--eb-border-color);border-radius:8px;overflow:hidden">
    <eb-splitter-panel :default-size="22" min="15%">
      <div style="padding:12px;font-size:13px">目录</div>
    </eb-splitter-panel>
    <eb-splitter-panel>
      <eb-splitter layout="vertical" style="height:100%">
        <eb-splitter-panel :default-size="60">
          <div style="padding:12px;font-size:13px">编辑器（纵向嵌套）</div>
        </eb-splitter-panel>
        <eb-splitter-panel>
          <div style="padding:12px;font-size:13px">终端输出</div>
        </eb-splitter-panel>
      </eb-splitter>
    </eb-splitter-panel>
    <eb-splitter-panel :default-size="20" collapsible>
      <div style="padding:12px;font-size:13px">属性面板</div>
    </eb-splitter-panel>
  </eb-splitter>
</DemoBlock>

<script setup>
import { ref } from 'vue'

const navSize = ref(200)
const splitRatio = ref('—')
const onSplitResize = (sizes) => {
  splitRatio.value = sizes.join(' / ')
}
</script>

<ApiTable title="Splitter Props" :rows="[
  { name: 'layout', desc: '分栏方向', type: 'horizontal | vertical', default: 'horizontal' },
]" />

<ApiTable title="Splitter Events" :rows="[
  { name: 'resize', desc: '拖拽、折叠或初始化后回传各面板尺寸占比（如 30.00%）的字符串数组', type: '(sizes: string[]) => void', default: '—' },
]" />

<ApiTable title="SplitterPanel Props" :rows="[
  { name: 'defaultSize', desc: '初始尺寸（数字按 px，百分比传字符串），未设置时自动分摊', type: 'number | string', default: '—' },
  { name: 'size', desc: '受控尺寸（v-sync 场景）', type: 'number | string', default: '—' },
  { name: 'min / max', desc: '尺寸下限 / 上限', type: 'number | string', default: '—' },
  { name: 'resizable', desc: '是否可拖拽', type: 'boolean', default: 'true' },
  { name: 'collapsible', desc: '显示折叠钮；对象形态可配置折叠方向', type: 'boolean | object', default: 'false' },
]" />
