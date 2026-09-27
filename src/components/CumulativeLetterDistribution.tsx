import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Layers, 
  Sliders, 
  Sparkles, 
  HelpCircle, 
  Filter, 
  Plus, 
  X, 
  Check, 
  Activity,
  Hash,
  Percent,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Compass,
  BookOpen,
  Info,
  Sigma,
  Search
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { SurahData, LetterStatsData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ARABIC_LETTERS, ABJAD_HAWWAZ_LETTERS, formatSurahName } from '../utils/arabic';
import { SectionHelpButton } from './SectionHelpModal';
import { ChartMidpointMarker } from './ChartMidpointMarker';

// Floating tooltip for 114 Surahs accumulation chart, strictly bounded to prevent clipping on mobile portrait
const CustomMushafTooltip = ({ active, payload, isLight, accumulationLetter, totalQuranCount }: any) => {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  const accumPct = totalQuranCount > 0 
    ? ((p.cumulativeTotal / totalQuranCount) * 100).toFixed(1) 
    : '0';

  return (
    <div 
      className={`p-2.5 rounded-xl border shadow-xl text-xs font-mono max-w-[240px] pointer-events-none transition-all ${
        isLight 
          ? 'bg-white/95 border-sky-300 text-slate-900 shadow-sky-500/10' 
          : 'bg-slate-900/95 border-sky-500/50 text-slate-100 shadow-black/40'
      }`} 
      dir="rtl"
    >
      <div className="flex items-center justify-between border-b pb-1.5 mb-1.5 border-slate-700/20">
        <span className="font-bold text-sky-500 text-[13px]">{p.surahName}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
          p.type === 'مكية' 
            ? (isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-950/60 text-amber-300')
            : (isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-950/60 text-emerald-300')
        }`}>
          {p.type}
        </span>
      </div>

      <div className="space-y-1 text-[11px]">
        <div className="flex items-center justify-between">
          <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>ورود «{accumulationLetter}» بالسورة:</span>
          <strong className={isLight ? 'text-slate-900' : 'text-white'}>
            {p.countInSurah?.toLocaleString('en-US')} حرف ({p.pctInSurah}%)
          </strong>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-700/10">
          <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>التراكم حتى هنا:</span>
          <strong className="text-sky-400">
            {p.cumulativeTotal?.toLocaleString('en-US')} ({accumPct}%)
          </strong>
        </div>
      </div>
    </div>
  );
};

const SURAH_COLORS = [
  { hex: '#38bdf8', fill: 'rgba(56, 189, 248, 0.15)', name: 'سماوي' },
  { hex: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)', name: 'كهرماني' },
  { hex: '#10b981', fill: 'rgba(16, 185, 129, 0.15)', name: 'زمردي' },
  { hex: '#ec4899', fill: 'rgba(236, 72, 153, 0.15)', name: 'وردي' },
  { hex: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.15)', name: 'بنفسجي' }
];

// Floating custom tooltip for Pareto & Cumulative Letter curve, optimized specifically for portrait smartphone screens
const CustomParetoTooltip = ({ 
  active, 
  payload, 
  isLight, 
  orderMode, 
  metricMode, 
  activeSurahs 
}: any) => {
  if (!active || !payload || !payload.length) return null;

  const firstEntry = payload[0]?.payload;
  const rank = firstEntry?.rank;

  let title = '';
  let subtitle = '';

  if (orderMode === 'surah-freq') {
    if (activeSurahs.length === 1) {
      const char = firstEntry?.[`${activeSurahs[0]?.name}_letter`] || firstEntry?.letter;
      title = `الرتبة #${rank}: الحرف «${char}»`;
      subtitle = formatSurahName(activeSurahs[0]?.name);
    } else {
      title = `الرتبة #${rank} حسب التواتر الذاتي`;
      subtitle = `مقارنة الحرف رقم #${rank} الأكثر تكراراً`;
    }
  } else if (orderMode === 'abjad') {
    title = `الحرف «${firstEntry?.letter}»`;
    subtitle = `الرتبة #${rank} في ترتيب أبجد هوز`;
  } else if (orderMode === 'quran-freq') {
    title = `الحرف «${firstEntry?.letter}»`;
    subtitle = `الرتبة #${rank} في التواتر القرآني العام`;
  } else {
    title = `الحرف «${firstEntry?.letter}»`;
    subtitle = `الرتبة #${rank} في الترتيب الهجائي (أ - ي)`;
  }

  return (
    <div 
      className={`p-2.5 sm:p-3 rounded-xl border shadow-2xl text-xs font-mono max-w-[260px] sm:max-w-[300px] w-auto pointer-events-none transition-all relative z-50 ${
        isLight 
          ? 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-900/15 backdrop-blur-sm' 
          : 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-black/60 backdrop-blur-sm'
      }`} 
      dir="rtl"
    >
      {/* Header */}
      <div className="border-b pb-1.5 mb-2 border-slate-700/20 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="font-bold text-sky-500 text-[12px] sm:text-[13px] truncate">{title}</div>
          <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'} truncate`}>{subtitle}</div>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
          isLight ? 'bg-sky-100 text-sky-800' : 'bg-sky-950/70 text-sky-300'
        }`}>
          #{rank}
        </span>
      </div>

      {/* Surahs List - Vertical Stacked Cards */}
      <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
        {payload.map((item: any, idx: number) => {
          const surahName = item.name;
          const char = item.payload?.[`${surahName}_letter`];
          const count = item.payload?.[`${surahName}_count`] || 0;
          const singlePct = item.payload?.[`${surahName}_pct`] || 0;
          const cumCount = item.payload?.[`${surahName}_cum_count`];
          const cumPct = item.payload?.[`${surahName}_cum_pct`];
          const strokeColor = item.color || SURAH_COLORS[idx % SURAH_COLORS.length].hex;

          return (
            <div 
              key={surahName}
              className={`p-1.5 sm:p-2 rounded-lg border transition-all ${
                isLight 
                  ? 'bg-slate-50/90 border-slate-200' 
                  : 'bg-slate-800/70 border-slate-700/70'
              }`}
            >
              {/* Surah Header line */}
              <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-slate-700/10">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: strokeColor }} 
                  />
                  <span className="font-bold text-[11px] sm:text-xs truncate">{surahName}</span>
                </div>
                {char && (
                  <span className={`text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    isLight ? 'bg-sky-100 text-sky-800' : 'bg-sky-900/50 text-sky-300'
                  }`}>
                    حرف «{char}»
                  </span>
                )}
              </div>

              {/* Data rows in vertical layout */}
              <div className="pt-1.5 space-y-0.5 text-[10px] sm:text-[11px]">
                <div className="flex items-center justify-between">
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>تكرار الحرف:</span>
                  <span className="font-medium">
                    {count.toLocaleString('en-US')} مرة ({singlePct}%)
                  </span>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className={isLight ? 'text-slate-600 font-semibold' : 'text-slate-300 font-semibold'}>
                    التراكم حتى هنا:
                  </span>
                  <span className="font-bold text-emerald-500">
                    {metricMode === 'percentage' 
                      ? `${cumPct}%` 
                      : `${cumCount?.toLocaleString('en-US')} حرف`
                    }
                    {metricMode === 'percentage' && cumCount !== undefined && (
                      <span className={`text-[9px] sm:text-[10px] mr-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        ({cumCount?.toLocaleString('en-US')})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Frequency-descending order across the Quran (most common letters first)
const QURAN_LETTER_FREQ_ORDER = [
  'ا', 'ل', 'ن', 'م', 'و', 'ي', 'ه', 'ر', 'ب', 'ت',
  'ع', 'ف', 'ق', 'س', 'ك', 'د', 'ح', 'ذ', 'ج', 'خ',
  'ص', 'ش', 'ض', 'ز', 'ط', 'ث', 'ظ', 'غ'
];

interface CumulativeLetterDistributionProps {
  surahs: SurahData[];
  letterStats: LetterStatsData;
  onSelectSurah?: (surah: SurahData) => void;
}

