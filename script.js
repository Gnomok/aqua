const API_URL = 'https://localhost:7140/configurator';

const userLogin = localStorage.getItem('userLogin');
if (userLogin) {
  document.getElementById('userInfo').innerText = `Zalogowano jako: ${userLogin}`;
}

function createAddTileButton() {
  const addTileElement = document.createElement('div');
  addTileElement.className = 'tile add-tile';
  addTileElement.innerHTML = '<div class="tile-icon">＋</div><div class="tile-label">Dodaj konfigurację</div>';
  addTileElement.addEventListener('click', () => addTile());
  return addTileElement;
}


window.onload = () => {
  const userLogin = localStorage.getItem('userLogin');
  const userId = localStorage.getItem('userId');
  
  // Check if user is logged in by checking for userId and userLogin in localStorage
  if (userLogin && userId) {
    // User is logged in, update the UI accordingly
    document.getElementById('userInfo').innerText = `Zalogowano jako: ${userLogin}`;
    document.getElementById('userInfo').innerHTML = `
      <span>Zalogowano jako: ${userLogin}</span>
      <button onclick="logout()">Wyloguj się</button>
    `;
    document.getElementById('userInfo').style.display = 'flex';
    loadTiles(); // Load the user's configurations
  } else {
    // If no user is logged in, display login modal
    document.getElementById('userInfo').innerText = 'Nie zalogowano';
  }
};



async function loadTiles() {
  const userId = localStorage.getItem('userId');
  const container = document.getElementById('tilesContainer');
  container.querySelectorAll('.tile').forEach(tile => tile.remove());

  if (userId) {
    const res = await fetch(`${API_URL}/Users/Configurations/${userId}`);
    if (!res.ok) {
      console.error('Błąd podczas pobierania konfiguracji');
      return;
    }

    const configurations = await res.json();
    configurations.forEach(config => addTile(config.name, config.id));
  } else {
    const guestConfigs = JSON.parse(localStorage.getItem('guestConfigs') || '[]');
    guestConfigs.forEach(config => addTile(config.name, config.id));
  }

  container.appendChild(createAddTileButton());
}









function toggleModal() {
  const modal = document.getElementById('loginModal');
  modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

async function addTile(name = 'Nowa konfiguracja', configId = null) {
  const userId = localStorage.getItem('userId');
  
  if (!configId) {
    if (userId) {
      const response = await fetch(`${API_URL}/Configurations/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(name)
      });
    
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Błąd walidacji:', errorData);
        return;
      }
    
      const data = await response.json(); // ← тут может быть просто true, если API не возвращает ID
      configId = data.id || Date.now();
    } else {
      // Незарегистрированный пользователь — генерируем временный ID
      configId = 'guest-' + Date.now();
      const guestConfigs = JSON.parse(localStorage.getItem('guestConfigs') || '[]');
      guestConfigs.push({ id: configId, name });
      localStorage.setItem('guestConfigs', JSON.stringify(guestConfigs));
    }
  }

  

  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.style.backgroundColor = '#8faff2'; // Цвет можно оставить случайным
  tile.setAttribute('data-id', configId);

  tile.innerHTML = `
    <div class="tile-icon"><img src="img/gpu-icon.svg" alt="icon"></div>
    <div class="tile-label" contenteditable="true">${name}</div>
  `;

  // Добавляем кнопку удаления
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-btn';
  deleteButton.innerHTML = '✖';
  deleteButton.addEventListener('click', async (e) => { 
    e.stopPropagation();
    const userId = localStorage.getItem('userId');
  
    if (userId) {
      await fetch(`${API_URL}/Configurations/${configId}`, { method: 'DELETE' });
    } else {
      const guestConfigs = JSON.parse(localStorage.getItem('guestConfigs') || '[]');
      const updated = guestConfigs.filter(cfg => cfg.id !== configId);
      localStorage.setItem('guestConfigs', JSON.stringify(updated));
    }
  
    tile.remove();
  });
  
  tile.appendChild(deleteButton);

  tile.addEventListener('click', (e) => {
    if (e.target.classList.contains('tile-label')) return;
    const name = tile.querySelector('.tile-label').innerText.trim();
    localStorage.setItem('currentConfigName', name);
    localStorage.setItem('currentUserId', localStorage.getItem('userId') || '');
    window.location.href = `konf.html?configId=${configId}`;
  });
  

  document.getElementById('tilesContainer').insertBefore(tile, document.querySelector('.add-tile'));

  const label = tile.querySelector('.tile-label');


  label.addEventListener('blur', async () => {
  const newName = label.innerText.trim();
  const userId = localStorage.getItem('userId');

  if (userId) {
    // Удаляем старую конфигурацию с сервера
    const configIdNumber  = parseInt(configId, 10);
    await fetch(`${API_URL}/Configurations/${configId}`, { method: 'DELETE' });

    // Теперь создаем новую конфигурацию с новым именем
    const response = await fetch(`${API_URL}/Configurations/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newName)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Ошибка при создании новой конфигурации:', errorData);
      return;
    }

    // Получаем новый ID конфигурации (если нужно)
    const data = await response.json();
    configId = data.id; // Обновляем ID конфигурации
    tile.setAttribute('data-id', configId); // Обновляем ID в атрибуте плитки

  } else {
    // Обновление локальной конфигурации (для незарегистрированного пользователя)
    const guestConfigs = JSON.parse(localStorage.getItem('guestConfigs') || '[]');
    const updated = guestConfigs.map(cfg =>
      cfg.id === configId ? { ...cfg, name: newName } : cfg
    );
    localStorage.setItem('guestConfigs', JSON.stringify(updated));
  }

  // Обновляем название плитки, чтобы отобразить новое имя
  tile.querySelector('.tile-label').innerText = newName;
});

  

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
    localStorage.setItem('userLogin', user.login);

    document.getElementById('userInfo').style.display = 'flex';

    alert(`Zalogowano jako ${user.login}`);
    toggleModal();
    document.getElementById('userInfo').innerText = `Zalogowano jako: ${user.login}`;
    document.getElementById('userInfo').innerHTML = `
      <span>Zalogowano jako: ${user.login}</span>
      <button onclick="logout()">Wyloguj się</button>
    `;
    
    loadTiles(); // <--- ТУТ вызывается после логина

  } catch (err) {
    alert('Błąd podczas logowania.');
  }
}



function logout() {
  localStorage.removeItem('userId');
  localStorage.removeItem('userLogin');
  document.getElementById('userInfo').innerText = 'Nie zalogowano';
  // Очистить все плитки
  document.querySelectorAll('.tile').forEach(tile => tile.remove());
}



window.login = login;
window.logout = logout;
window.register = register;
window.toggleModal = toggleModal;
window.toggleRegisterModal = toggleRegisterModal;
