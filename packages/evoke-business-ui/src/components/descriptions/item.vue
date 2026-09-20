<template>
  <!-- 结构性子件：由 EbDescriptions 收集渲染，本组件不直接产出 DOM -->
</template>

<script>
/**
 * EbDescriptionsItem — 描述列表项
 * 仅声明契约（props 由父级 EbDescriptions 读取 vnode.props + children 渲染）
 */
export default {
  name: 'EbDescriptionsItem',
  props: {
    label: { type: String, default: '' },
    span: { type: Number, default: 1 },
    width: { type: [String, Number], default: '' },
    minWidth: { type: [String, Number], default: '' },
    align: { type: String, default: 'left' },
    labelAlign: { type: String, default: '' },
    className: { type: String, default: '' },
    labelClassName: { type: String, default: '' },
    labelStyle: { type: Object, default: undefined },
    contentStyle: { type: Object, default: undefined },
  },
  render() {
    return null
  },
}
</script>
