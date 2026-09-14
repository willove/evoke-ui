// Math.min/max 一旦展开大数组（约 10 万点以上）会触发 RangeError：
// Maximum call stack size exceeded。这里用循环归约替代展开，语义与
// Math.min/max 保持一致——包括任一参数为 NaN 时结果为 NaN、无参时为 Infinity/-Infinity。
function minOf(values, ...extras) {
  let min = Infinity;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (Number.isNaN(v)) return NaN;
    if (v < min) min = v;
  }
  for (let i = 0; i < extras.length; i++) {
    const v = extras[i];
    if (Number.isNaN(v)) return NaN;
    if (v < min) min = v;
  }
  return min;
}
function maxOf(values, ...extras) {
  let max = -Infinity;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (Number.isNaN(v)) return NaN;
    if (v > max) max = v;
  }
  for (let i = 0; i < extras.length; i++) {
    const v = extras[i];
    if (Number.isNaN(v)) return NaN;
    if (v > max) max = v;
  }
  return max;
}
export {
  maxOf,
  minOf
};
