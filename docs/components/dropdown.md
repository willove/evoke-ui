# Dropdown 下拉菜单

<script setup>
import { ref } from 'vue'

const lastCommand = ref('')
function onCommand(cmd) {
  lastCommand.value = typeof cmd === 'object' ? JSON.stringify(cmd) : String(cmd)
}
const dropRef = ref(null)
</script>

将动作或菜单收纳进触发区弹层：支持 hover / click / contextmenu 触发与 split-button 按钮组形态，弹层 Teleport 至 body 自动定位翻转，item 点击抛出 command 事件并自动收起，另提供命令式 open / close。

## 基础用法

触发区内容放 `#trigger` 插槽（保留下拉箭头），菜单项放在 `#dropdown` 的 ev-dropdown-menu 内；item 的 `label` / `icon` 是默认插槽的兜底，写入插槽内容时以插槽为准。

<DemoBlock>
  <ev-dropdown>
    <template #trigger>更多操作</template>
    <template #dropdown>
      <ev-dropdown-menu>
        <ev-dropdown-item icon="plus" label="新建" command="new" />
        <ev-dropdown-item icon="edit" label="编辑" command="edit" />
        <ev-dropdown-item icon="delete" label="删除" command="del" disabled />
        <ev-dropdown-item icon="download" label="导出" command="export" divided />
      </ev-dropdown-menu>
    </template>
  </ev-dropdown>
</DemoBlock>

## command 事件

item 的 `command` 随事件抛出（支持字符串、数字、对象等任意类型），抛出后浮层自动收起；未设置 command 时值为 undefined。

<DemoBlock>
  <ev-dropdown @command="onCommand">
    <template #trigger>分享到</template>
    <template #dropdown>
      <ev-dropdown-menu>
        <ev-dropdown-item icon="link" label="复制链接" command="copy-link" />
        <ev-dropdown-item icon="message" label="站内信" command="mail" />
        <ev-dropdown-item :command="{ id: 3, name: '钉钉' }">钉钉（对象指令）</ev-dropdown-item>
      </ev-dropdown-menu>
    </template>
  </ev-dropdown>
  <p style="margin-top: 8px; font-size: 13px; color: #909399;">最近 command：{{ lastCommand || '点击菜单项试试' }}</p>
</DemoBlock>

## 触发方式与按钮组

`trigger` 支持 hover（默认，含开合延时）/ click / contextmenu（触发区右键弹出）；`split-button` 拆为主按钮 + 箭头按钮，主按钮点击触发 click 事件，此时菜单项直接写入默认插槽。

<DemoBlock>
  <ev-dropdown trigger="click">
    <template #trigger>点击触发</template>
    <template #dropdown>
      <ev-dropdown-menu>
        <ev-dropdown-item label="选项 A" command="a" />
        <ev-dropdown-item label="选项 B" command="b" />
      </ev-dropdown-menu>
    </template>
  </ev-dropdown>
  <ev-dropdown split-button type="primary" text="发布" placement="top" style="margin-left: 48px;">
    <ev-dropdown-item label="存草稿" command="draft" />
    <ev-dropdown-item label="定时发布" command="schedule" divided />
  </ev-dropdown>
</DemoBlock>

## 右键触发与弹层位置

`trigger="contextmenu"` 在触发区右键弹出（自动阻止浏览器默认菜单）；`placement` 调整弹层方位，可视空间不足时自动翻转。

<DemoBlock>
  <ev-dropdown trigger="contextmenu" placement="top-start">
    <template #trigger>右键此区域打开菜单</template>
    <template #dropdown>
      <ev-dropdown-menu>
        <ev-dropdown-item icon="copy" label="复制" command="copy" />
        <ev-dropdown-item icon="delete" label="删除" command="delete" divided />
      </ev-dropdown-menu>
    </template>
  </ev-dropdown>
</DemoBlock>

## 禁用与开合延时

`disabled` 整体禁用（触发与弹出均失效，与 item 级 disabled 区分）；hover 触发下 `show-timeout` / `hide-timeout` 分别控制展开与收起延时（毫秒）。

