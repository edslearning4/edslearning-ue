/*
 * Accordion Block (UE-safe)
 * Builds <details><summary> inside each authored "accordion-item" row
 * without replacing the authored wrapper element.
 */

function copyAttrs(from, to) {
  [...from.attributes].forEach((a) => to.setAttribute(a.name, a.value));
}

export default function decorate(block) {
  block.classList.add('accordion');

  [...block.children].forEach((item) => {
    if (item.querySelector('details.accordion-item')) return;

    const first = item.children[0]; // UE "Summary" element (has data-aue-prop="summary")
    const second = item.children[1]; // UE "Details" element (has data-aue-prop="details")
    if (!first || !second) return;

    // Build <summary> and PRESERVE UE bindings from the authored "Summary" element
    const summary = document.createElement('summary');
    copyAttrs(first, summary); // <-- keep data-aue-* so inline editing & placeholder work
    summary.classList.add('accordion-item-label');
    while (first.firstChild) summary.appendChild(first.firstChild);

    // Keep the authored "Details" element as-is (it already carries UE bindings)
    second.classList.add('accordion-item-body');

    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.append(summary, second);

    while (item.firstChild) item.removeChild(item.firstChild);
    item.appendChild(details);
  });
}
