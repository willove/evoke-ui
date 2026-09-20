# 相机与交互

三维图的视角由一台轨道相机控制：相机绕目标点环绕（`yaw` 方位角 / `pitch` 仰角 /
`distance` 距离），所有交互本质都是在改这三个量（外加 `target` 看向哪里）。

## 指针交互

| 手势 | 行为 |
| --- | --- |
| 拖拽 | 环绕视角（向下拖看到更多顶面） |
| Shift + 拖拽 | 平移画面（移动 target） |
| 滚轮 | 缩放（拉近 / 推远） |
| 双指捏合 | 缩放（触屏） |
| 双击 | 复位到初始视角 |
| 悬浮 | 拾取数据，弹出 tooltip |

关闭某项能力：

```js
{
  interaction: {
    zoom: false,           // 关滚轮/捏合缩放
    resetOnDblClick: false // 关双击复位
  }
}
```

## 自动旋转

<DemoBlock>
  <ev-chart3d
    :options="{
      type: 'pie3d',
      title: '渠道构成',
      pieData: [
        { name: '直销', value: 42 },
        { name: '渠道', value: 26 },
        { name: '电商', value: 18 },
        { name: '海外', value: 9 },
        { name: '其他', value: 5 }
      ],
      camera: { autoRotate: true, autoRotateSpeed: 14, pitch: 30 }
    }"
    :height="340"
  />
</DemoBlock>

`autoRotateSpeed` 单位是度/秒，正负决定方向；拖拽时自动暂停，松手后继续。

## 初始视角

`camera` 里的四个量决定开场构图，全部可省略：

<DemoBlock>
  <ev-chart3d
    :options="{
      type: 'bar3d',
      title: '低视角长影',
      labels: ['1月', '2月', '3月', '4月', '5月'],
      series: [{ name: '出货', data: [420, 380, 500, 460, 540] }],
      camera: { yaw: -24, pitch: 12, distance: 4.4 }
    }"
    :height="300"
  />
</DemoBlock>

- `yaw`：方位角（度），默认 -52，即从左前上方看；
- `pitch`：仰角（度），默认 27，限制在 2–88 之间，不会钻到地下；
- `distance`：相机距离，默认 3.6，装不下数据时会自动外推（autoFit）；
- `target`：看向的世界坐标点，默认略高于地面。

用户一旦手动拖拽或缩放，autoFit 即停止，避免和用户操作打架；双击或 `resetCamera()`
可回到配置的初始视角。

## 键盘

图表容器可聚焦（Tab 进入），方向键环绕、`+` / `-` 缩放、`Home` 复位、`Esc` 清除悬浮、
`Enter` 触发点选。

## 事件与实例方法

```vue
<template>
  <EvChart3d ref="chart" :options="options" @camera-change="onCamera" />
</template>

<script setup>
import { ref } from 'vue'

const chart = ref(null)

function onCamera(cam) {
  // { yaw, pitch, distance, target }
  console.log(cam.yaw, cam.pitch)
}

// 命令式控制
chart.value.setCamera({ yaw: -30, pitch: 40 })
chart.value.resetCamera()
</script>
```

<DemoBlock>
  <div style="display:flex; gap:8px; margin-bottom:10px;">
    <EvButton size="small" @click="spinRef?.setCamera({ yaw: (spinRef?.getCamera()?.yaw ?? 0) - 30 })">左转 30°</EvButton>
    <EvButton size="small" @click="spinRef?.setCamera({ yaw: (spinRef?.getCamera()?.yaw ?? 0) + 30 })">右转 30°</EvButton>
    <EvButton size="small" @click="spinRef?.resetCamera()">复位</EvButton>
  </div>
  <ev-chart3d
    ref="spinRef"
    :options="spinOptions"
    :height="300"
  />
</DemoBlock>

相机变化只会重绘画面，不会重放进场动画；`camera-change` 在拖拽结束时补发一次终态，
拖拽过程中不刷事件。

<script setup>
import { ref } from 'vue'

const spinRef = ref(null)
const spinOptions = {
  type: 'scatter3d',
  title: '散点云 · 相机控制',
  scatterData: [
    [1, 1, 3], [2, 2.2, 6], [2.6, 1.4, 4], [3.2, 3, 8],
    [4, 2.4, 5.5], [4.6, 3.4, 9], [5.2, 1.8, 4.8], [6, 2.8, 7],
    [3, 4, 6.4], [5, 4.4, 3.6], [1.8, 3.6, 5], [4.2, 0.8, 6.8]
  ],
  scatter: { size: 6 },
  zAxis: { name: '强度' },
}
</script>
