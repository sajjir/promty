// Portable helpers embedded into n8n Code nodes. No secrets, network or filesystem.
const str = (v) => v == null ? '' : String(v).trim();
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
function fail(message) { throw new Error('Promty: ' + message); }
function norm(value) {
  return str(value).normalize('NFKC').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, '')
    .replace(/[\u200c\u200d\u200e\u200f]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}
function sha256(value) {
  const bytes = [];
  for (const ch of value) {
    const c = ch.codePointAt(0);
    if (c < 128) bytes.push(c);
    else if (c < 2048) bytes.push(192 | c >> 6, 128 | c & 63);
    else if (c < 65536) bytes.push(224 | c >> 12, 128 | c >> 6 & 63, 128 | c & 63);
    else bytes.push(240 | c >> 18, 128 | c >> 12 & 63, 128 | c >> 6 & 63, 128 | c & 63);
  }
  const bitLength = bytes.length * 8;
  bytes.push(128); while (bytes.length % 64 !== 56) bytes.push(0);
  const high = Math.floor(bitLength / 4294967296), low = bitLength >>> 0;
  for (const word of [high, low]) for (let j = 3; j >= 0; j--) bytes.push(word >>> (8 * j) & 255);
  const primes = [], initial = [], constants = [];
  for (let n = 2; primes.length < 64; n++) {
    if (primes.some((p) => n % p === 0)) continue;
    primes.push(n);
    if (initial.length < 8) initial.push((Math.sqrt(n) % 1 * 4294967296) >>> 0);
    constants.push((Math.cbrt(n) % 1 * 4294967296) >>> 0);
  }
  const h = initial.slice(), rotr = (x, n) => x >>> n | x << 32 - n;
  for (let offset = 0; offset < bytes.length; offset += 64) {
    const w = [];
    for (let j = 0; j < 16; j++) w[j] = (bytes[offset + j * 4] << 24
      | bytes[offset + j * 4 + 1] << 16 | bytes[offset + j * 4 + 2] << 8 | bytes[offset + j * 4 + 3]) >>> 0;
    for (let j = 16; j < 64; j++) {
      const a = w[j - 15], b = w[j - 2];
      w[j] = (w[j - 16] + (rotr(a, 7) ^ rotr(a, 18) ^ a >>> 3)
        + w[j - 7] + (rotr(b, 17) ^ rotr(b, 19) ^ b >>> 10)) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let j = 0; j < 64; j++) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25))
        + (e & f ^ ~e & g) + constants[j] + w[j]) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + (a & b ^ a & c ^ b & c)) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    [a, b, c, d, e, f, g, hh].forEach((x, i) => { h[i] = (h[i] + x) >>> 0; });
  }
  return h.map((x) => x.toString(16).padStart(8, '0')).join('');
}
function parse(value) {
  for (let i = 0; i < 6; i++) {
    if (typeof value === 'string') {
      const text = value.trim();
      const outer = text.match(/^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/i);
      try { value = JSON.parse(outer ? outer[1] : text); }
      catch { fail('خروجی مدل JSON معتبر نیست.'); }
      continue;
    }
    if (Array.isArray(value)) {
      if (value.length !== 1) fail('باید یک پاسخ دریافت شود.');
      value = value[0]; continue;
    }
    if (!isObj(value)) fail('پاسخ باید object باشد.');
    if (Object.hasOwn(value, 'record') || Object.hasOwn(value, 'body')) return value;
    if (Object.hasOwn(value, 'output')) { value = value.output; continue; }
    if (Object.hasOwn(value, 'text')) { value = value.text; continue; }
    return value;
  }
  fail('لایه‌های پاسخ بیش از حد است.');
}
function list(value, key) {
  if (value == null || value === '') return [];
  let result;
  try { result = Array.isArray(value) ? value : JSON.parse(value); } catch { fail('JSON نامعتبر: ' + key); }
  if (!Array.isArray(result) || result.some((x) => typeof x !== 'string')) fail('آرایه نامعتبر: ' + key);
  return result;
}
function nonemptyRows(items) {
  return items.map((x) => x.json ?? x).filter((row) =>
    Object.keys(row).some((key) => key !== 'row_number' && str(row[key])));
}
const namespaces = ['group', 'useCase', 'domain', 'tool', 'intent', 'language',
  'difficulty', 'outputFormat', 'resourceType', 'fieldType'];
