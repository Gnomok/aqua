const typeMapping = {
  motherboard: 1,
  cpu: 2,
  ram: 3,
  gpu: 4,
  storage: 5,
  psu: 6,
  case: 7
};

let selectedComponents = [];


const typeIdToName = Object.fromEntries(
  Object.entries(typeMapping).map(([key, value]) => [value, key])
);


// Теперь локальный API
const API_URL = 'https://localhost:7140';


// Инициализация страницы
document.addEventListener('DOMContentLoaded', async () => {

  setupComponentSlots();

  const configIdFromUrl = new URLSearchParams(window.location.search).get('configId');
  
  if (configIdFromUrl && configIdFromUrl !== 'undefined') {
    await loadConfiguration(); // Загружает существующую конфигурацию
  } else {
    await createConfiguration(); // Создаёт новую
  }


});

let currentComponentType = '';
let allComponents = [];
let currentConfigurationId = null;
const urlParams = new URLSearchParams(window.location.search);
const configId = new URLSearchParams(window.location.search).get('configId');
const configName = localStorage.getItem('currentConfigName') || 'Konfiguracja komputera';
const userId = localStorage.getItem('userId') || null;
document.getElementById('configTitle').innerText = `Konfiguracja: ${configName}`;

//const configurationName = urlParams.get('title');
//console.log('Имя конфигурации:', configurationName);
// Создание новой конфигурации
// Создание конфигурации
async function createConfiguration() {
  const configIdFromUrl = new URLSearchParams(window.location.search).get('configId');
  if (configIdFromUrl && configIdFromUrl !== 'undefined') {
    currentConfigurationId = configIdFromUrl;
    return;
  }

  const payload = userId
    ? { configurationName: configName, userId: userId }
    : configName;

  try {
    const response = await fetch(`${API_URL}/configurator/Configurations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Błąd tworzenia konfiguracji::', response.status, text);
      throw new Error('Błąd serwera: ' + response.status + ' ' + text);
    }

    const data = await response.json();
    console.log('Załadowane komponenty:', data);
    currentConfigurationId = data.id;

    // Сохраняем конфигурацию для неавторизованных пользователей в localStorage
    if (!userId) {
      const guestConfigs = JSON.parse(localStorage.getItem('guestConfigs') || '[]');
      guestConfigs.push({ id: currentConfigurationId, name: configName });
      localStorage.setItem('guestConfigs', JSON.stringify(guestConfigs));
    }
  } catch (error) {
    console.error('Błąd ładowania komponentów konfiguracji: ', error);
  }
  await loadConfigurationComponents();

}

// Функция загрузки компонентов конфигурации
async function loadConfigurationComponents() {
  if (!currentConfigurationId) return;

  try {
    const response = await fetch(`${API_URL}/configurator/Configurations/Components/${currentConfigurationId}`);
    const components = await response.json();
    console.log('Konfiguracja załadowana z serwera:', components);

    // Обновляем каждый слот с компонентами
    selectedComponents = components;
    components.forEach(component => {
      const slot = document.getElementById(`slot-${typeIdToName[component.typeId]}`);
      if (slot) {
        slot.innerHTML = `
          <div class="tile-icon">
            <img src="${component.imageUrl}" alt="${component.name}">
          </div>
          <div class="tile-label small-label">${component.name}</div>
          <button class="remove-btn" onclick="removeComponent('${component.typeId}', '${typeIdToName[component.typeId]}')">🗑</button>
        `;
      }
    });
  } catch (error) {
    console.error('Nie udało się załadować konfiguracji z serwera', error);
  }
}


async function loadConfiguration() {
  const userId = localStorage.getItem('userId');
  const configIdFromUrl = new URLSearchParams(window.location.search).get('configId');

  if (!configIdFromUrl) return;

  let config;
  
  // Для авторизованных пользователей загружаем с сервера
  if (userId) {
    const response = await fetch(`${API_URL}/configurator/Configurations/${configIdFromUrl}`);
    if (response.ok) {
      config = await response.json();
      console.log('Konfiguracja załadowana z serwera:', config);
    } else {
      console.error('Nie udało się załadować konfiguracji z serwera');
    }
  } else {
    // Для неавторизованных пользователей загружаем из localStorage
    const guestConfigs = JSON.parse(localStorage.getItem('guestConfigs') || '[]');
    config = guestConfigs.find(cfg => cfg.id === configIdFromUrl);
    if (config) {
      console.log('Konfiguracja załadowana z localStorage:', config);
    } else {
      console.error('Konfiguracja nie została znaleziona w localStorage');
    }
  }

  if (config) {
    // Обновите интерфейс страницы в зависимости от загруженной конфигурации
    document.getElementById('configTitle').innerText = `Konfiguracja: ${config.name}`;
    currentConfigurationId = config.id;
    await loadConfigurationComponents();  // Загружаем компоненты для этой конфигурации
  }
}


// Открытие/закрытие модального окна
async function toggleComponentModal(componentType = '') {
  const modal = document.getElementById('componentModal');
  modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';

  if (componentType && currentConfigurationId) {
    currentComponentType = componentType;
    await loadComponentsForType(componentType);
  }
}

// Загрузка компонентов
async function loadComponentsForType(type) {
  if (!currentConfigurationId) {
    console.error('Не задан ID конфигурации!');
    return;
  }  
  try {
    const typeId = typeMapping[type];

    if (!typeId) {
      console.error("Неизвестный тип компонента:", type);
      return;
    }

    let url = `${API_URL}/configurator/Components`; // по умолчанию все

    if (currentConfigurationId) {
      url = `${API_URL}/configurator/Configurations/${currentConfigurationId}/SuitableComponentsByType/${typeId}`;
    }

    console.log(`Запрашиваю компоненты с URL: ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    console.log('Получены компоненты:', data);

    allComponents = data;
    displayComponents(allComponents);
  } catch (error) {
    console.error('Ошибка загрузки компонентов:', error);
  }
}


// Отображение компонентов в модалке
function displayComponents(components) {
  const grid = document.getElementById('modalComponentGrid');
  grid.innerHTML = '';

  components.forEach(component => {
    const card = document.createElement('div');
    card.className = 'component-card';
    card.onclick = () => selectComponent(component);

    card.innerHTML = `
      <img src="${component.imageUrl}" alt="${component.name}">
      <strong>${component.name}</strong>
      <p>${component.price} $</p>
    `;

    grid.appendChild(card);
  });
}

// Фильтрация компонентов
function filterComponents() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const min = parseFloat(document.getElementById('minPrice').value) || 0;
  const max = parseFloat(document.getElementById('maxPrice').value) || Infinity;

  const filtered = allComponents.filter(c =>
    c.name.toLowerCase().includes(search) &&
    c.price >= min &&
    c.price <= max
  );

  displayComponents(filtered);
}

