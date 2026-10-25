// n8n runtime-independent helpers. No network, credentials, filesystem, tool loops or cached model output.
function prepareFastInput(input, mode, now = Date.now()) {
  if (mode !== 'test') throw new Error('این نسخه هنوز برای تست است؛ انتشار دائمی پس از پذیرش و تنظیم دسترسی انجام می‌شود.');
  const payload = input?.body && typeof input.body === 'object' ? input.body : input;
  if (!payload || payload.action && payload.action !== 'analyze_source') throw new Error('درخواست تحلیل معتبر نیست.');
  if (typeof payload.sourceText !== 'string' || !payload.sourceText.trim()) throw new Error('متن خام پرامپت خالی است.');
  if (payload.sourceText.length > 40000) throw new Error('متن ورودی بیش از حد مجاز است؛ هیچ بخشی از آن خودکار حذف نمی‌شود.');
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
  const timeoutMs = Math.min(24000, input.deadlineAt - now - 1500);
  if (timeoutMs < 1000) throw new Error('بودجهٔ زمانی پیش از فراخوانی مدل تمام شد؛ نتیجهٔ ناقص وارد نمی‌شود.');
  return {registry, catalog, startedAt: input.startedAt, modelStartedAt: now, timeoutMs,
    model, request: {systemInstruction: {parts:[{text:system}]}, contents:[{role:'user',parts:[{text:JSON.stringify({sourceText:input.sourceText,catalog})}]}],
      generationConfig: {temperature:0.2,maxOutputTokens:6000,responseMimeType:'application/json',thinkingConfig:{thinkingLevel:'LOW'}}}};
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
    if (record.editorial.execution.routes.length) throw new Error('مسیر اجرای بدون شاهد در خروجی سریع مجاز نیست.');
    // Structural checks are not a second model's semantic review or publication approval.
    record.editorial.needsReview = true;
    const reviewNote = 'این پیش‌نویس با یک فراخوانی مدل و کنترل ساختاری تهیه شد؛ بازبینی معنایی ادمین پیش از انتشار لازم است.';
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
