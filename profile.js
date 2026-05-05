/* ──────────────────────────────────────────────
   Neclis World — Player Profile JS
   ────────────────────────────────────────────── */

/* ── Sidebar navigation active state ── */
document.querySelectorAll('.sidebar__item').forEach(item => {
  item.querySelector('.sidebar__btn').addEventListener('click', () => {
    document.querySelectorAll('.sidebar__item').forEach(i => i.classList.remove('sidebar__item--active'));
    item.classList.add('sidebar__item--active');
  });
});


/* ── Avatar controls ── */
const POSES = ['Front', 'Front Right', 'Right', 'Back', 'Left', 'Front Left'];
const ZOOM_SCALES = [0.82, 1, 1.18, 1.36];
let poseIdx = 0;
let zoomIdx = 1;

const poseLabelEl  = document.getElementById('poseLabel');
const silhouette   = document.querySelector('.avatar-silhouette');

function updateZoom() {
  silhouette.style.transform = `scale(${ZOOM_SCALES[zoomIdx]}) translateY(${(1 - ZOOM_SCALES[zoomIdx]) * 12}px)`;
}

document.getElementById('rotateLeft').addEventListener('click', () => {
  poseIdx = (poseIdx - 1 + POSES.length) % POSES.length;
  poseLabelEl.textContent = POSES[poseIdx];
  silhouette.style.filter = 'brightness(1.15)';
  setTimeout(() => silhouette.style.filter = '', 180);
});
document.getElementById('rotateRight').addEventListener('click', () => {
  poseIdx = (poseIdx + 1) % POSES.length;
  poseLabelEl.textContent = POSES[poseIdx];
  silhouette.style.filter = 'brightness(1.15)';
  setTimeout(() => silhouette.style.filter = '', 180);
});
document.getElementById('zoomIn').addEventListener('click', () => {
  if (zoomIdx < ZOOM_SCALES.length - 1) { zoomIdx++; updateZoom(); }
});
document.getElementById('zoomOut').addEventListener('click', () => {
  if (zoomIdx > 0) { zoomIdx--; updateZoom(); }
});


/* ── Floating particles ── */
(function spawnParticles() {
  const container = document.getElementById('particles');
  const COLORS = ['#a855f7', '#6d28d9', '#3b82f6', '#ec4899', '#8b5cf6', '#60a5fa'];

  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size     = Math.random() * 3.5 + 1.5;
    const color    = COLORS[Math.floor(Math.random() * COLORS.length)];
    const left     = Math.random() * 90 + 5;
    const delay    = Math.random() * 7;
    const duration = Math.random() * 4 + 4.5;

    p.style.cssText = `
      width:    ${size}px;
      height:   ${size}px;
      background: ${color};
      left:     ${left}%;
      bottom:   15px;
      box-shadow: 0 0 ${size * 2.5}px ${color};
      animation-duration:  ${duration}s;
      animation-delay:    -${delay}s;
    `;
    container.appendChild(p);
  }
})();


/* ── Showcase 3D tilt on hover ── */
document.querySelectorAll('[data-tilt]').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x  = e.clientX - rect.left;
    const y  = e.clientY - rect.top;
    const rx = ((y - rect.height / 2) / (rect.height / 2)) * -9;
    const ry = ((x - rect.width  / 2) / (rect.width  / 2)) *  9;
    card.style.transform = `perspective(420px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.05)`;
    card.style.transition = 'transform 0.08s ease';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.32s ease, box-shadow 0.32s ease, border-color 0.2s ease';
    card.style.transform  = '';
  });
});


/* ── Read More (About section) ── */
const readMoreBtn = document.getElementById('readMoreBtn');
const aboutText   = document.getElementById('aboutText');
let bioExpanded   = false;

readMoreBtn.addEventListener('click', () => {
  bioExpanded = !bioExpanded;
  aboutText.classList.toggle('expanded', bioExpanded);
  readMoreBtn.textContent = bioExpanded ? 'Show less ▴' : 'Read more ▾';
});


