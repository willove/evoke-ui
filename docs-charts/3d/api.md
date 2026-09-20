# API 参考

`EvChart3d` 全部能力的字段与方法速查。

## Chart Props

<ApiTable title="Chart Props" :rows="[
  { name: 'options', desc: '图表配置，声明式驱动（见下方 Options 字段）', type: 'object', default: '—' },
  { name: 'width / height', desc: '容器尺寸，数字按 px，字符串原样生效', type: 'string | number', default: '100% / 400' },
  { name: 'responsive', desc: '跟随容器尺寸自适应重绘', type: 'boolean', default: 'true' },
  { name: 'devicePixelRatio', desc: '渲染倍率（缺省取设备实际值）', type: 'number', default: '—' },
]" />

## 事件

| 事件 | 载荷 | 触发时机 |
| --- | --- | --- |
| ready | — | 首次渲染完成 |
| click | 图元元数据 + 屏幕坐标 | 点选数据图元 |
| hover / unhover | 图元元数据 | 悬浮进入 / 离开 |
| legend-click | (名称, 是否被隐藏) | 图例点选 |
| animation-end | — | 进场动画结束 |
| data-update | 来源描述 | options 更新 |
| camera-change | `{ yaw, pitch, distance, target }` | 相机变化（拖拽结束补发终态） |

## Options 通用字段

<ApiTable title="Options 通用字段" :rows="[
  { name: 'type', desc: '图型：bar3d / line3d / scatter3d / surface3d / pie3d', type: 'string', default: '—' },
  { name: 'title', desc: '标题：字符串或 { text, subtitle, show, left }', type: 'string | object', default: '—' },
  { name: 'labels', desc: 'x 轴类目数组（bar3d / line3d / 类目模式散点的数据基线）', type: 'array', default: '[]' },
  { name: 'series', desc: '系列数组，每项 { name, data, color? }；data 与 labels 对齐（散点三元组模式下 data 项为 [x, y, z]）', type: 'array', default: '[]' },
  { name: 'legend', desc: '图例：{ show, position（top / bottom）, align（start / center / end）, itemGap }', type: 'object', default: '{ show: true }' },
  { name: 'tooltip', desc: '提示框：{ show, formatter, valueFormatter }；默认模板已转义，formatter 返回值原样输出', type: 'object', default: '{ show: true }' },
  { name: 'animation', desc: '进场动画：{ enabled, duration（ms，默认 600）, easing }', type: 'object', default: '—' },
  { name: 'camera', desc: '轨道相机：{ yaw, pitch, distance, fov, target, minPitch, maxPitch, minDistance, maxDistance, autoRotate, autoRotateSpeed, damping }，详见[相机与交互](/3d/camera)', type: 'object', default: '—' },
  { name: 'lighting', desc: '光照：{ ambient（默认 0.56）, intensity（默认 0.88）, follow（默认 true 随相机）, direction（固定世界方向 [x,y,z]）, flat（关闭着色） }', type: 'object', default: '—' },
  { name: 'depth', desc: '纵深增强（0 即关闭）：{ haze（远景向背景色雾化，默认 0.3）, edge（实体面描边，默认 0.06）, gradient（面内渐变假 AO，默认 0.08） }', type: 'object', default: '{ haze: 0.3, edge: 0.06, gradient: 0.08 }' },
  { name: 'interaction', desc: '交互开关：{ zoom, pan, resetOnDblClick }', type: 'object', default: '—' },
  { name: 'xAxis / yAxis / zAxis', desc: '轴配置：{ show, name, labels, grid, line, title, type（category / value）, min, max, ticks, formatter }', type: 'object', default: '—' },
  { name: 'grid', desc: '网格：{ show }', type: 'object', default: '{ show: true }' },
  { name: 'box', desc: '三维坐标框：{ show, walls（back / side / all / none）, frame }', type: 'object', default: '{ walls: 「back」 }' },
  { name: 'theme', desc: '主题覆写（colors、gridColor、textColor 等），暗色模式自动切换', type: 'object', default: '—' },
  { name: 'palette', desc: '内置色系一键固定（classic / aurora / sunset / morandi / forest / ink / candy），与 Evoke Charts 同 id 同色值；生效后不读系列色令牌。详见[主题接入](/3d/theme)', type: 'string', default: '—' },
  { name: 'ariaLabel', desc: '无障碍标签（默认 3d-{type}-{title}）', type: 'string', default: '—' },
  { name: 'lang / i18n', desc: '界面语言 zh / en 与词条覆写', type: 'string / object', default: 'zh' },
]" />

