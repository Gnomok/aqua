function toggleModal() {
  const modal = document.getElementById('loginModal');
  modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function addTile() {
  const colors = ['#6feeb7', '#7fccb6', '#74a7b2', '#8faff2', '#e4b7ff'];
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
  tile.setAttribute('data-tooltip', 'Конфигурация компонента');
  tile.innerHTML = `
    <div class="tile-icon"><img src="img/gpu-icon.svg" alt="icon"></div>
    <div class="tile-label" contenteditable="true">Название</div>
  `;

  // Добавляем переход при клике, только если не редактируем название
  tile.addEventListener('click', (e) => {
    // Если клик был внутри редактируемого поля, не переходить
    if (e.target.classList.contains('tile-label')) return;

    const title = tile.querySelector('.tile-label').innerText.trim();
    window.location.href = `konf.html?title=${encodeURIComponent(title)}`;
  });

  const container = document.getElementById('tilesContainer');
  container.insertBefore(tile, container.querySelector('.add-tile'));
}

function toggleTheme() {
  document.body.classList.toggle('dark');
}

new Sortable(document.getElementById('tilesContainer'), {
  animation: 150,
  handle: '.tile-icon'
});