const buttons = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.guide-list-card')];
const status = document.getElementById('filter-status');

function applyFilter(filter) {
  let visible = 0;
  for (const card of cards) {
    const show = filter === 'all' || card.dataset.category === filter;
    card.hidden = !show;
    if (show) visible++;
  }
  for (const button of buttons) {
    const active = button.dataset.filter === filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  status.textContent = filter === 'all' ? `Showing all ${visible} guides` : `Showing ${visible} ${filter} guide${visible === 1 ? '' : 's'}`;
}

for (const button of buttons) button.addEventListener('click', () => applyFilter(button.dataset.filter));
applyFilter('all');
