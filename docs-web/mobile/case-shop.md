# 案例：商品详情与结算

<script setup>
import { ref } from 'vue'

const favorited = ref(false)
const cartCount = ref(2)
const ordered = ref(false)
const qty = ref(1)
const color = ref('雾蓝')
const size = ref('M')
const colors = ['雾蓝', '月白', '炭黑']
const sizes = ['S', 'M', 'L', 'XL']
const checkoutOpen = ref(false)
const pay = ref('wechat')
const pays = [
  { id: 'wechat', icon: 'wechat', name: '微信支付', desc: '推荐使用' },
  { id: 'balance', icon: 'wallet', name: '余额支付', desc: '可用 ¥ 218.00' },
]
function addCart() {
  cartCount.value += qty.value
}
function buyNow() {
  checkoutOpen.value = true
}
function submitOrder() {
  checkoutOpen.value = false
  ordered.value = true
  setTimeout(() => {
    ordered.value = false
  }, 2200)
}
</script>

商详页是转化动线的起点：视觉说服（首图）→ 决策信息（价格、规格、服务）→
拇指收势处的双按钮。桌面电商页的「左图右信息 + 侧栏结算」在 375px 上重排为
**上下叙事流 + 吸底操作栏**，结算确认收进底部动作面板——本案例可交互走通
「选规格 → 立即购买 → 面板内确认支付方式 → 提交」完整闭环。

## 整页演示

<DemoBlock title="商品详情 · 转化闭环" description="视觉区 + 价格决策行 + 规格芯片 + 数量步进器 + 服务承诺 + 吸底操作栏；立即购买打开结算动作面板，面板内选支付方式并提交。">

<MobileStage title="商品详情">
  <div class="mb-page" style="gap: 12px; padding-bottom: 20px;">
    <ev-alert v-if="ordered" tone="success" icon="check" title="下单成功，可在「我的订单」查看物流" />
    <div class="mb-card" style="height: 210px; border: none; background: linear-gradient(160deg, var(--ev-color-primary-light-7), var(--ev-color-primary-light-9)); display: flex; align-items: center; justify-content: center; position: relative;">
      <ev-icon name="shopping-bag" :size="56" style="color: var(--ev-color-primary-light-3);" />
      <ev-tag tone="lime" variant="solid" size="small" style="position: absolute; left: 12px; top: 12px;">限时 8 折</ev-tag>
    </div>
    <div>
      <div style="display: flex; align-items: baseline; gap: 8px;">
        <span style="font-size: 26px; font-weight: var(--ev-display-weight); color: var(--ev-color-danger);">¥ 199</span>
        <span style="font-size: 13px; color: var(--ev-text-secondary); text-decoration: line-through;">¥ 249</span>
        <span style="flex: 1;" />
        <span style="font-size: 12px; color: var(--ev-text-secondary);">已售 1.2 万</span>
      </div>
      <div style="margin-top: 6px; font-size: 16px; font-weight: var(--ev-font-weight-medium); color: var(--ev-text-primary);">Evoke 轻量通勤双肩包</div>
      <div style="margin-top: 4px; font-size: 13px; line-height: 1.7; color: var(--ev-text-regular);">防泼水面料 · 16L 容量 · 15.6 寸笔电仓，为通勤与短途出行设计。</div>
    </div>
    <div class="mb-card" style="padding: 12px 14px; display: flex; flex-direction: column; gap: 12px;">
      <div>
        <div style="font-size: 12px; color: var(--ev-text-secondary); margin-bottom: 8px;">颜色</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <ev-tag v-for="c in colors" :key="c" :tone="color === c ? 'primary' : 'neutral'" :variant="color === c ? 'solid' : 'outline'" size="default" style="cursor: pointer;" @click="color = c">{{ c }}</ev-tag>
        </div>
      </div>
      <div>
        <div style="font-size: 12px; color: var(--ev-text-secondary); margin-bottom: 8px;">尺码</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <ev-tag v-for="s in sizes" :key="s" :tone="size === s ? 'primary' : 'neutral'" :variant="size === s ? 'solid' : 'outline'" size="default" style="cursor: pointer;" @click="size = s">{{ s }}</ev-tag>
        </div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 12px; color: var(--ev-text-secondary);">数量</span>
        <span style="display: inline-flex; align-items: center; gap: 12px;">
          <ev-icon-button icon="minus" variant="outline" size="small" :disabled="qty <= 1" @click="qty -= 1" />
          <span style="min-width: 20px; text-align: center; font-size: 14px; color: var(--ev-text-primary);">{{ qty }}</span>
          <ev-icon-button icon="plus" variant="outline" size="small" @click="qty += 1" />
        </span>
      </div>
    </div>
    <div class="mb-card" style="padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--ev-text-secondary);">
      <span style="display: inline-flex; align-items: center; gap: 4px;"><ev-icon name="shield-check" :size="14" style="color: var(--ev-color-success);" />正品保障</span>
      <span style="display: inline-flex; align-items: center; gap: 4px;"><ev-icon name="truck" :size="14" style="color: var(--ev-color-primary);" />48 小时送达</span>
      <span style="display: inline-flex; align-items: center; gap: 4px;"><ev-icon name="customer-service" :size="14" style="color: var(--ev-color-warning);" />七天无理由</span>
    </div>
  </div>
  <template #bottom>
    <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px 22px; border-top: 1px solid var(--ev-border-color-light); background: var(--ev-bg-container);">
      <ev-icon-button icon="customer-service" variant="ghost" aria-label="联系客服" />
      <span style="position: relative; display: inline-flex;">
        <ev-icon-button :icon="favorited ? 'star-fill' : 'star'" :variant="favorited ? 'primary' : 'ghost'" @click="favorited = !favorited" />
        <ev-badge v-if="cartCount" :value="cartCount" style="position: absolute; top: -4px; right: -4px;" />
      </span>
      <ev-button style="flex: 1;" @click="addCart">加入购物袋</ev-button>
      <ev-button type="primary" style="flex: 1;" @click="buyNow">立即购买</ev-button>
    </div>
  </template>
  <ev-action-sheet v-model="checkoutOpen" title="确认订单" :append-to-body="false" :lock-scroll="false">
    <div style="display: flex; flex-direction: column; gap: 10px; padding: 4px 12px 12px;">
      <div style="display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; border-radius: var(--ev-radius-md); background: var(--ev-bg-soft);">
        <ev-icon name="map-pin" :size="16" style="color: var(--ev-color-primary); margin-top: 2px;" />
        <div style="font-size: 13px; line-height: 1.6; color: var(--ev-text-primary);">
          林岸 138****6688<br/>
          <span style="color: var(--ev-text-secondary);">杭州市西湖区… 2 幢 901</span>
        </div>
      </div>
      <div
        v-for="p in pays"
        :key="p.id"
        style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid; border-radius: var(--ev-radius-md); cursor: pointer;"
        :style="{ borderColor: pay === p.id ? 'var(--ev-color-primary)' : 'var(--ev-border-color-light)' }"
        @click="pay = p.id"
      >
        <span style="display: inline-flex; color: var(--ev-color-primary);"><ev-icon :name="p.icon" :size="18" /></span>
        <span style="flex: 1; font-size: 14px; color: var(--ev-text-primary);">{{ p.name }}<span style="margin-left: 8px; font-size: 12px; color: var(--ev-text-secondary);">{{ p.desc }}</span></span>
        <span style="width: 18px; height: 18px; border-radius: var(--ev-radius-full); border: 1px solid var(--ev-border-color); display: inline-flex; align-items: center; justify-content: center;" :style="pay === p.id ? 'border-color: var(--ev-color-primary); background: var(--ev-color-primary); color: #fff;' : 'color: transparent;'">
          <ev-icon name="check" :size="12" />
        </span>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 2px;">
        <span style="font-size: 12px; color: var(--ev-text-secondary);">共 {{ qty }} 件 · 包邮</span>
        <span style="font-size: 16px; font-weight: var(--ev-font-weight-bold); color: var(--ev-color-danger);">¥ {{ 199 * qty }}</span>
      </div>
      <ev-button type="primary" style="width: 100%;" @click="submitOrder">确认支付</ev-button>
    </div>
  </ev-action-sheet>
