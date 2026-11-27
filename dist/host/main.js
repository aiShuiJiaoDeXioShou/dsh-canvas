// src/host/main.ts
import { createHash as createHash5, randomUUID as randomUUID2 } from "node:crypto";
import { existsSync as existsSync2, renameSync, statSync, watchFile, unwatchFile } from "node:fs";
import { appendFile, mkdir as mkdir8, readFile as readFile6, readdir as readdir2, rename as rename2, stat as stat2, unlink as unlink3, writeFile as writeFile8 } from "node:fs/promises";
import { dirname as dirname4, extname as extname2, join as join8, relative as relative2, resolve as resolve6, sep as sep3 } from "node:path";

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
  const include = (x2, y) => {
    boundsMinX = Math.min(boundsMinX, x2);
    boundsMinY = Math.min(boundsMinY, y);
    boundsMaxX = Math.max(boundsMaxX, x2);
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
    const relative3 = command !== upper;
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
    const x2 = relative3 ? currentX + first : first;
    if (upper === "H") {
      currentX = x2;
      include(currentX, currentY);
      lastControlX = null;
      lastControlY = null;
      continue;
    }
    if (upper === "V") {
      currentY = relative3 ? currentY + first : first;
      include(currentX, currentY);
      lastControlX = null;
      lastControlY = null;
      continue;
    }
    const y = relative3 ? currentY + number() : number();
    switch (upper) {
      case "M":
        currentX = x2;
        currentY = y;
        startX = x2;
        startY = y;
        include(x2, y);
        lastControlX = null;
        lastControlY = null;
        command = relative3 ? "l" : "L";
        break;
      case "L":
        currentX = x2;
        currentY = y;
        include(x2, y);
        lastControlX = null;
        lastControlY = null;
        break;
      case "C": {
        const c1x = x2;
        const c1y = y;
        const c2x = relative3 ? currentX + number() : number();
        const c2y = relative3 ? currentY + number() : number();
        const ex = relative3 ? currentX + number() : number();
        const ey = relative3 ? currentY + number() : number();
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
        const c2x = x2;
        const c2y = y;
        const ex = relative3 ? currentX + number() : number();
        const ey = relative3 ? currentY + number() : number();
        include(c2x, c2y);
        include(ex, ey);
        currentX = ex;
        currentY = ey;
        lastControlX = c2x;
        lastControlY = c2y;
        break;
      }
      case "Q": {
        const qx = x2;
        const qy = y;
        const ex = relative3 ? currentX + number() : number();
        const ey = relative3 ? currentY + number() : number();
        include(qx, qy);
        include(ex, ey);
        currentX = ex;
        currentY = ey;
        lastControlX = qx;
        lastControlY = qy;
        break;
      }
      case "T": {
        const qx = x2;
        const qy = y;
        include(qx, qy);
        currentX = qx;
        currentY = qy;
        lastControlX = qx;
        lastControlY = qy;
        break;
      }
      case "A": {
        const rx = x2;
        const ry = y;
        const rotation = number();
        const largeArc = number();
        const sweep = number();
        const ex = relative3 ? currentX + number() : number();
        const ey = relative3 ? currentY + number() : number();
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
  path;
  code;
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
  const { min = -1e6, max: max2 = 1e6, int = false } = opts;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new CanvasError(path, "expected a finite number");
  }
  if (int && Math.round(value) !== value) throw new CanvasError(path, "expected an integer");
  if (value < min || value > max2) throw new CanvasError(path, `expected a number in [${min}, ${max2}]`);
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
    throw new CanvasError(path, `expected one of ${allowed.map((x2) => JSON.stringify(x2)).join(", ")}`);
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
    pages: [{ id: newId("page"), name: "\u753B\u5E03 1", background: null, children: [] }],
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
    alignCounter: oneOf(value.alignCounter ?? "start", `${path}.alignCounter`, LAYOUT_COUNTER),
    ...value.wrap === true ? { wrap: true } : {},
    ...value.ignoreHidden === true ? { ignoreHidden: true } : {}
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
  const type2 = oneOf(raw.type, `${path}.type`, NODE_TYPES);
  const node = { ...raw, type: type2 };
  node.id = id(raw.id, `${path}.id`);
  if (state2.ids.has(node.id)) throw new CanvasError(`${path}.id`, `duplicate id "${node.id}"`);
  state2.ids.add(node.id);
  if (isPlainObject(raw.interaction) && raw.interaction.id != null) {
    id(raw.interaction.id, `${path}.interaction.id`);
  }
  if (raw.pageRef != null) {
    node.pageRef = id(raw.pageRef, `${path}.pageRef`);
    if (node.pageRef === node.id) throw new CanvasError(`${path}.pageRef`, "a page reference cannot target itself");
  }
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
  if (raw.layoutPositioning != null) {
    node.layoutPositioning = oneOf(raw.layoutPositioning, `${path}.layoutPositioning`, ["auto", "absolute"]);
  }
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
    if (raw.cornerRadii != null) {
      if (!Array.isArray(raw.cornerRadii) || raw.cornerRadii.length !== 4) {
        throw new CanvasError(`${path}.cornerRadii`, "expected a 4-tuple of corner radii");
      }
      node.cornerRadii = [
        finite(raw.cornerRadii[0], `${path}.cornerRadii[0]`, { min: 0, max: 1e6 }),
        finite(raw.cornerRadii[1], `${path}.cornerRadii[1]`, { min: 0, max: 1e6 }),
        finite(raw.cornerRadii[2], `${path}.cornerRadii[2]`, { min: 0, max: 1e6 }),
        finite(raw.cornerRadii[3], `${path}.cornerRadii[3]`, { min: 0, max: 1e6 })
      ];
    }
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
        ...reply,
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
  const nodeState = { ids: nodeIds };
  doc.pages = doc.pages.map((page, pageIndex) => {
    if (!isPlainObject(page)) throw new CanvasError(`$.pages[${pageIndex}]`, "expected an object");
    const normalizedPage = {
      ...page,
      id: id(page.id ?? newId("page"), `$.pages[${pageIndex}].id`),
      name: typeof page.name === "string" && page.name.trim() ? page.name.trim().slice(0, 120) : `\u753B\u5E03 ${pageIndex + 1}`,
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
  const pageNodes = /* @__PURE__ */ new Map();
  walkNodes({ pages: doc.pages }, (node) => pageNodes.set(node.id, node));
  for (const node of pageNodes.values()) {
    if (!node.pageRef) continue;
    const source = pageNodes.get(node.pageRef);
    if (source?.pageRef) throw new CanvasError(`node[${node.id}].pageRef`, "expected a direct reference to a source node");
  }
  for (const node of pageNodes.values()) {
    if (node.pageRef && !pageNodes.has(node.pageRef)) delete node.pageRef;
  }
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
  const maxDepth = Number.isInteger(options.depth) ? Math.min(Math.max(options.depth, 0), 12) : 6;
  const childLimit = Number.isInteger(options.childrenLimit) ? Math.min(Math.max(options.childrenLimit, 0), 500) : 100;
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
    if (depth < maxDepth && Array.isArray(node.children) && node.children.length) {
      item.children = node.children.slice(0, childLimit).map((child) => outlineNode(child, depth + 1));
    }
    return item;
  };
  const outline = {
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
  if (!Array.isArray(options.fields) || options.fields.length === 0) return outline;
  const keep = new Set(options.fields);
  const filtered = { format: outline.format, version: outline.version, id: outline.id, title: outline.title };
  for (const key of ["page", "pages", "nodes", "selection", "components", "variantSets", "styles", "fonts", "comments", "stats", "meta"]) {
    if (key === "page" || key === "nodes" || key === "selection") {
      if (keep.has("nodes") || keep.has("page") || keep.has("selection")) filtered[key] = outline[key];
    } else if (keep.has(key)) {
      filtered[key] = outline[key];
    }
  }
  return filtered;
}
function findInDoc(doc, query, options = {}) {
  const needle = String(query ?? "").trim().toLowerCase();
  if (!needle) return { matches: [], truncated: false };
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
  const page = options.pageId ? findPage(doc, options.pageId) : firstPage(doc);
  const matches = [];
  let total = 0;
  const walk = (nodes, path) => {
    for (const node of nodes ?? []) {
      const haystack = [node.id, node.name, node.type === "text" ? node.text : ""];
      if (haystack.some((value) => String(value ?? "").toLowerCase().includes(needle))) {
        total += 1;
        if (matches.length < limit) {
          const item = {
            id: node.id,
            type: node.type,
            name: node.name,
            x: round(node.x),
            y: round(node.y),
            w: round(node.width),
            h: round(node.height),
            path: path.map((entry) => entry.id)
          };
          if (node.type === "text") item.text = String(node.text ?? "").slice(0, 80);
          matches.push(item);
        }
      }
      if (Array.isArray(node.children) && node.children.length) walk(node.children, [...path, node]);
    }
  };
  walk(page?.children ?? [], []);
  return { matches, total, truncated: total > matches.length };
}
function round(value) {
  return Math.round(Number(value) * 100) / 100;
}
function migrateDoc(input) {
  if (!isPlainObject(input)) throw new CanvasError("$", "expected a document object");
  const raw = clone(input);
  const from = Number.isInteger(raw.version) ? raw.version : 0;
  const changes = [];
  if (raw.format !== FORMAT) {
    changes.push(`format: ${raw.format === void 0 ? "missing" : String(raw.format)} -> ${FORMAT}`);
    raw.format = FORMAT;
  }
  if (from < 1) {
    if (!isPlainObject(raw.meta)) {
      raw.meta = { createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      changes.push("meta: added timestamps");
    }
    if (!Array.isArray(raw.pages) || raw.pages.length === 0) {
      raw.pages = [{ id: newId("page"), name: "\u753B\u5E03 1", children: [] }];
      changes.push("pages: added a default page");
    }
    changes.push(`version: ${from} -> ${VERSION}`);
  }
  raw.version = VERSION;
  const doc = normalizeDoc(raw);
  return { doc, from, to: VERSION, changes };
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
  "If the user does not name a design system, use the built-in design system documented in .dsh-canvas/DESIGN.md:",
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
function text(id2, name, x2, y, width, value, style = "body", color2 = C.label, extra = {}) {
  const font = type(style);
  return {
    id: id2,
    type: "text",
    name,
    x: x2,
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
function rect(id2, name, x2, y, width, height, extra = {}) {
  return {
    id: id2,
    type: "rect",
    name,
    x: x2,
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
function ellipse(id2, name, x2, y, width, height, extra = {}) {
  return {
    id: id2,
    type: "ellipse",
    name,
    x: x2,
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
function lineNode(id2, name, x2, y, length, extra = {}) {
  return {
    id: id2,
    type: "line",
    name,
    x: x2,
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
function frame(id2, name, x2, y, width, height, children, extra = {}) {
  return {
    id: id2,
    type: "frame",
    name,
    x: x2,
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
  const recordByNode = new Map(records.map((record2) => [record2.node, record2]));
  let targetRecord = null;
  if (options.nodeId != null) {
    targetRecord = records.find((record2) => record2.node.id === options.nodeId) ?? null;
    if (!targetRecord) throw new Error(`auditDoc: unknown node "${String(options.nodeId)}"`);
  }
  const scopeRecords = targetRecord ? scopeOf(targetRecord, records) : records;
  const scopeNodes = new Set(scopeRecords.map((record2) => record2.node));
  const rootFrames = targetRecord ? targetRecord.node.type === "frame" ? [targetRecord.node] : [] : (Array.isArray(page.children) ? page.children : []).filter((node) => isRecord(node) && node.type === "frame");
  const stylesById = mapById(doc.styles);
  const componentsById = mapById(doc.components);
  const system = options.system === "ios" ? "ios" : "material3";
  const findings = [];
  const skipped = new Set(BASE_SKIPPED);
  if (scopeRecords.some((record2) => record2.node.type === "instance")) {
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
  return records.filter((record2) => record2.node === target || record2.ancestors.includes(target));
}
function mapById(list2) {
  const map = /* @__PURE__ */ new Map();
  if (!Array.isArray(list2)) return map;
  for (const entry of list2) {
    if (isRecord(entry) && typeof entry.id === "string") map.set(entry.id, entry);
  }
  return map;
}
function runScreenshotBoundary(rootFrames, recordByNode, stylesById, findings) {
  for (const frame2 of rootFrames) {
    const record2 = recordByNode.get(frame2);
    if (record2 && !record2.visible) continue;
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
  for (const record2 of scopeRecords) {
    const node = record2.node;
    if (node.type !== "text" || !record2.visible) continue;
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
    if (record2.opacity < 1 - ALPHA_EPSILON) {
      skipped.add("opacity/blur");
      continue;
    }
    if (hasBlur(node, stylesById) || record2.ancestors.some((ancestor) => hasBlur(ancestor, stylesById))) {
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
    const background = resolveBackdrop(record2, page, stylesById, skipped);
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
function resolveSiblingBackdrop(record2, stylesById) {
  const parent = record2.parent;
  if (!parent || !Array.isArray(parent.children)) return null;
  const index = parent.children.indexOf(record2.node);
  if (index <= 0) return null;
  const node = record2.node;
  const center = {
    x: numberOr(node.x, 0) + numberOr(node.width, 0) / 2,
    y: numberOr(node.y, 0) + numberOr(node.height, 0) / 2
  };
  for (let siblingIndex = index - 1; siblingIndex >= 0; siblingIndex -= 1) {
    const sibling = parent.children[siblingIndex];
    if (!isRecord(sibling) || sibling.visible === false) continue;
    if (!["rect", "frame", "ellipse"].includes(sibling.type)) continue;
    const x2 = numberOr(sibling.x, 0);
    const y = numberOr(sibling.y, 0);
    const width = numberOr(sibling.width, 0);
    const height = numberOr(sibling.height, 0);
    if (width <= 0 || height <= 0) continue;
    if (center.x < x2 || center.x > x2 + width || center.y < y || center.y > y + height) continue;
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
function resolveBackdrop(record2, page, stylesById, skipped) {
  const sibling = resolveSiblingBackdrop(record2, stylesById);
  if (sibling) return sibling;
  for (let index = record2.ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = record2.ancestors[index];
    const first = resolvedFills(ancestor, stylesById)[0];
    if (!first) continue;
    if (first.type !== "solid") {
      skipped.add("gradient/image backgrounds");
      return null;
    }
    const color2 = parseColor(first.color);
    if (!color2) return null;
    const alpha = clamp01(color2.a * fillOpacity(first) * pathOpacity(record2.ancestors, index));
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
  for (const record2 of scopeRecords) {
    if (!record2.visible) continue;
    const node = record2.node;
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
  for (const record2 of scopeRecords) {
    const frame2 = record2.node;
    if (frame2.type !== "frame" || frame2.clip === false || !record2.visible) continue;
    const frameWidth = finiteNumber(frame2.width);
    const frameHeight = finiteNumber(frame2.height);
    if (frameWidth == null || frameHeight == null) continue;
    for (const child of Array.isArray(frame2.children) ? frame2.children : []) {
      if (!isRecord(child)) continue;
      const childRecord = recordByNode.get(child);
      if (!childRecord || !childRecord.visible) continue;
      const x2 = numberOr(child.x, 0);
      const y = numberOr(child.y, 0);
      const width = finiteNumber(child.width);
      const height = finiteNumber(child.height);
      if (width == null || height == null) continue;
      const overflow = {
        left: Math.max(0, -x2),
        top: Math.max(0, -y),
        right: Math.max(0, x2 + width - frameWidth),
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
  for (const record2 of scopeRecords) {
    if (!record2.visible) continue;
    const node = record2.node;
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
    const record2 = recordByNode.get(frame2);
    if (record2 && !record2.visible) continue;
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
    const run2 = await runCommand(command, args, { timeoutMs, env, cwd: tmp, spawnImpl: opts.spawnImpl });
    if (run2.spawnError) {
      if (run2.spawnError.code === "ENOENT" && !resolvedBin) {
        return failure(
          "codex-not-found",
          `Codex CLI "${requested}" was not found. Install Codex or set DSH_CANVAS_CODEX_BIN.`
        );
      }
      return failure("spawn-failed", `Could not start Codex: ${messageOf(run2.spawnError)}`);
    }
    if (run2.timedOut) {
      return failure(
        "timeout",
        `Codex image generation timed out after ${timeoutMs} ms and was stopped.`,
        run2.stdout,
        run2.stderr
      );
    }
    if (run2.exitCode !== 0) {
      return failure(
        "codex-failed",
        `Codex image generation failed with exit code ${run2.exitCode ?? "unknown"}${run2.signal ? ` (signal ${run2.signal})` : ""}.`,
        run2.stdout,
        run2.stderr
      );
    }
    const candidates = await findGeneratedImages(tmp, startedAt);
    if (candidates.length === 0) {
      return failure(
        "no-output",
        "Codex finished without writing a PNG/JPEG/WebP image to its output directory.",
        run2.stdout,
        run2.stderr
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
        run2.stdout,
        run2.stderr
      );
    }
    return failure(
      "invalid-image",
      `Codex wrote ${invalid ?? "a file"}, but it is not a valid PNG/JPEG/WebP image.`,
      run2.stdout,
      run2.stderr
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

// src/host/interaction-tools.ts
import { randomUUID } from "node:crypto";

// src/shared/interactions.ts
var NODE_ID = /^[A-Za-z0-9_-]{1,64}$/;
var ASSET = /^assets\/[A-Za-z0-9._-]{1,120}$/;
function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function list(value) {
  return Array.isArray(value) ? value : [];
}
function isId(value) {
  return typeof value === "string" && NODE_ID.test(value);
}
function imageAsset(fills) {
  for (const value of list(fills)) {
    const fill = record(value);
    if (fill?.type === "image" && typeof fill.asset === "string" && ASSET.test(fill.asset) && !fill.asset.includes("..")) {
      return fill.asset;
    }
  }
  return null;
}
function buildInteractionIndex(doc) {
  const nodes = /* @__PURE__ */ new Map();
  const edges = [];
  const wireIds = /* @__PURE__ */ new Set();
  const endpointIds = /* @__PURE__ */ new Set();
  const entries = /* @__PURE__ */ new Map();
  function visit(value, pageId, parentId, parentVisible) {
    const node = record(value);
    if (!node || !isId(node.id)) return null;
    const screenshot = record(node.screenshot)?.id;
    const entry = {
      id: node.id,
      sourceId: node.id,
      name: typeof node.name === "string" ? node.name : node.id,
      pageId,
      parentId,
      screenshot: isId(screenshot) ? screenshot : null,
      previewAsset: imageAsset(node.fills),
      visible: parentVisible && node.visible !== false
    };
    nodes.set(entry.id, entry);
    entries.set(entry.id, { node, entry });
    for (const child of list(node.children)) {
      const childAsset = visit(child, pageId, entry.id, entry.visible);
      entry.previewAsset ??= childAsset;
    }
    return entry.visible ? entry.previewAsset : null;
  }
  for (const value of list(record(doc)?.pages)) {
    const page = record(value);
    if (!page || !isId(page.id)) continue;
    for (const node of list(page.children)) visit(node, page.id, null, true);
  }
  const placements = /* @__PURE__ */ new Map();
  for (const { node, entry } of entries.values()) {
    const source = isId(node.pageRef) ? entries.get(node.pageRef) : null;
    if (source && !source.node.pageRef) entry.sourceId = source.entry.id;
    if (!entry.visible) continue;
    const members = placements.get(entry.sourceId);
    if (members) members.push(entry.id);
    else placements.set(entry.sourceId, [entry.id]);
  }
  for (const { node, entry } of entries.values()) {
    if (node.type !== "path" && node.type !== "line") continue;
    const interaction = record(node.interaction);
    if (!interaction || !isId(interaction.from) || !isId(interaction.to)) continue;
    const from = nodes.get(interaction.from);
    const to = nodes.get(interaction.to);
    if (!from?.visible || !to?.visible || !entry.visible) continue;
    const event = typeof interaction.event === "string" && interaction.event.trim() ? interaction.event.trim() : entry.name;
    const legacyLabel = entry.id.endsWith("-arrow") ? entry.id.replace(/-arrow$/, "-event") : null;
    const label = entries.get(isId(interaction.labelId) ? interaction.labelId : legacyLabel ?? "");
    const labelId = label?.node.type === "text" && label.entry.pageId === entry.pageId && (label.entry.id === interaction.labelId || label.entry.parentId === entry.parentId && (label.node.text === event || label.node.name === "\u89E6\u53D1\u4E8B\u4EF6")) ? label.entry.id : null;
    edges.push({ id: entry.id, from: from.id, to: to.id, event, labelId, interactionId: isId(interaction.id) ? interaction.id : entry.id });
    endpointIds.add(from.id);
    endpointIds.add(to.id);
    wireIds.add(entry.id);
    if (labelId) wireIds.add(labelId);
  }
  for (const id2 of [...endpointIds]) {
    let node = nodes.get(id2);
    while (node) {
      const members = placements.get(node.sourceId);
      if (members?.length > 1) for (const member of members) endpointIds.add(member);
      node = nodes.get(node.parentId ?? "");
    }
  }
  return { nodes, edges, wireIds, endpointIds, placements };
}
function within(index, node, parentId) {
  let current = node;
  while (current) {
    if (current.id === parentId) return true;
    current = index.nodes.get(current.parentId ?? "");
  }
  return false;
}
function interactionScope(index, selection) {
  const ids = /* @__PURE__ */ new Set();
  const names = /* @__PURE__ */ new Set();
  let anchorId = null;
  for (const key of selection) {
    const selected = index.nodes.get(key);
    if (!selected?.visible) continue;
    const descendants = [...index.endpointIds].filter((id2) => within(index, index.nodes.get(id2), selected.id));
    let anchor = selected;
    if (!descendants.length) {
      while (anchor && !index.endpointIds.has(anchor.id) && !anchor.screenshot) {
        anchor = index.nodes.get(anchor.parentId ?? "");
      }
    }
    if (!anchor || !descendants.length && !index.endpointIds.has(anchor.id)) continue;
    names.add(index.nodes.get(anchor.sourceId)?.name ?? anchor.name);
    anchorId ??= anchor.id;
    if (descendants.length) {
      for (const id2 of descendants) ids.add(id2);
    } else {
      ids.add(anchor.id);
    }
  }
  for (const key of selection) {
    let node = index.nodes.get(key);
    while (node?.visible && !ids.has(node.id)) node = index.nodes.get(node.parentId ?? "");
    const family = node?.visible && index.placements.get(node.sourceId);
    if (family && family.length > 1) {
      for (const member of family) {
        for (const endpoint of index.endpointIds) {
          if (within(index, index.nodes.get(endpoint), member)) ids.add(endpoint);
        }
      }
    }
  }
  const edges = [];
  const targets = /* @__PURE__ */ new Map();
  function addTarget(id2, sourceId, edge, direction) {
    if (id2 === sourceId) return;
    let target = targets.get(id2);
    if (!target) {
      target = { ...index.nodes.get(id2), key: id2, events: [] };
      targets.set(id2, target);
    }
    target.events.push({ edgeId: edge.id, direction, text: edge.event });
  }
  for (const edge of index.edges) {
    const from = ids.has(edge.from);
    const to = ids.has(edge.to);
    if (!from && !to) continue;
    edges.push(edge);
    if (from) addTarget(edge.to, edge.from, edge, "outgoing");
    if (to) addTarget(edge.from, edge.to, edge, "incoming");
  }
  const placements = selection.length === 1 && anchorId ? index.placements.get(index.nodes.get(anchorId).sourceId) ?? [] : [];
  return { ids, edges, targets: [...targets.values()], name: [...names].join("\u3001"), anchorId, placements };
}

// src/host/interaction-tools.ts
function createInteractionChannel() {
  const pending = /* @__PURE__ */ new Map();
  function request(clients, file, sessionId, action, nodeId) {
    const client = [...clients].reverse().find((entry) => entry.file === file && entry.sessionId === sessionId);
    if (!client) return Promise.resolve({ ok: false, error: "no-live-canvas", message: "Open this canvas in the current session first." });
    const requestId = randomUUID();
    return new Promise((resolve7) => {
      const complete = (result) => {
        clearTimeout(timer);
        pending.delete(requestId);
        resolve7(result);
      };
      const timer = setTimeout(() => complete({ ok: false, error: "view-timeout", message: "The live canvas did not confirm the interaction request." }), 5e3);
      pending.set(requestId, { sessionId, complete });
      try {
        client.response.write(`data: ${JSON.stringify({ type: "interaction-view-request", requestId, action, nodeId })}

`);
      } catch {
        complete({ ok: false, error: "no-live-canvas", message: "The live canvas disconnected." });
      }
    });
  }
  return {
    request,
    reply(sessionId, requestId, result) {
      const entry = pending.get(requestId);
      if (!entry || entry.sessionId !== sessionId) return false;
      entry.complete(result);
      return true;
    },
    dispose() {
      for (const entry of pending.values()) entry.complete({ ok: false, error: "plugin-unloaded" });
    }
  };
}
function describeInteractions(doc, options = {}) {
  const index = buildInteractionIndex(doc);
  const ids = options.ids ?? [];
  const scope = ids.length ? interactionScope(index, ids) : null;
  const all = scope?.edges ?? index.edges;
  const offset = Math.max(0, Math.floor(options.offset || 0));
  const limit = Math.min(50, Math.max(1, Math.floor(options.limit || 25)));
  const page = all.slice(offset, offset + limit);
  const returned = new Set(page.map((edge) => edge.id));
  function endpoint(id2) {
    const node = index.nodes.get(id2);
    return { nodeId: id2, name: node.name, pageId: node.pageId, sourceNodeId: node.sourceId, screenshotId: node.screenshot, previewAsset: node.previewAsset };
  }
  return {
    anchor: scope?.anchorId ? endpoint(scope.anchorId) : null,
    total: all.length,
    offset,
    nextOffset: offset + page.length < all.length ? offset + page.length : null,
    connections: page.map((edge) => ({
      id: edge.id,
      interactionId: edge.interactionId,
      type: "interaction",
      trigger: edge.event,
      eventNodeId: edge.labelId,
      from: endpoint(edge.from),
      to: endpoint(edge.to)
    })),
    ...scope ? {
      placementIds: scope.placements,
      relatedPages: scope.targets.flatMap((target) => {
        const events = target.events.filter((event) => returned.has(event.edgeId));
        return events.length ? [{ ...endpoint(target.id), events: events.map((event) => ({
          connectionId: event.edgeId,
          type: "interaction",
          direction: event.direction,
          trigger: event.text
        })) }] : [];
      })
    } : {}
  };
}

// src/host/skills.ts
import { readFileSync } from "node:fs";
import { resolve as resolve2 } from "node:path";
import { fileURLToPath } from "node:url";
var SKILL_NAME = "canvas-ui-design";
var FIGMA_SETUP_SKILL_NAME = "canvas-figma-setup";
var BUNDLED_SKILLS = [
  { name: SKILL_NAME, dirUrl: new URL("../../skills/canvas-ui-design/", import.meta.url) },
  { name: FIGMA_SETUP_SKILL_NAME, dirUrl: new URL("../../skills/canvas-figma-setup/", import.meta.url) }
];
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
function loadSkillFromDir(expectedName, dirUrl) {
  const fileUrl = new URL("SKILL.md", dirUrl);
  const raw = readFileSync(fileUrl, "utf8");
  const { meta, body } = parseFrontmatter(raw);
  if (meta.name !== expectedName) throw new Error(`skill name must be "${expectedName}"`);
  if (!meta.description) throw new Error(`skill "${expectedName}" requires a description`);
  if (!body) throw new Error(`skill "${expectedName}" has an empty body`);
  return {
    name: meta.name,
    description: meta.description,
    ...meta.whenToUse ? { whenToUse: meta.whenToUse } : {},
    content: body,
    path: fileURLToPath(fileUrl),
    directory: resolve2(fileURLToPath(dirUrl))
  };
}
function loadAllCanvasSkills() {
  return BUNDLED_SKILLS.map((spec) => loadSkillFromDir(spec.name, spec.dirUrl));
}
function registerCanvasSkills(ctx, disposers) {
  const skills = ctx?.get?.("skills");
  if (!skills || typeof skills.register !== "function") return false;
  let registered = false;
  for (const skill of loadAllCanvasSkills()) {
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
      registered = true;
    } catch (error) {
      console.warn(
        `[dsh-canvas] could not register skill "${skill.name}":`,
        error instanceof Error ? error.message : error
      );
    }
  }
  return registered;
}

// src/host/figma/bridge.ts
import { randomBytes } from "node:crypto";
var TOKEN_TTL_MS = 4 * 60 * 60 * 1e3;
var FigmaPluginBridge = class {
  byToken = /* @__PURE__ */ new Map();
  byCode = /* @__PURE__ */ new Map();
  createPairing(params) {
    this.pruneExpired();
    for (const existing of this.byToken.values()) {
      if (existing.sessionId === params.sessionId && existing.canvasName === params.canvasName) {
        this.byToken.delete(existing.token);
        this.byCode.delete(existing.pairingCode);
      }
    }
    const token = `dshb_${randomBytes(24).toString("base64url")}`;
    const rawCode = randomBytes(4).toString("hex").toUpperCase();
    const pairingCode = `${rawCode.slice(0, 4)}-${rawCode.slice(4, 8)}`;
    const now = Date.now();
    const session = {
      token,
      pairingCode,
      sessionId: params.sessionId,
      cwd: params.cwd,
      canvasName: params.canvasName,
      createdAt: now,
      expiresAt: now + TOKEN_TTL_MS
    };
    this.byToken.set(token, session);
    this.byCode.set(pairingCode, session);
    return session;
  }
  exchangeCode(pairingCode, pluginClient = "drafi-figma-plugin") {
    this.pruneExpired();
    const normalized = String(pairingCode ?? "").trim().toUpperCase();
    const session = this.byCode.get(normalized);
    if (!session) return null;
    session.connectedAt = Date.now();
    session.pluginClient = pluginClient;
    return session;
  }
  authenticateBearer(request) {
    this.pruneExpired();
    const auth = String(request.headers.authorization ?? "").trim();
    if (!auth.startsWith("Bearer ")) return null;
    const token = auth.slice(7).trim();
    const session = this.byToken.get(token);
    if (!session) return null;
    session.connectedAt = Date.now();
    return session;
  }
  getForCanvas(sessionId, canvasName) {
    this.pruneExpired();
    for (const s of this.byToken.values()) {
      if (s.sessionId === sessionId && s.canvasName === canvasName) return s;
    }
    return null;
  }
  queuePatch(sessionId, canvasName, patch) {
    const session = this.getForCanvas(sessionId, canvasName);
    if (!session) return false;
    session.pendingPatch = patch;
    return true;
  }
  consumePatch(tokenSession) {
    const patch = tokenSession.pendingPatch ?? null;
    tokenSession.pendingPatch = null;
    return patch;
  }
  revoke(sessionId, canvasName) {
    let count = 0;
    for (const [token, s] of this.byToken.entries()) {
      if (s.sessionId === sessionId && (!canvasName || s.canvasName === canvasName)) {
        this.byToken.delete(token);
        this.byCode.delete(s.pairingCode);
        count += 1;
      }
    }
    return count;
  }
  dispose() {
    this.byToken.clear();
    this.byCode.clear();
  }
  pruneExpired() {
    const now = Date.now();
    for (const [token, s] of this.byToken.entries()) {
      if (s.expiresAt <= now) {
        this.byToken.delete(token);
        this.byCode.delete(s.pairingCode);
      }
    }
  }
};
function applyBridgeCors(request, response) {
  const origin = typeof request.headers.origin === "string" ? request.headers.origin : "";
  const allowed = !origin || origin === "null" || origin === "https://www.figma.com" || /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(origin);
  if (!allowed) return false;
  response.setHeader("access-control-allow-origin", origin || "*");
  response.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  response.setHeader("access-control-allow-headers", "authorization, content-type");
  response.setHeader("access-control-allow-private-network", "true");
  response.setHeader("vary", "origin");
  return true;
}

// src/host/figma/routes.ts
import { mkdir as mkdir7, readFile as readFile5, writeFile as writeFile7 } from "node:fs/promises";
import { join as join7, relative, resolve as resolve5, sep as sep2 } from "node:path";

// src/shared/scene/text-measure.ts
var DEFAULT_FONT = Object.freeze({
  family: "system-ui",
  weight: 400,
  style: "normal",
  size: 14,
  lineHeight: 1.4,
  letterSpacing: 0
});
var MAX_CACHE_ENTRIES = 4e3;
var EPSILON2 = 1e-6;
var WORD_JOINER = "\u2060";
var CJK_CHAR_RE = /[\u2E80-\u2FFF\u3000-\u303F\u3040-\u30FF\u3100-\u31FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF\u{1F300}-\u{1FAFF}]/u;
var GENERIC_FAMILIES = /* @__PURE__ */ new Set([
  "system-ui",
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "ui-rounded",
  "sans-serif",
  "serif",
  "monospace",
  "cursive",
  "fantasy",
  "math",
  "emoji",
  "fangsong",
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI"
]);
function createTextMeasurer() {
  const cache = /* @__PURE__ */ new Map();
  let epoch = 0;
  let canvasContext = null;
  let canvasTried = false;
  const document = browserDocument();
  const fonts = document && document.fonts ? document.fonts : null;
  let fontsStatus = fonts && typeof fonts.status === "string" ? fonts.status : "loaded";
  const invalidate = () => {
    cache.clear();
    epoch += 1;
  };
  if (fonts) {
    try {
      if (typeof fonts.addEventListener === "function") {
        fonts.addEventListener("loadingdone", invalidate);
        fonts.addEventListener("loadingerror", invalidate);
      } else if (fonts.ready && typeof fonts.ready.then === "function") {
        fonts.ready.then(invalidate, () => void 0);
      }
    } catch {
    }
  }
  function checkFontStatus() {
    if (!fonts || typeof fonts.status !== "string") return;
    if (fonts.status === fontsStatus) return;
    fontsStatus = fonts.status;
    if (fontsStatus === "loaded") invalidate();
  }
  function getContext() {
    if (canvasTried) return canvasContext;
    canvasTried = true;
    const doc = browserDocument();
    if (!doc) return null;
    try {
      const canvas = doc.createElement("canvas");
      const context = canvas && typeof canvas.getContext === "function" ? canvas.getContext("2d") : null;
      if (context && typeof context.measureText === "function") canvasContext = context;
    } catch {
      canvasContext = null;
    }
    return canvasContext;
  }
  function measure(request) {
    checkFontStatus();
    const text2 = request && typeof request.text === "string" ? request.text : "";
    const font = normalizeFont2(request && request.font);
    const rawMaxWidth = request ? request.maxWidth : Infinity;
    const maxWidth = typeof rawMaxWidth === "number" && rawMaxWidth > 0 ? rawMaxWidth : Infinity;
    const key = `${font.family}|${font.weight}|${font.style}|${font.size}|${font.lineHeight}|${font.letterSpacing}|${maxWidth === Infinity ? "inf" : maxWidth}|${text2.length}|${text2}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const context = getContext();
    const result = context ? measureWithContext(context, text2, font, maxWidth) : measureWithFallback(text2, font, maxWidth);
    if (!fonts || fonts.status !== "loading") {
      if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
      cache.set(key, result);
    }
    return result;
  }
  measure.clearCache = invalidate;
  measure.fontEpoch = () => epoch;
  measure.fontsReady = () => fonts && fonts.ready ? fonts.ready : Promise.resolve();
  measure.isCanvasBacked = () => Boolean(getContext());
  return measure;
}
function normalizeFont2(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    family: typeof source.family === "string" && source.family.trim() ? source.family.trim() : DEFAULT_FONT.family,
    weight: finiteOr(source.weight, DEFAULT_FONT.weight),
    style: source.style === "italic" ? "italic" : "normal",
    size: positiveOr(source.size, DEFAULT_FONT.size),
    lineHeight: positiveOr(source.lineHeight, DEFAULT_FONT.lineHeight),
    letterSpacing: finiteOr(source.letterSpacing, DEFAULT_FONT.letterSpacing)
  };
}
function finiteOr(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function positiveOr(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}
function browserDocument() {
  try {
    const global = typeof globalThis !== "undefined" ? globalThis : void 0;
    const document = global ? global.document : null;
    return document && typeof document.createElement === "function" ? document : null;
  } catch {
    return null;
  }
}
function measureWithContext(context, text2, font, maxWidth) {
  try {
    context.font = cssFont(font);
  } catch {
  }
  const measureWidth = (value) => {
    try {
      const metrics = context.measureText(value);
      return metrics && Number.isFinite(metrics.width) ? metrics.width : 0;
    } catch {
      return 0;
    }
  };
  return wrapText(text2, font, maxWidth, measureWidth);
}
function measureWithFallback(text2, font, maxWidth) {
  const measureWidth = (value) => {
    let width = 0;
    for (const char of value) width += CJK_CHAR_RE.test(char) ? font.size : font.size * 0.55;
    return width;
  };
  return wrapText(text2, font, maxWidth, measureWidth);
}
function cssFont(font) {
  const style = font.style === "italic" ? "italic " : "";
  const family = cssFamily(font.family);
  return `${style}${font.weight} ${font.size}px ${family}`;
}
function cssFamily(family) {
  if (family.includes(",")) return family;
  if (GENERIC_FAMILIES.has(family)) return family;
  if (/^[A-Za-z][A-Za-z0-9_-]*$/.test(family)) return family;
  return JSON.stringify(family);
}
function wrapText(text2, font, maxWidth, measureWidth) {
  const letterSpacing = font.letterSpacing;
  const lineHeightPx = font.size * font.lineHeight;
  const wrap = Number.isFinite(maxWidth) && maxWidth > 0;
  const widthOf = (value) => measureWidth(value) + letterSpacing * codePointLength(value);
  const lines = [];
  const emit = (rawLine) => {
    const trimmed = rawLine.replace(/[ \t\u00A0]+$/u, "");
    lines.push({ text: trimmed, width: Math.max(0, widthOf(trimmed)) });
  };
  const paragraphs = String(text2).replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
  for (const paragraph of paragraphs) {
    let lineTokens = [];
    let lineWidth = 0;
    const flush = () => {
      emit(lineTokens.join(""));
      lineTokens = [];
      lineWidth = 0;
    };
    const placeToken = (token) => {
      const tokenWidth = widthOf(token);
      if (!wrap) {
        lineTokens.push(token);
        lineWidth += tokenWidth;
        return;
      }
      if (lineWidth + tokenWidth <= maxWidth + EPSILON2) {
        lineTokens.push(token);
        lineWidth += tokenWidth;
        return;
      }
      if (lineTokens.length > 0) {
        flush();
        placeToken(token);
        return;
      }
      let buffer = "";
      let bufferWidth = 0;
      for (const char of token) {
        const charWidth = widthOf(char);
        if (buffer && bufferWidth + charWidth > maxWidth + EPSILON2) {
          emit(buffer);
          buffer = char;
          bufferWidth = charWidth;
        } else {
          buffer += char;
          bufferWidth += charWidth;
        }
      }
      if (buffer) {
        lineTokens.push(buffer);
        lineWidth = bufferWidth;
      }
    };
    for (const token of tokenizeParagraph(paragraph)) {
      if (lineTokens.length === 0 && /^[ \t\u00A0]+$/u.test(token)) continue;
      placeToken(token);
    }
    flush();
  }
  let width = 0;
  for (const line of lines) width = Math.max(width, line.width);
  return {
    lines,
    width,
    height: lines.length * lineHeightPx
  };
}
function tokenizeParagraph(paragraph) {
  const tokens = [];
  let word = "";
  for (const char of paragraph) {
    if (char === WORD_JOINER) continue;
    if (CJK_CHAR_RE.test(char)) {
      if (word) {
        tokens.push(word);
        word = "";
      }
      tokens.push(char);
    } else if (char === " " || char === "\xA0") {
      if (word) {
        tokens.push(word);
        word = "";
      }
      tokens.push(char);
    } else {
      word += char;
    }
  }
  if (word) tokens.push(word);
  return tokens;
}
function codePointLength(value) {
  let length = 0;
  for (const _char of value) length += 1;
  return length;
}

// src/shared/scene/layout.ts
var DEFAULT_FONT2 = Object.freeze({
  family: "system-ui",
  weight: 400,
  style: "normal",
  size: 14,
  lineHeight: 1.4,
  letterSpacing: 0
});
var EPSILON3 = 1e-6;
function layoutScene(scene) {
  if (!scene || !Array.isArray(scene.roots)) return scene;
  const issues = Array.isArray(scene.issues) ? scene.issues : scene.issues = [];
  let measure = scene.measureText;
  if (typeof measure !== "function" && scene.options && typeof scene.options.measureText === "function") {
    measure = scene.options.measureText;
  }
  if (typeof measure !== "function") measure = createTextMeasurer();
  scene.measureText = measure;
  const state2 = { issues, measure };
  for (const root of scene.roots) measureNode(root);
  for (const root of scene.roots) arrangeNode(root, 0, 0);
  return scene;
  function measureNode(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "text") {
      measureTextNode(node);
      return;
    }
    const children = Array.isArray(node.children) ? node.children : [];
    for (const child of children) measureNode(child);
    const layout = isObject(node.layout) ? node.layout : null;
    const sizing = effectiveSizing(node);
    if (layout) measureAutoLayoutNode(node, layout, sizing, children);
    else measureFreeformNode(node, sizing, children);
  }
  function measureTextNode(node) {
    const sizing = effectiveSizing(node);
    const font = isObject(node.font) ? { ...DEFAULT_FONT2, ...node.font } : DEFAULT_FONT2;
    const wrapWidth = sizing.h === "hug" ? Infinity : Math.max(0, numberOr2(node.width, 0));
    const result = safeMeasure(state2, {
      text: typeof node.text === "string" ? node.text : "",
      font,
      maxWidth: wrapWidth,
      autoHeight: node.autoHeight !== false
    }, node);
    node.lines = result.lines;
    if (sizing.h === "hug") node.width = Math.max(0, result.width);
    if (sizing.v === "hug") node.height = Math.max(0, result.height);
  }
  function measureAutoLayoutNode(node, layout, sizing, allChildren) {
    const ignoreHidden = layout.ignoreHidden === true || scene?.doc?.meta?.layoutIgnoreHidden === true;
    const children = allChildren.filter((child) => {
      if (child.layoutPositioning === "absolute") return false;
      if (ignoreHidden && child.visible === false) return false;
      return true;
    });
    const direction = layout.direction === "horizontal" ? "horizontal" : "vertical";
    const horizontal = direction === "horizontal";
    const padding = normalizePadding(layout.padding);
    const gap = Math.max(0, numberOr2(layout.gap, 0));
    const alignCounter = layout.alignCounter ?? "start";
    const padX = padding.left + padding.right;
    const padY = padding.top + padding.bottom;
    const innerWidth = sizing.h === "hug" ? null : Math.max(0, numberOr2(node.width, 0) - padX);
    const innerHeight = sizing.v === "hug" ? null : Math.max(0, numberOr2(node.height, 0) - padY);
    const primaryAvailable = horizontal ? innerWidth : innerHeight;
    const crossAvailable = horizontal ? innerHeight : innerWidth;
    const primaryAxis = horizontal ? "width" : "height";
    const crossAxis = horizontal ? "height" : "width";
    if (crossAvailable != null) {
      for (const child of children) {
        const childSizing = effectiveSizing(child);
        const crossSizing = horizontal ? childSizing.v : childSizing.h;
        const shouldFill = crossSizing === "fill" || alignCounter === "stretch" && crossSizing === "fixed";
        if (shouldFill && Math.abs(numberOr2(child[crossAxis], 0) - crossAvailable) > EPSILON3) {
          child[crossAxis] = crossAvailable;
          measureNode(child);
        }
      }
    }
    if (primaryAvailable != null) {
      const fillChildren = children.filter((child) => {
        const childSizing = effectiveSizing(child);
        return (horizontal ? childSizing.h : childSizing.v) === "fill";
      });
      if (fillChildren.length) {
        let fixedTotal = 0;
        for (const child of children) {
          if (fillChildren.includes(child)) continue;
          fixedTotal += Math.max(0, numberOr2(child[primaryAxis], 0));
        }
        const gapTotal = gap * Math.max(0, children.length - 1);
        const fillSize = Math.max(0, (primaryAvailable - fixedTotal - gapTotal) / fillChildren.length);
        for (const child of fillChildren) {
          if (Math.abs(numberOr2(child[primaryAxis], 0) - fillSize) > EPSILON3) {
            child[primaryAxis] = fillSize;
            measureNode(child);
          }
        }
      }
    }
    let contentPrimary = gap * Math.max(0, children.length - 1);
    let contentCross = 0;
    for (const child of children) {
      contentPrimary += Math.max(0, numberOr2(child[primaryAxis], 0));
      contentCross = Math.max(contentCross, Math.max(0, numberOr2(child[crossAxis], 0)));
    }
    if (sizing.h === "hug") {
      node.width = Math.max(0, horizontal ? contentPrimary + padX : contentCross + padX);
    }
    if (sizing.v === "hug") {
      node.height = Math.max(0, horizontal ? contentCross + padY : contentPrimary + padY);
    }
  }
  function measureFreeformNode(node, sizing, children) {
    let contentWidth = 0;
    let contentHeight = 0;
    for (const child of children) {
      contentWidth = Math.max(contentWidth, numberOr2(child.x, 0) + Math.max(0, numberOr2(child.width, 0)));
      contentHeight = Math.max(contentHeight, numberOr2(child.y, 0) + Math.max(0, numberOr2(child.height, 0)));
    }
    if (sizing.h === "hug") node.width = Math.max(0, contentWidth);
    if (sizing.v === "hug") node.height = Math.max(0, contentHeight);
  }
  function arrangeNode(node, originX, originY) {
    if (!node || typeof node !== "object") return;
    node.absX = originX + numberOr2(node.x, 0);
    node.absY = originY + numberOr2(node.y, 0);
    const children = Array.isArray(node.children) ? node.children : [];
    if (!children.length) return;
    const layout = isObject(node.layout) ? node.layout : null;
    if (layout) arrangeAutoLayoutChildren(node, layout, children);
    for (const child of children) arrangeNode(child, node.absX, node.absY);
  }
  function arrangeAutoLayoutChildren(node, layout, allChildren) {
    const ignoreHidden = layout.ignoreHidden === true || scene?.doc?.meta?.layoutIgnoreHidden === true;
    const children = allChildren.filter((child) => {
      if (child.layoutPositioning === "absolute") return false;
      if (ignoreHidden && child.visible === false) return false;
      return true;
    });
    const horizontal = layout.direction === "horizontal";
    const padding = normalizePadding(layout.padding);
    const gap = Math.max(0, numberOr2(layout.gap, 0));
    const alignPrimary = layout.alignPrimary ?? "start";
    const alignCounter = layout.alignCounter ?? "start";
    const primaryAxis = horizontal ? "width" : "height";
    const crossAxis = horizontal ? "height" : "width";
    const padPrimaryStart = horizontal ? padding.left : padding.top;
    const padCrossStart = horizontal ? padding.top : padding.left;
    const innerPrimary = Math.max(
      0,
      numberOr2(node[primaryAxis], 0) - (horizontal ? padding.left + padding.right : padding.top + padding.bottom)
    );
    const innerCross = Math.max(
      0,
      numberOr2(node[crossAxis], 0) - (horizontal ? padding.top + padding.bottom : padding.left + padding.right)
    );
    let contentPrimary = gap * Math.max(0, children.length - 1);
    for (const child of children) contentPrimary += Math.max(0, numberOr2(child[primaryAxis], 0));
    const leftover = innerPrimary - contentPrimary;
    let offset = 0;
    let effectiveGap = gap;
    if (alignPrimary === "center") offset = leftover / 2;
    else if (alignPrimary === "end") offset = leftover;
    else if (alignPrimary === "space-between" && children.length > 1) {
      effectiveGap = gap + Math.max(0, leftover) / (children.length - 1);
    }
    let cursor = padPrimaryStart + offset;
    for (const child of children) {
      const childPrimary = Math.max(0, numberOr2(child[primaryAxis], 0));
      const childCross = Math.max(0, numberOr2(child[crossAxis], 0));
      let crossPosition = padCrossStart;
      if (alignCounter === "center") crossPosition = padCrossStart + (innerCross - childCross) / 2;
      else if (alignCounter === "end") crossPosition = padCrossStart + innerCross - childCross;
      if (horizontal) {
        child.x = cursor;
        child.y = crossPosition;
      } else {
        child.x = crossPosition;
        child.y = cursor;
      }
      cursor += childPrimary + effectiveGap;
    }
  }
}
function effectiveSizing(node) {
  const raw = isObject(node.layoutSizing) ? node.layoutSizing : {};
  const h = raw.h === "hug" || raw.h === "fill" ? raw.h : "fixed";
  let v;
  if (raw.v === "hug" || raw.v === "fill") v = raw.v;
  else if (raw.v === "fixed") v = "fixed";
  else v = node.type === "text" && node.autoHeight !== false ? "hug" : "fixed";
  return { h, v };
}
function normalizePadding(padding) {
  const source = isObject(padding) ? padding : {};
  return {
    top: numberOr2(source.top, 0),
    right: numberOr2(source.right, 0),
    bottom: numberOr2(source.bottom, 0),
    left: numberOr2(source.left, 0)
  };
}
function safeMeasure(state2, request, node) {
  try {
    const result = state2.measure(request);
    if (result && Array.isArray(result.lines) && Number.isFinite(result.width) && Number.isFinite(result.height)) {
      return {
        lines: result.lines.map((line) => ({
          text: typeof line?.text === "string" ? line.text : "",
          width: numberOr2(line?.width, 0)
        })),
        width: result.width,
        height: result.height
      };
    }
    throw new Error("measureText returned an invalid result");
  } catch (error) {
    state2.issues.push(`text measurement failed for "${node.key ?? node.id ?? "text"}": ${String(error instanceof Error ? error.message : error)}`);
    return fallbackTextResult(request);
  }
}
function fallbackTextResult(request) {
  const font = isObject(request.font) ? { ...DEFAULT_FONT2, ...request.font } : DEFAULT_FONT2;
  const size = numberOr2(font.size, DEFAULT_FONT2.size);
  const lineHeight = numberOr2(font.lineHeight, DEFAULT_FONT2.lineHeight);
  const lines = String(request.text ?? "").replace(/\r\n?/g, "\n").split("\n").map((line) => ({ text: line, width: [...line].length * size * 0.55 }));
  let width = 0;
  for (const line of lines) width = Math.max(width, line.width);
  return { lines, width, height: lines.length * size * lineHeight };
}
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function numberOr2(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

// src/shared/scene/resolve.ts
var MAX_COMPONENT_DEPTH = 24;
var MAX_INSTANCE_NODES = 2e4;
var DEFAULT_FONT3 = Object.freeze({
  family: "system-ui",
  weight: 400,
  style: "normal",
  size: 14,
  lineHeight: 1.4,
  letterSpacing: 0
});
var ALIGNMENTS2 = /* @__PURE__ */ new Set(["left", "center", "right", "justify"]);
var VERTICAL_ALIGNMENTS2 = /* @__PURE__ */ new Set(["top", "center", "bottom"]);
var SIZINGS2 = /* @__PURE__ */ new Set(["fixed", "hug", "fill"]);
function buildScene(doc, options = {}) {
  const source = isObject2(doc) ? doc : {};
  const settings = isObject2(options) ? { ...options } : {};
  const issues = [];
  if (!isObject2(doc)) issues.push("document is missing or malformed");
  const mode = settings.mode === "component" ? "component" : "design";
  const measureText = typeof settings.measureText === "function" ? settings.measureText : createTextMeasurer();
  const componentById = /* @__PURE__ */ new Map();
  for (const component of Array.isArray(source.components) ? source.components : []) {
    if (isObject2(component) && typeof component.id === "string") componentById.set(component.id, component);
  }
  const styleById = /* @__PURE__ */ new Map();
  for (const style of Array.isArray(source.styles) ? source.styles : []) {
    if (isObject2(style) && typeof style.id === "string") styleById.set(style.id, style);
  }
  const variantSetById = /* @__PURE__ */ new Map();
  for (const set of Array.isArray(source.variantSets) ? source.variantSets : []) {
    if (isObject2(set) && typeof set.id === "string") variantSetById.set(set.id, set);
  }
  const byKey = /* @__PURE__ */ new Map();
  const bySourceId = /* @__PURE__ */ new Map();
  const ctx = {
    issues,
    componentById,
    styleById,
    variantSetById,
    byKey,
    bySourceId,
    expandedNodes: 0,
    budgetIssued: false,
    componentStack: []
  };
  const roots = [];
  const page = mode === "design" ? selectPage2(source, settings.pageId, issues) : null;
  if (mode === "design") {
    if (page) {
      const list2 = Array.isArray(page.children) ? page.children : [];
      for (const child of list2) {
        if (!isObject2(child)) {
          issues.push("skipped a malformed page child");
          continue;
        }
        const node = resolveEntry(
          child,
          {
            key: typeof child.id === "string" ? child.id : `node-${roots.length}`,
            keyPrefix: null,
            instanceId: null,
            editable: true,
            overrides: null,
            parent: null
          },
          ctx
        );
        if (node) roots.push(node);
      }
    }
  } else {
    const componentId = typeof settings.componentId === "string" ? settings.componentId : null;
    const component = componentId ? componentById.get(componentId) : null;
    if (!component || !isObject2(component.root)) {
      issues.push(`component mode: unknown component "${String(componentId)}"`);
    } else {
      const root = component.root;
      const node = resolveEntry(
        root,
        {
          key: typeof root.id === "string" ? root.id : "component-root",
          keyPrefix: null,
          instanceId: null,
          editable: true,
          overrides: null,
          parent: null
        },
        ctx
      );
      if (node) roots.push(node);
    }
  }
  const scene = {
    pageId: page && typeof page.id === "string" ? page.id : null,
    title: typeof source.title === "string" ? source.title : "",
    mode,
    roots,
    byKey,
    bySourceId,
    componentById,
    styleById,
    issues,
    componentId: mode === "component" && typeof settings.componentId === "string" ? settings.componentId : null,
    viewportWidth: numberOr3(settings.viewportWidth, null),
    page,
    background: page && typeof page.background === "string" ? page.background : null,
    doc: source,
    measureText,
    options: settings
  };
  attachRebuild(scene, doc, settings);
  return scene;
}
function resolveEntry(source, env, ctx) {
  if (!isObject2(source)) {
    ctx.issues.push(`skipped a malformed node at "${env.key}"`);
    return null;
  }
  if (env.instanceId != null && ++ctx.expandedNodes > MAX_INSTANCE_NODES) {
    if (!ctx.budgetIssued) {
      ctx.issues.push(`component expansion exceeds ${MAX_INSTANCE_NODES} nodes; remaining expanded children were skipped`);
      ctx.budgetIssued = true;
    }
    return null;
  }
  return source.type === "instance" ? resolveInstance(source, env, ctx) : resolveNode(source, env, ctx);
}
function resolveNode(source, env, ctx) {
  const node = createBaseNode(source, env);
  const type2 = node.type;
  const patch = lookupOverride(env.overrides, source.id);
  if (type2 === "frame" || type2 === "rect" || type2 === "ellipse" || type2 === "path") {
    applyPaint(node, source, ctx, patch);
    if (type2 === "frame") node.layout = isObject2(source.layout) ? source.layout : void 0;
    if (type2 === "path") {
      node.d = source.d;
      node.viewBox = source.viewBox;
      node.fillRule = source.fillRule ?? "nonzero";
    }
  } else if (type2 === "text") {
    const font = applyPaint(node, source, ctx, patch);
    applyText(node, source, font, patch);
  } else if (type2 === "line") {
    node.strokes = Array.isArray(source.strokes) ? source.strokes : [];
  }
  if (patch && typeof patch.visible === "boolean") node.visible = patch.visible;
  if (type2 === "frame" || type2 === "group") {
    node.children = resolveChildList(
      source,
      node,
      {
        prefix: env.keyPrefix ?? null,
        instanceId: env.instanceId ?? null,
        editable: node.editable,
        overrides: env.overrides ?? null
      },
      ctx
    );
  } else {
    node.children = [];
  }
  registerNode(node, ctx);
  return node;
}
function resolveInstance(source, env, ctx) {
  const node = createBaseNode(source, env);
  node.type = "instance";
  node.isInstanceRoot = true;
  const instanceId = env.instanceId != null ? env.instanceId : env.key;
  node.instanceId = instanceId;
  const ownOverrides = isObject2(source.overrides) ? source.overrides : {};
  node.overrides = ownOverrides;
  node.variantProps = isObject2(source.variantProps) ? { ...source.variantProps } : {};
  node.componentId = source.componentId;
  const outerPatch = lookupOverride(env.overrides, source.id);
  const component = pinVariant(source, ctx);
  const rootSource = component && isObject2(component.root) ? component.root : null;
  if (component) {
    node.componentId = component.id;
    node.variantProps = {
      ...isObject2(component.variantProps) ? component.variantProps : {},
      ...isObject2(source.variantProps) ? source.variantProps : {}
    };
  }
  if (rootSource) {
    const rootPatch = lookupOverride(ownOverrides, rootSource.id);
    const font = applyPaint(node, rootSource, ctx, rootPatch);
    if (source.cornerRadius != null) node.cornerRadius = Math.max(0, numberOr3(source.cornerRadius, 0));
    node.visible = node.visible && rootSource.visible !== false;
    if (rootSource.type === "text") {
      applyText(node, rootSource, font, rootPatch);
      node.lines = [];
    }
    if (rootSource.type === "path") {
      node.d = rootSource.d;
      node.viewBox = rootSource.viewBox;
      node.fillRule = rootSource.fillRule ?? "nonzero";
    }
    node.layout = isObject2(rootSource.layout) ? rootSource.layout : void 0;
    node.layoutSizing = pickSizing(source.layoutSizing);
    if (rootPatch && typeof rootPatch.visible === "boolean") node.visible = rootPatch.visible;
  }
  if (outerPatch && typeof outerPatch.visible === "boolean") node.visible = outerPatch.visible;
  if (component && rootSource) {
    if (ctx.componentStack.includes(component.id)) {
      ctx.issues.push(
        `component cycle: ${[...ctx.componentStack, component.id].join(" -> ")}; instance "${String(source.id)}" rendered empty`
      );
    } else if (ctx.componentStack.length >= MAX_COMPONENT_DEPTH) {
      ctx.issues.push(
        `component nesting exceeds ${MAX_COMPONENT_DEPTH} at instance "${String(source.id)}"; rendered empty`
      );
    } else {
      ctx.componentStack.push(component.id);
      try {
        node.children = resolveChildList(
          rootSource,
          node,
          {
            prefix: node.key,
            instanceId,
            editable: false,
            overrides: ownOverrides
          },
          ctx
        );
      } finally {
        ctx.componentStack.pop();
      }
    }
  }
  registerNode(node, ctx);
  return node;
}
function resolveChildList(ownerSource, ownerNode, options, ctx) {
  const list2 = Array.isArray(ownerSource.children) ? ownerSource.children : [];
  const out = [];
  for (const child of list2) {
    if (!isObject2(child)) {
      ctx.issues.push(`skipped a malformed child of "${String(ownerNode.id)}"`);
      continue;
    }
    const childId = typeof child.id === "string" ? child.id : `node-${options.prefix ?? ""}-${out.length}`;
    const key = options.prefix ? `${options.prefix}::${childId}` : childId;
    const node = resolveEntry(
      child,
      {
        key,
        keyPrefix: options.prefix ?? null,
        instanceId: options.instanceId ?? null,
        editable: options.editable !== false,
        overrides: options.overrides ?? null,
        parent: ownerNode
      },
      ctx
    );
    if (node) out.push(node);
  }
  return out;
}
function createBaseNode(source, env) {
  const type2 = typeof source.type === "string" ? source.type : "rect";
  const id2 = typeof source.id === "string" ? source.id : String(env.key);
  const node = {
    key: env.key,
    id: id2,
    sourceId: id2,
    type: type2,
    name: typeof source.name === "string" ? source.name : type2,
    x: numberOr3(source.x, 0),
    y: numberOr3(source.y, 0),
    width: Math.max(0, numberOr3(source.width, 0)),
    height: Math.max(0, numberOr3(source.height, 0)),
    rotation: numberOr3(source.rotation, 0),
    opacity: clamp012(numberOr3(source.opacity, 1)),
    visible: source.visible !== false,
    locked: source.locked === true,
    fill: [],
    fills: [],
    strokes: [],
    effects: [],
    cornerRadius: 0,
    clip: false,
    children: [],
    sourceNode: source,
    editable: env.editable !== false,
    isInstanceRoot: false,
    parent: env.parent ?? null
  };
  if (env.instanceId != null) node.instanceId = env.instanceId;
  const sizing = pickSizing(source.layoutSizing);
  if (sizing) node.layoutSizing = sizing;
  if (source.layoutPositioning === "absolute") node.layoutPositioning = "absolute";
  return node;
}
function applyPaint(node, source, ctx, patch) {
  const resolved = resolveStyles(source, node, ctx);
  let fills = resolved.fills;
  let effects = resolved.effects;
  if (patch) {
    if (Array.isArray(patch.fills)) fills = patch.fills;
  }
  node.fill = fills;
  node.fills = fills;
  node.effects = effects;
  node.strokes = Array.isArray(source.strokes) ? source.strokes : [];
  node.cornerRadius = Math.max(0, numberOr3(source.cornerRadius, 0));
  if (Array.isArray(source.cornerRadii) && source.cornerRadii.length === 4) {
    node.cornerRadii = source.cornerRadii.map((r) => Math.max(0, numberOr3(r, 0)));
  }
  node.clip = source.type === "frame" ? source.clip !== false : false;
  return resolved.font;
}
function applyText(node, source, font, patch) {
  node.text = typeof source.text === "string" ? source.text : "";
  node.font = isObject2(font) ? font : DEFAULT_FONT3;
  node.align = ALIGNMENTS2.has(source.align) ? source.align : "left";
  node.verticalAlign = VERTICAL_ALIGNMENTS2.has(source.verticalAlign) ? source.verticalAlign : "top";
  node.autoHeight = source.autoHeight !== false;
  if (patch && typeof patch.text === "string") node.text = patch.text;
}
function resolveStyles(source, node, ctx) {
  let fills = Array.isArray(source.fills) ? source.fills : [];
  let effects = Array.isArray(source.effects) ? source.effects : [];
  let font = isObject2(source.font) ? source.font : DEFAULT_FONT3;
  const label = `node "${String(node.id)}"`;
  if (source.textStyleId != null) {
    const style = ctx.styleById.get(source.textStyleId);
    if (!style) ctx.issues.push(`${label}: unknown text style "${String(source.textStyleId)}"`);
    else if (style.type !== "text") {
      ctx.issues.push(`${label}: style "${String(source.textStyleId)}" is a ${String(style.type)} style, expected text`);
    } else if (isObject2(style.value)) {
      if (isObject2(style.value.font)) font = style.value.font;
      if (Array.isArray(style.value.fills)) fills = style.value.fills;
    }
  }
  if (source.fillStyleId != null) {
    const style = ctx.styleById.get(source.fillStyleId);
    if (!style) ctx.issues.push(`${label}: unknown fill style "${String(source.fillStyleId)}"`);
    else if (style.type !== "fill") {
      ctx.issues.push(`${label}: style "${String(source.fillStyleId)}" is a ${String(style.type)} style, expected fill`);
    } else if (isObject2(style.value)) {
      fills = [style.value];
    }
  }
  if (source.effectStyleId != null) {
    const style = ctx.styleById.get(source.effectStyleId);
    if (!style) ctx.issues.push(`${label}: unknown effect style "${String(source.effectStyleId)}"`);
    else if (style.type !== "effect") {
      ctx.issues.push(`${label}: style "${String(source.effectStyleId)}" is a ${String(style.type)} style, expected effect`);
    } else if (Array.isArray(style.value)) {
      effects = style.value;
    }
  }
  return { fills, effects, font };
}
function pinVariant(instance, ctx) {
  const base = ctx.componentById.get(instance.componentId);
  if (!base) {
    ctx.issues.push(`instance "${String(instance.id)}" references unknown component "${String(instance.componentId)}"`);
    return null;
  }
  const props = isObject2(instance.variantProps) ? instance.variantProps : {};
  if (!base.variantSetId || Object.keys(props).length === 0) return base;
  const set = ctx.variantSetById.get(base.variantSetId);
  if (!set) {
    ctx.issues.push(`component "${String(base.id)}" references unknown variant set "${String(base.variantSetId)}"`);
    return base;
  }
  const merged = {
    ...isObject2(base.variantProps) ? base.variantProps : {},
    ...props
  };
  const properties = Array.isArray(set.properties) ? set.properties : [];
  for (const componentId of Array.isArray(set.componentIds) ? set.componentIds : []) {
    const candidate = ctx.componentById.get(componentId);
    if (!candidate) continue;
    const values = isObject2(candidate.variantProps) ? candidate.variantProps : {};
    if (properties.every((property) => values[property?.name] === merged[property?.name])) return candidate;
  }
  ctx.issues.push(
    `instance "${String(instance.id)}" has no variant match (${formatVariantProps(props)}); using "${String(base.id)}"`
  );
  return base;
}
function formatVariantProps(props) {
  return Object.entries(props).map(([key, value]) => `${key}=${String(value)}`).join(", ");
}
function selectPage2(source, pageId, issues) {
  const pages = Array.isArray(source.pages) ? source.pages.filter(isObject2) : [];
  if (!pages.length) {
    issues.push("document has no pages");
    return null;
  }
  if (pageId == null) return pages[0];
  const page = pages.find((entry) => entry.id === pageId);
  if (!page) {
    issues.push(`unknown page "${String(pageId)}"`);
    return null;
  }
  return page;
}
function registerNode(node, ctx) {
  if (ctx.byKey.has(node.key)) {
    ctx.issues.push(`duplicate render key "${node.key}"`);
  } else {
    ctx.byKey.set(node.key, node);
  }
  const list2 = ctx.bySourceId.get(node.sourceId);
  if (list2) list2.push(node);
  else ctx.bySourceId.set(node.sourceId, [node]);
}
function attachRebuild(scene, doc, options) {
  scene.rebuild = () => {
    if (scene.measureText && typeof scene.measureText.clearCache === "function") {
      scene.measureText.clearCache();
    }
    const fresh = buildScene(doc, { ...options, measureText: scene.measureText });
    scene.pageId = fresh.pageId;
    scene.title = fresh.title;
    scene.mode = fresh.mode;
    scene.componentId = fresh.componentId;
    scene.roots = fresh.roots;
    scene.byKey = fresh.byKey;
    scene.bySourceId = fresh.bySourceId;
    scene.componentById = fresh.componentById;
    scene.styleById = fresh.styleById;
    scene.page = fresh.page;
    scene.background = fresh.background;
    scene.doc = fresh.doc;
    if (Array.isArray(scene.issues)) {
      scene.issues.length = 0;
      scene.issues.push(...fresh.issues);
    } else {
      scene.issues = fresh.issues;
    }
    layoutScene(scene);
    return scene;
  };
}
function lookupOverride(overrides, sourceId) {
  if (!isObject2(overrides) || typeof sourceId !== "string") return void 0;
  const patch = overrides[sourceId];
  return isObject2(patch) ? patch : void 0;
}
function pickSizing(raw) {
  if (!isObject2(raw)) return void 0;
  const sizing = {};
  if (SIZINGS2.has(raw.h)) sizing.h = raw.h;
  if (SIZINGS2.has(raw.v)) sizing.v = raw.v;
  return Object.keys(sizing).length ? sizing : void 0;
}
function isObject2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function numberOr3(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function clamp012(value) {
  return Math.min(1, Math.max(0, value));
}

// src/shared/figma/sync-types.ts
var FIGMA_IR_FORMAT = "dsh.figma.ir";
var FIGMA_IR_VERSION = 1;
var FIGMA_SYNC_FORMAT = "dsh.figma.sync";
var FIGMA_SYNC_VERSION = 1;

// src/shared/figma/ir.ts
var HEX_3 = /^#([0-9a-f]{3})$/i;
var HEX_4 = /^#([0-9a-f]{4})$/i;
var HEX_6 = /^#([0-9a-f]{6})$/i;
var HEX_8 = /^#([0-9a-f]{8})$/i;
function clamp013(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0, Math.min(1, value));
}
function round22(value) {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}
function hexToFigmaRgba(hex, extraOpacity = 1) {
  const input = String(hex ?? "#000000").trim();
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 1;
  let m;
  if (m = HEX_6.exec(input)) {
    const v = m[1];
    r = parseInt(v.slice(0, 2), 16) / 255;
    g = parseInt(v.slice(2, 4), 16) / 255;
    b = parseInt(v.slice(4, 6), 16) / 255;
  } else if (m = HEX_8.exec(input)) {
    const v = m[1];
    r = parseInt(v.slice(0, 2), 16) / 255;
    g = parseInt(v.slice(2, 4), 16) / 255;
    b = parseInt(v.slice(4, 6), 16) / 255;
    a = parseInt(v.slice(6, 8), 16) / 255;
  } else if (m = HEX_3.exec(input)) {
    const v = m[1];
    r = parseInt(v[0] + v[0], 16) / 255;
    g = parseInt(v[1] + v[1], 16) / 255;
    b = parseInt(v[2] + v[2], 16) / 255;
  } else if (m = HEX_4.exec(input)) {
    const v = m[1];
    r = parseInt(v[0] + v[0], 16) / 255;
    g = parseInt(v[1] + v[1], 16) / 255;
    b = parseInt(v[2] + v[2], 16) / 255;
    a = parseInt(v[3] + v[3], 16) / 255;
  }
  return { r, g, b, a: clamp013(a * clamp013(extraOpacity)) };
}
function figmaRgbaToHex(rgba, paintOpacity = 1) {
  const r = Math.round(clamp013(rgba?.r ?? 0) * 255);
  const g = Math.round(clamp013(rgba?.g ?? 0) * 255);
  const b = Math.round(clamp013(rgba?.b ?? 0) * 255);
  const a = clamp013((rgba?.a ?? 1) * clamp013(paintOpacity));
  const hex = "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
  return { color: hex, opacity: round22(a) };
}
function splitHexColor(color2, opacity = 1) {
  const rgba = hexToFigmaRgba(color2, opacity);
  return figmaRgbaToHex({ r: rgba.r, g: rgba.g, b: rgba.b, a: 1 }, rgba.a);
}
function normalizeIrFills(fills) {
  if (!Array.isArray(fills) || fills.length === 0) return void 0;
  const out = [];
  for (const raw of fills) {
    if (!raw || typeof raw !== "object") continue;
    const f = raw;
    if (f.type === "solid" && typeof f.color === "string") {
      const split = splitHexColor(f.color, typeof f.opacity === "number" ? f.opacity : 1);
      out.push(split.opacity < 1 ? { type: "solid", color: split.color, opacity: split.opacity } : { type: "solid", color: split.color });
    } else if ((f.type === "linear-gradient" || f.type === "radial-gradient") && Array.isArray(f.stops)) {
      const stops = f.stops.filter((s) => Boolean(s && typeof s === "object")).map((s) => {
        const split = splitHexColor(String(s.color ?? "#000000"), typeof s.opacity === "number" ? s.opacity : 1);
        return {
          position: round22(typeof s.position === "number" ? s.position : typeof s.offset === "number" ? s.offset : 0),
          color: split.color,
          ...split.opacity < 1 ? { opacity: split.opacity } : {}
        };
      });
      if (stops.length >= 2) {
        out.push({
          type: f.type,
          ...typeof f.angle === "number" ? { angle: round22(f.angle) } : {},
          stops,
          ...typeof f.opacity === "number" && f.opacity < 1 ? { opacity: round22(clamp013(f.opacity)) } : {}
        });
      }
    } else if (f.type === "image") {
      const mode = f.scaleMode === "fit" || f.scaleMode === "stretch" || f.scaleMode === "tile" ? f.scaleMode : "fill";
      out.push({
        type: "image",
        ...typeof f.asset === "string" ? { asset: f.asset } : {},
        ...typeof f.imageHash === "string" ? { imageHash: f.imageHash } : {},
        scaleMode: mode,
        ...typeof f.opacity === "number" && f.opacity < 1 ? { opacity: round22(clamp013(f.opacity)) } : {}
      });
    }
  }
  return out.length ? out : void 0;
}
function normalizeIrStrokes(strokes) {
  if (!Array.isArray(strokes) || strokes.length === 0) return void 0;
  const out = [];
  for (const raw of strokes) {
    if (!raw || typeof raw !== "object") continue;
    const s = raw;
    if (typeof s.color !== "string") continue;
    const split = splitHexColor(s.color, typeof s.opacity === "number" ? s.opacity : 1);
    out.push({
      color: split.color,
      width: round22(typeof s.width === "number" ? Math.max(0, s.width) : 1),
      ...split.opacity < 1 ? { opacity: split.opacity } : {},
      ...s.align === "inside" || s.align === "center" || s.align === "outside" ? { align: s.align } : {},
      ...Array.isArray(s.dash) && s.dash.length ? { dash: s.dash.map((n) => round22(Number(n) || 0)) } : {}
    });
  }
  return out.length ? out : void 0;
}
function normalizeIrEffects(effects) {
  if (!Array.isArray(effects) || effects.length === 0) return void 0;
  const out = [];
  for (const raw of effects) {
    if (!raw || typeof raw !== "object") continue;
    const e = raw;
    if (e.type === "blur" || e.type === "layer-blur") {
      const blur = typeof e.blur === "number" ? e.blur : typeof e.radius === "number" ? e.radius : 0;
      out.push({ type: "blur", blur: round22(Math.max(0, blur)) });
    } else if (e.type === "drop-shadow" || e.type === "inner-shadow") {
      const split = splitHexColor(typeof e.color === "string" ? e.color : "#000000", typeof e.opacity === "number" ? e.opacity : 0.25);
      const blur = typeof e.blur === "number" ? e.blur : typeof e.radius === "number" ? e.radius : 4;
      out.push({
        type: e.type,
        color: split.color,
        opacity: split.opacity,
        x: round22(typeof e.x === "number" ? e.x : 0),
        y: round22(typeof e.y === "number" ? e.y : 2),
        blur: round22(Math.max(0, blur)),
        ...typeof e.spread === "number" && e.spread !== 0 ? { spread: round22(e.spread) } : {}
      });
    }
  }
  return out.length ? out : void 0;
}
function normalizeIrLayout(layout) {
  if (!layout || typeof layout !== "object") return void 0;
  const l = layout;
  const direction = l.direction === "horizontal" ? "horizontal" : l.direction === "vertical" ? "vertical" : null;
  if (!direction) return void 0;
  const p = l.padding && typeof l.padding === "object" ? l.padding : {};
  return {
    direction,
    gap: round22(typeof l.gap === "number" ? Math.max(0, l.gap) : 0),
    padding: {
      top: round22(typeof p.top === "number" ? Math.max(0, p.top) : 0),
      right: round22(typeof p.right === "number" ? Math.max(0, p.right) : 0),
      bottom: round22(typeof p.bottom === "number" ? Math.max(0, p.bottom) : 0),
      left: round22(typeof p.left === "number" ? Math.max(0, p.left) : 0)
    },
    ...l.alignPrimary === "start" || l.alignPrimary === "center" || l.alignPrimary === "end" || l.alignPrimary === "space-between" ? { alignPrimary: l.alignPrimary } : {},
    ...l.alignCounter === "start" || l.alignCounter === "center" || l.alignCounter === "end" || l.alignCounter === "stretch" ? { alignCounter: l.alignCounter } : {},
    ...l.wrap === true ? { wrap: true } : {}
  };
}
function normalizeIrFont(font) {
  if (!font || typeof font !== "object") return void 0;
  const f = font;
  return {
    family: typeof f.family === "string" && f.family.trim() ? f.family.trim() : "Inter",
    weight: typeof f.weight === "number" && Number.isFinite(f.weight) ? Math.round(f.weight) : 400,
    ...f.style === "italic" ? { style: "italic" } : {},
    size: round22(typeof f.size === "number" && f.size > 0 ? f.size : 14),
    lineHeight: round22(typeof f.lineHeight === "number" && f.lineHeight > 0 ? f.lineHeight : 1.4),
    ...typeof f.letterSpacing === "number" && f.letterSpacing !== 0 ? { letterSpacing: round22(f.letterSpacing) } : {}
  };
}
function normalizeCornerRadii(radii) {
  if (!Array.isArray(radii) || radii.length !== 4) return void 0;
  const nums = radii.map((v) => round22(Math.max(0, Number(v) || 0)));
  return [nums[0], nums[1], nums[2], nums[3]];
}
function stableHash(value) {
  const json = canonicalStringify(value);
  let h1 = 2166136261;
  let h2 = 16777619;
  for (let i2 = 0; i2 < json.length; i2++) {
    const ch = json.charCodeAt(i2);
    h1 ^= ch;
    h1 = Math.imul(h1, 16777619);
    h2 ^= ch ^ i2 & 255;
    h2 = Math.imul(h2, 2246822507);
  }
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}
function canonicalStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalStringify).join(",") + "]";
  const keys = Object.keys(value).sort();
  const parts = [];
  for (const key of keys) {
    const v = value[key];
    if (v === void 0) continue;
    parts.push(`${JSON.stringify(key)}:${canonicalStringify(v)}`);
  }
  return "{" + parts.join(",") + "}";
}
function extractNodeSnapshot(node, parentId) {
  const radii = normalizeCornerRadii(node.cornerRadii);
  const baseObj = {
    type: node.type,
    name: node.name,
    parentId,
    x: round22(node.x),
    y: round22(node.y),
    width: round22(Math.max(0, node.width)),
    height: round22(Math.max(0, node.height)),
    rotation: round22(node.rotation ?? 0),
    opacity: round22(clamp013(node.opacity ?? 1)),
    visible: node.visible !== false,
    cornerRadius: round22(Math.max(0, node.cornerRadius ?? (radii ? radii[0] : 0))),
    ...radii ? { cornerRadii: radii } : {},
    ...node.type === "frame" ? { clip: node.clip !== false } : {},
    ...normalizeIrFills(node.fills) ? { fills: normalizeIrFills(node.fills) } : {},
    ...normalizeIrStrokes(node.strokes) ? { strokes: normalizeIrStrokes(node.strokes) } : {},
    ...normalizeIrEffects(node.effects) ? { effects: normalizeIrEffects(node.effects) } : {},
    ...normalizeIrLayout(node.layout) ? { layout: normalizeIrLayout(node.layout) } : {},
    ...node.layoutSizing ? { layoutSizing: { ...node.layoutSizing.h ? { h: node.layoutSizing.h } : {}, ...node.layoutSizing.v ? { v: node.layoutSizing.v } : {} } } : {},
    ...node.layoutPositioning === "absolute" ? { layoutPositioning: "absolute" } : {},
    ...node.type === "text" ? { text: String(node.text ?? "") } : {},
    ...node.type === "text" && normalizeIrFont(node.font) ? { font: normalizeIrFont(node.font) } : {},
    ...node.type === "text" && node.align ? { align: node.align } : {},
    ...node.type === "text" && node.verticalAlign ? { verticalAlign: node.verticalAlign } : {},
    ...node.type === "path" && typeof node.d === "string" ? { d: node.d } : {},
    ...node.type === "path" && node.fillRule ? { fillRule: node.fillRule } : {}
  };
  return {
    ...baseObj,
    fingerprint: stableHash(baseObj)
  };
}
function dshNodeToIrNode(node, options = {}) {
  const id2 = typeof node.id === "string" ? node.id : newId("n");
  const computed = options.computedById?.get(id2);
  const type2 = isSupportedNodeType(node.type) ? node.type : "frame";
  const radii = normalizeCornerRadii(node.cornerRadii);
  const children = Array.isArray(node.children) ? node.children.filter((c) => Boolean(c && typeof c === "object")).map((c) => dshNodeToIrNode(c, options)) : void 0;
  const ir = {
    dshId: id2,
    ...options.figmaNodeIds?.[id2] ? { figmaId: options.figmaNodeIds[id2] } : {},
    type: type2,
    name: typeof node.name === "string" ? node.name : type2,
    x: round22(computed ? computed.x : Number(node.x ?? 0)),
    y: round22(computed ? computed.y : Number(node.y ?? 0)),
    width: round22(Math.max(0, computed ? computed.width : Number(node.width ?? 0))),
    height: round22(Math.max(0, computed ? computed.height : Number(node.height ?? 0))),
    ...typeof node.rotation === "number" && node.rotation !== 0 ? { rotation: round22(node.rotation) } : {},
    ...typeof node.opacity === "number" && node.opacity < 1 ? { opacity: round22(clamp013(node.opacity)) } : {},
    ...node.visible === false ? { visible: false } : {},
    ...node.locked === true ? { locked: true } : {},
    ...type2 === "frame" && node.clip === false ? { clip: false } : {},
    ...typeof node.cornerRadius === "number" && node.cornerRadius > 0 ? { cornerRadius: round22(node.cornerRadius) } : {},
    ...radii ? { cornerRadii: radii } : {},
    ...normalizeIrFills(node.fills) ? { fills: normalizeIrFills(node.fills) } : {},
    ...normalizeIrStrokes(node.strokes) ? { strokes: normalizeIrStrokes(node.strokes) } : {},
    ...normalizeIrEffects(node.effects) ? { effects: normalizeIrEffects(node.effects) } : {},
    ...normalizeIrLayout(node.layout) ? { layout: normalizeIrLayout(node.layout) } : {},
    ...node.layoutSizing && typeof node.layoutSizing === "object" ? { layoutSizing: node.layoutSizing } : {},
    ...node.layoutPositioning === "absolute" ? { layoutPositioning: "absolute" } : {},
    ...type2 === "text" ? { text: typeof node.text === "string" ? node.text : "" } : {},
    ...type2 === "text" && normalizeIrFont(node.font) ? { font: normalizeIrFont(node.font) } : {},
    ...type2 === "text" && typeof node.align === "string" ? { align: node.align } : {},
    ...type2 === "text" && typeof node.verticalAlign === "string" ? { verticalAlign: node.verticalAlign } : {},
    ...type2 === "text" && node.autoHeight === false ? { autoHeight: false } : {},
    ...type2 === "path" && typeof node.d === "string" ? { d: node.d } : {},
    ...type2 === "path" && node.viewBox && typeof node.viewBox === "object" ? { viewBox: node.viewBox } : {},
    ...type2 === "path" && (node.fillRule === "evenodd" || node.fillRule === "nonzero") ? { fillRule: node.fillRule } : {},
    ...type2 === "instance" && typeof node.componentId === "string" ? { componentId: node.componentId } : {},
    ...children && children.length > 0 ? { children } : {},
    ...options.passthroughByDshId?.[id2] ? { passthrough: options.passthroughByDshId[id2] } : {}
  };
  return ir;
}
function dshDocToIr(doc, sidecar) {
  const pagesRaw = Array.isArray(doc.pages) ? doc.pages : [];
  const pages = pagesRaw.map((page) => {
    const pageId = typeof page.id === "string" ? page.id : newId("page");
    const computedById = /* @__PURE__ */ new Map();
    try {
      const scene = buildScene(doc, { pageId });
      layoutScene(scene);
      const visitScene = (rnode) => {
        if (typeof rnode.id === "string" && rnode.editable !== false) {
          computedById.set(rnode.id, {
            x: Number(rnode.x ?? 0),
            y: Number(rnode.y ?? 0),
            width: Number(rnode.width ?? 0),
            height: Number(rnode.height ?? 0)
          });
        }
        if (Array.isArray(rnode.children)) {
          for (const c of rnode.children) visitScene(c);
        }
      };
      for (const root of scene.roots ?? []) visitScene(root);
    } catch {
    }
    const children = Array.isArray(page.children) ? page.children.map(
      (child) => dshNodeToIrNode(child, {
        figmaNodeIds: sidecar?.binding.nodes,
        passthroughByDshId: sidecar?.passthrough,
        computedById
      })
    ) : [];
    return {
      dshId: pageId,
      ...sidecar?.binding.pages[pageId] ? { figmaId: sidecar.binding.pages[pageId] } : {},
      name: typeof page.name === "string" ? page.name : "Page 1",
      ...typeof page.background === "string" ? { background: page.background } : {},
      children
    };
  });
  return {
    format: FIGMA_IR_FORMAT,
    version: FIGMA_IR_VERSION,
    ...sidecar?.binding.fileKey ? { fileKey: sidecar.binding.fileKey } : {},
    ...typeof doc.title === "string" ? { fileName: doc.title } : {},
    readCompleteness: "complete",
    pages
  };
}
function irNodeToDshNode(ir, collector) {
  let id2 = ir.dshId && /^[A-Za-z0-9_-]{1,64}$/.test(ir.dshId) ? ir.dshId : newId(ir.type.slice(0, 2));
  if (collector) {
    while (collector.usedIds.has(id2)) id2 = newId(ir.type.slice(0, 2));
    collector.usedIds.add(id2);
    if (ir.figmaId) collector.nodeBindings[id2] = ir.figmaId;
    if (ir.passthrough && Object.keys(ir.passthrough).length > 0) {
      collector.passthrough[id2] = structuredClone(ir.passthrough);
    }
  }
  const fills = (ir.fills ?? []).flatMap((fill) => {
    if (fill.type === "solid") {
      return [{ type: "solid", color: fill.color, ...fill.opacity !== void 0 && fill.opacity < 1 ? { opacity: fill.opacity } : {} }];
    }
    if (fill.type === "linear-gradient" || fill.type === "radial-gradient") {
      return [{
        type: fill.type,
        ...fill.angle !== void 0 ? { angle: fill.angle } : {},
        stops: fill.stops.map((s) => ({ position: s.position, color: s.color, ...s.opacity !== void 0 && s.opacity < 1 ? { opacity: s.opacity } : {} })),
        ...fill.opacity !== void 0 && fill.opacity < 1 ? { opacity: fill.opacity } : {}
      }];
    }
    if (fill.type === "image") {
      const asset = fill.asset ?? (fill.imageHash ? collector?.imageHashes[fill.imageHash] : void 0);
      if (!asset) return [];
      if (fill.imageHash && collector) collector.imageHashes[fill.imageHash] = asset;
      return [{
        type: "image",
        asset,
        scaleMode: fill.scaleMode ?? "fill",
        ...fill.opacity !== void 0 && fill.opacity < 1 ? { opacity: fill.opacity } : {}
      }];
    }
    return [];
  });
  const strokes = (ir.strokes ?? []).map((s) => ({
    color: s.color,
    width: s.width,
    ...s.opacity !== void 0 && s.opacity < 1 ? { opacity: s.opacity } : {},
    ...s.align ? { align: s.align } : {},
    ...s.dash ? { dash: s.dash } : {}
  }));
  const effects = (ir.effects ?? []).map(
    (e) => e.type === "blur" ? { type: "blur", blur: e.blur } : {
      type: e.type,
      color: e.color ?? "#000000",
      x: e.x ?? 0,
      y: e.y ?? 2,
      blur: e.blur,
      ...e.spread !== void 0 ? { spread: e.spread } : {},
      ...e.opacity !== void 0 ? { opacity: e.opacity } : {}
    }
  );
  const node = {
    id: id2,
    type: ir.type === "instance" && !ir.componentId ? "frame" : ir.type,
    name: ir.name || ir.type,
    x: round22(ir.x),
    y: round22(ir.y),
    width: round22(Math.max(0, ir.width)),
    height: round22(Math.max(0, ir.height)),
    ...ir.rotation ? { rotation: round22(ir.rotation) } : {},
    ...ir.opacity !== void 0 && ir.opacity < 1 ? { opacity: round22(clamp013(ir.opacity)) } : {},
    ...ir.visible === false ? { visible: false } : {},
    ...ir.locked === true ? { locked: true } : {},
    ...ir.layoutSizing ? { layoutSizing: ir.layoutSizing } : {},
    ...ir.layoutPositioning === "absolute" ? { layoutPositioning: "absolute" } : {}
  };
  if (node.type === "frame" || node.type === "rect" || node.type === "ellipse" || node.type === "path") {
    if (fills.length) node.fills = fills;
    if (strokes.length) node.strokes = strokes;
    if (effects.length) node.effects = effects;
    if (ir.cornerRadius && ir.cornerRadius > 0) node.cornerRadius = round22(ir.cornerRadius);
    if (ir.cornerRadii) node.cornerRadii = ir.cornerRadii;
  }
  if (node.type === "frame") {
    node.clip = ir.clip !== false;
    if (ir.layout) node.layout = ir.layout;
    node.children = (ir.children ?? []).map((child) => irNodeToDshNode(child, collector));
  } else if (node.type === "group") {
    node.children = (ir.children ?? []).map((child) => irNodeToDshNode(child, collector));
  } else if (node.type === "line") {
    node.strokes = strokes.length ? strokes : [{ color: "#111827", width: 1 }];
  } else if (node.type === "text") {
    node.text = ir.text ?? "";
    node.font = ir.font ?? { family: "Inter", weight: 400, size: 14, lineHeight: 1.4 };
    node.fills = fills.length ? fills : [{ type: "solid", color: "#111827" }];
    if (ir.align) node.align = ir.align;
    if (ir.verticalAlign) node.verticalAlign = ir.verticalAlign;
    node.autoHeight = ir.autoHeight !== false;
    if (effects.length) node.effects = effects;
  } else if (node.type === "path") {
    node.d = ir.d || "M 0 0 L 1 0";
    node.viewBox = ir.viewBox ?? { x: 0, y: 0, width: Math.max(1, ir.width), height: Math.max(1, ir.height) };
    node.fillRule = ir.fillRule ?? "nonzero";
    if (Array.isArray(node.fills)) {
      node.fills = node.fills.filter((f) => f.type !== "image");
    }
  } else if (node.type === "instance" && ir.componentId) {
    node.componentId = ir.componentId;
  }
  return node;
}
function createInitialSidecar(params) {
  const localNodes = {};
  const remoteProjectedNodes = {};
  const order = {};
  const figmaToDsh = /* @__PURE__ */ new Map();
  for (const [dshId, figmaId2] of Object.entries(params.nodeBindings)) figmaToDsh.set(figmaId2, dshId);
  const recordTree = (irDoc, target, recordOrder) => {
    for (const page of irDoc.pages) {
      const pageKey = page.dshId ?? (page.figmaId ? findKeyByVal(params.pageBindings, page.figmaId) : void 0) ?? "page-1";
      const visitList = (nodes, parentId) => {
        const ids = [];
        for (const n of nodes) {
          const id2 = n.dshId ?? (n.figmaId ? figmaToDsh.get(n.figmaId) : void 0);
          if (!id2) continue;
          ids.push(id2);
          target[id2] = extractNodeSnapshot(n, parentId);
          if (n.children?.length) visitList(n.children, id2);
        }
        if (recordOrder) order[parentId ?? `page:${pageKey}`] = ids;
      };
      visitList(page.children, null);
    }
  };
  recordTree(params.remoteIr, remoteProjectedNodes, true);
  recordTree(params.localIr ?? params.remoteIr, localNodes, false);
  return {
    format: FIGMA_SYNC_FORMAT,
    version: FIGMA_SYNC_VERSION,
    canvasName: params.canvasName,
    canvasDocId: params.canvasDocId,
    identities: {
      logicalPages: {},
      placements: {},
      interactions: {}
    },
    binding: {
      bindingId: newId("bind"),
      fileKey: params.fileKey,
      ...params.fileName ? { fileName: params.fileName } : {},
      ...params.fileUrl ? { fileUrl: params.fileUrl } : {},
      scope: { kind: "document" },
      transport: params.transport,
      lastSyncedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastCanvasRevision: params.canvasRevision,
      ...params.remoteIr.remoteVersion ? { lastRemoteVersion: params.remoteIr.remoteVersion } : {},
      pages: { ...params.pageBindings },
      nodes: { ...params.nodeBindings },
      styles: {},
      components: {},
      imageHashes: { ...params.imageHashes ?? {} }
    },
    base: {
      localNodes,
      remoteProjectedNodes,
      order
    },
    passthrough: structuredClone(params.passthrough)
  };
}
function findKeyByVal(record2, val) {
  for (const [k, v] of Object.entries(record2)) {
    if (v === val) return k;
  }
  return void 0;
}
function isSupportedNodeType(value) {
  return value === "frame" || value === "group" || value === "rect" || value === "ellipse" || value === "line" || value === "text" || value === "path" || value === "instance";
}

// src/shared/figma/reconcile.ts
var NUMERIC_TOLERANCE = 0.01;
var COMPARED_FIELDS = [
  { field: "name", category: "content" },
  { field: "x", category: "geometry" },
  { field: "y", category: "geometry" },
  { field: "width", category: "geometry" },
  { field: "height", category: "geometry" },
  { field: "rotation", category: "geometry" },
  { field: "opacity", category: "style" },
  { field: "visible", category: "style" },
  { field: "cornerRadius", category: "style" },
  { field: "cornerRadii", category: "style" },
  { field: "clip", category: "layout" },
  { field: "fills", category: "style" },
  { field: "strokes", category: "style" },
  { field: "effects", category: "style" },
  { field: "layout", category: "layout" },
  { field: "layoutSizing", category: "layout" },
  { field: "layoutPositioning", category: "layout" },
  { field: "text", category: "content" },
  { field: "font", category: "content" },
  { field: "align", category: "content" },
  { field: "verticalAlign", category: "content" },
  { field: "d", category: "geometry" },
  { field: "fillRule", category: "style" }
];
function valuesEquivalent(a, b, fieldName) {
  if (Object.is(a, b)) return true;
  if (a === void 0 && b === void 0) return true;
  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) <= NUMERIC_TOLERANCE;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, idx) => valuesEquivalent(item, b[idx], fieldName));
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a).filter((k) => a[k] !== void 0);
    const kb = Object.keys(b).filter((k) => b[k] !== void 0);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => valuesEquivalent(a[k], b[k], k));
  }
  return false;
}
function indexIr(ir, figmaToDsh, figmaPageToDsh) {
  const map = /* @__PURE__ */ new Map();
  for (const page of ir.pages) {
    const pageId = page.dshId ?? (page.figmaId ? figmaPageToDsh.get(page.figmaId) : void 0) ?? page.figmaId ?? "page-1";
    const visit = (nodes, parentId, rootFrameId) => {
      for (const node of nodes) {
        const dshId = node.dshId ?? (node.figmaId ? figmaToDsh.get(node.figmaId) : void 0) ?? (node.figmaId ? `figma_${node.figmaId.replace(/[^A-Za-z0-9_-]/g, "_")}` : newId("n"));
        const ownRoot = rootFrameId ?? (parentId === null ? dshId : void 0);
        const snapshot = extractNodeSnapshot(node, parentId);
        map.set(dshId, {
          dshId,
          figmaId: node.figmaId,
          pageId,
          rootFrameId: ownRoot,
          parentId,
          node,
          snapshot
        });
        if (node.children?.length) visit(node.children, dshId, ownRoot);
      }
    };
    visit(page.children, null, void 0);
  }
  return map;
}
function diffSnapshots(before, after) {
  const changes = [];
  for (const { field: field2, category } of COMPARED_FIELDS) {
    const prev = before[field2];
    const next = after[field2];
    if (!valuesEquivalent(prev, next, field2)) {
      changes.push({ field: field2, before: prev, after: next, category });
    }
  }
  if (before.parentId !== after.parentId) {
    changes.push({ field: "parentId", before: before.parentId, after: after.parentId, category: "structure" });
  }
  return changes;
}
function planPullDiff(doc, sidecar, remoteIr, options = {
  canvasName: sidecar.canvasName,
  baseCanvasRevision: sidecar.binding.lastCanvasRevision
}) {
  const figmaToDsh = /* @__PURE__ */ new Map();
  for (const [dshId, figmaId2] of Object.entries(sidecar.binding.nodes)) figmaToDsh.set(figmaId2, dshId);
  const figmaPageToDsh = /* @__PURE__ */ new Map();
  for (const [dshId, figmaId2] of Object.entries(sidecar.binding.pages)) figmaPageToDsh.set(figmaId2, dshId);
  const localIr = dshDocToIr(doc, sidecar);
  const localMap = indexIr(localIr, figmaToDsh, figmaPageToDsh);
  const remoteMap = indexIr(remoteIr, figmaToDsh, figmaPageToDsh);
  const entries = [];
  const conflicts = [];
  const notices = [...remoteIr.notices ?? []];
  if (remoteIr.readCompleteness === "partial") {
    notices.push("\u8FDC\u7AEF\u4E3A\u5C40\u90E8/\u4E0D\u5B8C\u6574\u8BFB\u53D6\uFF08partial\uFF09\uFF0C\u5DF2\u542F\u7528\u5220\u9664\u5B89\u5168\u9600\uFF1A\u8DF3\u8FC7\u6240\u6709\u5220\u9664\u9879\u3002");
  }
  const allIds = /* @__PURE__ */ new Set([
    ...localMap.keys(),
    ...remoteMap.keys(),
    ...Object.keys(sidecar.base.localNodes),
    ...Object.keys(sidecar.base.remoteProjectedNodes)
  ]);
  for (const dshId of allIds) {
    const local = localMap.get(dshId);
    const remote = remoteMap.get(dshId);
    const localBase = sidecar.base.localNodes[dshId];
    const remoteBase = sidecar.base.remoteProjectedNodes[dshId] ?? localBase;
    const figmaNodeId = remote?.figmaId ?? sidecar.binding.nodes[dshId];
    const passthroughPreserved = Object.keys(sidecar.passthrough[dshId] ?? {});
    if (remote && !local) {
      if (localBase) {
        const remoteChanges = remoteBase ? diffSnapshots(remoteBase, remote.snapshot) : [];
        if (remoteChanges.length > 0) {
          conflicts.push({
            conflictKey: `${dshId}:deleted-locally`,
            dshId,
            figmaNodeId,
            nodeName: remote.node.name,
            field: "*",
            reason: "deleted-locally",
            baseValue: remoteBase,
            localValue: null,
            remoteValue: remote.snapshot
          });
        }
        continue;
      }
      entries.push({
        dshId,
        figmaNodeId,
        nodeName: remote.node.name,
        nodeType: remote.node.type,
        pageId: remote.pageId,
        rootFrameId: remote.rootFrameId,
        kind: "added",
        fields: [],
        passthroughPreserved: Object.keys(remote.node.passthrough ?? {}),
        expectedRemoteHash: remote.snapshot.fingerprint,
        selected: true
      });
      continue;
    }
    if (local && !remote) {
      if (remoteIr.readCompleteness === "partial") continue;
      if (!figmaNodeId || !remoteBase) continue;
      const localChanges = localBase ? diffSnapshots(localBase, local.snapshot) : [];
      if (localChanges.length > 0) {
        conflicts.push({
          conflictKey: `${dshId}:deleted-remotely`,
          dshId,
          figmaNodeId,
          nodeName: local.node.name,
          field: "*",
          reason: "deleted-remotely",
          baseValue: localBase,
          localValue: local.snapshot,
          remoteValue: null
        });
      } else {
        entries.push({
          dshId,
          figmaNodeId,
          nodeName: local.node.name,
          nodeType: local.node.type,
          pageId: local.pageId,
          rootFrameId: local.rootFrameId,
          kind: "deleted",
          fields: [],
          passthroughPreserved,
          selected: true
        });
      }
      continue;
    }
    if (local && remote) {
      if (local.snapshot.type !== remote.snapshot.type) {
        conflicts.push({
          conflictKey: `${dshId}:type`,
          dshId,
          figmaNodeId,
          nodeName: local.node.name,
          field: "type",
          reason: "type-changed",
          baseValue: localBase?.type,
          localValue: local.snapshot.type,
          remoteValue: remote.snapshot.type
        });
        continue;
      }
      const localChanges = localBase ? diffSnapshots(localBase, local.snapshot) : [];
      const remoteChanges = remoteBase ? diffSnapshots(remoteBase, remote.snapshot) : diffSnapshots(local.snapshot, remote.snapshot);
      if (remoteChanges.length === 0) continue;
      const localChangedMap = new Map(localChanges.map((c) => [c.field, c]));
      const effectiveChanges = [];
      for (const rc of remoteChanges) {
        const lc2 = localChangedMap.get(rc.field);
        if (lc2) {
          if (valuesEquivalent(lc2.after, rc.after, rc.field)) continue;
          conflicts.push({
            conflictKey: `${dshId}:${rc.field}`,
            dshId,
            figmaNodeId,
            nodeName: local.node.name,
            field: rc.field,
            reason: rc.field === "parentId" ? "reparented" : "both-modified",
            baseValue: lc2.before,
            localValue: lc2.after,
            remoteValue: rc.after
          });
        } else {
          effectiveChanges.push({
            ...rc,
            before: local.snapshot[rc.field]
          });
        }
      }
      if (effectiveChanges.length > 0) {
        const onlyMoved = effectiveChanges.every((c) => c.field === "x" || c.field === "y" || c.field === "parentId");
        entries.push({
          dshId,
          figmaNodeId,
          nodeName: remote.node.name,
          nodeType: remote.node.type,
          pageId: remote.pageId,
          rootFrameId: remote.rootFrameId,
          kind: onlyMoved ? "moved" : "modified",
          fields: effectiveChanges,
          passthroughPreserved,
          expectedRemoteHash: remote.snapshot.fingerprint,
          selected: true
        });
      }
    }
  }
  return buildPlanObject("pull", remoteIr.readCompleteness, options.canvasName, options.baseCanvasRevision, sidecar.binding.fileKey, entries, conflicts, notices);
}
function applyPullPlan(doc, sidecar, remoteIr, plan, options = {}) {
  for (const conflict of plan.conflicts) {
    const resolved = options.resolutions?.[conflict.conflictKey] ?? conflict.resolution;
    if (!resolved) {
      throw new Error(`Unresolved sync conflict on "${conflict.nodeName}" (${conflict.field}); choose keep-drafi, take-figma, or skip`);
    }
  }
  const nextDoc = structuredClone(doc);
  const nextSidecar = structuredClone(sidecar);
  const figmaToDsh = /* @__PURE__ */ new Map();
  for (const [dshId, figmaId2] of Object.entries(nextSidecar.binding.nodes)) figmaToDsh.set(figmaId2, dshId);
  const figmaPageToDsh = /* @__PURE__ */ new Map();
  for (const [dshId, figmaId2] of Object.entries(nextSidecar.binding.pages)) figmaPageToDsh.set(figmaId2, dshId);
  const remoteMap = indexIr(remoteIr, figmaToDsh, figmaPageToDsh);
  const usedIds = /* @__PURE__ */ new Set();
  walkNodes(nextDoc, (n) => {
    if (typeof n.id === "string") usedIds.add(n.id);
  });
  const isSelected = (entry) => options.selectedIds ? options.selectedIds.has(entry.dshId) : entry.selected;
  let appliedCount = 0;
  let skippedCount = 0;
  const deletedIds = /* @__PURE__ */ new Set();
  const touchedDshIds = /* @__PURE__ */ new Set();
  for (const entry of plan.entries) {
    if (!isSelected(entry)) {
      skippedCount += 1;
      continue;
    }
    const remote = remoteMap.get(entry.dshId);
    if (entry.kind === "added" && remote) {
      const targetPage = findOrCreatePage(nextDoc, nextSidecar, entry.pageId, remoteIr);
      const created = irNodeToDshNode(
        { ...remote.node, dshId: entry.dshId },
        {
          nodeBindings: nextSidecar.binding.nodes,
          passthrough: nextSidecar.passthrough,
          imageHashes: nextSidecar.binding.imageHashes,
          usedIds
        }
      );
      insertNodeIntoParent(targetPage, created, remote.parentId);
      touchedDshIds.add(entry.dshId);
      appliedCount += 1;
    } else if (entry.kind === "deleted") {
      if (removeNodeById(nextDoc, entry.dshId)) {
        deletedIds.add(entry.dshId);
        delete nextSidecar.binding.nodes[entry.dshId];
        delete nextSidecar.base.localNodes[entry.dshId];
        delete nextSidecar.base.remoteProjectedNodes[entry.dshId];
        delete nextSidecar.passthrough[entry.dshId];
        appliedCount += 1;
      }
    } else if ((entry.kind === "modified" || entry.kind === "moved") && remote) {
      const localNode = findMutableNode(nextDoc, entry.dshId);
      if (localNode) {
        for (const change of entry.fields) {
          applyFieldToDshNode(localNode, change.field, change.after);
        }
        if (remote.node.passthrough) {
          nextSidecar.passthrough[entry.dshId] = {
            ...nextSidecar.passthrough[entry.dshId] ?? {},
            ...structuredClone(remote.node.passthrough)
          };
        }
        syncEventLabelText(nextDoc, nextSidecar, entry.dshId, localNode);
        touchedDshIds.add(entry.dshId);
        appliedCount += 1;
      }
    }
  }
  for (const conflict of plan.conflicts) {
    const resolution = options.resolutions?.[conflict.conflictKey] ?? conflict.resolution;
    if (resolution === "skip") {
      skippedCount += 1;
      continue;
    }
    const remote = remoteMap.get(conflict.dshId);
    if (resolution === "take-figma") {
      if (conflict.reason === "deleted-remotely") {
        if (removeNodeById(nextDoc, conflict.dshId)) {
          deletedIds.add(conflict.dshId);
          delete nextSidecar.binding.nodes[conflict.dshId];
          delete nextSidecar.base.localNodes[conflict.dshId];
          delete nextSidecar.base.remoteProjectedNodes[conflict.dshId];
          appliedCount += 1;
        }
      } else if (conflict.reason === "deleted-locally" && remote) {
        const targetPage = findOrCreatePage(nextDoc, nextSidecar, remote.pageId, remoteIr);
        const created = irNodeToDshNode(
          { ...remote.node, dshId: conflict.dshId },
          {
            nodeBindings: nextSidecar.binding.nodes,
            passthrough: nextSidecar.passthrough,
            imageHashes: nextSidecar.binding.imageHashes,
            usedIds
          }
        );
        insertNodeIntoParent(targetPage, created, remote.parentId);
        touchedDshIds.add(conflict.dshId);
        appliedCount += 1;
      } else {
        const localNode = findMutableNode(nextDoc, conflict.dshId);
        if (localNode) {
          applyFieldToDshNode(localNode, conflict.field, conflict.remoteValue);
          syncEventLabelText(nextDoc, nextSidecar, conflict.dshId, localNode);
          touchedDshIds.add(conflict.dshId);
          appliedCount += 1;
        }
      }
    } else if (resolution === "keep-drafi") {
      if (remote) {
        nextSidecar.base.remoteProjectedNodes[conflict.dshId] = remote.snapshot;
      }
      appliedCount += 1;
    }
  }
  if (deletedIds.size > 0) {
    reconcileDeletedPlacementsAndComments(nextDoc, nextSidecar, deletedIds);
  }
  const updatedLocalIr = dshDocToIr(nextDoc, nextSidecar);
  const updatedLocalMap = indexIr(updatedLocalIr, figmaToDsh, figmaPageToDsh);
  for (const dshId of touchedDshIds) {
    const localSnap = updatedLocalMap.get(dshId)?.snapshot;
    const remoteSnap = remoteMap.get(dshId)?.snapshot;
    if (localSnap) nextSidecar.base.localNodes[dshId] = localSnap;
    if (remoteSnap) nextSidecar.base.remoteProjectedNodes[dshId] = remoteSnap;
  }
  nextSidecar.binding.lastSyncedAt = (/* @__PURE__ */ new Date()).toISOString();
  if (remoteIr.remoteVersion) nextSidecar.binding.lastRemoteVersion = remoteIr.remoteVersion;
  return { doc: nextDoc, sidecar: nextSidecar, appliedCount, skippedCount };
}
function reconcileDeletedPlacementsAndComments(doc, sidecar, deletedIds) {
  const survivingByLogical = /* @__PURE__ */ new Map();
  for (const [placementId, placement] of Object.entries(sidecar.identities.placements)) {
    if (deletedIds.has(placementId)) {
      delete sidecar.identities.placements[placementId];
      continue;
    }
    const list2 = survivingByLogical.get(placement.logicalPageId) ?? [];
    list2.push(placementId);
    survivingByLogical.set(placement.logicalPageId, list2);
  }
  const nodesById = /* @__PURE__ */ new Map();
  walkNodes(doc, (n) => {
    if (typeof n.id === "string") nodesById.set(n.id, n);
  });
  const refsToDeleted = /* @__PURE__ */ new Map();
  for (const node of nodesById.values()) {
    if (typeof node.pageRef === "string" && deletedIds.has(node.pageRef)) {
      const list2 = refsToDeleted.get(node.pageRef) ?? [];
      list2.push(node);
      refsToDeleted.set(node.pageRef, list2);
    }
  }
  for (const [, orphans] of refsToDeleted) {
    const [newAnchor, ...rest] = orphans;
    if (!newAnchor || typeof newAnchor.id !== "string") continue;
    delete newAnchor.pageRef;
    for (const sibling of rest) {
      sibling.pageRef = newAnchor.id;
    }
  }
  if (sidecar.remoteComments) {
    for (const item of sidecar.remoteComments.items) {
      if (item.canvasNodeId && deletedIds.has(item.canvasNodeId)) {
        item.anchorState = "unanchored-needs-relocate";
      }
    }
  }
  if (Array.isArray(doc.comments)) {
    for (const comment of doc.comments) {
      if (typeof comment.nodeId === "string" && deletedIds.has(comment.nodeId)) {
        comment.anchorState = "unanchored-needs-relocate";
        comment.formerNodeId = comment.nodeId;
        delete comment.nodeId;
      }
    }
  }
}
function syncEventLabelText(doc, sidecar, changedDshId, changedNode) {
  if (changedNode.type !== "text" || typeof changedNode.text !== "string") return;
  for (const interaction of Object.values(sidecar.identities.interactions)) {
    if (!interaction.labelIds.includes(changedDshId)) continue;
    interaction.event = changedNode.text;
    for (const labelId of interaction.labelIds) {
      if (labelId === changedDshId) continue;
      const sibling = findMutableNode(doc, labelId);
      if (sibling && sibling.type === "text") sibling.text = changedNode.text;
    }
  }
}
function applyFieldToDshNode(node, field2, value) {
  if (field2 === "parentId") return;
  if (value === void 0) {
    delete node[field2];
    return;
  }
  if (field2 === "x" || field2 === "y" || field2 === "width" || field2 === "height" || field2 === "rotation" || field2 === "cornerRadius" || field2 === "opacity") {
    node[field2] = typeof value === "number" ? round22(value) : value;
    return;
  }
  node[field2] = structuredClone(value);
}
function findMutableNode(doc, id2) {
  let found = null;
  walkNodes(doc, (n) => {
    if (n.id === id2) found = n;
  });
  return found;
}
function removeNodeById(doc, id2) {
  const pages = Array.isArray(doc.pages) ? doc.pages : [];
  const removeFromList = (list2) => {
    const idx = list2.findIndex((n) => n.id === id2);
    if (idx >= 0) {
      list2.splice(idx, 1);
      return true;
    }
    for (const item of list2) {
      if (Array.isArray(item.children) && removeFromList(item.children)) {
        return true;
      }
    }
    return false;
  };
  for (const page of pages) {
    if (Array.isArray(page.children) && removeFromList(page.children)) {
      return true;
    }
  }
  return false;
}
function findOrCreatePage(doc, sidecar, pageId, remoteIr) {
  const pages = Array.isArray(doc.pages) ? doc.pages : doc.pages = [];
  const existing = pages.find((p) => p.id === pageId);
  if (existing) return existing;
  const remotePage = remoteIr.pages.find((p) => p.dshId === pageId || p.figmaId === pageId);
  const newPageId = /^[A-Za-z0-9_-]{1,64}$/.test(pageId) ? pageId : newId("page");
  const page = {
    id: newPageId,
    name: remotePage?.name ?? "Page",
    background: remotePage?.background ?? "#f5f5f5",
    children: []
  };
  pages.push(page);
  if (remotePage?.figmaId) sidecar.binding.pages[newPageId] = remotePage.figmaId;
  return page;
}
function insertNodeIntoParent(page, node, parentId) {
  if (parentId) {
    const parent = findMutableNode({ pages: [page] }, parentId);
    if (parent && (parent.type === "frame" || parent.type === "group")) {
      const children2 = Array.isArray(parent.children) ? parent.children : parent.children = [];
      children2.push(node);
      return;
    }
  }
  const children = Array.isArray(page.children) ? page.children : page.children = [];
  children.push(node);
}
function buildPlanObject(direction, readCompleteness, canvasName, baseCanvasRevision, fileKey, entries, conflicts, notices, assetsToTransfer = 0) {
  let added = 0;
  let modified = 0;
  let moved = 0;
  let deleted = 0;
  for (const e of entries) {
    if (e.kind === "added") added += 1;
    else if (e.kind === "modified") modified += 1;
    else if (e.kind === "moved") moved += 1;
    else if (e.kind === "deleted") deleted += 1;
  }
  const planId = `plan_${canonicalStringify({ direction, baseCanvasRevision, added, modified, moved, deleted, conflicts: conflicts.length }).length}_${newId("p")}`;
  return {
    planId,
    direction,
    readCompleteness,
    canvasName,
    baseCanvasRevision,
    fileKey,
    summary: { added, modified, moved, deleted, conflicts: conflicts.length, assetsToTransfer },
    entries,
    conflicts,
    notices
  };
}

// src/host/figma/bundle.ts
import { createHash as createHash2 } from "node:crypto";

// node_modules/.pnpm/fflate@0.8.3/node_modules/fflate/esm/index.mjs
import { createRequire } from "module";
var require2 = createRequire("/");
var _a;
var Worker;
var isMarkedAsUntransferable;
try {
  _a = require2("worker_threads"), Worker = _a.Worker, isMarkedAsUntransferable = _a.isMarkedAsUntransferable;
} catch (e) {
}
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i2 = 0; i2 < 31; ++i2) {
    b[i2] = start += 1 << eb[i2 - 1];
  }
  var r = new i32(b[30]);
  for (var i2 = 1; i2 < 30; ++i2) {
    for (var j = b[i2]; j < b[i2 + 1]; ++j) {
      r[j] = j - b[i2] << 5 | i2;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i2 = 0;
  var l = new u16(mb);
  for (; i2 < s; ++i2) {
    if (cd[i2])
      ++l[cd[i2] - 1];
  }
  var le = new u16(mb);
  for (i2 = 1; i2 < mb; ++i2) {
    le[i2] = le[i2 - 1] + l[i2 - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i2 = 0; i2 < s; ++i2) {
      if (cd[i2]) {
        var sv = i2 << 4 | cd[i2];
        var r_1 = mb - cd[i2];
        var v = le[cd[i2] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i2 = 0; i2 < s; ++i2) {
      if (cd[i2]) {
        co[i2] = rev[le[cd[i2] - 1]++] >> 15 - cd[i2];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i2 = 1; i2 < a.length; ++i2) {
    if (a[i2] > m)
      m = a[i2];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type2 = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type2) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type2 == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type2 == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i2 = 0; i2 < hcLen; ++i2) {
          clt[clim[i2]] = bits(dat, pos + i2 * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i2 = 0; i2 < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i2++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i2 - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i2++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i2 = sym - 257, b = fleb[i2];
          add = bits(dat, pos, (1 << b) - 1) + fl[i2];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var wbits = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
};
var wbits16 = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
  d[o + 2] |= v >> 16;
};
var hTree = function(d, mb) {
  var t = [];
  for (var i2 = 0; i2 < d.length; ++i2) {
    if (d[i2])
      t.push({ s: i2, f: d[i2] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return { t: v, l: 1 };
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r = t[1], i0 = 0, i1 = 1, i22 = 2;
  t[0] = { s: -1, f: l.f + r.f, l, r };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i22].f ? i0++ : i22++];
    r = t[i0 != i1 && t[i0].f < t[i22].f ? i0++ : i22++];
    t[i1++] = { s: -1, f: l.f + r.f, l, r };
  }
  var maxSym = t2[0].s;
  for (var i2 = 1; i2 < s; ++i2) {
    if (t2[i2].s > maxSym)
      maxSym = t2[i2].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i2 = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr[b.s] - tr[a.s] || a.f - b.f;
    });
    for (; i2 < s; ++i2) {
      var i2_1 = t2[i2].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i2].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i2;
    }
    for (; i2 >= 0 && dt; --i2) {
      var i2_3 = t2[i2].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr), l: mbt };
};
var ln = function(n, l, d) {
  return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w = function(v) {
    cl[cli++] = v;
  };
  for (var i2 = 1; i2 <= s; ++i2) {
    if (c[i2] == cln && i2 != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w(32754);
        if (cls > 2) {
          w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6)
          w(8304);
        if (cls > 2)
          w(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w(cln);
      cls = 1;
      cln = c[i2];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
};
var clen = function(cf, cl) {
  var l = 0;
  for (var i2 = 0; i2 < cl.length; ++i2)
    l += cf[i2] * cl[i2];
  return l;
};
var wfblk = function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i2 = 0; i2 < s; ++i2)
    out[o + i2 + 4] = dat[i2];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i2 = 0; i2 < lclt.length; ++i2)
    ++lcfreq[lclt[i2] & 31];
  for (var i2 = 0; i2 < lcdt.length; ++i2)
    ++lcfreq[lcdt[i2] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i2 = 0; i2 < nlcc; ++i2)
      wbits(out, p + 3 * i2, lct[clim[i2]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i2 = 0; i2 < clct.length; ++i2) {
        var len = clct[i2] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i2] >> 5 & 127), p += clct[i2] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i2 = 0; i2 < li; ++i2) {
    var sym = syms[i2];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, sym >> 23 & 31), p += fleb[len];
      var dst = sym & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[sym]), p += ll[sym];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};
var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st) {
  var s = st.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w = o.subarray(pre, o.length - post);
  var lst = st.l;
  var pos = (st.r || 0) & 7;
  if (lvl) {
    if (pos)
      w[0] = st.r >> 3;
    var opt = deo[lvl - 1];
    var n = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i3) {
      return (dat[i3] ^ dat[i3 + 1] << bs1_1 ^ dat[i3 + 2] << bs2_1) & msk_1;
    };
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i2 = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
    for (; i2 + 2 < s; ++i2) {
      var hv = hsh(i2);
      var imod = i2 & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i2) {
        var rem = s - i2;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i2 - bs, pos);
          li = lc_1 = eb = 0, bs = i2;
          for (var j = 0; j < 286; ++j)
            lf[j] = 0;
          for (var j = 0; j < 30; ++j)
            df[j] = 0;
        }
        var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i2 - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i2);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i2 + l] == dat[i2 + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i2 + nl] == dat[i2 + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j = 0; j < mmd; ++j) {
                  var ti = i2 - dif + j & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
          var lin = revfl[l] & 31, din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i2 + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i2];
          ++lf[dat[i2]];
        }
      }
    }
    for (i2 = Math.max(i2, wi); i2 < s; ++i2) {
      syms[li++] = dat[i2];
      ++lf[dat[i2]];
    }
    pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i2 - bs, pos);
    if (!lst) {
      st.r = pos & 7 | w[pos / 8 | 0] << 3;
      pos -= 7;
      st.h = head, st.p = prev, st.i = i2, st.w = wi;
    }
  } else {
    for (var i2 = st.w || 0; i2 < s + lst; i2 += 65535) {
      var e = i2 + 65535;
      if (e >= s) {
        w[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w, pos + 1, dat.subarray(i2, e));
    }
    st.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
};
var crct = /* @__PURE__ */ (function() {
  var t = new Int32Array(256);
  for (var i2 = 0; i2 < 256; ++i2) {
    var c = i2, k = 9;
    while (--k)
      c = (c & 1 && -306674912) ^ c >>> 1;
    t[i2] = c;
  }
  return t;
})();
var crc = function() {
  var c = -1;
  return {
    p: function(d) {
      var cr = c;
      for (var i2 = 0; i2 < d.length; ++i2)
        cr = crct[cr & 255 ^ d[i2]] ^ cr >>> 8;
      c = cr;
    },
    d: function() {
      return ~c;
    }
  };
};
var dopt = function(dat, opt, pre, post, st) {
  if (!st) {
    st = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
};
var mrg = function(a, b) {
  var o = {};
  for (var k in a)
    o[k] = a[k];
  for (var k in b)
    o[k] = b[k];
  return o;
};
var b2 = function(d, b) {
  return d[b] | d[b + 1] << 8;
};
var b4 = function(d, b) {
  return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
};
var b8 = function(d, b) {
  return b4(d, b) + b4(d, b + 4) * 4294967296;
};
var wbytes = function(d, b, v) {
  for (; v; ++b)
    d[b] = v, v >>>= 8;
};
function deflateSync(data, opts) {
  return dopt(data, opts || {}, 0, 0);
}
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var fltn = function(d, p, t, o) {
  for (var k in d) {
    var val = d[k], n = p + k, op = o;
    if (Array.isArray(val))
      op = mrg(o, val[1]), val = val[0];
    if (ArrayBuffer.isView(val))
      t[n] = [val, op];
    else {
      t[n += "/"] = [new u8(0), op];
      fltn(val, n, t, o);
    }
  }
};
var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
var dutf8 = function(d) {
  for (var r = "", i2 = 0; ; ) {
    var c = d[i2++];
    var eb = (c > 127) + (c > 223) + (c > 239);
    if (i2 + eb > d.length)
      return { s: r, r: slc(d, i2 - 1) };
    if (!eb)
      r += String.fromCharCode(c);
    else if (eb == 3) {
      c = ((c & 15) << 18 | (d[i2++] & 63) << 12 | (d[i2++] & 63) << 6 | d[i2++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
    } else if (eb & 1)
      r += String.fromCharCode((c & 31) << 6 | d[i2++] & 63);
    else
      r += String.fromCharCode((c & 15) << 12 | (d[i2++] & 63) << 6 | d[i2++] & 63);
  }
};
function strToU8(str, latin1) {
  if (latin1) {
    var ar_1 = new u8(str.length);
    for (var i2 = 0; i2 < str.length; ++i2)
      ar_1[i2] = str.charCodeAt(i2);
    return ar_1;
  }
  if (te)
    return te.encode(str);
  var l = str.length;
  var ar = new u8(str.length + (str.length >> 1));
  var ai = 0;
  var w = function(v) {
    ar[ai++] = v;
  };
  for (var i2 = 0; i2 < l; ++i2) {
    if (ai + 5 > ar.length) {
      var n = new u8(ai + 8 + (l - i2 << 1));
      n.set(ar);
      ar = n;
    }
    var c = str.charCodeAt(i2);
    if (c < 128 || latin1)
      w(c);
    else if (c < 2048)
      w(192 | c >> 6), w(128 | c & 63);
    else if (c > 55295 && c < 57344)
      c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i2) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
    else
      w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
  }
  return slc(ar, 0, ai);
}
function strFromU8(dat, latin1) {
  if (latin1) {
    var r = "";
    for (var i2 = 0; i2 < dat.length; i2 += 16384)
      r += String.fromCharCode.apply(null, dat.subarray(i2, i2 + 16384));
    return r;
  } else if (td) {
    return td.decode(dat);
  } else {
    var _a2 = dutf8(dat), s = _a2.s, r = _a2.r;
    if (r.length)
      err(8);
    return s;
  }
}
var slzh = function(d, b) {
  return b + 30 + b2(d, b + 26) + b2(d, b + 28);
};
var zh = function(d, b, z) {
  var fnl = b2(d, b + 28), efl = b2(d, b + 30), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl;
  var _a2 = z64hs(d, es, efl, z, b4(d, b + 20), b4(d, b + 24), b4(d, b + 42)), sc = _a2[0], su = _a2[1], off = _a2[2];
  return [b2(d, b + 10), sc, su, fn, es + efl + b2(d, b + 32), off];
};
var z64hs = function(d, b, l, z, sc, su, off) {
  var nsc = sc == 4294967295, nsu = su == 4294967295, noff = off == 4294967295, e = b + l;
  var nf = nsc + nsu + noff;
  if (z && nf) {
    for (; b + 4 < e; b += 4 + b2(d, b + 2)) {
      if (b2(d, b) == 1) {
        return [
          nsc ? b8(d, b + 4 + 8 * nsu) : sc,
          nsu ? b8(d, b + 4) : su,
          noff ? b8(d, b + 4 + 8 * (nsu + nsc)) : off,
          1
        ];
      }
    }
    if (z < 2)
      err(13);
  }
  return [sc, su, off, 0];
};
var exfl = function(ex) {
  var le = 0;
  if (ex) {
    for (var k in ex) {
      var l = ex[k].length;
      if (l > 65535)
        err(9);
      le += l + 4;
    }
  }
  return le;
};
var wzh = function(d, b, f, fn, u, c, ce, co) {
  var fl2 = fn.length, ex = f.extra, col = co && co.length;
  var exl = exfl(ex);
  wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
  if (ce != null)
    d[b++] = 20, d[b++] = f.os;
  d[b] = 20, b += 2;
  d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
  d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
  var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
  if (y < 0 || y > 119)
    err(10);
  wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
  if (c != -1) {
    wbytes(d, b, f.crc);
    wbytes(d, b + 4, c < 0 ? -c - 2 : c);
    wbytes(d, b + 8, f.size);
  }
  wbytes(d, b + 12, fl2);
  wbytes(d, b + 14, exl), b += 16;
  if (ce != null) {
    wbytes(d, b, col);
    wbytes(d, b + 6, f.attrs);
    wbytes(d, b + 10, ce), b += 14;
  }
  d.set(fn, b);
  b += fl2;
  if (exl) {
    for (var k in ex) {
      var exf = ex[k], l = exf.length;
      wbytes(d, b, +k);
      wbytes(d, b + 2, l);
      d.set(exf, b + 4), b += 4 + l;
    }
  }
  if (col)
    d.set(co, b), b += col;
  return b;
};
var wzf = function(o, b, c, d, e) {
  wbytes(o, b, 101010256);
  wbytes(o, b + 8, c);
  wbytes(o, b + 10, c);
  wbytes(o, b + 12, d);
  wbytes(o, b + 16, e);
};
function zipSync(data, opts) {
  if (!opts)
    opts = {};
  var r = {};
  var files = [];
  fltn(data, "", r, opts);
  var o = 0;
  var tot = 0;
  for (var fn in r) {
    var _a2 = r[fn], file = _a2[0], p = _a2[1];
    var compression = p.level == 0 ? 0 : 8;
    var f = strToU8(fn), s = f.length;
    var com = p.comment, m = com && strToU8(com), ms = m && m.length;
    var exl = exfl(p.extra);
    if (s > 65535)
      err(11);
    var d = compression ? deflateSync(file, p) : file, l = d.length;
    var c = crc();
    c.p(file);
    files.push(mrg(p, {
      size: file.length,
      crc: c.d(),
      c: d,
      f,
      m,
      u: s != fn.length || m && com.length != ms,
      o,
      compression
    }));
    o += 30 + s + exl + l;
    tot += 76 + 2 * (s + exl) + (ms || 0) + l;
  }
  var out = new u8(tot + 22), oe = o, cdl = tot - o;
  for (var i2 = 0; i2 < files.length; ++i2) {
    var f = files[i2];
    wzh(out, f.o, f, f.f, f.u, f.c.length);
    var badd = 30 + f.f.length + exfl(f.extra);
    out.set(f.c, f.o + badd);
    wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
  }
  wzf(out, o, files.length, cdl, oe);
  return out;
}
function unzipSync(data, opts) {
  var files = {};
  var e = data.length - 22;
  for (; b4(data, e) != 101010256; --e) {
    if (!e || data.length - e > 65558)
      err(13);
  }
  ;
  var c = b2(data, e + 8);
  if (!c)
    return {};
  var o = b4(data, e + 16);
  var z = b4(data, e - 20) == 117853008;
  if (z) {
    var ze = b4(data, e - 12);
    z = b4(data, ze) == 101075792;
    if (z) {
      c = b4(data, ze + 32);
      o = b4(data, ze + 48);
    }
  }
  var fltr = opts && opts.filter;
  for (var i2 = 0; i2 < c; ++i2) {
    var _a2 = zh(data, o, z), c_2 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b = slzh(data, off);
    o = no;
    if (!fltr || fltr({
      name: fn,
      size: sc,
      originalSize: su,
      compression: c_2
    })) {
      if (!c_2)
        files[fn] = slc(data, b, b + sc);
      else if (c_2 == 8)
        files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
      else
        err(14, "unknown compression type " + c_2);
    }
  }
  return files;
}

// src/host/figma/sidecar.ts
import { mkdir as mkdir2, readFile as readFile2, rename, unlink, writeFile as writeFile2 } from "node:fs/promises";
import { dirname, join as join2, resolve as resolve3, sep } from "node:path";
var SYNC_SUFFIX = ".sync.json";
var LEGACY_ARCHIVE_FORMAT = "dsh.canvas.figma@1";
function assertInside(root, target) {
  const base = resolve3(root);
  const full = resolve3(target);
  if (full !== base && !full.startsWith(base + sep)) {
    throw new Error("path escapes .dsh-canvas directory");
  }
  return full;
}
function sidecarFile(canvasDir, name) {
  if (!isSlug(name)) throw new Error(`invalid canvas name "${name}"`);
  return assertInside(canvasDir, join2(canvasDir, "figma", `${name}${SYNC_SUFFIX}`));
}
async function readSidecar(canvasDir, name) {
  const file = sidecarFile(canvasDir, name);
  let raw;
  try {
    raw = await readFile2(file, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
  const parsed = JSON.parse(raw);
  if (parsed?.format !== FIGMA_SYNC_FORMAT || parsed?.version !== FIGMA_SYNC_VERSION) {
    throw new Error(`Unsupported Figma sync sidecar format in ${name}${SYNC_SUFFIX}`);
  }
  return parsed;
}
async function writeSidecar(canvasDir, name, sidecar) {
  const file = sidecarFile(canvasDir, name);
  await mkdir2(dirname(file), { recursive: true });
  const normalized = {
    ...sidecar,
    format: FIGMA_SYNC_FORMAT,
    version: FIGMA_SYNC_VERSION,
    canvasName: name
  };
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile2(temp, JSON.stringify(normalized, null, 2) + "\n", "utf8");
  await rename(temp, file);
  return file;
}
async function deleteSidecar(canvasDir, name) {
  const file = sidecarFile(canvasDir, name);
  try {
    await unlink(file);
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
async function renameSidecar(canvasDir, from, to) {
  const existing = await readSidecar(canvasDir, from);
  if (!existing) return false;
  existing.canvasName = to;
  await writeSidecar(canvasDir, to, existing);
  await deleteSidecar(canvasDir, from);
  return true;
}
function isLegacyFigmaArchive(value) {
  return Boolean(value && typeof value === "object" && value.format === LEGACY_ARCHIVE_FORMAT);
}
function extractDocFromLegacyArchive(raw) {
  const dsh = raw.dsh && typeof raw.dsh === "object" ? raw.dsh : {};
  const docTree = raw.document && typeof raw.document === "object" ? raw.document : {};
  const nodesById = dsh.nodes && typeof dsh.nodes === "object" ? dsh.nodes : {};
  const figmaPages = Array.isArray(docTree.children) ? docTree.children : [];
  const pages = figmaPages.map((page, index) => {
    const convertChildren = (children) => {
      if (!Array.isArray(children)) return [];
      const result = [];
      for (const child of children) {
        if (!child || typeof child !== "object") continue;
        const c = child;
        const figId = typeof c.id === "string" ? c.id : "";
        const ext = nodesById[figId];
        const base = ext ? structuredClone(ext) : {
          id: figId.replace(/[^A-Za-z0-9_-]/g, "_") || `node_${index}`,
          type: "frame",
          name: typeof c.name === "string" ? c.name : "Frame",
          x: 0,
          y: 0,
          width: 100,
          height: 100
        };
        if (base.type === "frame" || base.type === "group") {
          base.children = convertChildren(c.children);
        }
        result.push(base);
      }
      return result;
    };
    return {
      id: typeof page.id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(page.id) ? page.id : `page-${index + 1}`,
      name: typeof page.name === "string" ? page.name : `Page ${index + 1}`,
      background: "#f5f5f5",
      children: convertChildren(page.children)
    };
  });
  return normalizeDoc(
    {
      format: "dsh.canvas",
      version: 1,
      id: typeof dsh.id === "string" ? dsh.id : "canvas_migrated",
      title: typeof docTree.name === "string" ? docTree.name : "Migrated Canvas",
      pages: pages.length ? pages : [{ id: "page-1", name: "Page 1", background: "#f5f5f5", children: [] }],
      styles: Array.isArray(dsh.styles) ? dsh.styles : [],
      components: Array.isArray(dsh.components) ? dsh.components : [],
      variantSets: Array.isArray(dsh.variantSets) ? dsh.variantSets : [],
      fonts: Array.isArray(dsh.fonts) ? dsh.fonts : [],
      comments: Array.isArray(dsh.comments) ? dsh.comments : []
    },
    { touch: false }
  );
}

// src/host/figma/bundle.ts
var BUNDLE_FORMAT = "dsh.fig.bundle";
var BUNDLE_VERSION = 1;
var BUNDLE_SUFFIX = ".dshfig";
var MAX_BUNDLE_BYTES = 256 * 1024 * 1024;
var MAX_JSON_BYTES = 48 * 1024 * 1024;
var ASSET_PATH_RE = /^(?:assets|fonts)\/[A-Za-z0-9._-]{1,120}$/;
var OBJECT_PATH_RE = /^objects\/[0-9a-f]{64}$/;
function sha256Hex(bytes) {
  return createHash2("sha256").update(bytes).digest("hex");
}
function collectReferencedAssets(doc) {
  const files = /* @__PURE__ */ new Set();
  const visit = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
    } else if (value && typeof value === "object") {
      const rec = value;
      if (typeof rec.asset === "string" && ASSET_PATH_RE.test(rec.asset) && !rec.asset.includes("..")) {
        files.add(rec.asset);
      }
      for (const item of Object.values(rec)) visit(item);
    }
  };
  visit(doc);
  return files;
}
async function exportDshFigBundle(params) {
  const normalizedDoc = normalizeDoc(params.doc, { touch: false });
  const assetPaths = collectReferencedAssets(normalizedDoc);
  const index = {};
  const parts = {};
  let totalBytes = 0;
  for (const relPath of assetPaths) {
    const data = await params.loadAsset(relPath);
    const hash = sha256Hex(data);
    index[relPath] = hash;
    const objectKey = `objects/${hash}`;
    if (!parts[objectKey]) {
      totalBytes += data.byteLength;
      if (totalBytes > MAX_BUNDLE_BYTES) throw new Error("Bundle exceeds 256 MiB limit");
      parts[objectKey] = [data, { level: 0 }];
    }
  }
  const canvasBytes = strToU8(JSON.stringify(normalizedDoc));
  if (canvasBytes.byteLength > MAX_JSON_BYTES) throw new Error("Canvas document exceeds bundle JSON limit");
  parts["canvas.json"] = [canvasBytes, { level: 1 }];
  if (params.sidecar) {
    const sidecarBytes = strToU8(JSON.stringify(params.sidecar));
    if (sidecarBytes.byteLength > MAX_JSON_BYTES) throw new Error("Figma sync sidecar exceeds bundle JSON limit");
    parts["figma.sync.json"] = [sidecarBytes, { level: 1 }];
  }
  const manifestBytes = strToU8(
    JSON.stringify({
      format: BUNDLE_FORMAT,
      version: BUNDLE_VERSION,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      hasSidecar: Boolean(params.sidecar),
      index
    })
  );
  parts["manifest.json"] = [manifestBytes, { level: 1 }];
  const bytes = zipSync(parts);
  return {
    bytes,
    objects: Object.keys(parts).filter((k) => k.startsWith("objects/")).length,
    assetCount: assetPaths.size
  };
}
function importDshFigBundle(bytes) {
  if (bytes.byteLength > MAX_BUNDLE_BYTES) throw new Error("Bundle exceeds 256 MiB limit");
  let total = 0;
  const seen = /* @__PURE__ */ new Set();
  const parts = unzipSync(bytes, {
    filter: (member) => {
      const allowed = member.name === "manifest.json" || member.name === "canvas.json" || member.name === "figma.sync.json" || OBJECT_PATH_RE.test(member.name);
      if (!allowed) return false;
      if (seen.has(member.name)) throw new Error(`Duplicate entry "${member.name}" in .dshfig bundle`);
      seen.add(member.name);
      total += member.originalSize;
      if (total > MAX_BUNDLE_BYTES) throw new Error("Bundle exceeds 256 MiB decompressed limit");
      if (!member.name.startsWith("objects/") && member.originalSize > MAX_JSON_BYTES) {
        throw new Error(`Bundle JSON member "${member.name}" exceeds size limit`);
      }
      return true;
    }
  });
  if (!parts["manifest.json"]) throw new Error("Invalid .dshfig bundle: missing manifest.json");
  const manifest = JSON.parse(strFromU8(parts["manifest.json"]));
  if (manifest.format === "dsh.canvas.figma.bundle" && isLegacyFigmaArchive(manifest.archive)) {
    const doc2 = extractDocFromLegacyArchive(manifest.archive);
    const files2 = extractIndexedFiles(manifest.index, parts);
    return { doc: doc2, sidecar: null, files: files2 };
  }
  if (manifest.format !== BUNDLE_FORMAT || manifest.version !== BUNDLE_VERSION) {
    throw new Error(`Unsupported .dshfig bundle format: ${String(manifest.format)}`);
  }
  if (!parts["canvas.json"]) throw new Error("Invalid .dshfig bundle: missing canvas.json");
  const doc = normalizeDoc(JSON.parse(strFromU8(parts["canvas.json"])), { touch: false });
  let sidecar = null;
  if (parts["figma.sync.json"]) {
    const parsedSidecar = JSON.parse(strFromU8(parts["figma.sync.json"]));
    if (parsedSidecar.format === FIGMA_SYNC_FORMAT && parsedSidecar.version === FIGMA_SYNC_VERSION) {
      sidecar = parsedSidecar;
    }
  }
  const files = extractIndexedFiles(manifest.index, parts);
  return { doc, sidecar, files };
}
function extractIndexedFiles(indexRaw, parts) {
  const index = indexRaw && typeof indexRaw === "object" ? indexRaw : {};
  const files = /* @__PURE__ */ new Map();
  for (const [relPath, hash] of Object.entries(index)) {
    if (!ASSET_PATH_RE.test(relPath) || relPath.includes("..")) {
      throw new Error(`Invalid asset path "${relPath}" in bundle`);
    }
    if (typeof hash !== "string" || !/^[0-9a-f]{64}$/.test(hash)) {
      throw new Error(`Invalid checksum for "${relPath}" in bundle`);
    }
    const data = parts[`objects/${hash}`];
    if (!data || sha256Hex(data) !== hash) {
      throw new Error(`Checksum mismatch for "${relPath}" in bundle`);
    }
    files.set(relPath, data);
  }
  return files;
}

// src/host/figma/fig-reader.ts
import * as zlib from "node:zlib";
function asProps(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return /* @__PURE__ */ Object.create(null);
  return value;
}
var maxTransportBytes = 256 * 1024 * 1024;
var maxCanvasBytes = 96 * 1024 * 1024;
var maxSchemaBytes = 4 * 1024 * 1024;
var maxValueCount = 16e6;
var utf8 = new TextDecoder("utf-8", { fatal: true });
var Cursor = class {
  constructor(data) {
    this.data = data;
  }
  data;
  offset = 0;
  floatBytes = new DataView(new ArrayBuffer(4));
  get remaining() {
    return this.data.length - this.offset;
  }
  take(length) {
    if (length < 0 || length > this.data.length - this.offset) throw new Error("Truncated Figma archive");
    const slice = this.data.subarray(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }
  byte() {
    return this.take(1)[0];
  }
  uint() {
    let value = 0;
    for (let shift = 0; shift <= 28; shift += 7) {
      const byte = this.byte();
      value += (byte & 127) * 2 ** shift;
      if (byte < 128 && value <= 4294967295) return value;
    }
    throw new Error("Invalid Figma integer");
  }
  int() {
    const value = this.uint();
    return value & 1 ? -(value + 1) / 2 : value / 2;
  }
  wide(signed) {
    let value = 0n;
    for (let shift = 0n; shift <= 63n; shift += 7n) {
      const byte = this.byte();
      value |= BigInt(byte & 127) << shift;
      if (byte < 128) return (signed ? value >> 1n ^ -(value & 1n) : value).toString();
    }
    throw new Error("Invalid Figma 64-bit integer");
  }
  float() {
    const first = this.byte();
    if (first === 0) return 0;
    const bits2 = first | this.byte() << 8 | this.byte() << 16 | this.byte() << 24;
    this.floatBytes.setUint32(0, bits2 << 23 | bits2 >>> 9);
    return this.floatBytes.getFloat32(0);
  }
  string() {
    const end = this.data.indexOf(0, this.offset);
    if (end < 0 || end - this.offset > 2e6) throw new Error("Invalid Figma string");
    const bytes = this.take(end - this.offset);
    this.byte();
    return utf8.decode(bytes);
  }
  segment(limit) {
    const word = this.take(4);
    const length = new DataView(word.buffer, word.byteOffset, word.byteLength).getUint32(0, true);
    const compressed = this.take(length);
    if (compressed[0] !== 40 || compressed[1] !== 181 || compressed[2] !== 47 || compressed[3] !== 253) {
      return zlib.inflateRawSync(compressed, { maxOutputLength: limit });
    }
    if (typeof zlib.zstdDecompressSync !== "function") {
      throw new Error("This Figma copy requires a Host runtime with Zstandard support");
    }
    return zlib.zstdDecompressSync(compressed, { maxOutputLength: limit });
  }
};
function decodeSchema(schemaData) {
  const cursor = new Cursor(schemaData);
  const count = cursor.uint();
  if (count < 1 || count > 12e3) throw new Error("Unsupported Figma schema size");
  const types = [];
  for (let i2 = 0; i2 < count; i2++) {
    const name = cursor.string();
    const kind = cursor.byte();
    const fieldCount = cursor.uint();
    if (kind > 2 || fieldCount > 3e4) throw new Error("Invalid Figma schema declaration");
    const fields = /* @__PURE__ */ new Map();
    for (let j = 0; j < fieldCount; j++) {
      const fieldName = cursor.string();
      const type2 = cursor.int();
      const array = Boolean(cursor.byte());
      const id2 = cursor.uint();
      if (fields.has(id2)) throw new Error("Duplicate Figma schema field");
      fields.set(id2, { id: id2, name: fieldName, type: type2, array });
    }
    types.push({ name, kind, fields });
  }
  return types;
}
function decodeMessage(data, types) {
  const cursor = new Cursor(data);
  let budget = maxValueCount;
  const root = types.findIndex((type2) => type2.name === "Message");
  function read(typeId, depth) {
    if (--budget < 0 || depth > 100) throw new Error("Figma archive exceeds decode limits");
    switch (typeId) {
      case -1:
        return Boolean(cursor.byte());
      case -2:
        return cursor.byte();
      case -3:
        return cursor.int();
      case -4:
        return cursor.uint();
      case -5:
        return cursor.float();
      case -6:
        return cursor.string();
      case -7:
        return cursor.wide(true);
      case -8:
        return cursor.wide(false);
    }
    const type2 = types[typeId];
    if (!type2) throw new Error("Unknown Figma schema type");
    if (type2.kind === 0) return type2.fields.get(cursor.uint())?.name ?? "UNKNOWN";
    const output = /* @__PURE__ */ Object.create(null);
    function fieldValue(field2) {
      if (!field2.array) return read(field2.type, depth + 1);
      const length = cursor.uint();
      if (field2.type === -2) return cursor.take(length);
      if (length > budget || length > 1e6) throw new Error("Figma array exceeds decode limits");
      return Array.from({ length }, () => read(field2.type, depth + 1));
    }
    if (type2.kind === 1) {
      for (const field2 of type2.fields.values()) output[field2.name] = fieldValue(field2);
      return output;
    }
    for (let id2 = cursor.uint(); id2 !== 0; id2 = cursor.uint()) {
      const field2 = type2.fields.get(id2);
      if (!field2) throw new Error("Figma archive references an undeclared field");
      output[field2.name] = fieldValue(field2);
    }
    return output;
  }
  if (root < 0) throw new Error("Missing Figma document message");
  return asProps(read(root, 0));
}
function readNativeFig(bytes) {
  if (bytes.length > maxTransportBytes) throw new Error("Figma transport exceeds 256 MiB");
  let canvas = bytes;
  const images = /* @__PURE__ */ new Map();
  if (bytes[0] === 80 && bytes[1] === 75) {
    let total = 0;
    const names = /* @__PURE__ */ new Set();
    const files = unzipSync(bytes, {
      filter: (entry) => {
        const wanted = entry.name === "canvas.fig" || /^images\/[a-f\d]{40}(?:\.(?:png|jpe?g|gif|webp))?$/i.test(entry.name);
        if (!wanted) return false;
        if (names.has(entry.name) || entry.originalSize > maxCanvasBytes || (total += entry.originalSize) > maxTransportBytes) {
          throw new Error("Figma ZIP exceeds archive limits or contains duplicate members");
        }
        names.add(entry.name);
        return true;
      }
    });
    canvas = files["canvas.fig"];
    if (!canvas) throw new Error("Missing canvas.fig in archive");
    for (const [name, image] of Object.entries(files)) {
      if (!name.startsWith("images/")) continue;
      images.set(name.slice(7, 47).toLowerCase(), image);
    }
  }
  const cursor = new Cursor(canvas);
  const magic = utf8.decode(cursor.take(8));
  if (magic !== "fig-kiwi" && magic !== "fig-jam.") throw new Error("Not a native Figma Design copy");
  const version = cursor.take(4);
  const schemaVersion = new DataView(version.buffer, version.byteOffset, version.byteLength).getUint32(0, true);
  if (schemaVersion < 15) throw new Error("Unsupported Figma schema version");
  const schema = decodeSchema(cursor.segment(maxSchemaBytes));
  const message = decodeMessage(cursor.segment(maxCanvasBytes), schema);
  if (!Array.isArray(message.nodeChanges)) throw new Error("Figma archive has no node tree");
  const blobs = Array.isArray(message.blobs) ? message.blobs.map((b) => b && typeof b === "object" && "bytes" in b && b.bytes instanceof Uint8Array ? b.bytes : null).filter((b) => b !== null) : void 0;
  return { schemaVersion, nodes: message.nodeChanges.map(asProps), images, blobs };
}
function figmaId(value) {
  if (!value) return void 0;
  const guid = asProps(value);
  if (typeof guid.sessionID !== "number" || typeof guid.localID !== "number") return void 0;
  return `${guid.sessionID}:${guid.localID}`;
}

// src/host/figma/fig-adapter.ts
import { createHash as createHash3 } from "node:crypto";
import { mkdir as mkdir3, writeFile as writeFile3 } from "node:fs/promises";
import { join as join3 } from "node:path";
var WEIGHT_BY_STYLE = [
  [/thin|hairline/i, 100],
  [/extra\s*light|ultra\s*light/i, 200],
  [/light/i, 300],
  [/medium/i, 500],
  [/semi\s*bold|demi\s*bold/i, 600],
  [/extra\s*bold|ultra\s*bold/i, 800],
  [/black|heavy/i, 900],
  [/bold/i, 700]
];
function detectImageExt(bytes) {
  if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return ".png";
  if (bytes[0] === 255 && bytes[1] === 216) return ".jpg";
  if (bytes[0] === 71 && bytes[1] === 73 && bytes[2] === 70) return ".gif";
  if (bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70) return ".webp";
  return ".png";
}
async function persistFigmaImages(canvasDir, images) {
  const hashMap = {};
  if (images.size === 0) return hashMap;
  const assetsDir = join3(canvasDir, "assets");
  await mkdir3(assetsDir, { recursive: true });
  for (const [figmaHash, bytes] of images) {
    if (!bytes.byteLength) continue;
    const ext = detectImageExt(bytes);
    const sha24 = createHash3("sha256").update(bytes).digest("hex").slice(0, 24);
    const rel = `assets/${sha24}${ext}`;
    await writeFile3(join3(canvasDir, rel), bytes);
    hashMap[figmaHash.toLowerCase()] = rel;
  }
  return hashMap;
}
function bytesToHex(bytes) {
  if (bytes instanceof Uint8Array) {
    return Buffer.from(bytes).toString("hex").toLowerCase();
  }
  if (Array.isArray(bytes)) {
    return Buffer.from(bytes.map((b) => Number(b) & 255)).toString("hex").toLowerCase();
  }
  if (typeof bytes === "string" && /^[0-9a-f]{40}$/i.test(bytes)) return bytes.toLowerCase();
  return void 0;
}
function convertPaints(paints, imageAssets) {
  if (!Array.isArray(paints)) return void 0;
  const out = [];
  for (const raw of paints) {
    const p = asProps(raw);
    if (p.visible === false) continue;
    const paintOpacity = typeof p.opacity === "number" ? p.opacity : 1;
    if (p.type === "SOLID") {
      const c = asProps(p.color);
      const conv = figmaRgbaToHex(
        { r: Number(c.r ?? 0), g: Number(c.g ?? 0), b: Number(c.b ?? 0), a: Number(c.a ?? 1) },
        paintOpacity
      );
      out.push(conv.opacity < 1 ? { type: "solid", color: conv.color, opacity: conv.opacity } : { type: "solid", color: conv.color });
    } else if (p.type === "GRADIENT_LINEAR" || p.type === "GRADIENT_RADIAL") {
      const stopsRaw = Array.isArray(p.stops) ? p.stops : [];
      const stops = stopsRaw.map((s) => {
        const sp = asProps(s);
        const c = asProps(sp.color);
        const conv = figmaRgbaToHex({ r: Number(c.r ?? 0), g: Number(c.g ?? 0), b: Number(c.b ?? 0), a: Number(c.a ?? 1) }, 1);
        return {
          position: round22(Number(sp.position ?? 0)),
          color: conv.color,
          ...conv.opacity < 1 ? { opacity: conv.opacity } : {}
        };
      });
      if (stops.length >= 2) {
        out.push({
          type: p.type === "GRADIENT_LINEAR" ? "linear-gradient" : "radial-gradient",
          angle: 180,
          stops,
          ...paintOpacity < 1 ? { opacity: round22(paintOpacity) } : {}
        });
      }
    } else if (p.type === "IMAGE") {
      const img = asProps(p.image);
      const hash = bytesToHex(img.hash);
      const asset = hash ? imageAssets[hash] : void 0;
      const scaleModeRaw = String(p.imageScaleMode ?? "FILL").toUpperCase();
      const scaleMode = scaleModeRaw === "FIT" ? "fit" : scaleModeRaw === "STRETCH" ? "stretch" : scaleModeRaw === "TILE" ? "tile" : "fill";
      if (asset || hash) {
        out.push({
          type: "image",
          ...asset ? { asset } : {},
          ...hash ? { imageHash: hash } : {},
          scaleMode,
          ...paintOpacity < 1 ? { opacity: round22(paintOpacity) } : {}
        });
      }
    }
  }
  return out.length ? out : void 0;
}
function convertStrokes(node) {
  const paints = Array.isArray(node.strokePaints) ? node.strokePaints : [];
  const weight = typeof node.strokeWeight === "number" ? node.strokeWeight : 1;
  const alignRaw = String(node.strokeAlign ?? "CENTER").toUpperCase();
  const align = alignRaw === "INSIDE" ? "inside" : alignRaw === "OUTSIDE" ? "outside" : "center";
  const out = [];
  for (const raw of paints) {
    const p = asProps(raw);
    if (p.visible === false || p.type !== "SOLID") continue;
    const c = asProps(p.color);
    const conv = figmaRgbaToHex(
      { r: Number(c.r ?? 0), g: Number(c.g ?? 0), b: Number(c.b ?? 0), a: Number(c.a ?? 1) },
      typeof p.opacity === "number" ? p.opacity : 1
    );
    out.push({
      color: conv.color,
      width: round22(Math.max(0, weight)),
      ...conv.opacity < 1 ? { opacity: conv.opacity } : {},
      align
    });
  }
  return out.length ? out : void 0;
}
function convertEffects(node) {
  const effects = Array.isArray(node.effects) ? node.effects : [];
  const out = [];
  for (const raw of effects) {
    const e = asProps(raw);
    if (e.visible === false) continue;
    const radius = typeof e.radius === "number" ? round22(Math.max(0, e.radius)) : 0;
    if (e.type === "FOREGROUND_BLUR" || e.type === "LAYER_BLUR" || e.type === "BACKGROUND_BLUR") {
      out.push({ type: "blur", blur: radius });
    } else if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") {
      const c = asProps(e.color);
      const offset = asProps(e.offset);
      const conv = figmaRgbaToHex({ r: Number(c.r ?? 0), g: Number(c.g ?? 0), b: Number(c.b ?? 0), a: Number(c.a ?? 0.25) });
      out.push({
        type: e.type === "INNER_SHADOW" ? "inner-shadow" : "drop-shadow",
        color: conv.color,
        opacity: conv.opacity,
        x: round22(Number(offset.x ?? 0)),
        y: round22(Number(offset.y ?? 2)),
        blur: radius,
        ...typeof e.spread === "number" && e.spread !== 0 ? { spread: round22(e.spread) } : {}
      });
    }
  }
  return out.length ? out : void 0;
}
function convertFont(node) {
  const fn = asProps(node.fontName);
  const family = typeof fn.family === "string" && fn.family.trim() ? fn.family.trim() : "Inter";
  const styleStr = typeof fn.style === "string" ? fn.style : "Regular";
  let weight = 400;
  for (const [re, w] of WEIGHT_BY_STYLE) {
    if (re.test(styleStr)) {
      weight = w;
      break;
    }
  }
  const size = typeof node.fontSize === "number" && node.fontSize > 0 ? round22(node.fontSize) : 14;
  let lineHeight = 1.4;
  const lh = asProps(node.lineHeight);
  if (typeof lh.value === "number" && lh.value > 0) {
    if (lh.units === "PIXELS") lineHeight = round22(lh.value / size);
    else if (lh.units === "PERCENT") lineHeight = round22(lh.value / 100);
  }
  const ls = asProps(node.letterSpacing);
  const letterSpacing = typeof ls.value === "number" && ls.value !== 0 ? round22(ls.units === "PERCENT" ? ls.value / 100 * size : ls.value) : void 0;
  return {
    family,
    weight,
    .../italic|oblique/i.test(styleStr) ? { style: "italic" } : {},
    size,
    lineHeight: Math.max(0.5, Math.min(10, lineHeight)),
    ...letterSpacing ? { letterSpacing } : {}
  };
}
function convertLayout(node) {
  const mode = String(node.stackMode ?? "NONE");
  if (mode !== "HORIZONTAL" && mode !== "VERTICAL") return void 0;
  const mapPrimary = (v) => {
    if (v === "CENTER") return "center";
    if (v === "MAX") return "end";
    if (v === "SPACE_EVENLY" || v === "SPACE_BETWEEN") return "space-between";
    return "start";
  };
  const mapCounter = (v) => {
    if (v === "CENTER") return "center";
    if (v === "MAX") return "end";
    if (v === "STRETCH") return "stretch";
    return "start";
  };
  return {
    direction: mode === "HORIZONTAL" ? "horizontal" : "vertical",
    gap: round22(typeof node.stackSpacing === "number" ? Math.max(0, node.stackSpacing) : 0),
    padding: {
      top: round22(Number(node.stackVerticalPadding ?? node.stackPaddingTop ?? 0)),
      right: round22(Number(node.stackPaddingRight ?? node.stackHorizontalPadding ?? 0)),
      bottom: round22(Number(node.stackPaddingBottom ?? node.stackVerticalPadding ?? 0)),
      left: round22(Number(node.stackHorizontalPadding ?? node.stackPaddingLeft ?? 0))
    },
    alignPrimary: mapPrimary(node.stackPrimaryAlignItems),
    alignCounter: mapCounter(node.stackCounterAlignItems),
    ...node.stackWrap === "WRAP" ? { wrap: true } : {}
  };
}
function mapFigmaNodeType(rawType) {
  switch (rawType) {
    case "FRAME":
    case "COMPONENT":
    case "COMPONENT_SET":
    case "SECTION":
    case "SYMBOL":
      return { type: "frame" };
    case "GROUP":
      return { type: "group" };
    case "RECTANGLE":
    case "ROUNDED_RECTANGLE":
      return { type: "rect" };
    case "ELLIPSE":
      return { type: "ellipse" };
    case "LINE":
      return { type: "line" };
    case "TEXT":
      return { type: "text" };
    case "VECTOR":
    case "STAR":
    case "REGULAR_POLYGON":
    case "BOOLEAN_OPERATION":
      return { type: "rect", degraded: String(rawType) };
    case "INSTANCE":
      return { type: "frame", degraded: "INSTANCE" };
    default:
      return { type: "frame", degraded: String(rawType ?? "UNKNOWN") };
  }
}
function extractTransform(node) {
  const t = asProps(node.transform);
  const m00 = typeof t.m00 === "number" ? t.m00 : 1;
  const m10 = typeof t.m10 === "number" ? t.m10 : 0;
  const x2 = typeof t.m02 === "number" ? round22(t.m02) : 0;
  const y = typeof t.m12 === "number" ? round22(t.m12) : 0;
  const rotation = round22(Math.atan2(m10, m00) * 180 / Math.PI);
  return { x: x2, y, rotation: Math.abs(rotation) < 0.01 ? 0 : rotation };
}
function nativeFigToIr(native, options = {}) {
  const imageAssets = options.imageAssets ?? {};
  const byId = /* @__PURE__ */ new Map();
  const childrenByParent = /* @__PURE__ */ new Map();
  const notices = [];
  let degradedCount = 0;
  for (const raw of native.nodes) {
    const id2 = figmaId(raw.guid);
    if (!id2) continue;
    if (raw.phase === "REMOVED") continue;
    byId.set(id2, raw);
    const parentIndex = asProps(raw.parentIndex);
    const parentId = figmaId(parentIndex.guid);
    if (parentId) {
      const list2 = childrenByParent.get(parentId) ?? [];
      list2.push({ position: typeof parentIndex.position === "string" ? parentIndex.position : "", node: raw });
      childrenByParent.set(parentId, list2);
    }
  }
  for (const list2 of childrenByParent.values()) {
    list2.sort((a, b) => a.position < b.position ? -1 : a.position > b.position ? 1 : 0);
  }
  const convertNode = (raw) => {
    const id2 = figmaId(raw.guid) ?? "0:0";
    const mapped = mapFigmaNodeType(raw.type);
    if (mapped.degraded) degradedCount += 1;
    const size = asProps(raw.size);
    const transform = extractTransform(raw);
    const pluginData = Array.isArray(raw.pluginData) ? raw.pluginData : [];
    let dshId;
    for (const entry of pluginData) {
      const pe = asProps(entry);
      if (pe.key === "dshId" && typeof pe.value === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(pe.value)) {
        dshId = pe.value;
      }
    }
    const passthrough = {};
    if (raw.blendMode && raw.blendMode !== "PASS_THROUGH" && raw.blendMode !== "NORMAL") {
      passthrough.blendMode = raw.blendMode;
    }
    if (Array.isArray(raw.prototypeInteractions) && raw.prototypeInteractions.length > 0) {
      passthrough.reactions = raw.prototypeInteractions;
    }
    if (mapped.degraded) passthrough.originalFigmaType = mapped.degraded;
    const cornerRadii = raw.rectangleCornerRadiiIndependent === true ? [
      round22(Number(raw.rectangleTopLeftCornerRadius ?? 0)),
      round22(Number(raw.rectangleTopRightCornerRadius ?? 0)),
      round22(Number(raw.rectangleBottomRightCornerRadius ?? 0)),
      round22(Number(raw.rectangleBottomLeftCornerRadius ?? 0))
    ] : void 0;
    const textData = asProps(raw.textData);
    const kids = (childrenByParent.get(id2) ?? []).map((item) => convertNode(item.node));
    const ir = {
      figmaId: id2,
      ...dshId ? { dshId } : {},
      type: mapped.type,
      name: typeof raw.name === "string" && raw.name.trim() ? raw.name : mapped.type,
      x: transform.x,
      y: transform.y,
      width: round22(Math.max(0, Number(size.x ?? 0))),
      height: round22(Math.max(0, Number(size.y ?? 0))),
      ...transform.rotation ? { rotation: transform.rotation } : {},
      ...typeof raw.opacity === "number" && raw.opacity < 1 ? { opacity: round22(raw.opacity) } : {},
      ...raw.visible === false ? { visible: false } : {},
      ...raw.locked === true ? { locked: true } : {},
      ...mapped.type === "frame" ? { clip: raw.frameMaskDisabled !== true } : {},
      ...typeof raw.cornerRadius === "number" && raw.cornerRadius > 0 ? { cornerRadius: round22(raw.cornerRadius) } : {},
      ...cornerRadii ? { cornerRadii } : {},
      ...convertPaints(raw.fillPaints, imageAssets) ? { fills: convertPaints(raw.fillPaints, imageAssets) } : {},
      ...convertStrokes(raw) ? { strokes: convertStrokes(raw) } : {},
      ...convertEffects(raw) ? { effects: convertEffects(raw) } : {},
      ...convertLayout(raw) ? { layout: convertLayout(raw) } : {},
      ...raw.stackPositioning === "ABSOLUTE" ? { layoutPositioning: "absolute" } : {},
      ...mapped.type === "text" ? {
        text: typeof textData.characters === "string" ? textData.characters : "",
        font: convertFont(raw),
        align: raw.textAlignHorizontal === "CENTER" ? "center" : raw.textAlignHorizontal === "RIGHT" ? "right" : raw.textAlignHorizontal === "JUSTIFIED" ? "justify" : "left",
        verticalAlign: raw.textAlignVertical === "CENTER" ? "center" : raw.textAlignVertical === "BOTTOM" ? "bottom" : "top"
      } : {},
      ...kids.length > 0 && (mapped.type === "frame" || mapped.type === "group") ? { children: kids } : {},
      ...Object.keys(passthrough).length > 0 ? { passthrough } : {}
    };
    return ir;
  };
  const docRoot = [...byId.values()].find((n) => n.type === "DOCUMENT");
  const docId = docRoot ? figmaId(docRoot.guid) : void 0;
  const canvasNodes = (docId ? (childrenByParent.get(docId) ?? []).map((i2) => i2.node) : [...byId.values()]).filter(
    (n) => n.type === "CANVAS" && n.internalOnly !== true
  );
  const pages = [];
  if (canvasNodes.length > 0) {
    for (const canvas of canvasNodes) {
      const cId = figmaId(canvas.guid) ?? "0:1";
      const bg = asProps(canvas.backgroundColor);
      const bgHex = canvas.backgroundColor ? figmaRgbaToHex({ r: Number(bg.r ?? 0.96), g: Number(bg.g ?? 0.96), b: Number(bg.b ?? 0.96), a: 1 }).color : "#f5f5f5";
      const children = (childrenByParent.get(cId) ?? []).map((item) => convertNode(item.node));
      pages.push({
        figmaId: cId,
        name: typeof canvas.name === "string" ? canvas.name : "Page 1",
        background: bgHex,
        children
      });
    }
  } else {
    const topNodes = [...byId.values()].filter((n) => {
      if (n.type === "DOCUMENT" || n.type === "CANVAS") return false;
      const parentId = figmaId(asProps(n.parentIndex).guid);
      return !parentId || !byId.has(parentId) || byId.get(parentId)?.type === "CANVAS" || byId.get(parentId)?.type === "DOCUMENT";
    });
    pages.push({
      name: "Pasted from Figma",
      background: "#f5f5f5",
      children: topNodes.map(convertNode)
    });
  }
  if (degradedCount > 0) {
    notices.push(`${degradedCount} \u4E2A Figma \u539F\u751F\u590D\u6742\u8282\u70B9\u5DF2\u964D\u7EA7\u4E3A\u5BB9\u5668/\u77E9\u5F62\u5360\u4F4D\uFF0C\u539F\u7C7B\u578B\u5DF2\u5B58\u5165 passthrough \u900F\u4F20\u8868\u3002`);
  }
  return {
    format: FIGMA_IR_FORMAT,
    version: FIGMA_IR_VERSION,
    ...options.fileKey ? { fileKey: options.fileKey } : {},
    ...options.fileName || (typeof docRoot?.name === "string" ? docRoot.name : void 0) ? { fileName: options.fileName ?? String(docRoot?.name) } : {},
    readCompleteness: "complete",
    pages,
    ...notices.length ? { notices } : {}
  };
}
async function decodeFigBytesToIr(bytes, canvasDir, options = {}) {
  const native = readNativeFig(bytes);
  const imageHashes = await persistFigmaImages(canvasDir, native.images);
  const ir = nativeFigToIr(native, { ...options, imageAssets: imageHashes });
  return { ir, schemaVersion: native.schemaVersion, imageHashes };
}

// src/host/figma/service.ts
import { existsSync } from "node:fs";
import { mkdir as mkdir6, readFile as readFile4, writeFile as writeFile6 } from "node:fs/promises";
import { dirname as dirname3, join as join6, resolve as resolve4 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";

// src/shared/figma/patch.ts
function indexLocalDoc(doc, sidecar) {
  const ir = dshDocToIr(doc, sidecar);
  const map = /* @__PURE__ */ new Map();
  for (const page of ir.pages) {
    const pageDshId = page.dshId ?? "page-1";
    const pageFigmaId = sidecar.binding.pages[pageDshId];
    const visit = (nodes, parentId, rootFrameId) => {
      nodes.forEach((node, index) => {
        const dshId = node.dshId ?? "";
        if (!dshId) return;
        const ownRoot = rootFrameId ?? (parentId === null ? dshId : void 0);
        map.set(dshId, {
          dshId,
          figmaId: sidecar.binding.nodes[dshId],
          pageDshId,
          pageFigmaId,
          parentId,
          rootFrameId: ownRoot,
          index,
          node,
          snapshot: extractNodeSnapshot(node, parentId)
        });
        if (node.children?.length) visit(node.children, dshId, ownRoot);
      });
    };
    visit(page.children, null, void 0);
  }
  return map;
}
function planPushDiff(doc, sidecar, options = {}) {
  const localMap = indexLocalDoc(doc, sidecar);
  const entries = [];
  const notices = [];
  const missingAssets = /* @__PURE__ */ new Set();
  const knownAssets = new Set(Object.values(sidecar.binding.imageHashes));
  for (const [dshId, item] of localMap) {
    const base = sidecar.base.localNodes[dshId];
    const remoteBase = sidecar.base.remoteProjectedNodes[dshId] ?? base;
    const passthroughPreserved = Object.keys(sidecar.passthrough[dshId] ?? {});
    for (const fill of item.node.fills ?? []) {
      if (fill.type === "image" && fill.asset && !knownAssets.has(fill.asset)) {
        missingAssets.add(fill.asset);
      }
    }
    if (!base || !item.figmaId) {
      entries.push({
        dshId,
        figmaNodeId: item.figmaId,
        nodeName: item.node.name,
        nodeType: item.node.type,
        pageId: item.pageDshId,
        rootFrameId: item.rootFrameId,
        kind: "added",
        fields: [],
        passthroughPreserved,
        selected: true
      });
      continue;
    }
    const fields = diffSnapshots(base, item.snapshot);
    if (fields.length === 0) continue;
    const onlyMoved = fields.every((f) => f.field === "x" || f.field === "y" || f.field === "parentId");
    entries.push({
      dshId,
      figmaNodeId: item.figmaId,
      nodeName: item.node.name,
      nodeType: item.node.type,
      pageId: item.pageDshId,
      rootFrameId: item.rootFrameId,
      kind: onlyMoved ? "moved" : "modified",
      fields,
      passthroughPreserved,
      expectedRemoteHash: remoteBase?.fingerprint,
      selected: true
    });
  }
  for (const [dshId, base] of Object.entries(sidecar.base.localNodes)) {
    if (localMap.has(dshId)) continue;
    const figmaNodeId = sidecar.binding.nodes[dshId];
    if (!figmaNodeId) continue;
    entries.push({
      dshId,
      figmaNodeId,
      nodeName: base.name,
      nodeType: base.type,
      pageId: Object.keys(sidecar.binding.pages)[0] ?? "page-1",
      kind: "deleted",
      fields: [],
      passthroughPreserved: Object.keys(sidecar.passthrough[dshId] ?? {}),
      expectedRemoteHash: sidecar.base.remoteProjectedNodes[dshId]?.fingerprint,
      selected: true
    });
  }
  return buildPlanObject(
    "push",
    "complete",
    options.canvasName ?? sidecar.canvasName,
    options.baseCanvasRevision ?? sidecar.binding.lastCanvasRevision,
    sidecar.binding.fileKey,
    entries,
    [],
    notices,
    missingAssets.size
  );
}
function buildFigmaSyncPatch(doc, sidecar, plan, options = {}) {
  const localMap = indexLocalDoc(doc, sidecar);
  const mode = options.mode ?? "in-place";
  const operations = [];
  const missingAssets = /* @__PURE__ */ new Set();
  const knownAssets = new Set(Object.values(sidecar.binding.imageHashes));
  for (const entry of plan.entries) {
    const selected = options.selectedIds ? options.selectedIds.has(entry.dshId) : entry.selected;
    if (!selected) continue;
    if (entry.kind === "deleted") {
      if (!entry.figmaNodeId) continue;
      operations.push({
        op: "delete",
        dshId: entry.dshId,
        figmaNodeId: entry.figmaNodeId,
        pageDshId: entry.pageId,
        pageFigmaId: sidecar.binding.pages[entry.pageId],
        expectedRemoteHash: entry.expectedRemoteHash
      });
      continue;
    }
    const item = localMap.get(entry.dshId);
    if (!item) continue;
    for (const fill of item.node.fills ?? []) {
      if (fill.type === "image" && fill.asset && !knownAssets.has(fill.asset)) {
        missingAssets.add(fill.asset);
      }
    }
    if (entry.kind === "added") {
      operations.push({
        op: "create",
        dshId: entry.dshId,
        parentDshId: item.parentId ?? void 0,
        parentFigmaNodeId: item.parentId ? sidecar.binding.nodes[item.parentId] : void 0,
        pageDshId: item.pageDshId,
        pageFigmaId: item.pageFigmaId,
        index: item.index,
        node: item.node
      });
    } else {
      const fields = {};
      for (const change of entry.fields) {
        fields[change.field] = change.after;
      }
      operations.push({
        op: entry.kind === "moved" && entry.fields.some((f) => f.field === "parentId") ? "move" : "update",
        dshId: entry.dshId,
        figmaNodeId: item.figmaId,
        parentDshId: item.parentId ?? void 0,
        parentFigmaNodeId: item.parentId ? sidecar.binding.nodes[item.parentId] : void 0,
        pageDshId: item.pageDshId,
        pageFigmaId: item.pageFigmaId,
        index: item.index,
        expectedRemoteHash: entry.expectedRemoteHash,
        fields,
        passthroughPreserved: entry.passthroughPreserved
      });
    }
  }
  return {
    format: "dsh.figma.patch",
    version: 1,
    planId: plan.planId,
    canvasName: plan.canvasName,
    fileKey: plan.fileKey,
    mode,
    baseCanvasRevision: plan.baseCanvasRevision,
    operations,
    missingAssets: [...missingAssets]
  };
}
function commitPushAck(doc, sidecar, ack, canvasRevision) {
  const next = structuredClone(sidecar);
  const localMap = indexLocalDoc(doc, next);
  if (ack.createdPageIds) {
    for (const [dshPageId, figmaPageId] of Object.entries(ack.createdPageIds)) {
      next.binding.pages[dshPageId] = figmaPageId;
    }
  }
  for (const [dshId, figmaId2] of Object.entries(ack.createdNodeIds)) {
    next.binding.nodes[dshId] = figmaId2;
  }
  for (const dshId of ack.appliedDshIds) {
    const localItem = localMap.get(dshId);
    if (!localItem) {
      delete next.binding.nodes[dshId];
      delete next.base.localNodes[dshId];
      delete next.base.remoteProjectedNodes[dshId];
      delete next.passthrough[dshId];
      continue;
    }
    next.base.localNodes[dshId] = localItem.snapshot;
    next.base.remoteProjectedNodes[dshId] = ack.remoteProjectedNodes?.[dshId] ?? localItem.snapshot;
  }
  next.binding.lastSyncedAt = (/* @__PURE__ */ new Date()).toISOString();
  next.binding.lastCanvasRevision = canvasRevision;
  if (ack.remoteVersion) next.binding.lastRemoteVersion = ack.remoteVersion;
  return next;
}

// src/shared/path/svg-import.ts
function attrs(text2) {
  const result = {};
  for (const match of text2.matchAll(/([:\w-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
    result[match[1]] = match[3] ?? match[4] ?? "";
  }
  return result;
}
function viewBoxOfAttrs(values) {
  const parts = (values.viewBox ?? "").trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value)) || parts[2] <= 0 || parts[3] <= 0) return null;
  return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
}
function shapePath(tag, values) {
  const n = (name, fallback = 0) => {
    const value = Number(values[name]);
    return Number.isFinite(value) ? value : fallback;
  };
  if (tag === "rect") {
    const x2 = n("x");
    const y = n("y");
    const w = n("width");
    const h = n("height");
    if (w <= 0 || h <= 0) return null;
    return `M${x2} ${y}h${w}v${h}h${-w}z`;
  }
  if (tag === "circle" || tag === "ellipse") {
    const cx = n("cx");
    const cy = n("cy");
    const rx = tag === "circle" ? n("r") : n("rx");
    const ry = tag === "circle" ? n("r") : n("ry");
    if (rx <= 0 || ry <= 0) return null;
    return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0z`;
  }
  if (tag === "line") {
    return `M${n("x1")} ${n("y1")}L${n("x2")} ${n("y2")}`;
  }
  if (tag === "polyline" || tag === "polygon") {
    const numbers = (values.points ?? "").trim().split(/[\s,]+/).map(Number).filter(Number.isFinite);
    if (numbers.length < 4) return null;
    const pairs = [];
    for (let i2 = 0; i2 + 1 < numbers.length; i2 += 2) pairs.push(`${numbers[i2]} ${numbers[i2 + 1]}`);
    return `M${pairs.join("L")}${tag === "polygon" ? "Z" : ""}`;
  }
  return null;
}
function importSvgPaths(source) {
  const warnings = [];
  const paths = [];
  const root = /<svg\b([^>]*)>/i.exec(source);
  const rootAttrs = root ? attrs(root[1] ?? "") : {};
  const rootViewBox = viewBoxOfAttrs(rootAttrs);
  if (/<text\b|<image\b|<filter\b|<mask\b|<clipPath\b/i.test(source)) {
    warnings.push("\u5DF2\u8DF3\u8FC7 text/image/filter/mask/clipPath");
  }
  if (/<g\b[^>]*\btransform\s*=/i.test(source) || /<path\b[^>]*\btransform\s*=/i.test(source)) {
    warnings.push("\u5DF2\u8DF3\u8FC7 transform\uFF08\u57FA\u7840\u5BFC\u5165\u6682\u4E0D\u5C55\u5F00\u5206\u7EC4\u53D8\u6362\uFF09");
  }
  let index = 0;
  for (const match of source.matchAll(/<(path|rect|circle|ellipse|line|polyline|polygon)\b([^>]*)\/?>/gi)) {
    index += 1;
    const tag = match[1].toLowerCase();
    const values = attrs(match[2] ?? "");
    const d = tag === "path" ? values.d : shapePath(tag, values);
    if (!d) {
      warnings.push(`\u7B2C ${index} \u4E2A ${tag} \u65E0\u6CD5\u8F6C\u6362\u4E3A path\uFF0C\u5DF2\u8DF3\u8FC7`);
      continue;
    }
    let parsed;
    try {
      parsed = parsePathData(d);
    } catch (error) {
      warnings.push(`\u7B2C ${index} \u4E2A path \u65E0\u6CD5\u89E3\u6790\uFF0C\u5DF2\u8DF3\u8FC7\uFF1A${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    const viewBox = viewBoxOfAttrs(values) ?? {
      x: parsed.bounds.minX,
      y: parsed.bounds.minY,
      width: Math.max(1, parsed.bounds.maxX - parsed.bounds.minX),
      height: Math.max(1, parsed.bounds.maxY - parsed.bounds.minY)
    };
    const fill = values.fill && values.fill !== "none" && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(values.fill) ? values.fill : null;
    const stroke = values.stroke && values.stroke !== "none" && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(values.stroke) ? values.stroke : null;
    const strokeWidth = Number(values["stroke-width"]);
    paths.push({
      name: values.id || `Path ${index}`,
      d,
      viewBox,
      width: rootViewBox?.width ?? viewBox.width,
      height: rootViewBox?.height ?? viewBox.height,
      fills: fill ? [{ type: "solid", color: fill }] : [],
      strokes: stroke ? [{ color: stroke, width: Number.isFinite(strokeWidth) && strokeWidth > 0 ? strokeWidth : 1, align: "center" }] : [],
      fillRule: values["fill-rule"] === "evenodd" ? "evenodd" : "nonzero"
    });
  }
  if (!paths.length) warnings.push("\u6CA1\u6709\u627E\u5230\u53EF\u5BFC\u5165\u7684 <path>");
  return { paths, warnings };
}

// src/host/figma/clipboard.ts
var FIGMETA_RE = /<!--\(figmeta\)([A-Za-z0-9+/=\s_-]+)-->/;
var FIGMA_RE = /<!--\(figma\)([A-Za-z0-9+/=\s_-]+)-->/;
function extractFigmaClipboardPayload(html) {
  const figMatch = FIGMA_RE.exec(html);
  if (!figMatch) return null;
  const b64 = figMatch[1].replace(/\s+/g, "");
  const buffer = Buffer.from(b64, "base64");
  if (buffer.byteLength < 12) return null;
  let figmeta;
  const metaMatch = FIGMETA_RE.exec(html);
  if (metaMatch) {
    try {
      const parsed = JSON.parse(Buffer.from(metaMatch[1].replace(/\s+/g, ""), "base64").toString("utf8"));
      if (parsed && typeof parsed === "object") figmeta = parsed;
    } catch {
    }
  }
  return { figmeta, buffer };
}
async function decodeFigmaClipboard(payload, canvasDir) {
  const html = typeof payload.html === "string" ? payload.html : "";
  const extracted = html ? extractFigmaClipboardPayload(html) : null;
  if (extracted) {
    const fileKey = typeof extracted.figmeta?.fileKey === "string" ? extracted.figmeta.fileKey : void 0;
    const decoded = await decodeFigBytesToIr(extracted.buffer, canvasDir, { fileKey });
    const collector = {
      nodeBindings: {},
      passthrough: {},
      imageHashes: { ...decoded.imageHashes },
      usedIds: new Set(payload.existingIds ?? [])
    };
    const nodes = [];
    for (const page of decoded.ir.pages) {
      for (const child of page.children) {
        nodes.push(irNodeToDshNode(child, collector));
      }
    }
    return {
      source: "figma-kiwi",
      ...fileKey ? { fileKey } : {},
      nodes,
      passthrough: collector.passthrough,
      nodeBindings: collector.nodeBindings,
      imageHashes: collector.imageHashes,
      warnings: decoded.ir.notices ?? []
    };
  }
  const svgSource = [payload.svg, payload.text, html].find(
    (s) => typeof s === "string" && /<svg[\s>]/i.test(s)
  );
  if (svgSource) {
    const imported = importSvgPaths(svgSource);
    const usedIds = new Set(payload.existingIds ?? []);
    const nodes = imported.paths.map((p) => {
      let id2 = newId("path");
      while (usedIds.has(id2)) id2 = newId("path");
      usedIds.add(id2);
      return {
        id: id2,
        type: "path",
        name: p.name,
        x: p.viewBox.x,
        y: p.viewBox.y,
        width: p.width,
        height: p.height,
        d: p.d,
        viewBox: p.viewBox,
        fillRule: p.fillRule,
        fills: p.fills,
        strokes: p.strokes
      };
    });
    return {
      source: "svg",
      nodes,
      passthrough: {},
      nodeBindings: {},
      imageHashes: {},
      warnings: imported.warnings ?? []
    };
  }
  throw new Error("Clipboard does not contain Figma Kiwi data or SVG markup");
}

// src/host/figma/credentials.ts
import { execFile } from "node:child_process";
import { chmod, mkdir as mkdir4, readFile as readFile3, unlink as unlink2, writeFile as writeFile4 } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname as dirname2, join as join4 } from "node:path";
import { promisify } from "node:util";
var run = promisify(execFile);
var API_ORIGIN = "https://api.figma.com";
var TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,240}$/;
var KEYCHAIN_SERVICE = "dsh-canvas.figma";
var KEYCHAIN_ACCOUNT = "default";
var LEGACY_KEYCHAIN_SERVICE = "dsh-canvas.figma.personal";
var LEGACY_KEYCHAIN_ACCOUNT = "readonly";
function resolveCredFile(options) {
  const dir = options?.credentialsDir ?? join4(homedir(), ".dsh", "credentials");
  return join4(dir, "dsh-canvas-figma.json");
}
function resolveMetaFile(options) {
  const dir = options?.credentialsDir ?? join4(homedir(), ".dsh", "credentials");
  return join4(dir, "dsh-canvas-figma.meta.json");
}
function isValidFigmaTokenFormat(token) {
  const trimmed = token.trim();
  return TOKEN_PATTERN.test(trimmed);
}
async function execSecurity(args, options) {
  const runner = options?.execFileImpl ? promisify(options.execFileImpl) : run;
  const result = await runner("/usr/bin/security", args, { timeout: 15e3, maxBuffer: 8192 });
  return String(result.stdout ?? "").trim();
}
async function readMeta(options) {
  try {
    const raw = await readFile3(resolveMetaFile(options), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
  }
  return null;
}
async function writeMeta(meta, options) {
  const file = resolveMetaFile(options);
  await mkdir4(dirname2(file), { recursive: true });
  await writeFile4(file, JSON.stringify(meta, null, 2) + "\n", { mode: 384 });
  await chmod(file, 384).catch(() => {
  });
}
async function readFigmaCredential(options) {
  const env = options?.env ?? process.env;
  const platform = options?.platform ?? process.platform;
  const envToken = env.DSH_FIGMA_TOKEN?.trim();
  if (envToken && isValidFigmaTokenFormat(envToken)) {
    const meta = await readMeta(options);
    return {
      source: "env",
      credential: {
        kind: "pat",
        accessToken: envToken,
        scopeMode: meta?.scopeMode ?? "unknown",
        createdAt: meta?.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
        ...meta?.expiresAt ? { expiresAt: meta.expiresAt } : {},
        ...meta?.account ? { account: meta.account } : {}
      }
    };
  }
  if (platform === "darwin" && !options?.credentialsDir) {
    for (const [service, account] of [
      [KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT],
      [LEGACY_KEYCHAIN_SERVICE, LEGACY_KEYCHAIN_ACCOUNT]
    ]) {
      try {
        const secret = await execSecurity(["find-generic-password", "-s", service, "-a", account, "-w"], options);
        if (secret) {
          if (secret.startsWith("{")) {
            const parsed = JSON.parse(secret);
            if (parsed.accessToken && isValidFigmaTokenFormat(parsed.accessToken)) {
              return { source: "keychain", credential: parsed };
            }
          } else if (isValidFigmaTokenFormat(secret)) {
            const meta = await readMeta(options);
            return {
              source: "keychain",
              credential: {
                kind: "pat",
                accessToken: secret,
                scopeMode: meta?.scopeMode ?? (service === LEGACY_KEYCHAIN_SERVICE ? "readonly" : "unknown"),
                createdAt: meta?.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
                ...meta?.expiresAt ? { expiresAt: meta.expiresAt } : {},
                ...meta?.account ? { account: meta.account } : {}
              }
            };
          }
        }
      } catch {
      }
    }
  }
  try {
    const raw = await readFile3(resolveCredFile(options), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.accessToken === "string" && isValidFigmaTokenFormat(parsed.accessToken)) {
      return { source: "file", credential: parsed };
    }
  } catch {
  }
  return null;
}
async function requireFigmaAccessToken(options) {
  const found = await readFigmaCredential(options);
  if (!found) {
    throw new Error("Figma API token is not configured. Run the canvas-figma-setup skill or configure it in Figma Sync settings.");
  }
  return found.credential.accessToken;
}
async function verifyFigmaToken(token, fetchImpl = fetch) {
  const trimmed = token.trim();
  if (!isValidFigmaTokenFormat(trimmed)) {
    return { valid: false, error: "Token format is invalid (expected a Figma Personal Access Token like figd_...)" };
  }
  try {
    const response = await fetchImpl(new URL("/v1/me", API_ORIGIN), {
      method: "GET",
      redirect: "error",
      headers: {
        accept: "application/json",
        "X-Figma-Token": trimmed
      },
      signal: AbortSignal.timeout(15e3)
    });
    if (!response.ok) {
      const text2 = await response.text().catch(() => "");
      if (response.status === 403 && /scope|current_user/i.test(text2)) {
        return {
          valid: true,
          account: { handle: "Figma (restricted scope)" }
        };
      }
      return { valid: false, error: `Figma /v1/me returned HTTP ${response.status}` };
    }
    const data = await response.json();
    return {
      valid: true,
      account: {
        ...typeof data.id === "string" ? { id: data.id } : {},
        ...typeof data.handle === "string" ? { handle: data.handle } : {},
        ...typeof data.email === "string" ? { email: data.email } : {}
      }
    };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : String(error) };
  }
}
async function saveFigmaToken(token, params = {}, options) {
  const trimmed = token.trim();
  if (!isValidFigmaTokenFormat(trimmed)) {
    throw new Error("Invalid Figma token format");
  }
  let account;
  let valid = true;
  if (!params.skipVerify) {
    const check = await verifyFigmaToken(trimmed, options?.fetchImpl);
    if (!check.valid) {
      throw new Error(check.error ?? "Figma token verification failed");
    }
    account = check.account;
  }
  const now = /* @__PURE__ */ new Date();
  const expiresDays = typeof params.expiresInDays === "number" && params.expiresInDays > 0 ? params.expiresInDays : 90;
  const expiresAt = new Date(now.getTime() + expiresDays * 864e5).toISOString();
  const credential = {
    kind: "pat",
    accessToken: trimmed,
    scopeMode: params.scopeMode ?? "readonly",
    createdAt: now.toISOString(),
    expiresAt,
    ...account ? { account } : {}
  };
  const platform = options?.platform ?? process.platform;
  let source = "file";
  if (platform === "darwin" && !options?.credentialsDir) {
    try {
      await execSecurity(
        ["add-generic-password", "-U", "-s", KEYCHAIN_SERVICE, "-a", KEYCHAIN_ACCOUNT, "-w", trimmed],
        options
      );
      await writeMeta(
        {
          kind: credential.kind,
          scopeMode: credential.scopeMode,
          createdAt: credential.createdAt,
          expiresAt: credential.expiresAt,
          ...account ? { account } : {}
        },
        options
      );
      source = "keychain";
    } catch {
      source = "file";
    }
  }
  if (source === "file") {
    const file = resolveCredFile(options);
    await mkdir4(dirname2(file), { recursive: true });
    await writeFile4(file, JSON.stringify(credential, null, 2) + "\n", { mode: 384 });
    await chmod(file, 384).catch(() => {
    });
  }
  return buildRedactedStatus(credential, source, valid);
}
async function clearFigmaToken(options) {
  const platform = options?.platform ?? process.platform;
  let cleared = false;
  if (platform === "darwin" && !options?.credentialsDir) {
    for (const [service, account] of [
      [KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT],
      [LEGACY_KEYCHAIN_SERVICE, LEGACY_KEYCHAIN_ACCOUNT]
    ]) {
      try {
        await execSecurity(["delete-generic-password", "-s", service, "-a", account], options);
        cleared = true;
      } catch {
      }
    }
  }
  for (const file of [resolveCredFile(options), resolveMetaFile(options)]) {
    try {
      await unlink2(file);
      cleared = true;
    } catch {
    }
  }
  return { cleared };
}
async function getFigmaAuthStatus(params = {}, options) {
  const found = await readFigmaCredential(options);
  if (!found) {
    return {
      configured: false,
      valid: false,
      source: "none",
      kind: null,
      scopeMode: "unknown"
    };
  }
  if (!params.probe) {
    return buildRedactedStatus(found.credential, found.source, true);
  }
  const check = await verifyFigmaToken(found.credential.accessToken, options?.fetchImpl);
  const cred = {
    ...found.credential,
    ...check.account ? { account: check.account } : {}
  };
  return buildRedactedStatus(cred, found.source, check.valid, check.error);
}
function buildRedactedStatus(credential, source, valid, error) {
  let daysUntilExpiry = null;
  if (credential.expiresAt) {
    const ms = Date.parse(credential.expiresAt) - Date.now();
    if (Number.isFinite(ms)) daysUntilExpiry = Math.ceil(ms / 864e5);
  }
  return {
    configured: true,
    valid,
    source,
    kind: credential.kind,
    scopeMode: credential.scopeMode,
    ...credential.account ? { account: credential.account } : {},
    createdAt: credential.createdAt,
    ...credential.expiresAt ? { expiresAt: credential.expiresAt } : {},
    daysUntilExpiry,
    expiringSoon: daysUntilExpiry !== null && daysUntilExpiry <= 7,
    ...error ? { error } : {}
  };
}

// src/host/figma/rest-adapter.ts
import { createHash as createHash4 } from "node:crypto";
import { mkdir as mkdir5, writeFile as writeFile5 } from "node:fs/promises";
import { join as join5 } from "node:path";
var API_ORIGIN2 = "https://api.figma.com";
var FILE_KEY_PATTERN = /^[A-Za-z0-9]{8,70}$/;
var MAX_RESPONSE_BYTES = 24 * 1024 * 1024;
var MAX_PAGES = 50;
function parseFigmaUrl(input) {
  const raw = String(input ?? "").trim();
  if (FILE_KEY_PATTERN.test(raw)) {
    return { fileKey: raw, url: `https://www.figma.com/design/${raw}` };
  }
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid Figma URL or file key");
  }
  if (!/(^|\.)figma\.com$/i.test(url.hostname)) {
    throw new Error("URL must point to figma.com");
  }
  const segments = url.pathname.split("/").filter(Boolean);
  const kindIdx = segments.findIndex((s) => s === "file" || s === "design" || s === "proto" || s === "board");
  const fileKey = kindIdx >= 0 ? segments[kindIdx + 1] : void 0;
  if (!fileKey || !FILE_KEY_PATTERN.test(fileKey)) {
    throw new Error("Could not extract a valid Figma file key from URL");
  }
  const fileName = kindIdx >= 0 && segments[kindIdx + 2] ? decodeURIComponent(segments[kindIdx + 2]).replace(/-/g, " ") : void 0;
  const rawNodeId = url.searchParams.get("node-id");
  const nodeId = rawNodeId ? rawNodeId.replace(/-/g, ":") : void 0;
  return {
    fileKey,
    ...nodeId ? { nodeId } : {},
    ...fileName ? { fileName } : {},
    url: url.toString()
  };
}
async function figmaRequest(path, token, options = {}) {
  const request = options.fetchImpl ?? fetch;
  const url = new URL(path, API_ORIGIN2);
  const response = await request(url, {
    method: options.method ?? "GET",
    redirect: "error",
    headers: {
      accept: "application/json",
      "X-Figma-Token": token,
      ...options.body !== void 0 ? { "content-type": "application/json" } : {}
    },
    ...options.body !== void 0 ? { body: JSON.stringify(options.body) } : {},
    signal: AbortSignal.timeout(3e4)
  });
  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    const retry = response.status === 429 && /^\d{1,9}$/.test(retryAfter ?? "") ? `; retry in ${retryAfter}s` : "";
    throw new Error(`Figma ${url.pathname} returned HTTP ${response.status}${retry}`);
  }
  const buf = Buffer.from(await response.arrayBuffer());
  if (buf.byteLength > MAX_RESPONSE_BYTES) {
    throw new Error("Figma REST response exceeds 24 MiB");
  }
  const parsed = JSON.parse(buf.toString("utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Figma REST returned an unexpected payload");
  }
  return parsed;
}
function convertRestFills(paints, imageAssets) {
  if (!Array.isArray(paints)) return void 0;
  const out = [];
  for (const raw of paints) {
    if (!raw || typeof raw !== "object") continue;
    const p = raw;
    if (p.visible === false) continue;
    const opacity = typeof p.opacity === "number" ? p.opacity : 1;
    if (p.type === "SOLID" && p.color && typeof p.color === "object") {
      const c = p.color;
      const conv = figmaRgbaToHex(c, opacity);
      out.push(conv.opacity < 1 ? { type: "solid", color: conv.color, opacity: conv.opacity } : { type: "solid", color: conv.color });
    } else if ((p.type === "GRADIENT_LINEAR" || p.type === "GRADIENT_RADIAL") && Array.isArray(p.gradientStops)) {
      const stops = p.gradientStops.filter((s) => Boolean(s && typeof s === "object")).map((s) => {
        const conv = figmaRgbaToHex(s.color, 1);
        return {
          position: round22(Number(s.position ?? 0)),
          color: conv.color,
          ...conv.opacity < 1 ? { opacity: conv.opacity } : {}
        };
      });
      if (stops.length >= 2) {
        out.push({
          type: p.type === "GRADIENT_LINEAR" ? "linear-gradient" : "radial-gradient",
          angle: 180,
          stops,
          ...opacity < 1 ? { opacity: round22(opacity) } : {}
        });
      }
    } else if (p.type === "IMAGE" && typeof p.imageRef === "string") {
      const hash = p.imageRef;
      const asset = imageAssets[hash];
      const scaleRaw = String(p.scaleMode ?? "FILL").toUpperCase();
      const scaleMode = scaleRaw === "FIT" ? "fit" : scaleRaw === "STRETCH" ? "stretch" : scaleRaw === "TILE" ? "tile" : "fill";
      if (asset || hash) {
        out.push({
          type: "image",
          ...asset ? { asset } : {},
          imageHash: hash,
          scaleMode,
          ...opacity < 1 ? { opacity: round22(opacity) } : {}
        });
      }
    }
  }
  return out.length ? out : void 0;
}
function convertRestStrokes(node) {
  if (!Array.isArray(node.strokes)) return void 0;
  const weight = typeof node.strokeWeight === "number" ? node.strokeWeight : 1;
  const alignRaw = String(node.strokeAlign ?? "CENTER").toUpperCase();
  const align = alignRaw === "INSIDE" ? "inside" : alignRaw === "OUTSIDE" ? "outside" : "center";
  const out = [];
  for (const raw of node.strokes) {
    if (!raw || typeof raw !== "object") continue;
    const p = raw;
    if (p.visible === false || p.type !== "SOLID") continue;
    const conv = figmaRgbaToHex(p.color, typeof p.opacity === "number" ? p.opacity : 1);
    out.push({
      color: conv.color,
      width: round22(Math.max(0, weight)),
      ...conv.opacity < 1 ? { opacity: conv.opacity } : {},
      align
    });
  }
  return out.length ? out : void 0;
}
function convertRestEffects(node) {
  if (!Array.isArray(node.effects)) return void 0;
  const out = [];
  for (const raw of node.effects) {
    if (!raw || typeof raw !== "object") continue;
    const e = raw;
    if (e.visible === false) continue;
    const radius = typeof e.radius === "number" ? round22(Math.max(0, e.radius)) : 0;
    if (e.type === "LAYER_BLUR" || e.type === "BACKGROUND_BLUR") {
      out.push({ type: "blur", blur: radius });
    } else if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") {
      const conv = figmaRgbaToHex(e.color);
      const offset = e.offset && typeof e.offset === "object" ? e.offset : {};
      out.push({
        type: e.type === "INNER_SHADOW" ? "inner-shadow" : "drop-shadow",
        color: conv.color,
        opacity: conv.opacity,
        x: round22(offset.x ?? 0),
        y: round22(offset.y ?? 2),
        blur: radius,
        ...typeof e.spread === "number" && e.spread !== 0 ? { spread: round22(e.spread) } : {}
      });
    }
  }
  return out.length ? out : void 0;
}
function convertRestLayout(node) {
  const mode = node.layoutMode;
  if (mode !== "HORIZONTAL" && mode !== "VERTICAL") return void 0;
  const mapPrimary = (v) => v === "CENTER" ? "center" : v === "MAX" ? "end" : v === "SPACE_BETWEEN" ? "space-between" : "start";
  const mapCounter = (v) => v === "CENTER" ? "center" : v === "MAX" ? "end" : v === "STRETCH" ? "stretch" : "start";
  return {
    direction: mode === "HORIZONTAL" ? "horizontal" : "vertical",
    gap: round22(typeof node.itemSpacing === "number" ? Math.max(0, node.itemSpacing) : 0),
    padding: {
      top: round22(Number(node.paddingTop ?? 0)),
      right: round22(Number(node.paddingRight ?? 0)),
      bottom: round22(Number(node.paddingBottom ?? 0)),
      left: round22(Number(node.paddingLeft ?? 0))
    },
    alignPrimary: mapPrimary(node.primaryAxisAlignItems),
    alignCounter: mapCounter(node.counterAxisAlignItems),
    ...node.layoutWrap === "WRAP" ? { wrap: true } : {}
  };
}
function convertRestFont(node) {
  const style = node.style && typeof node.style === "object" ? node.style : {};
  const size = typeof style.fontSize === "number" && style.fontSize > 0 ? round22(style.fontSize) : 14;
  let lineHeight = 1.4;
  if (typeof style.lineHeightPx === "number" && style.lineHeightPx > 0) {
    lineHeight = round22(style.lineHeightPx / size);
  } else if (typeof style.lineHeightPercentFontSize === "number" && style.lineHeightPercentFontSize > 0) {
    lineHeight = round22(style.lineHeightPercentFontSize / 100);
  }
  return {
    family: typeof style.fontFamily === "string" && style.fontFamily.trim() ? style.fontFamily.trim() : "Inter",
    weight: typeof style.fontWeight === "number" ? Math.round(style.fontWeight) : 400,
    ...style.italic === true ? { style: "italic" } : {},
    size,
    lineHeight: Math.max(0.5, Math.min(10, lineHeight)),
    ...typeof style.letterSpacing === "number" && style.letterSpacing !== 0 ? { letterSpacing: round22(style.letterSpacing) } : {}
  };
}
function convertRestNode(raw, parentBox, imageAssets) {
  const figmaType = String(raw.type ?? "FRAME");
  const mappedType = figmaType === "GROUP" ? "group" : figmaType === "RECTANGLE" ? "rect" : figmaType === "ELLIPSE" ? "ellipse" : figmaType === "LINE" ? "line" : figmaType === "TEXT" ? "text" : figmaType === "VECTOR" && Array.isArray(raw.fillGeometry) && typeof raw.fillGeometry[0]?.path === "string" ? "path" : "frame";
  const box = raw.absoluteBoundingBox && typeof raw.absoluteBoundingBox === "object" ? raw.absoluteBoundingBox : { x: 0, y: 0, width: 100, height: 100 };
  const x2 = round22(parentBox ? box.x - parentBox.x : box.x);
  const y = round22(parentBox ? box.y - parentBox.y : box.y);
  const width = round22(Math.max(0, box.width ?? 0));
  const height = round22(Math.max(0, box.height ?? 0));
  const passthrough = {};
  if (raw.blendMode && raw.blendMode !== "PASS_THROUGH" && raw.blendMode !== "NORMAL") passthrough.blendMode = raw.blendMode;
  if (raw.constraints) passthrough.constraints = raw.constraints;
  if (Array.isArray(raw.interactions) && raw.interactions.length > 0) passthrough.reactions = raw.interactions;
  if (figmaType === "INSTANCE" && typeof raw.componentId === "string") passthrough.figmaComponentId = raw.componentId;
  const cornerRadii = Array.isArray(raw.rectangleCornerRadii) && raw.rectangleCornerRadii.length === 4 ? raw.rectangleCornerRadii.map((n) => round22(Math.max(0, Number(n) || 0))) : void 0;
  const children = Array.isArray(raw.children) && (mappedType === "frame" || mappedType === "group") ? raw.children.map((child) => convertRestNode(child, box, imageAssets)) : void 0;
  const style = raw.style && typeof raw.style === "object" ? raw.style : {};
  const vectorPath = mappedType === "path" && Array.isArray(raw.fillGeometry) ? String(raw.fillGeometry[0]?.path ?? "") : void 0;
  return {
    figmaId: typeof raw.id === "string" ? raw.id : void 0,
    type: mappedType,
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name : mappedType,
    x: x2,
    y,
    width,
    height,
    ...typeof raw.rotation === "number" && raw.rotation !== 0 ? { rotation: round22(raw.rotation) } : {},
    ...typeof raw.opacity === "number" && raw.opacity < 1 ? { opacity: round22(raw.opacity) } : {},
    ...raw.visible === false ? { visible: false } : {},
    ...raw.locked === true ? { locked: true } : {},
    ...mappedType === "frame" ? { clip: raw.clipsContent !== false } : {},
    ...typeof raw.cornerRadius === "number" && raw.cornerRadius > 0 ? { cornerRadius: round22(raw.cornerRadius) } : {},
    ...cornerRadii ? { cornerRadii } : {},
    ...convertRestFills(raw.fills, imageAssets) ? { fills: convertRestFills(raw.fills, imageAssets) } : {},
    ...convertRestStrokes(raw) ? { strokes: convertRestStrokes(raw) } : {},
    ...convertRestEffects(raw) ? { effects: convertRestEffects(raw) } : {},
    ...convertRestLayout(raw) ? { layout: convertRestLayout(raw) } : {},
    ...raw.layoutPositioning === "ABSOLUTE" ? { layoutPositioning: "absolute" } : {},
    ...mappedType === "text" ? {
      text: typeof raw.characters === "string" ? raw.characters : "",
      font: convertRestFont(raw),
      align: style.textAlignHorizontal === "CENTER" ? "center" : style.textAlignHorizontal === "RIGHT" ? "right" : style.textAlignHorizontal === "JUSTIFIED" ? "justify" : "left",
      verticalAlign: style.textAlignVertical === "CENTER" ? "center" : style.textAlignVertical === "BOTTOM" ? "bottom" : "top"
    } : {},
    ...mappedType === "path" && vectorPath ? {
      d: vectorPath,
      viewBox: { x: 0, y: 0, width: Math.max(1, width), height: Math.max(1, height) },
      fillRule: "nonzero"
    } : {},
    ...children && children.length > 0 ? { children } : {},
    ...Object.keys(passthrough).length > 0 ? { passthrough } : {}
  };
}
async function downloadRestImageFills(fileKey, token, canvasDir, fetchImpl = fetch) {
  const imageAssets = {};
  try {
    const res = await figmaRequest(`/v1/files/${fileKey}/images`, token, { fetchImpl });
    const meta = res.meta && typeof res.meta === "object" ? res.meta : {};
    const images = meta.images && typeof meta.images === "object" ? meta.images : {};
    const entries = Object.entries(images).filter(([, url]) => typeof url === "string" && url.startsWith("https://"));
    if (entries.length === 0) return imageAssets;
    await mkdir5(join5(canvasDir, "assets"), { recursive: true });
    for (const [imageRef, imageUrl] of entries.slice(0, 64)) {
      try {
        const imgRes = await fetchImpl(imageUrl, { signal: AbortSignal.timeout(2e4) });
        if (!imgRes.ok) continue;
        const bytes = Buffer.from(await imgRes.arrayBuffer());
        if (!bytes.byteLength || bytes.byteLength > 20 * 1024 * 1024) continue;
        const ct = imgRes.headers.get("content-type") ?? "";
        const ext = ct.includes("jpeg") || ct.includes("jpg") ? ".jpg" : ct.includes("webp") ? ".webp" : ct.includes("gif") ? ".gif" : ".png";
        const hash = createHash4("sha256").update(bytes).digest("hex").slice(0, 24);
        const rel = `assets/${hash}${ext}`;
        await writeFile5(join5(canvasDir, rel), bytes);
        imageAssets[imageRef] = rel;
      } catch {
      }
    }
  } catch {
  }
  return imageAssets;
}
async function fetchFigmaAsIr(fileKey, token, canvasDir, options = {}) {
  if (!FILE_KEY_PATTERN.test(fileKey)) throw new Error("Invalid Figma fileKey");
  const fetchImpl = options.fetchImpl ?? fetch;
  const imageHashes = await downloadRestImageFills(fileKey, token, canvasDir, fetchImpl);
  if (options.nodeId) {
    const query2 = new URLSearchParams({ ids: options.nodeId, geometry: "paths" });
    const data2 = await figmaRequest(`/v1/files/${fileKey}/nodes?${query2}`, token, { fetchImpl });
    const nodesMap = data2.nodes && typeof data2.nodes === "object" ? data2.nodes : {};
    const entry = nodesMap[options.nodeId] ?? Object.values(nodesMap)[0];
    const docNode = entry?.document;
    if (!docNode) throw new Error(`Figma node "${options.nodeId}" not found in file ${fileKey}`);
    const pages2 = docNode.type === "CANVAS" ? [
      {
        figmaId: String(docNode.id ?? options.nodeId),
        name: String(docNode.name ?? "Page 1"),
        children: Array.isArray(docNode.children) ? docNode.children.map((c) => convertRestNode(c, null, imageHashes)) : []
      }
    ] : [
      {
        name: String(data2.name ?? "Figma Selection"),
        children: [convertRestNode(docNode, null, imageHashes)]
      }
    ];
    return {
      imageHashes,
      ir: {
        format: FIGMA_IR_FORMAT,
        version: FIGMA_IR_VERSION,
        fileKey,
        fileName: typeof data2.name === "string" ? data2.name : void 0,
        remoteVersion: typeof data2.version === "string" ? data2.version : void 0,
        readCompleteness: "partial",
        pages: pages2
      }
    };
  }
  const query = new URLSearchParams({ geometry: "paths" });
  if (typeof options.depth === "number") query.set("depth", String(options.depth));
  const data = await figmaRequest(`/v1/files/${fileKey}?${query}`, token, { fetchImpl });
  const document = data.document && typeof data.document === "object" ? data.document : {};
  const rawPages = Array.isArray(document.children) ? document.children : [];
  const pages = rawPages.map((p, idx) => {
    const bg = p.backgroundColor && typeof p.backgroundColor === "object" ? figmaRgbaToHex(p.backgroundColor, 1).color : "#f5f5f5";
    return {
      figmaId: typeof p.id === "string" ? p.id : `0:${idx + 1}`,
      name: typeof p.name === "string" ? p.name : `Page ${idx + 1}`,
      background: bg,
      children: Array.isArray(p.children) ? p.children.map((c) => convertRestNode(c, null, imageHashes)) : []
    };
  });
  return {
    imageHashes,
    ir: {
      format: FIGMA_IR_FORMAT,
      version: FIGMA_IR_VERSION,
      fileKey,
      fileName: typeof data.name === "string" ? data.name : void 0,
      remoteVersion: typeof data.version === "string" ? data.version : void 0,
      readCompleteness: options.depth !== void 0 ? "partial" : "complete",
      pages
    }
  };
}
async function fetchFigmaComments(fileKey, token, nodeBindings, fetchImpl = fetch) {
  if (!FILE_KEY_PATTERN.test(fileKey)) throw new Error("Invalid Figma fileKey");
  const data = await figmaRequest(`/v1/files/${fileKey}/comments`, token, { fetchImpl });
  const rawList = Array.isArray(data.comments) ? data.comments : [];
  const figmaToDsh = /* @__PURE__ */ new Map();
  for (const [dshId, figmaId2] of Object.entries(nodeBindings)) figmaToDsh.set(figmaId2, dshId);
  const byId = new Map(rawList.map((c) => [String(c.id ?? ""), c]));
  return rawList.map((c) => {
    const parentId = typeof c.parent_id === "string" && c.parent_id ? c.parent_id : void 0;
    const root = parentId ? byId.get(parentId) ?? c : c;
    const meta = root.client_meta && typeof root.client_meta === "object" ? root.client_meta : {};
    const figmaNodeId = typeof meta.node_id === "string" ? meta.node_id : void 0;
    const offset = meta.node_offset && typeof meta.node_offset === "object" ? meta.node_offset : meta;
    const canvasNodeId = figmaNodeId ? figmaToDsh.get(figmaNodeId) : void 0;
    const user = c.user && typeof c.user === "object" ? c.user : {};
    return {
      id: String(c.id ?? ""),
      ...parentId ? { parentId } : {},
      message: String(c.message ?? ""),
      author: typeof user.handle === "string" ? user.handle : "Figma",
      createdAt: typeof c.created_at === "string" ? c.created_at : (/* @__PURE__ */ new Date()).toISOString(),
      resolvedAt: typeof c.resolved_at === "string" ? c.resolved_at : null,
      ...figmaNodeId ? { figmaNodeId } : {},
      ...canvasNodeId ? { canvasNodeId } : {},
      ...typeof offset.x === "number" ? { x: round22(offset.x) } : {},
      ...typeof offset.y === "number" ? { y: round22(offset.y) } : {},
      anchorState: canvasNodeId ? "attached" : "unanchored-needs-relocate"
    };
  });
}
async function postFigmaComment(fileKey, token, params, fetchImpl = fetch) {
  if (!FILE_KEY_PATTERN.test(fileKey)) throw new Error("Invalid Figma fileKey");
  const message = String(params.message ?? "").trim();
  if (!message) throw new Error("Comment message is required");
  const body = { message };
  if (params.parentId) {
    body.comment_id = params.parentId;
  } else if (params.figmaNodeId) {
    body.client_meta = {
      node_id: params.figmaNodeId,
      node_offset: { x: params.x ?? 0, y: params.y ?? 0 }
    };
  } else if (typeof params.x === "number" && typeof params.y === "number") {
    body.client_meta = { x: params.x, y: params.y };
  }
  const created = await figmaRequest(`/v1/files/${fileKey}/comments`, token, {
    method: "POST",
    body,
    fetchImpl
  });
  return {
    id: String(created.id ?? ""),
    message: String(created.message ?? message),
    createdAt: typeof created.created_at === "string" ? created.created_at : (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function fetchFigmaVersions(fileKey, token, fetchImpl = fetch) {
  if (!FILE_KEY_PATTERN.test(fileKey)) throw new Error("Invalid Figma fileKey");
  const versions = /* @__PURE__ */ new Map();
  let nextPath = `/v1/files/${fileKey}/versions`;
  let pages = 0;
  while (nextPath && pages < MAX_PAGES) {
    pages += 1;
    const res = await figmaRequest(nextPath, token, { fetchImpl });
    const list2 = Array.isArray(res.versions) ? res.versions : [];
    for (const v of list2) {
      if (typeof v.id === "string") versions.set(v.id, v);
    }
    const pagination = res.pagination && typeof res.pagination === "object" ? res.pagination : {};
    const nextUrl = typeof pagination.next_page === "string" && pagination.next_page ? pagination.next_page : null;
    if (!nextUrl) break;
    const parsed = new URL(nextUrl, API_ORIGIN2);
    if (parsed.origin !== API_ORIGIN2) break;
    nextPath = `${parsed.pathname}${parsed.search}`;
  }
  return [...versions.values()];
}
function mergeFigmaCommentsIntoDoc(doc, sidecar, remoteItems) {
  const nextDoc = structuredClone(doc);
  const nextSidecar = structuredClone(sidecar);
  const existingByRemoteId = /* @__PURE__ */ new Map();
  for (const prev of nextSidecar.remoteComments?.items ?? []) existingByRemoteId.set(prev.id, prev);
  const docComments = Array.isArray(nextDoc.comments) ? nextDoc.comments : nextDoc.comments = [];
  const firstPageId = Array.isArray(nextDoc.pages) && nextDoc.pages[0] && typeof nextDoc.pages[0].id === "string" ? String(nextDoc.pages[0].id) : "page-1";
  let imported = 0;
  let updated = 0;
  const roots = remoteItems.filter((c) => !c.parentId);
  const repliesByParent = /* @__PURE__ */ new Map();
  for (const c of remoteItems) {
    if (!c.parentId) continue;
    const list2 = repliesByParent.get(c.parentId) ?? [];
    list2.push(c);
    repliesByParent.set(c.parentId, list2);
  }
  const storedItems = [];
  for (const root of roots) {
    const prev = existingByRemoteId.get(root.id);
    const localId = prev?.localCommentId ?? newId("c");
    const existingLocal = docComments.find((c) => c.id === localId);
    const threadReplies = (repliesByParent.get(root.id) ?? []).map((r) => ({
      id: existingByRemoteId.get(r.id)?.localCommentId ?? newId("r"),
      author: "user",
      figmaAuthor: r.author,
      body: r.message,
      createdAt: r.createdAt,
      figmaCommentId: r.id
    }));
    if (!existingLocal) {
      docComments.push({
        id: localId,
        pageId: firstPageId,
        ...root.canvasNodeId ? { nodeId: root.canvasNodeId } : {},
        x: 0.5,
        y: 0.15,
        author: "user",
        figmaAuthor: root.author,
        body: root.message,
        resolved: Boolean(root.resolvedAt),
        createdAt: root.createdAt,
        source: "figma",
        figmaCommentId: root.id,
        ...root.x !== void 0 || root.y !== void 0 ? { figmaOffset: { x: root.x ?? 0, y: root.y ?? 0 } } : {},
        anchorState: root.anchorState,
        replies: threadReplies
      });
      imported += 1;
    } else {
      existingLocal.resolved = Boolean(root.resolvedAt);
      existingLocal.anchorState = root.anchorState;
      const existingReplyIds = new Set(
        Array.isArray(existingLocal.replies) ? existingLocal.replies.map((r) => String(r.figmaCommentId ?? "")) : []
      );
      const replies = Array.isArray(existingLocal.replies) ? existingLocal.replies : existingLocal.replies = [];
      for (const r of threadReplies) {
        if (!existingReplyIds.has(r.figmaCommentId)) {
          replies.push(r);
          updated += 1;
        }
      }
    }
    storedItems.push({ ...root, localCommentId: localId });
    for (const r of repliesByParent.get(root.id) ?? []) {
      storedItems.push({ ...r, localCommentId: existingByRemoteId.get(r.id)?.localCommentId });
    }
  }
  nextSidecar.remoteComments = {
    syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
    items: storedItems
  };
  return { doc: nextDoc, sidecar: nextSidecar, imported, updated };
}

// src/host/figma/service.ts
var PACKAGE_ROOT = resolve4(dirname3(fileURLToPath2(import.meta.url)), "..", "..", "..");
function resolvePackagePath(...segments) {
  const fromSrc = join6(PACKAGE_ROOT, ...segments);
  if (existsSync(fromSrc)) return fromSrc;
  const fromDist = resolve4(dirname3(fileURLToPath2(import.meta.url)), "..", "..", ...segments);
  return fromDist;
}
async function getFigmaSetupStatus(params) {
  const auth = await getFigmaAuthStatus({ probe: params.probe !== false }, params.credOptions);
  const sidecar = await readSidecar(params.canvasDir, params.canvasName).catch(() => null);
  const pairing = params.bridge.getForCanvas(params.sessionId, params.canvasName);
  const manifestPath = resolvePackagePath("figma-plugin", "manifest.json");
  const setupScriptPath = resolvePackagePath("scripts", "figma-setup.mjs");
  const figmaDesktopInstalled = process.platform === "darwin" ? existsSync("/Applications/Figma.app") || existsSync(join6(process.env.HOME ?? "", "Applications", "Figma.app")) : false;
  return {
    ok: true,
    auth,
    channels: {
      clipboard: { ready: true, requiresToken: false },
      figFile: { ready: true, requiresToken: false },
      companionPlugin: {
        ready: Boolean(pairing?.connectedAt),
        paired: Boolean(pairing),
        pairingCode: pairing?.pairingCode ?? null,
        expiresAt: pairing ? new Date(pairing.expiresAt).toISOString() : null,
        requiresToken: false,
        figmaDesktopInstalled,
        manifestPath
      },
      restApi: {
        ready: auth.configured && auth.valid,
        requiresToken: true,
        scopeMode: auth.scopeMode
      }
    },
    binding: sidecar ? {
      bindingId: sidecar.binding.bindingId,
      fileKey: sidecar.binding.fileKey,
      fileName: sidecar.binding.fileName,
      fileUrl: sidecar.binding.fileUrl,
      transport: sidecar.binding.transport,
      lastSyncedAt: sidecar.binding.lastSyncedAt,
      boundNodes: Object.keys(sidecar.binding.nodes).length,
      remoteComments: sidecar.remoteComments?.items.length ?? 0
    } : null,
    setupScriptPath,
    settingsUrl: "https://www.figma.com/settings"
  };
}
function buildCanvasFromIr(params) {
  const usedIds = /* @__PURE__ */ new Set();
  const pageBindings = {};
  const nodeBindings = {};
  const passthrough = {};
  const imageHashes = { ...params.imageHashes };
  const pages = params.ir.pages.map((irPage, index) => {
    const pageId = irPage.dshId && /^[A-Za-z0-9_-]{1,64}$/.test(irPage.dshId) ? irPage.dshId : `page-${index + 1}`;
    if (irPage.figmaId) pageBindings[pageId] = irPage.figmaId;
    const children = irPage.children.map(
      (child) => irNodeToDshNode(child, { nodeBindings, passthrough, imageHashes, usedIds })
    );
    return {
      id: pageId,
      name: irPage.name || `Page ${index + 1}`,
      background: irPage.background ?? "#f5f5f5",
      children
    };
  });
  const rawDoc = {
    ...emptyDoc(params.fileName ?? params.ir.fileName ?? params.canvasName),
    pages: pages.length ? pages : [{ id: "page-1", name: "Page 1", background: "#f5f5f5", children: [] }],
    meta: {
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      layoutIgnoreHidden: true
    }
  };
  const doc = normalizeDoc(rawDoc, { touch: false });
  const localIr = dshDocToIr(doc);
  const sidecar = createInitialSidecar({
    canvasName: params.canvasName,
    canvasDocId: String(doc.id ?? newId("doc")),
    canvasRevision: "initial",
    fileKey: params.fileKey,
    fileName: params.fileName ?? params.ir.fileName,
    fileUrl: params.fileUrl,
    transport: params.transport,
    remoteIr: params.ir,
    pageBindings,
    nodeBindings,
    passthrough,
    imageHashes,
    localIr
  });
  return { doc, sidecar };
}
async function importFigmaFromUrl(params) {
  const parsed = parseFigmaUrl(params.url);
  const token = await requireFigmaAccessToken(params.credOptions);
  const { ir, imageHashes } = await fetchFigmaAsIr(parsed.fileKey, token, params.canvasDir, {
    nodeId: parsed.nodeId,
    fetchImpl: params.credOptions?.fetchImpl
  });
  const existingSidecar = await readSidecar(params.canvasDir, params.canvasName).catch(() => null);
  if (params.mode === "pull" && params.currentDoc && existingSidecar) {
    const plan = planPullDiff(params.currentDoc, existingSidecar, ir, {
      canvasName: params.canvasName,
      baseCanvasRevision: params.currentRevision ?? existingSidecar.binding.lastCanvasRevision
    });
    if (params.dryRun !== false) {
      return { ok: true, mode: "pull", dryRun: true, written: false, plan, fileKey: parsed.fileKey };
    }
    const applied = applyPullPlan(params.currentDoc, existingSidecar, ir, plan, {
      ...params.selectedIds ? { selectedIds: new Set(params.selectedIds) } : {},
      ...params.resolutions ? { resolutions: params.resolutions } : {}
    });
    applied.sidecar.binding.imageHashes = { ...applied.sidecar.binding.imageHashes, ...imageHashes };
    return {
      ok: true,
      mode: "pull",
      dryRun: false,
      written: true,
      plan,
      doc: normalizeDoc(applied.doc, { touch: true }),
      sidecar: applied.sidecar,
      appliedCount: applied.appliedCount,
      skippedCount: applied.skippedCount,
      fileKey: parsed.fileKey
    };
  }
  const built = buildCanvasFromIr({
    ir,
    imageHashes,
    canvasName: params.canvasName,
    fileKey: parsed.fileKey,
    fileName: ir.fileName ?? parsed.fileName,
    fileUrl: parsed.url,
    transport: "rest"
  });
  if (params.dryRun) {
    return {
      ok: true,
      mode: "import",
      dryRun: true,
      written: false,
      fileKey: parsed.fileKey,
      fileName: built.doc.title,
      pages: built.doc.pages.length,
      nodes: Object.keys(built.sidecar.binding.nodes).length,
      images: Object.keys(imageHashes).length,
      notices: ir.notices ?? []
    };
  }
  return {
    ok: true,
    mode: "import",
    dryRun: false,
    written: true,
    fileKey: parsed.fileKey,
    fileName: built.doc.title,
    doc: built.doc,
    sidecar: built.sidecar,
    nodes: Object.keys(built.sidecar.binding.nodes).length,
    images: Object.keys(imageHashes).length,
    notices: ir.notices ?? []
  };
}
async function importFigmaFromFigBytes(params) {
  const { ir, schemaVersion, imageHashes } = await decodeFigBytesToIr(params.bytes, params.canvasDir, {
    fileKey: params.fileKey,
    fileName: params.fileName
  });
  const existingSidecar = await readSidecar(params.canvasDir, params.canvasName).catch(() => null);
  const fileKey = params.fileKey || existingSidecar?.binding.fileKey || `local_${newId("fig")}`;
  if (params.mode === "pull" && params.currentDoc && existingSidecar) {
    const plan = planPullDiff(params.currentDoc, existingSidecar, ir, {
      canvasName: params.canvasName,
      baseCanvasRevision: params.currentRevision ?? existingSidecar.binding.lastCanvasRevision
    });
    if (params.dryRun !== false) {
      return { ok: true, mode: "pull", dryRun: true, written: false, schemaVersion, plan };
    }
    const applied = applyPullPlan(params.currentDoc, existingSidecar, ir, plan, {
      ...params.selectedIds ? { selectedIds: new Set(params.selectedIds) } : {},
      ...params.resolutions ? { resolutions: params.resolutions } : {}
    });
    applied.sidecar.binding.imageHashes = { ...applied.sidecar.binding.imageHashes, ...imageHashes };
    return {
      ok: true,
      mode: "pull",
      dryRun: false,
      written: true,
      schemaVersion,
      plan,
      doc: normalizeDoc(applied.doc, { touch: true }),
      sidecar: applied.sidecar,
      appliedCount: applied.appliedCount,
      skippedCount: applied.skippedCount
    };
  }
  const built = buildCanvasFromIr({
    ir,
    imageHashes,
    canvasName: params.canvasName,
    fileKey,
    fileName: params.fileName ?? ir.fileName,
    transport: "fig-file"
  });
  return {
    ok: true,
    mode: "import",
    dryRun: Boolean(params.dryRun),
    written: !params.dryRun,
    schemaVersion,
    doc: built.doc,
    sidecar: built.sidecar,
    nodes: Object.keys(built.sidecar.binding.nodes).length,
    images: Object.keys(imageHashes).length,
    notices: ir.notices ?? []
  };
}
async function planOrQueueFigmaPush(params) {
  const sidecar = await readSidecar(params.canvasDir, params.canvasName);
  if (!sidecar) {
    throw new Error(`Canvas "${params.canvasName}" is not bound to a Figma file yet. Import or pair via Companion Plugin first.`);
  }
  const plan = planPushDiff(params.doc, sidecar, {
    canvasName: params.canvasName,
    baseCanvasRevision: params.baseCanvasRevision
  });
  if (params.dryRun !== false) {
    return { ok: true, plan };
  }
  const patch = buildFigmaSyncPatch(params.doc, sidecar, plan, {
    mode: params.mode ?? "in-place",
    ...params.selectedIds ? { selectedIds: new Set(params.selectedIds) } : {}
  });
  let queuedForPlugin = false;
  if (params.bridge && params.sessionId) {
    queuedForPlugin = params.bridge.queuePatch(params.sessionId, params.canvasName, patch);
  }
  return { ok: true, plan, patch, queuedForPlugin };
}
async function applyPluginPushAck(params) {
  const sidecar = await readSidecar(params.canvasDir, params.canvasName);
  if (!sidecar) throw new Error(`Missing Figma sidecar for "${params.canvasName}"`);
  const updated = commitPushAck(params.doc, sidecar, params.ack, params.canvasRevision);
  await writeSidecar(params.canvasDir, params.canvasName, updated);
  return updated;
}
async function syncFigmaComments(params) {
  const sidecar = await readSidecar(params.canvasDir, params.canvasName);
  const fileKey = params.fileKey ? parseFigmaUrl(params.fileKey).fileKey : sidecar?.binding.fileKey;
  if (!fileKey) throw new Error("Specify a Figma URL/fileKey or bind this canvas to Figma first");
  const token = await requireFigmaAccessToken(params.credOptions);
  const remoteComments = await fetchFigmaComments(fileKey, token, sidecar?.binding.nodes ?? {}, params.credOptions?.fetchImpl);
  const versions = await fetchFigmaVersions(fileKey, token, params.credOptions?.fetchImpl).catch(() => []);
  if (!sidecar) {
    return { ok: true, fileKey, comments: remoteComments, versionsCount: versions.length, written: false };
  }
  const merged = mergeFigmaCommentsIntoDoc(params.doc, sidecar, remoteComments);
  return {
    ok: true,
    fileKey,
    doc: normalizeDoc(merged.doc, { touch: true }),
    sidecar: merged.sidecar,
    imported: merged.imported,
    updated: merged.updated,
    totalComments: remoteComments.length,
    versionsCount: versions.length,
    written: true
  };
}
async function replyToFigmaComment(params) {
  const sidecar = await readSidecar(params.canvasDir, params.canvasName);
  const fileKey = params.fileKey ? parseFigmaUrl(params.fileKey).fileKey : sidecar?.binding.fileKey;
  if (!fileKey) throw new Error("Specify a Figma URL/fileKey or bind this canvas to Figma first");
  const token = await requireFigmaAccessToken(params.credOptions);
  const figmaNodeId = params.nodeId && sidecar?.binding.nodes[params.nodeId] ? sidecar.binding.nodes[params.nodeId] : params.nodeId;
  const posted = await postFigmaComment(
    fileKey,
    token,
    { message: params.message, parentId: params.parentId, figmaNodeId, x: params.x, y: params.y },
    params.credOptions?.fetchImpl
  );
  return { ok: true, fileKey, comment: posted };
}
async function exportCanvasAsDshFig(params) {
  const sidecar = await readSidecar(params.canvasDir, params.canvasName).catch(() => null);
  return exportDshFigBundle({
    doc: params.doc,
    sidecar,
    loadAsset: async (relPath) => new Uint8Array(await readFile4(join6(params.canvasDir, relPath)))
  });
}
async function restoreCanvasFromDshFig(params) {
  const unpacked = importDshFigBundle(params.bytes);
  for (const [relPath, data] of unpacked.files) {
    const dest = join6(params.canvasDir, relPath);
    await mkdir6(dirname3(dest), { recursive: true });
    await writeFile6(dest, data);
  }
  if (unpacked.sidecar) {
    await writeSidecar(params.canvasDir, params.canvasName, {
      ...unpacked.sidecar,
      canvasName: params.canvasName
    });
  }
  return {
    doc: unpacked.doc,
    hasSidecar: Boolean(unpacked.sidecar),
    assetsRestored: unpacked.files.size
  };
}

// src/host/figma/routes.ts
var BRIDGE_PREFIX = "/dsh-canvas/bridge/v1/";
async function readBinaryBody(request, limit = maxTransportBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.byteLength;
    if (size > limit) throw new Error(`Request body exceeds ${limit} bytes`);
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}
function assertInsideWorkspace(cwd, relPath) {
  const base = resolve5(cwd);
  const full = resolve5(cwd, relPath);
  if (full !== base && !full.startsWith(base + sep2)) {
    throw new Error("path escapes workspace directory");
  }
  return full;
}
async function handleBridgeRoute(pathname, request, response, deps) {
  if (!pathname.startsWith(BRIDGE_PREFIX)) return false;
  if (!deps.isLoopbackRequest(request)) {
    deps.sendJson(response, 403, { ok: false, error: "loopback-only", message: "Bridge accepts loopback connections only" });
    return true;
  }
  if (!applyBridgeCors(request, response)) {
    deps.sendJson(response, 403, { ok: false, error: "origin-denied", message: "Bridge origin not allowed" });
    return true;
  }
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return true;
  }
  const route = pathname.slice(BRIDGE_PREFIX.length);
  try {
    if (route === "pair" && request.method === "POST") {
      const body = await deps.readBody(request, 64 * 1024);
      const session2 = deps.bridge.exchangeCode(String(body.pairingCode ?? ""), String(body.client ?? "drafi-figma-plugin"));
      if (!session2) {
        deps.sendJson(response, 401, { ok: false, error: "invalid-pairing-code", message: "\u914D\u5BF9\u7801\u65E0\u6548\u6216\u5DF2\u8FC7\u671F" });
        return true;
      }
      deps.sendJson(response, 200, {
        ok: true,
        token: session2.token,
        canvasName: session2.canvasName,
        expiresAt: new Date(session2.expiresAt).toISOString()
      });
      return true;
    }
    const session = deps.bridge.authenticateBearer(request);
    if (!session) {
      deps.sendJson(response, 401, { ok: false, error: "unauthorized", message: "\u65E0\u6548\u6216\u5DF2\u8FC7\u671F\u7684\u914D\u5BF9\u4EE4\u724C" });
      return true;
    }
    const canvasDir = deps.canvasRoot(session.cwd);
    if (route === "status" && request.method === "GET") {
      deps.sendJson(response, 200, {
        ok: true,
        canvasName: session.canvasName,
        hasPendingPatch: Boolean(session.pendingPatch)
      });
      return true;
    }
    if (route === "pull" && request.method === "POST") {
      const body = await deps.readBody(request, 64 * 1024 * 1024);
      const ir = body.ir;
      if (!ir || ir.format !== "dsh.figma.ir") {
        deps.sendJson(response, 400, { ok: false, error: "invalid-ir", message: "Expected a dsh.figma.ir@1 payload" });
        return true;
      }
      const imagesMap = /* @__PURE__ */ new Map();
      if (body.images && typeof body.images === "object") {
        for (const [hash, b64] of Object.entries(body.images)) {
          if (typeof b64 === "string" && b64.length > 0) {
            imagesMap.set(hash, Buffer.from(b64, "base64"));
          }
        }
      }
      const imageHashes = await persistFigmaImages(canvasDir, imagesMap);
      const attachAssets = (nodes) => {
        for (const n of nodes) {
          for (const f of n.fills ?? []) {
            if (f.type === "image" && f.imageHash && imageHashes[f.imageHash.toLowerCase()]) {
              f.asset = imageHashes[f.imageHash.toLowerCase()];
            }
          }
          if (n.children?.length) attachAssets(n.children);
        }
      };
      for (const page of ir.pages) attachAssets(page.children);
      await deps.ensureScaffold(session.cwd);
      const existingSidecar = await readSidecar(canvasDir, session.canvasName).catch(() => null);
      if (!existingSidecar) {
        const built = buildCanvasFromIr({
          ir,
          imageHashes,
          canvasName: session.canvasName,
          fileKey: ir.fileKey ?? "plugin-local",
          fileName: ir.fileName,
          transport: "plugin"
        });
        const written = await deps.writeDoc(session.cwd, session.canvasName, built.doc, { source: "figma-plugin" });
        built.sidecar.binding.lastCanvasRevision = written.revision;
        await writeSidecar(canvasDir, session.canvasName, built.sidecar);
        deps.sendJson(response, 200, {
          ok: true,
          mode: "import",
          written: true,
          revision: written.revision,
          nodes: Object.keys(built.sidecar.binding.nodes).length
        });
        return true;
      }
      const current = await deps.readDoc(session.cwd, session.canvasName);
      const plan = planPullDiff(current.doc, existingSidecar, ir, {
        canvasName: session.canvasName,
        baseCanvasRevision: current.revision
      });
      session.lastPullPlan = plan;
      session.lastPullIr = ir;
      if (body.autoApply === true && plan.conflicts.length === 0) {
        const applied = applyPullPlan(current.doc, existingSidecar, ir, plan);
        applied.sidecar.binding.imageHashes = { ...applied.sidecar.binding.imageHashes, ...imageHashes };
        const written = await deps.writeDoc(session.cwd, session.canvasName, normalizeDoc(applied.doc, { touch: true }), {
          baseRevision: current.revision,
          source: "figma-plugin"
        });
        applied.sidecar.binding.lastCanvasRevision = written.revision;
        await writeSidecar(canvasDir, session.canvasName, applied.sidecar);
        deps.sendJson(response, 200, { ok: true, mode: "pull", written: true, plan, appliedCount: applied.appliedCount });
        return true;
      }
      deps.sendJson(response, 200, { ok: true, mode: "pull", written: false, plan });
      return true;
    }
    if (route === "patch" && request.method === "GET") {
      const patch = deps.bridge.consumePatch(session);
      deps.sendJson(response, 200, { ok: true, patch });
      return true;
    }
    if (route === "ack" && request.method === "POST") {
      const body = await deps.readBody(request, 8 * 1024 * 1024);
      const ack = body.ack;
      if (!ack || !Array.isArray(ack.appliedDshIds)) {
        deps.sendJson(response, 400, { ok: false, error: "invalid-ack", message: "Expected ack.appliedDshIds" });
        return true;
      }
      const current = await deps.readDoc(session.cwd, session.canvasName);
      await applyPluginPushAck({
        doc: current.doc,
        canvasDir,
        canvasName: session.canvasName,
        canvasRevision: current.revision,
        ack
      });
      session.lastPushAck = ack;
      deps.sendJson(response, 200, { ok: true, applied: ack.appliedDshIds.length });
      return true;
    }
    deps.sendJson(response, 404, { ok: false, error: "not-found" });
    return true;
  } catch (error) {
    deps.sendJson(response, 400, { ok: false, error: "bridge-error", message: error instanceof Error ? error.message : String(error) });
    return true;
  }
}
async function handleFigmaApiRoute(action, query, request, response, deps) {
  if (!action.startsWith("figma/")) return false;
  const sub = action.slice("figma/".length);
  if (sub === "auth/status" && request.method === "GET") {
    const status = await getFigmaAuthStatus({ probe: query.probe !== "false" });
    deps.sendJson(response, 200, { ok: true, ...status });
    return true;
  }
  if (sub === "auth/token" && request.method === "POST") {
    const body = await deps.readBody(request, 16 * 1024);
    const token = typeof body.token === "string" ? body.token : "";
    const scopeMode = body.scopeMode === "comments-write" ? "comments-write" : "readonly";
    const expiresInDays = typeof body.expiresInDays === "number" ? body.expiresInDays : 90;
    const status = await saveFigmaToken(token, { scopeMode, expiresInDays });
    deps.sendJson(response, 200, { ok: true, ...status });
    return true;
  }
  if (sub === "auth/token" && request.method === "DELETE") {
    const res = await clearFigmaToken();
    deps.sendJson(response, 200, { ok: true, ...res });
    return true;
  }
  if (sub === "status" && request.method === "GET") {
    const { cwd } = deps.sessionCwd(query.sessionId);
    const name = deps.resolveName(query.sessionId, query.name);
    await deps.ensureScaffold(cwd);
    const status = await getFigmaSetupStatus({
      canvasDir: deps.canvasRoot(cwd),
      sessionId: query.sessionId,
      canvasName: name,
      bridge: deps.bridge,
      probe: query.probe !== "false"
    });
    deps.sendJson(response, 200, status);
    return true;
  }
  if (sub === "pair" && request.method === "POST") {
    const body = await deps.readBody(request, 16 * 1024);
    const sessionId = String(body.sessionId ?? "");
    const { cwd } = deps.sessionCwd(sessionId);
    const name = deps.resolveName(sessionId, typeof body.name === "string" ? body.name : void 0);
    const pairing = deps.bridge.createPairing({ sessionId, cwd, canvasName: name });
    deps.sendJson(response, 200, {
      ok: true,
      pairingCode: pairing.pairingCode,
      canvasName: name,
      expiresAt: new Date(pairing.expiresAt).toISOString()
    });
    return true;
  }
  if (sub === "paste" && request.method === "POST") {
    const body = await deps.readBody(request, 32 * 1024 * 1024);
    const sessionId = String(body.sessionId ?? "");
    const { cwd } = deps.sessionCwd(sessionId);
    await deps.ensureScaffold(cwd);
    const existingIds = Array.isArray(body.existingIds) ? new Set(body.existingIds.map(String)) : void 0;
    const decoded = await decodeFigmaClipboard(
      {
        html: typeof body.html === "string" ? body.html : void 0,
        svg: typeof body.svg === "string" ? body.svg : void 0,
        text: typeof body.text === "string" ? body.text : void 0,
        existingIds
      },
      deps.canvasRoot(cwd)
    );
    deps.sendJson(response, 200, { ok: true, ...decoded });
    return true;
  }
  if (sub === "import-url" && request.method === "POST") {
    const body = await deps.readBody(request, 256 * 1024);
    const sessionId = String(body.sessionId ?? "");
    const { cwd } = deps.sessionCwd(sessionId);
    const name = deps.resolveName(sessionId, typeof body.name === "string" ? body.name : void 0);
    await deps.ensureScaffold(cwd);
    const current = await deps.readDoc(cwd, name).catch(() => null);
    const result = await importFigmaFromUrl({
      url: String(body.url ?? ""),
      canvasDir: deps.canvasRoot(cwd),
      canvasName: name,
      currentDoc: current?.doc,
      currentRevision: typeof body.baseRevision === "string" ? body.baseRevision : current?.revision,
      mode: body.mode === "pull" ? "pull" : "import",
      dryRun: body.dryRun !== false,
      selectedIds: Array.isArray(body.selectedIds) ? body.selectedIds.map(String) : void 0,
      resolutions: body.resolutions && typeof body.resolutions === "object" ? body.resolutions : void 0
    });
    if (result.written && "doc" in result && result.doc && result.sidecar) {
      const written = await deps.writeDoc(cwd, name, result.doc, {
        baseRevision: typeof body.baseRevision === "string" ? body.baseRevision : current?.revision,
        source: "figma-rest"
      });
      result.sidecar.binding.lastCanvasRevision = written.revision;
      await writeSidecar(deps.canvasRoot(cwd), name, result.sidecar);
      deps.rememberDoc(sessionId, name);
      deps.sendJson(response, 200, { ...result, revision: written.revision, doc: void 0, sidecar: void 0 });
      return true;
    }
    deps.sendJson(response, 200, { ...result, doc: void 0, sidecar: void 0 });
    return true;
  }
  if (sub === "import-fig" && request.method === "POST") {
    const sessionId = query.sessionId;
    const { cwd } = deps.sessionCwd(sessionId);
    const name = deps.resolveName(sessionId, query.name);
    await deps.ensureScaffold(cwd);
    const bytes = await readBinaryBody(request, maxTransportBytes);
    const current = await deps.readDoc(cwd, name).catch(() => null);
    const result = await importFigmaFromFigBytes({
      bytes,
      canvasDir: deps.canvasRoot(cwd),
      canvasName: name,
      fileKey: query.fileKey || void 0,
      fileName: query.fileName || void 0,
      currentDoc: current?.doc,
      currentRevision: query.baseRevision || current?.revision,
      mode: query.mode === "pull" ? "pull" : "import",
      dryRun: query.dryRun !== "false"
    });
    if (result.written && result.doc && result.sidecar) {
      const written = await deps.writeDoc(cwd, name, result.doc, {
        baseRevision: query.baseRevision || current?.revision,
        source: "figma-file"
      });
      result.sidecar.binding.lastCanvasRevision = written.revision;
      await writeSidecar(deps.canvasRoot(cwd), name, result.sidecar);
      deps.rememberDoc(sessionId, name);
      deps.sendJson(response, 200, { ...result, revision: written.revision, doc: void 0, sidecar: void 0 });
      return true;
    }
    deps.sendJson(response, 200, { ...result, doc: void 0, sidecar: void 0 });
    return true;
  }
  if (sub === "push" && request.method === "POST") {
    const body = await deps.readBody(request, 256 * 1024);
    const sessionId = String(body.sessionId ?? "");
    const { cwd } = deps.sessionCwd(sessionId);
    const name = deps.resolveName(sessionId, typeof body.name === "string" ? body.name : void 0);
    await deps.ensureScaffold(cwd);
    const current = await deps.readDoc(cwd, name);
    const result = await planOrQueueFigmaPush({
      doc: current.doc,
      canvasDir: deps.canvasRoot(cwd),
      canvasName: name,
      baseCanvasRevision: current.revision,
      mode: body.mode === "proposal-frame" ? "proposal-frame" : "in-place",
      selectedIds: Array.isArray(body.selectedIds) ? body.selectedIds.map(String) : void 0,
      dryRun: body.dryRun !== false,
      bridge: deps.bridge,
      sessionId
    });
    deps.sendJson(response, 200, result);
    return true;
  }
  if (sub === "comments/sync" && request.method === "POST") {
    const body = await deps.readBody(request, 64 * 1024);
    const sessionId = String(body.sessionId ?? "");
    const { cwd } = deps.sessionCwd(sessionId);
    const name = deps.resolveName(sessionId, typeof body.name === "string" ? body.name : void 0);
    await deps.ensureScaffold(cwd);
    const current = await deps.readDoc(cwd, name);
    const result = await syncFigmaComments({
      doc: current.doc,
      canvasDir: deps.canvasRoot(cwd),
      canvasName: name,
      fileKey: typeof body.fileKey === "string" ? body.fileKey : void 0
    });
    if (result.written && "doc" in result && result.doc && result.sidecar) {
      const written = await deps.writeDoc(cwd, name, result.doc, {
        baseRevision: current.revision,
        source: "figma-comments"
      });
      result.sidecar.binding.lastCanvasRevision = written.revision;
      await writeSidecar(deps.canvasRoot(cwd), name, result.sidecar);
      deps.sendJson(response, 200, { ...result, revision: written.revision, doc: void 0, sidecar: void 0 });
      return true;
    }
    deps.sendJson(response, 200, result);
    return true;
  }
  if (sub === "comments/reply" && request.method === "POST") {
    const body = await deps.readBody(request, 64 * 1024);
    const sessionId = String(body.sessionId ?? "");
    const { cwd } = deps.sessionCwd(sessionId);
    const name = deps.resolveName(sessionId, typeof body.name === "string" ? body.name : void 0);
    const result = await replyToFigmaComment({
      canvasDir: deps.canvasRoot(cwd),
      canvasName: name,
      fileKey: typeof body.fileKey === "string" ? body.fileKey : void 0,
      message: String(body.message ?? ""),
      parentId: typeof body.parentId === "string" ? body.parentId : void 0,
      nodeId: typeof body.nodeId === "string" ? body.nodeId : void 0
    });
    deps.sendJson(response, 200, result);
    return true;
  }
  if (sub === "bundle" && request.method === "GET") {
    const { cwd } = deps.sessionCwd(query.sessionId);
    const name = deps.resolveName(query.sessionId, query.name);
    await deps.ensureScaffold(cwd);
    const current = await deps.readDoc(cwd, name);
    const exported = await exportCanvasAsDshFig({
      doc: current.doc,
      canvasDir: deps.canvasRoot(cwd),
      canvasName: name
    });
    response.writeHead(200, {
      "content-type": "application/octet-stream",
      "content-disposition": `attachment; filename="${name}${BUNDLE_SUFFIX}"`,
      "content-length": exported.bytes.byteLength,
      "x-dsh-objects": String(exported.objects)
    });
    response.end(Buffer.from(exported.bytes));
    return true;
  }
  if (sub === "bundle/import" && request.method === "POST") {
    const sessionId = query.sessionId;
    const { cwd } = deps.sessionCwd(sessionId);
    const name = deps.resolveName(sessionId, query.name);
    await deps.ensureScaffold(cwd);
    const bytes = await readBinaryBody(request, maxTransportBytes);
    const restored = await restoreCanvasFromDshFig({
      bytes,
      canvasDir: deps.canvasRoot(cwd),
      canvasName: name
    });
    const written = await deps.writeDoc(cwd, name, restored.doc, { source: "figma-bundle" });
    deps.rememberDoc(sessionId, name);
    deps.sendJson(response, 200, {
      ok: true,
      name,
      revision: written.revision,
      hasSidecar: restored.hasSidecar,
      assetsRestored: restored.assetsRestored
    });
    return true;
  }
  return false;
}
function createFigmaTool(deps) {
  return {
    name: "canvas_figma",
    description: "Figma ecosystem bridge: check setup_status (token/plugin/binding), generate a loopback Companion Plugin pairing code, import or 3-way pull from Figma URL or .fig file (preview with dryRun), plan/queue in-place or proposal-frame push patches, sync/reply to Figma review comments, and export/import lossless .dshfig bundles. Never asks for or echoes raw tokens.",
    parameters: {
      type: "object",
      required: ["action"],
      additionalProperties: false,
      properties: {
        action: {
          type: "string",
          enum: [
            "setup_status",
            "pair_start",
            "import_url",
            "import_fig",
            "pull_diff",
            "push_diff",
            "sync_comments",
            "reply_comment",
            "export_bundle",
            "import_bundle"
          ]
        },
        name: { type: "string", description: "canvas document name; defaults to the active canvas" },
        url: { type: "string", description: "Figma file or node URL (or fileKey) for import_url / pull_diff / comments" },
        path: { type: "string", description: "workspace-relative path to a .fig or .dshfig file" },
        mode: { type: "string", enum: ["in-place", "proposal-frame"], description: "push delivery mode (default in-place)" },
        dryRun: { type: "boolean", description: "preview diff plan without writing (default true for pull/push)" },
        selectedIds: { type: "array", items: { type: "string" }, description: "optional node IDs for selective staging" },
        resolutions: {
          type: "object",
          additionalProperties: { type: "string", enum: ["keep-drafi", "take-figma", "skip"] },
          description: "explicit conflict resolutions keyed by conflictKey"
        },
        message: { type: "string", description: "comment text for reply_comment" },
        parentId: { type: "string", description: "Figma root comment ID when replying to an existing thread" },
        nodeId: { type: "string", description: "optional Drafi or Figma node ID to anchor a comment" },
        baseRevision: { type: "string", description: "revision guard returned by canvas_read or dryRun" },
        probe: { type: "boolean", description: "whether setup_status should probe GET /v1/me (default true)" }
      }
    },
    output: { schema: { type: "object", additionalProperties: true }, render: (_args, value) => deps.renderJson(value) },
    async execute(args, exec) {
      const { cwd, sessionId } = await deps.workspace(exec);
      const name = deps.resolveName(sessionId, typeof args.name === "string" ? args.name : void 0);
      await deps.ensureScaffold(cwd);
      const canvasDir = deps.canvasRoot(cwd);
      const action = String(args.action);
      if (action === "setup_status") {
        return getFigmaSetupStatus({
          canvasDir,
          sessionId,
          canvasName: name,
          bridge: deps.bridge,
          probe: args.probe !== false
        });
      }
      if (action === "pair_start") {
        const pairing = deps.bridge.createPairing({ sessionId, cwd, canvasName: name });
        return {
          ok: true,
          canvasName: name,
          pairingCode: pairing.pairingCode,
          expiresAt: new Date(pairing.expiresAt).toISOString(),
          hint: "Open Figma Desktop -> Plugins -> Development -> Drafi Companion and enter this pairingCode."
        };
      }
      if (action === "import_url" || action === "pull_diff") {
        const current = await deps.readDoc(cwd, name).catch(() => null);
        const sidecar = await readSidecar(canvasDir, name).catch(() => null);
        const targetUrl = typeof args.url === "string" && args.url ? args.url : sidecar?.binding.fileUrl ?? sidecar?.binding.fileKey;
        if (!targetUrl) throw new Error("url is required (or bind the canvas to a Figma file first)");
        const result = await importFigmaFromUrl({
          url: targetUrl,
          canvasDir,
          canvasName: name,
          currentDoc: current?.doc,
          currentRevision: typeof args.baseRevision === "string" ? args.baseRevision : current?.revision,
          mode: action === "pull_diff" ? "pull" : "import",
          dryRun: action === "pull_diff" ? args.dryRun !== false : Boolean(args.dryRun),
          selectedIds: Array.isArray(args.selectedIds) ? args.selectedIds.map(String) : void 0,
          resolutions: args.resolutions && typeof args.resolutions === "object" ? args.resolutions : void 0
        });
        if (result.written && "doc" in result && result.doc && result.sidecar) {
          const written = await deps.writeDoc(cwd, name, result.doc, {
            baseRevision: typeof args.baseRevision === "string" ? args.baseRevision : current?.revision,
            source: "tool"
          });
          result.sidecar.binding.lastCanvasRevision = written.revision;
          await writeSidecar(canvasDir, name, result.sidecar);
          deps.rememberDoc(sessionId, name);
          return { ...result, revision: written.revision, path: relative(cwd, written.file), doc: void 0, sidecar: void 0 };
        }
        return { ...result, doc: void 0, sidecar: void 0 };
      }
      if (action === "import_fig") {
        if (typeof args.path !== "string" || !args.path.trim()) throw new Error("path to .fig file is required");
        const full = assertInsideWorkspace(cwd, args.path);
        const bytes = new Uint8Array(await readFile5(full));
        const current = await deps.readDoc(cwd, name).catch(() => null);
        const result = await importFigmaFromFigBytes({
          bytes,
          canvasDir,
          canvasName: name,
          fileKey: typeof args.url === "string" ? args.url : void 0,
          currentDoc: current?.doc,
          currentRevision: typeof args.baseRevision === "string" ? args.baseRevision : current?.revision,
          mode: current && await readSidecar(canvasDir, name).catch(() => null) ? "pull" : "import",
          dryRun: args.dryRun !== false,
          selectedIds: Array.isArray(args.selectedIds) ? args.selectedIds.map(String) : void 0,
          resolutions: args.resolutions && typeof args.resolutions === "object" ? args.resolutions : void 0
        });
        if (result.written && result.doc && result.sidecar) {
          const written = await deps.writeDoc(cwd, name, result.doc, {
            baseRevision: typeof args.baseRevision === "string" ? args.baseRevision : current?.revision,
            source: "tool"
          });
          result.sidecar.binding.lastCanvasRevision = written.revision;
          await writeSidecar(canvasDir, name, result.sidecar);
          deps.rememberDoc(sessionId, name);
          return { ...result, revision: written.revision, path: relative(cwd, written.file), doc: void 0, sidecar: void 0 };
        }
        return { ...result, doc: void 0, sidecar: void 0 };
      }
      if (action === "push_diff") {
        const current = await deps.readDoc(cwd, name);
        return planOrQueueFigmaPush({
          doc: current.doc,
          canvasDir,
          canvasName: name,
          baseCanvasRevision: current.revision,
          mode: args.mode === "proposal-frame" ? "proposal-frame" : "in-place",
          selectedIds: Array.isArray(args.selectedIds) ? args.selectedIds.map(String) : void 0,
          dryRun: args.dryRun !== false,
          bridge: deps.bridge,
          sessionId
        });
      }
      if (action === "sync_comments") {
        const current = await deps.readDoc(cwd, name);
        const result = await syncFigmaComments({
          doc: current.doc,
          canvasDir,
          canvasName: name,
          fileKey: typeof args.url === "string" ? args.url : void 0
        });
        if (result.written && "doc" in result && result.doc && result.sidecar) {
          const written = await deps.writeDoc(cwd, name, result.doc, { baseRevision: current.revision, source: "tool" });
          result.sidecar.binding.lastCanvasRevision = written.revision;
          await writeSidecar(canvasDir, name, result.sidecar);
          return { ...result, revision: written.revision, doc: void 0, sidecar: void 0 };
        }
        return result;
      }
      if (action === "reply_comment") {
        return replyToFigmaComment({
          canvasDir,
          canvasName: name,
          fileKey: typeof args.url === "string" ? args.url : void 0,
          message: String(args.message ?? ""),
          parentId: typeof args.parentId === "string" ? args.parentId : void 0,
          nodeId: typeof args.nodeId === "string" ? args.nodeId : void 0
        });
      }
      if (action === "export_bundle") {
        const current = await deps.readDoc(cwd, name);
        const exported = await exportCanvasAsDshFig({ doc: current.doc, canvasDir, canvasName: name });
        const outDir = join7(canvasDir, "exports");
        await mkdir7(outDir, { recursive: true });
        const outFile = join7(outDir, `${name}${BUNDLE_SUFFIX}`);
        await writeFile7(outFile, exported.bytes);
        return {
          ok: true,
          format: "dsh.fig.bundle",
          name,
          path: relative(cwd, outFile),
          bytes: exported.bytes.byteLength,
          objects: exported.objects,
          assetCount: exported.assetCount
        };
      }
      if (action === "import_bundle") {
        if (typeof args.path !== "string" || !args.path.trim()) throw new Error("path to .dshfig bundle is required");
        const full = assertInsideWorkspace(cwd, args.path);
        const bytes = new Uint8Array(await readFile5(full));
        const restored = await restoreCanvasFromDshFig({ bytes, canvasDir, canvasName: name });
        const written = await deps.writeDoc(cwd, name, restored.doc, { source: "tool" });
        deps.rememberDoc(sessionId, name);
        return {
          ok: true,
          name,
          revision: written.revision,
          path: relative(cwd, written.file),
          hasSidecar: restored.hasSidecar,
          assetsRestored: restored.assetsRestored
        };
      }
      throw new Error(`Unknown canvas_figma action "${action}"`);
    }
  };
}

// src/host/main.ts
var HEALTH_PATH = "/dsh-canvas/health";
var API_PREFIX = "/dsh-canvas/api/";
var DOC_SUFFIX = ".canvas.json";
var CANVAS_DIR = ".dsh-canvas";
var LEGACY_CANVAS_DIR = "canvas";
var PACK_FORMAT = "dsh.canvas.pack";
var PACK_VERSION = 1;
var PACK_SUFFIX = ".drafi.json";
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
  `Canvas: the workspace may contain ${CANVAS_DIR}/*.canvas.json (format dsh.canvas@1).`,
  "Canvas files support more than 2,000 layers within 8 MiB. Viewport tiling only affects display; tools can address offscreen nodes by id.",
  "For repeated screen placements, use pageRef and physical wire endpoints. Read canvas_read detail=interactions or use canvas_interaction_view in a live session.",
  "Use canvas_read before editing; use canvas_edit for small changes and canvas_write for a new document.",
  `The canvas file format, node fields, auto-layout, components, styles, fills, effects and comments are documented in ${CANVAS_DIR}/FORMAT.md.`,
  `The design system and built-in templates are documented in ${CANVAS_DIR}/DESIGN.md.`,
  "Load the canvas-ui-design skill when the user asks for UI design, page/component generation, design review or design handoff.",
  "Load the canvas-figma-setup skill when the user wants to connect Figma, obtain or refresh a Figma token, pair the Companion Plugin, or troubleshoot Figma auth. Never ask the user to paste a raw token into chat.",
  "Use canvas_figma for Figma URL/.fig import, 3-way pull/push diffs, Companion Plugin pairing, Figma comment sync/reply, and .dshfig portable bundles.",
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
  return createHash5("sha256").update(value).digest("hex").slice(0, 16);
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
function renderJson(value) {
  const pretty = process.env.DSH_CANVAS_PRETTY_JSON === "1";
  return [{ type: "text", text: JSON.stringify(value, null, pretty ? 2 : 0) }];
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
var migratedCanvasRoots = /* @__PURE__ */ new Set();
function canvasRoot(cwd) {
  const root = join8(cwd, CANVAS_DIR);
  if (!migratedCanvasRoots.has(cwd)) {
    migratedCanvasRoots.add(cwd);
    try {
      const legacy = join8(cwd, LEGACY_CANVAS_DIR);
      if (!existsSync2(root) && existsSync2(legacy) && statSync(legacy).isDirectory()) {
        renameSync(legacy, root);
      }
    } catch (error) {
      console.warn(
        "[dsh-canvas] could not migrate the legacy canvas/ directory:",
        error?.message ?? error
      );
    }
  }
  return root;
}
function assertInside2(root, target) {
  const rel = relative2(root, target);
  if (rel === "" || rel.startsWith("..") || rel.startsWith(`..${sep3}`) || resolve6(root, rel) !== target) {
    throw new HttpError(400, "outside-canvas", "path escapes the canvas directory");
  }
  return target;
}
function docFile(cwd, name) {
  if (!isSlug(name)) throw new HttpError(400, "invalid-name", "document name must match ^[a-z0-9][a-z0-9-_]{0,63}$");
  return assertInside2(canvasRoot(cwd), join8(canvasRoot(cwd), `${name}${DOC_SUFFIX}`));
}
function assetFile(cwd, asset, kind) {
  const allowed = kind === "font" ? /^fonts\/[A-Za-z0-9._-]{1,120}$/ : /^assets\/[A-Za-z0-9._-]{1,120}$/;
  if (typeof asset !== "string" || !allowed.test(asset) || asset.includes("..")) {
    throw new HttpError(400, "invalid-asset", "asset path is not allowed");
  }
  return assertInside2(canvasRoot(cwd), join8(canvasRoot(cwd), asset));
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
    exampleDoc = normalizeDoc(JSON.parse(await readFile6(EXAMPLE_URL, "utf8")));
  } catch {
    exampleDoc = normalizeDoc(emptyDoc("\u4E3B\u753B\u5E03"));
  }
  return exampleDoc;
}
async function readFormatDoc() {
  try {
    return await readFile6(FORMAT_URL, "utf8");
  } catch {
    return "# dsh.canvas@1\n\nCanvas document format. See the plugin README.\n";
  }
}
async function readDesignDoc() {
  try {
    return await readFile6(DESIGN_URL, "utf8");
  } catch {
    return "# Canvas design system\n\nUse Material Design 3 by default; Apple HIG for iOS.\n";
  }
}
var state = () => ({
  selections: /* @__PURE__ */ new Map(),
  lastDoc: /* @__PURE__ */ new Map(),
  sse: /* @__PURE__ */ new Set(),
  watchers: /* @__PURE__ */ new Map(),
  revisions: /* @__PURE__ */ new Map(),
  snapshots: /* @__PURE__ */ new Map(),
  interactionView: createInteractionChannel(),
  bridge: new FigmaPluginBridge()
});
async function ensureScaffold(cwd, store) {
  const root = canvasRoot(cwd);
  await mkdir8(root, { recursive: true });
  await mkdir8(join8(root, "assets"), { recursive: true });
  await mkdir8(join8(root, "fonts"), { recursive: true });
  await mkdir8(join8(root, "exports"), { recursive: true });
  const formatPath = join8(root, "FORMAT.md");
  if (!await exists(formatPath)) {
    await writeFile8(formatPath, await readFormatDoc(), "utf8");
  }
  const designPath = join8(root, "DESIGN.md");
  if (!await exists(designPath)) {
    await writeFile8(designPath, await readDesignDoc(), "utf8");
  }
  const names = await listDocNames(cwd);
  if (names.length === 0) {
    const example = await loadExample();
    const doc = structuredClone(example);
    doc.title = "\u4E3B\u753B\u5E03";
    doc.meta = { createdAt: nowIso2(), updatedAt: nowIso2() };
    const file = docFile(cwd, "main");
    const json = JSON.stringify(doc, null, 2) + "\n";
    await writeFile8(file, json, "utf8");
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
      const raw = await readFile6(file, "utf8");
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
    raw = await readFile6(file, "utf8");
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
    doc = isLegacyFigmaArchive(parsed) ? extractDocFromLegacyArchive(parsed) : normalizeDoc(parsed, { touch: false });
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
  await mkdir8(dirname4(file), { recursive: true });
  let currentRaw = null;
  try {
    currentRaw = await readFile6(file, "utf8");
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
  await writeFile8(temp, json, "utf8");
  await rename2(temp, file);
  const revision = sha(json);
  store.revisions.set(file, revision);
  broadcast(store, file, { type: "doc-changed", name, revision, source: options.source });
  return { doc: normalized, revision, file, path: relative2(cwd, file) };
}
async function buildPack(cwd, name) {
  const read = await readDoc(cwd, name);
  const root = canvasRoot(cwd);
  const assets = {};
  let assetCount = 0;
  try {
    const entries = await readdir2(join8(root, "assets"), { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const file = join8(root, "assets", entry.name);
      const info = await stat2(file);
      if (info.size > 8 * 1024 * 1024) continue;
      const buffer = await readFile6(file);
      assets[`assets/${entry.name}`] = `data:${MIME[extname2(entry.name)] ?? "application/octet-stream"};base64,${buffer.toString("base64")}`;
      assetCount += 1;
    }
  } catch {
  }
  return {
    format: PACK_FORMAT,
    version: PACK_VERSION,
    name,
    exportedAt: nowIso2(),
    document: read.doc,
    assets,
    assetCount
  };
}
async function writePack(cwd, name) {
  const pack = await buildPack(cwd, name);
  const file = assertInside2(canvasRoot(cwd), join8(canvasRoot(cwd), "exports", `${name}${PACK_SUFFIX}`));
  await mkdir8(dirname4(file), { recursive: true });
  const json = JSON.stringify(pack);
  if (Buffer.byteLength(json) > LIMITS.docBytes) throw new HttpError(413, "pack-too-large", "packed document exceeds the size limit");
  await writeFile8(file, json, "utf8");
  return { pack, file, bytes: Buffer.byteLength(json) };
}
async function readPack(cwd, packPath) {
  const file = assertInside2(cwd, resolve6(cwd, packPath));
  let raw;
  try {
    raw = await readFile6(file, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") throw new HttpError(404, "pack-not-found", `pack "${packPath}" does not exist`);
    throw error;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new HttpError(422, "invalid-pack", `pack is not valid JSON: ${String(error.message)}`);
  }
  if (!parsed || parsed.format !== PACK_FORMAT || !parsed.document) {
    throw new HttpError(422, "invalid-pack", `expected a ${PACK_FORMAT} file`);
  }
  if (Number(parsed.version) > PACK_VERSION) {
    throw new HttpError(422, "pack-version", `pack version ${parsed.version} is newer than supported ${PACK_VERSION}`);
  }
  return parsed;
}
async function importPack(ctx, store, cwd, pack, options = {}) {
  const name = options.name ?? (isSlug(pack.name) ? pack.name : "imported");
  const doc = normalizeDoc(pack.document);
  const root = canvasRoot(cwd);
  let assets = 0;
  for (const [relativePathValue, dataUrl] of Object.entries(pack.assets ?? {})) {
    const match = /^assets\/[A-Za-z0-9._-]{1,120}$/.exec(relativePathValue);
    if (!match) continue;
    const base64 = String(dataUrl).split(",")[1];
    if (!base64) continue;
    const buffer = Buffer.from(base64, "base64");
    if (buffer.byteLength > LIMITS.imageBytes) continue;
    await mkdir8(join8(root, "assets"), { recursive: true });
    await writeFile8(join8(root, relativePathValue), buffer);
    assets += 1;
  }
  const result = await writeDoc(ctx, store, cwd, name, doc, {
    source: "import",
    ...typeof options.baseRevision === "string" ? { baseRevision: options.baseRevision } : {}
  });
  return { name, assets, revision: result.revision, path: relativePath(cwd, result.file) };
}
async function requestSnapshot(store, cwd, name, options = {}) {
  const file = docFile(cwd, name);
  const clients = [...store.sse].filter((client) => client.file === file);
  if (clients.length === 0) {
    throw new HttpError(409, "no-live-canvas", "open the canvas tab first: snapshot needs a live renderer");
  }
  const requestId = randomUUID2();
  const scale = Math.min(Math.max(Number(options.scale) || 2, 0.5), 4);
  const nodeId = typeof options.nodeId === "string" ? options.nodeId : null;
  const settled = new Promise((resolve7, reject) => {
    const timer = setTimeout(() => {
      store.snapshots.delete(requestId);
      reject(new HttpError(504, "snapshot-timeout", "the canvas tab did not answer the snapshot request"));
    }, 2e4);
    store.snapshots.set(requestId, {
      resolve: (value) => {
        clearTimeout(timer);
        store.snapshots.delete(requestId);
        resolve7(value);
      }
    });
  });
  for (const client of clients) {
    try {
      client.response.write(`data: ${JSON.stringify({ type: "snapshot-request", requestId, nodeId, scale })}

`);
    } catch {
    }
  }
  return { requestId, settled, nodeId, scale };
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
          const raw = await readFile6(file, "utf8");
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
  return relative2(cwd, file);
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
function figmaDeps(ctx, store) {
  const workspace = async (exec) => {
    const sessionId = exec?.sessionId;
    const { cwd } = sessionCwd(ctx, sessionId);
    return { cwd, sessionId };
  };
  return {
    bridge: store.bridge,
    canvasRoot,
    sessionCwd: (sessionId) => sessionCwd(ctx, sessionId),
    resolveName: (sessionId, name) => resolveName(store, sessionId, name),
    ensureScaffold: (cwd) => ensureScaffold(cwd, store),
    rememberDoc: (sessionId, name) => rememberDoc(store, sessionId, name),
    readDoc,
    writeDoc: (cwd, name, doc, options) => writeDoc(ctx, store, cwd, name, doc, options),
    sendJson,
    readBody,
    isLoopbackRequest: (request) => {
      const host = request.headers.host;
      if (host !== void 0 && !isLoopbackHost(host)) return false;
      const remote = request.socket?.remoteAddress;
      if (!remote) return true;
      return remote === "127.0.0.1" || remote === "::1" || remote === "::ffff:127.0.0.1";
    },
    workspace,
    renderJson
  };
}
function createRoutes(ctx, store) {
  const fDeps = figmaDeps(ctx, store);
  return async function handler(request, response) {
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      const pathname = url.pathname;
      if (pathname.startsWith(BRIDGE_PREFIX)) {
        await handleBridgeRoute(pathname, request, response, fDeps);
        return;
      }
      if (!admit(ctx, request, response)) return;
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
      if (action.startsWith("figma/")) {
        const handled = await handleFigmaApiRoute(action, query, request, response, fDeps);
        if (handled) return;
      }
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
          workspaceId: sha(cwd),
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
          text2 = await readFile6("/tmp/dsh-canvas-client.log", "utf8");
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
          await rename2(fromFile, toFile);
          await renameSidecar(canvasRoot(cwd), from, to).catch(() => {
          });
          const watcher = store.watchers.get(fromFile);
          if (watcher) {
            if (watcher.timer) clearTimeout(watcher.timer);
            unwatchFile(fromFile);
            store.watchers.delete(fromFile);
          }
          store.revisions.delete(fromFile);
        }
        const raw = await readFile6(toFile, "utf8");
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
        await unlink3(file);
        await deleteSidecar(canvasRoot(cwd), name).catch(() => {
        });
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
        await mkdir8(join8(root, "exports"), { recursive: true });
        const safeName = (isSlug(body.name) ? body.name : "canvas") + "-" + (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
        const file = assertInside2(root, join8(root, "exports", `${safeName}.${kind}`));
        await writeFile8(file, buffer);
        sendJson(response, 200, {
          ok: true,
          path: relativePath(cwd, file),
          absolutePath: file,
          bytes: buffer.byteLength
        });
        return;
      }
      if (action === "pack" && request.method === "GET") {
        const { cwd } = sessionCwd(ctx, query.sessionId);
        const name = resolveName(store, query.sessionId, query.name);
        await ensureScaffold(cwd, store);
        const pack = await buildPack(cwd, name);
        sendJson(response, 200, { ok: true, pack });
        return;
      }
      if (action === "pack/export" && request.method === "POST") {
        const body = await readBody(request, 64 * 1024);
        const { cwd } = sessionCwd(ctx, body.sessionId);
        const name = resolveName(store, body.sessionId, body.name);
        await ensureScaffold(cwd, store);
        const packed = await writePack(cwd, name);
        sendJson(response, 200, {
          ok: true,
          name,
          path: relativePath(cwd, packed.file),
          bytes: packed.bytes,
          assets: packed.pack.assetCount
        });
        return;
      }
      if (action === "pack/import" && request.method === "POST") {
        const body = await readBody(request, LIMITS.docBytes * 4);
        const { cwd } = sessionCwd(ctx, body.sessionId);
        const pack = body.pack;
        if (!pack || pack.format !== PACK_FORMAT || !pack.document) {
          throw new HttpError(422, "invalid-pack", `expected a ${PACK_FORMAT} payload`);
        }
        if (Number(pack.version) > PACK_VERSION) {
          throw new HttpError(422, "pack-version", `pack version ${pack.version} is newer than supported ${PACK_VERSION}`);
        }
        const result = await importPack(ctx, store, cwd, pack, {
          ...typeof body.name === "string" && body.name ? { name: body.name } : {},
          ...typeof body.baseRevision === "string" ? { baseRevision: body.baseRevision } : {}
        });
        sendJson(response, 200, { ok: true, ...result });
        return;
      }
      if (action === "interaction-view/reply" && request.method === "POST") {
        const body = await readBody(request, LIMITS.docBytes);
        const result = body.result;
        if (!result || typeof result.ok !== "boolean") throw new HttpError(400, "invalid-reply", "result.ok is required");
        const received = store.interactionView.reply(body.sessionId, body.requestId, result);
        sendJson(response, received ? 200 : 404, { ok: received });
        return;
      }
      if (action === "snapshot" && request.method === "POST") {
        const body = await readBody(request, 40 * 1024 * 1024);
        const waiter = store.snapshots.get(String(body.requestId ?? ""));
        if (!waiter) throw new HttpError(404, "unknown-snapshot", "snapshot request expired or unknown");
        const data = typeof body.data === "string" ? body.data : "";
        if (!data) throw new HttpError(400, "invalid-snapshot", "data is required");
        const buffer = Buffer.from(data, "base64");
        if (buffer.byteLength > 30 * 1024 * 1024) throw new HttpError(413, "snapshot-too-large", "snapshot exceeds 30 MiB");
        waiter.resolve({ buffer, nodeId: typeof body.nodeId === "string" ? body.nodeId : null });
        sendJson(response, 200, { ok: true });
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
        await mkdir8(join8(root, "assets"), { recursive: true });
        const hash = createHash5("sha256").update(buffer).digest("hex").slice(0, 24);
        const file = assertInside2(root, join8(root, "assets", `${hash}${ext}`));
        if (!await exists(file)) await writeFile8(file, buffer);
        sendJson(response, 200, { ok: true, asset: `assets/${hash}${ext}`, bytes: buffer.byteLength });
        return;
      }
      if (action === "asset" && request.method === "GET") {
        const { cwd } = sessionCwd(ctx, query.sessionId);
        const file = assetFile(cwd, query.asset, "asset");
        const buffer = await readFile6(file);
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
        await mkdir8(join8(root, "fonts"), { recursive: true });
        const hash = createHash5("sha256").update(buffer).digest("hex").slice(0, 24);
        const file = assertInside2(root, join8(root, "fonts", `${hash}${ext}`));
        if (!await exists(file)) await writeFile8(file, buffer);
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
        const buffer = await readFile6(file);
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
        const assetDir = join8(canvasRoot(cwd), "assets");
        await mkdir8(assetDir, { recursive: true });
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
    description: "Read a canvas document and the current selection. Prefer query to locate nodes, node for one subtree, outline for the page tree.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "document name; defaults to the last opened canvas in this session" },
        detail: { type: "string", enum: ["outline", "full", "node", "interactions"], description: "how much of the document to return" },
        nodeId: { type: "string", description: "physical node ID for node or interactions detail" },
        query: { type: "string", description: "match id, name or text; returns matches with ancestor path" },
        limit: { type: "number", description: "max matches for query (default 20)" },
        offset: { type: "number", description: "connection offset for interactions detail" },
        fields: { type: "array", items: { type: "string" }, description: "outline sections: nodes, styles, components, comments, fonts, meta, pages" },
        depth: { type: "number", description: "outline child depth (default 6)" },
        childrenLimit: { type: "number", description: "max children per node in the outline (default 100)" }
      },
      additionalProperties: false
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_args, value) => renderJson(value)
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
      if (typeof args?.query === "string" && args.query.trim()) {
        const found = findInDoc(readDocValue.doc, args.query, { pageId, limit: args.limit });
        return { ...base, detail: "query", query: args.query, ...found };
      }
      if (args?.detail === "interactions") {
        const ids = args.nodeId ? [args.nodeId] : selection?.ids;
        return { ...base, detail: "interactions", ...describeInteractions(readDocValue.doc, { ids, offset: args.offset, limit: args.limit }) };
      }
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
        outline: outlineDoc(readDocValue.doc, {
          selection: selection?.ids,
          pageId,
          ...Array.isArray(args?.fields) ? { fields: args.fields } : {},
          ...Number.isInteger(args?.depth) ? { depth: args.depth } : {},
          ...Number.isInteger(args?.childrenLimit) ? { childrenLimit: args.childrenLimit } : {}
        }),
        hint: `Use canvas_edit for small changes; read ${CANVAS_DIR}/FORMAT.md only when creating new node structures.`
      };
    }
  };
  const write = {
    name: "canvas_write",
    description: `Create or replace a dsh-canvas document (format dsh.canvas@1). Provide the complete document JSON. Use canvas_edit for small changes and always pass baseRevision when you read an existing document first. Read ${CANVAS_DIR}/FORMAT.md for node, auto-layout, component, style, fill, effect and comment fields.`,
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
      render: (_args, value) => renderJson(value)
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
      render: (_args, value) => renderJson(value)
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
      render: (_args, value) => renderJson(value)
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
    description: `List, insert or inspect built-in canvas templates. Pages: ios-screen / ios-form-screen / ios-list-screen / ios-detail-screen; system bars: ios-status-bar / ios-status-bar-light / ios-nav-bar / ios-tab-bar. Templates default to iPhone 16 393\xD7852 and accept device "iphone15". The foundation action returns devices, style presets and resolved tokens; styles loads a fill/text/effect style library. If the user does not specify a design system, use ${CANVAS_DIR}/DESIGN.md defaults.`,
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
      render: (_args, value) => renderJson(value)
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
          designDoc: `${CANVAS_DIR}/DESIGN.md`
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
      render: (_args, value) => renderJson(value)
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
    description: `Probe, generate or import images for a canvas document. probe reports the current model and whether a local Codex CLI supports image_generation; generate uses Codex when that is the recommended route; import copies an existing image file (for example from the model native image tool) into ${CANVAS_DIR}/assets/. Expected failures are returned, not thrown.`,
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
      render: (_args, value) => renderJson(value)
    },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec);
      const name = defaultName2(sessionId, args?.name);
      if (args?.action === "probe") {
        const capabilities = await detectImageCapabilities({ modelSelection: currentModelSelection(ctx) });
        return { ok: true, name, capabilities };
      }
      const assetDir = join8(canvasRoot(cwd), "assets");
      await mkdir8(assetDir, { recursive: true });
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
        const result = await importImage({ sourcePath: resolve6(cwd, source), assetDir });
        return { name, ...result };
      }
      throw new Error(`unknown canvas_image action "${String(args?.action)}"`);
    }
  };
  const exportTool = {
    name: "canvas_export",
    description: `Pack a canvas document and its assets into one portable file under ${CANVAS_DIR}/exports/.`,
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "document name; defaults to the current document" }
      },
      additionalProperties: false
    },
    output: { schema: { type: "object", additionalProperties: true }, render: (_args, value) => renderJson(value) },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec);
      const name = defaultName2(sessionId, args?.name);
      await ensureScaffold(cwd, store);
      const packed = await writePack(cwd, name);
      return {
        ok: true,
        name,
        path: relativePath(cwd, packed.file),
        bytes: packed.bytes,
        assets: packed.pack.assetCount,
        format: PACK_FORMAT
      };
    }
  };
  const importTool = {
    name: "canvas_import",
    description: "Import a canvas pack written by canvas_export as a document plus its assets.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "pack path relative to the workspace" },
        name: { type: "string", description: "target document name; defaults to the pack name" },
        baseRevision: { type: "string", description: "optional revision guard when overwriting" }
      },
      required: ["path"],
      additionalProperties: false
    },
    output: { schema: { type: "object", additionalProperties: true }, render: (_args, value) => renderJson(value) },
    async execute(args, exec) {
      const { cwd } = await workspace(exec);
      if (typeof args?.path !== "string" || !args.path) throw new Error("canvas_import requires path");
      const pack = await readPack(cwd, args.path);
      const result = await importPack(ctx, store, cwd, pack, {
        ...typeof args?.name === "string" ? { name: args.name } : {},
        ...typeof args?.baseRevision === "string" ? { baseRevision: args.baseRevision } : {}
      });
      return { ok: true, ...result };
    }
  };
  const migrateTool = {
    name: "canvas_migrate",
    description: "Upgrade a stored canvas document to the current format version and report what changed.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "document name; defaults to the current document" },
        dryRun: { type: "boolean", description: "report changes without writing" }
      },
      additionalProperties: false
    },
    output: { schema: { type: "object", additionalProperties: true }, render: (_args, value) => renderJson(value) },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec);
      const name = defaultName2(sessionId, args?.name);
      await ensureScaffold(cwd, store);
      const current = await readDoc(cwd, name);
      const parsed = JSON.parse(current.raw);
      const migrated = migrateDoc(parsed);
      const changed = migrated.changes.length > 0 || migrated.from !== migrated.to;
      if (!changed || args?.dryRun) {
        return { ok: true, name, from: migrated.from, to: migrated.to, changes: migrated.changes, written: false };
      }
      const result = await writeDoc(ctx, store, cwd, name, migrated.doc, { source: "migrate" });
      return { ok: true, name, from: migrated.from, to: migrated.to, changes: migrated.changes, written: true, revision: result.revision };
    }
  };
  const snapshotTool = {
    name: "canvas_snapshot",
    description: `Render a node or the whole page in the open canvas tab and save a PNG under ${CANVAS_DIR}/exports/. Read the returned path with the image tool to actually see the design.`,
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "document name; defaults to the current document" },
        nodeId: { type: "string", description: "node to render; omit for the whole page" },
        scale: { type: "number", description: "pixel scale, 0.5 to 4 (default 2)" }
      },
      additionalProperties: false
    },
    output: { schema: { type: "object", additionalProperties: true }, render: (_args, value) => renderJson(value) },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec);
      const name = defaultName2(sessionId, args?.name);
      const pending = await requestSnapshot(store, cwd, name, {
        ...typeof args?.nodeId === "string" ? { nodeId: args.nodeId } : {},
        ...args?.scale !== void 0 ? { scale: args.scale } : {}
      });
      const { buffer, nodeId } = await pending.settled;
      const root = canvasRoot(cwd);
      await mkdir8(join8(root, "exports"), { recursive: true });
      const suffix = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      const target = assertInside2(root, join8(root, "exports", `snapshot-${name}-${suffix}.png`));
      await writeFile8(target, buffer);
      return {
        ok: true,
        name,
        nodeId: nodeId ?? null,
        path: relativePath(cwd, target),
        bytes: buffer.byteLength,
        hint: "Read this PNG with the image tool to inspect the rendered design."
      };
    }
  };
  const view = {
    name: "canvas_interaction_view",
    description: "Inspect or navigate interaction focus in the live canvas. Focus takes a placement node ID; reveal takes a related page ID or a wire node ID. Return goes back to the original placement.",
    parameters: {
      type: "object",
      required: ["action"],
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        action: { type: "string", enum: ["status", "focus", "reveal", "return", "clear"] },
        nodeId: { type: "string" }
      }
    },
    output: { schema: { type: "object", additionalProperties: true }, render: (_args, value) => renderJson(value) },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec);
      return store.interactionView.request(store.sse, docFile(cwd, defaultName2(sessionId, args.name)), sessionId, args.action, args.nodeId);
    }
  };
  const figmaTool = createFigmaTool(figmaDeps(ctx, store));
  return [read, view, write, edit, comment, template, audit, image, exportTool, importTool, figmaTool, migrateTool, snapshotTool];
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
    store.interactionView.dispose();
    store.bridge.dispose();
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
