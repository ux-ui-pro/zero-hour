import DEFAULT_CSS_TEXT from './zero-hour.css?raw';

export const zeroHourCssText: string = DEFAULT_CSS_TEXT;

function digitToSheetIndex(d: string): number {
  const n = d.charCodeAt(0) - 48;

  if (n >= 0 && n <= 9) return n;

  return 0;
}

function clampNonNegative(n: number): number {
  return n < 0 ? 0 : n;
}

type Dhms = { d: number; h: number; m: number; s: number; totalSec: number };

const DEFAULT_UNITS = {
  showDays: true,
  showHours: true,
  showMinutes: true,
  showSeconds: true,
} as const;

const ZERO_TIME = { hours: 0, minutes: 0, seconds: 0 } as const;

type StylesInput = CSSStyleSheet | string | null | undefined;

function supportsAdoptedStyleSheets(root: ShadowRoot): boolean {
  return 'adoptedStyleSheets' in root;
}

function makeConstructableSheet(cssText: string): CSSStyleSheet | null {
  try {
    const sheet = new CSSStyleSheet();

    sheet.replaceSync(cssText);

    return sheet;
  } catch {
    return null;
  }
}

const DEFAULT_STYLESHEET = makeConstructableSheet(DEFAULT_CSS_TEXT);

function msToDhms(ms: number): Dhms {
  const totalSec = Math.floor(ms / 1000);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const hTotal = Math.floor(totalSec / 3600);
  const d = Math.floor(hTotal / 24);
  const h = hTotal % 24;

  return { d, h, m, s, totalSec };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toDigitChars(n: number, minDigits: number): string[] {
  const str = String(n).padStart(minDigits, '0');

  return [...str];
}

function hasBoolAttr(el: HTMLElement, name: string, defaultValue: boolean): boolean {
  if (!el.hasAttribute(name)) return defaultValue;

  const raw = el.getAttribute(name);

  if (raw == null || raw === '') return true;

  return raw !== 'false';
}

function parseYmdDate(raw: string | null): { year: number; month: number; day: number } | null {
  if (raw == null) return null;

  const trimmed = raw.trim();

  if (!trimmed) return null;

  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;

  return { year, month, day };
}

function parseHmsTime(raw: string | null): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  if (raw == null) return { ...ZERO_TIME };

  const trimmed = raw.trim();

  if (!trimmed) return { ...ZERO_TIME };

  const parts = trimmed.split(':');
  const h = Number(parts[0] ?? '0');
  const m = Number(parts[1] ?? '0');
  const s = Number(parts[2] ?? '0');

  return {
    hours: Number.isFinite(h) ? h : 0,
    minutes: Number.isFinite(m) ? m : 0,
    seconds: Number.isFinite(s) ? s : 0,
  };
}

function parseHmsTimeStrict(
  raw: string | null,
): { hours: number; minutes: number; seconds: number } | null {
  if (raw == null) return null;

  const trimmed = raw.trim();

  if (!trimmed) return null;

  const m = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  if (!m) return null;

  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  const seconds = Number(m[3] ?? '0');

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds))
    return null;

  if (hours < 0 || hours > 23) return null;
  if (minutes < 0 || minutes > 59) return null;
  if (seconds < 0 || seconds > 59) return null;

  return { hours, minutes, seconds };
}

function parseUtcOffsetMinutes(raw: string | null): number | null {
  if (raw == null) return null;

  let trimmed = raw.trim();

  if (!trimmed) return null;

  if (/^utc/i.test(trimmed)) {
    trimmed = trimmed.slice(3);
  }

  let sign = 1;

  if (trimmed[0] === '+') {
    trimmed = trimmed.slice(1);
  } else if (trimmed[0] === '-') {
    sign = -1;
    trimmed = trimmed.slice(1);
  }

  if (!trimmed) return null;

  const [hStr, mStr = '0'] = trimmed.split(':');
  const h = Number(hStr);
  const m = Number(mStr);

  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;

  const totalMinutes = h * 60 + m;

  return sign * totalMinutes;
}

