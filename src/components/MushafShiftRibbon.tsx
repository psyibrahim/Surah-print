import React from 'react';
import { 
  ArrowRightLeft, 
  Split, 
  GitMerge, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SurahDivergenceAnalysis, VerseShiftType } from '../utils/mushafVerseDiff';

interface MushafShiftRibbonProps {
  analysis: SurahDivergenceAnalysis;
  highlightedAyah: number | null;
  onSelectAyah: (ayahNum: number) => void;
  onJumpNextDiff: () => void;
  onJumpPrevDiff: () => void;
}

export const MushafShiftRibbon: React.FC<MushafShiftRibbonProps> = ({
  analysis,
  highlightedAyah,
  onSelectAyah,
  onJumpNextDiff,
  onJumpPrevDiff
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const totalVerses = Math.max(analysis.kufiAyahsCount, analysis.madaniAyahsCount);

  // Helper for color coding a verse
  const getVerseColor = (ayahNum: number): { bg: string; border: string; text: string; label: string } => {
    const kufiInfo = analysis.kufiShiftMap.get(ayahNum);
    if (!kufiInfo) {
      return {
        bg: isLight ? 'bg-slate-200' : 'bg-slate-800',
        border: 'border-transparent',
        text: 'text-slate-500',
        label: `آية ${ayahNum}`
      };
    }

    if (kufiInfo.type === 'split') {
      return {
        bg: isLight ? 'bg-purple-500' : 'bg-purple-600',
        border: isLight ? 'border-purple-600' : 'border-purple-400',
        text: 'text-white',
        label: `آية ${ayahNum}: انقسام فاصلة (تقابل آيات مدنية: ${kufiInfo.mappedNumbers.join(', ')})`
      };
    }

    if (kufiInfo.type === 'merged') {
      return {
        bg: isLight ? 'bg-blue-500' : 'bg-blue-600',
        border: isLight ? 'border-blue-600' : 'border-blue-400',
        text: 'text-white',
        label: `آية ${ayahNum}: دمج فواصل (ضمن آية مدنية رقم ${kufiInfo.mappedNumbers.join(', ')})`
      };
    }

    if (kufiInfo.type === 'shifted') {
      const sign = kufiInfo.shiftOffset > 0 ? `+${kufiInfo.shiftOffset}` : `${kufiInfo.shiftOffset}`;
      return {
        bg: isLight ? 'bg-amber-500' : 'bg-amber-600',
        border: isLight ? 'border-amber-600' : 'border-amber-400',
        text: 'text-white',
        label: `آية ${ayahNum}: زحزحة بالترقيم (${sign}) تقابل آية ${kufiInfo.mappedNumbers[0]} بالمدني`
      };
    }

    if (kufiInfo.hasWordDiff) {
      return {
        bg: isLight ? 'bg-rose-500' : 'bg-rose-600',
        border: isLight ? 'border-rose-600' : 'border-rose-400',
        text: 'text-white',
        label: `آية ${ayahNum}: مطابقة بالعد مع وجود اختلاف لفظي/قرائي`
      };
    }

    return {
      bg: isLight ? 'bg-emerald-500' : 'bg-emerald-600',
      border: isLight ? 'border-emerald-600' : 'border-emerald-400',
      text: 'text-white',
      label: `آية ${ayahNum}: مطابقة تامة في العد وفواصل الآي`
    };
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isLight ? 'bg-white border-slate-300 shadow-xs' : 'bg-slate-900 border-slate-800'
    }`}>
      {/* 1. Header & Quick Stat Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`p-2 rounded-lg border flex items-center justify-center ${
            isLight ? 'bg-indigo-100 border-indigo-300 text-indigo-950 shadow-2xs' : 'bg-indigo-950/60 border-indigo-800 text-indigo-300'
          }`}>
            <Layers className="w-4 h-4" />
          </span>
          <div>
            <h4 className={`text-sm font-extrabold ${isLight ? 'text-slate-950' : 'text-slate-100'}`}>
              خريطة زحزحة وفواصل السورة (المصحفان جنباً إلى جنب)
            </h4>
            <p className={`text-xs ${isLight ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'} mt-0.5`}>
              شريط مسحي بصري تفاعلي: انقر على أي قطعة للانتقال الفوري إلى الآية في كلا العمودين
            </p>
          </div>
        </div>

        {/* Prev / Next Diff Jumpers */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className={`text-xs font-extrabold hidden md:inline ${isLight ? 'text-slate-950' : 'text-slate-300'}`}>
            التنقل بين الفروق:
          </span>
          <button
            onClick={onJumpPrevDiff}
            disabled={analysis.divergentAyahNumbers.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              isLight 
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-950 shadow-2xs' 
                : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200'
            }`}
            title="الانتقال إلى الاختلاف السابق في السورة"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            <span>السابق</span>
          </button>

          <button
            onClick={onJumpNextDiff}
            disabled={analysis.divergentAyahNumbers.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              isLight 
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-950 shadow-2xs' 
                : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200'
            }`}
            title="الانتقال إلى الاختلاف التالي في السورة"
          >
            <span>التالي</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Shift Ribbon (Segments Strip) */}
      <div className="space-y-2 mb-3.5">
        <div className={`p-2 rounded-xl border flex gap-1 overflow-x-auto select-none ${
          isLight ? 'bg-slate-100 border-slate-300 shadow-inner' : 'bg-slate-950 border-slate-800'
        }`}>
          {Array.from({ length: totalVerses }).map((_, i) => {
            const ayahNum = i + 1;
            const isSelected = highlightedAyah === ayahNum;
            const colors = getVerseColor(ayahNum);

            return (
              <button
                key={`ribbon-ayah-${ayahNum}`}
                onClick={() => onSelectAyah(ayahNum)}
                className={`h-6 min-w-[14px] flex-1 rounded-xs transition-all hover:scale-110 hover:z-10 focus:outline-hidden ${
                  colors.bg
                } ${
                  isSelected ? 'ring-2 ring-sky-500 scale-125 z-20 shadow-md font-bold' : 'opacity-90 hover:opacity-100'
                }`}
                title={colors.label}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs font-mono font-extrabold px-1">
          <span className={`px-2 py-0.5 rounded border ${
            isLight ? 'bg-white border-slate-300 text-slate-950 shadow-2xs' : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}>
            آية 1
          </span>
          <span className={`${isLight ? 'text-slate-950 font-black' : 'text-slate-200'}`}>
            مسار آيات السورة (1 إلى {totalVerses})
          </span>
          <span className={`px-2 py-0.5 rounded border ${
            isLight ? 'bg-white border-slate-300 text-slate-950 shadow-2xs' : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}>
            آية {totalVerses}
          </span>
        </div>
      </div>

      {/* 3. Stat Badges Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800/80">
        {/* Exact Match */}
        <div className={`p-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all ${
          isLight 
            ? 'bg-emerald-50/95 border-emerald-600 text-emerald-950 shadow-xs' 
            : 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isLight ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-black truncate ${isLight ? 'text-emerald-950 font-extrabold' : 'text-emerald-300 font-bold'}`}>
              تطابق تام
            </div>
            <div className={`text-sm sm:text-base font-mono font-black ${isLight ? 'text-emerald-950' : 'text-emerald-100'}`}>
              {analysis.exactMatchesCount} آية
            </div>
          </div>
        </div>

        {/* Shifted Verses */}
        <div className={`p-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all ${
          isLight 
            ? 'bg-amber-50/95 border-amber-600 text-amber-950 shadow-xs' 
            : 'bg-amber-950/60 border-amber-500/80 text-amber-200'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isLight ? 'bg-amber-600 text-white shadow-2xs' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-black truncate ${isLight ? 'text-amber-950 font-extrabold' : 'text-amber-300 font-bold'}`}>
              زحزحة في الترقيم
            </div>
            <div className={`text-sm sm:text-base font-mono font-black ${isLight ? 'text-amber-950' : 'text-amber-100'}`}>
              {analysis.shiftedVersesCount} آية
            </div>
          </div>
        </div>

        {/* Split Verses */}
        <div className={`p-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all ${
          isLight 
            ? 'bg-purple-50/95 border-purple-600 text-purple-950 shadow-xs' 
            : 'bg-purple-950/60 border-purple-500/80 text-purple-200'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isLight ? 'bg-purple-600 text-white shadow-2xs' : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
          }`}>
            <Split className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-black truncate ${isLight ? 'text-purple-950 font-extrabold' : 'text-purple-300 font-bold'}`}>
              انقسام فواصل
            </div>
            <div className={`text-sm sm:text-base font-mono font-black ${isLight ? 'text-purple-950' : 'text-purple-100'}`}>
              {analysis.splitVersesCount} موضع
            </div>
          </div>
        </div>

        {/* Merged Verses */}
        <div className={`p-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all ${
          isLight 
            ? 'bg-blue-50/95 border-blue-600 text-blue-950 shadow-xs' 
            : 'bg-blue-950/60 border-blue-500/80 text-blue-200'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isLight ? 'bg-blue-600 text-white shadow-2xs' : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
          }`}>
            <GitMerge className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-black truncate ${isLight ? 'text-blue-950 font-extrabold' : 'text-blue-300 font-bold'}`}>
              دمج فواصل
            </div>
            <div className={`text-sm sm:text-base font-mono font-black ${isLight ? 'text-blue-950' : 'text-blue-100'}`}>
              {analysis.mergedVersesCount} موضع
            </div>
          </div>
        </div>

        {/* Word / Reading differences */}
        <div className={`col-span-2 sm:col-span-1 p-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all ${
          isLight 
            ? 'bg-rose-50/95 border-rose-600 text-rose-950 shadow-xs' 
            : 'bg-rose-950/60 border-rose-500/80 text-rose-200'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isLight ? 'bg-rose-600 text-white shadow-2xs' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-black truncate ${isLight ? 'text-rose-950 font-extrabold' : 'text-rose-300 font-bold'}`}>
              فروق الفرش والرسم
            </div>
            <div className={`text-sm sm:text-base font-mono font-black ${isLight ? 'text-rose-950' : 'text-rose-100'}`}>
              {analysis.totalWordDifferences} كلمة
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