// Выбор компонента
async function selectComponent(component) {
  if (!currentConfigurationId) {
    console.error('Конфигурация не создана!');
    return;
  }

  const typeId = component.typeId;

  try {
    // 1. Удаляем старый компонент этого типа, если он уже выбран
    const existing = selectedComponents.find(c => c.typeId === typeId);
    if (existing) {
      console.log(`Удаляю старый компонент типа ${typeId}...`);
      const deleteResp = await fetch(`${API_URL}/configurator/Configurations/${currentConfigurationId}/Component/${typeId}`, {
        method: 'DELETE'
      });

      if (!deleteResp.ok) {
        const delText = await deleteResp.text();
        console.warn('Не удалось удалить старый компонент:', delText);
      } else {
        console.log('Старый компонент удалён');
      }

      // Удаляем из локального массива
      selectedComponents = selectedComponents.filter(c => c.typeId !== typeId);
    }

    // 2. Добавляем новый компонент
    const response = await fetch(`${API_URL}/configurator/Configurations/${currentConfigurationId}/add-component/${component.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Ошибка добавления компонента:', text);
      throw new Error('Ошибка сервера: ' + response.status);
    }

    const data = await response.text();
    console.log('Компонент добавлен:', data);

    selectedComponents.push(component); // Обновляем локальный список

    // Обновляем UI плитки
    const slot = document.getElementById(`slot-${currentComponentType}`);
    if (slot) {
      slot.innerHTML = `
        <div class="tile-icon">
          <img src="${component.imageUrl}" alt="${component.name}">
        </div>
        <div class="tile-label small-label">${component.name}</div>
        <button class="remove-btn" onclick="removeComponent('${component.typeId}', '${currentComponentType}')">🗑</button>
      `;
    }
    

    toggleComponentModal(); // Закрываем модалку
  } catch (error) {
    console.error('Ошибка при добавлении компонента:', error);
  }
}


// Настройка списка слотов для компонентов
function setupComponentSlots() {
  const components = [
    { type: 'motherboard', label: 'Płyta główna' },
    { type: 'cpu', label: 'Procesor' },
    { type: 'ram', label: 'Pamięć RAM' },
    { type: 'gpu', label: 'Karta graficzna' },
    { type: 'storage', label: 'Dysk' },
    { type: 'psu', label: 'Zasilacz' },
    { type: 'case', label: 'Obudowa' }
  ];

  const list = document.getElementById('componentList');
  list.innerHTML = '';
  components.forEach(comp => {
    const tile = document.createElement('div');
    tile.className = 'tile config-tile';
    tile.id = `slot-${comp.type}`;
    tile.onclick = () => toggleComponentModal(comp.type);

    tile.innerHTML = `
      <div class="tile-icon">
        <img src="icons/${comp.type}.png" alt="${comp.label}">
      </div>
      <div class="tile-label"> ${comp.label}</div>
    `;

    list.appendChild(tile);
  });
}

// Сохранение всей сборки
async function saveFullBuild() {
  const urlParams = new URLSearchParams(window.location.search);
  const configurationName = sessionStorage.getItem('currentConfigName') || 'Konfiguracja komputera';
  console.log('Имя конфигурации:', configurationName);

  if (!configurationName) {
    alert('Имя конфигурации не указано!');
    return;
  }

  const payload = {
    configurationName: configurationName,
    userId: userId,
    components: selectedComponents.map(component => component.id)
  };
  

  try {
    const response = await fetch("https://localhost:7140/configurator/Configurations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Ошибка сохранения сборки:', text);
      throw new Error('Ошибка сервера: ' + response.status);
    }

    alert('Сборка успешно сохранена!');
  } catch (error) {
    console.error('Ошибка при сохранении сборки:', error);
  }
}

async function removeComponent(typeId, typeName) {
  if (!currentConfigurationId) return;

  try {
    const response = await fetch(`${API_URL}/configurator/Configurations/${currentConfigurationId}/Component/${typeId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Ошибка удаления компонента:', text);
      return;
    }

    // Удаляем из массива
    selectedComponents = selectedComponents.filter(c => c.typeId != typeId);

    // Очищаем слот
    const slot = document.getElementById(`slot-${typeName}`);
    if (slot) {
      slot.innerHTML = `
        <div class="tile-icon">
          <img src="icons/${typeName}.png" alt="${typeName}">
        </div>
        <div class="tile-label"> ${typeName}</div>
      `;
    }

    console.log(`Компонент типа ${typeName} удалён.`);
  } catch (err) {
    console.error('Ошибка при удалении компонента:', err);
  }
}
















function goToMain() {
  window.location.href = 'main.html';
}
