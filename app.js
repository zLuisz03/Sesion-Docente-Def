// --- APLICACIÓN GEOMÉTRICA 3D: LAGRANGE Y MORFOSIS (MULTIDIMENSIONAL) ---
let activeShape = 'sphere'; // sphere, cylinder, cone, prism

let isAutoRotating = true;
let isWireframeOnly = false;

// Estado dimensional actual e independiente de los recipientes
// Valores iniciales equilibrados (corresponden a S = 1500 cm² aprox.)
const state = {
    sphere: { r: 10.93 },
    cylinder: { r: 8.92, h: 17.84 },
    cone: { r: 10.93, h: 30.90 },
    prism: { x: 15.81, y: 15.81 }
};

// --- ELEMENTOS DEL DOM ---
const totalAreaBadge = document.getElementById('totalAreaBadge');
const shapeSelectorSection = document.getElementById('shapeSelectorSection');
const shapeCards = document.querySelectorAll('.shape-card');

// Sliders y Badges de Dimensiones
const sphereSlider = document.getElementById('sphereRadiusSlider');
const sphereValBadge = document.getElementById('sphereRadiusVal');

const cylinderRadiusSlider = document.getElementById('cylinderRadiusSlider');
const cylinderRadiusVal = document.getElementById('cylinderRadiusVal');
const cylinderHeightSlider = document.getElementById('cylinderHeightSlider');
const cylinderHeightVal = document.getElementById('cylinderHeightVal');

const coneRadiusSlider = document.getElementById('coneRadiusSlider');
const coneRadiusVal = document.getElementById('coneRadiusVal');
const coneHeightSlider = document.getElementById('coneHeightSlider');
const coneHeightVal = document.getElementById('coneHeightVal');

const prismWidthSlider = document.getElementById('prismWidthSlider');
const prismWidthVal = document.getElementById('prismWidthVal');
const prismHeightSlider = document.getElementById('prismHeightSlider');
const prismHeightVal = document.getElementById('prismHeightVal');


// Vista Alternada
const dimensionsSection = document.getElementById('dimensionsSection');
const resultLabel = document.getElementById('resultLabel');

// Paneles de Control y Teoría
const controlSphere = document.getElementById('control-sphere');
const controlCylinder = document.getElementById('control-cylinder');
const controlCone = document.getElementById('control-cone');
const controlPrism = document.getElementById('control-prism');


// Panel de Resultados (Métricas)
const volumeDisplay = document.getElementById('volumeDisplay');
const volumeLitersDisplay = document.getElementById('volumeLitersDisplay');
const metricsGrid = document.getElementById('metricsGrid');
const dim1Label = document.getElementById('dim1Label');
const dim1Val = document.getElementById('dim1Val');
const dim2Label = document.getElementById('dim2Label');
const dim2Val = document.getElementById('dim2Val');
const dim3Label = document.getElementById('dim3Label');
const dim3Val = document.getElementById('dim3Val');
const dim4Label = document.getElementById('dim4Label');
const dim4Val = document.getElementById('dim4Val');

// Panel de Optimización
const efficiencyPercent = document.getElementById('efficiencyPercent');
const progressBar = document.getElementById('progressBar');
const maxVolumeVal = document.getElementById('maxVolumeVal');
const btnOptimize = document.getElementById('btnOptimize');


// Overlays del Visor 3D
const activeShapeTag = document.getElementById('activeShapeTag');
const btnAutoRotate = document.getElementById('btnAutoRotate');
const btnResetCamera = document.getElementById('btnResetCamera');
const btnWireframe = document.getElementById('btnWireframe');
const threeLoading = document.getElementById('threeLoading');

// --- VARIABLES DE THREE.JS ---
let scene, camera, renderer, controls;
let individualGroup; // Contenedor para la vista individual
const visualScale = 0.25; // 1 cm = 0.25 unidades 3D

// Materiales de Three.js
let glassMaterial, glowWireframeMaterial;

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    initThree();
    setupEventListeners();
    recalculateLimits(); // No-op elegante para actualizar etiquetas iniciales
    updateApp();
    
    // Ocultar el loading indicator del 3D una vez inicializado
    if (threeLoading) {
        threeLoading.style.opacity = 0;
        setTimeout(() => threeLoading.style.display = 'none', 500);
    }
});

