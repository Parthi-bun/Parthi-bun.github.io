/* The live background: flocks of pixel creatures drawn on a coarse grid.
   Each creature is a small procedural model sampled once per grid cell, so it stays
   blocky at any size or angle. Fine parts are drawn with keyboard characters. */
const MODES = ["Butterfly", "Jellyfish", "Dragonfly", "Koi", "Frog", "Crane", "Crab"];
/* A soft tint per creature, used for its button and for the page accent. */
const MODE_DOT = ["#8fbcf2", "#dd9ae6", "#8fd9ae", "#f2b08a", "#a9d48a", "#d4d4dc", "#f09a86"];
const DEFAULT_MODE = 0;
const GLYPHS = ["/", "\\", "-", "|", "(", ")", "{", "}", "0", "$", ":", ".", "v", "'"];

/* Sample result, reused for every cell: k is 0 nothing, 1 tile, 2 character, 3 eye, 4 dot. */
const crO = { k: 0, r: 0, g: 0, b: 0, a: 0, ch: 0 };
function crTile(r, g, b, a) {
  crO.k = 1;
  crO.r = r;
  crO.g = g;
  crO.b = b;
  crO.a = a;
}
function crGlyph(ch, r, g, b, a) {
  crO.k = 2;
  crO.ch = ch;
  crO.r = r;
  crO.g = g;
  crO.b = b;
  crO.a = a;
}
function crMark(k) {
  crO.k = k;
  crO.r = crO.g = crO.b = 240;
  crO.a = 1;
}
function crHash(x, y, s) {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function crSeg(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay;
  let t = ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy);
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const dx = px - ax - vx * t, dy = py - ay - vy * t;
  return Math.sqrt(dx * dx + dy * dy);
}
/* Picks the stroke character that best matches a direction on screen. */
function crDir(ang) {
  const t = ((ang % Math.PI) + Math.PI) % Math.PI;
  if (t < 0.3927 || t > 2.7489) return 2;
  if (t < 1.1781) return 1;
  if (t < 1.9635) return 3;
  return 0;
}
const crDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

/* Models. lx runs from tail to head, ly across the body, both in body lengths. S is cells per body length. */
function crButterfly(lx, ly, c, S) {
  const ay = Math.abs(ly), half = 0.55 / S, s = 0.5 + 0.5 * Math.sin(c.ph), f = 0.07 + 0.93 * (1 - s * s * s);
  if (ay < half && lx > -0.34 && lx < 0.36) return f < 0.3 ? crTile(72, 146, 232, 1) : crTile(26, 44, 92, 1);
  const a1 = (lx - 0.22) / 0.33, b1 = (ay - 0.5 * f) / (0.44 * f), d1 = Math.pow(a1 * a1, 1.5) + Math.pow(b1 * b1, 1.5);
  const a2 = (lx + 0.36) / 0.25, b2 = (ay - 0.36 * f) / (0.3 * f), d2 = Math.pow(a2 * a2, 1.5) + Math.pow(b2 * b2, 1.5);
  const d = d1 < d2 ? d1 : d2;
  if (d <= 1) {
    const h = crHash(Math.round(lx * S), Math.round(ly * S), c.id);
    if (h > 0.93) return crTile(226, 240, 255, 1);
    const n = d + (h - 0.5) * 0.3;
    if (n < 0.3) return crTile(150, 206, 255, 1);
    if (n < 0.66) return crTile(84, 160, 242, 1);
    if (n < 0.9) return crTile(52, 116, 206, 1);
    return crTile(36, 80, 156, 0.9);
  }
  if (lx > 0.36 && lx < 0.8 && Math.abs(ay - 0.04 - (lx - 0.36) * 0.62) < half) {
    if (lx > 0.8 - 1.1 / S) return crGlyph(8, 190, 215, 245, 0.9);
    crGlyph(crDir(c.a + (ly < 0 ? -0.55 : 0.55)), 150, 185, 225, 0.8);
  }
}

