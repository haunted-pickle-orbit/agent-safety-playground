import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { lessons } from '../src/lessons.js';
import { validateLesson } from '../src/engine.js';

const escapeHtml = value => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const engine = (await readFile('src/engine.js', 'utf8')).replaceAll('export function', 'function');
const client = await readFile('scripts/offline-client.js', 'utf8');
await mkdir('public/labs', { recursive: true });
for (const lesson of lessons) {
  validateLesson(lesson);
  const data = JSON.stringify(lesson).replaceAll('<', '\\u003c');
  const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(lesson.title[0])} · Agent Safety Playground</title>
<style>
*{box-sizing:border-box}body{font:16px/1.7 system-ui,sans-serif;max-width:1080px;margin:32px auto;padding:0 20px;color:#162331;background:white}
header,footer,.toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}
button{font:600 15px system-ui;padding:11px 20px;color:#087f72;background:white;border:1px solid #087f72;border-radius:5px;cursor:pointer}
button:focus-visible,input:focus-visible{outline:3px solid #e9ab31;outline-offset:3px}button:disabled{opacity:.45;cursor:not-allowed}#run{background:#087f72;color:white}
label{display:block;margin:15px 0}input{margin-right:12px;width:18px;height:18px;accent-color:#087f72}
section{padding:20px;margin:20px 0;border:1px solid #dce3e9;border-radius:7px}h1{line-height:1.3}h2{font-size:20px;margin:0 0 12px}h3{font-size:17px}
pre{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.7 monospace;background:#f5f8fa;padding:15px}mark{background:#fff0c6;padding:4px;overflow-wrap:anywhere}
#results{display:grid;grid-template-columns:1fr 1fr;gap:16px}#results article{padding:16px;border:1px solid #dce3e9;border-radius:6px}
.safe{color:#087f72}.danger{color:#ae2333}.notice{color:#705119;background:#fff4d8;padding:10px}small{color:#617386}li{margin-bottom:16px;overflow-wrap:anywhere}
@media(max-width:680px){#results{grid-template-columns:1fr}body{margin:20px auto}h1{font-size:28px}}
</style></head><body>
<header><strong>Agent Safety Playground</strong><button id="language">English</button></header>
<main><h1 id="title"></h1><p id="disclaimer"></p><section><h2 id="task-label"></h2><p id="task"></p><p id="content"></p><mark id="injection"></mark></section>
<section><h2 id="policy-label"></h2><div id="controls"></div><div class="toolbar"><button id="run"></button><button id="reset"></button><button id="export" disabled></button></div></section>
<p id="status" role="status"></p><div id="results" aria-live="polite"></div><section><h2 id="why"></h2><p id="explanation"></p></section></main>
<script>${engine}\nconst lesson = ${data};\n${client}<\/script></body></html>`;
  await writeFile('public/labs/' + lesson.id + '.html', html);
}
