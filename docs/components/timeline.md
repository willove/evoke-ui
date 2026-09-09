# Timeline 时间轴

垂直时间轴，按时间顺序展示一系列节点。竖向轴线与圆点居中对齐、逐节点连贯绘制；支持左右交替排列、时间戳四种位置、语义色 / 任意色圆点、图标与自定义圆点、末尾加载占位幽灵节点。

## 基础用法

节点内容写在 `ev-timeline-item` 默认插槽，`timestamp` 显示时间戳（默认在内容下方），`type` 设置语义色圆点。

<DemoBlock>
  <ev-timeline>
    <ev-timeline-item timestamp="2026-08-01 09:00" type="primary">创建订单</ev-timeline-item>
    <ev-timeline-item timestamp="2026-08-01 10:30" type="success">支付完成</ev-timeline-item>
    <ev-timeline-item timestamp="2026-08-01 12:00" type="warning">等待发货</ev-timeline-item>
    <ev-timeline-item timestamp="2026-08-02 08:00" type="info">订单关闭</ev-timeline-item>
  </ev-timeline>
</DemoBlock>

## 左右交替

`mode="alternate"` 时节点按奇偶交替分布在轴两侧，配合 `label` 在对侧显示标签；`variant="filled"` 切换为实心圆点（item 同名属性可单独覆盖容器）。

<DemoBlock>
  <ev-timeline mode="alternate" variant="filled">
    <ev-timeline-item label="08-01" timestamp="09:00" type="primary">需求评审通过</ev-timeline-item>
    <ev-timeline-item label="08-02" timestamp="14:00" type="success">开发联调完成</ev-timeline-item>
    <ev-timeline-item label="08-03" timestamp="10:00" type="danger">修复线上缺陷</ev-timeline-item>
  </ev-timeline>
</DemoBlock>

## 时间戳位置 placement

`placement` 支持四种位置：`top` / `bottom` 把时间戳放在节点内容上方或下方；`start` / `end` 把时间戳移到轴的对侧（`left` 模式下在轴右侧），可同时与 `label` 共存于两侧。

<DemoBlock>
  <ev-timeline style="padding-left: 110px; padding-right: 110px;">
    <ev-timeline-item timestamp="2026-08-01 09:00" placement="top">时间戳在内容上方</ev-timeline-item>
    <ev-timeline-item timestamp="2026-08-01 10:30">默认在内容下方</ev-timeline-item>
    <ev-timeline-item timestamp="09:45" placement="start">时间戳移到轴左侧</ev-timeline-item>
    <ev-timeline-item timestamp="10:45" placement="end">时间戳移到轴右侧</ev-timeline-item>
  </ev-timeline>
</DemoBlock>

## 自定义颜色与空心

`color` 支持任意色值，也接受语义色名（primary / success / warning / danger / info、blue / green / red / gray / warning，自动映射主题 token）；`hollow` 强制该节点为空心圆点（在 filled 容器中可单独回退为描边样式）。

<DemoBlock>
  <ev-timeline variant="filled">
    <ev-timeline-item color="#722ed1">任意色值</ev-timeline-item>
    <ev-timeline-item color="green">语义色名映射主题 token</ev-timeline-item>
    <ev-timeline-item hollow>空心圆点</ev-timeline-item>
  </ev-timeline>
</DemoBlock>

## 图标、尺寸与自定义圆点

`icon` 传入图标名替换圆点内图标，`size="large"` 加大圆点直径；需要完全接管时使用 `#dot` 插槽。

<DemoBlock>
  <ev-timeline>
    <ev-timeline-item type="success" icon="check" size="large">图标圆点（large 尺寸）</ev-timeline-item>
    <ev-timeline-item type="danger" icon="close">图标圆点</ev-timeline-item>
    <ev-timeline-item type="warning">
      <template #dot>
        <span style="display: block; width: 10px; height: 10px; border-radius: 50%; background: var(--ev-color-warning);"></span>
      </template>
      完全自定义圆点
    </ev-timeline-item>
  </ev-timeline>
