import React from 'react';
import QuickChipLinks from './QuickChipLinks';
import type {HomepageChip} from '../lib/homepageChips';
export default function NotFoundContent({chips=[],counts={},children}:{chips?:HomepageChip[];counts?:Record<string,number>;children?:React.ReactNode}){
 return <section className="not-found" dir="rtl" aria-labelledby="not-found-title">
  <div className="not-found-art"><svg className="not-found-face" viewBox="0 0 320 380" aria-hidden="true" focusable="false">
   <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={25}>
    <g className="nf-eyes" transform="translate(0,112.5)"><g transform="translate(15,0)"><polyline className="nf-eye-lid" points="37,0 0,120 75,120"/><polyline className="nf-pupil" points="55,120 55,155" strokeDasharray="35 35"/></g><g transform="translate(230,0)"><polyline className="nf-eye-lid" points="37,0 0,120 75,120"/><polyline className="nf-pupil" points="55,120 55,155" strokeDasharray="35 35"/></g></g>
    <rect className="nf-nose" x="132.5" y="112.5" width={55} height={155} rx={4} ry={4}/>
    <g transform="translate(65,334)" strokeDasharray="102 102"><path className="nf-mouth-left" d="M 0 30 C 0 30 40 0 95 0"/><path className="nf-mouth-right" d="M 95 0 C 150 0 190 30 190 30"/></g>
   </g>
  </svg></div>
  <h1 id="not-found-title"><span className="sr-only">خطای ۴۰۴ — </span>این صفحه پیدا نشد</h1>
  <p>ممکن است نشانی تغییر کرده باشد یا محتوا هنوز منتشر نشده باشد.</p>
  <p className="not-found-guidance">از این مسیرها به محتوای موجود سر بزنید:</p>
  {children||<QuickChipLinks chips={chips} counts={counts}/>}
  <a className="not-found-home" href="/">بازگشت به آرشیو پرامپت‌ها ←</a>
 </section>;
}
