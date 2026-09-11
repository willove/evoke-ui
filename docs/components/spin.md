# Spin 加载中

加载指示器，三种形态：独立指示、包裹内容（半透明遮罩 + 模糊）、全屏遮罩。支持延迟显示防止闪烁，以及进度百分比展示。

## 独立使用

<DemoBlock>
  <div style="display: flex; gap: 48px; align-items: center;">
    <eb-spin></eb-spin>
    <eb-spin description="数据加载中..."></eb-spin>
    <eb-spin :percent="68" description="正在上传附件"></eb-spin>
  </div>
</DemoBlock>

## 尺寸

<DemoBlock>
  <div style="display: flex; gap: 48px; align-items: center;">
    <eb-spin size="small"></eb-spin>
    <eb-spin></eb-spin>
    <eb-spin size="large"></eb-spin>
  </div>
</DemoBlock>

## 包裹内容

有默认插槽时自动进入包裹模式：加载中给内容加遮罩与模糊，`spinning` 关闭后恢复交互。表格局部刷新推荐这种形态：

<DemoBlock>
  <div>
    <eb-button style="margin-bottom: 12px;" @click="tableSpinning = !tableSpinning">切换刷新状态</eb-button>
    <eb-spin :spinning="tableSpinning" description="正在刷新...">
      <div style="border: 1px solid var(--eb-border-color-light); border-radius: 8px;">
        <div v-for="row in rows" :key="row" style="padding: 10px 16px; border-bottom: 1px solid var(--eb-border-color-lighter); font-size: 13px;">
          订单记录 #{{ 10000 + row }}
        </div>
      </div>
    </eb-spin>
  </div>
</DemoBlock>

## 全屏遮罩

`fullscreen` 模式挂载到 body，适合提交表单、跳转前的整页阻塞；点击开始后 3 秒自动关闭：

<DemoBlock>
  <eb-spin v-if="fullSpinning" fullscreen description="正在提交，请稍候..."></eb-spin>
  <eb-button type="primary" :disabled="fullSpinning" @click="startFull">全屏加载 3 秒</eb-button>
</DemoBlock>

## 延迟显示

`delay`（毫秒）内加载完成则不出现指示器，避免快速接口反复闪烁：

<DemoBlock>
  <eb-spin :spinning="slowSpinning" :delay="500" description="延迟 500ms 显示"></eb-spin>
  <eb-button style="margin-left: 24px;" @click="slowSpinning = !slowSpinning">切换 spinning</eb-button>
</DemoBlock>

<script setup>
import { ref, onBeforeUnmount } from 'vue'

const rows = [1, 2, 3]
const tableSpinning = ref(false)
const fullSpinning = ref(false)
const slowSpinning = ref(false)

let fullTimer = null
function startFull() {
  fullSpinning.value = true
  fullTimer = setTimeout(() => {
    fullSpinning.value = false
  }, 3000)
}
onBeforeUnmount(() => {
  if (fullTimer) clearTimeout(fullTimer)
})
</script>

## Spin API

### Props

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| spinning | Boolean | `true` | 加载中状态 |
| size | String | `'default'` | 尺寸：`small` / `default` / `large` |
| description | String | `''` | 加载文案（`description` 插槽优先） |
| fullscreen | Boolean | `false` | 全屏遮罩（Teleport 到 body） |
| percent | Number / String | — | 进度百分比；传 `'auto'` 显示流动进度 |
| delay | Number | `0` | 延迟显示毫秒数，防闪烁 |

### Slots

| 名称 | 说明 |
| --- | --- |
| default | 包裹的内容（存在时进入包裹模式） |
| indicator | 自定义指示器 |
| description | 自定义加载文案 |

## 指令形态

按钮级/区块级简单加载可用 `v-loading` 指令，Spin 组件适合需要文案/进度/全屏能力的场景。
