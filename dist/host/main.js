// src/host/main.ts
import { createHash as createHash2 } from "node:crypto";
import { watchFile, unwatchFile } from "node:fs";
import { appendFile, mkdir as mkdir2, readFile as readFile2, readdir as readdir2, rename, stat as stat2, unlink, writeFile as writeFile2 } from "node:fs/promises";
import { dirname, extname as extname2, join as join2, relative, resolve as resolve3, sep } from "node:path";

// src/shared/path/types.ts
var PathDataError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "PathDataError";
  }
};

// src/shared/path/parse.ts
var COMMAND_RE = /[MmZzLlHhVvCcSsQqTtAa]/;
var NUMBER_RE = /^[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/;
var ALLOWED_RE = /^[MmZzLlHhVvCcSsQqTtAa0-9eE+.,\-\s]*$/;
var ARITY = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  A: 7,
  Z: 0
};
function tokenize(data) {
  if (!ALLOWED_RE.test(data)) throw new PathDataError("path data contains unsupported characters");
  const tokens = [];
  let index = 0;
  while (index < data.length) {
    const char = data[index];
    if (char === " " || char === "\n" || char === "\r" || char === "	" || char === ",") {
      index += 1;
      continue;
    }
    if (COMMAND_RE.test(char)) {
      tokens.push({ command: char });
      index += 1;
      continue;
    }
    const rest = data.slice(index);
    const match = NUMBER_RE.exec(rest);
    if (!match) throw new PathDataError(`invalid path data near "${rest.slice(0, 12)}"`);
    const value = Number(match[0]);
    if (!Number.isFinite(value)) throw new PathDataError("path data contains a non-finite number");
    tokens.push({ value });
    index += match[0].length;
  }
  return tokens;
}
function parsePathData(data) {
  if (typeof data !== "string" || data.trim() === "") throw new PathDataError("path d must be a non-empty string");
  if (data.length > 1e5) throw new PathDataError("path d exceeds 100000 characters");
  const tokens = tokenize(data);
  if (!tokens.length) throw new PathDataError("path d is empty");
  let index = 0;
  let command = "";
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  let lastControlX = null;
  let lastControlY = null;
  let boundsMinX = Infinity;
  let boundsMinY = Infinity;
  let boundsMaxX = -Infinity;
  let boundsMaxY = -Infinity;
  let commands = 0;
  const include = (x, y) => {
    boundsMinX = Math.min(boundsMinX, x);
    boundsMinY = Math.min(boundsMinY, y);
    boundsMaxX = Math.max(boundsMaxX, x);
    boundsMaxY = Math.max(boundsMaxY, y);
  };
  include(0, 0);
  const number = () => {
    const token = tokens[index];
    if (!token || token.value === void 0) throw new PathDataError(`path command ${command} is missing parameters`);
    index += 1;
    return token.value;
  };
  while (index < tokens.length) {
    const token = tokens[index];
    if (token.command) {
      command = token.command;
      index += 1;
    } else if (!command) {
      throw new PathDataError("path data must begin with a command");
    }
    const upper = command.toUpperCase();
    const relative2 = command !== upper;
    const arity = ARITY[upper];
    if (arity === void 0) throw new PathDataError(`unsupported path command ${command}`);
    if (arity === 0) {
      currentX = startX;
      currentY = startY;
      lastControlX = null;
      lastControlY = null;
      commands += 1;
      continue;
    }
    if (tokens[index]?.command) throw new PathDataError(`path command ${command} is missing parameters`);
    commands += 1;
    const first = number();
    const x = relative2 ? currentX + first : first;
    if (upper === "H") {
      currentX = x;
      include(currentX, currentY);
      lastControlX = null;
      lastControlY = null;
      continue;
    }
    if (upper === "V") {
      currentY = relative2 ? currentY + first : first;
      include(currentX, currentY);
      lastControlX = null;
      lastControlY = null;
      continue;
    }
    const y = relative2 ? currentY + number() : number();
    switch (upper) {
      case "M":
        currentX = x;
        currentY = y;
        startX = x;
        startY = y;
        include(x, y);
        lastControlX = null;
        lastControlY = null;
        command = relative2 ? "l" : "L";
        break;
      case "L":
        currentX = x;
        currentY = y;
        include(x, y);
        lastControlX = null;
        lastControlY = null;
        break;
      case "C": {
        const c1x = x;
        const c1y = y;
        const c2x = relative2 ? currentX + number() : number();
        const c2y = relative2 ? currentY + number() : number();
        const ex = relative2 ? currentX + number() : number();
        const ey = relative2 ? currentY + number() : number();
        include(c1x, c1y);
        include(c2x, c2y);
        include(ex, ey);
        currentX = ex;
        currentY = ey;
        lastControlX = c2x;
        lastControlY = c2y;
        break;
      }
      case "S": {
        const c2x = x;
        const c2y = y;
        const ex = relative2 ? currentX + number() : number();
        const ey = relative2 ? currentY + number() : number();
        include(c2x, c2y);
        include(ex, ey);
        currentX = ex;
        currentY = ey;
        lastControlX = c2x;
        lastControlY = c2y;
        break;
      }
      case "Q": {
        const qx = x;
        const qy = y;
        const ex = relative2 ? currentX + number() : number();
        const ey = relative2 ? currentY + number() : number();
        include(qx, qy);
        include(ex, ey);
        currentX = ex;
        currentY = ey;
        lastControlX = qx;
        lastControlY = qy;
        break;
      }
      case "T": {
        const qx = x;
        const qy = y;
        include(qx, qy);
        currentX = qx;
        currentY = qy;
        lastControlX = qx;
        lastControlY = qy;
        break;
      }
      case "A": {
        const rx = x;
        const ry = y;
        const rotation = number();
        const largeArc = number();
        const sweep = number();
        const ex = relative2 ? currentX + number() : number();
        const ey = relative2 ? currentY + number() : number();
        if (rx < 0 || ry < 0) throw new PathDataError("path arc radius must be non-negative");
        if (largeArc !== 0 && largeArc !== 1) throw new PathDataError("path arc large-arc flag must be 0 or 1");
        if (sweep !== 0 && sweep !== 1) throw new PathDataError("path arc sweep flag must be 0 or 1");
        void rotation;
        include(ex, ey);
        currentX = ex;
        currentY = ey;
        lastControlX = null;
        lastControlY = null;
        break;
      }
      default:
        throw new PathDataError(`unsupported path command ${command}`);
    }
    void lastControlX;
    void lastControlY;
  }
  if (commands === 0) throw new PathDataError("path d has no commands");
  if (!Number.isFinite(boundsMinX)) throw new PathDataError("path d has no finite bounds");
  return { bounds: { minX: boundsMinX, minY: boundsMinY, maxX: boundsMaxX, maxY: boundsMaxY }, commands };
}