// --- ENTORNO 3D (THREE.JS) ---
function initThree() {
    const canvas = document.getElementById('canvas3d');
    const container = canvas.parentElement;
    
    // 1. Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.05);

    // 2. Cámara
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(10, 8, 12);

    // 3. Renderizador
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Controles orbitales
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Restringir vista subterránea
    controls.minDistance = 3;
    controls.maxDistance = 35;
    controls.target.set(0, 2, 0);

    // 5. Iluminación Premium
    const ambientLight = new THREE.AmbientLight(0x111625, 1.8);
    scene.add(ambientLight);

    // Luz clave principal
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.3);
    mainLight.position.set(12, 18, 8);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.0005;
    scene.add(mainLight);

    // Luz de relleno lateral (azul eléctrico)
    const fillLight = new THREE.DirectionalLight(0x00f0ff, 0.9);
    fillLight.position.set(-12, 8, -8);
    scene.add(fillLight);

    // Luz de realce (morada cyberpunk) desde abajo
    const rimLight = new THREE.PointLight(0xbd00ff, 3, 20);
    rimLight.position.set(0, -2, 0);
    scene.add(rimLight);

    // Luz de realce adicional para modo comparación
    const rimLight2 = new THREE.PointLight(0x00e676, 2, 20);
    rimLight2.position.set(4, -1, 4);
    scene.add(rimLight2);

    // 6. Grilla base de neon
    const gridHelper = new THREE.GridHelper(40, 40, 0x00f0ff, 0x141a29);
    gridHelper.position.y = 0;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.35;
    scene.add(gridHelper);

    // Suelo reflectante
    const floorGeo = new THREE.PlaneGeometry(45, 45);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x060913,
        roughness: 0.85,
        metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    // 7. Materiales del Cristal Translúcido (Color Vibrante)
    glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.65, // Color más sólido e intenso
        transmission: 0.40, // Menor transmisión para que el color sea rico y saturado
        roughness: 0.15,
        metalness: 0.25, // Brillo metálico para resaltar la forma
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false,
    });

    glowWireframeMaterial = new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.95, // Bordes neón muy brillantes
    });

    // 8. Crear contenedores vacíos para mallas
    individualGroup = new THREE.Group();
    scene.add(individualGroup);

    // 9. Loop de Animación
    animate();

    window.addEventListener('resize', onWindowResize);
}

function animate() {
    requestAnimationFrame(animate);

    // Rotación del modelo
    if (isAutoRotating) {
        individualGroup.rotation.y += 0.005;
    }

    controls.update();
    renderer.render(scene, camera);

}

