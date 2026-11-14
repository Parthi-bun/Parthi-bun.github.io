function boot() {
  document.documentElement.classList.add("js");
  const saved = store.get("accent", ACCENTS[0][1]);
  setAccent(ACCENTS.some((a) => a[1] === saved) ? saved : ACCENTS[0][1], false);
  initField();
  initChips();
  initDock();
  initPalette();
  initHeadline();
  initScroll();
  initSkillList();
  initFooter();
  const toys = { capture: toyCapture, reshard: toyReshard, ahrag: toyAhrag, summary: toySummary, http: toyHttp, analyzer: toyAnalyzer, finance: toyFinance, huffman: toyHuffman, skills: toySkills, plates: toyPlates, redact: toyRedact };
  $$("[data-toy]").forEach((el) => {
    try {
      toys[el.dataset.toy](el);
    } catch (e) {
      console.error(el.dataset.toy, e);
      el.innerHTML = `<p class="note">This model couldn't start in your browser.</p>`;
    }
  });
  $$(".copy-mail").forEach((b) => b.addEventListener("click", copyEmail));
  if (matchMedia("(pointer: coarse)").matches) {
    $(".hint").textContent = "The creatures react to you. Tap anywhere to scatter them.";
    $$(".toy-h .label:last-child").forEach((l) => (l.textContent = l.textContent.replace(/click/i, (m) => (m[0] === "C" ? "Tap" : "tap"))));
  }
  console.log("Hello. If you want to see how this page works, the source is at https://github.com/Parthi-bun/Parthi-bun.github.io");
  requestAnimationFrame(frame);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
