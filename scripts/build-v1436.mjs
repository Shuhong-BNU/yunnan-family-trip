import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

const VERSION = 'v14.3.6';
const VERSION_DIR = 'v1436';
const UPDATED_TEXT = '2026-07-29 09:19（UTC+8）';
const UPDATED_ISO = '2026-07-29T09:19:00+08:00';
const EXPECTED_SHA256 = 'a8ecc4b3d7a420481e90b7537ba5c46eb8d1d21d5558105045c777ac4cb3947a';
const EXPECTED_BASE64_LENGTH = 77420;
const EXPECTED_SEGMENTS = 20;

const root = process.cwd();
const sourceDir = path.join(root, 'v1436_fixed_payload');
const outputDir = path.join(root, VERSION_DIR);
const payloadFiles = [
  'chunk-01.js',
  'chunk-02.js',
  'chunk-03.js',
  'chunk-04.js',
  'chunk-05.js',
  'bundle-06-08.js',
  'bundle-09-12.js',
  'bundle-13-16.js',
  'bundle-17-20.js',
];

function fail(message) {
  throw new Error(message);
}

let payloadB64 = '';
let segmentCount = 0;
for (const file of payloadFiles) {
  const filePath = path.join(sourceDir, file);
  if (!fs.existsSync(filePath)) fail(`Missing verified payload file: ${file}`);
  const source = fs.readFileSync(filePath, 'utf8');
  const matches = [...source.matchAll(/\+\s*"([A-Za-z0-9+/=]+)"/g)];
  if (matches.length < 1) fail(`No payload segments found in ${file}`);
  for (const match of matches) {
    payloadB64 += match[1];
    segmentCount += 1;
  }
}

if (segmentCount !== EXPECTED_SEGMENTS) {
  fail(`Payload segment count mismatch: expected ${EXPECTED_SEGMENTS}, got ${segmentCount}`);
}
if (payloadB64.length !== EXPECTED_BASE64_LENGTH) {
  fail(`Payload Base64 length mismatch: expected ${EXPECTED_BASE64_LENGTH}, got ${payloadB64.length}`);
}
if (!payloadB64.startsWith('H4sI')) fail('Verified payload is not a gzip Base64 stream');

const htmlBuffer = zlib.gunzipSync(Buffer.from(payloadB64, 'base64'));
const html = htmlBuffer.toString('utf8');
const sha256 = crypto.createHash('sha256').update(htmlBuffer).digest('hex');
if (sha256 !== EXPECTED_SHA256) {
  fail(`HTML SHA-256 mismatch: expected ${EXPECTED_SHA256}, got ${sha256}`);
}

const checks = {
  outputBytes: htmlBuffer.length,
  researchTables: (html.match(/class="research-table-block/g) || []).length,
  cardButtons: (html.match(/>卡片查看<\/button>/g) || []).length,
  tableButtons: (html.match(/>横向表格<\/button>/g) || []).length,
  scrollHints: (html.match(/↔ 表格较宽，可左右滑动查看全部列/g) || []).length,
  dataLabels: (html.match(/data-label=/g) || []).length,
};

if (
  checks.outputBytes !== 244983 ||
  checks.researchTables !== 40 ||
  checks.cardButtons !== 40 ||
  checks.tableButtons !== 40 ||
  checks.scrollHints < 40 ||
  checks.dataLabels < 700
) {
  fail(`Static HTML checks failed: ${JSON.stringify(checks)}`);
}
if (!html.includes('v14.3.6') || !html.includes(UPDATED_TEXT)) {
  fail('Visible version metadata is missing from the final HTML');
}
if (/window\.__tripB64|window\.__pakoB64|pako\.ungzip|\batob\s*\(|new\s+DecompressionStream\s*\(|document\.write\s*\(/.test(html)) {
  fail('Browser-side reconstruction dependency remains in final HTML');
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'index.html'), htmlBuffer);

const releaseManifest = {
  version: VERSION,
  updated_at: UPDATED_ISO,
  release_mode: 'github-actions-direct-static-html',
  source_payload: 'v1436_fixed_payload / 20 verified segments',
  sha256,
  ...checks,
};
fs.writeFileSync(
  path.join(outputDir, 'version.json'),
  `${JSON.stringify(releaseManifest, null, 2)}\n`,
  'utf8',
);

const rootIndex = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"><title>云南旅行方案 · 最新版 ${VERSION}</title><meta http-equiv="refresh" content="0; url=./${VERSION_DIR}/"></head><body><h1>正在打开云南旅行方案 ${VERSION}</h1><p>最新版更新时间：${UPDATED_TEXT}</p><p><a href="./${VERSION_DIR}/">点击进入最新版</a></p><script>location.replace('./${VERSION_DIR}/?from=root&v=1436');</script></body></html>`;
fs.writeFileSync(path.join(root, 'index.html'), rootIndex, 'utf8');
fs.writeFileSync(
  path.join(root, 'version.json'),
  `${JSON.stringify({ latest: VERSION, updated_at: UPDATED_ISO, path: `./${VERSION_DIR}/`, release_mode: 'github-actions-direct-static-html', sha256, ...checks }, null, 2)}\n`,
  'utf8',
);
fs.writeFileSync(
  path.join(root, 'README.md'),
  `# 云南旅行方案 · ${VERSION}\n\n最新版更新时间：${UPDATED_TEXT}\n\n## 最新版\n\n\`https://shuhong-bnu.github.io/yunnan-family-trip/${VERSION_DIR}/\`\n\n根目录会自动跳转到上述版本地址。\n\n## ${VERSION} 更新\n\n- GitHub Actions 仅在仓库端还原并校验完整 HTML，GitHub Pages 直接返回普通静态网页。\n- 浏览器端不再使用 Base64、gzip、DecompressionStream、pako、atob、eval、document.write 或正文分块。\n- 40 个研究表格均直接包含“卡片查看 / 横向表格”按钮和左右滑动提示。\n- 最终 HTML SHA-256：\`${sha256}\`。\n- 公开版继续移除姓名、关系称呼、年龄、明确人数和任务负责人信息。\n`,
  'utf8',
);

console.log(JSON.stringify({ version: VERSION, updated: UPDATED_ISO, segmentCount, base64Length: payloadB64.length, sha256, ...checks }, null, 2));
