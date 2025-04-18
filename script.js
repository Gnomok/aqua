function toggleModal() {
    const modal = document.getElementById('loginModal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
  }

  function handleInput(el) {
    const parent = el.closest('.tile');
    const tilesContainer = document.getElementById('tilesContainer');
  
    // Если это последняя ячейка и текст не пустой — добавим новую
    const tiles = tilesContainer.querySelectorAll('.tile');
    const isLastTile = tiles[tiles.length - 1] === parent;
  
    if (isLastTile && el.innerText.trim() !== '') {
      const colors = ['#6feeb7', '#7fccb6', '#74a7b2', '#8faff2', '#e4b7ff'];
      const newTile = document.createElement('div');
      newTile.className = 'tile';
      newTile.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      newTile.setAttribute('onclick', 'showQuestionPage()');
      newTile.innerHTML = `
        <div class="tile-icon">+</div>
        <div class="tile-label" contenteditable="true" oninput="handleInput(this)">Название</div>
      `;
      tilesContainer.appendChild(newTile);
    }
  }

  function goToConfigPage() {
    const title = document.querySelector('.tile-label').innerText.trim();
    window.location.href = `konf.html?title=${encodeURIComponent(title)}`;
  }