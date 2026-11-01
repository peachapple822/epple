export interface PromptItem {
  id: string;
  text: string;
  category: 'appearance' | 'personality' | 'lifestyle' | 'scenario' | 'power';
  keyword: string;
  isCustom?: boolean;
}

export const CATEGORIES = [
  { id: 'all', name: '전체 보기' },
  { id: 'appearance', name: '외모·비주얼' },
  { id: 'personality', name: '성격·성향' },
  { id: 'lifestyle', name: '취향·일상' },
  { id: 'scenario', name: '과몰입·관계' },
  { id: 'power', name: '능력·전투' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'] | 'bookmark';
