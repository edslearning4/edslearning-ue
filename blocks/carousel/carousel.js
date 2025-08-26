import { fetchPlaceholders } from '../../scripts/placeholders.js';

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

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    const btn = indicator.querySelector('button');
    if (!btn) return;
    if (idx !== slideIndex) btn.removeAttribute('disabled');
    else btn.setAttribute('disabled', 'true');
  });
}

function showSlide(block, slideIndex = 0) {
  const track = block.querySelector('.carousel-slides'); // items container
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
  const slideIndicators = block.querySelector('.carousel-slide-indicators');
  if (slideIndicators) {
    slideIndicators.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', (e) => {
        const li = e.currentTarget.parentElement;
        showSlide(block, parseInt(li.dataset.targetSlide, 10));
      });
    });
  }

  const prev = block.querySelector('.slide-prev');
  const next = block.querySelector('.slide-next');
  if (prev) prev.addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) - 1);
  });
  if (next) next.addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) + 1);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });

  block.querySelectorAll('.carousel-slide').forEach((s) => observer.observe(s));
}

function decorateRowAsSlide(row, idx, carouselId) {
  // Already decorated? skip
  if (row.classList.contains('carousel-slide')) return;

  row.classList.add('carousel-slide');
  row.dataset.slideIndex = idx.toString();
  row.id ||= `carousel-${carouselId}-slide-${idx}`;

  // Identify field wrappers by prop (robust to field order)
  const imageCol = row.querySelector(':scope > [data-aue-prop="image"]') || row.children[0];
  const contentCol = row.querySelector(':scope > [data-aue-prop="content"]') || row.children[1];
  const alignEl = row.querySelector(':scope > [data-aue-prop="align"]');

  if (imageCol) imageCol.classList.add('carousel-slide-image');
  if (contentCol) {
    contentCol.classList.add('carousel-slide-content');
    // Map UE align value (string) -> data-align on content column
    const alignVal = alignEl?.textContent?.trim();
    if (alignVal) contentCol.setAttribute('data-align', alignVal);
  }

  // ARIA: label slide by first heading if present
  const labeledBy = row.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    if (!labeledBy.id) labeledBy.id = `${row.id || `carousel-${carouselId}-slide-${idx}`}-title`;
    row.setAttribute('aria-labelledby', labeledBy.id);
  }
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.id ||= `carousel-${carouselId}`;

  // Use the UE collection container as the slide track (do NOT remove/move it)
  const itemsContainer = block.querySelector('[data-aue-prop="items"]');
  if (!itemsContainer) return;

  // Make the collection container double as our track + positioning root
  itemsContainer.classList.add('carousel-slides', 'carousel-slides-container');

  // Collect item rows (UE wrappers) and decorate them in-place
  const rows = Array.from(itemsContainer.children).filter((n) => n.nodeType === 1);
  const isSingle = rows.length < 2;

  const placeholders = await fetchPlaceholders();

  // Region semantics
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  // Build indicators + nav (don’t wrap/move the items container)
  let slideIndicators;
  if (!isSingle) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');

    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    // put indicators after the items container
    itemsContainer.insertAdjacentElement('afterend', slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class="slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
      <button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
    `;
    // Buttons should overlay the track: place them inside the container
    itemsContainer.append(slideNavButtons);
  }

  // Decorate each UE row as a slide (no cloning, no hiding)
  rows.forEach((row, idx) => {
    decorateRowAsSlide(row, idx, carouselId);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="${(placeholders.showSlide || 'Show Slide')} ${idx + 1} ${(placeholders.of || 'of')} ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    }
  });

  if (!isSingle) bindEvents(block);
}