<template>
  <section class="demo">
    <h2>EbSelect / EbPagination / EbAvatar / EbBadge</h2>

    <h3>EbSelect</h3>
    <div class="demo-row">
      <span class="demo-label">基础</span>
      <eb-select v-model="single" placeholder="请选择" style="width: 220px">
        <eb-option value="a" label="选项A" />
        <eb-option value="b" label="选项B" />
        <eb-option value="c" label="禁用项" disabled />
      </eb-select>
      <eb-select v-model="single" clearable style="width: 180px">
        <eb-option v-for="i in 5" :key="i" :value="i" :label="`选项 ${i}`" />
      </eb-select>
    </div>
    <div class="demo-row">
      <span class="demo-label">多选</span>
      <eb-select v-model="multi" multiple style="width: 360px">
        <eb-option value="a" label="标签A" />
        <eb-option value="b" label="标签B" />
        <eb-option value="c" label="标签C" />
      </eb-select>
      <eb-select v-model="multi" multiple collapse-tags style="width: 220px">
        <eb-option value="a" label="标签A" />
        <eb-option value="b" label="标签B" />
        <eb-option value="c" label="标签C" />
      </eb-select>
    </div>
    <div class="demo-row">
      <span class="demo-label">可过滤</span>
      <eb-select v-model="single" filterable placeholder="输入过滤" style="width: 240px">
        <eb-option value="beijing" label="北京" />
        <eb-option value="shanghai" label="上海" />
        <eb-option value="shenzhen" label="深圳" />
      </eb-select>
      <eb-select v-model="single" filterable allow-create placeholder="可创建" style="width: 240px">
        <eb-option value="x" label="预设X" />
      </eb-select>
    </div>
    <div class="demo-row">
      <span class="demo-label">分组</span>
      <eb-select v-model="single" style="width: 240px">
        <eb-option-group label="热门城市">
          <eb-option value="bj" label="北京" />
          <eb-option value="sh" label="上海" />
        </eb-option-group>
        <eb-option-group label="其他">
          <eb-option value="gz" label="广州" />
        </eb-option-group>
      </eb-select>
    </div>

    <h3>EbPagination</h3>
    <eb-pagination
      v-model="pager"
      :total="200"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
    />
    <p class="hint">当前：第 {{ pager.page }} 页 / {{ pager.size }} 条每页</p>
    <eb-pagination :total="50" layout="prev, pager, next" size="small" style="margin-top: 12px" />

    <h3>EbAvatar / EbBadge</h3>
    <div class="demo-row">
      <span class="demo-label">头像</span>
      <eb-avatar>W</eb-avatar>
      <eb-avatar size="small">S</eb-avatar>
      <eb-avatar size="large">L</eb-avatar>
      <eb-avatar :size="64" shape="square">64</eb-avatar>
      <eb-avatar src="/broken.png">兜底</eb-avatar>
    </div>
    <div class="demo-row">
      <span class="demo-label">徽标</span>
      <eb-badge :value="12">
        <eb-button>消息</eb-button>
      </eb-badge>
      <eb-badge :value="200" :max="99">
        <eb-button>溢出</eb-button>
      </eb-badge>
      <eb-badge is-dot>
        <eb-icon name="bell" :size="20" />
      </eb-badge>
      <eb-badge :value="1" type="success" standalone />
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
const single = ref('')
const multi = ref(['a'])
const pager = reactive({ page: 1, size: 20 })
</script>

<style scoped src="./demo.css"></style>