function makeRegistry(termRows, ruleRows, proposalRows, now) {
  const policy = {};
  for (const [index, row] of ruleRows.entries()) {
    const canonical = str(row.policy_key), legacy = str(row.key), value = str(row.value);
    const rowNumber = str(row.row_number) || String(index + 2);
    if (canonical && legacy && canonical !== legacy)
      fail('مقادیر policy_key و key در ردیف ' + rowNumber + ' با هم ناسازگارند.');
    const key = canonical || legacy;
    if (!key) {
      if (!Object.keys(row).some((name) => name !== 'row_number' && str(row[name]))) continue;
      fail('ستون policy_key در ردیف ' + rowNumber + ' قواعد خالی یا نام ستون نادرست است.');
    }
    if (Object.hasOwn(policy, key)) fail('کلید تکراری قواعد در ردیف ' + rowNumber + ': ' + key);
    policy[key] = value === 'true' ? true : value === 'false' ? false : /^\d+$/.test(value) ? Number(value) : value;
  }
  if (!str(policy.catalog_version)) fail('catalog_version در قواعد وجود ندارد.');
  if (policy.model_can_activate !== false) fail('model_can_activate باید false باشد.');
  const ids = new Set();
  const terms = termRows.map((row) => {
    const t = Object.fromEntries(['term_id', 'namespace', 'slug', 'title_fa', 'parent_id',
      'status', 'definition_fa', 'source_ref'].map((key) => [key, str(row[key])]));
    if (!namespaces.includes(t.namespace) || !t.slug || !t.title_fa
      || t.term_id !== t.namespace + ':' + t.slug || ids.has(t.term_id)
      || !['active', 'proposed', 'legacy', 'archived'].includes(t.status)) fail('واژه نامعتبر یا تکراری: ' + t.term_id);
    ids.add(t.term_id);
    t.aliases_json = JSON.stringify(list(row.aliases_json, t.term_id));
    t.replacement_ids_json = JSON.stringify(list(row.replacement_ids_json, t.term_id));
    t.sort_order = Number(row.sort_order) || 0;
    return t;
  });
  if (!terms.length) fail('برگه واژگان خالی است.');
  for (const t of terms) if (t.parent_id && !ids.has(t.parent_id)) fail('والد نامعتبر: ' + t.parent_id);
  const active = (ns) => terms.filter((t) => t.namespace === ns && t.status === 'active');
  const allowedTaxonomies = {};
  for (const [key, ns] of Object.entries({ intents: 'intent', domains: 'domain', tools: 'tool',
    languages: 'language', difficulties: 'difficulty', outputFormats: 'outputFormat' }))
    allowedTaxonomies[key] = active(ns).map((t) => t.slug);
  const compact = (t) => ({ term_id: t.term_id, namespace: t.namespace, slug: t.slug,
    title_fa: t.title_fa, parent_id: t.parent_id, status: t.status,
    aliases_json: t.aliases_json, definition_fa: t.definition_fa });
  const coreTerms = terms.filter((t) => !['useCase', 'domain', 'tool'].includes(t.namespace)).map(compact);
  return { lookupStatus: 'ok', version: policy.catalog_version, retrievedAt: now,
    terms, policy, proposals: proposalRows, allowedTaxonomies,
    catalogContext: { useCaseIndex: active('useCase').map((t) => [t.slug, t.title_fa, t.parent_id]),
      domainIndex: active('domain').map((t) => [t.slug, t.title_fa]),
      toolIndex: active('tool').map((t) => [t.slug, t.title_fa]),
      indexColumns: { useCaseIndex: ['slug', 'title_fa', 'parent_id'], domainIndex: ['slug', 'title_fa'], toolIndex: ['slug', 'title_fa'] },
      indexesComplete: true, lookupStatus: 'ok', version: policy.catalog_version, retrievedAt: now,
      terms: coreTerms, policy, writeMode: 'single_manual_test' } };
}
function tokenCounts(body) {
  let fence = null;
  const prose = body.split('\n').map((line) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) { if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null; return ''; }
    return fence ? '' : line;
  }).join('\n');
  const result = new Map();
  for (const m of prose.matchAll(/\[\[([^\]\n]+)\]\]|\{\{([^{}\n]+)\}\}/g)) {
    const key = m[1] ?? m[2];
    if (!/^[a-z][a-z0-9_]*$/.test(key)) fail('کلید متغیر نامعتبر: ' + key);
    result.set(key, (result.get(key) || 0) + 1);
  }
  return result;
}
function validateRecord(input, registry, evidence) {
  const record = JSON.parse(JSON.stringify(parse(input)));
  const keys = ['title', 'description', 'useCase', 'relatedUseCases', 'resourceType', 'intent',
    'domains', 'tools', 'task', 'language', 'difficulty', 'outputFormats', 'tags',
    'requiresReferenceImage', 'body', 'bodyFa', 'fieldsSchema', 'editorial'];
  if (Object.keys(record).length !== keys.length || keys.some((k) => !Object.hasOwn(record, k)))
    fail('قرارداد رکورد باید دقیقاً ۱۸ کلید داشته باشد.');
  for (const k of ['title', 'description', 'task', 'body', 'bodyFa'])
    if (typeof record[k] !== 'string' || !record[k].trim()) fail('فیلد متنی خالی: ' + k);
  const e = record.editorial;
  const exactKeys = (v, keys) => isObj(v) && Object.keys(v).length === keys.length && keys.every((k) => Object.hasOwn(v, k));
  if (!exactKeys(e, ['catalogVersion', 'classificationReason', 'needsReview', 'reviewNotes', 'execution', 'fixedConstraints', 'improvementSuggestions', 'referenceImageReason', 'referenceImageEvidence'])
    || typeof e.classificationReason !== 'string' || !e.classificationReason.trim()
    || typeof e.needsReview !== 'boolean' || !Array.isArray(e.reviewNotes) || e.reviewNotes.some((s) => typeof s !== 'string'))
    fail('editorial نامعتبر است.');
  if(!Array.isArray(e.fixedConstraints)||e.fixedConstraints.some(v=>typeof v!=='string')||!Array.isArray(e.improvementSuggestions)
    || e.improvementSuggestions.some(v=>!exactKeys(v,['title','reason','proposedChange'])||Object.values(v).some(t=>typeof t!=='string'||!t.trim()))
    || typeof e.referenceImageReason!=='string'||!e.referenceImageReason.trim()||typeof e.referenceImageEvidence!=='string') fail('گزارش بازبینی کامل نیست.');
  const flag = (note) => { e.needsReview = true; if (!e.reviewNotes.includes(note)) e.reviewNotes.push(note); };
  if (e.catalogVersion !== registry.version) { flag('نسخه اعلام‌شده مدل با شیت تطبیق نداشت؛ نسخه واقعی ثبت شد.'); e.catalogVersion = registry.version; }
  const active = (ns, value) => registry.terms.some((t) => t.namespace === ns && t.slug === value && t.status === 'active');
  for (const [key, ns] of Object.entries({ useCase: 'useCase', resourceType: 'resourceType',
    intent: 'intent', language: 'language', difficulty: 'difficulty' })) {
    if (record[key] !== null && typeof record[key] !== 'string') fail('نوع نامعتبر: ' + key);
    if (!active(ns, record[key])) { record[key] = null; flag('انتخاب حل‌نشده یا غیرفعال: ' + key); }
  }
  for (const [key, ns] of Object.entries({ relatedUseCases: 'useCase', domains: 'domain', tools: 'tool', outputFormats: 'outputFormat', tags: null })) {
    if (!Array.isArray(record[key]) || record[key].some((v) => typeof v !== 'string' || !v.trim())) fail('آرایه نامعتبر: ' + key);
    if (new Set(record[key]).size !== record[key].length) fail('مقدار تکراری در ' + key);
    if (ns) {
      const filtered = record[key].filter((v) => active(ns, v));
      if (filtered.length !== record[key].length) flag('مقادیر تأییدنشده حذف شد: ' + key);
      record[key] = filtered;
    }
  }
  if (record.relatedUseCases.length > 2 || record.relatedUseCases.includes(record.useCase)) fail('کاربردهای مرتبط نامعتبر');
  if (!record.outputFormats.length) flag('نوع خروجی هنوز تعیین نشده است.');
  if (typeof record.requiresReferenceImage !== 'boolean' || !Array.isArray(record.fieldsSchema)) fail('نوع فیلد/عکس مرجع نامعتبر');
  const fieldKeys = new Set();
  for (const f of record.fieldsSchema) {
    if (!isObj(f) || Object.keys(f).some((k) => !['key', 'label', 'type', 'required', 'placeholder', 'options', 'min', 'max', 'sourceText', 'defaultValue', 'defaultValueFa', 'advanced', 'allowCustom'].includes(k))) fail('ساختار فیلد نامعتبر');
    if (!/^[a-z][a-z0-9_]*$/.test(f.key) || fieldKeys.has(f.key) || !str(f.label) || f.required !== true
      || !active('fieldType', f.type)) fail('فیلد نامعتبر: ' + f.key);
    fieldKeys.add(f.key);
    for (const key of ['sourceText','defaultValue','defaultValueFa']) if(typeof f[key]!=='string') fail('عبارت منبع یا پیش‌فرض فیلد ناقص است.');
    if(typeof f.advanced!=='boolean'||typeof f.allowCustom!=='boolean') fail('گروه فیلد یا امکان ورودی دلخواه مشخص نیست.');
    if (f.placeholder !== undefined && typeof f.placeholder !== 'string') fail('placeholder نامعتبر');
    if (f.options !== undefined && (!Array.isArray(f.options) || f.options.some((v) => typeof v !== 'string' || !v.trim()))) fail('گزینه‌های نامعتبر');
    if (['select', 'radio', 'multiselect'].includes(f.type)) {
      if (!f.options?.length) fail('گزینه‌های فیلد خالی است.');
      const values = f.options.map((v) => v.split('|')[0].trim());
      if (new Set(values).size !== values.length || values.some((v) => !v)
        || f.options.some((v) => v.split('|').length > 2 || v.includes('|') && !v.split('|')[1].trim())) fail('گزینه تکراری/نامعتبر');
    }
    for (const k of ['min', 'max']) if (f[k] !== undefined && !Number.isFinite(f[k])) fail('محدوده عددی نامعتبر');
    if (f.type === 'slider' && !(Number.isFinite(f.min) && Number.isFinite(f.max) && f.min < f.max)) fail('slider نامعتبر');
  }
  const en = tokenCounts(record.body), fa = tokenCounts(record.bodyFa);
  if (en.size !== fieldKeys.size || [...fieldKeys].some((k) => !en.has(k))
    || en.size !== fa.size || [...en].some(([k, n]) => fa.get(k) !== n)) fail('متغیرهای دو زبان و فرم یکسان نیستند.');
  if (!exactKeys(e.execution, ['requiredCapabilities', 'routes']) || !Array.isArray(e.execution.requiredCapabilities)
    || e.execution.requiredCapabilities.some((s) => typeof s !== 'string' || !s.trim()) || !Array.isArray(e.execution.routes)) fail('اطلاعات اجرا نامعتبر');
  for (const r of e.execution.routes) {
    if (!exactKeys(r, ['environment', 'model', 'status', 'testedAt', 'evidenceRefs', 'requirements', 'steps'])
      || !str(r.environment) || r.model !== null && typeof r.model !== 'string'
      || !['suggested', 'tested'].includes(r.status)) fail('مسیر اجرا نامعتبر');
    for (const k of ['evidenceRefs', 'requirements', 'steps'])
      if (!Array.isArray(r[k]) || r[k].some((s) => typeof s !== 'string' || !s.trim())) fail('آرایه مسیر اجرا نامعتبر');
    if (r.status === 'tested') {
      const proved = r.evidenceRefs.length && /^\d{4}-\d{2}-\d{2}$/.test(r.testedAt || '')
        && r.evidenceRefs.every((id) => evidence.some((p) => p.id === id && p.status === 'passed'
          && p.environment === r.environment && p.model === r.model && p.testedAt === r.testedAt && str(p.result)));
      if (!proved) { r.status = 'suggested'; r.testedAt = null; r.evidenceRefs = []; flag('ادعای آزمون بدون شاهد به پیشنهاد تبدیل شد.'); }
    } else { r.testedAt = null; r.evidenceRefs = []; }
  }
  return record;
}


