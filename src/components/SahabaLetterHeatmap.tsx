// src/components/SahabaLetterHeatmap.tsx
// خريطة حرارية تفاعلية (Interactive Heatmap) باستخدام Recharts
// توضح كثافة الكلمات وتوزيع الحروف في العناقيد السبعة بناءً على إحصاءات الحروف لتحزيب الصحابة

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
  ComposedChart,
  Line
} from 'recharts';
import { 
  Flame, 
  BarChart3, 
  Activity, 
  Grid,
  Info
} from 'lucide-react';
import { SurahData, LetterStatsData } from '../types';
import { SAHABA_CLUSTERS } from '../data/sahabaClusters';
import { ARABIC_LETTERS } from '../utils/arabic';
import { useTheme } from '../context/ThemeContext';

interface SahabaLetterHeatmapProps {
  surahs: SurahData[];
  letterStats: LetterStatsData;
  onSelectSurah?: (surah: SurahData) => void;
}

// 28 Arabic letters in standard Hijai order
const ALL_LETTERS = ARABIC_LETTERS;

// Predefined letter groups for targeted analysis
const HEATMAP_LETTER_GROUPS: { id: string; label: string; letters: string[] }[] = [
  { id: 'all28', label: 'جميع الحروف الـ 28 كاملة', letters: ALL_LETTERS },
  { id: 'top6', label: 'الستة الكبرى (ا، ل، ن، م، و، ي)', letters: ['ا', 'ل', 'ن', 'م', 'و', 'ي'] },
  { id: 'throat', label: 'حروف الحلق (ء، هـ، ع، ح، غ، خ)', letters: ['ء', 'ه', 'ع', 'ح', 'غ', 'خ'] },
  { id: 'lip', label: 'الحروف الشفوية (ب، م، و، ف)', letters: ['ب', 'م', 'و', 'ف'] },
  { id: 'qalqala', label: 'حروف القلقلة (ق، ط، ب، ج، د)', letters: ['ق', 'ط', 'ب', 'ج', 'د'] },
  { id: 'whispered', label: 'حروف الهمس (ف، ح، ث، هـ، ش، خ، ص، س، ك، ت)', letters: ['ف', 'ح', 'ث', 'ه', 'ش', 'خ', 'ص', 'س', 'ك', 'ت'] },
  { id: 'elevated', label: 'حروف الاستعلاء (خ، ص، ض، غ، ط، ق، ظ)', letters: ['خ', 'ص', 'ض', 'غ', 'ط', 'ق', 'ظ'] }
];

// Groups exclusively for BarChart (strictly subsets to avoid squished/unreadable 28 bars per cluster)
const BAR_CHART_LETTER_GROUPS = HEATMAP_LETTER_GROUPS.filter(g => g.id !== 'all28');

type AlphabetSortOrder = 'hijai' | 'abjadi' | 'frequency_desc' | 'frequency_asc' | 'phonetic';

