import {checkPersonalization} from './agentPersonalization';
import { verifySourceFidelity } from './agentSourceFidelity';
import type { FieldSchema, Prompt, PromptEditorial } from '../types';
import { getUseCase, resourceTypes, useCases, normalizeIntent } from './archiveCatalog';

type ObjectValue = Record<string, any>;
const object = (v: unknown): v is ObjectValue => !!v && typeof v === 'object' && !Array.isArray(v);

export function unwrapAgentAnalysis(input: unknown): ObjectValue {
  let value = input;
  for (let depth = 0; depth < 8; depth++) {
    if (typeof value === 'string') {
      const text = value.trim().replace(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i, '$1');
      try { value = JSON.parse(text); } catch { throw new Error('پاسخ ایجنت JSON معتبر نیست.'); }
      continue;
    }
    if (Array.isArray(value)) {
      if (value.length !== 1) throw new Error('پاسخ ایجنت باید دقیقاً یک پرامپت داشته باشد.');
      value = value[0]; continue;
    }
    if (!object(value)) throw new Error('ساختار پاسخ ایجنت معتبر نیست.');
    if (typeof value.body === 'string') return value;
    const wrapper = ['record', 'output', 'text', 'data'].find(key => value[key] !== undefined);
    if (!wrapper) throw new Error('متن پرامپت در پاسخ ایجنت وجود ندارد.');
    value = value[wrapper];
  }
  throw new Error('لایه‌های پاسخ ایجنت بیش از حد است.');
}

function stringList(value: unknown, name: string): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some(v => typeof v !== 'string')) throw new Error(`آرایهٔ ${name} معتبر نیست.`);
  return [...new Set(value.map(v => v.trim()).filter(Boolean))];
}

export function resolveAgentUseCase(value: unknown): string {
  if (typeof value !== 'string') return '';
  const key = value.trim().replace(/^useCase:/i, '').toLowerCase();
  return useCases.find(item => item.slug.toLowerCase() === key || item.referenceId?.toLowerCase() === key
    || item.referenceIds?.some(id => id.toLowerCase() === key))?.slug || '';
}