function verifySourceFidelity(sourceText, body, fields) {
  const no = (reason) => ({ status: "needs-review", reason });
  const canonical = (text) => text.replace(/\r\n?/g, "\n").trim();
  if (!sourceText.trim() || !body.trim()) return no("\u0645\u062A\u0646 \u0627\u0635\u0644\u06CC \u06CC\u0627 \u0645\u062A\u0646 \u0622\u0645\u0627\u062F\u0647\u200C\u0634\u062F\u0647 \u062E\u0627\u0644\u06CC \u0627\u0633\u062A.");
  const spans = /* @__PURE__ */ new Map();
  for (const field of fields) {
    if (!field.sourceText || !sourceText.includes(field.sourceText)) return no(`\u0639\u0628\u0627\u0631\u062A \u0627\u0635\u0644\u06CC \u0641\u06CC\u0644\u062F \xAB${field.label}\xBB \u062F\u0631 \u0645\u0646\u0628\u0639 \u0645\u0634\u062E\u0635 \u0646\u06CC\u0633\u062A.`);
    if (spans.has(field.key)) return no("\u06A9\u0644\u06CC\u062F \u062A\u06A9\u0631\u0627\u0631\u06CC \u062F\u0631 \u0641\u06CC\u0644\u062F\u0647\u0627 \u0648\u062C\u0648\u062F \u062F\u0627\u0631\u062F.");
    if (!/^[a-z][a-z0-9_]*$/.test(field.key)) return no("\u06A9\u0644\u06CC\u062F \u0641\u06CC\u0644\u062F \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A.");
    const inputToken = /^(?:\{\{[^{}]+\}\}|\[\[[^\]]+\]\]|\[[^\]\n]+\])$/.test(field.sourceText);
    if (!inputToken && field.defaultValue !== field.sourceText) return no(`\u067E\u06CC\u0634\u200C\u0641\u0631\u0636 \u0641\u06CC\u0644\u062F \xAB${field.label}\xBB \u0628\u0627 \u0639\u0628\u0627\u0631\u062A \u0627\u0635\u0644\u06CC \u0628\u0631\u0627\u0628\u0631 \u0646\u06CC\u0633\u062A.`);
    if (inputToken && field.defaultValue) return no(`\u0628\u0631\u0627\u06CC \u0648\u0631\u0648\u062F\u06CC \xAB${field.label}\xBB \u0645\u0642\u062F\u0627\u0631 \u067E\u06CC\u0634\u200C\u0641\u0631\u0636 \u0633\u0627\u062E\u062A\u06AF\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.`);
    if (field.options?.length && field.defaultValue && field.options[0].split("|")[0].trim() !== field.defaultValue)
      return no(`\u0627\u0648\u0644\u06CC\u0646 \u06AF\u0632\u06CC\u0646\u0647\u0654 \xAB${field.label}\xBB \u067E\u06CC\u0634\u200C\u0641\u0631\u0636 \u0627\u0635\u0644\u06CC \u0631\u0627 \u0628\u0627\u0632\u0633\u0627\u0632\u06CC \u0646\u0645\u06CC\u200C\u06A9\u0646\u062F.`);
    if (!body.includes(`[[${field.key}]]`) && !body.includes(`{{${field.key}}}`)) return no(`\u0641\u06CC\u0644\u062F \xAB${field.label}\xBB \u062F\u0631 \u0645\u062A\u0646 \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A.`);
    if (field.options?.length && field.defaultValueFa && field.options[0].includes("|") && field.options[0].split("|")[1].trim() !== field.defaultValueFa)
      return no(`\u067E\u06CC\u0634\u200C\u0641\u0631\u0636 \u0641\u0627\u0631\u0633\u06CC \xAB${field.label}\xBB \u0628\u0627 \u0627\u0648\u0644\u06CC\u0646 \u06AF\u0632\u06CC\u0646\u0647 \u0647\u0645\u0627\u0647\u0646\u06AF \u0646\u06CC\u0633\u062A.`);
    spans.set(field.key, field.sourceText);
  }
  const restored = body.replace(
    /\[\[([a-z][a-z0-9_]*)\]\]|\{\{([a-z][a-z0-9_]*)\}\}/g,
    (token, a, b) => spans.get(a || b) ?? token
  );
  if (canonical(restored) !== canonical(sourceText)) return no("\u0645\u062A\u0646 \u0622\u0645\u0627\u062F\u0647\u200C\u0634\u062F\u0647 \u067E\u0633 \u0627\u0632 \u0628\u0627\u0632\u06AF\u0631\u062F\u0627\u0646\u062F\u0646 \u0639\u0628\u0627\u0631\u062A\u200C\u0647\u0627\u06CC \u0627\u0635\u0644\u06CC \u0628\u0627 \u0645\u0646\u0628\u0639 \u0628\u0631\u0627\u0628\u0631 \u0646\u06CC\u0633\u062A\u061B \u0645\u0645\u06A9\u0646 \u0627\u0633\u062A \u0639\u0628\u0627\u0631\u062A\u06CC \u062D\u0630\u0641 \u06CC\u0627 \u062A\u063A\u06CC\u06CC\u0631 \u06A9\u0631\u062F\u0647 \u0628\u0627\u0634\u062F.");
  return { status: "verified", reason: "\u0645\u062A\u0646 \u0632\u0628\u0627\u0646 \u0627\u0635\u0644\u06CC \u0628\u0627 \u0628\u0627\u0632\u06AF\u0631\u062F\u0627\u0646\u062F\u0646 \u0639\u0628\u0627\u0631\u062A\u200C\u0647\u0627\u06CC \u0641\u06CC\u0644\u062F\u0647\u0627 \u062F\u0642\u06CC\u0642\u0627\u064B \u062D\u0641\u0638 \u0634\u062F\u0647 \u0627\u0633\u062A\u061B \u062A\u0631\u062C\u0645\u0647 \u0648 \u06AF\u0632\u06CC\u0646\u0647\u200C\u0647\u0627\u06CC \u062C\u0627\u06CC\u06AF\u0632\u06CC\u0646 \u0647\u0646\u0648\u0632 \u0646\u06CC\u0627\u0632\u0645\u0646\u062F \u0628\u0627\u0632\u0628\u06CC\u0646\u06CC\u200C\u0627\u0646\u062F." };
}

