import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

(function main() {
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const machine = document.getElementById('machine');
  const canvas = document.getElementById('gl');
  const ovRoot = document.getElementById('ov');
  const nav = document.getElementById('nav');
  const AV = document.getElementById('av-src').getAttribute('src');
  const sections = [...machine.querySelectorAll('.scene')];
  const NS = sections.length;
  const HOLD = 1 / 3;
  const SNAP = location.hash === '#snap';

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { document.documentElement.classList.add('no-gl'); return; }
  const FLOOR = new THREE.Color('#F7F6F0');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = FLOOR.clone();
  scene.fog = new THREE.Fog(FLOOR.clone(), 40, 90);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;

  const hemi = new THREE.HemisphereLight(0xffffff, 0xecebe4, 1.05);
  const key = new THREE.DirectionalLight(0xfffaf0, 1.85);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.03;
  key.shadow.radius = 3;
  scene.add(hemi, key, key.target);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 400);

  /* ---------- materials ---------- */
  const lamTex = (() => {
    const c = document.createElement('canvas'); c.width = 4; c.height = 128;
    const x = c.getContext('2d');
    const bands = [['#F3EEDC', 18], ['#D0D8BC', 8], ['#F3EEDC', 14], ['#DFF49F', 6], ['#F3EEDC', 16], ['#C7D1B2', 7], ['#F3EEDC', 18], ['#DFF49F', 5], ['#F3EEDC', 16], ['#D0D8BC', 8], ['#F3EEDC', 12]];
    let y = 0; for (const [col, h] of bands) { x.fillStyle = col; x.fillRect(0, y, 4, h); y += h; }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.LinearFilter;
    return t;
  })();
  const M = {
    floor: new THREE.MeshStandardMaterial({ color: '#F7F6F0', roughness: 1 }),
    eg: new THREE.MeshStandardMaterial({ color: '#133F26', roughness: 0.58 }),
    egGloss: new THREE.MeshPhysicalMaterial({ color: '#133F26', roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25 }),
    lilac: new THREE.MeshStandardMaterial({ color: '#D9CDE5', roughness: 0.72 }),
    lilacIn: new THREE.MeshStandardMaterial({ color: '#CDBFDC', roughness: 0.8, side: THREE.BackSide }),
    porcelain: new THREE.MeshPhysicalMaterial({ color: '#FCFBF6', roughness: 0.34, clearcoat: 0.55, clearcoatRoughness: 0.3 }),
    sage: new THREE.MeshStandardMaterial({ color: '#D0D8BC', roughness: 0.8 }),
    lam: new THREE.MeshStandardMaterial({ map: lamTex, roughness: 0.8, side: THREE.DoubleSide }),
    pill: new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: 0.46, sheen: 0.5, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.6, clearcoat: 0.2, clearcoatRoughness: 0.5 }),
    score: new THREE.MeshStandardMaterial({ color: '#DADDD2', roughness: 0.9 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.03, clearcoat: 1, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }),
    water: new THREE.MeshPhysicalMaterial({ color: '#DCF3A9', roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.55, depthWrite: false })
  };
  const LIME = new THREE.Color('#DFF49F');
  const lit = (base, glow = 0.35) => { const m = base.clone(); m.emissive = new THREE.Color('#DFF49F'); m.emissiveIntensity = 0; m.userData.base = base.color.clone(); m.userData.glow = glow; return m; };
  const setLit = (m, v) => { m.color.copy(m.userData.base).lerp(LIME, v); m.emissiveIntensity = v * m.userData.glow; };
  const limeMat = () => new THREE.MeshStandardMaterial({ color: '#DFF49F', roughness: 0.6, emissive: '#DFF49F', emissiveIntensity: 0.08 });

  /* ---------- pill: thick tablet, straight sides, gently domed faces, chalky finish ---------- */
  const PR = 1, PH = 0.3, PC = 0.09, PD = 0.13, PT = PH + PD;
  const F = 1 - PC;
  const lathe = (pts) => { const g = new THREE.LatheGeometry(pts.map(q => new THREE.Vector2(q[0], q[1])), 128); g.rotateX(Math.PI / 2); return g; };
  const capPts = (sgn) => { const o = []; for (let i = 0; i <= 28; i++) { const x = F * i / 28; o.push([x, sgn * (PH + PD * (1 - (x / F) ** 2))]); } return sgn > 0 ? o.reverse() : o; };
  const bandPts = (() => { const o = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (Math.PI / 2) * i / 10; o.push([F + PC * Math.cos(a), -PH + PC + PC * Math.sin(a)]); } for (let i = 0; i <= 10; i++) { const a = (Math.PI / 2) * i / 10; o.push([F + PC * Math.cos(a), PH - PC + PC * Math.sin(a)]); } return o; })();
  const grain = (() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const x = c.getContext('2d'); const img = x.createImageData(512, 256), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = 128 + (Math.random() - 0.5) * 90; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    x.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 3); return t;
  })();
  M.pillFace = new THREE.MeshStandardMaterial({ color: '#FDFDFE', roughness: 0.92, bumpMap: grain, bumpScale: 0.9 });
  M.pillBand = new THREE.MeshStandardMaterial({ color: '#C9C5EC', roughness: 0.9, bumpMap: grain, bumpScale: 0.9 });
  M.pillRim = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.4, emissive: '#FFFFFF', emissiveIntensity: 0.35 });
  const pill = new THREE.Group();
  {
    const parts = [new THREE.Mesh(lathe(capPts(1)), M.pillFace), new THREE.Mesh(lathe(capPts(-1)), M.pillFace), new THREE.Mesh(lathe(bandPts), M.pillBand)];
    [1, -1].forEach(sg => { const r = new THREE.Mesh(new THREE.TorusGeometry(F + 0.012, 0.014, 8, 160), M.pillRim); r.position.z = sg * (PH + 0.004); parts.push(r); });
    parts.forEach(m => { m.castShadow = true; m.receiveShadow = true; pill.add(m); });
  }
  scene.add(pill);

  /* ---------- helpers ---------- */
  const world = new THREE.Group(); scene.add(world);
  const UP = new THREE.Vector3(0, 1, 0);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const add = (m, cast = true) => { m.traverse(o => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = true; } }); world.add(m); return m; };
  const rbox = (w, h, d, r, mat) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2)), mat);
  const ovs = [];
  const overlay = (cls, pos, html) => { const el = document.createElement('div'); el.className = 'ov ' + cls; el.innerHTML = html; ovRoot.appendChild(el); const o = { el, pos }; ovs.push(o); return o; };
  const checkSVG = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6.5 12.4l3.6 3.6 7.4-8" fill="none" stroke="#133F26" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function sampleCurve(ctrl, step = 0.06) {
    const c = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
    const n = Math.ceil(c.getLength() / step);
    return c.getSpacedPoints(n);
  }
  function hdir(pts, i) {
    const a = pts[Math.max(0, i - 6)], b = pts[Math.min(pts.length - 1, i + 6)];
    const d = V(b.x - a.x, 0, b.z - a.z); if (d.lengthSq() < 1e-8) d.set(1, 0, 0); return d.normalize();
  }
  const sideOf = d => V(-d.z, 0, d.x);

  /* ribbon: evergreen top, laminated edges; pts are top-centre points */
  function ribbon(pts, width = 1.6, th = 0.3) {
    const n = pts.length, tp = [], sp = [], su = [], ti = [], si = [];
    let acc = 0;
    for (let i = 0; i < n; i++) {
      if (i) acc += pts[i].distanceTo(pts[i - 1]);
      const s = sideOf(hdir(pts, i)).multiplyScalar(width / 2), p = pts[i];
      const L = p.clone().add(s), R = p.clone().sub(s);
      tp.push(L.x, L.y, L.z, R.x, R.y, R.z);
      sp.push(L.x, L.y, L.z, L.x, L.y - th, L.z, R.x, R.y, R.z, R.x, R.y - th, R.z);
      su.push(acc * 0.3, L.y / 1.1, acc * 0.3, (L.y - th) / 1.1, acc * 0.3, R.y / 1.1, acc * 0.3, (R.y - th) / 1.1);
      if (i < n - 1) {
        const a = i * 2; ti.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        const b = i * 4; si.push(b, b + 1, b + 4, b + 1, b + 5, b + 4, b + 2, b + 6, b + 3, b + 3, b + 6, b + 7);
      }
    }
    [0, n - 1].forEach(i => { const b = i * 4; si.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); });
    const gt = new THREE.BufferGeometry(); gt.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); gt.setIndex(ti); gt.computeVertexNormals();
    const gs = new THREE.BufferGeometry(); gs.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); gs.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2)); gs.setIndex(si); gs.computeVertexNormals();
    const topMat = M.eg.clone(); topMat.side = THREE.DoubleSide;
    add(new THREE.Mesh(gt, topMat)); add(new THREE.Mesh(gs, M.lam));
  }

  /* ---------- the course ---------- */
  const course = { pts: [], s: [0], mode: [] };
  const push = (arr, mode) => {
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i];
      if (course.pts.length) { const q = course.pts[course.pts.length - 1]; if (p.distanceToSquared(q) < 1e-6) continue; course.s.push(course.s[course.s.length - 1] + p.distanceTo(q)); }
      course.pts.push(p); course.mode.push(mode);
    }
  };
  const lift = (pts, y) => pts.map(p => V(p.x, p.y + y, p.z));
  const nearestS = (x, z) => { let best = 0, bd = 1e9; course.pts.forEach((p, i) => { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; best = i; } }); return course.s[best]; };
  const atS = (s) => { let a = 0, b = course.s.length - 1; while (a < b) { const m = (a + b) >> 1; if (course.s[m] < s) a = m + 1; else b = m; } return a; };

  const trig = [];
  const on = (s, set, el, cls) => { const t = { s, v: 0, set, el, cls }; trig.push(t); return t; };

  function build() {
    const RT = 0.3, ZS = 22, RUN = 3.6;
    const zk = k => k * ZS;
    const sgn = () => -1; // every run goes left -> right
    const TOPD = 0.66 + RT, DIP = 1.4;
    const PIT = V(1.5, 0, zk(6) + 0.1), PITR = 2.3, PITD = 1.4;

    /* --- hero: lilac dish with a raised lime puck, level with the chute --- */
    const dishProf = [[0, 0], [4.3, 0], [4.5, 0.12], [4.55, 0.35], [4.45, 0.58], [4.25, 0.66], [0, 0.66]].map(p => new THREE.Vector2(p[0], p[1]));
    add(new THREE.Mesh(new THREE.LatheGeometry(dishProf, 128), M.lilac));
    const puck = add(new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, RT + 0.006, 96), limeMat())); puck.position.set(-1.6, 0.66 + (RT + 0.006) / 2, -0.6);
    const puckRing = add(new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.06, 12, 96), M.egGloss)); puckRing.rotation.x = Math.PI / 2; puckRing.position.set(-1.6, TOPD + 0.006, -0.6);

    /* --- one continuous chute: plan, smooth, resample --- */
    const C = [];
    const P = (x, z, y = RT) => C.push(V(x, y, z));
    P(-0.15, -0.5, TOPD); P(2.2, -0.25, TOPD); P(3.7, 0.25, TOPD); P(4.95, 1.0, 0.6); P(5.9, 2.5, RT); P(5.9, 5.4, RT); P(2.6, 9.6, RT); P(-2.4, 13.4, RT); P(-RUN - 1.5, zk(1) - 3.4); P(-RUN - 1.2, zk(1) - 0.9);
    for (let k = 1; k <= 5; k++) {
      const wav = k === 5 ? 0.8 : 0.28;
      for (let i = 0; i <= 10; i++) { const u = i / 10; P(-RUN + 2 * RUN * u, zk(k) + Math.sin(u * Math.PI * 2) * wav); }
      P(RUN + 1.2, zk(k) + 0.9); P(RUN + 1.5, zk(k) + 3.4); P(2.4, zk(k) + 8.6); P(-2.4, zk(k) + 13.4); P(-RUN - 1.5, zk(k + 1) - 3.4); P(-RUN - 1.2, zk(k + 1) - 0.9);
    }
    P(-RUN, zk(6)); P(-2.3, zk(6) + 0.04); P(PIT.x - PITR - 0.04, PIT.z);
    const curve = new THREE.CatmullRomCurve3(C, false, 'centripetal');
    let cl = curve.getSpacedPoints(Math.ceil(curve.getLength() / 0.05));
    for (let pass = 0; pass < 8; pass++) {
      const nx = cl.map(p => p.clone());
      for (let i = 4; i < cl.length - 4; i++) { let sx = 0, sy = 0, sz = 0; for (let j = -4; j <= 4; j++) { sx += cl[i + j].x; sy += cl[i + j].y; sz += cl[i + j].z; } nx[i].set(sx / 9, sy / 9, sz / 9); }
      cl = nx;
    }
    { const c2 = new THREE.CatmullRomCurve3(cl, false, 'centripetal'); cl = c2.getSpacedPoints(Math.ceil(c2.getLength() / 0.05)); }
    // scene 5: the chute dips into a channel carved in the floor and climbs back out
    const sm = (a2, b2, x) => { const t = Math.max(0, Math.min(1, (x - a2) / (b2 - a2))); return t * t * (3 - 2 * t); };
    cl.forEach(p => { if (Math.abs(p.z - zk(5)) < 2.5 && p.x > -RUN - 0.2 && p.x < RUN + 0.2) { const u = (p.x + RUN) / (2 * RUN); p.y = RT - DIP * sm(0.0, 0.3, u) * sm(1.0, 0.7, u); } });
    const W = 1.3, Hh = W / 2, n = cl.length;
    const hd = i => { const a2 = cl[Math.max(0, i - 6)], b2 = cl[Math.min(n - 1, i + 6)]; const d = V(b2.x - a2.x, 0, b2.z - a2.z); return d.lengthSq() < 1e-9 ? V(1, 0, 0) : d.normalize(); };
    const Ls = [], Rs = [];
    {
      const tp = [], ti = [], sp = [], su = [], si = [];
      let acc = 0;
      for (let i = 0; i < n; i++) {
        if (i) acc += cl[i].distanceTo(cl[i - 1]);
        const sv = sideOf(hd(i)).multiplyScalar(Hh), p = cl[i];
        const L = p.clone().add(sv), R = p.clone().sub(sv); Ls.push(L); Rs.push(R);
        tp.push(L.x, L.y, L.z, R.x, R.y, R.z);
        const top = p.y >= 0 ? p.y : 0, bot = p.y - RT;
        sp.push(L.x, top, L.z, L.x, bot, L.z, R.x, top, R.z, R.x, bot, R.z);
        su.push(acc * 0.3, top / 1.1, acc * 0.3, bot / 1.1, acc * 0.3, top / 1.1, acc * 0.3, bot / 1.1);
        if (i < n - 1) { const a2 = i * 2; ti.push(a2, a2 + 2, a2 + 1, a2 + 1, a2 + 2, a2 + 3); const b2 = i * 4; si.push(b2, b2 + 1, b2 + 4, b2 + 1, b2 + 5, b2 + 4, b2 + 2, b2 + 6, b2 + 3, b2 + 3, b2 + 6, b2 + 7); }
      }
      [0, n - 1].forEach(i => { const b2 = i * 4; si.push(b2, b2 + 2, b2 + 1, b2 + 1, b2 + 2, b2 + 3); });
      const gt = new THREE.BufferGeometry(); gt.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); gt.setIndex(ti); gt.computeVertexNormals();
      const gs = new THREE.BufferGeometry(); gs.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); gs.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2)); gs.setIndex(si); gs.computeVertexNormals();
      const topMat = M.eg.clone(); topMat.side = THREE.DoubleSide;
      add(new THREE.Mesh(gt, topMat)); add(new THREE.Mesh(gs, M.lam));
    }

    /* --- pill path: across the puck, along the chute, off the edge, tip over flat --- */
    const nrm = i => { const a2 = cl[Math.max(0, i - 3)], b2 = cl[Math.min(n - 1, i + 3)]; const t3 = b2.clone().sub(a2).normalize(); return sideOf(hd(i)).cross(t3).normalize(); };
    push(sampleCurve([V(-1.6, TOPD + PR, -0.6), V(-0.9, TOPD + PR, -0.56), V(-0.15, TOPD + PR, -0.5)], 0.05), 'roll');
    push(cl.map((p, i) => p.clone().add(nrm(i).multiplyScalar(PR))), 'roll');
    const edge = course.pts[course.pts.length - 1].clone(), edgeS = course.s[course.s.length - 1];
    const dT = hd(n - 1);
    const yTouch = -PITD + PR, touch = V(PIT.x - 0.75, yTouch, PIT.z);
    const fall = []; for (let i = 1; i <= 36; i++) { const t = i / 36; fall.push(V(edge.x + (touch.x - edge.x) * t, edge.y - (edge.y - yTouch) * t * t, edge.z + (touch.z - edge.z) * t)); }
    push(fall, 'fall');
    const touchS = course.s[course.s.length - 1];
    const lat = UP.clone().cross(dT).normalize();
    course.phi = new Array(course.pts.length).fill(0);
    for (let i = 1; i <= 60; i++) {
      const t = i / 60;
      let phi = t < 0.5 ? (Math.PI / 2) * (t / 0.5) ** 2 : Math.PI / 2 - 0.2 * Math.exp(-7 * (t - 0.5)) * Math.abs(Math.sin(16 * (t - 0.5)));
      const c = V(touch.x, -PITD, touch.z).add(lat.clone().multiplyScalar(PR * Math.sin(phi))).add(V(0, PR * Math.cos(phi) + PT * Math.sin(phi), 0)).add(V(0, 0.0004 * i, 0));
      push([c], 'tip'); course.phi[course.pts.length - 1] = phi;
    }
    const endS = course.s[course.s.length - 1];
    course.dTip = dT; course.touchS = touchS;
    const fallS = touchS;
    {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(PITR, PITR, PITD, 96, 1, true), M.lilacIn); w.position.set(PIT.x, -PITD / 2, PIT.z); add(w, false);
      const lm = M.lam.clone(); lm.side = THREE.BackSide;
      const lam = new THREE.Mesh(new THREE.CylinderGeometry(PITR - 0.002, PITR - 0.002, 0.26, 96, 1, true), lm); lam.position.set(PIT.x, -0.13, PIT.z); add(lam, false);
      const fl = lit(new THREE.MeshStandardMaterial({ color: '#CDBFDC', roughness: 0.8 }), 0.5);
      const f = new THREE.Mesh(new THREE.CircleGeometry(PITR, 96), fl); f.rotation.x = -Math.PI / 2; f.position.set(PIT.x, -PITD, PIT.z); add(f, false);
      const glow = new THREE.PointLight(0xf2ffcc, 0, 9, 1.4); glow.position.set(PIT.x, -0.2, PIT.z); world.add(glow);
      on(endS - 0.3, v => { setLit(fl, v); glow.intensity = v * 22; });
      const gp = [[0.62, 0], [0.7, 0.05], [0.72, 0.15], [0.78, 2.5], [0.72, 2.5], [0.66, 0.2], [0, 0.18]].map(p => new THREE.Vector2(p[0], p[1]));
      const gl = new THREE.Mesh(new THREE.LatheGeometry(gp, 72), M.glass); gl.position.set(PIT.x + 2.9, 0, PIT.z - 2.6); add(gl, false);
      const wa = new THREE.Mesh(new THREE.CylinderGeometry(0.69, 0.66, 1.5, 64), M.water); wa.position.set(PIT.x + 2.9, 0.95, PIT.z - 2.6); add(wa, false);
    }

    /* --- floor with the carved channel and the pit cut out --- */
    {
      const shape = new THREE.Shape([new THREE.Vector2(-90, 70), new THREE.Vector2(90, 70), new THREE.Vector2(90, -230), new THREE.Vector2(-90, -230)]);
      let ia = -1, ib = -1; for (let i = 0; i < n; i++) if (cl[i].y < -0.001) { if (ia < 0) ia = i; ib = i; }
      ia = Math.max(0, ia - 1); ib = Math.min(n - 1, ib + 1);
      const hole = new THREE.Path(); for (let i = ia; i <= ib; i++) { const p = Ls[i]; i === ia ? hole.moveTo(p.x, -p.z) : hole.lineTo(p.x, -p.z); } for (let i = ib; i >= ia; i--) hole.lineTo(Rs[i].x, -Rs[i].z); hole.closePath();
      const pit = new THREE.Path(); pit.absarc(PIT.x, -PIT.z, PITR, 0, Math.PI * 2, false);
      shape.holes.push(hole, pit);
      const g = new THREE.ShapeGeometry(shape, 64); g.rotateX(-Math.PI / 2);
      const fl = new THREE.Mesh(g, M.floor); fl.receiveShadow = true; world.add(fl);
    }

    /* --- anchors + action windows --- */
    const A = [V(0.6, 0, 0.2)]; for (let k = 1; k <= 5; k++) A.push(V(0, 0, zk(k) - 0.6)); A.push(V(PIT.x - 2.0, 0, zk(6) - 0.8));
    const win = [];
    win[0] = [0, nearestS(4.6, 0.6)];
    for (let k = 1; k <= 4; k++) win[k] = [nearestS(-RUN, zk(k)), nearestS(RUN, zk(k))];
    win[5] = [nearestS(-RUN, zk(5)), nearestS(RUN, zk(5))];
    win[6] = [nearestS(-RUN, zk(6)) + 0.6, endS];
    course.win = win; course.anchors = A;
    const atX = (k, x) => { const [a, b] = win[k]; const ia = atS(a), ib = atS(b); let best = ia, bd = 1e9; for (let i = ia; i <= ib; i++) { const dd = Math.abs(course.pts[i].x - x); if (dd < bd) { bd = dd; best = i; } } return best; };

    /* --- scene 1: three question cards flip from cream to lime --- */
    [2.5, 0, -2.5].forEach(x => {
      const i = atX(1, x), p = course.pts[i];
      const base = V(x, 0, p.z - 2.5);
      const g = new THREE.Group(); g.position.copy(base); g.rotation.y = -0.12 * x; add(g);
      const foot = rbox(0.9, 0.16, 0.6, 0.08, M.sage); foot.position.y = 0.08; g.add(foot);
      const card = new THREE.Group(); card.position.y = 1.3; g.add(card);
      const front = rbox(1.6, 2.0, 0.12, 0.12, M.porcelain); front.position.z = 0.04; card.add(front);
      const back = rbox(1.6, 2.0, 0.06, 0.06, limeMat()); back.position.z = -0.06; card.add(back);
      const bar1 = rbox(0.95, 0.11, 0.02, 0.04, M.sage); bar1.position.set(-0.12, 0.42, 0.11); card.add(bar1);
      const bar2 = rbox(0.6, 0.11, 0.02, 0.04, M.sage); bar2.position.set(-0.3, 0.16, 0.11); card.add(bar2);
      const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 32).rotateX(Math.PI / 2), M.eg); dot.position.set(-0.45, -0.38, 0.11); card.add(dot);
      g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      const o2 = overlay('chk', base.clone().add(V(0, 1.3, 0.15)), checkSVG);
      on(course.s[i] - 0.3, v => { card.rotation.y = v * Math.PI; card.position.y = 1.3 + Math.sin(v * Math.PI) * 0.5; }, o2.el);
    });

    /* --- scene 2: arch that lights up + doctor card --- */
    {
      const i = atX(2, 0), p = course.pts[i], d = hdir(course.pts, i);
      const am = lit(M.egGloss, 0.6);
      const arch = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.27, 28, 128, Math.PI), am);
      arch.position.set(p.x, 0, p.z); arch.rotation.y = Math.atan2(d.x, d.z) - 0.42; add(arch);
      const ax = V(Math.cos(arch.rotation.y), 0, -Math.sin(arch.rotation.y));
      [-1, 1].forEach(k => { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.22, 48), M.lilac); f.position.set(p.x + ax.x * 2.6 * k, 0.11, p.z + ax.z * 2.6 * k); add(f); });
      const o2 = overlay('doc', V(p.x, 4.1, p.z - 0.4), '<img src="' + AV + '" alt=""><div><b>Dra. Anca</b><span class="a">Revisando tu caso</span><span class="b">Caso revisado</span></div><i class="badge">' + checkSVG + '</i>');
      on(course.s[i], v => setLit(am, v), o2.el);
    }

    /* --- scene 3: seven porcelain dominoes topple, one per day --- */
    ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach((lbl, q) => {
      const x = -3.0 + q * 1.0, i = atX(3, x), p = course.pts[i];
      const d = V(1, 0, 0);
      const base = V(x, 0, p.z - 2.1);
      const g = new THREE.Group(); g.position.copy(base);
      g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(d, UP, d.clone().cross(UP)));
      const piv = new THREE.Group(); piv.position.x = 0.17; g.add(piv);
      const dm = rbox(0.34, 2.1, 1.15, 0.08, M.porcelain); dm.position.set(-0.17, 1.05, 0); piv.add(dm);
      [-1, 1].forEach(side => {
        const bar = rbox(0.02, 0.06, 0.8, 0.02, M.eg); bar.position.set(-0.17 + side * 0.175, 1.05, 0); piv.add(bar);
        [0.55, 1.55].forEach(y => { const pip = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), M.eg); pip.scale.x = 0.4; pip.position.set(-0.17 + side * 0.17, y, 0); piv.add(pip); });
      });
      add(g);
      const o2 = overlay('day', V(x, 2.75, p.z - 2.1), lbl);
      on(course.s[i] - 0.2, v => { piv.rotation.z = -v * (q === 6 ? 1.45 : 0.98); }, o2.el);
    });

    /* --- scene 4: four pillars rise, each one a step up in dose --- */
    [0.9, 1.6, 2.3, 3.0].forEach((h, q) => {
      const x = -2.7 + q * 1.8, i = atX(4, x), p = course.pts[i];
      const g = new THREE.Group(); g.position.set(x, 0, p.z - 2.3); add(g);
      const body = rbox(1.25, h, 1.25, 0.1, M.porcelain); body.position.y = h / 2; g.add(body);
      const capM = lit(M.sage, 0.4);
      const cap = rbox(1.29, 0.16, 1.29, 0.07, capM); cap.position.y = h + 0.06; g.add(cap);
      for (let z = 0; z <= q; z++) { const dot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), M.eg); dot.scale.y = 0.5; dot.position.set((z - q / 2) * 0.27, h + 0.16, 0); g.add(dot); }
      g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      g.position.y = -(h + 0.3);
      on(course.s[i] - 0.6, v => { g.position.y = -(h + 0.3) * (1 - v); setLit(capM, v); });
    });

    /* --- scene 5: chat bubbles above the trench --- */
    {
      const w5 = course.win[5], a2 = atS(w5[0] + (w5[1] - w5[0]) * 0.32), b2 = atS(w5[0] + (w5[1] - w5[0]) * 0.72);
      const pa = course.pts[a2], pb = course.pts[b2];
      const o1 = overlay('bub', V(pa.x, 2.8, pa.z - 2.0), '¿Qué tal tu semana?');
      const o2 = overlay('bub dk', V(pb.x, 1.7, pb.z - 1.2), 'Muy bien, gracias');
      on(course.s[a2], null, o1.el); on(course.s[b2], null, o2.el);
    }

    sections.forEach((sec, k) => { const chip = sec.querySelector('.n'); if (chip && win[k]) on(win[k][0] + 0.2, null, chip, 'done'); });
  }

  /* ---------- camera + scroll mapping ---------- */
  let vw = 1, vh = 1, mob = false, secH = 1, machineTop = 0;
  const camKeys = [];
  function layout() {
    vw = window.innerWidth; vh = window.innerHeight; mob = vw <= 900;
    renderer.setSize(vw, vh, false); canvas.style.width = vw + 'px'; canvas.style.height = vh + 'px';
    camera.aspect = vw / vh; camera.updateProjectionMatrix();
    secH = sections[0].offsetHeight;
    machineTop = machine.getBoundingClientRect().top + window.scrollY;
    const pitch = THREE.MathUtils.degToRad(mob ? 46 : 40);
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camKeys.length = 0;
    course.anchors.forEach((a, k) => {
      let D = k === 0 ? 24 : 21;
      if (mob) D *= k === 0 ? 2.0 : 2.05;
      const visH = 2 * D * tanH, visW = visH * camera.aspect;
      const side = sections[k].dataset.side === 'left' ? -1 : 1;
      const t = a.clone();
      if (mob) { t.z -= visH * (k === 0 ? 0.27 : 0.17) / Math.sin(pitch); } else t.x -= side * visW * 0.2;
      camKeys.push({ t, D, pitch });
    });
  }
  const smooth = x => x * x * (3 - 2 * x);
  function stateAt(f) {
    f = Math.max(0, Math.min(NS - 1 + HOLD, f));
    const k = Math.min(NS - 1, Math.floor(f));
    let t = f - k;
    if (REDUCE) t = Math.min(t, HOLD);
    const w = course.win;
    if (t <= HOLD || k === NS - 1) {
      const u = Math.min(1, t / HOLD);
      return { cam: camKeys[k], cam2: null, cu: 0, s: w[k][0] + (w[k][1] - w[k][0]) * (REDUCE ? 1 : u) };
    }
    const u = smooth((t - HOLD) / (1 - HOLD));
    return { cam: camKeys[k], cam2: camKeys[k + 1], cu: u, s: w[k][1] + (w[k + 1][0] - w[k][1]) * u };
  }
  const tmpT = V(0, 0, 0);
  function placeCamera(st) {
    const a = st.cam, b = st.cam2 || st.cam, u = st.cu;
    tmpT.copy(a.t).lerp(b.t, u);
    const D = a.D + (b.D - a.D) * u, pitch = a.pitch;
    camera.position.set(tmpT.x, tmpT.y + D * Math.sin(pitch), tmpT.z + D * Math.cos(pitch));
    camera.lookAt(tmpT);
    scene.fog.near = D * 1.6; scene.fog.far = D * 3.4;
    key.target.position.copy(tmpT); key.position.set(tmpT.x - 9, tmpT.y + 16, tmpT.z + 5);
    const ext = mob ? 22 : 15; const c = key.shadow.camera; c.left = -ext; c.right = ext; c.top = ext; c.bottom = -ext; c.near = 1; c.far = 60; c.updateProjectionMatrix();
  }

  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), qr = new THREE.Quaternion(), m4 = new THREE.Matrix4();
  const ZAX = V(0, 0, 1);
  function placePill(s) {
    const i = atS(s), p = course.pts[i], mode = course.mode[i];
    pill.position.copy(p);
    if (mode === 'tip') {
      const d = course.dTip;
      m4.makeBasis(d, UP, d.clone().cross(UP)); qa.setFromRotationMatrix(m4);
      qr.setFromAxisAngle(ZAX, -course.touchS / PR); qa.multiply(qr);
      qb.setFromAxisAngle(d, -course.phi[i]); qa.premultiply(qb);
    } else {
      const d = hdir(course.pts, i);
      m4.makeBasis(d, UP, d.clone().cross(UP)); qa.setFromRotationMatrix(m4);
      qr.setFromAxisAngle(ZAX, -s / PR); qa.multiply(qr);
    }
    pill.quaternion.copy(qa);
  }

  const pv = V(0, 0, 0);
  function placeOverlays() {
    for (const o of ovs) {
      pv.copy(o.pos).project(camera);
      const x = (pv.x + 1) / 2 * vw, y = (1 - pv.y) / 2 * vh;
      const vis = pv.z < 1 && x > -200 && x < vw + 200 && y > -200 && y < vh + 200;
      o.el.style.left = x.toFixed(1) + 'px'; o.el.style.top = y.toFixed(1) + 'px';
      o.el.style.visibility = vis ? 'visible' : 'hidden';
    }
  }

  let fCur = 0, raf = 0, started = false;
  const targetF = () => (window.scrollY - machineTop) / secH;
  function frame() {
    const ft = targetF();
    const d = ft - fCur;
    fCur = REDUCE || SNAP || Math.abs(d) < 0.0005 ? ft : fCur + d * 0.12;
    const st = stateAt(fCur);
    placeCamera(st);
    placePill(st.s);
    let busy = fCur !== ft;
    for (const t of trig) {
      const target = st.s >= t.s ? 1 : 0;
      if (t.el) t.el.classList.toggle(t.cls || 'on', target === 1);
      if (Math.abs(target - t.v) > 0.003) { t.v += (target - t.v) * (REDUCE || SNAP ? 1 : 0.12); busy = true; } else t.v = target;
      if (t.set) t.set(t.v);
    }
    placeOverlays();
    if (machine.getBoundingClientRect().bottom > 0) renderer.render(scene, camera);
    return busy;
  }
  const loop = () => { raf = 0; if (frame()) raf = requestAnimationFrame(loop); };
  const kick = () => { if (started && !raf) raf = requestAnimationFrame(loop); };

  build();
  function init() { layout(); fCur = targetF(); started = true; kick(); }
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); kick(); }, 100); });
  window.addEventListener('scroll', () => { nav.classList.toggle('solid', window.scrollY > 40); kick(); }, { passive: true });
  nav.classList.toggle('solid', window.scrollY > 40);
  if (!REDUCE) { document.documentElement.classList.add('js-motion'); const mk = document.querySelector('.mark'); setTimeout(() => mk && mk.classList.add('on'), 200); }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(init);
  window.addEventListener('load', () => { layout(); kick(); });
  window.__pillDebug = () => ({ f: fCur, n: course.pts.length, win: course.win });
})();
