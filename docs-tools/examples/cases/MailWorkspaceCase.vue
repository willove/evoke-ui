<template>
  <!-- 案例：邮件工作台 —— 文件夹停靠 + 邮件列表 + 阅读面板，工具区走命令表 -->
  <div class="case-mail">
    <et-workbench
      v-model:layout="layout"
      :default-layout="DEFAULT_LAYOUT"
      persist-key="case-mail-layout"
      @layout-corrupted="onCorrupted"
    >
      <template #titlebar>
        <et-title-bar title="邮件工作台" :doc-title="currentFolder.label">
          <template #quick>
            <et-key-hint combo="mod+r" />
          </template>
        </et-title-bar>
      </template>

      <template #toolbar>
        <div class="case-mail__tools">
          <et-tool-group label="邮件">
            <et-tool-button
              size="large"
              icon="reply"
              label="回复"
              tip="回复发件人"
              :disabled="!stateOf('reply').enabled"
              @click="onCommand('reply')"
            />
            <et-tool-button
              size="large"
              icon="send-plane"
              label="转发"
              tip="转发这封邮件"
              :disabled="!stateOf('forward').enabled"
              @click="onCommand('forward')"
            />
            <et-tool-button
              size="large"
              icon="archive"
              label="归档"
              tip="移到归档文件夹"
              :disabled="!stateOf('archive').enabled"
              @click="onCommand('archive')"
            />
            <et-tool-button
              size="large"
              icon="delete"
              label="删除"
              tip="删除这封邮件"
              :disabled="!stateOf('delete').enabled"
              @click="onCommand('delete')"
            />
          </et-tool-group>

          <et-divider direction="vertical" length="large" />

          <et-tool-group label="标记">
            <et-tool-button
              size="large"
              icon="star"
              label="星标"
              tip="星标 / 取消星标"
              :active="stateOf('star').active"
              :disabled="!stateOf('star').enabled"
              @click="onCommand('star')"
            />
            <et-tool-button
              size="large"
              icon="mail"
              label="未读"
              tip="标记未读 / 已读"
              :active="stateOf('unread').active"
              :disabled="!stateOf('unread').enabled"
              @click="onCommand('unread')"
            />
          </et-tool-group>

          <span class="case-mail__spacer" />

          <div class="case-mail__hints">
            <et-shortcut-hint keys="mod+e" label="归档" />
            <et-shortcut-hint keys="delete" label="删除" />
          </div>
        </div>
      </template>

      <template #panel="{ panel }">
        <et-scroll-area v-if="panel.id === 'folders'" direction="vertical" class="case-mail__panel">
          <button
            v-for="f in FOLDERS"
            :key="f.id"
            type="button"
            class="case-mail__folder"
            :class="{ 'is-active': f.id === store.folder }"
            @click="openFolder(f.id)"
          >
            <et-icon :name="f.icon" :size="14" />
            <span>{{ f.label }}</span>
            <span v-if="unreadOf(f.id)" class="case-mail__count">{{ unreadOf(f.id) }}</span>
          </button>
        </et-scroll-area>

        <et-scroll-area v-else direction="vertical" class="case-mail__panel">
          <div v-for="t in TAGS" :key="t.label" class="case-mail__tag">
            <et-icon :name="t.icon" :size="14" />
            <span>{{ t.label }}</span>
            <span class="case-mail__count">{{ t.count }}</span>
          </div>
        </et-scroll-area>
      </template>

      <main class="case-mail__canvas">
        <section class="case-mail__list">
          <div class="case-mail__list-head">
            <et-tab-strip v-model="filter" :tabs="FILTER_TABS" />
            <span class="case-mail__count">{{ visibleMails.length }} 封</span>
          </div>

          <et-scroll-area direction="vertical" class="case-mail__list-body">
            <button
              v-for="m in visibleMails"
              :key="m.id"
              type="button"
              class="case-mail__item"
              :class="{ 'is-sel': m.id === store.selectedId, 'is-unread': !m.read }"
              @click="selectMail(m.id)"
            >
              <span class="case-mail__from">
                <et-icon v-if="m.starred" name="star-filled" :size="12" class="case-mail__mark" />
                <span class="case-mail__from-text">{{ m.from }}</span>
                <et-icon v-if="m.files" name="attachment" :size="12" class="case-mail__mark" />
              </span>
              <span class="case-mail__time">{{ m.time }}</span>
              <span class="case-mail__subject">{{ m.subject }}</span>
              <span class="case-mail__preview">{{ m.preview }}</span>
            </button>

            <div v-if="!visibleMails.length" class="case-mail__center">
              <et-empty-state
                icon="mail"
                title="这里没有邮件"
                desc="换个文件夹，或把过滤放宽。"
                :action-label="emptyActionLabel"
                @action="onEmptyAction"
              />
            </div>
          </et-scroll-area>
        </section>

        <section class="case-mail__read">
          <template v-if="selected">
            <header class="case-mail__read-head">
              <h3 class="case-mail__read-subject">{{ selected.subject }}</h3>
              <div class="case-mail__read-meta">{{ selected.from }} · {{ selected.time }}</div>
            </header>

            <et-scroll-area direction="vertical" class="case-mail__read-body">
              <div v-for="(line, i) in selected.body" :key="i" class="case-mail__line">{{ line }}</div>
            </et-scroll-area>

            <footer class="case-mail__read-foot">
              <et-tool-button size="small" icon="reply" label="回复" tip="回复发件人" @click="onCommand('reply')" />
              <et-tool-button size="small" icon="send-plane" label="转发" tip="转发这封邮件" @click="onCommand('forward')" />
              <span class="case-mail__spacer" />
              <et-shortcut-hint keys="mod+r" label="回复" />
            </footer>
          </template>

          <div v-else class="case-mail__center">
            <et-empty-state icon="mail" title="选一封邮件开始" desc="左侧列表点选，未读会自动标已读。" />
          </div>
        </section>
      </main>

      <template #statusbar>
        <et-status-bar :items="statusItems" @item-click="onStatusClick" />
      </template>
    </et-workbench>

    <et-toast v-model="toast.open" :message="toast.message" type="success" :duration="2200" />
  </div>
