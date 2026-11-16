"use client";

import { useEffect, useRef } from "react";

type Polygon = ReadonlyArray<readonly [number, number]>; // [lon, lat]

/**
 * Simplified Natural-Earth-style continent & major island polygons ([lon, lat]).
 * Used to synthesize a crisp monochrome satellite + city-lights equirectangular
 * texture locally with zero external network requests.
 */
const LAND_POLYGONS: readonly Polygon[] = [
  // North America & Central America
  [
    [-168, 65], [-164, 68], [-156, 71], [-141, 70], [-130, 70], [-120, 69],
    [-110, 71], [-95, 70], [-82, 69], [-78, 63], [-85, 62], [-92, 58],
    [-88, 54], [-80, 52], [-79, 55], [-76, 61], [-65, 60], [-56, 53],
    [-60, 47], [-66, 45], [-70, 42], [-74, 40], [-76, 35], [-81, 31],
    [-80, 25], [-82, 26], [-84, 30], [-90, 29], [-97, 26], [-96, 19],
    [-90, 21], [-87, 21], [-88, 16], [-83, 15], [-83, 10], [-78, 8],
    [-80, 7], [-85, 10], [-92, 14], [-105, 20], [-110, 24], [-114, 31],
    [-117, 32], [-122, 37], [-124, 42], [-124, 48], [-130, 54], [-138, 59],
    [-150, 60], [-160, 56], [-166, 60],
  ],
  // Greenland
  [
    [-72, 77], [-60, 81], [-35, 83], [-18, 81], [-19, 74], [-25, 70],
    [-38, 65], [-44, 60], [-52, 64], [-55, 70], [-66, 74],
  ],
  // Cuba & Hispaniola
  [[-85, 22], [-78, 22], [-74, 20], [-77, 19], [-83, 21]],
  [[-74, 19], [-68, 18], [-69, 19], [-73, 20]],
  // South America
  [
    [-78, 9], [-74, 11], [-68, 11], [-62, 10], [-54, 6], [-50, 1],
    [-44, -2], [-35, -6], [-38, -13], [-40, -21], [-47, -25], [-52, -33],
    [-58, -38], [-65, -43], [-68, -50], [-67, -55], [-73, -54], [-75, -47],
    [-73, -38], [-71, -30], [-70, -18], [-77, -12], [-81, -5], [-79, 2],
  ],
  // Great Britain & Ireland
  [[-5, 50], [-5, 55], [-6, 58], [-2, 58], [1, 53], [1, 51], [-2, 50]],
  [[-10, 52], [-10, 55], [-6, 55], [-6, 52]],
  // Iceland
  [[-24, 65], [-18, 66], [-14, 65], [-18, 63], [-23, 64]],
  // Europe + Asia (Eurasia)
  [
    [-9, 37], [-9, 43], [-2, 43], [-4, 48], [2, 51], [8, 54], [8, 57],
    [10, 58], [5, 61], [12, 66], [20, 70], [30, 71], [42, 67], [46, 68],
    [60, 70], [72, 73], [90, 76], [112, 74], [135, 72], [162, 70], [178, 66],
    [164, 60], [156, 51], [142, 54], [138, 45], [132, 43], [129, 36],
    [126, 35], [124, 39], [120, 39], [122, 31], [118, 24], [110, 20],
    [106, 10], [103, 2], [100, 6], [98, 15], [91, 22], [85, 20],
    [80, 12], [77, 8], [72, 20], [67, 24], [58, 25], [56, 22],
    [52, 16], [44, 13], [40, 20], [35, 29], [32, 31], [35, 36],
    [27, 36], [26, 41], [30, 42], [29, 46], [36, 46], [38, 44],
    [32, 41], [23, 40], [23, 37], [19, 40], [14, 45], [16, 40],
    [12, 41], [9, 44], [3, 43], [-1, 38], [-5, 36],
  ],
  // Africa
  [
    [-17, 15], [-16, 21], [-10, 31], [-6, 36], [4, 37], [11, 37],
    [15, 32], [25, 32], [32, 31], [35, 26], [42, 12], [51, 12],
    [45, 2], [40, -10], [35, -20], [32, -28], [26, -34], [18, -34],
    [14, -22], [12, -12], [9, 4], [2, 6], [-8, 5], [-15, 11],
  ],
  // Madagascar
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
  // Japan
  [[130, 31], [134, 34], [140, 36], [142, 41], [145, 44], [141, 45], [139, 39], [132, 34]],
  // Taiwan & Philippines
  [[120, 22], [122, 25], [121, 25], [120, 23]],
  [[120, 14], [122, 18], [126, 8], [122, 6], [120, 11]],
  // Sumatra, Java, Borneo, Sulawesi, New Guinea
  [[95, 5], [100, 2], [105, -5], [102, -6], [96, 2]],
  [[105, -6], [114, -8], [114, -7], [106, -6]],
  [[109, 1], [117, 6], [118, 1], [115, -3], [110, -2]],
  [[119, -5], [125, 1], [122, -2], [120, -5]],
  [[131, -2], [141, -3], [150, -10], [143, -9], [135, -5]],
  // Australia & Tasmania
  [
    [114, -22], [122, -17], [130, -12], [136, -12], [141, -17], [142, -11],
    [146, -18], [153, -27], [150, -37], [142, -38], [136, -34], [129, -32],
    [118, -35], [115, -34], [113, -27],
  ],
  [[144, -41], [148, -41], [147, -43], [145, -43]],
  // New Zealand
  [[172, -35], [178, -38], [174, -41], [172, -41]],
  [[167, -46], [173, -43], [171, -41], [166, -45]],
  // Antarctica rim
  [
    [-180, -72], [-135, -74], [-90, -73], [-60, -64], [-40, -75],
    [0, -70], [45, -68], [90, -67], [135, -67], [170, -72], [180, -72],
    [180, -90], [-180, -90],
  ],
];

