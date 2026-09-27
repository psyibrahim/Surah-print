import React, { useState, useMemo, useEffect } from 'react';
import { 
  GitCompare, 
  ArrowLeftRight, 
  Sparkles, 
  BarChart3, 
  Type, 
  BookOpen, 
  Activity, 
  Plus, 
  X, 
  CheckCircle2, 
  ArrowUpDown, 
  Shuffle, 
  Layers,
  HelpCircle,
  Hash,
  Percent,
  ListOrdered
} from 'lucide-react';
import { SurahData, QuranSurahCorpus } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { 
  LexicalFilterOptions, 
  DEFAULT_LEXICAL_OPTIONS, 
  analyzeSurahLexicon, 
  computeSharedVocabulary,
  WordFrequencyItem
} from '../utils/lexicalFilters';
import { LexicalFilterControlPanel } from './LexicalFilterControlPanel';
import { SectionHelpButton } from './SectionHelpModal';
import { WordVersesModal } from './WordVersesModal';
import { 
  ARABIC_LETTERS, 
  ABJAD_HAWWAZ_LETTERS, 
  QURANIC_FREQ_LETTERS, 
  ArabicLetterOrderingMode, 
  ARABIC_LETTER_NAMES, 
  formatSurahName 
} from '../utils/arabic';
import { MathTooltip } from './MathTooltip';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';

export interface SurahComparatorProps {
  surahs: SurahData[];
  initialSurahIds?: number[];
  initialSurahA?: number;
  initialSurahB?: number;
  initialSurahC?: number;
  onSelectSurah: (surah: SurahData) => void;
  onOpenInReader?: (surahNumber: number) => void;
}

// 6 distinct, accessible color palettes for comparing up to 6 Surahs
export const COMPARATOR_PALETTE = [
  {
    id: 'sky',
    name: 'سماوي',
    border: 'border-sky-500/50',
    borderLight: 'border-sky-300',
    bgBadge: 'bg-sky-500/15 text-sky-400',
    bgBadgeLight: 'bg-sky-50 text-sky-700 border-sky-200',
    text: 'text-sky-400',
    textLight: 'text-sky-600',
    textSub: 'text-sky-300',
    dot: 'bg-sky-400',
    bar: 'bg-sky-400',
    hex: '#38bdf8',
    hexLight: '#0284c7',
  },
  {
    id: 'emerald',
    name: 'زمردي',
    border: 'border-emerald-500/50',
    borderLight: 'border-emerald-300',
    bgBadge: 'bg-emerald-500/15 text-emerald-400',
    bgBadgeLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    text: 'text-emerald-400',
    textLight: 'text-emerald-600',
    textSub: 'text-emerald-300',
    dot: 'bg-emerald-400',
    bar: 'bg-emerald-400',
    hex: '#34d399',
    hexLight: '#059669',
  },
  {
    id: 'amber',
    name: 'كهرماني',
    border: 'border-amber-500/50',
    borderLight: 'border-amber-300',
    bgBadge: 'bg-amber-500/15 text-amber-400',
    bgBadgeLight: 'bg-amber-50 text-amber-700 border-amber-200',
    text: 'text-amber-400',
    textLight: 'text-amber-600',
    textSub: 'text-amber-300',
    dot: 'bg-amber-400',
    bar: 'bg-amber-400',
    hex: '#fbbf24',
    hexLight: '#d97706',
  },
  {
    id: 'purple',
    name: 'بنفسجي',
    border: 'border-purple-500/50',
    borderLight: 'border-purple-300',
    bgBadge: 'bg-purple-500/15 text-purple-400',
    bgBadgeLight: 'bg-purple-50 text-purple-700 border-purple-200',
    text: 'text-purple-400',
    textLight: 'text-purple-600',
    textSub: 'text-purple-300',
    dot: 'bg-purple-400',
    bar: 'bg-purple-400',
    hex: '#c084fc',
    hexLight: '#7e22ce',
  },
  {
    id: 'rose',
    name: 'وردي',
    border: 'border-rose-500/50',
    borderLight: 'border-rose-300',
    bgBadge: 'bg-rose-500/15 text-rose-400',
    bgBadgeLight: 'bg-rose-50 text-rose-700 border-rose-200',
    text: 'text-rose-400',
    textLight: 'text-rose-600',
    textSub: 'text-rose-300',
    dot: 'bg-rose-400',
    bar: 'bg-rose-400',
    hex: '#fb7185',
    hexLight: '#e11d48',
  },
  {
    id: 'indigo',
    name: 'نيلي',
    border: 'border-indigo-500/50',
    borderLight: 'border-indigo-300',
    bgBadge: 'bg-indigo-500/15 text-indigo-400',
    bgBadgeLight: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    text: 'text-indigo-400',
    textLight: 'text-indigo-600',
    textSub: 'text-indigo-300',
    dot: 'bg-indigo-400',
    bar: 'bg-indigo-400',
    hex: '#818cf8',
    hexLight: '#4338ca',
  },
];

