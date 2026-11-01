export * from './types';
import { PromptItem } from './types';
import { APPEARANCE_PROMPTS } from './categories/appearance';
import { PERSONALITY_PROMPTS } from './categories/personality';
import { LIFESTYLE_PROMPTS } from './categories/lifestyle';
import { SCENARIO_PROMPTS } from './categories/scenario';
import { POWER_PROMPTS } from './categories/power';

// Combine all 5 categories into 500 prompts
export const INITIAL_PROMPTS: PromptItem[] = [
  ...APPEARANCE_PROMPTS,
  ...PERSONALITY_PROMPTS,
  ...LIFESTYLE_PROMPTS,
  ...SCENARIO_PROMPTS,
  ...POWER_PROMPTS,
];
