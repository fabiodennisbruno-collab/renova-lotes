/* charts-premium.js – Gráficos canvas interativos para o CRM */
'use strict';

const ChartsP = (() => {
  /* ---- helpers ---- */
  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 }).format(v);
  const fmtN = (v) => new Intl.NumberFormat('pt-BR').format(v);

  const PALETTE = {
    primary : 'rgba(108,99,255,',
    accent  : 'rgba(16,185,129,',
    amber   : 'rgba(245,158,11,',
    red     : 'rgba(239,68,68,',
    blue    : 'rgba(59,130,246,',
    pink    : 'rgba(236,72,153,',
  };

  const COLORS = [
    '#6C63FF','#10B981','#F59E0B','#EF4444','#3B82F6','#EC4899',
    '#8B5CF6','#14B8A6','#F97316','#06B6D4',
  ];

  /* Resize observer to handle canvas sizing */
  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = (canvas.dataset.height ? +canvas.dataset.height : 220) * dpr;
    canvas.style.width  = rect.width + 'px';
    canvas.style.height = (canvas.dataset.height ? +canvas.dataset.height : 220) + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, w: rect.width, h: canvas.dataset.height ? +canvas.dataset.height : 220, dpr };
  }

  /* ---- Bar Chart ---- */
  function drawBar(canvasId, labels, values, opts = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const { ctx, w, h } = setupCanvas(canvas);
    const color = opts.color || PALETTE.primary;
    const title = opts.title || '';
    const isMoney = opts.money !== false;

    const pad = { top: title ? 36 : 14, right: 14, bottom: 52, left: isMoney ? 80 : 50 };
    const cW = w - pad.left - pad.right;
    const cH = h - pad.top  - pad.bottom;
    const max = Math.max(...values, 1);

    ctx.clearRect(0, 0, w, h);

    // grid lines
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = pad.top + cH - (i / gridLines) * cH;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,.06)';
      ctx.lineWidth = 1;
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + cW, y);
      ctx.stroke();

      const val = (max * i / gridLines);
      ctx.fillStyle = 'rgba(255,255,255,.38)';
      ctx.font = '10px ui-sans-serif,system-ui,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(isMoney ? fmt(val) : fmtN(val), pad.left - 6, y + 4);
    }

    // title
    if (title) {
      ctx.fillStyle = 'rgba(255,255,255,.78)';
      ctx.font = '700 13px ui-sans-serif,system-ui,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, pad.left, 22);
    }

    const barW = Math.max(4, (cW / labels.length) * 0.55);
    const gap  = cW / labels.length;

    labels.forEach((lbl, i) => {
      const x = pad.left + gap * i + gap / 2;
      const bh = (values[i] / max) * cH;
      const y = pad.top + cH - bh;

      // gradient bar
      const grad = ctx.createLinearGradient(0, y, 0, y + bh);
      grad.addColorStop(0, color + '0.9)');
      grad.addColorStop(1, color + '0.35)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x - barW/2, y, barW, bh, [4,4,0,0]) : ctx.rect(x - barW/2, y, barW, bh);
      ctx.fill();

      // value label on top
      if (bh > 20) {
        ctx.fillStyle = 'rgba(255,255,255,.80)';
        ctx.font = '700 10px ui-sans-serif,system-ui,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isMoney ? fmt(values[i]) : fmtN(values[i]), x, y - 5);
      }

      // x label
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.font = '10px ui-sans-serif,system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(lbl, x, pad.top + cH + 18);
    });
  }

  /* ---- Line Chart ---- */
  function drawLine(canvasId, labels, datasets, opts = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const { ctx, w, h } = setupCanvas(canvas);
    const title   = opts.title || '';
    const isMoney = opts.money !== false;

    const pad = { top: title ? 36 : 14, right: 20, bottom: 52, left: isMoney ? 80 : 50 };
    const cW = w - pad.left - pad.right;
    const cH = h - pad.top  - pad.bottom;

    const allVals = datasets.flatMap(d => d.data);
    const max = Math.max(...allVals, 1);

    ctx.clearRect(0, 0, w, h);

    // grid
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + cH - (i / 5) * cH;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,.06)';
      ctx.lineWidth = 1;
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + cW, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,.38)';
      ctx.font = '10px ui-sans-serif,system-ui,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(isMoney ? fmt((max * i) / 5) : fmtN((max * i) / 5), pad.left - 6, y + 4);
    }

    // title
    if (title) {
      ctx.fillStyle = 'rgba(255,255,255,.78)';
      ctx.font = '700 13px ui-sans-serif,system-ui,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, pad.left, 22);
    }

    // legend
    if (datasets.length > 1) {
      datasets.forEach((ds, i) => {
        const lx = pad.left + i * 120;
        ctx.fillStyle = ds.color || COLORS[i];
        ctx.fillRect(lx, h - 14, 12, 3);
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.font = '10px ui-sans-serif,system-ui,sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(ds.label || '', lx + 16, h - 11);
      });
    }

    const step = labels.length > 1 ? cW / (labels.length - 1) : cW;

    datasets.forEach((ds, di) => {
      const clr = ds.color || COLORS[di % COLORS.length];
      const pts = ds.data.map((v, i) => ({
        x: pad.left + i * step,
        y: pad.top + cH - (v / max) * cH,
      }));

      // area fill
      const aGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
      aGrad.addColorStop(0, clr.replace(')', ',0.18)').replace('#','rgba(').replace('rgba(rgba(','rgba('));
      // simpler approach: parse hex
      aGrad.addColorStop(0, hexAlpha(clr, 0.18));
      aGrad.addColorStop(1, hexAlpha(clr, 0.00));
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pad.top + cH);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length-1].x, pad.top + cH);
      ctx.closePath();
      ctx.fillStyle = aGrad;
      ctx.fill();

      // line
      ctx.beginPath();
      ctx.strokeStyle = clr;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();

      // dots
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = clr;
        ctx.fill();
        ctx.strokeStyle = 'rgba(14,18,30,.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });

    // x labels
    labels.forEach((lbl, i) => {
      const x = pad.left + i * step;
      ctx.fillStyle = 'rgba(255,255,255,.42)';
      ctx.font = '10px ui-sans-serif,system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(lbl, x, pad.top + cH + 18);
    });
  }

  /* ---- Donut / Pie Chart ---- */
  function drawDonut(canvasId, labels, values, opts = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const { ctx, w, h } = setupCanvas(canvas);
    const title  = opts.title || '';
    const radius = Math.min(w, h) * 0.35;
    const cx = w * 0.42;
    const cy = h / 2;
    const total = values.reduce((a, b) => a + b, 0) || 1;
    const inner = opts.donut !== false ? radius * 0.55 : 0;

    ctx.clearRect(0, 0, w, h);

    if (title) {
      ctx.fillStyle = 'rgba(255,255,255,.78)';
      ctx.font = '700 13px ui-sans-serif,system-ui,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, 12, 22);
    }

    let startAngle = -Math.PI / 2;
    values.forEach((v, i) => {
      const sliceAngle = (v / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      startAngle += sliceAngle;
    });

    // donut hole
    if (inner > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, inner, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(14,18,30,.95)';
      ctx.fill();

      // center text
      ctx.fillStyle = 'rgba(255,255,255,.82)';
      ctx.font = '700 13px ui-sans-serif,system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(opts.center || fmtN(total), cx, cy + 5);
    }

    // legend
    const legendX = w * 0.72;
    const lineH = Math.min(22, (h - 20) / Math.max(labels.length, 1));
    const startY = (h - labels.length * lineH) / 2;
    labels.forEach((lbl, i) => {
      const y = startY + i * lineH + lineH / 2;
      ctx.beginPath();
      ctx.arc(legendX + 6, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.font = '11px ui-sans-serif,system-ui,sans-serif';
      ctx.textAlign = 'left';
      const pct = total ? ((values[i] / total) * 100).toFixed(0) + '%' : '0%';
      ctx.fillText(lbl.length > 14 ? lbl.slice(0,13)+'…' : lbl, legendX + 16, y + 4);
      ctx.fillStyle = 'rgba(255,255,255,.78)';
      ctx.font = '700 11px ui-sans-serif,system-ui,sans-serif';
      ctx.fillText(pct, legendX + 16 + Math.min(lbl.length, 14) * 6.2, y + 4);
    });
  }

  /* ---- Horizontal Bar ---- */
  function drawHBar(canvasId, labels, values, opts = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const { ctx, w, h } = setupCanvas(canvas);
    const title   = opts.title || '';
    const isMoney = opts.money !== false;
    const max = Math.max(...values, 1);
    const barH = Math.min(22, (h - 50) / Math.max(labels.length, 1));
    const padTop = title ? 36 : 14;
    const padLeft = 130;
    const cW = w - padLeft - 70;

    ctx.clearRect(0, 0, w, h);
    if (title) {
      ctx.fillStyle = 'rgba(255,255,255,.78)';
      ctx.font = '700 13px ui-sans-serif,system-ui,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, padLeft, 22);
    }
    labels.forEach((lbl, i) => {
      const y = padTop + i * (barH + 8);
      const bw = (values[i] / max) * cW;

      ctx.fillStyle = 'rgba(255,255,255,.38)';
      ctx.font = '11px ui-sans-serif,system-ui,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(lbl.length > 16 ? lbl.slice(0,15)+'…' : lbl, padLeft - 8, y + barH / 2 + 4);

      const grad = ctx.createLinearGradient(padLeft, 0, padLeft + bw, 0);
      grad.addColorStop(0, COLORS[i % COLORS.length]);
      grad.addColorStop(1, COLORS[(i+1) % COLORS.length]);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(padLeft, y, bw, barH, 4) : ctx.rect(padLeft, y, bw, barH);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,.70)';
      ctx.font = '700 10px ui-sans-serif,system-ui,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(isMoney ? fmt(values[i]) : fmtN(values[i]), padLeft + bw + 6, y + barH / 2 + 4);
    });
  }

  /* helper: hex to rgba */
  function hexAlpha(hex, alpha) {
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
      return hex.replace(/[\d.]+\)$/, alpha + ')');
    }
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  return { drawBar, drawLine, drawDonut, drawHBar };
})();
