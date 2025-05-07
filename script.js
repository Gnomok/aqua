const API_URL = 'https://localhost:7140/configurator';



function loadTiles() {
  const savedTiles = JSON.parse(localStorage.getItem('tiles') || '[]');
  savedTiles.forEach(name => addTile(name));
  const data = JSON.parse(localStorage.getItem('tilesData'));
  if (!data) return;

  data.forEach(tileInfo => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.style.backgroundColor = tileInfo.color;
    tile.setAttribute('data-tooltip', 'Konfiguracja komponentu');
    
    // Добавляем кнопку удаления
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn';
    deleteButton.innerHTML = '✖';
    deleteButton.onclick = (event) => {
    event.stopPropagation(); // ← ключевая строка
    tile.remove();
    saveTiles();
};
tile.appendChild(deleteButton);

    tile.innerHTML += `
      <div class="tile-icon"><img src="img/gpu-icon.svg" alt="icon"></div>
      <div class="tile-label" contenteditable="true">${tileInfo.name}</div>
    `;

    // Добавляем обработчик для сохранения изменений в названии
    const label = tile.querySelector('.tile-label');
    label.addEventListener('input', () => {
      saveTiles(); // Сохраняем состояние плиток сразу после изменения
    });

    tile.addEventListener('click', (e) => {
      if (e.target.classList.contains('tile-label')) return;
      const title = tile.querySelector('.tile-label').innerText.trim();
      window.location.href = `konf.html?title=${encodeURIComponent(title)}`;
    });

    const container = document.getElementById('tilesContainer');
    container.insertBefore(tile, container.querySelector('.add-tile'));
  });
}

// Загружаем плитки при старте
loadTiles();






function toggleModal() {
  const modal = document.getElementById('loginModal');
  modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function addTile(name = 'Nazwa') {
  const colors = ['#6feeb7', '#7fccb6', '#74a7b2', '#8faff2', '#e4b7ff'];
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
  tile.setAttribute('data-tooltip', 'Konfiguracja komponentu');

  tile.innerHTML = `
    <div class="tile-icon"><img src="img/gpu-icon.svg" alt="icon"></div>
    <div class="tile-label" contenteditable="true">${name}</div>
  `;

  // Крестик (удаление)
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-btn';
  deleteButton.innerHTML = '✖';
  deleteButton.addEventListener('click', (event) => {
    event.stopPropagation(); // ⛔ блокируем переход по ссылке
    tile.remove();
    saveTiles();
  });
  tile.appendChild(deleteButton);

  // Переход при клике на плитку (если не редактируем)
  tile.addEventListener('click', (e) => {
    if (e.target.classList.contains('tile-label')) return;
    const title = tile.querySelector('.tile-label').innerText.trim();
    window.location.href = `konf.html?title=${encodeURIComponent(title)}`;
  });

  const container = document.getElementById('tilesContainer');
  container.insertBefore(tile, container.querySelector('.add-tile'));

  saveTiles();
}






function saveTiles() {
  const tiles = Array.from(document.querySelectorAll('.tile')).filter(t => !t.classList.contains('add-tile'));
  const data = tiles.map(tile => ({
    color: tile.style.backgroundColor,
    name: tile.querySelector('.tile-label').innerText.trim() // Сохраняем изменённое название
  }));
  localStorage.setItem('tilesData', JSON.stringify(data));
}



function toggleTheme() {
  document.body.classList.toggle('dark');
}

new Sortable(document.getElementById('tilesContainer'), {
  animation: 150,
  handle: '.tile-icon'
});

function toggleRegisterModal() {
  const modal = document.getElementById('registerModal');
  modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

async function register() {
  const login = document.getElementById('registerLogin').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  const error = document.getElementById('registerError');

  if (password !== confirmPassword) {
    error.style.display = 'block';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/Users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });

    if (res.ok) {
      alert(`Użytkownik ${login} został zarejestrowany!`);
      toggleRegisterModal();
    } else {
      const msg = await res.text();
      alert('Rejestracja nie powiodła się: ' + msg);
    }
  } catch (err) {
    alert('Błąd połączenia z serwerem.');
  }
}

async function login() {
  const loginInput = document.getElementById('loginInput').value.trim();
  const passwordInput = document.getElementById('loginPassword').value;
  
  try {
    const res = await fetch(`${API_URL}/Users/${loginInput}`);
    if (!res.ok) {
      alert('Nie znaleziono użytkownika!');
      return;
    }

    const user = await res.json();
    if (user.password !== passwordInput) {
      alert('Nieprawidłowe hasło!');
      return;
    }

    localStorage.setItem('userId', user.id);
    alert(`Zalogowano jako ${user.login}`);
    toggleModal();

  } catch (err) {
    alert('Błąd podczas logowania.');
  }
}
