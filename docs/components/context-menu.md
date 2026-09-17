# ContextMenu 右键菜单

在光标处弹出的上下文菜单：默认插槽包裹触发区域，区域内右键即弹出（自动阻止浏览器默认菜单）；`items` 配置驱动菜单内容，也可命令式调用按目标切换菜单，弹层 Teleport 至 body、视口边缘自动翻转钳位。

## 基础用法

把需要响应右键的内容写入默认插槽，菜单项通过 `items` 配置：`label` 文本、`icon` 图标、`command` 指令值（支持字符串、数字、对象等任意类型），点击菜单项抛出 `command` 事件并自动收起。

<DemoBlock>
  <eb-context-menu :items="items" @command="onCommand">
    <div class="cm-stage">右键此区域打开菜单</div>
  </eb-context-menu>
  <p style="margin-top: 8px; font-size: 13px; color: #909399;">最近 command：{{ lastCommand || '右键菜单项试试' }}</p>
</DemoBlock>

## 菜单项形态

`disabled` 置灰禁点、`divided` 顶部分隔线、`danger` 标识删除类危险操作（红色，悬停不转主色）。

<DemoBlock>
  <eb-context-menu :items="styledItems" @command="onCommand">
    <div class="cm-stage">右键查看菜单项形态</div>
  </eb-context-menu>
</DemoBlock>

## 子菜单

菜单项带 `children` 数组即展开一级子菜单：悬停延时弹出、点击父项也可展开；子菜单默认挂在右侧，视口右侧放不下自动翻到左侧，纵向始终钳位在视口内。父项与子项共用同一个 `command` 事件。

<DemoBlock>
  <eb-context-menu :items="subItems" @command="onCommand">
    <div class="cm-stage">右键打开带子菜单的菜单</div>
  </eb-context-menu>
</DemoBlock>

## 命令式调用

不写默认插槽时组件只是命令式引擎：通过模板 ref 调用 `open`，第一个参数传 MouseEvent 或 `{ x, y }` 坐标点，第二个参数可传入临时 items 覆盖配置——同一个菜单实例即可服务多个目标，各自弹出各自的菜单。`close` 与 `visible` 程序化控制显隐，`visible-change` 监听开关。

<DemoBlock>
  <div
    class="cm-stage cm-stage--sub"
    @contextmenu.prevent="fileMenu?.open($event, fileItems)"
  >右键：文件目标</div>
  <div
    class="cm-stage cm-stage--sub"
    @contextmenu.prevent="folderMenu?.open($event, folderItems)"
  >右键：文件夹目标</div>
  <eb-context-menu ref="fileMenu" @command="onCommand" />
  <eb-context-menu ref="folderMenu" @command="onCommand" />
</DemoBlock>

## API

<ApiTable title="ContextMenu Props" :rows="[
  { name: 'items', desc: '菜单项配置数组', type: 'MenuItem[]', default: '[]' },
  { name: 'disabled', desc: '禁用（区域右键与命令式 open 均不弹出）', type: 'boolean', default: 'false' },
]" />

<ApiTable title="MenuItem 配置项" :rows="[
  { name: 'label', desc: '菜单项文本', type: 'string', default: '—' },
  { name: 'icon', desc: '图标名（registry）', type: 'string', default: '—' },
  { name: 'command', desc: '指令值，点击时随 command 事件抛出', type: 'string | number | object', default: '—' },
  { name: 'disabled', desc: '禁用当前项', type: 'boolean', default: 'false' },
  { name: 'divided', desc: '显示顶部分隔线', type: 'boolean', default: 'false' },
  { name: 'danger', desc: '危险操作（红色标识）', type: 'boolean', default: 'false' },
  { name: 'children', desc: '一级子菜单（同 MenuItem 结构）', type: 'MenuItem[]', default: '—' },
]" />

<ApiTable title="ContextMenu Events" :rows="[
  { name: 'command', desc: '菜单项点击（含子菜单项，抛出后自动关闭）', type: '(command) => void', default: '—' },
  { name: 'visible-change', desc: '浮层显隐变化', type: '(visible: boolean) => void', default: '—' },
]" />

<ApiTable title="ContextMenu Slots" :rows="[
  { name: 'default', desc: '触发区域（区域内右键弹出；不写则为纯命令式用法）', type: '—', default: '—' },
]" />

<ApiTable title="ContextMenu Methods" :rows="[
  { name: 'open', desc: '在指定位置弹出（传 MouseEvent 或 { x, y }；第二参可传临时 items 覆盖）', type: '(target, itemsOverride?) => void', default: '—' },
  { name: 'close', desc: '关闭浮层', type: '() => void', default: '—' },
  { name: 'visible', desc: '显隐状态（ref）', type: 'Ref<boolean>', default: '—' },
]" />

<style>
.cm-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  user-select: none;
  cursor: context-menu;
}
.cm-stage--sub {
  height: 72px;
  margin-top: 12px;
}
</style>

<script setup>
import { ref } from 'vue'

const lastCommand = ref('')
function onCommand(cmd) {
  lastCommand.value = typeof cmd === 'object' ? JSON.stringify(cmd) : String(cmd)
}

const fileMenu = ref(null)
const folderMenu = ref(null)

const items = [
  { label: '复制', icon: 'copy', command: 'copy' },
  { label: '粘贴', icon: 'file-copy', command: 'paste' },
  { label: '刷新', icon: 'refresh', command: 'refresh' },
]

const styledItems = [
  { label: '编辑', icon: 'edit', command: 'edit' },
  { label: '共享', icon: 'share', command: 'share', disabled: true },
  { label: '下载', icon: 'download', command: 'download', divided: true },
  { label: '删除', icon: 'delete', command: 'delete', danger: true },
]

const subItems = [
  {
    label: '排序',
    icon: 'refresh',
    children: [
      { label: '按名称', command: 'sort-name' },
      { label: '按大小', command: 'sort-size' },
      { label: '按时间', command: 'sort-time', divided: true },
    ],
  },
  { label: '在侧栏显示', icon: 'link', command: 'pin' },
]

const fileItems = [
  { label: '预览', icon: 'zoom-in', command: 'preview' },
  { label: '重命名', icon: 'pencil', command: 'rename' },
  { label: '删除', icon: 'delete', command: 'delete', divided: true, danger: true },
]

const folderItems = [
  { label: '打开', icon: 'folder-open', command: 'open' },
  { label: '下载', icon: 'download', command: 'download' },
]
</script>
