export * from './types';
import { PromptItem } from './types';
import { APPEARANCE_PROMPTS } from './categories/appearance';
import { PERSONALITY_PROMPTS } from './categories/personality';
import { LIFESTYLE_PROMPTS } from './categories/lifestyle';
import { SCENARIO_PROMPTS } from './categories/scenario';
import { POWER_PROMPTS } from './categories/power';
import { deepFreeze } from '../utils/security';

// Combine all 5 categories into 1,000 prompts and apply runtime freeze protection
const RAW_PROMPTS: PromptItem[] = [
  ...APPEARANCE_PROMPTS,
  ...PERSONALITY_PROMPTS,
  ...LIFESTYLE_PROMPTS,
  ...SCENARIO_PROMPTS,
  ...POWER_PROMPTS,
];

export const INITIAL_PROMPTS: PromptItem[] = deepFreeze(RAW_PROMPTS) as PromptItem[];