type ZeroHourQueryOverrides = {
  date?: string;
  time?: string;
  utc?: string;
  units?: string;
};

function readZeroHourQueryOverrides(): ZeroHourQueryOverrides | null {
  if (typeof window === 'undefined') return null;
  if (!('location' in window)) return null;

  const search = window.location?.search ?? '';

  if (!search) return null;

  const sp = new URLSearchParams(search);
  const overrides: ZeroHourQueryOverrides = {};

  const date = sp.get('date')?.trim();

  if (date) overrides.date = date;

  const time = sp.get('time')?.trim();

  if (time) overrides.time = time;

  const utc = sp.get('utc')?.trim();

  if (utc) overrides.utc = utc;

  const units = sp.get('units')?.trim();

  if (units) overrides.units = units;

  return Object.keys(overrides).length ? overrides : null;
}

function parseUnitsPattern(raw: string | null): {
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
} {
  const pattern = (raw ?? '').trim().toLowerCase();

  if (!pattern) {
    return DEFAULT_UNITS;
  }

  const parts = pattern
    .split(':')
    .map((p) => p.trim())
    .filter(Boolean);

  if (!parts.length) {
    return DEFAULT_UNITS;
  }

  const set = new Set(parts);

  const showDays = set.has('d');
  const showHours = set.has('h');
  const showMinutes = set.has('m');
  const showSeconds = set.has('s');

  if (!showDays && !showHours && !showMinutes && !showSeconds) {
    return DEFAULT_UNITS;
  }

  return { showDays, showHours, showMinutes, showSeconds };
}

class ZeroHour extends HTMLElement {
  static defaultStylesheet: CSSStyleSheet | null = DEFAULT_STYLESHEET;

  static observedAttributes = [
    'digits-url',
    'separator-url',
    'autostart',
    'date',
    'time',
    'utc',
    'units',
    'mode',
  ];

  private readonly shadow = this.attachShadow({ mode: 'open' });

  private digitsUrl: string | null = null;
  private separatorUrl: string | null = null;
  private autostart = true;

  private durationMs = 0;

  private targetEpochMs: number | null = null;

  private startEpochMs: number | null = null;
  private nextTickTimeout: number | null = null;
  private doneFired = false;

  private rootEl!: HTMLElement;
  private daysEl!: HTMLElement;
  private hoursEl!: HTMLElement;
  private minutesEl!: HTMLElement;
  private secondsEl!: HTMLElement;
  private a11yEl!: HTMLElement;
  private sep0El!: HTMLElement;
  private sep1El!: HTMLElement;
  private sep2El!: HTMLElement;
  private styleEl: HTMLStyleElement | null = null;

  private showDays = true;
  private showHours = true;
  private showMinutes = true;
  private showSeconds = true;
  private mode: 'static' | 'scroll' = 'static';
  private hasDigitsRendered = false;

  connectedCallback(): void {
    this.render();
    this.readAttributes();

    if (this.autostart) this.start();
    else this.renderStaticInitial();
  }

  disconnectedCallback(): void {
    this.stop();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    void name;
    void oldValue;
    void newValue;

    if (!this.isConnected) return;

    const wasRunning = this.isRunning();

    this.readAttributes();
    this.doneFired = false;

    if (wasRunning && this.autostart) this.start();
    else this.renderStaticInitial();
  }

  public start(): void {
    this.stop();

    if (!this.digitsUrl) return;

    this.durationMs = this.targetEpochMs != null ? this.targetEpochMs - Date.now() : 0;

    this.startEpochMs = Date.now();

    this.tick();
    this.scheduleNextSecondBoundary();
  }

  public stop(): void {
    if (this.nextTickTimeout != null) {
      window.clearTimeout(this.nextTickTimeout);

      this.nextTickTimeout = null;
    }

    this.startEpochMs = null;
  }

  public reset(): void {
    this.doneFired = false;

    if (this.autostart) this.start();
    else this.renderStaticInitial();
  }

