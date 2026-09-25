<template>
  <div class="et-emptystate" role="status">
    <!-- role=status 与底座 EbEmptyState 一致：空态常驻首屏，读屏进入即播报。
         图标是引导的视线锚，不是可读信息：整盒对读屏隐藏（aria 名由标题承担） -->
    <div class="et-emptystate__icon" aria-hidden="true">
      <et-icon :name="iconName" :size="ICON_SIZE" />
    </div>
    <p class="et-emptystate__title">{{ title }}</p>
    <p v-if="desc" class="et-emptystate__desc">{{ desc }}</p>
    <!-- 主按钮位：给了 slot 用产品的；只有 actionLabel 时给一个基础主钮。
         全组件只有这一个强调色操作（frontend-ui-ux：每屏强调色主操作 ≤ 2） -->
    <slot name="action">
      <eb-button v-if="actionLabel" class="et-emptystate__action" type="primary" @click="emit('action')">
        {{ actionLabel }}
      </eb-button>
    </slot>
  </div>
</template>

<script setup>
/**
 * EtEmptyState — 工具界面空态（tools-ui 计划 05 §四 L3 / 06 §三 文案门）
 *
 * 空态即首屏（06 §三）：新用户第一次打开看到的是"一句引导 + 一个主按钮"，
 * 不是空面板阵。因此本件只有四样东西——图标（视线锚，muted 中性色）、
 * 标题（引导句，一行）、desc（可选的一行补充，0 档不写）、action（唯一主操作）。
 *
 * 与底座 EbEmptyState 的分界：底座面向中后台数据表格（插画 + 描述 + 底部操作位），
 * 本件对齐工具界面的安静密度——图标取 --et-icon-lg 档、无插画、无多操作位，
 * 强调色全组件只出现一次（那个主钮）。
 */
import { computed } from 'vue'
import EbButton from '@wil-works/evoke-business-ui/button'
import EtIcon from '../../icons/icon.vue'

defineOptions({ name: 'EtEmptyState' })

const props = defineProps({
  /** 图标名（第 ② 层语义名；缺省 search = 默认档的引导情景） */
  icon: { type: String, default: 'search' },
  /** 引导句（必填；动词开头、说人话，≤4 字优先——06 §三 文案门） */
  title: { type: String, required: true },
  /** 一行补充说明（可选；空串不渲染，0 档不写） */
  desc: { type: String, default: '' },
  /** 主按钮文案（给了 action slot 时忽略） */
  actionLabel: { type: String, default: '' },
})

const emit = defineEmits(['action'])

/**
 * 图标 prop 经 computed 中转（与 EtToolButton 的 iconName 同惯例）：
 * G2 图标门是静态文本提取，分不清绑定值与字面量，直连 :name 会被误判。
 */
const iconName = computed(() => props.icon)

/** 图标盒走 lg 档（24 默认 / 20 紧凑 / 28 宽松）——尺寸同样只引用令牌 */
const ICON_SIZE = 'var(--et-icon-lg)'
</script>

<style src="./style.css"></style>