export const SahabaLetterHeatmap: React.FC<SahabaLetterHeatmapProps> = ({
  surahs,
  letterStats,
  onSelectSurah
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // State
  const [selectedHeatmapGroup, setSelectedHeatmapGroup] = useState<string>('all28');
  const [selectedBarGroup, setSelectedBarGroup] = useState<string>('top6');
  const [alphabetSortOrder, setAlphabetSortOrder] = useState<AlphabetSortOrder>('hijai');
  const [activeLetter, setActiveLetter] = useState<string>('ق');
  const [metricMode, setMetricMode] = useState<'density' | 'percentage' | 'rawCount'>('density');
  const [viewType, setViewType] = useState<'grid-heatmap' | 'cluster-bars' | 'letter-profile'>('grid-heatmap');
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [sortLetter, setSortLetter] = useState<string | null>(null);

  // Compute sorted 28 letters according to user-selected alphabet order
  const orderedAllLetters = useMemo(() => {
    const base = [...ALL_LETTERS];
    if (alphabetSortOrder === 'hijai') return base;
    if (alphabetSortOrder === 'abjadi') {
      const abjadiOrder = ['ا', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص', 'ق', 'ر', 'ش', 'ت', 'ث', 'خ', 'ذ', 'ض', 'ظ', 'غ'];
      return [...base].sort((a, b) => {
        const iA = abjadiOrder.indexOf(a);
        const iB = abjadiOrder.indexOf(b);
        return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB);
      });
    }
    if (alphabetSortOrder === 'phonetic') {
      const phoneticOrder = ['ع', 'ح', 'ه', 'خ', 'غ', 'ق', 'ك', 'ج', 'ش', 'ي', 'ض', 'ص', 'س', 'ز', 'ط', 'د', 'ت', 'ظ', 'ذ', 'ث', 'ر', 'ل', 'ن', 'ف', 'ب', 'م', 'و', 'ا'];
      return [...base].sort((a, b) => {
        const iA = phoneticOrder.indexOf(a);
        const iB = phoneticOrder.indexOf(b);
        return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB);
      });
    }
    if (alphabetSortOrder === 'frequency_desc') {
      return [...base].sort((a, b) => {
        const cA = letterStats.globalStats?.[a]?.totalOccurrences || 0;
        const cB = letterStats.globalStats?.[b]?.totalOccurrences || 0;
        return cB - cA;
      });
    }
    if (alphabetSortOrder === 'frequency_asc') {
      return [...base].sort((a, b) => {
        const cA = letterStats.globalStats?.[a]?.totalOccurrences || 0;
        const cB = letterStats.globalStats?.[b]?.totalOccurrences || 0;
        return cA - cB;
      });
    }
    return base;
  }, [letterStats.globalStats, alphabetSortOrder]);

  // Active letter set for Heatmap
  const activeHeatmapLetters = useMemo(() => {
    if (selectedHeatmapGroup === 'all28') {
      return orderedAllLetters;
    }
    const group = HEATMAP_LETTER_GROUPS.find(g => g.id === selectedHeatmapGroup);
    if (!group) return orderedAllLetters;
    return orderedAllLetters.filter(l => group.letters.includes(l));
  }, [selectedHeatmapGroup, orderedAllLetters]);

  // Active letter set for Bar Chart (strictly subsets)
  const activeBarLetters = useMemo(() => {
    const group = BAR_CHART_LETTER_GROUPS.find(g => g.id === selectedBarGroup);
    return group ? group.letters : BAR_CHART_LETTER_GROUPS[0].letters;
  }, [selectedBarGroup]);

  // Precompute comprehensive cluster data
  const clustersData = useMemo(() => {
    return SAHABA_CLUSTERS.map(cluster => {
      const clusterSurahs = surahs.filter(s => cluster.surahNumbers.includes(s.number));
      const totalWords = clusterSurahs.reduce((acc, s) => acc + (s.totalWords || 0), 0);
      const totalAyahs = clusterSurahs.reduce((acc, s) => acc + (s.totalAyahs || 0), 0);
      const totalChars = clusterSurahs.reduce((acc, s) => acc + (s.totalChars || 0), 0);

      // Letter sums for cluster
      const letterCounts: Record<string, number> = {};
      ALL_LETTERS.forEach(l => {
        letterCounts[l] = clusterSurahs.reduce((acc, s) => acc + (s.letters?.plainCounts?.[l] || 0), 0);
      });

      // Letter densities per 100 words (words-normalized density)
      const letterDensities: Record<string, number> = {};
      const letterPercentages: Record<string, number> = {};

      ALL_LETTERS.forEach(l => {
        const count = letterCounts[l] || 0;
        letterDensities[l] = totalWords > 0 ? Number(((count / totalWords) * 100).toFixed(1)) : 0;
        letterPercentages[l] = totalChars > 0 ? Number(((count / totalChars) * 100).toFixed(2)) : 0;
      });

      return {
        ...cluster,
        clusterSurahs,
        totalWords,
        totalAyahs,
        totalChars,
        letterCounts,
        letterDensities,
        letterPercentages,
        wordsPerAyah: totalAyahs > 0 ? Number((totalWords / totalAyahs).toFixed(2)) : 0
      };
    });
  }, [surahs]);

  // Sorted clusters list (if user clicks on a letter header to sort clusters by that letter)
  const sortedClustersData = useMemo(() => {
    if (!sortLetter) return clustersData;
    return [...clustersData].sort((a, b) => {
      const valA = metricMode === 'density' 
        ? a.letterDensities[sortLetter] || 0 
        : metricMode === 'percentage' 
        ? a.letterPercentages[sortLetter] || 0 
        : a.letterCounts[sortLetter] || 0;
      const valB = metricMode === 'density' 
        ? b.letterDensities[sortLetter] || 0 
        : metricMode === 'percentage' 
        ? b.letterPercentages[sortLetter] || 0 
        : b.letterCounts[sortLetter] || 0;
      return valB - valA;
    });
  }, [clustersData, sortLetter, metricMode]);

  // Overall min and max across all clusters and letters for color scaling
  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    clustersData.forEach(c => {
      activeHeatmapLetters.forEach(l => {
        const val = metricMode === 'density' 
          ? c.letterDensities[l] 
          : metricMode === 'percentage' 
          ? c.letterPercentages[l] 
          : c.letterCounts[l];

        if (val < min) min = val;
        if (val > max) max = val;
      });
    });

    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 1;
    return { minVal: min, maxVal: max };
  }, [clustersData, activeHeatmapLetters, metricMode]);

  // Heatmap color interpolation function based on value (similar to LettersLab palette)
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

  // Recharts Bar chart data for cluster comparisons (using activeBarLetters)
  const clusterBarChartData = useMemo(() => {
    return clustersData.map(c => {
      const entry: Record<string, any> = {
        name: c.name,
        traditional: c.traditionalLabel,
        totalWords: c.totalWords,
        clusterId: c.id
      };
      activeBarLetters.forEach(l => {
        entry[`letter_${l}`] = metricMode === 'density' 
          ? c.letterDensities[l] 
          : metricMode === 'percentage' 
          ? c.letterPercentages[l] 
          : c.letterCounts[l];
      });
      return entry;
    });
  }, [clustersData, activeBarLetters, metricMode]);

  // Single letter trend data across all 7 clusters
  const singleLetterChartData = useMemo(() => {
    return clustersData.map(c => ({
      name: c.name,
      traditional: c.traditionalLabel,
      color: c.color,
      value: metricMode === 'density'
        ? c.letterDensities[activeLetter] || 0
        : metricMode === 'percentage'
        ? c.letterPercentages[activeLetter] || 0
        : c.letterCounts[activeLetter] || 0,
      totalWords: c.totalWords,
      wordsPerAyah: c.wordsPerAyah,
      isQafCluster: c.id === 6
    }));
  }, [clustersData, activeLetter, metricMode]);

  // Distinct colors for active letters when shown in BarChart
  const LETTER_PALETTE = [
    '#38bdf8', '#34d399', '#f59e0b', '#ec4899', '#a855f7', '#06b6d4',
    '#f97316', '#e879f9', '#4ade80', '#60a5fa', '#fbbf24', '#f43f5e'
  ];

  return (
    <div className="space-y-3.5">
      {/* Top Header Card */}
      <div className={`p-3 sm:p-4 rounded-xl border transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'sci-bg sci-border'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              isLight ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-sky-950/40 border-sky-500/40 text-sky-400'
            }`}>
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-sm sm:text-base font-bold font-quran ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  خريطة كثافة الحروف في عناقيد الصحابة السبعة
                </h3>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  isLight ? 'bg-sky-100 text-sky-800' : 'bg-sky-950/60 text-sky-300 border border-sky-800/50'
                }`}>
                  مُعايرة إحصائياً للكلمات
                </span>
              </div>
              <p className={`text-[11px] sm:text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                توزيع وترددات الحروف عبر تحزيب الصحابة (3، 5، 7، 9، 11، 14 مع ق، والمفصل 64)
              </p>
            </div>
          </div>

          {/* Visualization Mode Selector */}
          <div className={`flex items-center gap-1 p-1 rounded-lg border font-mono text-xs w-full sm:w-auto overflow-x-auto ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <button
              onClick={() => setViewType('grid-heatmap')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                viewType === 'grid-heatmap'
                  ? 'bg-sky-500 text-white font-bold shadow-xs'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>مصفوفة الخريطة الحرارية</span>
            </button>
            <button
              onClick={() => setViewType('cluster-bars')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                viewType === 'cluster-bars'
                  ? 'bg-sky-500 text-white font-bold shadow-xs'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>أعمدة الكثافة المقارنة</span>
            </button>
            <button
              onClick={() => setViewType('letter-profile')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                viewType === 'letter-profile'
                  ? 'bg-sky-500 text-white font-bold shadow-xs'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>منحنى الحرف الفردي</span>
            </button>
          </div>
        </div>

        {/* Global Controls Filter Bar */}
        <div className="mt-3 pt-3 border-t border-slate-700/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs font-mono">
          
          {/* Group / Letter selector dependent on active ViewType */}
          {viewType === 'grid-heatmap' && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Heatmap Groups Filter */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className={`text-[10px] font-bold ${isLight ? 'text-slate-700' : 'text-sky-400'}`}>
                  المجموعة:
                </span>
                {HEATMAP_LETTER_GROUPS.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedHeatmapGroup(g.id)}
                    className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                      selectedHeatmapGroup === g.id
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 font-bold'
                        : isLight 
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' 
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Order selector for heatmap */}
              <div className={`flex items-center gap-1 border-r pr-2 ${isLight ? 'border-slate-300' : 'border-slate-800'}`}>
                <span className={`text-[10px] font-bold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>الترتيب:</span>
                <select
                  value={alphabetSortOrder}
                  onChange={(e) => setAlphabetSortOrder(e.target.value as AlphabetSortOrder)}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-mono border transition-colors cursor-pointer ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
                  <option value="hijai">الهجائي (أ، ب، ت...)</option>
                  <option value="abjadi">الأبجدي (أبجد هوز...)</option>
                  <option value="frequency_desc">الأكثر تكراراً</option>
                  <option value="frequency_asc">الأقل تكراراً</option>
                  <option value="phonetic">الصوتي (المخارج)</option>
                </select>
              </div>
            </div>
          )}

          {viewType === 'cluster-bars' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] font-bold ${isLight ? 'text-slate-700' : 'text-sky-400'}`}>
                مجموعة المقارنة:
              </span>
              {/* Strictly limited to subsets (NO ALL 28 LETTERS to prevent illegible clutter) */}
              {BAR_CHART_LETTER_GROUPS.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedBarGroup(g.id)}
                  className={`px-2.5 py-1 rounded text-[11px] transition-all cursor-pointer ${
                    selectedBarGroup === g.id
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 font-bold'
                      : isLight 
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' 
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
              <span className={`text-[10px] font-bold ${isLight ? 'text-slate-700' : 'text-emerald-400'}`}>
                الحرف المُحلل:
              </span>
              <span className="font-quran font-bold text-sm text-sky-400">
                حرف «{activeLetter}» ({letterStats.letterNames[activeLetter]})
              </span>
            </div>
          )}

          {/* Metric Mode Toggle */}
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            <span className={`text-[10px] font-bold ${isLight ? 'text-slate-700' : 'text-amber-400'}`}>
              المقياس:
            </span>
            <div className={`flex items-center p-0.5 rounded-lg border ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <button
                onClick={() => setMetricMode('density')}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                  metricMode === 'density'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : isLight ? 'text-slate-600' : 'text-slate-400'
                }`}
                title="كثافة ظهور الحرف لكل 100 كلمة في العنقود (مُعايرة للكتلة النصية)"
              >
                كثافة (لكل 100 كلمة)
              </button>
              <button
                onClick={() => setMetricMode('percentage')}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                  metricMode === 'percentage'
                    ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                    : isLight ? 'text-slate-600' : 'text-slate-400'
                }`}
                title="النسبة المئوية (%) من إجمالي حروف العنقود"
              >
                نسبة مئوية %
              </button>
              <button
                onClick={() => setMetricMode('rawCount')}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                  metricMode === 'rawCount'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                    : isLight ? 'text-slate-600' : 'text-slate-400'
                }`}
                title="العدد الإجمالي الخام للحرف في العنقود"
              >
                التعداد الخام
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: COMPACT HIGH-DENSITY INTERACTIVE HEATMAP MATRIX (LettersLab style) */}
      {viewType === 'grid-heatmap' && (
        <div className={`rounded-xl p-3 sm:p-4 border transition-colors space-y-2.5 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'sci-bg sci-border'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h4 className={`text-xs sm:text-sm font-bold font-quran ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}>
                مصفوفة الكثافة الحرارية ({activeHeatmapLetters.length} حرفاً × 7 عناقيد)
              </h4>
              {sortLetter && (
                <div className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  <span>مرتب بحرف: <strong>{sortLetter}</strong></span>
                  <button 
                    onClick={() => setSortLetter(null)}
                    className="cursor-pointer font-bold hover:text-white"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-2 text-[10px] font-mono self-start sm:self-auto">
              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>أدنى كثافة</span>
              <div className="flex items-center h-2.5 rounded overflow-hidden border border-slate-700/50">
                <div className="w-4 sm:w-5 h-full" style={{ backgroundColor: getCellColor(minVal) }} />
                <div className="w-4 sm:w-5 h-full" style={{ backgroundColor: getCellColor(minVal + (maxVal - minVal) * 0.35) }} />
                <div className="w-4 sm:w-5 h-full" style={{ backgroundColor: getCellColor(minVal + (maxVal - minVal) * 0.7) }} />
                <div className="w-4 sm:w-5 h-full" style={{ backgroundColor: getCellColor(maxVal) }} />
              </div>
              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>أعلى كثافة</span>
            </div>
          </div>

          {/* Compact Heatmap Table Grid with Dynamic Flex-grow and Auto Overflow */}
          <div className="w-full flex-1 flex flex-col overflow-hidden rounded-lg border border-slate-800/80 shadow-inner">
            <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-sky-700/50">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className={isLight ? 'bg-slate-100 text-slate-800' : 'bg-[#0A0D12] text-sky-400'}>
                    {/* Sticky Cluster Column */}
                    <th className={`p-2 text-right sticky right-0 z-20 min-w-[110px] sm:min-w-[135px] text-[11px] sm:text-xs font-mono border-l border-b border-slate-700/40 shadow-xs ${
                      isLight ? 'bg-slate-100' : 'bg-[#0A0D12]'
                    }`}>
                      العنقود
                    </th>
                    {/* Words Column */}
                    <th className="p-1.5 sm:p-2 text-[10px] sm:text-[11px] font-mono border-l border-b border-slate-700/40 min-w-[65px] sm:min-w-[80px]">
                      الكلمات
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
                            ? (isLight ? 'bg-sky-200 text-sky-900 border-b-2 border-sky-600' : 'bg-sky-500/30 text-sky-200 border-b-2 border-sky-400')
                            : isLight ? 'text-slate-700 hover:bg-slate-200' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                        title={`انقر لترتيب العناقيد بحرف «${letter}» (${letterStats.letterNames[letter]})`}
                      >
                        <div className="leading-tight">{letter}</div>
                        <div className={`text-[8.5px] font-mono font-normal leading-none mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {letterStats.letterNames[letter]?.slice(0, 3)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y text-xs font-mono ${isLight ? 'divide-slate-200 bg-white' : 'divide-slate-800/80 bg-[#0c121e]'}`}>
                  {sortedClustersData.map(cluster => (
                    <tr 
                      key={cluster.id}
                      className={`transition-colors ${
                        selectedClusterId === cluster.id 
                          ? (isLight ? 'bg-sky-50' : 'bg-sky-950/40') 
                          : (isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30')
                      }`}
                    >
                      {/* Sticky Cluster Meta */}
                      <td 
                        onClick={() => setSelectedClusterId(selectedClusterId === cluster.id ? null : cluster.id)}
                        className={`p-2 text-right sticky right-0 z-10 border-l border-slate-700/40 cursor-pointer ${
                          isLight ? 'bg-white shadow-xs' : 'bg-[#0e1726]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0" 
                              style={{ backgroundColor: cluster.color }} 
                            />
                            <span className={`text-[11px] sm:text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                              {cluster.name}
                            </span>
                          </div>
                          <span className={`text-[9.5px] px-1 py-0.2 rounded font-mono shrink-0 ${
                            cluster.id === 6 
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' 
                              : 'opacity-70'
                          }`}>
                            {cluster.traditionalLabel}
                          </span>
                        </div>
                      </td>

                      {/* Total Words in Cluster (Full number formatted with thousands separators) */}
                      <td className="p-1.5 sm:p-2 border-l border-slate-700/40 text-[10px] sm:text-[11px] font-mono text-slate-300 text-center font-semibold">
                        {cluster.totalWords.toLocaleString('en-US')}
                      </td>

                      {/* Letter Cells (Full numbers without abbreviation) */}
                      {activeHeatmapLetters.map(letter => {
                        const val = metricMode === 'density'
                          ? cluster.letterDensities[letter]
                          : metricMode === 'percentage'
                          ? cluster.letterPercentages[letter]
                          : cluster.letterCounts[letter];

                        const bgColor = getCellColor(val);
                        const isHighHeat = (val - minVal) / (maxVal - minVal || 1) > 0.65;

                        return (
                          <td
                            key={letter}
                            className="p-1 sm:p-1.5 min-w-[34px] sm:min-w-[42px] border-l border-slate-700/30 transition-all cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: bgColor }}
                            onClick={() => setActiveLetter(letter)}
                            title={`${cluster.name} (${cluster.traditionalLabel})\nحرف: ${letter} (${letterStats.letterNames[letter]})\nالعدد الكامل: ${cluster.letterCounts[letter]?.toLocaleString('en-US')} مرة\nالنسبة: ${cluster.letterPercentages[letter]}%\nالكثافة: ${cluster.letterDensities[letter]} لكل 100 كلمة`}
                          >
                            <div className={`font-mono text-[9.5px] sm:text-[10.5px] font-bold leading-none ${
                              isLight
                                ? (isHighHeat ? 'text-white' : 'text-slate-900')
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Explanatory note */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-sky-950/20 border border-sky-800/40 text-[11px] font-mono text-sky-300">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>
              <strong>توجيه تصفح:</strong> يمكنك التمرير أفقياً لرؤية جميع الحروف الـ 28. انقر فوق أي حرف في رأس الجدول لترتيب العناقيد حسب كثافته.
            </span>
          </div>
        </div>
      )}

      {/* VIEW 2: RECHARTS BAR CHART (CLUSTER COMPARISON - LIMITED TO READABLE SUBSETS) */}
      {viewType === 'cluster-bars' && (
        <div className={`rounded-xl p-3 sm:p-4 border transition-colors space-y-3 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'sci-bg sci-border'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className={`text-sm font-bold font-quran flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}>
                <BarChart3 className="w-4 h-4 text-sky-400" />
                <span>رسم بياني مقارن لكثافة الحروف عبر العناقيد السبعة (Bar Chart)</span>
              </h4>
              <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                مقارنة مستويات الحضور للحروف في كل عنقود من عناقيد الصحابة (محددة بمجموعات فرعية لضمان وضوح الرسم)
              </p>
            </div>
          </div>

          <div className="h-[360px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={clusterBarChartData}
                margin={{ top: 20, right: 10, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} />
                <XAxis 
                  dataKey="name" 
                  stroke={isLight ? '#64748b' : '#94a3b8'} 
                  fontSize={10}
                  fontFamily="sans-serif"
                  tick={({ x, y, payload }) => (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={0} dy={16} textAnchor="middle" fill={isLight ? '#334155' : '#cbd5e1'} fontSize={10} fontWeight={600}>
                        {payload.value}
                      </text>
                    </g>
                  )}
                />
                <YAxis 
                  stroke={isLight ? '#64748b' : '#94a3b8'} 
                  fontSize={10}
                  label={{ 
                    value: metricMode === 'density' ? 'كثافة (لكل 100 كلمة)' : metricMode === 'percentage' ? 'النسبة %' : 'التعداد', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: isLight ? '#64748b' : '#94a3b8',
                    fontSize: 9
                  }} 
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const cData = payload[0]?.payload;
                    return (
                      <div className={`p-2.5 rounded-xl border shadow-xl text-xs font-mono ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
                      }`}>
                        <div className="font-bold border-b pb-1 mb-1 flex items-center justify-between gap-3">
                          <span className="text-sky-400">{label} ({cData.traditional})</span>
                          <span className="text-slate-400 font-normal">{cData.totalWords?.toLocaleString()} كلمة</span>
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

      {/* VIEW 3: SINGLE LETTER PROFILE ACROSS ALL 7 CLUSTERS */}
      {viewType === 'letter-profile' && (
        <div className={`rounded-xl p-3 sm:p-4 border transition-colors space-y-3 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'sci-bg sci-border'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h4 className={`text-sm font-bold font-quran flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}>
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>تدرج كثافة حرف «{activeLetter}» ({letterStats.letterNames[activeLetter]}) عبر العناقيد السبعة</span>
              </h4>
              <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                تتبع مسار الحرف في خط المصحف وتغير كثافته من الطوال إلى المفصل
              </p>
            </div>

            {/* Letter selector chips */}
            <div className="flex flex-wrap items-center gap-1 max-w-full sm:max-w-md self-start sm:self-auto overflow-x-auto p-0.5">
              {ALL_LETTERS.map(l => (
                <button
                  key={l}
                  onClick={() => setActiveLetter(l)}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded font-quran text-xs font-bold transition-all cursor-pointer ${
                    activeLetter === l
                      ? 'bg-sky-500 text-white shadow-xs scale-110'
                      : isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[320px] sm:h-[340px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={singleLetterChartData}
                margin={{ top: 20, right: 10, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} />
                <XAxis 
                  dataKey="name" 
                  stroke={isLight ? '#64748b' : '#94a3b8'} 
                  fontSize={10}
                  tick={({ x, y, payload }) => (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={0} dy={16} textAnchor="middle" fill={isLight ? '#334155' : '#cbd5e1'} fontSize={10} fontWeight={600}>
                        {payload.value}
                      </text>
                    </g>
                  )}
                />
                <YAxis 
                  stroke={isLight ? '#64748b' : '#94a3b8'} 
                  fontSize={10}
                  label={{ 
                    value: metricMode === 'density' ? 'كثافة (لكل 100 كلمة)' : metricMode === 'percentage' ? 'النسبة %' : 'التعداد', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: isLight ? '#64748b' : '#94a3b8',
                    fontSize: 9
                  }} 
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const cData = payload[0]?.payload;
                    return (
                      <div className={`p-2.5 rounded-xl border shadow-xl text-xs font-mono ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
                      }`}>
                        <div className="font-bold border-b pb-1 mb-1 flex items-center justify-between gap-3">
                          <span className="text-sky-400">{label} ({cData.traditional})</span>
                          {cData.isQafCluster && (
                            <span className="text-cyan-400 text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                              يشمل سورة ق
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4">
                            <span>قيمة حرف «{activeLetter}»:</span>
                            <span className="font-bold text-sky-400">{cData.value}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-400">
                            <span>إجمالي كلمات العنقود:</span>
                            <span>{cData.totalWords?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-400">
                            <span>معدل الكلمات للآية:</span>
                            <span>{cData.wordsPerAyah} كلمة/آية</span>
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
                      stroke={entry.isQafCluster ? '#06b6d4' : undefined}
                      strokeWidth={entry.isQafCluster ? 2 : 0}
                    />
                  ))}
                </Bar>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#38bdf8" 
                  strokeWidth={2} 
                  dot={{ r: 3.5, fill: '#38bdf8', strokeWidth: 1.5, stroke: '#0f172a' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cluster Details Cards Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2">
        {clustersData.map(c => (
          <div
            key={c.id}
            onClick={() => setSelectedClusterId(selectedClusterId === c.id ? null : c.id)}
            className={`p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
              selectedClusterId === c.id
                ? 'bg-sky-500/10 border-sky-500 shadow-xs'
                : isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              <span className="font-bold truncate text-[11px]">{c.name}</span>
            </div>
            <div className="text-[10px] text-slate-400">{c.traditionalLabel}</div>
            <div className="text-[9px] text-slate-500 mt-0.5">{c.totalWords.toLocaleString()} كلمة</div>
          </div>
        ))}
      </div>
    </div>
  );
};