  public isRunning(): boolean {
    return this.startEpochMs != null && this.nextTickTimeout != null;
  }

  public isDone(): boolean {
    if (!this.digitsUrl) return false;
    if (this.targetEpochMs == null) return false;

    return Date.now() >= this.targetEpochMs;
  }

  private readAttributes(): void {
    if (!this.rootEl) this.render();

    const query = readZeroHourQueryOverrides();

    this.digitsUrl = this.getAttribute('digits-url');
    this.separatorUrl = this.getAttribute('separator-url');
    this.autostart = hasBoolAttr(this, 'autostart', true);

    const modeRaw = (this.getAttribute('mode') ?? '').trim().toLowerCase();

    this.mode = modeRaw === 'scroll' ? 'scroll' : 'static';

    const units = parseUnitsPattern(query?.units ?? this.getAttribute('units'));

    this.showDays = units.showDays;
    this.showHours = units.showHours;
    this.showMinutes = units.showMinutes;
    this.showSeconds = units.showSeconds;

    const dateFromAttr = parseYmdDate(this.getAttribute('date'));
    const dateFromQuery = parseYmdDate(query?.date ?? null);
    const date = dateFromQuery ?? dateFromAttr;

    const timeFromAttr = parseHmsTime(this.getAttribute('time'));
    const timeFromQuery = parseHmsTimeStrict(query?.time ?? null);
    const time = timeFromQuery ?? timeFromAttr;

    const offsetMinutesFromAttr = parseUtcOffsetMinutes(this.getAttribute('utc'));
    const offsetMinutesFromQuery = parseUtcOffsetMinutes(query?.utc ?? null);
    const offsetMinutes = offsetMinutesFromQuery ?? offsetMinutesFromAttr ?? 0;

    if (!date) {
      this.targetEpochMs = null;
    } else {
      const utcMs = Date.UTC(
        date.year,
        date.month - 1,
        date.day,
        time.hours,
        time.minutes,
        time.seconds,
      );

      this.targetEpochMs = utcMs - offsetMinutes * 60 * 1000;
    }

    this.durationMs = 0;

    if (!this.digitsUrl) {
      this.setTextFallback('—:—:—:—');

      return;
    }

    this.rootEl.style.setProperty('--zh-digits-url', `url("${this.digitsUrl}")`);

    if (this.separatorUrl) {
      this.rootEl.style.setProperty('--zh-sep-url', `url("${this.separatorUrl}")`);
    } else {
      this.rootEl.style.removeProperty('--zh-sep-url');
    }

    this.applyUnitsVisibility();
    this.rootEl.classList.toggle('zh--mode-scroll', this.mode === 'scroll');
  }

  private renderStaticInitial(): void {
    if (this.targetEpochMs != null) {
      const now = Date.now();
      const diffMs = clampNonNegative(this.targetEpochMs - now);
      const { d, h, m, s } = msToDhms(diffMs);

      this.setDigits({ d, h, m, s }, false);
    } else {
      this.setDigits({ d: 0, h: 0, m: 0, s: 0 }, false);
    }
  }

  private render(): void {
    this.applyStyles(null);

    this.rootEl = document.createElement('div');
    this.rootEl.className = 'zh';

    this.daysEl = document.createElement('div');
    this.daysEl.className = 'zh__group';
    this.hoursEl = document.createElement('div');
    this.hoursEl.className = 'zh__group';
    this.minutesEl = document.createElement('div');
    this.minutesEl.className = 'zh__group';
    this.secondsEl = document.createElement('div');
    this.secondsEl.className = 'zh__group';

    this.sep0El = document.createElement('span');
    this.sep0El.className = 'zh__sep';

    this.sep1El = document.createElement('span');
    this.sep1El.className = 'zh__sep';

    this.sep2El = document.createElement('span');
    this.sep2El.className = 'zh__sep';

    this.a11yEl = document.createElement('span');
    this.a11yEl.className = 'zh__a11y';
    this.a11yEl.setAttribute('aria-live', 'polite');

    this.rootEl.append(
      this.daysEl,
      this.sep0El,
      this.hoursEl,
      this.sep1El,
      this.minutesEl,
      this.sep2El,
      this.secondsEl,
      this.a11yEl,
    );

    this.shadow.innerHTML = '';

    if (this.styleEl) this.shadow.append(this.styleEl);

    this.shadow.append(this.rootEl);

    this.setDigits({ d: 0, h: 0, m: 0, s: 0 }, false);
    this.hasDigitsRendered = false;
  }

