// n8n Code node: JavaScript, Run Once for All Items.
// Proposed replacement; validated locally, not deployed to n8n.
function fail(message) { throw new Error(`Promty output validation: ${message}`); }
function record(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function parseResponse(value) {
  for (let depth = 0; depth < 5; depth++) {
    if (typeof value === 'string') {
      const text = value.trim();
      try { value = JSON.parse(text); }
      catch {
        const outer = text.match(/^```(?:json)?\s*\r?\n([\s\S]*?)\r?\n```\s*$/i);
        if (!outer) fail('response is not valid JSON');
        try { value = JSON.parse(outer[1]); } catch { fail('outer-fenced response is not valid JSON'); }
      }
      continue;
    }
    if (Array.isArray(value)) {
      if (value.length !== 1) fail('expected exactly one prompt record');
      value = value[0]; continue;
    }
    if (!record(value)) fail('expected a JSON object');
    if (Object.hasOwn(value, 'body')) return value;
    if (Object.hasOwn(value, 'output')) { value = value.output; continue; }
    if (Object.hasOwn(value, 'text')) { value = value.text; continue; }
    return value;
  }
  fail('too many nested response wrappers');
}

function validate(value, allowedTaxonomies) {
  if (!record(allowedTaxonomies)) fail('allowedTaxonomies missing');
  const obj = { ...parseResponse(value) };
  for (const key of ['industry', 'routing_category', 'content_type', 'source_language', 'routing_confidence', 'routing_note']) delete obj[key];
  const rootKeys = ['title', 'description', 'intent', 'domains', 'tools', 'task', 'language', 'difficulty', 'outputFormats', 'tags', 'requiresReferenceImage', 'body', 'bodyFa', 'fieldsSchema'];
  if (Object.keys(obj).some(key => !rootKeys.includes(key))) fail('unsupported root property');
  if (rootKeys.some(key => !Object.hasOwn(obj, key))) fail('required root property missing');
  for (const key of ['title', 'description', 'task', 'body', 'bodyFa', 'intent', 'language', 'difficulty']) {
    if (typeof obj[key] !== 'string' || !obj[key].trim()) fail(`${key} must be a nonempty string`);
  }
  for (const key of ['domains', 'tools', 'outputFormats', 'tags']) {
    if (!Array.isArray(obj[key]) || obj[key].some(item => typeof item !== 'string' || !item.trim())) fail(`${key} must be a string array`);
    if (new Set(obj[key]).size !== obj[key].length) fail(`${key} contains duplicates`);
  }
  if (!obj.outputFormats.length) fail('outputFormats cannot be empty');
  if (typeof obj.requiresReferenceImage !== 'boolean') fail('requiresReferenceImage must be boolean');
  const taxonomyMap = { intent: 'intents', domains: 'domains', tools: 'tools', language: 'languages', difficulty: 'difficulties', outputFormats: 'outputFormats' };
  for (const [key, listKey] of Object.entries(taxonomyMap)) {
    const input = allowedTaxonomies[listKey];
    if (!(typeof input === 'string' || Array.isArray(input))) fail(`taxonomy ${listKey} missing`);
    const list = Array.isArray(input) ? input : input.split(',');
    if (list.some(entry => typeof entry !== 'string')) fail(`invalid taxonomy ${listKey}`);
    const allowed = new Set(list.map(entry => entry.trim()).filter(Boolean));
    const values = Array.isArray(obj[key]) ? obj[key] : [obj[key]];
    if (values.some(entry => !allowed.has(entry))) fail(`${key} contains an unapproved value`);
  }
  if (!Array.isArray(obj.fieldsSchema)) fail('fieldsSchema must be an array');
  const types = new Set(['text', 'textarea', 'color', 'select', 'radio', 'switch', 'slider', 'multiselect', 'url']);
  const fieldProperties = new Set(['key', 'label', 'type', 'required', 'placeholder', 'options', 'min', 'max']);
  const keys = new Set();
  for (const field of obj.fieldsSchema) {
    if (!record(field) || Object.keys(field).some(key => !fieldProperties.has(key))) fail('invalid field object');
    if (typeof field.key !== 'string' || !/^[a-z][a-z0-9_]*$/.test(field.key) || keys.has(field.key)) fail('invalid or duplicate field key');
    keys.add(field.key);
    if (typeof field.label !== 'string' || !field.label.trim() || !types.has(field.type)) fail(`invalid label/type for ${field.key}`);
    if (field.required !== true) fail(`required must be true for ${field.key}`);
    if (field.placeholder !== undefined && typeof field.placeholder !== 'string') fail(`invalid placeholder for ${field.key}`);
    if (field.options !== undefined && (!Array.isArray(field.options) || field.options.some(option => typeof option !== 'string' || !option.trim()))) fail(`invalid options for ${field.key}`);
    if (['select', 'radio', 'multiselect'].includes(field.type)) {
      if (!field.options?.length) fail(`missing options for ${field.key}`);
      const values = field.options.map(option => option.split('|')[0].trim());
      if (values.some(option => !option) || new Set(values).size !== values.length) fail(`empty/duplicate option value for ${field.key}`);
      if (field.options.some(option => option.split('|').length > 2 || (option.includes('|') && !option.split('|')[1].trim()))) fail(`invalid value|label for ${field.key}`);
    }
    for (const prop of ['min', 'max']) {
      if (field[prop] !== undefined && (typeof field[prop] !== 'number' || !Number.isFinite(field[prop]))) fail(`invalid ${prop} for ${field.key}`);
    }
    if (field.type === 'slider' && !(Number.isFinite(field.min) && Number.isFinite(field.max) && field.min < field.max)) fail(`invalid slider range for ${field.key}`);
  }
  // Validate placeholder occurrences outside literal fenced code examples.
  // Preserving the code text is essential: only the counting view is masked.
  function placeholders(body) {
    let fence = null;
    const prose = body.split('\n').map(line => {
      const marker = line.match(/^\s*(`{3,}|~{3,})/);
      if (marker) {
        if (!fence) fence = marker[1];
        else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
        return '';
      }
      return fence ? '' : line;
    }).join('\n');
    const result = new Map();
    for (const match of prose.matchAll(/\[\[([^\]\n]+)\]\]|\{\{([^{}\n]+)\}\}/g)) {
      const key = match[1] ?? match[2];
      if (!/^[a-z][a-z0-9_]*$/.test(key)) fail('invalid personalization token');
      result.set(key, (result.get(key) || 0) + 1);
    }
    return result;
  }
  const en = placeholders(obj.body), fa = placeholders(obj.bodyFa);
  if (en.size !== keys.size || [...keys].some(key => !en.has(key))) fail('body/schema orphan');
  if (en.size !== fa.size || [...en].some(([key, count]) => fa.get(key) !== count)) fail('body/bodyFa placeholder mismatch');
  return obj;
}

const items = $input.all();
if (items.length !== 1) fail('expected one incoming item');
const request = $('Webhook').first().json.body;
return [{ json: validate(items[0].json, request.allowedTaxonomies) }];
