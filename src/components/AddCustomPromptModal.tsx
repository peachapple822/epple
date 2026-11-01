import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { PromptItem, CATEGORIES } from '../data/prompts';
import { sanitizeText } from '../utils/security';

interface AddCustomPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (prompt: PromptItem) => void;
}

export const AddCustomPromptModal: React.FC<AddCustomPromptModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<PromptItem['category']>('personality');
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = sanitizeText(text, 100);
    const cleanKeyword = sanitizeText(keyword, 15);

    if (!cleanText) {
      setError('질문 문구를 입력해주세요.');
      return;
    }

    let formattedText = cleanText;
    if (!formattedText.endsWith('?')) {
      formattedText += '?';
    }

    const newPrompt: PromptItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: formattedText,
      category,
      keyword: cleanKeyword || '직접 추가',
      isCustom: true,
    };

    onAdd(newPrompt);
    setText('');
    setKeyword('');
    setError('');
    onClose();
  };

  const exampleQuestions = [
    '맨날 늦잠 자서 지각하는 캐릭터는?',
    '평소엔 얌전하다가 술 마시면 폭주하는 캐릭터는?',
    '절대 웃지 않는 철벽 캐릭터는?',
    '남한테 거짓말을 1초도 못 하는 캐릭터는?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 relative transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">나만의 질문 문구 추가하기</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              친구들과 우리만의 특별한 일심동체 캐릭터 질문을 만들어보세요.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              질문 문구 (~한 캐릭터는?)
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError('');
              }}
              placeholder="예: 빵을 엄청 좋아하는 캐릭터는?"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-base focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all"
              autoFocus
            />
            {error && (
              <p className="flex items-center gap-1.5 text-xs text-rose-500 mt-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                카테고리 선택
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PromptItem['category'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all"
              >
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                키워드 태그 (선택)
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="예: 빵순이, 먹보"
                maxLength={15}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-2">
              빠른 영감 추천:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {exampleQuestions.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setText(ex);
                    if (error) setError('');
                  }}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors text-left"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              질문 추가하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