  private setTextFallback(text: string): void {
    this.a11yEl.textContent = text;
  }

  private applyUnitsVisibility(): void {
    if (!this.rootEl) return;

    this.daysEl.style.display = this.showDays ? '' : 'none';
    this.hoursEl.style.display = this.showHours ? '' : 'none';
    this.minutesEl.style.display = this.showMinutes ? '' : 'none';
    this.secondsEl.style.display = this.showSeconds ? '' : 'none';

    const hasSeparator = !!this.separatorUrl;

    if (!hasSeparator) {
      this.sep0El.style.display = 'none';
      this.sep1El.style.display = 'none';
      this.sep2El.style.display = 'none';

      return;
    }

    const groupVisible = [this.showDays, this.showHours, this.showMinutes, this.showSeconds];
    const visibleIndexes: number[] = [];

    for (let i = 0; i < groupVisible.length; i++) {
      if (groupVisible[i]) visibleIndexes.push(i);
    }

    this.rootEl.style.setProperty('--zh-groups', String(visibleIndexes.length));

    const sepUsed = [false, false, false];

    if (visibleIndexes.length >= 2) {
      for (let i = 0; i < visibleIndexes.length - 1; i++) {
        const rightIdx = visibleIndexes[i + 1];
        const sepIndex = Math.min(2, Math.max(0, rightIdx - 1));

        sepUsed[sepIndex] = true;
      }
    }

    this.sep0El.style.display = sepUsed[0] ? '' : 'none';
    this.sep1El.style.display = sepUsed[1] ? '' : 'none';
    this.sep2El.style.display = sepUsed[2] ? '' : 'none';
  }

  private setDigits(
    { d, h, m, s }: { d: number; h: number; m: number; s: number },
    animate = true,
  ): void {
    let shouldAnimate = animate;

    if (!this.hasDigitsRendered) shouldAnimate = false;

    const daysChars = toDigitChars(Math.min(d, 99), 2);
    const hoursChars = toDigitChars(h, 2);
    const minChars = [...pad2(m)];
    const secChars = [...pad2(s)];

    this.syncDigitGroup(this.daysEl, daysChars, shouldAnimate);
    this.syncDigitGroup(this.hoursEl, hoursChars, shouldAnimate);
    this.syncDigitGroup(this.minutesEl, minChars, shouldAnimate);
    this.syncDigitGroup(this.secondsEl, secChars, shouldAnimate);

    const parts: string[] = [];

    if (this.showDays) parts.push(daysChars.join(''));
    if (this.showHours) parts.push(hoursChars.join(''));
    if (this.showMinutes) parts.push(minChars.join(''));
    if (this.showSeconds) parts.push(secChars.join(''));

    this.a11yEl.textContent = parts.length ? parts.join(':') : '—';
    this.hasDigitsRendered = true;
  }

  private syncDigitGroup(groupEl: HTMLElement, chars: string[], animate: boolean): void {
    while (groupEl.children.length < chars.length) {
      const idx = groupEl.children.length;

      groupEl.appendChild(this.createDigitSlot(chars[idx]));
    }

    while (groupEl.children.length > chars.length) {
      const last = groupEl.lastElementChild;

      if (!last) break;

      groupEl.removeChild(last);
    }

    for (let i = 0; i < chars.length; i++) {
      const el = groupEl.children[i] as HTMLElement;

      this.syncDigitSlot(el, chars[i], animate);
    }
  }

