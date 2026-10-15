import type { CSSProperties } from 'react';
import { Sparkles } from 'lucide-react';
import { logoGradient, normalizeLogoAppearance } from '../lib/logoAppearance';

interface Props {
  src?: string;
  appearance?: unknown;
  previewSize?: 'desktop' | 'mobile';
}

export default function BrandLogo({ src, appearance, previewSize }: Props) {
  const settings = normalizeLogoAppearance(appearance);
  const style = {
    '--brand-logo-desktop': `${settings.desktopSize}px`,
    '--brand-logo-mobile': `${settings.mobileSize}px`,
    '--brand-logo-gradient': logoGradient(settings),
    '--brand-logo-duration': `${settings.durationSeconds}s`,
  } as CSSProperties;
  const mask = src ? `url(${JSON.stringify(src)})` : undefined;
  return <span className="brand-emblem" style={style} aria-hidden="true" data-preview-size={previewSize} data-logo-animation={settings.gradientEnabled && settings.animationEnabled ? settings.animationType : 'none'}>
    {src ? settings.gradientEnabled
      ? <span className="brand-logo brand-logo-fill" style={{ maskImage: mask, WebkitMaskImage: mask }} />
      : <img src={src} alt="" className="brand-logo brand-logo-original" />
      : <Sparkles className="brand-logo brand-logo-fallback" />}
  </span>;
}
