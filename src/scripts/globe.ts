import * as THREE from 'three';
import { feature } from 'topojson-client';

export function initGlobe(): void {
  const canvas = document.getElementById('globe-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 3.8;

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const R = 1.5;

  function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  // Globe group — rotates with the planet
  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // Ocean sphere
  globeGroup.add(new THREE.Mesh(
    new THREE.SphereGeometry(R, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0x060e06, transparent: true, opacity: 0.97 })
  ));

  // Atmosphere glow (backside sphere, slightly larger)
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(R + 0.06, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0x003300, transparent: true, opacity: 0.06, side: THREE.BackSide })
  ));

  // Graticule (lat/lon grid)
  const gMat = new THREE.LineBasicMaterial({ color: 0x0a260a, transparent: true, opacity: 0.35 });
  for (let lat = -80; lat <= 80; lat += 20) {
    const pts: THREE.Vector3[] = [];
    for (let lng = -180; lng <= 180; lng += 2) pts.push(latLngToVec3(lat, lng, R + 0.001));
    globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gMat));
  }
  for (let lng = -180; lng < 180; lng += 20) {
    const pts: THREE.Vector3[] = [];
    for (let lat = -90; lat <= 90; lat += 2) pts.push(latLngToVec3(lat, lng, R + 0.001));
    globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gMat));
  }

  // Country borders — loaded async from CDN
  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(r => r.json())
    .then((topo: any) => {
      const countries = feature(topo, topo.objects.countries) as any;
      const positions: number[] = [];

      for (const country of countries.features) {
        const geom = country.geometry;
        const polys: any[][][] = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
        for (const poly of polys) {
          for (const ring of poly) {
            for (let i = 0; i < ring.length - 1; i++) {
              const [lng1, lat1] = ring[i] as [number, number];
              const [lng2, lat2] = ring[i + 1] as [number, number];
              const p1 = latLngToVec3(lat1, lng1, R + 0.003);
              const p2 = latLngToVec3(lat2, lng2, R + 0.003);
              positions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            }
          }
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      globeGroup.add(new THREE.LineSegments(geo,
        new THREE.LineBasicMaterial({ color: 0x00c853, transparent: true, opacity: 0.75 })
      ));
    });

  // Major city nodes
  const CITIES: [number, number][] = [
    [40.71, -74.01],   [51.51, -0.13],    [35.68, 139.65],
    [48.86,   2.35],   [-33.87, 151.21],  [1.35,  103.82],
    [25.20,  55.27],   [-23.55, -46.63],  [19.08,  72.88],
    [55.76,  37.62],   [39.90,  116.41],  [-26.20,  28.05],
    [30.04,  31.24],   [52.52,   13.41],  [41.90,  12.50],
    [37.57, 126.98],   [13.76,  100.50],  [6.52,    3.38],
    [19.43, -99.13],   [-34.61, -58.38],  [59.91,  10.75],
    [60.17,  24.94],   [-1.29,   36.82],  [14.69,  -17.44],
    [-4.32,  15.32],   [33.57,  -7.59],   [31.20,  29.92],
  ];

  const cityGeo = new THREE.SphereGeometry(0.018, 6, 6);
  const cityMat = new THREE.MeshBasicMaterial({ color: 0x69ff47 });
  for (const [lat, lng] of CITIES) {
    const mesh = new THREE.Mesh(cityGeo, cityMat);
    mesh.position.copy(latLngToVec3(lat, lng, R + 0.015));
    globeGroup.add(mesh);
  }

  // Scan ring — stays fixed in scene (doesn't rotate with globe)
  const scanGroup = new THREE.Group();
  scene.add(scanGroup);

  function makeRing(inner: number, outer: number, opacity: number, color: number) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 128),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide })
    );
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  // Wide infrared scanner beam — thick band with layered glow
  const scanCore  = makeRing(R - 0.055, R + 0.055, 0.92, 0xff2200); // main thick beam
  const scanHot   = makeRing(R - 0.018, R + 0.018, 1.00, 0xff6644); // bright hot centre line
  const scanGlow1 = makeRing(R - 0.15,  R + 0.15,  0.28, 0xcc1100); // inner glow
  const scanGlow2 = makeRing(R - 0.32,  R + 0.32,  0.10, 0x880000); // wide outer bloom
  const scanGlow3 = makeRing(R - 0.55,  R + 0.55,  0.04, 0x440000); // farthest haze
  scanGroup.add(scanGlow3, scanGlow2, scanGlow1, scanCore, scanHot);

  // Scanned-area cap: faint red tint above beam (already-scanned zone)
  const capGeo = new THREE.CircleGeometry(R, 128);
  const capMat = new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.03, side: THREE.DoubleSide });
  const scanCap = new THREE.Mesh(capGeo, capMat);
  scanCap.rotation.x = Math.PI / 2;
  scene.add(scanCap);

  // Scan keyframes: 0 = top, 1 = bottom
  // Down 30 → up 10 → down 50 → up 20 → down 100
  // → raise to 50 → drop to 75 → raise to 10 → drop to 75 → raise to top → restart
  const KEYFRAMES = [0.00, 0.30, 0.20, 0.70, 0.50, 1.00, 0.50, 0.75, 0.10, 0.75, 0.00];
  const SCAN_SPEED = 2 * R / 1800; // units per ms — fast

  let kfIndex = 1;          // index of current target keyframe
  let scanFraction = 0.00;  // current position (0 = top, 1 = bottom)
  let lastTime = performance.now();

  function animate(now: number) {
    requestAnimationFrame(animate);
    const dt = Math.min(now - lastTime, 50);
    lastTime = now;

    globeGroup.rotation.y += 0.00012 * dt;

    // Move toward target keyframe at constant speed
    const target = KEYFRAMES[kfIndex];
    const dir = target > scanFraction ? 1 : -1;
    const step = (SCAN_SPEED / (2 * R)) * dt;

    scanFraction += dir * step;

    if ((dir > 0 && scanFraction >= target) || (dir < 0 && scanFraction <= target)) {
      scanFraction = target;
      kfIndex++;
      if (kfIndex >= KEYFRAMES.length) {
        kfIndex = 1;
        scanFraction = 0.00;
      }
    }

    // Convert fraction to world-y
    const scanY = R * (1 - 2 * scanFraction);

    // Scale ring to follow sphere curvature
    const rAtY = Math.sqrt(Math.max(0, R * R - scanY * scanY));
    const scale = rAtY / R;
    scanGroup.scale.set(scale, 1, scale);
    scanGroup.position.y = scanY;

    scanCap.position.y = scanY;
    scanCap.scale.set(scale, 1, scale);

    // Pulse glow — infrared flicker
    const pulse = 0.5 + 0.18 * Math.sin(now * 0.008);
    (scanCore.material  as THREE.MeshBasicMaterial).opacity = pulse * 0.92;
    (scanHot.material   as THREE.MeshBasicMaterial).opacity = pulse;
    (scanGlow1.material as THREE.MeshBasicMaterial).opacity = pulse * 0.28;
    (scanGlow2.material as THREE.MeshBasicMaterial).opacity = pulse * 0.10;
    (scanGlow3.material as THREE.MeshBasicMaterial).opacity = pulse * 0.04;

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
}
