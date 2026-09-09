# Message 全局提示

命令式全局消息：通过 `$message()`（或导入 EvMessage）在页面顶部居中弹出轻提示，多条自动垂直堆叠重排，关闭后其余消息即时上移补位；提供 success / warning / info / error 快捷方法、grouping 合并同文案、showClose 手动关闭、duration 控制时长与 html 片段渲染。

## 基础用法

四种类型由快捷方法一键触发，图标与配色随类型自动匹配；未指定类型时按 info 展示。

<DemoBlock>
  <ev-button @click="$message('普通提示')">消息</ev-button>
  <ev-button @click="$message.success('操作成功')">成功</ev-button>
  <ev-button @click="$message.warning('请注意')">警告</ev-button>
  <ev-button @click="$message.error('操作失败')">错误</ev-button>
</DemoBlock>

## 多种调用形式

支持三种入参：纯字符串（等价 info）、options 对象精细控制、字符串 + options 混用（后者仅覆盖 message 与快捷方法类型）。

<DemoBlock>
  <ev-button @click="$message('字符串调用')">字符串</ev-button>
  <ev-button @click="$message({ message: '对象调用：5 秒后关闭', type: 'success', duration: 5000 })">对象</ev-button>
  <ev-button @click="$message.success('快捷方法 + 追加配置', { showClose: true })">混合调用</ev-button>
</DemoBlock>

## 显示时长与可关闭

`duration` 控制自动关闭毫秒数（默认 3000，设 0 则不自动关闭）；`showClose` 显示右侧关闭按钮，配合 duration 0 可常驻提示；`$message.close()` 一键关闭当前全部实例。

<DemoBlock>
  <ev-button @click="$message({ message: '1 秒后自动关闭', duration: 1000 })">短时长</ev-button>
  <ev-button @click="$message({ message: '点右侧 X 关闭', showClose: true, duration: 0 })">可关闭且常驻</ev-button>
  <ev-button @click="$message.close()">关闭全部</ev-button>
</DemoBlock>

## 居中展示

`center: true` 时图标与文案整体居中，适合空屏引导类轻提示。

<DemoBlock>
  <ev-button @click="$message({ message: '居中展示的消息', center: true })">居中</ev-button>
</DemoBlock>

## 消息堆叠

多条消息自上而下按 16px 间距垂直堆叠，任一条关闭后其余消息平滑上移补位，无需手动管理层级；层级 zIndex 自增分配，始终覆盖页面内容。

<DemoBlock>
  <ev-button @click="$message.success('任务 A 已提交'); $message.warning('任务 B 等待审核'); $message.error('任务 C 校验失败')">连发三条</ev-button>
</DemoBlock>

## 合并相同消息

`grouping: true` 时再次弹出同类型同文案的消息不会新增一条，而是复用现有实例并重置关闭计时，适合轮询刷新、重复提交等场景。

<DemoBlock>
  <ev-button @click="$message({ message: '同步任务进行中', grouping: true })">重复触发（合并为一条）</ev-button>
</DemoBlock>

## HTML 内容与关闭回调

`html: true` 时 message 按 HTML 片段渲染（内容必须可信，警惕 XSS 注入）；`onClose` 在消息关闭（自动到期或手动）时回调。

<DemoBlock>
  <ev-button @click="$message({ message: '支持 <strong>加粗</strong> 片段', html: true })">HTML 内容</ev-button>
  <ev-button @click="$message({ message: '关闭后看控制台', onClose: () => console.log('message closed') })">关闭回调</ev-button>
</DemoBlock>

## 组合场景：删除操作反馈

真实业务的常见组合：发起时 info 提示、成功 success、失败 error 并附带 showClose 便于用户看清失败原因，三种状态共用一套交互语言。

<DemoBlock>
  <ev-button @click="$message.info('正在删除 3 个文件')">开始删除</ev-button>
  <ev-button @click="$message.success('已删除 3 个文件')">删除成功</ev-button>
  <ev-button @click="$message.error('删除失败：文件被占用', { showClose: true })">删除失败</ev-button>
</DemoBlock>

## API

以下 options 适用于全部调用形式；纯字符串调用时仅 message 生效，其余字段取默认值。

<ApiTable title="Message Options" :rows="[
  { name: 'message', desc: '消息文本（调用参数为纯文本时自动写入此字段）', type: 'string', default: '' },
  { name: 'type', desc: '类型，决定图标与配色', type: 'info | success | warning | error', default: 'info' },
  { name: 'duration', desc: '显示时长（毫秒），0 表示不自动关闭', type: 'number', default: '3000' },
  { name: 'show-close', desc: '显示关闭按钮', type: 'boolean', default: 'false' },
  { name: 'center', desc: '文字居中', type: 'boolean', default: 'false' },
  { name: 'grouping', desc: '合并同类型同文案的活动实例（重置计时）', type: 'boolean', default: 'false' },
  { name: 'html', desc: '以 HTML 片段渲染 message（内容由调用方负责转义）', type: 'boolean', default: 'false' },
  { name: 'on-close', desc: '消息关闭回调（自动或手动均触发）', type: '() => void', default: '—' },
  { name: 'z-index / on-destroy', desc: '内部注入参数（弹层层级 / 卸载回调），无需手动传入', type: 'number / Function', default: '—' },
]" />

<ApiTable title="Static Methods" :rows="[
  { name: '$message(options) / $message(message, options)', desc: '弹出消息，返回实例 handle', type: '(options: object | string) => { close }', default: '—' },
  { name: '$message.success / warning / info / error', desc: '按类型快捷弹出（参数为 message 与可选 options）', type: '(message, options?) => { close }', default: '—' },
  { name: '$message.close()', desc: '关闭当前全部消息（与 closeAll 等价）', type: '() => void', default: '—' },
  { name: '$message.closeAll()', desc: 'close 的别名', type: '() => void', default: '—' },
  { name: 'handle.close()', desc: '调用返回值关闭对应单条消息', type: '() => void', default: '—' },
]" />
