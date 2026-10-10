import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DurableOtpStore } from '../src/server/services/otpStore.ts';

test('OTP consumption survives restart and replay is rejected without losing send cooldown', () => {
 const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'otp-test-'));
 const file = path.join(dir, 'state.json'); let now = 1000000;
 const store = new DurableOtpStore(file, () => now);
 store.reserveSend('09120000000'); store.activate('09120000000', '12345');
 assert.equal(new DurableOtpStore(file, () => now).consume('09120000000', '12345'), true);
 assert.equal(store.consume('09120000000', '12345'), false);
 assert.equal(store.checkRateLimit('09120000000').allowed, false);
 assert.throws(() => store.reserveSend('09120000000'));
 now += 120000;
 assert.equal(store.checkRateLimit('09120000000').allowed, true);
 fs.rmSync(dir, { recursive: true });
});
test('five failures lock the challenge; expiry and hourly sends are enforced', () => {
 const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'otp-test-'));
 let now = 1000000; const store = new DurableOtpStore(path.join(dir, 'state.json'), () => now);
 store.reserveSend('09120000000'); store.activate('09120000000', '12345');
 for(let i=0;i<5;i++) assert.equal(store.consume('09120000000','00000'), false);
 assert.equal(store.consume('09120000000','12345'), false);
 for(let i=0;i<4;i++) { now += 120000; store.reserveSend('09120000000'); store.activate('09120000000','12345'); }
 now += 120000;
 assert.equal(store.consume('09120000000','12345'), false);
 assert.equal(store.checkRateLimit('09120000000').allowed, false);
 fs.rmSync(dir, { recursive: true });
});
test('concurrent writer lock fails closed', () => {
 const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'otp-test-')); const file = path.join(dir,'state.json');
 fs.writeFileSync(file+'.lock','');
 assert.throws(() => new DurableOtpStore(file).consume('09120000000','12345'));
 fs.rmSync(dir, { recursive: true });
});
