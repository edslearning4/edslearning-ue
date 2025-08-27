/*import { fetchPlaceholders } from '../../scripts/placeholders.js';

function isAuthoringMode(block) {
  // Heuristic: UE decorates authored elements with data-aue-* attributes.
  // If the block or its descendants have any, assume UE authoring.
  return !!(block.closest('[data-aue-resource]') || block.querySelector('[data-aue-prop]'));
}

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');
  slides.forEach((aSlide, idx) => {
    const hidden = idx !== slideIndex;
    aSlide.setAttribute('aria-hidden', hidden);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (hidden) link.setAttribute('tabindex', '-1');
      else link.removeAttribute('tabindex');
    });
  });

  const indicators = block.parentElement.querySelectorAll('.carousel-slide-indicator'); // indicators may live outside block in UE
  indicators.forEach((indicator, idx) => {
    const btn = indicator.querySelector('button');
    if (!btn) return;
    if (idx !== slideIndex) btn.removeAttribute('disabled');
    else btn.setAttribute('disabled', 'true');
  });
}

function showSlide(block, slideIndex = 0) {
  const track = block.querySelector('.carousel-slides'); // items container in-place
  const slides = block.querySelectorAll('.carousel-slide');
  if (!track || !slides.length) return;

  let real = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) real = 0;
  const active = slides[real];

  active.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  track.scrollTo({
    top: 0,
    left: active.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  const root = block.parentElement; // indicators/nav may live as siblings
  const slideIndicators = root.querySelector('.carousel-slide-indicators');
  if (slideIndicators) {
    slideIndicators.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', (e) => {
        const li = e.currentTarget.parentElement;
        showSlide(block, parseInt(li.dataset.targetSlide, 10));
      });
    });
  }

  const prev = root.querySelector('.slide-prev');
  const next = root.querySelector('.slide-next');
  if (prev) {
    prev.addEventListener('click', () => {
      showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) - 1);
    });
  }
  if (next) {
    next.addEventListener('click', () => {
      showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) + 1);
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });

  block.querySelectorAll('.carousel-slide').forEach((s) => observer.observe(s));
}

function decorateRowAsSlide(row, idx, carouselId) {
  if (row.classList.contains('carousel-slide')) return;

  row.classList.add('carousel-slide');
  row.dataset.slideIndex = String(idx);
  if (!row.id) row.id = `carousel-${carouselId}-slide-${idx}`;

  // Identify authored field wrappers by prop names
  const imageCol = row.querySelector(':scope > [data-aue-prop="image"]') || row.children[0];
  const contentCol = row.querySelector(':scope > [data-aue-prop="content"]') || row.children[1];
  const alignEl = row.querySelector(':scope > [data-aue-prop="align"]');

  if (imageCol) imageCol.classList.add('carousel-slide-image');
  if (contentCol) {
    contentCol.classList.add('carousel-slide-content');
    const alignVal = alignEl?.textContent?.trim();
    if (alignVal) contentCol.setAttribute('data-align', alignVal);
  }

  // ARIA: label slide by first heading if present
  const labeledBy = row.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    if (!labeledBy.id) labeledBy.id = `${row.id}-title`;
    row.setAttribute('aria-labelledby', labeledBy.id);
  }
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  if (!block.id) block.id = `carousel-${carouselId}`;

  // 1) Find the UE collection container (do NOT modify its child structure)
  const itemsContainer = block.querySelector('[data-aue-prop="items"]');
  if (!itemsContainer) return;

  // 2) Decorate each existing row (UE item) IN-PLACE
  const rows = Array.from(itemsContainer.children).filter((n) => n.nodeType === 1);
  rows.forEach((row, idx) => decorateRowAsSlide(row, idx, carouselId));

  // 3) Authoring vs Published placement of indicators/nav
  const placeholders = await fetchPlaceholders();
  const inAuthor = isAuthoringMode(block);

  // a) region semantics on the block only
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  // b) give the items container the track class ONLY (safe CSS hook)
  itemsContainer.classList.add('carousel-slides');
  // DO NOT append any extra elements inside itemsContainer.

  // c) build indicators/nav as siblings (UE) or inside block (published)
  const hostForControls = inAuthor ? block.parentElement : block;

  // Remove old controls if re-decorating
  hostForControls.querySelectorAll(':scope > nav[aria-label="Carousel Slide Controls"], :scope > .carousel-navigation-buttons').forEach((n) => n.remove());

  if (rows.length > 1) {
    // indicators
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');

    const slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);

    rows.forEach((_, idx) => {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="${(placeholders.showSlide || 'Show Slide')} ${idx + 1} ${(placeholders.of || 'of')} ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    });

    hostForControls.append(slideIndicatorsNav);

    // nav buttons
    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
       <button type="button" class="slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
       <button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
     `;
    hostForControls.append(slideNavButtons);

    bindEvents(block);
  }
}*/
