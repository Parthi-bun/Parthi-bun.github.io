/* Hero solid: real polyhedra built from vertex data, with spikes, shatter and clickable facets. */
const V3 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm(a) {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  },
  avg(list) {
    const s = list.reduce((m, v) => V3.add(m, v), [0, 0, 0]);
    return V3.mul(s, 1 / list.length);
  },
};

function outward(verts, f) {
  const c = V3.avg(f.map((i) => verts[i]));
  const n = V3.cross(V3.sub(verts[f[1]], verts[f[0]]), V3.sub(verts[f[2]], verts[f[0]]));
  return V3.dot(n, c) < 0 ? [...f].reverse() : f;
}
function triFaces(raw) {
  const v = raw.map(V3.norm);
  let min = Infinity;
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) min = Math.min(min, Math.hypot(...V3.sub(v[i], v[j])));
  const adj = (i, j) => Math.abs(Math.hypot(...V3.sub(v[i], v[j])) - min) < 1e-6;
  const f = [];
  for (let i = 0; i < v.length; i++)
    for (let j = i + 1; j < v.length; j++)
      for (let k = j + 1; k < v.length; k++) if (adj(i, j) && adj(j, k) && adj(i, k)) f.push(outward(v, [i, j, k]));
  return { v, f };
}
function dual(p) {
  const v = p.f.map((f) => V3.norm(V3.avg(f.map((i) => p.v[i]))));
  const f = p.v.map((axis, i) => {
    const around = p.f.map((_, k) => k).filter((k) => p.f[k].includes(i));
    const u = V3.norm(V3.sub(v[around[0]], V3.mul(axis, V3.dot(v[around[0]], axis))));
    const w = V3.cross(axis, u);
    around.sort((a, b) => Math.atan2(V3.dot(v[a], w), V3.dot(v[a], u)) - Math.atan2(V3.dot(v[b], w), V3.dot(v[b], u)));
    return outward(v, around);
  });
  return { v, f };
}
const PHI = (1 + Math.sqrt(5)) / 2;
const ICO = triFaces([[0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI], [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0], [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1]]);
const OCT = triFaces([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]);
const TET = triFaces([[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]]);
const SOLIDS = { TET: TET, CUB: dual(OCT), OCT: OCT, DOD: dual(ICO), ICO: ICO };

function mmul(a, b) {
  const r = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return r;
}
const rotY = (t) => [Math.cos(t), 0, Math.sin(t), 0, 1, 0, -Math.sin(t), 0, Math.cos(t)];
const rotX = (t) => [1, 0, 0, 0, Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t)];
const apply = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];