## 按图型数据字段

<ApiTable title="按图型数据字段" :rows="[
  { name: 'pieData', desc: 'pie3d 数据源，每项 { name, value, color? }', type: 'array', default: '—' },
  { name: 'scatterData', desc: 'scatter3d 三元组模式数据：[x, y, z] 数组的数组；缺省时回落 labels + series 标量模式', type: 'array', default: '—' },
  { name: 'surfaceData', desc: 'surface3d 数据：{ x, y, z }，z 为行=y、列=x 的数值矩阵', type: 'object', default: '—' },
  { name: 'bar', desc: '柱体样式：{ width, depth（占带位比例，默认 0.62）, shadow（默认开）, shadowStrength（投影深浅，默认 0.1）, shadowOffset（[dx, dy] 世界偏移） }', type: 'object', default: '—' },
  { name: 'line', desc: '折线样式：{ area（落地面带）, dropLines（落地投影线，默认开）, width, points, pointRadius }', type: 'object', default: '—' },
  { name: 'scatter', desc: '散点样式：{ size（默认 5）, dropLines, colorScale（true 或色带 id）, depthScale（按视深缩点，默认开） }', type: 'object', default: '—' },
  { name: 'surface', desc: '曲面样式：{ wireframe（默认开）, opacity, ramp（色带 id，默认随 palette） }', type: 'object', default: '—' },
  { name: 'pie', desc: '饼样式：{ radius（默认 0.42）, innerRadius（大于 0 即环形）, thickness（默认 0.18）, startAngle, padAngle, shadow, shadowStrength（盘底投影深浅，默认 0.09） }', type: 'object', default: '—' },
  { name: 'label', desc: 'pie3d 外部标签：{ show }，显示名称与占比', type: 'object', default: '{ show: false }' },
]" />

## 实例方法（ref）

<ApiTable title="实例方法" :rows="[
  { name: 'refresh() / resize()', desc: '立即重绘 / 重算尺寸后重绘', type: 'function', default: '—' },
  { name: 'update(newOptions)', desc: '整体替换 options 并重放进场动画', type: 'function', default: '—' },
  { name: 'getCamera() / setCamera(next) / resetCamera()', desc: '读取、写入、复位相机（写入自动重绘并触发 camera-change）', type: 'function', default: '—' },
  { name: 'toggleSeries(name)', desc: '切换系列显隐（等价图例点选）', type: 'function', default: '—' },
  { name: 'getHiddenSeries()', desc: '当前被隐藏的系列名集合', type: 'function', default: '—' },
  { name: 'toDataURL(type, quality)', desc: '导出 PNG 位图', type: 'function', default: '—' },
  { name: 'exportSVG(options)', desc: '按绘制指令录制 SVG 真矢量导出，传 { ctx, toSvg } 注入录制器', type: 'function', default: '—' },
  { name: 'getProjected()', desc: '最近一帧投影结果（调试用）', type: 'function', default: '—' },
  { name: 'destroy()', desc: '销毁实例、解绑监听', type: 'function', default: '—' },
]" />

## Composable 与底层管线

```js
import {
  useChart3d,        // 相机快捷操作 / 实例方法收拢
  render3d,          // 无头渲染一帧（自定义宿主场景）
  projectScene,      // 场景投影（返回屏幕坐标与视深）
  pickScene,         // 屏幕坐标拾取
  createSvgRecorder, // SVG 录制器
  resolveCamera,     // 相机配置解析与钳制
  validateOptions3d, // 配置校验（返回 { ok, warnings }）
} from '@wil-works/evoke-charts/3d'
```

`validateOptions3d` 只告警不阻断，开发期组件会自动把警告打印到控制台。
