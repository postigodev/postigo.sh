export type DayPeriod = 'day' | 'night';

export type MoonPhase =
  | 'new moon'
  | 'waxing crescent'
  | 'first quarter'
  | 'waxing gibbous'
  | 'full moon'
  | 'waning gibbous'
  | 'last quarter'
  | 'waning crescent';

export type MoonVariant =
  | 'new'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent';

export interface MoonPresentation {
  label: MoonPhase;
  iconPath: string;
  variant: MoonVariant;
}

const MOON_ROOT = '/images/weather';
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const SYNODIC_MONTH_MS = 29.53058867 * 86_400_000;

const MOON_PHASES: readonly MoonPresentation[] = [
  { label: 'new moon', iconPath: `${MOON_ROOT}/moon-full.svg`, variant: 'new' },
  { label: 'waxing crescent', iconPath: `${MOON_ROOT}/moon-thin.svg`, variant: 'waxing-crescent' },
  { label: 'first quarter', iconPath: `${MOON_ROOT}/moon-full.svg`, variant: 'first-quarter' },
  { label: 'waxing gibbous', iconPath: `${MOON_ROOT}/moon-thick.svg`, variant: 'waxing-gibbous' },
  { label: 'full moon', iconPath: `${MOON_ROOT}/moon-full.svg`, variant: 'full' },
  { label: 'waning gibbous', iconPath: `${MOON_ROOT}/moon-thick.svg`, variant: 'waning-gibbous' },
  { label: 'last quarter', iconPath: `${MOON_ROOT}/moon-full.svg`, variant: 'last-quarter' },
  { label: 'waning crescent', iconPath: `${MOON_ROOT}/moon-thin.svg`, variant: 'waning-crescent' },
];

export function getMoonPresentation(date: Date): MoonPresentation {
  const progress = (((date.getTime() - KNOWN_NEW_MOON) % SYNODIC_MONTH_MS) + SYNODIC_MONTH_MS) % SYNODIC_MONTH_MS;
  const index = Math.floor((progress / SYNODIC_MONTH_MS) * 8 + 0.5) % MOON_PHASES.length;
  return MOON_PHASES[index];
}

export function getDayPeriod(date: Date, timeZone: string): DayPeriod {
  const hour = Number(new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    hourCycle: 'h23',
  }).format(date));
  return hour >= 6 && hour < 18 ? 'day' : 'night';
}
