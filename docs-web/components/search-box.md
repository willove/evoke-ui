# SearchBox 搜索框

`EwSearchBox` 是本库的招牌组件：一体式三段结构 —— 分类下拉 ∣ 放大镜输入 ∣ 后缀动作位。
16px 大圆角配弥散软阴影，focus 时浮现主色光环，适合作为首屏的视觉锚点。

## 基础用法

<DemoBlock title="大搜索栏三段式" description="categories 为空数组时隐藏分类位；suffix 后缀位适合放快捷键提示（⌘ K）或收藏、历史记录等轻动作。">

<EwSearchBox
  large
  placeholder="搜索文章、模板或帮助…"
  :categories="['全部', '文章', '模板', '帮助']"
  style="max-width:640px;"
>
  <template #suffix>
    <EwKeycap :keys="['⌘', 'K']" />
  </template>
</EwSearchBox>

```vue
<EwSearchBox large placeholder="搜索文章、模板或帮助…" :categories="['全部', '文章', '帮助']">
  <!-- 后缀位两种常见用法 -->
  <template #suffix>
    <EwKeycap :keys="['⌘', 'K']" />                     <!-- 快捷键提示 -->
    <EwIconButton icon="star-line" size="small" aria-label="收藏搜索结果" />  <!-- 轻动作 -->
  </template>
</EwSearchBox>
```

</DemoBlock>

## 远程搜索（下拉结果）

`remote` 传入异步函数后进入远程模式：输入经防抖（默认 300ms）调用接口，
结果以 select 下拉形态呈现；`↑↓` 选择、`Enter` 确认、`Esc` 关闭，选中回填搜索词并派发 `select`。

<DemoBlock title="远程接口 + 下拉建议" description="演示用 600ms 延迟模拟接口；实际接入时把 remote 换成你的搜索接口即可。">

<EwSearchBox
  large
  placeholder="搜索组件，试试「按钮」或「表单」…"
  :remote="remoteSearch"
  :debounce="200"
  style="max-width:640px;"
  @select="onPick"
/>
<p v-if="pickTip" style="margin:10px 0 0; font-size:13px; color:var(--ew-text-secondary);">{{ pickTip }}</p>

```vue
<EwSearchBox
  v-model="keyword"
  :remote="async (kw) => {
    const res = await fetch('/api/search?q=' + kw)
    return (await res.json()).map(r => ({ title: r.name, description: r.desc }))
  }"
  @select="onPick"
/>
```

</DemoBlock>

## 受控使用

<DemoBlock title="双向绑定" description="搜索词与分类分别双向绑定，search 事件在输入与切换分类时触发。">

<EwSearchBox
  v-model="kw"
  v-model:category="cat"
  :categories="['全部', '箭头', '系统']"
  placeholder="试试输入 arrow…"
  style="max-width:520px;"
/>
<p style="margin-top:12px; font-size:13px; color:var(--ew-text-secondary);">
  当前：词「{{ kw || '（空）' }}」 · 分类「{{ cat || '全部' }}」
</p>

<script setup>
import { ref } from 'vue'
const kw = ref('')
const cat = ref('')
</script>

```vue
<EwSearchBox v-model="kw" v-model:category="cat" :categories="cats" @search="onSearch" />
```

</DemoBlock>

::: tip 与 EwIconGrid 的关系
[EwIconGrid](./icon-grid) 内部就使用本组件作为搜索头；单独引入 SearchBox 适合自定义搜索场景。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| v-model | 搜索词 | string | `''` |
| categories | 分类项（字符串或 `{ label, value }`），空数组隐藏分类位 | array | `[]` |
| v-model:category | 当前分类 | string | `''` |
| size | 尺寸（large 为 hero 级） | `'default' \| 'large'` | `'default'` |
| placeholder | 占位文案 | string | `'Search'` |
| aria-label | 无障碍标签（缺省取 placeholder） | string | placeholder |

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| update:modelValue | 输入时派发 | string |
| update:category | 切换分类时派发 | string |
| search | 输入或切换分类时派发 | string |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| suffix | 后缀动作位：快捷键提示（[EwKeycap](./keycap)）、收藏 / 历史记录（[EwIconButton](./icon-button)）等轻动作 |