function crJelly(lx, ly, c, S) {
  const ay = Math.abs(ly), p = Math.sin(c.ph), ry = 0.46 * (1 - 0.1 * p), len = 0.56 * (1 + 0.08 * p);
  const qi = Math.round(lx * S), qj = Math.round(ly * S);
  if (lx >= -0.12) {
    const a = (lx + 0.12) / len, b = ay / ry, d = a * a + b * b;
    if (d > 1) return;
    const h = crHash(qi, qj, c.id), n = d + ly * 0.5 - lx * 0.25 + (h - 0.5) * 0.25;
    if (h > 0.94 || n < 0.12) return crTile(248, 190, 246, 1);
    if (n < 0.55) return crTile(214, 60, 206, 1);
    if (n < 0.9) return crTile(160, 34, 158, 1);
    return crTile(104, 24, 110, 0.9);
  }
  if (lx >= -0.26) {
    if (ay < ry && (qj & 1) === 0) crTile(150, 32, 150, 0.9);
    return;
  }
  const u = (-lx - 0.26) / 2.1;
  if (u > 1) return;
  const sway = 0.1 * Math.sin(lx * 4.5 + c.ph * 1.2) * (0.3 + u);
  if (Math.abs(ly - sway) > ry * (1 - 0.35 * u)) return;
  const h = crHash(qi, qj, c.id + 7);
  if (h > 0.62 * (1 - 0.6 * u)) return;
  crGlyph([4, 5, 6, 7, 2, 9, 10][((h * 977) | 0) % 7], 214, 178, 222, 0.8 * (1 - u));
}

function crDragonfly(lx, ly, c, S) {
  const ay = Math.abs(ly), half = 0.55 / S;
  if (Math.abs(lx - 0.52) < half && Math.abs(ay - 0.15) < half) return crMark(3);
  if (lx > 0.3 && lx < 0.58 && ay < 0.13) return crTile(60, 200, 110, 1);
  const qi = Math.round(lx * S), qj = Math.round(ly * S), h = crHash(qi, qj, c.id);
  const ta = (lx - 0.12) / 0.25, tb = ay / 0.16, td = ta * ta + tb * tb;
  if (td <= 1) {
    if (h > 0.85) return crTile(205, 255, 215, 1);
    return td < 0.5 ? crTile(70, 225, 125, 1) : crTile(36, 150, 80, 1);
  }
  if (lx <= -0.05 && lx > -1.55 && ay < half) {
    const fade = 1 - 0.5 * (-lx / 1.55);
    return Math.floor(-lx * S) & 1 ? crTile(74, 222, 128, fade) : crTile(30, 112, 64, fade);
  }
  const fa = (lx - 0.27 - 0.12 * ay) / 0.14, fb = (ay - 0.62) / 0.5, ha = (lx + 0.02 + 0.22 * ay) / 0.16, hb = (ay - 0.56) / 0.46;
  const fore = fa * fa + fb * fb <= 1;
  if (!fore && ha * ha + hb * hb > 1) return;
  const b = fore ? fb : hb, a = fore ? fa : ha;
  if (b > 0.82 && Math.abs(a) < 0.5) return crTile(220, 70, 84, 0.9);
  if (h > 0.7) return;
  const beat = 0.45 + 0.55 * crHash(qi, qj, c.ph | 0);
  crGlyph(h < 0.45 ? crDir(c.a + (ly < 0 ? -1.35 : 1.35)) : 10, 220, 232, 226, 0.75 * beat);
}

function crKoi(lx, ly, c, S) {
  if (lx > 0.58 || lx < -1.1) return;
  const y = ly - c.amp * Math.sin(lx * 3.2 - c.ph) * (0.6 - lx), ay = Math.abs(y), half = 0.55 / S;
  const qi = Math.round(lx * S), qj = Math.round(y * S), h = crHash(qi, qj, c.id);
  if (lx < -0.75) {
    const u = (-0.75 - lx) / 0.35;
    if (ay >= 0.05 + u * 0.3) return;
    return h < 0.72 ? crTile(165, 165, 172, 0.6 * (1 - 0.5 * u)) : crGlyph(12, 190, 190, 196, 0.7);
  }
  let w;
  if (lx > 0.2) {
    const t = (lx - 0.2) / 0.38;
    w = 0.2 * Math.sqrt(Math.max(0, 1 - t * t));
  } else w = 0.2 * (1 - (0.72 * (0.2 - lx)) / 0.95);
  if (ay < w || (ay < half && lx < 0.5)) {
    const pt = crHash(Math.floor((lx + 1.2) * 3.1), y > 0 ? 1 : 0, c.id);
    let r, g, b;
    if (c.v === 0) pt > 0.5 ? ((r = 214), (g = 44), (b = 44)) : ((r = 238), (g = 238), (b = 240));
    else if (c.v === 1) pt > 0.62 ? ((r = 168), (g = 84), (b = 30)) : ((r = 236), (g = 134), (b = 44));
    else if (c.v === 2) pt > 0.7 ? ((r = 255), (g = 232), (b = 150)) : ((r = 242), (g = 196), (b = 56));
    else pt > 0.66 ? ((r = 52), (g = 52), (b = 58)) : pt > 0.33 ? ((r = 214), (g = 44), (b = 44)) : ((r = 238), (g = 238), (b = 240));
    const k = h > 0.92 ? 1.12 : ay > w * 0.7 ? 0.78 : 1;
    return crTile(Math.min(255, r * k), Math.min(255, g * k), Math.min(255, b * k), 1);
  }
  if (lx > 0.36 && lx < 0.5 && ay < w + 1.1 / S) return crMark(4);
  if (lx > 0.05 && lx < 0.3 && ay < w + 0.16) crTile(150, 150, 158, 0.55);
}