</template>

<script setup>
/**
 * 案例：邮件工作台（经典三栏）
 *
 * 产品状态只有一份：当前文件夹 / 过滤 / 选中邮件；命令的 enabled/active 从 ctx 推演，
 * 工具区按钮与阅读面板底部动作读同一份推演结果。归档与删除是真实数据变更（列表跟着动），
 * 过滤到空、或删空一个文件夹时落到空态。
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { isImeComposing } from '@wil-works/evoke-business-ui'
import { comboMatchesEvent, createCommandRegistry } from '@wil-works/evoke-tools-ui/runtime'

const FOLDERS = [
  { id: 'inbox', label: '收件箱', icon: 'inbox' },
  { id: 'draft', label: '草稿', icon: 'draft' },
  { id: 'sent', label: '已发送', icon: 'send-plane' },
  { id: 'archive', label: '归档', icon: 'archive' },
]

const FILTER_TABS = [
  { id: 'all', label: '全部' },
  { id: 'unread', label: '未读' },
  { id: 'starred', label: '星标' },
]

const MAILS = ref([
  {
    id: 'm1',
    folder: 'inbox',
    from: '林可',
    subject: 'Q3 预算复核',
    preview: '附件是修订后的版本，重点看两页。',
    time: '09:24',
    read: false,
    starred: true,
    files: 2,
    body: ['预算已按上周会的口径改过。', '华南与西南两页的差旅口径请再确认一次。', '确认后我直接发财务。'],
  },
  {
    id: 'm2',
    folder: 'inbox',
    from: '周野',
    subject: '发布窗口确认',
    preview: '周四晚 8 点，回滚方案已备。',
    time: '08:51',
    read: false,
    starred: false,
    files: 0,
    body: ['发布窗口定在周四 20:00–22:00。', '回滚脚本与灰度名单已就位。'],
  },
  {
    id: 'm3',
    folder: 'inbox',
    from: '陈默',
    subject: '组件库版本对齐',
    preview: 'tools-ui 1.2.1 已进主干。',
    time: '昨天',
    read: true,
    starred: false,
    files: 1,
    body: ['tools-ui 1.2.1 已进主干，文档站同步。', '下周找半小时对一次令牌切片。'],
  },
  {
    id: 'm4',
    folder: 'inbox',
    from: '许澄',
    subject: '客户现场反馈',
    preview: '三条改进，第一条最急。',
    time: '昨天',
    read: true,
    starred: true,
    files: 0,
    body: ['现场反馈三条，第一条是启动速度。', '其余两条归到下一个迭代。'],
  },
  {
    id: 'm5',
    folder: 'draft',
    from: '我',
    subject: '（草稿）季度复盘提纲',
    preview: '目标 / 差距 / 下一步…',
    time: '周一',
    read: true,
    starred: false,
    files: 0,
    body: ['目标与结果对照。', '差距原因待补。'],
  },
  {
    id: 'm6',
    folder: 'sent',
    from: '我',
    subject: 'Re: 发布窗口确认',
    preview: '收到，按周四执行。',
    time: '周一',
    read: true,
    starred: false,
    files: 0,
    body: ['收到，按周四 20:00 执行。'],
  },
  {
    id: 'm7',
    folder: 'archive',
    from: '系统通知',
    subject: '月度账单已出',
    preview: '账单号 2026-09。',
    time: '9月1日',
    read: true,
    starred: false,
    files: 1,
    body: ['账单号 2026-09，金额见附件。'],
  },
])

const DEFAULT_LAYOUT = {
  docks: [
    {
      id: 'left',
      side: 'left',
      panels: [
        { id: 'folders', title: '文件夹', size: 150, min: 120, max: 220 },
        { id: 'tags', title: '标签', size: 120, min: 96, max: 200 },
      ],
    },
  ],
  maximized: null,
}

const layout = ref(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)))
const store = reactive({ folder: 'inbox', selectedId: 'm1' })
const filter = ref('all')
const toast = reactive({ open: false, message: '' })

const TAGS = computed(() => [
  { label: '星标', icon: 'star-filled', count: MAILS.value.filter((m) => m.starred).length },
  { label: '带附件', icon: 'attachment', count: MAILS.value.filter((m) => m.files).length },
  { label: '未读', icon: 'mail', count: MAILS.value.filter((m) => !m.read).length },
])

const currentFolder = computed(() => FOLDERS.find((f) => f.id === store.folder) ?? FOLDERS[0])

const visibleMails = computed(() =>
  MAILS.value.filter((m) => m.folder === store.folder && matchFilter(m)),
)

const selected = computed(() => MAILS.value.find((m) => m.id === store.selectedId) ?? null)

/** 一份 ctx 喂全部界面：enabled/active 全从这里推演 */
const ctx = computed(() => ({
  hasMail: Boolean(selected.value),
  starred: Boolean(selected.value?.starred),
  unread: Boolean(selected.value && !selected.value.read),
  inArchive: store.folder === 'archive',
}))