function onWindowResize() {
    const canvas = document.getElementById('canvas3d');
    const container = canvas.parentElement;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// --- CONFIGURACIÓN DE EVENTOS ---
function setupEventListeners() {
    // Selección de figuras
    shapeCards.forEach(card => {
        card.addEventListener('click', () => {
            shapeCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            activeShape = card.dataset.shape;
            
            // Actualizar etiqueta del visor
            const namesMap = {
                sphere: 'Esfera',
                cylinder: 'Cilindro',
                cone: 'Cono',
                prism: 'Prisma Cuadrado'
            };
            activeShapeTag.textContent = namesMap[activeShape];

            // Paneles
            controlSphere.style.display = activeShape === 'sphere' ? 'block' : 'none';
            controlCylinder.style.display = activeShape === 'cylinder' ? 'block' : 'none';
            controlCone.style.display = activeShape === 'cone' ? 'block' : 'none';
            controlPrism.style.display = activeShape === 'prism' ? 'block' : 'none';

            if (activeShape === 'sphere') {
                btnOptimize.classList.add('disabled');
            } else {
                btnOptimize.classList.remove('disabled');
            }

            updateApp();
        });
    });

    // Sliders de Esfera
    sphereSlider.addEventListener('input', (e) => {
        state.sphere.r = parseFloat(e.target.value);
        updateApp();
    });

    // Sliders de Cilindro
    cylinderRadiusSlider.addEventListener('input', (e) => {
        state.cylinder.r = parseFloat(e.target.value);
        updateApp();
    });
    cylinderHeightSlider.addEventListener('input', (e) => {
        state.cylinder.h = parseFloat(e.target.value);
        updateApp();
    });

    // Sliders de Cono
    coneRadiusSlider.addEventListener('input', (e) => {
        state.cone.r = parseFloat(e.target.value);
        updateApp();
    });
    coneHeightSlider.addEventListener('input', (e) => {
        state.cone.h = parseFloat(e.target.value);
        updateApp();
    });

    // Sliders de Prisma
    prismWidthSlider.addEventListener('input', (e) => {
        state.prism.x = parseFloat(e.target.value);
        updateApp();
    });
    prismHeightSlider.addEventListener('input', (e) => {
        state.prism.y = parseFloat(e.target.value);
        updateApp();
    });




    // Botones Flotantes del Visor
    btnAutoRotate.addEventListener('click', () => {
        isAutoRotating = !isAutoRotating;
        btnAutoRotate.classList.toggle('active', isAutoRotating);
    });

    btnResetCamera.addEventListener('click', () => {
        controls.reset();
        camera.position.set(10, 8, 12);
        controls.target.set(0, 2, 0);
    });

    btnWireframe.addEventListener('click', () => {
        isWireframeOnly = !isWireframeOnly;
        btnWireframe.classList.toggle('active', isWireframeOnly);
        
        if (isWireframeOnly) {
            glassMaterial.opacity = 0.03;
            glassMaterial.transmission = 0;
            glassMaterial.depthWrite = true;
        } else {
            glassMaterial.opacity = 0.65;
            glassMaterial.transmission = 0.40;
            glassMaterial.depthWrite = false;
        }
        
        const icon = btnWireframe.querySelector('i');
        icon.className = isWireframeOnly ? 'fa-solid fa-border-none' : 'fa-solid fa-border-all';
    });

    // Botón de Auto-Optimización (Mantiene el área actual constante)
    btnOptimize.addEventListener('click', () => {
        if (activeShape === 'sphere') return;
        
        // Generar sólido con medidas que maximizan el volumen con un area superficial fija de 1500 cm^2
        const currentArea = 1500;
        
        let targets = [];

        if (activeShape === 'cylinder') {
            const rOpt = Math.sqrt(currentArea / (6 * Math.PI));
            const hOpt = 2 * rOpt;
            
            targets.push({ slider: cylinderRadiusSlider, stateKey: 'r', startVal: state.cylinder.r, targetVal: rOpt });
            targets.push({ slider: cylinderHeightSlider, stateKey: 'h', startVal: state.cylinder.h, targetVal: hOpt });
            
        } else if (activeShape === 'cone') {
            const rOpt = Math.sqrt(currentArea / (4 * Math.PI));
            const hOpt = rOpt * Math.sqrt(8);
            
            targets.push({ slider: coneRadiusSlider, stateKey: 'r', startVal: state.cone.r, targetVal: rOpt });
            targets.push({ slider: coneHeightSlider, stateKey: 'h', startVal: state.cone.h, targetVal: hOpt });
            
        } else if (activeShape === 'prism') {
            const xOpt = Math.sqrt(currentArea / 6);
            const yOpt = xOpt;
            
            targets.push({ slider: prismWidthSlider, stateKey: 'x', startVal: state.prism.x, targetVal: xOpt });
            targets.push({ slider: prismHeightSlider, stateKey: 'y', startVal: state.prism.y, targetVal: yOpt });
        }

        animateToOptimal(targets);
    });
}

// Actualizar los badges informativos iniciales de los sliders
function recalculateLimits() {
    sphereValBadge.textContent = state.sphere.r.toFixed(1) + ' cm';
    cylinderRadiusVal.textContent = state.cylinder.r.toFixed(1) + ' cm';
    cylinderHeightVal.textContent = state.cylinder.h.toFixed(1) + ' cm';
    coneRadiusVal.textContent = state.cone.r.toFixed(1) + ' cm';
    coneHeightVal.textContent = state.cone.h.toFixed(1) + ' cm';
    prismWidthVal.textContent = state.prism.x.toFixed(1) + ' cm';
    prismHeightVal.textContent = state.prism.y.toFixed(1) + ' cm';
}

// Animación concurrente de múltiples sliders hacia el óptimo (con área constante)
function animateToOptimal(targets) {
    const duration = 800; // ms
    const startTime = performance.now();

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing de desaceleración cubic-out
        const ease = 1 - Math.pow(1 - progress, 3);
        
        targets.forEach(t => {
            const currentVal = t.startVal + (t.targetVal - t.startVal) * ease;
            t.slider.value = currentVal.toFixed(2);
            state[activeShape][t.stateKey] = currentVal;
        });
        
        updateApp();

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }
    requestAnimationFrame(step);
}

