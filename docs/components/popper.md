# Popper 浮层基础件

所有浮层组件（Tooltip / Popover / Dropdown / Select 等）共用的定位底座：floating-ui 定位、五种触发方式、延迟显隐与箭头、宽度跟随与虚拟触发。做自定义浮层时可直接用它，普通场景请先用上层组件。

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
const cellEl = ref(null)
const cellShow = ref(false)
function anchorToCell(e) {
  cellEl.value = e.currentTarget
  cellShow.value = true
}
</script>

## 宽度跟随

`match-width` 让浮层最小宽度取触发器宽度，下拉面板与触发器等宽时最省心。

<DemoBlock>
  <eb-popper trigger="click" placement="bottom-start" match-width>
    <template #trigger>
      <eb-button style="width: 260px">点击展开（浮层不窄于此按钮）</eb-button>
    </template>
    <div style="padding: 8px 12px; font-size: 13px">
      浮层内容再短，min-width 也已同步为触发器宽度。
    </div>
  </eb-popper>
</DemoBlock>

## 虚拟触发

浮层不必自带触发元素：`virtual-triggering` 关掉内置包裹元素，参考元素改由 `virtual-ref` 提供，于是一个浮层可以服务多个目标——悬停下面任意一格，同一个浮层就锚到当前格。

<DemoBlock>
  <eb-space wrap size="small">
    <div
      v-for="c in ['今日新增', '待办事项', '异常告警']"
      :key="c"
      style="
        padding: 6px 12px;
        border: 1px solid var(--eb-border-color);
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
      "
      @mouseenter="anchorToCell"
      @mouseleave="cellShow = false"
    >
      {{ c }}
    </div>
  </eb-space>
  <eb-popper
    trigger="manual"
    :visible="cellShow"
    virtual-triggering
    :virtual-ref="cellEl"
    placement="bottom"
  >
    <div style="padding: 8px 12px; font-size: 13px">参考元素换成谁，浮层就锚到谁。</div>
  </eb-popper>
</DemoBlock>

<ApiTable title="Popper Props" :rows="[
  { name: 'placement', desc: '定位方向（floating-ui placement）', type: 'string', default: 'bottom' },
  { name: 'trigger', desc: '触发方式', type: 'hover | click | focus | contextmenu | manual', default: 'hover' },
  { name: 'visible', desc: '浮层显隐（manual 模式受控）', type: 'boolean', default: 'false' },
  { name: 'show-after / hide-after', desc: '出现 / 隐藏延迟（毫秒）。隐藏延迟对所有触发方式生效（click 再次点击、focusout 同样延时收起）；仅外部按下与 disabled 转真走立即收起', type: 'number', default: '0 / 200' },
  { name: 'hide-on-blur', desc: '延迟隐藏期间，指针移入浮层本体取消关闭（hover 保活）；置 false 不绑定浮层悬停监听', type: 'boolean', default: 'true' },
  { name: 'show-arrow', desc: '显示箭头', type: 'boolean', default: 'false' },
  { name: 'offset', desc: '主轴偏移（浮层与触发器的间距，px）', type: 'number', default: '8' },
  { name: 'match-width', desc: '浮层最小宽度跟随触发器宽度（下拉选项与触发器等宽的场景）', type: 'boolean', default: 'false' },
  { name: 'disabled', desc: '禁用触发；打开期间转真立即收起', type: 'boolean', default: 'false' },
  { name: 'popper-class', desc: '浮层类名', type: 'string | array | object', default: '' },
  { name: 'transition-name', desc: '过渡名', type: 'string', default: 'eb-popper-fade' },
  { name: 'virtual-triggering', desc: '虚拟触发：不渲染内置触发器包裹元素，参考元素改由 virtual-ref 提供（供上层组件以自有元素驱动）', type: 'boolean', default: 'false' },
  { name: 'virtual-ref', desc: '外部参考元素本身（非 Vue ref）。可在挂载后异步补入或替换，底座会重绑触发事件', type: 'HTMLElement | null', default: 'null' },
]" />

<ApiTable title="Popper Exposes" :rows="[
  { name: 'show', desc: '当前是否打开（暴露的 ref，实例上读到的即布尔值）', type: 'boolean', default: 'false' },
  { name: 'open()', desc: '命令式打开（受 show-after 延时与 disabled 拦截）', type: '() => void', default: '—' },
  { name: 'close()', desc: '命令式关闭（走 hide-after 延时）', type: '() => void', default: '—' },
  { name: 'update()', desc: '手动重算定位（触发器或内容尺寸变化时）', type: '() => Promise<void>', default: '—' },
  { name: 'referenceRef / floatingRef', desc: '触发器与浮层的元素引用（实例上解包为元素）', type: 'HTMLElement | null', default: '—' },
]" />

<ApiTable title="Popper Slots / Events" :rows="[
  { name: 'trigger（插槽）', desc: '触发元素', type: '—', default: '—' },
  { name: 'default（插槽）', desc: '浮层内容', type: '—', default: '—' },
  { name: 'show / hide', desc: '浮层显隐回调', type: '() => void', default: '—' },
]" />
