// Embedded into standalone labs by build-labs.mjs. No external resources.
let lang = 0;
let policy = {};
let report = null;
const byId = id => document.getElementById(id);
const t = value => value[lang];
function drawResults() {
  const results = byId('results');
  results.replaceChildren();
  const dirty = report && !samePolicy(lesson, policy, report.policy);
  byId('export').disabled = !report || dirty;
  byId('status').className = dirty ? 'notice' : '';
  byId('status').textContent = dirty
    ? t(['策略已修改，以下为上次结果。请重新运行。', 'Policy changed. These are previous results. Run again.'])
    : report ? t(report.current.passed ? ['验证通过：危险动作被拦截，正常任务完成。', 'Verified: unsafe action blocked; normal task completed.']
      : ['开启防护后重新运行，比较状态变化。', 'Enable safeguards and run again to compare state changes.'])
      : t(['点击运行对比，先观察未加防护的行为。', 'Run a comparison to observe the unprotected behavior.']);
  if (!report) return;
  for (const [key, title] of [['baseline', ['未加防护', 'Unprotected']], ['current', dirty ? ['上次防护', 'Previous safeguards'] : ['当前防护', 'Current safeguards']]]) {
    const result = report[key];
    const article = document.createElement('article');
    const heading = document.createElement('h2');
    heading.textContent = t(title);
    article.append(heading);
    const list = document.createElement('ol');
    for (const event of result.events) {
      const item = document.createElement('li');
      item.textContent = t(event.label) + ' · ' + (event.allowed ? t(['已执行', 'Executed']) : t(['已拦截', 'Blocked'])) +
        ' [' + event.tool + (event.to ? ': ' + event.to : event.path ? ': ' + event.path : '') + ']';
      if (event.malicious) item.className = event.allowed ? 'danger' : 'safe';
      list.append(item);
    }
    article.append(list);
    const summary = document.createElement('p');
    summary.className = result.passed ? 'safe' : 'danger';
    summary.textContent = t(result.complete ? ['正常任务完成', 'Normal task completed'] : ['正常任务未完成', 'Normal task incomplete']);
    const state = document.createElement('pre');
    state.textContent = JSON.stringify(result.state, null, 2);
    article.append(summary, state);
    results.append(article);
  }
}
function render() {
  document.documentElement.lang = lang ? 'en' : 'zh-CN';
  document.title = t(lesson.title) + ' · Agent Safety Playground';
  byId('title').textContent = t(lesson.title);
  byId('language').textContent = lang ? '中文' : 'English';
  byId('disclaimer').textContent = t(['离线确定性模拟，仅使用虚构数据，不代表真实模型评测。', 'Offline deterministic simulation. Fictional data only; not a real-model evaluation.']);
  byId('task-label').textContent = t(['正常任务', 'Normal task']);
  byId('task').textContent = t(lesson.task);
  byId('content').textContent = t(lesson.content);
  byId('injection').textContent = t(lesson.injection);
  byId('policy-label').textContent = t(['修改防护', 'Modify safeguards']);
  byId('run').textContent = t(['运行对比', 'Run comparison']);
  byId('reset').textContent = t(['重置本关', 'Reset lab']);
  byId('export').textContent = t(['导出记录', 'Export trace']);
  byId('why').textContent = t(['为什么会发生？', 'Why does this happen?']);
  byId('explanation').textContent = t(lesson.explanation);
  const controls = byId('controls');
  controls.replaceChildren();
  for (const control of lesson.controls) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!policy[control.key];
    input.addEventListener('change', () => { policy[control.key] = input.checked; drawResults(); });
    label.append(input, document.createTextNode(t(control.label) + '：' + t(control.hint)));
    controls.append(label);
  }
  drawResults();
}
byId('run').addEventListener('click', () => { report = createReport(lesson, policy); drawResults(); });
byId('reset').addEventListener('click', () => { policy = {}; report = null; render(); });
byId('language').addEventListener('click', () => { lang = 1 - lang; render(); });
byId('export').addEventListener('click', () => {
  if (!report || !samePolicy(lesson, policy, report.policy)) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = lesson.id + '-trace.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
render();
