// 同步更新 HTML 内联 SVG 标签图标（与 gen-icons.js 布局一致）
const fs = require('fs');
let h = fs.readFileSync('D:/AI用/Zcode/今日待办.html', 'utf8');
const svg = `<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%230E2A3F'/%3E%3Cstop offset='1' stop-color='%230B1220'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='512' height='512' rx='112' fill='url(%23g)'/%3E%3Cg fill='none' stroke-width='13' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='132' cy='156' r='30' stroke='%2322D3EE'/%3E%3Cpath d='M118 158l11 13 22-29' stroke='%2322D3EE'/%3E%3Ccircle cx='132' cy='256' r='30' stroke='%238CA3BF'/%3E%3Ccircle cx='132' cy='356' r='30' stroke='%238CA3BF'/%3E%3C/g%3E%3Crect x='188' y='139' width='178' height='34' rx='17' fill='%23E6F1FF'/%3E%3Crect x='188' y='239' width='140' height='34' rx='17' fill='%238CA3BF' opacity='.55'/%3E%3Crect x='188' y='339' width='158' height='34' rx='17' fill='%238CA3BF' opacity='.32'/%3E%3C/svg%3E">`;
if (/<link rel="icon" href="data:image\/svg\+xml,[^"]*">/.test(h)) {
  h = h.replace(/<link rel="icon" href="data:image\/svg\+xml,[^"]*">/, svg);
} else {
  h = h.replace('<link rel="manifest"', svg + '\n<link rel="manifest"');
}
fs.writeFileSync('D:/AI用/Zcode/今日待办.html', h);
console.log('favicon updated');
