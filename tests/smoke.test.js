import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

function installDomGlobals() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const { window } = dom;

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.customElements = window.customElements;
  globalThis.CustomEvent = window.CustomEvent;
  globalThis.CSSStyleSheet = window.CSSStyleSheet;
  globalThis.WeakSet = window.WeakSet;

  if (window.CSS) {
    globalThis.CSS = window.CSS;
  }
}

const expectedArtifacts = [
  'dist/index.js',
  'dist/index.cjs',
  'dist/index.d.ts',
  'dist/index.d.cts',
  'dist/zero-hour.css',
];

test('dist artifacts exist', () => {
  for (const artifact of expectedArtifacts) {
    assert.equal(existsSync(artifact), true, `${artifact} should exist`);
  }
});

test('public ESM API exports initCountdownTimers and zeroHourCssText', async () => {
  installDomGlobals();
  const mod = await import('../dist/index.js');

  assert.equal(typeof mod.initCountdownTimers, 'function');
  assert.equal(typeof mod.zeroHourCssText, 'string');
  assert.ok(mod.zeroHourCssText.length > 0);
});

test('public CJS API can be required', async () => {
  installDomGlobals();
  const mod = await import('../dist/index.cjs');

  assert.equal(typeof mod.initCountdownTimers, 'function');
  assert.equal(typeof mod.zeroHourCssText, 'string');
});