export function normalizeAgentAnalysis(input: unknown, options: { sourceText?: string } = {}): Partial<Prompt> & { body: string; fieldsSchema: FieldSchema[] } {
  const raw = unwrapAgentAnalysis(input);
  if (!raw.body.trim() || typeof raw.title !== 'string' || !raw.title.trim()) throw new Error('عنوان یا متن خروجی ایجنت خالی است.');
  if (!Array.isArray(raw.fieldsSchema)) throw new Error('ساختار فیلدهای شخصی‌سازی معتبر نیست.');
  const keys = new Set<string>();
  for (const field of raw.fieldsSchema) {
    if (!object(field) || !/^[a-z][a-z0-9_]*$/.test(field.key) || keys.has(field.key)
      || typeof field.label !== 'string' || !field.label.trim()
      || !['text','textarea','color','select','radio','switch','slider','multiselect','url'].includes(field.type))
      throw new Error('کلید، عنوان یا نوع فیلد شخصی‌سازی معتبر نیست.');
    keys.add(field.key);
    for (const k of ['sourceText','defaultValue','defaultValueFa'])
      if (field[k] !== undefined && typeof field[k] !== 'string') throw new Error('عبارت منبع یا پیش‌فرض فیلد معتبر نیست.');
    for (const k of ['advanced','allowCustom'])
      if (field[k] !== undefined && typeof field[k] !== 'boolean') throw new Error('تنظیم نمایش فیلد معتبر نیست.');
    if (['select','radio','multiselect'].includes(field.type)
      && (!Array.isArray(field.options) || !field.options.length || field.options.some((v: unknown) => typeof v !== 'string' || !v.trim())))
      throw new Error('گزینه‌های فیلد انتخابی خالی یا نامعتبر است.');
  }
  const body = (text: unknown) => typeof text === 'string'
    ? text.replace(/\[\[([a-z][a-z0-9_]*)\]\]/g, (match, key) => keys.has(key) ? `{{${key}}}` : match) : '';
  const useCase = resolveAgentUseCase(raw.useCase);
  const relatedUseCases = stringList(raw.relatedUseCases, 'relatedUseCases').map(resolveAgentUseCase)
    .filter((v, i, a) => v && v !== useCase && a.indexOf(v) === i).slice(0, 2);
  let editorial: PromptEditorial | undefined;
  if (raw.editorial !== undefined) {
    const e = raw.editorial;
    if (!object(e) || typeof e.classificationReason !== 'string' || typeof e.needsReview !== 'boolean'
      || typeof e.catalogVersion !== 'string' || !object(e.execution)) throw new Error('گزارش بازبینی ایجنت معتبر نیست.');
    editorial = { catalogVersion: e.catalogVersion, classificationReason: e.classificationReason,
      needsReview: e.needsReview, reviewNotes: stringList(e.reviewNotes, 'reviewNotes'),
      execution: { requiredCapabilities: stringList(e.execution.requiredCapabilities, 'requiredCapabilities'),
        routes: Array.isArray(e.execution.routes) ? e.execution.routes : [] } };
    if (!useCase || !Object.hasOwn(resourceTypes, raw.resourceType)) {
      editorial.needsReview = true;
      editorial.reviewNotes.push('کاربرد یا نوع منبع در کاتالوگ فعلی سایت شناخته نشد؛ پیش از انتشار انتخاب شود.');
    }
  }
  if (editorial) {
    const e = raw.editorial;
    if (e.fixedConstraints !== undefined) editorial.fixedConstraints = stringList(e.fixedConstraints, 'fixedConstraints');
    if (e.improvementSuggestions !== undefined) {
      if (!Array.isArray(e.improvementSuggestions) || e.improvementSuggestions.some((v: any) => !object(v) || ['title','reason','proposedChange'].some(k => typeof v[k] !== 'string' || !v[k].trim()))) throw new Error('پیشنهادهای بهبود معتبر نیست.');
      editorial.improvementSuggestions = e.improvementSuggestions.map(({title,reason,proposedChange}: any) => ({title,reason,proposedChange}));
    }
    for (const k of ['referenceImageReason','referenceImageEvidence'] as const)
      if (e[k] !== undefined) { if (typeof e[k] !== 'string') throw new Error('دلیل تصویر ورودی معتبر نیست.'); editorial[k] = e[k]; }
    if (options.sourceText !== undefined) {
      editorial.sourceText = options.sourceText;
      editorial.fidelity = verifySourceFidelity(options.sourceText, body(raw.body), raw.fieldsSchema);
      editorial.needsReview = true;
      const prose = options.sourceText.replace(/```[\s\S]*?```/g, '').replace(/\{\{.*?\}\}|\[\[.*?\]\]/g, '');
      if (raw.language === 'persian' && !/[\u0600-\u06ff]/.test(prose) && (prose.match(/[a-z]/gi)?.length || 0) > 80)
        editorial.reviewNotes.push('متن منبع حروف فارسی ندارد، اما زبان فارسی انتخاب شده است؛ زبانِ متن اصلی را پیش از انتشار اصلاح کنید. زبان خروجی خواسته‌شده با زبان دستور متفاوت است.');
    } else if (e.fidelity !== undefined) {
      editorial.fidelity = {status:'needs-review',reason:'متن خام درخواست برای بررسی مستقل حفظ متن در دسترس نیست.'};
      editorial.needsReview = true;
      if (typeof e.sourceText === 'string') editorial.sourceText = e.sourceText;
    }
    if (typeof raw.requiresReferenceImage !== 'boolean') {
      editorial.needsReview = true;
      editorial.reviewNotes.push('نیاز به تصویر ورودی مشخص نشده است؛ مقدار را بازبینی کنید.');
    }
  }
  if(options.sourceText!==undefined||raw.editorial?.personalizationReview!==undefined){
    if(typeof raw.bodyFa!=='string'||!raw.bodyFa.trim())throw new Error('ترجمهٔ کامل فارسی در پاسخ ایجنت وجود ندارد.');
    const review=checkPersonalization(body(raw.body),body(raw.bodyFa),raw.fieldsSchema,options.sourceText,raw.editorial?.personalizationReview);
    if(editorial&&review)editorial.personalizationReview=review;
    if(editorial&&!raw.fieldsSchema.length&&!review){editorial.needsReview=true;editorial.reviewNotes.push('هیچ فیلدی برنگشته و دلیل کافی برای ثابت‌بودن متن ارائه نشده است؛ شخصی‌سازی را پیش از انتشار بررسی کنید.');}
  }
  if (editorial) editorial.reviewNotes = [...new Set(editorial.reviewNotes)];
  return { title: raw.title.trim(), description: typeof raw.description === 'string' ? raw.description : '',
    useCase, category: getUseCase(useCase)?.title, relatedUseCases,
    resourceType: Object.hasOwn(resourceTypes, raw.resourceType) ? raw.resourceType : 'prompt',
    intent: normalizeIntent(typeof raw.intent === 'string' ? raw.intent : 'writing'),
    intents: stringList(raw.intents ?? (raw.intent ? [raw.intent] : []), 'intents').map(normalizeIntent),
    domains: stringList(raw.domains ?? (raw.domain ? [raw.domain] : []), 'domains'),
    tools: stringList(raw.tools ?? (raw.tool ? [raw.tool] : []), 'tools'),
    task: typeof raw.task === 'string' ? raw.task : '', language: typeof raw.language === 'string' ? raw.language.toLowerCase() : 'persian',
    difficulty: typeof raw.difficulty === 'string' ? raw.difficulty.toLowerCase() : 'beginner',
    outputFormats: stringList(raw.outputFormats ?? (raw.outputFormat ? [raw.outputFormat] : []), 'outputFormats'),
    tags: stringList(raw.tags, 'tags'), requiresReferenceImage: raw.requiresReferenceImage === true,
    body: body(raw.body), bodyFa: body(raw.bodyFa), fieldsSchema: raw.fieldsSchema, ...(editorial ? {editorial} : {}) };
}
