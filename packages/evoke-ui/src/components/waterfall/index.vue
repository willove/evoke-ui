<template>
  <div class="ew-waterfall" :style="{ gap: `${gap}px` }">
    <div
      v-for="(col, c) in buckets"
      :key="c"
      class="ew-waterfall__col"
      :style="{ gap: `${gap}px` }"
    >
      <div v-for="cell in col" :key="cell.index" class="ew-waterfall__cell">
        <slot name="item" :item="cell.item" :index="cell.index">
          <button
            type="button"
            class="ew-waterfall__item"
            :style="{ '--ew-waterfall-radius': `${radius}px` }"
            :aria-label="cell.item.alt || cell.item.caption || `查看第 ${cell.index + 1} 张图片`"
            @click="open(cell.index)"
          >
            <img
              :src="cell.item.src"
              :alt="cell.item.alt || ''"
              loading="lazy"
              @load="onImgLoad(cell.index, $event)"
            />
            <span v-if="cell.item.caption" class="ew-waterfall__caption">
              {{ cell.item.caption }}
            </span>
          </button>
        </slot>
      </div>
    </div>

    <EwImagePreview
      v-if="preview"
      v-model="previewVisible"
      v-model:index="previewIndex"
      :images="normalized"
    />
  </div>
</template>

<script setup>
/**
 * EwWaterfall — 瀑布流
 * 多列瀑布流布局：按「最短列优先」分发条目，列高随内容比例自动均衡。
 * items 项：字符串 url 或 { src, alt, caption, ratio, width, height }；
 * 未声明比例时先按默认画幅占位，图片加载完成后按真实比例重新归位。
 * 默认渲染图片卡（可带 caption 蒙层、点击打开 EwImagePreview 灯箱，可关）；
 * 作用插槽 #item 完全接管单元格，可承载任意内容实现内容瀑布流。
 */
import { computed, ref } from 'vue'
import EwImagePreview from '../image-preview/index.vue'

const props = defineProps({
  /** 条目列表：url 字符串或 { src, alt, caption, ratio(高/宽), width, height } */
  items: { type: Array, default: () => [] },
  /** 列数 */
  columns: { type: Number, default: 3 },
  /** 间距（px），横向与纵向同值 */
  gap: { type: Number, default: 14 },
  /** 圆角（px） */
  radius: { type: Number, default: 12 },
  /** 点击图片是否打开预览灯箱（false 时仅派发 select 事件） */
  preview: { type: Boolean, default: true },
})

const emit = defineEmits(['select'])

// 未声明比例时的占位画幅（4:3），加载后按真实比例重排
const FALLBACK_RATIO = 0.75

const previewVisible = ref(false)
const previewIndex = ref(0)

// 图片加载后测得的真实比例（高/宽），下标 → ratio
const measured = ref({})

const normalized = computed(() =>
  props.items.map((item) => (typeof item === 'string' ? { src: item } : item))
)

function declaredRatio(item) {
  if (item.ratio) return item.ratio
  if (item.width && item.height) return item.height / item.width
  return 0
}

const buckets = computed(() => {
  const cols = Math.max(1, Math.floor(props.columns))
  const loads = Array(cols).fill(0)
  const out = Array.from({ length: cols }, () => [])
  normalized.value.forEach((item, i) => {
    let target = 0
    for (let k = 1; k < cols; k++) {
      if (loads[k] < loads[target] - 1e-6) target = k
    }
    out[target].push({ item, index: i })
    loads[target] += declaredRatio(item) || measured.value[i] || FALLBACK_RATIO
  })
  return out
})

function onImgLoad(index, e) {
  const img = e.target
  if (!img.naturalWidth || !img.naturalHeight) return
  if (declaredRatio(normalized.value[index])) return
  measured.value = { ...measured.value, [index]: img.naturalHeight / img.naturalWidth }
}

function open(index) {
  previewIndex.value = index
  emit('select', normalized.value[index], index)
  if (props.preview) previewVisible.value = true
}
</script>

<style src="./style.css"></style>
