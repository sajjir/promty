/** n8n's streaming transport contains model frames as well as the final response.
 * Only the named Respond node's complete validated-result envelope is imported. */
const FINAL_NODE = 'Respond — نتیجه معتبر';
const PROTOCOL = 'promty.validated-result.v1';
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const object = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);

export function parseAgentResponse(text: string): unknown {
  let whole: any;
  try { whole = JSON.parse(text); } catch { /* A stream is newline-delimited JSON. */ }
  if (whole !== undefined && !(object(whole) && typeof whole.type === 'string' && object(whole.metadata))) return whole;
  const frames: any[] = whole !== undefined ? [whole] : text.split(/\r?\n/).filter(line => line.trim()).map(line => {
    try { return JSON.parse(line); } catch { throw new Error('پاسخ تدریجی ایجنت ناقص یا نامعتبر است.'); }
  });
  let record: unknown;
  let ended = false;
  let finalRun: unknown;
  for (const frame of frames) {
    if (!object(frame) || !object(frame.metadata) || typeof frame.type !== 'string')
      throw new Error('ساختار پاسخ تدریجی ایجنت معتبر نیست.');
    if (frame.type === 'error') throw new Error('پردازش ورک‌فلو پیش از تحویل نتیجهٔ معتبر متوقف شد.');
    if (frame.metadata.nodeName !== FINAL_NODE) continue;
    if (frame.type === 'item') {
      if (record !== undefined) throw new Error('ایجنت بیش از یک نتیجهٔ نهایی فرستاده است.');
      let payload: any = frame.content;
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch { throw new Error('نتیجهٔ نهایی ایجنت JSON معتبر نیست.'); }
      }
      if (!object(payload) || payload.protocol !== PROTOCOL || !object(payload.record))
        throw new Error('نتیجهٔ تأییدشده در پاسخ ایجنت پیدا نشد.');
      record = payload.record;
      finalRun = frame.metadata.runIndex;
    } else if (frame.type === 'end' && record !== undefined && frame.metadata.runIndex === finalRun) ended = true;
  }
  if (record === undefined || !ended) throw new Error('پاسخ ایجنت پیش از تکمیل اعتبارسنجی نهایی قطع شد.');
  return record;
}

export async function readAgentResponse(response: Response): Promise<unknown> {
  if (!response.body) throw new Error('پاسخ ایجنت خالی است.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error('حجم پاسخ ایجنت بیش از حد مجاز است.');
      }
      text += decoder.decode(value, {stream: true});
    }
    text += decoder.decode();
    return parseAgentResponse(text);
  } finally { reader.releaseLock(); }
}
