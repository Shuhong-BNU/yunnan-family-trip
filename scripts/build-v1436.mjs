import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

const VERSION = 'v14.3.6';
const VERSION_DIR = 'v1436';
const UPDATED_TEXT = '2026-07-29 09:19（UTC+8）';
const UPDATED_ISO = '2026-07-29T09:19:00+08:00';
const root = process.cwd();
const sourceDir = path.join(root, 'v1434');
const outputDir = path.join(root, VERSION_DIR);

function fail(message) { throw new Error(message); }
function replaceRequired(text, pattern, replacement, label) {
  const next = text.replace(pattern, replacement);
  if (next === text) fail(`Missing replacement target: ${label}`);
  return next;
}

const chunkFiles = fs.readdirSync(sourceDir)
  .filter((name) => /^chunk-\d+\.js$/.test(name))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
if (chunkFiles.length < 1) fail('No v1434 payload chunks found');

let payloadB64 = '';
for (const file of chunkFiles) {
  const source = fs.readFileSync(path.join(sourceDir, file), 'utf8');
  const matches = [...source.matchAll(/\+"([A-Za-z0-9+/=]+)"/g)];
  if (matches.length !== 1) fail(`Cannot parse exactly one payload segment from ${file}`);
  payloadB64 += matches[0][1];
}

let html = zlib.gunzipSync(Buffer.from(payloadB64, 'base64')).toString('utf8');
if (!html.includes('40-static-table-controls')) fail('Unexpected v1434 payload marker');

