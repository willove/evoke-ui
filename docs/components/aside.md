# Aside 侧边栏

应用布局的侧边栏区块，宽度可调；通常与 [Header](/components/header)、[Main](/components/main)、[Footer](/components/footer) 组合出后台框架，内部常放 [Menu](/components/menu)。

## 组合示例

<DemoBlock>
  <div style="border:1px solid var(--eb-border-color);border-radius:8px;overflow:hidden;height:200px;display:flex;flex-direction:column">
    <eb-header>顶栏</eb-header>
    <div style="flex:1;display:flex;min-height:0">
      <eb-aside width="160px" style="border-right:1px solid var(--eb-border-color)">侧边栏</eb-aside>
      <eb-main>内容区</eb-main>
    </div>
  </div>
</DemoBlock>

<ApiTable title="Aside Props" :rows="[
  { name: 'width', desc: '侧边栏宽度', type: 'string', default: '300px' },
  { name: 'tag', desc: '渲染的元素标签', type: 'string', default: 'aside' },
]" />
