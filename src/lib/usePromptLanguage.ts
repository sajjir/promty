import { useSyncExternalStore } from 'react';
export type PromptLanguage = 'en' | 'fa';
const key = 'promty-prompt-language';
let memory: PromptLanguage = 'en';
const listeners = new Set<() => void>();
function read(): PromptLanguage {
  try { const value = localStorage.getItem(key); return value === 'fa' || value === 'en' ? value : memory; } catch { return memory; }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const storage = (event: StorageEvent) => { if (event.key === key || event.key === null) listener(); };
  window.addEventListener('storage', storage);
  return () => { listeners.delete(listener); window.removeEventListener('storage', storage); };
}
export function usePromptLanguage() {
  const language = useSyncExternalStore(subscribe, read, () => 'en' as PromptLanguage);
  const setLanguage = (value: PromptLanguage) => {
    memory = value;
    try { localStorage.setItem(key, value); } catch { /* Keep the session preference. */ }
    listeners.forEach(listener => listener());
  };
  return [language, setLanguage] as const;
}