// --- ACTUALIZACIÓN GLOBAL DE MÉTRICAS Y MALLAS ---
function updateApp() {
    // 1. Limpiar grupos 3D
    clearGroup(individualGroup);

    // Color del cristal reflectante según la figura activa
    const colorsMap = {
        sphere: 0x00f0ff,
        cylinder: 0x00e676,
        cone: 0xffb300,
        prism: 0xbd00ff
    };
    
glassMaterial.color.setHex(colorsMap[activeShape]);
        glowWireframeMaterial.color.setHex(colorsMap[activeShape]);
        
        // Calcular datos métricos de la forma activa
        const metrics = calculateMetrics(activeShape);
        
        // Actualizar UI lateral (badge superior de área e indicadores de volumen)
        totalAreaBadge.textContent = metrics.S_total.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        volumeDisplay.textContent = `${metrics.V.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} cm³`;
        volumeLitersDisplay.textContent = `${(metrics.V / 1000).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Litros`;

        // Sincronizar valorbadges deslizadores
        if (activeShape === 'sphere') {
            sphereValBadge.textContent = state.sphere.r.toFixed(1) + ' cm';
        } else if (activeShape === 'cylinder') {
            cylinderRadiusVal.textContent = state.cylinder.r.toFixed(1) + ' cm';
            cylinderHeightVal.textContent = state.cylinder.h.toFixed(1) + ' cm';
        } else if (activeShape === 'cone') {
            coneRadiusVal.textContent = state.cone.r.toFixed(1) + ' cm';
            coneHeightVal.textContent = state.cone.h.toFixed(1) + ' cm';
        } else if (activeShape === 'prism') {
            prismWidthVal.textContent = state.prism.x.toFixed(1) + ' cm';
            prismHeightVal.textContent = state.prism.y.toFixed(1) + ' cm';
        }

        dim1Val.innerHTML = `${metrics.dim1.toFixed(2)} <span class="unit">cm</span>`;
        dim2Val.innerHTML = `${metrics.dim2 !== null ? metrics.dim2.toFixed(2) : '--'} <span class="unit">cm</span>`;
        dim3Val.innerHTML = `${metrics.dim3 !== null ? metrics.dim3.toFixed(1) : 'N/A'} <span class="unit">cm²</span>`;
        dim4Val.innerHTML = `${metrics.dim4.toFixed(1)} <span class="unit">cm²</span>`;

        dim1Label.textContent = metrics.label1;
        dim2Label.textContent = metrics.label2;
        dim3Label.innerHTML = metrics.label3;
        dim4Label.innerHTML = metrics.label4;

        // Barra de eficiencia dinámica (para el área de superficie actual)
        const efficiency = Math.min(100, (metrics.V / metrics.V_opt) * 100);
        efficiencyPercent.textContent = `${efficiency.toFixed(0)}%`;
        progressBar.style.width = `${efficiency}%`;
        maxVolumeVal.textContent = `${metrics.V_opt.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} cm³`;
        updateProgressBarColor(efficiency);

        // Renderizar figura en la vista individual (centrada en 0,0,0)
        buildMorphMesh(individualGroup, activeShape, metrics.p1, metrics.p2, 1.0);
}

// Limpiar hijos de un grupo de Three.js y liberar memoria de geometrías
function clearGroup(group) {
    while (group.children.length > 0) {
        const obj = group.children[0];
        if (obj instanceof THREE.Group) {
            clearGroup(obj);
        } else {
            if (obj.geometry) obj.geometry.dispose();
            if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
            } else if (obj.material) {
                obj.material.dispose();
            }
        }
        group.remove(obj);
    }
}

// Colores de la barra de progreso
function updateProgressBarColor(efficiency) {
    if (efficiency >= 95) {
        progressBar.style.background = 'linear-gradient(to right, #00f0ff, #00e676)';
        progressBar.style.boxShadow = '0 0 10px rgba(0, 230, 118, 0.5)';
    } else if (efficiency >= 70) {
        progressBar.style.background = 'linear-gradient(to right, #00f0ff, #ffb300)';
        progressBar.style.boxShadow = '0 0 10px rgba(255, 179, 0, 0.3)';
    } else {
        progressBar.style.background = 'linear-gradient(to right, #ffb300, #ff3d00)';
        progressBar.style.boxShadow = '0 0 10px rgba(255, 61, 0, 0.4)';
    }
}

