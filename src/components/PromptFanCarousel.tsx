import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Prompt } from '../types';
import PromptCard from './PromptCard';
import '../styles/prompt-fan.css';

interface Props { prompts: Prompt[]; bookmarkedIds: Set<string>; sectionId?: string; title?: string; description?: string; }
const number = (value: number) => value.toLocaleString('fa-IR');

/** One selected card, with up to three cards fanned out on either side. */
export default function PromptFanCarousel({ prompts, bookmarkedIds, sectionId, title, description }: Props) {
  const [selectedId, setSelectedId] = useState(prompts[0]?.id);
  const pointer = useRef<{x: number; y: number} | null>(null);
  const dragged = useRef(false);
  const selectedIndex = Math.max(0, prompts.findIndex(p => p.id === selectedId));
  const selected = prompts[selectedIndex];
  const dotStart = Math.max(0, Math.min(selectedIndex - 3, prompts.length - 7));
  const dotPrompts = prompts.slice(dotStart, dotStart + 7);
  const move = (direction: number) => {
    const next = (selectedIndex + direction + prompts.length) % prompts.length;
    setSelectedId(prompts[next].id);
  };
  if (!selected) return null;

  return (
    <section id={sectionId} className="prompt-fan" aria-label={title || "مرور بادبزنی پرامپت‌ها"} aria-roledescription="کاروسل">
      <div className="prompt-fan-intro">
        <h2 className="prompt-fan-eyebrow">{title || "یک ایده، یک شروع تازه"}</h2>
        <span>{description || "کارت‌ها را ورق بزنید و پرامپت خود را پیدا کنید."}</span>
      </div>
      <div
        className="prompt-fan-stage"
        tabIndex={0}
        aria-label="کارت‌های پرامپت؛ حرکت با کلیدهای چپ و راست"
        onKeyDown={event => {
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault(); move(event.key === 'ArrowLeft' ? 1 : -1);
          } else if (event.key === 'Home') { event.preventDefault(); setSelectedId(prompts[0].id); }
          else if (event.key === 'End') { event.preventDefault(); setSelectedId(prompts.at(-1)!.id); }
        }}
        onPointerDown={event => { if (event.button === 0) pointer.current = {x:event.clientX,y:event.clientY}; }}
        onPointerCancel={() => { pointer.current = null; }}
        onPointerUp={event => {
          if (!pointer.current) return;
          const dx = event.clientX - pointer.current.x, dy = event.clientY - pointer.current.y;
          pointer.current = null;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
            dragged.current = true; move(dx < 0 ? 1 : -1);
            window.setTimeout(() => { dragged.current = false; }, 0);
          }
        }}
        onClickCapture={event => { if (dragged.current) { event.preventDefault(); event.stopPropagation(); } }}
      >
        {prompts.map((prompt, index) => {
          let offset = index - selectedIndex;
          if (offset > prompts.length / 2) offset -= prompts.length;
          if (offset < -prompts.length / 2) offset += prompts.length;
          const active = offset === 0;
          return (
            <div key={prompt.id} hidden={Math.abs(offset) > 3} className="prompt-fan-slot"
              data-active={active} data-prompt-id={prompt.id}
              style={{'--fan-offset':offset,'--fan-distance':Math.abs(offset),zIndex:20-Math.abs(offset)} as React.CSSProperties}>
              <div className="prompt-fan-card-wrapper" inert={!active} aria-hidden={!active}>
                <PromptCard prompt={prompt} variant="fan" idPrefix={sectionId} isInitiallyBookmarked={bookmarkedIds.has(prompt.id)} />
              </div>
              {!active && <button type="button" className="prompt-fan-select" tabIndex={-1}
                aria-label={`انتخاب ${prompt.title}`} onClick={() => setSelectedId(prompt.id)} />}
            </div>
          );
        })}
      </div>
      <div className="prompt-fan-controls">
        <button type="button" className="prompt-fan-arrow" aria-label="پرامپت قبلی" disabled={prompts.length < 2} onClick={() => move(-1)}><ChevronRight size={19} aria-hidden="true" /></button>
        <div className="prompt-fan-pagination" role="group" aria-label="انتخاب پرامپت">
          {dotPrompts.map((prompt,dotIndex) => { const index = dotStart + dotIndex; return <button type="button" key={prompt.id}
            aria-label={`پرامپت ${number(index+1)}: ${prompt.title}`} aria-current={index === selectedIndex ? 'true' : undefined}
            className="prompt-fan-dot" onClick={() => setSelectedId(prompt.id)} />; })}
        </div>
        <button type="button" className="prompt-fan-arrow" aria-label="پرامپت بعدی" disabled={prompts.length < 2} onClick={() => move(1)}><ChevronLeft size={19} aria-hidden="true" /></button>
      </div>
      <p className="prompt-fan-position" role="status" aria-live="polite" aria-atomic="true">
        <span>{number(selectedIndex+1)} / {number(prompts.length)}</span><span>{selected.title}</span>
      </p>
    </section>
  );
}