function crFrog(lx, ly, c, S) {
  const ay = Math.abs(ly), j = c.j, half = 0.55 / S, hx = 0.36 + 0.3 * j, sg = ly < 0 ? -1 : 1;
  if (Math.abs(lx - hx - 0.1) < half && Math.abs(ay - 0.2) < half) return crMark(3);
  const h = crHash(Math.round(lx * S), Math.round(ly * S), c.id);
  const a1 = (lx - hx) / 0.24, b1 = ay / (0.27 - 0.05 * j), a2 = lx / (0.42 + 0.34 * j), b2 = ay / (0.36 - 0.14 * j);
  const d = Math.min(a1 * a1 + b1 * b1, a2 * a2 + b2 * b2);
  if (d <= 1) {
    if (h > 0.9) return crTile(40, 100, 40, 1);
    const n = d + (h - 0.5) * 0.3;
    if (n < 0.3) return crTile(196, 228, 112, 1);
    return n < 0.7 ? crTile(98, 190, 64, 1) : crTile(52, 132, 44, 1);
  }
  const ex = -0.44 - 1.25 * j, ey = 0.52 - 0.24 * j;
  if (crSeg(lx, ay, -0.18 - 0.4 * j, 0.3 - 0.14 * j, ex, ey) < 0.13 - 0.06 * j) return crTile(70, 160, 56, 1);
  const fx = 0.4 + 0.42 * j, fy = 0.48 - 0.2 * j;
  if (crSeg(lx, ay, 0.2 + 0.2 * j, 0.26 - 0.06 * j, fx, fy) < 0.065) return crTile(70, 160, 56, 1);
  const t1 = Math.hypot(lx - ex + 0.1, ay - ey - 0.06), t2 = Math.hypot(lx - fx - 0.08, ay - fy - 0.05);
  if ((t1 < 0.17 || t2 < 0.13) && h < 0.6) crGlyph(crDir(c.a + sg * (t1 < 0.17 ? 2.5 : 0.7)), 150, 200, 130, 0.8);
}

function crCrane(lx, ly, c, S) {
  const ay = Math.abs(ly), half = 0.55 / S, w = 0.6 + 0.4 * (0.5 + 0.5 * Math.cos(c.ph));
  if (ay < half) {
    if (lx > 1.06 && lx < 1.24) return crGlyph(crDir(c.a), 200, 200, 206, 0.8);
    if (lx > 0.96 && lx <= 1.06) return crTile(240, 240, 243, 1);
    if (lx > 0.86 && lx <= 0.96) return crTile(228, 52, 62, 1);
    if (lx > 0.26 && lx <= 0.86) return Math.floor(lx * S) & 1 ? crTile(232, 232, 236, 1) : crTile(150, 150, 158, 1);
    if (lx < -0.34 && lx > -1) {
      if ((Math.floor(-lx * S) & 1) === 0) crGlyph(crDir(c.a), 170, 170, 176, 0.55);
      return;
    }
  }
  const ba = lx / 0.34, bb = ay / 0.12;
  if (ba * ba + bb * bb <= 1) return crTile(240, 240, 243, 1);
  if (lx > -0.46 && lx < -0.3 && ay < 0.14) return crTile(170, 170, 178, 1);
  const u = ay / (0.98 * w);
  if (u > 1) return;
  const hc = 0.21 * (1 - 0.5 * u) + 0.03, dx = lx - 0.06 + 0.38 * u * u;
  if (Math.abs(dx) >= hc) return;
  if (u > 0.55 && dx < -hc * 0.35 && Math.round(ly * S) & 1) return;
  if (u > 0.8) return crTile(92, 92, 104, 1);
  if (u > 0.6 || dx < -hc * 0.5) return crTile(186, 186, 194, 1);
  crHash(Math.round(lx * S), Math.round(ly * S), c.id) > 0.9 ? crTile(255, 255, 255, 1) : crTile(232, 232, 236, 1);
}