// --- CÁLCULO INDEPENDIENTE DE ÁREA Y VOLUMEN ---
function calculateMetrics(shape) {
    let V = 0, S_total = 0, V_opt = 0;
    let p1 = 0, p2 = 0;
    let dim1 = 0, dim2 = null, dim3 = null, dim4 = 0;
    let label1 = '', label2 = '', label3 = '', label4 = '';

    if (shape === 'sphere') {
        const r = state.sphere.r;
        S_total = 4 * Math.PI * r * r;
        V = (4 / 3) * Math.PI * Math.pow(r, 3);
        V_opt = V; // Esfera es óptimo por definición
        p1 = r;
        dim1 = r;
        dim2 = 2 * r;
        dim3 = 0;
        dim4 = S_total;

        label1 = 'Radio (R)';
        label2 = 'Diámetro (D)';
        label3 = 'Área Base';
        label4 = 'Área Superficial';

    } else if (shape === 'cylinder') {
        const r = state.cylinder.r;
        const h = state.cylinder.h;
        S_total = 2 * Math.PI * r * r + 2 * Math.PI * r * h;
        V = Math.PI * r * r * h;

        // Lagrange óptimo equivalente para este área S_total
        const rOpt = Math.sqrt(S_total / (6 * Math.PI));
        const hOpt = 2 * rOpt;
        V_opt = Math.PI * rOpt * rOpt * hOpt;

        p1 = r;
        p2 = h;
        dim1 = r;
        dim2 = h;
        dim3 = 2 * Math.PI * r * r; 
        dim4 = 2 * Math.PI * r * h; 

        label1 = 'Radio (R)';
        label2 = 'Altura (H)';
        label3 = 'Área Tapas (A<sub>b</sub>)';
        label4 = 'Área Lateral (A<sub>l</sub>)';

    } else if (shape === 'cone') {
        const r = state.cone.r;
        const h = state.cone.h;
        const L = Math.sqrt(r * r + h * h);
        S_total = Math.PI * r * r + Math.PI * r * L;
        V = (1 / 3) * Math.PI * r * r * h;

        // Lagrange óptimo equivalente para este área S_total
        const rOpt = Math.sqrt(S_total / (4 * Math.PI));
        const hOpt = rOpt * Math.sqrt(8);
        V_opt = (1 / 3) * Math.PI * rOpt * rOpt * hOpt;

        p1 = r;
        p2 = h;
        dim1 = r;
        dim2 = h;
        dim3 = Math.PI * r * r; 
        dim4 = Math.PI * r * L; 

        label1 = 'Radio (R)';
        label2 = 'Altura (H)';
        label3 = 'Área Base (A<sub>b</sub>)';
        label4 = 'Área Lateral (A<sub>l</sub>)';

    } else if (shape === 'prism') {
        const x = state.prism.x;
        const y = state.prism.y;
        S_total = 2 * x * x + 4 * x * y;
        V = x * x * y;

        // Lagrange óptimo equivalente para este área S_total
        const xOpt = Math.sqrt(S_total / 6);
        V_opt = Math.pow(xOpt, 3);

        p1 = x;
        p2 = y;
        dim1 = x;
        dim2 = y;
        dim3 = 2 * x * x; 
        dim4 = 4 * x * y; 

        label1 = 'Lado Base (x)';
        label2 = 'Altura (y)';
        label3 = 'Bases (2 × x²)';
        label4 = 'Paredes (4 × xy)';
    }

    return { V, S_total, V_opt, p1, p2, dim1, dim2, dim3, dim4, label1, label2, label3, label4 };
}

