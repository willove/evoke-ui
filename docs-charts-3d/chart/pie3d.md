# 三维饼图 / 环形图 pie3d

平放在地面上的厚片圆盘：顶面着色、外圈挤出厚度，悬浮扇区整体上浮做强调。
`innerRadius > 0` 即环形。

## 何时使用

- 占比构成要立体感与厚度的汇报、大屏场景；
- 悬浮强调希望「动一下」而不是变色；
- 常规数据分析建议用[二维饼图](https://evoke-charts.wil-works.com/chart/pie)——面积对比更准，也更好贴标签。

## 示例

基础三维饼：

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
      pie: { thickness: 0.2, padAngle: 0.02 }
    }"
    :height="340"
  />
</DemoBlock>

环形（中空）+ 指定起始角：

<DemoBlock>
  <ev-chart3d
    :options="{
      type: 'pie3d',
      title: '库存构成',
      pieData: [
        { name: '原料', value: 35 },
        { name: '在制', value: 25 },
        { name: '成品', value: 30 },
        { name: '报废', value: 10 }
      ],
      pie: { innerRadius: 0.16, thickness: 0.16, startAngle: -90 }
    }"
    :height="340"
  />
</DemoBlock>

## 配置要点

- `pie.thickness`：厚度（世界单位，默认 0.18），太厚会遮住后方扇区；
- `pie.innerRadius`：中空半径，大于 0 即环形，上限为外径的 82%；
- `pie.startAngle`：起始角（度，-90 即 12 点方向）；
- `pie.padAngle`：扇区隙角（度），默认约 0.6°，扇区之间留一线缝；
- 悬浮扇区整体上浮是内建行为，不需要配置；tooltip 展示数值与占比。

## 相关

- 相机与自动旋转：[相机与交互](/guide/camera)
- 字段细节：[API 参考](/chart/api)
