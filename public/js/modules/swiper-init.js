// public/js/modules/swiper-init.js
import Swiper from 'https://cdn.jsdelivr.net/npm/swiper@11.0.5/swiper-bundle.min.mjs';

export function inicializarSwiper() {
  return new Swiper('.swiper', {
    slidesPerView: 3,
    spaceBetween: 20,
    centeredSlides: true,
    loop: true,
    slideToClickedSlide: true,
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    },
    mousewheel: true,
    breakpoints: {
      768: {
        slidesPerView: 3,
      },
      480: {
        slidesPerView: 3,
      },
    },
    scrollbar: {
      el: '.swiper-scrollbar',
      draggable: true,
      hide: false
    },
    breakpoints: {
      1024: { slidesPerView: 3 },
      768: { slidesPerView: 3 },
      480: { slidesPerView: 1 }
    }
  });
}
