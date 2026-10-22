import React from 'react';
import type { HomepageSection } from '../lib/homepageSections';
import { useCaseGroups, useCases, useCaseInGroups } from '../lib/archiveCatalog';

export default function HomepageSectionsControls({value,onChange}:{value:HomepageSection[];onChange:(value:HomepageSection[])=>void}) {
  const change = (index:number,patch:Partial<HomepageSection>) => onChange(value.map((row,i) => i === index ? {...row,...patch} : row));
  const inputClass = 'w-full border border-line rounded-xl px-3 py-2.5 text-xs bg-surface-soft text-primary focus:border-brand';
  return <section className="space-y-4 border-t border-line pt-6" aria-label="چیدمان شش بخش صفحه اصلی">
    <div><h3 className="text-sm font-bold text-primary">شش جایگاه صفحه اصلی</h3><p className="mt-2 text-xs leading-6 text-muted">ترتیب نمایش از بالا به پایین است: آخرین‌ها، ترندها و چهار بخش منتخب شما. جستجو فقط در بخش اول نمایش داده می‌شود و تا پاک‌شدن متن جستجو، بخش‌های دیگر پنهان‌اند.</p></div>
    {value.map((section,index) => <fieldset key={section.id} className="rounded-2xl border border-line bg-surface-soft/40 p-4 space-y-4" data-homepage-slot={section.id}>
      <legend className="px-2 text-xs font-bold text-primary">جایگاه {(index+1).toLocaleString('fa-IR')} · {index === 0 ? 'آخرین‌ها و نتایج جستجو' : index === 1 ? 'ترندها' : 'منتخب ادمین'}</legend>
      <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer"><input type="checkbox" checked={section.enabled} disabled={index === 0} onChange={e=>change(index,{enabled:e.target.checked})} className="accent-violet-500" />نمایش جایگاه {(index+1).toLocaleString('fa-IR')} در صفحه اصلی{index === 0 && <span className="text-muted">(همیشه فعال)</span>}</label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs text-secondary"><span>نام جایگاه {(index+1).toLocaleString('fa-IR')}</span><input aria-label={`نام جایگاه ${index+1}`} value={section.title} maxLength={80} readOnly={index === 1} onChange={e=>change(index,{title:e.target.value})} className={inputClass} /></label>
        <label className="space-y-1.5 text-xs text-secondary"><span>تعداد کارت‌ها</span><select aria-label={`تعداد کارت جایگاه ${index+1}`} value={section.limit} onChange={e=>change(index,{limit:Number(e.target.value)})} className={inputClass}>{[4,6,8,12,16,20,24].map(n=><option key={n} value={n}>{n.toLocaleString('fa-IR')} کارت</option>)}</select></label>
        {section.source === 'category' && <>
          <label className="space-y-1.5 text-xs text-secondary"><span>دستهٔ منتخب</span><select aria-label={`دسته جایگاه ${index+1}`} value={section.group} onChange={e=>change(index,{group:e.target.value,useCase:''})} className={inputClass}><option value="">انتخاب دسته</option>{useCaseGroups.map(group=><option key={group.slug} value={group.slug}>{group.parent ? '↳ ' : ''}{group.title}</option>)}</select></label>
          <label className="space-y-1.5 text-xs text-secondary"><span>کاربرد مشخص (اختیاری)</span><select aria-label={`کاربرد جایگاه ${index+1}`} value={section.useCase} disabled={!section.group} onChange={e=>change(index,{useCase:e.target.value})} className={inputClass}><option value="">همهٔ کاربردهای این دسته</option>{useCases.filter(item=>section.group && useCaseInGroups(item.slug,[section.group])).map(item=><option key={item.slug} value={item.slug}>{item.title}</option>)}</select></label>
        </>}
      </div>
      <p className="text-[11px] leading-5 text-muted">{index === 0 ? 'محتوای منتشرشده از جدید به قدیم؛ فیلترها و مرتب‌سازی انتخابی کاربر روی همین بخش اعمال می‌شوند.' : index === 1 ? 'بر اساس تعداد کپی ثبت‌شده از زمان انتشار؛ محتوای بدون کپی وارد ترندها نمی‌شود.' : 'جدیدترین محتوای منتشرشدهٔ دستهٔ انتخابی نمایش داده می‌شود. اگر محتوایی نداشت، همان بخش پیام خالی نشان می‌دهد.'}</p>
    </fieldset>)}
  </section>;
}
