# Container 容器

`EvContainer` 是官网栅格的基座：居中限宽 + 两侧留白。组件化的意义在于宽度档可以语义化选择，
并受 `--ev-container-width` 令牌约束 —— 通过 [EvConfigProvider](./config-provider) 可以整站调整容器宽度。

## 基础用法

<DemoBlock title="四种宽度档" description="演示区宽度不足以放下真实档位，下图以 1360px 为基准等比缩放展示各档占比；窄于档位宽度时容器自适应收缩。">

<div class="ct-scale">
  <div class="ct-scale__row">
    <code class="ct-scale__name">narrow</code>
    <div class="ct-scale__track">
      <div class="ct-scale__bar" style="width: 67.6%;">920px</div>
    </div>
  </div>
  <div class="ct-scale__row">
    <code class="ct-scale__name">default</code>
    <div class="ct-scale__track">
      <div class="ct-scale__bar" style="width: 84.7%;">1152px</div>
    </div>
  </div>
  <div class="ct-scale__row">
    <code class="ct-scale__name">wide</code>
    <div class="ct-scale__track">
      <div class="ct-scale__bar" style="width: 100%;">1360px</div>
    </div>
  </div>
  <div class="ct-scale__row">
    <code class="ct-scale__name">full</code>
    <div class="ct-scale__track">
      <div class="ct-scale__bar is-full" style="width: 100%;">通栏 100%（不设上限）</div>
    </div>
  </div>
</div>

<p class="ct-scale__note">wide 与 full 在超宽屏上才有区别：wide 上限 1360px，full 始终铺满视口；通过主题定制器改小容器宽令牌时，narrow / default 会同步收缩。</p>

```vue
<EvContainer width="narrow">
  <FaqSection />
</EvContainer>
```

</DemoBlock>

<style>
.ct-scale {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ct-scale__row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ct-scale__name {
  flex-shrink: 0;
  width: 64px;
  font-size: 12px;
  color: var(--ev-text-secondary);
  text-align: right;
}
.ct-scale__track {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 3px;
  border: 1px dashed var(--ev-border-color);
  border-radius: 8px;
}
.ct-scale__bar {
  padding: 8px 0;
  border-radius: 6px;
  background: var(--ev-fill-2, #eef1f8);
  color: var(--ev-text-secondary);
  font-size: 12px;
  text-align: center;
}
.ct-scale__bar.is-full {
  background: var(--ev-fill-1, #f5f7fc);
}
.ct-scale__note {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--ev-text-secondary);
}
</style>

::: tip 组件内置容器
[EvHero](./hero)、[EvFooter](./footer)、[EvNavbar](./navbar)、[EvCta](./cta) 内部已内置容器，
无需再包一层；[EvSection](./section) 默认定宽居中（`width` 档），同样不用外包；
`EvContainer` 只用于其余自定义区块的外层对齐。整页组装规则见 [EvSection](./section) 页首「整页组装规则」。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| width | 宽度档 | `'narrow' \| 'default' \| 'wide' \| 'full'` | `'default'` |
| as | 渲染标签 | string | `'div'` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 容器内容 |
