# Popper 浮层基础件

所有浮层组件（Tooltip / Popover / Dropdown / Select 等）共用的定位底座：floating-ui 定位、五种触发方式、延迟显隐与箭头。做自定义浮层时可直接用它，普通场景请先用上层组件。

## 悬停触发

<DemoBlock>
  <eb-popper placement="top" show-arrow>
    <template #trigger>
      <eb-button>悬停我（上方 + 箭头）</eb-button>
    </template>
    自定义浮层内容：延迟显隐、自动定位翻转都由底座处理。
  </eb-popper>
</DemoBlock>

## 点击触发与手动模式

`trigger: manual` 时由 `visible` 完全受控：

<DemoBlock>
  <eb-space wrap>
    <eb-popper trigger="click" placement="bottom-start">
      <template #trigger>
        <eb-button>点击展开（左下对齐）</eb-button>
      </template>
      <div style="padding:8px 12px;font-size:13px">点击浮层外部自动关闭。</div>
    </eb-popper>
    <eb-popper trigger="manual" :visible="manualShow" placement="right">
      <template #trigger>
        <eb-button @click="manualShow = !manualShow">手动切换（右侧）</eb-button>
      </template>
      visible 受控显隐。
    </eb-popper>
  </eb-space>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const manualShow = ref(false)
</script>

<ApiTable title="Popper Props" :rows="[
  { name: 'placement', desc: '定位方向（floating-ui placement）', type: 'string', default: 'bottom' },
  { name: 'trigger', desc: '触发方式', type: 'hover | click | focus | contextmenu | manual', default: 'hover' },
  { name: 'visible', desc: '浮层显隐（manual 模式受控）', type: 'boolean', default: 'false' },
  { name: 'show-after / hide-after', desc: '出现 / 隐藏延迟（毫秒）', type: 'number', default: '0 / 200' },
  { name: 'show-arrow', desc: '显示箭头', type: 'boolean', default: 'false' },
  { name: 'disabled', desc: '禁用触发', type: 'boolean', default: 'false' },
  { name: 'popper-class', desc: '浮层类名', type: 'string | array | object', default: '' },
  { name: 'transition-name', desc: '过渡名', type: 'string', default: 'eb-popper-fade' },
]" />

<ApiTable title="Popper Slots / Events" :rows="[
  { name: 'trigger（插槽）', desc: '触发元素', type: '—', default: '—' },
  { name: 'default（插槽）', desc: '浮层内容', type: '—', default: '—' },
  { name: 'show / hide', desc: '浮层显隐回调', type: '() => void', default: '—' },
]" />
