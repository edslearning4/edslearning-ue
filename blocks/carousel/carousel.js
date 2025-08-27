import fetchPlaceholders from '../../scripts/placeholders.js';

// --- helpers ---
function updateActiveSlide(slide) {
  if (!slide) return;
  const block = slide.closest('.carousel');
  const slideIndex = Number(slide.dataset.slideIndex || 0);
  block.dataset.activeSlide = String(slideIndex);

  const slides = block.querySelectorAll('.carousel-slide');
  slides.forEach((s, i) => {
    const hidden = i !== slideIndex;
    s.setAttribute('aria-hidden', hidden ? 'true' : 'false');
    s.querySelectorAll('a').forEach((a) => {
      if (hidden) a.setAttribute('tabindex', '-1');
      else a.removeAttribute('tabindex');
    });
  });

  const buttons = block.querySelectorAll('.carousel-slide-indicator button');
  buttons.forEach((btn, i) => {
    if (i === slideIndex) btn.setAttribute('disabled', 'true');
    else btn.removeAttribute('disabled');
  });
}

function showSlide(block, toIndex = 0) {
  const track = block.querySelector('.carousel-slides');
  const slides = block.querySelectorAll('.carousel-slide');
  if (!track || !slides.length) return;

  let idx = toIndex;
  if (idx < 0) idx = slides.length - 1;
  if (idx >= slides.length) idx = 0;

  const active = slides[idx];
  active.querySelectorAll('a').forEach((a) => a.removeAttribute('tabindex'));

  track.scrollTo({
    top: 0,
    left: active.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  const indButtons = block.querySelectorAll('.carousel-slide-indicator button');
  indButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const li = e.currentTarget.closest('.carousel-slide-indicator');
      showSlide(block, Number(li?.dataset.targetSlide || 0));
    });
  });

  const prev = block.querySelector('.slide-prev');
  const next = block.querySelector('.slide-next');
  if (prev) {
    prev.addEventListener('click', () => {
      showSlide(block, Number(block.dataset.activeSlide || 0) - 1);
    });
  }
  if (next) {
    next.addEventListener('click', () => {
      showSlide(block, Number(block.dataset.activeSlide || 0) + 1);
    });
  }

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((en) => en.isIntersecting && updateActiveSlide(en.target)),
    { threshold: 0.5 },
  );
  block.querySelectorAll('.carousel-slide').forEach((s) => observer.observe(s));
}

function decorateRowAsSlide(row, idx, carouselId) {
  if (row.classList.contains('carousel-slide')) return;

  row.classList.add('carousel-slide');
  row.dataset.slideIndex = String(idx);
  if (!row.id) row.id = `carousel-${carouselId}-slide-${idx}`;

  // Field wrappers (robust even if author reorders fields)
  const imageCol = row.querySelector(':scope > [data-aue-prop="image"]') || row.children[0];
  const contentCol = row.querySelector(':scope > [data-aue-prop="content"]') || row.children[1];
  const alignEl = row.querySelector(':scope > [data-aue-prop="align"]');

  if (imageCol) imageCol.classList.add('carousel-slide-image');

  if (contentCol) {
    contentCol.classList.add('carousel-slide-content');
    // Render-time default: left (does not modify authored content)
    const align = (alignEl?.textContent || 'left').trim() || 'left';
    contentCol.setAttribute('data-align', align);
  }

  // ARIA: label slide by first heading if present
  const labeledBy = row.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    if (!labeledBy.id) labeledBy.id = `${row.id}-title`;
    row.setAttribute('aria-labelledby', labeledBy.id);
  }
}

// --- main ---
let carouselSeq = 0;
export default async function decorate(block) {
  carouselSeq += 1;
  if (!block.id) block.id = `carousel-${carouselSeq}`;

  const items = block.querySelector('[data-aue-prop="items"]');
  if (!items) return; // model not attached yet

  // Track styling: safe to add a class; do NOT add children into items
  items.classList.add('carousel-slides');

  // Decorate slides in place
  const rows = Array.from(items.children).filter((n) => n.nodeType === 1);
  rows.forEach((row, idx) => decorateRowAsSlide(row, idx, carouselSeq));

  // Semantics
  const placeholders = await fetchPlaceholders().catch(() => ({}));
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders?.carousel || 'Carousel');

  // Clean old controls (if re-decorating)
  block.querySelectorAll(':scope > nav[aria-label="Carousel Slide Controls"]').forEach((n) => n.remove());
  block.querySelectorAll(':scope > .carousel-navigation-buttons').forEach((n) => n.remove());

  if (rows.length > 1) {
    // Indicators (sibling of items, but inside block)
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', placeholders?.carouselSlideControls || 'Carousel Slide Controls');

    const ol = document.createElement('ol');
    ol.className = 'carousel-slide-indicators';
    rows.forEach((_, idx) => {
      const li = document.createElement('li');
      li.className = 'carousel-slide-indicator';
      li.dataset.targetSlide = String(idx);
      li.innerHTML = `<button type="button" aria-label="${(placeholders?.showSlide || 'Show Slide')} ${idx + 1} ${(placeholders?.of || 'of')} ${rows.length}"></button>`;
      ol.append(li);
    });
    nav.append(ol);
    block.append(nav);

    // Prev/Next overlay (inside block, outside items)
    const btns = document.createElement('div');
    btns.className = 'carousel-navigation-buttons';
    btns.innerHTML = `
      <button type="button" class="slide-prev" aria-label="${placeholders?.previousSlide || 'Previous Slide'}"></button>
      <button type="button" class="slide-next" aria-label="${placeholders?.nextSlide || 'Next Slide'}"></button>
    `;
    block.append(btns);

    bindEvents(block);
  }

  // Initialize at first slide (if any)
  block.dataset.activeSlide = '0';
  updateActiveSlide(block.querySelector('.carousel-slide'));
}
