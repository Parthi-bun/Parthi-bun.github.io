/* Working models for the internship, resharding, retrieval and summary projects. */

function toyCapture(el) {
  const b = shell(el, "Attendance capture model", "Drag the face to smile");
  b.innerHTML = `<canvas class="cv" style="--h:290px" role="img" aria-label="A drawn face. When it smiles past the trigger, a photo is taken and a student is marked present."></canvas><div class="ctl"></div>`;
  const cv = $("canvas", b);
  const ctl = $(".ctl", b);
  const s = fit(cv);
  const ctx = s.ctx;
  const m = meters([["p", "Smile score"], ["c", "Captures"], ["k", "Marked"]]);
  let smile = 0.1, target = 0.1, thr = 0.7, touched = false, armed = true, hold = 0;
  let flash = 0, scan = 0, captures = 0, phase = 0, drag = null;
  const eye = { x: 0, y: 0 };
  const roster = Array.from({ length: 12 }, (_, i) => ({ id: "S" + String(i + 1).padStart(2, "0"), on: 0 }));
  const sSmile = slider("Smile", 0, 1, 0.01, smile, (v) => v.toFixed(2), (v) => {
    target = v;
    touched = true;
  });
  const sThr = slider("Trigger", 0.3, 0.95, 0.01, thr, (v) => v.toFixed(2), (v) => (thr = v));
  sSmile.classList.add("grow");
  sThr.classList.add("grow");
  ctl.append(sSmile, sThr, btn("Reset", () => {
    roster.forEach((r) => (r.on = 0));
    captures = 0;
    armed = true;
  }));
  b.append(m);
  const note = document.createElement("div");
  note.className = "note";
  note.textContent = "No camera is used here. The face is drawn and the roster is made up.";
  b.append(note);

  cv.addEventListener("pointerdown", (e) => {
    drag = evPos(e, cv).y;
    touched = true;
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener("pointermove", (e) => {
    const p = evPos(e, cv);
    const faceX = s.w * 0.31, faceY = s.h * 0.5;
    eye.x = clamp((p.x - faceX) / 90, -1, 1);
    eye.y = clamp((p.y - faceY) / 90, -1, 1);
    if (drag !== null) {
      target = clamp(target + (drag - p.y) / 150, 0, 1);
      drag = p.y;
      sSmile.setValue(target);
    }
  });
  cv.addEventListener("pointerup", () => (drag = null));
  cv.addEventListener("pointercancel", () => (drag = null));

  function draw() {
    const { w, h } = s;
    ctx.clearRect(0, 0, w, h);
    const narrow = w < 430;
    const cx = w * (narrow ? 0.3 : 0.31), cy = h * 0.5, r = Math.min(h * 0.34, w * 0.23);
    const on = smile >= thr;
    /* detection box */
    const bx = cx - r * 1.28, by = cy - r * 1.32, bw = r * 2.56, bh = r * 2.64, c = 14;
    ctx.strokeStyle = on ? rgba(1) : "rgba(255,255,255,.34)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const [x, y, dx, dy] of [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]]) {
      ctx.moveTo(x + c * dx, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + c * dy);
    }
    ctx.stroke();
    /* faceted head */
    const head = [[-0.52, -1.02], [0.52, -1.02], [0.98, -0.42], [0.92, 0.32], [0.46, 1.04], [-0.46, 1.04], [-0.92, 0.32], [-0.98, -0.42]].map(([x, y]) => [cx + x * r, cy + y * r]);
    const centre = [cx, cy - r * 0.08];
    head.forEach((p, i) => {
      const q = head[(i + 1) % head.length];
      const v = 15 + ((i * 7) % 5) * 5;
      ctx.fillStyle = `rgb(${v},${v},${v + 4})`;
      ctx.beginPath();
      ctx.moveTo(centre[0], centre[1]);
      ctx.lineTo(p[0], p[1]);
      ctx.lineTo(q[0], q[1]);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.1)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.strokeStyle = "rgba(255,255,255,.34)";
    ctx.beginPath();
    head.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    ctx.stroke();
    /* eyes */
    for (const sx of [-1, 1]) {
      const ex = cx + sx * r * 0.4, ey = cy - r * 0.26, ew = r * 0.25, squint = smile * 0.45;
      ctx.fillStyle = "#ededef";
      ctx.beginPath();
      ctx.moveTo(ex - ew, ey);
      ctx.lineTo(ex, ey - ew * (0.62 - squint * 0.4));
      ctx.lineTo(ex + ew, ey);
      ctx.lineTo(ex, ey + ew * (0.5 - squint));
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#08080a";
      const ps = r * 0.075;
      ctx.fillRect(ex + eye.x * ew * 0.5 - ps, ey + eye.y * ew * 0.1 - ps, ps * 2, ps * 1.7);
    }
    /* mouth */
    const my = cy + r * 0.48, mw = r * 0.54, curve = (smile - 0.28) * r * 0.62;
    const mouth = [[-1, -1], [-0.55, -0.02], [0, 0.62], [0.55, -0.02], [1, -1]].map(([x, y]) => [cx + x * mw, my + y * curve * 0.58 + (Math.abs(x) === 1 ? 0 : 0)]);
    ctx.strokeStyle = on ? rgba(1) : "#ededef";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    mouth.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.stroke();
    ctx.lineWidth = 1;
    /* landmarks */
    ctx.fillStyle = rgba(0.95);
    const marks = [...mouth, [cx - r * 0.4, cy - r * 0.26], [cx + r * 0.4, cy - r * 0.26], [cx, cy + r * 0.1], ...head];
    for (const p of marks) ctx.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3);
    if (scan > 0) {
      const y = by + bh * (1 - scan);
      ctx.fillStyle = rgba(0.85);
      ctx.fillRect(bx, y, bw, 2);
      ctx.fillStyle = rgba(0.08);
      ctx.fillRect(bx, y, bw, bh - (y - by));
    }
    ctx.font = '500 10px "Geist Mono", ui-monospace, monospace';
    ctx.fillStyle = on ? rgba(1) : "#8b8b95";
    ctx.fillText(`smile ${smile.toFixed(2)} / trigger ${thr.toFixed(2)}`, bx, Math.max(12, by - 7));
    /* roster */
    const rx = w * (narrow ? 0.62 : 0.65), rw = w - rx - 14, cols = 3, gap = 5;
    const tw = (rw - gap * (cols - 1)) / cols, th = Math.min(tw * 0.72, (h - 58) / 4 - gap);
    ctx.fillStyle = "#8b8b95";
    ctx.fillText("ROSTER", rx, 26);
    roster.forEach((t, i) => {
      const x = rx + (i % cols) * (tw + gap), y = 36 + Math.floor(i / cols) * (th + gap);
      ctx.fillStyle = t.on ? rgba(0.2 + 0.72 * t.on) : "#131317";
      ctx.fillRect(x, y, tw, th);
      ctx.strokeStyle = t.on ? rgba(0.9) : "rgba(255,255,255,.14)";
      ctx.strokeRect(x + 0.5, y + 0.5, tw - 1, th - 1);
      ctx.fillStyle = t.on > 0.5 ? "#08080a" : "#adadb6";
      ctx.fillText(t.id, x + 6, y + th / 2 + 3.5);
    });
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flash * 0.6})`;
      ctx.fillRect(0, 0, w, h);
    }
    m.set("p", smile.toFixed(2));
    m.set("c", captures);
    m.set("k", `${roster.filter((t) => t.on).length}/12`);
  }

  addTick(cv, (dt) => {
    phase += dt;
    if (!touched && !REDUCED) {
      target = 0.46 + 0.42 * Math.sin(phase * 0.8);
      sSmile.setValue(+target.toFixed(2));
    }
    smile = lerp(smile, target, 1 - Math.pow(0.002, dt));
    flash = Math.max(0, flash - dt * 3.4);
    if (smile >= thr && armed) {
      hold += dt;
      if (hold > 0.4) {
        armed = false;
        hold = 0;
        flash = 1;
        scan = 1;
        captures++;
        Sound.blip(1200, 0.06, 0.04);
      }
    } else if (smile < thr - 0.06) {
      armed = true;
      hold = 0;
    }
    if (scan > 0) {
      scan -= dt / 0.65;
      if (scan <= 0) {
        scan = 0;
        const t = roster.find((r) => !r.on);
        if (t) t.on = 0.001;
        else roster.forEach((r) => (r.on = 0));
        Sound.blip(990, 0.05);
      }
    }
    roster.forEach((t) => {
      if (t.on) t.on = Math.min(1, t.on + dt * 3);
    });
    draw();
  });
  draw();
}

/* Two computers trade blocks over a cable while updates keep landing on them. */
function toyReshard(el) {
  const b = shell(el, "Block transfer model", "Click a block to send it");
  b.innerHTML = `<canvas class="cv" style="--h:336px;cursor:pointer" role="img" aria-label="Two computers passing blocks of data along a cable. Updates keep landing in live mode and stop in global-stop mode."></canvas><div class="ctl"></div>`;
  const cv = $("canvas", b);
  const ctl = $(".ctl", b);
  const s = fit(cv);
  const ctx = s.ctx;
  const m = meters([["a", "Updates applied"], ["q", "Waiting now"], ["w", "Worst wait"], ["b", "Blocks moved"]]);
  const SIDE = 4, MOVE = 1.5;
  const slots = [Array(SIDE * SIDE).fill(null), Array(SIDE * SIDE).fill(null)];
  let id = 0, mode = "live", auto = !REDUCED, autoT = 0.5, spawnT = 0, applied = 0, worst = 0, moved = 0, now = 0, cable = 0;
  const flights = [], packets = [];
  const newTile = () => ({ id: ++id, flash: 0 });
  for (let i = 0; i < 11; i++) slots[0][i] = newTile();
  for (let i = 0; i < 5; i++) slots[1][i] = newTile();

  const modeSeg = seg([["live", "Live transfer"], ["stop", "Global stop"]], mode, (v) => {
    mode = v;
    applied = 0;
    worst = 0;
    moved = 0;
    packets.forEach((p) => (p.born = now - p.t / 1.8));
  }, "Transfer mode");
  const autoSeg = seg([["on", "Auto on"], ["off", "Auto off"]], auto ? "on" : "off", (v) => (auto = v === "on"), "Automatic transfers");
  ctl.append(modeSeg, btn("Send a block", () => sendAny()), autoSeg);
  b.append(m);
  const note = document.createElement("div");
  note.className = "note";
  note.textContent = "An illustration of the behaviour, with made-up timing. In global stop, every update waits for the transfer to finish. The measured results are in the write-up.";
  b.append(note);

  function layout() {
    const { w, h } = s;
    const mw = Math.min(w * 0.36, 214), pad = 9, tile = (mw - pad * 2 - (SIDE - 1) * 4) / SIDE;
    const sh = tile * SIDE + (SIDE - 1) * 4 + pad * 2;
    const my = Math.max(44, (h - sh - 62) / 2 + 12);
    const box = (i) => {
      const x = i ? w - 14 - mw : 14;
      return { x, y: my, w: mw, h: sh + 22 };
    };
    return { mw, pad, tile, sh, my, box };
  }
  function slotXY(L, n, i) {
    const B = L.box(n);
    return { x: B.x + L.pad + (i % SIDE) * (L.tile + 4), y: B.y + 22 + L.pad - 4 + Math.floor(i / SIDE) * (L.tile + 4) };
  }
  function route(L, from, to, a, c) {
    const A = L.box(0), B = L.box(1);
    const baseY = A.y + A.h + 30;
    const portA = [A.x + A.w, A.y + A.h - 16], portB = [B.x, B.y + B.h - 16];
    const midA = (portA[0] + portB[0]) / 2 - 12, midB = midA + 24;
    const cableP = [portA, [midA, portA[1]], [midA, baseY - 12], [midB, baseY - 12], [midB, portB[1]], portB];
    const seq = from === 0 ? cableP : [...cableP].reverse();
    const off = L.tile / 2 + 2;
    const tube = seq.map(([x, y]) => [x - off, y - off]);
    return [[a.x, a.y], [a.x, tube[0][1]], ...tube, [c.x, tube[tube.length - 1][1]], [c.x, c.y]];
  }
  function along(pts, t) {
    let len = 0;
    const seg = pts.slice(1).map((p, i) => {
      const l = Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]);
      len += l;
      return l;
    });
    let d = t * len;
    for (let i = 0; i < seg.length; i++) {
      if (d <= seg[i] || i === seg.length - 1) {
        const k = seg[i] ? d / seg[i] : 0;
        return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)];
      }
      d -= seg[i];
    }
    return pts[pts.length - 1];
  }
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  function send(n, i) {
    const to = 1 - n, dest = slots[to].indexOf(null);
    if (dest < 0) return toast("That computer is full. Send a block the other way.");
    const tile = slots[n][i];
    if (!tile) return;
    slots[n][i] = null;
    slots[to][dest] = { reserved: true };
    flights.push({ tile, from: n, to, si: i, di: dest, t: 0 });
    Sound.blip(n ? 440 : 560, 0.07);
  }
  function sendAny() {
    const count = (n) => slots[n].filter((t) => t && !t.reserved).length;
    const n = count(0) >= count(1) ? 0 : 1;
    const opts = slots[n].map((t, i) => (t && !t.reserved ? i : -1)).filter((i) => i >= 0);
    if (opts.length) send(n, pick(opts));
  }
  function spawn() {
    const n = Math.random() < 0.5 ? 0 : 1;
    const opts = slots[n].map((t, i) => (t && !t.reserved ? i : -1)).filter((i) => i >= 0);
    if (!opts.length) return;
    packets.push({ n, i: pick(opts), t: 0, born: now, sx: rand(0.1, 0.9) });
  }
  const stopped = () => mode === "stop" && flights.length > 0;

  cv.addEventListener("click", (e) => {
    const p = evPos(e, cv), L = layout();
    for (let n = 0; n < 2; n++) {
      for (let i = 0; i < slots[n].length; i++) {
        const t = slots[n][i];
        if (!t || t.reserved) continue;
        const q = slotXY(L, n, i);
        if (p.x >= q.x && p.x <= q.x + L.tile && p.y >= q.y && p.y <= q.y + L.tile) {
          auto = false;
          autoSeg.set("off");
          return send(n, i);
        }
      }
    }
  });

  function draw() {
    const { w, h } = s, L = layout();
    ctx.clearRect(0, 0, w, h);
    const frozen = stopped();
    ctx.font = '500 10px "Geist Mono", ui-monospace, monospace';
    /* cable */
    const A = L.box(0), B = L.box(1);
    const cableR = route(L, 0, 1, { x: 0, y: 0 }, { x: 0, y: 0 }).slice(2, -2).map(([x, y]) => [x + L.tile / 2 + 2, y + L.tile / 2 + 2]);
    ctx.strokeStyle = "rgba(255,255,255,.2)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    cableR.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = flights.length ? rgba(0.95) : "rgba(255,255,255,.28)";
    ctx.setLineDash([5, 7]);
    ctx.lineDashOffset = -cable;
    ctx.beginPath();
    cableR.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.stroke();
    ctx.setLineDash([]);
    /* computers */
    [0, 1].forEach((n) => {
      const Bx = L.box(n);
      ctx.fillStyle = "#0d0d10";
      ctx.fillRect(Bx.x, Bx.y, Bx.w, Bx.h);
      ctx.strokeStyle = frozen ? rgba(0.75) : "rgba(255,255,255,.3)";
      ctx.strokeRect(Bx.x + 0.5, Bx.y + 0.5, Bx.w - 1, Bx.h - 1);
      ctx.fillStyle = "#8b8b95";
      ctx.fillText(n ? "COMPUTER B" : "COMPUTER A", Bx.x + 9, Bx.y + 15);
      ctx.fillStyle = frozen ? rgba(1) : "#4ade80";
      ctx.fillRect(Bx.x + Bx.w - 15, Bx.y + 8, 6, 6);
      /* stand */
      const cx = Bx.x + Bx.w / 2, by = Bx.y + Bx.h;
      ctx.fillStyle = "#17171b";
      ctx.beginPath();
      ctx.moveTo(cx - 13, by);
      ctx.lineTo(cx + 13, by);
      ctx.lineTo(cx + 19, by + 16);
      ctx.lineTo(cx - 19, by + 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#26262c";
      ctx.fillRect(cx - 38, by + 16, 76, 4);
      /* port */
      const px = n ? Bx.x - 3 : Bx.x + Bx.w - 3;
      ctx.fillStyle = flights.length ? rgba(1) : "#5c5c66";
      ctx.fillRect(px, Bx.y + Bx.h - 19, 6, 6);
      /* slots */
      slots[n].forEach((t, i) => {
        const q = slotXY(L, n, i);
        ctx.strokeStyle = "rgba(255,255,255,.08)";
        ctx.strokeRect(q.x + 0.5, q.y + 0.5, L.tile - 1, L.tile - 1);
        if (!t || t.reserved) return;
        const v = Math.round(lerp(50, 112, 0.25 + (t.id % 4) / 5));
        ctx.fillStyle = frozen ? `rgb(${v * 0.6},${v * 0.6},${v * 0.65})` : `rgb(${v},${v},${v + 6})`;
        ctx.fillRect(q.x + 2, q.y + 2, L.tile - 4, L.tile - 4);
        if (t.flash > 0) {
          ctx.fillStyle = rgba(t.flash);
          ctx.fillRect(q.x + 2, q.y + 2, L.tile - 4, L.tile - 4);
        }
      });
    });
    /* updates dropping onto blocks */
    let waiting = 0;
    for (const p of packets) {
      const Bx = L.box(p.n), q = slotXY(L, p.n, p.i);
      const sx = Bx.x + Bx.w * p.sx, sy = 8;
      const hold = frozen ? 0.42 : 1;
      const k = Math.min(p.t, hold);
      if (frozen) waiting++;
      const x = lerp(sx, q.x + L.tile / 2, k), y = lerp(sy, q.y + L.tile / 2, k);
      ctx.fillStyle = frozen ? "#ff6b57" : rgba(0.95);
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
    /* blocks on the wire */
    for (const f of flights) {
      const a = slotXY(L, f.from, f.si), c = slotXY(L, f.to, f.di);
      const pts = route(L, f.from, f.to, a, c);
      const full = L.tile - 4;
      /* Blocks shrink to fit the cable, then grow back into their new slot. */
      const sizeAt = (k) => lerp(full, Math.min(full, 14), clamp(Math.min(k, 1 - k) / 0.18, 0, 1));
      const at = ease(f.t);
      for (let g = 5; g >= 1; g--) {
        const k = Math.max(0, at - g * 0.022), sz = sizeAt(k), [gx, gy] = along(pts, k);
        ctx.fillStyle = rgba(0.06 * (6 - g));
        ctx.fillRect(gx + full / 2 + 2 - sz / 2, gy + full / 2 + 2 - sz / 2, sz, sz);
      }
      const sz = sizeAt(at), [x, y] = along(pts, at);
      const px = x + full / 2 + 2 - sz / 2, py = y + full / 2 + 2 - sz / 2;
      ctx.fillStyle = Acc.hex;
      ctx.fillRect(px, py, sz, sz);
      ctx.strokeStyle = "#ededef";
      ctx.strokeRect(px - 0.5, py - 0.5, sz + 1, sz + 1);
    }
    if (frozen) {
      ctx.fillStyle = "#ff6b57";
      const t = "ALL UPDATES PAUSED";
      ctx.fillText(t, w / 2 - ctx.measureText(t).width / 2, h - 8);
    } else {
      ctx.fillStyle = "#8b8b95";
      const t = flights.length ? "BLOCK IN TRANSIT / UPDATES RUNNING" : "UPDATES RUNNING";
      ctx.fillText(t, w / 2 - ctx.measureText(t).width / 2, h - 8);
    }
    m.set("a", applied.toLocaleString("en-GB"));
    m.set("q", waiting, waiting > 0);
    m.set("w", Math.round(worst * 1000) + " ms");
    m.set("b", moved);
  }

  addTick(cv, (dt) => {
    now += dt;
    cable += dt * (flights.length ? 34 : 8);
    if (auto) {
      autoT -= dt;
      if (autoT <= 0) {
        autoT = rand(2.1, 3);
        sendAny();
      }
    }
    if (!REDUCED || flights.length) {
      spawnT += dt * 26;
      while (spawnT > 1) {
        spawnT -= 1;
        spawn();
      }
    }
    const frozen = stopped();
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      if (frozen) {
        p.t = Math.min(0.42, p.t + dt * 1.8);
        continue;
      }
      p.t += dt * 1.8;
      if (p.t >= 1) {
        const t = slots[p.n][p.i];
        if (t && !t.reserved) {
          t.flash = 1;
          applied++;
          worst = Math.max(worst, now - p.born - 0.56);
        } else {
          p.t = 0.6;
          p.born += 0.4 / 1.8;
          const opts = slots[p.n].map((x, k) => (x && !x.reserved ? k : -1)).filter((k) => k >= 0);
          if (opts.length) {
            p.i = pick(opts);
            continue;
          }
        }
        packets.splice(i, 1);
      }
    }
    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i];
      f.t += dt / MOVE;
      if (f.t >= 1) {
        slots[f.to][f.di] = f.tile;
        f.tile.flash = 1;
        moved++;
        flights.splice(i, 1);
        Sound.blip(f.to ? 660 : 500, 0.06);
      }
    }
    for (const n of [0, 1]) for (const t of slots[n]) if (t && t.flash) t.flash = Math.max(0, t.flash - dt * 3.2);
    draw();
  });
  draw();
  document.addEventListener("accent", draw);
}

/* Small real BM25, a character n-gram stand-in for dense retrieval, and rank fusion. */
function toyAhrag(el) {
  const b = shell(el, "Eligibility-first retrieval", "Change the role or date");
  const ALL = ["Intern", "Engineer", "Finance", "HR"];
  const Y = 9999;
  const DOCS = [
    { id: "TRV-7 v2", t: "Travel reimbursement policy", roles: ALL, from: 0, to: 8, x: "Claim travel expenses within 60 days of the trip. Economy fares only. Receipts are required for meals." },
    { id: "TRV-7 v3", t: "Travel reimbursement policy", roles: ALL, from: 8, to: Y, x: "Claim travel expenses within 30 days through the finance portal. Premium economy is allowed on long flights." },
    { id: "ACC-3 v1", t: "Production access policy", roles: ["Engineer"], from: 0, to: 9, x: "Engineers may request standing production access from their manager." },
    { id: "ACC-3 v2", t: "Production access policy", roles: ["Engineer"], from: 9, to: Y, x: "Production access is temporary, expires after four hours and needs a second approver." },
    { id: "SEC-2", t: "Incident response runbook", roles: ["Engineer"], from: 2, to: Y, x: "Page the on-call engineer, freeze deployments and rotate exposed credentials." },
    { id: "FIN-4", t: "Quarterly revenue forecast", roles: ["Finance"], from: 4, to: Y, x: "Revenue forecast for the coming quarter by region, with margin assumptions and budget notes." },
    { id: "HR-9", t: "Salary bands", roles: ["HR"], from: 0, to: Y, x: "Salary bands by level, with pay ranges and bonus targets for each band." },
    { id: "HR-2", t: "Leave policy", roles: ALL, from: 0, to: Y, x: "Staff get 24 days of paid leave. Unused leave can be carried over for one quarter." },
  ];
  const Q = ["When must I claim travel expenses?", "Can I get production access?", "What are the salary bands?", "What is the revenue forecast?"];
  const quarter = (i) => `Q${(i % 4) + 1} ${2024 + Math.floor(i / 4)}`;
  const stop = new Set("a an and are at be by can do for from get how i in is it may must of on or the to what when with".split(" "));
  const toks = (s) => s.toLowerCase().match(/[a-z0-9]+/g)?.filter((w) => !stop.has(w)) || [];
  const grams = (s) => {
    const c = {}, t = " " + toks(s).join(" ") + " ";
    for (let i = 0; i < t.length - 2; i++) c[t.slice(i, i + 3)] = (c[t.slice(i, i + 3)] || 0) + 1;
    return c;
  };
  const cos = (a, c) => {
    let d = 0, x = 0, y = 0;
    for (const k in a) {
      x += a[k] * a[k];
      if (c[k]) d += a[k] * c[k];
    }
    for (const k in c) y += c[k] * c[k];
    return d / (Math.sqrt(x * y) || 1);
  };
  DOCS.forEach((d) => {
    d.text = d.t + " " + d.x;
    d.tk = toks(d.text);
    d.g = grams(d.text);
  });
  function bm25(q, pool) {
    const N = pool.length || 1, avg = pool.reduce((m, d) => m + d.tk.length, 0) / N, K = 1.5, B = 0.75;
    const res = new Map();
    for (const d of pool) {
      let s = 0;
      for (const w of toks(q)) {
        const f = d.tk.filter((t) => t === w).length;
        if (!f) continue;
        const n = pool.filter((p) => p.tk.includes(w)).length;
        s += Math.log(1 + (N - n + 0.5) / (n + 0.5)) * ((f * (K + 1)) / (f + K * (1 - B + (B * d.tk.length) / avg)));
      }
      res.set(d, s);
    }
    return res;
  }
  let role = "Intern", when = 10, route = "RRF", gate = true, query = Q[0];
  const top = document.createElement("div");
  top.className = "pad";
  top.innerHTML = `<div><label class="field-l" for="ah-q">Question</label><input class="txt" id="ah-q" value="${esc(query)}" autocomplete="off"></div>`;
  const qs = seg(Q.map((x, i) => [i, ["Travel", "Access", "Salary", "Revenue"][i]]), 0, (i) => {
    query = Q[i];
    input.value = query;
    render();
  }, "Sample questions");
  const roleS = seg(ALL, role, (v) => ((role = v), render()), "Role");
  const routeS = seg([["BM25", "BM25"], ["Dense", "Dense"], ["RRF", "RRF"]], route, (v) => ((route = v), render()), "Retrieval route");
  const gateS = seg([["on", "Gate on"], ["off", "Gate off"]], "on", (v) => ((gate = v === "on"), render()), "Eligibility gate");
  const dateS = slider("Effective date", 0, 11, 1, when, quarter, (v) => ((when = v), render()));
  const row1 = document.createElement("div");
  row1.className = "ctl";
  row1.style.cssText = "padding:0;border:0";
  row1.append(qs, routeS);
  const row2 = document.createElement("div");
  row2.className = "ctl";
  row2.style.cssText = "padding:0;border:0";
  row2.append(roleS, gateS);
  top.append(row1, row2, dateS);
  const list = document.createElement("div");
  list.className = "docs";
  const m = meters([["e", "Eligible"], ["x", "Blocked"], ["l", "Leaked"]]);
  const note = document.createElement("div");
  note.className = "note";
  note.textContent = "Runs in your browser on 8 made-up documents, using real BM25 and rank fusion. Dense uses character n-gram similarity as a stand-in for embeddings.";
  b.append(top, list, m, note);
  const input = $("#ah-q", top);
  input.addEventListener("input", () => {
    query = input.value;
    render();
  });

  function why(d) {
    if (!d.roles.includes(role)) return "ROLE";
    if (when < d.from || when >= d.to) return "NOT IN EFFECT";
    return "";
  }
  function render() {
    const reason = new Map(DOCS.map((d) => [d, why(d)]));
    const pool = gate ? DOCS.filter((d) => !reason.get(d)) : DOCS;
    const sb = bm25(query, pool);
    const qg = grams(query);
    const sd = new Map(pool.map((d) => [d, cos(qg, d.g)]));
    const rankOf = (mp) => new Map([...mp.entries()].filter(([, v]) => v > 0).sort((a, c) => c[1] - a[1]).map(([d], i) => [d, i + 1]));
    const rb = rankOf(sb), rd = rankOf(sd);
    const score = new Map();
    for (const d of pool) {
      if (route === "BM25") score.set(d, sb.get(d));
      else if (route === "Dense") score.set(d, sd.get(d));
      else score.set(d, (rb.has(d) ? 1 / (60 + rb.get(d)) : 0) + (rd.has(d) ? 1 / (60 + rd.get(d)) : 0));
    }
    const ranked = [...score.entries()].filter(([, v]) => v > 0).sort((a, c) => c[1] - a[1]);
    const max = ranked.length ? ranked[0][1] : 1;
    const pos = new Map(ranked.map(([d], i) => [d, i]));
    const order = [...DOCS].sort((a, c) => (pos.has(a) ? pos.get(a) : 99) - (pos.has(c) ? pos.get(c) : 99));
    let leaks = 0;
    list.innerHTML = order.map((d) => {
      const blocked = gate && reason.get(d);
      const p = pos.get(d);
      const inTop = p !== undefined && p < 3;
      const leak = !gate && reason.get(d) && inTop;
      if (leak) leaks++;
      const state = blocked ? `BLOCKED: ${reason.get(d)}` : leak ? "LEAKED" : p === undefined ? "NO MATCH" : `RANK ${p + 1}`;
      const cls = ["doc", blocked ? "blocked" : "", leak ? "leak" : inTop ? "top" : ""].join(" ");
      const bar = p === undefined ? 0 : (score.get(d) / max) * 100;
      return `<div class="${cls}"><div class="doc-t">${esc(d.t)}<small>${esc(d.id)}</small></div><div class="doc-s">${state}${blocked ? "" : `<div class="doc-bar"><i style="width:${bar.toFixed(0)}%"></i></div>`}</div></div>`;
    }).join("");
    const elig = DOCS.filter((d) => !reason.get(d)).length;
    m.set("e", elig);
    m.set("x", gate ? DOCS.length - elig : 0);
    m.set("l", leaks, leaks > 0);
  }
  render();
}

function toySummary(el) {
  const b = shell(el, "Summary model", "Edit the text");
  const SAMPLE = "The payments service failed for twelve minutes on Tuesday after a database migration locked a busy table. Customers saw timeouts at checkout during the outage. The on-call engineer rolled back the migration and traffic recovered within two minutes. Lunch was delayed for the whole team. The review found that the migration had never been tested against production-sized data. From now on, every migration must run against a full-sized copy of the data before release. The team will also add an alert for long table locks.";
  b.innerHTML = `<div class="pad"><div><label class="field-l" for="sum-t">Document text</label><textarea class="txt" id="sum-t" rows="7">${esc(SAMPLE)}</textarea></div></div><div class="ctl"></div><ol class="sum-out" style="margin:0"></ol>`;
  const ta = $("textarea", b), out = $("ol", b), ctl = $(".ctl", b);
  let len = 2;
  ctl.append(seg([[1, "Short"], [2, "Medium"], [3, "Long"]], len, (v) => ((len = +v), run()), "Summary length"));
  const m = meters([["i", "Words in"], ["o", "Words out"], ["r", "Reduced"]]);
  const note = document.createElement("div");
  note.className = "note";
  note.textContent = "This model picks key sentences by word frequency, in your browser. The real app uses a language model, so try the live demo for proper summaries.";
  b.append(m, note);
  const stop = new Set("the a an and or but of to in on at for from by with is are was were be been it its this that will has had have after before during also must every not their they".split(" "));
  function run() {
    const text = ta.value.trim();
    const sents = text.match(/[^.!?]+[.!?]*/g)?.map((x) => x.trim()).filter(Boolean) || [];
    const words = (x) => x.toLowerCase().match(/[a-z0-9'-]+/g) || [];
    const freq = {};
    for (const w of words(text)) if (!stop.has(w)) freq[w] = (freq[w] || 0) + 1;
    const scored = sents.map((x, i) => {
      const ws = words(x).filter((w) => !stop.has(w));
      const v = ws.reduce((m2, w) => m2 + (freq[w] > 1 ? freq[w] : 0.25), 0) / Math.max(4, ws.length) + (i === 0 ? 0.35 : 0);
      return { x, i, v };
    });
    const max = Math.max(...scored.map((x) => x.v), 0.001);
    const take = [...scored].sort((a, c) => c.v - a.v).slice(0, len).sort((a, c) => a.i - c.i);
    out.innerHTML = take.length
      ? take.map((x) => `<li><i style="width:${Math.max(16, (x.v / max) * 100).toFixed(0)}%" aria-hidden="true"></i><span>${esc(x.x)}</span></li>`).join("")
      : `<li style="display:block;color:var(--t3)">Add some text to see a summary.</li>`;
    const wi = words(text).length, wo = take.reduce((n, x) => n + words(x.x).length, 0);
    m.set("i", wi);
    m.set("o", wo);
    m.set("r", wi ? Math.round((1 - wo / wi) * 100) + "%" : "0%");
  }
  ta.addEventListener("input", run);
  run();
}
