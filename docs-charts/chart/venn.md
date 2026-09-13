# 韦恩图 venn

集合关系的**一张图读法**：圆的面积即集合规模，重叠区即交集。用户群体重叠分析、能力圈交叉、会员权益交叠这类「两者之间有多少重合」的首选。

## 何时使用

- 2–3 个集合，关心**集合规模**与**两两重叠规模**；
- 重叠是叙事重点（「重叠人群是下一个运营抓手」）；
- 集合超过 3 个时韦恩图不可读，改用[桑基图](/chart/sankey)看流转或分组柱状图看对比。

## 示例

专属数据字段 `vennData`：单集合行 `{ name, value }`，交集行 `{ sets: ['A', 'B'], value }`。圆半径按 √值等面积映射，圆距按交集值反解。

### 用户群体重叠分析

运营的经典一问：会员、社群、小程序三个用户池，彼此重合多少？交集区悬浮同时强调两圆并给出交集人数——「重叠 8 万」就是一次跨池运营的抓手。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'venn',
      title: '用户池重叠（万人）',
      vennData: [
        { name: '会员', value: 86 },
        { name: '社群', value: 62 },
        { sets: ['会员', '社群'], value: 28 },
      ],
    }"
    :height="320"
  />
</DemoBlock>

### 三池交叉

三集合形态：两两交集值显式给出，圆心距自动按重叠量收敛；空心形态（`vennHollow: true`）只描边不填充，重叠关系靠描边交叉读，适合叠在报告底色上。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'venn',
      title: '渠道用户资产交叉（空心形态）',
      vennHollow: true,
      vennData: [
        { name: 'App', value: 120 },
        { name: '小程序', value: 96 },
        { name: '官网', value: 54 },
        { sets: ['App', '小程序'], value: 45 },
        { sets: ['App', '官网'], value: 22 },
        { sets: ['小程序', '官网'], value: 16 },
      ],
    }"
    :height="360"
  />
</DemoBlock>

## 配置要点

- 交集行不传 `value` 时圆距按无交集摆放（相切分离）；
- `vennHollow: true` 切空心形态：2px 描边、不填充，悬浮整圆强调；
- 图例点选圆即隐去该集合，交集区随之不可命中；
- 悬浮交集区：两圆同时保持强调、其余淡出，tooltip 显示交集值。

## 相关

- [桑基图](/chart/sankey) · [饼图](/chart/pie)
- [API 参考](/chart/api)
