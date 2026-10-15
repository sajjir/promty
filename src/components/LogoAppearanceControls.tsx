import { useState } from 'react';
import BrandLogo from './BrandLogo';
import { normalizeLogoAppearance, type LogoAppearance } from '../lib/logoAppearance';

const presets = [
  { name: 'هماهنگ با جستجو', colors: ['#402fb5', '#6c47ff', '#cf30aa', '#dfa2da'] },
  { name: 'آبی و فیروزه‌ای', colors: ['#1d4ed8', '#6366f1', '#0891b2', '#67e8f9'] },
  { name: 'صورتی و غروب', colors: ['#9333ea', '#db2777', '#ea580c', '#fbbf24'] },
];

export default function LogoAppearanceControls({ src, value, onChange, onSave, saving }: { src: string; value: LogoAppearance; onChange: (value: LogoAppearance) => void; onSave: () => void; saving: boolean }) {
  const [previewSize, setPreviewSize] = useState<'desktop' | 'mobile'>('desktop');
  const update = <K extends keyof LogoAppearance>(key: K, next: LogoAppearance[K]) => onChange({ ...value, [key]: next });
  const rangeClass = 'w-full accent-brand-solid';
  return <section aria-label="تنظیمات نمایش لوگو" className="space-y-5 border-t border-line pt-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h5 className="text-xs font-bold text-primary">اندازه، گرادیان و حرکت لوگو</h5>
      <button type="button" onClick={() => onChange(normalizeLogoAppearance())} className="text-xs font-semibold text-brand underline underline-offset-4">بازگشت به پیش‌فرض پرامتی</button>
    </div>
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_190px]">
      <div className="min-w-0 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-primary">
            <input type="checkbox" checked={value.gradientEnabled} onChange={event => update('gradientEnabled', event.target.checked)} className="h-4 w-4" />گرادیان روی خود لوگو
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-primary">
            <input type="checkbox" checked={value.gradientEnabled && value.animationEnabled} disabled={!value.gradientEnabled} onChange={event => update('animationEnabled', event.target.checked)} className="h-4 w-4 disabled:opacity-40" />انیمیشن گرادیان
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label htmlFor="logo-desktop-size" className="space-y-2 text-xs text-secondary">
            <span className="flex justify-between gap-2">اندازه لوگو در دسکتاپ <output htmlFor="logo-desktop-size">{value.desktopSize} px</output></span>
            <input id="logo-desktop-size" type="range" min={24} max={64} value={value.desktopSize} onChange={event => update('desktopSize', Number(event.target.value))} className={rangeClass} />
          </label>
          <label htmlFor="logo-mobile-size" className="space-y-2 text-xs text-secondary">
            <span className="flex justify-between gap-2">اندازه لوگو در موبایل <output htmlFor="logo-mobile-size">{value.mobileSize} px</output></span>
            <input id="logo-mobile-size" type="range" min={24} max={52} value={value.mobileSize} onChange={event => update('mobileSize', Number(event.target.value))} className={rangeClass} />
          </label>
        </div>
        <fieldset disabled={!value.gradientEnabled} className="space-y-4 disabled:opacity-45">
          <legend className="mb-2 text-xs font-semibold text-primary">رنگ و جهت گرادیان</legend>
          <div className="flex flex-wrap gap-2">
            {presets.map(preset => <button key={preset.name} type="button" aria-pressed={preset.colors.every((color, index) => color === value.gradientColors[index])} onClick={() => update('gradientColors', [...preset.colors])} className="rounded-lg border border-line bg-surface px-2.5 py-2 text-[11px] text-secondary aria-pressed:border-brand aria-pressed:text-brand">{preset.name}</button>)}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {value.gradientColors.map((color, index) => <label key={index} className="space-y-1 text-[11px] text-secondary">
              <span className="block">رنگ {index + 1}</span>
              <input type="color" aria-label={`رنگ ${index + 1} گرادیان لوگو`} value={color} onChange={event => update('gradientColors', value.gradientColors.map((item, i) => i === index ? event.target.value : item))} className="h-9 w-full cursor-pointer rounded-lg border border-line bg-surface p-1" />
              <span dir="ltr" className="block font-mono text-[10px]">{color}</span>
            </label>)}
          </div>
          <label htmlFor="logo-gradient-angle" className="block space-y-2 text-xs text-secondary">
            <span className="flex justify-between">زاویه گرادیان <output htmlFor="logo-gradient-angle">{value.gradientAngle}°</output></span>
            <input id="logo-gradient-angle" type="range" min={0} max={360} step={1} value={value.gradientAngle} onChange={event => update('gradientAngle', Number(event.target.value))} className={rangeClass} />
          </label>
        </fieldset>
        <fieldset disabled={!value.gradientEnabled || !value.animationEnabled} className="grid gap-4 sm:grid-cols-2 disabled:opacity-45">
          <legend className="mb-2 text-xs font-semibold text-primary">حرکت گرادیان</legend>
          <label htmlFor="logo-animation-type" className="space-y-2 text-xs text-secondary">
            <span className="block">نوع انیمیشن</span>
            <select id="logo-animation-type" value={value.animationType} onChange={event => update('animationType', event.target.value as LogoAppearance['animationType'])} className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-primary">
              <option value="flow">حرکت نرم افقی</option><option value="diagonal">حرکت مورب</option><option value="breathe">تنفس آرام رنگ</option>
            </select>
          </label>
          <label htmlFor="logo-animation-duration" className="space-y-2 text-xs text-secondary">
            <span className="flex justify-between">مدت هر چرخه <output htmlFor="logo-animation-duration">{value.durationSeconds} ثانیه</output></span>
            <input id="logo-animation-duration" type="range" min={4} max={40} value={value.durationSeconds} onChange={event => update('durationSeconds', Number(event.target.value))} className={rangeClass} />
            <span className="block text-[10px] text-muted">عدد کمتر، حرکت سریع‌تر.</span>
          </label>
        </fieldset>
      </div>
      <div className="space-y-3 rounded-xl border border-line bg-surface p-4 text-center md:self-start">
        <p className="text-xs font-bold text-primary">پیش‌نمایش زنده</p>
        <div role="group" aria-label="اندازه پیش‌نمایش لوگو" className="flex justify-center gap-2">
          {(['desktop', 'mobile'] as const).map(size => <button key={size} type="button" aria-pressed={previewSize === size} onClick={() => setPreviewSize(size)} className="rounded-lg border border-line px-2 py-1.5 text-[11px] text-secondary aria-pressed:bg-brand-soft aria-pressed:text-brand">{size === 'desktop' ? 'دسکتاپ' : 'موبایل'}</button>)}
        </div>
        <div className="flex min-h-24 items-center justify-center" role="img" aria-label="پیش‌نمایش ظاهر لوگو"><BrandLogo src={src} appearance={value} previewSize={previewSize} /></div>
        <p className="text-[10px] leading-5 text-muted">{value.gradientEnabled ? 'گرادیان فقط داخل شکل لوگو اعمال می‌شود؛ فایل شفاف بهترین نتیجه را می‌دهد.' : 'رنگ اصلی فایل لوگو نمایش داده می‌شود.'}</p>
      </div>
    </div>
    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <p className="text-[11px] leading-6 text-muted">پیش‌نمایش با تغییر گزینه‌ها به‌روز می‌شود؛ برای اعمال روی سایت ذخیره کنید. ترجیح کاهش حرکت دستگاه، انیمیشن را متوقف می‌کند.</p>
      <button type="button" onClick={onSave} disabled={saving} className="shrink-0 rounded-xl bg-brand-solid px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? 'در حال ذخیره…' : 'ذخیره تنظیمات لوگو'}</button>
    </div>
  </section>;
}
