import React from 'react';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import BrandLogo from '../src/components/BrandLogo';
import { getLogoAppearanceError, logoGradient, normalizeLogoAppearance } from '../src/lib/logoAppearance';

test('missing or damaged saved settings preserve the approved default appearance', () => {
  const original = normalizeLogoAppearance();
  assert.equal(original.desktopSize, 50);
  assert.equal(original.mobileSize, 44);
  assert.equal(original.durationSeconds, 14);
  assert.equal(original.gradientEnabled, true);
  assert.equal(original.animationEnabled, true);
  for (const value of [undefined, null, [], 'invalid', { desktopSize: 999, animationType: 'injected' }]) {
    assert.deepEqual(normalizeLogoAppearance(value), original);
  }
  const copy = normalizeLogoAppearance();
  copy.gradientColors[0] = '#ffffff';
  assert.notDeepEqual(normalizeLogoAppearance().gradientColors, copy.gradientColors);
});

test('settings reject unsafe CSS, unknown properties and invalid sizing or duration', () => {
  for (const patch of [
    null, [], { desktopSize: 65 }, { mobileSize: 53 }, { desktopSize: '50' },
    { desktopSize: 42.5 }, { mobileSize: NaN }, { durationSeconds: Infinity },
    { durationSeconds: 0 }, { durationSeconds: 41 }, { gradientEnabled: 'false' },
    { animationEnabled: 1 }, { animationType: 'url(https://invalid.test)' },
    { gradientAngle: -1 }, { gradientAngle: 361 }, { arbitraryCss: 'anything' },
    { gradientColors: ['red', '#6c47ff', '#cf30aa', '#dfa2da'] },
    { gradientColors: ['#402fb5);background:url(https://invalid.test)', '#6c47ff', '#cf30aa', '#dfa2da'] },
    { gradientColors: ['#000000'] },
  ]) assert.ok(getLogoAppearanceError(patch), JSON.stringify(patch));
  for (const patch of [{}, { gradientEnabled: false }, { animationEnabled: false }, { desktopSize: 64, mobileSize: 52, durationSeconds: 4, gradientAngle: 360, animationType: 'diagonal' }]) {
    assert.equal(getLogoAppearanceError(patch), null);
  }
});

test('logo switches between original artwork, static gradient and each allowed animation', () => {
  const src = '/dl/brand/logo.webp?v=1';
  const original = renderToStaticMarkup(<BrandLogo src={src} appearance={{ gradientEnabled: false }} />);
  assert.ok(original.includes('<img'));
  assert.ok(original.includes('brand-logo-original'));
  assert.ok(original.includes('data-logo-animation="none"'));
  assert.ok(!original.includes('mask-image'));
  const still = renderToStaticMarkup(<BrandLogo src={src} appearance={{ animationEnabled: false }} />);
  assert.ok(still.includes('brand-logo-fill'));
  assert.ok(still.includes('mask-image'));
  assert.ok(still.includes('data-logo-animation="none"'));
  for (const animationType of ['flow', 'diagonal', 'breathe']) {
    const html = renderToStaticMarkup(<BrandLogo src={src} appearance={{ animationType, desktopSize: 64, mobileSize: 52, durationSeconds: 8 }} previewSize="mobile" />);
    assert.ok(html.includes(`data-logo-animation="${animationType}"`));
    assert.ok(html.includes('--brand-logo-desktop:64px'));
    assert.ok(html.includes('--brand-logo-mobile:52px'));
    assert.ok(html.includes('--brand-logo-duration:8s'));
    assert.ok(html.includes('data-preview-size="mobile"'));
  }
  const fallback = renderToStaticMarkup(<BrandLogo />);
  assert.ok(fallback.includes('<svg'));
  assert.ok(!fallback.includes('url(undefined)'));
  assert.equal(logoGradient(normalizeLogoAppearance()), 'linear-gradient(135deg, #402fb5, #6c47ff, #cf30aa, #dfa2da, #402fb5)');
});
