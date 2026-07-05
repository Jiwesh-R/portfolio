/*
 * terminal.js - boot sequence, command parser, screen renderers, keyboard nav,
 * clock/market status, keypress beeps. Wires ticker + panels + charts together.
 */
(function () {
  const C = window.CONTENT;
  const $ = (s) => document.querySelector(s);

  const els = {
    boot: $("#boot"),
    bootLog: $("#boot-log"),
    bootCursor: $("#boot-cursor"),
    terminal: $("#terminal"),
    ticker: $("#ticker"),
    cmd: $("#cmd"),
    ghost: $("#cmd-ghost"),
    cmdGo: $("#cmd-go"),
    workspace: $("#workspace"),
    fkeys: $("#fkeys"),
    clock: $("#clock"),
    mktStatus: $("#market-status"),
    muteBtn: $("#mute-btn"),
  };

  /* ---------------- SOUND (keypress beeps) ---------------- */
  const Sound = (function () {
    let ctx = null, muted = false;
    function ensure() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } }
    function beep(freq, dur) {
      if (muted) return;
      ensure(); if (!ctx) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "square"; o.frequency.value = freq;
      g.gain.value = 0.015;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (dur || 0.03));
      o.stop(ctx.currentTime + (dur || 0.03));
    }
    return {
      key: () => beep(660, 0.02),
      enter: () => beep(880, 0.06),
      err: () => beep(160, 0.12),
      toggle() { muted = !muted; return muted; },
      isMuted: () => muted,
    };
  })();

  /* ---------------- SCREEN RENDERERS ---------------- */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  const Screens = {
    WELCOME() {
      const p = C.profile;
      return {
        id: "welcome", title: "SECURITY DESCRIPTION", badge: "DES",
        bodyHTML:
          '<div class="selectable">' +
          '<div class="big amber">' + esc(p.name) + '</div>' +
          '<div class="sub">' + esc(p.title) + ' &middot; ' + esc(p.location) + '</div>' +
          '<hr class="divider">' +
          '<p class="hl">' + esc(p.summary) + '</p>' +
          '<hr class="divider">' +
          '<div class="muted">Type <b class="amber">HELP</b> for commands, or use the <b class="amber">F1-F8</b> keys below. ' +
          'Try <b class="amber">PROJ</b>, <b class="amber">SKILL</b>, or <b class="amber">EXP</b>.</div>' +
          "</div>",
        width: 620, height: 300,
      };
    },

    HELP() {
      const rows = CMD_HELP.map((c) =>
        '<tr><td class="help-cmd">' + c.k + '</td><td class="help-desc">' + c.d + "</td></tr>"
      ).join("");
      return {
        id: "help", title: "COMMAND MENU", badge: "HELP",
        bodyHTML: '<table class="help-table">' + rows + "</table>",
        width: 480, height: 380,
      };
    },

    BIO() {
      const p = C.profile;
      return {
        id: "bio", title: "PROFESSIONAL SUMMARY", badge: "BIO",
        bodyHTML:
          '<div class="selectable">' +
          '<div class="kvs">' +
          kv("NAME", p.name) + kv("FOCUS", p.title) + kv("LOCATION", p.location) +
          '</div><hr class="divider">' +
          '<p class="hl">' + esc(p.summary) + "</p></div>",
        width: 560, height: 280,
      };
    },

    EDU() {
      const body = C.education.map((e) =>
        '<div class="edu-block selectable">' +
        '<div class="exp-head"><span class="exp-co">' + esc(e.school) + '</span>' +
        '<span class="exp-meta">' + esc(e.dates) + "</span></div>" +
        '<div class="exp-role">' + esc(e.degree) + '</div>' +
        '<div class="sub">' + esc(e.location) + ' &middot; <span class="green">' + esc(e.detail) + "</span></div>" +
        '<div class="sub" style="margin-top:8px;color:var(--amber)">COURSEWORK</div>' +
        '<ul class="bullets">' + e.coursework.map((c) => "<li>" + esc(c) + "</li>").join("") + "</ul>" +
        "</div>"
      ).join("");
      return { id: "edu", title: "EDUCATION", badge: "EDU", bodyHTML: body, width: 560, height: 360 };
    },

    EXP() {
      const body = C.experience.map((e) =>
        '<div class="exp-block selectable">' +
        '<div class="exp-head"><span class="exp-co">' + esc(e.company) +
        '<span class="tag">' + esc(e.ticker) + "</span></span>" +
        '<span class="exp-meta">' + esc(e.dates) + "</span></div>" +
        '<div class="exp-role">' + esc(e.role) + ' &middot; <span class="muted">' + esc(e.location) + "</span></div>" +
        '<ul class="bullets">' + e.bullets.map((b) => "<li>" + esc(b) + "</li>").join("") + "</ul>" +
        "</div>"
      ).join('<hr class="divider">');
      return { id: "exp", title: "EXPERIENCE", badge: "EXP", bodyHTML: body, width: 620, height: 420 };
    },

    PROJ(arg) {
      // PROJ <n> -> single project with chart; PROJ -> list
      if (arg) {
        const idx = parseInt(arg, 10) - 1;
        const pr = C.projects[idx];
        if (pr) return projPanel(pr);
      }
      const body = C.projects.map((pr, i) =>
        '<div class="proj-block selectable">' +
        '<div class="exp-head"><span class="exp-co">' + esc(pr.code) + ": " + esc(pr.name) + "</span>" +
        '<span class="exp-meta">' + esc(pr.dates) + "</span></div>" +
        '<div class="sub blue">' + esc(pr.stack) + "</div>" +
        '<ul class="bullets">' + pr.bullets.map((b) => "<li>" + esc(b) + "</li>").join("") + "</ul>" +
        '<div class="muted">Type <b class="amber">' + esc(pr.code) + '</b> to open the metric chart.</div>' +
        "</div>"
      ).join('<hr class="divider">');
      return { id: "proj", title: "PROJECTS", badge: "PROJ", bodyHTML: body, width: 640, height: 440 };
    },

    SKILL() {
      const cats = Object.entries(C.skills).map(([cat, arr]) =>
        '<div class="skill-cat"><h4>' + esc(cat) + "</h4>" +
        '<div class="skill-quotes">' +
        arr.map((s) => '<div class="sq" data-sym="' + s.sym + '"><span class="sq-sym">' + esc(s.sym) +
          '</span><span class="sq-px">' + s.base.toFixed(2) + "</span></div>").join("") +
        "</div></div>"
      ).join("");
      return {
        id: "skill", title: "SKILLS MONITOR  |  LIVE", badge: "SKILL",
        bodyHTML: '<div class="muted" style="margin-bottom:8px">Live quotes &middot; each skill priced like a security. Watch the tape up top.</div>' + cats,
        width: 640, height: 460,
      };
    },

    CONTACT() {
      const p = C.profile;
      return {
        id: "contact", title: "CONTACT  |  MSG", badge: "MSG",
        bodyHTML:
          '<div class="selectable">' +
          '<div class="contact-line">EMAIL &nbsp;&nbsp;<a href="mailto:' + esc(p.email) + '">' + esc(p.email) + "</a></div>" +
          '<div class="contact-line">PHONE &nbsp;&nbsp;<span class="hl">' + esc(p.phone) + "</span></div>" +
          '<div class="contact-line">LINKEDIN <a href="' + esc(p.linkedinUrl) + '" target="_blank" rel="noopener">' + esc(p.linkedin) + "</a></div>" +
          '<div class="contact-line">LOCATION <span class="hl">' + esc(p.location) + "</span></div>" +
          '<hr class="divider">' +
          '<a class="btn" href="' + esc(p.resume) + '" target="_blank" rel="noopener">DOWNLOAD RESUME (PDF)</a>' +
          "</div>",
        width: 520, height: 300,
      };
    },

    CV() {
      window.open(C.profile.resume, "_blank", "noopener");
      return {
        id: "cv", title: "RESUME  |  PRINT", badge: "CV",
        bodyHTML:
          '<div class="muted">Opening <b class="amber">' + esc(C.profile.resume) + '</b> in a new tab...</div>' +
          '<a class="btn" href="' + esc(C.profile.resume) + '" target="_blank" rel="noopener">OPEN RESUME (PDF)</a>',
        width: 420, height: 160,
      };
    },

    CHART() {
      // open both project charts
      C.projects.forEach((pr) => openPanel(projPanel(pr)));
      return null; // panels already opened
    },
  };

  function projPanel(pr) {
    const ch = pr.chart;
    const legend = ch.series.map((s) =>
      '<span><i style="background:' + s.color + '"></i>' + esc(s.name) + "</span>").join("");
    return {
      id: "chart-" + pr.code.replace(/\s+/g, ""),
      title: pr.code + " CHART", badge: "GIP",
      bodyHTML:
        '<div class="sub amber">' + esc(ch.title) + "</div>" +
        '<div class="chart-legend">' + legend + "</div>" +
        '<canvas class="chart" data-chart=\'' + JSON.stringify(ch).replace(/'/g, "&#39;") + '\'></canvas>' +
        '<div class="chart-stat">' + esc(ch.stat) + "</div>" +
        '<div class="sub" style="margin-top:6px">' + esc(pr.name) + "</div>",
      width: 520, height: 320,
    };
  }

  function kv(k, v) {
    return '<div class="kv"><span class="k">' + esc(k) + '</span><span class="v">' + esc(v) + "</span></div>";
  }

  /* ---------------- LIVE SKILL SCREEN UPDATES ---------------- */
  window.SkillScreen = {
    update(quotes) {
      const panel = Panels.registry.get("skill");
      if (!panel) return;
      const map = {}; quotes.forEach((q) => (map[q.sym] = q));
      panel.querySelectorAll(".sq").forEach((el) => {
        const q = map[el.dataset.sym];
        if (!q) return;
        el.classList.toggle("up", q.chg >= 0);
        el.classList.toggle("down", q.chg < 0);
        const px = el.querySelector(".sq-px");
        if (px) px.textContent = q.px.toFixed(2);
      });
    },
  };

  /* ---------------- COMMAND ROUTING ---------------- */
  // aliases -> canonical screen key
  const ALIASES = {
    HELP: "HELP", "?": "HELP", MENU: "HELP",
    BIO: "BIO", DES: "BIO", ABOUT: "BIO", SUMMARY: "BIO",
    EDU: "EDU", EDUCATION: "EDU", SCHOOL: "EDU",
    EXP: "EXP", EXPERIENCE: "EXP", WORK: "EXP",
    PROJ: "PROJ", PROJECTS: "PROJ", PROJECT: "PROJ",
    SKILL: "SKILL", SKILLS: "SKILL", TECH: "SKILL",
    MSG: "CONTACT", CONTACT: "CONTACT", EMAIL: "CONTACT",
    CV: "CV", RESUME: "CV", PRINT: "CV",
    GIP: "CHART", CHART: "CHART", CHARTS: "CHART",
    HOME: "WELCOME", WELCOME: "WELCOME",
  };

  const CMD_HELP = [
    { k: "HELP / ?", d: "Show this command menu" },
    { k: "BIO / DES", d: "Professional summary" },
    { k: "EXP", d: "Work experience" },
    { k: "EDU", d: "Education" },
    { k: "PROJ [n]", d: "Projects (PROJ 1 / PROJ 2 opens chart)" },
    { k: "SKILL", d: "Live skills monitor" },
    { k: "GIP / CHART", d: "Open project metric charts" },
    { k: "MSG / CONTACT", d: "Contact details" },
    { k: "CV / PRINT", d: "Open/download resume PDF" },
    { k: "TILE", d: "Arrange panels in a grid" },
    { k: "CLS / CLEAR", d: "Close all panels" },
    { k: "MUTE", d: "Toggle sound" },
  ];

  // For autocomplete
  const COMPLETIONS = ["HELP", "BIO", "DES", "EXP", "EDU", "PROJ", "PROJ 1", "PROJ 2",
    "SKILL", "GIP", "CHART", "MSG", "CONTACT", "CV", "PRINT", "TILE", "CLS", "CLEAR", "MUTE", "HOME"];

  function openPanel(cfg) { if (cfg) Panels.create(cfg); }

  function run(raw) {
    const input = raw.trim().toUpperCase();
    if (!input) return;
    const parts = input.split(/\s+/);
    const head = parts[0];
    const arg = parts.slice(1).join(" ");

    // system commands
    if (head === "CLS" || head === "CLEAR") { Panels.closeAll(); Panels.untile(); return; }
    if (head === "TILE") { Panels.tile(); return; }
    if (head === "MUTE" || head === "SND") { toggleMute(); return; }

    // PROJ N special-case (arg carries number)
    const key = ALIASES[head];
    if (!key) return err(input);

    const cfg = Screens[key](key === "PROJ" ? arg : undefined);
    // CHART / CV may open their own panels and return null
    if (cfg) { Panels.untile(); openPanel(cfg); }
    setActiveFkey(key);
  }

  function err(input) {
    Sound.err();
    Panels.create({
      id: "err", title: "INVALID COMMAND", badge: "ERR",
      bodyHTML: '<div class="err">"' + esc(input) + '" is not a recognized command.</div>' +
        '<div class="muted" style="margin-top:6px">Type <b class="amber">HELP</b> for the command menu.</div>',
      width: 400, height: 140,
    });
  }

  /* ---------------- FUNCTION KEYS ---------------- */
  const FKEYS = [
    { n: "F1", cmd: "HELP", label: "HELP" },
    { n: "F2", cmd: "BIO", label: "BIO" },
    { n: "F3", cmd: "EXP", label: "EXP" },
    { n: "F4", cmd: "EDU", label: "EDU" },
    { n: "F5", cmd: "PROJ", label: "PROJ" },
    { n: "F6", cmd: "SKILL", label: "SKILL" },
    { n: "F7", cmd: "CHART", label: "GIP" },
    { n: "F8", cmd: "CONTACT", label: "MSG" },
  ];

  function buildFkeys() {
    els.fkeys.innerHTML = FKEYS.map((f) =>
      '<button class="fkey" data-cmd="' + f.cmd + '" data-key="' + f.n + '">' +
      '<span class="fk-num">' + f.n + "</span>" + f.label + "</button>"
    ).join("");
    els.fkeys.querySelectorAll(".fkey").forEach((b) => {
      b.addEventListener("click", () => { Sound.enter(); run(b.dataset.cmd); });
    });
  }

  function setActiveFkey(canonKey) {
    els.fkeys.querySelectorAll(".fkey").forEach((b) => {
      const target = ALIASES[b.dataset.cmd] || b.dataset.cmd;
      b.classList.toggle("active", target === canonKey);
    });
  }

  /* ---------------- CLOCK + MARKET STATUS ---------------- */
  function tickClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    els.clock.textContent = hh + ":" + mm + ":" + ss + " EDT";
    // NYSE-ish: Mon-Fri 09:30-16:00
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();
    const open = day >= 1 && day <= 5 && mins >= 570 && mins < 960;
    els.mktStatus.textContent = open ? "MKT OPEN" : "MKT CLOSED";
    els.mktStatus.className = "mkt-status " + (open ? "open" : "closed");
  }

  /* ---------------- AUTOCOMPLETE + HISTORY ---------------- */
  const history = [];
  let histIdx = -1;

  function updateGhost() {
    const val = els.cmd.value.toUpperCase();
    if (!val) { els.ghost.textContent = ""; return; }
    const match = COMPLETIONS.find((c) => c.startsWith(val) && c !== val);
    els.ghost.textContent = match || "";
  }

  function acceptGhost() {
    const g = els.ghost.textContent;
    if (g) { els.cmd.value = g; els.ghost.textContent = ""; }
  }

  function submit() {
    const v = els.cmd.value;
    if (!v.trim()) return;
    Sound.enter();
    history.push(v); histIdx = history.length;
    run(v);
    els.cmd.value = ""; els.ghost.textContent = "";
  }

  function toggleMute() {
    const muted = Sound.toggle();
    els.muteBtn.classList.toggle("muted", muted);
    els.muteBtn.innerHTML = (muted ? "\uD83D\uDD07 MUTE" : "\uD83D\uDD0A SND");
  }

  function bindInput() {
    els.cmd.addEventListener("input", () => { Sound.key(); updateGhost(); });
    els.cmd.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { submit(); }
      else if (e.key === "Tab") { e.preventDefault(); acceptGhost(); }
      else if (e.key === "ArrowRight" && els.cmd.selectionStart === els.cmd.value.length) { acceptGhost(); }
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (histIdx > 0) { histIdx--; els.cmd.value = history[histIdx]; updateGhost(); }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (histIdx < history.length - 1) { histIdx++; els.cmd.value = history[histIdx]; updateGhost(); }
        else { histIdx = history.length; els.cmd.value = ""; els.ghost.textContent = ""; }
      }
    });
    els.cmdGo.addEventListener("click", submit);
    els.muteBtn.addEventListener("click", toggleMute);

    // global function-key shortcuts
    document.addEventListener("keydown", (e) => {
      const f = FKEYS.find((k) => k.n === e.key);
      if (f) { e.preventDefault(); Sound.enter(); run(f.cmd); }
    });
  }

  /* ---------------- BOOT SEQUENCE ---------------- */
  const BOOT_LINES_FULL = [
    "JR TERMINAL (R) PROFESSIONAL SERVICE",
    "(C) 2026 JIWESH RAJBHANDARI. ALL RIGHTS RESERVED.",
    "",
    "INITIALIZING SESSION...............[ OK ]",
    "LOADING MARKET DATA FEED...........[ OK ]",
    "MOUNTING RESUME VOLUME.............[ OK ]",
    "CALIBRATING QUANT ENGINES..........[ OK ]",
    "AUTHENTICATING USER: JRAJBHANDARI..[ OK ]",
    "",
    "CONNECTION ESTABLISHED. WELCOME, JIWESH.",
    "LAUNCHING TERMINAL...",
  ];
  const BOOT_LINES_MOBILE = [
    "JR TERMINAL (R) PROFESSIONAL",
    "AUTHENTICATING.........[ OK ]",
    "WELCOME, JIWESH.",
  ];

  function boot() {
    const mobile = window.matchMedia("(max-width: 720px)").matches;
    const lines = mobile ? BOOT_LINES_MOBILE : BOOT_LINES_FULL;
    let li = 0, ci = 0;
    const speed = mobile ? 6 : 9;

    function type() {
      if (li >= lines.length) return finish();
      const line = lines[li];
      if (ci <= line.length) {
        els.bootLog.textContent = lines.slice(0, li).join("\n") + (li ? "\n" : "") + line.slice(0, ci);
        ci++;
        setTimeout(type, line.length ? (1000 / (speed * 6)) : 120);
      } else {
        els.bootLog.textContent = lines.slice(0, li + 1).join("\n");
        li++; ci = 0;
        setTimeout(type, 90);
      }
    }
    type();

    function finish() {
      setTimeout(() => {
        els.boot.style.transition = "opacity 0.35s";
        els.boot.style.opacity = "0";
        setTimeout(() => {
          els.boot.remove();
          els.terminal.hidden = false;
          start();
        }, 350);
      }, 450);
    }
  }

  function skipBoot() {
    if (els.boot && els.boot.parentNode) {
      els.boot.remove();
      els.terminal.hidden = false;
      start();
    }
  }

  /* ---------------- STARTUP ---------------- */
  let started = false;
  function start() {
    if (started) return; started = true;
    Panels.init(els.workspace);
    buildFkeys();
    bindInput();
    Ticker.init(C.skills, els.ticker, (sym, isSkill) => {
      Sound.enter();
      if (isSkill) run("SKILL");
      else window.open("https://finance.yahoo.com/quote/" + encodeURIComponent(sym), "_blank", "noopener");
    });
    tickClock(); setInterval(tickClock, 1000);
    // opening screen
    openPanel(Screens.WELCOME());
    setActiveFkey("WELCOME");
    els.cmd.focus();
  }

  // allow click/keypress to skip boot
  document.addEventListener("keydown", function skip(e) {
    if (els.boot && els.boot.parentNode && (e.key === "Enter" || e.key === "Escape")) {
      skipBoot(); document.removeEventListener("keydown", skip);
    }
  });
  els.boot.addEventListener("click", skipBoot);

  boot();
})();
