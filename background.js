
// THREE.JS BACKGROUND ANIMATION
// Theme: Neural Network / Data Flow / Automation
// Color Palette: Matches style.css (Blue/White/Glass)

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('canvas-container');

    if (!container) return;

    // SCENE SETUP
    const scene = new THREE.Scene();

    // FOG for depth (matches the light aesthetic)
    // Using a light blue/purple tint from the original design
    scene.fog = new THREE.FogExp2(0xeef2ff, 0.002);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // PARTICLES SETUP
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 200; // Keeping it performant

    const posArray = new Float32Array(particleCount * 3);

    // Spread particles randomly
    for (let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 500; // Spread range
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Material for Dots
    const particleMaterial = new THREE.PointsMaterial({
        size: 3,
        color: 0x3b82f6, // Primary Blue
        transparent: true,
        opacity: 0.8,
    });

    // Mesh
    const particlesMesh = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particlesMesh);

    // LINES (CONNECTIONS)
    // We will draw lines between close particles dynamically
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.15
    });

    // MOUSE INTERACTION & IDLE CHECK
    let mouseX = 0;
    let mouseY = 0;
    let lastMouseMoveTime = Date.now();
    let isIdle = false;

    // Mild parallax based on mouse
    document.addEventListener('mousemove', (event) => {
        mouseX = event.clientX - window.innerWidth / 2;
        mouseY = event.clientY - window.innerHeight / 2;
        lastMouseMoveTime = Date.now();
        isIdle = false;
    });

    // ANIMATION LOOP
    const animate = () => {
        requestAnimationFrame(animate);

        const time = Date.now();

        // Check if idle (no mouse move for 2 seconds)
        if (time - lastMouseMoveTime > 2000) {
            isIdle = true;
        }

        // Target Rotation Calculation
        let targetX, targetY;

        if (isIdle) {
            // Random Wandering (Simulated by Sine Waves)
            // Creates a smooth, unpredictable floating motion
            targetX = Math.sin(time * 0.0005) * 0.2; // 0.0005 = slow speed, 0.2 = amplitude
            targetY = Math.cos(time * 0.0003) * 0.2;
        } else {
            // Mouse Follow
            targetX = mouseX * 0.001;
            targetY = mouseY * 0.001;
        }

        // Smoothly interpolate current rotation to target
        particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
        particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);

        // Constant slow spin
        particlesMesh.rotation.y += 0.001;

        // NOTE: Dynamic line creation can be expensive. 
        // For performance on all devices, we will just rotate the dots for now.
        // Or if we want lines, we can use a pre-calculated wireframe or just nearest neighbor manually.
        // Let's add a simple trick: Clone the dots and make them a wireframe if we wanted, 
        // but for a "Network" look, lines connecting dots is best.
        // Let's do a simple line system manually using geometry if needed, but for now 
        // let's stick to the floating dots which look clean and modern.

        // Wait, the user specifically asked for "Three.js background", implying something cool. 
        // Let's add 'Plexus' style lines.

        drawLines();

        renderer.render(scene, camera);
    };

    // PLEXUS EFFECT (Lines between particles)
    const linesGeometry = new THREE.BufferGeometry();
    const linesMesh = new THREE.LineSegments(linesGeometry, lineMaterial);
    scene.add(linesMesh);

    function drawLines() {
        const positions = particlesMesh.geometry.attributes.position.array;
        const linePositions = [];

        // World position of particles (roughly approx for rotation)
        // Since we rotate the mesh, comparing raw local positions works if the mesh rotates, 
        // the lines rotate with it if they are children or calculated locally.
        // However, we added 'linesMesh' to scene, not as child of particlesMesh.
        // Let's simple make linesMesh a child or apply same rotation.
        linesMesh.rotation.x = particlesMesh.rotation.x;
        linesMesh.rotation.y = particlesMesh.rotation.y;

        // Brute force nearest neighbor (limit count for performance)
        // Only checking a subset or optimizing would be better for 1000s, but for 200 it's fine.
        const connectDistance = 60;

        for (let i = 0; i < particleCount; i++) {
            const x1 = positions[i * 3];
            const y1 = positions[i * 3 + 1];
            const z1 = positions[i * 3 + 2];

            for (let j = i + 1; j < particleCount; j++) {
                const x2 = positions[j * 3];
                const y2 = positions[j * 3 + 1];
                const z2 = positions[j * 3 + 2];

                const dist = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2);

                if (dist < connectDistance) {
                    linePositions.push(x1, y1, z1);
                    linePositions.push(x2, y2, z2);
                }
            }
        }

        linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    }

    // HANDLE RESIZE
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
});
