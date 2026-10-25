import React, { useState } from 'react';
import type { Prompt } from '../types';
import { getUseCase, resourceTypes } from '../lib/archiveCatalog';
import { getPromptFieldDefaults, localizePromptFieldValues } from '../lib/promptFieldDefaults';
import { renderPrompt } from '../lib/renderPrompt';

type Draft = Partial<Prompt> & {body:string; fieldsSchema:Prompt['fieldsSchema']};
export default function AgentAnalysisProposal({draft,onApply,onDismiss}:{draft:Draft;onApply:()=>void;onDismiss:()=>void}) {
  const [language,setLanguage]=useState<'en'|'fa'>('fa');
  const e=draft.editorial;
  const defaults=getPromptFieldDefaults(draft.fieldsSchema);
  const values=Object.fromEntries(draft.fieldsSchema.map(f=>[f.key,defaults[f.key] || `⟪${f.label}⟫`]));
  const template=language==='fa' ? draft.bodyFa || draft.body : draft.body;
  const output=renderPrompt(template,localizePromptFieldValues(draft.fieldsSchema,values,language));
  return <section aria-label="پیشنهاد تحلیل برای بازبینی" className="rounded-2xl border-2 border-brand bg-surface p-4 sm:p-6 space-y-4">
    <div><h3 className="font-bold text-primary">پیشنهاد آمادهٔ بازبینی است</h3><p className="text-xs text-muted mt-2">فرم فعلی هنوز تغییر نکرده است. متن، ترجمه و فیلدها را بررسی کنید؛ پیشنهادهای بهبود جدا هستند و در متن اعمال نشده‌اند.</p></div>
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <div><dt className="text-muted text-xs">نوع محتوا</dt><dd>{draft.resourceType ? resourceTypes[draft.resourceType] : 'نیازمند انتخاب'}</dd></div>
      <div><dt className="text-muted text-xs">کاربرد اصلی</dt><dd>{getUseCase(draft.useCase)?.title || 'نیازمند انتخاب'}</dd></div>
      <div><dt className="text-muted text-xs">زبان متن اصلی</dt><dd>{draft.language === 'english' ? 'انگلیسی' : draft.language === 'persian' ? 'فارسی' : draft.language || 'نیازمند انتخاب'} — زبانِ دستور، مستقل از زبان خروجی درخواستی</dd></div>
      <div><dt className="text-muted text-xs">تصویر ورودی</dt><dd>{draft.requiresReferenceImage ? 'لازم است؛ کاربر باید عکس یا اسکرین‌شات خود را ارائه کند' : 'الزامی تشخیص داده نشده است؛ دلیل را بررسی کنید'}</dd></div>
      <div><dt className="text-muted text-xs">شخصی‌سازی</dt><dd>{draft.fieldsSchema.length.toLocaleString('fa-IR')} فیلد: {draft.fieldsSchema.map(f=>f.label+(f.advanced?' (تنظیمات بیشتر)':'')).join('، ') || 'متن ثابت؛ بدون فیلد'}</dd></div>
    </dl>
    <p className="text-xs leading-7">{e?.classificationReason}</p>
    {e?.referenceImageReason && <p className="text-xs">دلیل تصویر ورودی: {e.referenceImageReason} {e.referenceImageEvidence && <q dir="auto">{e.referenceImageEvidence}</q>}</p>}
    <p className={`text-xs rounded-lg p-3 ${e?.fidelity?.status==='verified'?'bg-success-soft text-success-text':'bg-caution-soft text-caution-text'}`}>{e?.fidelity?.reason || 'حفظ کامل متن هنوز مستقل بررسی نشده است.'}</p>
    {!!e?.fixedConstraints?.length && <div className="text-xs space-y-2"><h4 className="font-bold">قیود ثابت؛ با شخصی‌سازی نباید تغییر کنند</h4><ul className="list-disc list-inside space-y-2">{e.fixedConstraints.map((v,i)=><li key={i}>{v}</li>)}</ul></div>}
    <details className="border border-line rounded-xl p-3"><summary className="cursor-pointer text-sm font-bold">مقایسه با متن خام</summary><pre dir="auto" className="mt-3 whitespace-pre-wrap break-words text-xs leading-7 max-h-80 overflow-auto">{e?.sourceText}</pre></details>
    <div className="flex flex-wrap gap-2" role="group" aria-label="زبان پیش‌نمایش تحلیل">
      <button type="button" aria-pressed={language==='fa'} onClick={()=>setLanguage('fa')} className="rounded-lg border border-line px-3 py-2 text-xs">نسخهٔ فارسی</button>
      <button type="button" aria-pressed={language==='en'} onClick={()=>setLanguage('en')} className="rounded-lg border border-line px-3 py-2 text-xs">زبان اصلی</button>
    </div>
    <pre dir="auto" className="whitespace-pre-wrap break-words text-xs leading-7 max-h-96 overflow-auto bg-surface-soft border border-line rounded-xl p-4">{output}</pre>
    <p className="text-xs text-muted">این پیش‌نمایش با مقادیر پیش‌فرض است. جای‌خالی‌های ورودی در فرم شخصی‌سازی تکمیل می‌شوند.</p>
    <div className="rounded-xl border border-line p-4 space-y-3"><h4 className="font-bold text-sm">پیشنهادهای بهبود؛ اعمال نشده</h4>
      {e?.improvementSuggestions?.length ? e.improvementSuggestions.map((s,i)=><article key={i} className="text-xs space-y-2"><h5 className="font-bold">{s.title}</h5><p>{s.reason}</p><p className="text-secondary">{s.proposedChange}</p></article>) : <p className="text-xs text-muted">پیشنهاد مستقلی ثبت نشده است.</p>}
      <p className="text-xs text-muted">در صورت انتخاب یک پیشنهاد، آن را آگاهانه در متن ویرایش و دوباره بازبینی کنید.</p>
    </div>
    {!!e?.reviewNotes.length && <ul className="text-xs list-disc list-inside space-y-2">{e.reviewNotes.map((n,i)=><li key={i}>{n}</li>)}</ul>}
    <div className="flex flex-wrap gap-3"><button type="button" onClick={onApply} className="rounded-xl bg-brand-solid text-white px-5 py-3 text-sm font-bold">اعمال پیشنهاد در فرم پیش‌نویس</button><button type="button" onClick={onDismiss} className="rounded-xl border border-line px-4 py-3 text-sm">کنار گذاشتن پیشنهاد</button></div>
  </section>;
}
