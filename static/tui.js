// Keyboard navigation for the blog. Every row is a normal link, so the site works without this file.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const menu = $('#menu'), main = $('#main'), sc = $('#main .sc'), title = $('#main .pt'), pos = $('.st .pos');
  if (!menu || !main) return;
  const panes = [menu, main];
  const key = 'sel:' + location.pathname;
  const items = p => [...p.querySelectorAll('a.it')];
  const menuItems = items(menu);
  let sel = [Math.max(0, menuItems.findIndex(a => a.classList.contains('cur'))), +sessionStorage.getItem(key) || 0];
  let f = 1;                                    // focused pane: 0 menu, 1 main
  let overlay = null;                           // null | 'help' | 'search'
  let saved = null, index = null, q = '', input = null;
  let shown = matchMedia('(hover: hover)').matches; // hide the selection bar on touch until a key is used

  function draw() {
    panes.forEach((p, i) => p.classList.toggle('on', i === f));
    panes.forEach((p, i) => {
      const its = items(p);
      if (sel[i] >= its.length) sel[i] = Math.max(0, its.length - 1);
      its.forEach((a, j) => a.classList.toggle('sel', shown && j === sel[i]));
      if (i === f && shown && its[sel[i]]) its[sel[i]].scrollIntoView({ block: 'nearest' });
    });
    const n = items(main).length;
    if (!input) pos.textContent = f === 1 && n ? `${sel[1] + 1}/${n} · ` : '';
    if (!overlay) sessionStorage.setItem(key, sel[1]);
  }

  function scroller() { return sc.scrollHeight > sc.clientHeight + 2 ? sc : window; }
  function move(d) {
    const n = items(panes[f]).length;
    if (n) sel[f] = Math.max(0, Math.min(n - 1, sel[f] + d));
    else if (f === 1) scroller().scrollBy({ top: d * 60 });
  }
  function edge(end) {
    const n = items(panes[f]).length;
    if (n) sel[f] = end ? n - 1 : 0;
    else if (f === 1) { const s = scroller(); s.scrollTo({ top: end ? (s === window ? document.body.scrollHeight : s.scrollHeight) : 0 }); }
  }
  function open() {
    const a = items(panes[f])[sel[f]];
    if (a) location.href = a.href;
    else if (f === 0) f = 1;
  }
  function back() {
    if (overlay) return close();
    if (f === 1 && document.body.dataset.parent) location.href = document.body.dataset.parent;
    else f = 0;
  }

  // help and search temporarily replace the main pane
  function show(kind, html, pane) {
    if (!overlay) saved = { html: sc.innerHTML, title: title.textContent, sel: sel[1] };
    overlay = kind; sc.innerHTML = html; title.textContent = pane; f = 1;
  }
  function close() {
    if (!overlay) return;
    sc.innerHTML = saved.html; title.textContent = saved.title; sel[1] = saved.sel;
    overlay = null; saved = null;
    if (input) { input.remove(); input = null; input_off(); }
  }
  function input_off() { $('.st').classList.remove('searching'); }
  function help() {
    if (overlay === 'help') return close();
    const k = [['j / ↓', 'dolů'], ['k / ↑', 'nahoru'], ['⏎ / l / →', 'otevřít'], ['h / q / esc / ←', 'zpět'],
      ['tab', 'přepnout panel'], ['g / G', 'začátek / konec'], ['1–4', 'skok do sekce'], ['/', 'hledat'], ['?', 'tahle nápověda']];
    show('help', '<div class="help">' + k.map(([a, b]) => `<div><b>${a}</b><span>${b}</span></div>`).join('') + '</div>', 'nápověda');
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function results() {
    const t = q.toLowerCase();
    const r = (index || []).filter(p => !t || [p.t, p.s, ...(p.g || [])].join(' ').toLowerCase().includes(t));
    sc.innerHTML = r.length ? '<div class="list">' + r.map(p =>
      `<a class="it" href="${esc(p.u)}"><span class="d">${esc(p.d)}</span><span class="t">${esc(p.t)}</span><span class="d tg">${(p.g || []).map(g => '#' + esc(g)).join(' ')}</span></a>`).join('') + '</div>'
      : `<div class="empty">${index ? 'nic nenalezeno' : 'načítám…'}</div>`;
    title.textContent = 'hledat /' + q;
    sel[1] = 0; draw();
  }
  async function search() {
    if (input) { input.focus(); return; }       // already open: reuse the field
    show('search', '', 'hledat /');
    q = '';
    input = document.createElement('input');
    input.type = 'search'; input.placeholder = 'hledat…'; input.setAttribute('aria-label', 'Hledat');
    input.style.cssText = 'font:inherit;color:inherit;background:transparent;border:0;border-bottom:1px solid var(--line);outline:0;width:12rem;margin-right:.6rem';
    pos.textContent = ''; pos.before(input); $('.st').classList.add('searching');
    input.addEventListener('input', () => { q = input.value; results(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); draw(); }
      else if (e.key === 'Enter') { e.preventDefault(); shown = true; open(); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); shown = true; move(e.key === 'ArrowDown' ? 1 : -1); draw(); }
      e.stopPropagation();
    });
    input.focus();
    results();
    if (!index) {
      try { index = await (await fetch('/index.json')).json(); } catch { index = []; }
      if (overlay === 'search') results();
    }
  }

  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    const k = e.key;
    if (k === 'j' || k === 'ArrowDown') move(1);
    else if (k === 'k' || k === 'ArrowUp') move(-1);
    else if (k === 'Enter' || k === 'l' || k === 'ArrowRight') { if (shown || f === 0) open(); else shown = true; }
    else if (k === 'h' || k === 'q' || k === 'Escape' || k === 'ArrowLeft') back();
    else if (k === 'Tab') f = 1 - f;
    else if (k === 'g') edge(false);
    else if (k === 'G') edge(true);
    else if (k === '/') { e.preventDefault(); shown = true; search(); return; }
    else if (k === '?') help();
    else if (k >= '1' && k <= String(menuItems.length)) { location.href = menuItems[+k - 1].href; return; }
    else return;
    e.preventDefault();
    shown = true;
    draw();
  });
  $('.st .srch')?.addEventListener('click', e => { e.preventDefault(); search(); });
  draw();
})();
