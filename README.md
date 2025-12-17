<p align="center"><strong>zero-hour</strong></p>

<div align="center">
<p align="center">ZeroHour is a tiny countdown Web Component. It registers <code>&lt;countdown-timer&gt;</code> that renders a <code>DD:HH:MM:SS</code> countdown (with configurable visible units), counts down to a target date/time with an optional UTC offset, ticks on exact second boundaries, and fires a <code>done</code> event when it reaches zero.</p>

[![npm](https://img.shields.io/npm/v/zero-hour.svg?colorB=brightgreen)](https://www.npmjs.com/package/zero-hour)
[![GitHub package version](https://img.shields.io/github/package-json/v/ux-ui-pro/zero-hour.svg)](https://github.com/ux-ui-pro/zero-hour)
[![NPM Downloads](https://img.shields.io/npm/dm/zero-hour.svg?style=flat)](https://www.npmjs.org/package/zero-hour)

<a href="https://codepen.io/ux-ui/pen/MYyMpPw">Demo</a>
</div>
<br>

➠ **Install**

```console
yarn add zero-hour
```
<br>

➠ **Import**

```javascript
// Registers <countdown-timer> via customElements.define(...)
import 'zero-hour';

// Optional helper: subscribe to `done` and apply stylesheets
import { initCountdownTimers } from 'zero-hour';
```
<br>

➠ **Usage**

```javascript
// After importing 'zero-hour', the element is registered.
// Then just place <countdown-timer> in your HTML (see below).
```

<sub>HTML: default start (autostart=true)</sub>
```html
<countdown-timer
  digits-url="/sprites/digits.webp"
  separator-url="/sprites/sep.webp"
  date="2025-12-31"
  time="23:59:59"
  utc="+03:00"
></countdown-timer>
```

<sub>JS: subscribe to completion + optional styles</sub>
```javascript
import { initCountdownTimers } from 'zero-hour';

initCountdownTimers({
  selector: 'countdown-timer',
  onDone: (el) => {
    // The component dispatches: el.dispatchEvent(new CustomEvent('done'))
    el.classList.add('is-done');
  },
  // Optional styles:
  // - CSSStyleSheet (constructable stylesheet)
  // - string (e.g. imported via ?raw from your CSS/SCSS pipeline)
  // stylesheet: myCssStyleSheet,
});
```

<sub>JS: custom styles from `?raw` (CSS/SCSS)</sub>
```javascript
import { initCountdownTimers } from 'zero-hour';
import ZeroHourCss from './assets/scss/components/zero-hour.scss?raw';

initCountdownTimers({
  stylesheet: ZeroHourCss,
});
```

<sub>JS: default styles shipped with the package</sub>
```javascript
import { initCountdownTimers, zeroHourCssText } from 'zero-hour';

// Option A: use the built-in CSS text export
initCountdownTimers({
  stylesheet: zeroHourCssText,
});

// Option B: import the package CSS file as raw text (your bundler must support ?raw)
// import ZeroHourCss from 'zero-hour/zero-hour.css?raw';
// initCountdownTimers({ stylesheet: ZeroHourCss });
```

<sub>JS: manual control (start/stop/reset)</sub>
```javascript
const el = document.querySelector('countdown-timer');
// @ts-expect-error: methods exist on the custom element instance after import
el?.stop();
// @ts-expect-error
el?.reset();
// @ts-expect-error
el?.start();
```

<sub>Units (units)</sub>
```html
<countdown-timer
  digits-url="/sprites/digits.webp"
  separator-url="/sprites/sep.webp"
  date="2025-12-31"
  time="23:59:59"
  utc="+03:00"
  units="h:m:s"
></countdown-timer>
```
<br>

➠ **Options**

| Option (attribute) | Type | Default | Description |
|:--------------------:|:-----------------------:|:------------:|:---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `digits-url` | `string` | — | URL to the digits sprite sheet. **Required** for the graphical display (otherwise only a text fallback is updated in the a11y layer). |
| `digits-layout` | `"vertical" \| "horizontal"` | `"vertical"` | Digits sprite layout. Default expects frames stacked vertically; set to `"horizontal"` for left-to-right sprites. |
| `separator-url` | `string` | `null` | URL to the separator sprite (e.g. a colon). If omitted, separators are hidden. |
| `autostart` | `boolean` | `true` | Auto-start on connect. Can be a boolean attribute (`autostart`) or a string (`autostart="false"`). |
| `date` | `YYYY-MM-DD` | — | Target date. Without `date` the timer resolves to zero. |
| `time` | `HH:MM[:SS]` | `00:00:00` | Target time. |
| `utc` | `UTC±H[:MM]` or `±H[:MM]` | `UTC+0` | UTC offset used to compute the target moment. Examples: `utc="UTC+03:00"`, `utc="UTC-5"`. |
| `units` | `string` | `"d:h:m:s"` | Visible groups pattern using `d`, `h`, `m`, `s` separated by `:` (e.g. `"h:m:s"`). Empty/invalid value falls back to showing all. |

<br>

➠ **API Methods**

| Method | Description |
|-------------------|--------------------------------------------------------------------------------------------------|
| `initCountdownTimers({ selector?, onDone?, stylesheet? }): HTMLElement[]` | Finds elements by selector (default: `countdown-timer`), subscribes to the `done` event (when `onDone` is provided), and optionally applies styles to each element (`stylesheet?: CSSStyleSheet \| string \| null`). When a string is provided, it is applied via `adoptedStyleSheets` when supported, otherwise via a `<style>` fallback inside the shadow root. |
| `start(): void` | Starts/restarts the countdown (only runs when `digits-url` is set). |
| `stop(): void` | Stops the timer and clears the scheduled tick. |
| `reset(): void` | Clears the “done fired” flag and either starts again (if `autostart=true`) or renders a static initial value. |
| `isRunning(): boolean` | Returns `true` if the timer is running and the next tick is scheduled. |
| `adoptStylesheet(sheet: CSSStyleSheet): void` | Replaces `adoptedStyleSheets` inside the component’s shadow root. |

<br>

➠ **Notes**

- Updates tick **exactly on second boundaries** (schedules the next tick to the next full second) to keep the display stable.
- Days render as **two digits** and are capped at **99**.
- `units` controls which groups (d/h/m/s) are visible. Separators are auto-hidden when `separator-url` is not set, or when a separator is not needed between visible groups.
- The `done` event fires once per run (after `reset()` it can fire again).

<br>

➠ **License**

zero-hour is released under MIT license
