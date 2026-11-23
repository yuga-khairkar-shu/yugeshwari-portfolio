(function () {
  var hero = document.getElementById('pond'), cv = document.getElementById('koi');
  if (!hero || !cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, dpr = 1, t = 0, raf = 0, visible = true, lastRip = 0;
  var fish = [], ripples = [], ptr = { x: -999, y: -999 };
  var N = 16, Z = { x0: 0, y0: 0, x1: 0, y1: 0 };
  var KOI = [
    { base: '#F6EBDD', patch: ['#F25A1E', '#E4421A'] },
    { base: '#F25A1E', patch: ['#FFF3E6', '#C8321A'] },
    { base: '#FFF1E2', patch: ['#F58A3C', '#D93A12', '#2b2b2b'] },
    { base: '#F7A24B', patch: ['#FFFFFF'] },
    { base: '#F6EBDD', patch: ['#E4421A'] },
    { base: '#E8E2D6', patch: ['#F25A1E', '#F7A24B'] }
  ];
  var PADS = [[.07, .82, 40, 0], [.94, .18, 34, 1], [.58, .93, 30, 0], [.4, .08, 28, 0], [.97, .78, 44, 1], [.03, .12, 30, 0]];
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function angDiff(a, b) { var d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
  function scale() { return W < 600 ? .72 : 1; }

  function make(i) {
    var k = KOI[i % KOI.length], s = rnd(.85, 1.15);
    var f = { x: rnd(Z.x0 + 60, Z.x1 - 60), y: rnd(Z.y0 + 40, Z.y1 - 40), a: rnd(0, 6.28), turn: 0, v: 1, s: s, k: k, pts: [], patches: [] };
    for (var j = 0; j < N; j++) f.pts.push({ x: f.x - Math.cos(f.a) * j * 7, y: f.y - Math.sin(f.a) * j * 7 });
    var n = 2 + Math.floor(Math.random() * 2);
    for (var p = 0; p < n; p++) f.patches.push({ i: 2 + Math.floor(Math.random() * 9), o: rnd(-.35, .35), r: rnd(.55, .95), c: k.patch[p % k.patch.length] });
    return f;
  }

  function size() {
    var r = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    var tx = document.getElementById('pond-text'), rs = document.getElementById('pond-rest');
    var tr = tx ? tx.getBoundingClientRect() : null, rr = rs ? rs.getBoundingClientRect() : null;
    if (W > 860 && tr && rr) Z = { x0: tr.right - r.left + 90, y0: 0, x1: W, y1: rr.top - r.top - 30 };
    else if (rr) Z = { x0: 0, y0: Math.max(rr.bottom - r.top + 40, H - 190), x1: W, y1: H };
    else Z = { x0: 0, y0: 0, x1: W, y1: H };
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var want = W < 600 ? 4 : 6;
    while (fish.length < want) fish.push(make(fish.length));
    fish.length = want;
  }

  function step(f) {
    var sc = scale(), m = 70;
    f.turn += (Math.random() - .5) * .018; f.turn *= .97; f.a += f.turn;
    var my = Math.min(m, (Z.y1 - Z.y0) / 3);
    if (f.x < Z.x0 + m || f.x > Z.x1 - m || f.y < Z.y0 + my || f.y > Z.y1 - my) {
      f.a -= angDiff(f.a, Math.atan2((Z.y0 + Z.y1) / 2 - f.y, (Z.x0 + Z.x1) / 2 - f.x)) * .06;
    }
    if (f.x < Z.x0) f.x = Z.x0;
    var target = .7 * f.s * sc, dx = f.x - ptr.x, dy = f.y - ptr.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 150) {
      f.a -= angDiff(f.a, Math.atan2(dy, dx)) * .09;
      target *= 1 + (1 - d / 150) * 2.6;
    }
    f.v += (target - f.v) * .06;
    f.x += Math.cos(f.a) * f.v; f.y += Math.sin(f.a) * f.v;
    var seg = 7 * f.s * sc, h = f.pts[0];
    h.x = f.x; h.y = f.y;
    for (var i = 1; i < N; i++) {
      var p = f.pts[i], q = f.pts[i - 1], ex = p.x - q.x, ey = p.y - q.y, l = Math.sqrt(ex * ex + ey * ey) || 1;
      p.x = q.x + ex / l * seg; p.y = q.y + ey / l * seg;
    }
  }

  function outline(f, wag) {
    var sc = scale(), maxW = 9 * f.s * sc, L = [], R = [], P = [];
    for (var i = 0; i < N; i++) {
      var a = f.pts[Math.max(0, i - 1)], b = f.pts[Math.min(N - 1, i + 1)];
      var dx = b.x - a.x, dy = b.y - a.y, l = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l;
      var u = i / (N - 1), sway = Math.sin(t * .11 * (.6 + f.v) - i * .5) * i * .28 * f.s * sc * wag;
      var cx = f.pts[i].x + nx * sway, cy = f.pts[i].y + ny * sway;
      var w = maxW * (u < .25 ? .55 + u * 1.8 : 1 - (u - .25) / .75 * .82);
      P.push({ x: cx, y: cy, w: w, nx: nx, ny: ny });
      L.push([cx + nx * w, cy + ny * w]); R.push([cx - nx * w, cy - ny * w]);
    }
    return { L: L, R: R, P: P, maxW: maxW };
  }

  function poly(o, ox, oy) {
    ctx.beginPath(); ctx.moveTo(o.L[0][0] + ox, o.L[0][1] + oy);
    for (var i = 1; i < N; i++) ctx.lineTo(o.L[i][0] + ox, o.L[i][1] + oy);
    for (var j = N - 1; j >= 0; j--) ctx.lineTo(o.R[j][0] + ox, o.R[j][1] + oy);
    ctx.closePath();
  }

  function drawFish(f) {
    var o = outline(f, 1), e = o.P[N - 1], e0 = o.P[N - 3];
    var dx = e.x - e0.x, dy = e.y - e0.y, l = Math.sqrt(dx * dx + dy * dy) || 1; dx /= l; dy /= l;
    ctx.fillStyle = 'rgba(2,18,18,.22)'; poly(o, 7, 11); ctx.fill();
    var tl = o.maxW * 3.2, tw = o.maxW * 1.5;
    ctx.fillStyle = f.k.base; ctx.globalAlpha = .55;
    ctx.beginPath(); ctx.moveTo(e.x, e.y);
    ctx.quadraticCurveTo(e.x + dx * tl * .6 + e.ny * tw, e.y + dy * tl * .6 - e.nx * tw, e.x + dx * tl + e.ny * tw * .3, e.y + dy * tl - e.nx * tw * .3);
    ctx.quadraticCurveTo(e.x + dx * tl * .55, e.y + dy * tl * .55, e.x + dx * tl - e.ny * tw * .3, e.y + dy * tl + e.nx * tw * .3);
    ctx.quadraticCurveTo(e.x + dx * tl * .6 - e.ny * tw, e.y + dy * tl * .6 + e.nx * tw, e.x, e.y);
    ctx.fill();
    var p3 = o.P[3];
    [-1, 1].forEach(function (sd) {
      ctx.beginPath();
      ctx.ellipse(p3.x + p3.nx * sd * (p3.w + 3), p3.y + p3.ny * sd * (p3.w + 3), o.maxW * 1.3, o.maxW * .5, Math.atan2(p3.ny, p3.nx) + sd * .6, 0, 6.283);
      ctx.fill();
    });
    ctx.globalAlpha = .93; ctx.fillStyle = f.k.base; poly(o, 0, 0); ctx.fill();
    f.patches.forEach(function (pt) {
      var q = o.P[pt.i];
      ctx.fillStyle = pt.c; ctx.globalAlpha = .9;
      ctx.beginPath(); ctx.ellipse(q.x + q.nx * pt.o * q.w, q.y + q.ny * pt.o * q.w, q.w * pt.r * 1.5, q.w * pt.r, Math.atan2(q.ny, q.nx) + 1.57, 0, 6.283); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawPad(p) {
    var r = p[2] * scale(), x = Z.x0 + p[0] * (Z.x1 - Z.x0), y = Z.y0 + p[1] * (Z.y1 - Z.y0), rot = Math.sin(t * .006 + p[0] * 9) * .25 + p[0] * 6;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(2,18,18,.25)'; ctx.beginPath(); ctx.arc(5, 8, r, .2 * Math.PI, 1.85 * Math.PI); ctx.lineTo(5, 8); ctx.fill();
    ctx.fillStyle = '#3f8f52'; ctx.beginPath(); ctx.arc(0, 0, r, .2 * Math.PI, 1.85 * Math.PI); ctx.lineTo(0, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(14,66,40,.55)'; ctx.lineWidth = 1;
    for (var i = 0; i < 6; i++) { var a = .45 * Math.PI + i * .3 * Math.PI; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * .9, Math.sin(a) * r * .9); ctx.stroke(); }
    if (p[3]) {
      for (var k = 0; k < 8; k++) {
        ctx.save(); ctx.rotate(k * .785); ctx.fillStyle = k % 2 ? '#F7B6CF' : '#F48DB5';
        ctx.beginPath(); ctx.ellipse(r * .22, 0, r * .26, r * .1, 0, 0, 6.283); ctx.fill(); ctx.restore();
      }
      ctx.fillStyle = '#FFE08A'; ctx.beginPath(); ctx.arc(0, 0, r * .08, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  }

  function drawRipples() {
    for (var i = ripples.length - 1; i >= 0; i--) {
      var r = ripples[i]; r.r += r.sp; r.a -= .008;
      if (r.a <= 0) { ripples.splice(i, 1); continue; }
      ctx.strokeStyle = 'rgba(220,245,235,' + r.a + ')'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.283); ctx.stroke();
      if (r.r > 14) { ctx.beginPath(); ctx.arc(r.x, r.y, r.r - 12, 0, 6.283); ctx.globalAlpha = .5; ctx.stroke(); ctx.globalAlpha = 1; }
    }
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    drawRipples();
    for (var i = 0; i < fish.length; i++) { step(fish[i]); drawFish(fish[i]); }
    for (var j = 0; j < PADS.length; j++) drawPad(PADS[j]);
    t++;
  }
  function loop() { if (visible) frame(); raf = requestAnimationFrame(loop); }

  function addRip(x, y, big) { ripples.push({ x: x, y: y, r: 2, a: big ? .7 : .4, sp: big ? 1.1 : .7 }); }
  function pos(e) { var r = hero.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  hero.addEventListener('pointermove', function (e) {
    var p = pos(e); ptr.x = p.x; ptr.y = p.y;
    var now = performance.now();
    if (now - lastRip > 260) { lastRip = now; addRip(p.x, p.y, false); }
  });
  hero.addEventListener('pointerdown', function (e) {
    var p = pos(e); ptr.x = p.x; ptr.y = p.y; addRip(p.x, p.y, true);
    setTimeout(function () { ptr.x = -999; ptr.y = -999; }, e.pointerType === 'touch' ? 900 : 0);
  });
  hero.addEventListener('pointerleave', function () { ptr.x = -999; ptr.y = -999; });

  size();
  if ('ResizeObserver' in window) new ResizeObserver(function () { size(); if (reduce) { ctx.clearRect(0, 0, W, H); fish.forEach(function (f) { drawFish(f); }); PADS.forEach(drawPad); } }).observe(hero);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(hero);
  if (reduce) {
    for (var s = 0; s < 240; s++) fish.forEach(step);
    frame();
  } else { loop(); }
})();
