# 磨砂玻璃

磨砂玻璃（Glassmorphism）让面板变成半透明雾面：背后的内容被柔化模糊、色彩饱和度
轻轻拉高，多层面板叠加时透出彼此的边缘，再配一道顶缘微光——是当下官网与移动端
都在流行的质感语言。

在 Evoke UI 里它是一个全局开关：`EvConfigProvider` 的 `glass` 一开，容器、弹层、
导航、下拉默认玻璃化；每个组件又能用 `glass` 单独强制开或关，用 `blur` 单独调模糊强度。

## 全局开关

<DemoBlock title="玻璃卡叠在照片上" description="开关作用于 html 属性全站生效（演示区经 global: false 局部化）；错位叠放的两张卡透出彼此的边缘。">

<EvConfigProvider glass :global="false">
  <div class="glass-scene glass-scene--forest">
    <EvCard>
      <p style="font-weight:600;">玻璃卡 A</p>
      <p style="font-size:13px;">背后的山林被柔化成雾面，文字依然清晰可读。</p>
    </EvCard>
    <EvCard style="margin-left:48px; margin-top:-18px;">
      <p style="font-weight:600;">玻璃卡 B（错位叠放）</p>
      <p style="font-size:13px;">叠在 A 上的部分透出它的边缘；单张卡传 :glass="false" 可退回实底。</p>
    </EvCard>
  </div>
</EvConfigProvider>

```vue
<EvConfigProvider glass>
  <SiteHome />
</EvConfigProvider>
```

</DemoBlock>

运行时动态切换（如「设置」面板）走 `useThemeConfig`：

```js
import { useThemeConfig } from '@wil-works/evoke-ui'

const { setGlass, reset } = useThemeConfig()
setGlass(true) // 全站磨砂
reset()        // 恢复默认（磨砂关闭）
```

## 三态：跟随全局 / 强制开 / 强制关

每个玻璃组件都有三态 `glass` prop：缺省跟随全局；`glass` 强制开；`:glass="false"`
强制关（在开磨砂的站点里给个别面板退回实底）。

## 磨砂强度 blur

`blur` 接收 px 数字（或带单位字符串），内联覆盖该组件的默认模糊，互不影响：

<DemoBlock title="同一张照片，两档强度" description="左 4px 轻雾、右 28px 重磨——背景细节保留程度一目了然，文字可读性都由半透明底兜住。">

<EvConfigProvider glass :global="false">
  <div class="glass-scene glass-scene--ridge">
    <EvCard :blur="4" style="flex:1;">
      <p style="font-weight:600;">blur = 4</p>
      <p style="font-size:13px;">轻雾：山脊线隐约可辨。</p>
    </EvCard>
    <EvCard :blur="28" style="flex:1;">
      <p style="font-weight:600;">blur = 28</p>
      <p style="font-size:13px;">重磨：背景化开成柔和色块。</p>
    </EvCard>
  </div>
</EvConfigProvider>

```vue
<EvConfigProvider glass>
  <EvCard :blur="4">轻雾</EvCard>
  <EvCard :blur="28">重磨</EvCard>
</EvConfigProvider>
```

</DemoBlock>

## 弹层与预览

浮层家族同样接入：[Modal](/components/modal) 磨砂面板、
[ImagePreview](/components/image-preview) 磨砂预览背景（遮罩减淡整幅雾化，关闭/箭头
按钮同步玻璃化）、[ActionSheet](/mobile/components/action-sheet) 连片取景、
[Select](/components/select) 下拉面板。在玻璃全局开启后无需任何配置，直接呈现。

<DemoBlock title="磨砂弹出层" description="面板后面是整页雾面；点 Esc 或遮罩关闭。">

<div class="glass-scene glass-scene--forest" style="text-align:center;">
  <EvButton @click="sceneModal = true">打开磨砂弹出层</EvButton>
</div>

<EvModal v-model="sceneModal" glass title="磨砂面板" width="420px">
  <p style="margin:0;">面板呈半透明雾面，背后的页面融成柔和色块。</p>
  <template #footer>
    <EvButton size="small" @click="sceneModal = false">关闭</EvButton>
  </template>
</EvModal>

```vue
<EvModal v-model="visible" glass title="磨砂面板">…</EvModal>
```

</DemoBlock>

## 覆盖组件

| 组件 | 磨砂作用位置 |
| --- | --- |
| Card / ArticleCard / PricingCard / ProfileCard / ExecCard | 卡面 |
| Section / Footer | 区块底 |
| Navbar | 常驻吸顶栏 |
| Modal | 面板 |
| ImagePreview | 遮罩与关闭/箭头按钮 |
| ActionSheet | 面板整体（标题/列表/取消栏连片） |
| Tabbar | 底部标签栏 |
| NavBar（移动端） | 页头条 |
| Select | 下拉面板 |

## 磨砂令牌

整站调默认质感时改令牌即可（写在 `:root` 或任意包裹元素上）；单组件微调优先用 `blur` prop。

| 令牌 | 默认值（亮 / 暗） | 说明 |
| --- | --- | --- |
| `--ev-glass-blur` | `16px` | 模糊半径，`blur` prop 内联覆盖的就是它 |
| `--ev-glass-saturate` | `1.5` | 背景饱和度提升 |
| `--ev-glass-bg` | 容器色 72% 不透明 | 半透明雾面底色 |
| `--ev-glass-edge` | 白 42% / 白 16% | 顶缘 1px 高光 |
| `--ev-glass-border` | 边框色 45% / 60% 不透明 | 发丝描边 |

## 降级与豁免

- 浏览器不支持 `backdrop-filter` 时，玻璃样式整条不生效，自动回落实底，内容可读性不受影响；
- 刻意不透明的风格保持原样：Card 的粉彩 tone / sticker / featured、PricingCard 的
  featured 主推卡、ProfileCard 的 plain 形态；
- 桌面 [Navbar](/components/navbar) 的 `blur` 是「滚动后背景磨砂」的开关，与磨砂强度
  无关；它的常驻磨砂由 `glass` 控制。

<script setup>
import { ref } from 'vue'
const sceneModal = ref(false)
</script>

<style scoped>
.glass-scene {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  border-radius: 14px;
  padding: 28px 24px;
  background-position: center;
  background-size: cover;
}
.glass-scene--forest {
  background-image: url(/images/glass-forest.jpg);
}
.glass-scene--ridge {
  flex-direction: row;
  align-items: stretch;
  gap: 16px;
  background-image: url(/images/glass-ridge.jpg);
}
</style>
