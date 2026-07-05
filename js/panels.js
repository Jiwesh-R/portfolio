/*
 * panels.js - draggable / resizable terminal panels.
 * Desktop: panels float, drag by titlebar, resize via corner handle, focus on click.
 * Mobile (<=720px): panels stack in normal flow (CSS handles the override).
 */
window.Panels = (function () {
  let workspace = null;
  let zTop = 5;
  let cascade = 0;
  const registry = new Map(); // id -> element

  function isMobile() { return window.matchMedia("(max-width: 720px)").matches; }

  function focus(panel) {
    registry.forEach((p) => p.classList.remove("focused"));
    panel.classList.add("focused");
    if (!isMobile()) panel.style.zIndex = ++zTop;
  }

  function create({ id, title, badge, bodyHTML, width, height }) {
    // replace if already open
    if (registry.has(id)) close(id);

    const panel = document.createElement("section");
    panel.className = "panel floating";
    panel.dataset.id = id;

    const bar = document.createElement("div");
    bar.className = "panel-titlebar";
    bar.innerHTML =
      '<span class="panel-title">' +
      (badge ? '<span class="panel-badge">' + badge + "</span>" : "") +
      title + "</span>" +
      '<span class="panel-controls">' +
      '<button class="panel-btn" data-act="tile" title="Tile">&#9707;</button>' +
      '<button class="panel-btn" data-act="close" title="Close">&times;</button>' +
      "</span>";

    const body = document.createElement("div");
    body.className = "panel-body";
    body.innerHTML = bodyHTML;

    const handle = document.createElement("div");
    handle.className = "resize-handle";

    panel.appendChild(bar);
    panel.appendChild(body);
    panel.appendChild(handle);
    workspace.appendChild(panel);
    registry.set(id, panel);

    if (!isMobile()) {
      const w = width || Math.min(560, workspace.clientWidth - 40);
      const h = height || 340;
      panel.style.width = w + "px";
      panel.style.height = h + "px";
      const offset = (cascade % 6) * 26;
      panel.style.left = (16 + offset) + "px";
      panel.style.top = (12 + offset) + "px";
      cascade++;
      makeDraggable(panel, bar);
      makeResizable(panel, handle);
    }

    panel.addEventListener("mousedown", () => focus(panel));
    bar.querySelector('[data-act="close"]').addEventListener("click", (e) => {
      e.stopPropagation(); close(id);
    });
    bar.querySelector('[data-act="tile"]').addEventListener("click", (e) => {
      e.stopPropagation(); tile();
    });

    focus(panel);
    // let charts size themselves now that panel has width
    requestAnimationFrame(() => renderPending(panel));
    return panel;
  }

  // charts are described by data-attrs and rendered after layout
  function renderPending(scope) {
    scope.querySelectorAll("canvas.chart[data-chart]").forEach((cv) => {
      try {
        const cfg = JSON.parse(cv.dataset.chart);
        window.Charts.render(cv, cfg);
      } catch (e) { /* noop */ }
    });
  }

  function makeDraggable(panel, handleEl) {
    let sx, sy, ox, oy, dragging = false;
    handleEl.addEventListener("mousedown", (e) => {
      if (e.target.closest(".panel-btn")) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      ox = panel.offsetLeft; oy = panel.offsetTop;
      focus(panel);
      e.preventDefault();
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    });
    function move(e) {
      if (!dragging) return;
      let nx = ox + (e.clientX - sx);
      let ny = oy + (e.clientY - sy);
      nx = Math.max(0, Math.min(nx, workspace.clientWidth - 60));
      ny = Math.max(0, Math.min(ny, workspace.clientHeight - 30));
      panel.style.left = nx + "px";
      panel.style.top = ny + "px";
    }
    function up() { dragging = false; document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); }
  }

  function makeResizable(panel, handleEl) {
    let sx, sy, ow, oh, resizing = false;
    handleEl.addEventListener("mousedown", (e) => {
      resizing = true;
      sx = e.clientX; sy = e.clientY;
      ow = panel.offsetWidth; oh = panel.offsetHeight;
      e.preventDefault(); e.stopPropagation();
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    });
    function move(e) {
      if (!resizing) return;
      panel.style.width = Math.max(240, ow + (e.clientX - sx)) + "px";
      panel.style.height = Math.max(140, oh + (e.clientY - sy)) + "px";
    }
    function up() {
      resizing = false;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      renderPending(panel); // re-render charts at new size
    }
  }

  function close(id) {
    const p = registry.get(id);
    if (p) { p.remove(); registry.delete(id); }
  }

  function closeAll() {
    registry.forEach((p) => p.remove());
    registry.clear();
    cascade = 0;
  }

  // Arrange all open panels into a responsive grid.
  function tile() {
    if (isMobile()) return;
    workspace.classList.add("tiled");
    const panels = [...registry.values()];
    panels.forEach((p) => {
      p.classList.remove("floating");
      p.style.left = p.style.top = p.style.width = p.style.height = "";
      p.style.zIndex = "";
    });
    requestAnimationFrame(() => panels.forEach(renderPending));
  }

  function untile() {
    workspace.classList.remove("tiled");
    registry.forEach((p) => p.classList.add("floating"));
  }

  function init(workspaceEl) {
    workspace = workspaceEl;
    window.addEventListener("resize", () => {
      // Re-render charts on viewport changes
      registry.forEach(renderPending);
    });
  }

  return { init, create, close, closeAll, tile, untile, registry };
})();