// src/shared/format.ts
var FORMAT = "dsh.canvas";
var VERSION = 1;
var LIMITS = {
  nodes: 2e3,
  components: 200,
  styles: 500,
  comments: 1e3,
  fonts: 50,
  depth: 32,
  textLength: 1e4,
  docBytes: 8 * 1024 * 1024,
  imageBytes: 20 * 1024 * 1024,
  fontBytes: 10 * 1024 * 1024
};
var NODE_TYPES = ["frame", "group", "rect", "ellipse", "line", "text", "path", "instance"];
var FILL_TYPES = ["solid", "linear-gradient", "radial-gradient", "image"];
var EFFECT_TYPES = ["drop-shadow", "inner-shadow", "layer-blur", "background-blur"];
var STYLE_TYPES = ["fill", "text", "effect"];
var ALIGNMENTS = ["left", "center", "right", "justify"];
var VERTICAL_ALIGNMENTS = ["top", "center", "bottom"];
var LAYOUT_DIRECTIONS = ["horizontal", "vertical"];
var LAYOUT_PRIMARY = ["start", "center", "end", "space-between"];
var LAYOUT_COUNTER = ["start", "center", "end", "stretch"];
var SIZINGS = ["fixed", "hug", "fill"];
var IMAGE_FITS = ["cover", "contain", "fill"];
var PATH_FILL_RULES = ["nonzero", "evenodd"];
var FONT_STYLES = ["normal", "italic"];
var COMMENT_AUTHORS = ["user", "ai"];
var ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
var SLUG_RE = /^[a-z0-9][a-z0-9-_]{0,63}$/;
var ASSET_RE = /^assets\/[A-Za-z0-9._-]{1,120}$/;
var FONT_ASSET_RE = /^fonts\/[A-Za-z0-9._-]{1,120}$/;
var COLOR_RE = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
var CanvasError = class extends Error {
  /** @param {string} path @param {string} message @param {string} [code] */
  constructor(path, message, code = "invalid-document") {
    super(`${path}: ${message}`);
    this.name = "CanvasError";
    this.path = path;
    this.code = code;
  }
};
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function clone(value) {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
    }
  }
  return JSON.parse(JSON.stringify(value));
}
function finite(value, path, opts = {}) {
  const { min = -1e6, max = 1e6, int = false } = opts;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new CanvasError(path, "expected a finite number");
  }
  if (int && Math.round(value) !== value) throw new CanvasError(path, "expected an integer");
  if (value < min || value > max) throw new CanvasError(path, `expected a number in [${min}, ${max}]`);
  return value;
}
function unit(value, path) {
  return finite(value, path, { min: 0, max: 1, int: false });
}
function color(value, path) {
  if (typeof value !== "string" || !COLOR_RE.test(value)) {
    throw new CanvasError(path, "expected a color like #RRGGBB or #RRGGBBAA");
  }
  return value.toUpperCase();
}
function id(value, path) {
  if (typeof value !== "string" || !ID_RE.test(value)) {
    throw new CanvasError(path, "expected an id matching ^[A-Za-z0-9_-]{1,64}$");
  }
  return value;
}
function oneOf(value, path, allowed) {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new CanvasError(path, `expected one of ${allowed.map((x) => JSON.stringify(x)).join(", ")}`);
  }
  return value;
}
var sequence = 0;
function newId(prefix = "n") {
  sequence = (sequence + 1) % 16777215;
  const random = Math.floor(Math.random() * 16777215).toString(36);
  return `${prefix}_${Date.now().toString(36)}${sequence.toString(36)}${random}`.slice(0, 64);
}
function isSlug(value) {
  return typeof value === "string" && SLUG_RE.test(value);
}
function isAssetPath(value) {
  return typeof value === "string" && ASSET_RE.test(value) && !value.includes("..");
}
function isFontAssetPath(value) {
  return typeof value === "string" && FONT_ASSET_RE.test(value) && !value.includes("..");
}
var nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
function emptyDoc(title = "\u4E3B\u753B\u5E03", docId = newId("doc")) {
  return {
    format: FORMAT,
    version: VERSION,
    id: docId,
    title,
    pages: [{ id: newId("page"), name: "Page 1", background: null, children: [] }],
    components: [],
    variantSets: [],
    styles: [],
    fonts: [],
    comments: [],
    meta: { createdAt: nowIso(), updatedAt: nowIso() }
  };
}
function normalizeFill(value, path) {
  if (!isPlainObject(value)) throw new CanvasError(path, "expected an object");
  const type2 = oneOf(value.type, `${path}.type`, FILL_TYPES);
  const fill = { ...value, type: type2 };
  if (type2 === "solid") {
    fill.color = color(value.color, `${path}.color`);
    fill.opacity = value.opacity == null ? 1 : unit(value.opacity, `${path}.opacity`);
    return fill;
  }
  if (type2 === "linear-gradient") {
    fill.angle = value.angle == null ? 180 : finite(value.angle, `${path}.angle`, { min: -3600, max: 3600 });
    fill.stops = normalizeStops(value.stops, `${path}.stops`);
    return fill;
  }
  if (type2 === "radial-gradient") {
    fill.center = {
      x: value.center?.x == null ? 0.5 : unit(value.center.x, `${path}.center.x`),
      y: value.center?.y == null ? 0.5 : unit(value.center.y, `${path}.center.y`)
    };
    fill.radius = value.radius == null ? 0.7 : unit(value.radius, `${path}.radius`);
    fill.stops = normalizeStops(value.stops, `${path}.stops`);
    return fill;
  }
  if (!isAssetPath(value.asset)) throw new CanvasError(`${path}.asset`, "expected assets/<file>");
  fill.asset = value.asset;
  fill.fit = value.fit == null ? "cover" : oneOf(value.fit, `${path}.fit`, IMAGE_FITS);
  if (value.crop != null) {
    if (!isPlainObject(value.crop)) throw new CanvasError(`${path}.crop`, "expected an object");
    const crop = {
      x: unit(value.crop.x ?? 0, `${path}.crop.x`),
      y: unit(value.crop.y ?? 0, `${path}.crop.y`),
      width: unit(value.crop.width ?? 1, `${path}.crop.width`),
      height: unit(value.crop.height ?? 1, `${path}.crop.height`)
    };
    if (crop.width <= 0 || crop.height <= 0) throw new CanvasError(`${path}.crop`, "crop size must be positive");
    if (crop.x + crop.width > 1.000001 || crop.y + crop.height > 1.000001) {
      throw new CanvasError(`${path}.crop`, "crop must stay inside the image");
    }
    fill.crop = crop;
  }
  return fill;
}
function normalizeStops(value, path) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 32) {
    throw new CanvasError(path, "expected 2-32 gradient stops");
  }
  return value.map((stop, index) => {
    if (!isPlainObject(stop)) throw new CanvasError(`${path}[${index}]`, "expected an object");
    return {
      position: unit(stop.position, `${path}[${index}].position`),
      color: color(stop.color, `${path}[${index}].color`)
    };
  });
}
function normalizeEffect(value, path) {
  if (!isPlainObject(value)) throw new CanvasError(path, "expected an object");
  const type2 = oneOf(value.type, `${path}.type`, EFFECT_TYPES);
  const effect = { ...value, type: type2, visible: value.visible !== false };
  if (type2 === "layer-blur" || type2 === "background-blur") {
    effect.radius = finite(value.radius ?? 4, `${path}.radius`, { min: 0, max: 200 });
    return effect;
  }
  effect.x = finite(value.x ?? 0, `${path}.x`, { min: -1e3, max: 1e3 });
  effect.y = finite(value.y ?? 0, `${path}.y`, { min: -1e3, max: 1e3 });
  effect.blur = finite(value.blur ?? 0, `${path}.blur`, { min: 0, max: 500 });
  effect.spread = finite(value.spread ?? 0, `${path}.spread`, { min: -500, max: 500 });
  effect.color = color(value.color ?? "#00000040", `${path}.color`);
  return effect;
}
function shortLabel(value, path) {
  if (typeof value !== "string" || !value.trim() || value.length > 64) {
    throw new CanvasError(path, "expected a non-empty label of at most 64 characters");
  }
  return value.trim();
}
function normalizeStrokes(value, path) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 8) throw new CanvasError(path, "expected at most 8 strokes");
  return value.map((stroke, index) => {
    if (!isPlainObject(stroke)) throw new CanvasError(`${path}[${index}]`, "expected an object");
    return {
      ...stroke,
      color: color(stroke.color ?? "#000000", `${path}[${index}].color`),
      width: finite(stroke.width ?? 1, `${path}[${index}].width`, { min: 0, max: 200 }),
      align: stroke.align == null ? "center" : oneOf(stroke.align, `${path}[${index}].align`, ["center", "inside", "outside"])
    };
  });
}
function normalizeSizing(value, path) {
  if (value == null) return void 0;
  if (!isPlainObject(value)) throw new CanvasError(path, "expected an object");
  return {
    h: oneOf(value.h ?? "fixed", `${path}.h`, SIZINGS),
    v: oneOf(value.v ?? "fixed", `${path}.v`, SIZINGS)
  };
}
function normalizeLayout(value, path) {
  if (value == null) return void 0;
  if (!isPlainObject(value)) throw new CanvasError(path, "expected an object");
  const padding = value.padding ?? {};
  return {
    ...value,
    direction: oneOf(value.direction ?? "vertical", `${path}.direction`, LAYOUT_DIRECTIONS),
    gap: finite(value.gap ?? 0, `${path}.gap`, { min: 0, max: 1e4 }),
    padding: {
      top: finite(padding.top ?? 0, `${path}.padding.top`, { min: 0, max: 1e4 }),
      right: finite(padding.right ?? 0, `${path}.padding.right`, { min: 0, max: 1e4 }),
      bottom: finite(padding.bottom ?? 0, `${path}.padding.bottom`, { min: 0, max: 1e4 }),
      left: finite(padding.left ?? 0, `${path}.padding.left`, { min: 0, max: 1e4 })
    },
    alignPrimary: oneOf(value.alignPrimary ?? "start", `${path}.alignPrimary`, LAYOUT_PRIMARY),
    alignCounter: oneOf(value.alignCounter ?? "start", `${path}.alignCounter`, LAYOUT_COUNTER)
  };
}
function normalizeFont(value, path) {
  const font = isPlainObject(value) ? value : {};
  return {
    ...font,
    family: typeof font.family === "string" && font.family.trim() ? font.family.trim().slice(0, 120) : "system-ui",
    weight: Math.round(finite(font.weight ?? 400, `${path}.weight`, { min: 100, max: 900 }) / 100) * 100,
    style: oneOf(font.style ?? "normal", `${path}.style`, FONT_STYLES),
    size: finite(font.size ?? 14, `${path}.size`, { min: 1, max: 1e3 }),
    lineHeight: finite(font.lineHeight ?? 1.4, `${path}.lineHeight`, { min: 0.5, max: 10 }),
    letterSpacing: finite(font.letterSpacing ?? 0, `${path}.letterSpacing`, { min: -50, max: 200 })
  };
}
function normalizeOverride(value, path) {
  if (!isPlainObject(value)) throw new CanvasError(path, "expected an object");
  const patch = { ...value };
  if ("text" in patch && (typeof patch.text !== "string" || patch.text.length > LIMITS.textLength)) {
    throw new CanvasError(`${path}.text`, "expected a short string");
  }
  if ("visible" in patch && typeof patch.visible !== "boolean") {
    throw new CanvasError(`${path}.visible`, "expected a boolean");
  }
  if ("fills" in patch) {
    if (!Array.isArray(patch.fills) || patch.fills.length > 8) throw new CanvasError(`${path}.fills`, "expected an array");
    patch.fills = patch.fills.map((fill, index) => normalizeFill(fill, `${path}.fills[${index}]`));
  }
  return patch;
}
function normalizeNode(raw, path, depth, state2) {
  if (depth > LIMITS.depth) throw new CanvasError(path, `node nesting exceeds ${LIMITS.depth}`);
  if (!isPlainObject(raw)) throw new CanvasError(path, "expected a node object");
  state2.count += 1;
  if (state2.count > LIMITS.nodes) throw new CanvasError(path, `document exceeds ${LIMITS.nodes} nodes`);
  const type2 = oneOf(raw.type, `${path}.type`, NODE_TYPES);
  const node = { ...raw, type: type2 };
  node.id = id(raw.id, `${path}.id`);
  if (state2.ids.has(node.id)) throw new CanvasError(`${path}.id`, `duplicate id "${node.id}"`);
  state2.ids.add(node.id);
  node.name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, 120) : defaultName(type2);
  node.x = finite(raw.x ?? 0, `${path}.x`);
  node.y = finite(raw.y ?? 0, `${path}.y`);
  node.width = finite(raw.width ?? defaultWidth(type2), `${path}.width`, { min: 0, max: 1e6 });
  node.height = finite(raw.height ?? defaultHeight(type2), `${path}.height`, { min: 0, max: 1e6 });
  node.rotation = finite(raw.rotation ?? 0, `${path}.rotation`, { min: -36e3, max: 36e3 });
  node.opacity = unit(raw.opacity ?? 1, `${path}.opacity`);
  node.visible = raw.visible !== false;
  node.locked = raw.locked === true;
  node.layoutSizing = normalizeSizing(raw.layoutSizing, `${path}.layoutSizing`);
  if (type2 === "frame" || type2 === "group") {
    node.children = [];
    if (Array.isArray(raw.children)) {
      for (let index = 0; index < raw.children.length; index += 1) {
        node.children.push(normalizeNode(raw.children[index], `${path}.children[${index}]`, depth + 1, state2));
      }
    }
  } else {
    node.children = void 0;
  }
  if (type2 === "frame" || type2 === "rect" || type2 === "ellipse") {
    node.fills = normalizeFills(raw.fills, `${path}.fills`);
    if (!node.fills.length && raw.fills == null && raw.fillStyleId == null) {
      node.fills = [{ type: "solid", color: type2 === "frame" ? "#FFFFFF" : "#D9D9D9" }];
    }
    node.strokes = normalizeStrokes(raw.strokes, `${path}.strokes`);
    node.effects = normalizeEffects(raw.effects, `${path}.effects`);
    node.cornerRadius = finite(raw.cornerRadius ?? 0, `${path}.cornerRadius`, { min: 0, max: 1e6 });
  }
  if (type2 === "instance") {
    node.fills = void 0;
    node.strokes = void 0;
    node.effects = void 0;
    node.cornerRadius = raw.cornerRadius == null ? void 0 : finite(raw.cornerRadius, `${path}.cornerRadius`, { min: 0, max: 1e6 });
  }
  if (type2 === "group" || type2 === "line") {
    node.fills = void 0;
    node.strokes = void 0;
    node.effects = void 0;
    node.cornerRadius = void 0;
  }
  if (type2 === "line") {
    node.strokes = normalizeStrokes(raw.strokes, `${path}.strokes`);
    if (!node.strokes.length) node.strokes = [{ color: "#111111", width: 1, align: "center" }];
    node.fills = void 0;
    node.effects = void 0;
    node.height = 0;
  }
  if (type2 === "text") {
    node.text = typeof raw.text === "string" ? raw.text.slice(0, LIMITS.textLength) : "";
    node.font = normalizeFont(raw.font, `${path}.font`);
    node.align = oneOf(raw.align ?? "left", `${path}.align`, ALIGNMENTS);
    node.verticalAlign = oneOf(raw.verticalAlign ?? "top", `${path}.verticalAlign`, VERTICAL_ALIGNMENTS);
    node.fills = normalizeFills(raw.fills, `${path}.fills`);
    if (!node.fills.length && raw.fills == null && raw.fillStyleId == null) {
      node.fills = [{ type: "solid", color: "#111111" }];
    }
    node.effects = normalizeEffects(raw.effects, `${path}.effects`);
    node.autoHeight = raw.autoHeight !== false;
  }
  if (type2 === "path") {
    node.d = normalizePathD(raw.d, path);
    const parsed = parsePathData(node.d);
    node.viewBox = normalizeViewBox(raw.viewBox, parsed.bounds, `${path}.viewBox`);
    node.fillRule = oneOf(raw.fillRule ?? "nonzero", `${path}.fillRule`, PATH_FILL_RULES);
    node.fills = normalizeFills(raw.fills, `${path}.fills`);
    node.strokes = normalizeStrokes(raw.strokes, `${path}.strokes`);
    node.effects = normalizeEffects(raw.effects, `${path}.effects`);
    node.cornerRadius = void 0;
    if (node.fills.some((fill) => fill.type === "image")) {
      throw new CanvasError(`${path}.fills`, "path nodes do not support image fills");
    }
  }
  if (type2 === "frame") {
    node.clip = raw.clip !== false;
    node.layout = normalizeLayout(raw.layout, `${path}.layout`);
    if (raw.backgroundColor != null) {
      node.fills = normalizeFills(raw.fills ?? [{ type: "solid", color: raw.backgroundColor }], `${path}.fills`);
    }
  }
  if (type2 === "instance") {
    node.componentId = id(raw.componentId, `${path}.componentId`);
    node.variantProps = normalizeStringMap(raw.variantProps, `${path}.variantProps`);
    node.overrides = {};
    if (raw.overrides != null) {
      if (!isPlainObject(raw.overrides)) throw new CanvasError(`${path}.overrides`, "expected an object");
      for (const [key, value] of Object.entries(raw.overrides)) {
        node.overrides[id(key, `${path}.overrides key`)] = normalizeOverride(value, `${path}.overrides.${key}`);
      }
    }
  }
  if (raw.fillStyleId != null) node.fillStyleId = id(raw.fillStyleId, `${path}.fillStyleId`);
  if (raw.textStyleId != null) node.textStyleId = id(raw.textStyleId, `${path}.textStyleId`);
  if (raw.effectStyleId != null) node.effectStyleId = id(raw.effectStyleId, `${path}.effectStyleId`);
  return node;
}
function normalizeFills(value, path) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 8) throw new CanvasError(path, "expected at most 8 fills");
  return value.map((fill, index) => normalizeFill(fill, `${path}[${index}]`));
}
function normalizeEffects(value, path) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 8) throw new CanvasError(path, "expected at most 8 effects");
  return value.map((effect, index) => normalizeEffect(effect, `${path}[${index}]`));
}
function normalizeStringMap(value, path) {
  if (value == null) return {};
  if (!isPlainObject(value)) throw new CanvasError(path, "expected an object");
  const out = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "string" || entry.length > 120) throw new CanvasError(`${path}.${key}`, "expected a short string");
    out[key] = entry;
  }
  return out;
}
function defaultName(type2) {
  return {
    frame: "Frame",
    group: "Group",
    rect: "Rectangle",
    ellipse: "Ellipse",
    line: "Line",
    text: "Text",
    path: "Path",
    instance: "Instance"
  }[type2] ?? "Node";
}
function defaultWidth(type2) {
  if (type2 === "line") return 100;
  if (type2 === "text") return 160;
  if (type2 === "path") return 120;
  if (type2 === "frame") return 375;
  return 120;
}
function defaultHeight(type2) {
  if (type2 === "line") return 0;
  if (type2 === "text") return 24;
  if (type2 === "path") return 120;
  if (type2 === "frame") return 667;
  return 120;
}
function normalizePathD(value, path) {
  if (typeof value !== "string" || !value.trim()) throw new CanvasError(`${path}.d`, "expected a non-empty SVG path string");
  if (value.length > 1e5) throw new CanvasError(`${path}.d`, "path d exceeds 100000 characters");
  try {
    parsePathData(value);
  } catch (error) {
    throw new CanvasError(`${path}.d`, error instanceof Error ? error.message : "invalid path data");
  }
  return value;
}
function normalizeViewBox(value, bounds, path) {
  const fallback = {
    x: Number.isFinite(bounds?.minX) ? bounds.minX : 0,
    y: Number.isFinite(bounds?.minY) ? bounds.minY : 0,
    width: Number.isFinite(bounds?.maxX - bounds?.minX) && bounds.maxX > bounds.minX ? bounds.maxX - bounds.minX : 1,
    height: Number.isFinite(bounds?.maxY - bounds?.minY) && bounds.maxY > bounds.minY ? bounds.maxY - bounds.minY : 1
  };
  if (value == null) return fallback;
  if (!isPlainObject(value)) throw new CanvasError(path, "expected a viewBox object");
  return {
    x: finite(value.x ?? fallback.x, `${path}.x`),
    y: finite(value.y ?? fallback.y, `${path}.y`),
    width: finite(value.width ?? fallback.width, `${path}.width`, { min: 1e-4, max: 1e6 }),
    height: finite(value.height ?? fallback.height, `${path}.height`, { min: 1e-4, max: 1e6 })
  };
}
function normalizeStyle(raw, path) {
  if (!isPlainObject(raw)) throw new CanvasError(path, "expected a style object");
  const style = { ...raw };
  style.id = id(raw.id, `${path}.id`);
  style.type = oneOf(raw.type, `${path}.type`, STYLE_TYPES);
  style.name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, 120) : style.type;
  if (style.type === "fill") style.value = normalizeFill(raw.value, `${path}.value`);
  else if (style.type === "text") {
    style.value = { font: normalizeFont(raw.value?.font, `${path}.value.font`), fills: normalizeFills(raw.value?.fills, `${path}.value.fills`) };
  } else style.value = normalizeEffects(raw.value, `${path}.value`);
  return style;
}
function normalizeComponent(raw, path, state2) {
  if (!isPlainObject(raw)) throw new CanvasError(path, "expected a component object");
  const component = { ...raw };
  component.id = id(raw.id, `${path}.id`);
  component.name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, 120) : "Component";
  component.root = normalizeNode(raw.root, `${path}.root`, 1, state2);
  component.root.x = 0;
  component.root.y = 0;
  if (raw.variantSetId != null) component.variantSetId = id(raw.variantSetId, `${path}.variantSetId`);
  component.variantProps = normalizeStringMap(raw.variantProps, `${path}.variantProps`);
  return component;
}
function normalizeVariantSet(raw, path) {
  if (!isPlainObject(raw)) throw new CanvasError(path, "expected a variant set object");
  if (!Array.isArray(raw.properties) || raw.properties.length === 0) {
    throw new CanvasError(`${path}.properties`, "expected at least one variant property");
  }
  return {
    ...raw,
    id: id(raw.id, `${path}.id`),
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, 120) : "Variant set",
    properties: raw.properties.map((property, index) => ({
      name: shortLabel(property?.name, `${path}.properties[${index}].name`),
      values: Array.isArray(property?.values) ? property.values.map(
        (value, valueIndex) => shortLabel(value, `${path}.properties[${index}].values[${valueIndex}]`)
      ) : []
    })),
    componentIds: Array.isArray(raw.componentIds) ? raw.componentIds.map((value, index) => id(value, `${path}.componentIds[${index}]`)) : []
  };
}
function normalizeFontAsset(raw, path) {
  if (!isPlainObject(raw)) throw new CanvasError(path, "expected a font asset object");
  return {
    ...raw,
    id: id(raw.id, `${path}.id`),
    family: typeof raw.family === "string" && raw.family.trim() ? raw.family.trim().slice(0, 120) : "Custom",
    weight: Math.round(finite(raw.weight ?? 400, `${path}.weight`, { min: 100, max: 900 }) / 100) * 100,
    style: oneOf(raw.style ?? "normal", `${path}.style`, FONT_STYLES),
    asset: isFontAssetPath(raw.asset) ? raw.asset : (() => {
      throw new CanvasError(`${path}.asset`, "expected fonts/<file>");
    })(),
    sourceName: typeof raw.sourceName === "string" ? raw.sourceName.slice(0, 200) : void 0
  };
}
function normalizeComment(raw, path) {
  if (!isPlainObject(raw)) throw new CanvasError(path, "expected a comment object");
  const comment = {
    ...raw,
    id: id(raw.id, `${path}.id`),
    pageId: id(raw.pageId, `${path}.pageId`),
    body: typeof raw.body === "string" ? raw.body.slice(0, 4e3) : "",
    author: oneOf(raw.author ?? "user", `${path}.author`, COMMENT_AUTHORS),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : nowIso(),
    resolved: raw.resolved === true,
    replies: []
  };
  if (raw.nodeId != null) comment.nodeId = id(raw.nodeId, `${path}.nodeId`);
  if (raw.x != null) comment.x = unit(raw.x, `${path}.x`);
  if (raw.y != null) comment.y = unit(raw.y, `${path}.y`);
  if (Array.isArray(raw.replies)) {
    comment.replies = raw.replies.slice(0, 100).map((reply, index) => {
      if (!isPlainObject(reply)) throw new CanvasError(`${path}.replies[${index}]`, "expected an object");
      return {
        id: id(reply.id ?? newId("r"), `${path}.replies[${index}].id`),
        body: typeof reply.body === "string" ? reply.body.slice(0, 4e3) : "",
        author: oneOf(reply.author ?? "user", `${path}.replies[${index}].author`, COMMENT_AUTHORS),
        createdAt: typeof reply.createdAt === "string" ? reply.createdAt : nowIso()
      };
    });
  }
  return comment;
}
function normalizeDoc(input, options = {}) {
  if (!isPlainObject(input)) throw new CanvasError("$", "expected a document object");
  const doc = clone(input);
  doc.format = FORMAT;
  doc.version = VERSION;
  doc.id = id(doc.id ?? newId("doc"), "$.id");
  doc.title = typeof doc.title === "string" && doc.title.trim() ? doc.title.trim().slice(0, 200) : "\u672A\u547D\u540D\u753B\u5E03";
  if (!Array.isArray(doc.pages) || doc.pages.length === 0) throw new CanvasError("$.pages", "expected at least one page");
  if (doc.pages.length > 50) throw new CanvasError("$.pages", "expected at most 50 pages");
  const nodeIds = /* @__PURE__ */ new Set();
  const nodeState = { count: 0, ids: nodeIds };
  doc.pages = doc.pages.map((page, pageIndex) => {
    if (!isPlainObject(page)) throw new CanvasError(`$.pages[${pageIndex}]`, "expected an object");
    const normalizedPage = {
      ...page,
      id: id(page.id ?? newId("page"), `$.pages[${pageIndex}].id`),
      name: typeof page.name === "string" && page.name.trim() ? page.name.trim().slice(0, 120) : `Page ${pageIndex + 1}`,
      children: []
    };
    if (page.background != null) normalizedPage.background = color(page.background, `$.pages[${pageIndex}].background`);
    if (Array.isArray(page.children)) {
      for (let index = 0; index < page.children.length; index += 1) {
        normalizedPage.children.push(
          normalizeNode(page.children[index], `$.pages[${pageIndex}].children[${index}]`, 1, nodeState)
        );
      }
    }
    return normalizedPage;
  });
  const pageIds = new Set(doc.pages.map((page) => page.id));
  if (pageIds.size !== doc.pages.length) throw new CanvasError("$.pages", "duplicate page id");
  doc.components = Array.isArray(doc.components) ? doc.components.map((component, index) => normalizeComponent(component, `$.components[${index}]`, nodeState)) : [];
  if (doc.components.length > LIMITS.components) throw new CanvasError("$.components", "too many components");
  const componentIds = new Set(doc.components.map((component) => component.id));
  if (componentIds.size !== doc.components.length) throw new CanvasError("$.components", "duplicate component id");
  for (const component of doc.components) {
    if (component.variantSetId != null && !Array.isArray(doc.variantSets)) {
      throw new CanvasError("$.variantSets", "missing variant sets");
    }
  }
  doc.variantSets = Array.isArray(doc.variantSets) ? doc.variantSets.map((set, index) => normalizeVariantSet(set, `$.variantSets[${index}]`)) : [];
  for (const [index, set] of doc.variantSets.entries()) {
    for (const componentId of set.componentIds) {
      if (!componentIds.has(componentId)) {
        throw new CanvasError(`$.variantSets[${index}].componentIds`, `unknown component "${componentId}"`);
      }
    }
  }
  doc.styles = Array.isArray(doc.styles) ? doc.styles.map((style, index) => normalizeStyle(style, `$.styles[${index}]`)) : [];
  if (doc.styles.length > LIMITS.styles) throw new CanvasError("$.styles", "too many styles");
  const styleIds = new Set(doc.styles.map((style) => style.id));
  if (styleIds.size !== doc.styles.length) throw new CanvasError("$.styles", "duplicate style id");
  doc.fonts = Array.isArray(doc.fonts) ? doc.fonts.map((font, index) => normalizeFontAsset(font, `$.fonts[${index}]`)) : [];
  if (doc.fonts.length > LIMITS.fonts) throw new CanvasError("$.fonts", "too many fonts");
  doc.comments = Array.isArray(doc.comments) ? doc.comments.map((comment, index) => normalizeComment(comment, `$.comments[${index}]`)) : [];
  if (doc.comments.length > LIMITS.comments) throw new CanvasError("$.comments", "too many comments");
  for (const [index, comment] of doc.comments.entries()) {
    if (!pageIds.has(comment.pageId)) {
      throw new CanvasError(`$.comments[${index}].pageId`, `unknown page "${comment.pageId}"`);
    }
    if (comment.nodeId != null && !findNodeInDoc(doc, comment.nodeId)) {
      throw new CanvasError(`$.comments[${index}].nodeId`, `unknown node "${comment.nodeId}"`);
    }
  }
  doc.meta = isPlainObject(doc.meta) ? { ...doc.meta } : {};
  doc.meta.createdAt = typeof doc.meta.createdAt === "string" ? doc.meta.createdAt : nowIso();
  doc.meta.updatedAt = options.touch === false ? doc.meta.updatedAt ?? nowIso() : nowIso();
  validateReferences(doc);
  return doc;
}
function validateReferences(doc) {
  const componentById = new Map(doc.components.map((component) => [component.id, component]));
  const variantSetById = new Map(doc.variantSets.map((set) => [set.id, set]));
  const styleById = new Map(doc.styles.map((style) => [style.id, style]));
  const fontIds = /* @__PURE__ */ new Set();
  for (const [index, font] of doc.fonts.entries()) {
    if (fontIds.has(font.id)) throw new CanvasError(`$.fonts[${index}].id`, `duplicate font id "${font.id}"`);
    fontIds.add(font.id);
  }
  for (const [index, set] of doc.variantSets.entries()) {
    for (const componentId of set.componentIds) {
      const component = componentById.get(componentId);
      if (!component) throw new CanvasError(`$.variantSets[${index}].componentIds`, `unknown component "${componentId}"`);
      if (component.variantSetId !== set.id) {
        throw new CanvasError(`$.components`, `component "${componentId}" must set variantSetId "${set.id}"`);
      }
      for (const property of set.properties) {
        if (!(property.name in component.variantProps)) {
          throw new CanvasError(`$.components`, `component "${componentId}" is missing variant property "${property.name}"`);
        }
        if (!property.values.includes(component.variantProps[property.name])) {
          throw new CanvasError(
            `$.components`,
            `component "${componentId}" has variant value not declared by "${property.name}"`
          );
        }
      }
    }
  }
  for (const component of doc.components) {
    if (component.variantSetId != null && !variantSetById.has(component.variantSetId)) {
      throw new CanvasError("$.components", `component "${component.id}" references unknown variant set`);
    }
  }
  const checkStyle = (styleId2, type2, path) => {
    if (styleId2 == null) return;
    const style = styleById.get(styleId2);
    if (!style) throw new CanvasError(path, `unknown ${type2} style "${styleId2}"`);
    if (style.type !== type2) throw new CanvasError(path, `style "${styleId2}" is a ${style.type} style, expected ${type2}`);
  };
  for (const component of doc.components) {
    for (const node of iterateNode(component.root)) {
      checkStyle(node.fillStyleId, "fill", `$.components.${component.id}.${node.id}.fillStyleId`);
      checkStyle(node.textStyleId, "text", `$.components.${component.id}.${node.id}.textStyleId`);
      checkStyle(node.effectStyleId, "effect", `$.components.${component.id}.${node.id}.effectStyleId`);
    }
  }
  const checkInstance = (node, path) => {
    const component = componentById.get(node.componentId);
    if (!component) throw new CanvasError(`${path}.componentId`, `unknown component "${node.componentId}"`);
    if (component.variantSetId != null) {
      const set = variantSetById.get(component.variantSetId);
      if (set) {
        for (const [key, value] of Object.entries(node.variantProps ?? {})) {
          const property = set.properties.find((entry) => entry.name === key);
          if (!property) throw new CanvasError(`${path}.variantProps.${key}`, `variant set has no property "${key}"`);
          if (!property.values.includes(value)) {
            throw new CanvasError(`${path}.variantProps.${key}`, `unknown variant value "${value}"`);
          }
        }
      }
    }
    for (const [overrideId, patch] of Object.entries(node.overrides ?? {})) {
      const target = findNodeInTree(component.root, overrideId);
      if (!target) throw new CanvasError(`${path}.overrides.${overrideId}`, "override targets an unknown node");
      if ("text" in patch && target.node.type !== "text") {
        throw new CanvasError(`${path}.overrides.${overrideId}.text`, "text override on a non-text node");
      }
      if ("fills" in patch && !["frame", "rect", "ellipse", "path", "text"].includes(target.node.type)) {
        throw new CanvasError(`${path}.overrides.${overrideId}.fills`, "fill override on an unsupported node");
      }
    }
  };
  const visit = (node, path, depth) => {
    if (depth > LIMITS.depth) return;
    checkStyle(node.fillStyleId, "fill", `${path}.fillStyleId`);
    checkStyle(node.textStyleId, "text", `${path}.textStyleId`);
    checkStyle(node.effectStyleId, "effect", `${path}.effectStyleId`);
    if (node.type === "instance") checkInstance(node, path);
    if (Array.isArray(node.children)) {
      node.children.forEach((child, index) => visit(child, `${path}.children[${index}]`, depth + 1));
    }
  };
  doc.pages.forEach((page, pageIndex) => {
    page.children.forEach((node, index) => visit(node, `$.pages[${pageIndex}].children[${index}]`, 1));
  });
  const commentIds = /* @__PURE__ */ new Set();
  for (const [index, comment] of doc.comments.entries()) {
    if (commentIds.has(comment.id)) throw new CanvasError(`$.comments[${index}].id`, "duplicate comment id");
    commentIds.add(comment.id);
  }
}
function* iterateNode(node) {
  yield node;
  if (Array.isArray(node.children)) for (const child of node.children) yield* iterateNode(child);
}
function countNodes(node) {
  let total = 1;
  if (Array.isArray(node.children)) for (const child of node.children) total += countNodes(child);
  return total;
}
function walkNodes(doc, visitor) {
  for (const page of doc.pages ?? []) {
    const visit = (node, parent, index) => {
      visitor(node, parent, { page, component: null, index });
      if (Array.isArray(node.children)) node.children.forEach((child, childIndex) => visit(child, node, childIndex));
    };
    (page.children ?? []).forEach((child, index) => visit(child, null, index));
  }
  for (const component of doc.components ?? []) {
    const visit = (node, parent, index) => {
      visitor(node, parent, { page: null, component, index });
      if (Array.isArray(node.children)) node.children.forEach((child, childIndex) => visit(child, node, childIndex));
    };
    visit(component.root, null, 0);
  }
}
function findNodeInDoc(doc, nodeId) {
  let found = null;
  walkNodes(doc, (node, parent, context) => {
    if (!found && node.id === nodeId) found = { node, parent, ...context };
  });
  return found;
}
function findNodeInTree(node, nodeId) {
  const search = (current, parent, index) => {
    if (current.id === nodeId) return { node: current, parent, index };
    if (!Array.isArray(current.children)) return null;
    for (let childIndex = 0; childIndex < current.children.length; childIndex += 1) {
      const result = search(current.children[childIndex], current, childIndex);
      if (result) return result;
    }
    return null;
  };
  return search(node, null, 0);
}
function findPage(doc, pageId) {
  return (doc.pages ?? []).find((page) => page.id === pageId) ?? null;
}
function firstPage(doc) {
  return doc.pages?.[0] ?? null;
}
function outlineDoc(doc, options = {}) {
  const page = options.pageId ? findPage(doc, options.pageId) : firstPage(doc);
  const selection = new Set(options.selection ?? []);
  const outlineNode = (node, depth = 0) => {
    const item = {
      id: node.id,
      type: node.type,
      name: node.name,
      x: round(node.x),
      y: round(node.y),
      w: round(node.width),
      h: round(node.height)
    };
    if (node.type === "text") item.text = String(node.text ?? "").slice(0, 80);
    if (node.type === "instance") {
      item.componentId = node.componentId;
      if (Object.keys(node.variantProps ?? {}).length) item.variantProps = node.variantProps;
      if (Object.keys(node.overrides ?? {}).length) item.overrideCount = Object.keys(node.overrides).length;
    }
    if (node.layout) item.layout = node.layout.direction;
    if (node.layoutSizing) item.layoutSizing = node.layoutSizing;
    if (selection.has(node.id)) item.selected = true;
    if (node.visible === false) item.visible = false;
    if (depth < 6 && Array.isArray(node.children) && node.children.length) {
      item.children = node.children.slice(0, 100).map((child) => outlineNode(child, depth + 1));
    }
    return item;
  };
  return {
    format: FORMAT,
    version: VERSION,
    id: doc.id,
    title: doc.title,
    page: page ? { id: page.id, name: page.name, background: page.background ?? null } : null,
    pages: (doc.pages ?? []).map((entry) => ({ id: entry.id, name: entry.name })),
    nodes: page ? (page.children ?? []).map((node) => outlineNode(node)) : [],
    selection: [...selection],
    components: (doc.components ?? []).map((component) => ({
      id: component.id,
      name: component.name,
      variantSetId: component.variantSetId ?? null,
      variantProps: component.variantProps ?? {},
      nodeCount: countNodes(component.root)
    })),
    variantSets: (doc.variantSets ?? []).map((set) => ({
      id: set.id,
      name: set.name,
      properties: set.properties,
      componentIds: set.componentIds
    })),
    styles: (doc.styles ?? []).map((style) => ({ id: style.id, type: style.type, name: style.name })),
    fonts: (doc.fonts ?? []).map((font) => ({
      id: font.id,
      family: font.family,
      weight: font.weight,
      style: font.style,
      asset: font.asset
    })),
    comments: (doc.comments ?? []).map((comment) => ({
      id: comment.id,
      pageId: comment.pageId,
      nodeId: comment.nodeId ?? null,
      body: comment.body,
      author: comment.author,
      resolved: comment.resolved,
      replyCount: comment.replies?.length ?? 0
    })),
    stats: {
      pages: doc.pages?.length ?? 0,
      nodes: (doc.pages ?? []).reduce((total, entry) => total + (entry.children ?? []).reduce((sum, node) => sum + countNodes(node), 0), 0),
      components: doc.components?.length ?? 0,
      styles: doc.styles?.length ?? 0,
      fonts: doc.fonts?.length ?? 0,
      unresolvedComments: (doc.comments ?? []).filter((comment) => !comment.resolved).length
    },
    meta: doc.meta ?? {}
  };
}
function round(value) {
  return Math.round(Number(value) * 100) / 100;
}

