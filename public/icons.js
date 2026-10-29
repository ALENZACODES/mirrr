/**
 * MIRRR icon system — one inline-SVG set (24px grid, 1.5px stroke, currentColor).
 * Replaces emoji used as interface icons. A runtime pass converts any emoji that
 * reaches the DOM (static markup or JS-rendered) into the matching glyph.
 */
(function () {
  const P = {
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z"/>',
    flower: '<circle cx="12" cy="12" r="2.2"/><path d="M12 9.8C10.5 8 10.5 5 12 3c1.5 2 1.5 5 0 6.8zM14.2 12c1.8-1.5 4.8-1.5 6.8 0-2 1.5-5 1.5-6.8 0zM12 14.2c1.5 1.8 1.5 4.8 0 6.8-1.5-2-1.5-5 0-6.8zM9.8 12C8 13.5 5 13.5 3 12c2-1.5 5-1.5 6.8 0z"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19c2-4 5-7 9-9"/>',
    cup: '<path d="M5 9h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3.5c-.8 1 .8 1.5 0 2.5M12 3.5c-.8 1 .8 1.5 0 2.5"/>',
    flame: '<path d="M12 21c-3.5 0-6-2.4-6-5.8 0-3 2.2-4.6 3.2-7.2C10.8 9 11.5 10 12 11c.8-1.7 1.4-3.6.6-6.5C16.5 6.8 18 10.6 18 15.2 18 18.6 15.5 21 12 21z"/>',
    crown: '<path d="M4 18l-1-10 5 4 4-7 4 7 5-4-1 10z"/><path d="M4 21h16"/>',
    music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    helix: '<path d="M7 3c0 6 10 6 10 12s-10 6-10 6"/><path d="M17 3c0 6-10 6-10 12"/><path d="M8.5 7h7M8.5 17h7"/>',
    drop: '<path d="M12 3.5C8.5 8 6 10.8 6 14.2A6 6 0 0 0 18 14.2C18 10.8 15.5 8 12 3.5z"/>',
    activity: '<path d="M3 12h4l2.5-6 4 12L16 12h5"/>',
    mirror: '<ellipse cx="12" cy="9.5" rx="6" ry="7"/><path d="M12 16.5V21M8.5 21h7"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V16"/>',
    camera: '<path d="M4 8h3l1.6-2.5h6.8L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    bookmark: '<path d="M6.5 3.5h11V21L12 16.5 6.5 21z"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14-4.5L4 9"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 14 4.5L20 15"/><path d="M20 20v-5h-5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    wig: '<path d="M5 14c0-6 3-10 7-10s7 4 7 10c0 3-1 5-2.5 6.5V13c-2 0-4-1.5-5-3.5C10.5 11.5 8.5 13 7.5 13v7.5C6 19 5 17 5 14z"/>',
    lips: '<path d="M3 12c3-3 6-4 9-2 3-2 6-1 9 2-3 5-6 6-9 6s-6-1-9-6z"/><path d="M3 12h18"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.2 4.3 4.3 0 0 1 19.5 10C19.5 15.4 12 20 12 20z"/>',
    bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
    circle: '<circle cx="12" cy="12" r="6"/>',
    book: '<path d="M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
    quiz: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
    chat: '<path d="M4 5.5h16v10.5H9.5L5 20v-4H4z"/>',
    arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    taste: '<path d="M3 12c2-4 5-6 9-6s7 2 9 6c-2 4-5 6-9 6s-7-2-9-6z"/><path d="M9 12h6M12 9v6"/>',
  };

  // emoji base code point -> glyph name
  const MAP = {
    '🌍': 'globe', '🌐': 'globe', '🌎': 'globe', '🌏': 'globe',
    '🌸': 'flower', '🌺': 'flower', '🌹': 'flower', '🌼': 'flower',
    '🌙': 'moon', '🌑': 'moon',
    '🌿': 'leaf', '🌱': 'leaf', '🌳': 'leaf', '🌴': 'leaf', '🥑': 'leaf', '🥥': 'leaf', '🍚': 'leaf',
    '🍵': 'cup', '☕': 'cup',
    '🔥': 'flame', '🕯': 'flame',
    '👑': 'crown',
    '💃': 'music', '🎵': 'music', '🎶': 'music',
    '🎪': 'calendar', '🎭': 'calendar', '🎉': 'calendar', '🧧': 'calendar', '💀': 'calendar', '⛪': 'calendar', '📅': 'calendar',
    '🧬': 'helix',
    '🎨': 'drop', '🧴': 'drop', '🛁': 'drop', '🌊': 'drop', '💧': 'drop',
    '💪': 'activity', '🏃': 'activity', '🏀': 'activity', '🧘': 'activity', '💆': 'activity',
    '🪞': 'mirror',
    '📁': 'upload', '📤': 'upload',
    '📷': 'camera', '📸': 'camera',
    '💾': 'bookmark', '🔖': 'bookmark',
    '🔄': 'refresh',
    '🔗': 'link',
    '🔍': 'search',
    '💇': 'wig',
    '💋': 'lips',
    '👁': 'eye',
    '💒': 'heart', '✊': 'heart', '❤': 'heart',
    '⚡': 'bolt',
    '⚫': 'circle', '🪆': 'circle',
    '📚': 'book', '🖋': 'book',
    '📋': 'quiz',
    '💬': 'chat',
    '✓': 'check', '✔': 'check',
    '✕': 'close',
    '✨': 'sparkle', '🌟': 'sparkle', '⭐': 'sparkle', '✦': 'sparkle', '💡': 'sparkle',
    '🦁': 'sparkle', '🦅': 'sparkle', '🦋': 'sparkle',
  };

  // pictographic emoji + its modifiers/ZWJ tails, plus a few dingbats we treat as icons
  const RE = /(?:\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*|[✦✕✓✔])/gu;

  function svg(name, cls) {
    const body = P[name] || P.sparkle;
    return '<svg class="mi' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" width="1em" height="1em" fill="none" '
      + 'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + body + '</svg>';
  }

  function nameFor(seq) {
    const base = Array.from(seq)[0].replace(/️/g, '');
    return MAP[base] || 'sparkle';
  }

  function strip(str) { return String(str == null ? '' : str).replace(RE, '').replace(/\s{2,}/g, ' ').trim(); }

  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'OPTION', 'SELECT', 'TITLE', 'SVG']);

  function apply(root) {
    root = root || document.body;
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentNode;
        if (!p || SKIP.has((p.nodeName || '').toUpperCase())) return NodeFilter.FILTER_REJECT;
        RE.lastIndex = 0;
        return RE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => {
      const frag = document.createDocumentFragment();
      const text = n.nodeValue;
      let last = 0;
      RE.lastIndex = 0;
      let m;
      while ((m = RE.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        const span = document.createElement('span');
        span.className = 'mi-wrap';
        span.innerHTML = svg(nameFor(m[0]));
        frag.appendChild(span);
        last = m.index + m[0].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      n.parentNode.replaceChild(frag, n);
    });
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; apply(document.body); });
  }

  function start() {
    apply(document.body);
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  window.MirrrIcons = { svg, apply, strip, names: Object.keys(P) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
