/* Page furniture: mode chips, control dock, command menu, headline, stats and footer. */

function initChips() {
  const w = $("#mode-chips");
  MODES.forEach((name, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = name;
    b.setAttribute("aria-pressed", i === Field.mode);
    b.addEventListener("click", () => {
      Sound.blip(420 + i * 90);
      Field.setMode(i);
    });
    w.append(b);
  });
  Field.onMode((m) => {
    $$(".chip", w).forEach((b, i) => b.setAttribute("aria-pressed", i === m));
    $("#dock-l").textContent = "Background: " + MODES[m];
  });
  $("#dock-l").textContent = "Background: " + MODES[Field.mode];
}

function initDock() {
  const dock = $("#dock"), p = $("#dock-p"), b = $("#dock-b");
  const setOpen = (v) => {
    p.hidden = !v;
    dock.classList.toggle("open", v);
    b.setAttribute("aria-expanded", v);
  };
  b.addEventListener("click", () => setOpen(p.hidden));

  const modeSeg = seg(MODES.map((n, i) => [i, n]), Field.mode, (v) => Field.setMode(+v), "Background style");
  Field.onMode((m) => modeSeg.set(m));
  const density = slider("Density", 0.6, 2, 0.05, 1, (v) => v.toFixed(2), (v) => {
    Field.density = v;
    Field.touch();
  });
  const force = slider("Force", 0.2, 2.4, 0.05, 1, (v) => v.toFixed(2), (v) => {
    Field.force = v;
    Field.touch();
  });
  const sw = document.createElement("div");
  sw.className = "sw";
  sw.setAttribute("role", "group");
  sw.setAttribute("aria-label", "Accent colour, in weight plate colours");
  const current = store.get("accent", ACCENTS[0][1]);
  ACCENTS.forEach(([n, hex]) => {
    const c = document.createElement("button");
    c.type = "button";
    c.style.setProperty("--c", hex);
    c.setAttribute("aria-label", n);
    c.title = n;
    c.setAttribute("aria-pressed", hex === current);
    c.addEventListener("click", () => applyAccent(hex));
    sw.append(c);
  });
  const acts = document.createElement("div");
  acts.className = "dock-a";
  const pause = btn("Pause", () => {
    Field.paused = !Field.paused;
    pause.textContent = Field.paused ? "Resume" : "Pause";
  });
  const sound = btn("Sound off", () => {
    Sound.toggle(!Sound.on);
    sound.textContent = Sound.on ? "Sound on" : "Sound off";
    Sound.blip(880);
  });
  const reset = btn("Reset", () => {
    Field.reset();
    density.setValue(1);
    force.setValue(1);
    applyAccent(ACCENTS[0][1]);
    pause.textContent = "Pause";
    toast("Background reset.");
  });
  acts.append(pause, sound, reset);
  const lab = (t) => {
    const l = document.createElement("span");
    l.className = "label";
    l.textContent = t;
    return l;
  };
  const fps = lab("");
  addTick(p, () => (fps.textContent = `${Field.fps} fps`));
  const head = document.createElement("div");
  head.style.cssText = "display:flex;justify-content:space-between;gap:8px";
  head.append(lab("Background"), fps);
  p.append(head, modeSeg, density, force, lab("Accent, in weight plate colours"), sw, acts);
  Dock.density = density;
  Dock.force = force;
  Dock.open = setOpen;
}
const Dock = {};

function applyAccent(hex) {
  setAccent(hex);
  $$(".sw button").forEach((b) => b.setAttribute("aria-pressed", getComputedStyle(b).getPropertyValue("--c").trim() === hex));
}

function initPalette() {
  const pal = $("#pal"), input = $("#pal-i"), list = $("#pal-l");
  const go = (id) => () => $(id).scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
  const items = [
    ["Experience", "Section", go("#experience")],
    ["Projects", "Section", go("#work")],
    ["Earlier projects", "Section", go("#earlier")],
    ["Skills", "Section", go("#skills")],
    ["About", "Section", go("#about")],
    ["Contact", "Section", go("#contact")],
    ["Barrier-Free Resharding", "Project", go("#p-reshard")],
    ["AHRAG: Secure Hybrid Retrieval", "Project", go("#p-ahrag")],
    ["Document Summary Assistant", "Project", go("#p-summary")],
    ["Multithreaded Java HTTP Server", "Project", go("#p-http")],
    ["AI Resume Analyzer", "Project", go("#p-analyzer")],
    ["Finance Tracker", "Project", go("#p-finance")],
    ["Huffman File Compressor", "Project", go("#p-huffman")],
    ...MODES.map((m, i) => [`Background: ${m}`, "Background", () => Field.setMode(i)]),
    ...ACCENTS.map(([n, hex]) => [`Accent: ${n}`, "Colour", () => applyAccent(hex)]),
    ["Send a pulse across the page", "Background", () => Field.pulse(innerWidth / 2, innerHeight / 2)],
    ["Start a glider gun", "Background", () => Field.gun()],
    ["Copy email address", "Contact", () => copyEmail()],
    ["Open GitHub", "Link", () => window.open("https://github.com/parthi-bun", "_blank", "noopener")],
    ["Open the background controls", "Background", () => Dock.open(true)],
  ];
  let view = items, on = 0;
  const render = () => {
    if (!view.length) {
      list.innerHTML = `<p class="pal-e">Nothing matches that. Try "projects" or "background".</p>`;
      return;
    }
    list.innerHTML = view.map(([t, k], i) => `<button type="button" role="option" aria-selected="${i === on}" class="${i === on ? "on" : ""}" data-i="${i}"><span>${esc(t)}</span><span>${k}</span></button>`).join("");
    const a = $(".on", list);
    if (a) a.scrollIntoView({ block: "nearest" });
  };
  const open = () => {
    pal.hidden = false;
    input.value = "";
    view = items;
    on = 0;
    render();
    input.focus();
  };
  const close = () => {
    pal.hidden = true;
    $("#pal-open").focus();
  };
  const run = (i) => {
    const it = view[i];
    if (!it) return;
    close();
    it[2]();
    Sound.blip(700);
  };
  $("#pal-open").addEventListener("click", open);
  $("#pal-key").textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";
  pal.addEventListener("click", (e) => {
    if (e.target === pal) close();
    const b = e.target.closest("button[data-i]");
    if (b) run(+b.dataset.i);
  });
  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    view = items.filter(([t, k]) => (t + " " + k).toLowerCase().includes(q));
    on = 0;
    render();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (view.length) on = (on + (e.key === "ArrowDown" ? 1 : view.length - 1)) % view.length;
      render();
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(on);
    }
  });
  const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let kon = 0;
  addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      pal.hidden ? open() : close();
      return;
    }
    if (e.key === "Escape" && !pal.hidden) return close();
    const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (typing || !pal.hidden) return;
    if (e.key === KONAMI[kon]) {
      kon++;
      if (kon === KONAMI.length) {
        kon = 0;
        Field.gun();
        toast("Glider gun armed.");
      }
    } else kon = e.key === KONAMI[0] ? 1 : 0;
    if (/^[1-5]$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) Field.setMode(+e.key - 1);
    if (e.key === "/") {
      e.preventDefault();
      open();
    }
  });
}

