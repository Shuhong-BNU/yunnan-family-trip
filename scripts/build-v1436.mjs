import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const VERSION = 'v14.3.6';
const VERSION_DIR = 'v1436';
const UPDATED_TEXT = '2026-07-29 01:20（UTC+8）';
const UPDATED_ISO = '2026-07-29T01:20:00+08:00';
const root = process.cwd();
const sourceDir = path.join(root, 'v1434');
const outputDir = path.join(root, VERSION_DIR);

function fail(message) { throw new Error(message); }
function replaceOnce(text, needle, replacement, label = needle) {
  const index = text.indexOf(needle);
  if (index < 0) fail(`Missing replacement target: ${label}`);
  return text.slice(0, index) + replacement + text.slice(index + needle.length);
}

const chunkFiles = fs.readdirSync(sourceDir).filter((name) => /^chunk-\d+\.js$/.test(name)).sort();
if (chunkFiles.length < 1) fail('No v1434 payload chunks found');
let payloadB64 = '';
for (const file of chunkFiles) {
  const source = fs.readFileSync(path.join(sourceDir, file), 'utf8');
  const match = source.match(/\+"([A-Za-z0-9+/=]+)"/);
  if (!match) fail(`Cannot parse payload from ${file}`);
  payloadB64 += match[1];
}

let html = zlib.gunzipSync(Buffer.from(payloadB64, 'base64')).toString('utf8');
if (!html.includes('v14.3.4') || !html.includes('40-static-table-controls')) fail('Unexpected v1434 payload');

html = replaceOnce(html, '云南旅行方案 v14.3.4，手机端研究表格静态卡片化，更新时间 2026-07-29 00:22（UTC+8）。', `云南旅行方案 ${VERSION}，直接静态 HTML 发布，兼容移动 Safari 与微信内置浏览器，更新时间 ${UPDATED_TEXT}。`, 'description');
html = replaceOnce(html, '<meta content="云南旅行方案 v14.3.3" property="og:title"/>', `<meta content="云南旅行方案 ${VERSION}" property="og:title"/>`, 'og:title');
html = replaceOnce(html, '<title>云南旅行 v14.3.4 · 静态移动表格修复版（2026.08.21–08.27）</title>', `<title>云南旅行 ${VERSION} · 直接静态兼容版（2026.08.21–08.27）</title>`, 'title');
html = replaceOnce(html, '<style id="static-mobile-tables-v1434">\n/* v14.3.4: static, source-visible mobile table system */', '<style id="static-mobile-tables-v1436">\n/* v14.3.6: direct static HTML, source-visible mobile table system */', 'table style marker');
html = replaceOnce(html, '<body data-release-updated="2026-07-29T00:08:00+08:00" data-release-version="v14.3.3">', `<body data-release-updated="${UPDATED_ISO}" data-release-version="${VERSION}">`, 'body metadata');
html = replaceOnce(html, '<span><b>当前版本</b> · v14.3.4</span><span><b>最新版更新时间</b> · 2026-07-29 00:22（UTC+8）</span>', `<span><b>当前版本</b> · ${VERSION}</span><span><b>最新版更新时间</b> · ${UPDATED_TEXT}</span>`, 'visible version');

const rounds = `<h4>第14.3.5轮（移动浏览器兼容尝试）</h4><ul class="tight"><li>确认 v14.3.4 正文已静态包含 40 组表格按钮和提示，但 Pages 入口仍依赖 DecompressionStream，部分 Safari 与微信内置浏览器在正文执行前直接加载失败。</li><li>尝试使用仓库内嵌 pako 兼容解压替代 DecompressionStream；该方案作为过渡性排障记录保留，不再作为最新版发布架构。</li></ul><h4>第14.3.6轮（直接静态 HTML 发布）</h4><ul class="tight"><li>由 GitHub Actions 在仓库端读取 v14.3.4 的 payload 分块并完成 gzip 解压，生成可直接由 GitHub Pages 返回的完整 index.html。</li><li>浏览器端不再执行 DecompressionStream、pako、Base64 拼接或 document.write 解压流程；打开链接后直接加载完整正文。</li><li>40 个“卡片查看 / 横向表格”控件、40 个左右滑动提示和全部 data-label 字段标签继续静态保留。</li><li>使用独立 /v1436/ 地址；根入口、版本清单、页面顶部、需求全景、版本演进和页脚同步更新。</li></ul>\n`;
html = replaceOnce(html, '<h3>版本演进总览</h3>', rounds + '<h3>版本演进总览</h3>', 'requirements');

