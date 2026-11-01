/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  Plus,
  History,
  Sun,
  Moon,
  Timer,
  Play,
  Share2,
} from 'lucide-react';
import { INITIAL_PROMPTS, CATEGORIES, CategoryId, PromptItem } from './data/prompts';
import { playNextSound, playTickSound, playUnisonGoSound } from './utils/sound';
import { AddCustomPromptModal } from './components/AddCustomPromptModal';
import { HistoryModal } from './components/HistoryModal';

const STORAGE_CUSTOM_KEY = 'character_unison_custom_prompts';
const STORAGE_BOOKMARKS_KEY = 'character_unison_bookmarks';
const STORAGE_SOUND_KEY = 'character_unison_sound_enabled';
const STORAGE_THEME_KEY = 'character_unison_theme';

export default function App() {
  // --- Persistent State ---
  const [prompts, setPrompts] = useState<PromptItem[]>(() => {
    if (typeof window === 'undefined') return INITIAL_PROMPTS;
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_KEY);
      if (saved) {
        const customItems: PromptItem[] = JSON.parse(saved);
        return [...customItems, ...INITIAL_PROMPTS];
      }
    } catch {
      // fallback
    }
    return INITIAL_PROMPTS;
  });

  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_BOOKMARKS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(STORAGE_SOUND_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(STORAGE_THEME_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // --- Active Session State ---
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [history, setHistory] = useState<PromptItem[]>([]);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Countdown State (for unison shout: 3 -> 2 -> 1 -> 외치기!)
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_THEME_KEY, 'light');
    }
  }, [isDarkMode]);

  // Persist sound preference
  useEffect(() => {
    localStorage.setItem(STORAGE_SOUND_KEY, String(soundEnabled));
  }, [soundEnabled]);

  // Persist bookmarks
  useEffect(() => {
    localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Filtered prompt list based on selected category
  const filteredPrompts = useMemo(() => {
    if (activeCategory === 'all') {
      return prompts;
    }
    if (activeCategory === 'bookmark') {
      return prompts.filter((p) => bookmarks.includes(p.id));
    }
    return prompts.filter((p) => p.category === activeCategory);
  }, [prompts, activeCategory, bookmarks]);

  // Ensure current index is within bounds when list changes
  useEffect(() => {
    if (currentIndex >= filteredPrompts.length) {
      setCurrentIndex(0);
    }
  }, [filteredPrompts.length, currentIndex]);

  const currentPrompt = filteredPrompts[currentIndex] || prompts[0];

  // Stop countdown on prompt change
  const cancelCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
    setIsCounting(false);
  }, []);

  // Record to history
  const recordHistory = useCallback((prompt: PromptItem) => {
    setHistory((prev) => {
      const filtered = prev.filter((p) => p.id !== prompt.id);
      return [prompt, ...filtered].slice(0, 50);
    });
  }, []);

  // Navigate to Next
  const handleNext = useCallback(() => {
    if (filteredPrompts.length === 0) return;
    cancelCountdown();
    playNextSound(soundEnabled);
    setDirection('next');
    if (currentPrompt) {
      recordHistory(currentPrompt);
    }
    setCurrentIndex((prev) => (prev + 1) % filteredPrompts.length);
  }, [filteredPrompts.length, soundEnabled, currentPrompt, recordHistory, cancelCountdown]);

  // Navigate to Previous
  const handlePrev = useCallback(() => {
    if (filteredPrompts.length === 0) return;
    cancelCountdown();
    playNextSound(soundEnabled);
    setDirection('prev');
    if (currentPrompt) {
      recordHistory(currentPrompt);
    }
    setCurrentIndex((prev) => (prev - 1 + filteredPrompts.length) % filteredPrompts.length);
  }, [filteredPrompts.length, soundEnabled, currentPrompt, recordHistory, cancelCountdown]);

  // Shuffle randomly
  const handleShuffle = useCallback(() => {
    if (filteredPrompts.length <= 1) return;
    cancelCountdown();
    playNextSound(soundEnabled);
    setDirection('next');
    if (currentPrompt) {
      recordHistory(currentPrompt);
    }
    let randomIndex = Math.floor(Math.random() * filteredPrompts.length);
    if (randomIndex === currentIndex) {
      randomIndex = (randomIndex + 1) % filteredPrompts.length;
    }
    setCurrentIndex(randomIndex);
  }, [filteredPrompts.length, currentIndex, soundEnabled, currentPrompt, recordHistory, cancelCountdown]);

  // Toggle Bookmark
  const toggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id]
    );
  }, []);

  // Copy current prompt text
  const handleCopy = useCallback(() => {
    if (!currentPrompt) return;
    navigator.clipboard.writeText(currentPrompt.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentPrompt]);

  // Start 3-2-1 Countdown for unison shout
  const startCountdown = useCallback(() => {
    if (isCounting) {
      cancelCountdown();
      return;
    }

    setIsCounting(true);
    setCountdown(3);
    playTickSound(3, soundEnabled);

    let count = 3;
    countdownTimerRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        playTickSound(count, soundEnabled);
      } else if (count === 0) {
        setCountdown(0); // 0 signifies "외치기!"
        playUnisonGoSound(soundEnabled);
      } else {
        cancelCountdown();
      }
    }, 1000);
  }, [isCounting, soundEnabled, cancelCountdown]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'ㄱ') {
        e.preventDefault();
        handleShuffle();
      } else if (e.key === 'c' || e.key === 'C' || e.key === 'ㅊ') {
        e.preventDefault();
        startCountdown();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleShuffle, startCountdown]);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Add custom prompt
  const handleAddPrompt = (newPrompt: PromptItem) => {
    const updated = [newPrompt, ...prompts];
    setPrompts(updated);
    const customOnly = updated.filter((p) => p.isCustom);
    localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(customOnly));
    // Select the newly added prompt
    setActiveCategory('all');
    setCurrentIndex(0);
  };

  const isCurrentBookmarked = currentPrompt ? bookmarks.includes(currentPrompt.id) : false;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-slate-200 dark:selection:bg-slate-800 transition-colors duration-200">
      {/* Top Bar: Clean 3-zone contract */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60">
        {/* Zone 1: Brand title */}
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            캐릭터 일심동체
          </span>
          <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            문구 생성기
          </span>
        </div>

        {/* Zone 2: Navigation / Quick Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Unison Countdown Trigger */}
          <button
            onClick={startCountdown}
            title="동시에 외치기 3초 카운트다운 (단축키: C)"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              isCounting
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3초 카운트다운</span>
            <span className="sm:hidden">외치기</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
            aria-label="효과음 설정"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* History Modal Trigger */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            title="진행했던 질문 목록"
            aria-label="질문 기록"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors relative"
          >
            <History className="w-4 h-4" />
            {history.length > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-slate-800 dark:bg-slate-200 rounded-full" />
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
            aria-label="테마 전환"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? '전체화면 종료' : '전체화면 보기'}
            aria-label="전체화면 토글"
            className="hidden sm:inline-flex p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-colors shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>질문 추가</span>
          </button>
        </div>
      </header>

      {/* Main Focus Stage: The Character Question Display */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col justify-center items-center">
        {/* Category Tabs: Simple unboxed segmented filter */}
        <nav aria-label="질문 카테고리 필터" className="w-full max-w-2xl mb-6 sm:mb-8 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center justify-start sm:justify-center gap-1 min-w-max p-1 bg-slate-200/60 dark:bg-slate-900 rounded-xl">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setCurrentIndex(0);
                    cancelCountdown();
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
            <button
              onClick={() => {
                setActiveCategory('bookmark');
                setCurrentIndex(0);
                cancelCountdown();
              }}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeCategory === 'bookmark'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3 h-3" />
              <span>북마크 ({bookmarks.length})</span>
            </button>
          </div>
        </nav>

        {/* Central Display Card */}
        {filteredPrompts.length === 0 ? (
          <div className="w-full max-w-2xl text-center py-20 px-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
              {activeCategory === 'bookmark' ? '북마크한 질문이 없습니다' : '표시할 질문이 없습니다'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              {activeCategory === 'bookmark'
                ? '질문 카드 하단의 북마크(별) 아이콘을 눌러 마음에 드는 질문을 담아보세요.'
                : '새로운 질문을 추가해보세요.'}
            </p>
            <button
              onClick={() => setActiveCategory('all')}
              className="px-4 py-2 text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              전체 질문 보기
            </button>
          </div>
        ) : (
          <div className="w-full max-w-3xl flex flex-col items-center">
            {/* Countdown Overlay or Active Banner */}
            {isCounting && (
              <div 
                className="w-full mb-4 py-3 px-4 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 flex items-center justify-between text-amber-700 dark:text-amber-300 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-3 font-bold text-sm sm:text-base">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <span>
                    {countdown === 0 ? '🗣️ 지금 바로 동시에 외치세요!' : `하나, 둘, 셋! (${countdown}초 뒤 외치기)`}
                  </span>
                </div>
                <button
                  onClick={cancelCountdown}
                  className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 transition-colors"
                >
                  취소
                </button>
              </div>
            )}

            {/* Prompt Viewport Box */}
            <div
              onClick={() => {
                // Clicking anywhere on the card advances to next question
                handleNext();
              }}
              role="button"
              tabIndex={0}
              title="클릭하면 다음 질문으로 넘어갑니다"
              className="w-full min-h-[280px] sm:min-h-[340px] bg-white dark:bg-slate-900 rounded-3xl p-7 sm:p-12 border border-slate-200/80 dark:border-slate-800/80 shadow-md sm:shadow-lg flex flex-col justify-between items-center text-center cursor-pointer relative overflow-hidden group select-none hover:border-slate-300 dark:hover:border-slate-700 transition-all active:scale-[0.995]"
            >
              {/* Subtle top metadata row (Zero-pill discipline: unboxed text with · separators) */}
              <div className="w-full flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <span>#{currentPrompt?.keyword || '캐릭터'}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {CATEGORIES.find((c) => c.id === currentPrompt?.category)?.name || '일반'}
                  </span>
                  {currentPrompt?.isCustom && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">사용자 등록</span>
                    </>
                  )}
                </div>

                <div className="font-mono tabular-nums text-slate-600 dark:text-slate-300 text-xs">
                  {currentIndex + 1} / {filteredPrompts.length}
                </div>
              </div>

              {/* Central Big Question Headline */}
              <div className="my-auto py-6 sm:py-8 w-full max-w-2xl px-2">
                <p 
                  key={currentPrompt?.id}
                  className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.3] sm:leading-[1.25] text-balance transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                  {currentPrompt?.text}
                </p>

                {countdown === 0 && (
                  <div className="mt-4 inline-block px-4 py-1.5 rounded-full bg-rose-600 text-white font-black text-sm tracking-widest animate-bounce">
                    정답을 동시에 외치세요!
                  </div>
                )}
              </div>

              {/* Bottom Card Utility Strip */}
              <div 
                className="w-full flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentPrompt) toggleBookmark(currentPrompt.id);
                    }}
                    title={isCurrentBookmarked ? '북마크 해제' : '북마크 추가'}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors font-semibold ${
                      isCurrentBookmarked
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isCurrentBookmarked ? (
                      <BookmarkCheck className="w-4 h-4 fill-amber-500 text-amber-500" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {isCurrentBookmarked ? '북마크됨' : '저장'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy();
                    }}
                    title="질문 문구 복사"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors font-semibold"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">복사됨!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="hidden sm:inline">문구 복사</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Subtitle click hint */}
                <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium hidden sm:block">
                  카드를 누르거나 화살표 버튼으로 넘기기
                </div>

                {/* Unison Count button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startCountdown();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>외치기 (3초)</span>
                </button>
              </div>
            </div>

            {/* Main Navigation Arrows & Shuffle Control */}
            <div className="w-full mt-6 sm:mt-8 flex items-center justify-between gap-3 sm:gap-4">
              {/* Previous Button (Left Arrow) */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="이전 질문으로 이동 (왼쪽 화살표)"
                className="flex-1 max-w-[140px] sm:max-w-[170px] h-14 sm:h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm sm:text-base transition-all active:scale-95 group"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-1 transition-transform" />
                <span>이전</span>
              </button>

              {/* Random Shuffle Button */}
              <button
                type="button"
                onClick={handleShuffle}
                aria-label="랜덤 질문으로 이동 (단축키: R)"
                title="랜덤 섞기 (단축키 R)"
                className="h-14 sm:h-16 px-4 sm:px-6 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">랜덤 뽑기</span>
              </button>

              {/* Next Button (Right Arrow - Dominant Focal CTA) */}
              <button
                type="button"
                onClick={handleNext}
                aria-label="다음 질문으로 이동 (오른쪽 화살표 / 스페이스바)"
                className="flex-1 max-w-[200px] sm:max-w-[260px] h-14 sm:h-16 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center justify-center gap-2 sm:gap-2.5 font-extrabold text-base sm:text-lg transition-all active:scale-95 group"
              >
                <span>다음 질문</span>
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Keyboard Shortcuts Hint Bar */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 select-none">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  ←
                </kbd>
                <span>이전</span>
              </span>
              <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  Space
                </kbd>
                <span>또는</span>
                <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  →
                </kbd>
                <span>다음</span>
              </span>
              <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  R
                </kbd>
                <span>랜덤</span>
              </span>
              <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  C
                </kbd>
                <span>3초 카운트다운</span>
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Clean Footer (Section 1.B: Quiet human links, no fake engines) */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 text-center text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          일심동체 텔레파시 게임 · 화면을 보며 친구들과 동시에 이름을 외쳐보세요!
        </p>
        <div className="flex items-center">
          <span>총 {prompts.length.toLocaleString()}개 질문 보유</span>
        </div>
      </footer>

      {/* Add Custom Question Modal */}
      <AddCustomPromptModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddPrompt}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        bookmarks={bookmarks}
        onToggleBookmark={toggleBookmark}
        onSelectPrompt={(prompt) => {
          const index = filteredPrompts.findIndex((p) => p.id === prompt.id);
          if (index !== -1) {
            setCurrentIndex(index);
          } else {
            setActiveCategory('all');
            const allIndex = prompts.findIndex((p) => p.id === prompt.id);
            if (allIndex !== -1) setCurrentIndex(allIndex);
          }
        }}
      />
    </div>
  );
}
