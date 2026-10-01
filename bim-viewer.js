import * as THREE from 'https://unpkg.com/three@0.169.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.169.0/examples/jsm/controls/OrbitControls.js';

function mountBIMViewer(host, { onSelect = () => {}, resetButtonId = 'bimResetView', preview = false } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(preview ? 0xdce9df : 0xeaf1ec);
  scene.fog = new THREE.Fog(preview ? 0xdce9df : 0xeaf1ec, 18, 34);

  const camera = new THREE.OrthographicCamera(-7, 7, 7, -7, 0.1, 80);
  camera.position.set(8, 8, 9);
  camera.lookAt(0, 2.1, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.domElement.className = 'bim-renderer';
  renderer.domElement.setAttribute('aria-label', preview ? 'Digital Twin 3D building preview' : 'BIM building 3D model');
  host.insertBefore(renderer.domElement, host.firstChild);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2.1, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.minZoom = 0.65;
  controls.maxZoom = 2.2;
  controls.minPolarAngle = 0.22;
  controls.maxPolarAngle = Math.PI / 2.02;
  controls.update();

  scene.add(new THREE.HemisphereLight(0xf4fff7, 0x64776c, 2.15));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
  keyLight.position.set(7, 12, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -9;
  keyLight.shadow.camera.right = 9;
  keyLight.shadow.camera.top = 10;
  keyLight.shadow.camera.bottom = -8;
  scene.add(keyLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 13),
    new THREE.MeshStandardMaterial({ color: 0xdce8dd, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.12;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(14, 28, 0xa9bcae, 0xcbd8cd);
  grid.position.y = -0.105;
  scene.add(grid);

  const selectableGroups = new Map();
  const selectableMeshes = [];
  const materials = {
    structure: new THREE.MeshStandardMaterial({ color: 0xe6e9e3, roughness: 0.82 }),
    slab: new THREE.MeshStandardMaterial({ color: 0xbcc9bf, roughness: 0.9 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xbad0c5, roughness: 0.84, transparent: true, opacity: 0.52, depthWrite: false }),
    column: new THREE.MeshStandardMaterial({ color: 0x8b9a91, roughness: 0.72 }),
    beam: new THREE.MeshStandardMaterial({ color: 0x477161, roughness: 0.58, metalness: 0.12 }),
    door: new THREE.MeshStandardMaterial({ color: 0xe9ad56, roughness: 0.62 }),
    window: new THREE.MeshStandardMaterial({ color: 0x4aaac0, roughness: 0.24, metalness: 0.28, transparent: true, opacity: 0.88 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9ad7e8, roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.9 }),
    stair: new THREE.MeshStandardMaterial({ color: 0xf4d9b1, roughness: 0.76 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x9aa8a0, roughness: 0.84 }),
    pipe: new THREE.MeshStandardMaterial({ color: 0xe35f54, roughness: 0.34, metalness: 0.36 }),
    duct: new THREE.MeshStandardMaterial({ color: 0x57a5c8, roughness: 0.42, metalness: 0.22 }),
    cable: new THREE.MeshStandardMaterial({ color: 0xe3b844, roughness: 0.35, metalness: 0.15 }),
    equipment: new THREE.MeshStandardMaterial({ color: 0x358b79, roughness: 0.48, metalness: 0.18 }),
    elevator: new THREE.MeshStandardMaterial({ color: 0x5b718d, roughness: 0.6, metalness: 0.38 })
  };

  function getGroup(name) {
    if (!selectableGroups.has(name)) {
      const group = new THREE.Group();
      group.name = name;
      scene.add(group);
      selectableGroups.set(name, group);
    }
    return selectableGroups.get(name);
  }

  function addBox(group, size, position, material, elementName) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material.clone());
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.elementName = elementName || '';
    group.add(mesh);
    if (elementName) selectableMeshes.push(mesh);
    return mesh;
  }

  function addPipeCylinder(group, radius, length, position, elementName) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 18), materials.pipe.clone());
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.userData.elementName = elementName;
    group.add(mesh);
    selectableMeshes.push(mesh);
    return mesh;
  }

  const structure = new THREE.Group();
  scene.add(structure);
  addBox(structure, [5.2, 0.24, 4.2], [0, 0.12, 0], materials.slab);
  addBox(structure, [5, 0.15, 4], [0, 2.35, 0], materials.slab);
  addBox(structure, [5, 0.15, 4], [0, 4.55, 0], materials.slab);
  addBox(structure, [5.4, 0.22, 4.5], [0, 5.05, 0], materials.roof, 'Roof');

  const columns = getGroup('Column');
  [-2.12, 2.12].forEach((x) => [-1.62, 1.62].forEach((z) => {
    addBox(columns, [0.24, 4.25, 0.24], [x, 2.45, z], materials.column, 'Column');
  }));

  const beams = getGroup('Beam');
  [2.35, 4.55].forEach((y) => {
    [-1.62, 1.62].forEach((z) => addBox(beams, [4.35, 0.2, 0.2], [0, y, z], materials.beam, 'Beam'));
    [-2.12, 2.12].forEach((x) => addBox(beams, [0.2, 0.2, 3.25], [x, y, 0], materials.beam, 'Beam'));
  });
  addBox(beams, [0.2, 0.2, 3.2], [0, 3.25, 0], materials.beam, 'Beam');

  const walls = getGroup('Wall');
  addBox(walls, [4, 3.95, 0.12], [0, 2.45, -1.8], materials.wall, 'Wall');
  addBox(walls, [0.12, 2, 3.1], [-2.15, 3.45, 0], materials.wall, 'Wall');
  addBox(walls, [0.12, 1.3, 3.1], [2.15, 3.8, 0], materials.wall, 'Wall');
  addBox(walls, [1.9, 3.1, 0.1], [0.6, 2.6, 1.82], materials.wall, 'Wall');

  const doors = getGroup('Door');
  addBox(doors, [0.8, 1.8, 0.1], [0, 1.13, 1.86], materials.door, 'Door');

  const windows = getGroup('Window');
  [-1.25, 1.25].forEach((x) => addBox(windows, [0.86, 0.74, 0.08], [x, 3.65, 1.84], materials.window, 'Window'));
  [-1.1, 1.1].forEach((x) => addBox(windows, [0.78, 0.65, 0.08], [x, 3.45, -1.86], materials.window, 'Window'));
  [-1.7, 1.7].forEach((x) => addBox(windows, [0.8, 0.7, 0.08], [x, 2.75, -1.84], materials.glass, 'Window'));

  const stairs = getGroup('Stair');
  for (let i = 0; i < 7; i += 1) {
    addBox(stairs, [0.46, 0.18, 0.7], [-1.55 + i * 0.16, 0.22 + i * 0.24, 1.35], materials.stair, 'Stair');
  }

  const elevatorGroup = getGroup('Elevator');
  addBox(elevatorGroup, [0.9, 3.8, 0.9], [1.7, 2.3, -1.2], materials.elevator, 'Elevator');

  const pipes = getGroup('Pipe');
  addPipeCylinder(pipes, 0.09, 4.2, [0, 3.25, 0], 'Pipe');
  const verticalPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.3, 16), materials.pipe.clone());
  verticalPipe.position.set(-1.55, 3.9, 0);
  verticalPipe.castShadow = true;
  verticalPipe.userData.elementName = 'Pipe';
  pipes.add(verticalPipe);
  selectableMeshes.push(verticalPipe);
  const branchPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 1.8, 14), materials.pipe.clone());
  branchPipe.rotation.z = Math.PI / 2;
  branchPipe.position.set(-0.2, 3.25, 0.5);
  branchPipe.castShadow = true;
  branchPipe.userData.elementName = 'Pipe';
  pipes.add(branchPipe);
  selectableMeshes.push(branchPipe);

  const ducts = getGroup('Duct');
  addBox(ducts, [3.5, 0.22, 0.32], [0.25, 4.08, -0.55], materials.duct, 'Duct');
  addBox(ducts, [1.2, 0.26, 0.42], [1.75, 3.82, 1.2], materials.duct, 'Duct');

  const cables = getGroup('Cable');
  addBox(cables, [3.1, 0.055, 0.055], [0, 2.8, 1.25], materials.cable, 'Cable');
  addBox(cables, [2.5, 0.055, 0.055], [0.4, 3.5, -0.9], materials.cable, 'Cable');

  const equipment = getGroup('Equipment');
  addBox(equipment, [0.8, 0.72, 0.72], [1.35, 0.7, 0.7], materials.equipment, 'Equipment');
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.68, 20), materials.equipment.clone());
  pump.rotation.z = Math.PI / 2;
  pump.position.set(1.35, 1.16, 0.7);
  pump.castShadow = true;
  pump.userData.elementName = 'Equipment';
  equipment.add(pump);
  selectableMeshes.push(pump);
  const ahu = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), materials.equipment.clone());
  ahu.position.set(-1.6, 1.05, 0.8);
  ahu.castShadow = true;
  ahu.userData.elementName = 'Equipment';
  equipment.add(ahu);
  selectableMeshes.push(ahu);

  let selectedElement = 'Pipe';
  function selectElement(name) {
    selectedElement = name;
    selectableGroups.forEach((group, elementName) => {
      group.traverse((object) => {
        if (!object.isMesh || !object.material.emissive) return;
        const selected = elementName === selectedElement;
        object.material.emissive.setHex(selected ? 0x27644e : 0x000000);
        object.material.emissiveIntensity = selected ? 0.22 : 0;
      });
    });
  }
  selectElement(selectedElement);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerStart;
  renderer.domElement.addEventListener('pointerdown', (event) => {
    pointerStart = [event.clientX, event.clientY];
  });
  renderer.domElement.addEventListener('pointerup', (event) => {
    if (!pointerStart || Math.hypot(event.clientX - pointerStart[0], event.clientY - pointerStart[1]) > 5) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(selectableMeshes, false).find((item) => item.object.userData.elementName);
    if (!hit) return;
    selectElement(hit.object.userData.elementName);
    onSelect(hit.object.userData.elementName);
  });

  const resize = () => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    const frustum = 7.2;
    const aspect = width / height;
    camera.left = -frustum * aspect;
    camera.right = frustum * aspect;
    camera.top = frustum;
    camera.bottom = -frustum;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  let disposed = false;

  const resetButton = document.getElementById(resetButtonId);
  resetButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    camera.position.set(8, 8, 9);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    controls.target.set(0, 2.1, 0);
    controls.update();
  });

  function hasClash() {
    scene.updateMatrixWorld(true);
    const pipeGroup = selectableGroups.get('Pipe');
    const beamGroup = selectableGroups.get('Beam');
    const pipeBoxes = [];
    const beamBoxes = [];
    pipeGroup.traverse((object) => {
      if (object.isMesh) pipeBoxes.push(new THREE.Box3().setFromObject(object));
    });
    beamGroup.traverse((object) => {
      if (object.isMesh) beamBoxes.push(new THREE.Box3().setFromObject(object));
    });
    return pipeBoxes.some((pipeBox) => beamBoxes.some((beamBox) => pipeBox.intersectsBox(beamBox)));
  }

  function animate() {
    if (disposed) return;
    if (host.closest('.screen')?.classList.contains('active')) {
      controls.update();
      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
  }
  animate();

  return {
    selectElement,
    hasClash,
    resize,
    setActive(active) {
      if (active) resize();
    },
    dispose() {
      disposed = true;
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}

window.BIMViewerFactory = { mount: mountBIMViewer };
window.dispatchEvent(new Event('bim-viewer-ready'));