// n8n runtime-independent helpers. No network, credentials, filesystem, tool loops or cached model output.
function prepareFastInput(input, mode, now = Date.now()) {
  if (mode !== 'test') throw new Error('این نسخه هنوز برای تست است؛ انتشار دائمی پس از پذیرش و تنظیم دسترسی انجام می‌شود.');
  const payload = input?.body && typeof input.body === 'object' ? input.body : input;
  if (!payload || payload.action && payload.action !== 'analyze_source') throw new Error('درخواست تحلیل معتبر نیست.');
  if (typeof payload.sourceText !== 'string' || !payload.sourceText.trim()) throw new Error('متن خام پرامپت خالی است.');
  if (payload.sourceText.length > 6000) throw new Error('این مسیر سریع تا ۶۰۰۰ نویسه متن خام می‌پذیرد؛ متن بلندتر خودکار کوتاه نمی‌شود. آن را به وظایف مستقل تقسیم یا دستی آماده کنید.');
  return {sourceText: payload.sourceText.trim(), requestKind: input?.body ? 'webhook' : 'manual', startedAt: now, deadlineAt: now + 28000};
}

function compactFastCatalog(registry) {
  const values = namespace => registry.terms.filter(t => t.namespace === namespace && t.status === 'active').map(t => t.slug);
  return {version: registry.version, useCases: registry.catalogContext.useCaseIndex,
    domains: registry.catalogContext.domainIndex, tools: registry.catalogContext.toolIndex,
    intents: values('intent'), languages: values('language'), difficulties: values('difficulty'),
    outputFormats: values('outputFormat'), resourceTypes: values('resourceType'), fieldTypes: values('fieldType')};
}

