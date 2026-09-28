import React from 'react';
import { lessons } from './lessons.js';

export const pick = (value, lang) => Array.isArray(value) ? value[lang] : value;
export const reasons = {
  recipient: ['收件人不在允许列表', 'Recipient is not allowed'],
  approval: ['该收件人和内容未获得批准', 'Recipient and content are not approved'],
  directory: ['超出任务目录边界', 'Outside the task directory'],
  tools: ['工具不在允许列表', 'Tool is not allowed'],
  parameters: ['授权参数不符合策略', 'Access arguments rejected'],
  unsupported: ['不支持的工具，未执行', 'Unsupported tool; not executed'],
  invalid: ['调用参数无效', 'Invalid tool arguments'],
  dependency: ['前置动作未完成，已跳过', 'Prerequisite failed; action skipped'],
  allowed: ['动作已执行', 'Action executed'],
};

export function CourseNav({ selected, onSelect, lang, done }) {
  return <aside>
    <h2>{pick(['实验课程', 'Experiments'], lang)}</h2>
    <nav aria-label={pick(['实验课程', 'Experiments'], lang)}>
      {lessons.map((lesson, index) => <button key={lesson.id}
        className={selected === index ? 'selected' : ''}
        aria-current={selected === index ? 'page' : undefined}
        onClick={() => onSelect(index)}>
        <span>{String(index + 1).padStart(2, '0')}</span>
        <span>{pick(lesson.title, lang)}</span>
        {done.includes(lesson.id) && <span aria-label={pick(['曾通过验证', 'Previously passed'], lang)}>✓</span>}
      </button>)}
    </nav>
    <p className="aside-note">{pick(['仅使用虚构数据', 'Fictional data only'], lang)}<br />
      {pick(['曾通过 ', 'Previously passed: '], lang)}{done.length} / {lessons.length}
    </p>
  </aside>;
}

export function PolicyEditor({ lesson, policy, setPolicy, onRun, onReset, lang }) {
  return <section className="panel policy">
    <h2>{pick(['修改防护', 'Modify safeguards'], lang)}</h2>
    {lesson.controls.map(control => <label className="control" key={control.key}>
      <input type="checkbox" checked={!!policy[control.key]}
        onChange={event => setPolicy({ ...policy, [control.key]: event.target.checked })} />
      <span className="switch" aria-hidden="true" />
      <span><strong>{pick(control.label, lang)}</strong><small>{pick(control.hint, lang)}</small></span>
    </label>)}
    <div className="actions">
      <button className="primary" onClick={onRun}>{pick(['运行对比', 'Run comparison'], lang)}</button>
      <button onClick={onReset}>{pick(['重置本关', 'Reset lab'], lang)}</button>
    </div>
  </section>;
}

function StateSummary({ state, lang }) {
  const mail = state.sent.map(item => item.to).join(', ');
  const grants = state.grants.map(item => item.principal + ' / ' + item.role).join(', ');
  const none = pick(['无', 'None'], lang);
  return <dl className="state-summary">
    <div><dt>{pick(['已发送到', 'Sent to'], lang)}</dt><dd>{mail || none}</dd></div>
    <div><dt>{pick(['已读取文件', 'Files read'], lang)}</dt><dd>{state.read.join(', ') || none}</dd></div>
    <div><dt>{pick(['新增权限', 'Access granted'], lang)}</dt><dd>{grants || none}</dd></div>
    {state.summary !== null && <div><dt>{pick(['摘要内容', 'Summary content'], lang)}</dt><dd>{state.summary}</dd></div>}
  </dl>;
}

function Trace({ result, title, lang }) {
  return <div className="trace">
    <h3>{title}</h3>
    <ol>{result.events.map((event, index) => <li key={event.id}>
      <span className="step-dot">{index + 1}</span>
      <strong>{pick(event.label, lang)}</strong>
      <code>{event.tool}{event.to ? ' → ' + event.to : event.path ? ' → ' + event.path :
        event.role ? ' → ' + event.principal + ' / ' + event.role : ''}</code>
      {(event.malicious || !event.allowed) && <div className={'outcome ' +
        (event.malicious ? (event.allowed ? 'danger' : 'safe') : 'warning')}>
        <strong>{pick(event.malicious ?
          (event.allowed ? ['越权动作已执行', 'Unsafe action executed'] : ['危险动作已拦截', 'Unsafe action blocked']) :
          ['正常动作未执行', 'Normal action not executed'], lang)}</strong>
        <small>{pick(reasons[event.reason], lang)}</small>
      </div>}
    </li>)}</ol>
    <p className={result.complete ? 'success' : 'error'}>{pick(result.complete ?
      ['✓ 正常任务完成', '✓ Normal task completed'] : ['正常任务未完成', 'Normal task incomplete'], lang)}</p>
    <details><summary>{pick(['查看状态变化', 'Inspect state changes'], lang)}</summary>
      <StateSummary state={result.state} lang={lang} />
      <details><summary>{pick(['原始 JSON', 'Raw JSON'], lang)}</summary><pre>{JSON.stringify(result.state, null, 2)}</pre></details>
    </details>
  </div>;
}

export function RunComparison({ run, dirty, lang }) {
  return <section className="panel comparison" aria-live="polite">
    <h2>{pick(['执行对比', 'Execution comparison'], lang)}</h2>
    {dirty && <p className="notice">{pick(['策略已修改，以下为上次结果。请重新运行。', 'Policy changed. Results below are from the previous run. Run again.'], lang)}</p>}
    {run ? <div className="traces">
      <Trace result={run.baseline} title={pick(['未加防护', 'Unprotected'], lang)} lang={lang} />
      <Trace result={run.current} title={pick(dirty ? ['上次防护', 'Previous safeguards'] : ['当前防护', 'Current safeguards'], lang)} lang={lang} />
    </div> : <div className="empty">
      <h3>{pick(['从一次未加防护的执行开始', 'Start with an unprotected run'], lang)}</h3>
      <p>{pick(['点击“运行对比”观察异常，再开启防护、重新验证。', 'Run the comparison, observe the unsafe action, then enable safeguards and run again.'], lang)}</p>
    </div>}
  </section>;
}
