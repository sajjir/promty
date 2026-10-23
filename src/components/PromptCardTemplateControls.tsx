import React from 'react';
import { Check } from 'lucide-react';
import { promptCardTemplates, type PromptCardTemplate } from '../lib/promptCardTemplates';

export default function PromptCardTemplateControls({value, onChange}: {
  value: PromptCardTemplate;
  onChange: (value: PromptCardTemplate) => void;
}) {
  return <fieldset className="space-y-4 border-t border-line pt-6" aria-describedby="card-template-help">
    <legend className="px-2 text-sm font-bold text-primary">قالب کارت‌های پرامپت</legend>
    <p id="card-template-help" className="text-xs leading-6 text-muted">قالب پیش‌فرض نمایش کارت‌ها را انتخاب کنید. این انتخاب روی آخرین‌ها، نتایج جستجو، ترندها و چهار بخش منتخب صفحه اصلی اعمال می‌شود. هر دو قالب برای استفاده‌های بعدی در دسترس می‌مانند.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      {promptCardTemplates.map(template => <label key={template.id} className="relative cursor-pointer">
        <input type="radio" name="promptCardTemplate" value={template.id} checked={value === template.id} onChange={() => onChange(template.id)} className="peer sr-only" />
        <div className="h-full rounded-2xl border-2 border-line bg-surface p-4 transition peer-checked:border-brand peer-checked:bg-brand-solid/5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-brand">
          <div aria-hidden="true" className={`relative mb-4 flex h-28 items-center justify-center gap-2 overflow-hidden rounded-xl bg-surface-soft ${template.id === 'fan' ? 'px-8' : 'px-4'}`}>
            {[0,1,2].map(index => <div key={index} className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-surface shadow-sm" style={template.id === 'fan' ? {position: 'absolute', transform: `translateX(${(index-1)*40}px) rotate(${(index-1)*14}deg)`, zIndex: index === 1 ? 2 : 1} : undefined}>
              <div className="h-10 bg-gradient-to-br from-violet-500/35 to-blue-500/20" />
              <div className="m-2 h-1 rounded bg-brand-solid/30" /><div className="mx-2 h-1 w-7 rounded bg-surface-inset" />
            </div>)}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-primary">{template.title}</span>
            <span aria-hidden="true" className={`flex h-5 w-5 items-center justify-center rounded-full border ${value === template.id ? 'border-brand bg-brand-solid text-white' : 'border-line'}`}>{value === template.id && <Check size={13} />}</span>
          </div>
          <p className="mt-2 text-xs leading-6 text-muted">{template.description}</p>
          {template.recommended && <span className="mt-2 inline-block rounded-full bg-brand-solid/10 px-2 py-1 text-[10px] font-bold text-brand">پیشنهادی برای شروع سریع</span>}
        </div>
      </label>)}
    </div>
    <p className="text-[11px] text-muted">برای اعمال انتخاب، «ذخیره تغییرات برندینگ و ظاهر» را بزنید.</p>
  </fieldset>;
}
