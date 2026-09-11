import { ref, computed, provide, inject } from "vue";
const USE_CHART_KEY = /* @__PURE__ */ Symbol("ev-chart-context");
function useChart(useChartOptions = {}) {
  const {
    options: initialOptions = {},
    width = "100%",
    height = 400,
    responsive = true,
    devicePixelRatio
  } = useChartOptions;
  const options = ref(initialOptions);
  const chartRef = ref();
  const chartProps = computed(() => {
    return {
      options: options.value,
      width,
      height,
      responsive,
      devicePixelRatio
    };
  });
  function resize() {
    chartRef.value?.resize();
  }
  function highlightSeries(name) {
    chartRef.value?.highlightSeries(name);
  }
  function clearHighlight() {
    chartRef.value?.clearHighlight();
  }
  function exportPNG(filename = "chart.png") {
    const canvas = chartRef.value?.getCanvas();
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    link.click();
  }
  function setTheme(theme) {
    chartRef.value?.setTheme(theme);
  }
  function getOption() {
    return chartRef.value?.getOption();
  }
  function destroy() {
    chartRef.value?.destroy();
  }
  return {
    options,
    chartProps,
    chartRef,
    resize,
    highlightSeries,
    clearHighlight,
    exportPNG,
    setTheme,
    getOption,
    destroy
  };
}
function provideChartContext(instance) {
  provide(USE_CHART_KEY, instance);
}
function injectChartContext() {
  return inject(USE_CHART_KEY, null);
}
export {
  injectChartContext,
  provideChartContext,
  useChart
};
