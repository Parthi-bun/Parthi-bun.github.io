/* Skill graph, barbell loader and the withheld research panel. */

function toySkills(el) {
  const b = shell(el, "Skill graph", "Drag the nodes");
  b.innerHTML = `<canvas class="cv" role="img" aria-label="A graph connecting each skill to the projects that used it"></canvas>`;
  const cv = $("canvas", b);
  const DATA = {
    Resharding: ["Go", "Concurrency", "Distributed systems"],
    AHRAG: ["Python", "Streamlit", "scikit-learn", "Pytest"],
    "Doc Summary": ["React", "TypeScript", "Vercel"],
    "HTTP Server": ["Java", "Concurrency", "Sockets"],
    "eValai app": ["Flutter"],
    "Resume Analyzer": ["Python", "FastAPI", "Streamlit", "spaCy", "scikit-learn", "Docker", "AWS EC2/S3", "Nginx"],
    "Finance Tracker": ["Java", "Spring Boot", "MySQL"],
    Huffman: ["Python"],
  };
  const FREE = ["JavaScript", "C", "C++", "Git"];
  const nodes = [], index = {}, edges = [];
  const node = (name, kind) => {
    if (index[name]) return index[name];
    const n = { name, kind, x: 0, y: 0, vx: 0, vy: 0, fixed: false };
    index[name] = n;
    nodes.push(n);
    return n;
  };
  for (const p in DATA) {
    const a = node(p, "project");
    DATA[p].forEach((k) => edges.push([a, node(k, "skill")]));
  }
  FREE.forEach((k) => node(k, "skill"));
  let hover = null, pinned = null, drag = null, energy = 1;
  const s = fit(cv, () => {
    energy = 1;
    draw();
  });
  nodes.forEach((n) => {
    n.x = s.w / 2 + rand(-120, 120);
    n.y = s.h / 2 + rand(-100, 100);
  });
  const neighbours = (n) => {
    const set = new Set(n ? [n] : []);
    if (n) edges.forEach(([a, c]) => {
      if (a === n) set.add(c);
      if (c === n) set.add(a);
    });
    return set;
  };
  function step(dt) {
    const { w, h } = s;
    const small = w < 480;
    const kRep = small ? 620 : 1500, L = small ? 58 : 92;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], c = nodes[j];
        let dx = a.x - c.x, dy = a.y - c.y, d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          dx = rand(-1, 1);
          dy = rand(-1, 1);
          d2 = 1;
        }
        const d = Math.sqrt(d2), f = (kRep * (a.kind === "project" && c.kind === "project" ? 3 : 1)) / d;
        a.vx += (dx / d) * f * dt;
        a.vy += (dy / d) * f * dt;
        c.vx -= (dx / d) * f * dt;
        c.vy -= (dy / d) * f * dt;
      }
    }
    for (const [a, c] of edges) {
      const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - L) * 1.3 * dt;
      a.vx += (dx / d) * f;
      a.vy += (dy / d) * f;
      c.vx -= (dx / d) * f;
      c.vy -= (dy / d) * f;
    }
    let total = 0;
    for (const n of nodes) {
      n.vx += (w / 2 - n.x) * 0.1 * dt;
      n.vy += (h / 2 - n.y) * 0.2 * dt;
      n.vx *= Math.pow(0.04, dt);
      n.vy *= Math.pow(0.04, dt);
      if (n === drag) {
        n.vx = n.vy = 0;
        continue;
      }
      const pad = n.kind === "project" ? (n.hw || 44) + 3 : 30;
      n.x = clamp(n.x + n.vx * dt, pad, w - pad);
      n.y = clamp(n.y + n.vy * dt, 16, h - 26);
      total += Math.abs(n.vx) + Math.abs(n.vy);
    }
    return total;
  }
  function draw() {
    const ctx = s.ctx, { w, h } = s;
    ctx.clearRect(0, 0, w, h);
    const focus = pinned || hover, near = neighbours(focus);
    for (const [a, c] of edges) {
      const on = focus && (a === focus || c === focus);
      ctx.strokeStyle = on ? Acc.hex : focus ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.15)";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(c.x, c.y);
      ctx.stroke();
    }
    for (const n of nodes) {
      const dim = focus && !near.has(n), on = focus && near.has(n);
      if (n.kind === "project") {
        ctx.font = '500 11px "IBM Plex Mono", ui-monospace, monospace';
        const tw = ctx.measureText(n.name).width, bw = tw + 14;
        n.hw = bw / 2;
        n.hh = 11;
        ctx.fillStyle = on ? Acc.hex : dim ? "#101013" : "#1b1b20";
        ctx.fillRect(n.x - bw / 2, n.y - 11, bw, 22);
        ctx.strokeStyle = on ? Acc.hex : dim ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.3)";
        ctx.strokeRect(n.x - bw / 2 + 0.5, n.y - 10.5, bw - 1, 21);
        ctx.fillStyle = on ? "#08080a" : dim ? "#5c5c66" : "#e4e4ea";
        ctx.fillText(n.name, n.x - tw / 2, n.y + 4);
      } else {
        const r = 5;
        n.hw = 42;
        n.hh = 12;
        ctx.fillStyle = on ? Acc.hex : dim ? "#33333a" : "#8b8b95";
        ctx.beginPath();
        ctx.moveTo(n.x, n.y - r);
        ctx.lineTo(n.x + r, n.y);
        ctx.lineTo(n.x, n.y + r);
        ctx.lineTo(n.x - r, n.y);
        ctx.closePath();
        ctx.fill();
        ctx.font = '500 10px "IBM Plex Mono", ui-monospace, monospace';
        ctx.fillStyle = on ? Acc.hex : dim ? "#44444c" : "#adadb6";
        const tw = ctx.measureText(n.name).width;
        ctx.fillText(n.name, clamp(n.x - tw / 2, 3, w - tw - 3), n.y + 16);
      }
    }
  }
  const find = (p) => {
    let best = null, bd = 1e9;
    for (const n of nodes) {
      const d = Math.abs(n.x - p.x) / Math.max(n.hw || 20, 18) + Math.abs(n.y - p.y) / 16;
      if (d < 1.5 && d < bd) {
        bd = d;
        best = n;
      }
    }
    return best;
  };
  cv.style.cursor = "grab";
  cv.addEventListener("pointerdown", (e) => {
    const n = find(evPos(e, cv));
    if (!n) return;
    drag = n;
    pinned = null;
    hover = n;
    cv.setPointerCapture(e.pointerId);
    energy = 1;
    draw();
  });
  cv.addEventListener("pointermove", (e) => {
    const p = evPos(e, cv);
    if (drag) {
      const pad = drag.kind === "project" ? (drag.hw || 44) + 3 : 30;
      drag.x = clamp(p.x, pad, s.w - pad);
      drag.y = clamp(p.y, 16, s.h - 26);
      energy = 1;
      if (REDUCED) draw();
    } else {
      const n = find(p);
      if (n !== hover) {
        hover = n;
        draw();
      }
    }
  });
  const end = () => (drag = null);
  cv.addEventListener("pointerup", end);
  cv.addEventListener("pointercancel", end);
  cv.addEventListener("pointerleave", () => {
    if (!drag) {
      hover = null;
      draw();
    }
  });
  document.addEventListener("skill", (e) => {
    const n = index[e.detail];
    pinned = pinned === n ? null : n || null;
    document.dispatchEvent(new CustomEvent("skillstate", { detail: pinned ? pinned.name : null }));
    draw();
  });
  document.addEventListener("accent", draw);
  for (let i = 0; i < 700; i++) step(0.016);
  draw();
  if (!REDUCED) {
    addTick(cv, (dt) => {
      if (energy <= 0 && !drag) return;
      const t = step(Math.min(dt, 0.03));
      energy = t < 6 && !drag ? energy - dt : 1;
      draw();
    });
  }
}

