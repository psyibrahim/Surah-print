import React, { useMemo, useState } from 'react';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { useTheme } from '../context/ThemeContext';
import { SurahData, ActiveTab, GlobalLetterStat } from '../types';
import { formatSurahName } from '../utils/arabic';
import { SectionHelpButton } from './SectionHelpModal';
import { 
  BarChart3, 
  BookOpen, 
  Compass, 
  Flame, 
  Brain, 
  Music, 
  Scale, 
  Sparkles, 
  Layers, 
  ArrowLeft, 
  Award, 
  Hash, 
  Activity, 
  ChevronLeft,
  CheckCircle2,
  TrendingUp,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface DashboardProps {
  onSelectSurah?: (surah: SurahData) => void;
  onOpenInReader?: (surahNumber: number) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectSurah,
  onOpenInReader,
  onNavigateTab
}) => {
  const { theme } = useTheme();
  const { 
    surahs, 
    letterStats, 
    macroStats, 
    activeMushaf, 
    activeMeta 
  } = useQuranCorpus();
  const isDark = theme === 'dark';

  const [topLettersLimit, setTopLettersLimit] = useState<number>(10);

  // 1. Calculate top frequent letters sorted by occurrences
  const sortedLetters = useMemo(() => {
    if (!letterStats || !letterStats.globalStats) return [];
    const totalAllChars = macroStats.totalQuranChars || 1;

    return (Object.entries(letterStats.globalStats) as [string, GlobalLetterStat][])
      .map(([letter, data]) => {
        const count = data.totalOccurrences || 0;
        const pct = (count / totalAllChars) * 100;
        return {
          letter,
          name: data.name || letterStats.letterNames[letter] || letter,
          count,
          percentage: Number(pct.toFixed(2)),
          maxSurah: data.maxSurah,
          minSurah: data.minSurah
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [letterStats, macroStats.totalQuranChars]);

  // Letters to display in the chart/table
  const displayedLetters = useMemo(() => {
    return sortedLetters.slice(0, topLettersLimit);
  }, [sortedLetters, topLettersLimit]);

  // 2. Meccan vs Medinan calculations
  const meccanPercentSurahs = Number(((macroStats.meccan.surahsCount / macroStats.totalSurahs) * 100).toFixed(1));
  const medinanPercentSurahs = Number(((macroStats.medinan.surahsCount / macroStats.totalSurahs) * 100).toFixed(1));
  
  const meccanPercentWords = Number(((macroStats.meccan.totalWords / macroStats.totalQuranWords) * 100).toFixed(1));
  const medinanPercentWords = Number(((macroStats.medinan.totalWords / macroStats.totalQuranWords) * 100).toFixed(1));

  // 3. Top longest and shortest surahs
  const longestSurahs = useMemo(() => {
    return [...surahs].sort((a, b) => b.totalWords - a.totalWords).slice(0, 5);
  }, [surahs]);

  const shortestSurahs = useMemo(() => {
    return [...surahs].sort((a, b) => a.totalWords - b.totalWords).slice(0, 5);
  }, [surahs]);

  return (
    <div className="w-full space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900/95 via-[#131c2e]/90 to-slate-900/95 border-slate-800 shadow-xl' 
          : 'bg-gradient-to-r from-sky-50/80 via-white to-indigo-50/60 border-sky-100 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  لوحة المؤشرات الإحصائية العامة للقرآن الكريم
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                  {activeMeta.canonicalName}
                </span>
                <SectionHelpButton 
                  guideId="quran-reader" 
                  variant="button" 
                  title="دليل المؤشرات الإحصائية الشاملة" 
                />
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                ملخص إحصائي شامل يربط بين إجمالي الكلمات والحروف، والتوزيع الدقيق للسور المكية والمدنية، والحروف الأكثر تكراراً في التنزيل الحكيم، وفق العد والضبط المعتمد في {activeMeta.name}.
              </p>
            </div>
          </div>

          {/* Quick jump to Explorer or Reader */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('explorer')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20' 
                    : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>فهرس السور الـ 114</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Macro KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Words */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-800 hover:border-sky-500/40' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">إجمالي الكلمات</span>
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-sky-400">
              {macroStats.totalQuranWords.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-sans">كلمة</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span>معدل</span>
            <strong className="text-slate-300 font-mono">
              {(macroStats.totalQuranWords / macroStats.totalQuranVerses).toFixed(1)}
            </strong>
            <span>كلمة لكل آية</span>
          </div>
        </div>

        {/* Total Verses */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/40' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">إجمالي الآيات</span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Hash className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-400">
              {macroStats.totalQuranVerses.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-sans">آية</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span>وفق عد</span>
            <strong className="text-slate-300">{activeMeta.countSystem}</strong>
          </div>
        </div>

        {/* Total Letters */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-800 hover:border-purple-500/40' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">إجمالي الحروف (الرسم)</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-purple-400">
              {macroStats.totalQuranChars.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-sans">حرفاً</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span>معدل</span>
            <strong className="text-slate-300 font-mono">
              {(macroStats.totalQuranChars / macroStats.totalQuranWords).toFixed(2)}
            </strong>
            <span>أحرف لكل كلمة</span>
          </div>
        </div>

        {/* Total Surahs */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/40' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">إجمالي السور</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {macroStats.totalSurahs}
            </span>
            <span className="text-xs text-slate-400 font-sans">سورة</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-bold font-mono">86</span>
            <span>مكية</span>
            <span className="text-slate-500">•</span>
            <span className="text-sky-400 font-bold font-mono">28</span>
            <span>مدنية</span>
          </div>
        </div>
      </div>

      {/* Main 2 Column Grid: Meccan/Medinan Distribution & Most Frequent Letters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Section 1: Meccan / Medinan Distribution (5 cols) */}
        <div className={`lg:col-span-5 p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-base font-bold flex items-center gap-2 text-slate-100">
                <Scale className="w-4 h-4 text-emerald-400" />
                <span>توزيع السور المكية والمدنية</span>
              </h2>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('meccan-medinan')}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  <span>تحليل تفصيلي</span>
                  <ChevronLeft className="w-3 h-3" />
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              مقارنة كمية بين السور المكية التأسيسية التي تنزلت قبل الهجرة، والسور المدنية التشريعية التي تنزلت بالمدينة المنورة.
            </p>

            {/* Visual Proportion Bar (Surahs) */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-emerald-400">
                  المكي: 86 سورة ({meccanPercentSurahs}%)
                </span>
                <span className="text-sky-400">
                  المدني: 28 سورة ({medinanPercentSurahs}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-800">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${meccanPercentSurahs}%` }}
                  title={`السور المكية: ${macroStats.meccan.surahsCount} سورة (${meccanPercentSurahs}%)`}
                />
                <div 
                  className="h-full bg-sky-500 transition-all duration-500" 
                  style={{ width: `${medinanPercentSurahs}%` }}
                  title={`السور المدنية: ${macroStats.medinan.surahsCount} سورة (${medinanPercentSurahs}%)`}
                />
              </div>
            </div>

            {/* Visual Proportion Bar (Words) */}
            <div className="space-y-1.5 mb-5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-emerald-400">
                  كلمات المكي: {macroStats.meccan.totalWords.toLocaleString()} ({meccanPercentWords}%)
                </span>
                <span className="text-sky-400">
                  كلمات المدني: {macroStats.medinan.totalWords.toLocaleString()} ({medinanPercentWords}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-800">
                <div 
                  className="h-full bg-emerald-600 transition-all duration-500" 
                  style={{ width: `${meccanPercentWords}%` }}
                  title={`كلمات المكي: ${macroStats.meccan.totalWords.toLocaleString()} (${meccanPercentWords}%)`}
                />
                <div 
                  className="h-full bg-sky-600 transition-all duration-500" 
                  style={{ width: `${medinanPercentWords}%` }}
                  title={`كلمات المدني: ${macroStats.medinan.totalWords.toLocaleString()} (${medinanPercentWords}%)`}
                />
              </div>
            </div>

            {/* Detailed Comparative Metrics Table */}
            <div className={`rounded-xl border overflow-hidden text-xs ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="grid grid-cols-3 p-2.5 font-bold border-b border-slate-800/60 text-slate-400">
                <span>المؤشر الإحصائي</span>
                <span className="text-emerald-400 text-center">القسم المكي</span>
                <span className="text-sky-400 text-center">القسم المدني</span>
              </div>

              <div className="divide-y divide-slate-800/30">
                <div className="grid grid-cols-3 p-2.5 items-center font-mono">
                  <span className="text-slate-300 font-sans text-xs">عدد السور</span>
                  <span className="text-center font-bold text-slate-200">{macroStats.meccan.surahsCount}</span>
                  <span className="text-center font-bold text-slate-200">{macroStats.medinan.surahsCount}</span>
                </div>
                <div className="grid grid-cols-3 p-2.5 items-center font-mono">
                  <span className="text-slate-300 font-sans text-xs">عدد الآيات</span>
                  <span className="text-center font-bold text-slate-200">{macroStats.meccan.totalVerses.toLocaleString()}</span>
                  <span className="text-center font-bold text-slate-200">{macroStats.medinan.totalVerses.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-3 p-2.5 items-center font-mono">
                  <span className="text-slate-300 font-sans text-xs">عدد الكلمات</span>
                  <span className="text-center font-bold text-slate-200">{macroStats.meccan.totalWords.toLocaleString()}</span>
                  <span className="text-center font-bold text-slate-200">{macroStats.medinan.totalWords.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-3 p-2.5 items-center font-mono">
                  <span className="text-slate-300 font-sans text-xs">متوسط طول الآية</span>
                  <span className="text-center font-bold text-emerald-400">{macroStats.meccan.avgAyahLengthWords.toFixed(1)} كلمة</span>
                  <span className="text-center font-bold text-sky-400">{macroStats.medinan.avgAyahLengthWords.toFixed(1)} كلمة</span>
                </div>
                <div className="grid grid-cols-3 p-2.5 items-center font-mono">
                  <span className="text-slate-300 font-sans text-xs">متوسط آيات السورة</span>
                  <span className="text-center font-bold text-slate-200">{macroStats.meccan.avgVersesPerSurah.toFixed(0)} آية</span>
                  <span className="text-center font-bold text-slate-200">{macroStats.medinan.avgVersesPerSurah.toFixed(0)} آية</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed">
            <span className="font-bold">ملاحظة لغوية: </span>
            تتميز السور المكية بالإيجاز وقِصر الآيات وقوة الفواصل الإيقاعية، بينما تمتاز السور المدنية بالطول والتفصيل التشريعي؛ لذا يبلغ متوسط الآية في المدني أكثر من ضعف المكي ({macroStats.medinan.avgAyahLengthWords.toFixed(1)} مقابل {macroStats.meccan.avgAyahLengthWords.toFixed(1)} كلمة).
          </div>
        </div>

        {/* Section 2: Most Frequent Letters (7 cols) */}
        <div className={`lg:col-span-7 p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2 text-slate-100">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>الحروف الأكثر تكراراً في القرآن الكريم</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  توزيع تواتر الحروف الـ 28 وترتيبها التنازلي ونسبتها من إجمالي {macroStats.totalQuranChars.toLocaleString()} حرفاً.
                </p>
              </div>

              {/* Limit switch (Top 10 vs All 28) */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                {[10, 14, 28].map(limit => (
                  <button
                    key={limit}
                    type="button"
                    onClick={() => setTopLettersLimit(limit)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      topLettersLimit === limit
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    أعلى {limit}
                  </button>
                ))}
              </div>
            </div>

            {/* Letters Grid / List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[390px] overflow-y-auto pr-1">
              {displayedLetters.map((l, idx) => {
                const maxPct = sortedLetters[0]?.percentage || 1;
                const relativeWidth = Math.min(100, Math.max(5, (l.percentage / maxPct) * 100));

                return (
                  <div
                    key={l.letter}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                      isDark 
                        ? 'bg-slate-800/40 border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/70' 
                        : 'bg-slate-50 border-slate-200 hover:border-amber-400 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xl font-bold font-serif text-slate-100">
                          {l.letter}
                        </span>
                        <span className="text-xs text-slate-400 font-sans">
                          ({l.name})
                        </span>
                      </div>

                      <div className="text-left font-mono">
                        <div className="text-xs font-bold text-amber-400">
                          {l.count.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {l.percentage}%
                        </div>
                      </div>
                    </div>

                    {/* Frequency Bar */}
                    <div className="mt-2 w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                        style={{ width: `${relativeWidth}%` }}
                      />
                    </div>

                    {/* Top surah occurrence tag */}
                    {l.maxSurah && (
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-sans">
                        <span>أعلى تركيز:</span>
                        <span className="text-slate-300 font-medium">
                          سورة {formatSurahName(l.maxSurah.name)} ({l.maxSurah.percentage}%)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Jump to Letters Lab Button */}
          {onNavigateTab && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                الحروف الأربعة الأولى (ا، ل، ن، م) تستحوذ وحدها على أكثر من 40% من كامل النص القرآني.
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('letters-heatmap')}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>خريطة الحروف التفاعلية</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Surah Extremes & Vocabulary Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Top 5 Longest Surahs */}
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-slate-200">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>أطول 5 سور في القرآن الكريم (حسب الكلمات)</span>
          </h3>

          <div className="space-y-2">
            {longestSurahs.map((s, idx) => (
              <div 
                key={s.number}
                onClick={() => onSelectSurah ? onSelectSurah(s) : onOpenInReader?.(s.number)}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-slate-800/30 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/60' 
                    : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-sm font-bold font-serif text-slate-100">
                      {formatSurahName(s.name)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans">
                      {s.totalAyahs} آية • {s.isMeccan ? 'مكية' : 'مدنية'}
                    </div>
                  </div>
                </div>

                <div className="text-left font-mono">
                  <div className="text-xs font-bold text-indigo-400">
                    {s.totalWords.toLocaleString()} كلمة
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {s.totalChars.toLocaleString()} حرفاً
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Shortest Surahs */}
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-slate-200">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>أوجز 5 سور في القرآن الكريم (حسب الكلمات)</span>
          </h3>

          <div className="space-y-2">
            {shortestSurahs.map((s, idx) => (
              <div 
                key={s.number}
                onClick={() => onSelectSurah ? onSelectSurah(s) : onOpenInReader?.(s.number)}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-slate-800/30 border-slate-800 hover:border-sky-500/40 hover:bg-slate-800/60' 
                    : 'bg-slate-50 border-slate-200 hover:border-sky-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-sky-500/10 text-sky-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-sm font-bold font-serif text-slate-100">
                      {formatSurahName(s.name)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans">
                      {s.totalAyahs} آيات • {s.isMeccan ? 'مكية' : 'مدنية'}
                    </div>
                  </div>
                </div>

                <div className="text-left font-mono">
                  <div className="text-xs font-bold text-sky-400">
                    {s.totalWords.toLocaleString()} كلمة
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {s.totalChars.toLocaleString()} حرفاً
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Academic Quick Portal to Specialized Labs */}
      {onNavigateTab && (
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <h3 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <span>مختبرات التحليل الرياضي واللساني المتخصصة</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('lexical-richness')}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                isDark ? 'bg-slate-800/40 border-slate-800 hover:border-purple-500/50' : 'bg-white border-slate-200 hover:border-purple-400 shadow-xs'
              }`}
            >
              <div className="text-purple-400 font-bold text-xs mb-1 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                <span>مختبر زيف واللسانيات</span>
              </div>
              <p className="text-[11px] text-slate-400">
                قانون زيف اللغوي والإنتروبيا ومؤشر التنوع (TTR) وتوحيد المفردات.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('verse-endings')}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                isDark ? 'bg-slate-800/40 border-slate-800 hover:border-sky-500/50' : 'bg-white border-slate-200 hover:border-sky-400 shadow-xs'
              }`}
            >
              <div className="text-sky-400 font-bold text-xs mb-1 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                <span>فواصل الآيات والإيقاع</span>
              </div>
              <p className="text-[11px] text-slate-400">
                حروف الروي والتجانس الصوتي ومصفوفة نهايات الآيات.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('openings-families')}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                isDark ? 'bg-slate-800/40 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-400 shadow-xs'
              }`}
            >
              <div className="text-emerald-400 font-bold text-xs mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>عوائل السور والفواتح</span>
              </div>
              <p className="text-[11px] text-slate-400">
                الحواميم السبع، المسبحات، الطواسين، وبصمات الحروف المقطعة.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('mushaf-diff-table')}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                isDark ? 'bg-slate-800/40 border-slate-800 hover:border-amber-500/50' : 'bg-white border-slate-200 hover:border-amber-400 shadow-xs'
              }`}
            >
              <div className="text-amber-400 font-bold text-xs mb-1 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>مقارنة المصاحف (كوفي/مدني)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                الفروق الإحصائية بين مصحف حفص عن عاصم ومصحف ورش عن نافع.
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
