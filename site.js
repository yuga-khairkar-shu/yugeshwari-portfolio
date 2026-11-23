(function () {
  var close = document.getElementById('close-draft');
  if (close) close.addEventListener('click', function () { document.getElementById('draft').hidden = true; });

  var cases = document.querySelectorAll('.case');
  var btns = document.querySelectorAll('.filters button');
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-f');
      btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      cases.forEach(function (c) {
        var tags = (c.getAttribute('data-tags') || '').split(' ');
        c.hidden = !(f === 'all' || tags.indexOf(f) > -1);
      });
    });
  });

  document.querySelectorAll('.copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var el = document.getElementById(b.getAttribute('data-copy'));
      var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1500); };
      var fallback = function () {
        var r = document.createRange(); r.selectNodeContents(el);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        b.textContent = 'Selected'; setTimeout(function () { b.textContent = 'Copy'; }, 1500);
      };
      try { navigator.clipboard.writeText(el.textContent).then(done, fallback); } catch (e) { fallback(); }
    });
  });

  var lb = document.getElementById('lightbox');
  if (lb && lb.showModal) {
    var lbImg = document.getElementById('lb-img');
    document.querySelectorAll('.zoom').forEach(function (z) {
      z.addEventListener('click', function () { lbImg.src = z.getAttribute('data-large'); lbImg.alt = z.getAttribute('data-alt') || ''; lb.showModal(); });
    });
    lb.querySelector('.lb-close').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  }

  document.querySelectorAll('.grid[data-limit]').forEach(function (g) {
    var lim = parseInt(g.getAttribute('data-limit'), 10), t = g.querySelectorAll(':scope > .tile');
    if (t.length <= lim) return;
    for (var i = lim; i < t.length; i++) t[i].hidden = true;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn ghost more'; b.textContent = 'Show all ' + t.length;
    b.addEventListener('click', function () { for (var k = lim; k < t.length; k++) t[k].hidden = false; b.remove(); });
    g.insertAdjacentElement('afterend', b);
  });
})();
