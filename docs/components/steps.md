# Steps 步骤条

引导用户按步骤完成任务的导航条，由 `eb-step` 声明各步骤（按挂载顺序编号）。容器通过 `active` 自动推算每步状态：索引小于 active 的为完成态、等于的为进行态、大于的为等待态；`status` 可对单个步骤显式覆盖，支持竖向、居中与简洁模式。

## 基础用法

`active` 为当前步骤索引（从 0 开始），步骤状态随其联动变化。

<DemoBlock>
  <eb-steps :active="2">
    <eb-step title="提交申请" description="填写并提交工单" />
    <eb-step title="审核中" description="等待管理员审核" />
    <eb-step title="处理中" description="工程师跟进处理" />
    <eb-step title="已完成" />
  </eb-steps>
</DemoBlock>

## 动态推进

`active` 响应式变化即可驱动步骤条，常与表单分步、向导流程配合；点击按钮观察三种状态（完成 / 进行 / 等待）的切换。

<script setup>
import { ref } from 'vue'

const active = ref(1)
</script>

<DemoBlock>
<eb-steps :active="active" align-center>
  <eb-step title="注册账号" description="填写基础信息" />
  <eb-step title="实名认证" description="上传证件照片" />
  <eb-step title="开通服务" description="选择服务套餐" />
  <eb-step title="完成" />
</eb-steps>
<div style="margin-top: 12px;">
  <eb-button :disabled="active <= 0" @click="active--">上一步</eb-button>
  <eb-button type="primary" :disabled="active >= 3" style="margin-left: 8px;" @click="active++">下一步</eb-button>
</div>
</DemoBlock>

## 竖向与自定义状态

`direction="vertical"` 竖向排列，`space` 控制步骤间距（数字按 px，也可传 CSS 宽度）；`status` 显式指定某步状态（如 error），优先级高于自动推算。

<DemoBlock>
  <eb-steps direction="vertical" :active="1" space="64px">
    <eb-step title="注册账号" description="2026-08-01 完成" />
    <eb-step title="实名认证" description="审核未通过" status="error" />
    <eb-step title="开通服务" description="认证通过后可操作" />
  </eb-steps>
</DemoBlock>

## 状态语义变体

`process-status` 定义当前步骤的样式语义，`finish-status` 定义已完成步骤的样式语义，均支持 wait / process / finish / error / success 五种状态。

<DemoBlock>
  <eb-steps :active="1" process-status="error" align-center>
    <eb-step title="身份校验" />
    <eb-step title="风控审核" description="触发风控规则" />
    <eb-step title="放款" />
  </eb-steps>
</DemoBlock>

## 简洁模式

`simple` 使用轻量样式（无连接线、图标缩小、自动居中，效果等同同时开启 align-center），适合表单顶部或弹窗内的进度提示。

<DemoBlock>
  <eb-steps simple :active="1">
    <eb-step title="下单" />
    <eb-step title="支付" />
    <eb-step title="收货" />
  </eb-steps>
</DemoBlock>

## 图标与插槽

`icon` 传入图标名后替代序号圆圈；`#icon`、`#title`、`#description` 插槽可分别完全接管图标区、标题与描述。

<DemoBlock>
  <eb-steps :active="1" align-center>
    <eb-step title="账号注册" icon="user" description="已注册" />
    <eb-step title="安全验证">
      <template #icon>
        <span style="font-size: 12px; color: var(--eb-color-primary); font-weight: 600;">OTP</span>
      </template>
      <template #description>短信验证码校验</template>
    </eb-step>
    <eb-step title="开通服务" description="等待开始" />
  </eb-steps>
</DemoBlock>

## API

<ApiTable title="Steps Props" :rows="[
  { name: 'active', desc: '当前步骤索引（从 0 开始）', type: 'number', default: '0' },
  { name: 'direction', desc: '排列方向', type: 'horizontal | vertical', default: 'horizontal' },
  { name: 'space', desc: '步骤宽度间距（数字按 px，字符串按 CSS 值），作用于 flex-basis', type: 'number | string', default: '' },
  { name: 'processStatus', desc: '当前步骤状态', type: 'wait | process | finish | error | success', default: 'process' },
  { name: 'finishStatus', desc: '已完成步骤状态', type: 'wait | process | finish | error | success', default: 'finish' },
  { name: 'alignCenter', desc: '标题居中（simple 模式自动生效）', type: 'boolean', default: 'false' },
  { name: 'simple', desc: '简洁模式（自动居中，隐藏连接线）', type: 'boolean', default: 'false' },
]" />

<ApiTable title="Steps Slots" :rows="[
  { name: 'default', desc: 'eb-step 列表', type: '—', default: '—' },
]" />

<ApiTable title="Step Props" :rows="[
  { name: 'title', desc: '步骤标题', type: 'string', default: '' },
  { name: 'description', desc: '步骤描述', type: 'string', default: '' },
  { name: 'icon', desc: '图标名（设置后替代序号圆圈；simple 模式图标为 16px，否则 22px）', type: 'string', default: '' },
  { name: 'status', desc: '手动指定状态，覆盖基于 active 的自动推算', type: 'wait | process | finish | error | success', default: '' },
]" />

<ApiTable title="Step Slots" :rows="[
  { name: 'icon', desc: '自定义图标区（完全接管 head 区域）', type: '—', default: '—' },
  { name: 'title', desc: '自定义标题', type: '—', default: '—' },
  { name: 'description', desc: '自定义描述', type: '—', default: '—' },
]" />
