import type {Prompt} from '../types';
import type {HomepageChip} from '../lib/homepageChips';
import {filterPrompts} from './repositories/filterPrompts';
export function homepageChipCounts(prompts:Prompt[],chips:HomepageChip[]){return Object.fromEntries(chips.filter(c=>c.enabled).map(c=>[c.id,filterPrompts(prompts,{isActive:true,useCase:c.useCase,...(c.tool?{tool:c.tool}:{})}).length]));}
