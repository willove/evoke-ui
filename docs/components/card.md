# Card 卡片

信息聚合的卡片容器：头部（`header` 插槽或 `header` 属性）、内容区与底部插槽，悬浮时边框微深并浮现投影，适合仪表盘、列表、详情等信息块。内容区默认内边距由 `--eb-card-padding` 变量控制，可用 `body-style` 覆盖。

## 基础用法

`header` 属性提供标题文字，默认插槽放内容，`#footer` 插槽渲染底部操作区（有内容时才渲染底部区域）。

<DemoBlock>
<eb-card header="项目概况" style="max-width:420px;">
  <div style="color:#606266;font-size:14px;line-height:1.8;">
    卡片内容区，可放任意业务内容；body 默认内边距由 --eb-card-padding 控制。
  </div>
  <template #footer>
    <div style="text-align:right;color:#909399;font-size:13px;">底部操作区</div>
  </template>
</eb-card>
</DemoBlock>

## 阴影

`shadow` 默认 never；always 常驻投影，hover 悬停时显示，均为可见的层级投影（非描边）。默认所有卡片悬浮时边框微深并显示投影，传 `:hoverable="false"` 可完全关闭悬浮反馈（如纯信息展示的静态卡片墙）。

<DemoBlock>
<div style="display:flex;gap:16px;flex-wrap:wrap;">
  <eb-card shadow="never" header="never" style="flex:1;min-width:160px;">默认无阴影</eb-card>
  <eb-card shadow="hover" header="hover" style="flex:1;min-width:160px;">悬停显示阴影</eb-card>
  <eb-card shadow="always" header="always" :body-style="{ color: '#409eff' }" style="flex:1;min-width:160px;">常驻阴影，body-style 着色</eb-card>
  <eb-card shadow="always" header="hoverable=false" :hoverable="false" style="flex:1;min-width:160px;">静态卡片（无悬浮反馈）</eb-card>
</div>
</DemoBlock>

## 头部插槽

`#header` 插槽覆盖 `header` 属性，可放标题加操作按钮、状态标签等复合内容。

<DemoBlock>
<eb-card style="max-width:420px;">
  <template #header>
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <span>部署记录</span>
      <eb-space size="small">
        <eb-tag type="success">运行中</eb-tag>
        <eb-button size="small" text type="primary">查看全部</eb-button>
      </eb-space>
    </div>
  </template>
  <div style="color:#606266;font-size:14px;line-height:1.8;">
    今天 14:20 由张三发布了 v2.3.0，变更 12 个文件。
  </div>
</eb-card>
</DemoBlock>

## 自定义内容区样式

`body-style` 同时接受对象与字符串两种写法，常用于调整内边距、背景色，实现信息密集或强调型卡片。

<DemoBlock>
<div style="display:flex;gap:16px;">
  <eb-card header="小内边距" :body-style="{ padding: '8px 12px' }" style="flex:1;">紧凑排版的信息卡</eb-card>
  <eb-card header="背景色" body-style="background:#eef3ff;" style="flex:1;">字符串写法的强调卡</eb-card>
</div>
</DemoBlock>

## 组合场景：卡片网格

与 Row / Col 组合出等距卡片列表，footer 放操作按钮，是后台仪表盘的典型排版。

<DemoBlock>
<eb-row :gutter="16">
  <eb-col :span="8">
    <eb-card header="订单服务">
      <eb-text type="info">订单查询、退款处理与开票</eb-text>
      <template #footer>
        <eb-space size="small">
          <eb-button size="small" type="primary">进入</eb-button>
          <eb-button size="small">配置</eb-button>
        </eb-space>
      </template>
    </eb-card>
  </eb-col>
  <eb-col :span="8">
    <eb-card header="会员服务">
      <eb-text type="info">等级、权益与积分管理</eb-text>
      <template #footer>
        <eb-space size="small">
          <eb-button size="small" type="primary">进入</eb-button>
          <eb-button size="small">配置</eb-button>
        </eb-space>
      </template>
    </eb-card>
  </eb-col>
  <eb-col :span="8">
    <eb-card header="消息服务">
      <eb-text type="info">站内信、短信与邮件推送</eb-text>
      <template #footer>
        <eb-space size="small">
          <eb-button size="small" type="primary">进入</eb-button>
          <eb-button size="small">配置</eb-button>
        </eb-space>
      </template>
    </eb-card>
  </eb-col>
</eb-row>
</DemoBlock>

## 磨砂玻璃

<DemoBlock>
  <div style="background: url(/images/card-glass-landscape.jpg) center/cover no-repeat; border-radius: 10px; padding: 20px; display: grid; gap: 12px;">
    <eb-card glass>玻璃卡 A：半透明底 + 背景模糊</eb-card>
    <eb-card glass>玻璃卡 B：上下叠加透出彼此的边缘</eb-card>
    <eb-card :glass="false">实底卡：显式 glass=false 脱离全局开关</eb-card>
  </div>
</DemoBlock>

## API

<ApiTable title="Card Props" :rows="[
  { name: 'header', desc: '头部标题文字（有 header 插槽时以插槽为准）', type: 'string', default: '' },
  { name: 'shadow', desc: '阴影显示时机', type: 'always | hover | never', default: 'never' },
  { name: 'hoverable', desc: '悬浮时是否应用交互反馈（边框微深 + 投影），false 时完全静态', type: 'boolean', default: 'true' },
  { name: 'body-style', desc: '内容区样式，支持对象与字符串两种写法', type: 'object | string', default: '{}' },
  { name: 'glass', desc: '磨砂玻璃质感；缺省跟随全局（EbConfigProvider 的 glass）', type: 'boolean', default: '—' },
]" />

<ApiTable title="Card Slots" :rows="[
  { name: 'default', desc: '卡片内容', type: '—', default: '—' },
  { name: 'header', desc: '头部内容，覆盖 header 属性（无插槽且无 header 属性时不渲染头部）', type: '—', default: '—' },
  { name: 'footer', desc: '底部内容（有内容时才渲染底部区域）', type: '—', default: '—' },
]" />
