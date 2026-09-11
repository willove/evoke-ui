<script setup>
/**
 * NotesSite — 案例「cumubase 云笔记」工作台的站点内容
 * 同一份源码用于案例文档页的缩放舞台（CaseStage 内）
 * 与独立全屏窗口（/cases/live/notes，传 sticky 开启导航吸顶）
 */
import { ref, computed } from 'vue'

const props = defineProps({
  /** 导航是否吸顶（独立窗口下开启） */
  sticky: { type: Boolean, default: false },
})

const tabs = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'active' },
  { label: '已归档', value: 'archived' },
]
const tab = ref('all')
const query = ref('')

let uid = 0
const make = (title, content, tags, updated, extra = {}) => ({
  id: ++uid,
  title,
  content,
  tags,
  updated,
  status: 'active',
  starred: false,
  ...extra,
})

const notes = ref([
  make('Q4 产品评审纪要', '三个结论：路线图砍掉两个特性；移动端排期提前两周；定价实验继续观察一个迭代。', ['工作', '评审'], '今天 14:20', { starred: true }),
  make('Clean Navy 配色速查', '主色藏青，语义色五档；粉彩只用于卡片底，正文永远用墨色层级。', ['设计', '速查'], '今天 09:47'),
  make('周三读书会：提问清单', '《格拉斯的医生》前三章；带一个问题来，别带答案。', ['生活', '读书'], '昨天 21:03'),
  make('组件库发版清单', '改动日志、版本号、文档站构建、示例工程回归——四步缺一不可。', ['工作', '清单'], '昨天 11:15'),
  make('山里买的咖啡豆', '日晒耶加雪菲，中浅焙；手冲水温 92 度，粉水比 1:15。', ['生活'], '09-05 18:40'),
  make('旧版首页存档', '2024 年上线的第一版首页，留着对照进步。', ['存档'], '08-28 10:02', { status: 'archived' }),
  make('离职同事的交接笔记', '权限系统的来龙去脉都在这里，接手时救了我两次。', ['存档', '工作'], '08-19 16:30', { status: 'archived', starred: true }),
])

const selected = ref(notes.value[0])

const filtered = computed(() =>
  notes.value.filter((n) => {
    const byTab = tab.value === 'all' || n.status === tab.value
    const q = query.value.trim().toLowerCase()
    const byQuery = !q || `${n.title} ${n.content} ${n.tags.join(' ')}`.toLowerCase().includes(q)
    return byTab && byQuery
  })
)

function pick(note) {
  selected.value = note
}

function toggleStar(note) {
  note.starred = !note.starred
}

function toggleArchive(note) {
  note.status = note.status === 'archived' ? 'active' : 'archived'
  note.updated = '刚刚'
}

const activities = [
  { date: '今天 14:20', title: '阿岚 更新了《Q4 产品评审纪要》' },
  { date: '今天 13:05', tag: '收藏', tagTone: 'orange', title: '阿岚 收藏了《离职同事的交接笔记》' },
  { date: '昨天 18:12', tag: '归档', tagTone: 'neutral', title: '《旧版首页存档》被移入归档' },
]
</script>

