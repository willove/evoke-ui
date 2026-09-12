// ─── 内置色系注册表（DESIGN.md §2.1「内置色系」的实现事实源）───
// options.palette 填 id 即整图固定该色系：系列色不再读取 --ev-color-* 令牌，
// 宿主换主色 / 换肤不影响；明暗两套随暗色模式内建换挡。
// 验收（与 2.1 缺省色板同规）：取色顺序相邻色相差 ≥ 30°（S < 20% 灰调槽豁免），
// 暗色板同色相提亮。

export const CHART_PALETTES = [
  {
    id: "classic",
    name: "经典",
    scene: "当前缺省色板的固化版，品牌蓝锚定；想保住默认观感不随换肤时用",
    light: ["#175DFF", "#5AD8A6", "#F6BD16", "#6DC8EC", "#E8684A", "#9270CA", "#FF9D4D", "#5D7092"],
    dark: ["#4d8bff", "#5ad8a6", "#f6bd16", "#6dc8ec", "#f08568", "#a585e8", "#ff9d4d", "#8da3bf"],
  },
  {
    id: "aurora",
    name: "极光",
    scene: "科技 SaaS / 数据产品——冷调现代，蓝绿紫主打的仪表盘观感",
    light: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316", "#64748B"],
    dark: ["#60A5FA", "#34D399", "#FBBF24", "#A78BFA", "#F472B6", "#22D3EE", "#FB923C", "#94A3B8"],
  },
  {
    id: "sunset",
    name: "落日",
    scene: "消费零售 / 生活方式 / 营销复盘——暖橙珊瑚主导，热情有温度",
    light: ["#F97316", "#E11D48", "#EAB308", "#14B8A6", "#8B5CF6", "#FB7185", "#0EA5E9", "#A8A29E"],
    dark: ["#FB923C", "#FB7185", "#FACC15", "#2DD4BF", "#A78BFA", "#FDA4AF", "#38BDF8", "#BDB4AC"],
  },
  {
    id: "morandi",
    name: "莫兰迪",
    scene: "人文 / 咨询报告 / 印刷排版——低饱和灰调，长文配图不抢字",
    light: ["#A3AEBB", "#C2A878", "#B08890", "#86A69D", "#9A8FA8", "#B7C4A0", "#C98F6B", "#8A8F98"],
    dark: ["#B4BEC9", "#D4BC8E", "#C29AA3", "#97B5AC", "#ACA2BC", "#C5D0AF", "#D8A685", "#9CA1A9"],
  },
  {
    id: "forest",
    name: "林间",
    scene: "健康 / 环保 / 农业供应链——自然绿主导，ESG 与可持续叙事",
    light: ["#16A34A", "#0EA5E9", "#CA8A04", "#7C3AED", "#DC2626", "#0D9488", "#D97706", "#64748B"],
    dark: ["#22C55E", "#38BDF8", "#EAB308", "#8B5CF6", "#EF4444", "#14B8A6", "#F59E0B", "#94A3B8"],
  },
  {
    id: "ink",
    name: "墨蓝",
    scene: "金融 / 政企 / 严肃年报——克制深稳，深蓝为骨、暖色点缀",
    light: ["#1E40AF", "#0F766E", "#B45309", "#6D28D9", "#BE123C", "#0369A1", "#4D7C0F", "#6B7280"],
    dark: ["#6E9BF7", "#2DD4BF", "#D97706", "#8B5CF6", "#FB7185", "#38BDF8", "#84CC16", "#9CA3AF"],
  },
  {
    id: "candy",
    name: "糖果",
    scene: "营销活动 / 年轻品牌 / 大屏展示——高饱和明快，视觉抓人",
    light: ["#EC4899", "#8B5CF6", "#F59E0B", "#22C55E", "#06B6D4", "#EF4444", "#6366F1", "#9CA3AF"],
    dark: ["#F472B6", "#A78BFA", "#FBBF24", "#4ADE80", "#22D3EE", "#F87171", "#818CF8", "#A1A1AA"],
  },
];

/** 按 id 取色系在指定明暗模式下的 8 槽色值；未知 id 返回 null */
export function resolveChartPalette(id, isDark) {
  const palette = CHART_PALETTES.find((p) => p.id === id);
  if (!palette) return null;
  return (isDark ? palette.dark : palette.light).slice(0, 8);
}
