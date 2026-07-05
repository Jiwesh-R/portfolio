/*
 * ticker.js - live market ticker tape + simulated skill quotes.
 *
 * Tape: real quotes from Yahoo Finance (spark endpoint) fetched through the
 * free allorigins.win CORS proxy - no API key needed. Refreshes every 60s.
 * If the feed is unreachable, the tape falls back to the simulated skill ticker.
 *
 * Skills: the SKILL panel keeps its own simulated random-walk prices.
 */
window.Ticker = (function () {
  const SYMBOLS = [
    "SPY", "QQQ", "DIA", "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META",
    "TSLA", "JPM", "GS", "BLK", "V", "BTC-USD", "ETH-USD", "^VIX", "^TNX",
  ];
  // Friendly display names for index-style symbols
  const DISPLAY = { "^VIX": "VIX", "^TNX": "US10Y", "BTC-USD": "BTC", "ETH-USD": "ETH" };

  const YAHOO_URL =
    "https://query1.finance.yahoo.com/v8/finance/spark?symbols=" +
    encodeURIComponent(SYMBOLS.join(",")) + "&range=1d&interval=1d";
  const PROXY_URL = "https://api.allorigins.win/raw?url=" + encodeURIComponent(YAHOO_URL);
  const REFRESH_MS = 60000;

  let el = null;
  let onClick = null;
  let stockQuotes = [];   // {sym, disp, px, chg, pct}
  let live = false;       // true once a real fetch succeeded

  /* ---------- simulated skill quotes (drives the SKILL panel) ---------- */
  let skillQuotes = [];   // {sym, px, prev, base, chg, pct}

  function buildSkills(skills) {
    skillQuotes = [];
    Object.values(skills).forEach((arr) => {
      arr.forEach((s) => {
        skillQuotes.push({ sym: s.sym, base: s.base, px: s.base, prev: s.base, chg: 0, pct: 0 });
      });
    });
  }

  function stepSkills() {
    skillQuotes.forEach((q) => {
      const drift = (q.base - q.px) * 0.02;
      const shock = (Math.random() - 0.5) * q.base * 0.012;
      q.prev = q.px;
      q.px = Math.max(1, q.px + drift + shock);
      q.chg = q.px - q.base;
      q.pct = (q.chg / q.base) * 100;
    });
    if (window.SkillScreen && window.SkillScreen.update) window.SkillScreen.update(skillQuotes);
    if (!live) renderTape(skillQuotes, true); // fallback tape if feed is down
  }

  /* ---------- real market data ---------- */
  async function fetchQuotes() {
    try {
      const res = await fetch(PROXY_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const quotes = [];
      SYMBOLS.forEach((sym) => {
        const d = data[sym];
        if (!d || d.close == null) return;
        const px = Array.isArray(d.close) ? d.close[d.close.length - 1] : d.close;
        const prev = d.chartPreviousClose || d.previousClose || px;
        if (px == null || !isFinite(px)) return;
        const chg = px - prev;
        quotes.push({
          sym: sym,
          disp: DISPLAY[sym] || sym,
          px: px,
          chg: chg,
          pct: prev ? (chg / prev) * 100 : 0,
        });
      });
      if (quotes.length) {
        stockQuotes = quotes;
        live = true;
        renderTape(stockQuotes, false);
      }
    } catch (e) {
      // keep whatever is currently shown; fallback tape covers first-load failure
    }
  }

  /* ---------- rendering ---------- */
  function quoteHTML(q, isSkill) {
    const up = q.chg >= 0;
    const cls = up ? "up" : "down";
    const arrow = up ? "\u25B2" : "\u25BC";
    const sign = up ? "+" : "";
    const disp = q.disp || q.sym;
    const px = q.px >= 1000 ? q.px.toFixed(0) : q.px.toFixed(2);
    return (
      '<span class="tk ' + cls + '" data-sym="' + q.sym + '" data-skill="' + (isSkill ? 1 : 0) + '">' +
      '<span class="tk-sym">' + disp + '</span>' +
      '<span class="tk-px">' + px + '</span>' +
      '<span class="tk-arrow">' + arrow + '</span>' +
      '<span class="tk-chg">' + sign + q.pct.toFixed(2) + '%</span>' +
      '</span>'
    );
  }

  function renderTape(quotes, isSkill) {
    if (!el) return;
    const strip = quotes.map((q) => quoteHTML(q, isSkill)).join("");
    el.innerHTML = strip + strip; // duplicated for seamless -50% loop
  }

  /* ---------- init ---------- */
  function init(skills, tickerEl, clickHandler) {
    el = tickerEl;
    onClick = clickHandler;

    buildSkills(skills);
    renderTape(skillQuotes, true); // instant paint while first fetch is in flight
    setInterval(stepSkills, 1500);

    fetchQuotes();
    setInterval(fetchQuotes, REFRESH_MS);

    el.addEventListener("click", (e) => {
      const tk = e.target.closest(".tk");
      if (tk && onClick) onClick(tk.dataset.sym, tk.dataset.skill === "1");
    });
  }

  function getQuotes() { return live ? stockQuotes : skillQuotes; }

  return { init, getQuotes };
})();