/* ── Guestbook compose ── */
const postBtn   = document.getElementById('postMessageBtn');
const gbCompose = document.getElementById('gbCompose');
const gbCancel  = document.getElementById('gbCancel');
const gbSubmit  = document.getElementById('gbSubmit');
const gbInput   = document.getElementById('gbInput');
const gbCounter = document.getElementById('gbCounter');
const gbFeed    = document.getElementById('guestbookFeed');
const gbBadge   = document.getElementById('gbCountBadge');

postBtn.addEventListener('click', () => {
  gbCompose.classList.add('visible');
  postBtn.style.display = 'none';
  gbInput.focus();
});

gbCancel.addEventListener('click', closeCompose);

gbInput.addEventListener('input', () => {
  const len = gbInput.value.length;
  gbCounter.textContent = `${len} / 200`;
  gbCounter.classList.toggle('warn', len > 170);
});

gbInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitMessage(); }
  if (e.key === 'Escape') closeCompose();
});

gbSubmit.addEventListener('click', submitMessage);

function closeCompose() {
  gbCompose.classList.remove('visible');
  postBtn.style.display = '';
  gbInput.value = '';
  gbCounter.textContent = '0 / 200';
  gbCounter.classList.remove('warn');
}

function submitMessage() {
  const text = gbInput.value.trim();
  if (!text) return;
  addMessage(text, 'You', 'just now', null);
  updateBadge(+1);
  closeCompose();
}

function updateBadge(delta) {
  const current = parseInt(gbBadge.textContent, 10) || 0;
  gbBadge.textContent = current + delta;
}

function addMessage(text, name, time, avatarGradient) {
  const grad = avatarGradient || randomGradient();
  const msg  = document.createElement('div');
  msg.className = 'gb-message gb-message--new';
  msg.innerHTML = `
    <div class="gb-message__avatar">
      <div class="gb-avatar-inner" style="background:${grad};"></div>
    </div>
    <div class="gb-message__body">
      <div class="gb-message__header">
        <span class="gb-message__name">${escHtml(name)}</span>
        <span class="gb-message__time">${escHtml(time)}</span>
      </div>
      <p class="gb-message__text">${escHtml(text)}</p>
      <div class="gb-message__footer">
        <button class="gb-react-btn" data-liked="false" data-count="0">♥ 0</button>
        <button class="gb-react-btn" data-liked="false" data-count="0">🔥 0</button>
        <button class="gb-reply-btn">Reply</button>
      </div>
    </div>
  `;
  gbFeed.insertBefore(msg, gbFeed.firstChild);
  wireReactions(msg);
}

function randomGradient() {
  const pairs = [
    ['#7c3aed','#1e40af'],
    ['#be185d','#7c3aed'],
    ['#1e40af','#065f46'],
    ['#5b21b6','#db2777'],
  ];
  const [a, b] = pairs[Math.floor(Math.random() * pairs.length)];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


/* ── Reaction buttons (like / fire) ── */
function wireReactions(root) {
  root.querySelectorAll('.gb-react-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleReaction(btn));
  });
}

function toggleReaction(btn) {
  const liked   = btn.dataset.liked === 'true';
  const count   = parseInt(btn.dataset.count, 10);
  const emoji   = btn.textContent.trim().split(' ')[0];
  const newCount = liked ? count - 1 : count + 1;

  btn.dataset.liked = String(!liked);
  btn.dataset.count = newCount;
  btn.textContent   = `${emoji} ${newCount}`;
  btn.classList.toggle('gb-react-btn--liked', !liked);

  btn.style.transform = 'scale(1.35)';
  setTimeout(() => btn.style.transform = '', 180);
}

/* Wire reactions on existing messages */
document.querySelectorAll('.gb-react-btn').forEach(btn => {
  btn.addEventListener('click', () => toggleReaction(btn));
});
