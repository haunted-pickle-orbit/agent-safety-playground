import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { lessons } from './lessons.js';
import { createReport, samePolicy } from './engine.js';
import { readProgress, writeProgress } from './progress.js';
import { CourseNav, PolicyEditor, RunComparison, pick } from './ui.jsx';
import './style.css';

function loadProgress() {
  try { return readProgress(window.localStorage, lessons.map(lesson => lesson.id)); }
  catch { return { lang: 0, done: [] }; }
}
function downloadReport(name, report) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [selected, setSelected] = useState(0);
  const [sessions, setSessions] = useState({});
  const [storageAvailable, setStorageAvailable] = useState(true);
  const { lang, done } = progress;
  const lesson = lessons[selected];
  const { policy = {}, run = null } = sessions[lesson.id] ?? {};
  const dirty = !!run && !samePolicy(lesson, run.policy, policy);

  useEffect(() => {
    document.documentElement.lang = lang === 1 ? 'en' : 'zh-CN';
    try { setStorageAvailable(writeProgress(window.localStorage, progress)); }
    catch { setStorageAvailable(false); }
  }, [progress, lang]);

  function updateSession(changes) {
    setSessions(current => ({ ...current, [lesson.id]: { ...current[lesson.id], ...changes } }));
  }
  function reset() {
    updateSession({ policy: {}, run: null });
    setProgress(current => ({ ...current, done: current.done.filter(id => id !== lesson.id) }));
  }
  function execute() {
    const report = createReport(lesson, policy);
    updateSession({ run: report });
    if (report.current.passed) setProgress(current => ({
      ...current, done: current.done.includes(lesson.id) ? current.done : [...current.done, lesson.id],
    }));
  }
  const step = run ? (dirty ? 2 : run.current.passed ? 3 : 1) : 0;
  return <>
    <a href="#main" className="skip-link">{pick(['跳到实验内容', 'Skip to experiment'], lang)}</a>
    <header>
      <a className="brand" href="./">Agent Safety Playground</a>
      <div><span>{pick(['模拟教学 · 无需 API', 'Simulation · No API required'], lang)}</span>
        <button onClick={() => setProgress(current => ({ ...current, lang: 1 - current.lang }))}>{lang ? '中文' : 'English'}</button>
      </div>
    </header>
    <div className="shell">
      <CourseNav selected={selected} onSelect={setSelected} lang={lang} done={done} />
      <main id="main" tabIndex={-1}>
        <h1>{pick(lesson.title, lang)}</h1>
        <p className="subtitle">{pick(['观察指令如何越过信任边界，再亲手修复。', 'See instructions cross a trust boundary. Then fix it yourself.'], lang)}</p>
        {!storageAvailable && <p className="notice" role="status">{pick(['浏览器未允许本地保存，仍可正常学习；刷新后进度不保留。', 'Local storage is unavailable. Labs still work; progress will not survive a reload.'], lang)}</p>}
        <ol className="workflow">{pick([
          ['阅读任务', '观察执行', '修改防护', '验证结果'],
          ['Read task', 'Observe', 'Protect', 'Verify'],
        ], lang).map((text, index) => <li key={index} className={step === index ? 'active' : ''} aria-current={step === index ? 'step' : undefined}>
          <span>{index + 1}</span>{text}
        </li>)}</ol>
        <div className="task"><strong>{pick(['正常任务', 'Normal task'], lang)}</strong><p>{pick(lesson.task, lang)}</p></div>
        <div className="workspace">
          <div className="editors">
            <section className="panel source">
              <div className="section-heading"><h2>{pick(['不可信内容', 'Untrusted content'], lang)}</h2><small>{pick(lesson.source, lang)}</small></div>
              <div className="code-block"><p><span>1</span>{pick(lesson.content, lang)}</p><p><span>2</span><mark>{pick(lesson.injection, lang)}</mark></p></div>
            </section>
            <PolicyEditor lesson={lesson} policy={policy} setPolicy={value => updateSession({ policy: value })} onRun={execute} onReset={reset} lang={lang} />
          </div>
          <RunComparison run={run} dirty={dirty} lang={lang} />
        </div>
        {run && !dirty && <section className={'learning-result ' + (run.current.passed ? 'safe' : 'warning')} aria-live="polite">
          <div><strong>{pick(run.current.passed ? ['验证通过：危险动作被拦截，正常任务完成。', 'Verified: unsafe action blocked; normal task completed.'] :
            ['继续尝试：开启一项防护，再观察结果。', 'Keep exploring: enable a safeguard, then compare again.'], lang)}</strong>
            <p>{pick(run.current.passed ? ['试着只保留一项防护，理解每种控制的作用范围。', 'Try one safeguard at a time to understand its scope.'] :
              ['任务完成不等于执行安全，也要检查是否发生额外操作。', 'Task completion alone is not enough. Check for unintended actions too.'], lang)}</p></div>
          {run.current.passed && selected < lessons.length - 1 && <button onClick={() => setSelected(selected + 1)}>{pick(['下一关', 'Next lab'], lang)}</button>}
        </section>}
        <section className="panel explanation"><h2>{pick(['为什么会发生？', 'Why does this happen?'], lang)}</h2><p>{pick(lesson.explanation, lang)}</p></section>
        <footer><span>{pick(['确定性模拟，不代表真实模型评测。', 'Deterministic simulation, not a real-model evaluation.'], lang)}</span>
          <div className="actions">
            <a className="button" href={import.meta.env.BASE_URL + 'labs/' + lesson.id + '.html'} download>{pick(['下载关卡', 'Download lab'], lang)}</a>
            <button className="primary" disabled={!run || dirty} onClick={() => downloadReport(lesson.id + '-trace.json', run)}>{pick(['导出记录', 'Export trace'], lang)}</button>
          </div>
        </footer>
      </main>
    </div>
  </>;
}
createRoot(document.getElementById('root')).render(<App />);