const row1434 = '<tr><td data-label="版本">v14.3.4</td><td data-label="产品重点">静态移动表格修复</td><td data-label="主要需求 / 提示词">40 个研究表格的查看按钮、卡片标签和横滑提示静态写入；使用完整单文件发布，消除线上补丁失效。</td></tr>';
const newRows = `${row1434}<tr><td data-label="版本">v14.3.5</td><td data-label="产品重点">兼容解压尝试</td><td data-label="主要需求 / 提示词">用内嵌 pako 替代 DecompressionStream，记录移动浏览器加载失败的根因与过渡修复。</td></tr><tr><td data-label="版本">v14.3.6</td><td data-label="产品重点">直接静态发布</td><td data-label="主要需求 / 提示词">在 GitHub Actions 构建阶段完成解压，Pages 直接返回完整 HTML；浏览器不再承担解压和拼装。</td></tr>`;
html = replaceOnce(html, row1434, newRows, 'version rows');
html = replaceOnce(html, '<footer>需求全景与版本演进更新至 v14.3.4 · 主研究内容继承自 v13.0 · 最新版更新时间：2026-07-29 00:22（UTC+8）</footer>', `<footer>需求全景与版本演进更新至 ${VERSION} · 主研究内容继承自 v13.0 · 最新版更新时间：${UPDATED_TEXT}</footer>`, 'footer');
html = replaceOnce(html, '<div class="source-note">研究资料继承自 v13；v14.3.4 将所有研究表格的手机卡片、横向表格按钮和滑动提示静态写入完整页面。</div>', `<div class="source-note">研究资料继承自 v13；${VERSION} 由 GitHub Actions 生成直接静态 HTML，并保留全部移动表格控件与提示。</div>`, 'source note');
html = replaceOnce(html, '"meta": {"version": "v14.3.4", "source_version": "v13.0", "generated_at": "2026-07-29 00:22 GMT+8"', `"meta": {"version": "${VERSION}", "source_version": "v13.0", "generated_at": "2026-07-29 01:20 GMT+8"`, 'TRIP metadata');
html = replaceOnce(html, '<div data-updated="2026-07-29T00:22:00+08:00" data-version="v14.3.4" hidden="hidden" id="release-diagnostic">v14.3.4|2026-07-29T00:22:00+08:00|40-static-table-controls|single-file-release</div>', `<div data-updated="${UPDATED_ISO}" data-version="${VERSION}" hidden="hidden" id="release-diagnostic">${VERSION}|${UPDATED_ISO}|40-static-table-controls|direct-static-pages-release</div>`, 'diagnostic');

const checks = {
  researchTables: (html.match(/class="research-table-block/g) || []).length,
  cardButtons: (html.match(/>卡片查看<\/button>/g) || []).length,
  tableButtons: (html.match(/>横向表格<\/button>/g) || []).length,
  scrollHints: (html.match(/↔ 表格较宽，可左右滑动查看全部列/g) || []).length,
  dataLabels: (html.match(/data-label=/g) || []).length,
};
if (checks.researchTables !== 40 || checks.cardButtons !== 40 || checks.tableButtons !== 40 || checks.scrollHints < 40 || checks.dataLabels < 700) fail(`Static checks failed: ${JSON.stringify(checks)}`);
if (/window\.__tripB64|window\.__pakoB64|pako\.ungzip/.test(html)) fail('Browser decompression dependency remains');

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(outputDir, 'version.json'), JSON.stringify({ version: VERSION, updated_at: UPDATED_ISO, release_mode: 'github-actions-direct-static-html', source_payload: `../v1434/${chunkFiles.length} chunk files`, ...checks }, null, 2) + '\n');

const rootIndex = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"><title>云南旅行方案 · 最新版 ${VERSION}</title><meta http-equiv="refresh" content="0; url=./${VERSION_DIR}/"></head><body><h1>正在打开云南旅行方案 ${VERSION}</h1><p>最新版更新时间：${UPDATED_TEXT}</p><p><a href="./${VERSION_DIR}/">点击进入最新版</a></p><script>location.replace('./${VERSION_DIR}/?from=root&v=1436');</script></body></html>`;
fs.writeFileSync(path.join(root, 'index.html'), rootIndex, 'utf8');
fs.writeFileSync(path.join(root, 'version.json'), JSON.stringify({ latest: VERSION, updated_at: UPDATED_ISO, path: `./${VERSION_DIR}/`, release_mode: 'github-actions-direct-static-html', ...checks }, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'README.md'), `# 云南旅行方案 · ${VERSION}\n\n最新版更新时间：${UPDATED_TEXT}\n\n## 最新版\n\n\`https://shuhong-bnu.github.io/yunnan-family-trip/${VERSION_DIR}/\`\n\n根目录会自动跳转到上述版本地址。\n\n## ${VERSION} 更新\n\n- GitHub Actions 在仓库端完成 payload 解压，生成直接静态 HTML。\n- 手机 Safari、微信内置浏览器不再需要 \`DecompressionStream\` 或 pako。\n- 40 个研究表格均保留“卡片查看 / 横向表格”按钮和左右滑动提示。\n- “需求全景”和版本演进补记 v14.3.5、v14.3.6。\n- 公开版继续移除姓名、关系称呼、年龄、明确人数和任务负责人信息。\n`, 'utf8');
console.log(JSON.stringify({ version: VERSION, updated: UPDATED_ISO, outputBytes: Buffer.byteLength(html), ...checks }, null, 2));