const statusItems = computed(() => [
  { key: 'folder', label: '文件夹', value: currentFolder.value.label },
  { key: 'unread', label: '未读', value: String(MAILS.value.filter((m) => !m.read).length) },
  { key: 'filter', label: '过滤', value: FILTER_TABS.find((t) => t.id === filter.value)?.label ?? '全部' },
  { key: 'mail', label: '当前', value: selected.value ? selected.value.from : '未选中' },
])

/** 空态主按钮：先放宽过滤，过滤已是全部时回收件箱 */
const emptyActionLabel = computed(() => (filter.value !== 'all' ? '看全部' : '回收件箱'))

function onEmptyAction() {
  if (filter.value !== 'all') {
    filter.value = 'all'
    return
  }
  openFolder('inbox')
}

function unreadOf(folder) {
  return MAILS.value.filter((m) => m.folder === folder && !m.read).length
}

function matchFilter(mail) {
  if (filter.value === 'unread') return !mail.read
  if (filter.value === 'starred') return mail.starred
  return true
}

const registry = createCommandRegistry()
registry.registerAll([
  {
    id: 'reply', title: '回复', keys: 'mod+r', icon: 'reply', group: '邮件', surfaces: ['toolbar'],
    enabled: (c) => c.hasMail,
    run: () => {},
  },
  {
    id: 'forward', title: '转发', icon: 'send-plane', group: '邮件', surfaces: ['toolbar'],
    enabled: (c) => c.hasMail,
    run: () => {},
  },
  {
    id: 'archive', title: '归档', keys: 'mod+e', icon: 'archive', group: '邮件', surfaces: ['toolbar'],
    enabled: (c) => c.hasMail && !c.inArchive,
    run: () => moveSelected('archive'),
  },
  {
    id: 'delete', title: '删除', keys: 'delete', icon: 'delete', group: '邮件', surfaces: ['toolbar'],
    enabled: (c) => c.hasMail,
    run: () => removeSelected(),
  },
  {
    id: 'star', title: '星标', icon: 'star', group: '标记', surfaces: ['toolbar'],
    enabled: (c) => c.hasMail,
    active: (c) => c.starred,
    run: () => toggleStar(),
  },
  {
    id: 'unread', title: '未读', icon: 'mail', group: '标记', surfaces: ['toolbar'],
    enabled: (c) => c.hasMail,
    active: (c) => c.unread,
    run: () => toggleRead(),
  },
])

