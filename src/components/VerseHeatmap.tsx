import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Flame, 
  Sparkles, 
  Layers, 
  Filter, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Info, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  Eye, 
  Maximize2,
  Hash,
  Compass,
  CheckCircle2,
  TrendingUp,
  Palette
} from 'lucide-react';
import { QuranAyah, SurahData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { formatSurahName } from '../utils/arabic';
import { 
  analyzeSurahVerseHeatmap, 
  HeatmapMetricKey, 
  VerseHeatmapItem 
} from '../utils/verseHeatmapAnalysis';

export interface VerseHeatmapProps {
  surah?: SurahData;
  surahNumber?: number;
  ayahs?: QuranAyah[];
  onOpenInReader?: (surahNumber: number, verseNumber?: number) => void;
  onSelectSurah?: (surah: SurahData) => void;
  allSurahs?: SurahData[];
}

export const VerseHeatmap: React.FC<VerseHeatmapProps> = ({
  surah: propSurah,
  surahNumber: propSurahNumber,
  ayahs: propAyahs,
  onOpenInReader,
  onSelectSurah,
  allSurahs: propAllSurahs
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { corpus, surahs: contextSurahs } = useQuranCorpus();

  const allSurahsList = propAllSurahs || contextSurahs;

  // Resolve current active Surah
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(() => {
    return propSurah?.number || propSurahNumber || 1;
  });

  // Keep synced if prop changes
  useEffect(() => {
    if (propSurah?.number) {
      setSelectedSurahNumber(propSurah.number);
    } else if (propSurahNumber) {
      setSelectedSurahNumber(propSurahNumber);
    }
  }, [propSurah?.number, propSurahNumber]);

  const currentSurahData = useMemo(() => {
    return allSurahsList.find(s => s.number === selectedSurahNumber) || allSurahsList[0];
  }, [allSurahsList, selectedSurahNumber]);

  const currentAyahs = useMemo(() => {
    if (propAyahs && propAyahs.length > 0 && (!propSurah || propSurah.number === selectedSurahNumber)) {
      return propAyahs;
    }
    const foundCorpus = corpus.find(c => c.number === selectedSurahNumber);
    return foundCorpus?.ayahs || [];
  }, [propAyahs, propSurah, corpus, selectedSurahNumber]);

  // Heatmap Configuration States
  const [metricKey, setMetricKey] = useState<HeatmapMetricKey>('wordCount');
  const [palette, setPalette] = useState<'flame' | 'ocean' | 'emerald'>('flame');
  const [cellDensity, setCellDensity] = useState<'compact' | 'standard' | 'detailed'>('standard');
  const [filterTier, setFilterTier] = useState<'all' | 'peak' | 'high' | 'moderate' | 'low'>('all');
  const [sortOrder, setSortOrder] = useState<'verse-order' | 'intensity-desc' | 'intensity-asc'>('verse-order');
  
  // Selected verse for deep inspection
  const [selectedVerseNumber, setSelectedVerseNumber] = useState<number>(1);
  const [hoveredVerse, setHoveredVerse] = useState<VerseHeatmapItem | null>(null);

  // Perform Analysis
  const analysis = useMemo(() => {
    return analyzeSurahVerseHeatmap(currentAyahs, metricKey);
  }, [currentAyahs, metricKey]);

  // Selected verse object
  const activeVerseItem = useMemo(() => {
    return analysis.items.find(it => it.verseNumber === selectedVerseNumber) || analysis.items[0] || null;
  }, [analysis.items, selectedVerseNumber]);

  // Filtered & Sorted items for grid display
  const displayedItems = useMemo(() => {
    let list = [...analysis.items];

    // Filter tier
    if (filterTier === 'peak') {
      list = list.filter(item => item.intensityTier === 'peak');
    } else if (filterTier === 'high') {
      list = list.filter(item => item.intensityTier === 'high' || item.intensityTier === 'peak');
    } else if (filterTier === 'moderate') {
      list = list.filter(item => item.intensityTier === 'moderate');
    } else if (filterTier === 'low') {
      list = list.filter(item => item.intensityTier === 'low');
    }

    // Sort order
    if (sortOrder === 'intensity-desc') {
      list.sort((a, b) => b.metricValue - a.metricValue || a.verseNumber - b.verseNumber);
    } else if (sortOrder === 'intensity-asc') {
      list.sort((a, b) => a.metricValue - b.metricValue || a.verseNumber - b.verseNumber);
    } else {
      list.sort((a, b) => a.verseNumber - b.verseNumber);
    }

    return list;
  }, [analysis.items, filterTier, sortOrder]);

  // Metric Labels and Definitions
  const METRIC_OPTIONS: Array<{ key: HeatmapMetricKey; label: string; unit: string; description: string }> = [
    { 
      key: 'wordCount', 
      label: 'كثافة عدد الكلمات (Word Count)', 
      unit: 'كلمة', 
      description: 'كثافة حجم الآية بعدد كلماتها لفرز المقاطع المطولة مقابل الآيات الإيقاعية الموجزة' 
    },
    { 
      key: 'frequencyScore', 
      label: 'ثقل التكرار المعجمي (Frequency Weight)', 
      unit: 'نقطة', 
      description: 'مجموع تكرار كافة مفردات الآية في عموم السورة، لتحديد الآيات المحملة بأثقل مفردات السورة' 
    },
    { 
      key: 'avgFrequencyScore', 
      label: 'معدل شيوع المفردات (Commonality Rate)', 
      unit: 'معدل', 
      description: 'متوسط تردد مفردات الآية مستقلاً عن طولها لتمييز الآيات ذات المفردات الجارية مقابل النادرة' 
    },
    { 
      key: 'topKeywordsCount', 
      label: 'تركيز الألفاظ المحورية (Top Keywords)', 
      unit: 'لفظة', 
      description: 'عدد المفردات في الآية التي تنتمي لأكثر 10 كلمات تكراراً في السورة' 
    },
    { 
      key: 'lexicalDensity', 
      label: 'الكثافة الحرفية (Chars per Word)', 
      unit: 'حرف/كلمة', 
      description: 'متوسط عدد الحروف في كل كلمة من كلمات الآية لقياس التركيب المعجمي' 
    },
    { 
      key: 'charCount', 
      label: 'كثافة الحروف الكلية (Character Count)', 
      unit: 'حرف', 
      description: 'العدد الإجمالي للحروف المجردة في كل آية' 
    }
  ];

  const currentMetricDef = useMemo(() => {
    return METRIC_OPTIONS.find(m => m.key === metricKey) || METRIC_OPTIONS[0];
  }, [metricKey]);

  // Color interpolation helpers for heatmaps
  const getCellColorStyle = (score: number, tier: 'low' | 'moderate' | 'high' | 'peak') => {
    // Score is 0.0 to 1.0
    const t = Math.max(0, Math.min(1, score));

    if (palette === 'flame') {
      if (isLight) {
        // Light mode Flame: Cool cream/slate -> Soft Amber -> Coral -> Crimson
        if (t < 0.25) return { backgroundColor: '#F1F5F9', color: '#334155', borderColor: '#CBD5E1' };
        if (t < 0.55) return { backgroundColor: '#FEF3C7', color: '#92400E', borderColor: '#FCD34D' };
        if (t < 0.85) return { backgroundColor: '#FED7AA', color: '#9A3412', borderColor: '#FB923C' };
        return { backgroundColor: '#FECDD3', color: '#9F1239', borderColor: '#F43F5E' };
      } else {
        // Dark mode Flame: Dark Slate -> Warm Amber -> Vivid Orange -> Brilliant Rose Red
        if (t < 0.25) return { backgroundColor: '#0F172A', color: '#94A3B8', borderColor: '#1E293B' };
        if (t < 0.55) return { backgroundColor: '#451A03', color: '#FDE68A', borderColor: '#B45309' };
        if (t < 0.85) return { backgroundColor: '#7C2D12', color: '#FFEDD5', borderColor: '#EA580C' };
        return { backgroundColor: '#881337', color: '#FFE4E6', borderColor: '#E11D48' };
      }
    } else if (palette === 'ocean') {
      if (isLight) {
        if (t < 0.25) return { backgroundColor: '#F0F9FF', color: '#0369A1', borderColor: '#BAE6FD' };
        if (t < 0.55) return { backgroundColor: '#E0F2FE', color: '#0284C7', borderColor: '#7DD3FC' };
        if (t < 0.85) return { backgroundColor: '#BAE6FD', color: '#0369A1', borderColor: '#38BDF8' };
        return { backgroundColor: '#7DD3FC', color: '#0C4A6E', borderColor: '#0284C7' };
      } else {
        if (t < 0.25) return { backgroundColor: '#0B132B', color: '#7DD3FC', borderColor: '#1E293B' };
        if (t < 0.55) return { backgroundColor: '#0C2D48', color: '#BAE6FD', borderColor: '#0284C7' };
        if (t < 0.85) return { backgroundColor: '#145DA0', color: '#F0F9FF', borderColor: '#38BDF8' };
        return { backgroundColor: '#1E40AF', color: '#FFFFFF', borderColor: '#60A5FA' };
      }
    } else {
      // Emerald Gold
      if (isLight) {
        if (t < 0.25) return { backgroundColor: '#F0FDF4', color: '#166534', borderColor: '#BBF7D0' };
        if (t < 0.55) return { backgroundColor: '#DCFCE7', color: '#15803D', borderColor: '#86EFAC' };
        if (t < 0.85) return { backgroundColor: '#FEF08A', color: '#854D0E', borderColor: '#FACC15' };
        return { backgroundColor: '#FDE047', color: '#713F12', borderColor: '#EAB308' };
      } else {
        if (t < 0.25) return { backgroundColor: '#064E3B', color: '#A7F3D0', borderColor: '#047857' };
        if (t < 0.55) return { backgroundColor: '#065F46', color: '#D1FAE5', borderColor: '#059669' };
        if (t < 0.85) return { backgroundColor: '#713F12', color: '#FEF08A', borderColor: '#CA8A04' };
        return { backgroundColor: '#854D0E', color: '#FEF9C3', borderColor: '#EAB308' };
      }
    }
  };

  // Step through verses
  const handlePrevVerse = () => {
    if (selectedVerseNumber > 1) {
      setSelectedVerseNumber(prev => prev - 1);
    }
  };

  const handleNextVerse = () => {
    if (selectedVerseNumber < analysis.totalVerses) {
      setSelectedVerseNumber(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-4 font-sans" id="verse-heatmap-container">
      
      {/* 1. HEADER & SURAH SELECTOR */}
      <div className={`p-4 rounded-xl border transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'sci-bg sci-border'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b pb-3 mb-3 border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              palette === 'flame'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : palette === 'ocean'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}>
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base sm:text-lg font-bold font-quran flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}>
                  <span>خريطة الكثافة المعجمية للآيات (Verse Word Frequency Heatmap)</span>
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  currentSurahData.isMeccan
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                }`}>
                  {currentSurahData.isMeccan ? 'مكية' : 'مدنية'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                مصفوفة حرارية شبكية ترصد تدرج وتوزيع الكثافة المعجمية عبر آيات {formatSurahName(currentSurahData.name)} الـ {currentSurahData.totalAyahs}
              </p>
            </div>
          </div>

          {/* Quick Surah Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-400 font-mono shrink-0">السورة:</span>
            <select
              id="select-heatmap-surah"
              aria-label="اختر السورة لعرض خريطة الكثافة المعجمية"
              value={selectedSurahNumber}
              onChange={(e) => {
                const num = Number(e.target.value);
                setSelectedSurahNumber(num);
                setSelectedVerseNumber(1);
                const s = allSurahsList.find(item => item.number === num);
                if (s && onSelectSurah) onSelectSurah(s);
              }}
              className={`w-full md:w-56 font-quran font-bold text-sm px-3 py-1.5 rounded-lg border focus:outline-none transition-colors cursor-pointer ${
                isLight 
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500' 
                  : 'bg-black/60 border-slate-700 text-slate-100 focus:border-sky-400'
              }`}
            >
              {allSurahsList.map(s => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name} ({s.totalAyahs} آية)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. STATISTICAL BENCHMARKS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-xs">
          <div className={`p-2.5 rounded-lg border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'
          }`}>
            <div className="text-[10px] text-slate-400 uppercase">إجمالي الآيات</div>
            <div className={`text-base font-bold mt-0.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{analysis.totalVerses} آية</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{analysis.totalWords.toLocaleString('en-US')} كلمة</div>
          </div>

          <div className={`p-2.5 rounded-lg border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'
          }`}>
            <div className="text-[10px] text-slate-400 uppercase">المفردات المعجمية المستقلة</div>
            <div className="text-base font-bold text-sky-400 mt-0.5">{analysis.uniqueVocabularyCount.toLocaleString('en-US')}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">لفظة فريدة</div>
          </div>

          <div className={`p-2.5 rounded-lg border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'
          }`}>
            <div className="text-[10px] text-amber-400 uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>ذروة الكثافة (Max)</span>
            </div>
            <div className="text-base font-bold text-amber-300 mt-0.5">
              {analysis.maxVal} {currentMetricDef.unit}
            </div>
            <button
              type="button"
              onClick={() => setSelectedVerseNumber(analysis.peakVerseNumber)}
              className="text-[10px] text-amber-400/80 hover:text-amber-300 underline cursor-pointer mt-0.5 block truncate"
            >
              الآية رقم {analysis.peakVerseNumber} (انقر للفحص)
            </button>
          </div>

          <div className={`p-2.5 rounded-lg border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'
          }`}>
            <div className="text-[10px] text-slate-400 uppercase">المتوسط الحسابي (Mean)</div>
            <div className={`text-base font-bold mt-0.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{analysis.avgVal} {currentMetricDef.unit}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">لكل آية</div>
          </div>

          <div className={`p-2.5 rounded-lg border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'
          }`}>
            <div className="text-[10px] text-slate-400 uppercase">الانحراف المعياري (σ)</div>
            <div className="text-base font-bold text-cyan-400 mt-0.5">±{analysis.stdDev}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">مدى التفاوت الهيكلي</div>
          </div>

          <div className={`p-2.5 rounded-lg border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'
          }`}>
            <div className="text-[10px] text-slate-400 uppercase">أدنى كثافة (Min)</div>
            <div className={`text-base font-bold mt-0.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{analysis.minVal} {currentMetricDef.unit}</div>
            <button
              type="button"
              onClick={() => setSelectedVerseNumber(analysis.lowestVerseNumber)}
              className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer mt-0.5 block truncate"
            >
              الآية رقم {analysis.lowestVerseNumber} (إيجاز)
            </button>
          </div>
        </div>

      </div>

      {/* 3. CONTROLS BAR: METRIC LENS, PALETTE, TIER FILTERS & DENSITY */}
      <div className={`p-3 rounded-xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs font-mono transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0A0D12] border-slate-800'
      }`}>
        
        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          <span className="text-[11px] text-slate-400 ml-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
            <span>عدسة الكثافة:</span>
          </span>
          {METRIC_OPTIONS.map(opt => {
            const active = metricKey === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setMetricKey(opt.key)}
                className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                  active
                    ? isLight 
                      ? 'bg-sky-500 text-white font-bold shadow-sm' 
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                    : isLight
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={opt.description}
              >
                {opt.label.split('(')[0]}
              </button>
            );
          })}
        </div>

        {/* View Options: Palette, Filter Tier, Density */}
        <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-between lg:justify-end">
          
          {/* Palette Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">الطيف:</span>
            <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded border border-slate-800">
              <button
                type="button"
                onClick={() => setPalette('flame')}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                  palette === 'flame' ? 'bg-amber-500/30 text-amber-300 font-bold' : 'text-slate-400'
                }`}
                title="طيف ناري متدرج"
              >
                حراري
              </button>
              <button
                type="button"
                onClick={() => setPalette('ocean')}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                  palette === 'ocean' ? 'bg-sky-500/30 text-sky-300 font-bold' : 'text-slate-400'
                }`}
                title="طيف أزرق لازوردي"
              >
                سماوي
              </button>
              <button
                type="button"
                onClick={() => setPalette('emerald')}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                  palette === 'emerald' ? 'bg-emerald-500/30 text-emerald-300 font-bold' : 'text-slate-400'
                }`}
                title="طيف زمردي ذهبي"
              >
                زمردي
              </button>
            </div>
          </div>

          {/* Filter Tier */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">تصفية:</span>
            <select
              id="select-heatmap-filter-tier"
              aria-label="تصفية حسب مستوى الكثافة"
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value as any)}
              className={`text-[11px] px-2 py-1 rounded border focus:outline-none cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              <option value="all">كافة الآيات ({analysis.totalVerses})</option>
              <option value="peak">مناطق الذروة فقط (Peak &gt;85%)</option>
              <option value="high">مرتفعة الكثافة (&gt;60%)</option>
              <option value="moderate">متوسطة الكثافة (30%-60%)</option>
              <option value="low">منخفضة / موجزة (&lt;30%)</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">الترتيب:</span>
            <button
              type="button"
              onClick={() => {
                if (sortOrder === 'verse-order') setSortOrder('intensity-desc');
                else if (sortOrder === 'intensity-desc') setSortOrder('intensity-asc');
                else setSortOrder('verse-order');
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded border cursor-pointer ${
                sortOrder !== 'verse-order'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                  : 'bg-slate-900 text-slate-300 border-slate-800'
              }`}
              title="تغيير نظام ترتيب الخلايا"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>
                {sortOrder === 'verse-order' && 'المصحف (1..ن)'}
                {sortOrder === 'intensity-desc' && 'الأعلى كثافة أولاً'}
                {sortOrder === 'intensity-asc' && 'الأقل كثافة أولاً'}
              </span>
            </button>
          </div>

          {/* Density Mode */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 bg-black/30 p-0.5 rounded border border-slate-800">
              <button
                type="button"
                onClick={() => setCellDensity('compact')}
                className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${cellDensity === 'compact' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
                title="خلايا مدمجة وصغيرة"
              >
                مدمج
              </button>
              <button
                type="button"
                onClick={() => setCellDensity('standard')}
                className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${cellDensity === 'standard' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
                title="خلايا قياسية مع الأرقام"
              >
                قياسي
              </button>
              <button
                type="button"
                onClick={() => setCellDensity('detailed')}
                className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${cellDensity === 'detailed' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
                title="بطاقات موسعة"
              >
                مفصل
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 4. THE MAIN HEATMAP GRID & LEGEND */}
      <div className={`p-4 rounded-xl border transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'sci-bg sci-border'
      }`}>
        
        {/* Heatmap Legend Bar */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 mb-3 border-b font-mono text-xs ${
          isLight ? 'border-slate-200' : 'border-slate-800/80'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>مقياس التدرج اللوني (Intensity Spectrum):</span>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>({currentMetricDef.label})</span>
          </div>

          {/* Color Ramp Bar with Ticks */}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>أقل ({analysis.minVal})</span>
            <div className={`w-36 sm:w-48 h-3 rounded-full overflow-hidden flex border ${
              isLight ? 'border-slate-300' : 'border-slate-700/80'
            }`}>
              {palette === 'flame' ? (
                isLight ? (
                  <>
                    <div className="w-1/4 h-full bg-[#F1F5F9]" title="منخفض" />
                    <div className="w-1/4 h-full bg-[#FEF3C7]" title="متوسط" />
                    <div className="w-1/4 h-full bg-[#FED7AA]" title="مرتفع" />
                    <div className="w-1/4 h-full bg-[#FECDD3]" title="ذروة" />
                  </>
                ) : (
                  <>
                    <div className="w-1/4 h-full bg-[#1E293B]" title="منخفض" />
                    <div className="w-1/4 h-full bg-[#B45309]" title="متوسط" />
                    <div className="w-1/4 h-full bg-[#EA580C]" title="مرتفع" />
                    <div className="w-1/4 h-full bg-[#E11D48]" title="ذروة" />
                  </>
                )
              ) : palette === 'ocean' ? (
                isLight ? (
                  <>
                    <div className="w-1/4 h-full bg-[#F0F9FF]" title="منخفض" />
                    <div className="w-1/4 h-full bg-[#E0F2FE]" title="متوسط" />
                    <div className="w-1/4 h-full bg-[#BAE6FD]" title="مرتفع" />
                    <div className="w-1/4 h-full bg-[#7DD3FC]" title="ذروة" />
                  </>
                ) : (
                  <>
                    <div className="w-1/4 h-full bg-[#0C2D48]" title="منخفض" />
                    <div className="w-1/4 h-full bg-[#145DA0]" title="متوسط" />
                    <div className="w-1/4 h-full bg-[#0284C7]" title="مرتفع" />
                    <div className="w-1/4 h-full bg-[#60A5FA]" title="ذروة" />
                  </>
                )
              ) : (
                isLight ? (
                  <>
                    <div className="w-1/4 h-full bg-[#F0FDF4]" title="منخفض" />
                    <div className="w-1/4 h-full bg-[#DCFCE7]" title="متوسط" />
                    <div className="w-1/4 h-full bg-[#FEF08A]" title="مرتفع" />
                    <div className="w-1/4 h-full bg-[#FDE047]" title="ذروة" />
                  </>
                ) : (
                  <>
                    <div className="w-1/4 h-full bg-[#064E3B]" title="منخفض" />
                    <div className="w-1/4 h-full bg-[#059669]" title="متوسط" />
                    <div className="w-1/4 h-full bg-[#CA8A04]" title="مرتفع" />
                    <div className="w-1/4 h-full bg-[#EAB308]" title="ذروة" />
                  </>
                )
              )}
            </div>
            <span className={`text-[10px] font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>ذروة ({analysis.maxVal})</span>
          </div>
        </div>

        {/* Heatmap Interactive Grid */}
        <div className="relative">
          {displayedItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-mono space-y-2">
              <Info className="w-6 h-6 mx-auto text-slate-500" />
              <p>لا توجد آيات مطابقة للتصفية المختارة.</p>
              <button
                type="button"
                onClick={() => setFilterTier('all')}
                className="text-xs text-sky-400 underline cursor-pointer"
              >
                إعادة ضبط التصفية لعرض الكل
              </button>
            </div>
          ) : cellDensity === 'compact' ? (
            /* COMPACT GRID: Micro tiles */
            <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-18 xl:grid-cols-24 gap-1.5 max-h-[500px] overflow-y-auto p-1">
              {displayedItems.map(item => {
                const isSelected = item.verseNumber === selectedVerseNumber;
                const style = getCellColorStyle(item.normalizedScore, item.intensityTier);
                return (
                  <button
                    key={item.verseNumber}
                    type="button"
                    onClick={() => setSelectedVerseNumber(item.verseNumber)}
                    onMouseEnter={() => setHoveredVerse(item)}
                    onMouseLeave={() => setHoveredVerse(null)}
                    style={style}
                    className={`h-9 rounded-md border flex flex-col items-center justify-center font-mono text-[10px] transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'ring-2 ring-sky-400 scale-105 z-10 font-bold shadow-lg'
                        : 'hover:scale-105 hover:z-10'
                    }`}
                    title={`الآية ${item.verseNumber}: ${item.metricValue} ${currentMetricDef.unit}`}
                  >
                    <span className="leading-none">{item.verseNumber}</span>
                    {item.intensityTier === 'peak' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5 animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : cellDensity === 'standard' ? (
            /* STANDARD GRID: Tiles with Verse Number & Metric Value */
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 xl:grid-cols-16 gap-2 max-h-[540px] overflow-y-auto p-1">
              {displayedItems.map(item => {
                const isSelected = item.verseNumber === selectedVerseNumber;
                const style = getCellColorStyle(item.normalizedScore, item.intensityTier);
                return (
                  <button
                    key={item.verseNumber}
                    type="button"
                    onClick={() => setSelectedVerseNumber(item.verseNumber)}
                    onMouseEnter={() => setHoveredVerse(item)}
                    onMouseLeave={() => setHoveredVerse(null)}
                    style={style}
                    className={`p-1.5 h-14 rounded-lg border flex flex-col justify-between font-mono text-right transition-all cursor-pointer relative ${
                      isSelected
                        ? 'ring-2 ring-sky-400 scale-105 z-10 font-bold shadow-lg'
                        : 'hover:scale-102 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full text-[10px] opacity-80 leading-none">
                      <span className="font-bold">آية {item.verseNumber}</span>
                      {item.intensityTier === 'peak' ? (
                        <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                      ) : (
                        <span className="text-[9px]">#{item.rankInSurah}</span>
                      )}
                    </div>
                    
                    <div className="flex items-baseline justify-between w-full mt-0.5">
                      <span className="text-xs font-bold leading-tight">
                        {item.metricValue}
                      </span>
                      <span className="text-[8px] opacity-75">
                        {currentMetricDef.unit}
                      </span>
                    </div>

                    {/* Micro bar representing intensity */}
                    <div className="w-full bg-black/20 h-1 rounded-full overflow-hidden mt-0.5">
                      <div 
                        className="h-full bg-current opacity-70 rounded-full" 
                        style={{ width: `${Math.max(8, item.normalizedScore * 100)}%` }} 
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* DETAILED GRID: Expanded Cards with text snippet */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[560px] overflow-y-auto p-1">
              {displayedItems.map(item => {
                const isSelected = item.verseNumber === selectedVerseNumber;
                const style = getCellColorStyle(item.normalizedScore, item.intensityTier);
                return (
                  <button
                    key={item.verseNumber}
                    type="button"
                    onClick={() => setSelectedVerseNumber(item.verseNumber)}
                    onMouseEnter={() => setHoveredVerse(item)}
                    onMouseLeave={() => setHoveredVerse(null)}
                    style={style}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'ring-2 ring-sky-400 scale-101 z-10 font-bold shadow-lg'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs border-b border-current/20 pb-1.5">
                      <span className="font-bold">آية رقم {item.verseNumber}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20">
                          المرتبة {item.rankInSurah}
                        </span>
                        <span className="font-bold">
                          {item.metricValue} {currentMetricDef.unit}
                        </span>
                      </div>
                    </div>

                    <div className="font-quran text-xs line-clamp-2 leading-relaxed opacity-95">
                      « {item.textUthmani || item.textSimple} »
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono opacity-80 pt-1 border-t border-current/15">
                      <span>{item.wordCount} كلمة • {item.charCount} حرف</span>
                      <span>تكرار معجمي: {item.frequencyScore}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Hovered cell quick tooltip bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            {hoveredVerse ? (
              <span>
                معاينة مؤشر الفأرة: <strong className="text-sky-300">الآية {hoveredVerse.verseNumber}</strong> — {hoveredVerse.wordCount} كلمة ({hoveredVerse.metricValue} {currentMetricDef.unit}) — المرتبة {hoveredVerse.rankInSurah} من {analysis.totalVerses}
              </span>
            ) : (
              <span>مرر الفأرة فوق أي خلية لمعاينة مؤشراتها، وانقر عليها لفحص مفرداتها بالتفصيل.</span>
            )}
          </div>
          <div className="text-[10px] text-slate-500">
            المعروض: {displayedItems.length} من {analysis.totalVerses} آية
          </div>
        </div>

      </div>

      {/* 5. ACTIVE VERSE INSPECTOR CARD (فحص الآية المحددة بالتفصيل وسحابة المفردات) */}
      {activeVerseItem && (
        <div className={`p-4 sm:p-5 rounded-xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'sci-bg sci-border border-sky-500/30'
        }`}>
          
          {/* Header & Navigation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3 font-mono">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold shrink-0">
                {activeVerseItem.verseNumber}
              </div>
              <div>
                <h3 className={`text-sm font-bold flex items-center gap-2 font-quran ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}>
                  <span>فحص الآية رقم {activeVerseItem.verseNumber} من سورة {currentSurahData.name}</span>
                  {activeVerseItem.intensityTier === 'peak' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      ذروة الكثافة ⚡
                    </span>
                  )}
                </h3>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>الجزء {activeVerseItem.juz}</span>
                  <span>•</span>
                  <span>الصفحة {activeVerseItem.page}</span>
                  <span>•</span>
                  <span>المرتبة {activeVerseItem.rankInSurah} من أصل {analysis.totalVerses} آية في مقياس {currentMetricDef.label.split('(')[0]}</span>
                </div>
              </div>
            </div>

            {/* Stepper buttons */}
            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <button
                type="button"
                onClick={handlePrevVerse}
                disabled={selectedVerseNumber <= 1}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 text-xs"
                title="الآية السابقة"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="hidden sm:inline">السابقة</span>
              </button>

              <button
                type="button"
                onClick={handleNextVerse}
                disabled={selectedVerseNumber >= analysis.totalVerses}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 text-xs"
                title="الآية التالية"
              >
                <span className="hidden sm:inline">التالية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>

              {onOpenInReader && (
                <button
                  type="button"
                  onClick={() => onOpenInReader(selectedSurahNumber, activeVerseItem.verseNumber)}
                  className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ml-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>فتح في المصحف</span>
                </button>
              )}
            </div>
          </div>

          {/* Full Quranic Verse Display */}
          <div 
            className={`quran-ayah-container p-4 sm:p-5 rounded-xl border text-center font-quran text-base sm:text-lg md:text-xl leading-[2.2] sm:leading-[2.5] select-text shadow-inner ${
              isLight 
                ? 'bg-slate-50 border-slate-200 text-slate-900' 
                : 'bg-black/40 border-slate-800/80 text-slate-100'
            }`}
            dir="rtl"
          >
            <span className="opacity-60 select-none">« </span>
            {activeVerseItem.textUthmani || activeVerseItem.textSimple}
            <span className="opacity-60 select-none"> »</span>
            {' '}
            <span className="inline-block mr-1 text-sky-500 text-sm font-mono font-bold select-none" dir="ltr">
              ﴿{activeVerseItem.verseNumber}﴾
            </span>
          </div>

          {/* Metric Badges for the Active Verse */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3 font-mono text-xs">
            <div className={`p-2.5 rounded-lg border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'
            }`}>
              <span className="text-[10px] text-slate-400 uppercase">حجم الكلمات</span>
              <div className="text-base font-bold text-sky-400 mt-0.5">{activeVerseItem.wordCount} كلمة</div>
              <div className="text-[10px] text-slate-500">{activeVerseItem.uniqueWordsCount} مفردة فريدة بالآية</div>
            </div>

            <div className={`p-2.5 rounded-lg border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'
            }`}>
              <span className="text-[10px] text-slate-400 uppercase">مجموع تكرار الألفاظ بالسور</span>
              <div className="text-base font-bold text-emerald-400 mt-0.5">{activeVerseItem.frequencyScore} نقطة</div>
              <div className="text-[10px] text-slate-500">معدل الشيوع: {activeVerseItem.avgFrequencyScore}</div>
            </div>

            <div className={`p-2.5 rounded-lg border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'
            }`}>
              <span className="text-[10px] text-slate-400 uppercase">الألفاظ المحورية بالآية</span>
              <div className="text-base font-bold text-amber-400 mt-0.5">{activeVerseItem.topKeywordsCount} كلمات</div>
              <div className="text-[10px] text-slate-500">من أكثر 10 كلمات بالسورة</div>
            </div>

            <div className={`p-2.5 rounded-lg border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'
            }`}>
              <span className="text-[10px] text-slate-400 uppercase">الحروف والكثافة</span>
              <div className="text-base font-bold text-cyan-400 mt-0.5">{activeVerseItem.charCount} حرف</div>
              <div className="text-[10px] text-slate-500">معدل {activeVerseItem.lexicalDensity} حرف/كلمة</div>
            </div>
          </div>

          {/* Interactive Word-by-Word Frequency Breakdown */}
          <div className="space-y-2 pt-1 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className={`font-bold flex items-center gap-1.5 ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>سحابة مفردات الآية وترددها بالسورة (Word Breakdown):</span>
              </span>
              <span className="text-[10px] text-slate-400">
                انقر أو مرر على أي كلمة لعرض عدد تكراراتها في كامل السورة
              </span>
            </div>

            <div className={`flex flex-wrap items-center gap-1.5 p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-slate-800/80'
            }`}>
              {activeVerseItem.words.map((w, wIdx) => {
                const isHighFreq = w.countInSurah > 10;
                return (
                  <div
                    key={wIdx}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all select-none ${
                      w.isTopKeyword
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 font-bold shadow-sm'
                        : isHighFreq
                        ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                        : w.isHapax
                        ? isLight ? 'bg-slate-200/80 text-slate-600 border-slate-300' : 'bg-slate-800/80 text-slate-400 border-slate-700'
                        : isLight ? 'bg-white text-slate-800 border-slate-300 shadow-xs' : 'bg-slate-900 text-slate-200 border-slate-800'
                    }`}
                    title={`الكلمة: «${w.clean}» — تكررت ${w.countInSurah} مرة في ${formatSurahName(currentSurahData.name)}${w.isTopKeyword ? ' (من الكلمات المحورية)' : ''}`}
                  >
                    <span className={`font-quran font-bold text-sm ${
                      isLight ? 'text-slate-900' : 'text-slate-100'
                    }`}>{w.raw}</span>
                    <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                      w.isTopKeyword 
                        ? 'bg-amber-400/20 text-amber-300' 
                        : isLight ? 'bg-slate-200 text-slate-700' : 'bg-black/30 text-slate-400'
                    }`}>
                      ×{w.countInSurah}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* 6. SURAH HOTSPOTS VS SPARSE REGIONS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
        
        {/* Top 5 Hotspots */}
        <div className={`p-3.5 rounded-xl border space-y-2.5 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'sci-bg sci-border'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>أعلى 5 آيات في مؤشر {currentMetricDef.label.split('(')[0]}</span>
            </span>
            <span className="text-[10px] text-slate-400">مناطق الذروة المعجمية</span>
          </div>

          <div className="space-y-1.5">
            {analysis.topVerses.map((v, i) => (
              <button
                key={v.verseNumber}
                type="button"
                onClick={() => setSelectedVerseNumber(v.verseNumber)}
                className={`w-full p-2 rounded-lg border text-right transition-all flex items-center justify-between cursor-pointer ${
                  v.verseNumber === selectedVerseNumber
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold'
                    : isLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-[#0A0D12] border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-bold">آية {v.verseNumber}:</span>
                  <span className="font-quran text-xs text-slate-400 truncate">« {v.snippet} »</span>
                </div>
                <div className="font-bold text-amber-400 shrink-0 mr-2">
                  {v.metricValue} {currentMetricDef.unit}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Top 5 Lowest (Concise / Rare) */}
        <div className={`p-3.5 rounded-xl border space-y-2.5 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'sci-bg sci-border'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="font-bold text-sky-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>أوجز 5 آيات في مؤشر {currentMetricDef.label.split('(')[0]}</span>
            </span>
            <span className="text-[10px] text-slate-400">الآيات الأكثر إيجازاً</span>
          </div>

          <div className="space-y-1.5">
            {analysis.bottomVerses.map((v, i) => (
              <button
                key={v.verseNumber}
                type="button"
                onClick={() => setSelectedVerseNumber(v.verseNumber)}
                className={`w-full p-2 rounded-lg border text-right transition-all flex items-center justify-between cursor-pointer ${
                  v.verseNumber === selectedVerseNumber
                    ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 font-bold'
                    : isLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-[#0A0D12] border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-5 h-5 rounded bg-sky-500/20 text-sky-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-bold">آية {v.verseNumber}:</span>
                  <span className="font-quran text-xs text-slate-400 truncate">« {v.snippet} »</span>
                </div>
                <div className="font-bold text-slate-300 shrink-0 mr-2">
                  {v.metricValue} {currentMetricDef.unit}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
