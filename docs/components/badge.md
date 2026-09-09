# Badge 徽标

出现在按钮、图标、头像等元素右上角的徽标：`value` 展示数字或文本，`max` 超限显示 max+，`is-dot` 退化为小红点，`standalone` 时脱离子元素作为行内标签独立使用。value 为空且非红点时不渲染。

## 基础用法

数值型 value 超过 `max` 时截断为 max+；字符串 value 原样展示；`hidden` 为 true 时整体隐藏。

<DemoBlock>
  <ev-space size="middle">
    <ev-badge :value="12">
      <ev-button>消息</ev-button>
    </ev-badge>
    <ev-badge :value="200" :max="99">
      <ev-button>回复</ev-button>
    </ev-badge>
    <ev-badge value="new">
      <ev-button>更新</ev-button>
    </ev-badge>
    <ev-badge is-dot>
      <ev-button>红点提醒</ev-button>
    </ev-badge>
    <ev-badge :value="8" hidden>
      <ev-button>隐藏徽标</ev-button>
    </ev-badge>
  </ev-space>
</DemoBlock>

## 类型与独立使用

`type` 更换底色（默认 danger 红）；`standalone` 时不包裹子元素，徽标作为行内元素独立渲染，适合直接排在文本后面。

<DemoBlock>
  <ev-space size="middle" style="margin-right: 24px;">
    <ev-badge :value="8" type="primary">
      <ev-button>primary</ev-button>
    </ev-badge>
    <ev-badge :value="8" type="success">
      <ev-button>success</ev-button>
    </ev-badge>
    <ev-badge :value="8" type="warning">
      <ev-button>warning</ev-button>
    </ev-badge>
    <ev-badge :value="8" type="info">
      <ev-button>info</ev-button>
    </ev-badge>
  </ev-space>
  <ev-space size="middle">
    <ev-badge value="hot" standalone />
    <ev-badge value="notice" standalone />
  </ev-space>
</DemoBlock>

## 红点配色

红点模式（`is-dot`，忽略 value）同样受 `type` 影响，可用于不同优先级的提醒。

<DemoBlock>
  <ev-space size="middle">
    <ev-badge is-dot type="danger">
      <ev-button>紧急</ev-button>
    </ev-badge>
    <ev-badge is-dot type="primary">
      <ev-button>关注</ev-button>
    </ev-badge>
    <ev-badge is-dot type="success">
      <ev-button>正常</ev-button>
    </ev-badge>
    <ev-badge is-dot type="warning">
      <ev-button>预警</ev-button>
    </ev-badge>
    <ev-badge is-dot type="info">
      <ev-button>低优</ev-button>
    </ev-badge>
  </ev-space>
</DemoBlock>

## 组合图标与头像

default 插槽可包裹任意元素，徽标自动定位到其右上角。

<DemoBlock>
  <ev-space size="middle">
    <ev-badge :value="3">
      <ev-avatar src="https://avatars.githubusercontent.com/u/1?v=4" />
    </ev-badge>
    <ev-badge is-dot>
      <ev-icon name="bell" :size="24" />
    </ev-badge>
    <ev-badge value="荐">
      <ev-button>推荐位</ev-button>
    </ev-badge>
  </ev-space>
</DemoBlock>

## 动态显隐

`hidden` 受控切换，徽标隐藏时子元素布局不受影响。

<script setup>
import { ref } from 'vue'

const hidden = ref(false)
</script>

<DemoBlock>
<ev-space size="middle">
  <ev-badge :value="8" :hidden="hidden">
    <ev-button>消息</ev-button>
  </ev-badge>
  <ev-button @click="hidden = !hidden">{{ hidden ? '显示徽标' : '隐藏徽标' }}</ev-button>
</ev-space>
</DemoBlock>

## API

<ApiTable title="Badge Props" :rows="[
  { name: 'value', desc: '显示值，数字超过 max 时截断为 max+；为空且非红点时不渲染', type: 'string | number', default: '' },
  { name: 'max', desc: '最大值，超出显示 max+（仅数值型 value 生效）', type: 'number', default: '—' },
  { name: 'isDot', desc: '小红点（忽略 value）', type: 'boolean', default: 'false' },
  { name: 'hidden', desc: '隐藏徽标', type: 'boolean', default: 'false' },
  { name: 'type', desc: '底色类型', type: 'primary | success | warning | info | danger', default: 'danger' },
  { name: 'standalone', desc: '独立使用，不定位到子元素右上角', type: 'boolean', default: 'false' },
]" />

<ApiTable title="Badge Slots" :rows="[
  { name: 'default', desc: '被包裹的子元素（徽标定位其右上角；standalone 时不需要）', type: '—', default: '—' },
]" />