// src/shared/ops.ts
function pageOf(doc, pageId) {
  return (doc.pages ?? []).find((page) => page.id === pageId) ?? null;
}
function ensureIds(node) {
  if (!isPlainObject(node)) return node;
  if (!node.id) node.id = newId(node.type === "instance" ? "i" : "n");
  if (Array.isArray(node.children)) node.children.forEach((child) => ensureIds(child));
  return node;
}
function container(doc, parent, pageId) {
  const page = pageId ? pageOf(doc, pageId) : firstPage(doc);
  if (!page) throw new CanvasError("$.pages", "document has no pages");
  if (parent == null || parent === page.id) return { children: page.children, owner: page, kind: "page" };
  const found = findNodeInDoc(doc, parent);
  if (!found) throw new CanvasError("$", `unknown parent "${parent}"`);
  if (!Array.isArray(found.node.children)) {
    if (found.node.type === "frame" || found.node.type === "group") found.node.children = [];
    else throw new CanvasError("$", `node "${parent}" cannot contain children`);
  }
  return { children: found.node.children, owner: found.node, kind: "node" };
}
function insert(children, node, index) {
  if (index == null || index < 0 || index >= children.length) children.push(node);
  else children.splice(index, 0, node);
}
function removeFromOwner(doc, id2) {
  const found = findNodeInDoc(doc, id2);
  if (!found) throw new CanvasError("$", `unknown node "${id2}"`);
  if (found.parent) {
    const index = found.parent.children.findIndex((child) => child.id === id2);
    if (index === -1) throw new CanvasError("$", `node "${id2}" is not in its parent`);
    found.parent.children.splice(index, 1);
  } else if (found.component) {
    throw new CanvasError("$", "component roots cannot be removed with a node op");
  } else if (found.page) {
    const index = found.page.children.findIndex((child) => child.id === id2);
    found.page.children.splice(index, 1);
  }
  return found;
}
function patchNodeFields(node, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value === void 0) continue;
    if (key === "id" || key === "type") continue;
    if (value === null) {
      delete node[key];
      continue;
    }
    if (key === "font" && isPlainObject(value)) node.font = { ...node.font ?? {}, ...value };
    else if (key === "layout" && isPlainObject(value)) {
      node.layout = {
        ...node.layout ?? {},
        ...value,
        padding: { ...node.layout?.padding ?? {}, ...isPlainObject(value.padding) ? value.padding : {} }
      };
    } else if (key === "layoutSizing" && isPlainObject(value)) {
      node.layoutSizing = { ...node.layoutSizing ?? {}, ...value };
    } else if (key === "overrides" && isPlainObject(value)) {
      node.overrides = { ...node.overrides ?? {}, ...value };
    } else if (key === "crop" && isPlainObject(value)) {
      node.crop = { ...node.crop ?? {}, ...value };
    } else node[key] = value;
  }
  return node;
}
function updateNode(doc, nodeId, patch) {
  const found = findNodeInDoc(doc, nodeId);
  if (!found) throw new CanvasError("$", `unknown node "${nodeId}"`);
  patchNodeFields(found.node, patch);
  return found.node;
}
function applyOps(doc, ops, options = {}) {
  if (!Array.isArray(ops)) throw new CanvasError("$.ops", "expected an array of operations");
  if (ops.length > 500) throw new CanvasError("$.ops", "at most 500 operations per call");
  const changed = [];
  ops.forEach((op, index) => {
    const path = `$.ops[${index}]`;
    if (!isPlainObject(op)) throw new CanvasError(path, "expected an operation object");
    try {
      switch (op.op) {
        case "add": {
          const target = container(doc, op.parent ?? null, op.pageId ?? options.pageId);
          const node = ensureIds(structuredClone(op.node));
          insert(target.children, node, op.index);
          changed.push(node.id);
          break;
        }
        case "update": {
          if (typeof op.id !== "string") throw new CanvasError(`${path}.id`, "expected a node id");
          updateNode(doc, op.id, op.patch ?? {});
          changed.push(op.id);
          break;
        }
        case "remove": {
          if (typeof op.id !== "string") throw new CanvasError(`${path}.id`, "expected a node id");
          removeFromOwner(doc, op.id);
          changed.push(op.id);
          break;
        }
        case "move": {
          if (typeof op.id !== "string") throw new CanvasError(`${path}.id`, "expected a node id");
          const found = findNodeInDoc(doc, op.id);
          if (!found) throw new CanvasError(`${path}.id`, `unknown node "${op.id}"`);
          const node = structuredClone(found.node);
          removeFromOwner(doc, op.id);
          const target = container(doc, op.parent ?? null, op.pageId ?? options.pageId);
          insert(target.children, node, op.index);
          changed.push(op.id);
          break;
        }
        case "set": {
          if (!["styles", "components", "variantSets", "fonts"].includes(op.key)) {
            throw new CanvasError(`${path}.key`, "expected styles, components, variantSets or fonts");
          }
          doc[op.key] = structuredClone(op.value ?? []);
          break;
        }
        case "comment.add": {
          addComment(doc, {
            pageId: op.pageId ?? options.pageId,
            nodeId: op.nodeId,
            x: op.x,
            y: op.y,
            body: op.body,
            author: op.author
          });
          break;
        }
        case "comment.reply": {
          replyComment(doc, op.commentId, op.body, op.author);
          break;
        }
        case "comment.resolve": {
          resolveComment(doc, op.commentId, op.resolved !== false);
          break;
        }
        case "comment.remove": {
          removeComment(doc, op.commentId);
          break;
        }
        default:
          throw new CanvasError(`${path}.op`, `unknown operation "${String(op.op)}"`);
      }
    } catch (error) {
      if (error instanceof CanvasError) throw new CanvasError(path, error.message.replace(/^\$:\s*/, ""), error.code);
      throw error;
    }
  });
  return changed;
}
function addComment(doc, input) {
  const page = input.pageId ? pageOf(doc, input.pageId) : firstPage(doc);
  if (!page) throw new CanvasError("$.comments", "document has no pages");
  if (typeof input.body !== "string" || !input.body.trim()) throw new CanvasError("$.comments.body", "comment body is required");
  if (input.nodeId != null && !findNodeInDoc(doc, input.nodeId)) {
    throw new CanvasError("$.comments.nodeId", `unknown node "${input.nodeId}"`);
  }
  const comment = {
    id: newId("c"),
    pageId: page.id,
    body: input.body,
    author: input.author === "ai" ? "ai" : "user",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    resolved: false,
    replies: []
  };
  if (input.nodeId != null) comment.nodeId = input.nodeId;
  if (input.x != null) comment.x = input.x;
  if (input.y != null) comment.y = input.y;
  doc.comments = Array.isArray(doc.comments) ? doc.comments : [];
  doc.comments.push(comment);
  return comment;
}
function replyComment(doc, commentId, body, author) {
  const comment = (doc.comments ?? []).find((entry) => entry.id === commentId);
  if (!comment) throw new CanvasError("$.comments", `unknown comment "${commentId}"`);
  if (typeof body !== "string" || !body.trim()) throw new CanvasError("$.comments.body", "reply body is required");
  const reply = {
    id: newId("r"),
    body,
    author: author === "ai" ? "ai" : "user",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  comment.replies.push(reply);
  return reply;
}
function resolveComment(doc, commentId, resolved = true) {
  const comment = (doc.comments ?? []).find((entry) => entry.id === commentId);
  if (!comment) throw new CanvasError("$.comments", `unknown comment "${commentId}"`);
  comment.resolved = resolved;
  return comment;
}
function removeComment(doc, commentId) {
  const index = (doc.comments ?? []).findIndex((entry) => entry.id === commentId);
  if (index === -1) throw new CanvasError("$.comments", `unknown comment "${commentId}"`);
  doc.comments.splice(index, 1);
}

// src/shared/design-system.ts
var DEFAULT_DESIGN_SYSTEM = "material3";
var DESIGN_SYSTEMS = {
  material3: {
    id: "material3",
    name: "Material Design 3",
    source: "Google",
    platform: "cross-platform",
    description: "Google \u7684\u8DE8\u5E73\u53F0\u8BBE\u8BA1\u89C4\u8303\uFF0C\u7EC4\u4EF6\u4E0E token \u8986\u76D6\u6700\u5E7F\uFF0C\u662F\u6700\u901A\u7528\u7684\u4E00\u5957\u3002",
    colors: {
      primary: "#6750A4",
      onPrimary: "#FFFFFF",
      primaryContainer: "#EADDFF",
      onPrimaryContainer: "#21005D",
      secondary: "#625B71",
      onSecondary: "#FFFFFF",
      secondaryContainer: "#E8DEF8",
      onSecondaryContainer: "#1D192B",
      surface: "#FEF7FF",
      onSurface: "#1D1B20",
      surfaceVariant: "#E7E0EC",
      onSurfaceVariant: "#49454F",
      background: "#FEF7FF",
      outline: "#79747E",
      outlineVariant: "#CAC4D0",
      error: "#B3261E",
      onError: "#FFFFFF",
      success: "#146C2E",
      warning: "#7D5260"
    },
    type: {
      displayLarge: { size: 57, lineHeight: 64, weight: 400, letterSpacing: -0.25 },
      displayMedium: { size: 45, lineHeight: 52, weight: 400, letterSpacing: 0 },
      displaySmall: { size: 36, lineHeight: 44, weight: 400, letterSpacing: 0 },
      headlineLarge: { size: 32, lineHeight: 40, weight: 400, letterSpacing: 0 },
      headlineMedium: { size: 28, lineHeight: 36, weight: 400, letterSpacing: 0 },
      headlineSmall: { size: 24, lineHeight: 32, weight: 400, letterSpacing: 0 },
      titleLarge: { size: 22, lineHeight: 28, weight: 400, letterSpacing: 0 },
      titleMedium: { size: 16, lineHeight: 24, weight: 500, letterSpacing: 0.15 },
      titleSmall: { size: 14, lineHeight: 20, weight: 500, letterSpacing: 0.1 },
      bodyLarge: { size: 16, lineHeight: 24, weight: 400, letterSpacing: 0.5 },
      bodyMedium: { size: 14, lineHeight: 20, weight: 400, letterSpacing: 0.25 },
      bodySmall: { size: 12, lineHeight: 16, weight: 400, letterSpacing: 0.4 },
      labelLarge: { size: 14, lineHeight: 20, weight: 500, letterSpacing: 0.1 },
      labelMedium: { size: 12, lineHeight: 16, weight: 500, letterSpacing: 0.5 },
      labelSmall: { size: 11, lineHeight: 16, weight: 500, letterSpacing: 0.5 }
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 },
    radius: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, full: 999 },
    elevation: {
      level1: [{ type: "drop-shadow", x: 0, y: 1, blur: 3, spread: 0, color: "#0000001A" }],
      level2: [{ type: "drop-shadow", x: 0, y: 2, blur: 6, spread: 0, color: "#0000001F" }],
      level3: [{ type: "drop-shadow", x: 0, y: 4, blur: 12, spread: 0, color: "#00000024" }]
    },
    components: {
      button: { height: 40, radius: 20, paddingX: 24, label: "labelLarge" },
      card: { radius: 12, padding: 16, elevation: "level1" },
      textField: { height: 56, radius: 4, paddingX: 16 }
    }
  },
  ios: {
    id: "ios",
    name: "Apple Human Interface Guidelines",
    source: "Apple",
    platform: "iOS",
    description: "Apple \u7684 iOS \u5E73\u53F0\u89C4\u8303\uFF0C\u72B6\u6001\u680F\u3001\u5BFC\u822A\u680F\u3001\u6807\u7B7E\u680F\u3001\u5B89\u5168\u533A\u5C3A\u5BF8\u90FD\u6309 iPhone \u57FA\u51C6\u3002",
    colors: {
      blue: "#007AFF",
      green: "#34C759",
      red: "#FF3B30",
      orange: "#FF9500",
      yellow: "#FFCC00",
      purple: "#AF52DE",
      teal: "#5AC8FA",
      gray: "#8E8E93",
      background: "#F2F2F7",
      surface: "#FFFFFF",
      surfaceElevated: "#FFFFFFF2",
      label: "#000000",
      secondaryLabel: "#3C3C4399",
      tertiaryLabel: "#3C3C434D",
      separator: "#3C3C432E",
      fill: "#7878801F",
      onBlue: "#FFFFFF"
    },
    type: {
      largeTitle: { size: 34, lineHeight: 41, weight: 700, letterSpacing: 0.37 },
      title1: { size: 28, lineHeight: 34, weight: 700, letterSpacing: 0.36 },
      title2: { size: 22, lineHeight: 28, weight: 600, letterSpacing: 0.35 },
      title3: { size: 20, lineHeight: 25, weight: 600, letterSpacing: 0.38 },
      headline: { size: 17, lineHeight: 22, weight: 600, letterSpacing: -0.41 },
      body: { size: 17, lineHeight: 22, weight: 400, letterSpacing: -0.41 },
      callout: { size: 16, lineHeight: 21, weight: 400, letterSpacing: -0.32 },
      subheadline: { size: 15, lineHeight: 20, weight: 400, letterSpacing: -0.24 },
      footnote: { size: 13, lineHeight: 18, weight: 400, letterSpacing: -0.08 },
      caption1: { size: 12, lineHeight: 16, weight: 400, letterSpacing: 0 },
      caption2: { size: 11, lineHeight: 13, weight: 400, letterSpacing: 0.07 }
    },
    metrics: {
      screenWidth: 393,
      screenHeight: 852,
      statusBarHeight: 54,
      navBarHeight: 44,
      tabBarHeight: 49,
      homeIndicatorWidth: 134,
      homeIndicatorHeight: 5,
      safeAreaBottom: 34,
      margin: 16,
      cardRadius: 12,
      controlHeight: 44
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 32 },
    radius: { sm: 8, md: 10, card: 12, large: 16, full: 999 },
    elevation: {
      card: [{ type: "drop-shadow", x: 0, y: 1, blur: 4, spread: 0, color: "#0000000F" }]
    },
    components: {
      statusBar: { height: 54 },
      navBar: { height: 44 },
      tabBar: { height: 49, totalWithHomeIndicator: 83 },
      button: { height: 50, radius: 12, paddingX: 20 }
    }
  }
};
var DESIGN_SYSTEM_IDS = Object.keys(DESIGN_SYSTEMS);
function getDesignSystem(id2 = DEFAULT_DESIGN_SYSTEM) {
  return DESIGN_SYSTEMS[id2] ?? DESIGN_SYSTEMS[DEFAULT_DESIGN_SYSTEM];
}
var DESIGN_SYSTEM_PROMPT = [
  "If the user does not name a design system, use the built-in design system documented in canvas/DESIGN.md:",
  "Material Design 3 tokens for general UI, and Apple Human Interface Guidelines for iOS screens.",
  "For a mobile/iOS screen, start from the foundation (iPhone 16 393\xD7852 by default; iPhone 15 optional) and a page template, then customize it."
].join(" ");
function styleSlug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function styleId(systemId, type2, name) {
  return `ds_${systemId}_${type2}_${styleSlug(name)}`.slice(0, 64);
}
function designSystemStyles(id2 = DEFAULT_DESIGN_SYSTEM) {
  const system = getDesignSystem(id2);
  const styles = [];
  const colorNames = system.id === "material3" ? {
    primary: "Primary",
    onPrimary: "On Primary",
    primaryContainer: "Primary Container",
    surface: "Surface",
    onSurface: "On Surface",
    surfaceVariant: "Surface Variant",
    onSurfaceVariant: "On Surface Variant",
    outline: "Outline",
    error: "Error",
    success: "Success"
  } : {
    blue: "Blue",
    green: "Green",
    red: "Red",
    orange: "Orange",
    gray: "Gray",
    background: "Background",
    surface: "Surface",
    label: "Label",
    secondaryLabel: "Secondary Label",
    separator: "Separator"
  };
  for (const [key, label] of Object.entries(colorNames)) {
    const color2 = system.colors[key];
    if (!color2) continue;
    styles.push({
      id: styleId(system.id, "fill", label),
      type: "fill",
      name: `${system.id === "material3" ? "M3" : "iOS"}/Color/${label}`,
      value: { type: "solid", color: color2 }
    });
  }
  const textColor = system.id === "material3" ? system.colors.onSurface : system.colors.label;
  for (const [key, token] of Object.entries(system.type)) {
    const name = key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()).trim();
    styles.push({
      id: styleId(system.id, "text", name),
      type: "text",
      name: `${system.id === "material3" ? "M3" : "iOS"}/Type/${name}`,
      value: {
        font: {
          family: "system-ui",
          weight: token.weight,
          style: "normal",
          size: token.size,
          lineHeight: Math.round(token.lineHeight / token.size * 1e3) / 1e3,
          letterSpacing: token.letterSpacing
        },
        fills: [{ type: "solid", color: textColor }]
      }
    });
  }
  for (const [key, effects] of Object.entries(system.elevation)) {
    styles.push({
      id: styleId(system.id, "effect", key),
      type: "effect",
      name: `${system.id === "material3" ? "M3" : "iOS"}/Elevation/${key}`,
      value: structuredClone(effects)
    });
  }
  return styles;
}

// src/shared/foundation.ts
var DEVICES = {
  iphone16: {
    id: "iphone16",
    name: "iPhone 16",
    width: 393,
    height: 852,
    statusBarHeight: 54,
    navBarHeight: 44,
    tabBarHeight: 49,
    tabBarTotalHeight: 83,
    homeIndicatorWidth: 134,
    homeIndicatorHeight: 5,
    safeAreaBottom: 34,
    margin: 16
  },
  iphone15: {
    id: "iphone15",
    name: "iPhone 15",
    width: 390,
    height: 844,
    statusBarHeight: 54,
    navBarHeight: 44,
    tabBarHeight: 49,
    tabBarTotalHeight: 83,
    homeIndicatorWidth: 134,
    homeIndicatorHeight: 5,
    safeAreaBottom: 34,
    margin: 16
  }
};
var STYLE_PRESETS = {
  neutral: {
    id: "neutral",
    name: "Neutral",
    pageHorizontal: 16,
    sectionGap: 16,
    cardPadding: 16,
    cardRadius: 12,
    buttonRadius: 12,
    elevation: "soft",
    description: "\u9ED8\u8BA4\uFF1A\u514B\u5236\u7559\u767D\u3001\u8F7B\u9634\u5F71\u300112 \u5706\u89D2"
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    pageHorizontal: 20,
    sectionGap: 24,
    cardPadding: 16,
    cardRadius: 8,
    buttonRadius: 8,
    elevation: "none",
    description: "\u66F4\u5927\u7559\u767D\u3001\u65E0\u9634\u5F71\u30018 \u5706\u89D2"
  },
  soft: {
    id: "soft",
    name: "Soft",
    pageHorizontal: 20,
    sectionGap: 20,
    cardPadding: 20,
    cardRadius: 20,
    buttonRadius: 16,
    elevation: "soft",
    description: "\u67D4\u548C\u7559\u767D\u300120/16 \u5706\u89D2\u3001\u67D4\u548C\u9634\u5F71"
  },
  compact: {
    id: "compact",
    name: "Compact",
    pageHorizontal: 12,
    sectionGap: 12,
    cardPadding: 12,
    cardRadius: 8,
    buttonRadius: 8,
    elevation: "none",
    description: "\u7D27\u51D1\u95F4\u8DDD\u30018 \u5706\u89D2\u3001\u65E0\u9634\u5F71"
  }
};
var DEVICE_IDS = Object.keys(DEVICES);
var PRESET_IDS = Object.keys(STYLE_PRESETS);
var DEFAULT_DEVICE = "iphone16";
var DEFAULT_PRESET = "neutral";
function getDevice(id2 = DEFAULT_DEVICE) {
  return DEVICES[id2] ?? DEVICES[DEFAULT_DEVICE];
}
function getPreset(id2 = DEFAULT_PRESET) {
  return STYLE_PRESETS[id2] ?? STYLE_PRESETS[DEFAULT_PRESET];
}
function listDevices() {
  return Object.values(DEVICES).map((device) => ({ ...device }));
}
function listPresets() {
  return Object.values(STYLE_PRESETS).map((preset) => ({ ...preset }));
}
function resolveFoundation(options = {}) {
  const system = DESIGN_SYSTEMS[options.system] ?? DESIGN_SYSTEMS.ios;
  const device = getDevice(options.device);
  const preset = getPreset(options.preset);
  const elevation = preset.elevation === "none" ? [] : system.elevation?.card ?? system.elevation?.level1 ?? [];
  return {
    system: { id: system.id, name: system.name, source: system.source },
    device: { ...device },
    preset: { ...preset },
    colors: { ...system.colors },
    type: structuredClone(system.type),
    spacing: {
      scale: [4, 8, 12, 16, 20, 24, 32, 40, 48],
      pageHorizontal: preset.pageHorizontal,
      sectionGap: preset.sectionGap,
      cardPadding: preset.cardPadding
    },
    radius: {
      card: preset.cardRadius,
      button: preset.buttonRadius
    },
    elevation: structuredClone(elevation),
    components: {
      screenWidth: device.width,
      screenHeight: device.height,
      statusBarHeight: device.statusBarHeight,
      navBarHeight: device.navBarHeight,
      tabBarHeight: device.tabBarHeight,
      tabBarTotalHeight: device.tabBarTotalHeight,
      homeIndicatorWidth: device.homeIndicatorWidth,
      homeIndicatorHeight: device.homeIndicatorHeight,
      margin: preset.pageHorizontal
    }
  };
}
var FOUNDATION_PROMPT = [
  "Foundation: for new mobile screens default to iPhone 16 393\xD7852 and the Neutral preset;",
  "iPhone 15 390\xD7844 is available for legacy documents. Presets are Neutral/Minimal/Soft/Compact and",
  "control page margins, section gaps, card padding, radii and shadow density only; keep the existing",
  'Material 3 / iOS HIG colors and typography. Get resolved tokens from canvas_template action "foundation".'
].join(" ");

