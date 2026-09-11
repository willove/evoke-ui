# 案例：云笔记工作台

Evoke UI 不只能搭营销页——表单、卡片、时间线这些「应用感」组件拼起来，
一样能做出轻量的工具型界面。本案例是一个可以真的操作的笔记工作台：
搜索过滤、分类切换、选中编辑、收藏与归档，全部状态都在本地 `ref` 里。

**用到的组件**：[EvNavbar](/components/navbar) · [EvInput](/components/input) · [EvTabs](/components/tabs) · [EvCard](/components/card) · [EvTag](/components/tag) · [EvIconButton](/components/icon-button) · [EvAvatar](/components/avatar) · [EvField](/components/field) · [EvTextarea](/components/textarea) · [EvButton](/components/button) · [EvTimeline](/components/timeline) · [EvFooter](/components/footer)

<script setup>
import CaseStage from '../.vitepress/theme/CaseStage.vue'
import NotesSite from '../.vitepress/theme/case-sites/NotesSite.vue'
</script>

<CaseStage url="notes.cumubase.cn" live-url="/cases/live/notes">
  <NotesSite />
</CaseStage>

## 搭建要点

- **工作台 = 列表栏 + 编辑栏**：一个两列 grid 就够了。窄屏时 `auto-fit` 自动降为单列，编辑卡掉到列表下方。
- **搜索与筛选合成一个 `computed`**：关键词对标题、正文、标签做小写包含匹配，Tab 负责状态过滤——两个条件各自独立，互不纠缠。
- **列表卡是「可点卡片」**：`EvCard hoverable @click` 加选中态类；收藏按钮用 `@click.stop` 阻止冒泡，点星星不会误选中。
- **编辑面板用 `EvField` 包住每个控件**：标题、内容、标签三段式，`EvTextarea` 开 `maxlength` 自带字数计数器。
- **归档不是删除**：切换 `status` 字段，卡片出现在「已归档」Tab 里，随时可以恢复——工具型界面的安全感来自可逆。
- **空态也是设计的一部分**：筛选无结果时给一句说明和一个「清空筛选」按钮，别让用户面对白屏。

## 关键代码

列表的过滤逻辑，搜索词与 Tab 两个条件正交：

```js
const filtered = computed(() =>
  notes.value.filter((n) => {
    const byTab = tab.value === 'all' || n.status === tab.value
    const q = query.value.trim().toLowerCase()
    const byQuery =
      !q ||
      `${n.title} ${n.content} ${n.tags.join(' ')}`.toLowerCase().includes(q)
    return byTab && byQuery
  })
)
```

收藏与归档都是对单条笔记的字段修改，界面自动跟随：

```vue
<EvCard
  v-for="n in filtered"
  :key="n.id"
  hoverable
  flat
  :class="{ 'is-active': selected && selected.id === n.id }"
  @click="pick(n)"
>
  <EvIconButton
    size="small"
    :icon="n.starred ? 'star-fill' : 'star'"
    @click.stop="toggleStar(n)"
  />
</EvCard>
```

编辑面板用 `EvField` 包住控件，`v-model` 直接绑到选中笔记的字段上：

```vue
<EvField label="内容">
  <EvTextarea v-model="selected.content" :rows="7" :maxlength="300" />
</EvField>
```
