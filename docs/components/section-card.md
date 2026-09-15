# SectionCard 区块卡片

带标题头的区块容器：标题 + 右侧操作区 + 内容体，用于页面内分组框定一块内容（图表区、表单组、列表段），比 Card 更强调「区块语义」而非独立卡片。

## 基础用法

`title` 定标题；`extra` 插槽放右侧操作：

<DemoBlock>
  <eb-section-card title="近 7 天访问趋势" style="max-width: 560px;">
    <template #extra>
      <eb-tag type="info" size="small">实时</eb-tag>
    </template>
    <div style="color:var(--eb-text-color-regular);line-height:1.8">
      内容区放图表、表格或任意业务内容；标题行自动带底部分割线。
    </div>
  </eb-section-card>
</DemoBlock>

## 关闭内边距

`padding` 设为 false 后内容体贴边，适合内嵌表格、列表等自带留白的组件：

<DemoBlock>
  <eb-section-card title="待处理工单" :padding="false" style="max-width: 560px;">
    <div style="display:flex;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--eb-border-color-light)">
      <span>数据库主从延迟告警</span><eb-tag type="danger" size="small">紧急</eb-tag>
    </div>
    <div style="display:flex;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--eb-border-color-light)">
      <span>新用户注册流程优化</span><eb-tag type="warning" size="small">较高</eb-tag>
    </div>
    <div style="display:flex;justify-content:space-between;padding:12px 20px">
      <span>首页图表加载缓慢</span><eb-tag size="small">一般</eb-tag>
    </div>
  </eb-section-card>
</DemoBlock>

## header 插槽

需要标题带说明文字或图标时用 `header` 插槽整体替换：

<DemoBlock>
  <eb-section-card style="max-width: 560px;">
    <template #header>
      <span style="font-weight:600">存储用量</span>
      <span style="color:var(--eb-text-color-secondary);font-size:13px">每 5 分钟同步一次</span>
    </template>
    <div style="color:var(--eb-text-color-regular)">已用 62.4 GB / 100 GB</div>
  </eb-section-card>
</DemoBlock>

<ApiTable title="SectionCard Props" :rows="[
  { name: 'title', desc: '区块标题', type: 'string', default: '' },
  { name: 'padding', desc: '内容区内边距', type: 'boolean', default: 'true' },
  { name: 'glass', desc: '磨砂质感：true 强制开 / false 强制关 / 缺省跟随全局配置', type: 'boolean', default: '—' },
  { name: 'blur', desc: '磨砂模糊半径（px），仅磨砂生效时应用', type: 'number | string', default: '—' },
  { name: 'saturate', desc: '磨砂饱和度（倍数）', type: 'number | string', default: '—' },
  { name: 'tint', desc: '磨砂底色浓度（%）', type: 'number | string', default: '—' },
]" />

<ApiTable title="SectionCard Slots" :rows="[
  { name: 'default', desc: '内容区', type: '—', default: '—' },
  { name: 'header', desc: '整体替换标题区（替换后 title 不生效）', type: '—', default: '—' },
  { name: 'extra', desc: '标题行右侧操作区', type: '—', default: '—' },
]" />
