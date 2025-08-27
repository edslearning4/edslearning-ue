import fetchPlaceholders from '../../scripts/placeholders.js';

/* --------- autoplay helpers --------- */
function getAutoplayInterval(block) {
  const attr = Number(block.getAttribute('data-autoplay-interval'));
  return Number.isFinite(attr) && attr > 0 ? attr : 3000; // default 3s
}

function stopAutoplay(block) {
  if (block._carouselTimer) {
    clearInterval(block._carouselTimer);
    block._carouselTimer = null;
  }
}

function startAutoplay(block) {
  if (block.getAttribute('data-autoplay') === 'false') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  stopAutoplay(block);
  const interval = getAutoplayInterval(block);

  block._carouselTimer = setInterval(() => {
    const i = Number(block.dataset.activeSlide || '0');
    showSlide(block, i + 1);
  }, interval);
}

/* --------- helpers --------- */
function isAuthoring(block) {
  return !!(
    block.closest('[data-aue-resource]') ||
    block.querySelector('[data-aue-prop]') ||
    block.matches('[data-aue-filter]')
  );
}

function labelSlideForAria(slideEl) {
  const heading = slideEl.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    if (!heading.id) heading.id = `${slideEl.id || 'carousel-slide'}-title`;
    slideEl.setAttribute('aria-labelledby', heading.id);
  }
}

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
      stopAutoplay(block);
      const li = e.currentTarget.closest('.carousel-slide-indicator');
      showSlide(block, Number(li?.dataset.targetSlide || 0));
      startAutoplay(block);
    });
  });

  const prev = block.querySelector('.slide-prev');
  const next = block.querySelector('.slide-next');
  if (prev) prev.addEventListener('click', () => {
    stopAutoplay(block);
    showSlide(block, Number(block.dataset.activeSlide || 0) - 1);
    startAutoplay(block);
  });
  if (next) next.addEventListener('click', () => {
    stopAutoplay(block);
    showSlide(block, Number(block.dataset.activeSlide || 0) + 1);
    startAutoplay(block);
  });

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((en) => en.isIntersecting && updateActiveSlide(en.target)),
    { threshold: 0.5 },
  );
  block.querySelectorAll('.carousel-slide').forEach((s) => observer.observe(s));

  // pause/resume on hover & focus
  block.addEventListener('mouseenter', () => stopAutoplay(block));
  block.addEventListener('mouseleave', () => startAutoplay(block));
  block.addEventListener('focusin', () => stopAutoplay(block));
  block.addEventListener('focusout', () => startAutoplay(block));

  // pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay(block);
    else startAutoplay(block);
  });
}

/* --------- AUTHORING (UE) path --------- */
function decorateUE(block, itemsEl, carouselId) {
  itemsEl.classList.add('carousel-slides');

  const rows = Array.from(itemsEl.children).filter((n) => n.nodeType === 1);
  rows.forEach((row, idx) => {
    row.classList.add('carousel-slide');
    row.dataset.slideIndex = String(idx);
    if (!row.id) row.id = `carousel-${carouselId}-slide-${idx}`;

    const imageCol = row.querySelector(':scope > [data-aue-prop="image"]') || row.children[0];
    const contentCol = row.querySelector(':scope > [data-aue-prop="content"]') || row.children[1];
    const alignEl = row.querySelector(':scope > [data-aue-prop="align"]');

    if (imageCol) imageCol.classList.add('carousel-slide-image');
    if (contentCol) {
      contentCol.classList.add('carousel-slide-content');
      const align = (alignEl?.textContent || 'left').trim() || 'left';
      contentCol.setAttribute('data-align', align);
    }

    labelSlideForAria(row);
  });

  return rows.length;
}

/* --------- PUBLISHED path --------- */
function createSlideFromRow(rowDiv, idx, carouselId) {
  const slide = document.createElement('li');
  slide.className = 'carousel-slide';
  slide.dataset.slideIndex = String(idx);
  slide.id = `carousel-${carouselId}-slide-${idx}`;

  const cols = rowDiv.querySelectorAll(':scope > div');

  const imgCol = cols[0] || document.createElement('div');
  imgCol.classList.add('carousel-slide-image');

  const contentCol = cols[1] || document.createElement('div');
  contentCol.classList.add('carousel-slide-content');

  const alignCol = cols[2];
  const align = alignCol?.textContent?.trim().toLowerCase() || 'left';
  contentCol.setAttribute('data-align', align);

  slide.append(imgCol, contentCol);
  labelSlideForAria(slide);
  return slide;
}

function decoratePublished(block, carouselId) {
  const rowDivs = Array.from(block.children).filter(
    (n) => n.nodeType === 1 && n.tagName.toLowerCase() === 'div',
  );
  if (!rowDivs.length) return 0;

  const ul = document.createElement('ul');
  ul.className = 'carousel-slides';

  rowDivs.forEach((row, idx) => {
    const slide = createSlideFromRow(row, idx, carouselId);
    ul.append(slide);
  });

  block.innerHTML = '';
  block.append(ul);
  return rowDivs.length;
}

/* --------- main --------- */
let seq = 0;
export default async function decorate(block) {
  seq += 1;
  if (!block.id) block.id = `carousel-${seq}`;

  const placeholders = await fetchPlaceholders().catch(() => ({}));
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders?.carousel || 'Carousel');

  const authoring = isAuthoring(block);
  let slideCount = 0;

  if (authoring) {
    const itemsEl = block.querySelector('[data-aue-prop="items"]');
    if (!itemsEl) return;
    slideCount = decorateUE(block, itemsEl, seq);

    block.querySelectorAll(':scope > nav[aria-label="Carousel Slide Controls"]').forEach((n) => n.remove());
    block.querySelectorAll(':scope > .carousel-navigation-buttons').forEach((n) => n.remove());
    block.removeAttribute('data-active-slide');
    return;
  }

  slideCount = decoratePublished(block, seq);

  block.querySelectorAll(':scope > nav[aria-label="Carousel Slide Controls"]').forEach((n) => n.remove());
  block.querySelectorAll(':scope > .carousel-navigation-buttons').forEach((n) => n.remove());

  if (slideCount > 1) {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', placeholders?.carouselSlideControls || 'Carousel Slide Controls');

    const ol = document.createElement('ol');
    ol.className = 'carousel-slide-indicators';
    for (let i = 0; i < slideCount; i += 1) {
      const li = document.createElement('li');
      li.className = 'carousel-slide-indicator';
      li.dataset.targetSlide = String(i);
      li.innerHTML = `<button type="button" aria-label="${(placeholders?.showSlide || 'Show Slide')} ${i + 1} ${(placeholders?.of || 'of')} ${slideCount}"></button>`;
      ol.append(li);
    }
    nav.append(ol);
    block.append(nav);

    const btns = document.createElement('div');
    btns.className = 'carousel-navigation-buttons';
    btns.innerHTML = `
      <button type="button" class="slide-prev" aria-label="${placeholders?.previousSlide || 'Previous Slide'}"></button>
      <button type="button" class="slide-next" aria-label="${placeholders?.nextSlide || 'Next Slide'}"></button>
    `;
    block.append(btns);

    bindEvents(block);
    block.dataset.activeSlide = '0';
    updateActiveSlide(block.querySelector('.carousel-slide'));

    // start autoplay (default 3s)
    startAutoplay(block);
  }
}
