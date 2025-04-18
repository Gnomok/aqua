
  // Создание сцены
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / 500, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, 500);
document.getElementById('scene-container').appendChild(renderer.domElement);

// Позиционирование камеры
camera.position.set(0, 5, 15);
camera.lookAt(0, 0, 0);

// Освещение
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10).normalize();
scene.add(light);
// Загрузка модели
const loader = new THREE.OBJLoader();
loader.load('gk/model.obj', function (object) {
    console.log("Загружено:", object);
    object.scale.set(1, 1, 1); // Измени при необходимости
    object.position.set(0, -2, 0);
    scene.add(object);

    // 🎯 Добавим точки (например, на процессор)
    const dotGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.set(0, 1, 0); // позиция на модели
    dot.name = "CPU";
    scene.add(dot);

    // Сохраним ссылку на точки, если нужно будет менять цвет и т.п.
    scene.userData.dots = { "Процессор": dot };
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