function crCrab(lx, ly, c, S) {
  const ay = Math.abs(ly), sg = ly < 0 ? -1 : 1, half = 0.55 / S;
  if (Math.abs(lx - 0.37) < half && Math.abs(ay - 0.13) < half) return crMark(4);
  const h = crHash(Math.round(lx * S), Math.round(ly * S), c.id);
  const a = lx / 0.3, b = ay / 0.44, d = a * a + b * b;
  if (d <= 1) {
    if (h > 0.92) return crTile(255, 205, 180, 1);
    const n = d + (h - 0.5) * 0.3 - lx * 0.3;
    if (n < 0.35) return crTile(244, 150, 120, 1);
    return n < 0.75 ? crTile(226, 96, 70, 1) : crTile(168, 56, 46, 1);
  }
  if (crSeg(lx, ay, 0.16, 0.4, 0.5, 0.52) < 0.075) return crTile(200, 74, 56, 1);
  const ca = (lx - 0.64) / 0.16, cb = (ay - 0.46) / 0.11;
  if (ca * ca + cb * cb <= 1) {
    if (lx > 0.62 && Math.abs(ay - 0.46) < 0.02 + 0.03 * (0.5 + 0.5 * Math.sin(c.ph * 0.7 + sg))) return;
    return crTile(236, 110, 84, 1);
  }
  for (let i = 0; i < 3; i++) {
    const x0 = 0.08 - i * 0.17, e = 0.08 * Math.sin(c.lp + i * 2.1 + (sg > 0 ? 0 : Math.PI));
    if (crSeg(lx, ay, x0, 0.4, x0 - 0.06 + e * 0.6, 0.78 + e * 0.5) < 0.055) return crTile(190, 70, 54, 1);
  }
  if (c.mv < 0.05) return;
  const t = -ly * c.sd;
  if (t < 0.85 || t > 2 || Math.abs(lx) > 0.4) return;
  const u = (t - 0.85) / 1.15;
  if (h < 0.4 * (1 - u)) crGlyph([0, 10, 11][((h * 991) | 0) % 3], 170, 120, 108, 0.6 * c.mv * (1 - u));
}

/* ext is how far each model reaches forward, back and sideways. s0 to s1 is its size range in cells. */
const SPECIES = [
  { sample: crButterfly, ext: [0.85, 0.65, 1], s0: 4.2, s1: 11.5, n: 24, v: 46 },
  { sample: crJelly, ext: [0.6, 2.45, 0.65], s0: 5.5, s1: 12.5, n: 13, v: 62 },
  { sample: crDragonfly, ext: [0.65, 1.6, 1.2], s0: 5.5, s1: 12.5, n: 13, v: 16 },
  { sample: crKoi, ext: [0.65, 1.15, 0.55], s0: 6, s1: 13.5, n: 18, v: 46 },
  { sample: crFrog, ext: [1.15, 1.9, 0.8], s0: 4.8, s1: 10, n: 16, v: 520 },
  { sample: crCrane, ext: [1.28, 1.05, 1.05], s0: 5.5, s1: 12, n: 14, v: 78 },
  { sample: crCrab, ext: [0.9, 0.45, 2.05], s0: 4.2, s1: 8.5, n: 30, v: 34 },
];

const Field = {
  mode: store.get("creature", DEFAULT_MODE) % MODES.length,
  density: 1,
  force: 1,
  paused: false,
  listeners: [],
  onMode(fn) { this.listeners.push(fn); },
  pulse() {},
  setMode() {},
  reset() {},
  scatter() {},
  touch() {},
  fps: 60,
};