// --- CONSTRUCTOR 3D HOLOGRÁFICO CON MORFOSIS (PLEGADO) ---
function buildMorphMesh(group, shape, p1, p2, t, customGlassMat = null, customWireMat = null) {
    const glassMat = customGlassMat || glassMaterial;
    const wireMat = customWireMat || glowWireframeMaterial;

    const visualP1 = p1 * visualScale;
    const visualP2 = p2 * visualScale;

    if (shape === 'sphere') {
        // --- MORFOSIS: PLANO A ESFERA ---
        const segments = 32;
        const geo = new THREE.BufferGeometry();
        const positions = [];
        const indices = [];

        for (let i = 0; i <= segments; i++) {
            const v = (i / segments) * Math.PI - Math.PI / 2; // Latitud: -pi/2 a pi/2
            for (let j = 0; j <= segments; j++) {
                const u = (j / segments) * 2 * Math.PI - Math.PI; // Longitud: -pi a pi
                
                // 1. Estado Plano (Lámina plana 2D)
                const flatX = visualP1 * u;
                const flatZ = visualP1 * v;
                const flatY = 0;

                // 2. Estado Sólido (Esfera)
                const sphereX = visualP1 * Math.cos(v) * Math.cos(u);
                const sphereZ = visualP1 * Math.cos(v) * Math.sin(u);
                const sphereY = visualP1 * Math.sin(v) + visualP1;

                // Interpolación
                const x = (1 - t) * flatX + t * sphereX;
                const z = (1 - t) * flatZ + t * sphereZ;
                const y = (1 - t) * flatY + t * sphereY;

                positions.push(x, y, z);
            }
        }

        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const a = i * (segments + 1) + j;
                const b = i * (segments + 1) + j + 1;
                const c = (i + 1) * (segments + 1) + j;
                const d = (i + 1) * (segments + 1) + j + 1;

                indices.push(a, c, b);
                indices.push(b, c, d);
            }
        }

        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();

        const mesh = new THREE.Mesh(geo, glassMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);

        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, wireMat);
        group.add(line);

    } else if (shape === 'cylinder') {
        // --- MORFOSIS: PLANO A CILINDRO ---
        const segments = 32;
        
        // 1. Cuerpo Lateral Curvado
        const bodyGeo = new THREE.BufferGeometry();
        const positions = [];
        const indices = [];

        const halfH = visualP2 / 2;

        for (let i = 0; i <= segments; i++) {
            const u = (i / segments) * 2 * Math.PI - Math.PI; 
            for (let j = 0; j <= segments; j++) {
                const yVal = (j / segments) * visualP2 - halfH; 
                
                // Plano
                const flatX = visualP1 * u;
                const flatZ = yVal;
                const flatY = 0;

                // Cilindro
                const cylX = visualP1 * Math.sin(u);
                const cylZ = visualP1 * Math.cos(u);
                const cylY = yVal + halfH;

                // Interpolación
                const x = (1 - t) * flatX + t * cylX;
                const z = (1 - t) * flatZ + t * cylZ;
                const y = (1 - t) * flatY + t * cylY;

                positions.push(x, y, z);
            }
        }

        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const a = i * (segments + 1) + j;
                const b = i * (segments + 1) + j + 1;
                const c = (i + 1) * (segments + 1) + j;
                const d = (i + 1) * (segments + 1) + j + 1;

                indices.push(a, c, b);
                indices.push(b, c, d);
            }
        }

        bodyGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        bodyGeo.setIndex(indices);
        bodyGeo.computeVertexNormals();

        const bodyMesh = new THREE.Mesh(bodyGeo, glassMat);
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        group.add(bodyMesh);

        const bodyEdges = new THREE.EdgesGeometry(bodyGeo);
        const bodyLine = new THREE.LineSegments(bodyEdges, wireMat);
        group.add(bodyLine);

        // 2. Tapas Circulares
        const capGeo = new THREE.CircleGeometry(visualP1, 32);

        // Tapa Inferior
        const bottomCapMesh = new THREE.Mesh(capGeo, glassMat);
        bottomCapMesh.rotation.x = -Math.PI / 2;
        bottomCapMesh.receiveShadow = true;
        bottomCapMesh.position.set(0, 0, (1 - t) * (-halfH - visualP1));
        group.add(bottomCapMesh);

        const bottomEdges = new THREE.EdgesGeometry(capGeo);
        const bottomLine = new THREE.LineSegments(bottomEdges, wireMat);
        bottomCapMesh.add(bottomLine);

        // Tapa Superior
        const topCapMesh = new THREE.Mesh(capGeo, glassMat);
        topCapMesh.rotation.x = -Math.PI / 2;
        topCapMesh.receiveShadow = true;
        topCapMesh.position.set(0, t * visualP2, (1 - t) * (halfH + visualP1));
        group.add(topCapMesh);

        const topEdges = new THREE.EdgesGeometry(capGeo);
        const topLine = new THREE.LineSegments(topEdges, wireMat);
        topCapMesh.add(topLine);

    } else if (shape === 'cone') {
        // --- MORFOSIS: SECTOR CIRCULAR A CONO ---
        const segments = 32;
        
        // Generatriz L
        const L = Math.sqrt(p1 * p1 + p2 * p2);
        const visualL = L * visualScale;
        
        const theta0 = 2 * Math.PI * (p1 / L);

        // 1. Cuerpo cónico
        const coneBodyGeo = new THREE.BufferGeometry();
        const positions = [];
        const indices = [];

        for (let i = 0; i <= segments; i++) {
            const phi = (i / segments) * theta0 - theta0 / 2; 
            for (let j = 0; j <= segments; j++) {
                const rPrime = (j / segments) * visualL; 
                
                // Plano
                const flatX = rPrime * Math.cos(phi);
                const flatZ = rPrime * Math.sin(phi) + visualL / 2; 
                const flatY = 0;

                // Cono
                const visualH = visualP2;
                const cylAngle = phi * (2 * Math.PI / theta0); 
                const radiusAtY = visualP1 * (rPrime / visualL); 

                const coneX = radiusAtY * Math.cos(cylAngle);
                const coneZ = radiusAtY * Math.sin(cylAngle);
                const coneY = visualH * (1 - rPrime / visualL);

                // Interpolación
                const x = (1 - t) * flatX + t * coneX;
                const z = (1 - t) * flatZ + t * coneZ;
                const y = (1 - t) * flatY + t * coneY;

                positions.push(x, y, z);
            }
        }

        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const a = i * (segments + 1) + j;
                const b = i * (segments + 1) + j + 1;
                const c = (i + 1) * (segments + 1) + j;
                const d = (i + 1) * (segments + 1) + j + 1;

                indices.push(a, c, b);
                indices.push(b, c, d);
            }
        }

        coneBodyGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        coneBodyGeo.setIndex(indices);
        coneBodyGeo.computeVertexNormals();

        const bodyMesh = new THREE.Mesh(coneBodyGeo, glassMat);
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        group.add(bodyMesh);

        const bodyEdges = new THREE.EdgesGeometry(coneBodyGeo);
        const bodyLine = new THREE.LineSegments(bodyEdges, wireMat);
        group.add(bodyLine);

        // 2. Base circular del cono
        const baseGeo = new THREE.CircleGeometry(visualP1, 32);
        const baseMesh = new THREE.Mesh(baseGeo, glassMat);
        baseMesh.rotation.x = -Math.PI / 2;
        baseMesh.receiveShadow = true;
        baseMesh.position.set((1 - t) * (visualL + visualP1), 0, 0);
        group.add(baseMesh);

        const baseEdges = new THREE.EdgesGeometry(baseGeo);
        const baseLine = new THREE.LineSegments(baseEdges, wireMat);
        baseMesh.add(baseLine);

    } else if (shape === 'prism') {
        // --- MORFOSIS: RED ARTICULADA A PRISMA ---
        const x = visualP1; // Lado de la base
        const y = visualP2; // Altura

        const faceGeomX = new THREE.PlaneGeometry(x, y); 
        const faceGeomZ = new THREE.PlaneGeometry(y, x); 
        const baseGeom = new THREE.PlaneGeometry(x, x);   

        // 1. BASE INFERIOR (Siempre fija en el suelo)
        const bottomFace = new THREE.Mesh(baseGeom, glassMat);
        bottomFace.rotation.x = -Math.PI / 2;
        bottomFace.receiveShadow = true;
        group.add(bottomFace);

        const bottomEdges = new THREE.EdgesGeometry(baseGeom);
        const bottomLine = new THREE.LineSegments(bottomEdges, wireMat);
        bottomFace.add(bottomLine);

        // 2. CARA FRONTAL (Hinges en z = x/2)
        const pivotFront = new THREE.Group();
        pivotFront.position.set(0, 0, x / 2);
        pivotFront.rotation.x = -t * (Math.PI / 2);
        group.add(pivotFront);

        const frontMesh = new THREE.Mesh(faceGeomX, glassMat);
        frontMesh.rotation.x = -Math.PI / 2;
        frontMesh.position.set(0, 0, y / 2);
        frontMesh.castShadow = true;
        pivotFront.add(frontMesh);

        const frontEdges = new THREE.EdgesGeometry(faceGeomX);
        const frontLine = new THREE.LineSegments(frontEdges, wireMat);
        frontMesh.add(frontLine);

        // 3. CARA POSTERIOR (Hinges en z = -x/2)
        const pivotBack = new THREE.Group();
        pivotBack.position.set(0, 0, -x / 2);
        pivotBack.rotation.x = t * (Math.PI / 2);
        group.add(pivotBack);

        const backMesh = new THREE.Mesh(faceGeomX, glassMat);
        backMesh.rotation.x = -Math.PI / 2;
        backMesh.position.set(0, 0, -y / 2);
        backMesh.castShadow = true;
        pivotBack.add(backMesh);

        const backEdges = new THREE.EdgesGeometry(faceGeomX);
        const backLine = new THREE.LineSegments(backEdges, wireMat);
        backMesh.add(backLine);

        // 4. CARA IZQUIERDA (Hinges en x = -x/2)
        const pivotLeft = new THREE.Group();
        pivotLeft.position.set(-x / 2, 0, 0);
        pivotLeft.rotation.z = t * (Math.PI / 2);
        group.add(pivotLeft);

        const leftMesh = new THREE.Mesh(faceGeomZ, glassMat);
        leftMesh.rotation.set(-Math.PI / 2, 0, Math.PI / 2); 
        leftMesh.position.set(-y / 2, 0, 0);
        leftMesh.castShadow = true;
        pivotLeft.add(leftMesh);

        const leftEdges = new THREE.EdgesGeometry(faceGeomZ);
        const leftLine = new THREE.LineSegments(leftEdges, wireMat);
        leftMesh.add(leftLine);

        // 5. CARA DERECHA (Hinges en x = x/2)
        const pivotRight = new THREE.Group();
        pivotRight.position.set(x / 2, 0, 0);
        pivotRight.rotation.z = -t * (Math.PI / 2);
        group.add(pivotRight);

        const rightMesh = new THREE.Mesh(faceGeomZ, glassMat);
        rightMesh.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
        rightMesh.position.set(y / 2, 0, 0);
        rightMesh.castShadow = true;
        pivotRight.add(rightMesh);

        const rightEdges = new THREE.EdgesGeometry(faceGeomZ);
        const rightLine = new THREE.LineSegments(rightEdges, wireMat);
        rightMesh.add(rightLine);

        // 6. CARA SUPERIOR (Tapa, unida a la arista de la posterior)
        const pivotTop = new THREE.Group();
        pivotTop.position.set(0, 0, -y);
        pivotTop.rotation.x = -t * (Math.PI / 2);
        pivotBack.add(pivotTop);

        const topMesh = new THREE.Mesh(baseGeom, glassMat);
        topMesh.rotation.x = -Math.PI / 2;
        // Plegado Z dinámico para cierre hermético del prisma
        const topLocalZ = (1 - t) * (-x / 2) + t * (x / 2);
        topMesh.position.set(0, 0, topLocalZ);
        topMesh.castShadow = true;
        pivotTop.add(topMesh);

        const topEdges = new THREE.EdgesGeometry(baseGeom);
        const topLine = new THREE.LineSegments(topEdges, wireMat);
        topMesh.add(topLine);
    }
}