<template>
  <div class="case-site">
    <EvNavbar :sticky="sticky" logo-text="cumubase 笔记">
      <template #actions>
        <EvInput
          v-model="query"
          size="small"
          icon="search"
          clearable
          placeholder="搜索标题、正文或标签…"
          style="width:220px;"
        />
        <EvThemeToggle />
        <EvAvatar name="阿岚" size="small" />
      </template>
    </EvNavbar>

    <div class="cn-workbench">
      <div class="cn-list">
        <div class="cn-list__head">
          <EvTabs v-model="tab" :items="tabs" />
          <span class="cn-count">{{ filtered.length }} 条笔记</span>
        </div>
        <div class="cn-cards">
          <EvCard
            v-for="n in filtered"
            :key="n.id"
            hoverable
            flat
            class="cn-card"
            :class="{ 'is-active': selected && selected.id === n.id }"
            @click="pick(n)"
          >
            <div class="cn-card__head">
              <span class="cn-card__title">{{ n.title }}</span>
              <EvIconButton
                size="small"
                :icon="n.starred ? 'star-fill' : 'star'"
                :aria-label="n.starred ? '取消收藏' : '收藏'"
                @click.stop="toggleStar(n)"
              />
            </div>
            <p class="cn-card__excerpt">{{ n.content }}</p>
            <div class="cn-card__foot">
              <EvTag v-for="t in n.tags" :key="t" size="small">{{ t }}</EvTag>
              <EvTag v-if="n.status === 'archived'" size="small" tone="neutral" variant="outline">已归档</EvTag>
              <span class="cn-card__time">{{ n.updated }}</span>
            </div>
          </EvCard>
          <div v-if="!filtered.length" class="cn-empty">
            <p>没有匹配的笔记。</p>
            <EvButton size="small" variant="soft" @click="query = ''; tab = 'all'">清空筛选</EvButton>
          </div>
        </div>
      </div>

      <div class="cn-editor">
        <EvCard v-if="selected" class="cn-editor__card">
          <p class="cn-editor__label">编辑笔记</p>
          <EvField label="标题">
            <EvInput v-model="selected.title" placeholder="给笔记起个名字" />
          </EvField>
          <EvField label="内容">
            <EvTextarea v-model="selected.content" :rows="7" :maxlength="300" placeholder="写点什么…" />
          </EvField>
          <EvField label="标签">
            <div class="cn-tags">
              <EvTag v-for="t in selected.tags" :key="t" size="small" closable>{{ t }}</EvTag>
              <EvTag size="small" variant="outline" icon="plus">添加标签</EvTag>
            </div>
          </EvField>
          <div class="cn-editor__actions">
            <EvButton size="small" icon="check">保存</EvButton>
            <EvButton
              size="small"
              variant="outline"
              :icon="selected.status === 'archived' ? 'refresh' : 'archive-line'"
              @click="toggleArchive(selected)"
            >{{ selected.status === 'archived' ? '恢复' : '归档' }}</EvButton>
            <span class="cn-editor__meta">更新于 {{ selected.updated }}</span>
          </div>
        </EvCard>
        <EvCard tone="soft" class="cn-activity">
          <p class="cn-editor__label">最近动态</p>
          <EvTimeline :items="activities" />
        </EvCard>
      </div>
    </div>

    <EvFooter
      soft
      logo-text="cumubase 笔记"
      slogan="轻盈优雅的云端笔记。"
      copyright="© 2026 积云数合"
      :columns="[
        { title: '产品', links: [{ label: '下载客户端', href: '#' }, { label: '网页版', href: '#' }, { label: '更新日志', href: '#' }] },
        { title: '支持', links: [{ label: '帮助中心', href: '#' }, { label: '快捷键一览', href: '#' }, { label: '联系我们', href: '#' }] },
      ]"
    />
  </div>
</template>

<style scoped>
.cn-workbench {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  max-width: 1040px;
  margin-inline: auto;
  padding: 32px 24px 56px;
}
@media (max-width: 880px) {
  .cn-workbench {
    grid-template-columns: minmax(0, 1fr);
  }
}
.cn-list__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.cn-count {
  font-size: 13px;
  color: var(--ev-text-secondary);
}
.cn-cards {
  display: grid;
  gap: 12px;
}
.cn-card {
  cursor: pointer;
  transition: border-color var(--ev-duration-base) var(--ev-ease-in-out),
    box-shadow var(--ev-duration-base) var(--ev-ease-in-out);
}
.cn-card.is-active {
  border-color: var(--ev-color-primary);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}
.cn-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.cn-card__title {
  font-size: 15px;
  font-weight: var(--ev-font-weight-medium);
  color: var(--ev-text-primary);
}
.cn-card__excerpt {
  margin: 8px 0 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ev-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cn-card__foot {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.cn-card__time {
  margin-left: auto;
  font-size: 12px;
  color: var(--ev-text-secondary);
}
.cn-empty {
  padding: 40px 0;
  text-align: center;
  color: var(--ev-text-secondary);
  font-size: 14px;
}
.cn-empty p {
  margin: 0 0 12px;
}
.cn-editor {
  display: grid;
  gap: 16px;
}
.cn-editor__label {
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: var(--ev-font-weight-medium);
  letter-spacing: 0.06em;
  color: var(--ev-text-secondary);
}
.cn-editor__card .ev-field {
  margin-bottom: 14px;
}
.cn-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.cn-editor__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}
.cn-editor__meta {
  margin-left: auto;
  font-size: 12px;
  color: var(--ev-text-secondary);
}
</style>