function initField() {
  const cv = $("#field");
  const ctx = cv.getContext("2d", { alpha: false });
  const BG = [8, 8, 10];
  let W = 1, H = 1, dpr = 1, cell = 11, cols = 1, rows = 1, sizeK = 1;
  let kind, cr, cg, cb, ca, cch, seen, touched, grid = null;
  let frameId = 1, nT = 0, dirty = true, fade = 0, perfK = 1, frames = 0, fpsT = 0, slow = 0;
  let herd = [];
  const school = -0.72;
  const M = { x: -999, y: -999, seen: -9, mouse: false };
  let clock = 0;

  function resize() {
    W = innerWidth;
    H = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    cell = W < 720 ? 9 : 11;
    sizeK = W < 720 ? 0.8 : 1;
    cols = Math.ceil(W / cell) + 1;
    rows = Math.ceil(H / cell) + 1;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    const n = cols * rows;
    kind = new Uint8Array(n);
    cr = new Uint8Array(n);
    cg = new Uint8Array(n);
    cb = new Uint8Array(n);
    ca = new Float32Array(n);
    cch = new Uint8Array(n);
    seen = new Uint32Array(n);
    touched = new Int32Array(n);
    const g = document.createElement("canvas");
    g.width = g.height = cell;
    const gx = g.getContext("2d");
    gx.fillStyle = "rgba(255,255,255,0.04)";
    gx.fillRect(0, 0, cell, 1);
    gx.fillRect(0, 0, 1, cell);
    grid = ctx.createPattern(g, "repeat");
    populate();
    dirty = true;
  }

  function spawn() {
    const sp = SPECIES[Field.mode], z = Math.pow(Math.random(), 1.35);
    const c = {
      id: (Math.random() * 1e6) | 0, x: rand(W), y: rand(H), py: 0, z,
      size: lerp(sp.s0, sp.s1, z) * sizeK, alpha: lerp(0.5, 1, Math.pow(z, 0.6)), par: 0.04 + 0.1 * z,
      a: rand(6.283), base: 0, spd: 0, v0: sp.v * (0.45 + 0.75 * z), vx: 0, vy: 0,
      ph: rand(6.283), fl: 1, t: rand(0.2, 2), st: 0, u: 0, j: 0, amp: 0.1, v: 0, sd: 1, mv: 0, lp: 0, turn: 0, to: 0,
    };
    const m = Field.mode;
    if (m === 0) c.fl = rand(5.5, 8.5);
    else if (m === 1) {
      c.base = c.a = school + rand(-0.3, 0.3);
      c.fl = rand(1.5, 2.2);
    } else if (m === 2) c.base = c.a = school + rand(-0.35, 0.35);
    else if (m === 3) c.v = pick([0, 0, 0, 1, 1, 2, 3]);
    else if (m === 4) c.to = c.a;
    else if (m === 5) {
      c.base = c.a = school + 0.25 + rand(-0.22, 0.22);
      c.fl = rand(3, 4.2);
    } else {
      c.sd = Math.random() < 0.5 ? -1 : 1;
      c.st = Math.random() < 0.5 ? 0 : 1;
    }
    return c;
  }
  function populate() {
    const sp = SPECIES[Field.mode], area = Math.pow(clamp((W * H) / (1440 * 900), 0.3, 1.7), 0.8);
    const want = clamp(Math.round(sp.n * area * Field.density * perfK), 5, 70);
    while (herd.length < want) herd.push(spawn());
    herd.length = want;
    herd.sort((a, c) => a.z - c.z);
  }

  function step(c, dt) {
    const m = Field.mode, k = Math.min(1, dt * 6);
    if (m === 0) {
      c.t -= dt;
      if (c.t <= 0) {
        c.t = rand(0.5, 1.6);
        c.turn = rand(-1.6, 1.6);
      }
      c.a += c.turn * dt;
      c.ph += dt * c.fl;
      c.spd = c.v0 * (0.7 + 0.3 * Math.cos(c.ph));
    } else if (m === 1) {
      c.ph += dt * c.fl;
      c.a += crDiff(c.base, c.a) * Math.min(1, dt * 0.5);
      c.spd = c.v0 * (0.8 + 0.3 * Math.sin(c.ph));
    } else if (m === 2) {
      c.ph += dt * 30;
      c.t -= dt;
      if (c.st === 0) {
        c.spd = lerp(c.spd, c.v0, Math.min(1, dt * 5));
        if (c.t <= 0) {
          c.st = 1;
          c.t = rand(0.18, 0.32);
        }
      } else {
        c.spd = lerp(c.spd, c.v0 * 16, Math.min(1, dt * 14));
        if (c.t <= 0) {
          c.st = 0;
          c.t = rand(2.5, 7);
          c.base = school + rand(-0.35, 0.35);
        }
      }
      c.a += crDiff(c.base, c.a) * k;
    } else if (m === 3) {
      c.t -= dt;
      if (c.t <= 0) {
        c.t = rand(1.5, 4);
        c.turn = rand(-0.7, 0.7);
      }
      c.a += c.turn * dt;
      c.ph += dt * (5 + c.spd * 0.04);
      c.amp = lerp(c.amp, 0.1 + 0.08 * Math.abs(c.turn), k);
      c.spd = c.v0;
    } else if (m === 4) {
      if (c.st === 0) {
        c.t -= dt;
        c.spd = 0;
        c.j = lerp(c.j, 0, Math.min(1, dt * 10));
        c.a += crDiff(c.to, c.a) * Math.min(1, dt * 5);
        if (c.t <= 0) {
          c.st = 1;
          c.u = 0;
        }
      } else {
        c.u += dt / 0.46;
        c.j = Math.sin(Math.PI * Math.min(1, c.u));
        c.spd = c.v0 * c.j;
        if (c.u >= 1) {
          c.st = 0;
          c.t = rand(0.8, 4.5);
          c.to = c.a + rand(-0.9, 0.9);
        }
      }
    } else if (m === 5) {
      c.ph += dt * c.fl;
      c.a += crDiff(c.base, c.a) * Math.min(1, dt * 0.8);
      c.spd = c.v0;
    } else {
      c.t -= dt;
      c.ph += dt * 2;
      if (c.st === 0) {
        c.mv = lerp(c.mv, 1, k);
        c.lp += dt * 15;
        if (c.t <= 0) {
          c.st = 1;
          c.t = rand(0.4, 1.6);
        }
      } else {
        c.mv = lerp(c.mv, 0, k);
        if (c.t <= 0) {
          c.st = 0;
          c.t = rand(0.6, 2);
          if (Math.random() < 0.4) c.sd = -c.sd;
          c.turn = rand(-0.5, 0.5);
        }
      }
      c.a += c.turn * dt * (c.st ? 1 : 0.15);
    }
    /* Keep away from the pointer. */
    if (clock - M.seen < 2.5) {
      const dx = c.x - M.x, dy = c.py - M.y, R = 150 * Field.force, d2 = dx * dx + dy * dy;
      if (d2 < R * R) {
        const d = Math.sqrt(d2) || 1, f = 1 - d / R;
        c.vx += (dx / d) * f * 900 * dt * Field.force;
        c.vy += (dy / d) * f * 900 * dt * Field.force;
        if (m === 4) {
          c.to = Math.atan2(dy, dx);
          if (c.st === 0) c.t = Math.min(c.t, 0.1);
        } else if (m !== 6) c.a += crDiff(Math.atan2(dy, dx), c.a) * Math.min(1, dt * 5 * f);
      }
    }
    let mx = Math.cos(c.a) * c.spd, my = Math.sin(c.a) * c.spd;
    if (m === 6) {
      mx = -Math.sin(c.a) * c.sd * c.v0 * c.mv;
      my = Math.cos(c.a) * c.sd * c.v0 * c.mv;
    }
    c.x += (mx + c.vx) * dt;
    c.y += (my + c.vy) * dt;
    const damp = Math.exp(-2.2 * dt);
    c.vx *= damp;
    c.vy *= damp;
    const e = SPECIES[m].ext, pad = Math.max(e[0], e[1], e[2]) * c.size * cell;
    if (c.x < -pad) c.x += W + 2 * pad;
    else if (c.x > W + pad) c.x -= W + 2 * pad;
  }
  function place(c) {
    const e = SPECIES[Field.mode].ext, pad = Math.max(e[0], e[1], e[2]) * c.size * cell, span = H + 2 * pad;
    c.py = ((((c.y - scrollY * c.par + pad) % span) + span) % span) - pad;
  }

  function stamp(c, dim) {
    const sp = SPECIES[Field.mode], S = c.size, cs = Math.cos(c.a), sn = Math.sin(c.a), cx = c.x / cell, cy = c.py / cell;
    const f = sp.ext[0] * S, bk = sp.ext[1] * S, sd = sp.ext[2] * S;
    const ex = Math.abs(cs) * Math.max(f, bk) + Math.abs(sn) * sd, ey = Math.abs(sn) * Math.max(f, bk) + Math.abs(cs) * sd;
    const x0 = Math.max(0, Math.floor(cx - ex)), x1 = Math.min(cols - 1, Math.ceil(cx + ex));
    const y0 = Math.max(0, Math.floor(cy - ey)), y1 = Math.min(rows - 1, Math.ceil(cy + ey));
    const al = c.alpha * dim, sample = sp.sample;
    for (let gy = y0; gy <= y1; gy++) {
      const dy = gy + 0.5 - cy;
      for (let gx = x0; gx <= x1; gx++) {
        const dx = gx + 0.5 - cx, lx = (dx * cs + dy * sn) / S;
        if (lx > sp.ext[0] || lx < -sp.ext[1]) continue;
        crO.k = 0;
        sample(lx, (-dx * sn + dy * cs) / S, c, S);
        if (!crO.k) continue;
        const i = gy * cols + gx, fresh = seen[i] !== frameId;
        if (!fresh && crO.k === 2 && kind[i] !== 2) continue;
        if (fresh) {
          seen[i] = frameId;
          touched[nT++] = i;
        }
        kind[i] = crO.k;
        cr[i] = crO.r;
        cg[i] = crO.g;
        cb[i] = crO.b;
        ca[i] = crO.a * al;
        cch[i] = crO.ch;
      }
    }
  }

  /* Cells are grouped by colour so each colour is filled once. */
  const tiles = new Map(), glyphs = new Map(), usedT = [], usedG = [];
  function bucket(map, used, key) {
    let b = map.get(key);
    if (!b) map.set(key, (b = { n: 0, cells: [] }));
    if (!b.n) used.push(key);
    return b;
  }
  const rgbOf = (key, k) => `rgb(${(((key >> 12) & 63) * 4 * k) | 0},${(((key >> 6) & 63) * 4 * k) | 0},${((key & 63) * 4 * k) | 0})`;

  function draw() {
    const dim = lerp(1, 0.5, clamp(scrollY / Math.max(1, H * 0.9), 0, 1)) * Math.min(1, fade);
    frameId++;
    nT = 0;
    for (const c of herd) {
      place(c);
      stamp(c, dim);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#08080a";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = grid;
    ctx.fillRect(0, 0, W, H);

    /* A soft dotted ring follows the mouse. */
    const idle = clock - M.seen;
    if (M.mouse && idle < 2.5) {
      const mx = Math.floor(M.x / cell), my = Math.floor(M.y / cell), R = 6.5, strength = Math.min(1, 2.5 - idle);
      ctx.fillStyle = "#9a9aa6";
      for (let y = -6; y <= 6; y++) {
        for (let x = -6; x <= 6; x++) {
          const d = Math.hypot(x, y);
          if (d > R) continue;
          const f = 1 - d / R, s = 1 + 2.4 * f;
          ctx.globalAlpha = (0.12 + 0.5 * f) * strength;
          ctx.fillRect((mx + x + 0.5) * cell - s / 2, (my + y + 0.5) * cell - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
    }

    const eyes = [], dots = [];
    for (let n = 0; n < nT; n++) {
      const i = touched[n], k = kind[i], a = ca[i];
      if (k === 3) {
        eyes.push(i);
        continue;
      }
      if (k === 4) {
        dots.push(i);
        continue;
      }
      const r = BG[0] + (cr[i] - BG[0]) * a, g = BG[1] + (cg[i] - BG[1]) * a, b = BG[2] + (cb[i] - BG[2]) * a;
      const key = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2);
      const bk = k === 1 ? bucket(tiles, usedT, key) : bucket(glyphs, usedG, (key << 4) | cch[i]);
      bk.cells[bk.n++] = i;
    }
    for (const key of usedT) {
      const bk = tiles.get(key);
      ctx.fillStyle = rgbOf(key, 0.74);
      ctx.beginPath();
      for (let n = 0; n < bk.n; n++) {
        const i = bk.cells[n];
        ctx.rect((i % cols) * cell + 0.5, ((i / cols) | 0) * cell + 0.5, cell - 1, cell - 1);
      }
      ctx.fill();
      ctx.fillStyle = rgbOf(key, 1);
      ctx.beginPath();
      for (let n = 0; n < bk.n; n++) {
        const i = bk.cells[n];
        ctx.rect((i % cols) * cell + 1.5, ((i / cols) | 0) * cell + 1.5, cell - 3, cell - 3);
      }
      ctx.fill();
      bk.n = 0;
    }
    usedT.length = 0;
    ctx.font = `500 ${cell}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const key of usedG) {
      const bk = glyphs.get(key), ch = GLYPHS[key & 15];
      ctx.fillStyle = rgbOf(key >> 4, 1);
      for (let n = 0; n < bk.n; n++) {
        const i = bk.cells[n];
        ctx.fillText(ch, ((i % cols) + 0.5) * cell, (((i / cols) | 0) + 0.55) * cell);
      }
      bk.n = 0;
    }
    usedG.length = 0;
    for (const i of eyes) {
      const x = (i % cols) * cell, y = ((i / cols) | 0) * cell;
      ctx.globalAlpha = Math.min(1, ca[i] + 0.15);
      ctx.fillStyle = "#f2f2f4";
      ctx.fillRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
      ctx.fillStyle = "#0b0b0e";
      ctx.fillRect(x + 3, y + 3, cell - 6, cell - 6);
    }
    for (const i of dots) {
      const x = ((i % cols) + 0.5) * cell, y = (((i / cols) | 0) + 0.5) * cell, s = Math.max(3, cell * 0.36);
      ctx.globalAlpha = Math.min(1, ca[i] + 0.15);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }

  /* Startles everything near a point. */
  function startle(x, y, reach) {
    const R = reach * Field.force, m = Field.mode;
    for (const c of herd) {
      const dx = c.x - x, dy = c.py - y, d = Math.hypot(dx, dy) || 1;
      if (d > R) continue;
      const f = 1 - d / R, away = Math.atan2(dy, dx);
      c.vx += (dx / d) * f * 720;
      c.vy += (dy / d) * f * 720;
      if (m === 4) {
        c.a = c.to = away + rand(-0.3, 0.3);
        c.st = 1;
        c.u = 0;
      } else if (m === 2) {
        c.a = c.base = away;
        c.st = 1;
        c.t = 0.3;
      } else if (m !== 6 && m !== 1 && m !== 5) c.a = away + rand(-0.4, 0.4);
    }
    dirty = true;
  }

  Field.pulse = (x = W / 2, y = H / 2) => startle(x, y, 420);
  Field.scatter = () => startle(W / 2, H / 2, Math.hypot(W, H));
  Field.setMode = (m) => {
    if (m === Field.mode) return;
    Field.mode = m;
    store.set("creature", m);
    setAccent(MODE_DOT[m]);
    herd = [];
    populate();
    fade = 0;
    dirty = true;
    Field.listeners.forEach((f) => f(m));
  };
  Field.reset = () => {
    Field.density = 1;
    Field.force = 1;
    Field.paused = false;
    perfK = 1;
    herd = [];
    if (Field.mode !== DEFAULT_MODE) Field.setMode(DEFAULT_MODE);
    else populate();
    fade = 0;
    dirty = true;
  };
  Field.touch = () => {
    populate();
    dirty = true;
  };

  const blocked = (e) => e.target && e.target.closest && e.target.closest("a,button,input,textarea,label,canvas,[data-nofield]");
  addEventListener("pointermove", (e) => {
    M.x = e.clientX;
    M.y = e.clientY;
    M.seen = clock;
    M.mouse = e.pointerType === "mouse";
    dirty = true;
  }, { passive: true });
  addEventListener("pointerdown", (e) => {
    if (blocked(e)) return;
    startle(e.clientX, e.clientY, 420);
    Sound.blip(180, 0.09, 0.03, "triangle");
  }, { passive: true });
  addEventListener("resize", resize);
  addEventListener("scroll", () => (dirty = true), { passive: true });
  document.fonts.ready.then(() => (dirty = true));

  resize();
  if (REDUCED) fade = 1;

  addTick(null, (dt) => {
    clock += dt;
    const moving = !REDUCED && !Field.paused;
    if (moving) {
      fade += dt * 2.5;
      for (const c of herd) step(c, dt);
    }
    if (moving || dirty || clock - M.seen < 2.6) {
      draw();
      dirty = false;
    }
    /* Thin the herd on slower machines. */
    frames++;
    fpsT += dt;
    if (fpsT >= 1) {
      Field.fps = Math.round(frames / fpsT);
      frames = 0;
      fpsT = 0;
      slow = Field.fps < 40 ? slow + 1 : 0;
      if (slow >= 2 && perfK > 0.4) {
        perfK *= 0.8;
        slow = 0;
        populate();
      }
    }
  });
}
