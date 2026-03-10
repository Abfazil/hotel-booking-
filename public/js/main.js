document.addEventListener('DOMContentLoaded', () => {

  // Tab Switching
  const tabs = document.querySelectorAll('.hotels__tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('hotels__tab--active'));
      tab.classList.add('hotels__tab--active');
    });
  });

  // Favourite Button Toggle
  const favBtns = document.querySelectorAll('.hotel-card__fav');
  favBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const icon = btn.querySelector('i');
      icon.classList.toggle('far');
      icon.classList.toggle('fas');
      btn.style.color = icon.classList.contains('fas') ? '#e74c3c' : '';
    });
  });

  // Smooth Scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

});