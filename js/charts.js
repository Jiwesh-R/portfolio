/*
 * charts.js - dependency-free canvas line chart with hover/tap crosshair.
 * Usage: Charts.render(canvasEl, chartConfig)
 */
window.Charts = (function () {
  const AXIS = "#2c332c";
  const TEXT = "#7d857d";

  function render(canvas, cfg) {
    const dpr = window.devicePixelRatio || 1;
    // Logical size derived from CSS width; fixed aspect.
    const cssW = canvas.clientWidth || 480;
    const cssH = Math.max(160, Math.round(cssW * 0.42));
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.height = cssH + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = { l: 40, r: 12, t: 10, b: 22 };
    const plotW = cssW - pad.l - pad.r;
    const plotH = cssH - pad.t - pad.b;

    const all = cfg.series.flatMap((s) => s.points);
    let min = Math.min(...all), max = Math.max(...all);
    const span = max - min || 1;
    min -= span * 0.1; max += span * 0.1;
    const n = Math.max(...cfg.series.map((s) => s.points.length));

    const xAt = (i) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * plotW);
    const yAt = (v) => pad.t + plotH - ((v - min) / (max - min)) * plotH;

    function draw(hoverIdx) {
      ctx.clearRect(0, 0, cssW, cssH);

      // gridlines + y labels
      ctx.font = "10px Consolas, monospace";
      ctx.fillStyle = TEXT; ctx.strokeStyle = AXIS; ctx.lineWidth = 1;
      const rows = 4;
      for (let r = 0; r <= rows; r++) {
        const val = min + ((max - min) * r) / rows;
        const y = yAt(val);
        ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(cssW - pad.r, y); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.textAlign = "right"; ctx.textBaseline = "middle";
        ctx.fillText(val.toFixed(0), pad.l - 5, y);
      }

      // series lines
      cfg.series.forEach((s) => {
        ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.beginPath();
        s.points.forEach((v, i) => {
          const x = xAt(i), y = yAt(v);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        // area fill (subtle)
        ctx.lineTo(xAt(s.points.length - 1), pad.t + plotH);
        ctx.lineTo(xAt(0), pad.t + plotH);
        ctx.closePath();
        ctx.globalAlpha = 0.08; ctx.fillStyle = s.color; ctx.fill(); ctx.globalAlpha = 1;
      });

      // crosshair + tooltip
      if (hoverIdx != null) {
        const x = xAt(hoverIdx);
        ctx.strokeStyle = "#ff9d00"; ctx.globalAlpha = 0.5; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t + plotH); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;

        const lines = cfg.series.map((s) => ({
          name: s.name, color: s.color, val: s.points[hoverIdx],
        }));
        const boxW = 96, boxH = 14 + lines.length * 14;
        let bx = x + 8; if (bx + boxW > cssW) bx = x - boxW - 8;
        const by = pad.t + 4;
        ctx.fillStyle = "#000"; ctx.strokeStyle = "#ff9d00";
        ctx.globalAlpha = 0.92; ctx.fillRect(bx, by, boxW, boxH); ctx.globalAlpha = 1;
        ctx.strokeRect(bx, by, boxW, boxH);
        ctx.textAlign = "left"; ctx.textBaseline = "top";
        ctx.fillStyle = TEXT; ctx.fillText("t" + (hoverIdx + 1), bx + 6, by + 3);
        lines.forEach((l, i) => {
          const ly = by + 14 + i * 14;
          ctx.fillStyle = l.color; ctx.fillRect(bx + 6, ly + 3, 8, 3);
          ctx.fillStyle = "#e8e6e0";
          ctx.fillText(l.name + " " + l.val, bx + 18, ly);
        });

        // point dots
        cfg.series.forEach((s) => {
          ctx.fillStyle = s.color;
          ctx.beginPath(); ctx.arc(x, yAt(s.points[hoverIdx]), 3, 0, Math.PI * 2); ctx.fill();
        });
      }
    }

    draw(null);

    function idxFromEvent(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const px = clientX - rect.left;
      const rel = (px - pad.l) / plotW;
      const i = Math.round(rel * (n - 1));
      return Math.max(0, Math.min(n - 1, i));
    }
    const onMove = (e) => { draw(idxFromEvent(e)); if (e.touches) e.preventDefault(); };
    const onLeave = () => draw(null);

    canvas.onmousemove = onMove;
    canvas.onmouseleave = onLeave;
    canvas.ontouchstart = onMove;
    canvas.ontouchmove = onMove;
  }

  return { render };
})();