html = replaceRequired(
  html,
  /<meta content="云南旅行方案 v14\.3\.4，[^"]*" name="description"\/>/,
  `<meta content="云南旅行方案 ${VERSION}，GitHub Pages 直接发布完整静态 HTML；研究表格支持卡片与横向查看，更新时间 ${UPDATED_TEXT}。" name="description"/>`,
  'description',
);
html = replaceRequired(html, /<meta content="云南旅行方案 v14\.3(?:\.\d+)?" property="og:title"\/>/, `<meta content="云南旅行方案 ${VERSION}" property="og:title"/>`, 'og:title');
html = replaceRequired(html, /<title>[^<]*v14\.3\.4[^<]*<\/title>/, `<title>云南旅行方案 ${VERSION}</title>`, 'title');
html = replaceRequired(html, /<style id="static-mobile-tables-v1434">\s*\/\* v14\.3\.4:[^*]*\*\//, '<style id="static-mobile-tables-v1436">\n/* v14.3.6: direct static HTML, source-visible mobile table system */', 'table style marker');
html = replaceRequired(html, /<body(?: [^>]*)?>/, `<body data-release-updated="${UPDATED_ISO}" data-release-version="${VERSION}" data-release-mode="direct-static-html">`, 'body metadata');
html = replaceRequired(html, /<span><b>当前版本<\/b> · v14\.3\.4<\/span><span><b>最新版更新时间<\/b> · 2026-07-29 00:22（UTC\+8）<\/span>/, `<span><b>当前版本</b> · ${VERSION}</span><span><b>最新版更新时间</b> · ${UPDATED_TEXT}</span>`, 'visible version');
html = replaceRequired(html, /<span class="release-live"><b>发布状态<\/b> · [^<]*<\/span>/, '<span class="release-live"><b>发布状态</b> · GitHub Pages 直接静态版</span>', 'visible release mode');

const rounds = `<h4>第14.3.5轮（兼容加载尝试与问题澄清）</h4><ul class="tight"><li>曾将 GitHub Pages 缺少表格控件误判为移动浏览器兼容问题，先后尝试 DecompressionStream 与 pako/atob 浏览器端解压。</li><li>电脑和手机访问同一 Pages 链接都缺少控件，而本地完整 HTML 正常，证明核心问题是线上发布产物与本地成品不一致，不是某一种浏览器不支持。</li><li>v14.3.5 的 atob 编码错误进一步说明分块 Base64 资源发生缺失、截断或新旧混用；该发布架构停止使用。</li></ul><h4>第14.3.6轮（GitHub Pages 直接静态发布）</h4><ul class="tight"><li>由 GitHub Actions 在仓库端读取 v14.3.4 的 payload，并生成可直接由 GitHub Pages 返回的完整 index.html。</li><li>浏览器端不再执行 Base64 拼接、gzip 解压、DecompressionStream、pako、atob、eval 或 document.write；打开链接后直接解析完整正文。</li><li>40 个“卡片查看”按钮、40 个“横向表格”按钮、全部横向滑动提示和 data-label 字段标签均直接保存在最终 HTML。</li><li>根入口、版本清单、页面顶部、需求全景、版本演进和页脚统一指向 ${VERSION}；版本清单记录最终 HTML 的 SHA-256。</li></ul>\n`;
html = replaceRequired(html, '<h3>版本演进总览</h3>', rounds + '<h3>版本演进总览</h3>', 'requirements');

const row1434 = '<tr><td data-label="版本">v14.3.4</td><td data-label="产品重点">静态移动表格修复</td><td data-label="主要需求 / 提示词">40 个研究表格的查看按钮、卡片标签和横滑提示静态写入；使用完整单文件发布，消除线上补丁失效。</td></tr>';
const newRows = `${row1434}<tr><td data-label="版本">v14.3.5</td><td data-label="产品重点">兼容加载尝试</td><td data-label="主要需求 / 提示词">尝试浏览器端兼容解压；跨设备证据确认核心问题是 Pages 产物与本地成品不一致。</td></tr><tr><td data-label="版本">v14.3.6</td><td data-label="产品重点">直接静态发布</td><td data-label="主要需求 / 提示词">在仓库构建阶段生成完整 HTML，Pages 直接返回正文；浏览器不再承担分块、解压或运行时重建。</td></tr>`;
html = replaceRequired(html, row1434, newRows, 'version rows');
html = replaceRequired(html, /<footer>需求全景与版本演进更新至 v14\.3\.4[^<]*<\/footer>/, `<footer>需求全景与版本演进更新至 ${VERSION} · 主研究内容继承自 v13.0 · 最新版更新时间：${UPDATED_TEXT}</footer>`, 'footer');
html = replaceRequired(html, /<div class="source-note">研究资料继承自 v13；v14\.3\.4[^<]*<\/div>/, `<div class="source-note">研究资料继承自 v13；${VERSION} 由 GitHub Actions 生成直接静态 HTML，并保留全部移动表格控件与提示。</div>`, 'source note');
html = replaceRequired(html, /"meta": \{"version": "v14\.3\.4", "source_version": "v13\.0", "generated_at": "[^"]+"/, `"meta": {"version": "${VERSION}", "source_version": "v13.0", "generated_at": "2026-07-29 09:19 GMT+8"`, 'TRIP metadata');
html = replaceRequired(html, /<div data-updated="2026-07-29T00:22:00\+08:00" data-version="v14\.3\.4" hidden="hidden" id="release-diagnostic">[^<]*<\/div>/, `<div data-release-mode="direct-static-html" data-updated="${UPDATED_ISO}" data-version="${VERSION}" hidden="hidden" id="release-diagnostic">${VERSION}|${UPDATED_ISO}|40-static-table-controls|direct-static-html</div>`, 'diagnostic');

const checks = {
  researchTables: (html.match(/class="research-table-block/g) || []).length,
  cardButtons: (html.match(/>卡片查看<\/button>/g) || []).length,
  tableButtons: (html.match(/>横向表格<\/button>/g) || []).length,
  scrollHints: (html.match(/↔ 表格较宽，可左右滑动查看全部列/g) || []).length,
  dataLabels: (html.match(/data-label=/g) || []).length,
};
if (checks.researchTables !== 40 || checks.cardButtons !== 40 || checks.tableButtons !== 40 || checks.scrollHints < 40 || checks.dataLabels < 700) fail(`Static checks failed: ${JSON.stringify(checks)}`);
if (/window\.__tripB64|window\.__pakoB64|pako\.ungzip|\batob\s*\(|new\s+DecompressionStream\s*\(|document\.write\s*\(/.test(html)) fail('Browser-side reconstruction dependency remains');

const sha256 = crypto.createHash('sha256').update(html).digest('hex');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(outputDir, 'version.json'), JSON.stringify({ version: VERSION, updated_at: UPDATED_ISO, release_mode: 'github-actions-direct-static-html', source_payload: `../v1434/${chunkFiles.length} chunk files`, sha256, ...checks }, null, 2) + '\n');

const rootIndex = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"><title>云南旅行方案 · 最新版 ${VERSION}</title><meta http-equiv="refresh" content="0; url=./${VERSION_DIR}/"></head><body><h1>正在打开云南旅行方案 ${VERSION}</h1><p>最新版更新时间：${UPDATED_TEXT}</p><p><a href="./${VERSION_DIR}/">点击进入最新版</a></p><script>location.replace('./${VERSION_DIR}/?from=root&v=1436');</script></body></html>`;
fs.writeFileSync(path.join(root, 'index.html'), rootIndex, 'utf8');
fs.writeFileSync(path.join(root, 'version.json'), JSON.stringify({ latest: VERSION, updated_at: UPDATED_ISO, path: `./${VERSION_DIR}/`, release_mode: 'github-actions-direct-static-html', sha256, ...checks }, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'README.md'), `# 云南旅行方案 · ${VERSION}\n\n最新版更新时间：${UPDATED_TEXT}\n\n## 最新版\n\n\`https://shuhong-bnu.github.io/yunnan-family-trip/${VERSION_DIR}/\`\n\n根目录会自动跳转到上述版本地址。\n\n## ${VERSION} 更新\n\n- GitHub Actions 在仓库端生成完整静态 HTML；浏览器直接解析正文。\n- 不再使用 Base64、gzip、DecompressionStream、pako、atob、eval、document.write 或正文分块。\n- 40 个研究表格均保留“卡片查看 / 横向表格”按钮和左右滑动提示。\n- “需求全景”和版本演进如实补记 v14.3.5、v14.3.6。\n- 最终 HTML SHA-256：\`${sha256}\`。\n- 公开版继续移除姓名、关系称呼、年龄、明确人数和任务负责人信息。\n`, 'utf8');
console.log(JSON.stringify({ version: VERSION, updated: UPDATED_ISO, outputBytes: Buffer.byteLength(html), sha256, ...checks }, null, 2));