function copyEmail() {
  const email = $("[data-email]").dataset.email;
  copyText(email).then((ok) => toast(ok ? "Email address copied." : `Couldn't copy. The address is ${email}`));
}

/* Weight range of the headline typeface. Letters near the pointer get heavier, with a thin ring around them. */
const HEAD_W = { base: 600, min: 180, max: 700 };

function initHeadline() {
  const h = $("#title");
  const chars = [];
  $$("[data-split]", h).forEach((ln) => {
    const t = ln.textContent;
    ln.textContent = "";
    for (const c of t) {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = c === " " ? " " : c;
      ln.append(s);
      chars.push({ s, w: HEAD_W.base });
    }
  });
  if (REDUCED || !matchMedia("(hover: hover)").matches) return;
  let px = -9999, py = -9999;
  const measure = () => chars.forEach((c) => {
    const r = c.s.getBoundingClientRect();
    c.x = r.left + r.width / 2;
    c.y = r.top + r.height / 2;
  });
  addEventListener("pointermove", (e) => {
    px = e.clientX;
    py = e.clientY;
  }, { passive: true });
  let t = 0;
  addTick(h, (dt) => {
    t += dt;
    if (t > 0.25) {
      t = 0;
      measure();
    }
    for (const c of chars) {
      if (c.x === undefined) continue;
      const d = Math.hypot(px - c.x, py - c.y);
      const target = HEAD_W.base + (HEAD_W.max - HEAD_W.base) * Math.exp(-(d * d) / 12000) - (HEAD_W.base - HEAD_W.min) * Math.exp(-((d - 150) * (d - 150)) / 5200);
      c.w += (target - c.w) * 0.16;
      const v = clamp(Math.round(c.w / 10) * 10, HEAD_W.min, HEAD_W.max);
      if (v !== c.v) {
        c.v = v;
        c.s.style.fontWeight = v;
      }
    }
  });
}

function initScroll() {
  const bar = $("#progress");
  const links = $$(".nav-links a");
  const secs = links.map((a) => $(a.getAttribute("href")));
  const on = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    let cur = -1;
    secs.forEach((s, i) => {
      if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = i;
    });
    links.forEach((a, i) => a.classList.toggle("on", i === cur));
  };
  addEventListener("scroll", on, { passive: true });
  addEventListener("resize", on);
  on();
  const nav = $(".nav");
  new IntersectionObserver(([e]) => nav.classList.toggle("past", !e.isIntersecting), { rootMargin: "-72px 0px 0px 0px" }).observe($("#title"));
}

function initFooter() {
  const clock = $("#clock");
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const tick = () => (clock.textContent = `Kumbakonam ${fmt.format(new Date())} IST`);
  tick();
  setInterval(tick, 1000);

  const big = $("#bigname");
  const text = big.textContent;
  big.textContent = "";
  const letters = [...text].map((c) => {
    const s = document.createElement("span");
    s.textContent = c;
    big.append(s);
    return { s, y: 0, r: 0 };
  });
  if (REDUCED) return;
  let px = -9999, py = -9999;
  addEventListener("pointermove", (e) => {
    px = e.clientX;
    py = e.clientY;
  }, { passive: true });
  addTick(big, () => {
    for (const l of letters) {
      const b = l.s.getBoundingClientRect();
      const dx = px - (b.left + b.width / 2), dy = py - (b.top + b.height / 2);
      const f = Math.exp(-(dx * dx + dy * dy) / 26000);
      l.y += (-f * 28 - l.y) * 0.14;
      l.r += (-Math.sign(dx) * f * 9 - l.r) * 0.14;
      l.s.style.transform = `translateY(${l.y.toFixed(1)}px) rotate(${l.r.toFixed(2)}deg)`;
      l.s.style.webkitTextStrokeColor = f > 0.2 ? Acc.hex : "";
    }
  });
}

function initSkillList() {
  $$(".sk button").forEach((b) => {
    b.addEventListener("click", () => document.dispatchEvent(new CustomEvent("skill", { detail: b.textContent })));
  });
  document.addEventListener("skillstate", (e) => {
    $$(".sk button").forEach((b) => {
      const on = b.textContent === e.detail;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on);
    });
  });
}
