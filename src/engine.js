// This models a virtual world only. It is not a real tool sandbox.
export function normalizePath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') ||
      value.includes('\\') || /[\x00-\x1f\x7f]/.test(value)) return null;
  const segments = [];
  for (const part of value.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (!segments.length) return null;
      segments.pop();
    } else segments.push(part);
  }
  return '/' + segments.join('/');
}

export function evaluate(action, policy = {}, context = {}) {
  const deny = reason => ({ allowed: false, reason });
  const tools = ['read_page', 'send_email', 'read_file', 'write_summary', 'list_events', 'grant_access'];
  if (!action || !tools.includes(action.tool)) return deny('unsupported');
  const text = value => typeof value === 'string' && value.trim().length > 0;
  if (action.tool === 'send_email') {
    if (!text(action.to) || !text(action.body)) return deny('invalid');
    if (policy.recipient && action.to !== 'team@example.test') return deny('recipient');
    // Approval comes from the trusted scenario configuration, never the proposed action.
    const approved = Array.isArray(context.approvedEmails) &&
      context.approvedEmails.some(email => email.to === action.to && email.body === action.body);
    if (policy.confirm && !approved) return deny('approval');
  }
  if (action.tool === 'read_file') {
    const path = normalizePath(action.path);
    if (!path) return deny('invalid');
    if (policy.directory && !path.startsWith('/workspace/')) return deny('directory');
  }
  if (action.tool === 'write_summary' && !text(action.body)) return deny('invalid');
  if (action.tool === 'grant_access' && (!text(action.principal) || !text(action.role))) return deny('invalid');
  if (policy.tools && !['list_events', 'write_summary'].includes(action.tool)) return deny('tools');
  if (policy.parameters && action.tool === 'grant_access' &&
      (action.role !== 'viewer' || action.principal !== 'team')) return deny('parameters');
  return { allowed: true, reason: 'allowed' };
}

export function validateLesson(lesson) {
  if (!lesson || !Array.isArray(lesson.actions) || !lesson.actions.some(a => a?.required === true)) {
    throw new Error('A lesson must contain at least one required action.');
  }
  const seen = new Set();
  for (const action of lesson.actions) {
    if (!action || typeof action.id !== 'string' || !action.id || seen.has(action.id)) {
      throw new Error('Each action needs a unique non-empty id.');
    }
    if (action.dependsOn !== undefined && (!Array.isArray(action.dependsOn) ||
        action.dependsOn.some(id => !seen.has(id)))) {
      throw new Error('Dependencies must refer to preceding actions.');
    }
    seen.add(action.id);
  }
}

export function simulate(lesson, policy = {}) {
  validateLesson(lesson);
  const state = { sent: [], read: [], grants: [], summary: null };
  const completed = new Set();
  const events = lesson.actions.map(action => {
    const ready = (action.dependsOn ?? []).every(id => completed.has(id));
    const decision = ready ? evaluate(action, policy, lesson) : { allowed: false, reason: 'dependency' };
    if (decision.allowed) {
      completed.add(action.id);
      if (action.tool === 'send_email') state.sent.push({ to: action.to, body: action.body });
      if (action.tool === 'read_file') state.read.push(normalizePath(action.path));
      if (action.tool === 'grant_access') state.grants.push({ principal: action.principal, role: action.role });
      if (action.tool === 'write_summary') state.summary = action.body;
    }
    return { ...action, ...decision };
  });
  const leaked = events.some(event => event.malicious && event.allowed);
  const complete = events.filter(event => event.required).every(event => event.allowed);
  return { events, state, leaked, complete, passed: !leaked && complete };
}

export function normalizePolicy(lesson, policy = {}) {
  return Object.fromEntries(lesson.controls.map(control => [control.key, policy[control.key] === true]));
}

export function samePolicy(lesson, first, second) {
  return lesson.controls.every(control => !!first[control.key] === !!second[control.key]);
}

export function createReport(lesson, policy = {}) {
  const normalized = normalizePolicy(lesson, policy);
  return {
    schemaVersion: 1,
    lesson: lesson.id,
    mode: 'deterministic-simulation',
    policy: normalized,
    baseline: simulate(lesson),
    current: simulate(lesson, normalized),
  };
}
