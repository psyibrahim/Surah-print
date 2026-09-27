import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  HelpCircle, 
  X, 
  Compass, 
  Target, 
  Cpu, 
  CheckCircle2, 
  Info, 
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Search,
  BookOpen,
  Layers,
  BarChart3,
  GitCompare,
  Activity,
  Binary,
  Share2
} from 'lucide-react';
import { useQueryDrawer } from '../context/QueryDrawerContext';
import { useTheme } from '../context/ThemeContext';
import { SectionGuide } from '../data/sectionGuides';

export const QueryDrawer: React.FC = () => {
  const { 
    isOpen, 
    activeGuide, 
    activeGuideId, 
    closeQuery, 
    selectGuide, 
    allGuides, 
    searchTerm, 
    setSearchTerm 
  } = useQueryDrawer();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [copied, setCopied] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflowY = document.body.style.overflowY;
    document.body.style.overflowY = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeQuery();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflowY = originalOverflowY;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeQuery]);

  // Filtered guides based on local search
  const filteredGuides = useMemo(() => {
    if (!localSearch.trim()) return allGuides;
    const q = localSearch.trim().toLowerCase();
    return allGuides.filter(g => 
      g.title.toLowerCase().includes(q) ||
      g.badge.toLowerCase().includes(q) ||
      g.subtitle.toLowerCase().includes(q) ||
      g.whatIsIt.toLowerCase().includes(q) ||
      g.whyDoINeedIt.toLowerCase().includes(q)
    );
  }, [allGuides, localSearch]);

  if (!isOpen || !activeGuide) return null;

  const handleCopySummary = () => {
    const summary = `${activeGuide.title}\n(${activeGuide.subtitle})\n\n1. ما هو هذا المكان بالضبط:\n${activeGuide.whatIsIt}\n\n2. في ماذا أحتاجه:\n${activeGuide.whyDoINeedIt}\n\n3. كيف حُسبت النتائج والأرقام:\n${activeGuide.howAreResultsCalculated}${
      activeGuide.keyInsights?.length ? `\n\n4. إرشادات عملية:\n${activeGuide.keyInsights.map((ins, i) => `• ${ins}`).join('\n')}` : ''
    }${activeGuide.exampleNote ? `\n\n5. مثال:\n${activeGuide.exampleNote}` : ''}`;
    
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999999] isolate"
      dir="rtl"
    >
      {/* 1. Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
        onClick={closeQuery}
        aria-hidden="true"
      />

      {/* 2. Side Drawer docked to the Left Edge (inspector pane in RTL) */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 h-full h-[100dvh] max-h-screen w-full sm:w-[520px] md:w-[600px] max-w-full flex flex-col shadow-2xl border-r transition-all duration-300 ease-out animate-in slide-in-from-left ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/30' 
            : 'bg-[#0B0F19] border-slate-800 text-slate-100 shadow-black/90'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="query-drawer-title"
      >
        {/* Header */}
        <header className={`p-4 sm:p-5 border-b shrink-0 flex items-start justify-between gap-3 ${
          isLight 
            ? 'bg-gradient-to-r from-slate-50 via-sky-50/30 to-slate-50 border-slate-200' 
            : 'bg-gradient-to-r from-[#080B12] via-slate-900/50 to-[#080B12] border-slate-800'
        }`}>
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${
                isLight
                  ? 'bg-sky-100 text-sky-800 border-sky-300'
                  : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
              }`}>
                <HelpCircle className="w-3.5 h-3.5 text-sky-500" />
                <span>دليل واستعلامات: {activeGuide.badge}</span>
              </span>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                isLight 
                  ? 'bg-slate-100 text-slate-700 border-slate-300' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                مرجع توثيقي علمي
              </span>
            </div>
            <h3 
              id="query-drawer-title"
              className={`text-base sm:text-lg font-bold font-quran leading-snug truncate ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              {activeGuide.title}
            </h3>
            <p className={`text-xs leading-relaxed line-clamp-2 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              {activeGuide.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopySummary}
              className={`p-2 rounded-lg border text-xs font-mono transition-all flex items-center gap-1 cursor-pointer ${
                copied 
                  ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-950/40 text-emerald-300 border-emerald-600/50')
                  : (isLight ? 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700')
              }`}
              title="نسخ ملخص الاستعلام إلى الحافظة"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="hidden sm:inline">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">نسخ</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={closeQuery}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="إغلاق لوحة الاستعلام (Esc)"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Quick Search & Topic Switcher Bar */}
        <div className={`p-3 border-b flex flex-col gap-2 shrink-0 ${
          isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/40 border-slate-800/80'
        }`}>
          <div className="relative">
            <Search className={`w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`} />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="ابحث في أدلة واستعلامات التطبيق (PCA، K-Means، المقارنة، الفاتحة...)..."
              className={`w-full pr-8 pl-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:border-sky-500 transition-colors ${
                isLight 
                  ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400' 
                  : 'bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500'
              }`}
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] font-mono scrollbar-thin">
            <span className={`shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>أدلة سريعة:</span>
            {allGuides.slice(0, 7).map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => selectGuide(g.id)}
                className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-all cursor-pointer ${
                  activeGuideId === g.id
                    ? (isLight ? 'bg-sky-600 text-white font-bold' : 'bg-sky-500 text-slate-950 font-bold')
                    : (isLight ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100' : 'bg-slate-800 text-slate-400 border border-slate-700/60 hover:text-slate-200')
                }`}
              >
                {g.badge}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-sans text-sm leading-relaxed">
          
          {/* Card 1: What is it? */}
          <section className={`p-4 rounded-xl border space-y-2.5 transition-colors ${
            isLight 
              ? 'bg-sky-50/40 border-sky-100 text-slate-800' 
              : 'bg-sky-950/20 border-sky-800/40 text-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-500 shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <h4 className={`font-bold text-sm font-quran ${isLight ? 'text-sky-900' : 'text-sky-300'}`}>
                1. ما هو هذا المكان بالضبط؟ (التعريف والمفهوم العلمي)
              </h4>
            </div>
            <p className={`text-xs sm:text-[13px] leading-relaxed whitespace-pre-line ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              {activeGuide.whatIsIt}
            </p>
          </section>

          {/* Card 2: Why do I need it? */}
          <section className={`p-4 rounded-xl border space-y-2.5 transition-colors ${
            isLight 
              ? 'bg-amber-50/40 border-amber-100 text-slate-800' 
              : 'bg-amber-950/20 border-amber-800/40 text-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <h4 className={`font-bold text-sm font-quran ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>
                2. في ماذا أحتاجه؟ (الغاية والجدوى التحليلية والتدبرية)
              </h4>
            </div>
            <p className={`text-xs sm:text-[13px] leading-relaxed whitespace-pre-line ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              {activeGuide.whyDoINeedIt}
            </p>
          </section>

          {/* Card 3: How are results calculated? */}
          <section className={`p-4 rounded-xl border space-y-2.5 transition-colors ${
            isLight 
              ? 'bg-slate-50 border-slate-200 text-slate-800' 
              : 'bg-slate-900/60 border-slate-800 text-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-500 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className={`font-bold text-sm font-quran ${isLight ? 'text-cyan-900' : 'text-cyan-300'}`}>
                3. كيف حُسبت الأرقام والنتائج؟ (المنهجية والمعادلات الرياضية)
              </h4>
            </div>
            <p className={`text-xs sm:text-[13px] leading-relaxed whitespace-pre-line ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              {activeGuide.howAreResultsCalculated}
            </p>
          </section>

          {/* Card 4: Key Insights */}
          {activeGuide.keyInsights && activeGuide.keyInsights.length > 0 && (
            <section className={`p-4 rounded-xl border space-y-2.5 transition-colors ${
              isLight 
                ? 'bg-emerald-50/40 border-emerald-100 text-slate-800' 
                : 'bg-emerald-950/20 border-emerald-800/40 text-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-500 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h4 className={`font-bold text-sm font-quran ${isLight ? 'text-emerald-900' : 'text-emerald-300'}`}>
                  4. إرشادات وتطبيقات عملية (كيف توظف هذه المخرجات):
                </h4>
              </div>
              <ul className="space-y-2">
                {activeGuide.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-[13px] leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{insight}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Card 5: Example note */}
          {activeGuide.exampleNote && (
            <section className={`p-4 rounded-xl border space-y-2 transition-colors ${
              isLight 
                ? 'bg-purple-50/40 border-purple-100 text-slate-800' 
                : 'bg-purple-950/20 border-purple-800/40 text-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-500 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className={`font-bold text-sm font-quran ${isLight ? 'text-purple-900' : 'text-purple-300'}`}>
                  5. مثال تطبيقي توضيحي:
                </h4>
              </div>
              <p className={`text-xs sm:text-[13px] leading-relaxed ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                {activeGuide.exampleNote}
              </p>
            </section>
          )}

          {/* Related Guides Switcher */}
          <section className={`p-3.5 rounded-xl border space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'
          }`}>
            <span className={`text-xs font-mono font-bold flex items-center gap-1.5 ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              <BookOpen className="w-3.5 h-3.5 text-sky-500" />
              تصفح استعلامات وأدلة أخرى في هذا القسم:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {filteredGuides
                .filter(g => g.id !== activeGuide.id)
                .slice(0, 6)
                .map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => selectGuide(g.id)}
                    className={`text-right p-2 rounded-lg border text-xs transition-all flex items-center justify-between group cursor-pointer ${
                      isLight 
                        ? 'bg-white hover:bg-sky-50 border-slate-200 hover:border-sky-300 text-slate-800' 
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 hover:border-sky-500/40 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pl-2">
                      <div className="font-bold font-quran truncate text-[11px] group-hover:text-sky-500">
                        {g.title}
                      </div>
                      <div className={`text-[10px] font-mono truncate ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                        {g.badge}
                      </div>
                    </div>
                    <ArrowLeft className="w-3 h-3 text-slate-400 group-hover:text-sky-500 shrink-0" />
                  </button>
                ))}
            </div>
          </section>

        </div>

        {/* Footer */}
        <footer className={`p-3 px-5 border-t shrink-0 flex items-center justify-between text-xs font-mono ${
          isLight 
            ? 'bg-slate-50 border-slate-200 text-slate-600' 
            : 'bg-slate-950 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>استعلام موحد • بصمة السور</span>
          </div>
          <button
            type="button"
            onClick={closeQuery}
            className={`px-3 py-1 rounded-md border text-xs cursor-pointer transition-colors ${
              isLight 
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' 
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            إغلاق (Esc)
          </button>
        </footer>
      </aside>
    </div>,
    document.body
  );
};

// Reusable QueryButton that invokes the centralized QueryDrawer
export interface QueryButtonProps {
  guideId: string;
  label?: string;
  variant?: 'icon' | 'compact' | 'pill';
  className?: string;
  title?: string;
}

export const QueryButton: React.FC<QueryButtonProps> = ({
  guideId,
  label = 'استعلام وشرح',
  variant = 'icon',
  className = '',
  title = 'استعلام وشرح هذا المكان (المفهوم، الغاية، والمنهجية الرياضية)'
}) => {
  const { openQuery } = useQueryDrawer();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => openQuery(guideId)}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center shrink-0 shadow-xs ${
            isLight
              ? 'bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-600 border border-slate-200 hover:border-sky-300'
              : 'bg-slate-800/80 hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 border border-slate-700/80 hover:border-sky-500/40'
          } ${className}`}
          title={title}
          aria-label={title}
        >
          <HelpCircle className="w-4 h-4 text-sky-500" />
        </button>
      ) : variant === 'compact' ? (
        <button
          type="button"
          onClick={() => openQuery(guideId)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition-all duration-150 cursor-pointer shrink-0 ${
            isLight
              ? 'bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200'
              : 'bg-slate-800/80 hover:bg-sky-500/20 text-slate-300 hover:text-sky-200 border border-slate-700'
          } ${className}`}
          title={title}
        >
          <HelpCircle className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <span>{label}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => openQuery(guideId)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-sans font-medium transition-all duration-150 cursor-pointer shadow-xs shrink-0 ${
            isLight
              ? 'bg-white hover:bg-sky-50 text-sky-800 border border-slate-200 hover:border-sky-300'
              : 'bg-sky-950/30 hover:bg-sky-500/20 text-sky-300 hover:text-white border border-sky-500/30 hover:border-sky-400/60'
          } ${className}`}
          title={title}
        >
          <HelpCircle className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <span>{label}</span>
        </button>
      )}
    </>
  );
};
