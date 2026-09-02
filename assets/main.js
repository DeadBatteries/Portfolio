// ============================================================
// Reveal on scroll — fade + rise, discreto
// ============================================================
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || items.length === 0) {
    items.forEach(el => el.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach(el => io.observe(el));
}

// ============================================================
// Hero: sequência única de "boot" no carregamento da home
// ============================================================
function initHeroBoot() {
  const eyebrow = document.querySelector('[data-boot-line]');
  const title = document.querySelector('.hero h1');
  const sub = document.querySelector('.hero-sub');
  const actions = document.querySelector('.hero-actions');
  if (!eyebrow) return;

  const lines = [
    'iniciando_sessao...',
    'carregando_perfil... ok',
    'pronto.'
  ];
  let i = 0;

  function typeLine() {
    if (i >= lines.length) {
      eyebrow.innerHTML = lines[lines.length - 1] + '<span class="cursor-blink"></span>';
      title && title.classList.add('revealed');
      sub && sub.classList.add('revealed');
      actions && actions.classList.add('revealed');
      return;
    }
    eyebrow.textContent = lines[i];
    i++;
    setTimeout(typeLine, i === 1 ? 420 : 260);
  }
  typeLine();
}

// ============================================================
// Transição suave entre páginas (wipe sutil)
// ============================================================
function initPageTransitions() {
  const overlay = document.createElement('div');
  overlay.className = 'page-transition';
  document.body.appendChild(overlay);
  document.body.classList.add('page-fade-in');

  const links = document.querySelectorAll('a[data-transition]');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || link.target === '_blank') return;
      e.preventDefault();
      overlay.classList.add('leaving');
      setTimeout(() => { window.location.href = href; }, 380);
    });
  });
}

// ============================================================
// Menu mobile
// ============================================================
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    const open = links.style.display === 'flex';
    links.style.display = open ? 'none' : 'flex';
    links.style.flexDirection = 'column';
    links.style.position = 'absolute';
    links.style.top = '100%';
    links.style.left = '0';
    links.style.right = '0';
    links.style.background = 'rgba(10,14,20,0.98)';
    links.style.padding = '12px';
    links.style.borderBottom = '1px solid var(--border)';
    toggle.setAttribute('aria-expanded', String(!open));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initHeroBoot();
  initPageTransitions();
  initMobileNav();
});
