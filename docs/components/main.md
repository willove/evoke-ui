# Main 内容区

应用布局的主内容区块；自身不限定尺寸，弹性空间交给外层布局（flex/grid）分配。

## 组合示例

<DemoBlock>
  <div style="border:1px solid var(--eb-border-color);border-radius:8px;overflow:hidden;height:200px;display:flex;flex-direction:column">
    <eb-header style="border-bottom:1px solid var(--eb-border-color)">顶栏</eb-header>
    <div style="flex:1;display:flex;min-height:0">
      <eb-aside width="140px" style="border-right:1px solid var(--eb-border-color)">侧边栏</eb-aside>
      <eb-main>内容区（占据剩余空间）</eb-main>
    </div>
  </div>
</DemoBlock>

<ApiTable title="Main Props" :rows="[
  { name: 'tag', desc: '渲染的元素标签', type: 'string', default: 'main' },
]" />
