function openModal(componentName) {
  const modal = document.getElementById('componentModal');
  const title = document.getElementById('modalTitle');
  const select = document.getElementById('componentOptions');
  
  title.textContent = `Выберите вариант для: ${componentName}`;
  // Очистим прошлые варианты и добавим новые (можно по названию компонента)
  select.innerHTML = '';

  const options = getOptionsFor(componentName);
  for (let option of options) {
    const el = document.createElement('option');
    el.textContent = option;
    select.appendChild(el);
  }

  modal.style.display = 'block';
}

function getOptionsFor(component) {
  switch(component) {
    case 'Процессор': return ['Intel i5', 'AMD Ryzen 5'];
    case 'Видеокарта': return ['RTX 3060', 'RX 6700'];
    case 'Материнская плата': return ['ASUS B550', 'MSI Z690'];
    case 'Оперативная память': return ['16GB DDR4', '32GB DDR4'];
    case 'Жесткий диск': return ['1TB HDD', '512GB SSD'];
    case 'Блок питания': return ['500W', '650W'];
    default: return ['Пусто'];
  }
}

function toggleModal() {
  document.getElementById('componentModal').style.display = 'none';
}

function saveSelection() {
  toggleModal(); // можно доработать
}
