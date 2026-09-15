# Notify 通知提醒

角落通知：系统级消息、异步任务结果的轻量提醒，自动消失、可手动关闭。与 [Message](/components/message) 的分工——Message 居中打断感更强，Notify 落在角落适合结果类通知。

## 基础用法

对象式传 `title` + `message`；四个快捷方法覆盖常用类型：

<DemoBlock>
  <eb-space wrap>
    <eb-button @click="$notify.success('发布成功', '新版本已上线')">success</eb-button>
    <eb-button @click="$notify.info('同步开始', '正在拉取最新数据')">info</eb-button>
    <eb-button @click="$notify.warning('配额将满', '存储用量已达 92%')">warning</eb-button>
    <eb-button @click="$notify.error('同步失败', '网络连接中断')">error</eb-button>
    <eb-button @click="$notify({ title: '导出完成', message: '报表已发送至您的邮箱', type: 'success' })">对象式调用</eb-button>
  </eb-space>
</DemoBlock>

## 不自动关闭与关闭回调

`duration: 0` 表示常驻，只能手动关闭；`onClose` 在通知消失时回调：

<DemoBlock>
  <eb-button @click="$notify.success('任务进行中', '点击右上角关闭', { duration: 0 })">常驻通知</eb-button>
  <eb-button @click="$notify({ title: '已受理', message: '关闭后看控制台', onClose: () => console.log('notify closed') })">关闭回调</eb-button>
</DemoBlock>

## 位置

`position` 支持四角（默认 top-right）：

<DemoBlock>
  <eb-space wrap>
    <eb-button @click="$notify.success('左上角', 'top-left', { position: 'top-left' })">top-left</eb-button>
    <eb-button @click="$notify.success('左下角', 'bottom-left', { position: 'bottom-left' })">bottom-left</eb-button>
    <eb-button @click="$notify.success('右下角', 'bottom-right', { position: 'bottom-right' })">bottom-right</eb-button>
  </eb-space>
</DemoBlock>

<ApiTable title="Notify Options" :rows="[
  { name: 'title', desc: '通知标题', type: 'string', default: '' },
  { name: 'message', desc: '通知内容', type: 'string', default: '' },
  { name: 'type', desc: '类型，决定图标与配色', type: 'info | success | warning | error', default: 'info' },
  { name: 'duration', desc: '显示时长（毫秒），0 表示不自动关闭', type: 'number', default: '4500' },
  { name: 'showClose', desc: '显示关闭按钮', type: 'boolean', default: 'true' },
  { name: 'position', desc: '停靠位置（四角）', type: 'top-right | top-left | bottom-right | bottom-left', default: 'top-right' },
  { name: 'onClose', desc: '关闭回调（自动到期或手动关闭均触发）', type: '() => void', default: '—' },
]" />

<ApiTable title="快捷方法" :rows="[
  { name: '$notify.success / info / warning / error', desc: '(title, message?, options?) 按类型快捷调用', type: '(title, message, options) => void', default: '—' },
]" />