</MobileStage>

</DemoBlock>

## 拆解：桌面 → 移动做了什么

| 桌面版式 | 本案例的移动表达 |
| --- | --- |
| 左图右信息两栏 | 视觉区整宽置顶（16:9 级），信息纵向接续 |
| 规格侧栏 + 下拉框 | 芯片点选（`EvTag` solid 表选中），能点选不下拉 |
| 数量输入框 | 图标步进器：`minus / plus` 两端夹数值，下限 1 |
| 服务条款页脚 | 一行三个「图标 + 短语」承诺条，打消下单顾虑 |
| 侧栏结算按钮组 | 吸底操作栏：次级（加入购物袋）与主级（立即购买）并排 |
| 结算页跳转 | `EvActionSheet` 自定义内容：地址 + 支付方式单选 + 合计 + 提交，不离开当前页 |

## 搭建清单

1. 视觉区：真机放商品图（`aspect-ratio: 4 / 3`），促销角标用 `EvTag tone="lime"`，
   对应官网语境的「限量促销黄绿」。
2. 价格行：现价用危险色 + `--ev-display-weight` 大字重，划线原价紧随其后，
   销量等信息靠右侧弱化。
3. 规格芯片：`EvTag` 的 `variant` 在 `solid / outline` 间切换即选中态，无需自造组件。
4. 吸底操作栏：图标按钮（客服、收藏）用 `EvIconButton`，购物袋角标挂在收藏位
   示意库存动线；真机记得补 `env(safe-area-inset-bottom)`（见[安全区](/mobile/#视口与安全区)）。
5. 结算面板：`EvActionSheet` 默认插槽放自定义内容，支付方式选中态用单选圆点
   （`check` 图标反白）；提交后以 `EvAlert` 轻反馈收尾，不用阻塞弹窗。
