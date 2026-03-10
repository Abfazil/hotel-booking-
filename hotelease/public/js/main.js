/**
 * public/js/main.js
 * Client-side interactivity for HotelEase.
 * Keeps logic minimal — Pug + Express handle the rendering.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── Tab Switching ─────────────────────────────────────────────────────────
  const tabs = document.querySelectorAll('.hotels__tab');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active state from all tabs
      tabs.forEach(t => t.classList.remove('hotels__tab--active'));
      // Set clicked tab as active
      tab.classList.add('hotels__tab--active');
    });
  });

  // ── Favourite Heart Toggle (cards + detail page) ─────────────────────────
  const favBtns = document.querySelectorAll('[data-fav-toggle]');

  favBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const icon = btn.querySelector('i');
      if (!icon) return;

      icon.classList.toggle('far');
      icon.classList.toggle('fas');
      btn.classList.toggle('is-active');
    });
  });

  // ── Smooth-scroll for nav links ───────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ── Listing View Toggle (grid / list) ─────────────────────────────────────
  const listingSection = document.querySelector('.listing');

  if (listingSection) {
    const viewButtons = document.querySelectorAll('.view-toggle__btn');

    const setView = (view) => {
      listingSection.classList.toggle('listing--grid', view === 'grid');
      listingSection.classList.toggle('listing--list', view === 'list');

      viewButtons.forEach(btn => {
        if (btn.dataset.view === view) {
          btn.classList.add('view-toggle__btn--active');
        } else {
          btn.classList.remove('view-toggle__btn--active');
        }
      });
    };

    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (view === 'grid' || view === 'list') {
          setView(view);
        }
      });
    });
  }

});
