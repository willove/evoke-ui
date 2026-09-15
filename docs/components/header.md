# Header 顶栏

应用布局的顶栏区块，高度可调；通常与 [Aside](/components/aside)、[Main](/components/main)、[Footer](/components/footer) 组合出后台框架。

## 组合示例

<DemoBlock>
  <div style="border:1px solid var(--eb-border-color);border-radius:8px;overflow:hidden;height:200px;display:flex;flex-direction:column">
    <eb-header style="border-bottom:1px solid var(--eb-border-color)">顶栏（60px）</eb-header>
    <div style="flex:1;display:flex;min-height:0">
      <eb-aside width="140px" style="border-right:1px solid var(--eb-border-color)">侧边栏</eb-aside>
      <eb-main>内容区</eb-main>
    </div>
  </div>
</DemoBlock>

<ApiTable title="Header Props" :rows="[
  { name: 'height', desc: '顶栏高度', type: 'string', default: '60px' },
  { name: 'tag', desc: '渲染的元素标签', type: 'string', default: 'header' },
]" />