// src/shared/templates.ts
var IOS = DESIGN_SYSTEMS.ios;
var C = IOS.colors;
function type(name) {
  const token = IOS.type[name];
  return {
    family: "system-ui",
    weight: token.weight,
    style: "normal",
    size: token.size,
    lineHeight: Math.round(token.lineHeight / token.size * 1e3) / 1e3,
    letterSpacing: token.letterSpacing
  };
}
function text(id2, name, x, y, width, value, style = "body", color2 = C.label, extra = {}) {
  const font = type(style);
  return {
    id: id2,
    type: "text",
    name,
    x,
    y,
    width,
    height: Math.ceil(font.size * font.lineHeight),
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    text: value,
    font,
    align: extra.align ?? "left",
    verticalAlign: extra.verticalAlign ?? "top",
    fills: [{ type: "solid", color: color2 }],
    effects: [],
    autoHeight: true
  };
}
function rect(id2, name, x, y, width, height, extra = {}) {
  return {
    id: id2,
    type: "rect",
    name,
    x,
    y,
    width,
    height,
    rotation: extra.rotation ?? 0,
    opacity: 1,
    visible: true,
    locked: false,
    cornerRadius: extra.cornerRadius ?? 0,
    fills: extra.fill ? [{ type: "solid", color: extra.fill }] : [],
    strokes: extra.stroke ? [{ color: extra.stroke, width: extra.strokeWidth ?? 1, align: "center" }] : [],
    effects: extra.effects ?? []
  };
}
function ellipse(id2, name, x, y, width, height, extra = {}) {
  return {
    id: id2,
    type: "ellipse",
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fills: extra.fill ? [{ type: "solid", color: extra.fill }] : [],
    strokes: extra.stroke ? [{ color: extra.stroke, width: extra.strokeWidth ?? 1, align: "center" }] : [],
    effects: []
  };
}
function lineNode(id2, name, x, y, length, extra = {}) {
  return {
    id: id2,
    type: "line",
    name,
    x,
    y,
    width: length,
    height: 0,
    rotation: extra.rotation ?? 0,
    opacity: 1,
    visible: true,
    locked: false,
    strokes: [{ color: extra.color ?? C.label, width: extra.width ?? 1, align: "center" }]
  };
}
function frame(id2, name, x, y, width, height, children, extra = {}) {
  return {
    id: id2,
    type: "frame",
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    clip: extra.clip ?? true,
    cornerRadius: extra.cornerRadius ?? 0,
    fills: extra.fill ? [{ type: "solid", color: extra.fill }] : [],
    strokes: extra.stroke ? [{ color: extra.stroke, width: extra.strokeWidth ?? 1, align: "center" }] : [],
    effects: extra.effects ?? [],
    children
  };
}
function statusBar(idPrefix, tone, device) {
  const foreground = tone === "light" ? "#FFFFFF" : C.label;
  const secondary = tone === "light" ? "#FFFFFFCC" : C.secondaryLabel;
  const width = device.width;
  const children = [
    text(`${idPrefix}-time`, "Time", 27, 16, 56, "9:41", "subheadline", foreground),
    rect(`${idPrefix}-island`, "Dynamic Island", (width - 126) / 2, 11, 126, 37, { fill: C.label, cornerRadius: 19 }),
    text(`${idPrefix}-5g`, "Network", width - 87, 17, 25, "5G", "caption2", foreground),
    rect(`${idPrefix}-battery`, "Battery", width - 56, 19, 25, 12, { stroke: secondary, strokeWidth: 1, cornerRadius: 3 }),
    rect(`${idPrefix}-battery-fill`, "Battery level", width - 54, 21, 20, 8, { fill: foreground, cornerRadius: 2 }),
    rect(`${idPrefix}-battery-tip`, "Battery tip", width - 30, 22, 2, 6, { fill: secondary, cornerRadius: 1 })
  ];
  for (let index = 0; index < 4; index += 1) {
    const height = 4 + index * 2;
    children.push(
      rect(`${idPrefix}-signal-${index}`, `Signal ${index + 1}`, width - 108 + index * 4, 33 - height, 3, height, {
        fill: foreground,
        cornerRadius: 1
      })
    );
  }
  return frame(`${idPrefix}-root`, "Status Bar", 0, 0, width, device.statusBarHeight, children, { clip: false });
}
function navBar(device, title = "Title") {
  return frame(
    "nav-root",
    "Navigation Bar",
    0,
    0,
    device.width,
    device.navBarHeight,
    [
      text("nav-back", "Back", 10, 4, 26, "\u2039", "title1", C.blue),
      text("nav-title", "Title", (device.width - 120) / 2, 10, 120, title, "headline", C.label, { align: "center" }),
      text("nav-action", "Action", device.width - 80, 10, 64, "Done", "body", C.blue, { align: "right" })
    ],
    { fill: C.surfaceElevated }
  );
}
function tabBar(device) {
  const labels = ["Home", "Search", "Favorites", "Inbox", "Profile"];
  const height = device.tabBarTotalHeight;
  const children = [lineNode("tab-top-line", "Top separator", 0, 0, device.width, { color: C.separator, width: 1 })];
  labels.forEach((label, index) => {
    const center = (index + 0.5) * device.width / labels.length;
    const selected = index === 0;
    const color2 = selected ? C.blue : C.gray;
    children.push(
      rect(`tab-icon-${index}`, `${label} icon`, center - 12, 10, 24, 24, { fill: color2, cornerRadius: 6 }),
      text(`tab-label-${index}`, label, center - 32, 38, 64, label, "caption2", color2, { align: "center" })
    );
  });
  children.push(
    rect("home-indicator", "Home Indicator", (device.width - device.homeIndicatorWidth) / 2, height - 11, device.homeIndicatorWidth, device.homeIndicatorHeight, {
      fill: C.label,
      cornerRadius: 3
    })
  );
  return frame("tab-root", "Tab Bar", 0, 0, device.width, height, children, { fill: C.surfaceElevated, clip: true });
}
function listRowCard(device) {
  const rows = [
    { icon: C.blue, label: "Wi-Fi", value: "Home" },
    { icon: C.green, label: "Bluetooth", value: "On" },
    { icon: C.orange, label: "Cellular", value: "5G" },
    { icon: C.gray, label: "Personal Hotspot", value: "Off" }
  ];
  const width = device.width - 32;
  const children = [];
  rows.forEach((row, index) => {
    const y = 12 + index * 44;
    const right = width - 48;
    children.push(
      rect(`row-${index}-icon`, `${row.label} icon`, 16, y, 32, 32, { fill: row.icon, cornerRadius: 8 }),
      rect(`row-${index}-glyph`, `${row.label} glyph`, 25, y + 9, 14, 14, { fill: "#FFFFFF", cornerRadius: 4 }),
      text(`row-${index}-label`, row.label, 60, y + 5, right - 60, row.label, "body", C.label),
      text(`row-${index}-value`, `${row.label} value`, right - 62, y + 7, 62, row.value, "subheadline", C.secondaryLabel, { align: "right" }),
      text(`row-${index}-chevron`, "Chevron", width - 26, y + 3, 16, "\u203A", "title3", C.tertiaryLabel, { align: "center" })
    );
    if (index < rows.length - 1) children.push(lineNode(`row-${index}-separator`, "Separator", 60, y + 43, width - 76, { color: C.separator, width: 1 }));
  });
  return frame("settings-card", "General Settings Card", 16, 238, width, 200, children, {
    fill: C.surface,
    cornerRadius: IOS.metrics.cardRadius,
    effects: IOS.elevation.card
  });
}
function accountCard(device) {
  const rows = [
    { icon: C.blue, label: "Apple ID", value: "name@icloud.com" },
    { icon: C.gray, label: "Password & Security", value: "" }
  ];
  const width = device.width - 32;
  const children = [];
  rows.forEach((row, index) => {
    const y = 12 + index * 44;
    children.push(
      rect(`account-${index}-icon`, `${row.label} icon`, 16, y, 32, 32, { fill: row.icon, cornerRadius: 8 }),
      text(`account-${index}-label`, row.label, 60, y + 5, width - 160, row.label, "body", C.label),
      text(`account-${index}-value`, row.value, width - 138, y + 7, 92, row.value, "footnote", C.secondaryLabel, { align: "right" }),
      text(`account-${index}-chevron`, "Chevron", width - 26, y + 3, 16, "\u203A", "title3", C.tertiaryLabel, { align: "center" })
    );
    if (index === 0) children.push(lineNode(`account-${index}-separator`, "Separator", 60, y + 43, width - 76, { color: C.separator, width: 1 }));
  });
  return frame("account-card", "Account Card", 16, 480, width, 100, children, {
    fill: C.surface,
    cornerRadius: IOS.metrics.cardRadius,
    effects: IOS.elevation.card
  });
}
function buildIosScreen(device) {
  const width = device.width;
  const status = statusBar("screen-status", "dark", device);
  const tabs = tabBar(device);
  tabs.y = device.height - device.tabBarTotalHeight;
  const search = frame(
    "search-field",
    "Search Field",
    16,
    154,
    width - 32,
    36,
    [
      ellipse("search-icon", "Search glyph", 12, 11, 13, 13, { stroke: C.secondaryLabel, strokeWidth: 1.5 }),
      lineNode("search-icon-handle", "Search handle", 22, 23, 6, { color: C.secondaryLabel, width: 1.5, rotation: 45 }),
      text("search-placeholder", "Placeholder", 32, 8, 220, "Search settings", "subheadline", C.secondaryLabel)
    ],
    { fill: C.fill, cornerRadius: 10 }
  );
  return frame(
    "screen-root",
    "iOS Screen",
    0,
    0,
    width,
    device.height,
    [
      status,
      text("screen-title", "Large Title", 16, 72, width - 50, "Settings", "largeTitle", C.label),
      text("screen-subtitle", "Subtitle", 16, 124, width - 50, "Manage your account and app preferences", "subheadline", C.secondaryLabel),
      search,
      text("section-general", "Section Label", 16, 212, 200, "GENERAL", "caption1", C.secondaryLabel),
      listRowCard(device),
      text("section-account", "Section Label", 16, 454, 200, "ACCOUNT", "caption1", C.secondaryLabel),
      accountCard(device),
      tabs
    ],
    { fill: C.background, clip: true }
  );
}
function field(device, id2, name, y, label, placeholder) {
  const width = device.width - 32;
  return frame(id2, name, 16, y, width, 68, [
    text(`${id2}-label`, `${name} label`, 0, 0, width, label, "caption1", C.secondaryLabel),
    rect(`${id2}-box`, `${name} box`, 0, 20, width, 48, { fill: C.fill, cornerRadius: 10 }),
    text(`${id2}-placeholder`, `${name} placeholder`, 14, 34, width - 28, placeholder, "body", C.secondaryLabel)
  ], { clip: false });
}
function primaryButton(device, id2, y, label) {
  const width = device.width - 32;
  return frame(id2, "Primary Button", 16, y, width, 52, [
    rect(`${id2}-bg`, "Button background", 0, 0, width, 52, { fill: C.blue, cornerRadius: 12 }),
    text(`${id2}-label`, "Button label", 0, 16, width, label, "body", C.onBlue, { align: "center" })
  ], { clip: false });
}
function buildFormScreen(device) {
  const width = device.width;
  const height = device.height;
  return frame(
    "form-root",
    "iOS Form Screen",
    0,
    0,
    width,
    height,
    [
      statusBar("form-status", "dark", device),
      text("form-title", "Title", 16, 80, width - 32, "Create account", "largeTitle", C.label),
      text("form-subtitle", "Subtitle", 16, 130, width - 32, "Start by adding your details.", "subheadline", C.secondaryLabel),
      field(device, "form-name", "Name", 180, "NAME", "Your name"),
      field(device, "form-email", "Email", 260, "EMAIL", "you@example.com"),
      field(device, "form-password", "Password", 340, "PASSWORD", "At least 8 characters"),
      primaryButton(device, "form-cta", height - 158, "Continue"),
      text("form-footnote", "Footnote", 16, height - 94, width - 32, "By continuing you agree to the terms.", "caption1", C.secondaryLabel, { align: "center" }),
      rect("form-home", "Home Indicator", (width - device.homeIndicatorWidth) / 2, height - 18, device.homeIndicatorWidth, device.homeIndicatorHeight, { fill: C.label, cornerRadius: 3 })
    ],
    { fill: C.background, clip: true }
  );
}
function buildListScreen(device) {
  const width = device.width;
  const height = device.height;
  const tabs = tabBar(device);
  tabs.y = height - device.tabBarTotalHeight;
  const rows = [
    ["A", "Alex Morgan", "Design review \xB7 2m"],
    ["M", "Mia Chen", "Shared a file \xB7 18m"],
    ["S", "Sam Rivera", "Lunch tomorrow? \xB7 1h"],
    ["J", "Jordan Lee", "Quarterly plan \xB7 3h"],
    ["T", "Taylor Kim", "Voice note \xB7 Yesterday"],
    ["N", "Noah Patel", "Deployment complete \xB7 Yesterday"]
  ];
  const cards = rows.map(([initial, name, preview], index) => {
    const y = 226 + index * 72;
    return frame(`list-row-${index}`, `List Row ${index + 1}`, 16, y, width - 32, 64, [
      ellipse(`list-avatar-${index}`, "Avatar", 0, 8, 48, 48, { fill: C.fill }),
      text(`list-initial-${index}`, "Avatar initial", 0, 18, 48, initial, "title2", C.secondaryLabel, { align: "center" }),
      text(`list-name-${index}`, "Name", 64, 8, width - 140, name, "headline", C.label),
      text(`list-preview-${index}`, "Preview", 64, 32, width - 140, preview, "subheadline", C.secondaryLabel),
      text(`list-chevron-${index}`, "Chevron", width - 80, 20, 16, "\u203A", "title3", C.tertiaryLabel, { align: "center" })
    ], { clip: false });
  });
  return frame(
    "list-root",
    "iOS List Screen",
    0,
    0,
    width,
    height,
    [
      statusBar("list-status", "dark", device),
      text("list-title", "Title", 16, 72, width - 32, "Inbox", "largeTitle", C.label),
      text("list-subtitle", "Subtitle", 16, 120, width - 32, "6 conversations", "subheadline", C.secondaryLabel),
      frame("list-search", "Search Field", 16, 154, width - 32, 36, [
        ellipse("list-search-icon", "Search glyph", 12, 11, 13, 13, { stroke: C.secondaryLabel, strokeWidth: 1.5 }),
        text("list-search-placeholder", "Placeholder", 32, 8, 220, "Search", "subheadline", C.secondaryLabel)
      ], { fill: C.fill, cornerRadius: 10 }),
      ...cards,
      tabs
    ],
    { fill: C.background, clip: true }
  );
}
function buildDetailScreen(device) {
  const width = device.width;
  const height = device.height;
  const nav = navBar(device, "Details");
  return frame(
    "detail-root",
    "iOS Detail Screen",
    0,
    0,
    width,
    height,
    [
      statusBar("detail-status", "dark", device),
      nav,
      rect("detail-hero", "Cover image", 0, 98, width, 240, { fill: C.fill }),
      text("detail-hero-label", "Cover label", 16, 200, width - 32, "Cover image", "headline", C.secondaryLabel, { align: "center" }),
      text("detail-title", "Title", 16, 360, width - 32, "A calmer way to start the day", "title1", C.label),
      text("detail-body", "Body", 16, 404, width - 32, "A short description of the story, collection or product. Replace this copy with real content.", "body", C.secondaryLabel),
      text("detail-meta", "Meta", 16, 478, width - 32, "5 min read \xB7 Today", "caption1", C.secondaryLabel),
      primaryButton(device, "detail-cta", height - 158, "Read story"),
      rect("detail-home", "Home Indicator", (width - device.homeIndicatorWidth) / 2, height - 18, device.homeIndicatorWidth, device.homeIndicatorHeight, { fill: C.label, cornerRadius: 3 })
    ],
    { fill: C.background, clip: true }
  );
}
function buildIosStatusBar(device) {
  return statusBar("tpl-status", "dark", device);
}
function buildIosStatusBarLight(device) {
  return statusBar("tpl-status-light", "light", device);
}
function buildIosNavBar(device) {
  return navBar(device);
}
function buildIosTabBar(device) {
  return tabBar(device);
}
var BUILDERS = {
  "ios-screen": buildIosScreen,
  "ios-form-screen": buildFormScreen,
  "ios-list-screen": buildListScreen,
  "ios-detail-screen": buildDetailScreen,
  "ios-status-bar": buildIosStatusBar,
  "ios-status-bar-light": buildIosStatusBarLight,
  "ios-nav-bar": buildIosNavBar,
  "ios-tab-bar": buildIosTabBar
};
var DEFAULT_SIZE = getDevice(DEFAULT_DEVICE);
var TEMPLATE_LIST = [
  { id: "ios-screen", name: "iOS \u5C4F\u5E55", description: "iPhone 16 393\xD7852\uFF1A\u72B6\u6001\u680F + \u7075\u52A8\u5C9B\u3001\u5927\u6807\u9898\u3001\u641C\u7D22\u3001\u8BBE\u7F6E\u5361\u7247\u3001\u6807\u7B7E\u680F\u3001Home Indicator", system: "iOS HIG", category: "page", width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.height, deviceAware: true },
  { id: "ios-form-screen", name: "iOS \u8868\u5355\u9875", description: "iPhone 16 393\xD7852\uFF1A\u72B6\u6001\u680F\u3001\u5927\u6807\u9898\u3001\u8F93\u5165\u5B57\u6BB5\u3001\u4E3B\u6309\u94AE\u3001Home Indicator", system: "iOS HIG", category: "page", width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.height, deviceAware: true },
  { id: "ios-list-screen", name: "iOS \u5217\u8868\u9875", description: "iPhone 16 393\xD7852\uFF1A\u72B6\u6001\u680F\u3001\u5927\u6807\u9898\u3001\u641C\u7D22\u3001\u5217\u8868\u884C\u3001\u6807\u7B7E\u680F", system: "iOS HIG", category: "page", width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.height, deviceAware: true },
  { id: "ios-detail-screen", name: "iOS \u8BE6\u60C5\u9875", description: "iPhone 16 393\xD7852\uFF1A\u72B6\u6001\u680F\u3001\u5BFC\u822A\u680F\u3001\u5C01\u9762\u533A\u3001\u6807\u9898\u6B63\u6587\u3001\u5E95\u90E8\u6309\u94AE", system: "iOS HIG", category: "page", width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.height, deviceAware: true },
  { id: "ios-status-bar", name: "iOS \u72B6\u6001\u680F", description: "\u6807\u51C6 390/393\xD754 \u72B6\u6001\u680F\uFF1A\u65F6\u95F4\u3001\u7075\u52A8\u5C9B\u3001\u4FE1\u53F7\u30015G\u3001\u7535\u91CF\uFF08\u900F\u660E\u80CC\u666F\uFF0C\u6DF1\u8272\u56FE\u6807\uFF09", system: "iOS HIG", category: "system", width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.statusBarHeight, deviceAware: true },
  { id: "ios-status-bar-light", name: "iOS \u72B6\u6001\u680F\uFF08\u6DF1\u8272\u9875\u9762\uFF09", description: "\u6807\u51C6\u72B6\u6001\u680F\u7684\u6D45\u8272\u56FE\u6807\u7248\u672C\uFF0C\u7528\u4E8E\u6DF1\u8272\u80CC\u666F\uFF08\u900F\u660E\u80CC\u666F\uFF09", system: "iOS HIG", category: "system", width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.statusBarHeight, deviceAware: true },
  { id: "ios-nav-bar", name: "iOS \u5BFC\u822A\u680F", description: "iOS \u5BFC\u822A\u680F\uFF1A\u8FD4\u56DE\u3001\u6807\u9898\u3001\u53F3\u4FA7\u52A8\u4F5C", system: "iOS HIG", category: "system", width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.navBarHeight, deviceAware: true },
  { id: "ios-tab-bar", name: "iOS \u6807\u7B7E\u680F", description: "iOS \u6807\u7B7E\u680F\uFF1A5 \u4E2A Tab + Home Indicator", system: "iOS HIG", category: "system", width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.tabBarTotalHeight, deviceAware: true }
];
function instantiateTemplate(id2, options = {}) {
  const template = TEMPLATE_LIST.find((entry) => entry.id === id2);
  const builder = BUILDERS[id2];
  if (!template || !builder) throw new Error(`unknown canvas template "${id2}"`);
  const device = getDevice(options.device);
  const node = builder(device);
  const prefix = `tpl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  let counter = 0;
  const remap = (current) => {
    current.id = `${prefix}_${(++counter).toString(36)}`;
    if (Array.isArray(current.children)) current.children.forEach(remap);
    return current;
  };
  remap(node);
  node.name = template.name;
  node.rotation = 0;
  return {
    node,
    template: {
      ...template,
      width: node.width,
      height: node.height,
      device: device.id
    }
  };
}
function listTemplates(deviceId = DEFAULT_DEVICE) {
  const device = getDevice(deviceId);
  return TEMPLATE_LIST.map((entry) => ({
    ...entry,
    width: device.width,
    height: entry.category === "page" ? device.height : entry.height,
    device: device.id
  }));
}

// src/shared/audit.ts
var AUDIT_CHECKS = [
  "screenshot-boundary",
  "contrast",
  "touch-target",
  "clipped-child",
  "zero-size",
  "missing-refs",
  "unresolved-comments",
  "empty-frame"
];
var BASE_SKIPPED = ["runtime interaction", "state coverage"];
var TOUCH_TARGET_RE = /button|btn|tab|nav|action|toggle|checkbox|radio|close|icon|link/i;
var IMAGE_ASSET_RE = /^assets\/[A-Za-z0-9._-]{1,120}$/;
var IOS_TOUCH_TARGET = 44;
var MATERIAL3_TOUCH_TARGET = 48;
var BODY_CONTRAST = 4.5;
var LARGE_CONTRAST = 3;
var DEFAULT_PAGE_BACKGROUND = "#FFFFFF";
var DEFAULT_FONT_SIZE = 14;
var DEFAULT_FONT_WEIGHT = 400;
var EPSILON = 1e-6;
var ALPHA_EPSILON = 1e-9;
var STYLE_REFS = [
  ["fillStyleId", "fill"],
  ["textStyleId", "text"],
  ["effectStyleId", "effect"]
];
function auditDoc(doc, options = {}) {
  if (!isRecord(doc)) throw new TypeError("auditDoc: expected a document object");
  if (options == null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("auditDoc: options must be an object");
  }
  const pages = Array.isArray(doc.pages) ? doc.pages : [];
  if (pages.length === 0) throw new Error("auditDoc: document has no pages");
  const page = selectPage(pages, options);
  const records = indexPage(page);
  const recordByNode = new Map(records.map((record) => [record.node, record]));
  let targetRecord = null;
  if (options.nodeId != null) {
    targetRecord = records.find((record) => record.node.id === options.nodeId) ?? null;
    if (!targetRecord) throw new Error(`auditDoc: unknown node "${String(options.nodeId)}"`);
  }
  const scopeRecords = targetRecord ? scopeOf(targetRecord, records) : records;
  const scopeNodes = new Set(scopeRecords.map((record) => record.node));
  const rootFrames = targetRecord ? targetRecord.node.type === "frame" ? [targetRecord.node] : [] : (Array.isArray(page.children) ? page.children : []).filter((node) => isRecord(node) && node.type === "frame");
  const stylesById = mapById(doc.styles);
  const componentsById = mapById(doc.components);
  const system = options.system === "ios" ? "ios" : "material3";
  const findings = [];
  const skipped = new Set(BASE_SKIPPED);
  if (scopeRecords.some((record) => record.node.type === "instance")) {
    skipped.add("component instance contents");
  }
  runScreenshotBoundary(rootFrames, recordByNode, stylesById, findings);
  runContrast(scopeRecords, page, stylesById, skipped, findings);
  runTouchTargets(scopeRecords, componentsById, system, findings);
  runClippedChildren(scopeRecords, recordByNode, findings);
  runZeroSize(scopeRecords, findings);
  runMissingRefs(scopeNodes, componentsById, stylesById, findings);
  runUnresolvedComments(doc, page, targetRecord, scopeNodes, findings);
  runEmptyFrames(rootFrames, recordByNode, findings);
  return { findings, checked: [...AUDIT_CHECKS], skipped: [...skipped] };
}
function selectPage(pages, options) {
  if (options.pageId != null) {
    const page2 = pages.find((entry) => isRecord(entry) && entry.id === options.pageId);
    if (!page2) throw new Error(`auditDoc: unknown page "${String(options.pageId)}"`);
    if (options.nodeId != null && !findNode(page2, options.nodeId)) {
      throw new Error(`auditDoc: unknown node "${String(options.nodeId)}"`);
    }
    return page2;
  }
  if (options.nodeId != null) {
    const page2 = pages.find((entry) => isRecord(entry) && findNode(entry, options.nodeId));
    if (!page2) throw new Error(`auditDoc: unknown node "${String(options.nodeId)}"`);
    return page2;
  }
  const page = pages.find(isRecord);
  if (!page) throw new Error("auditDoc: document has no pages");
  return page;
}
function findNode(root, nodeId) {
  if (!isRecord(root)) return null;
  if (root.id === nodeId) return root;
  if (!Array.isArray(root.children)) return null;
  for (const child of root.children) {
    const found = findNode(child, nodeId);
    if (found) return found;
  }
  return null;
}
function indexPage(page) {
  const records = [];
  const seen = /* @__PURE__ */ new WeakSet();
  const visit = (node, ancestors, parent, inheritedVisible, inheritedOpacity) => {
    if (!isRecord(node) || seen.has(node)) return;
    seen.add(node);
    const visible = inheritedVisible && node.visible !== false;
    const opacity = inheritedOpacity * clamp01(numberOr(node.opacity, 1));
    records.push({ node, ancestors, parent, visible, opacity });
    if (!Array.isArray(node.children)) return;
    for (const child of node.children) {
      visit(child, [...ancestors, node], node, visible, opacity);
    }
  };
  for (const root of Array.isArray(page.children) ? page.children : []) {
    visit(root, [], null, true, 1);
  }
  return records;
}
function scopeOf(targetRecord, records) {
  const target = targetRecord.node;
  return records.filter((record) => record.node === target || record.ancestors.includes(target));
}
function mapById(list) {
  const map = /* @__PURE__ */ new Map();
  if (!Array.isArray(list)) return map;
  for (const entry of list) {
    if (isRecord(entry) && typeof entry.id === "string") map.set(entry.id, entry);
  }
  return map;
}
function runScreenshotBoundary(rootFrames, recordByNode, stylesById, findings) {
  for (const frame2 of rootFrames) {
    const record = recordByNode.get(frame2);
    if (record && !record.visible) continue;
    const radius = numberOr(frame2.cornerRadius, 0);
    const fills = resolvedFills(frame2, stylesById);
    const first = fills[0] ?? null;
    const color2 = first && first.type === "solid" ? parseColor(first.color) : null;
    const alpha = color2 ? clamp01(color2.a * fillOpacity(first) * nodeOpacity(frame2)) : 0;
    const opaqueGradient = first && (first.type === "linear-gradient" || first.type === "radial-gradient") && gradientIsOpaque(first);
    const rounded = radius > 0;
    const opaque = alpha >= 1 - ALPHA_EPSILON || Boolean(opaqueGradient);
    if (!rounded && opaque) continue;
    const reasons = [];
    if (rounded) reasons.push(`corner radius ${formatNumber(radius)}`);
    if (!opaque) {
      if (!first) reasons.push("no first fill");
      else if (first.type !== "solid") reasons.push(`first fill is ${first.type}`);
      else reasons.push(`first fill alpha ${formatNumber(alpha)}`);
    }
    findings.push(
      finding("high", "screenshot-boundary", frame2, `Screenshot frame ${quote(nameOf(frame2))} is not screenshot-ready: ${reasons.join(" and ")}.`, {
        cornerRadius: round2(radius, 2),
        rounded,
        fillType: first ? first.type : null,
        alpha: round2(alpha, 3),
        opaque
      })
    );
  }
}
function runContrast(scopeRecords, page, stylesById, skipped, findings) {
  for (const record of scopeRecords) {
    const node = record.node;
    if (node.type !== "text" || !record.visible) continue;
    const content = typeof node.text === "string" ? node.text : "";
    if (content.trim() === "") continue;
    const fills = resolvedFills(node, stylesById);
    const first = fills[0];
    if (!first) continue;
    if (first.type !== "solid") {
      skipped.add("gradient/image backgrounds");
      continue;
    }
    const fillColor = parseColor(first.color);
    if (!fillColor) continue;
    if (record.opacity < 1 - ALPHA_EPSILON) {
      skipped.add("opacity/blur");
      continue;
    }
    if (hasBlur(node, stylesById) || record.ancestors.some((ancestor) => hasBlur(ancestor, stylesById))) {
      skipped.add("opacity/blur");
      continue;
    }
    if (isDecorativeText(node, content)) {
      skipped.add("decorative text");
      continue;
    }
    const textAlpha = clamp01(fillColor.a * fillOpacity(first));
    if (textAlpha <= 0) {
      skipped.add("opacity/blur");
      continue;
    }
    const background = resolveBackdrop(record, page, stylesById, skipped);
    if (!background) continue;
    const foreground = compositeOver({ ...fillColor, a: textAlpha }, background);
    const ratio = contrastRatio(foreground, background);
    const font = resolvedFont(node, stylesById);
    const largeText = isLargeText(font);
    const required = largeText ? LARGE_CONTRAST : BODY_CONTRAST;
    if (ratio + ALPHA_EPSILON >= required) continue;
    const ratioRounded = round2(ratio, 2);
    findings.push(
      finding(
        largeText ? "medium" : "high",
        "contrast",
        node,
        `Text ${quote(nameOf(node))} has ${ratioRounded.toFixed(2)}:1 contrast against ${colorToHex(background)}, below the ${required}:1 minimum for ${largeText ? "large" : "body"} text.`,
        {
          ratio: ratioRounded,
          required,
          largeText,
          fontSize: round2(font.size, 2),
          fontWeight: font.weight,
          foreground: colorToHex(foreground),
          background: colorToHex(background)
        }
      )
    );
  }
}
function isDecorativeText(node, content) {
  const name = String(node?.name ?? "");
  if (/sparkle|heart|decoration|ornament/i.test(name)) return true;
  const trimmed = String(content ?? "").trim();
  return trimmed.length <= 2 && /[✦✧♥♡✓✔]/u.test(trimmed);
}
function gradientIsOpaque(fill) {
  const stops = Array.isArray(fill?.stops) ? fill.stops : [];
  if (!stops.length) return false;
  return stops.every((stop) => {
    if (!isRecord(stop)) return false;
    const color2 = parseColor(stop.color);
    return color2 != null && color2.a >= 1 - ALPHA_EPSILON;
  });
}
function resolveSiblingBackdrop(record, stylesById) {
  const parent = record.parent;
  if (!parent || !Array.isArray(parent.children)) return null;
  const index = parent.children.indexOf(record.node);
  if (index <= 0) return null;
  const node = record.node;
  const center = {
    x: numberOr(node.x, 0) + numberOr(node.width, 0) / 2,
    y: numberOr(node.y, 0) + numberOr(node.height, 0) / 2
  };
  for (let siblingIndex = index - 1; siblingIndex >= 0; siblingIndex -= 1) {
    const sibling = parent.children[siblingIndex];
    if (!isRecord(sibling) || sibling.visible === false) continue;
    if (!["rect", "frame", "ellipse"].includes(sibling.type)) continue;
    const x = numberOr(sibling.x, 0);
    const y = numberOr(sibling.y, 0);
    const width = numberOr(sibling.width, 0);
    const height = numberOr(sibling.height, 0);
    if (width <= 0 || height <= 0) continue;
    if (center.x < x || center.x > x + width || center.y < y || center.y > y + height) continue;
    const first = resolvedFills(sibling, stylesById)[0];
    if (!first || first.type !== "solid") continue;
    const color2 = parseColor(first.color);
    if (!color2) continue;
    const alpha = clamp01(color2.a * fillOpacity(first) * nodeOpacity(sibling));
    if (alpha < 1 - ALPHA_EPSILON) continue;
    return { r: color2.r, g: color2.g, b: color2.b };
  }
  return null;
}
function resolveBackdrop(record, page, stylesById, skipped) {
  const sibling = resolveSiblingBackdrop(record, stylesById);
  if (sibling) return sibling;
  for (let index = record.ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = record.ancestors[index];
    const first = resolvedFills(ancestor, stylesById)[0];
    if (!first) continue;
    if (first.type !== "solid") {
      skipped.add("gradient/image backgrounds");
      return null;
    }
    const color2 = parseColor(first.color);
    if (!color2) return null;
    const alpha = clamp01(color2.a * fillOpacity(first) * pathOpacity(record.ancestors, index));
    if (alpha < 1 - ALPHA_EPSILON) {
      skipped.add("opacity/blur");
      return null;
    }
    return { r: color2.r, g: color2.g, b: color2.b };
  }
  return pageBackdrop(page);
}
function pageBackdrop(page) {
  const raw = isRecord(page) && typeof page.background === "string" ? parseColor(page.background) : null;
  const white = parseColor(DEFAULT_PAGE_BACKGROUND);
  if (!raw) return white;
  if (raw.a >= 1 - ALPHA_EPSILON) return { r: raw.r, g: raw.g, b: raw.b };
  return compositeOver(raw, white);
}
function pathOpacity(ancestors, endIndex) {
  let value = 1;
  for (let index = 0; index <= endIndex; index += 1) {
    value *= clamp01(numberOr(ancestors[index]?.opacity, 1));
  }
  return value;
}
function resolvedFont(node, stylesById) {
  let font = isRecord(node.font) ? node.font : {};
  if (node.textStyleId != null) {
    const style = stylesById.get(node.textStyleId);
    if (style && style.type === "text" && isRecord(style.value) && isRecord(style.value.font)) {
      font = { ...font, ...style.value.font };
    }
  }
  return {
    ...font,
    size: numberOr(font.size, DEFAULT_FONT_SIZE),
    weight: numberOr(font.weight, DEFAULT_FONT_WEIGHT)
  };
}
function isLargeText(font) {
  return font.size >= 24 || font.size >= 18.66 && font.weight >= 700;
}
function runTouchTargets(scopeRecords, componentsById, system, findings) {
  const minimum = system === "ios" ? IOS_TOUCH_TARGET : MATERIAL3_TOUCH_TARGET;
  for (const record of scopeRecords) {
    if (!record.visible) continue;
    const node = record.node;
    const width = finiteNumber(node.width);
    const height = finiteNumber(node.height);
    if (width == null || height == null) continue;
    const match = matchInteractiveName(node, componentsById);
    if (!match) continue;
    if (width >= minimum && height >= minimum) continue;
    findings.push(
      finding(
        "medium",
        "touch-target",
        node,
        `${quote(nameOf(node))} is ${formatNumber(width)}x${formatNumber(height)}, smaller than the ${minimum}x${minimum} minimum touch target (${system} heuristic).`,
        {
          system,
          minSize: minimum,
          width: round2(width, 2),
          height: round2(height, 2),
          matchedOn: match.source,
          matchedText: match.text,
          matchedKeyword: match.keyword,
          heuristic: true,
          note: "Heuristic: the node name or its source component name matched an interactive pattern; only the node box is measured, not the real hit area."
        }
      )
    );
  }
}
function matchInteractiveName(node, componentsById) {
  const candidates = [];
  if (typeof node.name === "string") candidates.push({ source: "name", text: node.name });
  if (node.type === "instance" && typeof node.componentId === "string") {
    const component = componentsById.get(node.componentId);
    if (component && typeof component.name === "string") {
      candidates.push({ source: "componentName", text: component.name });
    }
  }
  for (const candidate of candidates) {
    const match = TOUCH_TARGET_RE.exec(candidate.text);
    if (match) return { ...candidate, keyword: match[0] };
  }
  return null;
}
function runClippedChildren(scopeRecords, recordByNode, findings) {
  for (const record of scopeRecords) {
    const frame2 = record.node;
    if (frame2.type !== "frame" || frame2.clip === false || !record.visible) continue;
    const frameWidth = finiteNumber(frame2.width);
    const frameHeight = finiteNumber(frame2.height);
    if (frameWidth == null || frameHeight == null) continue;
    for (const child of Array.isArray(frame2.children) ? frame2.children : []) {
      if (!isRecord(child)) continue;
      const childRecord = recordByNode.get(child);
      if (!childRecord || !childRecord.visible) continue;
      const x = numberOr(child.x, 0);
      const y = numberOr(child.y, 0);
      const width = finiteNumber(child.width);
      const height = finiteNumber(child.height);
      if (width == null || height == null) continue;
      const overflow = {
        left: Math.max(0, -x),
        top: Math.max(0, -y),
        right: Math.max(0, x + width - frameWidth),
        bottom: Math.max(0, y + height - frameHeight)
      };
      if (Math.max(overflow.left, overflow.top, overflow.right, overflow.bottom) <= EPSILON) continue;
      const parts = [];
      if (overflow.left > EPSILON) parts.push(`left ${formatNumber(overflow.left)}`);
      if (overflow.top > EPSILON) parts.push(`top ${formatNumber(overflow.top)}`);
      if (overflow.right > EPSILON) parts.push(`right ${formatNumber(overflow.right)}`);
      if (overflow.bottom > EPSILON) parts.push(`bottom ${formatNumber(overflow.bottom)}`);
      findings.push(
        finding(
          "low",
          "clipped-child",
          child,
          `${quote(nameOf(child))} overflows clipping frame ${quote(nameOf(frame2))} (${parts.join(", ")}); this may be intentional.`,
          {
            frameId: typeof frame2.id === "string" ? frame2.id : "",
            frameName: nameOf(frame2),
            overflow: {
              left: round2(overflow.left, 3),
              top: round2(overflow.top, 3),
              right: round2(overflow.right, 3),
              bottom: round2(overflow.bottom, 3)
            }
          }
        )
      );
    }
  }
}
function runZeroSize(scopeRecords, findings) {
  for (const record of scopeRecords) {
    if (!record.visible) continue;
    const node = record.node;
    const width = finiteNumber(node.width);
    const height = finiteNumber(node.height);
    if (width == null || height == null) continue;
    if (node.type === "line" && width > 0) continue;
    if (width > 0 && height > 0) continue;
    const axis = width <= 0 && height <= 0 ? "both" : width <= 0 ? "width" : "height";
    findings.push(
      finding("medium", "zero-size", node, `${quote(nameOf(node))} has zero size (${formatNumber(width)}x${formatNumber(height)}) and will not render.`, {
        width: round2(width, 2),
        height: round2(height, 2),
        axis
      })
    );
  }
}
function runMissingRefs(scopeNodes, componentsById, stylesById, findings) {
  for (const node of scopeNodes) {
    if (node.type === "instance") {
      const componentId = typeof node.componentId === "string" ? node.componentId : null;
      if (!componentId || !componentsById.has(componentId)) {
        findings.push(
          finding(
            "high",
            "missing-refs",
            node,
            componentId ? `Instance ${quote(nameOf(node))} references unknown component "${componentId}".` : `Instance ${quote(nameOf(node))} has no componentId.`,
            {
              reference: "componentId",
              componentId,
              reason: componentId ? "unknown" : "missing"
            }
          )
        );
      }
    }
    for (const [reference, expectedType] of STYLE_REFS) {
      const styleId2 = node[reference];
      if (styleId2 == null) continue;
      if (!stylesById.has(styleId2)) {
        findings.push(
          finding("high", "missing-refs", node, `${quote(nameOf(node))} references unknown ${expectedType} style "${String(styleId2)}".`, {
            reference,
            styleId: String(styleId2),
            expectedType
          })
        );
      }
    }
    const fills = resolvedFills(node, stylesById);
    for (let index = 0; index < fills.length; index += 1) {
      const fill = fills[index];
      if (!isRecord(fill) || fill.type !== "image") continue;
      if (typeof fill.asset !== "string" || fill.asset.trim() === "") {
        findings.push(
          finding("high", "missing-refs", node, `${quote(nameOf(node))} has an image fill without an asset reference.`, {
            reference: "image.asset",
            fillIndex: index,
            asset: null,
            reason: "missing"
          })
        );
      } else if (!IMAGE_ASSET_RE.test(fill.asset) || fill.asset.includes("..")) {
        findings.push(
          finding("high", "missing-refs", node, `${quote(nameOf(node))} has an image fill with an invalid asset path "${fill.asset}".`, {
            reference: "image.asset",
            fillIndex: index,
            asset: fill.asset,
            reason: "invalid"
          })
        );
      }
    }
  }
}
function runUnresolvedComments(doc, page, targetRecord, scopeNodes, findings) {
  const comments = Array.isArray(doc.comments) ? doc.comments.filter(isRecord) : [];
  const scopeNodeIds = /* @__PURE__ */ new Set();
  for (const node of scopeNodes) if (typeof node.id === "string") scopeNodeIds.add(node.id);
  const inScope = targetRecord ? comments.filter((comment) => typeof comment.nodeId === "string" && scopeNodeIds.has(comment.nodeId)) : comments.filter((comment) => comment.pageId === page.id);
  const unresolved = inScope.filter((comment) => comment.resolved !== true);
  if (unresolved.length === 0) return;
  const anchor = targetRecord ? targetRecord.node : page;
  const commentIds = unresolved.map((comment) => typeof comment.id === "string" ? comment.id : null);
  const where = targetRecord ? `in node ${quote(nameOf(anchor))} and its subtree` : `on page ${quote(nameOf(page))}`;
  findings.push(
    finding(
      "low",
      "unresolved-comments",
      anchor,
      `${unresolved.length} unresolved comment${unresolved.length === 1 ? "" : "s"} ${where}.`,
      {
        count: unresolved.length,
        commentIds,
        scope: targetRecord ? "node" : "page"
      }
    )
  );
}
function runEmptyFrames(rootFrames, recordByNode, findings) {
  for (const frame2 of rootFrames) {
    const record = recordByNode.get(frame2);
    if (record && !record.visible) continue;
    const children = Array.isArray(frame2.children) ? frame2.children : [];
    const visibleChildren = children.filter((child) => {
      if (!isRecord(child)) return false;
      const childRecord = recordByNode.get(child);
      return childRecord ? childRecord.visible : child.visible !== false;
    });
    if (visibleChildren.length > 0) continue;
    findings.push(
      finding("low", "empty-frame", frame2, `Frame ${quote(nameOf(frame2))} has no visible children.`, {
        childCount: children.length,
        visibleChildCount: 0
      })
    );
  }
}
function resolvedFills(node, stylesById) {
  if (!isRecord(node)) return [];
  if (node.fillStyleId != null) {
    const style = stylesById.get(node.fillStyleId);
    if (style && style.type === "fill" && isRecord(style.value)) return [style.value];
  }
  if (node.type === "text" && node.textStyleId != null) {
    const style = stylesById.get(node.textStyleId);
    if (style && style.type === "text" && isRecord(style.value) && Array.isArray(style.value.fills)) {
      return style.value.fills;
    }
  }
  return Array.isArray(node.fills) ? node.fills : [];
}
function resolvedEffects(node, stylesById) {
  if (!isRecord(node)) return [];
  if (node.effectStyleId != null) {
    const style = stylesById.get(node.effectStyleId);
    if (style && style.type === "effect" && Array.isArray(style.value)) return style.value;
  }
  return Array.isArray(node.effects) ? node.effects : [];
}
function hasBlur(node, stylesById) {
  return resolvedEffects(node, stylesById).some(
    (effect) => isRecord(effect) && effect.visible !== false && (effect.type === "layer-blur" || effect.type === "background-blur") && numberOr(effect.radius, 0) > 0
  );
}
function fillOpacity(fill) {
  return clamp01(numberOr(fill?.opacity, 1));
}
function nodeOpacity(node) {
  return clamp01(numberOr(node?.opacity, 1));
}
function parseColor(value) {
  if (typeof value !== "string") return null;
  const match = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(value.trim());
  if (!match) return null;
  const hex = match[1];
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
    a: match[2] ? Number.parseInt(match[2], 16) / 255 : 1
  };
}
function compositeOver(foreground, background) {
  const alpha = clamp01(foreground.a);
  return {
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha)
  };
}
function relativeLuminance(color2) {
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(color2.r) + 0.7152 * channel(color2.g) + 0.0722 * channel(color2.b);
}
function contrastRatio(a, b) {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}
function colorToHex(color2) {
  const channel = (value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0").toUpperCase();
  return `#${channel(color2.r)}${channel(color2.g)}${channel(color2.b)}`;
}
function finding(severity, code, node, message, data) {
  const nodeId = isRecord(node) && typeof node.id === "string" ? node.id : "";
  const nodeName = nameOf(node);
  const result = { severity, code, nodeId, nodeName, message };
  if (data !== void 0) result.data = data;
  return result;
}
function nameOf(node) {
  if (isRecord(node) && typeof node.name === "string" && node.name !== "") return node.name;
  if (isRecord(node) && typeof node.id === "string") return node.id;
  return "";
}
function quote(value) {
  return JSON.stringify(value);
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function numberOr(value, fallback) {
  return finiteNumber(value) ?? fallback;
}
function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
function round2(value, digits) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
function formatNumber(value) {
  return String(round2(value, 3));
}

// src/host/image.ts
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { access, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, delimiter, extname, isAbsolute, join, resolve } from "node:path";
var DEFAULT_PROBE_TIMEOUT_MS = 1e4;
var DEFAULT_GENERATE_TIMEOUT_MS = 18e4;
var MAX_CAPTURE_CHARS = 128 * 1024;
var MAX_TAIL_CHARS = 4e3;
var MAX_VERSION_CHARS = 200;
var KILL_GRACE_MS = 1e3;
var FALLBACK_CLOSE_MS = 3e3;
var MTIME_TOLERANCE_MS = 2e3;
var MAX_SCAN_DEPTH = 4;
var IMAGE_LIMIT_MIB = Math.round(LIMITS.imageBytes / (1024 * 1024));
var NATIVE_IMAGE_RE = /(?:^|[^a-z0-9])(?:gpt|chatgpt|openai|o[1-9])(?=$|[^a-z])/i;
var PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
var GENERATED_EXTENSIONS = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp"]);
var GENERATED_KINDS = /* @__PURE__ */ new Set(["png", "jpeg", "webp"]);
var EXTENSION_BY_KIND = { png: ".png", jpeg: ".jpg", webp: ".webp", gif: ".gif" };
var EXTENSIONS_BY_KIND = {
  png: /* @__PURE__ */ new Set([".png"]),
  jpeg: /* @__PURE__ */ new Set([".jpg", ".jpeg"]),
  webp: /* @__PURE__ */ new Set([".webp"]),
  gif: /* @__PURE__ */ new Set([".gif"])
};
function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}
function mergedEnv(overrides) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== void 0) env[key] = value;
  }
  if (overrides && typeof overrides === "object") {
    for (const [key, value] of Object.entries(overrides)) {
      if (value === void 0) continue;
      env[key] = String(value);
    }
  }
  return env;
}
function normalizeTimeout(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return Math.floor(number);
}
function requestedCodexBin(codexBin, env) {
  if (typeof codexBin === "string" && codexBin.trim()) return codexBin.trim();
  const configured = env.DSH_CANVAS_CODEX_BIN;
  if (typeof configured === "string" && configured.trim()) return configured.trim();
  return "codex";
}
function looksLikePath(value) {
  return isAbsolute(value) || value.includes("/") || value.includes("\\") || /^[A-Za-z]:/.test(value);
}
async function isRegularFile(file) {
  try {
    const info = await stat(file);
    return info.isFile();
  } catch {
    return false;
  }
}
async function isExecutableFile(file) {
  if (!await isRegularFile(file)) return false;
  try {
    await access(file, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}
async function lookupBinary(command, env) {
  if (!command) return null;
  if (looksLikePath(command)) {
    const file = resolve(command);
    return await isRegularFile(file) ? file : null;
  }
  const pathValue = env.PATH ?? env.Path ?? env.path ?? "";
  const extensions = process.platform === "win32" ? ["", ...String(env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";").filter(Boolean)] : [""];
  for (const directory of String(pathValue).split(delimiter)) {
    if (!directory) continue;
    for (const extension of extensions) {
      const candidate = join(directory, command + extension);
      if (await isExecutableFile(candidate)) return resolve(candidate);
    }
  }
  return null;
}
function stripAnsi(value) {
  return String(value ?? "").replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "");
}
function rawOutputTail(...parts) {
  const text2 = parts.map((part) => stripAnsi(part)).filter((part) => part.trim()).join("\n").trim();
  return text2.length > MAX_TAIL_CHARS ? text2.slice(-MAX_TAIL_CHARS) : text2;
}
function failure(code, message, stdout = "", stderr = "") {
  const result = { ok: false, code, message };
  const tail = rawOutputTail(stdout, stderr);
  if (tail) result.rawOutputTail = tail;
  return result;
}
function capText(value, limit = MAX_CAPTURE_CHARS) {
  if (typeof value !== "string") return "";
  return value.length > limit ? value.slice(0, limit) : value;
}
function toText(value) {
  if (typeof value === "string") return value;
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  if (value == null) return "";
  return String(value);
}
function captureStream(stream, state2) {
  if (!stream || typeof stream.on !== "function") return;
  stream.on("data", (chunk) => {
    const text2 = Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
    if (state2.text.length < MAX_CAPTURE_CHARS) {
      state2.text += text2.slice(0, MAX_CAPTURE_CHARS - state2.text.length);
    }
  });
  stream.on("error", () => {
  });
}
function normalizeRunnerResult(value) {
  if (value == null) return { spawnError: new Error("spawnImpl returned no result") };
  if (typeof value === "number") return { exitCode: value };
  if (typeof value === "string" || Buffer.isBuffer(value)) return { exitCode: 0, stdout: toText(value) };
  if (typeof value !== "object") return { spawnError: new Error("spawnImpl returned an invalid result") };
  let exitCode = 0;
  if (Number.isInteger(value.exitCode)) exitCode = value.exitCode;
  else if (Number.isInteger(value.code)) exitCode = value.code;
  else if (value.ok === false) exitCode = 1;
  const spawnError = value.error instanceof Error ? value.error : value.error != null ? new Error(String(value.error)) : null;
  return {
    exitCode,
    signal: value.signal ?? null,
    timedOut: value.timedOut === true,
    spawnError,
    stdout: toText(value.stdout),
    stderr: toText(value.stderr)
  };
}
function runCommand(command, args, options = {}) {
  const { timeoutMs = DEFAULT_PROBE_TIMEOUT_MS, cwd, env, spawnImpl = spawn } = options;
  return new Promise((resolvePromise) => {
    const stdout = { text: "" };
    const stderr = { text: "" };
    let child = null;
    let timedOut = false;
    let settled = false;
    let timer = null;
    let killTimer = null;
    let fallbackTimer = null;
    const clearTimers = () => {
      if (timer) clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      timer = null;
      killTimer = null;
      fallbackTimer = null;
    };
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimers();
      resolvePromise({
        // `ok` means the process itself succeeded; callers still validate the
        // artifacts it wrote.
        ok: !timedOut && !result.spawnError && !result.timedOut && result.exitCode === 0,
        exitCode: Number.isInteger(result.exitCode) ? result.exitCode : null,
        signal: result.signal ?? null,
        timedOut: timedOut || result.timedOut === true,
        spawnError: result.spawnError ?? null,
        stdout: result.stdout != null ? capText(result.stdout) : stdout.text,
        stderr: result.stderr != null ? capText(result.stderr) : stderr.text
      });
    };
    const startTimeout = () => {
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return;
      timer = setTimeout(() => {
        timedOut = true;
        if (child && typeof child.kill === "function") {
          try {
            child.kill("SIGTERM");
          } catch {
          }
          killTimer = setTimeout(() => {
            try {
              child.kill("SIGKILL");
            } catch {
            }
          }, KILL_GRACE_MS);
          fallbackTimer = setTimeout(
            () => finish({ exitCode: null, signal: "SIGKILL", timedOut: true }),
            KILL_GRACE_MS + FALLBACK_CLOSE_MS
          );
        } else {
          finish({ exitCode: null, timedOut: true });
        }
      }, timeoutMs);
    };
    let returned;
    try {
      returned = spawnImpl(command, args, {
        cwd,
        env,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true
      });
    } catch (error) {
      finish({ spawnError: error instanceof Error ? error : new Error(String(error)) });
      return;
    }
    if (returned && typeof returned.then === "function") {
      startTimeout();
      returned.then(
        (value) => finish(normalizeRunnerResult(value)),
        (error) => finish({ spawnError: error instanceof Error ? error : new Error(String(error)) })
      );
      return;
    }
    child = returned;
    if (!child || typeof child.on !== "function") {
      finish({ spawnError: new Error("spawnImpl did not return a child process") });
      return;
    }
    captureStream(child.stdout, stdout);
    captureStream(child.stderr, stderr);
    child.on("error", (error) => finish({ spawnError: error instanceof Error ? error : new Error(String(error)) }));
    child.on("close", (code, signal) => finish({ exitCode: code, signal }));
    startTimeout();
  });
}
function sniffImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 6) return null;
  if (buffer.length >= PNG_SIGNATURE.length && buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    return "png";
  }
  if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return "jpeg";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "webp";
  }
  const head = buffer.toString("ascii", 0, 6);
  if (head === "GIF87a" || head === "GIF89a") return "gif";
  return null;
}
function extensionFor(kind, preferred) {
  const extension = typeof preferred === "string" ? preferred.toLowerCase() : "";
  const allowed = EXTENSIONS_BY_KIND[kind];
  if (allowed?.has(extension)) return extension;
  return EXTENSION_BY_KIND[kind] ?? ".bin";
}
function sanitizeStem(value) {
  let stem = String(value ?? "").split(/[\\/]/).pop() ?? "";
  stem = stem.replace(/\.(?:png|jpe?g|webp|gif)$/i, "");
  stem = stem.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/-{2,}/g, "-").replace(/^[._-]+|[._-]+$/g, "");
  if (stem.length > 64) stem = stem.slice(0, 64).replace(/[._-]+$/, "");
  return stem || "image";
}
async function storeImage({ buffer, assetDir, stem, preferredExt }) {
  const kind = sniffImage(buffer);
  if (!kind) throw new Error("not a supported image");
  const extension = extensionFor(kind, preferredExt);
  const safeStem = sanitizeStem(stem);
  const directory = resolve(assetDir);
  await mkdir(directory, { recursive: true });
  for (let index = 0; index < 1e3; index += 1) {
    const filename = `${safeStem}${index === 0 ? "" : `-${index}`}${extension}`;
    const hostPath = join(directory, filename);
    try {
      await writeFile(hostPath, buffer, { flag: "wx" });
      return { asset: `assets/${filename}`, hostPath, bytes: buffer.length };
    } catch (error) {
      if (error && typeof error === "object" && error.code === "EEXIST") continue;
      throw error;
    }
  }
  throw new Error("could not find a unique asset filename");
}
function imageStem(buffer) {
  return `image-${createHash("sha256").update(buffer).digest("hex").slice(0, 16)}`;
}
async function findGeneratedImages(root, startedAt) {
  const candidates = [];
  const walk = async (directory, depth) => {
    if (depth > MAX_SCAN_DEPTH) return;
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(full, depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!GENERATED_EXTENSIONS.has(extname(entry.name).toLowerCase())) continue;
      let info;
      try {
        info = await stat(full);
      } catch {
        continue;
      }
      if (!info.isFile()) continue;
      if (Number.isFinite(info.mtimeMs) && info.mtimeMs + MTIME_TOLERANCE_MS < startedAt) continue;
      candidates.push({ path: full, name: entry.name, mtimeMs: info.mtimeMs });
    }
  };
  await walk(root, 0);
  const preferred = join(root, "output.png");
  candidates.sort((a, b) => {
    const aPreferred = a.path === preferred ? 0 : 1;
    const bPreferred = b.path === preferred ? 0 : 1;
    if (aPreferred !== bPreferred) return aPreferred - bPreferred;
    if (a.mtimeMs !== b.mtimeMs) return a.mtimeMs - b.mtimeMs;
    return a.path.localeCompare(b.path);
  });
  return candidates;
}
function normalizeModelSelection(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const provider = typeof value.provider === "string" && value.provider.trim() ? value.provider.trim().slice(0, 120) : void 0;
  const model = typeof value.model === "string" && value.model.trim() ? value.model.trim().slice(0, 120) : void 0;
  if (!provider && !model) return null;
  const normalized = {};
  if (provider) normalized.provider = provider;
  if (model) normalized.model = model;
  return normalized;
}
function describeModel(model) {
  return `${model.provider ?? "unknown-provider"}/${model.model ?? "unknown-model"}`;
}
function firstLine(value) {
  const text2 = stripAnsi(value).trim();
  if (!text2) return void 0;
  const line = text2.split(/\r?\n/).find((entry) => entry.trim());
  return line ? line.trim().slice(0, MAX_VERSION_CHARS) : void 0;
}
function imageGenerationFeature(stdout, stderr) {
  const text2 = stripAnsi(`${stdout ?? ""}
${stderr ?? ""}`);
  let sawFeature = false;
  for (const line of text2.split(/\r?\n/)) {
    if (!line.includes("image_generation")) continue;
    sawFeature = true;
    if (/\bstable\b/i.test(line) && /\btrue\b/i.test(line)) return { enabled: true, sawFeature };
  }
  return { enabled: false, sawFeature };
}
async function probeCodex({ command, requested, resolved, timeoutMs, spawnImpl, env, notes }) {
  const codex = { available: false, imageGeneration: false };
  if (!command) {
    notes.push(`Codex CLI "${requested}" was not found. Install Codex or set DSH_CANVAS_CODEX_BIN.`);
    return codex;
  }
  codex.bin = command;
  let versionProbe;
  try {
    versionProbe = await runCommand(command, ["--version"], { timeoutMs, env, spawnImpl });
  } catch (error) {
    notes.push(`Could not run "${command} --version": ${messageOf(error)}.`);
    return codex;
  }
  if (versionProbe.spawnError) {
    if (versionProbe.spawnError.code === "ENOENT" && !resolved) {
      notes.push(`Codex CLI "${requested}" was not found. Install Codex or set DSH_CANVAS_CODEX_BIN.`);
    } else {
      notes.push(`Could not run "${command} --version": ${messageOf(versionProbe.spawnError)}.`);
    }
    return codex;
  }
  if (versionProbe.timedOut) {
    notes.push(`"${command} --version" timed out after ${timeoutMs} ms.`);
    return codex;
  }
  if (versionProbe.exitCode !== 0) {
    const tail = rawOutputTail(versionProbe.stdout, versionProbe.stderr);
    notes.push(
      `"${command} --version" exited with code ${versionProbe.exitCode}${tail ? `: ${tail}` : ""}.`
    );
    return codex;
  }
  codex.available = true;
  const version = firstLine(versionProbe.stdout || versionProbe.stderr);
  if (version) codex.version = version;
  else notes.push(`"${command} --version" returned no version text.`);
  let features;
  try {
    features = await runCommand(command, ["features", "list"], { timeoutMs, env, spawnImpl });
  } catch (error) {
    notes.push(`Could not read Codex features: ${messageOf(error)}. Image generation is unavailable.`);
    return codex;
  }
  if (features.spawnError) {
    notes.push(
      `Could not read Codex features: ${messageOf(features.spawnError)}. Image generation is unavailable.`
    );
    return codex;
  }
  if (features.timedOut) {
    notes.push(`"${command} features list" timed out after ${timeoutMs} ms. Image generation is unavailable.`);
    return codex;
  }
  if (features.exitCode !== 0) {
    const tail = rawOutputTail(features.stdout, features.stderr);
    notes.push(
      `"${command} features list" exited with code ${features.exitCode}${tail ? `: ${tail}` : ""}. Image generation is unavailable.`
    );
    return codex;
  }
  const feature = imageGenerationFeature(features.stdout, features.stderr);
  codex.imageGeneration = feature.enabled;
  if (feature.enabled) notes.push("Codex reports the image_generation feature as stable and enabled.");
  else if (feature.sawFeature) {
    notes.push('Codex lists image_generation, but not as stable and enabled (expected "stable true").');
  } else notes.push("Codex does not list an image_generation feature.");
  return codex;
}
async function detectImageCapabilities(options = {}) {
  const opts = options && typeof options === "object" ? options : {};
  const timeoutMs = normalizeTimeout(opts.timeoutMs, DEFAULT_PROBE_TIMEOUT_MS);
  const env = mergedEnv(opts.env);
  const model = normalizeModelSelection(opts.modelSelection);
  const nativeImage = model ? NATIVE_IMAGE_RE.test(`${model.provider ?? ""} ${model.model ?? ""}`.trim()) : false;
  const notes = [];
  if (!model) {
    notes.push("No model selection was provided; native image generation cannot be confirmed.");
  } else if (nativeImage) {
    notes.push(`Model ${describeModel(model)} looks GPT/OpenAI-like; native image generation is preferred.`);
  } else {
    notes.push(`Model ${describeModel(model)} does not look like a GPT/OpenAI model.`);
  }
  if (model && !model.model) {
    notes.push("The model selection has no model name, so native support is only a provider-level guess.");
  }
  let codex = { available: false, imageGeneration: false };
  try {
    const requested = requestedCodexBin(opts.codexBin, env);
    const resolved = await lookupBinary(requested, env);
    const command = resolved ?? (typeof opts.spawnImpl === "function" ? requested : null);
    codex = await probeCodex({
      command,
      requested,
      resolved: Boolean(resolved),
      timeoutMs,
      spawnImpl: opts.spawnImpl,
      env,
      notes
    });
  } catch (error) {
    notes.push(`Codex detection failed: ${messageOf(error)}.`);
  }
  const recommended = nativeImage ? "native" : codex.available && codex.imageGeneration ? "codex" : "none";
  if (recommended === "native") notes.push("Recommended: use native image generation on the active model.");
  else if (recommended === "codex") notes.push("Recommended: use Codex image generation through codex exec.");
  else notes.push("Recommended: no host-side image generation path; import an existing image instead.");
  return { model, nativeImage, codex, recommended, notes };
}
function buildCodexPrompt(prompt, outputPath) {
  return [
    "Use the image_generation tool to create the requested image.",
    `Save the result as a PNG, JPEG, or WebP file at exactly this path: ${outputPath}`,
    "Then reply with the absolute path to the saved file.",
    "",
    "Request:",
    prompt.trim()
  ].join("\n");
}
async function generateWithCodex(options = {}) {
  const opts = options && typeof options === "object" ? options : {};
  if (typeof opts.prompt !== "string" || !opts.prompt.trim()) {
    throw new TypeError("generateWithCodex requires a non-empty prompt string");
  }
  if (typeof opts.assetDir !== "string" || !opts.assetDir.trim()) {
    throw new TypeError("generateWithCodex requires an assetDir string");
  }
  if (opts.outDir != null && typeof opts.outDir !== "string") {
    throw new TypeError("generateWithCodex outDir must be a string when provided");
  }
  if (opts.spawnImpl != null && typeof opts.spawnImpl !== "function") {
    throw new TypeError("generateWithCodex spawnImpl must be a function when provided");
  }
  const prompt = opts.prompt.trim();
  const assetDir = opts.assetDir.trim();
  const timeoutMs = normalizeTimeout(opts.timeoutMs, DEFAULT_GENERATE_TIMEOUT_MS);
  const env = mergedEnv(opts.env);
  const requested = requestedCodexBin(opts.codexBin, env);
  const resolvedBin = await lookupBinary(requested, env);
  const command = resolvedBin ?? (typeof opts.spawnImpl === "function" ? requested : null);
  if (!command) {
    return failure(
      "codex-not-found",
      `Codex CLI "${requested}" was not found. Install Codex or set DSH_CANVAS_CODEX_BIN.`
    );
  }
  let tmp = null;
  try {
    const base = opts.outDir ? resolve(opts.outDir) : tmpdir();
    await mkdir(base, { recursive: true });
    tmp = await mkdtemp(join(base, "dsh-canvas-codex-"));
    const outputPath = join(tmp, "output.png");
    const lastMessagePath = join(tmp, "last.txt");
    const args = [
      "exec",
      "--skip-git-repo-check",
      "--ephemeral",
      "--json",
      "--sandbox",
      "workspace-write",
      "--cd",
      tmp,
      "--output-last-message",
      lastMessagePath,
      buildCodexPrompt(prompt, outputPath)
    ];
    const startedAt = Date.now();
    const run = await runCommand(command, args, { timeoutMs, env, cwd: tmp, spawnImpl: opts.spawnImpl });
    if (run.spawnError) {
      if (run.spawnError.code === "ENOENT" && !resolvedBin) {
        return failure(
          "codex-not-found",
          `Codex CLI "${requested}" was not found. Install Codex or set DSH_CANVAS_CODEX_BIN.`
        );
      }
      return failure("spawn-failed", `Could not start Codex: ${messageOf(run.spawnError)}`);
    }
    if (run.timedOut) {
      return failure(
        "timeout",
        `Codex image generation timed out after ${timeoutMs} ms and was stopped.`,
        run.stdout,
        run.stderr
      );
    }
    if (run.exitCode !== 0) {
      return failure(
        "codex-failed",
        `Codex image generation failed with exit code ${run.exitCode ?? "unknown"}${run.signal ? ` (signal ${run.signal})` : ""}.`,
        run.stdout,
        run.stderr
      );
    }
    const candidates = await findGeneratedImages(tmp, startedAt);
    if (candidates.length === 0) {
      return failure(
        "no-output",
        "Codex finished without writing a PNG/JPEG/WebP image to its output directory.",
        run.stdout,
        run.stderr
      );
    }
    let oversized = null;
    let invalid = null;
    for (const candidate of candidates) {
      let buffer;
      try {
        buffer = await readFile(candidate.path);
      } catch {
        continue;
      }
      if (buffer.length > LIMITS.imageBytes) {
        oversized = candidate.name;
        continue;
      }
      const kind = sniffImage(buffer);
      if (!kind || !GENERATED_KINDS.has(kind)) {
        invalid = candidate.name;
        continue;
      }
      const stored = await storeImage({
        buffer,
        assetDir,
        stem: imageStem(buffer),
        preferredExt: extname(candidate.path)
      });
      return { ok: true, asset: stored.asset, hostPath: stored.hostPath, bytes: stored.bytes };
    }
    if (oversized) {
      return failure(
        "image-too-large",
        `Codex wrote ${oversized}, which exceeds the ${IMAGE_LIMIT_MIB} MiB image limit.`,
        run.stdout,
        run.stderr
      );
    }
    return failure(
      "invalid-image",
      `Codex wrote ${invalid ?? "a file"}, but it is not a valid PNG/JPEG/WebP image.`,
      run.stdout,
      run.stderr
    );
  } catch (error) {
    return failure("generation-failed", `Image generation failed: ${messageOf(error)}`);
  } finally {
    if (tmp) {
      try {
        await rm(tmp, { recursive: true, force: true });
      } catch {
      }
    }
  }
}
async function importImage(options = {}) {
  const opts = options && typeof options === "object" ? options : {};
  if (typeof opts.sourcePath !== "string" || !opts.sourcePath.trim()) {
    throw new TypeError("importImage requires a sourcePath string");
  }
  if (typeof opts.assetDir !== "string" || !opts.assetDir.trim()) {
    throw new TypeError("importImage requires an assetDir string");
  }
  const source = resolve(opts.sourcePath.trim());
  let buffer;
  try {
    const info = await stat(source);
    if (!info.isFile()) {
      return { ok: false, code: "not-file", message: `Source is not a regular file: ${opts.sourcePath}` };
    }
    if (info.size === 0) {
      return { ok: false, code: "invalid-image", message: `Source image is empty: ${opts.sourcePath}` };
    }
    if (info.size > LIMITS.imageBytes) {
      return {
        ok: false,
        code: "image-too-large",
        message: `Image exceeds the ${IMAGE_LIMIT_MIB} MiB limit: ${opts.sourcePath}`
      };
    }
    buffer = await readFile(source);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return { ok: false, code: "not-found", message: `Image not found: ${opts.sourcePath}` };
    }
    return { ok: false, code: "import-failed", message: `Could not read ${opts.sourcePath}: ${messageOf(error)}` };
  }
  if (buffer.length === 0) {
    return { ok: false, code: "invalid-image", message: `Source image is empty: ${opts.sourcePath}` };
  }
  if (buffer.length > LIMITS.imageBytes) {
    return {
      ok: false,
      code: "image-too-large",
      message: `Image exceeds the ${IMAGE_LIMIT_MIB} MiB limit: ${opts.sourcePath}`
    };
  }
  const kind = sniffImage(buffer);
  if (!kind) {
    return {
      ok: false,
      code: "unsupported-image",
      message: `Source is not a PNG, JPEG, WebP or GIF image: ${opts.sourcePath}`
    };
  }
  try {
    const requestedName = typeof opts.name === "string" && opts.name.trim() ? opts.name : basename(source);
    const stored = await storeImage({
      buffer,
      assetDir: opts.assetDir.trim(),
      stem: requestedName,
      preferredExt: extname(requestedName)
    });
    return { ok: true, asset: stored.asset, hostPath: stored.hostPath, bytes: stored.bytes };
  } catch (error) {
    return { ok: false, code: "copy-failed", message: `Could not store the image: ${messageOf(error)}` };
  }
}