<DemoBlock>
  <ev-dropdown disabled>
    <template #trigger>禁用状态</template>
    <template #dropdown>
      <ev-dropdown-menu>
        <ev-dropdown-item label="选项 A" command="a" />
      </ev-dropdown-menu>
    </template>
  </ev-dropdown>
  <ev-dropdown :show-timeout="0" :hide-timeout="800" style="margin-left: 48px;">
    <template #trigger>立即展开、缓慢收起</template>
    <template #dropdown>
      <ev-dropdown-menu>
        <ev-dropdown-item label="选项 A" command="a" />
        <ev-dropdown-item label="选项 B" command="b" />
      </ev-dropdown-menu>
    </template>
  </ev-dropdown>
</DemoBlock>

## 命令式开关

通过模板 ref 调用 open / close 方法程序化控制浮层，`visible-change` 事件可监听显隐变化；ESC 或点击外部区域也会关闭。

<DemoBlock>
  <ev-button @click="dropRef?.open()">打开</ev-button>
  <ev-button style="margin-left: 8px;" @click="dropRef?.close()">关闭</ev-button>
  <ev-dropdown ref="dropRef" trigger="click" style="margin-left: 16px;">
    <template #trigger>目标菜单</template>
    <template #dropdown>
      <ev-dropdown-menu>
        <ev-dropdown-item label="选项 A" command="a" />
        <ev-dropdown-item label="选项 B" command="b" />
      </ev-dropdown-menu>
    </template>
  </ev-dropdown>
</DemoBlock>

## API

<ApiTable title="Dropdown Props" :rows="[
  { name: 'trigger', desc: '触发方式', type: 'hover | click | contextmenu', default: 'hover' },
  { name: 'placement', desc: '弹层位置（空间不足自动翻转）', type: 'string', default: 'bottom' },
  { name: 'disabled', desc: '禁用', type: 'boolean', default: 'false' },
  { name: 'split-button', desc: '按钮组形态（主按钮 + 箭头按钮）', type: 'boolean', default: 'false' },
  { name: 'type / size', desc: 'split-button 按钮类型 / 尺寸（large、small）', type: 'string', default: '' },
  { name: 'text', desc: 'split-button 主按钮文本（trigger 插槽兜底）', type: 'string', default: '' },
  { name: 'show-timeout / hide-timeout', desc: '打开 / 关闭延时（hover）', type: 'number', default: '250 / 150' },
]" />

<ApiTable title="DropdownItem Props" :rows="[
  { name: 'command', desc: '指令值，点击时随 command 事件抛出', type: 'string | number | object', default: '—' },
  { name: 'label', desc: '文本（默认插槽兜底）', type: 'string', default: '' },
  { name: 'icon', desc: '图标名（默认插槽兜底）', type: 'string', default: '' },
  { name: 'disabled', desc: '禁用当前项', type: 'boolean', default: 'false' },
  { name: 'divided', desc: '显示上分隔线', type: 'boolean', default: 'false' },
]" />

<ApiTable title="Dropdown Events" :rows="[
  { name: 'visible-change', desc: '浮层显隐变化', type: '(visible: boolean) => void', default: '—' },
  { name: 'command', desc: '菜单项点击（抛出后自动关闭）', type: '(command) => void', default: '—' },
  { name: 'click', desc: 'split-button 主按钮点击', type: '(e: MouseEvent) => void', default: '—' },
]" />

<ApiTable title="Dropdown Slots" :rows="[
  { name: 'trigger', desc: '触发区内容（位于默认触发样式内，带箭头）', type: '—', default: '—' },
  { name: 'default', desc: '自定义触发区（整体替换默认触发样式；同时渲染进浮层默认菜单）', type: '—', default: '—' },
  { name: 'dropdown', desc: '浮层内容（默认以 ev-dropdown-menu 包裹 default 插槽）', type: '—', default: '—' },
  { name: 'default（DropdownItem）', desc: '菜单项内容，缺省渲染 icon + label', type: '—', default: '—' },
]" />

<ApiTable title="Dropdown Methods" :rows="[
  { name: 'open', desc: '打开浮层', type: '() => void', default: '—' },
  { name: 'close', desc: '关闭浮层', type: '() => void', default: '—' },
  { name: 'visible', desc: '显隐状态（ref）', type: 'Ref<boolean>', default: '—' },
]" />

<ApiTable title="DropdownMenu Props" :rows="[
  { name: '—', desc: '菜单容器，无 props，仅提供 default 插槽收纳 ev-dropdown-item', type: '—', default: '—' },
]" />
