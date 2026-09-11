# Badge 徽标

出现在按钮、图标、头像等元素右上角的徽标：`value` 展示数字或文本，`max` 超限显示 max+，`is-dot` 退化为小红点，`standalone` 时脱离子元素作为行内标签独立使用。value 为空且非红点时不渲染。

## 基础用法

数值型 value 超过 `max` 时截断为 max+；字符串 value 原样展示；`hidden` 为 true 时整体隐藏。

<DemoBlock>
  <eb-space size="middle">
    <eb-badge :value="12">
      <eb-button>消息</eb-button>
    </eb-badge>
    <eb-badge :value="200" :max="99">
      <eb-button>回复</eb-button>
    </eb-badge>
    <eb-badge value="new">
      <eb-button>更新</eb-button>
    </eb-badge>
    <eb-badge is-dot>
      <eb-button>红点提醒</eb-button>
    </eb-badge>
    <eb-badge :value="8" hidden>
      <eb-button>隐藏徽标</eb-button>
    </eb-badge>
  </eb-space>
</DemoBlock>

## 类型与独立使用

`type` 更换底色（默认 danger 红）；`standalone` 时不包裹子元素，徽标作为行内元素独立渲染，适合直接排在文本后面。

<DemoBlock>
  <eb-space size="middle" style="margin-right: 24px;">
    <eb-badge :value="8" type="primary">
      <eb-button>primary</eb-button>
    </eb-badge>
    <eb-badge :value="8" type="success">
      <eb-button>success</eb-button>
    </eb-badge>
    <eb-badge :value="8" type="warning">
      <eb-button>warning</eb-button>
    </eb-badge>
    <eb-badge :value="8" type="info">
      <eb-button>info</eb-button>
    </eb-badge>
  </eb-space>
  <eb-space size="middle">
    <eb-badge value="hot" standalone />
    <eb-badge value="notice" standalone />
  </eb-space>
</DemoBlock>

## 红点配色

红点模式（`is-dot`，忽略 value）同样受 `type` 影响，可用于不同优先级的提醒。

<DemoBlock>
  <eb-space size="middle">
    <eb-badge is-dot type="danger">
      <eb-button>紧急</eb-button>
    </eb-badge>
    <eb-badge is-dot type="primary">
      <eb-button>关注</eb-button>
    </eb-badge>
    <eb-badge is-dot type="success">
      <eb-button>正常</eb-button>
    </eb-badge>
    <eb-badge is-dot type="warning">
      <eb-button>预警</eb-button>
    </eb-badge>
    <eb-badge is-dot type="info">
      <eb-button>低优</eb-button>
    </eb-badge>
  </eb-space>
</DemoBlock>

## 组合图标与头像

default 插槽可包裹任意元素，徽标自动定位到其右上角。

<DemoBlock>
  <eb-space size="middle">
    <eb-badge :value="3">
      <eb-avatar src="https://avatars.githubusercontent.com/u/1?v=4" />
    </eb-badge>
    <eb-badge is-dot>
      <eb-icon name="bell" :size="24" />
    </eb-badge>
    <eb-badge value="荐">
      <eb-button>推荐位</eb-button>
    </eb-badge>
  </eb-space>
</DemoBlock>

## 动态显隐

`hidden` 受控切换，徽标隐藏时子元素布局不受影响。

<script setup>
import { ref } from 'vue'

const hidden = ref(false)
</script>

<DemoBlock>
<eb-space size="middle">
  <eb-badge :value="8" :hidden="hidden">
    <eb-button>消息</eb-button>
  </eb-badge>
  <eb-button @click="hidden = !hidden">{{ hidden ? '显示徽标' : '隐藏徽标' }}</eb-button>
</eb-space>
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