export const CumulativeLetterDistribution: React.FC<CumulativeLetterDistributionProps> = ({
  surahs,
  letterStats,
  onSelectSurah
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Submode: 'surahs-curve' (alphabet cumulative density) vs 'mushaf-accumulation' (1 to 114 accumulation)
  const [chartMode, setChartMode] = useState<'surahs-curve' | 'mushaf-accumulation'>('surahs-curve');

  // Selected Surahs for comparison
  const [selectedSurahIds, setSelectedSurahIds] = useState<number[]>([1]);

  // Metric: Percentage vs Count
  const [metricMode, setMetricMode] = useState<'percentage' | 'count'>('percentage');

  // Letter ordering: 'abjad' (Abjad Hawwaz) | 'surah-freq' (sorted descending per surah) | 'alphabet' (Hija'i) | 'quran-freq' (Quran-wide freq)
  const [orderMode, setOrderMode] = useState<'abjad' | 'surah-freq' | 'alphabet' | 'quran-freq'>('abjad');

  // Show / hide educational explanation card (expanded by default to ensure immediate access)
  const [showExplainer, setShowExplainer] = useState<boolean>(true);

  // Chosen letter for 1-114 mushaf accumulation chart
  const [accumulationLetter, setAccumulationLetter] = useState<string>('ق');

  // Currently inspected surah in 114 accumulation mode (1 to 114) for mobile & desktop inspector
  const [inspectedSurahNumber, setInspectedSurahNumber] = useState<number>(1);

  // Search filter and category filter for 114 Surahs list (for phone portrait & desktop)
  const [surahSearchQuery, setSurahSearchQuery] = useState<string>('');
  const [surahCategoryFilter, setSurahCategoryFilter] = useState<'all' | 'top' | 'zero' | 'meccan' | 'medinan'>('all');
  const [showMobileSurahList, setShowMobileSurahList] = useState<boolean>(true);
  const [showSurahsTable, setShowSurahsTable] = useState<boolean>(false);

  // Primary active surah (used in single-surah modes or as primary comparator)
  const primarySurah = useMemo(() => {
    return surahs.find(s => s.number === selectedSurahIds[0]) || surahs[0];
  }, [selectedSurahIds, surahs]);

  // Selected surah objects (supports single-surah analysis and multi-surah Pareto comparison)
  const activeSurahs = useMemo(() => {
    return selectedSurahIds.map(id => surahs.find(s => s.number === id) || surahs[0]);
  }, [selectedSurahIds, surahs]);

  // Change primary single surah
  const handleChangePrimarySurah = (surahId: number) => {
    setSelectedSurahIds([surahId]);
  };

  // Add a surah to comparison (up to 5)
  const handleAddSurah = (surahId: number) => {
    if (!selectedSurahIds.includes(surahId) && selectedSurahIds.length < 5) {
      setSelectedSurahIds(prev => [...prev, surahId]);
    }
  };

  // Remove a surah from comparison
  const handleRemoveSurah = (surahId: number) => {
    if (selectedSurahIds.length > 1) {
      setSelectedSurahIds(prev => prev.filter(id => id !== surahId));
    }
  };

  // Toggle surah selection
  const handleToggleSurah = (surahId: number) => {
    if (selectedSurahIds.includes(surahId)) {
      handleRemoveSurah(surahId);
    } else {
      handleAddSurah(surahId);
    }
  };

  // Ranked list of Quran letters by total occurrences derived dynamically from active corpus stats
  const quranLetterFreqRanked = useMemo(() => {
    let totalAll = 0;
    ARABIC_LETTERS.forEach(l => {
      totalAll += letterStats?.globalStats?.[l]?.totalOccurrences || 0;
    });

    const list = ARABIC_LETTERS.map(l => {
      const count = letterStats?.globalStats?.[l]?.totalOccurrences || 0;
      const pct = totalAll > 0 ? Number(((count / totalAll) * 100).toFixed(2)) : 0;
      return {
        letter: l,
        name: letterStats?.letterNames?.[l] || l,
        count,
        pct,
      };
    });

    list.sort((a, b) => b.count - a.count);
    return { list, totalAll };
  }, [letterStats]);

  // Chart 1 Data: Cumulative distribution across 28 letters / ranks
  const cumulativeAlphabetData = useMemo(() => {
    // Determine exact total letter counts for each active surah (ensures exact mathematical convergence to 100.00%)
    const surahTotalCounts: Record<number, number> = {};
    activeSurahs.forEach(s => {
      let sum = 0;
      ARABIC_LETTERS.forEach(l => {
        sum += s.letters?.plainCounts?.[l] || 0;
      });
      surahTotalCounts[s.number] = sum > 0 ? sum : (s.letters?.totalLettersPlain || s.totalChars || 1);
    });

    if (orderMode === 'surah-freq') {
      // Self-sorted descending by letter frequency for each active surah
      // Enables comparing multiple surahs (e.g. Al-Baqarah vs Al-Kafirun) on their true Pareto concentration rank
      const surahRankedLetters: Record<number, Array<{ char: string; count: number; pct: number }>> = {};
      const runningCounts: Record<number, number> = {};

      activeSurahs.forEach(s => {
        runningCounts[s.number] = 0;
        const total = surahTotalCounts[s.number];
        const sorted = ARABIC_LETTERS.map(l => {
          const count = s.letters?.plainCounts?.[l] || 0;
          const pct = total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0;
          return { char: l, count, pct };
        }).sort((a, b) => b.count - a.count || a.char.localeCompare(b.char));
        surahRankedLetters[s.number] = sorted;
      });

      const isMulti = activeSurahs.length > 1;

      return Array.from({ length: 28 }, (_, idx) => {
        const rank = idx + 1;
        const singleSurahLetter = surahRankedLetters[primarySurah.number]?.[idx]?.char || '';

        const entry: Record<string, any> = {
          rank,
          rankLabel: `${rank}`,
          letter: isMulti ? `ر${rank}` : singleSurahLetter,
          letterName: isMulti ? `الرتبة #${rank}` : `الرتبة #${rank}: «${singleSurahLetter}»`
        };

        activeSurahs.forEach(s => {
          const item = surahRankedLetters[s.number]?.[idx] || { char: '', count: 0, pct: 0 };
          const surahTotal = surahTotalCounts[s.number];

          // Accumulate raw integer counts without any floating-point or rounding drift
          runningCounts[s.number] += item.count;
          const currentCount = runningCounts[s.number];

          // Mathematically exact cumulative percentage
          let cumulativeVal: number;
          if (metricMode === 'count') {
            cumulativeVal = currentCount;
          } else {
            if (idx === 27 || currentCount >= surahTotal) {
              // The 28th (final) rank covers all letters: mathematically identically 100%
              cumulativeVal = 100;
            } else {
              cumulativeVal = Math.min(100, Number(((currentCount / surahTotal) * 100).toFixed(2)));
            }
          }

          const cumPctVal = idx === 27 ? 100 : Math.min(100, Number(((currentCount / surahTotal) * 100).toFixed(2)));

          entry[s.name] = cumulativeVal;
          entry[`${s.name}_letter`] = item.char;
          entry[`${s.name}_single`] = metricMode === 'count' ? item.count : item.pct;
          entry[`${s.name}_count`] = item.count;
          entry[`${s.name}_pct`] = item.pct;
          entry[`${s.name}_cum_count`] = currentCount;
          entry[`${s.name}_cum_pct`] = cumPctVal;
          entry[`${s.name}_rank`] = rank;
        });

        return entry;
      });
    }

    // Fixed sequence modes: Abjad Hawwaz, Hija'i (alphabet), or Quran-wide frequency
    let sequence: string[];
    if (orderMode === 'abjad') {
      sequence = ABJAD_HAWWAZ_LETTERS;
    } else if (orderMode === 'quran-freq') {
      sequence = quranLetterFreqRanked.list.map(item => item.letter);
    } else {
      sequence = ARABIC_LETTERS;
    }

    const runningCounts: Record<number, number> = {};
    activeSurahs.forEach(s => {
      runningCounts[s.number] = 0;
    });

    return sequence.map((letter, idx) => {
      const rank = idx + 1;
      const entry: Record<string, any> = {
        rank,
        rankLabel: `${rank}`,
        letter,
        letterName: `${rank}. «${letter}»`
      };

      activeSurahs.forEach(s => {
        const count = s.letters?.plainCounts?.[letter] || 0;
        const surahTotal = surahTotalCounts[s.number];
        const pct = surahTotal > 0 ? Number(((count / surahTotal) * 100).toFixed(2)) : 0;

        runningCounts[s.number] += count;
        const currentCount = runningCounts[s.number];

        let cumulativeVal: number;
        if (metricMode === 'count') {
          cumulativeVal = currentCount;
        } else {
          if (idx === 27 || currentCount >= surahTotal) {
            cumulativeVal = 100;
          } else {
            cumulativeVal = Math.min(100, Number(((currentCount / surahTotal) * 100).toFixed(2)));
          }
        }

        const cumPctVal = idx === 27 ? 100 : Math.min(100, Number(((currentCount / surahTotal) * 100).toFixed(2)));

        entry[s.name] = cumulativeVal;
        entry[`${s.name}_letter`] = letter;
        entry[`${s.name}_single`] = metricMode === 'count' ? count : pct;
        entry[`${s.name}_count`] = count;
        entry[`${s.name}_pct`] = pct;
        entry[`${s.name}_cum_count`] = currentCount;
        entry[`${s.name}_cum_pct`] = cumPctVal;
        entry[`${s.name}_rank`] = rank;
      });

      return entry;
    });
  }, [primarySurah, activeSurahs, orderMode, metricMode, quranLetterFreqRanked]);

  // Chart 2 Data: Accumulation of a specific letter across 114 Surahs
  const mushafAccumulationData = useMemo(() => {
    let runningCount = 0;
    return surahs.map(s => {
      const countInSurah = s.letters?.plainCounts?.[accumulationLetter] || 0;
      const pctInSurah = s.letters?.plainPercentages?.[accumulationLetter] || 0;
      runningCount += countInSurah;
      return {
        number: s.number,
        surahName: `${s.number}. ${s.name}`,
        rawName: s.name,
        type: s.revelationType === 'Meccan' ? 'مكية' : 'مدنية',
        countInSurah,
        pctInSurah,
        cumulativeTotal: runningCount
      };
    });
  }, [surahs, accumulationLetter]);

  // Overall statistics for the chosen accumulation letter across the Quran
  const accumulationLetterSummary = useMemo(() => {
    let totalCount = 0;
    let surahsWithLetter = 0;
    let maxSurahName = '';
    let maxCount = 0;

    surahs.forEach(s => {
      const c = s.letters?.plainCounts?.[accumulationLetter] || 0;
      if (c > 0) {
        totalCount += c;
        surahsWithLetter++;
        if (c > maxCount) {
          maxCount = c;
          maxSurahName = s.name;
        }
      }
    });

    return { totalCount, surahsWithLetter, maxSurahName, maxCount };
  }, [surahs, accumulationLetter]);

  // Current inspected surah details for 114 accumulation mode
  const inspectedSurahData = useMemo(() => {
    return mushafAccumulationData.find(d => d.number === inspectedSurahNumber) || mushafAccumulationData[0];
  }, [mushafAccumulationData, inspectedSurahNumber]);

  // Percentage of total Quran occurrences of this letter accumulated up to inspected surah
  const inspectedProgressPct = useMemo(() => {
    if (!inspectedSurahData || !accumulationLetterSummary.totalCount) return '0';
    return ((inspectedSurahData.cumulativeTotal / accumulationLetterSummary.totalCount) * 100).toFixed(1);
  }, [inspectedSurahData, accumulationLetterSummary]);

  // Midpoint surah (where 50% of this letter's total in the Quran is reached)
  const midpointSurah = useMemo(() => {
    const half = (accumulationLetterSummary.totalCount || 0) / 2;
    return mushafAccumulationData.find(d => d.cumulativeTotal >= half) || mushafAccumulationData[0];
  }, [mushafAccumulationData, accumulationLetterSummary]);

  // Surahs with zero occurrences of this letter
  const zeroCountSurahs = useMemo(() => {
    return mushafAccumulationData.filter(d => d.countInSurah === 0);
  }, [mushafAccumulationData]);

  // Top surah by occurrence of this letter
  const topSurah = useMemo(() => {
    return [...mushafAccumulationData].sort((a, b) => b.countInSurah - a.countInSurah)[0];
  }, [mushafAccumulationData]);

  // Filtered list of surahs for the 114 interactive list (mobile portrait & desktop dual layout)
  const filteredMushafSurahs = useMemo(() => {
    return mushafAccumulationData.filter(item => {
      if (surahSearchQuery.trim()) {
        const q = surahSearchQuery.trim().toLowerCase();
        const matchName = item.rawName.toLowerCase().includes(q);
        const matchNum = String(item.number).includes(q);
        if (!matchName && !matchNum) return false;
      }
      if (surahCategoryFilter === 'top') return item.countInSurah > 0;
      if (surahCategoryFilter === 'zero') return item.countInSurah === 0;
      if (surahCategoryFilter === 'meccan') return item.type === 'مكية';
      if (surahCategoryFilter === 'medinan') return item.type === 'مدنية';
      return true;
    });
  }, [mushafAccumulationData, surahSearchQuery, surahCategoryFilter]);

  // Letter Concentration Statistics (P50 & P80) - accurately calculated per surah
  const concentrationStats = useMemo(() => {
    return activeSurahs.map(s => {
      const surahTotal = ARABIC_LETTERS.reduce((acc, l) => acc + (s.letters?.plainCounts?.[l] || 0), 0) 
        || s.letters?.totalLettersPlain 
        || s.totalChars 
        || 1;

      // Sort distinct letters in this surah descending by count
      const letterEntries = ARABIC_LETTERS.map(l => ({
        char: l,
        count: s.letters?.plainCounts?.[l] || 0,
        pct: ((s.letters?.plainCounts?.[l] || 0) / surahTotal) * 100
      })).sort((a, b) => b.count - a.count);

      let accum = 0;
      let p50Letters = 0;
      const p50Chars: string[] = [];
      let p80Letters = 0;
      const p80Chars: string[] = [];
      const distinctLetters = letterEntries.filter(e => e.count > 0);

      for (let i = 0; i < letterEntries.length; i++) {
        const item = letterEntries[i];
        accum += item.pct;
        if (p50Letters === 0) {
          p50Chars.push(item.char);
          if (accum >= 50) {
            p50Letters = i + 1;
          }
        }
        if (p80Letters === 0) {
          p80Chars.push(item.char);
          if (accum >= 80) {
            p80Letters = i + 1;
          }
        }
      }

      return {
        surah: s,
        p50Letters: p50Letters || 4,
        p50Chars,
        p80Letters: p80Letters || 10,
        p80Chars,
        distinctCount: distinctLetters.length
      };
    });
  }, [activeSurahs]);

  return (
    <div className="space-y-4">
      {/* 1. Control Header & Mode Tabs */}
      <div className={`sci-bg sci-border rounded-xl p-4 shadow-sm transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-slate-100'
            }`}>
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>منحنى التوزيع التراكمي للحروف وكثافة الحضور (Recharts)</span>
              <SectionHelpButton 
                guideId="letters-lab-cumulative" 
                variant="icon" 
                title="استعلام: شرح منحنى التوزيع التراكمي وتركز الأحرف" 
              />
            </h3>
            <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              تحليل المنحنيات التراكمية للأحرف (Cumulative Density Curves) ومقارنة تركز الحروف عبر السور المختلفة
            </p>
          </div>

          {/* Sub-modes Switch */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border font-mono transition-colors ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/40 border-slate-800'
          }`}>
            <button
              onClick={() => setChartMode('surahs-curve')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                chartMode === 'surahs-curve'
                  ? 'bg-sky-500 text-white font-bold shadow-xs'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>منحنى الحروف الـ 28 التراكمي</span>
            </button>
            <button
              onClick={() => setChartMode('mushaf-accumulation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                chartMode === 'mushaf-accumulation'
                  ? 'bg-sky-500 text-white font-bold shadow-xs'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>التراكم التصاعدي عبر الـ 114 سورة</span>
            </button>
          </div>
        </div>

        {/* Dynamic Controls based on Chart Mode */}
        {chartMode === 'surahs-curve' ? (
          <div className="space-y-3 pt-3 border-t border-slate-700/20">
            {/* Metric & Order Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
              <span className={`text-[11px] font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                خيارات العرض ومقياس التراكم:
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {/* Metric Mode */}
                <div className={`flex items-center gap-1 p-1 rounded-lg border ${
                  isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/30 border-slate-800'
                }`}>
                  <button
                    onClick={() => setMetricMode('percentage')}
                    className={`px-2.5 py-1 rounded text-[11px] transition-all cursor-pointer ${
                      metricMode === 'percentage'
                        ? 'bg-sky-500 text-white font-bold shadow-xs'
                        : isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                    title="عرض التراكم بالنسبة المئوية (من 0% إلى 100%)"
                  >
                    النسبة التراكمية (%)
                  </button>
                  <button
                    onClick={() => setMetricMode('count')}
                    className={`px-2.5 py-1 rounded text-[11px] transition-all cursor-pointer ${
                      metricMode === 'count'
                        ? 'bg-sky-500 text-white font-bold shadow-xs'
                        : isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                    title="عرض التراكم العددي الخام للحروف"
                  >
                    العدد التراكمي الخام
                  </button>
                </div>

                {/* Letter Ordering (معلم X) */}
                <div className={`flex flex-wrap items-center gap-1 p-1 rounded-lg border ${
                  isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/30 border-slate-800'
                }`}>
                  <span className={`text-[10px] font-mono px-1.5 hidden sm:inline ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    ترتيب الحروف (معلم X):
                  </span>
                  <button
                    id="order-mode-abjad-btn"
                    type="button"
                    onClick={() => setOrderMode('abjad')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      orderMode === 'abjad'
                        ? 'bg-sky-500 text-white shadow-xs'
                        : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="ترتيب الحروف بحسب أبجدية أبجد هوز (أ، ب، ج، د، هـ، و، ز...)"
                  >
                    أبجد هوز (أ، ب، ج...)
                  </button>
                  <button
                    id="order-mode-surah-freq-btn"
                    type="button"
                    onClick={() => setOrderMode('surah-freq')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      orderMode === 'surah-freq'
                        ? 'bg-sky-500 text-white shadow-xs'
                        : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="ترتيب الحروف على المحور الأفقي تصاعدياً بحسب رتبة الأكثر وروداً في كل سورة (منحنى باريتو المقارن الدقيق لتركز الحروف)"
                  >
                    رتبة التواتر الذاتية (منحنى باريتو)
                  </button>
                  <button
                    id="order-mode-alphabet-btn"
                    type="button"
                    onClick={() => setOrderMode('alphabet')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      orderMode === 'alphabet'
                        ? 'bg-sky-500 text-white shadow-xs'
                        : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="الترتيب الهجائي المعتاد (أ، ب، ت، ث...)"
                  >
                    الترتيب الهجائي (أ - ي)
                  </button>
                  <button
                    id="order-mode-quran-freq-btn"
                    type="button"
                    onClick={() => setOrderMode('quran-freq')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      orderMode === 'quran-freq'
                        ? 'bg-sky-500 text-white shadow-xs'
                        : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="ترتيب الحروف حسب تواتر الورود في كامل القرآن الكريم (ا، ل، ن، م...)"
                  >
                    التواتر القرآني العام
                  </button>
                </div>
              </div>
            </div>

            {/* Surah Selection & Comparison Controls */}
            <div className={`p-3 rounded-xl border space-y-2.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/25 border-slate-800'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 w-full min-w-0">
                  {selectedSurahIds.length === 1 ? (
                    /* Single Surah Mode: Clear Direct Surah Selector + Add Comparison Dropdown */
                    <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
                      <div className="flex items-center gap-2 min-w-0 max-w-full">
                        <span 
                          className="w-3 h-3 rounded-full inline-block shrink-0" 
                          style={{ backgroundColor: SURAH_COLORS[0].hex }} 
                        />
                        <span className={`text-xs font-mono font-bold shrink-0 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          السورة المعروضة:
                        </span>
                        <select
                          id="cumulative-primary-surah-select"
                          value={selectedSurahIds[0]}
                          onChange={(e) => handleChangePrimarySurah(Number(e.target.value))}
                          className={`text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer shadow-xs max-w-[210px] sm:max-w-[260px] truncate ${
                            isLight 
                              ? 'bg-white border-sky-400 text-sky-800 focus:ring-2 focus:ring-sky-500/20' 
                              : 'bg-slate-900 border-sky-500/50 text-sky-300 focus:ring-2 focus:ring-sky-500/30'
                          }`}
                          title="تغيير السورة المعروضة حالياً"
                        >
                          {surahs.map(s => (
                            <option key={s.number} value={s.number}>
                              {s.number}. {s.name} ({s.totalAyahs} آية)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={`h-5 w-px mx-0.5 hidden sm:block ${isLight ? 'bg-slate-300' : 'bg-slate-700'}`} />

                      {/* Add another surah to compare */}
                      <select
                        id="cumulative-add-compare-select"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddSurah(Number(e.target.value));
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                        className={`text-xs font-mono px-2.5 py-1.5 rounded-lg border border-dashed transition-all cursor-pointer max-w-[190px] sm:max-w-[220px] truncate ${
                          isLight 
                            ? 'bg-white border-slate-300 text-slate-700 hover:border-sky-500 hover:text-sky-700' 
                            : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-sky-500 hover:text-sky-300'
                        }`}
                        title="إضافة سورة أخرى لمقارنتها على نفس المنحنى التراكمي"
                      >
                        <option value="" disabled>+ إضافة سورة للمقارنة...</option>
                        {surahs.filter(s => !selectedSurahIds.includes(s.number)).map(s => (
                          <option key={s.number} value={s.number}>
                            {s.number}. {s.name} ({s.totalAyahs} آية)
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    /* Multi-Surah Comparison Mode */
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        السور المقارنة ({activeSurahs.length}/5):
                      </span>
                      {activeSurahs.map((surah, sIdx) => {
                        const color = SURAH_COLORS[sIdx % SURAH_COLORS.length];
                        return (
                          <div
                            key={surah.number}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                              isLight 
                                ? 'bg-white border-slate-300 text-slate-800 shadow-xs' 
                                : 'bg-slate-900 border-slate-700 text-slate-200'
                            }`}
                          >
                            <span 
                              className="w-2.5 h-2.5 rounded-full inline-block shrink-0" 
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="font-bold">{surah.name}</span>
                            <span className="text-[10px] text-slate-400">({surah.totalAyahs} آية)</span>
                            <button
                              onClick={() => handleRemoveSurah(surah.number)}
                              className="text-slate-400 hover:text-rose-400 mr-1 p-0.5 rounded hover:bg-rose-500/10 cursor-pointer transition-colors"
                              title="إزالة هذه السورة من المقارنة"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}

                      {/* Add another surah if < 5 */}
                      {activeSurahs.length < 5 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddSurah(Number(e.target.value));
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                          className={`text-xs font-mono px-2.5 py-1.5 rounded-lg border border-dashed transition-colors cursor-pointer ${
                            isLight 
                              ? 'bg-white border-slate-300 text-slate-700 hover:border-sky-500' 
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-sky-500'
                          }`}
                          title="إضافة سورة أخرى للمقارنة"
                        >
                          <option value="" disabled>+ إضافة سورة ({activeSurahs.length}/5)...</option>
                          {surahs.filter(s => !selectedSurahIds.includes(s.number)).map(s => (
                            <option key={s.number} value={s.number}>
                              {s.number}. {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Explanatory Guidance Banner for Selected Order Mode */}
              <div className={`p-2.5 rounded-xl border text-xs font-mono flex items-start gap-2 ${
                orderMode === 'surah-freq'
                  ? isLight ? 'bg-sky-50/90 border-sky-200 text-sky-950' : 'bg-sky-950/40 border-sky-800/60 text-sky-200'
                  : isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0A0D12] border-slate-800 text-slate-300'
              }`}>
                <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${orderMode === 'surah-freq' ? 'text-sky-500' : 'text-slate-400'}`} />
                <div className="space-y-0.5">
                  <div className="font-bold">
                    {orderMode === 'surah-freq' 
                      ? (activeSurahs.length > 1 
                          ? 'منحنى باريتو المقارن للرتب الذاتية (حل مشكلة اختلاف توزيع الحروف بين السور):' 
                          : `منحنى التراكم الذاتي لسورة «${primarySurah.name}» (رتب الحروف الأكثر وروداً):`)
                      : orderMode === 'quran-freq'
                        ? 'منحنى التراكم وفق التواتر القرآني العام (ا، ل، ن، م...):'
                        : orderMode === 'abjad'
                          ? 'منحنى التراكم وفق ترتيب أبجد هوز التاريخي:'
                          : 'منحنى التراكم وفق الترتيب الهجائي الألفبائي (أ - ي):'
                    }
                  </div>
                  <div className="text-[11px] leading-relaxed opacity-90">
                    {orderMode === 'surah-freq'
                      ? (activeSurahs.length > 1
                          ? 'يتراكم كل منحنى تصاعدياً بحسب رتبة الحرف الأكثر تواتراً في كل سورة (الرتبة 1 للأكثر، ثم 2، حتى 28). هذا يتيح المقارنة الرياضية الدقيقة لتمركز الحروف ومعدل الوصول إلى 50% و80% بين السور (مثل البقرة والكافرون) بغض النظر عن اختلاف حروف كل سورة.'
                          : `تترتب حروف سورة «${primarySurah.name}» على المحور الأفقي من الأكثر تكراراً إلى الأقل، لتتبع سرعة تركز الحروف في السورة بدقة رياضية. يمكنك إضافة سور أخرى للمقارنة.`
                        )
                      : (activeSurahs.length > 1
                          ? 'المحور الأفقي هنا موحد بتسلسل حرفي ثابت للجميع. إذا كنت ترغب في مقارنة تصاعدية ذاتية سلسة لكل سورة دون قفزات ناتجة عن اختلاف توزيع الحروف، اختر «رتبة التواتر الذاتية (منحنى باريتو)». '
                          : 'المحور الأفقي يسير بتسلسل حرفي ثابت ومحدد مسبقاً عبر الحروف الـ 28.'
                        )
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Letter selector for 114 Surahs Accumulation */
          <div className="space-y-3 pt-3 border-t border-slate-700/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                اختر الحرف لمتابعة تراكم وروده الصريح من الفاتحة (1) إلى الناس (114):
              </span>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-sky-400">
                  الحرف الحالي: <strong className="font-quran text-base">«{accumulationLetter}»</strong>
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-md border ${
                  isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                  مجموع الورود: <strong>{accumulationLetterSummary.totalCount.toLocaleString('en-US')}</strong> مرة
                </span>
              </div>
            </div>
            {/* Responsive Letters Selection: On mobile portrait, display as neat 7-column grid (7x4 = 28 letters all visible at once without horizontal scrolling!) */}
            <div className="grid grid-cols-7 sm:grid-cols-14 md:flex md:flex-wrap gap-1.5 pt-1">
              {ARABIC_LETTERS.map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setAccumulationLetter(l)}
                  className={`h-9 rounded-lg font-quran font-bold text-base flex items-center justify-center transition-all cursor-pointer ${
                    accumulationLetter === l
                      ? 'bg-sky-500 text-white font-bold shadow-md ring-2 ring-sky-400/50 scale-105 z-10'
                      : isLight
                        ? 'bg-white hover:bg-sky-50 text-slate-800 border border-slate-300 hover:border-sky-300 shadow-xs'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-500'
                  }`}
                  title={`اختيار حرف ${l}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. RECHARTS VISUALIZATION CANVAS */}
      <div className={`sci-bg sci-border rounded-xl p-4 shadow-sm transition-colors relative z-30 overflow-visible ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 text-xs font-mono">
          <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            {chartMode === 'surahs-curve'
              ? (orderMode === 'surah-freq' 
                  ? (activeSurahs.length === 1 
                      ? `منحنى باريتو التراكمي لسورة «${primarySurah.name}» (الحروف الأكثر وروداً على المحور الأفقي)`
                      : `منحنى باريتو المقارن (${activeSurahs.map(s => s.name).join(' ضد ')}) بحسب رتب التواتر الذاتية لكل سورة`)
                  : orderMode === 'abjad'
                    ? 'منحنى التراكم حسب ترتيب أبجدية (أبجد هوّز حطي كلمن...)'
                    : orderMode === 'quran-freq' 
                      ? 'منحنى التراكم حسب التواتر القرآني العام (ا، ل، ن، م...)' 
                      : 'منحنى التراكم حسب الترتيب الهجائي (أ - ي)')
              : `تراكم ورود حرف «${accumulationLetter}» تصاعدياً عبر المصحف الشريف (1 - 114)`}
          </span>
          <span className="text-[10px] text-slate-400">
            {chartMode === 'surahs-curve' 
              ? (orderMode === 'surah-freq'
                  ? (activeSurahs.length === 1 
                      ? `المحور الأفقي: حروف السورة مرتبة تنازلياً • الرأسي: ${metricMode === 'percentage' ? 'النسبة التراكمية %' : 'إجمالي الحروف المتراكمة'}`
                      : `المحور الأفقي: رتبة الحرف في كل سورة (ر1..ر28) • الرأسي: ${metricMode === 'percentage' ? 'النسبة التراكمية %' : 'إجمالي الحروف المتراكمة'}`)
                  : `المحور الأفقي: الحرف الموحد • الرأسي: ${metricMode === 'percentage' ? 'النسبة التراكمية %' : 'إجمالي الحروف المتراكمة'}`)
              : 'المحور الأفقي: تسلسل السور (1 - 114) • الرأسي: إجمالي الورود المتراكم'}
          </span>
        </div>

        {/* Dedicated Live Mobile-Optimized Inspector Bar (In 114 accumulation mode) */}
        {chartMode === 'mushaf-accumulation' && (
          <div className={`mb-3 p-3 rounded-xl border transition-all ${
            isLight ? 'bg-sky-50/80 border-sky-200' : 'bg-sky-950/30 border-sky-800/60'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Active Surah Badge & Counts */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                    isLight ? 'bg-sky-200/70 text-sky-900' : 'bg-sky-900/60 text-sky-200'
                  }`}>
                    سورة #{inspectedSurahData.number}
                  </span>
                  <strong className={`font-quran text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    «{inspectedSurahData.rawName}»
                  </strong>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    inspectedSurahData.type === 'مكية' 
                      ? (isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-950/60 text-amber-300')
                      : (isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-950/60 text-emerald-300')
                  }`}>
                    {inspectedSurahData.type}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className={`px-2 py-0.5 rounded border ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}>
                    وروده بالسورة: <strong className="text-sky-500">{inspectedSurahData.countInSurah.toLocaleString('en-US')}</strong> ({inspectedSurahData.pctInSurah}%)
                  </span>
                  <span className={`px-2 py-0.5 rounded border ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}>
                    التراكم حتى هنا: <strong className="text-emerald-500">{inspectedSurahData.cumulativeTotal.toLocaleString('en-US')}</strong> ({inspectedProgressPct}%)
                  </span>
                </div>
              </div>

              {/* Navigation and Selector Controls */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setInspectedSurahNumber(prev => Math.max(1, prev - 1))}
                  disabled={inspectedSurahNumber <= 1}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isLight ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100' : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                  }`}
                  title="السورة السابقة"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>السابقة</span>
                </button>

                <select
                  value={inspectedSurahNumber}
                  onChange={(e) => setInspectedSurahNumber(Number(e.target.value))}
                  className={`text-xs font-mono font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                  aria-label="اختيار سورة للمعاينة"
                >
                  {surahs.map(s => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {s.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setInspectedSurahNumber(prev => Math.min(114, prev + 1))}
                  disabled={inspectedSurahNumber >= 114}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isLight ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100' : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                  }`}
                  title="السورة التالية"
                >
                  <span>التالية</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Visual Canvas (Responsive Layout: Full width for surahs-curve, Dual Grid for 114 accumulation) */}
        {chartMode === 'surahs-curve' ? (
          <div className="h-[360px] sm:h-[420px] w-full min-w-0 relative z-20 overflow-visible" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeAlphabetData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid stroke={isLight ? '#E2E8F0' : '#1E293B'} strokeDasharray="3 3" />
                <XAxis 
                  dataKey="letter" 
                  tick={{ 
                    fill: isLight ? '#0F172A' : '#E2E8F0', 
                    fontSize: orderMode === 'surah-freq' && activeSurahs.length > 1 ? 11 : 13, 
                    fontFamily: orderMode === 'surah-freq' && activeSurahs.length > 1 ? 'ui-monospace, monospace' : 'Amiri, serif', 
                    fontWeight: 'bold' 
                  }} 
                  interval={0}
                />
                <YAxis 
                  domain={[0, metricMode === 'percentage' ? 100 : 'auto']}
                  ticks={metricMode === 'percentage' ? [0, 20, 40, 60, 80, 100] : undefined}
                  tickFormatter={(val) => metricMode === 'percentage' ? `${Math.round(val)}%` : val.toLocaleString()}
                  unit={metricMode === 'percentage' ? '%' : ''}
                  stroke={isLight ? '#94A3B8' : '#475569'} 
                  fontSize={11}
                  fontFamily="monospace"
                />
                <Tooltip 
                  content={
                    <CustomParetoTooltip 
                      isLight={isLight} 
                      orderMode={orderMode} 
                      metricMode={metricMode} 
                      activeSurahs={activeSurahs} 
                    />
                  }
                  allowEscapeViewBox={{ x: false, y: true }}
                  wrapperStyle={{ zIndex: 9999, outline: 'none', pointerEvents: 'none' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px' }} 
                />

                {activeSurahs.map((surah, sIdx) => {
                  const color = SURAH_COLORS[sIdx % SURAH_COLORS.length];
                  return (
                    <Line
                      key={surah.number}
                      type="monotone"
                      name={surah.name}
                      dataKey={surah.name}
                      stroke={color.hex}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: color.hex }}
                      activeDot={{ r: 6 }}
                    />
                  );
                })}

                {/* 50% Midpoint marker on the Y-axis (column) */}
                {cumulativeAlphabetData.length > 0 && (
                  <ChartMidpointMarker 
                    y={metricMode === 'percentage' 
                      ? 50 
                      : Math.round(Math.max(...activeSurahs.map(s => s.totalChars ?? s.letters?.totalLettersPlain ?? 100), 100) / 2)
                    }
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* Dual Responsive Layout: Curve on desktop left, 114 Surahs Synchronized List on desktop right; Stacked seamlessly on phone portrait! */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* AreaChart Container */}
            <div className="lg:col-span-8 w-full min-w-0">
              <div className="h-[280px] sm:h-[350px] lg:h-[400px] w-full min-w-0" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={mushafAccumulationData} 
                    margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
                    onMouseMove={(state: any) => {
                      if (state?.activePayload?.[0]?.payload?.number) {
                        setInspectedSurahNumber(state.activePayload[0].payload.number);
                      }
                    }}
                    onClick={(state: any) => {
                      if (state?.activePayload?.[0]?.payload?.number) {
                        setInspectedSurahNumber(state.activePayload[0].payload.number);
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="accumGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={isLight ? '#E2E8F0' : '#1E293B'} strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="number" 
                      stroke={isLight ? '#94A3B8' : '#475569'} 
                      fontSize={10}
                      fontFamily="monospace"
                      tickFormatter={(val) => `س.${val}`}
                    />
                    <YAxis 
                      stroke={isLight ? '#94A3B8' : '#475569'} 
                      fontSize={11}
                      fontFamily="monospace"
                    />
                    <Tooltip 
                      allowEscapeViewBox={{ x: false, y: false }}
                      wrapperStyle={{ zIndex: 100, outline: 'none' }}
                      content={
                        <CustomMushafTooltip 
                          isLight={isLight} 
                          accumulationLetter={accumulationLetter} 
                          totalQuranCount={accumulationLetterSummary.totalCount} 
                        />
                      }
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulativeTotal" 
                      name={`تراكم حرف «${accumulationLetter}»`} 
                      stroke="#38bdf8" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#accumGrad)" 
                    />
                    {/* 50% Midpoint marker on the Y-axis (column) */}
                    <ChartMidpointMarker 
                      y={Math.round((mushafAccumulationData[mushafAccumulationData.length - 1]?.cumulativeTotal || 100) / 2)}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className={`text-[10px] font-mono text-center mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                انقر أو المس أي نقطة على المنحنى لتحديد السورة وتزامن بياناتها فوراً مع القائمة
              </p>
            </div>

            {/* Synchronized 114 Surahs Panel (Beside curve on desktop, directly below curve on mobile portrait) */}
            <div className="lg:col-span-4 w-full min-w-0">
              <div className={`p-3 rounded-xl border flex flex-col h-auto lg:h-[400px] transition-all shadow-xs ${
                isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-black/30 border-slate-800'
              }`}>
                {/* Header with Search and Stats */}
                <div className="pb-2.5 mb-2 border-b border-slate-700/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                      <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        قائمة السور الـ 114
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-bold">
                      {filteredMushafSurahs.length} سورة
                    </span>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={surahSearchQuery}
                      onChange={(e) => setSurahSearchQuery(e.target.value)}
                      placeholder="ابحث بالسورة أو الرقم..."
                      className={`w-full text-xs font-mono px-7 py-1.5 rounded-lg border transition-all ${
                        isLight 
                          ? 'bg-white border-slate-300 text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20' 
                          : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20'
                      }`}
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                    {surahSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSurahSearchQuery('')}
                        className="absolute left-2 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                        title="مسح البحث"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setSurahCategoryFilter('all')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        surahCategoryFilter === 'all'
                          ? 'bg-sky-500 text-white font-bold shadow-xs'
                          : isLight ? 'bg-white text-slate-600 border border-slate-200' : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      الكل ({mushafAccumulationData.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSurahCategoryFilter('top')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        surahCategoryFilter === 'top'
                          ? 'bg-sky-500 text-white font-bold shadow-xs'
                          : isLight ? 'bg-white text-slate-600 border border-slate-200' : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      الوارد فيها ({accumulationLetterSummary.surahsWithLetter})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSurahCategoryFilter('zero')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        surahCategoryFilter === 'zero'
                          ? 'bg-rose-500 text-white font-bold shadow-xs'
                          : isLight ? 'bg-white text-slate-600 border border-slate-200' : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      الخالية ({zeroCountSurahs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSurahCategoryFilter('meccan')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        surahCategoryFilter === 'meccan'
                          ? 'bg-amber-500 text-white font-bold shadow-xs'
                          : isLight ? 'bg-white text-slate-600 border border-slate-200' : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      مكية
                    </button>
                    <button
                      type="button"
                      onClick={() => setSurahCategoryFilter('medinan')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        surahCategoryFilter === 'medinan'
                          ? 'bg-emerald-500 text-white font-bold shadow-xs'
                          : isLight ? 'bg-white text-slate-600 border border-slate-200' : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      مدنية
                    </button>
                  </div>
                </div>

                {/* Surah List (Scrollable, touch-friendly 42px min height, high contrast active state) */}
                <div className="flex-1 overflow-y-auto max-h-72 lg:max-h-none space-y-1 pr-1 font-mono text-xs">
                  {filteredMushafSurahs.map(item => {
                    const isSelected = item.number === inspectedSurahNumber;
                    const itemProgress = accumulationLetterSummary.totalCount > 0 
                      ? ((item.cumulativeTotal / accumulationLetterSummary.totalCount) * 100).toFixed(1)
                      : '0';

                    return (
                      <div
                        key={item.number}
                        onClick={() => setInspectedSurahNumber(item.number)}
                        className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between min-h-[42px] ${
                          isSelected 
                            ? (isLight 
                                ? 'bg-sky-100 border-sky-400 text-sky-950 font-bold shadow-xs ring-1 ring-sky-400' 
                                : 'bg-sky-950/70 border-sky-500 text-sky-200 font-bold shadow-xs ring-1 ring-sky-500/50') 
                            : (isLight 
                                ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800' 
                                : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 text-slate-300')
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] w-6 text-center rounded px-1 ${
                            isSelected 
                              ? (isLight ? 'bg-sky-200 text-sky-900 font-bold' : 'bg-sky-800 text-sky-100 font-bold') 
                              : 'text-slate-400'
                          }`}>
                            {item.number}
                          </span>
                          <span className="font-quran text-sm">{item.rawName}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded ${
                            item.type === 'مكية' 
                              ? (isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-950/60 text-amber-300') 
                              : (isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-950/60 text-emerald-300')
                          }`}>
                            {item.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-left">
                          <div>
                            <span className="text-slate-400 text-[9px] block">بالسورة:</span>
                            <strong className={item.countInSurah === 0 ? 'text-slate-500' : 'text-sky-500'}>
                              {item.countInSurah}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[9px] block">التراكم:</span>
                            <strong className="text-emerald-500">{item.cumulativeTotal}</strong>
                            <span className="text-[9px] text-slate-400 block">({itemProgress}%)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredMushafSurahs.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      لا توجد سور مطابقة لبحثك
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Letter Density & Concentration Benchmarks (P50 & P80) */}
      {chartMode === 'surahs-curve' && (
        <div className={`sci-bg sci-border rounded-xl p-4 shadow-sm transition-colors relative z-10 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'
        }`}>
          <h4 className={`text-xs font-bold font-mono uppercase mb-3 flex items-center justify-between ${
            isLight ? 'text-slate-800' : 'text-slate-200'
          }`}>
            <span>معايير تركز الحروف وقاعدة باريتو القرآنية (Pareto & Concentration Benchmarks)</span>
            <span className="text-[10px] font-normal text-slate-400">
              حساب إحصائي دقيق: كم حرفاً يلزم لتغطية نصف و80% من حروف السورة؟
            </span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono">
            {concentrationStats.map((c, idx) => {
              const color = SURAH_COLORS[idx % SURAH_COLORS.length];
              return (
                <div 
                  key={c.surah.number}
                  className={`p-3 rounded-xl border transition-colors ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.hex }} />
                      <strong className={`text-xs ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                        {formatSurahName(c.surah.name)}
                      </strong>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {c.surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {c.surah.totalChars.toLocaleString('en-US')} حرف
                    </span>
                  </div>

                  <div className="space-y-2 text-xs pt-1 border-t border-slate-700/20">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">نقطة الـ 50% (P50):</span>
                      <strong className="text-sky-400">
                        {c.p50Letters} حروف فقط 
                        <span className="text-[10px] font-normal text-slate-400 mr-1">
                          ({c.p50Chars.join('، ')})
                        </span>
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">نقطة الـ 80% (P80 باريتو):</span>
                      <strong className="text-amber-400">
                        {c.p80Letters} حرفاً
                        <span className="text-[10px] font-normal text-slate-400 mr-1">
                          ({c.p80Chars.join('، ')})
                        </span>
                      </strong>
                    </div>
                    <div className="flex items-center justify-between pt-0.5 border-t border-slate-700/10">
                      <span className="text-slate-400 text-[10px]">تنوع الحروف المستخدمة:</span>
                      <span className="text-[11px] font-bold text-slate-300">
                        {c.distinctCount} حرفاً من أصل 28
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 pt-1">
                      {c.distinctCount <= 18 || c.p50Letters <= 4 
                        ? 'تركّز صوتي عالي جداً: قلة من الحروف تهيمن على البناء الصوتي للسورة.'
                        : 'توزيع صوتي متوازن: تتوزع الكلمات على مروحة واسعة ومتجانسة من حروف الهجاء.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Mushaf Accumulation Inspector & Mobile-Optimized Data Panel (114 Surahs) */}
      {chartMode === 'mushaf-accumulation' && (
        <div className="space-y-4">
          {/* Active Surah Inspection Card (Mobile-First, vertical friendly, fully visible in portrait mode) */}
          <div className={`sci-bg sci-border rounded-xl p-4 shadow-sm transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/20">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${isLight ? 'bg-sky-100 text-sky-800' : 'bg-sky-950/70 text-sky-400'}`}>
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold font-mono ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    لوحة فحص السورة والتراكم (مُهيأة للعرض الطولي على الهاتف)
                  </h4>
                  <p className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    انقر على المنحنى، أو اسحب المزلجة، أو اختر السورة مباشرة من القائمة
                  </p>
                </div>
              </div>

              {/* Direct Surah Selector Dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className={`text-[11px] font-mono shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  اختر سورة:
                </span>
                <select
                  value={inspectedSurahNumber}
                  onChange={(e) => setInspectedSurahNumber(Number(e.target.value))}
                  className={`w-full sm:w-auto text-xs font-mono font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-sky-500' 
                      : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-sky-500'
                  }`}
                  aria-label="اختيار سورة مفحوصة"
                >
                  {surahs.map(s => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {s.name} ({s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Main Inspection Grid (Adaptive: 1 column on mobile vertical, 3 columns on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
              {/* Card 1: Surah Identity */}
              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>السورة المفحوصة</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    inspectedSurahData.type === 'مكية' 
                      ? (isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-950/60 text-amber-300')
                      : (isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-950/60 text-emerald-300')
                  }`}>
                    {inspectedSurahData.type}
                  </span>
                </div>
                <div className={`text-base sm:text-lg font-bold font-quran ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {inspectedSurahData.surahName}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  ترتيبها بالمصحف: السورة {inspectedSurahData.number} من 114
                </div>
              </div>

              {/* Card 2: Letter count in this surah */}
              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    ورود «{accumulationLetter}» بهذه السورة
                  </span>
                  <span className="text-[10px] font-mono text-sky-400 font-bold">
                    {inspectedSurahData.pctInSurah}%
                  </span>
                </div>
                <div className="text-base sm:text-lg font-bold font-mono text-sky-400">
                  {inspectedSurahData.countInSurah.toLocaleString('en-US')} <span className="text-xs font-normal text-slate-400">حرف</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  {inspectedSurahData.countInSurah === 0 
                    ? 'هذه السورة خالية تماماً من هذا الحرف' 
                    : `يشكل ${inspectedSurahData.pctInSurah}% من إجمالي حروف السورة`}
                </div>
              </div>

              {/* Card 3: Cumulative Total */}
              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    التراكم حتى نهاية السورة
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {inspectedProgressPct}%
                  </span>
                </div>
                <div className="text-base sm:text-lg font-bold font-mono text-emerald-400">
                  {inspectedSurahData.cumulativeTotal.toLocaleString('en-US')} <span className="text-xs font-normal text-slate-400">حرف</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  من إجمالي {accumulationLetterSummary.totalCount.toLocaleString('en-US')} حرف في المصحف
                </div>
              </div>
            </div>

            {/* Visual Accumulation Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[11px] font-mono">
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                  مسار التراكم: استوعب <strong className="text-sky-400">{inspectedProgressPct}%</strong> من إجمالي ورود حرف «{accumulationLetter}» حتى سورة {inspectedSurahData.rawName}
                </span>
                <span className="font-bold text-sky-400 font-mono">{inspectedProgressPct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
                <div 
                  className="h-full bg-linear-to-r from-sky-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(1, Number(inspectedProgressPct)))}%` }}
                />
              </div>
            </div>

            {/* Interactive Surah Slider & Navigation Controls */}
            <div className="pt-3 mt-3 border-t border-slate-700/20 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectedSurahNumber(prev => Math.max(1, prev - 1))}
                  disabled={inspectedSurahNumber <= 1}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' 
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                  title="السورة السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابقة</span>
                </button>

                <input
                  type="range"
                  min={1}
                  max={114}
                  value={inspectedSurahNumber}
                  onChange={(e) => setInspectedSurahNumber(Number(e.target.value))}
                  className="flex-1 accent-sky-400 cursor-pointer h-2 bg-slate-700 rounded-lg"
                  aria-label="تحديد السورة المفحوصة"
                />

                <button
                  onClick={() => setInspectedSurahNumber(prev => Math.min(114, prev + 1))}
                  disabled={inspectedSurahNumber >= 114}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' 
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                  title="السورة التالية"
                >
                  <span>التالية</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
                <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>قفز سريع:</span>
                <button
                  onClick={() => setInspectedSurahNumber(1)}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    inspectedSurahNumber === 1 
                      ? 'bg-sky-500 text-white font-bold border-sky-400' 
                      : isLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  سورة الفاتحة (1)
                </button>

                {topSurah && (
                  <button
                    onClick={() => setInspectedSurahNumber(topSurah.number)}
                    className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      inspectedSurahNumber === topSurah.number 
                        ? 'bg-sky-500 text-white font-bold border-sky-400' 
                        : isLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    أعلى سورة: {topSurah.rawName} ({topSurah.countInSurah})
                  </button>
                )}

                {midpointSurah && (
                  <button
                    onClick={() => setInspectedSurahNumber(midpointSurah.number)}
                    className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      inspectedSurahNumber === midpointSurah.number 
                        ? 'bg-sky-500 text-white font-bold border-sky-400' 
                        : isLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    منتصف التراكم 50%: {midpointSurah.rawName}
                  </button>
                )}

                <button
                  onClick={() => setInspectedSurahNumber(114)}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    inspectedSurahNumber === 114 
                      ? 'bg-sky-500 text-white font-bold border-sky-400' 
                      : isLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  سورة الناس (114)
                </button>
              </div>
            </div>
          </div>

          {/* Quick KPI Stat Highlights across the 114 Surahs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'
            }`}>
              <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>إجمالي ورود الحرف:</span>
              <strong className="text-sm sm:text-base text-sky-400">
                {accumulationLetterSummary.totalCount.toLocaleString('en-US')}
              </strong>
              <span className="text-[10px] text-slate-400 mr-1">حرف في القرآن</span>
            </div>

            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'
            }`}>
              <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>السور التي ورد فيها:</span>
              <strong className="text-sm sm:text-base text-emerald-400">
                {accumulationLetterSummary.surahsWithLetter}
              </strong>
              <span className="text-[10px] text-slate-400 mr-1">من أصل 114 سورة</span>
            </div>

            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'
            }`}>
              <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>أعلى سورة في الورود:</span>
              <strong className="text-sm sm:text-base text-amber-400">
                سورة {accumulationLetterSummary.maxSurahName}
              </strong>
              <span className="text-[10px] text-slate-400 block mt-0.5">({accumulationLetterSummary.maxCount.toLocaleString('en-US')} مرة)</span>
            </div>

            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'
            }`}>
              <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>السور الخالية من الحرف:</span>
              <strong className="text-sm sm:text-base text-rose-400">
                {zeroCountSurahs.length}
              </strong>
              <span className="text-[10px] text-slate-400 mr-1">سورة لا يرد فيها الحرف</span>
            </div>
          </div>

          {/* Expandable 114 Surahs Full Data Table / List */}
          <div className={`rounded-xl border transition-all shadow-xs ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'
          }`}>
            <button
              onClick={() => setShowSurahsTable(prev => !prev)}
              className={`w-full p-3.5 flex items-center justify-between text-right cursor-pointer rounded-xl transition-colors ${
                isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span className={`text-xs sm:text-sm font-bold font-mono ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  جدول بيانات السور الـ 114 التفصيلي لمسار تراكم حرف «{accumulationLetter}»
                </span>
              </div>
              <div className={`flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}>
                <span>{showSurahsTable ? 'طي الجدول' : 'عرض السور الـ 114'}</span>
                {showSurahsTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showSurahsTable && (
              <div className="p-3 border-t border-slate-700/20">
                <p className={`text-[11px] font-mono mb-2.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  انقر على أي سورة في القائمة لتحديدها على المنحنى ورؤية تفاصيلها فوراً:
                </p>
                <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-700/30 divide-y divide-slate-700/20 text-xs font-mono">
                  {mushafAccumulationData.map(item => {
                    const isSelected = item.number === inspectedSurahNumber;
                    const itemProgress = accumulationLetterSummary.totalCount > 0 
                      ? ((item.cumulativeTotal / accumulationLetterSummary.totalCount) * 100).toFixed(1)
                      : '0';

                    return (
                      <div
                        key={item.number}
                        onClick={() => setInspectedSurahNumber(item.number)}
                        className={`p-2.5 flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected 
                            ? (isLight ? 'bg-sky-100 text-sky-900 font-bold' : 'bg-sky-950/60 text-sky-300 font-bold') 
                            : (isLight ? 'hover:bg-slate-50 text-slate-800' : 'hover:bg-slate-900/40 text-slate-300')
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 w-6 text-left">{item.number}.</span>
                          <span className="font-quran text-sm">{item.rawName}</span>
                          <span className="text-[10px] px-1 rounded bg-slate-500/10 text-slate-400">{item.type}</span>
                        </div>

                        <div className="flex items-center gap-4 text-[11px]">
                          <div>
                            <span className="text-slate-400 text-[10px] ml-1">في السورة:</span>
                            <strong className={item.countInSurah === 0 ? 'text-slate-500' : 'text-sky-400'}>
                              {item.countInSurah}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] ml-1">التراكم:</span>
                            <strong className="text-emerald-400">{item.cumulativeTotal.toLocaleString('en-US')}</strong>
                            <span className="text-[10px] text-slate-400 mr-1">({itemProgress}%)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Educational Explainer Accordion (Placed at the bottom, closed by default, high contrast) */}
      <div className={`rounded-xl border transition-all shadow-xs ${
        isLight 
          ? 'bg-white border-slate-300 text-slate-900' 
          : 'bg-[#0B0F17] border-slate-800 text-slate-100'
      }`}>
        <button
          onClick={() => setShowExplainer(prev => !prev)}
          className={`w-full p-4 flex items-center justify-between text-right cursor-pointer rounded-xl transition-colors ${
            isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/50'
          }`}
          aria-expanded={showExplainer}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isLight ? 'bg-sky-100 text-sky-800' : 'bg-sky-950/70 text-sky-300'}`}>
              <HelpCircle className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <div className={`text-xs sm:text-sm font-bold font-mono ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                دليل فهم منحنى الكثافة التراكمية للحروف وقاعدة باريتو
              </div>
              <div className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {showExplainer ? 'انقر لطي الشرح التوضيحي' : 'انقر لفتح الشرح التفصيلي لكيفية قراءة المنحنى والمحاور ونقاط التركز'}
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-lg border transition-all ${
            isLight 
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900' 
              : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-100'
          }`}>
            <span>{showExplainer ? 'إخفاء الشرح' : 'عرض الشرح'}</span>
            {showExplainer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showExplainer && (
          <div className={`px-4 pb-5 pt-3 border-t text-xs font-mono space-y-3 leading-relaxed ${
            isLight 
              ? 'border-slate-200 text-slate-900' 
              : 'border-slate-800/80 text-slate-200'
          }`}>
            <div className={`p-3.5 rounded-lg border ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900/60 border-slate-800 text-slate-200'
            }`}>
              <span className={`font-bold block mb-1 text-[13px] ${isLight ? 'text-sky-900' : 'text-sky-300'}`}>
                ١. ما هو المنحنى التراكمي (Cumulative Distribution Curve)؟
              </span>
              <p className={isLight ? 'text-slate-800' : 'text-slate-200'}>
                المنحنى يبدأ دائماً من الصفر (أول حرف)، ومع إضافة الحروف واحداً تلو الآخر تتصاعد النسبة التراكمية تدريجياً حتى تصل إلى <strong>100%</strong> (أو كامل عدد أحرف السورة) عند استيعاب جميع الحروف الـ 28.
              </p>
            </div>

            <div className={`p-3.5 rounded-lg border ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900/60 border-slate-800 text-slate-200'
            }`}>
              <span className={`font-bold block mb-1 text-[13px] ${isLight ? 'text-emerald-900' : 'text-emerald-300'}`}>
                ٢. سر الصعود السريع في البداية (قاعدة باريتو القرآنية 80/20):
              </span>
              <p className={isLight ? 'text-slate-800' : 'text-slate-200'}>
                في النص القرآني الكريم، تتركز الكلمات في عدد قليل جداً من الحروف؛ حيث تكفي <strong>4 إلى 5 أحرف فقط</strong> (مثل الألف واللام والميم والنون) لتغطية أكثر من <strong>50%</strong> من نص السورة، وتكفي <strong>7 إلى 11 حرفاً</strong> فقط لتغطية <strong>80%</strong> من إجمالي حروف السورة، وهو ما يفسر الانحناء الصاعد بقوة في الثلث الأول من الرسم البياني.
              </p>
            </div>

            <div className={`p-3.5 rounded-lg border ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900/60 border-slate-800 text-slate-200'
            }`}>
              <span className={`font-bold block mb-1.5 text-[13px] ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>
                ٣. الفرق بين أنماط الترتيب الأربعة على المحور الأفقي (س):
              </span>
              <ul className={`list-disc list-inside space-y-2 mr-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                <li>
                  <strong className={isLight ? 'text-slate-950 font-bold' : 'text-white'}>منحنى باريتو للسورة (تنازلي خاص):</strong> يرتب حروف كل سورة على حدة من الأكثر تكراراً فيها إلى الأقل (من الرتبة #1 إلى #28). هذا هو الوضع الأدق للمقارنة ومعرفة سرعة تركز الأصوات ومعامل باريتو لكل سورة.
                </li>
                <li>
                  <strong className={isLight ? 'text-slate-950 font-bold' : 'text-white'}>التواتر القرآني العام (ا، ل، ن، م...):</strong> يثبت الحروف بترتيب ورودها الإجمالي في القرآن كاملاً، مما يجعله خطاً مرجعياً (Baseline) يوضح هل السورة تسير على النسق القرآني العام أم تتفرد ببناء صوتي خاص.
                </li>
                <li>
                  <strong className={isLight ? 'text-slate-950 font-bold' : 'text-white'}>أبجدية (أبجد هوّز):</strong> الترتيب الأبجدي السامي التاريخي القديم المستخدم في حساب الجُمّل والتقويم وتشفير المخطوطات (أبجد، هوّز، حطّي، كلمن، سعفص، قرشت، ثخذ، ضظغ).
                </li>
                <li>
                  <strong className={isLight ? 'text-slate-950 font-bold' : 'text-white'}>الترتيب الهجائي (أ - ي):</strong> الترتيب الألفبائي الصرفي المدرسي المعتاد (نصر بن عاصم) لتتبع توزع حروف السورة حسب شكلها المعجمي.
                </li>
              </ul>
            </div>

            {/* 4. Deep Dive into General Quranic Frequency Order */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isLight 
                ? 'bg-sky-50/50 border-sky-200 text-slate-900' 
                : 'bg-sky-950/20 border-sky-900/60 text-slate-100'
            }`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-500 shrink-0" />
                <span className={`font-bold text-[13px] sm:text-sm ${isLight ? 'text-sky-950' : 'text-sky-300'}`}>
                  ٤. ما هو «التواتر القرآني العام» وكيف تم التوصل إلى هذا الترتيب تحديداً؟
                </span>
              </div>

              <div className="space-y-2 text-[11px] sm:text-xs">
                <p>
                  <strong className={isLight ? 'text-slate-950' : 'text-white'}>• التسمية والماهية:</strong> يُطلق عليه في الدراسات اللغوية والإحصائية للقرآن الكريم (Quranic Corpus Linguistics): <strong>«التواتر القرآني العام»</strong> أو <strong>«ترتيب الشيوع الإحصائي لحروف المصحف»</strong> (Quran-wide Letter Frequency). وكلمة «التواتر» في اللغة تعني تتابع الشيء وتكراره مرة بعد مرة، وسُمي بـ «العام» لأنه يشمل مجمل المتن القرآني بكافة سوره الـ 114 ككتلة واحدة (المجتمع الإحصائي الشامل)، تمييزاً له عن تواتر الحرف داخل سورة محددة بعينها.
                </p>

                <p>
                  <strong className={isLight ? 'text-slate-950' : 'text-white'}>• هل هو ترتيب توقيفي أم ماذا؟</strong> هو <strong>ليس ترتيباً توقيفياً دينياً</strong> (كالترتيب المعتمد لترتيب السور أو الآيات)، ولا ترتيباً لغوياً كلاسيكياً (كالترتيب الهجائي أو الأبجدي أو الصوتي لمخارج الحروف عند الخليل وسيبويه)، بل هو <strong>«حقيقة إحصائية استقرائية حاسوبية كمية خالصة»</strong>.
                </p>

                <p>
                  <strong className={isLight ? 'text-slate-950' : 'text-white'}>• كيف تم التوصل إلى هذا الترتيب رياضياً؟</strong>
                  <br />
                  ١. تم إجراء مسح إحصائي شامل لنص القرآن الكريم كاملاً بآياته الـ <strong>6,236 آية</strong> برسم المصحف العثماني (نحو <strong>{quranLetterFreqRanked.totalAll.toLocaleString('en-US')}</strong> حرفاً).
                  <br />
                  ٢. جرى إحصاء عدد مرات ورود كل حرف من الحروف الـ 28 في القرآن كله من سورة الفاتحة حتى سورة الناس.
                  <br />
                  ٣. رُتبت الحروف الـ 28 تنازلياً بحسب عدد التكرارات؛ فتصدر الحرف الأكثر تكراراً (الألف) في المرتبة الأولى، واستقر الحرف الأقل تكراراً (الظاء) في المرتبة الأخيرة (الرتبة #28).
                </p>
              </div>

              {/* Quran Frequency Letter Breakdown Table */}
              <div className="pt-2">
                <span className={`text-[11px] font-bold block mb-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  جدول الرتب والتكرار الإحصائي للحروف الـ 28 في متن القرآن الكريم كاملاً:
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 font-mono text-[10px]">
                  {quranLetterFreqRanked.list.map((item, idx) => (
                    <div 
                      key={item.letter}
                      className={`p-2 rounded-lg border flex flex-col justify-between transition-colors ${
                        idx < 4 
                          ? (isLight ? 'bg-sky-100/70 border-sky-300 text-sky-950 font-bold' : 'bg-sky-950/40 border-sky-700/60 text-sky-200 font-bold')
                          : (isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/80 border-slate-800 text-slate-300')
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-400">#{idx + 1}</span>
                        <span className="font-quran text-sm">{item.letter}</span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between pt-1 border-t border-slate-700/10">
                        <span className="text-slate-400 text-[9px]">{item.pct}%</span>
                        <strong>{item.count.toLocaleString('en-US')}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rhetorical and Analytical Insights */}
              <div className={`p-3 rounded-lg border text-[11px] space-y-1.5 ${
                isLight ? 'bg-white border-sky-200 text-slate-800' : 'bg-black/30 border-sky-900/40 text-slate-300'
              }`}>
                <div className="flex items-center gap-1.5 font-bold text-sky-500">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>دلالات بلاغية وإحصائية للتواتر القرآني العام:</span>
                </div>
                <p>
                  <strong>١. التركز الهائل:</strong> الحروف الأربعة الأولى فقط (ا، ل، ن، م) تستوعب وحدها نحو <strong>48%</strong> من كل حروف القرآن! وإذا أضفنا حَرفَي العلة (و، ي) تصبح الستة أحرف الأولى مستوعبة لأكثر من <strong>63%</strong> من كامل النص القرآني.
                </p>
                <p>
                  <strong>٢. الارتباط بفواتح السور (الحروف المقطعة):</strong> الحروف الأربعة الأكثر وروداً في القرآن (ا، ل، ن، م) هي ذاتها أركان فواتح السور النورانية (الم، الر، المر، طسم، حم، ن)، مما يعكس تناغماً مذهلاً بين مفتتح السورة وجوهر النسيج اللغوي لكامل القرآن.
                </p>
                <p>
                  <strong>٣. الوظيفة التحليلية (البصمة المعيارية Baseline):</strong> اعتماد هذا الترتيب كمعيار قياسي يمكّن الباحث من اكتشاف تميز كل سورة؛ فإذا كانت السورة تحتوي على طغيان صوتي لحرف معين (مثل القاف في سورة "ق"، أو الصاد في سورة "ص"، أو الراء في "الكوثر")، يظهر فوراً بروز ذلك الحرف وانحرافه عن النسق القرآني العام.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
