import React, { useRef, useState } from 'react';
import { ArrowDown, Check } from 'lucide-react';

type DownloadButtonProps = {
  fileName: string;
  onDownload: () => boolean | Promise<boolean>;
};

const DownloadButton: React.FC<DownloadButtonProps> = ({ fileName, onDownload }) => {
  const [phase, setPhase] = useState<'idle' | 'preparing' | 'ready'>('idle');
  const [error, setError] = useState(false);
  const busy = useRef(false);
  const label = phase === 'ready' ? 'دریافت دوباره' : phase === 'preparing' ? 'آماده‌سازی فایل' : `دریافت فایل ${fileName}`;

  const handleDownload = async () => {
    if (busy.current) return;
    busy.current = true;
    setError(false);
    setPhase('preparing');
    try {
      // The confirmation follows the real download request, not an artificial timer.
      setPhase(await onDownload() ? 'ready' : 'idle');
    } catch {
      setPhase('idle');
      setError(true);
    } finally {
      busy.current = false;
    }
  };

  return <div className="download-control">
    <button type="button" className="download-button" data-state={phase} disabled={phase === 'preparing'} aria-busy={phase === 'preparing'}
      aria-label={phase === 'idle' ? label : `${label} ${fileName}`} onClick={handleDownload}>
      <span className="download-circle" aria-hidden="true">
        <ArrowDown className="download-arrow" />
        <span className="download-square" />
        <Check className="download-check" />
      </span>
      <span className="download-title">{label}</span>
    </button>
    <span role="status" className="sr-only">{phase === 'ready' ? `دانلود فایل ${fileName} آغاز شد.` : ''}</span>
    {error && <p role="alert" className="mt-2 text-sm text-danger-text">فایل آماده نشد؛ دوباره تلاش کنید.</p>}
  </div>;
};

export default DownloadButton;
