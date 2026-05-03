const navbarHTML = `
<nav class="navbar">
  <div class="container">
    <a href="/" class="logo">💾 ЗУ ЭВМ</a>
    <div class="nav-links">
      <a href="/">Главная</a>
      <a href="/theory">Теория</a>
      <a href="/test">Тестирование</a>
      <span id="navAuthLinks"></span>
    </div>
  </div>
</nav>`;

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const nav = document.querySelector('nav.navbar');
  if (!nav) {
    body.insertAdjacentHTML('afterbegin', navbarHTML);
  }
  checkAuth();
});

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    const container = document.getElementById('navAuthLinks');
    if (data.user) {
      let links = '';
      if (data.user.role === 'student') {
        links += '<a href="/student">Кабинет</a>';
      } else {
        links += '<a href="/teacher">Кабинет преподавателя</a>';
      }
      links += `<button onclick="doLogout()" class="btn btn-sm btn-outline">Выйти</button>`;
      links += `<span class="user-greeting">${data.user.first_name} ${data.user.last_name}</span>`;
      container.innerHTML = links;
    } else {
      container.innerHTML = '<a href="/login" class="btn btn-sm btn-primary">Войти</a>';
    }
  } catch {
    const container = document.getElementById('navAuthLinks');
    if (container) container.innerHTML = '<a href="/login" class="btn btn-sm btn-primary">Войти</a>';
  }
}

async function doLogout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/';
}

async function logout() {
  doLogout();
}
