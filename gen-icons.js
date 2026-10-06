// 生成待办图标 PNG（512/192/180）——纯 Node 实现，无外部依赖
const zlib = require('zlib');
const fs = require('fs');

// ---------- PNG 编码 ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- 形状 SDF ----------
function sdRoundRect(px, py, cx, cy, hw, hh, rad) {
  const dx = Math.abs(px - cx) - (hw - rad);
  const dy = Math.abs(py - cy) - (hh - rad);
  const ox = Math.max(dx, 0), oy = Math.max(dy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(dx, dy), 0) - rad;
}
function sdSeg(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}
function cov(d) { return Math.max(0, Math.min(1, 0.5 - d)); }
function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }

function render(size) {
  const u = size / 512;
  const px = Buffer.alloc(size * size * 4);
  const rows = [
    { cy: 180, ring: hex('#22D3EE'), line: hex('#E6F1FF'), lw: 190, a: 1, checked: true },
    { cy: 300, ring: hex('#8CA3BF'), line: hex('#8CA3BF'), lw: 145, a: 0.55, checked: false },
    { cy: 420, ring: hex('#8CA3BF'), line: hex('#8CA3BF'), lw: 165, a: 0.32, checked: false },
  ];
  const RAD = 112, LW = 14, CR = 34;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const X = x / u, Y = y / u;
      const dBG = sdRoundRect(X, Y, 256, 256, 256, 256, RAD);
      const bgA = cov(dBG);
      if (bgA <= 0) continue;
      // 对角渐变背景
      const t = Math.max(0, Math.min(1, (X + Y) / 1024));
      const c0 = hex('#0E2A3F'), c1 = hex('#0B1220');
      let R = c0[0] + (c1[0] - c0[0]) * t;
      let G = c0[1] + (c1[1] - c0[1]) * t;
      let B = c0[2] + (c1[2] - c0[2]) * t;
      let A = bgA;
      for (const row of rows) {
        const cy = row.cy, cx = 128;
        // 圆环
        const dRing = Math.abs(Math.hypot(X - cx * u, Y - cy * u) - CR * u) - LW * u / 2;
        const aRing = cov(dRing);
        if (aRing > 0) {
          R = R * (1 - aRing) + row.ring[0] * aRing;
          G = G * (1 - aRing) + row.ring[1] * aRing;
          B = B * (1 - aRing) + row.ring[2] * aRing;
        }
        // 对勾（仅第一行）
        if (row.checked) {
          const dChk = Math.min(
            sdSeg(X, Y, 113 * u, 182 * u, 126 * u, 197 * u),
            sdSeg(X, Y, 126 * u, 197 * u, 149 * u, 166 * u)) - LW * u / 2;
          const aChk = cov(dChk);
          if (aChk > 0) {
            R = R * (1 - aChk) + row.ring[0] * aChk;
            G = G * (1 - aChk) + row.ring[1] * aChk;
            B = B * (1 - aChk) + row.ring[2] * aChk;
          }
        }
        // 任务条
        const dBar = sdRoundRect(X, Y, (190 + row.lw / 2) * u, cy * u, row.lw / 2 * u, 18 * u, 18 * u);
        const aBar = cov(dBar) * row.a;
        if (aBar > 0) {
          R = R * (1 - aBar) + row.line[0] * aBar;
          G = G * (1 - aBar) + row.line[1] * aBar;
          B = B * (1 - aBar) + row.line[2] * aBar;
        }
      }
      const i = (y * size + x) * 4;
      px[i] = R; px[i + 1] = G; px[i + 2] = B; px[i + 3] = Math.round(A * 255);
    }
  }
  return encodePNG(size, size, px);
}

for (const s of [512, 192, 180]) {
  fs.writeFileSync('icon-' + s + '.png', render(s));
  console.log('icon-' + s + '.png 写入完成');
}
