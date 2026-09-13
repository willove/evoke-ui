# ScrollScene 滚动场景

`EvScrollScene` 是滚动叙事的舞台：外层按场景时长拉出滚动长度，内层 sticky 钉在
视口里——**滚动条就是时间轴**，下滚前进、上滚回溯。进度经作用域插槽
`{ progress }` 与 CSS 变量 `--ev-scene-progress`（0..1）双通道暴露：纯 CSS 用
`calc()` 消费，canvas 刷帧、视频进度这类 JS 消费走插槽值。用户系统开启
「减少动态效果」时进度自动钉在终态 1，页面静态呈现最终样子。

触发型的滚动入场（进视口播一次）请用 [v-reveal](/guide/motion)；两权分立。
笔记本开合这类完整案例见指南[「滚动叙事」](/guide/scroll)。

## 基础用法

<DemoBlock title="进度随滚动双向变化" description="缓慢滚动页面：数字与进度条随滚动位置推进，向上滚动即回退。">

<div class="ss-demo">
  <EvScrollScene duration="480px">
    <template #default="{ progress }">
      <div class="ss-box">
        <p class="ss-num">{{ Math.round(progress * 100) }}<span>%</span></p>
        <div class="ss-bar"><span class="ss-fill" :style="{ width: `${progress * 100}%` }"></span></div>
        <p class="ss-tip">滚动页面推进进度 · 向上滚动回退</p>
      </div>
    </template>
  </EvScrollScene>
</div>

```vue
<EvScrollScene duration="480px">
  <template #default="{ progress }">
    <div class="ss-fill" :style="{ width: `${progress * 100}%` }"></div>
  </template>
</EvScrollScene>
```

</DemoBlock>

纯 CSS 消费不需要插槽值，直接对变量做 `calc()`：

```css
.lid {
  /* 闭合 -92° → 直立 0° */
  transform: rotateX(calc(-92deg + var(--ev-scene-progress) * 92deg));
  transform-origin: 50% 100%;
}
.screen {
  /* calc 超界自动收敛到 0..1 */
  opacity: calc(var(--ev-scene-progress) * 1.4 - 0.25);
}
```

## 场景参数

<DemoBlock title="时长与吸附偏移" description="duration 决定钉住期间滚过多远；top 用于给悬浮导航让位——吸附点推迟到导航下沿，进度几何自动跟随。">

<div class="ss-demo">
  <EvScrollScene duration="480px" :top="56">
    <template #default="{ progress }">
      <div class="ss-box ss-box--top">
        <p class="ss-num">{{ Math.round(progress * 100) }}<span>%</span></p>
        <p class="ss-tip">top: 56px——吸附在导航下方，起点相应推迟</p>
      </div>
    </template>
  </EvScrollScene>
</div>

```vue
<EvScrollScene :duration="300" :top="56">…</EvScrollScene>
```

</DemoBlock>

窄屏或打印等不想启用场景的环境，传 `disabled`：不拉高度、不吸附，进度恒 0，
内容按普通文档流直出（CSS 变量仍输出 0，消费端 calc 不至于失效）。

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| duration | 场景时长：钉住期间滚过的距离，数字按 vh | number \| string | `300` |
| top | 吸附偏移（sticky top），给悬浮导航/横幅让位，数字按 px | number \| string | `0` |
| disabled | 关闭场景：不拉高度不吸附，进度恒 0 | boolean | `false` |

### 插槽

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| default | 场景内容（舞台内，默认撑满视口高） | `{ progress: number, reduced: boolean }` |

### CSS 变量

| 变量 | 说明 |
| --- | --- |
| `--ev-scene-progress` | 场景进度 0..1，写在场景根元素上，供后代 `calc()` 消费 |

自定义场景结构（视差、多元素错拍）可直接用 `useScrollProgress` 进度原语，
几何语义与组件一致；导出自包根。页面级分步吸附用 [EvSection](/components/section)
的 `snap` prop，内部滚动容器用 `ev-snap-y` / `ev-snap-start` 工具类。

<style scoped>
.ss-demo :deep(.ev-scroll-scene__stage) {
  min-height: 420px;
  justify-content: center;
}
.ss-box,
.ss-box--top {
  width: min(520px, 86%);
  margin: 0 auto;
  padding: 40px 44px;
  border: 1px solid var(--ev-border-color);
  border-radius: 16px;
  background: var(--ev-bg-container);
  text-align: center;
}
.ss-num {
  margin: 0;
  font-size: 56px;
  font-weight: 200;
  line-height: 1.1;
  color: var(--ev-color-primary);
  font-variant-numeric: tabular-nums;
}
.ss-num span {
  font-size: 22px;
  margin-left: 4px;
  color: var(--ev-text-secondary);
}
.ss-bar {
  height: 6px;
  margin: 22px auto 0;
  border-radius: 999px;
  background: var(--ev-fill-3);
  overflow: hidden;
}
.ss-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--ev-color-primary);
}
.ss-tip {
  margin: 18px 0 0;
  font-size: 13px;
  color: var(--ev-text-secondary);
}
</style>
