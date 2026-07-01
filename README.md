# zero-hour

Tiny countdown Web Component that registers `<countdown-timer>` with a configurable DD:HH:MM:SS display.

[![npm](https://img.shields.io/npm/v/zero-hour.svg?colorB=brightgreen)](https://www.npmjs.com/package/zero-hour)
[![NPM Downloads](https://img.shields.io/npm/dm/zero-hour.svg?style=flat)](https://www.npmjs.com/package/zero-hour)

[Demo](https://codepen.io/ux-ui/pen/MYyMpPw)

---

- Registers `<countdown-timer>` via `customElements.define` on import.
- Configurable visible units (`d`, `h`, `m`, `s`) and UTC offset for the target moment.
- Ticks on exact second boundaries; fires a `done` event once when the countdown reaches zero.
- Optional digit sprites with `static` or `scroll` transition mode.
- Built-in CSS sidecar and `zeroHourCssText` export for shadow-root styling.

---

## Installation

```bash
npm install zero-hour
```

Optional stylesheet (sidecar):

```bash
# import in your bundler entry, or link in HTML:
# import 'zero-hour/zero-hour.css';
```

## Quick Start

Import the package to register the element, then place it in your markup:

```html
<countdown-timer
  digits-url="/sprites/digits.webp"
  separator-url="/sprites/sep.webp"
  date="2025-12-31"
  time="23:59:59"
  utc="+03:00"
></countdown-timer>
```

```js
import 'zero-hour';
```

Subscribe to completion and apply optional styles:

```js
import { initCountdownTimers, zeroHourCssText } from 'zero-hour';

initCountdownTimers({
  selector: 'countdown-timer',
  onDone: (el) => {
    el.classList.add('is-done');
  },
  stylesheet: zeroHourCssText,
});
```

## API

- **`import 'zero-hour'`** — registers `<countdown-timer>` (side effect).
- **`initCountdownTimers(options?)`** — finds elements, optional `onDone` / `stylesheet` helpers.
- **`zeroHourCssText`** — minified default CSS text shipped with the package.

Element instance methods (on `<countdown-timer>` after import):

- **`start()`** — starts or restarts the countdown (`digits-url` required).
- **`stop()`** — stops the timer and clears the scheduled tick.
- **`reset()`** — clears the done flag; restarts when `autostart=true`.
- **`isRunning()`** — `true` when a tick is scheduled.
- **`isDone()`** — `true` when the target moment is in the past.
- **`adoptStylesheet(sheet)`** — replaces `adoptedStyleSheets` in the shadow root.
- **`adoptStyles(text)`** — applies CSS text via constructable stylesheet or `<style>` fallback.

## Options

| Option (attribute) | Type | Default | Description |
|:-------------------|:-----|:--------|:------------|
| `digits-url` | `string` | — | URL to the digits sprite sheet. Required for the graphical display. |
| `separator-url` | `string` | `null` | URL to the separator sprite (e.g. colon). Omit to hide separators. |
| `autostart` | `boolean` | `true` | Auto-start on connect (`autostart` or `autostart="false"`). |
| `date` | `YYYY-MM-DD` | — | Target date. Without `date` the timer resolves to zero. |
| `time` | `HH:MM[:SS]` | `00:00:00` | Target time. |
| `utc` | `UTC±H[:MM]` or `±H[:MM]` | `UTC+0` | UTC offset for the target moment (e.g. `UTC+03:00`, `UTC-5`). |
| `units` | `string` | `"d:h:m:s"` | Visible groups using `d`, `h`, `m`, `s` separated by `:` (e.g. `"h:m:s"`). |
| `mode` | `"static"` \| `"scroll"` | `"static"` | Digit transition mode (`scroll` = rolling effect). |

## Events

| Event | Description |
|:------|:------------|
| `done` | Fired once when the countdown reaches zero (again after `reset()`). |

## Methods

```js
initCountdownTimers({
  selector?: string;           // default: 'countdown-timer'
  onDone?: (el: HTMLElement) => void;
  stylesheet?: CSSStyleSheet | string | null;
}): HTMLElement[]
```

If a timer is already complete at init time, `onDone` is called immediately (catch-up).

## Styling

Default package CSS:

```js
import { initCountdownTimers, zeroHourCssText } from 'zero-hour';

initCountdownTimers({ stylesheet: zeroHourCssText });
```

Or import the sidecar file in your bundler:

```js
import 'zero-hour/zero-hour.css';
```

Custom CSS text from your pipeline:

```js
import { initCountdownTimers } from 'zero-hour';
import ZeroHourCss from './assets/scss/components/zero-hour.scss?raw';

initCountdownTimers({ stylesheet: ZeroHourCss });
```

Manual control:

```js
const el = document.querySelector('countdown-timer');
el?.stop();
el?.reset();
el?.start();
```

## Notes

- Updates tick on exact second boundaries for a stable display.
- Days render as two digits, capped at 99.
- `units` controls visible d/h/m/s groups; separators hide when `separator-url` is unset.
- Digit sprite is horizontal, frames left-to-right `0–9`; frame index equals the digit value.

## License

MIT
