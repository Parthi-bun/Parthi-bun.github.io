const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem("pi." + k);
      return v === null ? d : JSON.parse(v);
    } catch (e) {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem("pi." + k, JSON.stringify(v));
    } catch (e) {}
  },
};

/* Accent choices are the colours of competition weight plates. */
const ACCENTS = [
  ["15 kg yellow", "#f2c230"],
  ["25 kg red", "#ec4f4a"],
  ["20 kg blue", "#5b8def"],
  ["10 kg green", "#3fb56b"],
  ["5 kg white", "#ededef"],
];
const Acc = { hex: "#f2c230", rgb: [242, 194, 48] };
const rgba = (a) => `rgba(${Acc.rgb[0]},${Acc.rgb[1]},${Acc.rgb[2]},${a})`;

function setAccent(hex, save = true) {
  const n = parseInt(hex.slice(1), 16);
  Acc.hex = hex;
  Acc.rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  document.documentElement.style.setProperty("--acc", Acc.rgb.join(" "));
  if (save) store.set("accent", hex);
  document.dispatchEvent(new CustomEvent("accent"));
}

/* One animation loop. Each entry only runs while its element is on screen. */
const tickers = new Set();
function addTick(el, fn) {
  const t = { fn, on: !el };
  tickers.add(t);
  if (el) new IntersectionObserver(([e]) => { t.on = e.isIntersecting; }, { rootMargin: "60px" }).observe(el);
  return t;
}
let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (!document.hidden) for (const t of tickers) if (t.on) t.fn(dt, now / 1000);
  requestAnimationFrame(frame);
}

function fit(cv, onSize) {
  const s = { w: 1, h: 1, dpr: 1, ctx: cv.getContext("2d") };
  let ready = false;
  const r = () => {
    const b = cv.getBoundingClientRect();
    if (!b.width || !b.height) return;
    s.dpr = Math.min(devicePixelRatio || 1, 2);
    s.w = b.width;
    s.h = b.height;
    cv.width = Math.round(s.w * s.dpr);
    cv.height = Math.round(s.h * s.dpr);
    s.ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    if (ready && onSize) onSize(s);
  };
  r();
  ready = true;
  new ResizeObserver(r).observe(cv);
  return s;
}
const evPos = (e, el) => {
  const b = el.getBoundingClientRect();
  return { x: e.clientX - b.left, y: e.clientY - b.top };
};

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("on"), 2000);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {}
    ta.remove();
    return ok;
  }
}

/* Opt-in interface sounds, off until the visitor turns them on. */
const Sound = {
  on: false,
  ctx: null,
  toggle(v) {
    this.on = v;
    if (v && !this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (C) this.ctx = new C();
    }
  },
  blip(f = 660, d = 0.04, g = 0.03, type = "square") {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const a = this.ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    a.gain.setValueAtTime(g, t);
    a.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(a).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + d);
  },
};

/* Small control builders shared by the working models. */
function shell(el, title, tag) {
  el.innerHTML = `<div class="toy-h"><span class="label">${title}</span><span class="label">${tag}</span></div><div class="toy-b"></div>`;
  return $(".toy-b", el);
}
function seg(options, value, onChange, label) {
  const w = document.createElement("div");
  w.className = "seg";
  w.setAttribute("role", "group");
  if (label) w.setAttribute("aria-label", label);
  const set = (v, fire) => {
    value = v;
    $$("button", w).forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === String(v)));
    if (fire) onChange(v);
  };
  for (const o of options) {
    const [v, t] = Array.isArray(o) ? o : [o, o];
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.v = v;
    b.textContent = t;
    b.addEventListener("click", () => {
      Sound.blip(520);
      set(v, true);
    });
    w.append(b);
  }
  set(value, false);
  w.set = set;
  return w;
}
let rngId = 0;
function slider(label, min, max, step, val, fmt, onInput) {
  const w = document.createElement("div");
  const id = "r" + ++rngId;
  w.className = "rng";
  w.innerHTML = `<label class="rng-h" for="${id}"><span>${label}</span><output></output></label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}">`;
  const i = $("input", w);
  const o = $("output", w);
  const show = () => (o.textContent = fmt(+i.value));
  i.addEventListener("input", () => {
    show();
    onInput(+i.value);
  });
  show();
  w.input = i;
  w.setValue = (v) => {
    i.value = v;
    show();
  };
  return w;
}
function btn(text, onClick, cls = "") {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "btn sm " + cls;
  b.textContent = text;
  b.addEventListener("click", (e) => {
    Sound.blip(740);
    onClick(e);
  });
  return b;
}
function meters(list) {
  const w = document.createElement("div");
  w.className = "meters";
  w.innerHTML = list.map(([k, l]) => `<div class="meter"><span>${l}</span><b data-m="${k}">0</b></div>`).join("");
  const map = {};
  $$("[data-m]", w).forEach((b) => (map[b.dataset.m] = b));
  w.set = (k, v, bad) => {
    const s = String(v);
    if (map[k].textContent !== s) map[k].textContent = s;
    map[k].classList.toggle("bad", !!bad);
  };
  return w;
}
function roundRectless(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
}