/** enabled / active 只有一处实现（registry.state），模板只消费推演结果 */
const stateOf = (id) => registry.state(id, ctx.value)

function openFolder(id) {
  store.folder = id
  filter.value = 'all'
}

function selectMail(id) {
  store.selectedId = id
  const mail = MAILS.value.find((m) => m.id === id)
  if (mail) mail.read = true
}

function moveSelected(target) {
  const mail = selected.value
  if (!mail) return
  const index = visibleMails.value.findIndex((m) => m.id === mail.id)
  mail.folder = target
  reselect(index)
}

function removeSelected() {
  const index = MAILS.value.findIndex((m) => m.id === store.selectedId)
  if (index < 0) return
  MAILS.value.splice(index, 1)
  reselect(index)
}

/** 选中项离开当前列表（归档 / 删除）后，落到原位置的下一封；列表空则清空选中 */
function reselect(index = 0) {
  const list = visibleMails.value
  if (list.some((m) => m.id === store.selectedId)) return
  store.selectedId = list[Math.min(index, list.length - 1)]?.id ?? null
}

function toggleStar() {
  if (selected.value) selected.value.starred = !selected.value.starred
}

function toggleRead() {
  if (selected.value) selected.value.read = !selected.value.read
}

function onCommand(id) {
  if (!registry.run(id, ctx.value)) return
  toast.open = true
  toast.message = `执行命令：${id}`
}

function onStatusClick(key) {
  toast.open = true
  toast.message = `状态栏条目：${key}`
}

function onCorrupted() {
  toast.open = true
  toast.message = '布局已重置为默认'
}

/** 切文件夹/过滤后，选中项若不在可见列表里就落到第一封（列表空则清空选中） */
watch([() => store.folder, filter], () => {
  const stillVisible = visibleMails.value.some((m) => m.id === store.selectedId)
  if (!stillVisible) store.selectedId = visibleMails.value[0]?.id ?? null
})

// 工具区上写的键位必须真响应：⌘R 回复 / ⌘E 归档 / Del 删除（键位解析与组字守卫走运行时）
function onGlobalKeydown(e) {
  if (isImeComposing(e)) return
  const hit = ['mod+r', 'mod+e', 'delete'].find((combo) => comboMatchesEvent(combo, e))
  if (!hit) return
  e.preventDefault()
  onCommand(hit === 'mod+r' ? 'reply' : hit === 'mod+e' ? 'archive' : 'delete')
}
onMounted(() => document.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onGlobalKeydown))
</script>

