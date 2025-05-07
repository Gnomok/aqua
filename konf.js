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

let currentComponentType = '';
let allComponents = [];
let currentConfigurationId = null;
const userId = "default-user";
const urlParams = new URLSearchParams(window.location.search);
const configurationName = urlParams.get('title');
console.log('Имя конфигурации:', configurationName);
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

    allComponents = data.filter(c => typeIdToName[c.typeId]?.toLowerCase() === type.toLowerCase());
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

  try {
    const response = await fetch(`${API_URL}/configurator/Configurations/${currentConfigurationId}/add-component/${component.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Ошибка добавления компонента:', text);
      throw new Error('Ошибка сервера: ' + response.status);
    }

    const data = await response.text();
    console.log('Компонент добавлен:', data);

    // Добавляем компонент в массив selectedComponents
    selectedComponents.push(component);

    const slot = document.getElementById(`slot-${currentComponentType}`);
    if (slot) {
      slot.innerHTML = `
        <div class="tile-icon">
          <img src="${component.imageUrl}" alt="${component.name}">
        </div>
        <div class="tile-label small-label">${component.name}</div>
      `;
    }

    toggleComponentModal();
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
  const configurationName = urlParams.get('title');
  console.log('Имя конфигурации:', configurationName);

  if (!configurationName) {
    alert('Имя конфигурации не указано!');
    return;
  }

  const payload = {
    name: configurationName,
    userId: userId,
    components: selectedComponents.map(component => component.id) // Отправляем только ID компонентов
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












// Инициализация страницы
document.addEventListener('DOMContentLoaded', async () => {
  await createConfiguration();
  setupComponentSlots();
});

function goToMain() {
  window.location.href = 'main.html';
}