function initForge() {
  const cv = $("#forge");
  const s = fit(cv);
  const ctx = s.ctx;
  let name = store.get("solid", "ICO");
  if (!SOLIDS[name]) name = "ICO";
  let R = mmul(rotX(-0.35), rotY(0.5));
  let vx = REDUCED ? 0 : 0.18, vy = REDUCED ? 0 : 0.34, spike = store.get("spike", 0.55), shatter = 0, spin = !REDUCED;
  let pop = [], popV = [], hover = -1;
  let drag = null, moved = 0;
  let light = [-0.55, -0.6, 0.6];
  let frameTris = [];

  function resetPop() {
    const n = SOLIDS[name].f.length;
    pop = new Array(n).fill(0);
    popV = new Array(n).fill(0);
  }
  resetPop();

  const euler = $("#euler");
  function showEuler() {
    const p = SOLIDS[name];
    const stel = spike > 0.001;
    const V = p.v.length + (stel ? p.f.length : 0);
    const F = stel ? p.f.reduce((m, f) => m + f.length, 0) : p.f.length;
    const E = V + F - 2;
    euler.innerHTML = `V <b>${V}</b> &nbsp; E <b>${E}</b> &nbsp; F <b>${F}</b><br>V − E + F = <b>2</b>`;
  }
  showEuler();

  const ctl = $("#forge-ctl");
  const shapes = seg(Object.keys(SOLIDS), name, (v) => {
    name = v;
    store.set("solid", v);
    resetPop();
    showEuler();
    vx += 1.3;
    vy += 1.9;
  }, "Solid");
  const row = document.createElement("div");
  row.className = "forge-row";
  row.append(
    slider("Spike", 0, 1.4, 0.01, spike, (v) => v.toFixed(2), (v) => {
      spike = v;
      store.set("spike", v);
      showEuler();
    }),
    slider("Shatter", 0, 1, 0.01, 0, (v) => v.toFixed(2), (v) => (shatter = v))
  );
  ctl.append(shapes, row);

  function tris() {
    const p = SOLIDS[name];
    const out = [];
    p.f.forEach((f, fi) => {
      const pts = f.map((i) => p.v[i]);
      const c = V3.avg(pts);
      const n = V3.norm(c);
      const off = V3.mul(n, shatter * 0.7 + pop[fi]);
      if (spike > 0.001) {
        const apex = V3.add(c, V3.mul(n, spike));
        pts.forEach((a, i) => {
          const b = pts[(i + 1) % pts.length];
          out.push({ pts: [a, b, apex].map((q) => V3.add(q, off)), fi });
        });
      } else {
        out.push({ pts: pts.map((q) => V3.add(q, off)), fi });
      }
    });
    return out;
  }

  function draw() {
    const { w, h } = s;
    ctx.clearRect(0, 0, w, h);
    const scale = Math.min(w, h) * 0.27 / (1 + Math.min(spike, 1) * 0.28 + shatter * 0.12);
    const cx = w / 2, cy = h / 2;
    const proj = (v) => {
      const k = 4.2 / (4.2 - v[2]);
      return [cx + v[0] * scale * k, cy + v[1] * scale * k, v[2]];
    };
    const L = V3.norm(light);
    frameTris = tris().map((t) => {
      const w3 = t.pts.map((q) => apply(R, q));
      const n = V3.norm(V3.cross(V3.sub(w3[1], w3[0]), V3.sub(w3[2], w3[0])));
      const scr = w3.map(proj);
      return { fi: t.fi, n, scr, z: w3.reduce((m, q) => m + q[2], 0) / w3.length };
    });
    frameTris.sort((a, b) => a.z - b.z);
    for (const t of frameTris) {
      const facing = t.n[2] > 0;
      const k = Math.max(0, V3.dot(t.n, L));
      ctx.beginPath();
      t.scr.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.closePath();
      if (facing) {
        const g = Math.round(13 + 44 * k);
        ctx.fillStyle = `rgba(${g},${g},${g + 4},.96)`;
        ctx.fill();
        const hot = Math.pow(k, 9);
        if (hot > 0.015) {
          ctx.fillStyle = rgba(hot * 0.85);
          ctx.fill();
        }
        if (t.fi === hover) {
          ctx.fillStyle = rgba(0.16);
          ctx.fill();
        }
        ctx.strokeStyle = t.fi === hover ? rgba(0.95) : `rgba(255,255,255,${0.1 + 0.26 * k})`;
      } else {
        ctx.fillStyle = "rgba(10,10,13,.55)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.07)";
      }
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    /* orbit ticks */
    ctx.strokeStyle = "rgba(255,255,255,.1)";
    ctx.beginPath();
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const r = Math.min(w, h) * 0.47, r2 = r - (i % 4 ? 3 : 8);
      ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    }
    ctx.stroke();
  }

  function hit(p) {
    for (let i = frameTris.length - 1; i >= 0; i--) {
      const t = frameTris[i];
      if (t.n[2] <= 0) continue;
      let inside = false;
      const q = t.scr;
      for (let a = 0, b = q.length - 1; a < q.length; b = a++) {
        if (q[a][1] > p.y !== q[b][1] > p.y && p.x < ((q[b][0] - q[a][0]) * (p.y - q[a][1])) / (q[b][1] - q[a][1]) + q[a][0]) inside = !inside;
      }
      if (inside) return t.fi;
    }
    return -1;
  }

  cv.addEventListener("pointerdown", (e) => {
    drag = evPos(e, cv);
    moved = 0;
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener("pointermove", (e) => {
    const p = evPos(e, cv);
    if (drag) {
      const dx = p.x - drag.x, dy = p.y - drag.y;
      moved += Math.abs(dx) + Math.abs(dy);
      R = mmul(mmul(rotX(-dy * 0.008), rotY(dx * 0.008)), R);
      vx = -dy * 0.5;
      vy = dx * 0.5;
      drag = p;
    } else {
      hover = hit(p);
      light = [(p.x - s.w / 2) / (s.w / 2), (p.y - s.h / 2) / (s.h / 2), 0.7];
    }
  });
  const up = (e) => {
    if (drag && moved < 6) {
      const f = hit(evPos(e, cv));
      if (f >= 0) {
        popV[f] = 2.8;
        Sound.blip(880 - f * 12, 0.05);
      }
    }
    drag = null;
  };
  cv.addEventListener("pointerup", up);
  cv.addEventListener("pointercancel", () => (drag = null));
  cv.addEventListener("pointerleave", () => (hover = -1));
  cv.addEventListener("dblclick", () => {
    const k = Object.keys(SOLIDS);
    shapes.set(k[(k.indexOf(name) + 1) % k.length], true);
  });

  addTick(cv, (dt) => {
    if (!drag) {
      R = mmul(mmul(rotX(-vx * dt), rotY(vy * dt)), R);
      const f = Math.pow(0.28, dt);
      const tx = spin ? 0.1 : 0, ty = spin ? 0.3 : 0;
      vx = tx + (vx - tx) * f;
      vy = ty + (vy - ty) * f;
    }
    for (let i = 0; i < pop.length; i++) {
      popV[i] += -pop[i] * 34 * dt;
      popV[i] *= Math.pow(0.03, dt);
      pop[i] += popV[i] * dt;
    }
    draw();
  });
  draw();
  document.addEventListener("accent", draw);
  return { draw };
}