<style scoped>
.case-mail {
  height: 460px;
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-border-radius-base, 4px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.case-mail :deep(.et-workbench) {
  height: 100%;
}

.case-mail__tools {
  display: flex;
  align-items: flex-start;
  gap: var(--et-space-block);
  min-height: var(--et-chrome-toolarea-height);
  padding: 0 var(--et-space-band-inline);
  background: var(--et-chrome-bg);
}
.case-mail__spacer {
  flex: 1;
}
.case-mail__hints {
  display: flex;
  align-items: center;
  gap: var(--et-space-block);
  align-self: stretch;
}

.case-mail__panel {
  display: block;
  height: 100%;
  padding: var(--et-space-inline) var(--et-space-block);
}
.case-mail__folder {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 5px 8px;
  border: none;
  border-radius: var(--eb-border-radius-base, 4px);
  background: transparent;
  text-align: left;
  font-size: 13px;
  color: var(--eb-text-color-regular);
  cursor: pointer;
}
.case-mail__folder:hover {
  background: var(--eb-fill-color-light);
}
.case-mail__folder.is-active {
  color: var(--eb-color-primary);
  background: var(--eb-color-primary-light-9);
}
.case-mail__tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  font-size: 13px;
  color: var(--eb-text-color-regular);
}
.case-mail__count {
  margin-left: auto;
  font-size: 11.5px;
  color: var(--eb-text-color-secondary);
}

.case-mail__canvas {
  display: grid;
  grid-template-columns: minmax(240px, 300px) 1fr;
  height: 100%;
  background: var(--eb-bg-color);
}
.case-mail__center {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 120px;
}

.case-mail__list {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-right: 1px solid var(--eb-border-color-lighter);
}
.case-mail__list-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 var(--et-space-block);
  border-bottom: 1px solid var(--eb-border-color-lighter);
}
.case-mail__list-body {
  flex: 1;
  min-height: 0;
}
.case-mail__item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-bottom: 1px solid var(--eb-border-color-lighter);
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.case-mail__item:hover {
  background: var(--eb-fill-color-light);
}
.case-mail__item.is-sel {
  background: var(--eb-color-primary-light-9);
  box-shadow: inset 2px 0 0 var(--eb-color-primary);
}
.case-mail__from {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  font-size: 13px;
  color: var(--eb-text-color-primary);
}
.case-mail__from-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.case-mail__mark {
  flex: none;
  color: var(--eb-color-primary);
}
.case-mail__item.is-unread .case-mail__from {
  font-weight: 600;
}
.case-mail__time {
  font-size: 11.5px;
  color: var(--eb-text-color-secondary);
}
.case-mail__subject,
.case-mail__preview {
  grid-column: 1 / -1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.case-mail__subject {
  font-size: 12.5px;
  color: var(--eb-text-color-regular);
}
.case-mail__item.is-unread .case-mail__subject {
  font-weight: 600;
}
.case-mail__preview {
  font-size: 12px;
  color: var(--eb-text-color-secondary);
}

.case-mail__read {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.case-mail__read-head {
  padding: 12px var(--et-space-block) 8px;
  border-bottom: 1px solid var(--eb-border-color-lighter);
}
.case-mail__read-subject {
  margin: 0 0 4px;
  font-size: 15px;
  color: var(--eb-text-color-primary);
}
.case-mail__read-meta {
  margin: 0;
  font-size: 12px;
  color: var(--eb-text-color-secondary);
}
.case-mail__read-body {
  flex: 1;
  min-height: 0;
  padding: 10px var(--et-space-block);
}
.case-mail__line {
  margin: 0 0 8px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--eb-text-color-regular);
}
.case-mail__read-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px var(--et-space-block);
  border-top: 1px solid var(--eb-border-color-lighter);
}
</style>