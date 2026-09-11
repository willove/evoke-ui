# 案例：H5 官网

<script setup>
import { ref } from 'vue'

const tab = ref('home')
const shareOpen = ref(false)
const refreshing = ref(false)
const sent = ref(false)
const works = ref([
  { title: '云笔记工作台', meta: '工作台 · Clean Navy' },
  { title: '品牌官网改版', meta: '官网 · Launch Blue' },
  { title: '数据大屏控制台', meta: '中后台 · 07-28' },
])
function onRefresh() {
  setTimeout(() => {
    refreshing.value = false
  }, 1200)
}
function onSend() {
  sent.value = true
  setTimeout(() => {
    sent.value = false
  }, 2000)
}
const tabPages = {
  home: 'home',
  work: 'work',
  contact: 'contact',
}
</script>

一个可以直接对照搭建的 **Web 级移动端官网**微缩案例：与桌面版同一套 Ew 组件和
Clean Navy 令牌，按[适配总览](/mobile/)的范式重排为 375px 叙事流——紧凑首屏、
单列作品流、吸底转化区、底部标签栏，外加下拉刷新与分享动作面板。真机上配一个
`max-width: 420px` 的页面壳即为完整 H5 站点。

## 整站演示

<DemoBlock title="移动端官网 · 全页交互" description="真实组件组装：首屏（大字重标题 + 双 CTA）、作品流（下拉刷新）、合作表单入口、精简页脚、底部标签栏；「更多」打开分享动作面板。">

<MobileStage title="Aurora Studio">
  <ev-pull-refresh v-model="refreshing" @refresh="onRefresh" style="min-height: 100%;">
    <div v-if="tab === 'home'" class="mb-page" style="gap: 16px;">
      <div style="padding: 8px 4px 0;">
        <div style="font-size: 12px; letter-spacing: 0.14em; color: var(--ev-text-secondary); text-transform: uppercase;">AURORA STUDIO</div>
        <div style="margin-top: 8px; font-size: 28px; font-weight: var(--ev-display-weight); letter-spacing: var(--ev-display-letter-spacing); line-height: var(--ev-display-line-height); color: var(--ev-text-primary);">为品牌而生的<br/>设计工作室</div>
        <div style="margin-top: 10px; font-size: 14px; line-height: 1.7; color: var(--ev-text-regular);">以 Clean Navy 设计语言，为认真做产品的团队打造官网与产品界面。</div>
        <div style="display: flex; gap: 10px; margin-top: 16px;">
          <ev-button type="primary" style="flex: 1;" @click="tab = 'contact'">开始合作</ev-button>
          <ev-button style="flex: 1;" @click="tab = 'work'">看作品</ev-button>
        </div>
      </div>
      <div class="mb-card mb-card--pad" v-for="w in works" :key="w.title">
        <div class="mb-card__title">{{ w.title }}</div>
        <div class="mb-card__label" style="margin-top: 4px;">{{ w.meta }}</div>
      </div>
      <div style="text-align: center; font-size: 12px; color: var(--ev-text-secondary); padding: 4px 0 8px;">
        © 2026 Aurora Studio · 用 Evoke UI 搭建
      </div>
    </div>
    <div v-else-if="tab === 'work'" class="mb-page" style="gap: 16px;">
      <div style="font-size: 12px; letter-spacing: 0.14em; color: var(--ev-text-secondary); text-transform: uppercase; padding: 8px 4px 0;">WORK</div>
      <div style="margin-top: -10px; font-size: 22px; font-weight: var(--ev-display-weight); letter-spacing: var(--ev-display-letter-spacing); color: var(--ev-text-primary);">近期作品</div>
      <div class="mb-card mb-card--pad" v-for="w in works" :key="w.title">
        <div class="mb-card__title">{{ w.title }}</div>
        <div class="mb-card__label" style="margin-top: 4px;">{{ w.meta }}</div>
      </div>
      <ev-button style="align-self: stretch;" @click="shareOpen = true">分享作品集</ev-button>
    </div>
    <div v-else class="mb-page" style="gap: 14px;">
      <div style="font-size: 12px; letter-spacing: 0.14em; color: var(--ev-text-secondary); text-transform: uppercase; padding: 8px 4px 0;">CONTACT</div>
      <div style="margin-top: -10px; font-size: 22px; font-weight: var(--ev-display-weight); letter-spacing: var(--ev-display-letter-spacing); color: var(--ev-text-primary);">开始合作</div>
      <ev-field label="称呼"><ev-input placeholder="怎么称呼你" /></ev-field>
      <ev-field label="来意"><ev-input placeholder="官网 / 产品 / 品牌" /></ev-field>
      <ev-field label="留言"><ev-textarea :rows="3" placeholder="简单说说你的项目" /></ev-field>
      <ev-button type="primary" style="width: 100%;" @click="onSend">{{ sent ? '已发送，会尽快回复' : '发送' }}</ev-button>
    </div>
  </ev-pull-refresh>
  <template #bottom>
    <ev-tabbar v-model="tab" :fixed="false">
      <ev-tabbar-item name="home">首页</ev-tabbar-item>
      <ev-tabbar-item name="work" badge="2">作品</ev-tabbar-item>
      <ev-tabbar-item name="contact">合作</ev-tabbar-item>
    </ev-tabbar>
  </template>
  <ev-action-sheet
    v-model="shareOpen"
    title="分享作品集"
    :actions="[{ name: '复制链接' }, { name: '生成海报' }, { name: '微信好友' }]"
    :append-to-body="false" :lock-scroll="false"
  />
</MobileStage>

</DemoBlock>

## 拆解：桌面 → 移动做了什么

| 桌面版式 | 本案例的移动表达 |
| --- | --- |
| Hero：96px 级上下留白 + 多栏布局 | 首屏留白减半，大字重标题两行换行，双 CTA 等宽并排 |
| 作品网格 3 列 | 单列整宽卡片流 + 下拉刷新，详情靠整卡点按 |
| 横向导航（关于/作品/联系） | 收进底部标签栏（EvTabbar），当前页高亮由 `v-model` 驱动 |
| 页脚多栏链接 | 精简为一行版权，说明「用 Evoke UI 搭建」 |
| hover 菜单 / 分享按钮组 | 底部动作面板（EvActionSheet），破坏性与普通动作分离 |
| 表单双栏行 | 单列表单 + label 上置 + 吸底主按钮 |

## 搭建清单

1. 页面壳：`max-width: 420px` 居中 + `min-height: 100dvh`（真机全宽、桌面居中）。
2. 一级入口：`EvTabbar` fixed 吸底（安全区与占位已内置），`v-model` 切页。
3. 内容流：`EvPullRefresh` + `EvLoadMore` 包住卡片列表（见[内容流](/mobile/content)）。
4. 对象操作：`EvActionSheet` 替代 hover 菜单，壳内记得 `:append-to-body="false"`（并配 `:lock-scroll="false"` 防止锁文档页滚动）。
5. 转化表单：单列 `EvField` + 吸底提交（见[表单与转化](/mobile/forms)）。

对照的桌面版案例见 [案例总览](/cases/)（企业官网 / 个人博客 / 云笔记工作台）——同一套
组件，两种版式，设计语言完全一致。
