import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { SurahData, QuranAyah, LetterStatsData } from '../types';
import { MuqattaatSurahMeta } from '../utils/surahFamilies';
import { ARABIC_LETTERS, ARABIC_LETTER_NAMES, formatSurahName } from '../utils/arabic';
import { 
  Sparkles, 
  Layers, 
  Grid, 
  BarChart3, 
  TrendingUp, 
  BookOpen, 
  Search, 
  Sliders, 
  Award, 
  CheckCircle2, 
  Info,
  Maximize2,
  Filter,
  ArrowUpDown
} from 'lucide-react';

interface MuqattaatVerseHeatmapProps {
  surahData: SurahData;
  muqattaatMeta: MuqattaatSurahMeta;
  ayahs: QuranAyah[];
  letterStats?: LetterStatsData;
  onOpenInReader?: (surahNumber: number, ayahNumber?: number) => void;
}

export interface AyahLetterDistribution {
  ayahNumber: number;
  textUthmani: string;
  textSimple: string;
  totalLetters: number;
  openingLetterCounts: Record<string, number>;
  totalOpeningCount: number;
  densityPct: number;
  hasAllLetters: boolean;
  page?: number;
  juz?: number;
}

/**
 * Counts the 28 standard Arabic letters in an Ayah text
 */
function countAyahLetters(text: string): { counts: Record<string, number>; total: number } {
  const counts: Record<string, number> = {};
  let total = 0;
  if (!text) return { counts, total: 0 };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    let letter: string | null = null;

    if (ch === 'ا' || ch === 'أ' || ch === 'إ' || ch === 'آ' || ch === 'ٱ' || ch === '\u0670' || ch === 'ء') {
      letter = 'ا';
    } else if (ch === 'ة' || ch === 'ه') {
      letter = 'ه';
    } else if (ch === 'ى' || ch === 'ي' || ch === 'ئ') {
      letter = 'ي';
    } else if (ch === 'ؤ' || ch === 'و') {
      letter = 'و';
    } else if (ARABIC_LETTERS.includes(ch)) {
      letter = ch;
    }

    if (letter) {
      counts[letter] = (counts[letter] || 0) + 1;
      total++;
    }
  }

  return { counts, total };
}

