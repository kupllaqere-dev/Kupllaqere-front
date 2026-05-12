function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isSafeUrl(url) {
  try {
    const u = new URL(url.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function isSafeColor(color) {
  const c = color.trim();
  return (
    /^#[0-9a-fA-F]{3,8}$/.test(c) ||
    /^[a-zA-Z]{2,20}$/.test(c) ||
    /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/.test(c)
  );
}

const SPOILER_STYLE = 'border:1px solid rgba(124,58,237,0.2);border-radius:8px;padding:6px 10px;margin:6px 0;background:rgba(124,58,237,0.03)';
const SUMMARY_STYLE = 'cursor:pointer;font-weight:700;color:#7c3aed;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;user-select:none';
const QUOTE_STYLE   = 'border-left:3px solid rgba(124,58,237,0.4);margin:6px 0;padding:6px 10px;background:rgba(124,58,237,0.05);border-radius:0 6px 6px 0;font-style:italic';

export function bbcodeToHtml(input) {
  if (!input) return '';
  let t = escapeHtml(input);

  // newlines → <br> first so block-tag content renders correctly
  t = t.replace(/\n/g, '<br>');

  // ── Block-level ──
  t = t.replace(/\[center\]([\s\S]*?)\[\/center\]/gi,
    (_, c) => `<div style="text-align:center">${c}</div>`);
  t = t.replace(/\[left\]([\s\S]*?)\[\/left\]/gi,
    (_, c) => `<div style="text-align:left">${c}</div>`);
  t = t.replace(/\[right\]([\s\S]*?)\[\/right\]/gi,
    (_, c) => `<div style="text-align:right">${c}</div>`);

  t = t.replace(/\[spoiler=([^\]]{1,80})\]([\s\S]*?)\[\/spoiler\]/gi,
    (_, title, c) => `<details style="${SPOILER_STYLE}"><summary style="${SUMMARY_STYLE}">${escapeHtml(title)}</summary><div style="margin-top:6px">${c}</div></details>`);
  t = t.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi,
    (_, c) => `<details style="${SPOILER_STYLE}"><summary style="${SUMMARY_STYLE}">Spoiler</summary><div style="margin-top:6px">${c}</div></details>`);

  t = t.replace(/\[quote=([^\]]{1,80})\]([\s\S]*?)\[\/quote\]/gi,
    (_, author, c) => `<blockquote style="${QUOTE_STYLE}"><strong style="font-size:11px;color:#7c3aed">${escapeHtml(author)} wrote:</strong><br>${c}</blockquote>`);
  t = t.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi,
    (_, c) => `<blockquote style="${QUOTE_STYLE}">${c}</blockquote>`);

  // ── Inline formatting ──
  t = t.replace(/\[b\]([\s\S]*?)\[\/b\]/gi,   '<strong>$1</strong>');
  t = t.replace(/\[i\]([\s\S]*?)\[\/i\]/gi,   '<em>$1</em>');
  t = t.replace(/\[u\]([\s\S]*?)\[\/u\]/gi,   '<u>$1</u>');
  t = t.replace(/\[s\]([\s\S]*?)\[\/s\]/gi,   '<s>$1</s>');

  t = t.replace(/\[color=([^\]]{1,30})\]([\s\S]*?)\[\/color\]/gi, (_, color, c) => {
    if (!isSafeColor(color)) return c;
    return `<span style="color:${color.trim()}">${c}</span>`;
  });

  t = t.replace(/\[size=(\d+)\]([\s\S]*?)\[\/size\]/gi, (_, size, c) => {
    const sz = Math.min(Math.max(parseInt(size, 10), 8), 36);
    return `<span style="font-size:${sz}px;line-height:1.4">${c}</span>`;
  });

  // ── Media & links ──
  t = t.replace(/\[img\]([\s\S]*?)\[\/img\]/gi, (_, raw) => {
    const url = raw.trim().replace(/&amp;/g, '&');
    if (!isSafeUrl(url)) return '';
    return `<img src="${escapeHtml(url)}" style="max-width:100%;border-radius:6px;margin:6px 0;display:block" alt="" loading="lazy">`;
  });

  t = t.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, (_, href, c) => {
    const url = href.replace(/&amp;/g, '&');
    if (!isSafeUrl(url)) return c;
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="color:#7c3aed;text-decoration:underline">${c}</a>`;
  });
  t = t.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, (_, raw) => {
    const url = raw.replace(/&amp;/g, '&');
    if (!isSafeUrl(url)) return escapeHtml(raw);
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="color:#7c3aed;text-decoration:underline">${escapeHtml(url)}</a>`;
  });

  t = t.replace(/\[code\]([\s\S]*?)\[\/code\]/gi,
    '<code style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.15);border-radius:4px;padding:2px 6px;font-family:monospace;font-size:12px;word-break:break-all">$1</code>');

  return t;
}

export function bbcodeStrip(input) {
  if (!input) return '';
  return input.replace(/\[[^\]]*\]/g, '').trim();
}