// src/host/skills.ts
import { readFileSync } from "node:fs";
import { resolve as resolve2 } from "node:path";
import { fileURLToPath } from "node:url";
var SKILL_DIR_URL = new URL("../../skills/canvas-ui-design/", import.meta.url);
var SKILL_FILE_URL = new URL("SKILL.md", SKILL_DIR_URL);
var SKILL_NAME = "canvas-ui-design";
function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) throw new Error("SKILL.md is missing YAML frontmatter");
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key) meta[key] = value.replace(/^(['"])(.*)\1$/, "$2");
  }
  return { meta, body: match[2].trim() };
}
function loadCanvasSkill() {
  const raw = readFileSync(SKILL_FILE_URL, "utf8");
  const { meta, body } = parseFrontmatter(raw);
  if (meta.name !== SKILL_NAME) throw new Error(`skill name must be "${SKILL_NAME}"`);
  if (!meta.description) throw new Error(`skill "${SKILL_NAME}" requires a description`);
  if (!body) throw new Error(`skill "${SKILL_NAME}" has an empty body`);
  return {
    name: meta.name,
    description: meta.description,
    ...meta.whenToUse ? { whenToUse: meta.whenToUse } : {},
    content: body,
    path: fileURLToPath(SKILL_FILE_URL),
    directory: resolve2(fileURLToPath(SKILL_DIR_URL))
  };
}
function registerCanvasSkills(ctx, disposers) {
  const skills = ctx?.get?.("skills");
  if (!skills || typeof skills.register !== "function") return false;
  const skill = loadCanvasSkill();
  try {
    const dispose = skills.register({
      name: skill.name,
      description: skill.description,
      ...skill.whenToUse ? { whenToUse: skill.whenToUse } : {},
      source: "dsh-canvas",
      content: skill.content,
      path: skill.path,
      resourceBase: { kind: "directory", path: skill.directory },
      invocation: { modelInvocable: true, userInvocable: true }
    });
    if (typeof dispose === "function") disposers?.push(dispose);
    return true;
  } catch (error) {
    console.warn(`[dsh-canvas] could not register skill "${skill.name}":`, error?.message ?? error);
    return false;
  }
}

// src/host/main.ts
var HEALTH_PATH = "/dsh-canvas/health";
var API_PREFIX = "/dsh-canvas/api/";
var DOC_SUFFIX = ".canvas.json";
var MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".svg": "image/svg+xml"
};
var IMAGE_EXT = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
var FONT_EXT = /* @__PURE__ */ new Set([".woff2", ".woff", ".ttf", ".otf"]);
var EXAMPLE_URL = new URL("../../examples/login.canvas.json", import.meta.url);
var FORMAT_URL = new URL("../../FORMAT.md", import.meta.url);
var DESIGN_URL = new URL("../../DESIGN.md", import.meta.url);
var TOOL_PROMPT = [
  "Canvas: the workspace may contain canvas/*.canvas.json (format dsh.canvas@1).",
  "Use canvas_read before editing; use canvas_edit for small changes and canvas_write for a new document.",
  "The canvas file format, node fields, auto-layout, components, styles, fills, effects and comments are documented in canvas/FORMAT.md.",
  "The design system and built-in templates are documented in canvas/DESIGN.md.",
  "Load the canvas-ui-design skill when the user asks for UI design, page/component generation, design review or design handoff.",
  FOUNDATION_PROMPT,
  "canvas_audit runs deterministic design checks; canvas_image probe/generate/import handles image generation (GPT native or local Codex CLI) and imports.",
  DESIGN_SYSTEM_PROMPT,
  "The user's current canvas selection is returned by canvas_read (selection) and can be used as context."
].join("\n");
var HttpError = class extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
};
function sha(value) {
  return createHash2("sha256").update(value).digest("hex").slice(0, 16);
}
function nowIso2() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function sendJson(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body)
  });
  response.end(body);
}
function sendError(response, error) {
  if (error instanceof HttpError) {
    sendJson(response, error.status, { ok: false, error: error.code, message: error.message, details: error.details });
    return;
  }
  if (error instanceof CanvasError) {
    sendJson(response, 422, {
      ok: false,
      error: "invalid-document",
      message: error.message,
      path: error.path,
      details: error.details
    });
    return;
  }
  sendJson(response, 500, { ok: false, error: "internal", message: String(error?.message ?? error) });
}
async function readBody(request, limit = LIMITS.docBytes * 2) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > limit) throw new HttpError(413, "body-too-large", `request body exceeds ${limit} bytes`);
    chunks.push(buffer);
  }
  const text2 = Buffer.concat(chunks).toString("utf8");
  if (!text2) return {};
  try {
    return JSON.parse(text2);
  } catch (error) {
    throw new HttpError(400, "invalid-json", `invalid JSON body: ${String(error.message)}`);
  }
}
function isLoopbackHost(host) {
  if (typeof host !== "string") return false;
  const lower = host.toLowerCase();
  const name = lower.startsWith("[") ? lower.slice(0, lower.indexOf("]") + 1) : lower.split(":")[0];
  return name === "127.0.0.1" || name === "localhost" || name === "[::1]";
}
function sameOriginLocal(request) {
  const host = request.headers.host;
  if (host !== void 0 && !isLoopbackHost(host)) return false;
  if (request.headers["sec-fetch-site"] === "cross-site") return false;
  const origin = request.headers.origin;
  if (origin === void 0) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
function admit(ctx, request, response) {
  let rejection;
  try {
    const connection = ctx.get("connection");
    if (connection && typeof connection.requestRejection === "function") {
      rejection = connection.requestRejection(request);
    }
  } catch (error) {
    rejection = 403;
  }
  if (rejection != null) {
    const status = typeof rejection === "number" ? rejection : typeof rejection.status === "number" ? rejection.status : 403;
    sendJson(response, status, { ok: false, error: status === 401 ? "login-required" : "untrusted-origin" });
    return false;
  }
  if (!sameOriginLocal(request)) {
    sendJson(response, 403, { ok: false, error: "untrusted-origin" });
    return false;
  }
  return true;
}
function canvasRoot(cwd) {
  return join2(cwd, "canvas");
}
function assertInside(root, target) {
  const rel = relative(root, target);
  if (rel === "" || rel.startsWith("..") || rel.startsWith(`..${sep}`) || resolve3(root, rel) !== target) {
    throw new HttpError(400, "outside-canvas", "path escapes the canvas directory");
  }
  return target;
}
function docFile(cwd, name) {
  if (!isSlug(name)) throw new HttpError(400, "invalid-name", "document name must match ^[a-z0-9][a-z0-9-_]{0,63}$");
  return assertInside(canvasRoot(cwd), join2(canvasRoot(cwd), `${name}${DOC_SUFFIX}`));
}
function assetFile(cwd, asset, kind) {
  const allowed = kind === "font" ? /^fonts\/[A-Za-z0-9._-]{1,120}$/ : /^assets\/[A-Za-z0-9._-]{1,120}$/;
  if (typeof asset !== "string" || !allowed.test(asset) || asset.includes("..")) {
    throw new HttpError(400, "invalid-asset", "asset path is not allowed");
  }
  return assertInside(canvasRoot(cwd), join2(canvasRoot(cwd), asset));
}
async function exists(file) {
  try {
    await stat2(file);
    return true;
  } catch {
    return false;
  }
}
var exampleDoc = null;
async function loadExample() {
  if (exampleDoc) return exampleDoc;
  try {
    exampleDoc = normalizeDoc(JSON.parse(await readFile2(EXAMPLE_URL, "utf8")));
  } catch {
    exampleDoc = normalizeDoc(emptyDoc("\u4E3B\u753B\u5E03"));
  }
  return exampleDoc;
}
async function readFormatDoc() {
  try {
    return await readFile2(FORMAT_URL, "utf8");
  } catch {
    return "# dsh.canvas@1\n\nCanvas document format. See the plugin README.\n";
  }
}
async function readDesignDoc() {
  try {
    return await readFile2(DESIGN_URL, "utf8");
  } catch {
    return "# Canvas design system\n\nUse Material Design 3 by default; Apple HIG for iOS.\n";
  }
}
var state = () => ({
  selections: /* @__PURE__ */ new Map(),
  lastDoc: /* @__PURE__ */ new Map(),
  sse: /* @__PURE__ */ new Set(),
  watchers: /* @__PURE__ */ new Map(),
  revisions: /* @__PURE__ */ new Map()
});
async function ensureScaffold(cwd, store) {
  const root = canvasRoot(cwd);
  await mkdir2(root, { recursive: true });
  await mkdir2(join2(root, "assets"), { recursive: true });
  await mkdir2(join2(root, "fonts"), { recursive: true });
  await mkdir2(join2(root, "exports"), { recursive: true });
  const formatPath = join2(root, "FORMAT.md");
  if (!await exists(formatPath)) {
    await writeFile2(formatPath, await readFormatDoc(), "utf8");
  }
  const designPath = join2(root, "DESIGN.md");
  if (!await exists(designPath)) {
    await writeFile2(designPath, await readDesignDoc(), "utf8");
  }
  const names = await listDocNames(cwd);
  if (names.length === 0) {
    const example = await loadExample();
    const doc = structuredClone(example);
    doc.title = "\u4E3B\u753B\u5E03";
    doc.meta = { createdAt: nowIso2(), updatedAt: nowIso2() };
    const file = docFile(cwd, "main");
    const json = JSON.stringify(doc, null, 2) + "\n";
    await writeFile2(file, json, "utf8");
    store.revisions.set(file, sha(json));
  }
}
async function listDocNames(cwd) {
  const root = canvasRoot(cwd);
  try {
    const entries = await readdir2(root, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile() && entry.name.endsWith(DOC_SUFFIX)).map((entry) => entry.name.slice(0, -DOC_SUFFIX.length)).filter((name) => isSlug(name)).sort();
  } catch {
    return [];
  }
}
async function listDocs(cwd) {
  const names = await listDocNames(cwd);
  const docs = [];
  for (const name of names) {
    const file = docFile(cwd, name);
    try {
      const info = await stat2(file);
      const raw = await readFile2(file, "utf8");
      let title = name;
      try {
        title = JSON.parse(raw)?.title ?? name;
      } catch {
      }
      docs.push({ name, title, updatedAt: info.mtime.toISOString(), bytes: info.size });
    } catch {
    }
  }
  return docs;
}
async function readDoc(cwd, name) {
  const file = docFile(cwd, name);
  let raw;
  try {
    raw = await readFile2(file, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") throw new HttpError(404, "document-not-found", `canvas document "${name}" does not exist`);
    throw error;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new HttpError(422, "invalid-json", `canvas file ${name}${DOC_SUFFIX} is not valid JSON: ${String(error.message)}`, {
      name
    });
  }
  let doc;
  try {
    doc = normalizeDoc(parsed, { touch: false });
  } catch (error) {
    if (error instanceof CanvasError) {
      throw new HttpError(422, "invalid-document", error.message, { name, path: error.path });
    }
    throw error;
  }
  return { doc, raw, revision: sha(raw), file, name };
}
async function writeDoc(ctx, store, cwd, name, doc, options) {
  const file = docFile(cwd, name);
  await mkdir2(dirname(file), { recursive: true });
  let currentRaw = null;
  try {
    currentRaw = await readFile2(file, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const currentRevision = currentRaw == null ? null : sha(currentRaw);
  if (options.baseRevision != null && currentRevision != null && options.baseRevision !== currentRevision) {
    let currentDoc = null;
    try {
      currentDoc = normalizeDoc(JSON.parse(currentRaw), { touch: false });
    } catch {
      currentDoc = null;
    }
    throw new HttpError(409, "revision-conflict", "canvas was changed elsewhere", {
      revision: currentRevision,
      doc: currentDoc,
      name
    });
  }
  const normalized = normalizeDoc(doc);
  const json = JSON.stringify(normalized, null, 2) + "\n";
  if (Buffer.byteLength(json) > LIMITS.docBytes) {
    throw new HttpError(413, "document-too-large", `canvas document exceeds ${LIMITS.docBytes} bytes`);
  }
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile2(temp, json, "utf8");
  await rename(temp, file);
  const revision = sha(json);
  store.revisions.set(file, revision);
  broadcast(store, file, { type: "doc-changed", name, revision, source: options.source });
  return { doc: normalized, revision, file, path: relative(cwd, file) };
}
function selectionKey(sessionId, name) {
  return `${sessionId}:${name}`;
}
function getSelection(store, sessionId, name) {
  const key = selectionKey(sessionId, name);
  const entry = store.selections.get(key);
  if (!entry) return null;
  if (Date.now() - entry.updatedAt > 60 * 60 * 1e3) {
    store.selections.delete(key);
    return null;
  }
  return entry;
}
function setSelection(store, sessionId, name, ids, pageId) {
  store.selections.set(selectionKey(sessionId, name), {
    ids: Array.isArray(ids) ? ids.filter((id2) => typeof id2 === "string").slice(0, 200) : [],
    pageId: typeof pageId === "string" ? pageId : void 0,
    updatedAt: Date.now()
  });
}
function broadcast(store, file, payload) {
  for (const client of store.sse) {
    if (client.file !== file) continue;
    try {
      client.response.write(`data: ${JSON.stringify(payload)}

`);
    } catch {
    }
  }
}
function retainWatcher(store, file, name) {
  const existing = store.watchers.get(file);
  if (existing) {
    existing.refs += 1;
    return () => releaseWatcher(store, file);
  }
  const entry = { refs: 1, lastRevision: store.revisions.get(file) ?? null, timer: null };
  watchFile(
    file,
    { interval: 700 },
    () => {
      if (entry.timer) return;
      entry.timer = setTimeout(async () => {
        entry.timer = null;
        try {
          const raw = await readFile2(file, "utf8");
          const revision = sha(raw);
          if (revision === entry.lastRevision) return;
          entry.lastRevision = revision;
          store.revisions.set(file, revision);
          broadcast(store, file, { type: "doc-changed", name, revision, source: "file" });
        } catch {
        }
      }, 120);
    }
  );
  store.watchers.set(file, entry);
  return () => releaseWatcher(store, file);
}
function releaseWatcher(store, file) {
  const entry = store.watchers.get(file);
  if (!entry) return;
  entry.refs -= 1;
  if (entry.refs > 0) return;
  if (entry.timer) clearTimeout(entry.timer);
  unwatchFile(file);
  store.watchers.delete(file);
}
function sessionCwd(ctx, sessionId) {
  if (typeof sessionId !== "string" || !sessionId) throw new HttpError(400, "session-required", "sessionId is required");
  const session = ctx.sessions.get(sessionId);
  if (!session) throw new HttpError(400, "unknown-session", `unknown session "${sessionId}"`);
  let cwd;
  try {
    cwd = ctx.workingDirectory.get(session);
  } catch {
    cwd = void 0;
  }
  if (!cwd) cwd = session.cwd;
  if (typeof cwd !== "string" || !cwd) throw new HttpError(400, "no-workspace", "session has no working directory");
  return { session, cwd };
}
function resolveName(store, sessionId, name) {
  if (typeof name === "string" && name) return name;
  return store.lastDoc.get(sessionId) ?? "main";
}
function rememberDoc(store, sessionId, name) {
  if (sessionId) store.lastDoc.set(sessionId, name);
}
function parseQuery(url) {
  return Object.fromEntries(url.searchParams.entries());
}
function relativePath(cwd, file) {
  return relative(cwd, file);
}
function currentModelSelection(ctx) {
  try {
    return ctx.get("agentDefaultModel")?.currentSelection?.() ?? null;
  } catch {
    return null;
  }
}
function summary(doc) {
  return outlineDoc(doc).stats;
}
function createRoutes(ctx, store) {
  return async function handler(request, response) {
    try {
      if (!admit(ctx, request, response)) return;
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      const pathname = url.pathname;
      if (pathname === HEALTH_PATH) {
        sendJson(response, 200, { ok: true, plugin: "@local/dsh-canvas", version: 2 });
        return;
      }
      if (!pathname.startsWith(API_PREFIX)) {
        sendJson(response, 404, { ok: false, error: "not-found" });
        return;
      }
      const action = pathname.slice(API_PREFIX.length);
      const query = parseQuery(url);
      if (action === "state" && request.method === "GET") {
        const sessionId = query.sessionId;
        const { cwd } = sessionCwd(ctx, sessionId);
        const name = resolveName(store, sessionId, query.name);
        await ensureScaffold(cwd, store);
        rememberDoc(store, sessionId, name);
        const docs = await listDocs(cwd);
        const read = await readDoc(cwd, name);
        sendJson(response, 200, {
          ok: true,
          name,
          path: relativePath(cwd, read.file),
          revision: read.revision,
          doc: read.doc,
          docs,
          selection: getSelection(store, sessionId, name)
        });
        return;
      }
      if (action === "diag" && request.method === "POST") {
        const body = await readBody(request, 64 * 1024);
        const line = JSON.stringify({ at: nowIso2(), ...body }) + "\n";
        await appendFile("/tmp/dsh-canvas-client.log", line).catch(() => {
        });
        sendJson(response, 200, { ok: true });
        return;
      }
      if (action === "diag" && request.method === "GET") {
        let text2 = "";
        try {
          text2 = await readFile2("/tmp/dsh-canvas-client.log", "utf8");
        } catch {
          text2 = "";
        }
        sendJson(response, 200, { ok: true, lines: text2.split("\n").filter(Boolean).slice(-200) });
        return;
      }
      if (action === "docs" && request.method === "GET") {
        const { cwd } = sessionCwd(ctx, query.sessionId);
        await ensureScaffold(cwd, store);
        sendJson(response, 200, { ok: true, docs: await listDocs(cwd) });
        return;
      }
      if (action === "doc" && request.method === "PUT") {
        const body = await readBody(request);
        const { cwd } = sessionCwd(ctx, body.sessionId);
        const name = resolveName(store, body.sessionId, body.name);
        if (!body.doc) throw new HttpError(400, "doc-required", "doc is required");
        try {
          const result = await writeDoc(ctx, store, cwd, name, body.doc, {
            baseRevision: body.baseRevision,
            source: "client"
          });
          rememberDoc(store, body.sessionId, name);
          sendJson(response, 200, {
            ok: true,
            name,
            path: relativePath(cwd, result.file),
            revision: result.revision,
            stats: summary(result.doc)
          });
        } catch (error) {
          if (error instanceof HttpError && error.code === "revision-conflict") {
            sendJson(response, 409, { ok: false, ...error.details, message: error.message });
            return;
          }
          throw error;
        }
        return;
      }
      if (action === "doc/rename" && request.method === "POST") {
        const body = await readBody(request, 64 * 1024);
        const { cwd } = sessionCwd(ctx, body.sessionId);
        const from = resolveName(store, body.sessionId, body.from);
        const to = typeof body.to === "string" ? body.to.trim() : "";
        if (!isSlug(to)) throw new HttpError(400, "invalid-name", "document name must match ^[a-z0-9][a-z0-9-_]{0,63}$");
        const fromFile = docFile(cwd, from);
        const toFile = docFile(cwd, to);
        if (from !== to) {
          if (!await exists(fromFile)) throw new HttpError(404, "document-not-found", `canvas document "${from}" does not exist`);
          if (await exists(toFile)) throw new HttpError(409, "document-exists", `canvas document "${to}" already exists`);
          await rename(fromFile, toFile);
          const watcher = store.watchers.get(fromFile);
          if (watcher) {
            if (watcher.timer) clearTimeout(watcher.timer);
            unwatchFile(fromFile);
            store.watchers.delete(fromFile);
          }
          store.revisions.delete(fromFile);
        }
        const raw = await readFile2(toFile, "utf8");
        const revision = sha(raw);
        store.revisions.set(toFile, revision);
        rememberDoc(store, body.sessionId, to);
        sendJson(response, 200, {
          ok: true,
          name: to,
          path: relativePath(cwd, toFile),
          revision,
          docs: await listDocs(cwd)
        });
        return;
      }
      if (action === "doc/delete" && request.method === "POST") {
        const body = await readBody(request, 64 * 1024);
        const { cwd } = sessionCwd(ctx, body.sessionId);
        const name = resolveName(store, body.sessionId, body.name);
        const file = docFile(cwd, name);
        if (!await exists(file)) throw new HttpError(404, "document-not-found", `canvas document "${name}" does not exist`);
        const names = await listDocNames(cwd);
        if (names.length <= 1) throw new HttpError(409, "last-document", "cannot delete the last canvas document");
        await unlink(file);
        const watcher = store.watchers.get(file);
        if (watcher) {
          if (watcher.timer) clearTimeout(watcher.timer);
          unwatchFile(file);
          store.watchers.delete(file);
        }
        store.revisions.delete(file);
        const docs = await listDocs(cwd);
        const fallback = docs[0]?.name ?? "main";
        rememberDoc(store, body.sessionId, fallback);
        sendJson(response, 200, { ok: true, name: fallback, docs });
        return;
      }
      if (action === "selection" && request.method === "POST") {
        const body = await readBody(request, 64 * 1024);
        const { cwd } = sessionCwd(ctx, body.sessionId);
        const name = resolveName(store, body.sessionId, body.name);
        setSelection(store, body.sessionId, name, body.ids, body.pageId);
        sendJson(response, 200, { ok: true, name });
        return;
      }
      if (action === "export" && request.method === "POST") {
        const body = await readBody(request, 40 * 1024 * 1024);
        const { cwd } = sessionCwd(ctx, body.sessionId);
        const kind = body.kind === "svg" ? "svg" : body.kind === "png" ? "png" : null;
        if (!kind) throw new HttpError(400, "invalid-export", "kind must be png or svg");
        if (typeof body.data !== "string" || !body.data) throw new HttpError(400, "invalid-export", "data is required");
        const buffer = Buffer.from(body.data, "base64");
        if (buffer.byteLength > 30 * 1024 * 1024) throw new HttpError(413, "export-too-large", "export exceeds 30 MiB");
        const root = canvasRoot(cwd);
        await mkdir2(join2(root, "exports"), { recursive: true });
        const safeName = (isSlug(body.name) ? body.name : "canvas") + "-" + (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
        const file = assertInside(root, join2(root, "exports", `${safeName}.${kind}`));
        await writeFile2(file, buffer);
        sendJson(response, 200, {
          ok: true,
          path: relativePath(cwd, file),
          absolutePath: file,
          bytes: buffer.byteLength
        });
        return;
      }
      if (action === "asset" && request.method === "POST") {
        const body = await readBody(request, 40 * 1024 * 1024);
        const { cwd } = sessionCwd(ctx, body.sessionId);
        const ext = String(body.ext ?? "").toLowerCase();
        if (!IMAGE_EXT.has(ext)) throw new HttpError(400, "invalid-image", "only png/jpeg/webp/gif are supported");
        const buffer = Buffer.from(String(body.data ?? ""), "base64");
        if (!buffer.byteLength) throw new HttpError(400, "invalid-image", "empty image");
        if (buffer.byteLength > LIMITS.imageBytes) throw new HttpError(413, "image-too-large", "image exceeds 20 MiB");
        const root = canvasRoot(cwd);
        await mkdir2(join2(root, "assets"), { recursive: true });
        const hash = createHash2("sha256").update(buffer).digest("hex").slice(0, 24);
        const file = assertInside(root, join2(root, "assets", `${hash}${ext}`));
        if (!await exists(file)) await writeFile2(file, buffer);
        sendJson(response, 200, { ok: true, asset: `assets/${hash}${ext}`, bytes: buffer.byteLength });
        return;
      }
      if (action === "asset" && request.method === "GET") {
        const { cwd } = sessionCwd(ctx, query.sessionId);
        const file = assetFile(cwd, query.asset, "asset");
        const buffer = await readFile2(file);
        response.writeHead(200, {
          "content-type": MIME[extname2(file).toLowerCase()] ?? "application/octet-stream",
          "cache-control": "public, max-age=31536000, immutable",
          "content-length": buffer.byteLength
        });
        response.end(buffer);
        return;
      }
      if (action === "font" && request.method === "POST") {
        const body = await readBody(request, 40 * 1024 * 1024);
        const { cwd } = sessionCwd(ctx, body.sessionId);
        const ext = String(body.ext ?? "").toLowerCase();
        if (!FONT_EXT.has(ext)) throw new HttpError(400, "invalid-font", "only woff2/woff/ttf/otf are supported");
        const buffer = Buffer.from(String(body.data ?? ""), "base64");
        if (!buffer.byteLength) throw new HttpError(400, "invalid-font", "empty font");
        if (buffer.byteLength > LIMITS.fontBytes) throw new HttpError(413, "font-too-large", "font exceeds 10 MiB");
        const root = canvasRoot(cwd);
        await mkdir2(join2(root, "fonts"), { recursive: true });
        const hash = createHash2("sha256").update(buffer).digest("hex").slice(0, 24);
        const file = assertInside(root, join2(root, "fonts", `${hash}${ext}`));
        if (!await exists(file)) await writeFile2(file, buffer);
        sendJson(response, 200, {
          ok: true,
          asset: `fonts/${hash}${ext}`,
          bytes: buffer.byteLength,
          family: typeof body.family === "string" ? body.family : void 0,
          weight: typeof body.weight === "number" ? body.weight : void 0,
          style: body.style === "italic" ? "italic" : "normal"
        });
        return;
      }
      if (action === "font" && request.method === "GET") {
        const { cwd } = sessionCwd(ctx, query.sessionId);
        const file = assetFile(cwd, query.asset, "font");
        const buffer = await readFile2(file);
        response.writeHead(200, {
          "content-type": MIME[extname2(file).toLowerCase()] ?? "application/octet-stream",
          "cache-control": "public, max-age=31536000, immutable",
          "content-length": buffer.byteLength
        });
        response.end(buffer);
        return;
      }
      if (action === "audit" && request.method === "POST") {
        const body = await readBody(request, 128 * 1024);
        const { cwd } = sessionCwd(ctx, body.sessionId);
        const name = resolveName(store, body.sessionId, body.name);
        const read = await readDoc(cwd, name);
        try {
          const result = auditDoc(read.doc, {
            ...typeof body.pageId === "string" ? { pageId: body.pageId } : {},
            ...typeof body.nodeId === "string" ? { nodeId: body.nodeId } : {},
            system: body.system === "material3" ? "material3" : "ios"
          });
          sendJson(response, 200, { ok: true, name, revision: read.revision, ...result });
        } catch (error) {
          throw new HttpError(422, "audit-failed", String(error?.message ?? error));
        }
        return;
      }
      if (action === "image/capabilities" && request.method === "GET") {
        const { cwd } = sessionCwd(ctx, query.sessionId);
        const capabilities = await detectImageCapabilities({ modelSelection: currentModelSelection(ctx) });
        sendJson(response, 200, { ok: true, path: relativePath(cwd, canvasRoot(cwd)), capabilities });
        return;
      }
      if (action === "image/generate" && request.method === "POST") {
        const body = await readBody(request, 128 * 1024);
        const { cwd } = sessionCwd(ctx, body.sessionId);
        const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
        if (!prompt) throw new HttpError(400, "prompt-required", "prompt is required");
        if (prompt.length > 8e3) throw new HttpError(400, "prompt-too-long", "prompt exceeds 8000 characters");
        const capabilities = await detectImageCapabilities({ modelSelection: currentModelSelection(ctx) });
        if (capabilities.recommended === "native") {
          sendJson(response, 409, {
            ok: false,
            code: "native-image-tool-required",
            message: "The current model should generate images natively; ask the agent to generate and import the image.",
            capabilities
          });
          return;
        }
        if (capabilities.recommended !== "codex") {
          sendJson(response, 409, {
            ok: false,
            code: "image-generation-unavailable",
            message: "No native image tool or Codex image_generation support is available; import an image instead.",
            capabilities
          });
          return;
        }
        const assetDir = join2(canvasRoot(cwd), "assets");
        await mkdir2(assetDir, { recursive: true });
        const generated = await generateWithCodex({
          prompt,
          assetDir,
          ...capabilities.codex?.bin ? { codexBin: capabilities.codex.bin } : {}
        });
        sendJson(response, generated.ok ? 200 : 502, { ...generated, capabilities });
        return;
      }
      if (action === "events" && request.method === "GET") {
        const { cwd } = sessionCwd(ctx, query.sessionId);
        const name = resolveName(store, query.sessionId, query.name);
        await ensureScaffold(cwd, store);
        const file = docFile(cwd, name);
        const read = await readDoc(cwd, name);
        response.writeHead(200, {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-store",
          connection: "keep-alive",
          "x-accel-buffering": "no"
        });
        response.write(`data: ${JSON.stringify({ type: "ready", name, revision: read.revision })}

`);
        const client = { response, file, name, sessionId: query.sessionId };
        store.sse.add(client);
        const release = retainWatcher(store, file, name);
        const heartbeat = setInterval(() => {
          try {
            response.write(": ping\n\n");
          } catch {
          }
        }, 2e4);
        const cleanup = () => {
          clearInterval(heartbeat);
          store.sse.delete(client);
          release();
        };
        request.on("close", cleanup);
        request.on("error", cleanup);
        return;
      }
      sendJson(response, 404, { ok: false, error: "not-found" });
    } catch (error) {
      sendError(response, error);
    }
  };
}
function createTools(ctx, store) {
  const workspace = async (exec) => {
    if (!exec.agent) throw new Error("canvas tools require an agent session");
    const cwd = await ctx.workingDirectory.ensure(exec.agent);
    if (!cwd) throw new Error("this session has no working directory");
    return { cwd, sessionId: exec.agent.id };
  };
  const defaultName2 = (sessionId, name) => resolveName(store, sessionId, name);
  const read = {
    name: "canvas_read",
    description: `Read a dsh-canvas document (canvas/*.canvas.json, format dsh.canvas@1) and the user's current canvas selection. Use detail "outline" (default) for a compact node tree, "full" for the whole JSON document, or "node" with nodeId for one subtree. Read canvas/FORMAT.md for the schema before writing complex documents.`,
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "document name; defaults to the last opened canvas in this session" },
        detail: { type: "string", enum: ["outline", "full", "node"], description: "how much of the document to return" },
        nodeId: { type: "string", description: 'node id when detail is "node"' }
      },
      additionalProperties: false
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_args, value) => [{ type: "text", text: JSON.stringify(value, null, 2) }]
    },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec);
      const name = defaultName2(sessionId, args?.name);
      await ensureScaffold(cwd, store);
      rememberDoc(store, sessionId, name);
      const readDocValue = await readDoc(cwd, name);
      const selection = getSelection(store, sessionId, name);
      const pageId = selection?.pageId;
      const base = {
        path: relativePath(cwd, readDocValue.file),
        revision: readDocValue.revision,
        name,
        selection: selection?.ids ?? [],
        format: FORMAT
      };
      if (pageId) base.pageId = pageId;
      if (args?.detail === "full") {
        const json = JSON.stringify(readDocValue.doc);
        if (json.length > 12e4) {
          return {
            ...base,
            detail: "full",
            tooLarge: true,
            bytes: json.length,
            hint: `Document is large; read ${base.path} with the read tool in chunks.`,
            outline: outlineDoc(readDocValue.doc, { selection: selection?.ids, pageId })
          };
        }
        return { ...base, detail: "full", doc: readDocValue.doc };
      }
      if (args?.detail === "node") {
        if (typeof args.nodeId !== "string") throw new Error('detail "node" requires nodeId');
        const found = findNodeInDoc(readDocValue.doc, args.nodeId);
        if (!found) throw new Error(`unknown node "${args.nodeId}"`);
        return { ...base, detail: "node", node: found.node };
      }
      return {
        ...base,
        detail: "outline",
        outline: outlineDoc(readDocValue.doc, { selection: selection?.ids, pageId }),
        hint: `Schema: ${relativePath(cwd, join2(canvasRoot(cwd), "FORMAT.md"))}; design system: ${relativePath(cwd, join2(canvasRoot(cwd), "DESIGN.md"))}. Use canvas_edit for small changes, canvas_template for the iOS screen template.`
      };
    }
  };
  const write = {
    name: "canvas_write",
    description: "Create or replace a dsh-canvas document (format dsh.canvas@1). Provide the complete document JSON. Use canvas_edit for small changes and always pass baseRevision when you read an existing document first. Read canvas/FORMAT.md for node, auto-layout, component, style, fill, effect and comment fields.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "document name (lowercase slug); defaults to the current document" },
        doc: { type: "object", description: "the complete dsh.canvas document", additionalProperties: true },
        baseRevision: { type: "string", description: "revision from canvas_read; rejects the write when it changed" }
      },
      required: ["doc"],
      additionalProperties: false
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_args, value) => [{ type: "text", text: JSON.stringify(value, null, 2) }]
    },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec);
      const name = defaultName2(sessionId, args?.name);
      await ensureScaffold(cwd, store);
      const result = await writeDoc(ctx, store, cwd, name, args?.doc, {
        baseRevision: typeof args?.baseRevision === "string" ? args.baseRevision : void 0,
        source: "tool"
      });
      rememberDoc(store, sessionId, name);
      return {
        ok: true,
        name,
        path: relativePath(cwd, result.file),
        revision: result.revision,
        stats: summary(result.doc)
      };
    }
  };
  const edit = {
    name: "canvas_edit",
    description: 'Apply a list of edits to a dsh-canvas document. Operations: {op:"add", parent?, index?, node}, {op:"update", id, patch}, {op:"remove", id}, {op:"move", id, parent?, index?}, {op:"set", key:"styles"|"components"|"variantSets"|"fonts", value}, and comment ops (comment.add / comment.reply / comment.resolve / comment.remove). The whole document is validated after the batch; pass baseRevision from canvas_read to avoid overwriting newer changes.',
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "document name; defaults to the current document" },
        ops: { type: "array", items: { type: "object", additionalProperties: true }, description: "edit operations" },
        baseRevision: { type: "string", description: "revision from canvas_read" }
      },
      required: ["ops"],
      additionalProperties: false
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_args, value) => [{ type: "text", text: JSON.stringify(value, null, 2) }]
    },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec);
      const name = defaultName2(sessionId, args?.name);
      await ensureScaffold(cwd, store);
      const current = await readDoc(cwd, name);
      if (typeof args?.baseRevision === "string" && args.baseRevision !== current.revision) {
        throw new Error(
          `revision conflict: document is at ${current.revision}; call canvas_read again before editing`
        );
      }
      const working = structuredClone(current.doc);
      const changed = applyOps(working, args?.ops ?? [], { pageId: getSelection(store, sessionId, name)?.pageId });
      const result = await writeDoc(ctx, store, cwd, name, working, { source: "tool" });
      rememberDoc(store, sessionId, name);
      return {
        ok: true,
        name,
        path: relativePath(cwd, result.file),
        revision: result.revision,
        changed,
        stats: summary(result.doc)
      };
    }
  };
  const comment = {
    name: "canvas_comment",
    description: "Read or write the single-user comments stored in a dsh-canvas document. Actions: add, reply, resolve, list. Comments are part of the canvas file; use this to answer design feedback left by the user.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["add", "reply", "resolve", "list"] },
        name: { type: "string", description: "document name; defaults to the current document" },
        pageId: { type: "string", description: "page id for a new comment" },
        nodeId: { type: "string", description: "anchor a new comment to a node" },
        x: { type: "number", description: "normalized page x (0-1) for an unanchored comment" },
        y: { type: "number", description: "normalized page y (0-1) for an unanchored comment" },
        body: { type: "string", description: "comment or reply text" },
        commentId: { type: "string", description: "target comment id for reply/resolve" },
        resolved: { type: "boolean", description: "resolve state; defaults to true" },
        baseRevision: { type: "string", description: "optional revision guard" }
      },
      required: ["action"],
      additionalProperties: false
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_args, value) => [{ type: "text", text: JSON.stringify(value, null, 2) }]
    },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec);
      const name = defaultName2(sessionId, args?.name);
      await ensureScaffold(cwd, store);
      const current = await readDoc(cwd, name);
      if (typeof args?.baseRevision === "string" && args.baseRevision !== current.revision) {
        throw new Error(`revision conflict: document is at ${current.revision}`);
      }
      const action = args?.action;
      if (action === "list") {
        return {
          ok: true,
          name,
          path: relativePath(cwd, current.file),
          revision: current.revision,
          comments: current.doc.comments
        };
      }
      const working = structuredClone(current.doc);
      let result;
      if (action === "add") {
        result = addComment(working, {
          pageId: args?.pageId,
          nodeId: args?.nodeId,
          x: args?.x,
          y: args?.y,
          body: args?.body,
          author: "ai"
        });
      } else if (action === "reply") {
        result = replyComment(working, args?.commentId, args?.body, "ai");
      } else if (action === "resolve") {
        result = resolveComment(working, args?.commentId, args?.resolved !== false);
      } else {
        throw new Error(`unknown comment action "${String(action)}"`);
      }
      const written = await writeDoc(ctx, store, cwd, name, working, { source: "tool" });
      rememberDoc(store, sessionId, name);
      return {
        ok: true,
        name,
        path: relativePath(cwd, written.file),
        revision: written.revision,
        action,
        result,
        comments: written.doc.comments
      };
    }
  };
  const template = {
    name: "canvas_template",
    description: 'List, insert or inspect built-in canvas templates. Pages: ios-screen / ios-form-screen / ios-list-screen / ios-detail-screen; system bars: ios-status-bar / ios-status-bar-light / ios-nav-bar / ios-tab-bar. Templates default to iPhone 16 393\xD7852 and accept device "iphone15". The foundation action returns devices, style presets and resolved tokens; styles loads a fill/text/effect style library. If the user does not specify a design system, use canvas/DESIGN.md defaults.',
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["list", "insert", "styles", "foundation"] },
        template: { type: "string", description: 'template id from action "list", for example ios-form-screen' },
        system: { type: "string", enum: ["material3", "ios"], description: 'design system for action "styles" / "foundation"' },
        device: { type: "string", enum: DEVICE_IDS, description: "device preset; defaults to iphone16" },
        preset: { type: "string", enum: PRESET_IDS, description: 'style preset for action "foundation"' },
        name: { type: "string", description: "document name; defaults to the current document" },
        x: { type: "number", description: "page x for the inserted template root; defaults to 0" },
        y: { type: "number", description: "page y for the inserted template root; defaults to 0" },
        baseRevision: { type: "string", description: "optional revision guard from canvas_read" }
      },
      required: ["action"],
      additionalProperties: false
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_args, value) => [{ type: "text", text: JSON.stringify(value, null, 2) }]
    },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec);
      if (args?.action === "list") {
        const device = typeof args?.device === "string" ? args.device : DEFAULT_DEVICE;
        return {
          ok: true,
          templates: listTemplates(device),
          devices: listDevices(),
          presets: listPresets(),
          defaultDevice: DEFAULT_DEVICE,
          defaultPreset: "neutral",
          designSystems: Object.values(DESIGN_SYSTEMS).map((system) => ({
            id: system.id,
            name: system.name,
            source: system.source,
            platform: system.platform
          })),
          defaultDesignSystem: "material3",
          iosDesignSystem: "ios",
          designDoc: "canvas/DESIGN.md"
        };
      }
      if (args?.action === "foundation") {
        return {
          ok: true,
          devices: listDevices(),
          presets: listPresets(),
          defaultDevice: DEFAULT_DEVICE,
          defaultPreset: "neutral",
          resolved: resolveFoundation({
            system: typeof args?.system === "string" ? args.system : "ios",
            device: typeof args?.device === "string" ? args.device : DEFAULT_DEVICE,
            preset: typeof args?.preset === "string" ? args.preset : "neutral"
          })
        };
      }
      if (args?.action === "styles") {
        const system = getDesignSystem(typeof args?.system === "string" ? args.system : "material3");
        const styles = designSystemStyles(system.id);
        const name2 = defaultName2(sessionId, args?.name);
        await ensureScaffold(cwd, store);
        let current2;
        try {
          current2 = await readDoc(cwd, name2);
        } catch (error) {
          if (error?.status === 404) current2 = { doc: normalizeDoc(emptyDoc("\u8BBE\u8BA1\u89C4\u8303\u753B\u5E03")), revision: null, file: null };
          else throw error;
        }
        const existing = new Set(current2.doc.styles.map((style) => style.name));
        const added = styles.filter((style) => !existing.has(style.name));
        const working2 = structuredClone(current2.doc);
        working2.styles = [...working2.styles, ...added.map((style) => structuredClone(style))];
        const written2 = await writeDoc(ctx, store, cwd, name2, working2, {
          baseRevision: typeof args?.baseRevision === "string" ? args.baseRevision : void 0,
          source: "tool"
        });
        rememberDoc(store, sessionId, name2);
        return {
          ok: true,
          name: name2,
          path: relativePath(cwd, written2.file),
          revision: written2.revision,
          system: system.id,
          added: added.length,
          styles: written2.doc.styles.length
        };
      }
      const templateId = typeof args?.template === "string" ? args.template : "";
      if (!templateId) throw new Error('template id is required when action is "insert"');
      const name = defaultName2(sessionId, args?.name);
      await ensureScaffold(cwd, store);
      let current;
      try {
        current = await readDoc(cwd, name);
      } catch (error) {
        if (error?.status === 404) {
          current = { doc: normalizeDoc(emptyDoc("\u6A21\u677F\u753B\u5E03")), revision: null, file: null };
        } else {
          throw error;
        }
      }
      const built = instantiateTemplate(templateId, { device: typeof args?.device === "string" ? args.device : DEFAULT_DEVICE });
      built.node.x = Number.isFinite(args?.x) ? args.x : 0;
      built.node.y = Number.isFinite(args?.y) ? args.y : 0;
      const working = structuredClone(current.doc);
      applyOps(working, [{ op: "add", node: built.node }], { pageId: working.pages[0].id });
      const written = await writeDoc(ctx, store, cwd, name, working, {
        baseRevision: typeof args?.baseRevision === "string" ? args.baseRevision : void 0,
        source: "tool"
      });
      rememberDoc(store, sessionId, name);
      return {
        ok: true,
        name,
        path: relativePath(cwd, written.file),
        revision: written.revision,
        template: built.template,
        nodeId: built.node.id,
        width: built.node.width,
        height: built.node.height,
        stats: summary(written.doc)
      };
    }
  };
  const audit = {
    name: "canvas_audit",
    description: "Read-only deterministic design audit for a canvas document. Checks screenshot frame boundaries, text contrast, touch-target heuristics, clipped children, zero-size nodes, missing style/component/image references, unresolved comments and empty frames. Returns findings with severity and node ids plus skipped checks; it does not judge aesthetics or real interaction.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "document name; defaults to the current document" },
        pageId: { type: "string", description: "page id; defaults to the document page" },
        nodeId: { type: "string", description: "audit this node/subtree; defaults to all top-level frames" },
        system: { type: "string", enum: ["ios", "material3"], description: "touch-target system; defaults to material3" }
      },
      additionalProperties: false
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_args, value) => [{ type: "text", text: JSON.stringify(value, null, 2) }]
    },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec);
      const name = defaultName2(sessionId, args?.name);
      await ensureScaffold(cwd, store);
      const readValue = await readDoc(cwd, name);
      const result = auditDoc(readValue.doc, {
        ...typeof args?.pageId === "string" ? { pageId: args.pageId } : {},
        ...typeof args?.nodeId === "string" ? { nodeId: args.nodeId } : {},
        system: args?.system === "material3" ? "material3" : "ios"
      });
      return { ok: true, name, revision: readValue.revision, ...result };
    }
  };
  const image = {
    name: "canvas_image",
    description: "Probe, generate or import images for a canvas document. probe reports the current model and whether a local Codex CLI supports image_generation; generate uses Codex when that is the recommended route; import copies an existing image file (for example from the model native image tool) into canvas/assets/. Expected failures are returned, not thrown.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["probe", "generate", "import"] },
        prompt: { type: "string", description: 'image prompt for action "generate"' },
        path: { type: "string", description: 'source image path for action "import"' },
        name: { type: "string", description: "canvas document name; defaults to the current document" }
      },
      required: ["action"],
      additionalProperties: false
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_args, value) => [{ type: "text", text: JSON.stringify(value, null, 2) }]
    },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec);
      const name = defaultName2(sessionId, args?.name);
      if (args?.action === "probe") {
        const capabilities = await detectImageCapabilities({ modelSelection: currentModelSelection(ctx) });
        return { ok: true, name, capabilities };
      }
      const assetDir = join2(canvasRoot(cwd), "assets");
      await mkdir2(assetDir, { recursive: true });
      if (args?.action === "generate") {
        const prompt = typeof args?.prompt === "string" ? args.prompt.trim() : "";
        if (!prompt) throw new Error("image generate requires prompt");
        const capabilities = await detectImageCapabilities({ modelSelection: currentModelSelection(ctx) });
        if (capabilities.recommended === "native") {
          return {
            ok: false,
            code: "use-native-image-tool",
            message: "The current model should generate images natively. Generate with the host image tool, then call canvas_image import with the resulting file.",
            capabilities
          };
        }
        if (capabilities.recommended !== "codex") {
          return {
            ok: false,
            code: "image-generation-unavailable",
            message: "No native image tool or Codex image_generation support is available; import an existing image instead.",
            capabilities
          };
        }
        const generated = await generateWithCodex({
          prompt,
          assetDir,
          ...capabilities.codex?.bin ? { codexBin: capabilities.codex.bin } : {}
        });
        return { name, capabilities, ...generated };
      }
      if (args?.action === "import") {
        const source = typeof args?.path === "string" ? args.path : "";
        if (!source) throw new Error("image import requires path");
        const result = await importImage({ sourcePath: resolve3(cwd, source), assetDir });
        return { name, ...result };
      }
      throw new Error(`unknown canvas_image action "${String(args?.action)}"`);
    }
  };
  return [read, write, edit, comment, template, audit, image];
}
function apply(ctx) {
  const store = state();
  const disposers = [];
  const routes = createRoutes(ctx, store);
  disposers.push(ctx.webServer.register({ kind: "prefix", path: "/dsh-canvas", handler: routes }));
  for (const tool of createTools(ctx, store)) {
    disposers.push(ctx.tools.register(tool));
  }
  registerCanvasSkills(ctx, disposers);
  const systemPrompt = ctx.get("systemPrompt");
  if (systemPrompt && typeof systemPrompt.section === "function") {
    try {
      disposers.push(systemPrompt.section({ name: "dsh-canvas", order: 810, text: TOOL_PROMPT }));
    } catch {
    }
  }
  return () => {
    for (const disposer of disposers.splice(0)) {
      try {
        disposer();
      } catch {
      }
    }
    for (const client of store.sse) {
      try {
        client.response.end();
      } catch {
      }
    }
    store.sse.clear();
    for (const file of [...store.watchers.keys()]) releaseWatcher(store, file);
    store.selections.clear();
    store.lastDoc.clear();
    store.revisions.clear();
  };
}
export {
  apply
};
