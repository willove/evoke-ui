# IconGrid 图标网格

`EvIconGrid` 是本库的招牌组件：分类分节的致密图标网格。内置 900+ 图标展示集（动态 chunk 按需加载，
不占主包体积），提供关键词/分类过滤与「点击复制图标名」——单元格 hover 浮现「+」徽标，
复制成功后短暂变为蓝色对勾。

## 内置展示集

<DemoBlock title="开箱即用" description="不传 icons 即使用内置展示集；试试搜索 brush、切换分类，点击任意格子复制图标名。">

<EvIconGrid style="max-height:520px; overflow:auto; padding:4px;" />

</DemoBlock>

## 自定义图标集

<DemoBlock title="icons 属性" description="传入 [{ name, category, paths }] 即可渲染自有集合；categoryZh 可提供中文分组名。">

<EvIconGrid
  :searchable="true"
  :icons="[
    { name: 'heart-line', category: '收藏', categoryZh: '收藏', paths: [{ d: 'M12.001 4.52853C14.35 2.42 17.98 2.49 20.2426 4.75736C22.5053 7.02472 22.583 10.637 20.4786 12.993L11.9999 21.485L3.52138 12.993C1.41705 10.637 1.49571 7.01901 3.75736 4.75736C6.02157 2.49315 9.64519 2.41687 12.001 4.52853ZM18.827 6.1701C17.3279 4.66794 14.9076 4.60701 13.337 6.01687L12.0019 7.21524L10.6661 6.01781C9.09098 4.60597 6.67506 4.66808 5.17157 6.17157C3.68183 7.66131 3.60704 10.0473 4.97993 11.6232L11.9999 18.6543L19.0201 11.6232C20.3935 10.0467 20.319 7.66525 18.827 6.1701Z' }] },
  ]"
/>

```vue
<EvIconGrid :icons="[{ name: 'my-icon', category: '收藏', paths: [{ d: '…' }] }]" />
```

</DemoBlock>

## 事件联动

点击单元格时依次派发 `select(name)` 与 `copy(name)`（`copy-on-select` 关闭时只派发 select），
可据此实现「复制后吐司提示」等联动：

```vue
<EvIconGrid @select="(name) => onSelect(name)" @copy="(name) => onCopy(name)" />
```

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| icons | 自定义图标集 `[{ name, category, categoryZh?, paths }]`；缺省用内置展示集 | array | — |
| searchable | 展示搜索栏（内部为 [EvSearchBox](./search-box)） | boolean | `true` |
| placeholder | 搜索占位 | string | `'Search icons'` |
| copy-on-select | 点击单元格复制图标名 | boolean | `true` |

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| select | 点击单元格 | name |
| copy | 图标名复制成功 | name |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| search | 覆写搜索栏 |
| search-suffix | 搜索栏后缀动作位 |

::: tip 图标数据
内置展示集为每个分类限量采样的 Remix 原生名图标；核心语义名（search / close 等 39 个）
见 [EvIcon](./icon)。扩展采样量请调整生成脚本 `SHOWCASE_PER_CATEGORY` 后重新执行 `pnpm gen:icons`。
:::