function toyPlates(el) {
  const b = shell(el, "Load the bar", "Click a plate");
  b.innerHTML = `<canvas class="cv" style="--h:236px" role="img" aria-label="A loaded barbell that bends as plates are added"></canvas><div class="ctl"></div>`;
  const cv = $("canvas", b), ctl = $(".ctl", b);
  const s = fit(cv);
  const ctx = s.ctx;
  const PLATES = {
    25: { h: 148, t: 15, c: "#c9655f", ink: "#08080a" },
    20: { h: 148, t: 12, c: "#6c8fd6", ink: "#08080a" },
    15: { h: 122, t: 10, c: "#d9c06c", ink: "#08080a" },
    10: { h: 98, t: 8, c: "#6fae84", ink: "#08080a" },
    5: { h: 72, t: 6, c: "#dcdce2", ink: "#08080a" },
    2.5: { h: 54, t: 5, c: "#3a3a41", ink: "#e4e4ea" },
  };
  const MAX = 8;
  let side = [20], bend = 0, vel = 0;
  const total = () => 25 + side.reduce((a, c) => a + c, 0) * 2;
  const change = () => {
    side.sort((a, c) => c - a);
    vel += 26;
    m.set("t", total());
    m.set("l", (total() * 2.20462).toFixed(1));
    m.set("p", 2.5 + side.reduce((a, c) => a + c, 0));
    m.set("n", side.length * 2);
    Sound.blip(160 + side.length * 18, 0.08, 0.04, "triangle");
  };
  [25, 20, 15, 10, 5, 2.5].forEach((p) => ctl.append(btn(String(p), () => {
    if (side.length >= MAX) return toast("That's a full sleeve. Take a plate off first.");
    side.push(p);
    change();
  })));
  ctl.append(btn("Undo", () => {
    side.pop();
    change();
  }), btn("Clear", () => {
    side = [];
    change();
  }));
  const m = meters([["t", "Total kg"], ["l", "Total lb"], ["p", "Per side kg"], ["n", "Plates"]]);
  const note = document.createElement("div");
  note.className = "note";
  note.textContent = "Bar 20 kg, collars 2.5 kg each, plates in softened competition colours. For fun, not a record of my lifts.";
  b.append(m, note);
  let hits = [];
  function draw() {
    const { w, h } = s;
    ctx.clearRect(0, 0, w, h);
    ctx.font = '500 9.5px "IBM Plex Mono", ui-monospace, monospace';
    const cy = h * 0.52, half = w / 2 - 12, sleeve = half * 0.38, scale = clamp(w / 640, 0.62, 1);
    const sag = (x) => bend * Math.pow(Math.abs(x) / half, 2.1);
    const slope = (x) => (bend * 2.1 * Math.pow(Math.abs(x) / half, 1.1)) / half * Math.sign(x);
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.beginPath();
    ctx.moveTo(0, cy + 0.5);
    ctx.lineTo(w, cy + 0.5);
    ctx.stroke();
    ctx.strokeStyle = "#adadb6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = -half; i <= half; i += 8) {
      const x = w / 2 + i, y = cy + sag(i);
      i === -half ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    hits = [];
    for (const dir of [-1, 1]) {
      let off = half - sleeve;
      const collar = (bx) => {
        ctx.fillStyle = "#adadb6";
        ctx.save();
        ctx.translate(w / 2 + dir * bx, cy + sag(bx));
        ctx.rotate(Math.atan(slope(dir * bx)));
        ctx.fillRect(-3, -9, 6, 18);
        ctx.restore();
      };
      collar(off - 7);
      side.forEach((p, i) => {
        const P = PLATES[p], t = P.t * scale * 1.6, ph = P.h * scale;
        const x = off + t / 2;
        ctx.save();
        ctx.translate(w / 2 + dir * x, cy + sag(x));
        ctx.rotate(Math.atan(slope(dir * x)));
        ctx.fillStyle = PLATES[p].c;
        ctx.fillRect(-t / 2, -ph / 2, t, ph);
        ctx.strokeStyle = "rgba(8,8,10,.9)";
        ctx.strokeRect(-t / 2, -ph / 2, t, ph);
        if (ph > 60 && t > 9) {
          ctx.save();
          ctx.rotate(-Math.PI / 2);
          ctx.fillStyle = PLATES[p].ink;
          const lb = String(p);
          ctx.fillText(lb, -ctx.measureText(lb).width / 2, 3.5);
          ctx.restore();
        }
        ctx.restore();
        hits.push({ x1: w / 2 + dir * off - (dir < 0 ? t : 0), x2: w / 2 + dir * off + (dir > 0 ? t : 0), i });
        off += t + 1;
      });
      collar(off + 3);
    }
    ctx.fillStyle = "#e4e4ea";
    ctx.font = `600 ${Math.round(24 * scale + 6)}px "IBM Plex Sans", ui-sans-serif, sans-serif`;
    const lab = `${total()} kg`;
    ctx.fillText(lab, w / 2 - ctx.measureText(lab).width / 2, Math.max(30, cy - 60));
  }
  cv.addEventListener("click", (e) => {
    const p = evPos(e, cv);
    if (hits.some((t) => p.x >= t.x1 - 4 && p.x <= t.x2 + 4)) {
      side.pop();
      change();
    }
  });
  addTick(cv, (dt) => {
    const target = Math.pow(Math.max(0, total() - 25) / 400, 1.1) * 64;
    vel += (target - bend) * 150 * dt;
    vel *= Math.pow(0.012, dt);
    bend += vel * dt;
    draw();
  });
  change();
  vel = 0;
  bend = Math.pow(40 / 400, 1.1) * 64;
  draw();
  document.addEventListener("accent", draw);
}

function toyRedact(el) {
  const b = shell(el, "Findings", "Withheld");
  const w = document.createElement("div");
  w.className = "redact";
  let seed = 41;
  const r = (a, c) => {
    seed = (seed * 16807) % 2147483647;
    return a + (seed % 1000) / 1000 * (c - a);
  };
  w.innerHTML = Array.from({ length: 8 }, () => `<div class="ln">${Array.from({ length: 3 + Math.floor(r(0, 3)) }, () => `<i style="width:${Math.round(r(30, 150))}px"></i>`).join("")}</div>`).join("");
  const note = document.createElement("div");
  note.className = "note";
  note.textContent = "Results will appear here once the affected parties have been notified.";
  b.append(w, note);
  const shuffle = () => $$("i", w).forEach((i) => (i.style.width = Math.round(r(30, 150)) + "px"));
  $$("i", w).forEach((i) => (i.style.transition = "width .3s, background .12s"));
  w.addEventListener("pointerenter", shuffle);
}
