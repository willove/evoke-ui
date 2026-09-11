# Empty 空状态

列表、表格、搜索结果等场景无数据时的占位提示。内置默认插画为主题变量驱动的 SVG（自动适配主题与暗色模式）与「暂无数据」文案，可自定义插画尺寸、描述文案，或通过插槽整体替换插画与描述，并在底部放置操作按钮引导下一步。

## 基础用法

不传任何属性即为最简形态：内置插画 + 「暂无数据」。

<DemoBlock>
  <eb-empty />
</DemoBlock>

## 自定义描述

`description` 指定占位文案，说明「为什么为空」比通用文案更有引导性。

<DemoBlock>
  <eb-empty description="筛选条件下没有匹配的数据" />
</DemoBlock>

## 带操作的空状态

向默认插槽放置按钮即可引导用户进行下一步；只有提供插槽内容时才渲染底部操作区。

<DemoBlock>
  <eb-empty description="还没有项目，创建第一个吧">
    <eb-button type="primary" size="small">新建项目</eb-button>
  </eb-empty>
</DemoBlock>

## 自定义插画尺寸

`image-size` 调整插画容器宽度（px），大尺寸适合整页空态，小尺寸适合卡片、弹窗内的局部空态。

<DemoBlock>
  <eb-empty description="没有找到相关订单，换个关键词试试" :image-size="120" />
</DemoBlock>

## 自定义插画

`#image` 插槽整体替换插画区域，可放置图标、SVG 或业务插画组件。

<DemoBlock>
  <eb-empty description="没有找到相关结果">
    <template #image>
      <eb-icon name="search" :size="64" style="color: var(--eb-text-color-placeholder);" />
    </template>
  </eb-empty>
</DemoBlock>

## 自定义描述插槽

`#description` 插槽可插入链接、按钮等富文本，把「解决入口」直接放在文案里。

<DemoBlock>
  <eb-empty :image-size="72">
    <template #description>
      没有权限访问该空间，<eb-link type="primary" href="#">申请开通</eb-link>
    </template>
  </eb-empty>
</DemoBlock>

## 组合操作区

默认插槽与 `#description` 插槽可以同时使用：描述给原因、操作区给动作，支持多个按钮并排。

<DemoBlock>
  <eb-empty description="工单已全部处理完成">
    <eb-button type="primary" size="small">发起工单</eb-button>
    <eb-button size="small" style="margin-left: 8px;">查看历史</eb-button>
  </eb-empty>
</DemoBlock>

## 组合表格空态

作为 Table 等列表类组件的 `#empty` 插槽使用，统一各处空态风格（Table 的空态插槽见 table.md）。

<DemoBlock>
  <eb-table :data="[]" border>
    <eb-table-column prop="date" label="日期" />
    <eb-table-column prop="amount" label="金额" />
    <template #empty>
      <eb-empty description="本月暂无账单" :image-size="64" />
    </template>
  </eb-table>
</DemoBlock>

## API

<ApiTable title="Empty Props" :rows="[
  { name: 'image', desc: '图片地址（预留属性，当前版本自定义插画请用 image 插槽）', type: 'string', default: '' },
  { name: 'imageSize', desc: '插画容器宽度（px）', type: 'number', default: '80' },
  { name: 'description', desc: '描述文案（优先级低于 description 插槽）', type: 'string', default: '暂无数据' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'default', desc: '底部操作区（提供内容时才渲染）', type: '—', default: '—' },
  { name: 'image', desc: '自定义插画', type: '—', default: '—' },
  { name: 'description', desc: '自定义描述文案（可含链接等富文本）', type: '—', default: '—' },
]" />