// --- CREAR Y POSICIONAR ETIQUETAS DE COMPARACIÓN (HTML OVERLAYS) ---
function createFloatingLabel(index, shape, V, V_opt) {
    const div = document.createElement('div');
    div.className = 'comparison-label';
    div.id = `label-shape-${shape}`;
    
    const nameMap = {
        sphere: 'Esfera',
        cylinder: 'Cilindro',
        cone: 'Cono',
        prism: 'Prisma'
    };
    
    const efficiency = (V / V_opt) * 100;
    
    div.innerHTML = `
        <span class="comp-label-title">${nameMap[shape]}</span>
        <span class="comp-label-vol">${V.toLocaleString('es-ES', { maximumFractionDigits: 0 })} cm³</span>
        <span class="comp-label-eff">${efficiency.toFixed(0)}% Efic.</span>
    `;
    
    comparisonLabelsContainer.appendChild(div);
}

// Actualizar la posición de las etiquetas flotantes
function updateComparisonLabels() {
    if (!comparisonGroup || comparisonGroup.children.length === 0) return;
    
    const offsets = [-6, -2, 2, 6];
    const shapes = ['sphere', 'cylinder', 'cone', 'prism'];
    
    const container = document.getElementById('canvas3d').parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    shapes.forEach((shape, index) => {
        const label = document.getElementById(`label-shape-${shape}`);
        if (!label) return;

        const metrics = calculateMetrics(shape);
        const visualH = (metrics.dim2 !== null ? metrics.dim2 : metrics.dim1 * 2) * visualScale;
        
        const vector3D = new THREE.Vector3(offsets[index], visualH + 0.8, 0);
        vector3D.applyMatrix4(comparisonGroup.matrixWorld);
        vector3D.project(camera);

        if (vector3D.z > 1) {
            label.style.opacity = '0';
            return;
        }

        const x = (vector3D.x * 0.5 + 0.5) * width;
        const y = (-(vector3D.y * 0.5) + 0.5) * height;

        label.style.opacity = '1';
        label.style.left = `${x - label.offsetWidth / 2}px`;
        label.style.top = `${y - label.offsetHeight}px`;
    });
}