export const MuqattaatVerseHeatmap: React.FC<MuqattaatVerseHeatmapProps> = ({
  surahData,
  muqattaatMeta,
  ayahs,
  letterStats,
  onOpenInReader
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Selected letter filter: 'all' or one specific letter (e.g. 'ا', 'ل', 'م')
  const [selectedLetter, setSelectedLetter] = useState<string>('all');
  // Metric display: 'density' (%) or 'count' (raw occurrences)
  const [metricMode, setMetricMode] = useState<'density' | 'count'>('density');
  // Visual presentation tab: 'grid' | 'quarters' | 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'quarters' | 'list'>('grid');
  // Active hovered/clicked verse for the inspector drawer
  const [activeAyahNumber, setActiveAyahNumber] = useState<number | null>(null);
  // Search filter for verse list
  const [listSearch, setListSearch] = useState<string>('');
  // Sort order for verse list
  const [listSort, setListSort] = useState<'number' | 'density-desc' | 'density-asc' | 'count-desc'>('number');

  // 1. Overall Surah Letter Rankings for the 28 Arabic letters
  const surahLetterRankings = useMemo(() => {
    const plainCounts = surahData.letters?.plainCounts || {};
    const totalChars = surahData.totalChars || surahData.letters?.totalLettersPlain || 1;

    const allSorted = Object.entries(plainCounts)
      .map(([letter, count]) => ({
        letter,
        name: ARABIC_LETTER_NAMES[letter] || letter,
        count: count as number,
        percentage: Number((((count as number) / totalChars) * 100).toFixed(2))
      }))
      .sort((a, b) => b.count - a.count);

    return allSorted.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  }, [surahData]);

  // Combined stats for the opening letters in the entire surah
  const openingLettersOverview = useMemo(() => {
    const totalChars = surahData.totalChars || surahData.letters?.totalLettersPlain || 1;
    let totalOpeningLettersCount = 0;

    const openingDetails = muqattaatMeta.letters.map(letter => {
      const rankInfo = surahLetterRankings.find(r => r.letter === letter);
      const count = rankInfo ? rankInfo.count : 0;
      const rank = rankInfo ? rankInfo.rank : 28;
      const percentage = Number(((count / totalChars) * 100).toFixed(2));
      totalOpeningLettersCount += count;

      return {
        letter,
        name: ARABIC_LETTER_NAMES[letter] || letter,
        count,
        rank,
        percentage,
        isTop3: rank <= 3,
        isTop5: rank <= 5
      };
    });

    const combinedPercentage = Number(((totalOpeningLettersCount / totalChars) * 100).toFixed(2));
    const allInTop5 = openingDetails.every(d => d.isTop5);

    return {
      totalOpeningLettersCount,
      combinedPercentage,
      openingDetails,
      allInTop5,
      surahTotalChars: totalChars
    };
  }, [surahData, muqattaatMeta, surahLetterRankings]);

  // 2. Verse-by-verse calculations
  const versesData: AyahLetterDistribution[] = useMemo(() => {
    if (!ayahs || ayahs.length === 0) return [];

    return ayahs.map(ayah => {
      const { counts, total } = countAyahLetters(ayah.textUthmani || ayah.textSimple || '');
      const openingCounts: Record<string, number> = {};
      let totalOpening = 0;
      let presentCount = 0;

      muqattaatMeta.letters.forEach(letter => {
        const c = counts[letter] || 0;
        openingCounts[letter] = c;
        totalOpening += c;
        if (c > 0) presentCount++;
      });

      const density = total > 0 ? Number(((totalOpening / total) * 100).toFixed(1)) : 0;
      const hasAll = presentCount === muqattaatMeta.letters.length;

      return {
        ayahNumber: ayah.numberInSurah,
        textUthmani: ayah.textUthmani,
        textSimple: ayah.textSimple,
        totalLetters: total,
        openingLetterCounts: openingCounts,
        totalOpeningCount: totalOpening,
        densityPct: density,
        hasAllLetters: hasAll,
        page: ayah.page,
        juz: ayah.juz
      };
    });
  }, [ayahs, muqattaatMeta]);

  // Active value extractor based on selected letter & metric
  const getValueForAyah = (item: AyahLetterDistribution): number => {
    if (selectedLetter === 'all') {
      return metricMode === 'density' ? item.densityPct : item.totalOpeningCount;
    }
    const count = item.openingLetterCounts[selectedLetter] || 0;
    if (metricMode === 'density') {
      return item.totalLetters > 0 ? Number(((count / item.totalLetters) * 100).toFixed(1)) : 0;
    }
    return count;
  };

  // 3. Peak and summary statistics across verses
  const verseMetricsSummary = useMemo(() => {
    if (versesData.length === 0) {
      return {
        peakAyah: null,
        minAyah: null,
        avgDensity: 0,
        avgCount: 0,
        versesWithAllLetters: 0,
        versesWithAllLettersPct: 0,
        versesWithAnyLetters: 0,
        maxCalculatedValue: 1
      };
    }

    let peakAyah = versesData[0];
    let minAyah = versesData[0];
    let maxVal = -1;
    let minVal = Infinity;
    let sumDensity = 0;
    let sumCount = 0;
    let withAll = 0;
    let withAny = 0;

    versesData.forEach(v => {
      const val = getValueForAyah(v);
      if (val > maxVal) {
        maxVal = val;
        peakAyah = v;
      }
      if (val < minVal) {
        minVal = val;
        minAyah = v;
      }
      sumDensity += v.densityPct;
      sumCount += v.totalOpeningCount;
      if (v.hasAllLetters) withAll++;
      if (v.totalOpeningCount > 0) withAny++;
    });

    const avgDensity = Number((sumDensity / versesData.length).toFixed(1));
    const avgCount = Number((sumCount / versesData.length).toFixed(1));
    const withAllPct = Number(((withAll / versesData.length) * 100).toFixed(1));

    return {
      peakAyah,
      minAyah,
      avgDensity,
      avgCount,
      versesWithAllLetters: withAll,
      versesWithAllLettersPct: withAllPct,
      versesWithAnyLetters: withAny,
      maxCalculatedValue: maxVal > 0 ? maxVal : 1
    };
  }, [versesData, selectedLetter, metricMode]);

  // 4. Surah Quarters breakdown (أرباع السورة الأربعة لبيان التوزيع الهيكلي)
  const quartersDistribution = useMemo(() => {
    if (versesData.length === 0) return [];
    const n = versesData.length;
    const quarterSize = Math.ceil(n / 4);

    const quarters = [
      { id: 1, name: 'الربع الأول (البداية والمطلع)', from: 1, to: Math.min(quarterSize, n) },
      { id: 2, name: 'الربع الثاني (تنامي السياق)', from: quarterSize + 1, to: Math.min(quarterSize * 2, n) },
      { id: 3, name: 'الربع الثالث (عمق السورة)', from: quarterSize * 2 + 1, to: Math.min(quarterSize * 3, n) },
      { id: 4, name: 'الربع الرابع (الخاتمة والفواصل)', from: quarterSize * 3 + 1, to: n }
    ];

    return quarters.map(q => {
      const slice = versesData.slice(q.from - 1, q.to);
      const totalCharsInQ = slice.reduce((acc, v) => acc + v.totalLetters, 0);
      const totalOpeningInQ = slice.reduce((acc, v) => {
        if (selectedLetter === 'all') return acc + v.totalOpeningCount;
        return acc + (v.openingLetterCounts[selectedLetter] || 0);
      }, 0);

      const density = totalCharsInQ > 0 ? Number(((totalOpeningInQ / totalCharsInQ) * 100).toFixed(2)) : 0;
      const avgPerVerse = slice.length > 0 ? Number((totalOpeningInQ / slice.length).toFixed(1)) : 0;

      return {
        ...q,
        verseCount: slice.length,
        totalCharsInQ,
        totalOpeningInQ,
        density,
        avgPerVerse
      };
    });
  }, [versesData, selectedLetter]);

  // Selected ayah for inspector (defaults to peak ayah if none explicitly clicked)
  const inspectedAyah = useMemo(() => {
    if (activeAyahNumber !== null) {
      return versesData.find(v => v.ayahNumber === activeAyahNumber) || versesData[0];
    }
    return verseMetricsSummary.peakAyah || versesData[0];
  }, [versesData, activeAyahNumber, verseMetricsSummary]);

  // Filtered & sorted verse list
  const filteredVerseList = useMemo(() => {
    let list = [...versesData];
    const q = listSearch.trim();
    if (q) {
      list = list.filter(v => 
        v.ayahNumber.toString() === q || 
        (v.textUthmani && v.textUthmani.includes(q)) ||
        (v.textSimple && v.textSimple.includes(q))
      );
    }

    if (listSort === 'number') {
      list.sort((a, b) => a.ayahNumber - b.ayahNumber);
    } else if (listSort === 'density-desc') {
      list.sort((a, b) => getValueForAyah(b) - getValueForAyah(a));
    } else if (listSort === 'density-asc') {
      list.sort((a, b) => getValueForAyah(a) - getValueForAyah(b));
    } else if (listSort === 'count-desc') {
      list.sort((a, b) => b.totalOpeningCount - a.totalOpeningCount);
    }

    return list;
  }, [versesData, listSearch, listSort, selectedLetter, metricMode]);

  // Heatmap cell color generator
  const getCellBgClass = (val: number, maxVal: number) => {
    if (val === 0) {
      return isDark ? 'bg-slate-800/40 text-slate-500 border-slate-800' : 'bg-slate-100 text-slate-400 border-slate-200';
    }
    const ratio = Math.min(1, val / (maxVal || 1));

    if (ratio < 0.25) {
      return isDark 
        ? 'bg-amber-950/40 text-amber-300 border-amber-900/40' 
        : 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (ratio < 0.5) {
      return isDark 
        ? 'bg-amber-800/50 text-amber-200 border-amber-700/60' 
        : 'bg-amber-200 text-amber-900 border-amber-300';
    } else if (ratio < 0.75) {
      return isDark 
        ? 'bg-amber-600/70 text-white font-bold border-amber-500/80 shadow-xs' 
        : 'bg-amber-400 text-amber-950 font-bold border-amber-500 shadow-xs';
    } else {
      return isDark 
        ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white font-extrabold border-amber-300 shadow-sm shadow-amber-500/20 ring-1 ring-amber-400/40' 
        : 'bg-gradient-to-br from-amber-500 to-orange-500 text-white font-extrabold border-amber-400 shadow-sm shadow-amber-500/30';
    }
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isDark ? 'bg-slate-900/80 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold">
                إحصاءات وخريطة توزع حروف ({muqattaatMeta.openingText}) في آيات {formatSurahName(surahData.name)}
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-xs font-mono font-bold border border-amber-500/20">
                {surahData.totalAyahs} آية
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              تحليل توزيعي وكثافي دقيق لحروف الفاتحة المقطعة عبر سائر آيات السورة، لقياس مدى هيمنتها ومواقع قممها ونقاط تمركزها الصوتي واللفظي.
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'grid'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            خريطة الآيات
          </button>
          <button
            onClick={() => setViewMode('quarters')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'quarters'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            أرباع السورة
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'list'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            جدول الآيات
          </button>
        </div>
      </div>

      {/* 1. Macro KPIs Cards: Full Surah Opening Letter Statistics */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Opening Occurrences */}
        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>مجموع حروف الفاتحة:</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-amber-400">
              {openingLettersOverview.totalOpeningLettersCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400">حرفاً</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            من إجمالي {openingLettersOverview.surahTotalChars.toLocaleString()} حرف بالسورة
          </div>
        </div>

        {/* Combined Density % */}
        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>كثافة حروف الفاتحة بالسورة:</span>
            <Award className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-emerald-400">
              {openingLettersOverview.combinedPercentage}%
            </span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-500/90 font-medium truncate">
            {openingLettersOverview.combinedPercentage >= 35 ? 'كثافة مهيمنة جداً' : 'كثافة متوازنة'}
          </div>
        </div>

        {/* Verses with ALL Opening Letters */}
        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>الآيات الجامعة لكافة الحروف:</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-sky-400">
              {verseMetricsSummary.versesWithAllLetters}
            </span>
            <span className="text-[11px] text-slate-400">آية</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            تمثل {verseMetricsSummary.versesWithAllLettersPct}% من آيات السورة
          </div>
        </div>

        {/* Peak Density Verse */}
        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>ذروة الكثافة في آية:</span>
            <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-orange-400">
              {verseMetricsSummary.peakAyah ? `${verseMetricsSummary.peakAyah.densityPct}%` : '—'}
            </span>
            <span className="text-[11px] text-slate-400">
              (آية {verseMetricsSummary.peakAyah?.ayahNumber})
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 truncate">
            متوسط الكثافة: {verseMetricsSummary.avgDensity}% / آية
          </div>
        </div>
      </div>

      {/* 2. Opening Letters Ranking Badges */}
      <div className="mt-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">ترتيب حروف الفاتحة بين حروف المعجم الـ 28 في السورة:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {openingLettersOverview.openingDetails.map(d => (
            <div 
              key={d.letter}
              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 ${
                d.isTop3 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold' 
                  : d.isTop5 
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <span className="w-5 h-5 rounded-md bg-slate-800 text-center font-mono font-bold leading-5">
                {d.letter}
              </span>
              <span>{d.name}</span>
              <span className="text-[10px] font-mono px-1 rounded bg-black/30">
                الرتبة #{d.rank}
              </span>
              <span className="text-[10px] text-slate-400">({d.count} مرة)</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Heatmap Controls Toolbar */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
        {/* Letter Selector Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 ml-1">تحديد الحرف:</span>
          <button
            onClick={() => setSelectedLetter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedLetter === 'all'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            كافة حروف الفاتحة ({muqattaatMeta.openingText})
          </button>
          {muqattaatMeta.letters.map(letter => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                selectedLetter === letter
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>حرف {letter}</span>
              <span className="text-[10px] opacity-75">({ARABIC_LETTER_NAMES[letter] || letter})</span>
            </button>
          ))}
        </div>

        {/* Metric Selector Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">المقياس:</span>
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setMetricMode('density')}
              className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all ${
                metricMode === 'density' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              نسبة الكثافة (%)
            </button>
            <button
              onClick={() => setMetricMode('count')}
              className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all ${
                metricMode === 'count' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              التكرار المطلق (عدد)
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA ACCORDING TO VIEW MODE */}

      {/* VIEW 1: VERSE HEATMAP GRID */}
      {viewMode === 'grid' && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div>
              <span>انقر أو مرر الفأرة فوق أي آية للاطلاع على إحصائياتها الدقيقة ونصها الشريف:</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span>تدرج الكثافة:</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 text-[10px]">صفر</span>
              <span className="w-3.5 h-3.5 rounded bg-amber-950 border border-amber-900"></span>
              <span className="w-3.5 h-3.5 rounded bg-amber-800 border border-amber-700"></span>
              <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-amber-400"></span>
              <span className="w-3.5 h-3.5 rounded bg-gradient-to-br from-amber-500 to-orange-500 border border-amber-300"></span>
              <span className="font-bold text-amber-400">الأعلى</span>
            </div>
          </div>

          {/* Heatmap Grid Matrix */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 max-h-[360px] overflow-y-auto">
            <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-18 gap-1.5">
              {versesData.map(v => {
                const val = getValueForAyah(v);
                const isInspected = inspectedAyah?.ayahNumber === v.ayahNumber;
                const cellBg = getCellBgClass(val, verseMetricsSummary.maxCalculatedValue);

                return (
                  <button
                    key={v.ayahNumber}
                    onClick={() => setActiveAyahNumber(v.ayahNumber)}
                    onMouseEnter={() => setActiveAyahNumber(v.ayahNumber)}
                    className={`h-9 rounded-lg border text-center font-mono text-[11px] transition-all flex flex-col items-center justify-center relative group ${cellBg} ${
                      isInspected ? 'ring-2 ring-sky-400 scale-105 z-10' : 'hover:scale-105'
                    }`}
                    title={`آية ${v.ayahNumber}: ${val}${metricMode === 'density' ? '%' : ''}`}
                  >
                    <span className="text-[10px] leading-none opacity-80">{v.ayahNumber}</span>
                    <span className="text-[9px] font-bold leading-none mt-0.5">
                      {metricMode === 'density' ? `${Math.round(val)}%` : val}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inspected Ayah Detailed Card */}
          {inspectedAyah && (
            <div className={`p-4 rounded-xl border transition-all ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-amber-50/70 border-amber-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/30">
                    {inspectedAyah.ayahNumber}
                  </span>
                  <span className="text-sm font-bold text-slate-200">
                    تفاصيل الآية {inspectedAyah.ayahNumber} من {formatSurahName(surahData.name)}
                  </span>
                  {inspectedAyah.page && (
                    <span className="text-xs text-slate-400">
                      (صفحة {inspectedAyah.page} - جزء {inspectedAyah.juz})
                    </span>
                  )}
                  {inspectedAyah.hasAllLetters && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      جامعة لكافة حروف الفاتحة
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300">
                    كثافة حروف الفاتحة:{' '}
                    <span className="font-bold text-amber-400 font-mono text-sm">
                      {inspectedAyah.densityPct}%
                    </span>
                  </span>
                  {onOpenInReader && (
                    <button
                      onClick={() => onOpenInReader(surahData.number, inspectedAyah.ayahNumber)}
                      className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      عرض في المصحف
                    </button>
                  )}
                </div>
              </div>

              {/* Ayah Text Display */}
              <div className="mt-3 py-2 px-3 rounded-lg bg-black/20 border border-slate-700/30 font-serif text-base sm:text-lg text-amber-200/90 leading-relaxed text-right">
                {inspectedAyah.textUthmani}
              </div>

              {/* Breakdown of letters in this ayah */}
              <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-400">تكرار حروف الفاتحة في الآية ({inspectedAyah.totalLetters} حرفاً إجمالياً):</span>
                {muqattaatMeta.letters.map(letter => {
                  const cnt = inspectedAyah.openingLetterCounts[letter] || 0;
                  return (
                    <span 
                      key={letter}
                      className={`px-2 py-0.5 rounded-md font-mono text-xs flex items-center gap-1 ${
                        cnt > 0 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold' 
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      <span>حرف {letter}:</span>
                      <span>{cnt}</span>
                    </span>
                  );
                })}
                <span className="mr-auto font-mono text-xs text-slate-300">
                  المجموع: <span className="text-amber-400 font-bold">{inspectedAyah.totalOpeningCount}</span> حرفاً
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: QUARTERS STRUCTURAL DISTRIBUTION */}
      {viewMode === 'quarters' && (
        <div className="mt-4 space-y-4">
          <div className="text-xs text-slate-400">
            توزيع حروف الفاتحة المقطعة على الأرباع الأربعة المتتالية للسورة (من المطلع وحتى الختام)، لرصد تطور الكثافة والنسيج الصوتي:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {quartersDistribution.map(q => (
              <div 
                key={q.id}
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-mono text-xs font-bold flex items-center justify-center">
                      Q{q.id}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{q.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    الآيات {q.from} - {q.to} ({q.verseCount} آية)
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-slate-400 text-[11px]">مجموع حروف الفاتحة:</div>
                    <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
                      {q.totalOpeningInQ.toLocaleString()} حرفاً
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">نسبة الكثافة:</div>
                    <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                      {q.density}%
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${Math.min(100, q.density * 2)}%` }}
                  ></div>
                </div>

                <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
                  <span>معدل الحروف لكل آية:</span>
                  <span className="font-mono font-bold text-slate-300">{q.avgPerVerse} حرف/آية</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: DETAILED VERSE TABLE */}
      {viewMode === 'list' && (
        <div className="mt-4 space-y-3">
          {/* List Search & Sorting Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="ابحث برقم الآية أو كلماتها..."
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className={`w-full px-3 py-1.5 pl-8 rounded-lg text-xs border outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                ترتيب حسب:
              </span>
              <select
                value={listSort}
                onChange={(e) => setListSort(e.target.value as any)}
                className={`px-2.5 py-1 rounded-lg text-xs border outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <option value="number">رقم الآية (تسلسلي)</option>
                <option value="density-desc">الأعلى كثافة (%)</option>
                <option value="density-asc">الأقل كثافة (%)</option>
                <option value="count-desc">الأعلى تكراراً (حروف)</option>
              </select>
            </div>
          </div>

          {/* Verses Table */}
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-slate-800 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px] z-10">
                <tr>
                  <th className="py-2 px-3">رقم الآية</th>
                  <th className="py-2 px-3">نص الآية الشريف</th>
                  <th className="py-2 px-3">إجمالي الحروف</th>
                  <th className="py-2 px-3">تكرار حروف الفاتحة</th>
                  <th className="py-2 px-3">نسبة الكثافة</th>
                  <th className="py-2 px-3 text-center">المصحف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono">
                {filteredVerseList.map(v => {
                  const val = getValueForAyah(v);
                  return (
                    <tr 
                      key={v.ayahNumber}
                      onClick={() => setActiveAyahNumber(v.ayahNumber)}
                      className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        inspectedAyah?.ayahNumber === v.ayahNumber ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-amber-400">{v.ayahNumber}</td>
                      <td className="py-2.5 px-3 font-serif text-slate-200 text-sm max-w-md truncate">
                        {v.textUthmani}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{v.totalLetters}</td>
                      <td className="py-2.5 px-3 text-slate-300 font-bold">{v.totalOpeningCount}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-amber-500"
                              style={{ width: `${Math.min(100, v.densityPct * 2)}%` }}
                            ></div>
                          </div>
                          <span className="text-amber-400 font-bold">{v.densityPct}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {onOpenInReader && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenInReader(surahData.number, v.ayahNumber);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-400 transition-all"
                            title="فتح الآية في المصحف"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
