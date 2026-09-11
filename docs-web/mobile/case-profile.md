# 案例：个人中心

<script setup>
import { ref } from 'vue'

const tab = ref('mine')
const notify = ref(true)
const sheetOpen = ref(false)
const orders = [
  { icon: 'wallet', label: '待付款', badge: '1' },
  { icon: 'truck', label: '待发货' },
  { icon: 'shopping-bag', label: '待收货' },
  { icon: 'refund', label: '退款/售后' },
]
const usualCells = [
  { icon: 'map-pin', label: '收货地址', value: '2 个' },
  { icon: 'heart', label: '我的收藏', value: '32 件' },
  { icon: 'coupon', label: '优惠券', value: '6 张' },
  { icon: 'customer-service', label: '客服与帮助' },
]
const profileActions = [
  { name: '编辑资料' },
  { name: '更换头像' },
  { name: '退出登录', color: 'var(--ev-color-danger)' },
]
</script>

「我的」页是 H5 站点里仅次于首页的高频页面：身份卡、资产统计、订单快捷入口、
功能分组列表。桌面版的 [ProfileCard](/components/profile-card) 与分栏 Section 在
375px 上重排为**纵向分组卡片流**——本案例给出可直接对照搭建的完整交互版，
头像点按还有动作面板（更换头像 / 退出登录）。

## 整页演示

<DemoBlock title="个人中心 · 全页交互" description="身份卡 + 三列统计 + 订单四宫格 + 分组单元行 + 设置开关 + 底部标签栏；点按头像打开账户动作面板。">

<MobileStage title="个人中心">
  <div class="mb-page" style="gap: 12px;">
    <div class="mb-card" style="padding: 16px 14px; border: none; background: linear-gradient(135deg, var(--ev-color-primary-dark-2), var(--ev-color-primary));">
      <div style="display: flex; align-items: center; gap: 12px;">
        <ev-avatar icon="user" :size="52" style="background: rgba(255, 255, 255, 0.16); color: #ffffff; cursor: pointer;" @click="sheetOpen = true" />
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 17px; font-weight: var(--ev-font-weight-bold); color: #ffffff;">林岸</span>
            <ev-tag tone="lime" variant="solid" size="small">PRO 会员</ev-tag>
          </div>
          <div style="margin-top: 4px; font-size: 12px; color: rgba(255, 255, 255, 0.72);">会员有效期至 2027-09-08</div>
        </div>
        <ev-icon name="chevron-right" :size="16" style="color: rgba(255, 255, 255, 0.72);" />
      </div>
    </div>
    <div class="mb-card" style="padding: 12px 0;">
      <div class="mb-stats">
        <div><div class="mb-stats__value">32</div><div class="mb-stats__label">收藏</div></div>
        <div><div class="mb-stats__value">8</div><div class="mb-stats__label">关注</div></div>
        <div><div class="mb-stats__value">6</div><div class="mb-stats__label">优惠券</div></div>
      </div>
    </div>
    <div class="mb-card">
      <div class="mb-card__head" style="padding: 12px 14px 0;">
        <span class="mb-card__title">我的订单</span>
        <span style="display: inline-flex; align-items: center; gap: 2px; font-size: 12px; color: var(--ev-text-secondary); cursor: pointer;">全部订单<ev-icon name="chevron-right" :size="12" /></span>
      </div>
      <div class="mb-grid">
        <div v-for="o in orders" :key="o.label" class="mb-grid__item">
          <span style="position: relative; display: inline-flex;">
            <ev-icon :name="o.icon" :size="20" />
            <ev-badge v-if="o.badge" :value="o.badge" style="position: absolute; top: -7px; right: -11px;" />
          </span>
          <span>{{ o.label }}</span>
        </div>
      </div>
    </div>
    <div class="mb-card">
      <div v-for="c in usualCells" :key="c.label" class="mb-cell">
        <span class="mb-cell__icon"><ev-icon :name="c.icon" :size="16" /></span>
        <span class="mb-cell__body">{{ c.label }}</span>
        <span class="mb-cell__value">{{ c.value }}</span>
        <span class="mb-cell__arrow"><ev-icon name="chevron-right" :size="14" /></span>
      </div>
    </div>
    <div class="mb-card">
      <div class="mb-cell" style="cursor: default;">
        <span class="mb-cell__icon"><ev-icon name="bell" :size="16" /></span>
        <span class="mb-cell__body">消息通知</span>
        <ev-switch v-model="notify" size="small" />
      </div>
      <div class="mb-cell">
        <span class="mb-cell__icon"><ev-icon name="history" :size="16" /></span>
        <span class="mb-cell__body">清理缓存</span>
        <span class="mb-cell__value">12.6 MB</span>
        <span class="mb-cell__arrow"><ev-icon name="chevron-right" :size="14" /></span>
      </div>
      <div class="mb-cell">
        <span class="mb-cell__icon"><ev-icon name="info" :size="16" /></span>
        <span class="mb-cell__body">关于 Evoke</span>
        <span class="mb-cell__value">v2.4.0</span>
        <span class="mb-cell__arrow"><ev-icon name="chevron-right" :size="14" /></span>
      </div>
    </div>
  </div>
  <template #bottom>
    <ev-tabbar v-model="tab" :fixed="false">
      <ev-tabbar-item name="home" icon="home">首页</ev-tabbar-item>
      <ev-tabbar-item name="discover" icon="search">发现</ev-tabbar-item>
      <ev-tabbar-item name="bag" icon="shopping-bag" badge="3">购物袋</ev-tabbar-item>
      <ev-tabbar-item name="mine" icon="user">我的</ev-tabbar-item>
    </ev-tabbar>
  </template>
  <ev-action-sheet v-model="sheetOpen" title="账户操作" :actions="profileActions" :append-to-body="false" :lock-scroll="false" />
</MobileStage>

</DemoBlock>

## 拆解：桌面 → 移动做了什么

| 桌面版式 | 本案例的移动表达 |
| --- | --- |
| ProfileCard 身份卡（横向大卡） | 深色渐变身份条：头像 + 昵称 + 会员标签，一行说完身份 |
| Statistic 数值块并排 | 三列等分统计行，字号收敛到 18px 级 |
| 订单状态分栏表格 | 四宫格快捷入口，`EvBadge` 挂在图标右上角报数 |
| 设置项两栏表单 | 单元行分组卡（`mb-cell`）：图标 + 文案 + 右侧值，开关用 `EvSwitch` 收进行尾 |
| hover 右键菜单 | `EvActionSheet` 账户面板，退出登录标危险色并与普通动作分隔 |
| 顶部横向导航 | `EvTabbar` 吸底一级导航（首页 / 发现 / 购物袋 / 我的），当前项由 `v-model` 驱动 |

## 搭建清单

1. 身份卡：`linear-gradient(135deg, var(--ev-color-primary-dark-2), var(--ev-color-primary))`
   一条到底，头像用 `EvAvatar` + `icon="user"` 回退，浅白底融入深色卡。
2. 统计行与宫格：等分交给 `grid`，数字层级靠字重与颜色，不加边框线。
3. 单元行：图标容器 30px 方圆角 + `--ev-color-primary-light-9` 淡底；整行可点，
   右侧「值 + 箭头」的组合表达「这里能进」。
4. 开关行：`EvSwitch` 直接放行尾（`size="small"`），不用跳转二级页。
5. 账户面板：`EvActionSheet` 的危险动作（退出登录）用 `color` 标红；壳内演示记得
   `:append-to-body="false"` + `:lock-scroll="false"`（见[演示壳说明](/mobile/#演示壳说明)）。
