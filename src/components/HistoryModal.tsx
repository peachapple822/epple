import React from 'react';
import { X, History, Bookmark, BookmarkCheck, ArrowRight } from 'lucide-react';
import { PromptItem } from '../data/prompts';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: PromptItem[];
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
  onSelectPrompt: (prompt: PromptItem) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  bookmarks,
  onToggleBookmark,
  onSelectPrompt,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col max-h-[85vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">진행했던 질문 목록</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 my-2 pr-1">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
              아직 진행한 질문이 없습니다. 화살표를 눌러 게임을 시작해보세요!
            </div>
          ) : (
            history.map((item, idx) => {
              const isBookmarked = bookmarks.includes(item.id);
              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.text}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      <span>#{item.keyword}</span>
                      {item.isCustom && (
                        <>
                          <span>·</span>
                          <span className="text-amber-600 dark:text-amber-400 font-medium">직접 추가됨</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(item.id)}
                      aria-label="북마크 토글"
                      className="p-2 rounded-lg text-slate-400 hover:text-amber-500 transition-colors"
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPrompt(item);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <span>선택</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
