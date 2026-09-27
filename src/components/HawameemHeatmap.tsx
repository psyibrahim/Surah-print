import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Grid, 
  BarChart3, 
  Activity, 
  Info, 
  BookOpen, 
  Eye, 
  TrendingUp,
  ArrowUpDown,
  Check,
  Percent,
  Hash
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  ComposedChart, 
  Line, 
  Cell 
} from 'recharts';
import { SurahData, LetterStatsData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { 
  ARABIC_LETTERS, 
  ABJAD_HAWWAZ_LETTERS, 
  formatSurahName 
} from '../utils/arabic';
import { 
  HawameemAggregateReport, 
  HAWAMEEM_METADATA 
} from '../utils/hawameemData';

interface HawameemHeatmapProps {
  report: HawameemAggregateReport;
  letterStats: LetterStatsData;
  onSelectSurah?: (surah: SurahData) => void;
  onOpenInReader?: (surahNumber: number) => void;
}

type ViewType = 'grid-heatmap' | 'cluster-bars' | 'letter-profile';
type MetricMode = 'percentage' | 'density' | 'rawCount';
type AlphabetSortOrder = 'hijai' | 'abjadi' | 'frequency_desc' | 'frequency_asc' | 'phonetic';

// Distinct consistent colors for the 7 Hawameem surahs
const HAWAMEEM_SURAH_COLORS: Record<number, { stroke: string; fill: string; name: string }> = {
  40: { stroke: '#0284c7', fill: '#38bdf8', name: 'غافر' },
  41: { stroke: '#059669', fill: '#34d399', name: 'فصلت' },
  42: { stroke: '#7c3aed', fill: '#a78bfa', name: 'الشورى' },
  43: { stroke: '#d97706', fill: '#fbbf24', name: 'الزخرف' },
  44: { stroke: '#e11d48', fill: '#fb7185', name: 'الدخان' },
  45: { stroke: '#0d9488', fill: '#2dd4bf', name: 'الجاثية' },
  46: { stroke: '#4f46e5', fill: '#818cf8', name: 'الأحقاف' }
};

// Heatmap Letter Groups (identical pattern to SahabaLetterHeatmap)
const HEATMAP_LETTER_GROUPS = [
  { id: 'all', label: 'الكل (28)' },
  { id: 'hawameem_core', label: 'فواتح الحواميم (5)' }, // ح، م، ع، س، ق
  { id: 'nuraniyah', label: 'الحروف النورانية (14)' },
  { id: 'frequent', label: 'الأكثر تكراراً (10)' },
  { id: 'rare', label: 'الأقل تكراراً (10)' }
];

// Bar Chart Groups (limited to readable subsets)
const BAR_CHART_LETTER_GROUPS = [
  { id: 'hawameem_core', label: 'فواتح الحواميم (5)' },
  { id: 'top_seven', label: 'الأكثر تكراراً (7)' },
  { id: 'nuraniyah', label: 'الحروف النورانية (14)' }
];

const LETTER_PALETTE = [
  '#38bdf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', 
  '#f87171', '#2dd4bf', '#fb923c', '#818cf8', '#e879f9',
  '#4ade80', '#60a5fa', '#facc15', '#a3e635'
];

export const HawameemHeatmap: React.FC<HawameemHeatmapProps> = ({
  report,
  letterStats,
  onSelectSurah,
  onOpenInReader
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Navigation / View modes (matching SahabaLetterHeatmap)
  const [viewType, setViewType] = useState<ViewType>('grid-heatmap');
  const [selectedHeatmapGroup, setSelectedHeatmapGroup] = useState<string>('all');
  const [selectedBarGroup, setSelectedBarGroup] = useState<string>('hawameem_core');
  const [alphabetSortOrder, setAlphabetSortOrder] = useState<AlphabetSortOrder>('hijai');
  const [metricMode, setMetricMode] = useState<MetricMode>('percentage');

  // Sort by specific letter column in the heatmap
  const [sortLetter, setSortLetter] = useState<string | null>(null);

  // Active single letter for profile view / inspection
  const [activeLetter, setActiveLetter] = useState<string>('ح');

  // Selected surah for quick highlights
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number | null>(null);

  // Global Quran total letters
  const quranTotalLetters = useMemo(() => {
    let total = 0;
    const statsObj = (letterStats?.globalStats || {}) as Record<string, { totalOccurrences?: number }>;
    Object.values(statsObj).forEach(stat => {
      total += stat?.totalOccurrences || 0;
    });
    return total > 0 ? total : 326048;
  }, [letterStats]);

  // Aggregate Hawameem data per letter
  const hawameemAggregateStats = useMemo(() => {
    const counts: Record<string, number> = {};
    ARABIC_LETTERS.forEach(l => { counts[l] = 0; });

    report.hawameemLettersStats.forEach(sStat => {
      ARABIC_LETTERS.forEach(l => {
        counts[l] = (counts[l] || 0) + (sStat.letterCounts[l] || 0);
      });
    });

    const percentages: Record<string, number> = {};
    const densities: Record<string, number> = {};

    ARABIC_LETTERS.forEach(l => {
      percentages[l] = report.totalHawameemLetters > 0 
        ? Number(((counts[l] / report.totalHawameemLetters) * 100).toFixed(2)) 
        : 0;
      densities[l] = report.totalHawameemWords > 0 
        ? Number(((counts[l] / report.totalHawameemWords) * 100).toFixed(2)) 
        : 0;
    });

    return { counts, percentages, densities };
  }, [report]);

  // Letters active in the Heatmap table
  const activeHeatmapLetters = useMemo(() => {
    let list: string[] = [];
    const NURANIYAH = new Set(['ا', 'ل', 'م', 'ص', 'ر', 'ك', 'ه', 'ي', 'ع', 'ط', 'س', 'ح', 'ق', 'ن']);
    const HAWAMEEM_CORE = ['ح', 'م', 'ع', 'س', 'ق'];

    if (selectedHeatmapGroup === 'hawameem_core') {
      list = [...HAWAMEEM_CORE];
    } else if (selectedHeatmapGroup === 'nuraniyah') {
      list = ARABIC_LETTERS.filter(l => NURANIYAH.has(l));
    } else if (selectedHeatmapGroup === 'frequent') {
      list = [...ARABIC_LETTERS]
        .sort((a, b) => (hawameemAggregateStats.counts[b] || 0) - (hawameemAggregateStats.counts[a] || 0))
        .slice(0, 10);
    } else if (selectedHeatmapGroup === 'rare') {
      list = [...ARABIC_LETTERS]
        .sort((a, b) => (hawameemAggregateStats.counts[a] || 0) - (hawameemAggregateStats.counts[b] || 0))
        .slice(0, 10);
    } else {
      list = [...ARABIC_LETTERS];
    }

    // Sort according to alphabet order
    switch (alphabetSortOrder) {
      case 'hijai':
        return list.sort((a, b) => ARABIC_LETTERS.indexOf(a) - ARABIC_LETTERS.indexOf(b));
      case 'abjadi':
        return list.sort((a, b) => ABJAD_HAWWAZ_LETTERS.indexOf(a) - ABJAD_HAWWAZ_LETTERS.indexOf(b));
      case 'frequency_desc':
        return list.sort((a, b) => (hawameemAggregateStats.counts[b] || 0) - (hawameemAggregateStats.counts[a] || 0));
      case 'frequency_asc':
        return list.sort((a, b) => (hawameemAggregateStats.counts[a] || 0) - (hawameemAggregateStats.counts[b] || 0));
      case 'phonetic':
        return list;
      default:
        return list;
    }
  }, [selectedHeatmapGroup, alphabetSortOrder, hawameemAggregateStats]);

  // Letters active in Bar Chart
  const activeBarLetters = useMemo(() => {
    switch (selectedBarGroup) {
      case 'hawameem_core':
        return ['ح', 'م', 'ع', 'س', 'ق'];
      case 'top_seven':
        return ['ا', 'ل', 'ن', 'م', 'و', 'ي', 'ه'];
      case 'nuraniyah':
        return ['ا', 'ل', 'م', 'ص', 'ر', 'ك', 'ه', 'ي', 'ع', 'ط', 'س', 'ح', 'ق', 'ن'];
      default:
        return ['ح', 'م', 'ع', 'س', 'ق'];
    }
  }, [selectedBarGroup]);

  // Helper to extract value for a surah and letter based on current metricMode
  const getSurahLetterVal = (surahNumber: number, letter: string): number => {
    const stat = report.hawameemLettersStats.find(s => s.surahNumber === surahNumber);
    const surah = report.surahs.find(s => s.number === surahNumber);
    if (!stat || !surah) return 0;

    const count = stat.letterCounts[letter] || 0;
    if (metricMode === 'rawCount') return count;
    if (metricMode === 'percentage') return stat.letterPercentages[letter] || 0;
    // density: per 100 words
    return surah.totalWords > 0 ? Number(((count / surah.totalWords) * 100).toFixed(2)) : 0;
  };

  // Helper to extract aggregate value for a letter
  const getAggregateLetterVal = (letter: string): number => {
    if (metricMode === 'rawCount') return hawameemAggregateStats.counts[letter] || 0;
    if (metricMode === 'percentage') return hawameemAggregateStats.percentages[letter] || 0;
    return hawameemAggregateStats.densities[letter] || 0;
  };

  // Min and Max values for heatmap color scaling
  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    report.hawameemLettersStats.forEach(stat => {
      activeHeatmapLetters.forEach(letter => {
        const val = getSurahLetterVal(stat.surahNumber, letter);
        if (val < min) min = val;
        if (val > max) max = val;
      });
    });

    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 1;
    return { minVal: min, maxVal: max };
  }, [report, activeHeatmapLetters, metricMode]);

  // Smooth high-contrast heatmap cell color function (identical to SahabaLetterHeatmap)
  const getCellColor = (value: number) => {
    if (maxVal === minVal) return isLight ? 'rgba(2, 132, 199, 0.2)' : 'rgba(56, 189, 248, 0.2)';
    const ratio = Math.max(0, Math.min(1, (value - minVal) / (maxVal - minVal)));

    if (isLight) {
      if (ratio < 0.15) return 'rgba(240, 249, 255, 0.9)'; // sky-50
      if (ratio < 0.35) return 'rgba(224, 242, 254, 0.95)'; // sky-100
      if (ratio < 0.55) return 'rgba(186, 230, 253, 0.95)'; // sky-200
      if (ratio < 0.75) return 'rgba(125, 211, 252, 0.95)'; // sky-300
      if (ratio < 0.9) return 'rgba(56, 189, 248, 0.95)'; // sky-400
      return 'rgba(2, 132, 199, 0.95)'; // sky-600
    } else {
      if (ratio < 0.15) return 'rgba(12, 74, 110, 0.25)'; // sky-950
      if (ratio < 0.35) return 'rgba(3, 105, 161, 0.45)'; // sky-700
      if (ratio < 0.55) return 'rgba(2, 132, 199, 0.65)'; // sky-600
      if (ratio < 0.75) return 'rgba(14, 165, 233, 0.85)'; // sky-500
      if (ratio < 0.9) return 'rgba(56, 189, 248, 0.95)'; // sky-400
      return 'rgba(245, 158, 11, 0.95)'; // amber-500 hot peak
    }
  };

  // Surahs sorted either by natural sequential order or by selected letter value
  const sortedSurahs = useMemo(() => {
    const list = [...report.surahs];
    if (!sortLetter) return list;

    return list.sort((a, b) => {
      const valA = getSurahLetterVal(a.number, sortLetter);
      const valB = getSurahLetterVal(b.number, sortLetter);
      return valB - valA;
    });
  }, [report.surahs, sortLetter, metricMode]);

  // Bar Chart Data for the 7 Surahs
  const surahBarChartData = useMemo(() => {
    return report.surahs.map(surah => {
      const entry: Record<string, any> = {
        name: formatSurahName(surah.name),
        shortName: formatSurahName(surah.name),
        surahNumber: surah.number,
        totalWords: surah.totalWords
      };
      activeBarLetters.forEach(l => {
        entry[`letter_${l}`] = getSurahLetterVal(surah.number, l);
      });
      return entry;
    });
  }, [report.surahs, activeBarLetters, metricMode]);

  // Single Letter Profile across the 7 Hawameem Surahs
  const singleLetterChartData = useMemo(() => {
    return report.surahs.map(surah => ({
      name: formatSurahName(surah.name),
      fullName: `${formatSurahName(surah.name)} (${surah.number})`,
      surahNumber: surah.number,
      color: HAWAMEEM_SURAH_COLORS[surah.number]?.stroke || '#38bdf8',
      value: getSurahLetterVal(surah.number, activeLetter),
      count: report.hawameemLettersStats.find(s => s.surahNumber === surah.number)?.letterCounts[activeLetter] || 0,
      totalWords: surah.totalWords,
      totalLetters: surah.totalChars
    }));
  }, [report.surahs, report.hawameemLettersStats, activeLetter, metricMode]);

  // Active Letter Analytics (Min, Max, Benchmark)
  const letterAnalytics = useMemo(() => {
    const globalCount = letterStats.globalStats?.[activeLetter]?.totalOccurrences || 0;
    const globalPct = quranTotalLetters > 0 ? Number(((globalCount / quranTotalLetters) * 100).toFixed(2)) : 0;
    const hawameemPct = hawameemAggregateStats.percentages[activeLetter] || 0;
    const hawameemTotal = hawameemAggregateStats.counts[activeLetter] || 0;

    let maxSurah = report.surahs[0];
    let minSurah = report.surahs[0];
    let maxValInLetter = -Infinity;
    let minValInLetter = Infinity;

    report.surahs.forEach(surah => {
      const val = getSurahLetterVal(surah.number, activeLetter);
      if (val > maxValInLetter) {
        maxValInLetter = val;
        maxSurah = surah;
      }
      if (val < minValInLetter) {
        minValInLetter = val;
        minSurah = surah;
      }
    });

    return {
      globalCount,
      globalPct,
      hawameemPct,
      hawameemTotal,
      maxSurah,
      maxValInLetter,
      minSurah,
      minValInLetter,
      deviation: Number((hawameemPct - globalPct).toFixed(2))
    };
  }, [activeLetter, letterStats, quranTotalLetters, hawameemAggregateStats, report.surahs, metricMode]);

  return (
    <div className="space-y-3.5">
      {/* 1. Top Header Card (Identical structure and contrast to SahabaLetterHeatmap) */}
      <div className={`p-3 sm:p-4 rounded-xl border transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'sci-bg sci-border'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              isLight ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-sky-950/40 border-sky-500/40 text-sky-400'
            }`}>
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-sm sm:text-base font-bold font-quran ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  خريطة كثافة الحروف في سور الحواميم السبع (آل حم)
                </h3>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  isLight ? 'bg-sky-100 text-sky-900 border border-sky-200' : 'bg-sky-950/60 text-sky-300 border border-sky-800/50'
                }`}>
                  مُعايرة إحصائياً للكلمات
                </span>
              </div>
              <p className={`text-[11px] sm:text-xs font-mono mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                توزيع وترددات الحروف عبر سور الحواميم السبع المتتالية (غافر، فصلت، الشورى، الزخرف، الدخان، الجاثية، الأحقاف)
              </p>
            </div>
          </div>

          {/* Visualization Mode Selector */}
          <div className={`flex items-center gap-1 p-1 rounded-lg border font-mono text-xs w-full sm:w-auto overflow-x-auto ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <button
              type="button"
              onClick={() => setViewType('grid-heatmap')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                viewType === 'grid-heatmap'
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>مصفوفة الخريطة الحرارية</span>
            </button>
            <button
              type="button"
              onClick={() => setViewType('cluster-bars')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                viewType === 'cluster-bars'
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>أعمدة الكثافة المقارنة</span>
            </button>
            <button
              type="button"
              onClick={() => setViewType('letter-profile')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                viewType === 'letter-profile'
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>منحنى الحرف الفردي</span>
            </button>
          </div>
        </div>

        {/* Global Controls Filter Bar (identical to SahabaLetterHeatmap) */}
        <div className={`mt-3 pt-3 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs font-mono ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          {/* Group & Letter Order Selector */}
          {viewType === 'grid-heatmap' && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Heatmap Groups Filter */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className={`text-[10px] font-bold ${isLight ? 'text-slate-800' : 'text-sky-400'}`}>
                  المجموعة:
                </span>
                {HEATMAP_LETTER_GROUPS.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedHeatmapGroup(g.id)}
                    className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                      selectedHeatmapGroup === g.id
                        ? (isLight ? 'bg-sky-100 text-sky-900 border border-sky-400 font-bold shadow-2xs' : 'bg-sky-500/20 text-sky-400 border border-sky-500/50 font-bold')
                        : isLight 
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300' 
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Order selector for heatmap */}
              <div className={`flex items-center gap-1 border-r pr-2 ${isLight ? 'border-slate-300' : 'border-slate-800'}`}>
                <span className={`text-[10px] font-bold ${isLight ? 'text-slate-800' : 'text-slate-400'}`}>الترتيب:</span>
                <select
                  value={alphabetSortOrder}
                  onChange={(e) => setAlphabetSortOrder(e.target.value as AlphabetSortOrder)}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-mono border transition-colors cursor-pointer ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 font-medium' : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
                  <option value="hijai">الهجائي (أ، ب، ت...)</option>
                  <option value="abjadi">الأبجدي (أبجد هوز...)</option>
                  <option value="frequency_desc">الأكثر تكراراً بالحواميم</option>
                  <option value="frequency_asc">الأقل تكراراً بالحواميم</option>
                  <option value="phonetic">الصوتي (المخارج)</option>
                </select>
              </div>
            </div>
          )}

          {viewType === 'cluster-bars' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] font-bold ${isLight ? 'text-slate-800' : 'text-sky-400'}`}>
                مجموعة المقارنة:
              </span>
              {BAR_CHART_LETTER_GROUPS.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedBarGroup(g.id)}
                  className={`px-2.5 py-1 rounded text-[11px] transition-all cursor-pointer ${
                    selectedBarGroup === g.id
                      ? (isLight ? 'bg-sky-100 text-sky-900 border border-sky-400 font-bold shadow-2xs' : 'bg-sky-500/20 text-sky-400 border border-sky-500/50 font-bold')
                      : isLight 
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300' 
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}

          {viewType === 'letter-profile' && (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold ${isLight ? 'text-slate-800' : 'text-emerald-400'}`}>
                الحرف المُحلل:
              </span>
              <span className={`font-quran font-bold text-sm ${isLight ? 'text-sky-800' : 'text-sky-400'}`}>
                حرف «{activeLetter}» ({letterStats.letterNames[activeLetter]})
              </span>
            </div>
          )}

          {/* Metric Mode Toggle */}
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            <span className={`text-[10px] font-bold ${isLight ? 'text-slate-800' : 'text-amber-400'}`}>
              المقياس:
            </span>
            <div className={`flex items-center p-0.5 rounded-lg border ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => setMetricMode('percentage')}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                  metricMode === 'percentage'
                    ? (isLight ? 'bg-sky-200 text-sky-950 font-bold border border-sky-400 shadow-2xs' : 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40')
                    : isLight ? 'text-slate-700 hover:text-slate-900' : 'text-slate-400'
                }`}
                title="النسبة المئوية (%) من إجمالي حروف السورة"
              >
                نسبة مئوية %
              </button>
              <button
                type="button"
                onClick={() => setMetricMode('density')}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                  metricMode === 'density'
                    ? (isLight ? 'bg-amber-200 text-amber-950 font-bold border border-amber-400 shadow-2xs' : 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40')
                    : isLight ? 'text-slate-700 hover:text-slate-900' : 'text-slate-400'
                }`}
                title="كثافة ظهور الحرف لكل 100 كلمة في السورة (مُعايرة للكتلة النصية)"
              >
                كثافة (لكل 100 كلمة)
              </button>
              <button
                type="button"
                onClick={() => setMetricMode('rawCount')}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                  metricMode === 'rawCount'
                    ? (isLight ? 'bg-emerald-200 text-emerald-950 font-bold border border-emerald-400 shadow-2xs' : 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40')
                    : isLight ? 'text-slate-700 hover:text-slate-900' : 'text-slate-400'
                }`}
                title="العدد الخام لتكرار الحرف في السورة"
              >
                التعداد الحقيقي
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: COMPACT HIGH-DENSITY INTERACTIVE HEATMAP MATRIX (LettersLab & Sahaba style) */}
      {viewType === 'grid-heatmap' && (
        <div className={`rounded-xl p-3 sm:p-4 border transition-colors space-y-2.5 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'sci-bg sci-border'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h4 className={`text-xs sm:text-sm font-bold font-quran ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}>
                مصفوفة الكثافة الحرارية ({activeHeatmapLetters.length} حرفاً × 7 سور)
              </h4>
              {sortLetter && (
                <div className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  isLight ? 'bg-sky-100 text-sky-950 border-sky-300 font-bold' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                }`}>
                  <span>مرتب بحرف: <strong>{sortLetter}</strong></span>
                  <button 
                    type="button"
                    onClick={() => setSortLetter(null)}
                    className="cursor-pointer font-bold hover:opacity-75"
                    title="إلغاء الفرز"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-2 text-[10px] font-mono self-start sm:self-auto">
              <span className={isLight ? 'text-slate-700 font-medium' : 'text-slate-400'}>أدنى كثافة</span>
              <div className="flex items-center h-2.5 rounded overflow-hidden border border-slate-700/50">
                <div className="w-4 sm:w-5 h-full" style={{ backgroundColor: getCellColor(minVal) }} />
                <div className="w-4 sm:w-5 h-full" style={{ backgroundColor: getCellColor(minVal + (maxVal - minVal) * 0.35) }} />
                <div className="w-4 sm:w-5 h-full" style={{ backgroundColor: getCellColor(minVal + (maxVal - minVal) * 0.7) }} />
                <div className="w-4 sm:w-5 h-full" style={{ backgroundColor: getCellColor(maxVal) }} />
              </div>
              <span className={isLight ? 'text-slate-700 font-medium' : 'text-slate-400'}>أعلى كثافة</span>
            </div>
          </div>

          {/* Compact Heatmap Table Grid */}
          <div className="w-full flex-1 flex flex-col overflow-hidden rounded-lg border border-slate-700/40 shadow-inner">
            <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-sky-700/50">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className={isLight ? 'bg-slate-100 text-slate-800' : 'bg-[#0A0D12] text-sky-400'}>
                    {/* Sticky Surah Column */}
                    <th className={`p-2 text-right sticky right-0 z-20 min-w-[125px] sm:min-w-[145px] text-[11px] sm:text-xs font-mono border-l border-b border-slate-700/40 shadow-xs ${
                      isLight ? 'bg-slate-100 text-slate-900 font-bold' : 'bg-[#0A0D12]'
                    }`}>
                      السورة
                    </th>
                    {/* Words Column */}
                    <th className="p-1.5 sm:p-2 text-[10px] sm:text-[11px] font-mono border-l border-b border-slate-700/40 min-w-[65px] sm:min-w-[75px]">
                      الكلمات
                    </th>
                    {/* Total Letters Column */}
                    <th className="p-1.5 sm:p-2 text-[10px] sm:text-[11px] font-mono border-l border-b border-slate-700/40 min-w-[65px] sm:min-w-[75px]">
                      الحروف
                    </th>
                    {/* Letter Columns */}
                    {activeHeatmapLetters.map(letter => (
                      <th 
                        key={letter}
                        onClick={() => {
                          setSortLetter(sortLetter === letter ? null : letter);
                          setActiveLetter(letter);
                        }}
                        className={`p-1 sm:p-1.5 min-w-[34px] sm:min-w-[42px] font-quran font-bold text-xs sm:text-sm cursor-pointer transition-colors border-l border-b border-slate-700/40 ${
                          sortLetter === letter || activeLetter === letter
                            ? (isLight ? 'bg-sky-200 text-sky-950 border-b-2 border-sky-600' : 'bg-sky-500/30 text-sky-200 border-b-2 border-sky-400')
                            : isLight ? 'text-slate-800 hover:bg-slate-200' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                        title={`انقر لترتيب سور الحواميم بحرف «${letter}» (${letterStats.letterNames[letter]})`}
                      >
                        <div className="leading-tight">{letter}</div>
                        <div className={`text-[8.5px] font-mono font-normal leading-none mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {letterStats.letterNames[letter]?.slice(0, 3)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className={`divide-y text-xs font-mono ${isLight ? 'divide-slate-200 bg-white' : 'divide-slate-800/80 bg-[#0c121e]'}`}>
                  {sortedSurahs.map(surah => {
                    const surahColor = HAWAMEEM_SURAH_COLORS[surah.number]?.stroke || '#38bdf8';
                    const isSelected = selectedSurahNumber === surah.number;

                    return (
                      <tr 
                        key={surah.number}
                        className={`transition-colors ${
                          isSelected 
                            ? (isLight ? 'bg-sky-50' : 'bg-sky-950/40') 
                            : (isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30')
                        }`}
                      >
                        {/* Sticky Surah Meta */}
                        <td 
                          onClick={() => setSelectedSurahNumber(selectedSurahNumber === surah.number ? null : surah.number)}
                          className={`p-2 text-right sticky right-0 z-10 border-l border-slate-700/40 cursor-pointer ${
                            isLight ? 'bg-white shadow-xs' : 'bg-[#0e1726]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span 
                                className="w-2.5 h-2.5 rounded-full shrink-0" 
                                style={{ backgroundColor: surahColor }} 
                              />
                              <span className={`text-[11px] sm:text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                                {formatSurahName(surah.name)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-[9.5px] px-1 py-0.2 rounded font-mono font-bold ${
                                isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                              }`}>
                                {surah.number}
                              </span>
                              <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                                isLight ? 'bg-emerald-100 text-emerald-900 font-medium' : 'bg-emerald-950/60 text-emerald-400'
                              }`}>
                                مكية
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Words */}
                        <td className={`p-1.5 sm:p-2 border-l border-slate-700/40 text-[10px] sm:text-[11px] font-mono text-center font-semibold ${
                          isLight ? 'text-slate-700' : 'text-slate-300'
                        }`}>
                          {surah.totalWords.toLocaleString('en-US')}
                        </td>

                        {/* Total Letters */}
                        <td className={`p-1.5 sm:p-2 border-l border-slate-700/40 text-[10px] sm:text-[11px] font-mono text-center font-semibold ${
                          isLight ? 'text-slate-700' : 'text-slate-300'
                        }`}>
                          {surah.totalChars.toLocaleString('en-US')}
                        </td>

                        {/* 28 Letter Cells */}
                        {activeHeatmapLetters.map(letter => {
                          const val = getSurahLetterVal(surah.number, letter);
                          const count = report.hawameemLettersStats.find(s => s.surahNumber === surah.number)?.letterCounts[letter] || 0;
                          const pct = report.hawameemLettersStats.find(s => s.surahNumber === surah.number)?.letterPercentages[letter] || 0;
                          const density = surah.totalWords > 0 ? Number(((count / surah.totalWords) * 100).toFixed(2)) : 0;
                          const bgColor = getCellColor(val);
                          const isHighHeat = (val - minVal) / (maxVal - minVal || 1) > 0.65;

                          return (
                            <td
                              key={letter}
                              className="p-1 sm:p-1.5 min-w-[34px] sm:min-w-[42px] border-l border-slate-700/30 transition-all cursor-pointer hover:opacity-80"
                              style={{ backgroundColor: bgColor }}
                              onClick={() => setActiveLetter(letter)}
                              title={`${formatSurahName(surah.name)} (${surah.number})\nحرف: ${letter} (${letterStats.letterNames[letter]})\nالعدد الكامل: ${count.toLocaleString('en-US')} مرة\nالنسبة: ${pct}%\nالكثافة: ${density} لكل 100 كلمة`}
                            >
                              <div className={`font-mono text-[9.5px] sm:text-[10.5px] font-bold leading-none ${
                                isLight
                                  ? (isHighHeat ? 'text-white' : 'text-slate-950')
                                  : (isHighHeat ? 'text-sky-950 font-black' : 'text-slate-100')
                              }`}>
                                {metricMode === 'rawCount' 
                                  ? (val ? val.toLocaleString('en-US') : '0') 
                                  : val}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>

                {/* Aggregate Summary Footer Row (آل حـم السبع) */}
                <tfoot>
                  <tr className={`border-t-2 font-mono text-xs ${
                    isLight 
                      ? 'bg-slate-100 border-slate-300 text-slate-900 font-bold' 
                      : 'bg-[#0b101b] border-sky-500/40 text-sky-300 font-bold'
                  }`}>
                    <td className={`p-2 text-right sticky right-0 z-10 border-l border-slate-700/40 ${
                      isLight ? 'bg-slate-100 text-slate-950' : 'bg-[#0b101b]'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="font-bold">إجمالي الحواميم السبع (آل حم)</span>
                      </div>
                    </td>
                    <td className="p-1.5 sm:p-2 border-l border-slate-700/40 text-center text-[10px] sm:text-[11px]">
                      {report.totalHawameemWords.toLocaleString('en-US')}
                    </td>
                    <td className="p-1.5 sm:p-2 border-l border-slate-700/40 text-center text-[10px] sm:text-[11px]">
                      {report.totalHawameemLetters.toLocaleString('en-US')}
                    </td>
                    {activeHeatmapLetters.map(letter => {
                      const aggVal = getAggregateLetterVal(letter);
                      return (
                        <td 
                          key={`total-${letter}`}
                          className="p-1 sm:p-1.5 border-l border-slate-700/40 text-center font-bold text-[9.5px] sm:text-[10.5px]"
                          title={`إجمالي الحواميم السبع بحرف «${letter}»: ${hawameemAggregateStats.counts[letter]?.toLocaleString('en-US')} (${hawameemAggregateStats.percentages[letter]}%)`}
                        >
                          {metricMode === 'rawCount'
                            ? aggVal.toLocaleString('en-US')
                            : aggVal}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Explanatory note (matching Sahaba heatmap) */}
          <div className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-mono ${
            isLight 
              ? 'bg-sky-50 border-sky-200 text-sky-900' 
              : 'bg-sky-950/20 border-sky-800/40 text-sky-300'
          }`}>
            <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span>
              <strong>توجيه تصفح:</strong> يمكنك التمرير أفقياً لرؤية جميع الحروف الـ 28. انقر فوق أي حرف في رأس الجدول لترتيب السور حسب كثافته، أو انقر فوق أي خلية لعرض تحليل الحرف.
            </span>
          </div>
        </div>
      )}

      {/* VIEW 2: RECHARTS BAR CHART (SURAH COMPARISON - LIMITED TO READABLE SUBSETS) */}
      {viewType === 'cluster-bars' && (
        <div className={`rounded-xl p-3 sm:p-4 border transition-colors space-y-3 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'sci-bg sci-border'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className={`text-sm font-bold font-quran flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}>
                <BarChart3 className="w-4 h-4 text-sky-500" />
                <span>رسم بياني مقارن لكثافة الحروف عبر سور الحواميم السبع (Bar Chart)</span>
              </h4>
              <p className={`text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                مقارنة مستويات الحضور للحروف المختارة في كل سورة من سور الحواميم السبع لضمان وضوح الرسم والتحليل
              </p>
            </div>
          </div>

          <div className="h-[360px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={surahBarChartData}
                margin={{ top: 20, right: 10, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} />
                <XAxis 
                  dataKey="shortName" 
                  stroke={isLight ? '#475569' : '#94a3b8'} 
                  fontSize={11}
                  fontFamily="sans-serif"
                  tick={({ x, y, payload }) => (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={0} dy={16} textAnchor="middle" fill={isLight ? '#0f172a' : '#cbd5e1'} fontSize={11} fontWeight={600}>
                        {payload.value}
                      </text>
                    </g>
                  )}
                />
                <YAxis 
                  stroke={isLight ? '#475569' : '#94a3b8'} 
                  fontSize={10}
                  label={{ 
                    value: metricMode === 'density' ? 'كثافة (لكل 100 كلمة)' : metricMode === 'percentage' ? 'النسبة %' : 'التعداد', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: isLight ? '#334155' : '#94a3b8',
                    fontSize: 9
                  }} 
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const sData = payload[0]?.payload;
                    return (
                      <div className={`p-2.5 rounded-xl border shadow-xl text-xs font-mono ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
                      }`}>
                        <div className="font-bold border-b pb-1 mb-1 flex items-center justify-between gap-3">
                          <span className="text-sky-500">{label} ({sData.surahNumber})</span>
                          <span className={`${isLight ? 'text-slate-600' : 'text-slate-400'} font-normal`}>
                            {sData.totalWords?.toLocaleString()} كلمة
                          </span>
                        </div>
                        <div className="space-y-1">
                          {payload.map((entry: any) => {
                            const char = entry.name.replace('letter_', '');
                            return (
                              <div key={entry.name} className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                  <span className="font-quran font-bold">حرف {char} ({letterStats.letterNames[char]}):</span>
                                </span>
                                <span className="font-bold">{entry.value}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={32}
                  formatter={(val) => {
                    const char = val.replace('letter_', '');
                    return <span className="font-quran font-bold text-xs">حرف {char}</span>;
                  }}
                />
                {activeBarLetters.map((letter, idx) => (
                  <Bar
                    key={letter}
                    dataKey={`letter_${letter}`}
                    fill={LETTER_PALETTE[idx % LETTER_PALETTE.length]}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={22}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW 3: SINGLE LETTER PROFILE ACROSS THE 7 HAWAMEEM SURAHS */}
      {viewType === 'letter-profile' && (
        <div className={`rounded-xl p-3 sm:p-4 border transition-colors space-y-3 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'sci-bg sci-border'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h4 className={`text-sm font-bold font-quran flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}>
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>تدرج كثافة حرف «{activeLetter}» ({letterStats.letterNames[activeLetter]}) عبر سور الحواميم السبع</span>
              </h4>
              <p className={`text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                تتبع مسار الحرف في التسلسل المتتالي من غافر (40) إلى الأحقاف (46)
              </p>
            </div>

            {/* Letter selector chips */}
            <div className="flex flex-wrap items-center gap-1 max-w-full sm:max-w-md self-start sm:self-auto overflow-x-auto p-0.5">
              {ARABIC_LETTERS.map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setActiveLetter(l)}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded font-quran text-xs font-bold transition-all cursor-pointer ${
                    activeLetter === l
                      ? 'bg-sky-600 text-white shadow-xs scale-110'
                      : isLight 
                      ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Bar for the Active Letter */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className={`p-2.5 rounded-lg border text-xs font-mono ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>مجموع تكراره بالحواميم:</div>
              <div className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {letterAnalytics.hawameemTotal.toLocaleString()} مرة
              </div>
            </div>

            <div className={`p-2.5 rounded-lg border text-xs font-mono ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>نسبته بالحواميم vs المصحف:</div>
              <div className={`text-base font-bold ${
                letterAnalytics.deviation >= 0 
                  ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                  : (isLight ? 'text-amber-700' : 'text-amber-400')
              }`}>
                {letterAnalytics.hawameemPct}% <span className="text-[10px] font-normal text-slate-500">({letterAnalytics.globalPct}%)</span>
              </div>
            </div>

            <div className={`p-2.5 rounded-lg border text-xs font-mono ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>أعلى سورة حضوراً:</div>
              <div className={`text-sm font-bold truncate ${isLight ? 'text-sky-800' : 'text-sky-300'}`}>
                {formatSurahName(letterAnalytics.maxSurah.name)} ({letterAnalytics.maxValInLetter})
              </div>
            </div>

            <div className={`p-2.5 rounded-lg border text-xs font-mono ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>أدنى سورة حضوراً:</div>
              <div className={`text-sm font-bold truncate ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                {formatSurahName(letterAnalytics.minSurah.name)} ({letterAnalytics.minValInLetter})
              </div>
            </div>
          </div>

          <div className="h-[300px] sm:h-[320px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={singleLetterChartData}
                margin={{ top: 20, right: 10, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} />
                <XAxis 
                  dataKey="name" 
                  stroke={isLight ? '#475569' : '#94a3b8'} 
                  fontSize={11}
                  tick={({ x, y, payload }) => (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={0} dy={16} textAnchor="middle" fill={isLight ? '#0f172a' : '#cbd5e1'} fontSize={11} fontWeight={600}>
                        {payload.value}
                      </text>
                    </g>
                  )}
                />
                <YAxis 
                  stroke={isLight ? '#475569' : '#94a3b8'} 
                  fontSize={10}
                  label={{ 
                    value: metricMode === 'density' ? 'كثافة (لكل 100 كلمة)' : metricMode === 'percentage' ? 'النسبة %' : 'التعداد', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: isLight ? '#334155' : '#94a3b8',
                    fontSize: 9
                  }} 
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const sData = payload[0]?.payload;
                    return (
                      <div className={`p-2.5 rounded-xl border shadow-xl text-xs font-mono ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
                      }`}>
                        <div className="font-bold border-b pb-1 mb-1 flex items-center justify-between gap-3">
                          <span className="text-sky-500">سورة {label} ({sData.surahNumber})</span>
                          <span className="text-slate-400 font-normal">{sData.totalWords?.toLocaleString()} كلمة</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4">
                            <span>قيمة حرف «{activeLetter}»:</span>
                            <span className="font-bold text-sky-500">{sData.value}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-400">
                            <span>التعداد الحقيقي:</span>
                            <span>{sData.count?.toLocaleString()} مرة</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-400">
                            <span>إجمالي حروف السورة:</span>
                            <span>{sData.totalLetters?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[5, 5, 0, 0]}
                  maxBarSize={40}
                >
                  {singleLetterChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                    />
                  ))}
                </Bar>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={isLight ? '#0284c7' : '#38bdf8'} 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: isLight ? '#0284c7' : '#38bdf8', strokeWidth: 1.5, stroke: isLight ? '#ffffff' : '#0f172a' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Surah Quick Info Footer Cards (matching Sahaba clusters footer) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2">
        {report.surahs.map(surah => {
          const sColor = HAWAMEEM_SURAH_COLORS[surah.number]?.stroke || '#38bdf8';
          const isSelected = selectedSurahNumber === surah.number;

          return (
            <div
              key={surah.number}
              onClick={() => {
                setSelectedSurahNumber(selectedSurahNumber === surah.number ? null : surah.number);
                if (onSelectSurah) onSelectSurah(surah);
              }}
              className={`p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                isSelected
                  ? (isLight ? 'bg-sky-50 border-sky-500 shadow-xs ring-1 ring-sky-500' : 'bg-sky-500/10 border-sky-500 shadow-xs ring-1 ring-sky-500')
                  : isLight 
                  ? 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50' 
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sColor }} />
                <span className={`font-bold truncate text-[11px] ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {formatSurahName(surah.name)}
                </span>
              </div>
              <div className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                الرقم: {surah.number} • {surah.totalAyahs} آية
              </div>
              <div className={`text-[9px] mt-0.5 ${isLight ? 'text-slate-500 font-medium' : 'text-slate-500'}`}>
                {surah.totalWords.toLocaleString()} كلمة
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
