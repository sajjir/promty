import { FileText, WandSparkles, Bot, type LucideIcon } from 'lucide-react';
import type { ResourceType } from './archiveCatalog';
export const resourceTypeIcons: Record<ResourceType, LucideIcon> = {
  prompt: FileText,
  skill: WandSparkles,
  'agent-guide': Bot,
};
