import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from './ThemeProvider';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  return (
    <label className="theme-switcher flex items-center gap-1.5 rounded-xl border border-line bg-surface-soft px-2.5 py-2 text-muted">
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <select aria-label="حالت نمایش" value={theme} onChange={event => setTheme(event.target.value as ThemePreference)} className="w-[64px] bg-transparent text-xs font-medium text-primary cursor-pointer">
        <option value="system">سیستم</option>
        <option value="light">روشن</option>
        <option value="dark">تاریک</option>
      </select>
    </label>
  );
}