// Major metro hubs [lon, lat, radiusDeg, intensity]
const METRO_HUBS: ReadonlyArray<readonly [number, number, number, number]> = [
  [-74.0, 40.7, 5.0, 1.0],   // New York / Northeast
  [-87.6, 41.8, 4.5, 0.9],   // Chicago / Midwest
  [-118.2, 34.0, 4.0, 0.9],  // Los Angeles
  [-122.4, 37.7, 3.0, 0.8],  // San Francisco
  [-95.3, 29.7, 3.8, 0.8],   // Texas
  [-80.2, 25.7, 3.0, 0.75],  // Florida
  [-99.1, 19.4, 3.5, 0.9],   // Mexico City
  [-74.1, 4.7, 2.8, 0.7],    // Bogota
  [-46.6, -23.5, 4.2, 0.95], // Sao Paulo / Rio
  [-58.4, -34.6, 3.2, 0.85], // Buenos Aires
  [-70.6, -33.4, 2.5, 0.7],  // Santiago
  [-0.1, 51.5, 4.5, 1.0],    // London / UK
  [2.3, 48.8, 5.2, 1.0],     // Paris / Benelux
  [-3.7, 40.4, 3.6, 0.85],   // Madrid / Iberia
  [12.5, 41.9, 4.2, 0.95],   // Italy
  [13.4, 52.5, 4.8, 0.9],    // Germany / Central EU
  [21.0, 52.2, 4.0, 0.8],    // Poland / Eastern EU
  [37.6, 55.7, 4.5, 0.9],    // Moscow
  [28.9, 41.0, 3.8, 0.9],    // Istanbul
  [31.2, 30.0, 4.0, 1.0],    // Cairo / Nile
  [3.4, 6.5, 3.6, 0.85],     // West Africa / Lagos
  [28.0, -26.2, 3.2, 0.85],  // Johannesburg
  [55.3, 25.2, 4.2, 0.95],   // Dubai / Gulf
  [46.7, 24.7, 3.5, 0.8],    // Riyadh
  [72.8, 19.0, 5.5, 0.95],   // Mumbai / West India
  [77.2, 28.6, 6.5, 1.0],    // Delhi / North India
  [80.2, 13.0, 4.5, 0.85],   // South India
  [100.5, 13.7, 3.8, 0.85],  // Bangkok
  [103.8, 1.3, 3.2, 0.9],    // Singapore / Malaysia
  [106.8, -6.2, 4.0, 0.9],   // Java
  [116.4, 39.9, 6.5, 1.0],   // Beijing / North China
  [121.4, 31.2, 6.2, 1.0],   // Shanghai / East China
  [113.2, 23.1, 5.2, 1.0],   // Pearl River Delta
  [127.0, 37.5, 3.5, 0.95],  // Seoul
  [139.7, 35.7, 4.5, 1.0],   // Tokyo / Japan
  [151.2, -33.8, 3.0, 0.8],  // Sydney
  [144.9, -37.8, 2.5, 0.75], // Melbourne
];

function createSeededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hash2D(ix: number, iy: number): number {
  const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2D(ix, iy);
  const b = hash2D(ix + 1, iy);
  const c = hash2D(ix, iy + 1);
  const d = hash2D(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number): number {
  let v = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    v += amp * valueNoise(x * freq, y * freq);
    freq *= 2.05;
    amp *= 0.5;
  }
  return v;
}

/**
 * Generates an equirectangular monochrome satellite + city-lights texture.
 */
function buildEarthTextureCanvas(width = 1600, height = 800): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const lonToX = (lon: number) => ((lon + 180) / 360) * width;
  const latToY = (lat: number) => ((90 - lat) / 180) * height;

  // 1. Land mask on separate canvas
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const mctx = maskCanvas.getContext("2d");
  if (!mctx) return canvas;

  mctx.fillStyle = "#000000";
  mctx.fillRect(0, 0, width, height);
  mctx.fillStyle = "#ffffff";

  for (const poly of LAND_POLYGONS) {
    mctx.beginPath();
    poly.forEach(([lon, lat], idx) => {
      const x = lonToX(lon);
      const y = latToY(lat);
      if (idx === 0) mctx.moveTo(x, y);
      else mctx.lineTo(x, y);
    });
    mctx.closePath();
    mctx.fill();
  }

  const maskData = mctx.getImageData(0, 0, width, height).data;
  const img = ctx.createImageData(width, height);
  const data = img.data;

  // 2. Render deep obsidian oceans + luminous white topographic continents
  for (let y = 0; y < height; y++) {
    const latNorm = (y / height) * 180 - 90;
    const isPolar = Math.abs(latNorm) > 68;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const nx = (x / width) * 18;
      const ny = (y / height) * 9;
      const n = fbm(nx, ny);
      const detail = valueNoise(nx * 5.2, ny * 5.2);

      // Slightly perturb coastline threshold for organic satellite jaggedness
      const maskVal = maskData[idx];
      const coastOffset = (detail - 0.5) * 68;
      const isLand = maskVal + coastOffset > 128;

      if (isLand) {
        const base = isPolar
          ? Math.min(255, 215 + n * 35)
          : Math.min(255, 185 + n * 48 + detail * 22);
        data[idx] = base;
        data[idx + 1] = Math.min(255, base + 2);
        data[idx + 2] = Math.min(255, base + 4);
        data[idx + 3] = 255;
      } else {
        const ocean = 4 + n * 5;
        data[idx] = ocean;
        data[idx + 1] = ocean;
        data[idx + 2] = ocean + 2;
        data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(img, 0, 0);

  // 3. Soft white coastal glow halo + crisp glowing white coastline outlines
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.shadowColor = "rgba(255, 255, 255, 0.98)";
  ctx.shadowBlur = 16;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
  ctx.lineWidth = 2.2;
  for (const poly of LAND_POLYGONS) {
    ctx.beginPath();
    poly.forEach(([lon, lat], idx) => {
      const x = lonToX(lon);
      const y = latToY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }

  ctx.shadowBlur = 6;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.96)";
  ctx.lineWidth = 1.2;
  for (const poly of LAND_POLYGONS) {
    ctx.beginPath();
    poly.forEach(([lon, lat], idx) => {
      const x = lonToX(lon);
      const y = latToY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();

  // Helper to check whether (x, y) is on land (non-polar)
  const isPopulatedLand = (x: number, y: number) => {
    const ix = Math.max(0, Math.min(width - 1, Math.round(x)));
    const iy = Math.max(0, Math.min(height - 1, Math.round(y)));
    const lat = 90 - (iy / height) * 180;
    if (lat < -56 || lat > 64) return false;
    return maskData[(iy * width + ix) * 4] > 128;
  };

  const rand = createSeededRandom(42197);

  // 4. City lights & urban corridors (monochrome glowing white/silver)
  for (const [lon, lat, radDeg, intensity] of METRO_HUBS) {
    const cx = lonToX(lon);
    const cy = latToY(lat);
    const radPx = (radDeg / 360) * width;

    // Soft urban glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radPx * 0.9);
    grad.addColorStop(0, `rgba(255, 255, 255, ${0.45 * intensity})`);
    grad.addColorStop(0.35, `rgba(225, 230, 238, ${0.18 * intensity})`);
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radPx * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Cluster of fine pinpoint lights around hub
    const count = Math.floor(65 * intensity);
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = Math.pow(rand(), 1.4) * radPx;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      if (!isPopulatedLand(px, py)) continue;
      const size = 0.6 + rand() * 1.4;
      const alpha = (0.35 + rand() * 0.65) * intensity;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
      ctx.fillRect(px, py, size, size);
    }
  }

  // Scattered regional towns & coastal settlements
  for (let i = 0; i < 6500; i++) {
    const x = rand() * width;
    const y = (0.14 + rand() * 0.68) * height;
    if (!isPopulatedLand(x, y)) continue;
    const size = rand() > 0.85 ? 1.4 : 0.8;
    const alpha = 0.14 + rand() * 0.42;
    ctx.fillStyle = `rgba(240, 244, 248, ${alpha.toFixed(2)})`;
    ctx.fillRect(x, y, size, size);
  }

  // 5. Subtle faint atmospheric / satellite arc streaks like reference
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(width * 0.15, height * 0.72);
  ctx.quadraticCurveTo(width * 0.52, height * 0.42, width * 0.88, height * 0.2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(width * 0.05, height * 0.28);
  ctx.quadraticCurveTo(width * 0.48, height * 0.52, width * 0.95, height * 0.76);
  ctx.stroke();
  ctx.restore();

  return canvas;
}

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform float uTime;

  const float PI = 3.14159265359;

  mat3 rotateX(float a) {
    float c = cos(a), s = sin(a);
    return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
  }

  mat3 rotateZ(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    // Normalized coordinates where y in [-1, 1] and x in [-aspect, aspect]
    vec2 p = (vUv * 2.0 - 1.0) * vec2(aspect, 1.0);

    // Large sphere centered below the viewport so its horizon rises behind the card
    float radius = mix(0.95, 1.48, clamp((aspect - 0.55) / 1.0, 0.0, 1.0));
    vec2 center = vec2(0.0, 0.02 - radius);

    vec2 d = p - center;
    float distSq = dot(d, d);
    float rSq = radius * radius;
    float dist = sqrt(distSq);

    // Outer atmospheric rim halo outside the globe
    if (distSq > rSq) {
      float edgeDist = dist - radius;
      float halo = exp(-edgeDist * 26.0) * 0.34;
      float softShadow = exp(-edgeDist * 8.0) * 0.14;
      vec3 haloColor = mix(vec3(0.06), vec3(0.82, 0.83, 0.82), halo * 2.2);
      float alpha = clamp(halo + softShadow, 0.0, 1.0);
      gl_FragColor = vec4(haloColor, alpha);
      return;
    }

    // Sphere surface normal in view space
    float z = sqrt(max(rSq - distSq, 0.0));
    vec3 normal = normalize(vec3(d.x, d.y, z));

    // Tilt Earth axis slightly toward the viewer for a dramatic orbital horizon
    vec3 nTilted = rotateZ(0.14) * rotateX(0.32) * normal;

    // Equirectangular UV mapping + slow continuous rotation
    float lon = atan(nTilted.x, nTilted.z) - 0.42 + uTime * 0.012;
    float lat = asin(clamp(nTilted.y, -1.0, 1.0));

    vec2 texUv = vec2(
      fract(lon / (2.0 * PI) + 0.5),
      0.5 - lat / PI
    );

    vec3 texColor = texture2D(uTexture, texUv).rgb;
    float lum = dot(texColor, vec3(0.299, 0.587, 0.114));

    // Directional top-back sun/sky illumination + Fresnel limb glow
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 lightDir = normalize(vec3(-0.32, 0.85, 0.42));
    float diff = max(dot(normal, lightDir), 0.0);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.4);

    // Keep oceans obsidian while making continents glow brightly in white
    vec3 continentGlow = vec3(1.0) * smoothstep(0.42, 0.92, lum) * 0.34;
    vec3 lit = texColor * (0.86 + 0.34 * diff) + continentGlow;
    lit += vec3(0.78, 0.80, 0.82) * fresnel * 0.55;

    // Subtle anti-aliased horizon edge blend
    float aa = smoothstep(radius, radius - 0.008, dist);
    gl_FragColor = vec4(lit, aa);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function RotatingEarth() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const textureCanvas = buildEarthTextureCanvas(1600, 800);

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });

    if (!gl) {
      // Fallback 2D canvas projection if WebGL is unavailable
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;

      let raf = 0;
      const start = performance.now();

      const draw2d = (now: number) => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
          canvas.width = Math.floor(w * dpr);
          canvas.height = Math.floor(h * dpr);
        }
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx2d.clearRect(0, 0, w, h);

        const r = Math.max(w * 0.58, h * 0.72);
        const cx = w * 0.5;
        const cy = h * 0.51 + r;

        ctx2d.save();
        ctx2d.beginPath();
        ctx2d.arc(cx, cy, r, 0, Math.PI * 2);
        ctx2d.clip();

        ctx2d.fillStyle = "#08090b";
        ctx2d.fillRect(0, 0, w, h);

        const elapsed = prefersReducedMotion ? 0 : (now - start) / 1000;
        const scrollX = ((elapsed * 5) % textureCanvas.width);
        const drawW = r * 2.4;
        const drawH = drawW * 0.5;
        const offset = ((scrollX / textureCanvas.width) * drawW) % drawW;
        ctx2d.drawImage(textureCanvas, cx - drawW + offset, cy - r, drawW, drawH);
        ctx2d.drawImage(textureCanvas, cx + offset, cy - r, drawW, drawH);

        const limb = ctx2d.createRadialGradient(cx, cy, r * 0.75, cx, cy, r);
        limb.addColorStop(0, "rgba(0,0,0,0)");
        limb.addColorStop(0.85, "rgba(180,185,190,0.12)");
        limb.addColorStop(1, "rgba(220,225,230,0.45)");
        ctx2d.fillStyle = limb;
        ctx2d.fillRect(0, 0, w, h);
        ctx2d.restore();

        if (!prefersReducedMotion) raf = requestAnimationFrame(draw2d);
      };

      raf = requestAnimationFrame(draw2d);
      return () => cancelAnimationFrame(raf);
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    // Full-screen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const aPos = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Upload Earth texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureCanvas);

    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uTime = gl.getUniformLocation(program, "uTime");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.floor(window.innerWidth * dpr);
      const height = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    let rafId = 0;
    const startTime = performance.now();

    const render = (now: number) => {
      resize();
      const elapsed = prefersReducedMotion ? 0 : (now - startTime) / 1000;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(render);
      }
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] h-full w-full"
    />
  );
}
