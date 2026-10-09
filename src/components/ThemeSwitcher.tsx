import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from './ThemeProvider';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return <div className="flex gap-2" role="group" aria-label="حالت نمایش">
    {([{value:'system', label:'هماهنگ با سیستم', Icon:Monitor}, {value:'light', label:'حالت روشن', Icon:Sun}, {value:'dark', label:'حالت تاریک', Icon:Moon}] as const).map(({value,label,Icon}) =>
      <button key={value} title={label} aria-label={label} aria-pressed={theme === value} onClick={() => setTheme(value as ThemePreference)} className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${theme === value ? 'border-brand bg-brand/10 text-brand' : 'border-line text-muted hover:bg-surface-soft'}`}><Icon className="h-5 w-5" aria-hidden="true" /></button>
    )}
  </div>;
}
