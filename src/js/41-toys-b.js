/* Working models for the HTTP server, resume analyzer, finance tracker and Huffman projects. */

function toyHttp(el) {
  const b = shell(el, "Thread pool model", "Flood it");
  b.innerHTML = `<canvas class="cv" style="--h:236px" role="img" aria-label="Requests moving from a queue through worker threads to a served stack."></canvas><div class="ctl"></div>`;
  const cv = $("canvas", b), ctl = $(".ctl", b);
  const s = fit(cv);
  const ctx = s.ctx;
  const LINES = ["GET /index.html 200", "GET /api/health 200", "POST /upload 201", "GET /missing 404", "GET /style.css 200", "PUT /notes/7 204"];
  let workers = 4, sync = true, served = 0, counter = 0, lost = 0, waitSum = 0, clock = 0, started = false, flash = 0;
  const queue = [];
  let slots = Array(8).fill(null);
  const send = (n = 1) => {
    for (let i = 0; i < n; i++) queue.push({ born: clock, line: pick(LINES), need: rand(0.5, 1.5), x: -20 });
    Sound.blip(300, 0.03);
  };
  const w = slider("Workers", 1, 8, 1, workers, (v) => v, (v) => (workers = v));
  w.classList.add("grow");
  ctl.append(w, btn("Send 1", () => send(1)), btn("Burst 25", () => send(25)), seg([["on", "Sync on"], ["off", "Sync off"]], "on", (v) => (sync = v === "on"), "Shared counter locking"));
  const m = meters([["s", "Served"], ["q", "Queued"], ["w", "Avg wait"], ["c", "Counter"], ["l", "Lost"]]);
  const note = document.createElement("div");
  note.className = "note";
  note.textContent = "A simplified model. The real server handles sockets, parsing and routing in Java.";
  b.append(m, note);

  function draw() {
    const { w: W, h: H } = s;
    ctx.clearRect(0, 0, W, H);
    ctx.font = '500 10px "IBM Plex Mono", ui-monospace, monospace';
    const qx = 14, qw = W * 0.22, wx = qx + qw + 16, ww = W * 0.5, top = 28;
    const rows = 8, gap = 3, rh = (H - top - 12 - gap * (rows - 1)) / rows;
    ctx.fillStyle = "#8b8b95";
    ctx.fillText("QUEUE", qx, 17);
    ctx.fillText("WORKERS", wx, 17);
    ctx.fillText("SERVED", wx + ww + 14, 17);
    ctx.strokeStyle = "rgba(255,255,255,.14)";
    ctx.strokeRect(qx + 0.5, top + 0.5, qw - 1, H - top - 12);
    const size = 9;
    const per = Math.max(1, Math.floor((qw - 8) / (size + 2)));
    queue.slice(0, per * 15).forEach((q, i) => {
      ctx.fillStyle = rgba(0.9);
      ctx.fillRect(qx + 5 + (i % per) * (size + 2), H - 17 - size + 5 - Math.floor(i / per) * (size + 2), size, size);
    });
    for (let i = 0; i < rows; i++) {
      const y = top + i * (rh + gap);
      const open = i < workers, job = slots[i];
      ctx.fillStyle = open ? "#131317" : "#0b0b0e";
      ctx.fillRect(wx, y, ww, rh);
      ctx.strokeStyle = open ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.05)";
      ctx.strokeRect(wx + 0.5, y + 0.5, ww - 1, rh - 1);
      if (job) {
        ctx.fillStyle = rgba(0.3);
        ctx.fillRect(wx, y, ww * clamp(job.t / job.need, 0, 1), rh);
        ctx.fillStyle = "#ededef";
        if (ww > 150) ctx.fillText(job.line, wx + 7, y + rh / 2 + 3.5);
      } else if (open) {
        ctx.fillStyle = "#5c5c66";
        ctx.fillText("idle", wx + 7, y + rh / 2 + 3.5);
      }
    }
    const sx = wx + ww + 14, sw = W - sx - 14;
    const c2 = Math.max(1, Math.floor(sw / 7));
    const shown = Math.min(served, c2 * 24);
    ctx.fillStyle = "#adadb6";
    for (let i = 0; i < shown; i++) ctx.fillRect(sx + (i % c2) * 7, H - 17 - Math.floor(i / c2) * 7, 5, 5);
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,107,87,${flash * 0.2})`;
      ctx.fillRect(0, 0, W, H);
    }
    m.set("s", served);
    m.set("q", queue.length);
    m.set("w", served ? Math.round((waitSum / served) * 1000) + " ms" : "0 ms");
    m.set("c", counter);
    m.set("l", lost, lost > 0);
  }
  addTick(cv, (dt) => {
    if (!started) {
      started = true;
      if (!REDUCED) send(10);
    }
    clock += dt;
    flash = Math.max(0, flash - dt * 3);
    for (let i = 0; i < 8; i++) {
      const j = slots[i];
      if (j) {
        j.t += dt;
        if (j.t >= j.need) {
          const busy = slots.filter(Boolean).length - 1;
          served++;
          if (!sync && busy >= 2 && Math.random() < 0.35) {
            lost++;
            flash = 1;
          } else counter++;
          slots[i] = null;
        }
      }
      if (!slots[i] && i < workers && queue.length) {
        const q = queue.shift();
        waitSum += clock - q.born;
        slots[i] = { line: q.line, need: q.need, t: 0 };
      }
    }
    draw();
  });
  draw();
  document.addEventListener("accent", draw);
}

function toyAnalyzer(el) {
  const b = shell(el, "Keyword overlap", "Paste a job post");
  const SAMPLE = "We are hiring a backend engineer to build services in Python and Go. You will design REST APIs, write SQL, run containers with Docker on AWS and Kubernetes, and care about concurrency and reliability.";
  b.innerHTML = `<div class="pad"><div><label class="field-l" for="ana-text">Job description</label><textarea class="txt" id="ana-text" rows="5">${esc(SAMPLE)}</textarea></div></div>
  <div class="ana"><canvas width="120" height="120" role="img" aria-label="Keyword overlap score"></canvas><div class="ana-l"><div><span class="field-l">In my stack</span><ul class="mini have"></ul></div><div><span class="field-l">New to me</span><ul class="mini new"></ul></div></div></div>`;
  const ta = $("textarea", b), cv = $("canvas", b), have = $(".have", b), fresh = $(".new", b);
  $(".pad", b).append(btn("Clear", () => {
    ta.value = "";
    ta.focus();
    run();
  }));
  $(".pad .btn", b).style.justifySelf = "start";
  const note = document.createElement("div");
  note.className = "note";
  note.textContent = "This is keyword matching only. The real project adds skill extraction with spaCy and semantic similarity with scikit-learn.";
  b.append(note);
  const s = fit(cv, () => draw());
  const ctx = s.ctx;
  const words = (list) => list.map((n) => ({ n, re: new RegExp("(?<![\\w+#.])" + n.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "(?![\\w+#])", "i") }));
  const KNOWN = [
    { n: "Go", re: /(?<![\w+#.])(Go|Golang|golang)(?![\w+#])/ },
    { n: "C", re: /(?<![\w+#./])C(?![\w+#/])/ },
    ...words(["Python", "Java", "JavaScript", "TypeScript", "C++", "Flutter", "FastAPI", "Spring Boot", "React", "Streamlit", "scikit-learn", "spaCy", "Git", "Docker", "MySQL", "SQL", "AWS", "EC2", "S3", "Nginx", "Vercel", "Pytest", "REST", "concurrency", "distributed systems"]),
  ];
  const OTHER = words(["Kubernetes", "Terraform", "Rust", "Kafka", "Redis", "PostgreSQL", "MongoDB", "GraphQL", "GCP", "Azure", "C#", ".NET", "Ruby", "PHP", "Swift", "Kotlin", "Angular", "Vue", "Spark", "Airflow", "PyTorch", "TensorFlow", "Jenkins", "Ansible", "CI/CD"]);
  let score = 0, shown = 0;
  function draw() {
    const { w, h } = s;
    ctx.clearRect(0, 0, w, h);
    const n = 40, lit = Math.round((shown / 100) * n), side = Math.min(w, h) - 6, per = n / 4, cell = side / per;
    for (let i = 0; i < n; i++) {
      const e = Math.floor(i / per), k = i % per;
      const p = [[3 + k * cell, 3], [3 + side - 6, 3 + k * cell], [3 + side - 6 - k * cell, 3 + side - 6], [3, 3 + side - 6 - k * cell]][e];
      ctx.fillStyle = i < lit ? Acc.hex : "#26262c";
      ctx.fillRect(p[0], p[1], Math.max(2, cell - 2), 6);
      if (e % 2) {
        ctx.clearRect(p[0], p[1], Math.max(2, cell - 2), 6);
        ctx.fillRect(p[0], p[1], 6, Math.max(2, cell - 2));
      }
    }
    ctx.fillStyle = "#ededef";
    ctx.font = `500 ${Math.round(side * 0.27)}px "IBM Plex Sans", ui-sans-serif, sans-serif`;
    const t = String(Math.round(shown));
    ctx.fillText(t, w / 2 - ctx.measureText(t).width / 2, h / 2 + side * 0.09);
  }
  function run() {
    const text = ta.value;
    const a = KNOWN.filter((k) => k.re.test(text)).map((k) => k.n);
    const c = OTHER.filter((k) => k.re.test(text)).map((k) => k.n);
    const total = a.length + c.length;
    score = total ? Math.round((100 * a.length) / total) : 0;
    have.innerHTML = a.length ? a.map((x) => `<li>${esc(x)}</li>`).join("") : `<li>None found yet</li>`;
    fresh.innerHTML = c.length ? c.map((x) => `<li>${esc(x)}</li>`).join("") : `<li>None found</li>`;
  }
  ta.addEventListener("input", run);
  run();
  shown = score;
  addTick(cv, (dt) => {
    if (Math.abs(shown - score) > 0.2) {
      shown = lerp(shown, score, 1 - Math.pow(0.001, dt));
      draw();
    } else if (shown !== score) {
      shown = score;
      draw();
    }
  });
  draw();
  document.addEventListener("accent", draw);
}

function toyFinance(el) {
  const b = shell(el, "Ledger model", "Add a transaction");
  const seed = {
    a: [
      { date: "2026-03-01", label: "Salary", amt: 2400 },
      { date: "2026-03-02", label: "Rent", amt: -650 },
      { date: "2026-03-06", label: "Groceries", amt: -120 },
      { date: "2026-03-14", label: "Freelance work", amt: 300 },
      { date: "2026-03-18", label: "Gym", amt: -45 },
    ],
    b: [
      { date: "2026-03-01", label: "Stipend", amt: 900 },
      { date: "2026-03-03", label: "Hostel fees", amt: -310 },
      { date: "2026-03-09", label: "Books", amt: -85 },
      { date: "2026-03-12", label: "Bus pass", amt: -30 },
      { date: "2026-03-20", label: "Prize money", amt: 150 },
    ],
  };
  let user = "a", sort = "Date", type = "exp";
  b.innerHTML = `<div class="ctl" style="border-top:0"></div><canvas class="cv" style="--h:110px" role="img" aria-label="Running balance over time"></canvas><div class="ledger" tabindex="0" aria-label="Transactions"></div>
  <form class="tx-form"><div><label class="field-l" for="fin-label">Label</label><input class="txt" id="fin-label" autocomplete="off" placeholder="Coffee"></div><div><label class="field-l" for="fin-amt">Amount</label><input class="txt" id="fin-amt" type="number" min="0" step="1" placeholder="12"></div></form>`;
  const top = $(".ctl", b), cv = $("canvas", b), ledger = $(".ledger", b), form = $("form", b);
  top.append(seg([["a", "User A"], ["b", "User B"]], user, (v) => ((user = v), render()), "Account"), seg(["Date", "Amount", "Type"], sort, (v) => ((sort = v), render()), "Sort transactions"));
  const typeS = seg([["inc", "Income"], ["exp", "Expense"]], type, (v) => (type = v), "Transaction type");
  typeS.style.alignSelf = "end";
  const add = btn("Add", () => {});
  add.type = "submit";
  add.style.alignSelf = "end";
  add.style.height = "auto";
  form.append(typeS, add);
  const m = meters([["b", "Balance"], ["i", "Income"], ["e", "Expenses"]]);
  const note = document.createElement("div");
  note.className = "note";
  note.textContent = "Sample data. Switching user shows that each account sees only its own transactions, as in the real app.";
  b.append(m, note);
  const s = fit(cv, () => drawChart());
  const money = (n) => (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("en-GB");

  function drawChart() {
    const ctx = s.ctx, { w, h } = s, rows = [...seed[user]].sort((x, y) => x.date.localeCompare(y.date));
    ctx.clearRect(0, 0, w, h);
    let bal = 0;
    const pts = [0, ...rows.map((r) => (bal += r.amt))];
    const lo = Math.min(...pts, 0), hi = Math.max(...pts, 1), pad = 14;
    const X = (i) => pad + (i / Math.max(1, pts.length - 1)) * (w - pad * 2);
    const Y = (v) => h - pad - ((v - lo) / (hi - lo || 1)) * (h - pad * 2);
    ctx.strokeStyle = "rgba(255,255,255,.14)";
    ctx.beginPath();
    ctx.moveTo(pad, Y(0) + 0.5);
    ctx.lineTo(w - pad, Y(0) + 0.5);
    ctx.stroke();
    ctx.strokeStyle = Acc.hex;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    pts.forEach((v, i) => {
      if (!i) ctx.moveTo(X(0), Y(v));
      else {
        ctx.lineTo(X(i), Y(pts[i - 1]));
        ctx.lineTo(X(i), Y(v));
      }
    });
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = Acc.hex;
    pts.forEach((v, i) => ctx.fillRect(X(i) - 2, Y(v) - 2, 4, 4));
  }
  function render() {
    const list = [...seed[user]];
    list.sort((x, y) => (sort === "Date" ? y.date.localeCompare(x.date) : sort === "Amount" ? Math.abs(y.amt) - Math.abs(x.amt) : Math.sign(y.amt) - Math.sign(x.amt)));
    ledger.innerHTML = list.map((r) => `<div class="tx"><span class="d">${r.date.slice(5)}</span><span>${esc(r.label)}</span><span class="a ${r.amt > 0 ? "in" : ""}">${r.amt > 0 ? "+" : ""}${money(r.amt)}</span><button type="button" aria-label="Delete ${esc(r.label)}" data-i="${seed[user].indexOf(r)}">×</button></div>`).join("") || `<div class="tx"><span></span><span>No transactions</span></div>`;
    const inc = seed[user].filter((r) => r.amt > 0).reduce((n, r) => n + r.amt, 0);
    const exp = seed[user].filter((r) => r.amt < 0).reduce((n, r) => n + r.amt, 0);
    m.set("b", money(inc + exp), inc + exp < 0);
    m.set("i", money(inc));
    m.set("e", money(-exp));
    drawChart();
  }
  ledger.addEventListener("click", (e) => {
    const t = e.target.closest("button[data-i]");
    if (t) {
      seed[user].splice(+t.dataset.i, 1);
      render();
    }
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const label = $("#fin-label").value.trim(), amt = parseFloat($("#fin-amt").value);
    if (!label) return toast("Add a label for the transaction.");
    if (!(amt > 0)) return toast("Enter an amount above zero.");
    seed[user].push({ date: new Date().toISOString().slice(0, 10), label, amt: type === "inc" ? amt : -amt });
    $("#fin-label").value = "";
    $("#fin-amt").value = "";
    render();
  });
  render();
  document.addEventListener("accent", drawChart);
}

function huffBuild(text) {
  const f = {};
  for (const c of text) f[c] = (f[c] || 0) + 1;
  const heap = [];
  let order = 0;
  const less = (a, c) => (a.f - c.f || a.o - c.o) < 0;
  const push = (n) => {
    heap.push(n);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!less(heap[i], heap[p])) break;
      [heap[i], heap[p]] = [heap[p], heap[i]];
      i = p;
    }
  };
  const popMin = () => {
    const top = heap[0], end = heap.pop();
    if (heap.length) {
      heap[0] = end;
      let i = 0;
      for (;;) {
        let m = i;
        const l = 2 * i + 1, r = l + 1;
        if (l < heap.length && less(heap[l], heap[m])) m = l;
        if (r < heap.length && less(heap[r], heap[m])) m = r;
        if (m === i) break;
        [heap[i], heap[m]] = [heap[m], heap[i]];
        i = m;
      }
    }
    return top;
  };
  Object.keys(f).sort().forEach((c) => push({ c, f: f[c], o: order++ }));
  if (!heap.length) return { root: null, codes: {}, freq: f, bits: "" };
  while (heap.length > 1) {
    const a = popMin(), c = popMin();
    push({ l: a, r: c, f: a.f + c.f, o: order++ });
  }
  const root = popMin(), codes = {};
  const walk = (n, p) => {
    if (n.c !== undefined) codes[n.c] = p || "0";
    else {
      walk(n.l, p + "0");
      walk(n.r, p + "1");
    }
  };
  walk(root, "");
  let bits = "";
  for (const c of text) bits += codes[c];
  return { root, codes, freq: f, bits };
}
function huffDecode(root, bits) {
  if (!root) return "";
  if (root.c !== undefined) return root.c.repeat(bits.length);
  let out = "", n = root;
  for (const b of bits) {
    n = b === "0" ? n.l : n.r;
    if (n.c !== undefined) {
      out += n.c;
      n = root;
    }
  }
  return out;
}

function toyHuffman(el) {
  const b = shell(el, "Huffman tree", "Type anything");
  b.innerHTML = `<div class="pad"><div><label class="field-l" for="huf-text">Text</label><input class="txt" id="huf-text" maxlength="48" value="parthiban ilango" autocomplete="off"></div></div><canvas class="cv" style="--h:252px" role="img" aria-label="The Huffman tree built from your text"></canvas><div class="codes"></div>`;
  const input = $("input", b), cv = $("canvas", b), codes = $(".codes", b);
  const m = meters([["o", "Original bits"], ["e", "Encoded bits"], ["s", "Saved"], ["r", "Round trip"]]);
  const note = document.createElement("div");
  note.className = "note";
  note.textContent = "Header size is not counted here. The real tool stores the frequency table as a JSON header.";
  b.append(m, note);
  const label = (c) => (c === " " ? "␣" : c);
  let res = huffBuild(""), leaves = [], hot = null;
  const s = fit(cv, () => draw());
  function layout(n, depth, st) {
    n.d = depth;
    if (n.c !== undefined) {
      n.xi = st.i++;
      st.max = Math.max(st.max, depth);
      leaves.push(n);
    } else {
      layout(n.l, depth + 1, st);
      layout(n.r, depth + 1, st);
      n.xi = (n.l.xi + n.r.xi) / 2;
    }
  }
  function draw() {
    const ctx = s.ctx, { w, h } = s;
    ctx.clearRect(0, 0, w, h);
    leaves = [];
    if (!res.root) {
      ctx.fillStyle = "#8b8b95";
      ctx.font = '500 11px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillText("Type some text to grow a tree.", 14, 28);
      return;
    }
    const st = { i: 0, max: 0 };
    layout(res.root, 0, st);
    const X = (n) => 18 + ((n.xi + 0.5) / st.i) * (w - 36);
    const Y = (n) => 18 + (n.d / Math.max(1, st.max)) * (h - 40);
    const path = new Set();
    if (hot !== null) {
      let n = res.root;
      path.add(n);
      for (const bit of res.codes[hot]) {
        if (n.c !== undefined) break;
        n = bit === "0" ? n.l : n.r;
        path.add(n);
      }
    }
    ctx.font = '500 9.5px "IBM Plex Mono", ui-monospace, monospace';
    const edge = (p, c, bit) => {
      const on = path.has(p) && path.has(c), x1 = X(p), y1 = Y(p), x2 = X(c), y2 = Y(c), ym = y1 + 9;
      ctx.strokeStyle = on ? Acc.hex : "rgba(255,255,255,.2)";
      ctx.lineWidth = on ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1, ym);
      ctx.lineTo(x2, ym);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      if (st.i < 15) {
        ctx.fillStyle = on ? Acc.hex : "#5c5c66";
        ctx.fillText(bit, (x1 + x2) / 2 - 3, ym - 3);
      }
    };
    const walk = (n) => {
      if (n.c === undefined) {
        edge(n, n.l, "0");
        edge(n, n.r, "1");
        walk(n.l);
        walk(n.r);
      }
    };
    walk(res.root);
    ctx.lineWidth = 1;
    const nodes = (n) => {
      const x = X(n), y = Y(n), on = path.has(n);
      if (n.c !== undefined) {
        const r = 8;
        ctx.fillStyle = on ? Acc.hex : "#1b1b20";
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
        ctx.strokeStyle = on ? Acc.hex : "rgba(255,255,255,.3)";
        ctx.strokeRect(x - r + 0.5, y - r + 0.5, r * 2 - 1, r * 2 - 1);
        ctx.fillStyle = on ? "#08080a" : "#ededef";
        const t = label(n.c);
        ctx.fillText(t, x - ctx.measureText(t).width / 2, y + 3.5);
      } else {
        const r = 5;
        ctx.fillStyle = on ? Acc.hex : "#5c5c66";
        ctx.beginPath();
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r, y);
        ctx.lineTo(x, y + r);
        ctx.lineTo(x - r, y);
        ctx.closePath();
        ctx.fill();
        nodes(n.l);
        nodes(n.r);
      }
    };
    nodes(res.root);
    leaves.forEach((n) => {
      n.sx = X(n);
      n.sy = Y(n);
    });
  }
  function setHot(c) {
    if (c === hot) return;
    hot = c;
    $$(".code", codes).forEach((x) => x.classList.toggle("on", x.dataset.c === c));
    draw();
  }
  function run() {
    const text = input.value;
    res = huffBuild(text);
    hot = null;
    const o = text.length * 8, e = res.bits.length;
    const list = Object.keys(res.freq).sort((a, c) => res.freq[c] - res.freq[a] || a.localeCompare(c));
    codes.innerHTML = list.map((c) => `<span class="code" data-c="${esc(c)}" tabindex="0"><b>${esc(label(c))}</b>${res.codes[c]}</span>`).join("");
    m.set("o", o);
    m.set("e", e);
    m.set("s", o ? Math.round((1 - e / o) * 100) + "%" : "0%");
    const ok = huffDecode(res.root, res.bits) === text;
    m.set("r", ok ? "OK" : "FAIL", !ok);
    draw();
  }
  codes.addEventListener("pointerover", (e) => {
    const t = e.target.closest(".code");
    if (t) setHot(t.dataset.c);
  });
  codes.addEventListener("pointerleave", () => setHot(null));
  codes.addEventListener("focusin", (e) => {
    const t = e.target.closest(".code");
    if (t) setHot(t.dataset.c);
  });
  cv.addEventListener("pointermove", (e) => {
    const p = evPos(e, cv);
    const n = leaves.find((l) => Math.abs(l.sx - p.x) < 11 && Math.abs(l.sy - p.y) < 11);
    setHot(n ? n.c : null);
  });
  cv.addEventListener("pointerleave", () => setHot(null));
  input.addEventListener("input", run);
  run();
  document.addEventListener("accent", draw);
}
