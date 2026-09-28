export const STORAGE_KEY = 'agent-safety-playground:v1';
export function readProgress(storage, ids) {
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY));
    if (value?.version !== 1) return { lang: 0, done: [] };
    return {
      lang: value.lang === 1 ? 1 : 0,
      done: Array.isArray(value.done) ? [...new Set(value.done.filter(id => ids.includes(id)))] : [],
    };
  } catch { return { lang: 0, done: [] }; }
}
export function writeProgress(storage, value) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, lang: value.lang, done: value.done }));
    return true;
  } catch { return false; }
}
