(() => {
  'use strict';

  // Elements copied into the translation untouched (code, media, mentions, quote headers...).
  const FREEZE = [
    'pre', 'code', 'kbd', 'samp', 'img', 'svg', 'video', 'audio', 'iframe',
    '.lightbox-wrapper', '.onebox', 'a.mention', 'a.mention-group', '.hashtag-cooked',
    '.math', 'aside.quote > .title', '.emoji'
  ].join(',');

  const ALLOWED_TAGS = new Set([
    'P', 'BR', 'HR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL', 'INS', 'MARK', 'SMALL', 'SUP', 'SUB',
    'UL', 'OL', 'LI', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'SPAN', 'DIV', 'ASIDE',
    'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'DETAILS', 'SUMMARY', 'X-KEEP'
  ]);
  const DROP_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON',
    'TEXTAREA', 'SELECT', 'LINK', 'META', 'BASE', 'TEMPLATE']);

  const ENGINE_LABEL = { google: 'Google', gemini: 'Gemini', claude: 'Claude' };

  const ICON = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>';

  // Only non-secret settings ever reach the page context; API keys stay in the background.
  let settings = { engine: 'google', mode: 'replace', auto: false };
  async function refreshSettings() {
    try {
      const { ok, ...s } = await send({ type: 'getPublicSettings' });
      Object.assign(settings, s);
    } catch { /* keep defaults */ }
  }
  let ready = false;
  refreshSettings().then(() => { ready = true; scan(); });

  async function send(msg) {
    const res = await chrome.runtime.sendMessage(msg);
    if (!res?.ok) throw new Error(res?.error || '\u05e9\u05d2\u05d9\u05d0\u05d4 \u05dc\u05d0 \u05d9\u05d3\u05d5\u05e2\u05d4');
    return res;
  }

  // Limit concurrent translations (relevant for auto-translate on long topics).
  let running = 0;
  const waiting = [];
  async function limited(fn) {
    if (running >= 2) await new Promise(r => waiting.push(r));
    running++;
    try { return await fn(); } finally { running--; waiting.shift()?.(); }
  }

  // ---------- Building the translation ----------

  function sanitize(html) {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
    for (const el of [...doc.body.querySelectorAll('*')].reverse()) {
      if (DROP_TAGS.has(el.tagName)) { el.remove(); continue; }
      if (!ALLOWED_TAGS.has(el.tagName)) { el.replaceWith(...el.childNodes); continue; }
      for (const attr of [...el.attributes]) {
        const n = attr.name;
        const okHref = n === 'href' && el.tagName === 'A' && /^(https?:|\/|#)/i.test(attr.value);
        const okKeep = n === 'data-i' && el.tagName === 'X-KEEP';
        const okClass = n === 'class' && /^[\w\s-]*$/.test(attr.value);
        if (!okHref && !okKeep && !okClass) el.removeAttribute(n);
      }
      if (el.tagName === 'A') el.rel = 'noopener noreferrer nofollow';
    }
    return doc.body;
  }

  async function buildTranslation(cooked, engine) {
    const clone = cooked.cloneNode(true);
    const kept = [];
    clone.querySelectorAll(FREEZE).forEach(el => {
      if (!clone.contains(el)) return; // inside an element that was already frozen
      const ph = document.createElement('x-keep');
      ph.setAttribute('data-i', kept.length);
      kept.push(el);
      el.replaceWith(ph);
    });

    let root;
    if (engine === 'google') {
      const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) if (/[A-Za-z]/.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode);
      if (nodes.length) {
        const { texts } = await send({ type: 'translateTexts', texts: nodes.map(n => n.nodeValue) });
        nodes.forEach((n, i) => { n.nodeValue = texts[i]; });
      }
      root = clone;
    } else {
      const { html } = await send({ type: 'translateHtml', html: clone.innerHTML });
      root = sanitize(html);
    }

    const used = new Set();
    root.querySelectorAll('x-keep').forEach(ph => {
      const i = Number(ph.getAttribute('data-i'));
      if (kept[i] && !used.has(i)) { used.add(i); ph.replaceWith(kept[i].cloneNode(true)); }
      else ph.remove();
    });
    // If the model dropped frozen blocks (code, images), append them so nothing is lost.
    kept.forEach((el, i) => {
      if (!used.has(i) && /^(PRE|IMG|DIV|ASIDE|VIDEO|IFRAME)$/.test(el.tagName)) root.appendChild(el.cloneNode(true));
    });

    const box = document.createElement('div');
    box.className = 'cooked jtt-translation';
    box.dir = 'rtl';
    box.lang = 'he';
    box.append(...root.childNodes);
    const meta = document.createElement('div');
    meta.className = 'jtt-meta';
    meta.textContent = `\u05ea\u05d5\u05e8\u05d2\u05dd \u05e2"\u05d9 ${ENGINE_LABEL[engine] || engine}`;
    box.appendChild(meta);
    wireSpoilers(box, cooked);
    return box;
  }

  // ---------- Spoilers ----------
  // Discourse attaches its spoiler click handler to each element, so copies in the
  // translation lose it. Re-create the same behavior (mirrors Discourse's
  // spoiler-alert plugin) and start each spoiler in the state the original is in.

  const SPOILER = '.spoiler, .spoiled';
  const SPOILER_INTERACTIVE = 'a, button, details, iframe, img.animated, input, select, textarea, video, audio, .lightbox';

  const isBlurred = el => el.getAttribute('data-spoiler-state') === 'blurred' || el.classList.contains('spoiler-blurred');

  function setSpoiler(el, blurred) {
    el.classList.toggle('spoiler-blurred', blurred);
    el.setAttribute('data-spoiler-state', blurred ? 'blurred' : 'revealed');
    el.setAttribute('aria-expanded', String(!blurred));
    if (blurred) { el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0'); }
    else el.removeAttribute('role');
    for (const child of el.children) {
      if (blurred) child.setAttribute('aria-hidden', 'true');
      else child.removeAttribute('aria-hidden');
    }
  }

  function toggleSpoiler(e, el) {
    if (isBlurred(el)) {
      setSpoiler(el, false);
      e.preventDefault();
    } else if (!e.defaultPrevented && !e.target.closest(SPOILER_INTERACTIVE) && String(window.getSelection()) === '') {
      setSpoiler(el, true);
    }
  }

  function wireSpoilers(box, cooked) {
    const originals = [...cooked.querySelectorAll(SPOILER)];
    box.querySelectorAll(SPOILER).forEach((el, i) => {
      el.classList.remove('spoiler');
      el.classList.add('spoiled');
      setSpoiler(el, originals[i] ? isBlurred(originals[i]) : true);
      el.addEventListener('click', e => toggleSpoiler(e, el));
      el.addEventListener('keydown', e => { if (e.key === 'Enter') toggleSpoiler(e, el); });
    });
  }

  // ---------- Post buttons ----------

  function setButton(btn, label, state) {
    btn.innerHTML = ICON + `<span>${label}</span>`;
    btn.classList.toggle('jtt-loading', state === 'loading');
    btn.disabled = state === 'loading';
  }

  async function toggle(cooked, bar) {
    const btn = bar.querySelector('.jtt-btn');
    const err = bar.querySelector('.jtt-error');
    const st = cooked._jtt || (cooked._jtt = {});
    err.textContent = '';

    if (st.box?.isConnected) {
      const show = st.box.hidden;
      st.box.hidden = !show;
      cooked.hidden = show && settings.mode === 'replace';
      setButton(btn, show ? '\u05d4\u05e6\u05d2 \u05de\u05e7\u05d5\u05e8' : '\u05ea\u05e8\u05d2\u05dd');
      return;
    }

    await refreshSettings();
    const { engine } = settings;
    setButton(btn, '\u05de\u05ea\u05e8\u05d2\u05dd...', 'loading');
    try {
      const box = await limited(() => buildTranslation(cooked, engine));
      cooked.after(box);
      st.box = box;
      cooked.hidden = settings.mode === 'replace';
      setButton(btn, '\u05d4\u05e6\u05d2 \u05de\u05e7\u05d5\u05e8');
    } catch (e) {
      setButton(btn, '\u05ea\u05e8\u05d2\u05dd');
      err.textContent = e.message;
      if (/\u05de\u05e4\u05ea\u05d7 API/.test(e.message)) {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = ' \u05e4\u05ea\u05d7 \u05d4\u05d2\u05d3\u05e8\u05d5\u05ea';
        link.onclick = ev => { ev.preventDefault(); send({ type: 'openOptions' }); };
        err.appendChild(link);
      }
    }
  }

  function setupPost(cooked) {
    const parent = cooked.parentElement;
    if (!parent) return;
    if (cooked.dataset.jttReady && parent.querySelector(':scope > .jtt-bar')) return;
    parent.querySelectorAll(':scope > .jtt-bar, :scope > .jtt-translation').forEach(el => el.remove());
    cooked.dataset.jttReady = '1';
    cooked.hidden = false;
    delete cooked._jtt;

    const bar = document.createElement('div');
    bar.className = 'jtt-bar';
    bar.dir = 'rtl';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'jtt-btn';
    btn.title = '\u05ea\u05e8\u05d2\u05dd \u05d0\u05ea \u05d4\u05e4\u05d5\u05e1\u05d8 \u05dc\u05e2\u05d1\u05e8\u05d9\u05ea';
    setButton(btn, '\u05ea\u05e8\u05d2\u05dd');
    btn.addEventListener('click', () => toggle(cooked, bar));
    const err = document.createElement('span');
    err.className = 'jtt-error';
    bar.append(btn, err);
    cooked.after(bar);

    if (settings.auto) toggle(cooked, bar);
  }

  // ---------- Composer: Hebrew -> English ----------

  function setTextarea(ta, value) {
    ta.value = value;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  async function translateCompose(btn) {
    const ta = document.querySelector('#reply-control textarea.d-editor-input');
    if (!ta) { alert('\u05dc\u05d0 \u05e0\u05de\u05e6\u05d0 \u05ea\u05d9\u05d1\u05ea \u05d8\u05e7\u05e1\u05d8. \u05d0\u05dd \u05d0\u05ea\u05d4 \u05de\u05e9\u05ea\u05de\u05e9 \u05d1\u05e2\u05d5\u05e8\u05da \u05d4\u05e2\u05e9\u05d9\u05e8 (WYSIWYG), \u05e2\u05d1\u05d5\u05e8 \u05dc\u05de\u05e6\u05d1 Markdown.'); return; }

    if (ta._jttOrig != null && ta.value === ta._jttTranslated) {
      setTextarea(ta, ta._jttOrig);
      ta._jttOrig = null;
      btn.textContent = '\u05ea\u05e8\u05d2\u05dd \u05dc\u05d0\u05e0\u05d2\u05dc\u05d9\u05ea';
      return;
    }
    if (!/[\u0590-\u05ff]/.test(ta.value)) { alert('\u05d0\u05d9\u05df \u05d8\u05e7\u05e1\u05d8 \u05d1\u05e2\u05d1\u05e8\u05d9\u05ea \u05dc\u05ea\u05e8\u05d2\u05d5\u05dd'); return; }

    btn.disabled = true;
    btn.textContent = '\u05de\u05ea\u05e8\u05d2\u05dd...';
    try {
      const { text } = await send({ type: 'translateCompose', text: ta.value });
      ta._jttOrig = ta.value;
      ta._jttTranslated = text;
      setTextarea(ta, text);
      btn.textContent = '↩ \u05d1\u05d8\u05dc \u05ea\u05e8\u05d2\u05d5\u05dd';
    } catch (e) {
      alert('\u05e9\u05d2\u05d9\u05d0\u05ea \u05ea\u05e8\u05d2\u05d5\u05dd: ' + e.message);
      btn.textContent = '\u05ea\u05e8\u05d2\u05dd \u05dc\u05d0\u05e0\u05d2\u05dc\u05d9\u05ea';
    } finally {
      btn.disabled = false;
    }
  }

  function setupComposer() {
    const composer = document.querySelector('#reply-control');
    if (!composer || composer.querySelector('.jtt-compose-btn')) return;
    // Prefer the editor toolbar; fall back to the row with the Reply/Cancel buttons.
    const toolbar = composer.querySelector('.d-editor-button-bar') || composer.querySelector('.save-or-cancel');
    if (!toolbar) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn jtt-compose-btn';
    btn.title = '\u05ea\u05e8\u05d2\u05dd \u05d0\u05ea \u05de\u05d4 \u05e9\u05db\u05ea\u05d1\u05ea \u05d1\u05e2\u05d1\u05e8\u05d9\u05ea \u05dc\u05d0\u05e0\u05d2\u05dc\u05d9\u05ea \u05d8\u05d1\u05e2\u05d9\u05ea';
    btn.textContent = '\u05ea\u05e8\u05d2\u05dd \u05dc\u05d0\u05e0\u05d2\u05dc\u05d9\u05ea';
    btn.addEventListener('click', () => translateCompose(btn));
    toolbar.appendChild(btn);
  }

  // ---------- Watch the SPA ----------

  function scan() {
    if (!ready) return;
    document.querySelectorAll('article[data-post-id] .cooked:not(.jtt-translation)').forEach(setupPost);
    setupComposer();
  }

  let timer = null;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(scan, 250);
  }).observe(document.body, { childList: true, subtree: true });
  scan();
})();