  private createDigitSlot(char: string): HTMLElement {
    const digit = document.createElement('span');

    digit.className = 'zh__digit';

    const track = document.createElement('span');

    track.className = 'zh__digit-track';

    const face = this.createDigitFace(char);

    face.classList.add('zh__digit-face--current');

    track.append(face);
    digit.append(track);

    return digit;
  }

  private createDigitFace(char: string): HTMLElement {
    const face = document.createElement('span');

    face.className = 'zh__digit-face';

    this.setFaceDigit(face, char);

    return face;
  }

  private setFaceDigit(face: HTMLElement, char: string): void {
    face.dataset.zhDigit = char;

    const idx = digitToSheetIndex(char);

    face.style.setProperty('--zh-sheet-index', String(idx));
  }

  private ensureDigitTrack(slot: HTMLElement): HTMLElement {
    let track = slot.querySelector<HTMLElement>('.zh__digit-track');

    if (!track) {
      track = document.createElement('span');
      track.className = 'zh__digit-track';
      slot.innerHTML = '';
      slot.append(track);
    }

    return track;
  }

  private getOrCreateCurrentFace(track: HTMLElement, fallbackChar: string): HTMLElement {
    let current = track.querySelector<HTMLElement>('.zh__digit-face--current');

    if (!current) {
      const existing = track.querySelector<HTMLElement>('.zh__digit-face');

      current = existing ?? this.createDigitFace(fallbackChar);
      current.classList.add('zh__digit-face--current');

      this.setFaceDigit(current, current.dataset.zhDigit ?? fallbackChar);

      track.innerHTML = '';
      track.append(current);
    } else {
      const faces = Array.from(track.children);

      for (const face of faces) {
        if (face !== current) track.removeChild(face);
      }
    }

    return current;
  }

  private cleanupTrack(track: HTMLElement, faceToKeep: HTMLElement): void {
    if (!track.contains(faceToKeep)) return;

    const faces = Array.from(track.children);

    for (const face of faces) {
      if (face !== faceToKeep) track.removeChild(face);
    }

    faceToKeep.classList.remove('zh__digit-face--next');
    faceToKeep.classList.add('zh__digit-face--current');

    track.style.transition = this.mode === 'scroll' ? '' : 'none';
    track.style.transform = 'translateY(0)';
  }

  private parseTransitionMs(el: HTMLElement): number {
    const style = window.getComputedStyle(el);
    const durations = style.transitionDuration.split(',').map((v) => v.trim());
    const delays = style.transitionDelay.split(',').map((v) => v.trim());

    const toMs = (val: string): number => {
      if (!val) return 0;
      if (val.endsWith('ms')) return Number.parseFloat(val);
      if (val.endsWith('s')) return Number.parseFloat(val) * 1000;

      return Number.parseFloat(val) || 0;
    };

    const d = durations[0] ? toMs(durations[0]) : 0;
    const delay = delays[0] ? toMs(delays[0]) : 0;

    return d + delay;
  }

  private animateDigitChange(track: HTMLElement, currentFace: HTMLElement, newChar: string): void {
    const nextFace = this.createDigitFace(newChar);

    nextFace.classList.add('zh__digit-face--next');

    track.innerHTML = '';
    track.append(nextFace, currentFace);

    track.style.transition = 'none';
    track.style.transform = 'translateY(-100%)';

    void track.offsetHeight;

    track.style.transition = '';
    track.style.transform = 'translateY(0)';

    const cleanup = () => {
      track.removeEventListener('transitionend', cleanup);

      if (!track.contains(nextFace)) return;

      this.cleanupTrack(track, nextFace);
    };

    track.addEventListener('transitionend', cleanup, { once: true });

    const guardMs = this.parseTransitionMs(track) + 150;

    window.setTimeout(cleanup, guardMs || 800);
  }

  private syncDigitSlot(slot: HTMLElement, char: string, animate: boolean): void {
    const track = this.ensureDigitTrack(slot);
    const currentFace = this.getOrCreateCurrentFace(track, char);
    const currentChar = currentFace.dataset.zhDigit ?? char;

    this.setFaceDigit(currentFace, currentChar);

    if (currentChar === char || !animate || this.mode !== 'scroll') {
      if (currentChar !== char) this.setFaceDigit(currentFace, char);

      this.cleanupTrack(track, currentFace);

      return;
    }

    this.animateDigitChange(track, currentFace, char);
  }

