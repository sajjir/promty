import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

type RecordEntry = { hash?: string; expiresAt?: number; attempts: number; sends: number[] };
type State = Record<string, RecordEntry>;
/** Single source of OTP truth. All processes must use the same durable path.
 * Exclusive filesystem lock fails closed on contention or a crashed writer.
 * Atomic rename ensures a completed consumption survives application restart.
 */
export class DurableOtpStore {
  constructor(private file = process.env.OTP_STORE_PATH || path.resolve('.private/otp-store.json'), private now = Date.now) {}
  private hash(phone: string, code: string) {
    if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) throw new Error('JWT_SECRET is required for OTP storage.');
    return crypto.createHmac('sha256', process.env.JWT_SECRET || 'local-only-otp-key').update(phone + ':' + code.trim()).digest('hex');
  }
  private transaction<T>(fn: (state: State) => T): T {
    fs.mkdirSync(path.dirname(this.file), { recursive: true, mode: 0o700 });
    const lock = this.file + '.lock';
    let fd: number;
    try { fd = fs.openSync(lock, 'wx', 0o600); }
    catch { throw new Error('OTP store busy or unavailable; try again later.'); }
    let temp: string | undefined;
    try {
      const state: State = fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file, 'utf8')) : {};
      // Expired state cannot bypass the hourly send budget; only prune after the full window.
      for (const [phone, entry] of Object.entries(state)) {
        if (entry.sends.every(t => t <= this.now() - 3600000) && (!entry.expiresAt || entry.expiresAt <= this.now())) delete state[phone];
      }
      const result = fn(state);
      temp = this.file + '.' + crypto.randomUUID() + '.tmp';
      const out = fs.openSync(temp, 'wx', 0o600);
      try { fs.writeFileSync(out, JSON.stringify(state)); fs.fsyncSync(out); } finally { fs.closeSync(out); }
      fs.renameSync(temp, this.file);
      const directory = fs.openSync(path.dirname(this.file), 'r');
      try { fs.fsyncSync(directory); } finally { fs.closeSync(directory); }
      return result;
    } finally {
      if (temp && fs.existsSync(temp)) fs.unlinkSync(temp);
      fs.closeSync(fd);
      fs.unlinkSync(lock);
    }
  }
  private rate(entry: RecordEntry | undefined) {
    const sends = entry?.sends.filter(t => t > this.now() - 3600000) || [];
    const last = sends.at(-1);
    const wait = sends.length >= 5 ? sends[0] + 3600000 - this.now() : last === undefined ? 0 : last + 120000 - this.now();
    return { allowed: wait <= 0, remainingSeconds: Math.max(0, Math.ceil(wait / 1000)) };
  }
  checkRateLimit(phone: string) { return this.transaction(state => this.rate(state[phone])); }
  reserveSend(phone: string) {
    return this.transaction(state => {
      if (!this.rate(state[phone]).allowed) throw new Error('لطفاً پیش از ارسال مجدد کد صبر کنید.');
      // Clear previous challenge before delivery, including failed deliveries.
      state[phone] = { attempts: 0, sends: [...(state[phone]?.sends || []).filter(t => t > this.now() - 3600000), this.now()] };
    });
  }
  activate(phone: string, code: string) {
    this.transaction(state => {
      const entry = state[phone];
      if (!entry) throw new Error('OTP send reservation missing.');
      entry.hash = this.hash(phone, code);
      entry.expiresAt = this.now() + 120000;
      entry.attempts = 0;
    });
  }
  consume(phone: string, code: string): boolean {
    return this.transaction(state => {
      const entry = state[phone];
      if (!entry?.hash || !entry.expiresAt || entry.expiresAt <= this.now() || entry.attempts >= 5) return false;
      entry.attempts++;
      const candidate = this.hash(phone, String(code));
      const valid = crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(entry.hash));
      if (valid || entry.attempts >= 5) { delete entry.hash; delete entry.expiresAt; }
      return valid;
    });
  }
}
