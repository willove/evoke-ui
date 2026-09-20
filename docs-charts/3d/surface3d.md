# 三维曲面图 surface3d

z = f(x, y) 的高度场：矩阵进、波面出。颜色按高度走连续色带，线框给出网格密度参照；
面片双面可见，转到下方看不会消失。

## 何时使用

- 有规则网格采样的二元函数或物理场（地形、温度场、概率密度）；
- 想同时表达「形状」与「数值」（色带）；
- 无序散点想看趋势面时，先做插值再进曲面。

## 示例

经典 sinc 波面，默认线框与色带：

<DemoBlock>
  <ev-chart3d
    :options="surfaceOptions"
    :height="380"
  />
</DemoBlock>

纯填充形态（关线框、半透明，突出色带层次）：

<DemoBlock>
  <ev-chart3d
    :options="rippleOptions"
    :height="380"
  />
</DemoBlock>

## 配置要点

- `surfaceData`：`{ x, y, z }`，`z` 为数值矩阵（行对应 y、列对应 x）；行列不必等长；
- `surface.wireframe`（默认开）：白色细线框，旋转到暗色主题自动换深色；
- `surface.opacity`：面片透明度，需要透视下层时降到 0.6 左右；
- `surface.ramp`：色带 id（classic / aurora / sunset / viridis / heat / mono），缺省随 `palette`；
- 矩阵过大时自动按 48×48 面片上限抽稀，首末行列保留。

## 相关

- 色带体系：[主题接入](/3d/theme)
- 散点形态：[三维散点图](/3d/scatter3d)
- 字段细节：[API 参考](/3d/api)

<script setup>
const grid = (n) => Array.from({ length: n }, (_, i) => Math.round((-3 + (6 * i) / (n - 1)) * 100) / 100)
const xs = grid(42)
const ys = grid(42)
const sinc = xs.map((x) => ys.map((y) => {
  const r = Math.sqrt(x * x + y * y) || 0.15
  return Math.round((Math.sin(r * 2) / (r * 0.55)) * 100) / 100
}))
const ripple = xs.map((x) => ys.map((y) => {
  const r = Math.sqrt(x * x + y * y)
  return Math.round((Math.cos(r * 1.6) * Math.exp(-r * 0.32) * 3.2) * 100) / 100
}))

const surfaceOptions = {
  type: 'surface3d',
  title: { text: '波面 z = sin(r)/r', subtitle: '高度场 · 连续色带 · 可拖拽旋转' },
  surfaceData: { x: xs, y: ys, z: sinc },
  surface: { wireframe: true, ramp: 'classic' },
  zAxis: { name: '幅值' },
}

const rippleOptions = {
  type: 'surface3d',
  title: '涟漪衰减面',
  surfaceData: { x: xs, y: ys, z: ripple },
  surface: { wireframe: false, opacity: 0.92, ramp: 'aurora' },
  zAxis: { name: '幅值' },
}
</script>