function buildFastRequest(input, registry, system, model, now = Date.now()) {
  const catalog = compactFastCatalog(registry);
  let requiredInputKeys=[]; try { requiredInputKeys=[...tokenCounts(input.sourceText).keys()]; } catch {}
  const timeoutMs = Math.min(24000, input.deadlineAt - now - 1500);
  if (timeoutMs < 1000) throw new Error('بودجهٔ زمانی پیش از فراخوانی مدل تمام شد؛ نتیجهٔ ناقص وارد نمی‌شود.');
  return {registry, catalog, requiredInputKeys, sourceText:input.sourceText, startedAt: input.startedAt, modelStartedAt: now, timeoutMs,
    model, request: {systemInstruction: {parts:[{text:system}]}, contents:[{role:'user',parts:[{text:JSON.stringify({sourceText:input.sourceText,catalog,requiredInputKeys})}]}],
      generationConfig: {responseJsonSchema:fastOutputSchema(catalog,requiredInputKeys),temperature:0.2,maxOutputTokens:6000,responseMimeType:'application/json',thinkingConfig:{thinkingLevel:'LOW'}}}};
}

function finishFastResponse(response, context, now = Date.now()) {
  const durationMs = now - context.startedAt;
  const failResult = (code, message, httpStatus = 422) => ({ok: false, code, message, httpStatus, durationMs});
  if (durationMs >= 29000) return failResult('ANALYSIS_DEADLINE', 'مهلت آماده‌سازی تمام شد؛ نتیجه‌ای به فرم وارد نشد.', 504);
  if (response?.error) return failResult('MODEL_REQUEST_FAILED', 'مدل نتوانست نتیجهٔ کامل تحویل دهد؛ پاسخ ناقص وارد نشد.', 502);
  const choice = response?.candidates?.[0];
  const content = choice?.content?.parts?.filter(p => p.thought !== true && typeof p.text === 'string').map(p => p.text).join('');
  if (!choice || choice.finishReason !== 'STOP' || !content)
    return failResult('INCOMPLETE_MODEL_OUTPUT', 'خروجی مدل کامل نیست؛ هیچ فیلد فرم تغییر نکرد.', 502);
  try {
    const record = validateRecord(content, context.registry, []);
    const fidelity=verifySourceFidelity(context.sourceText,record.body,record.fieldsSchema);
    if(fidelity.status!=='verified') throw new Error(fidelity.reason);
    if(record.requiresReferenceImage && (!record.editorial.referenceImageEvidence || !context.sourceText.includes(record.editorial.referenceImageEvidence))) throw new Error('شاهد نیاز به تصویر ورودی در متن خام یافت نشد.');
    record.editorial.sourceText=context.sourceText;
    record.editorial.fidelity=fidelity;
    if (record.editorial.execution.routes.length) throw new Error('مسیر اجرای بدون شاهد در خروجی سریع مجاز نیست.');
    // Structural checks are not a second model's semantic review or publication approval.
    record.editorial.needsReview = true;
    const reviewNote = 'این پیش‌نویس با یک فراخوانی مدل و کنترل ساختاری و حفظ متن اصلی تهیه شد؛ بازبینی معنایی ادمین پیش از انتشار لازم است.';
    if (!record.editorial.reviewNotes.includes(reviewNote)) record.editorial.reviewNotes.push(reviewNote);
    return {ok: true, httpStatus: 200, record, durationMs,
      metrics: {durationMs, catalogMs: context.modelStartedAt - context.startedAt, modelMs: now - context.modelStartedAt,
        modelCalls: 1, model: context.model, promptTokens: response.usageMetadata?.promptTokenCount ?? null,
        completionTokens: response.usageMetadata?.candidatesTokenCount ?? null, reasoningTokens: response.usageMetadata?.thoughtsTokenCount ?? null,
        provider: 'Google Gemini'}};
  } catch (error) {
    return failResult('INVALID_MODEL_OUTPUT', 'نتیجهٔ مدل از کنترل ساختاری عبور نکرد: ' + error.message);
  }
}

