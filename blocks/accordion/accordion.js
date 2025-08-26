/*
 * Accordion Block (UE-safe)
 * Builds <details><summary> inside each authored "accordion-item" row
 * without replacing the authored wrapper element.
 */
export default function decorate(block) {
  // Optional: mark block for clarity (safe in UE)
  block.classList.add('accordion');

  // Each child "row" is an accordion-item in UE
  [...block.children].forEach((item) => {
    // If we've already decorated this item, skip
    if (item.querySelector('details.accordion-item')) return;

    // Expect: first cell = summary, second cell = body (from UE model)
    const first = item.children[0];
    const second = item.children[1];

    // Guard: if authoring/UE scaffolding still empty, bail gracefully
    if (!first || !second) return;

    // Build <summary>
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    // Move (not clone) children from the authored cell into summary
    while (first.firstChild) summary.appendChild(first.firstChild);

    // Turn body cell into the body container class
    second.classList.add('accordion-item-body');

    // Build <details> and insert into the SAME authored wrapper
    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.append(summary, second);

    // Clear the authored wrapper and append details back inside it
    while (item.firstChild) item.removeChild(item.firstChild);
    item.appendChild(details);
  });
}
