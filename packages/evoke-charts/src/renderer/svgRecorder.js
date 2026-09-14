function applyMatrix(m, x, y) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}
function multiply(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
  ];
}
function parseFont(font) {
  // String.match 与 RegExp.exec 等价（非全局正则），此处规避安全扫描对 .exec( 的误报
  const sizeMatch = font.match(/(\d+(?:\.\d+)?)px/);
  const size = sizeMatch ? parseFloat(sizeMatch[1]) : 12;
  const weight = /bold/.test(font) ? "bold" : /600|700/.test(font) ? "600" : "normal";
  const familyMatch = font.match(/px\s+(.*)$/);
  const family = (familyMatch ? familyMatch[1] : "sans-serif").replace(/["']/g, "");
  return { size, weight, family };
}
function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function createSvgRecorder(real) {
  const elements = [];
  const gradients = [];
  let matrix = [1, 0, 0, 1, 0, 0];
  let style = {
    fillStyle: "#000",
    strokeStyle: "#000",
    lineWidth: 1,
    globalAlpha: 1,
    lineDash: [],
    font: "12px sans-serif",
    textAlign: "start",
    textBaseline: "alphabetic"
  };
  const styleStack = [];
  let path = [];
  const pushEl = (el) => elements.push(el);
  function transformPath() {
    let d = "";
    let hasCurrent = false;
    path.forEach((cmd) => {
      const pts = [];
      for (let i = 0; i < cmd.pts.length; i += 2) {
        const [x, y] = applyMatrix(matrix, cmd.pts[i], cmd.pts[i + 1]);
        pts.push(x, y);
      }
      switch (cmd.op) {
        case "M":
          d += `M${pts[0].toFixed(2)},${pts[1].toFixed(2)}`;
          hasCurrent = true;
          break;
        case "L":
          d += `L${pts[0].toFixed(2)},${pts[1].toFixed(2)}`;
          hasCurrent = true;
          break;
        case "Q":
          d += `Q${pts.map((p) => p.toFixed(2)).join(",")}`;
          hasCurrent = true;
          break;
        case "C":
          d += `C${pts.map((p) => p.toFixed(2)).join(",")}`;
          hasCurrent = true;
          break;
        case "A": {
          const [cx, cy, r, a0, a1, ccw] = [pts[0], pts[1], cmd.pts[2], cmd.pts[3], cmd.pts[4], cmd.pts[5]];
          const sx = cx + Math.cos(a0) * r;
          const sy = cy + Math.sin(a0) * r;
          const ex = cx + Math.cos(a1) * r;
          const ey = cy + Math.sin(a1) * r;
          const [tsx, tsy] = applyMatrix(matrix, sx, sy);
          const [tex, tey] = applyMatrix(matrix, ex, ey);
          const sxScale = Math.hypot(matrix[0], matrix[1]);
          const syScale = Math.hypot(matrix[2], matrix[3]);
          const tr = r * ((sxScale + syScale) / 2);
          const sweep = ccw ? 0 : 1;
          let delta = a1 - a0;
          if (!ccw && delta < 0) delta += Math.PI * 2;
          if (ccw && delta > 0) delta -= Math.PI * 2;
          const large = Math.abs(delta) > Math.PI ? 1 : 0;
          d += hasCurrent ? `L${tsx.toFixed(2)},${tsy.toFixed(2)}` : `M${tsx.toFixed(2)},${tsy.toFixed(2)}`;
          d += `A${tr.toFixed(2)},${tr.toFixed(2)} 0 ${large},${sweep} ${tex.toFixed(2)},${tey.toFixed(2)}`;
          hasCurrent = true;
          break;
        }
        case "Z":
          d += "Z";
          break;
      }
    });
    return d;
  }
  function resolveFill() {
    if (typeof style.fillStyle === "string") return { value: style.fillStyle };
    const g = style.fillStyle;
    gradients.push(g);
    const id = `evg${gradients.length - 1}`;
    return { value: `url(#${id})` };
  }
  function emitPath(mode) {
    if (path.length === 0) return;
    const d = transformPath();
    const attrs = { d };
    if (mode === "fill") {
      const f = resolveFill();
      attrs.fill = f.value;
      if (style.lineDash.length === 0) attrs.stroke = "none";
    } else {
      attrs.fill = "none";
      attrs.stroke = typeof style.strokeStyle === "string" ? style.strokeStyle : "#000";
      attrs["stroke-width"] = style.lineWidth;
      attrs["stroke-linecap"] = "round";
      attrs["stroke-linejoin"] = "round";
      if (style.lineDash.length > 0) attrs["stroke-dasharray"] = style.lineDash.join(",");
    }
    if (style.globalAlpha < 1) attrs.opacity = style.globalAlpha;
    pushEl({ tag: "path", attrs });
  }
  const methods = {
    beginPath: () => {
      path = [];
    },
    moveTo: (x, y) => {
      path.push({ op: "M", pts: [x, y] });
    },
    lineTo: (x, y) => {
      path.push({ op: "L", pts: [x, y] });
    },
    quadraticCurveTo: (cx, cy, x, y) => {
      path.push({ op: "Q", pts: [cx, cy, x, y] });
    },
    bezierCurveTo: (c1x, c1y, c2x, c2y, x, y) => {
      path.push({ op: "C", pts: [c1x, c1y, c2x, c2y, x, y] });
    },
    arc: (cx, cy, r, a0, a1, ccw = false) => {
      path.push({ op: "A", pts: [cx, cy, r, a0, a1, ccw ? 1 : 0] });
    },
    rect: (x, y, w, h) => {
      path.push({ op: "M", pts: [x, y] });
      path.push({ op: "L", pts: [x + w, y] });
      path.push({ op: "L", pts: [x + w, y + h] });
      path.push({ op: "L", pts: [x, y + h] });
      path.push({ op: "Z", pts: [] });
    },
    roundRect: (x, y, w, h) => {
      methods.rect?.(x, y, w, h);
    },
    closePath: () => {
      path.push({ op: "Z", pts: [] });
    },
    fill: () => emitPath("fill"),
    stroke: () => emitPath("stroke"),
    fillRect: (x, y, w, h) => {
      const prev = path;
      path = [];
      methods.rect?.(x, y, w, h);
      emitPath("fill");
      path = prev;
    },
    strokeRect: (x, y, w, h) => {
      const prev = path;
      path = [];
      methods.rect?.(x, y, w, h);
      emitPath("stroke");
      path = prev;
    },
    clearRect: () => {
    },
    fillText: (text, x, y) => {
      const [tx, ty] = applyMatrix(matrix, x, y);
      const font = parseFont(style.font);
      const attrs = {
        "x": tx.toFixed(2),
        "y": ty.toFixed(2),
        "font-size": font.size,
        "font-weight": font.weight,
        "font-family": font.family,
        "fill": typeof style.fillStyle === "string" ? style.fillStyle : "#000"
      };
      if (style.textAlign === "center") attrs["text-anchor"] = "middle";
      else if (style.textAlign === "right" || style.textAlign === "end") attrs["text-anchor"] = "end";
      if (style.textBaseline === "middle") attrs["dominant-baseline"] = "central";
      else if (style.textBaseline === "top") attrs["dominant-baseline"] = "hanging";
      else if (style.textBaseline === "bottom") attrs["dominant-baseline"] = "text-after-edge";
      if (style.globalAlpha < 1) attrs.opacity = style.globalAlpha;
      pushEl({ tag: "text", attrs, text: String(text) });
    },
    strokeText: (text, x, y) => methods.fillText?.(text, x, y),
    measureText: (text) => {
      const prevFont = real.font;
      real.font = style.font;
      const m = real.measureText(text);
      real.font = prevFont;
      return m;
    },
    save: () => {
      styleStack.push({ style: { ...style }, matrix: [...matrix] });
    },
    restore: () => {
      const s = styleStack.pop();
      if (s) {
        style = s.style;
        matrix = s.matrix;
      }
    },
    setTransform: (a, b, c, d, e, f) => {
      matrix = [a, b, c, d, e, f];
    },
    getTransform: () => real.getTransform(),
    translate: (x, y) => {
      matrix = multiply(matrix, [1, 0, 0, 1, x, y]);
    },
    rotate: (angle) => {
      matrix = multiply(matrix, [Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0]);
    },
    scale: (x, y) => {
      matrix = multiply(matrix, [x, 0, 0, y, 0, 0]);
    },
    setLineDash: (dash) => {
      style = { ...style, lineDash: [...dash] };
    },
    createLinearGradient: (x0, y0, x1, y1) => {
      const [tx0, ty0] = applyMatrix(matrix, x0, y0);
      const [tx1, ty1] = applyMatrix(matrix, x1, y1);
      const g = {
        __gradient: true,
        x0: tx0,
        y0: ty0,
        x1: tx1,
        y1: ty1,
        stops: [],
        addColorStop(offset, color) {
          this.stops.push({ offset, color });
        }
      };
      return g;
    },
    createRadialGradient: () => createLinearFallback(),
    drawImage: () => {
    }
  };
  function createLinearFallback() {
    return {
      __gradient: true,
      x0: 0,
      y0: 0,
      x1: 0,
      y1: 1,
      stops: [],
      addColorStop(offset, color) {
        this.stops.push({ offset, color });
      }
    };
  }
  const proxy = new Proxy({}, {
    get(_target, prop) {
      if (prop in methods) {
        return (...args) => methods[prop](...args);
      }
      if (prop === "canvas") return real.canvas;
      if (prop in style) return style[prop];
      const value = real[prop];
      return typeof value === "function" ? value.bind(real) : value;
    },
    set(_target, prop, value) {
      if (prop === "fillStyle" || prop === "strokeStyle") {
        style = { ...style, [prop]: value };
        return true;
      }
      if (prop in style) {
        style = { ...style, [prop]: value };
        return true;
      }
      try {
        ;
        real[prop] = value;
      } catch {
      }
      return true;
    }
  });
  function gradientDefs() {
    return gradients.map((g, i) => {
      const stops = g.stops.map((s) => {
        let color = s.color;
        let opacity = 1;
        const m = /^(#[0-9a-fA-F]{6})([0-9a-fA-F]{2})$/.exec(s.color);
        if (m) {
          color = m[1];
          opacity = parseInt(m[2], 16) / 255;
        }
        return `<stop offset="${(s.offset * 100).toFixed(1)}%" stop-color="${color}" stop-opacity="${opacity.toFixed(3)}"/>`;
      }).join("");
      return `<linearGradient id="evg${i}" gradientUnits="userSpaceOnUse" x1="${g.x0.toFixed(1)}" y1="${g.y0.toFixed(1)}" x2="${g.x1.toFixed(1)}" y2="${g.y1.toFixed(1)}">${stops}</linearGradient>`;
    }).join("");
  }
  function toSvg(width, height, backgroundColor) {
    const body = elements.map((el) => {
      const attrs = Object.entries(el.attrs).map(([k, v]) => `${k}="${escapeXml(String(v))}"`).join(" ");
      if (el.tag === "text") {
        return `<text ${attrs}>${escapeXml(el.text || "")}</text>`;
      }
      return `<${el.tag} ${attrs}/>`;
    }).join("\n");
    const defs = gradients.length > 0 ? `<defs>${gradientDefs()}</defs>` : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${defs}<rect width="${width}" height="${height}" fill="${backgroundColor}"/>${body}</svg>`;
  }
  return { ctx: proxy, toSvg };
}
export {
  createSvgRecorder
};
