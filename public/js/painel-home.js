import { inicializarSwiper } from './modules/swiper-init.js';

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const toggleBtn = document.getElementById('toggleSidebar');


async function LoadContent(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao carregar conteúdo');
    const html = await response.text();
    document.getElementById('mainContent').innerHTML = html;

    if (url.includes('/donate/content')) {
      requestAnimationFrame(initializeDonateFeatures);
    }

    if (url.includes('/list-of-characters/content')) {
      requestAnimationFrame(() => inicializarSwiper());
    }

  } catch (error) {
    console.error('Erro:', error);
    document.getElementById('mainContent').innerHTML = '<p>Erro ao carregar conteúdo.</p>';
  }
}

document.querySelectorAll('.sidebar a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.sidebar a').forEach(el => el.classList.remove('active'));
    link.classList.add('active');

    if (link.id === 'linkDonate') LoadContent('/donate/content');
    else if (link.id === 'linkDashboard') LoadContent('/dashboard/content');
    else if (link.id === 'linkMinhasDoacoes') LoadContent('/minhas-doacoes/content');
    else if (link.id === 'linkMetasDoacao') LoadContent('/metas-doacao/content');
    else if (link.id === 'linkListOfCharacters') LoadContent('/list-of-characters/content');
  });

});

toggleBtn.addEventListener('click', () => {
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('active');
    overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
  } else {
    sidebar.classList.toggle('collapsed');
  }
});

overlay.addEventListener('click', () => {
  sidebar.classList.remove('active');
  overlay.style.display = 'none';
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    sidebar.classList.remove('active');
    overlay.style.display = 'none';
  } else {
    sidebar.classList.remove('collapsed');
  }
});