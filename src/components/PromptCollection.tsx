import React from 'react';
import type { Prompt } from '../types';
import type { PromptCardTemplate } from '../lib/promptCardTemplates';
import PromptCard from './PromptCard';
import PromptFanCarousel from './PromptFanCarousel';

export default function PromptCollection({template, prompts, bookmarkedIds, sectionId, title, description}: {
  template: PromptCardTemplate;
  prompts: Prompt[];
  bookmarkedIds: Set<string>;
  sectionId: string;
  title: string;
  description: string;
}) {
  if (template === 'fan') return <PromptFanCarousel prompts={prompts} bookmarkedIds={bookmarkedIds} sectionId={sectionId} title={title} description={description} />;
  return <section id={sectionId} className="space-y-5" aria-label={title} data-card-template="grid">
    <div className="space-y-2"><h2 className="text-lg font-bold text-primary">{title}</h2><p className="text-xs leading-6 text-muted">{description}</p></div>
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {prompts.map(prompt => <PromptCard key={prompt.id} prompt={prompt} isInitiallyBookmarked={bookmarkedIds.has(prompt.id)} idPrefix={sectionId} />)}
    </div>
  </section>;
}
