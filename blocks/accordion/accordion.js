/*
 * Accordion Block
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 */

export default function decorate(block) {
  [...block.children].forEach((item) => {
    // The first child corresponds to the "summary" (label) of accordion-item
    const summaryElement = item.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    summary.append(...summaryElement.childNodes);

    // The second child corresponds to the "details" (body) of accordion-item
    const detailsElement = item.children[1];
    detailsElement.className = 'accordion-item-body';

    // Create <details> element to wrap summary and details body as per semantic HTML
    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.append(summary, detailsElement);

    // Replace original item with the <details> wrapper
    item.replaceWith(details);
  });
}
