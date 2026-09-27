import React, { useState, useEffect } from 'react';
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
  Check
} from 'lucide-react';
import { SECTION_GUIDES, SectionGuide } from '../data/sectionGuides';
import { useTheme } from '../context/ThemeContext';
import { useQueryDrawer } from '../context/QueryDrawerContext';

interface SectionHelpModalProps {
  guide: SectionGuide;
  isOpen: boolean;
  onClose: () => void;
}

export const SectionHelpModal: React.FC<SectionHelpModalProps> = ({ guide, isOpen, onClose }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [copied, setCopied] = useState(false);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflowY = document.body.style.overflowY;
    document.body.style.overflowY = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflowY = originalOverflowY;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !guide) return null;

  const handleCopySummary = () => {
    const summary = `${guide.title}\n(${guide.subtitle})\n\n1. ما هو هذا المكان بالضبط:\n${guide.whatIsIt}\n\n2. في ماذا أحتاجه:\n${guide.whyDoINeedIt}\n\n3. كيف حُسبت النتائج والأرقام:\n${guide.howAreResultsCalculated}${
      guide.keyInsights?.length ? `\n\n4. إرشادات عملية:\n${guide.keyInsights.map((ins, i) => `• ${ins}`).join('\n')}` : ''
    }${guide.exampleNote ? `\n\n5. مثال:\n${guide.exampleNote}` : ''}`;
    
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Portal directly to document.body so it is 100% immune to parent modal/container clipping
  return createPortal(
    <div 
      className="fixed inset-0 z-[9999999] isolate"
      dir="rtl"
    >
      {/* 1. Uniform Darkened Backdrop Overlay covering the full viewport */}
      <div 
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Side Drawer docked cleanly to the Left Edge (acting as an inspector in RTL layout) */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 h-full h-[100dvh] max-h-screen w-full sm:w-[500px] md:w-[560px] max-w-[96vw] flex flex-col shadow-2xl border-r transition-transform duration-300 ease-out animate-in slide-in-from-left ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/40' 
            : 'bg-[#0B0F19] border-slate-800 text-slate-100 shadow-black/90'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`help-drawer-title-${guide.id}`}
      >
        {/* Sticky Header: Never clipped, always clearly visible at the top */}
        <header className={`p-4 sm:p-5 border-b shrink-0 flex items-start justify-between gap-3 ${
          isLight 
            ? 'bg-gradient-to-r from-slate-50 via-sky-50/20 to-slate-50 border-slate-200' 
            : 'bg-gradient-to-r from-[#080B12] via-slate-900/50 to-[#080B12] border-slate-800'
        }`}>
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${
                isLight
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
              }`}>
                <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                <span>دليل واستعلامات: {guide.badge}</span>
              </span>
            </div>
            
            <h2 
              id={`help-drawer-title-${guide.id}`}
              className={`text-base sm:text-lg font-bold font-sans-arabic leading-snug ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {guide.title}
            </h2>
            
            <p className={`text-xs font-sans-arabic leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              {guide.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            <button
              type="button"
              onClick={handleCopySummary}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isLight 
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
              }`}
              title="نسخ ملخص هذا الدليل إلى الحافظة"
              aria-label="نسخ الملخص"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isLight 
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border border-slate-800'
              }`}
              title="إغلاق درج الاستعلامات (Esc)"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Content Body: Fully visible text, never clipped, generous bottom padding */}
        <div className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans-arabic text-sm leading-relaxed scrollbar-thin ${
          isLight ? 'bg-slate-50/40' : 'bg-transparent'
        }`}>
          
          {/* Card 1: ما هو هذا المكان؟ */}
          <section className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isLight 
              ? 'bg-white border-slate-200 text-slate-800 shadow-xs' 
              : 'bg-slate-900/50 border-slate-800 text-slate-200'
          }`}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`p-2 rounded-xl border shrink-0 ${
                isLight 
                  ? 'bg-sky-50 text-sky-700 border-sky-200' 
                  : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
              }`}>
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`font-bold text-sm sm:text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  ما هو هذا المكان بالضبط؟ (التعريف والمفهوم الأساسي)
                </h3>
                <span className={`text-[11px] block mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  توصيف وظيفي لما تحتويه هذه الواجهة من أدوات ومخرجات
                </span>
              </div>
            </div>
            <p className={`whitespace-pre-line text-xs sm:text-sm leading-6 pr-1 font-sans-arabic ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              {guide.whatIsIt}
            </p>
          </section>

          {/* Card 2: في ماذا أحتاجه؟ */}
          <section className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isLight 
              ? 'bg-white border-slate-200 text-slate-800 shadow-xs' 
              : 'bg-slate-900/50 border-slate-800 text-slate-200'
          }`}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`p-2 rounded-xl border shrink-0 ${
                isLight 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}>
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`font-bold text-sm sm:text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  في ماذا أحتاجه؟ (الغاية والفوائد العملية والبحثية)
                </h3>
                <span className={`text-[11px] block mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  كيف توظف هذه المخرجات في التدبر، المقارنة، والبحث البياني
                </span>
              </div>
            </div>
            <p className={`whitespace-pre-line text-xs sm:text-sm leading-6 pr-1 font-sans-arabic ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              {guide.whyDoINeedIt}
            </p>
          </section>

          {/* Card 3: كيف حُسبت النتائج والأرقام؟ */}
          <section className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isLight 
              ? 'bg-white border-slate-200 text-slate-800 shadow-xs' 
              : 'bg-slate-900/50 border-slate-800 text-slate-200'
          }`}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`p-2 rounded-xl border shrink-0 ${
                isLight 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}>
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`font-bold text-sm sm:text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  كيف حُسبت النتائج والأرقام؟ (المنهجية الرياضية والحسابية)
                </h3>
                <span className={`text-[11px] block mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  الخوارزميات والمعايير البرمجية المتبعة في العد والاستخراج
                </span>
              </div>
            </div>
            
            <div className={`p-3.5 rounded-xl border text-xs sm:text-sm leading-6 font-sans-arabic whitespace-pre-line ${
              isLight 
                ? 'bg-slate-50/80 border-slate-200 text-slate-800' 
                : 'bg-black/30 border-slate-800 text-slate-300'
            }`}>
              {guide.howAreResultsCalculated}
            </div>
          </section>

          {/* Card 4: إرشادات وأمثلة */}
          {guide.keyInsights && guide.keyInsights.length > 0 && (
            <section className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-500" />
                <h3 className={`text-xs sm:text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  إرشادات عملية لفهم النتائج واستثمارها:
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {guide.keyInsights.map((insight, idx) => (
                  <div 
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs transition-all ${
                      isLight 
                        ? 'bg-white border-slate-200 text-slate-700 shadow-xs' 
                        : 'bg-[#0E131F] border-slate-800 text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-5">{insight}</span>
                  </div>
                ))}
              </div>

              {guide.exampleNote && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  isLight
                    ? 'bg-sky-50 border-sky-200 text-sky-900'
                    : 'bg-sky-950/30 border-sky-500/30 text-sky-200'
                }`}>
                  <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span className="leading-5 font-sans-arabic">{guide.exampleNote}</span>
                </div>
              )}
            </section>
          )}

          {/* Safe bottom spacer to ensure the bottom text is never cut off or crowded */}
          <div className="h-10 shrink-0" />
        </div>

        {/* Sticky Footer: Always accessible at bottom, never cut off */}
        <footer className={`p-3.5 sm:p-4 border-t shrink-0 flex items-center justify-between gap-3 text-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#080B12] border-slate-800'
        }`}>
          <span className={`font-mono text-[11px] hidden sm:inline-block ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            بصمة السور • الدليل التفاعلي
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopySummary}
              className={`px-3 py-2 rounded-xl text-xs font-sans-arabic font-semibold transition-all border cursor-pointer flex items-center gap-1.5 ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ الخلاصة'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold font-sans-arabic transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>إغلاق (Esc)</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </aside>
    </div>,
    document.body
  );
};

interface SectionHelpButtonProps {
  guideId: string;
  label?: string;
  variant?: 'icon' | 'compact' | 'pill';
  className?: string;
  title?: string;
}

export const SectionHelpButton: React.FC<SectionHelpButtonProps> = ({
  guideId,
  label = 'استعلام وشرح',
  variant = 'icon', // Isolated tiny corner icon by default
  className = '',
  title = 'استعلام وشرح هذا المكان (المفهوم، الغاية، والمنهجية الرياضية)'
}) => {
  const { openQuery } = useQueryDrawer();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const guide = SECTION_GUIDES[guideId];
  if (!guide) return null;

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
          <HelpCircle className="w-4 h-4 text-sky-400" />
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
          <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>{label}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => openQuery(guideId)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-sans-arabic font-medium transition-all duration-150 cursor-pointer shadow-xs shrink-0 ${
            isLight
              ? 'bg-white hover:bg-sky-50 text-sky-700 border border-slate-200 hover:border-sky-300'
              : 'bg-sky-950/30 hover:bg-sky-500/20 text-sky-300 hover:text-white border border-sky-500/30 hover:border-sky-400/60'
          } ${className}`}
          title={title}
        >
          <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>{label}</span>
        </button>
      )}
    </>
  );
};
