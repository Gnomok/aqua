const typeMapping = {
  motherboard: 1,
  cpu: 2,
  ram: 3,
  gpu: 4,
  storage: 5,
  psu: 6,
  case: 7
};

// Теперь локальный API
const API_URL = 'http://157.158.136.173:5001';

let currentComponentType = '';
let allComponents = [];
let currentConfigurationId = null;

// Создание новой конфигурации
async function createConfiguration() {
  try {
    const response = await fetch(`${API_URL}/configurator/Configurations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify("My Configuration") // Просто строка
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Ошибка создания конфигурации:', response.status, text);
      throw new Error('Ошибка сервера: ' + response.status + ' ' + text);
    }

    const data = await response.json();
    console.log('Ответ сервера (JSON):', data);
    currentConfigurationId = data.id;
  } catch (error) {
    console.error('Ошибка создания конфигурации (catch):', error);
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
  try {
    console.log(`Запрашиваю список всех компонентов...`);
    const response = await fetch(`${API_URL}/configurator/Components`);
    const data = await response.json();
    console.log('Получены компоненты:', data);

    allComponents = data.filter(c => c.type?.toLowerCase() === type.toLowerCase());
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
      <img src="${component.image}" alt="${component.name}">
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

  try {
    const response = await fetch(`${API_URL}/configurator/Configurations/${currentConfigurationId}/components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ componentId: component.id })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Ошибка добавления компонента:', text);
      throw new Error('Ошибка сервера: ' + response.status);
    }

    const data = await response.json();
    console.log('Компонент добавлен:', data);

    const slot = document.getElementById(`slot-${currentComponentType}`);
    if (slot) {
      slot.innerText = component.name;
    }

    toggleComponentModal();
  } catch (error) {
    console.error('Ошибка при добавлении компонента:', error);
  }
}

// Настройка списка слотов для компонентов
function setupComponentSlots() {
  const components = [
    { type: 'motherboard', label: 'Материнская плата' },
    { type: 'cpu', label: 'Процессор' },
    { type: 'ram', label: 'Оперативная память' },
    { type: 'gpu', label: 'Видеокарта' },
    { type: 'storage', label: 'Накопитель' },
    { type: 'psu', label: 'Блок питания' },
    { type: 'case', label: 'Корпус' }
  ];

  const list = document.getElementById('componentList');
  list.innerHTML = '';
  components.forEach(comp => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.id = `slot-${comp.type}`;
    tile.onclick = () => toggleComponentModal(comp.type);

    tile.innerHTML = `
      <div class="tile-icon">
        <img src="icons/${comp.type}.png" alt="${comp.label}">
      </div>
      <div class="tile-label">Выбрать ${comp.label}</div>
    `;

    list.appendChild(tile);
  });
}

// Сохранение всей сборки
async function saveFullBuild() {
  if (!currentConfigurationId) {
    alert('Конфигурация ещё не создана!');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/configurator/Configurations/${currentConfigurationId}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
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

// Инициализация страницы
document.addEventListener('DOMContentLoaded', async () => {
  await createConfiguration();
  setupComponentSlots();
});