</DemoBlock>

## 加载占位

开启 `pending` 后末尾追加幽灵节点（灰色加载圆点），传字符串可自定义文案，`pendingDot` 可替换幽灵节点的圆点。

<DemoBlock>
  <ev-timeline pending="加载历史记录中">
    <ev-timeline-item timestamp="2026-08-01 09:00">创建订单</ev-timeline-item>
    <ev-timeline-item timestamp="2026-08-01 10:30">支付完成</ev-timeline-item>
  </ev-timeline>
</DemoBlock>

## 倒序

`reverse` 视觉上倒序展示（配合 flex 反转，常用于「最新在上」的消息流）；即使开启倒序，pending 幽灵节点仍保持在末尾。

<DemoBlock>
  <ev-timeline reverse pending="同步最新动态中">
    <ev-timeline-item timestamp="2026-08-01 09:00">创建订单</ev-timeline-item>
    <ev-timeline-item timestamp="2026-08-01 10:30">支付完成</ev-timeline-item>
  </ev-timeline>
</DemoBlock>

## API

<ApiTable title="Timeline Props" :rows="[
  { name: 'mode', desc: '节点排列模式：left 轴在左 / right 轴在右 / alternate 奇偶交替', type: 'left | right | alternate', default: 'left' },
  { name: 'reverse', desc: '节点倒序展示（pending 幽灵节点仍在末尾）', type: 'boolean', default: 'false' },
  { name: 'pending', desc: '末尾幽灵节点，true 用默认文案，字符串自定义', type: 'boolean | string', default: 'false' },
  { name: 'pendingDot', desc: '幽灵节点自定义圆点（组件或已注册组件名）', type: 'object | string', default: '—' },
  { name: 'variant', desc: '节点样式变体，item 未显式指定时继承', type: 'outlined | filled', default: 'outlined' },
]" />

<ApiTable title="Timeline Slots" :rows="[
  { name: 'default', desc: 'ev-timeline-item 节点列表', type: '—', default: '—' },
]" />

<ApiTable title="TimelineItem Props" :rows="[
  { name: 'timestamp', desc: '时间戳文本', type: 'string', default: '—' },
  { name: 'placement', desc: '时间戳位置：top / bottom 在内容侧，start / end 移到轴对侧', type: 'top | bottom | start | end', default: 'bottom' },
  { name: 'label', desc: '轴对侧标签文本', type: 'string', default: '—' },
  { name: 'type', desc: '语义色圆点', type: 'primary | success | warning | danger | info', default: '—' },
  { name: 'color', desc: '自定义圆点颜色，语义色名或任意色值，优先级高于 type', type: 'string', default: '—' },
  { name: 'hollow', desc: '空心圆点（强制 outlined 变体）', type: 'boolean', default: 'false' },
  { name: 'variant', desc: '节点变体，缺省继承容器（hollow 优先于继承值）', type: 'outlined | filled', default: '—' },
  { name: 'size', desc: '圆点尺寸，large 为 14px、normal 为 10px', type: 'normal | large', default: 'normal' },
  { name: 'icon', desc: '圆点内图标（未提供 dot 插槽时生效，字符串为图标名）', type: 'string | object', default: '—' },
  { name: 'loading', desc: '加载中（灰色圆点，容器 pending 节点内部使用）', type: 'boolean', default: 'false' },
  { name: 'position', desc: '手动指定节点位置 start / end，覆盖 mode 推断', type: 'start | end', default: '—' },
  { name: 'isPending / index', desc: '内部使用（幽灵节点标记与 alternate 奇偶推算）', type: 'boolean / number', default: 'false / 0' },
]" />

<ApiTable title="TimelineItem Slots" :rows="[
  { name: 'default', desc: '节点内容', type: '—', default: '—' },
  { name: 'dot', desc: '自定义圆点（优先于 icon）', type: '—', default: '—' },
  { name: 'label', desc: '自定义对侧标签', type: '—', default: '—' },
]" />
