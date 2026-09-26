<script>
/**
 * EtThemeBridge — 主题 → 画布调色板桥接（tools-ui 计划 05 §四 L4 / M3 交付物 4）
 *
 * 职责边界：画布色值归产品层（画布侧自定义属性 --ot-* 前缀，由产品 CSS 消费），
 * 本件只做"映射"——按 runtime/theme/palette.js 的登记表把每个画布角色对到主题侧
 * 已有令牌名，运行期读实际值写进 target。本件与调色板契约同源：一个颜色字面量
 * 都没有（G1 红线：框架层不认识色值，只认识令牌名；换品牌色/暗色都不用改本件）。
 *
 * 联动机制：observeThemeChanges 用同一个 target 订阅与落值（L0 的
 * applyCanvasPalette 兼容 Element：写进行内样式）——class / style / data-theme /
 * data-density 变化（主题值都挂 :root）→ 重跑 resolveCanvasPalette →
 * applyCanvasPalette 重写一遍。写值本身也触发订阅，但 resolve 结果按签名去重，
 * 不会自激循环。退订在 onBeforeUnmount（订阅必须可退订，禁观察器泄漏）。
 *
 * 画布侧消费方 = 产品层 CSS（表格网格线 / 选区 / 表头 / 活动格等规则引用 --ot-*
 * 自定义属性）；框架只保证"主题令牌变了，画布令牌跟着变"，消费形态归产品。
 * palette prop 允许产品追加画布角色：{ ...CANVAS_PALETTE, 'canvas-x': '--eb-xxx' }，
 * 角色名经 applyCanvasPalette 统一加前缀后落值，产品侧引用同名即可。
 *
 * 本件不渲染任何 DOM（render 返回 null：桥接是纯副作用，不占布局、不吃事件）。
 */
import { defineComponent, onBeforeUnmount, onMounted, watch } from 'vue'
import { CANVAS_PALETTE, observeThemeChanges } from '../../runtime/theme/palette'

export default defineComponent({
  name: 'EtThemeBridge',
  props: {
    /** 画布角色 → 主题侧令牌名登记表（默认 CANVAS_PALETTE；产品可整体替换以追加角色） */
    palette: { type: Object, default: () => CANVAS_PALETTE },
    /** 写入与订阅目标：'html'（默认）/ CSS 选择器 / Element 实例 */
    target: { type: [String, Object], default: 'html' },
  },
  setup(props) {
    /** 退订函数占位：subscribe 每次重建前先退旧的（target/palette 变更不叠观察器） */
    let unsubscribe = () => {}

    /** target 解析：Element 直通；'html' 或选择器走 document；解析不到返回 null（静默不桥接） */
    function resolveTargetElement() {
      const raw = props.target
      if (raw && typeof raw === 'object') return raw
      if (typeof document === 'undefined') return null
      const selector = typeof raw === 'string' && raw ? raw : 'html'
      if (selector === 'html') return document.documentElement
      return document.querySelector(selector)
    }

    function subscribe() {
      unsubscribe()
      const el = resolveTargetElement()
      if (!el) return
      // 同一个 el 传两边：MutationObserver 的 Node + applyCanvasPalette 的写入面
      // （L0 对 Element 走 el.style；自定义属性落行内样式才对元素及其子树生效）
      unsubscribe = observeThemeChanges(el, () => getComputedStyle(el), undefined, props.palette)
    }

    onMounted(subscribe)

    // target / palette 变更：重建订阅（旧订阅先退，不泄漏）
    watch(() => [props.target, props.palette], subscribe)

    onBeforeUnmount(() => unsubscribe())

    return () => null
  },
})
</script>
