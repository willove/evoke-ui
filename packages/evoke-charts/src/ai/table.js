// ─── 数据表解析与列推断 ───
// AI 生成引擎的地基：把 CSV/TSV 文本、对象数组、二维数组归一成
// { headers, rows }，并推断每列是时间 / 数值 / 类目。零依赖纯函数。

const NUM_CLEAN = /[,\s_]/g;

// 宽松数值解析：容忍千分位、货币符号、百分号、万/亿/K 后缀、会计括号负数
export function parseNumeric(raw) {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  let s = raw.trim();
  if (!s) return null;
  let sign = 1;
  if (/^\(.*\)$/.test(s)) {
    sign = -1;
    s = s.slice(1, -1);
  }
  s = s.replace(NUM_CLEAN, "").replace(/^[￥$€£]/, "").replace(/[￥$€£]$/, "");
  let mult = 1;
  if (/亿$/.test(s)) {
    mult = 1e8;
    s = s.slice(0, -1);
  } else if (/万$/.test(s)) {
    mult = 1e4;
    s = s.slice(0, -1);
  } else if (/[Kk]$/.test(s)) {
    mult = 1e3;
    s = s.slice(0, -1);
  }
  if (/%$/.test(s)) s = s.slice(0, -1);
  if (!/^[-+]?\d+(\.\d+)?$/.test(s)) return null;
  return sign * parseFloat(s) * mult;
}

// 时间样貌识别：2024-01 / 2024/1 / 2024年1月（可带日）、ISO 日期、HH:mm
export function looksLikeTime(v) {
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (/^\d{4}[-/年.]\d{1,2}月?(?:[-/.]\d{1,2}日?)?$/.test(s)) return true;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return true;
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) return true;
  return false;
}

function splitLine(line, delim) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delim && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function pickDelimiter(line) {
  const candidates = ["\t", ";", ",", "，"];
  let best = ",";
  let bestCount = 0;
  candidates.forEach((d) => {
    const n = splitLine(line, d).length;
    if (n > bestCount) {
      bestCount = n;
      best = d;
    }
  });
  return best;
}

function rowToObj(headers, row) {
  const obj = {};
  headers.forEach((h, i) => {
    obj[h] = row[i] === undefined ? null : row[i];
  });
  return obj;
}

// 归一为 { headers, rows }；无法识别返回 null
export function parseDataTable(input) {
  if (Array.isArray(input)) {
    if (input.length === 0) return null;
    const first = input[0];
    if (first !== null && typeof first === "object" && !Array.isArray(first)) {
      const headers = [];
      input.forEach((row) => {
        Object.keys(row).forEach((k) => {
          if (!headers.includes(k)) headers.push(k);
        });
      });
      return { headers, rows: input };
    }
    if (Array.isArray(first)) {
      if (input.length < 1) return null;
      const width = input.reduce((m, r) => Math.max(m, r.length), 0);
      if (width < 2) return null;
      const head = input[0].map((v) => (v === null || v === undefined ? "" : String(v).trim()));
      const numericHead = head.filter((v) => parseNumeric(v) !== null).length;
      if (numericHead === 0) {
        return { headers: head, rows: input.slice(1).map((r) => rowToObj(head, r)) };
      }
      const headers = Array.from({ length: width }, (_, i) => `列${i + 1}`);
      return { headers, rows: input.map((r) => rowToObj(headers, r)) };
    }
    return null;
  }
  if (typeof input === "string") {
    const lines = input.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return null;
    const delim = pickDelimiter(lines[0]);
    const grid = lines.map((l) => splitLine(l, delim));
    const head = grid[0];
    const numericHead = head.filter((v) => parseNumeric(v) !== null).length;
    if (numericHead === 0 && head.length >= 2) {
      return { headers: head, rows: grid.slice(1).map((r) => rowToObj(head, r)) };
    }
    const width = grid.reduce((m, r) => Math.max(m, r.length), 0);
    const headers = Array.from({ length: width }, (_, i) => `列${i + 1}`);
    return { headers, rows: grid.map((r) => rowToObj(headers, r)) };
  }
  return null;
}

// 逐列推断：number（≥60% 可解析数值）/ time（≥60% 命中时间样貌）/ category
export function inferColumns(table) {
  const { headers, rows } = table;
  return headers.map((name) => {
    const values = rows.map((r) => (r[name] === undefined ? null : r[name]));
    const present = values.filter((v) => v !== null && v !== "").length;
    const numericHits = values.filter((v) => parseNumeric(v) !== null).length;
    if (present > 0 && numericHits / present >= 0.6) {
      return { name, type: "number", values: values.map((v) => parseNumeric(v)) };
    }
    const timeHits = values.filter((v) => looksLikeTime(v)).length;
    if (present > 0 && timeHits / present >= 0.6) {
      return { name, type: "time", values };
    }
    return { name, type: "category", values };
  });
}

export function distinctCount(values) {
  return new Set(values.filter((v) => v !== null && v !== "")).size;
}