const SurahComparatorComponent: React.FC<SurahComparatorProps> = ({
  surahs,
  initialSurahIds,
  initialSurahA = 1,
  initialSurahB = 2,
  onSelectSurah,
  onOpenInReader
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Determine initial surahs (minimum 2)
  const getInitialList = (): number[] => {
    if (initialSurahIds && initialSurahIds.length >= 2) {
      return initialSurahIds.slice(0, 6);
    }
    return [initialSurahA, initialSurahB];
  };

  const [selectedIds, setSelectedIds] = useState<number[]>(getInitialList);
  const [activeCompareTab, setActiveCompareTab] = useState<'radar' | 'letters-table' | 'words' | 'ayahs'>('letters-table');
  const [activeRadarLetter, setActiveRadarLetter] = useState<string>('ا');
  const [sortOption, setSortOption] = useState<'variance' | 'frequency' | 'alphabet'>('variance');
  const [letterSearch, setLetterSearch] = useState<string>('');

  // Access Quran corpus for deep lexical analysis
  const { corpus } = useQuranCorpus();
  // Customizable lexical options configured by the user
  const [lexicalOptions, setLexicalOptions] = useState<LexicalFilterOptions>(DEFAULT_LEXICAL_OPTIONS);

  // State for opening exclusively matching verses when clicking a word in top words
  const [selectedWordModalData, setSelectedWordModalData] = useState<{
    word: string;
    wordItem?: WordFrequencyItem;
    surah: SurahData;
    corpusSurah?: QuranSurahCorpus;
  } | null>(null);

  // Radar chart metric mode: 'percentage' vs 'count' (raw count)
  const [radarMetric, setRadarMetric] = useState<'percentage' | 'count'>('percentage');
  // Radar chart letter ordering mode: 'alphabet' | 'abjad' | 'quran-freq'
  const [radarLetterOrder, setRadarLetterOrder] = useState<ArabicLetterOrderingMode>('alphabet');

  // Dynamic Quranic frequency derived from active corpus dataset
  const dynamicQuranFreqLetters = useMemo(() => {
    if (!corpus?.letterStats?.globalStats) {
      return QURANIC_FREQ_LETTERS;
    }
    const list = ARABIC_LETTERS.map(l => ({
      letter: l,
      count: corpus.letterStats.globalStats[l]?.totalOccurrences || 0
    })).sort((a, b) => b.count - a.count);
    return list.map(item => item.letter);
  }, [corpus?.letterStats]);

  // Active letter sequence for the Radar Chart
  const activeRadarSequence = useMemo(() => {
    switch (radarLetterOrder) {
      case 'abjad':
        return ABJAD_HAWWAZ_LETTERS;
      case 'quran-freq':
        return dynamicQuranFreqLetters;
      case 'alphabet':
      default:
        return ARABIC_LETTERS;
    }
  }, [radarLetterOrder, dynamicQuranFreqLetters]);

  // Quran-wide metadata for letters (rank, total count, and Quran-wide percentage)
  const quranLetterMetadata = useMemo(() => {
    const meta: Record<string, { rank: number; count: number; pct: number }> = {};
    const totalOccurrencesAll = ARABIC_LETTERS.reduce((sum, l) => {
      return sum + (corpus?.letterStats?.globalStats?.[l]?.totalOccurrences || 0);
    }, 0);

    dynamicQuranFreqLetters.forEach((l, idx) => {
      const count = corpus?.letterStats?.globalStats?.[l]?.totalOccurrences || 0;
      const pct = totalOccurrencesAll > 0 ? Number(((count / totalOccurrencesAll) * 100).toFixed(2)) : 0;
      meta[l] = {
        rank: idx + 1,
        count,
        pct
      };
    });
    return meta;
  }, [corpus?.letterStats, dynamicQuranFreqLetters]);

  // Sync when initialSurahIds prop changes externally
  useEffect(() => {
    if (initialSurahIds && initialSurahIds.length >= 2) {
      setSelectedIds(initialSurahIds.slice(0, 6));
    }
  }, [initialSurahIds]);

  // Selected SurahData objects
  const selectedSurahs = useMemo(() => {
    return selectedIds.map(id => surahs.find(s => s.number === id) || surahs[0]);
  }, [selectedIds, surahs]);

  // Pairwise Cosine Similarity helper
  const calculateCosineSimilarity = (s1: SurahData, s2: SurahData): number => {
    let dot = 0, norm1 = 0, norm2 = 0;
    ARABIC_LETTERS.forEach(l => {
      const v1 = s1.letters.plainPercentages[l] || 0;
      const v2 = s2.letters.plainPercentages[l] || 0;
      dot += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    });
    if (norm1 === 0 || norm2 === 0) return 0;
    return Number(((dot / (Math.sqrt(norm1) * Math.sqrt(norm2))) * 100).toFixed(1));
  };

  // All unique pairs between the selected Surahs
  const pairwiseSimilarities = useMemo(() => {
    const pairs: { s1: SurahData; s2: SurahData; idx1: number; idx2: number; similarity: number }[] = [];
    for (let i = 0; i < selectedSurahs.length; i++) {
      for (let j = i + 1; j < selectedSurahs.length; j++) {
        pairs.push({
          s1: selectedSurahs[i],
          s2: selectedSurahs[j],
          idx1: i,
          idx2: j,
          similarity: calculateCosineSimilarity(selectedSurahs[i], selectedSurahs[j]),
        });
      }
    }
    return pairs;
  }, [selectedSurahs]);

  // Average similarity across all pairs
  const averageSimilarity = useMemo(() => {
    if (pairwiseSimilarities.length === 0) return 0;
    const sum = pairwiseSimilarities.reduce((acc, p) => acc + p.similarity, 0);
    return Number((sum / pairwiseSimilarities.length).toFixed(1));
  }, [pairwiseSimilarities]);

  // Radar chart data for all selected surahs across active letter sequence
  const radarData = useMemo(() => {
    return activeRadarSequence.map(letter => {
      const entry: Record<string, any> = { letter };
      selectedSurahs.forEach(s => {
        const pct = s.letters.plainPercentages[letter] || 0;
        const count = s.letters.plainCounts[letter] || 0;
        entry[s.name] = radarMetric === 'count' ? count : pct;
        entry[`${s.name}_count`] = count;
        entry[`${s.name}_pct`] = pct;
      });
      return entry;
    });
  }, [selectedSurahs, radarMetric, activeRadarSequence]);

  // Letters comparison data with variance and dominant surah
  const lettersComparisonData = useMemo(() => {
    const raw = ARABIC_LETTERS.map(letter => {
      const values = selectedSurahs.map(s => s.letters.plainPercentages[letter] || 0);
      const counts = selectedSurahs.map(s => s.letters.plainCounts[letter] || 0);
      
      const maxVal = Math.max(...values);
      const minVal = Math.min(...values);
      const variance = Number((maxVal - minVal).toFixed(2));
      const avg = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
      
      const maxIndex = values.indexOf(maxVal);
      const dominantSurah = variance < 0.25 ? null : selectedSurahs[maxIndex];
      const dominantIndex = variance < 0.25 ? -1 : maxIndex;

      return {
        letter,
        values,
        counts,
        maxVal,
        minVal,
        variance,
        avg,
        dominantSurah,
        dominantIndex,
      };
    });

    let filtered = raw;
    if (letterSearch.trim()) {
      filtered = filtered.filter(r => r.letter.includes(letterSearch.trim()));
    }

    if (sortOption === 'variance') {
      return [...filtered].sort((a, b) => b.variance - a.variance);
    } else if (sortOption === 'frequency') {
      return [...filtered].sort((a, b) => b.avg - a.avg);
    }
    return filtered; // Alphabetical
  }, [selectedSurahs, sortOption, letterSearch]);

  // Dynamic Lexical Analysis for selected Surahs based on user-configured criteria (only computed when 'words' tab is active)
  const surahLexicalResults = useMemo(() => {
    if (activeCompareTab !== 'words') return [];
    return selectedSurahs.map(surah => {
      const corpusSurah = corpus.find(c => c.number === surah.number);
      return analyzeSurahLexicon(surah.number, corpusSurah, lexicalOptions);
    });
  }, [selectedSurahs, corpus, lexicalOptions, activeCompareTab]);

  // Shared / Common words across the selected Surahs respecting active criteria
  const sharedWords = useMemo(() => {
    if (activeCompareTab !== 'words' || surahLexicalResults.length === 0) return [];
    return computeSharedVocabulary(surahLexicalResults, selectedSurahs, 8);
  }, [surahLexicalResults, selectedSurahs, activeCompareTab]);

  // Add a new Surah to the comparison (up to 6)
  const handleAddSurah = () => {
    if (selectedIds.length >= 6) return;
    // Pick the first surah not yet selected
    const available = surahs.find(s => !selectedIds.includes(s.number));
    if (available) {
      setSelectedIds([...selectedIds, available.number]);
    } else {
      setSelectedIds([...selectedIds, surahs[0].number]);
    }
  };

  // Remove a Surah from comparison (minimum 2 remaining)
  const handleRemoveSurah = (index: number) => {
    if (selectedIds.length <= 2) return;
    const next = selectedIds.filter((_, i) => i !== index);
    setSelectedIds(next);
  };

  // Change a specific Surah
  const handleChangeSurah = (index: number, newNumber: number) => {
    const next = [...selectedIds];
    next[index] = newNumber;
    setSelectedIds(next);
  };

  // Swap first two surahs
  const handleSwapTwo = () => {
    if (selectedIds.length >= 2) {
      const next = [...selectedIds];
      const tmp = next[0];
      next[0] = next[1];
      next[1] = tmp;
      setSelectedIds(next);
    }
  };

  // Quick Presets
  const setPreset = (ids: number[]) => {
    setSelectedIds(ids);
  };

  return (
    <div className="space-y-4 w-full max-w-full min-w-0">
      
      {/* 1. Header & Dynamic Multi-Surah Selectors */}
      <div className={`sci-bg sci-border rounded-xl p-3 sm:p-4 space-y-4 shadow-sm transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'
      }`}>
        
        {/* Title Bar & Quick Presets */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b pb-3 border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
              isLight ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-slate-800 border-sky-500/30 text-sky-400'
            }`}>
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base font-bold font-quran ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  المقارنة المتجهية المرنة
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  selectedIds.length === 2 
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {selectedIds.length === 2 ? 'مقارنة ثنائية (سورتان)' : `مقارنة متعددة (${selectedIds.length} سور)`}
                </span>
              </div>
              <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                قارن بين سورتين أو أكثر (حتى 6 سور) مع تحليل التباين الترددي والمعجمي وتطابق البصمة
              </p>
            </div>
          </div>

          {/* Quick Presets Menu */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs self-stretch lg:self-center">
            <span className={`text-[10px] ${isLight ? 'text-slate-700 font-bold' : 'text-slate-400'}`}>نماذج جاهزة:</span>
            
            {/* 2 Surahs */}
            <button
              type="button"
              onClick={() => setPreset([1, 114])}
              className={`px-2 py-1 rounded text-[10px] transition-colors ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300'
              }`}
            >
              الفاتحة ↔ الناس (2)
            </button>
            <button
              type="button"
              onClick={() => setPreset([2, 3])}
              className={`px-2 py-1 rounded text-[10px] transition-colors ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300'
              }`}
            >
              البقرة ↔ آل عمران (2)
            </button>

            {/* 3 Surahs */}
            <button
              type="button"
              onClick={() => setPreset([1, 112, 114])}
              className={`px-2 py-1 rounded text-[10px] transition-colors ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300'
              }`}
            >
              الفاتحة / الإخلاص / الناس (3)
            </button>
            <button
              type="button"
              onClick={() => setPreset([18, 19, 20])}
              className={`px-2 py-1 rounded text-[10px] transition-colors ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300'
              }`}
            >
              الكهف / مريم / طه (3)
            </button>

            {/* 4 Surahs */}
            <button
              type="button"
              onClick={() => setPreset([109, 112, 113, 114])}
              className={`px-2 py-1 rounded text-[10px] transition-colors ${
                isLight 
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200' 
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
              }`}
            >
              المعوذات الأربع (4)
            </button>

            {/* 5 Surahs */}
            <button
              type="button"
              onClick={() => setPreset([57, 59, 61, 62, 64])}
              className={`px-2 py-1 rounded text-[10px] transition-colors ${
                isLight 
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200' 
                  : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30'
              }`}
            >
              المسبحات (5)
            </button>

            {/* 7 Surahs: Hawameem */}
            <button
              type="button"
              onClick={() => setPreset([40, 41, 42, 43, 44, 45, 46])}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                isLight 
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-xs' 
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-xs'
              }`}
              title="مقارنة فورية لسور الحواميم السبع (غافر حتى الأحقاف)"
            >
              الحواميم السبع (7)
            </button>

            {/* Help Button */}
            <SectionHelpButton 
              guideId={
                activeCompareTab === 'letters-table' ? 'comparator-letters-table' :
                activeCompareTab === 'radar' ? 'comparator-radar' :
                activeCompareTab === 'words' ? 'comparator-words' :
                'comparator-ayahs'
              } 
              variant="icon" 
              title="دليل معمل المقارنة المتجهية"
            />
          </div>
        </div>

        {/* Dynamic Surah Selector Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 items-stretch">
          {selectedSurahs.map((surah, index) => {
            const palette = COMPARATOR_PALETTE[index % COMPARATOR_PALETTE.length];
            return (
              <div 
                key={`${surah.number}-${index}`}
                className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition-all shadow-sm ${
                  isLight 
                    ? `bg-slate-50/90 ${palette.borderLight}` 
                    : `bg-[#0A0E17] ${palette.border}`
                }`}
              >
                {/* Card Top Label & Remove Button */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className={`w-2.5 h-2.5 rounded-full inline-block ${palette.dot}`}></span>
                    <span className={isLight ? palette.textLight : palette.text}>
                      السورة ({index + 1})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {surah.isMeccan ? 'مكية' : 'مدنية'} • {surah.totalAyahs} آية
                    </span>
                    
                    {/* Remove button if count > 2 */}
                    {selectedSurahs.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSurah(index)}
                        title="إزالة هذه السورة من المقارنة"
                        className={`p-1 rounded-md transition-colors ${
                          isLight 
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                            : 'text-slate-500 hover:text-rose-400 hover:bg-rose-950/40'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dropdown Selector */}
                <select
                  id={`select-comparator-surah-${index}`}
                  value={surah.number}
                  onChange={(e) => handleChangeSurah(index, Number(e.target.value))}
                  className={`w-full rounded-lg px-2.5 py-1.5 font-quran text-sm font-bold border transition-colors focus:outline-none focus:ring-1 ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-sky-500 focus:ring-sky-200' 
                      : 'bg-black/70 border-slate-700 text-slate-100 focus:border-sky-500 focus:ring-sky-500/20'
                  }`}
                >
                  {surahs.map(s => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {formatSurahName(s.name)} ({s.totalAyahs} آية - {s.totalWords} كلمة)
                    </option>
                  ))}
                </select>

                {/* Card Footer Quick Links */}
                <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                    {surah.totalWords.toLocaleString()} كلمة • {surah.totalChars.toLocaleString()} حرف
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectSurah(surah)}
                    className={`underline cursor-pointer hover:opacity-80 ${isLight ? palette.textLight : palette.text}`}
                  >
                    عرض بصمة السورة ←
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add Surah Button (Visible if < 6) */}
          {selectedSurahs.length < 6 && (
            <button
              type="button"
              onClick={handleAddSurah}
              className={`p-4 rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 font-mono text-xs transition-all min-h-[105px] group cursor-pointer ${
                isLight 
                  ? 'border-slate-300 bg-slate-50/50 hover:bg-sky-50/60 hover:border-sky-300 text-slate-600 hover:text-sky-700' 
                  : 'border-slate-700 bg-slate-900/30 hover:bg-slate-800/60 hover:border-sky-500/60 text-slate-400 hover:text-sky-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                isLight ? 'bg-white shadow-sm text-sky-600' : 'bg-slate-800 text-sky-400'
              }`}>
                <Plus className="w-4 h-4" />
              </div>
              <span className="font-bold">
                + إضافة سورة للمقارنة ({selectedSurahs.length}/6)
              </span>
              <span className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                يمكنك مقارنة حتى 6 سور معاً
              </span>
            </button>
          )}
        </div>

        {/* 2. Cosine Similarity Strip (Pairwise & Overall Average) */}
        <div className="pt-2 border-t border-slate-700/60 space-y-2">
          
          {selectedSurahs.length === 2 ? (
            /* Single Pair Direct Comparison Card */
            <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isLight 
                ? 'bg-sky-50/60 border-sky-200 text-slate-900' 
                : 'bg-sky-950/20 border-sky-500/30 text-slate-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 font-quran text-base font-bold">
                  <span className="text-sky-400">{formatSurahName(selectedSurahs[0]?.name || '')}</span>
                  <ArrowLeftRight className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-emerald-400">{formatSurahName(selectedSurahs[1]?.name || '')}</span>
                </div>
                <div className="h-4 w-px bg-slate-400/30 hidden sm:block"></div>
                <span className={`text-xs font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  مؤشر التشابه الترددي الكوزيني للحروف:
                </span>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <MathTooltip metricId="cosineSimilarity" value={`${pairwiseSimilarities[0]?.similarity}%`}>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-xl font-bold text-sky-400">
                      {pairwiseSimilarities[0]?.similarity}%
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      (pairwiseSimilarities[0]?.similarity || 0) >= 95 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : (pairwiseSimilarities[0]?.similarity || 0) >= 88 
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {(pairwiseSimilarities[0]?.similarity || 0) >= 95 ? 'تطابق فائق' : (pairwiseSimilarities[0]?.similarity || 0) >= 88 ? 'تقارب تركيبي متين' : 'تباين أسلوبي ملحوظ'}
                    </span>
                  </div>
                </MathTooltip>
                
                <button
                  type="button"
                  onClick={handleSwapTwo}
                  title="تبديل موقع السورتين"
                  className={`p-1.5 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1 ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' 
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px]">تبديل</span>
                </button>
              </div>
            </div>
          ) : (
            /* Multi-Pair Grid + Overall Average Card */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-mono font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  مصفوفة التشابه الثنائي بين السور المختارة ({pairwiseSimilarities.length} تقاطع):
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    متوسط التوافق الإجمالي:
                  </span>
                  <MathTooltip metricId="triAverageSimilarity" value={`${averageSimilarity}%`}>
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 font-mono font-bold text-xs">
                      {averageSimilarity}%
                    </span>
                  </MathTooltip>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-xs">
                {pairwiseSimilarities.map((pair, pIdx) => {
                  const p1 = COMPARATOR_PALETTE[pair.idx1 % COMPARATOR_PALETTE.length];
                  const p2 = COMPARATOR_PALETTE[pair.idx2 % COMPARATOR_PALETTE.length];
                  return (
                    <div 
                      key={pIdx}
                      className={`p-2 rounded-lg border flex flex-col justify-between gap-1 transition-colors ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] truncate">
                        <span className={`font-quran font-bold truncate ${isLight ? p1.textLight : p1.text}`}>
                          {formatSurahName(pair.s1.name)}
                        </span>
                        <span className="text-slate-400 text-[10px]">↔</span>
                        <span className={`font-quran font-bold truncate ${isLight ? p2.textLight : p2.text}`}>
                          {formatSurahName(pair.s2.name)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-700/40">
                        <span className="text-[10px] text-slate-500">التطابق:</span>
                        <MathTooltip metricId="cosineSimilarity" value={`${pair.similarity}%`}>
                          <span className="font-bold text-sky-400">{pair.similarity}%</span>
                        </MathTooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 3. Comparison Navigation Tabs */}
      <div className={`flex items-center gap-1.5 p-1 rounded-xl border overflow-x-auto min-w-0 ${
        isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-slate-800'
      }`}>
        {[
          { id: 'letters-table', label: 'جدول فروق وتباين الحروف المتوازي', icon: Type },
          { id: 'radar', label: `مخطط الرادار المتعدد (${selectedSurahs.length} سور)`, icon: Activity },
          { id: 'words', label: 'مقارنة الألفاظ والمعجم المشترك', icon: BookOpen },
          { id: 'ayahs', label: 'مقارنة الآيات وفواصل القوافي', icon: BarChart3 }
        ].map(t => {
          const Icon = t.icon;
          const active = activeCompareTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveCompareTab(t.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap cursor-pointer ${
                active
                  ? (isLight 
                      ? 'bg-white text-sky-700 shadow-sm border border-sky-200 font-bold' 
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold')
                  : (isLight 
                      ? 'text-slate-600 hover:text-slate-900' 
                      : 'text-slate-400 hover:text-slate-200')
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. SUMMARY METRICS COMPARISON STRIP (DYNAMIC N-COLUMNS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono">
        {[
          { 
            label: 'عدد الآيات', 
            metricId: undefined,
            getter: (s: SurahData) => s.totalAyahs, 
            format: (v: number) => `${v} آية` 
          },
          { 
            label: 'عدد الكلمات', 
            metricId: undefined,
            getter: (s: SurahData) => s.totalWords, 
            format: (v: number) => v.toLocaleString('en-US') 
          },
          { 
            label: 'عدد الحروف', 
            metricId: undefined,
            getter: (s: SurahData) => s.totalChars, 
            format: (v: number) => v.toLocaleString('en-US') 
          },
          { 
            label: 'تنوع المفردات (TTR)', 
            metricId: 'ttr',
            getter: (s: SurahData) => s.vocabularyDiversity, 
            format: (v: number) => `${v}%` 
          },
          { 
            label: 'متوسط طول الآية', 
            metricId: 'avgAyahLengthWords',
            getter: (s: SurahData) => s.avgAyahLengthWords, 
            format: (v: number) => `${v} ك` 
          },
          { 
            label: 'الحروف الغائبة', 
            metricId: 'absentLetters',
            getter: (s: SurahData) => s.letters.absentCount, 
            format: (v: number) => `${v} ح` 
          },
        ].map((m, idx) => (
          <div 
            key={idx} 
            className={`p-2.5 rounded-xl border space-y-1.5 transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'
            }`}
          >
            <div className={`text-[10px] text-center font-mono uppercase truncate ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              {m.metricId ? (
                <MathTooltip metricId={m.metricId} showUnderline={true}>
                  <span>{m.label}</span>
                </MathTooltip>
              ) : (
                m.label
              )}
            </div>

            {/* Dynamic mini subgrid for each selected surah */}
            <div 
              className="grid gap-1 text-[11px] text-center pt-1 border-t border-slate-700/40"
              style={{ gridTemplateColumns: `repeat(${selectedSurahs.length}, minmax(0, 1fr))` }}
            >
              {selectedSurahs.map((s, sIdx) => {
                const palette = COMPARATOR_PALETTE[sIdx % COMPARATOR_PALETTE.length];
                const val = m.getter(s);
                return (
                  <div key={s.number} className="truncate" title={`${formatSurahName(s.name)}: ${m.format(val)}`}>
                    {m.metricId ? (
                      <MathTooltip metricId={m.metricId} value={m.format(val)} showUnderline={false}>
                        <span className={`font-bold truncate ${isLight ? palette.textLight : palette.text}`}>
                          {m.format(val)}
                        </span>
                      </MathTooltip>
                    ) : (
                      <span className={`font-bold truncate ${isLight ? palette.textLight : palette.text}`}>
                        {m.format(val)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* TAB 1: LETTERS PARALLEL VARIANCE TABLE */}
      {activeCompareTab === 'letters-table' && (
        <div className={`sci-bg sci-border rounded-xl overflow-hidden shadow-sm space-y-0 transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'
        }`}>
          
          {/* Table Header Controls */}
          <div className={`p-3 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'
          }`}>
            <div>
              <h3 className={`text-xs font-mono font-bold flex items-center gap-2 ${
                isLight ? 'text-sky-700' : 'text-sky-400'
              }`}>
                <span>جدول فروق وتباين نسب الحروف المتوازي ({selectedSurahs.length} سور)</span>
                <SectionHelpButton 
                  guideId="comparator-letters-table" 
                  variant="icon" 
                  title="استعلام: شرح جدول فروق وتباين نسب الحروف المتوازي" 
                />
              </h3>
              <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                مقارنة تردد الحروف الـ 28 مع حساب التباين الأقصى (Δ) لتحديد البصمة المميزة لكل سورة
              </p>
            </div>

            {/* Sorting & Filter */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className={`text-[10px] ${isLight ? 'text-slate-700 font-bold' : 'text-slate-400'}`}>ترتيب:</span>
              <button
                type="button"
                onClick={() => setSortOption('variance')}
                className={`px-2 py-1 rounded text-[10px] transition-colors cursor-pointer ${
                  sortOption === 'variance'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                أعلى تباين (Δ)
              </button>
              <button
                type="button"
                onClick={() => setSortOption('frequency')}
                className={`px-2 py-1 rounded text-[10px] transition-colors cursor-pointer ${
                  sortOption === 'frequency'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                أعلى تكرار
              </button>
              <button
                type="button"
                onClick={() => setSortOption('alphabet')}
                className={`px-2 py-1 rounded text-[10px] transition-colors cursor-pointer ${
                  sortOption === 'alphabet'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                أبجدي
              </button>
            </div>
          </div>

          {/* Table Body with Dynamic Columns */}
          <div className="max-h-[540px] overflow-y-auto overflow-x-auto min-w-0">
            <table className="w-full text-right text-xs">
              <thead className={`sticky top-0 border-b font-mono text-[10px] uppercase z-10 ${
                isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-[#0A0D12] text-sky-400 border-slate-800'
              }`}>
                <tr>
                  <th className="p-2.5">الحرف</th>
                  
                  {/* Dynamic Column Header for Each Selected Surah */}
                  {selectedSurahs.map((surah, sIdx) => {
                    const palette = COMPARATOR_PALETTE[sIdx % COMPARATOR_PALETTE.length];
                    return (
                      <th key={surah.number} className={`p-2.5 ${isLight ? palette.textLight : palette.textSub}`}>
                        {surah.name} (% / تكرار)
                      </th>
                    );
                  })}

                  <th className="p-2.5 text-amber-400">
                    <MathTooltip metricId="letterVariance" showUnderline={true}>
                      <span>التباين الأقصى (Δ)</span>
                    </MathTooltip>
                  </th>
                  <th className="p-2.5">السورة المتصدرة</th>
                  <th className="p-2.5">التوزيع التناسبي</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono text-[11px] ${
                isLight ? 'divide-slate-200 text-slate-700' : 'divide-slate-800/80 text-slate-300'
              }`}>
                {lettersComparisonData.map(row => {
                  return (
                    <tr 
                      key={row.letter} 
                      className={`transition-colors ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Letter glyph */}
                      <td className={`p-2.5 font-quran font-bold text-base ${
                        isLight ? 'text-slate-900' : 'text-slate-100'
                      }`}>
                        {row.letter}
                      </td>
                      
                      {/* Percent & Count for each Surah */}
                      {selectedSurahs.map((_, sIdx) => {
                        const palette = COMPARATOR_PALETTE[sIdx % COMPARATOR_PALETTE.length];
                        const p = row.values[sIdx];
                        const c = row.counts[sIdx];
                        return (
                          <td key={sIdx} className="p-2.5">
                            <MathTooltip metricId="letterPercentage" value={`${p}%`} showUnderline={false}>
                              <span className={`font-semibold ${isLight ? palette.textLight : palette.textSub}`}>
                                {p}%
                              </span> 
                            </MathTooltip>
                            <span className={`text-[10px] mr-1 ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                              ({c})
                            </span>
                          </td>
                        );
                      })}

                      {/* Variance Δ */}
                      <td className="p-2.5">
                        <MathTooltip metricId="letterVariance" value={`${row.variance}%`} showUnderline={false}>
                          <span className={`px-1.5 py-0.5 rounded font-bold ${
                            row.variance >= 2.0 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                              : row.variance >= 1.0 
                              ? 'text-amber-400' 
                              : (isLight ? 'text-slate-500' : 'text-slate-400')
                          }`}>
                            {row.variance}%
                          </span>
                        </MathTooltip>
                      </td>

                      {/* Dominant Surah Badge */}
                      <td className="p-2.5">
                        {row.dominantSurah ? (
                          (() => {
                            const domPalette = COMPARATOR_PALETTE[row.dominantIndex % COMPARATOR_PALETTE.length];
                            return (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                isLight ? domPalette.bgBadgeLight : domPalette.bgBadge
                              }`}>
                                {row.dominantSurah.name}
                              </span>
                            );
                          })()
                        ) : (
                          <span className={`text-[10px] ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                            متقارب
                          </span>
                        )}
                      </td>

                      {/* Mini visual bars in parallel */}
                      <td className="p-2.5 min-w-[120px]">
                        <div className="space-y-1">
                          {selectedSurahs.map((surah, sIdx) => {
                            const palette = COMPARATOR_PALETTE[sIdx % COMPARATOR_PALETTE.length];
                            const p = row.values[sIdx];
                            return (
                              <div 
                                key={sIdx} 
                                className={`h-1.5 rounded-full overflow-hidden flex ${
                                  isLight ? 'bg-slate-200' : 'bg-slate-800'
                                }`}
                              >
                                <div 
                                  className={`h-full rounded-full transition-all ${palette.bar}`} 
                                  style={{ width: `${Math.min(100, (p / 15) * 100)}%` }}
                                  title={`${surah.name}: ${p}%`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RADAR CHART (MULTI-SURAH) */}
      {activeCompareTab === 'radar' && (
        <div className={`sci-bg sci-border rounded-xl p-4 shadow-sm transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'
        }`}>
          {/* Main Top Header: Title, Metric Mode & Surah Legend */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                <span>مخطط الرادار المتجهي للحروف الـ 28 ({selectedSurahs.length} سور)</span>
                <SectionHelpButton 
                  guideId="comparator-radar" 
                  variant="icon" 
                  title="استعلام: شرح مخطط الرادار المتجهي وشبكة المحاور القطبية وترتيب الحروف" 
                />
              </h3>
              <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {radarMetric === 'count'
                  ? `مقارنة التعداد الحقيقي (العدد الخام) لـ ${selectedSurahs.length} سور عبر المحاور الـ 28`
                  : `مقارنة البصمة الترددية النسبية (%) لـ ${selectedSurahs.length} سور على شبكة قطبية متعددة الأبعاد`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Metric Mode Toggle (Count vs Percentage) */}
              <div className={`flex items-center gap-1 p-1 rounded-xl border font-mono transition-colors ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/40 border-slate-800'
              }`}>
                <button
                  onClick={() => setRadarMetric('percentage')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                    radarMetric === 'percentage'
                      ? 'bg-sky-500 text-white font-bold shadow-sm'
                      : isLight 
                        ? 'text-slate-600 hover:text-slate-900' 
                        : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="عرض مخطط الرادار بالنسبة المئوية من حروف كل سورة"
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>النسبة المئوية (%)</span>
                </button>
                <button
                  onClick={() => setRadarMetric('count')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                    radarMetric === 'count'
                      ? 'bg-sky-500 text-white font-bold shadow-sm'
                      : isLight 
                        ? 'text-slate-600 hover:text-slate-900' 
                        : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="عرض مخطط الرادار بالتعداد الحقيقي للأحرف (العدد الخام)"
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span>التعداد الحقيقي (العدد الخام)</span>
                </button>
              </div>

              {/* Legend tags */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
                {selectedSurahs.map((surah, sIdx) => {
                  const palette = COMPARATOR_PALETTE[sIdx % COMPARATOR_PALETTE.length];
                  return (
                    <div key={surah.number} className={`flex items-center gap-1.5 font-bold ${
                      isLight ? palette.textLight : palette.textSub
                    }`}>
                      <span className={`w-2.5 h-2.5 rounded-sm inline-block ${palette.dot}`}></span>
                      <span>{surah.name}</span>
                      {radarMetric === 'count' && (
                        <span className="text-[10px] font-normal opacity-80">
                          ({(surah.totalChars ?? surah.letters?.totalLettersPlain ?? 0).toLocaleString('en-US')} حرف)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sub-bar: Letter Ordering Selector & Explanatory Banner */}
          <div className={`p-2.5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3 transition-colors ${
            isLight ? 'bg-slate-50 border-slate-300/80 shadow-2xs' : 'bg-black/30 border-slate-800'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                isLight ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
              }`}>
                <ListOrdered className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold font-mono ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                    ترتيب محاور الرادار:
                  </span>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                    radarLetterOrder === 'quran-freq'
                      ? isLight ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : radarLetterOrder === 'abjad'
                        ? isLight ? 'bg-indigo-100 text-indigo-950 border border-indigo-300' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : isLight ? 'bg-sky-100 text-sky-950 border border-sky-300' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  }`}>
                    {radarLetterOrder === 'alphabet' && 'الهجائي القياسي (ا ب ت ث...)'}
                    {radarLetterOrder === 'abjad' && 'الأبجدي التاريخي (أبجد هوز...)'}
                    {radarLetterOrder === 'quran-freq' && 'التواتر القرآني العام (ا ل ن م...)'}
                  </span>
                </div>
                <p className={`text-[11px] font-mono truncate mt-0.5 ${isLight ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                  {radarLetterOrder === 'alphabet' && 'التصنيف الألفبائي المعجمي (ا ب ت ث ج ح خ...) • يعتمد على تماثل رسم الحروف ونظائرها'}
                  {radarLetterOrder === 'abjad' && 'التسلسل السامي التاريخي (أبجد هوز حطي كلمن...) • يرتبط بحساب الجُمّل والقيم العددية القديمة'}
                  {radarLetterOrder === 'quran-freq' && 'مرتب تنازلياً حسب التكرار بالمصحف الشريف (ا ثم ل ثم ن ثم م...) • يبرز هيمنة كبار الحروف وشذوذ النظم فوراً'}
                </p>
              </div>
            </div>

            {/* Segmented 3-Way Selector */}
            <div className={`flex items-center gap-1 p-1 rounded-lg border font-mono text-xs shrink-0 ${
              isLight ? 'bg-slate-200/80 border-slate-300' : 'bg-black/40 border-slate-800'
            }`}>
              <button
                onClick={() => setRadarLetterOrder('alphabet')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  radarLetterOrder === 'alphabet'
                    ? 'bg-sky-500 text-white font-bold shadow-xs'
                    : isLight ? 'text-slate-700 hover:text-slate-950 font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="الترتيب الهجائي القياسي: ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي"
              >
                <span>هجائي</span>
                <span className="text-[10px] opacity-80 font-sans">(ا ب ت)</span>
              </button>

              <button
                onClick={() => setRadarLetterOrder('abjad')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  radarLetterOrder === 'abjad'
                    ? 'bg-sky-500 text-white font-bold shadow-xs'
                    : isLight ? 'text-slate-700 hover:text-slate-950 font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="الترتيب الأبجدي التاريخي: أبجد هوز حطي كلمن سعفص قرشت ثخذ ضظغ"
              >
                <span>أبجد هوز</span>
                <span className="text-[10px] opacity-80 font-sans">(ا ب ج)</span>
              </button>

              <button
                onClick={() => setRadarLetterOrder('quran-freq')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  radarLetterOrder === 'quran-freq'
                    ? 'bg-sky-500 text-white font-bold shadow-xs'
                    : isLight ? 'text-slate-700 hover:text-slate-950 font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="ترتيب التواتر القرآني العام: ا ل ن م و ي ه ت ر ب ك ع ف ق س د ذ ح ج خ ش ص ض ز ث ط غ ظ"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>تواتر قرآني</span>
                <span className="text-[10px] opacity-80 font-sans">(ا ل ن م)</span>
              </button>
            </div>
          </div>

          {/* 2-Column Layout: Unobstructed Polar Radar Chart + Fixed Side Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left: Responsive Radar Canvas without blocking floating popup */}
            <div className={`lg:col-span-7 xl:col-span-8 p-3 rounded-xl border ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-black/20 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-mono text-slate-400">
                  مرر المؤشر أو اضغط على أي حرف لتحديث لوحة الفحص الجانبية
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                    الترتيب: {radarLetterOrder === 'alphabet' ? 'هجائي' : radarLetterOrder === 'abjad' ? 'أبجد هوز' : 'تواتر قرآني'}
                  </span>
                  <span className="text-[11px] font-mono text-sky-400 font-bold">
                    الحرف النشط: «{activeRadarLetter}»
                  </span>
                </div>
              </div>
              <div className="h-[460px] w-full min-w-0 overflow-hidden" dir="ltr">
                <ResponsiveContainer 
                  key={`${radarLetterOrder}-${radarMetric}-${selectedSurahs.map(s => s.number).join('-')}`}
                  width="100%" 
                  height="100%"
                >
                  <RadarChart 
                    cx="50%" 
                    cy="50%" 
                    outerRadius="78%" 
                    data={radarData}
                    onMouseMove={(state: any) => {
                      if (state && state.activeLabel) {
                        setActiveRadarLetter(state.activeLabel);
                      }
                    }}
                    onClick={(state: any) => {
                      if (state && state.activeLabel) {
                        setActiveRadarLetter(state.activeLabel);
                      }
                    }}
                  >
                    <PolarGrid stroke={isLight ? '#CBD5E1' : '#334155'} strokeDasharray="3 3" />
                    <PolarAngleAxis 
                      dataKey="letter" 
                      tick={{ fill: isLight ? '#0F172A' : '#94a3b8', fontSize: 13, fontFamily: 'Amiri', fontWeight: 'bold' }} 
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 'auto']} 
                      stroke={isLight ? '#94A3B8' : '#475569'} 
                      fontSize={9}
                      tickFormatter={(val: any) => {
                        if (radarMetric === 'count') {
                          if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
                          return String(val);
                        }
                        return `${val}%`;
                      }}
                    />
                    
                    {/* Dynamically render a Radar for each selected Surah */}
                    {selectedSurahs.map((surah, sIdx) => {
                      const palette = COMPARATOR_PALETTE[sIdx % COMPARATOR_PALETTE.length];
                      const strokeColor = isLight ? palette.hexLight : palette.hex;
                      return (
                        <Radar
                          key={surah.number}
                          name={surah.name}
                          dataKey={surah.name}
                          stroke={strokeColor}
                          fill={strokeColor}
                          fillOpacity={0.2}
                        />
                      );
                    })}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Fixed Docked Side Panel with comprehensive breakdown */}
            <div className={`lg:col-span-5 xl:col-span-4 p-4 rounded-xl border transition-colors ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800 shadow-sm'
            }`}>
              {/* Header with active letter details */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/30">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-11 h-11 rounded-xl font-quran font-bold text-2xl flex items-center justify-center bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-xs shrink-0">
                    {activeRadarLetter}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                        حرف «{activeRadarLetter}» ({ARABIC_LETTER_NAMES[activeRadarLetter] || 'حرف'})
                      </h4>
                      {quranLetterMetadata[activeRadarLetter] && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 ${
                          isLight ? 'bg-sky-100 text-sky-950 border border-sky-300' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}>
                          رتبة #{quranLetterMetadata[activeRadarLetter].rank} بالمصحف
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] font-mono mt-0.5 truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {radarMetric === 'count' ? 'مقارنة التعداد الفعلي' : 'مقارنة النسبة المئوية'} عبر السور
                      {quranLetterMetadata[activeRadarLetter] && (
                        <span className="opacity-80"> • {quranLetterMetadata[activeRadarLetter].count.toLocaleString('en-US')} تكراراً بالمصحف</span>
                      )}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono shrink-0">
                  لوحة فحص
                </span>
              </div>

              {/* Surah Details List */}
              <div className="space-y-2.5 font-mono">
                {selectedSurahs.map((surah, sIdx) => {
                  const palette = COMPARATOR_PALETTE[sIdx % COMPARATOR_PALETTE.length];
                  const pct = surah.letters?.plainPercentages?.[activeRadarLetter] ?? 0;
                  const count = surah.letters?.plainCounts?.[activeRadarLetter] ?? 0;
                  
                  // Calculate max value in selection for relative bar
                  const allValues = selectedSurahs.map(s => 
                    radarMetric === 'count' 
                      ? (s.letters?.plainCounts?.[activeRadarLetter] ?? 0)
                      : (s.letters?.plainPercentages?.[activeRadarLetter] ?? 0)
                  );
                  const maxVal = Math.max(...allValues, 0.0001);
                  const currentVal = radarMetric === 'count' ? count : pct;
                  const barPct = Math.min(100, Math.max(4, Number(((currentVal / maxVal) * 100).toFixed(1))));
                  const isTop = currentVal === maxVal && maxVal > 0;

                  return (
                    <div 
                      key={surah.number}
                      className={`p-2.5 rounded-lg border transition-all ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-xs shrink-0 ${palette.dot}`} />
                          <span className={`font-bold truncate ${isLight ? palette.textLight : palette.textSub}`}>
                            {surah.name}
                          </span>
                          {isTop && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-sans border border-amber-500/40">
                              الأعلى
                            </span>
                          )}
                        </div>
                        
                        <div className="text-left shrink-0 font-bold">
                          {radarMetric === 'count' ? (
                            <span className={isLight ? palette.textLight : palette.textSub}>
                              {count.toLocaleString('en-US')} <span className="text-[10px] font-normal text-slate-400 font-mono">حرف ({pct}%)</span>
                            </span>
                          ) : (
                            <span className={isLight ? palette.textLight : palette.textSub}>
                              {pct}% <span className="text-[10px] font-normal text-slate-400 font-mono">({count.toLocaleString('en-US')} حرف)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Comparative visual bar */}
                      <div className="w-full bg-slate-700/20 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${barPct}%`, 
                            backgroundColor: isLight ? palette.hexLight : palette.hex 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 28 Letters Quick Selector Ordered According to Active Mode */}
              <div className="mt-4 pt-3 border-t border-slate-700/30">
                <div className="flex items-center justify-between mb-2 text-[11px] font-mono">
                  <span className={isLight ? 'text-slate-700 font-bold' : 'text-slate-300'}>
                    تثبيت حرف محدد:
                    <span className="text-[10px] text-sky-400 font-normal mr-1">
                      ({radarLetterOrder === 'alphabet' ? 'هجائي' : radarLetterOrder === 'abjad' ? 'أبجد هوز' : 'تواتر قرآني'})
                    </span>
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isLight ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-300'
                  }`}>
                    28 حرفاً
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {activeRadarSequence.map((l, idx) => {
                    const isSelected = activeRadarLetter === l;
                    const qMeta = quranLetterMetadata[l];
                    const rankNum = idx + 1;
                    return (
                      <button
                        key={l}
                        onClick={() => setActiveRadarLetter(l)}
                        className={`relative h-8 rounded text-xs font-quran flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500 text-white font-bold shadow-xs scale-105 ring-2 ring-sky-400/50 z-10'
                            : isLight
                              ? 'bg-slate-100 hover:bg-sky-50 text-slate-800 border border-slate-200'
                              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/50'
                        }`}
                        title={`حرف ${l} (${ARABIC_LETTER_NAMES[l] || l}) - الرتبة #${qMeta?.rank ?? rankNum} في المصحف (${qMeta?.count?.toLocaleString('en-US') ?? '-'} مرة)`}
                      >
                        <span className="text-xs leading-none font-bold">{l}</span>
                        <span className={`text-[8px] font-mono leading-none mt-0.5 opacity-70 ${isSelected ? 'text-white' : isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {radarLetterOrder === 'quran-freq' ? `#${rankNum}` : `${rankNum}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WORDS COMPARISON & SHARED VOCABULARY */}
      {activeCompareTab === 'words' && (
        <div className="space-y-4">
          {/* USER-CONTROLLED CUSTOM LEXICAL FILTERS & NORMALIZATION PANEL */}
          <LexicalFilterControlPanel
            options={lexicalOptions}
            onChange={setLexicalOptions}
            activeSurahsCount={selectedSurahs.length}
          />

          <div className={`sci-bg sci-border rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'
          }`}>
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                <span>مقارنة الألفاظ والتنوع المعجمي (Lexical Comparison & TTR)</span>
                <SectionHelpButton 
                  guideId="comparator-words" 
                  variant="icon" 
                  title="استعلام: شرح مقارنة الألفاظ وقوائم الأكثر تكراراً والتنوع المعجمي" 
                />
              </h3>
              <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                قوائم الكلمات الـ {lexicalOptions.topWordsCount} الأكثر تكراراً وفق المعايير والفلترة المختارة مع نسبتها ومعدل التنوع
              </p>
            </div>
            
            {/* TTR badges for all selected surahs with mode awareness */}
            <div className="text-[11px] font-mono flex flex-wrap items-center gap-3">
              {selectedSurahs.map((surah, sIdx) => {
                const palette = COMPARATOR_PALETTE[sIdx % COMPARATOR_PALETTE.length];
                const lex = surahLexicalResults[sIdx];
                const ttrValue = lex ? lex.activeTTR : surah.vocabularyDiversity;
                const modeLabel = lexicalOptions.ttrCalculationMode === 'filtered' ? 'مُصفى' : 'شامل';
                return (
                  <div key={surah.number} className="flex flex-col items-start sm:items-end">
                    <span className={isLight ? palette.textLight : palette.textSub}>
                      TTR {surah.name}: <strong>{ttrValue}%</strong> <span className="text-[10px] opacity-75">({modeLabel})</span>
                    </span>
                    {lex && lex.excludedTokensCount > 0 && (
                      <span className="text-[9px] text-amber-500 font-mono">
                        مستبعد {lex.excludedTokensCount} لفظ ({lex.totalFilteredTokens} متبقٍ)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Hint Banner for Clicking Words */}
          <div className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 border transition-colors ${
            isLight ? 'bg-sky-50 text-sky-900 border-sky-200' : 'bg-sky-950/40 text-sky-200 border-sky-800/40'
          }`}>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                <strong>تصفح الآيات الحصرية:</strong> اضغط على أي كلمة في القوائم أدناه لعرض قائمة الآيات التي تحتوي على تلك الكلمة حصراً داخل تلك السورة دون بقية السورة.
              </span>
            </div>
            <span className="text-[10px] font-mono text-sky-400 opacity-80 hidden sm:inline">
              (انقر على أي بطاقة كلمة)
            </span>
          </div>

          {/* Dynamic Grid of Top Words for each Surah */}
          <div 
            className="grid gap-3"
            style={{ 
              gridTemplateColumns: `repeat(${Math.min(selectedSurahs.length, 3)}, minmax(0, 1fr))` 
            }}
          >
            {selectedSurahs.map((surah, sIdx) => {
              const palette = COMPARATOR_PALETTE[sIdx % COMPARATOR_PALETTE.length];
              const lex = surahLexicalResults[sIdx];
              const topList = lex ? lex.topWords : [];
              const totalTokens = lex ? lex.totalFilteredTokens : surah.totalWords;

              return (
                <div 
                  key={surah.number}
                  className={`sci-bg sci-border rounded-xl p-3.5 space-y-2.5 transition-colors ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between border-b pb-2 border-slate-700/40">
                    <h4 className={`font-quran font-bold text-sm flex items-center gap-1.5 ${
                      isLight ? palette.textLight : palette.text
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${palette.dot}`}></span>
                      أكثر كلمات {formatSurahName(surah.name)}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">
                      {topList.length} كلمات ({totalTokens} لفظاً)
                    </span>
                  </div>

                  {topList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                      لا توجد كلمات مطابقة للمعايير المحددة حالياً. جرّب تخفيف الفلاتر.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {topList.map((w, i) => (
                        <div 
                          key={i} 
                          onClick={() => {
                            const cSurah = corpus?.find(c => c.number === surah.number);
                            setSelectedWordModalData({
                              word: w.word,
                              wordItem: w,
                              surah,
                              corpusSurah: cSurah,
                            });
                          }}
                          className={`p-2.5 rounded-xl text-xs font-mono border transition-all space-y-1 cursor-pointer group hover:scale-[1.01] ${
                            isLight 
                              ? 'bg-slate-50 hover:bg-sky-50/70 border-slate-200 hover:border-sky-300 hover:shadow-xs' 
                              : 'bg-[#0A0D12] hover:bg-[#121824] border-slate-800 hover:border-sky-500/50 hover:shadow-md'
                          }`}
                          title={`انقر لعرض الآيات التي تحتوي على «${w.word}» حصراً في ${formatSurahName(surah.name)}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`font-quran font-bold text-sm sm:text-base group-hover:text-sky-400 transition-colors ${
                                isLight ? 'text-slate-900' : 'text-slate-100'
                              }`}>
                                {i + 1}. {w.word}
                              </span>
                              <span className="text-[10px] text-sky-400 font-sans opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center gap-0.5">
                                <BookOpen className="w-3 h-3" />
                                <span>عرض الآيات</span>
                              </span>
                            </div>
                            <span className={`font-bold shrink-0 ${isLight ? palette.textLight : palette.textSub}`}>
                              {w.count} مرة ({w.percentage}%)
                            </span>
                          </div>

                          {/* Merged variants indicator (e.g. والله, بالله merged under الله) */}
                          {w.mergedVariants && w.mergedVariants.length > 1 && (
                            <div className="text-[10px] flex flex-wrap items-center gap-1 pt-1 border-t border-slate-700/30">
                              <span className="text-emerald-400 font-semibold text-[9px]">يشمل الصيغ:</span>
                              {w.mergedVariants.map((v, vIdx) => (
                                <span 
                                  key={vIdx} 
                                  className={`px-1.5 py-0.2 rounded text-[10px] ${
                                    isLight 
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                      : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                                  }`}
                                >
                                  {v.variant} ({v.count})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Shared Vocabulary Box (if common words exist) */}
          {sharedWords.length > 0 && (
            <div className={`p-3.5 rounded-xl border space-y-2.5 transition-colors ${
              isLight ? 'bg-sky-50/50 border-sky-200' : 'bg-slate-900/40 border-sky-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <h4 className={`font-quran font-bold text-sm flex items-center gap-1.5 ${
                  isLight ? 'text-sky-800' : 'text-sky-300'
                }`}>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  الألفاظ المشتركة بين السور المختارة (المعجم المتطابق)
                </h4>
                <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {sharedWords.length} ألفاظ متكررة في جميع السور المختارة (وفق المعايير الحالية)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {sharedWords.map((item, idx) => (
                  <div 
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs font-mono space-y-2 ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#0A0E17] border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b pb-1 border-slate-700/40">
                      <span className={`font-quran font-bold text-sm ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                        {item.word}
                      </span>
                      <span className="text-[10px] text-amber-400 font-bold">مشترك</span>
                    </div>

                    {item.variantsSummary && (
                      <div className="text-[9px] text-emerald-400">
                        الصيغ: {item.variantsSummary}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      {selectedSurahs.map((surah, sIdx) => {
                        const palette = COMPARATOR_PALETTE[sIdx % COMPARATOR_PALETTE.length];
                        const count = item.counts[sIdx];
                        return (
                          <button
                            key={surah.number}
                            type="button"
                            onClick={() => {
                              const cSurah = corpus?.find(c => c.number === surah.number);
                              setSelectedWordModalData({
                                word: item.word,
                                surah,
                                corpusSurah: cSurah,
                              });
                            }}
                            className={`px-1.5 py-0.5 rounded border transition-all hover:scale-105 flex items-center gap-0.5 ${
                              isLight 
                                ? `${palette.textLight} hover:bg-sky-100 border-slate-200` 
                                : `${palette.textSub} hover:bg-slate-800 border-slate-700`
                            }`}
                            title={`عرض آيات ${formatSurahName(surah.name)} الحاوية للفظ «${item.word}» حصراً`}
                          >
                            <BookOpen className="w-2.5 h-2.5" />
                            <span>{surah.name}: {count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 4: AYAHS & RHYMES (MULTI-SURAH) */}
      {activeCompareTab === 'ayahs' && (
        <div className="space-y-3">
          <div className={`sci-bg sci-border rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-sm transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'
          }`}>
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                <span>مقارنة الآيات وهندسة فواصل القوافي (Verse Endings & Rhymes)</span>
                <SectionHelpButton 
                  guideId="comparator-ayahs" 
                  variant="icon" 
                  title="استعلام: شرح مقارنة الآيات وفواصل القوافي والإيقاع الصوتي" 
                />
              </h3>
              <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                تحليل القوافي وفواصل رؤوس الآيات الست الأكثر هيمنة على إيقاع السور المختارة
              </p>
            </div>

            {/* Average Verse Length across all surahs */}
            <div className="text-[11px] font-mono flex flex-wrap items-center gap-3">
              {selectedSurahs.map((surah, sIdx) => {
                const palette = COMPARATOR_PALETTE[sIdx % COMPARATOR_PALETTE.length];
                return (
                  <span key={surah.number} className={isLight ? palette.textLight : palette.textSub}>
                    متوسط {surah.name}: <strong>{surah.avgAyahLengthWords} ك/آية</strong>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Dynamic Grid for Rhymes */}
          <div 
            className="grid gap-3"
            style={{ 
              gridTemplateColumns: `repeat(${Math.min(selectedSurahs.length, 3)}, minmax(0, 1fr))` 
            }}
          >
            {selectedSurahs.map((surah, sIdx) => {
              const palette = COMPARATOR_PALETTE[sIdx % COMPARATOR_PALETTE.length];
              return (
                <div 
                  key={surah.number}
                  className={`sci-bg sci-border rounded-xl p-3.5 space-y-2.5 transition-colors ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#0B0F17] border-slate-800'
                  }`}
                >
                  <h4 className={`font-quran font-bold text-sm flex items-center gap-1.5 ${
                    isLight ? palette.textLight : palette.text
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${palette.dot}`}></span>
                    فواصل وقوافي {formatSurahName(surah.name)}
                  </h4>
                  <div className="space-y-1">
                    {(surah.ayahs?.verseEndings || []).slice(0, 6).map((r, i) => (
                      <div 
                        key={i} 
                        className={`flex items-center justify-between p-2 rounded text-xs font-mono border transition-colors ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'
                        }`}
                      >
                        <span className={`font-quran font-bold text-sm ${isLight ? palette.textLight : palette.textSub}`}>
                          {r.pattern}
                        </span>
                        <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                          {r.count} آية ({r.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EXCLUSIVE WORD VERSES MODAL */}
      {selectedWordModalData && (
        <WordVersesModal
          isOpen={Boolean(selectedWordModalData)}
          onClose={() => setSelectedWordModalData(null)}
          word={selectedWordModalData.word}
          wordItem={selectedWordModalData.wordItem}
          surahName={selectedWordModalData.surah.name}
          surahNumber={selectedWordModalData.surah.number}
          totalSurahAyahs={selectedWordModalData.surah.totalAyahs}
          corpusSurah={selectedWordModalData.corpusSurah}
          lexicalOptions={lexicalOptions}
          onOpenInReader={onOpenInReader}
        />
      )}

    </div>
  );
};

export const SurahComparator = React.memo(SurahComparatorComponent);
