function boot() {
  setAccent(store.get("accent", ACCENTS[0][1]), false);
  initField();
  initChips();
  initDock();
  initPalette();
  initHeadline();
  initStats();
  initMarquee();
  initScroll();
  initMagnets();
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
  $("#mail").addEventListener("click", copyEmail);
  if (matchMedia("(pointer: coarse)").matches) {
    $(".hint").textContent = "The page behind this text is live. Tap anywhere to send a ripple.";
    $$(".toy-h .label:last-child").forEach((l) => (l.textContent = l.textContent.replace(/click/i, (m) => (m[0] === "C" ? "Tap" : "tap"))));
  }
  requestAnimationFrame(frame);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