function fastOutputSchema(catalog,requiredInputKeys=[]) {
  const text={type:'string',minLength:1};
  const array=items=>({type:'array',items});
  const closed=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
  const choose=values=>({type:['string','null'],enum:[...values,null]});
  const field=closed({key:{...text,pattern:'^[a-z][a-z0-9_]*$'},label:{...text,description:'Persian user-facing label; property name is exactly label'},type:{type:'string',enum:catalog.fieldTypes},required:{type:'boolean',enum:[true]},sourceText:text,defaultValue:{type:'string'},defaultValueFa:{type:'string'},advanced:{type:'boolean'},allowCustom:{type:'boolean'},placeholder:text,options:array(text),min:{type:'number'},max:{type:'number'}},['key','label','type','required','sourceText','defaultValue','defaultValueFa','advanced','allowCustom']);
  return closed({
    title:{...text,description:'Natural Persian title'},description:{...text,description:'Persian description'},
    useCase:choose(catalog.useCases.map(r=>r[0])),relatedUseCases:{...array({type:'string',enum:catalog.useCases.map(r=>r[0])}),maxItems:2},
    resourceType:choose(catalog.resourceTypes),intent:choose(catalog.intents),
    domains:array({type:'string',enum:catalog.domains.map(r=>r[0])}),
    tools:{...array(text),maxItems:0,description:'No tool execution or compatibility has been independently verified in this draft path.'},
    task:{...text,description:'Task description in Persian'},language:choose(catalog.languages),difficulty:choose(catalog.difficulties),
    outputFormats:array({type:'string',enum:catalog.outputFormats}),tags:array(text),requiresReferenceImage:{type:'boolean'},
    body:{...text,description:'Complete source-language executable prompt. Preserve every source sentence, list item, negative, reference condition and tip. Only safe small-phrase placeholders may replace text.'},
    bodyFa:{...text,description:'Complete fluent Persian counterpart of body with every source requirement, negative, reference condition and tip; same bare placeholders.'},
    fieldsSchema:{...array(field),minItems:requiredInputKeys.length},
    editorial:closed({catalogVersion:{type:'string',enum:[catalog.version]},classificationReason:text,needsReview:{type:'boolean',enum:[true]},reviewNotes:array(text),fixedConstraints:{...array(text),maxItems:5},improvementSuggestions:{...array(closed({title:text,reason:text,proposedChange:text})),maxItems:2},referenceImageReason:text,referenceImageEvidence:{type:'string'},execution:closed({requiredCapabilities:array(text),routes:{...array(text),maxItems:0}})})
  });
}
