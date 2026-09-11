# Carousel 走马灯

轮播容器：自动播放、指示器（click / hover 触发）、悬停箭头、垂直方向与手动控制。子项必须使用 `eb-carousel-item`。

## 基础用法

<DemoBlock>
  <eb-carousel height="160px" style="max-width: 480px">
    <eb-carousel-item>
      <div style="height: 160px; background: var(--eb-color-primary-light-9); display: flex; align-items: center; justify-content: center; color: var(--eb-color-primary); font-size: 20px;">公告一：系统升级通知</div>
    </eb-carousel-item>
    <eb-carousel-item>
      <div style="height: 160px; background: var(--eb-color-success-light-9); display: flex; align-items: center; justify-content: center; color: var(--eb-color-success); font-size: 20px;">公告二：季度报表已生成</div>
    </eb-carousel-item>
    <eb-carousel-item>
      <div style="height: 160px; background: var(--eb-color-warning-light-9); display: flex; align-items: center; justify-content: center; color: var(--eb-color-warning); font-size: 20px;">公告三：新版操作手册上线</div>
    </eb-carousel-item>
  </eb-carousel>
</DemoBlock>

## 指示器位置与切换箭头

`indicator-position="outside"` 指示器移到容器外；`arrow="always"` 常显切换箭头；`trigger="hover"` 悬停即切换。

<DemoBlock>
  <eb-carousel height="140px" indicator-position="outside" arrow="always" :interval="4000" style="max-width: 480px">
    <eb-carousel-item v-for="n in 4" :key="n">
      <div style="height: 140px; background: var(--eb-fill-color); display: flex; align-items: center; justify-content: center; color: var(--eb-text-color-secondary);">第 {{ n }} 帧（悬停出现左右箭头由 arrow 控制）</div>
    </eb-carousel-item>
  </eb-carousel>
</DemoBlock>

## 手动控制（程序化切换）

通过 ref 暴露的 `setActiveItem / prev / next` 程序化切换，常与外部按钮联动：

<DemoBlock>
  <eb-space size="middle" direction="column">
    <eb-carousel ref="carouselRef" height="120px" :autoplay="false" arrow="never" style="max-width: 480px">
      <eb-carousel-item v-for="n in 3" :key="n">
        <div style="height: 120px; background: var(--eb-fill-color-light); display: flex; align-items: center; justify-content: center;">轮播帧 {{ n }}</div>
      </eb-carousel-item>
    </eb-carousel>
    <eb-space size="middle">
      <eb-button @click="carouselRef.prev()">上一帧</eb-button>
      <eb-button @click="carouselRef.next()">下一帧</eb-button>
      <eb-button @click="carouselRef.setActiveItem(2)">跳到第 3 帧</eb-button>
    </eb-space>
  </eb-space>
</DemoBlock>

## 垂直方向

<DemoBlock>
  <eb-carousel height="120px" direction="vertical" :interval="2500" style="max-width: 480px">
    <eb-carousel-item v-for="n in 3" :key="n">
      <div style="height: 120px; background: var(--eb-fill-color-light); display: flex; align-items: center; justify-content: center; color: var(--eb-text-color-secondary);">垂直滚动帧 {{ n }}</div>
    </eb-carousel-item>
  </eb-carousel>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const carouselRef = ref(null)
</script>

## Carousel API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| initial-index | Number | `0` | 初始页 |
| height | String | — | 高度（必填，如 `160px`） |
| trigger | String | `click` | 指示器触发：click / hover |
| autoplay | Boolean | `true` | 自动播放 |
| interval | Number | `3000` | 播放间隔（ms） |
| indicator-position | String | — | `outside` 容器外 / `none` 隐藏 |
| arrow | String | `hover` | 箭头显示：always / hover / never |
| loop | Boolean | `true` | 循环播放 |
| direction | String | `horizontal` | horizontal / vertical |
| pause-on-hover | Boolean | `true` | 悬停暂停 |

事件：`change(index, prevIndex)`；暴露 `setActiveItem(index \| name)` / `prev()` / `next()`；子项使用 `eb-carousel-item`（可传 `name`）。
