# Footer 底栏

应用布局的底栏区块，高度可调；通常与 [Header](/components/header)、[Aside](/components/aside)、[Main](/components/main) 组合出后台框架。

## 组合示例

<DemoBlock>
  <div style="border:1px solid var(--eb-border-color);border-radius:8px;overflow:hidden;height:200px;display:flex;flex-direction:column">
    <eb-header style="border-bottom:1px solid var(--eb-border-color)">顶栏</eb-header>
    <eb-main style="flex:1">内容区</eb-main>
    <eb-footer style="border-top:1px solid var(--eb-border-color)">底栏（60px）</eb-footer>
  </div>
</DemoBlock>

<ApiTable title="Footer Props" :rows="[
  { name: 'height', desc: '底栏高度', type: 'string', default: '60px' },
  { name: 'tag', desc: '渲染的元素标签', type: 'string', default: 'footer' },
]" />