  private tick(): void {
    if (!this.digitsUrl) return;

    const durationMs = clampNonNegative(this.durationMs);

    if (durationMs === 0) {
      this.setDigits({ d: 0, h: 0, m: 0, s: 0 });
      this.fireDoneOnce();
      this.stop();

      return;
    }

    const start = this.startEpochMs ?? Date.now();
    const elapsedMs = clampNonNegative(Date.now() - start);
    const shownMs = clampNonNegative(durationMs - elapsedMs);

    const { d, h, m, s, totalSec } = msToDhms(shownMs);

    this.setDigits({ d, h, m, s });

    const isDone = totalSec === 0;

    if (isDone) {
      this.fireDoneOnce();
      this.stop();
    }
  }

  private fireDoneOnce(): void {
    if (this.doneFired) return;

    this.doneFired = true;

    this.dispatchEvent(new CustomEvent('done'));
  }

  private scheduleNextSecondBoundary(): void {
    const now = Date.now();
    const msToNextSecond = 1000 - (now % 1000);

    this.nextTickTimeout = window.setTimeout(() => {
      this.tick();

      if (this.isRunning()) this.scheduleNextSecondBoundary();
    }, msToNextSecond);
  }

  public adoptStylesheet(sheet: CSSStyleSheet): void {
    this.applyStyles(sheet);
  }

  public adoptStyles(styles: StylesInput): void {
    this.applyStyles(styles);
  }

  private applyStyles(styles: StylesInput): void {
    if (typeof styles === 'string') {
      if (supportsAdoptedStyleSheets(this.shadow)) {
        const sheet = makeConstructableSheet(styles);

        if (sheet) {
          this.shadow.adoptedStyleSheets = [sheet];
          this.styleEl = null;

          return;
        }
      }

      if (!this.styleEl) this.styleEl = document.createElement('style');

      this.styleEl.textContent = styles;

      return;
    }

    if (styles && supportsAdoptedStyleSheets(this.shadow)) {
      this.shadow.adoptedStyleSheets = [styles];
      this.styleEl = null;

      return;
    }

    if (ZeroHour.defaultStylesheet && supportsAdoptedStyleSheets(this.shadow)) {
      this.shadow.adoptedStyleSheets = [ZeroHour.defaultStylesheet];
      this.styleEl = null;

      return;
    }

    if (!this.styleEl) this.styleEl = document.createElement('style');

    this.styleEl.textContent = DEFAULT_CSS_TEXT;
  }
}

if (!customElements.get('countdown-timer')) {
  customElements.define('countdown-timer', ZeroHour);
}

declare global {
  interface HTMLElementTagNameMap {
    'countdown-timer': ZeroHour;
  }
}

export function initCountdownTimers(
  options: {
    selector?: string;
    onDone?: (el: HTMLElement) => void;
    stylesheet?: CSSStyleSheet | string | null;
  } = {},
): HTMLElement[] {
  const { selector = 'countdown-timer', onDone, stylesheet } = options;
  const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));

  if (onDone) {
    const notified = new WeakSet<HTMLElement>();
    const notifyOnce = (el: HTMLElement) => {
      if (notified.has(el)) return;

      notified.add(el);

      onDone(el);
    };

    elements.forEach((el) => {
      el.addEventListener('done', () => notifyOnce(el));

      const zh = el as unknown as ZeroHour;

      if (typeof (zh as unknown as { isDone?: unknown }).isDone === 'function' && zh.isDone()) {
        notifyOnce(el);
      }
    });
  }

  if (stylesheet) {
    elements.forEach((el) => {
      const zh = el as unknown as ZeroHour;

      if (typeof stylesheet === 'string') zh.adoptStyles(stylesheet);
      else zh.adoptStylesheet(stylesheet);
    });
  }

  return elements;
}
