export type LogoAnimation = 'flow' | 'diagonal' | 'breathe';

export interface LogoAppearance {
  gradientEnabled: boolean;
  animationEnabled: boolean;
  desktopSize: number;
  mobileSize: number;
  gradientColors: string[];
  gradientAngle: number;
  animationType: LogoAnimation;
  durationSeconds: number;
}

const defaults: LogoAppearance = {
  gradientEnabled: true,
  animationEnabled: true,
  desktopSize: 50,
  mobileSize: 44,
  gradientColors: ['#402fb5', '#6c47ff', '#cf30aa', '#dfa2da'],
  gradientAngle: 135,
  animationType: 'flow',
  durationSeconds: 14,
};

const integerBetween = (value: unknown, min: number, max: number) => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
const rules: Record<keyof LogoAppearance, { valid: (value: unknown) => boolean; error: string }> = {
  gradientEnabled: { valid: value => typeof value === 'boolean', error: 'وضعیت گرادیان باید روشن یا خاموش باشد.' },
  animationEnabled: { valid: value => typeof value === 'boolean', error: 'وضعیت انیمیشن باید روشن یا خاموش باشد.' },
  desktopSize: { valid: value => integerBetween(value, 24, 64), error: 'اندازه لوگوی دسکتاپ باید بین ۲۴ و ۶۴ پیکسل باشد.' },
  mobileSize: { valid: value => integerBetween(value, 24, 52), error: 'اندازه لوگوی موبایل باید بین ۲۴ و ۵۲ پیکسل باشد.' },
  gradientColors: { valid: value => Array.isArray(value) && value.length === 4 && value.every(color => typeof color === 'string' && /^#[\da-f]{6}$/i.test(color)), error: 'چهار رنگ معتبر با قالب #RRGGBB انتخاب کنید.' },
  gradientAngle: { valid: value => integerBetween(value, 0, 360), error: 'زاویه گرادیان باید بین ۰ و ۳۶۰ درجه باشد.' },
  animationType: { valid: value => ['flow', 'diagonal', 'breathe'].includes(value as string), error: 'نوع انیمیشن معتبر نیست.' },
  durationSeconds: { valid: value => integerBetween(value, 4, 40), error: 'مدت چرخه انیمیشن باید بین ۴ و ۴۰ ثانیه باشد.' },
};

// Accept partial updates, but never interpolate arbitrary CSS from settings.
export function getLogoAppearanceError(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'ساختار تنظیمات لوگو معتبر نیست.';
  for (const [key, item] of Object.entries(value)) {
    if (!Object.hasOwn(rules, key)) return 'گزینه ناشناخته در تنظیمات لوگو وجود دارد.';
    const rule = rules[key as keyof LogoAppearance];
    if (!rule.valid(item)) return rule.error;
  }
  return null;
}

// Older installations without settings retain the approved current appearance.
export function normalizeLogoAppearance(value?: unknown): LogoAppearance {
  const result = { ...defaults, gradientColors: [...defaults.gradientColors] };
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of Object.keys(rules) as (keyof LogoAppearance)[]) {
      const item = (value as Record<string, unknown>)[key];
      if (rules[key].valid(item)) Object.assign(result, { [key]: Array.isArray(item) ? [...item] : item });
    }
  }
  return result;
}

export function logoGradient(settings: LogoAppearance): string {
  return `linear-gradient(${settings.gradientAngle}deg, ${[...settings.gradientColors, settings.gradientColors[0]].join(', ')})`;
}
