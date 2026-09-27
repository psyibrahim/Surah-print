import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  BarChart2, 
  Layers, 
  Network, 
  CheckCircle2, 
  AlertCircle, 
  Hash, 
  Type, 
  Activity,
  ArrowRight,
  GitCompare,
  Percent,
  Sliders,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Scale,
  Settings,
  Check,
  RotateCcw,
  Compass,
  FileText,
  LayoutGrid,
  Info,
  Flame,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Lock
} from 'lucide-react';
import { SurahData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { calculateSurahGoldenRatio, GoldenRatioMetrics } from '../utils/goldenRatio';
import { formatSurahName } from '../utils/arabic';
import { ChartMidpointMarker } from './ChartMidpointMarker';
import { 
  LexicalFilterOptions, 
  DEFAULT_LEXICAL_OPTIONS, 
  analyzeSurahLexicon,
  WordFrequencyItem 
} from '../utils/lexicalFilters';
import { WordVersesModal } from './WordVersesModal';
import { LexicalFilterControlPanel } from './LexicalFilterControlPanel';
import { getSurahClusterDisplayInfo } from '../data/sahabaClusters';
import { SurahVerseLetterDistribution } from './SurahVerseLetterDistribution';
import { VerseHeatmap } from './VerseHeatmap';
import { VerseLengthHistogram } from './VerseLengthHistogram';
import { SurahGoldenRatioSection } from './SurahGoldenRatioSection';
import { SurahSimilarityExplorer } from './SurahSimilarityExplorer';
import { SectionHelpButton } from './SectionHelpModal';
import { MathTooltip } from './MathTooltip';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export interface MetricDefinition {
  id: string;
  label: string;
  category: 'أساسية' | 'معجمية' | 'إيقاعية ورياضية';
  getValue: (surah: SurahData, golden?: GoldenRatioMetrics | null) => string | number;
  suffix?: string;
  description: string;
  colorClass: string;
  mathMetricId?: string;
}

const AVAILABLE_METRICS: MetricDefinition[] = [
  {
    id: 'totalAyahs',
    label: 'عدد الآيات',
    category: 'أساسية',
    getValue: (s) => s.totalAyahs,
    suffix: 'آية',
    description: 'العدد الإجمالي لآيات السورة الكريمة',
    colorClass: 'text-sky-300'
  },
  {
    id: 'totalWords',
    label: 'إجمالي الكلمات',
    category: 'أساسية',
    getValue: (s) => s.totalWords.toLocaleString('en-US'),
    suffix: 'كلمة',
    description: 'المجموع الكلي لألفاظ السورة',
    colorClass: 'text-cyan-300'
  },
  {
    id: 'totalChars',
    label: 'إجمالي الحروف',
    category: 'أساسية',
    getValue: (s) => s.totalChars.toLocaleString('en-US'),
    suffix: 'حرف',
    description: 'العدد الكلي لحروف السورة بالرسم المجرد',
    colorClass: 'text-indigo-300'
  },
  {
    id: 'vocabularyDiversity',
    label: 'تنوع المفردات (TTR)',
    category: 'معجمية',
    getValue: (s) => s.vocabularyDiversity,
    suffix: '%',
    description: 'نسبة المفردات الفريدة إلى مجموع الكلمات الكلي (V/N)',
    colorClass: 'text-emerald-300',
    mathMetricId: 'ttr'
  },
  {
    id: 'guiraudIndex',
    label: 'مؤشر جيراود المعدّل',
    category: 'معجمية',
    getValue: (s) => {
      const N = s.totalWords || 1;
      const V = Math.round(((s.vocabularyDiversity || 0) / 100) * N);
      return (V / Math.sqrt(N)).toFixed(2);
    },
    suffix: 'R',
    description: 'مقياس التنوع المعجمي المعدل لتحييد أثر طول السورة: V / √N',
    colorClass: 'text-teal-300',
    mathMetricId: 'guiraudIndex'
  },
  {
    id: 'herdanC',
    label: 'مؤشر هيردان اللوغاريتمي',
    category: 'معجمية',
    getValue: (s) => {
      const N = s.totalWords || 1;
      const V = Math.max(1, Math.round(((s.vocabularyDiversity || 0) / 100) * N));
      if (N <= 1) return '1.00';
      return (Math.log(V) / Math.log(N)).toFixed(3);
    },
    suffix: 'C',
    description: 'معامل التكافؤ اللوغاريتمي لغنى المعجم: log(V) / log(N)',
    colorClass: 'text-cyan-300',
    mathMetricId: 'herdanC'
  },
  {
    id: 'uniqueWordsCount',
    label: 'المفردات الفريدة',
    category: 'معجمية',
    getValue: (s) => s.uniqueWordsCount.toLocaleString('en-US'),
    suffix: 'لفظة',
    description: 'عدد الألفاظ المستقلة دون تكرار',
    colorClass: 'text-teal-300'
  },
  {
    id: 'avgAyahLengthWords',
    label: 'متوسط طول الآية',
    category: 'إيقاعية ورياضية',
    getValue: (s) => s.avgAyahLengthWords,
    suffix: 'كلمة/آية',
    description: 'المعدل الحسابي لطول الآية الواحدة بالكلمات',
    colorClass: 'text-sky-400',
    mathMetricId: 'avgAyahLengthWords'
  },
  {
    id: 'avgWordLength',
    label: 'متوسط طول الكلمة',
    category: 'معجمية',
    getValue: (s) => s.avgWordLength,
    suffix: 'حرف/كلمة',
    description: 'متوسط عدد الحروف في كل كلمة',
    colorClass: 'text-cyan-400',
    mathMetricId: 'avgWordLength'
  },
  {
    id: 'verseLengthStdDev',
    label: 'الانحراف المعياري (σ)',
    category: 'إيقاعية ورياضية',
    getValue: (s) => `± ${s.verseLengthStdDev}`,
    description: 'مقياس تشتت أطوال الآيات ومدى تباينها حول المتوسط',
    colorClass: 'text-amber-300',
    mathMetricId: 'verseLengthStdDev'
  },
  {
    id: 'isUniform',
    label: 'مؤشر انتظام الإيقاع',
    category: 'إيقاعية ورياضية',
    getValue: (s) => s.isUniform ? 'فائق الانتظام' : 'تنوع تركيبي',
    description: 'تصنيف مدى اتساق المقاطع الصوتية وتماثلها',
    colorClass: 'text-emerald-400'
  },
  {
    id: 'goldenRatioConvergence',
    label: 'تناسق النسبة الذهبية (φ)',
    category: 'إيقاعية ورياضية',
    getValue: (s, g) => g ? `${g.ayahsPhiConvergencePct}%` : '1.618',
    suffix: 'اتساق',
    description: 'مدى تقارب تقسيم السورة مع النسبة الذهبية الإلهية φ',
    colorClass: 'text-amber-400 font-bold',
    mathMetricId: 'goldenRatioConvergence'
  },
  {
    id: 'goldenAyahNumber',
    label: 'آية القطع الذهبي',
    category: 'إيقاعية ورياضية',
    getValue: (s, g) => g ? `آية ${g.goldenAyahNumber}` : `آية ${Math.round(s.totalAyahs * 0.618)}`,
    description: 'موضع نقطة الاتزان الرياضي الذهبي (61.8٪)',
    colorClass: 'text-amber-300',
    mathMetricId: 'goldenAyahNumber'
  },
  {
    id: 'absentCount',
    label: 'الحروف الغائبة',
    category: 'أساسية',
    getValue: (s) => s.letters.absentCount,
    suffix: 'حرف غائب',
    description: 'عدد الحروف الأبجدية التي لم ترد في السورة',
    colorClass: 'text-rose-400',
    mathMetricId: 'absentLetters'
  },
  {
    id: 'cluster',
    label: 'العنقود (تحزيب الصحابة)',
    category: 'إيقاعية ورياضية',
    getValue: (s) => getSurahClusterDisplayInfo(s.number).shortLabel,
    description: 'العناقيد السبعة المأثورة لتحزيب الصحابة (فَمِي بِشَوْقٍ) واستقلال الفاتحة',
    colorClass: 'text-amber-300',
    mathMetricId: 'kmeansCluster'
  },
  {
    id: 'revelationType',
    label: 'مكان النزول',
    category: 'أساسية',
    getValue: (s) => s.isMeccan ? 'مكية' : 'مدنية',
    description: 'تحديد عهد التنزيل المكي أو المدني',
    colorClass: 'text-sky-300'
  },
];

const DEFAULT_METRIC_IDS = [
  'totalAyahs',
  'totalWords',
  'totalChars',
  'vocabularyDiversity',
  'avgAyahLengthWords',
  'goldenRatioConvergence',
  'isUniform',
  'absentCount'
];

export interface SurahDetailModalProps {
  surah: SurahData | null;
  onClose?: () => void;
  onBack?: () => void;
  onCompareWith: (surahNumber: number) => void;
  onOpenInReader?: (surahNumber: number) => void;
  allSurahs: SurahData[];
  onSelectSurah: (surah: SurahData) => void;
}

export const SurahDetailModal: React.FC<SurahDetailModalProps> = ({
  surah: initialSurah,
  onClose,
  onBack,
  onCompareWith,
  onOpenInReader,
  allSurahs: propAllSurahs,
  onSelectSurah
}) => {
  const handleBack = onBack || onClose || (() => {});
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { 
    corpus, 
    surahs, 
    activeMushaf, 
    activeMeta,
    kufiDataset,
    madaniDataset 
  } = useQuranCorpus();

  // Radical dataset isolation: resolve the exact surah object and list from the active mushaf
  // Every calculation is strictly bound to the active count with zero data mixing!
  const surah = useMemo(() => {
    return surahs.find(s => s.number === initialSurah.number) || initialSurah;
  }, [surahs, initialSurah]);

  const allSurahs = surahs;

  const [activeTab, setActiveTab] = useState<'letters' | 'verse-letters' | 'verse-heatmap' | 'words' | 'ayahs' | 'golden' | 'similarity'>('letters');
  const [letterSortBy, setLetterSortBy] = useState<'alphabet' | 'frequency'>('frequency');
  // Default state: collapsed (مطويا افتراضياً) as requested
  const [showMetricsStrip, setShowMetricsStrip] = useState<boolean>(false);
  const [showMetricConfig, setShowMetricConfig] = useState<boolean>(false);

  // Always reset metrics strip to folded when navigating to or opening a surah
  useEffect(() => {
    setShowMetricsStrip(false);
    setShowMetricConfig(false);
  }, [surah?.number]);

  // State for opening exclusively matching verses when clicking a word in top words
  const [selectedWordForModal, setSelectedWordForModal] = useState<{
    word: string;
    wordItem?: WordFrequencyItem;
  } | null>(null);

  const activeTabGuideId = 
    activeTab === 'letters' ? 'surah-detail-letters' :
    activeTab === 'verse-letters' ? 'surah-detail-verse-letters' :
    activeTab === 'verse-heatmap' ? 'surah-detail-verse-heatmap' :
    activeTab === 'words' ? 'surah-detail-words' :
    activeTab === 'ayahs' ? 'surah-detail-ayahs' :
    activeTab === 'golden' ? 'surah-detail-golden' :
    activeTab === 'similarity' ? 'surah-detail-similarity' : 'surah-detail-overview';

  const activeTabGuideLabel = 
    activeTab === 'letters' ? 'استعلام: بصمة الحروف والتشكيل' :
    activeTab === 'verse-letters' ? 'استعلام: الحروف بالآيات' :
    activeTab === 'verse-heatmap' ? 'استعلام: الكثافة المعجمية' :
    activeTab === 'words' ? 'استعلام: بصمة الكلمات والمعجم' :
    activeTab === 'ayahs' ? 'استعلام: الآيات والقوافي' :
    activeTab === 'golden' ? 'استعلام: النسبة الذهبية والاتزان' :
    activeTab === 'similarity' ? 'استعلام: التشابه والعلاقات' : 'استعلام وشرح هذا القسم';

  // User-chosen metrics for session
  const [preferredMetrics, setPreferredMetrics] = useState<string[]>(DEFAULT_METRIC_IDS);

  const toggleMetric = (id: string) => {
    if (preferredMetrics.includes(id)) {
      if (preferredMetrics.length <= 1) return; // Keep at least one
      setPreferredMetrics(preferredMetrics.filter(m => m !== id));
    } else {
      setPreferredMetrics([...preferredMetrics, id]);
    }
  };

  const tabContainerRef = useRef<HTMLDivElement | null>(null);

  // Retrieve current surah ayahs strictly from active corpus
  const currentCorpusSurah = useMemo(() => {
    if (!surah) return null;
    return corpus.find(c => c.number === surah.number) || null;
  }, [corpus, surah?.number]);

  const currentAyahs = useMemo(() => {
    return currentCorpusSurah?.ayahs || [];
  }, [currentCorpusSurah]);

  // Calculate Golden Ratio metrics (only when 'golden' tab is active)
  const goldenMetrics = useMemo(() => {
    if (!surah || activeTab !== 'golden') return null;
    return calculateSurahGoldenRatio(surah, currentAyahs);
  }, [surah, currentAyahs, activeTab]);

  // User-controlled lexical filter options for single-surah analysis
  const [lexicalOptions, setLexicalOptions] = useState<LexicalFilterOptions>(DEFAULT_LEXICAL_OPTIONS);
  
  // Calculate lexical analysis (only when 'words' tab is active)
  const surahLexicalResult = useMemo(() => {
    if (!surah || !currentCorpusSurah || activeTab !== 'words') return null;
    return analyzeSurahLexicon(surah.number, currentCorpusSurah, lexicalOptions);
  }, [surah, currentCorpusSurah, lexicalOptions, activeTab]);

  // Auto-scroll active tab into view when selected
  useEffect(() => {
    const activeBtn = document.getElementById(`modal-tab-${activeTab}`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeTab]);

  const scrollTabs = (dir: 'left' | 'right') => {
    const el = tabContainerRef.current;
    if (!el) return;
    const delta = dir === 'left' ? -220 : 220;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  // Mouse wheel horizontal scroll support for tabs
  useEffect(() => {
    const el = tabContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (el.scrollWidth > el.clientWidth && e.deltaY !== 0) {
        e.preventDefault();
        const isRTL = document.documentElement.dir === 'rtl' || getComputedStyle(el).direction === 'rtl';
        const scrollDelta = isRTL ? -e.deltaY : e.deltaY;
        el.scrollBy({ left: scrollDelta, behavior: 'auto' });
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // ESC key listener to return to previous view effortlessly
  useEffect(() => {
    if (!surah) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBack, surah]);

  if (!surah) return null;

  const currentIndex = surah ? allSurahs.findIndex(s => s.number === surah.number) : -1;
  const prevSurah = currentIndex > 0 ? allSurahs[currentIndex - 1] : null;
  const nextSurah = currentIndex >= 0 && currentIndex < allSurahs.length - 1 ? allSurahs[currentIndex + 1] : null;

  const ARABIC_LETTERS = [
    'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 
    'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 
    'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
  ];

  // Prepare letters data with useMemo to avoid re-allocation on every render
  const lettersData = useMemo(() => {
    const list = ARABIC_LETTERS.map(letter => ({
      letter,
      plainCount: surah.letters.plainCounts[letter] || 0,
      plainPercent: surah.letters.plainPercentages[letter] || 0,
      vocalizedCount: surah.letters.vocalizedCounts[letter] || 0,
      vocalizedPercent: surah.letters.vocalizedPercentages[letter] || 0,
    }));

    if (letterSortBy === 'frequency') {
      list.sort((a, b) => b.plainPercent - a.plainPercent);
    }
    return list;
  }, [surah, letterSortBy]);

  // Diacritics array
  const diacriticsList = [
    { label: 'فتحة ( َ )', count: surah.diacritics.fatha, color: '#38BDF8' },
    { label: 'ضمة ( ُ )', count: surah.diacritics.damma, color: '#818CF8' },
    { label: 'كسرة ( ِ )', count: surah.diacritics.kasra, color: '#34D399' },
    { label: 'سكون ( ْ )', count: surah.diacritics.sukun, color: '#94A3B8' },
    { label: 'تنوين فتح ( ً )', count: surah.diacritics.tanweenFath, color: '#FBBF24' },
    { label: 'تنوين ضم ( ٌ )', count: surah.diacritics.tanweenDamm, color: '#F59E0B' },
    { label: 'تنوين كسر ( ٍ )', count: surah.diacritics.tanweenKasr, color: '#D97706' },
    { label: 'شدة ( ّ )', count: surah.diacritics.shaddah, color: '#F43F5E' },
    { label: 'مد / ألف خنجرية', count: surah.diacritics.maddah, color: '#A855F7' },
  ];

  return (
    <div className="w-full space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      
      {/* Top Workspace Header & Navigation Controls */}
      <div className={`p-3 sm:p-4 rounded-2xl sci-bg sci-border flex flex-wrap items-center justify-between gap-3 shadow-md border ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0F172A] border-slate-800'
      }`}>
        {/* Prominent Back Button */}
        <div className="flex items-center gap-3">
          <button
            id="surah-analysis-back-btn"
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 hover:text-white font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer group"
            title="الرجوع إلى القائمة السابقة (Escape)"
          >
            <ArrowRight className="w-4 h-4 text-sky-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>الرجوع إلى القائمة</span>
          </button>

          <div className="h-6 w-px bg-slate-700/60 hidden sm:block"></div>

          {/* Stepper / Next / Prev Surah */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => prevSurah && onSelectSurah(prevSurah)}
              disabled={!prevSurah}
              className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all ${
                prevSurah 
                  ? 'hover:bg-slate-800 border-slate-700 text-slate-200 cursor-pointer' 
                  : 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600'
              }`}
              title="السورة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden md:inline">{prevSurah?.name || 'البداية'}</span>
            </button>

            <select
              value={surah.number}
              onChange={(e) => {
                const num = Number(e.target.value);
                const target = allSurahs.find(s => s.number === num);
                if (target) onSelectSurah(target);
              }}
              className="bg-slate-900 border border-slate-700 text-xs sm:text-sm font-quran text-sky-300 px-3 py-1.5 rounded-lg focus:outline-none focus:border-sky-500 cursor-pointer max-w-[150px] sm:max-w-[200px]"
            >
              {allSurahs.map(s => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name} ({s.totalAyahs} آية)
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => nextSurah && onSelectSurah(nextSurah)}
              disabled={!nextSurah}
              className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all ${
                nextSurah 
                  ? 'hover:bg-slate-800 border-slate-700 text-slate-200 cursor-pointer' 
                  : 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600'
              }`}
              title="السورة التالية"
            >
              <span className="hidden md:inline">{nextSurah?.name || 'النهاية'}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 font-mono ml-auto">
          {onOpenInReader && (
            <button
              id="read-surah-in-quran-btn"
              type="button"
              onClick={() => onOpenInReader(surah.number)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              title="فتح وقراءة نص السورة في المصحف الشريف"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">قراءة في المصحف</span>
              <span className="sm:hidden text-[11px]">المصحف</span>
            </button>
          )}
          <button
            id="compare-this-surah-btn"
            type="button"
            onClick={() => onCompareWith(surah.number)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-300 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            title="تحليل هذه السورة مع سورة أخرى (سورة مع سورة)"
          >
            <GitCompare className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">سورة مع سورة</span>
            <span className="sm:hidden text-[11px]">مع سورة</span>
          </button>

          {/* Isolated Corner Help Button - dynamically tied to the active sub-tab */}
          <SectionHelpButton 
            guideId={activeTabGuideId} 
            variant="icon" 
            title={activeTabGuideLabel} 
          />
        </div>
      </div>

      {/* Surah Identity Banner & Macro Stats Card */}
      <div className={`p-4 sm:p-6 rounded-2xl sci-bg sci-border shadow-md border ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0F172A] border-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Identity Section */}
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold font-mono text-2xl shrink-0 shadow-inner">
              {surah.number}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <h1 className={`text-2xl sm:text-3xl font-bold font-quran ${
                  isLight ? 'text-slate-900' : 'text-slate-50'
                }`}>
                  {formatSurahName(surah.name)}
                </h1>
                <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full border shrink-0 ${
                  surah.isMeccan 
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/40' 
                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                }`}>
                  {surah.isMeccan ? 'مكية' : 'مدنية'}
                </span>
                {(() => {
                  const clusterInfo = getSurahClusterDisplayInfo(surah.number);
                  return (
                    <span 
                      className={`text-xs font-mono px-2.5 py-0.5 rounded-full border shrink-0 font-medium ${clusterInfo.badgeBg}`}
                      title={clusterInfo.tooltip}
                    >
                      {clusterInfo.shortLabel}
                    </span>
                  );
                })()}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-2 font-mono">
                <span>{surah.englishName}</span>
                <span>•</span>
                <span>{surah.englishNameTranslation}</span>
                <span>•</span>
                <span>ترتيب النزول: #{surah.revelationOrder || surah.number}</span>
              </p>
            </div>
          </div>

          {/* Quick Macro Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center min-w-[100px]">
              <span className="text-slate-400 block text-[11px] mb-0.5">الآيات</span>
              <strong className="text-sky-300 text-base font-bold">{surah.totalAyahs}</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center min-w-[100px]">
              <span className="text-slate-400 block text-[11px] mb-0.5">الكلمات</span>
              <strong className="text-cyan-300 text-base font-bold">{surah.totalWords.toLocaleString('en-US')}</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center min-w-[100px]">
              <span className="text-slate-400 block text-[11px] mb-0.5">الحروف</span>
              <strong className="text-amber-300 text-base font-bold">{surah.totalChars.toLocaleString('en-US')}</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center min-w-[100px]">
              <span className="text-slate-400 block text-[11px] mb-0.5">المفردات الفريدة</span>
              <strong className="text-emerald-300 text-base font-bold">{surah.uniqueWordsCount.toLocaleString('en-US')}</strong>
            </div>
          </div>

        </div>
      </div>

      {/* Main Analysis Container with Sticky Tabs and Generous Workspace */}
      <div className={`rounded-2xl sci-bg sci-border shadow-xl border overflow-hidden ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0F172A] border-slate-800'
      }`}>

        {/* Navigation Tabs (مخابر البصمات الإحصائية مع آلية تمرير متجاوبة لمنع الانقطاع والتجاوز) */}
        <div className={`relative border-b transition-colors duration-200 flex items-center px-1.5 sm:px-3 ${
          isLight ? 'bg-slate-100/95 border-slate-200' : 'bg-[#0A0D12] border-slate-800'
        }`}>
          {/* Scroll Right (Previous in RTL) Button */}
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 transition-colors shrink-0 cursor-pointer hidden sm:flex items-center justify-center z-10`}
            title="التمرير لليمين"
            aria-label="التمرير لليمين"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Inner Tabs Scroll Container with guaranteed screen real estate */}
          <div 
            ref={tabContainerRef}
            role="tablist"
            aria-label="مخابر تحليل بصمات السورة"
            className="flex-1 flex items-center gap-2 overflow-x-auto scroll-smooth py-2 px-1 sm:px-2 scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[
              { id: 'letters', label: 'بصمة الحروف والتشكيل', icon: Type, subtitle: 'التكرار والنسب' },
              { id: 'verse-letters', label: 'توزيع الحروف بالآيات', icon: BarChart2, subtitle: 'كثافة الحروف والفرز' },
              { id: 'verse-heatmap', label: 'خريطة الكثافة المعجمية', icon: Flame, subtitle: 'مصفوفة حرارية للآيات' },
              { id: 'words', label: 'بصمة الكلمات والمعجم', icon: BookOpen, subtitle: 'الألفاظ والتنوع' },
              { id: 'ayahs', label: 'بصمة الآيات والقوافي', icon: Activity, subtitle: 'الأطوال والفواصل' },
              { id: 'golden', label: 'النسبة الذهبية والاتزان', icon: Sparkles, subtitle: 'التناسب الهندسي φ' },
              { id: 'similarity', label: 'التشابه والعلاقات', icon: Network, subtitle: 'التقارب المتجهي' },
            ].map(t => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  id={`modal-tab-${t.id}`}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex items-center gap-2.5 py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm rounded-lg min-h-[44px] shrink-0 min-w-fit transition-all cursor-pointer select-none whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
                    active
                      ? isLight
                        ? 'bg-white text-sky-800 border-2 border-sky-600 shadow-sm font-bold ring-2 ring-sky-500/20'
                        : 'bg-sky-500/20 text-sky-300 border-2 border-sky-400 font-bold shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                      : isLight
                      ? 'border border-slate-300/80 bg-white/70 text-slate-700 hover:text-sky-700 hover:bg-white hover:border-slate-400 font-medium'
                      : 'border border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 hover:border-slate-700 font-medium'
                  }`}
                >
                  <span 
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      active 
                        ? isLight ? 'bg-sky-100 text-sky-700' : 'bg-sky-400/25 text-sky-300'
                        : isLight ? 'bg-slate-200/80 text-slate-600' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="flex flex-col text-right">
                    <span className="font-sans-arabic font-bold text-xs sm:text-sm">{t.label}</span>
                    <span className={`text-[10px] font-mono hidden sm:inline-block leading-tight ${
                      active 
                        ? isLight ? 'text-sky-600' : 'text-sky-400'
                        : isLight ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      {t.subtitle}
                    </span>
                  </div>
                  {active && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-sky-600' : 'bg-sky-400'} mr-auto`}></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Scroll Left (Next in RTL) Button */}
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 transition-colors shrink-0 cursor-pointer hidden sm:flex items-center justify-center z-10`}
            title="التمرير لليسار"
            aria-label="التمرير لليسار"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* CUSTOMIZABLE DEFAULT METRICS STRIP (المقاييس الإحصائية الافتراضية مع إمكانية الطي/الإظهار والتخصيص) */}
          <div className="p-2.5 sm:p-3 rounded-xl sci-bg sci-border shadow-sm transition-all duration-200">
            <div className={`flex flex-wrap items-center justify-between gap-2 text-xs font-mono ${
              showMetricsStrip ? 'border-b border-slate-800/80 pb-2.5' : ''
            }`}>
              <button
                id="toggle-surah-metrics-strip-btn"
                type="button"
                onClick={() => setShowMetricsStrip(prev => !prev)}
                className="flex items-center gap-2 text-slate-200 hover:text-sky-300 transition-colors text-right cursor-pointer group select-none py-0.5"
                title={showMetricsStrip ? 'طي قائمة المقاييس الإحصائية' : 'فتح قائمة المقاييس الإحصائية'}
              >
                <span className={`w-2 h-2 rounded-full ${showMetricsStrip ? 'bg-sky-400 animate-pulse' : 'bg-slate-500'}`}></span>
                <span className="font-bold text-xs sm:text-sm text-slate-200 group-hover:text-white">
                  قائمة المقاييس الإحصائية للسورة
                </span>
                <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 group-hover:border-sky-500/40 group-hover:text-sky-300 transition-colors">
                  {preferredMetrics.length} مقاييس
                </span>
                
                {/* Visual indicator button badge */}
                <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all mr-1.5 sm:mr-3 ${
                  showMetricsStrip
                    ? 'bg-slate-800 border-slate-700 text-slate-300 group-hover:bg-slate-700'
                    : 'bg-sky-500/15 border-sky-500/40 text-sky-300 group-hover:bg-sky-500/25 group-hover:text-white'
                }`}>
                  {showMetricsStrip ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>طي المقاييس</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>عرض المقاييس (مطوية افتراضياً)</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </span>
              </button>

              {/* Action Buttons: Customize */}
              <div className="flex items-center gap-2 mr-auto">
                {showMetricsStrip && (
                  <button
                    type="button"
                    onClick={() => setShowMetricConfig(prev => !prev)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      showMetricConfig
                        ? 'bg-sky-500 text-white font-bold shadow-sm'
                        : isLight
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                        : 'bg-slate-800/90 hover:bg-slate-700 text-sky-300 border border-slate-700'
                    }`}
                    title="تخصيص المقاييس التي تظهر دائماً لكل السور مع حفظها في المتصفح"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{showMetricConfig ? 'إغلاق التخصيص' : 'تخصيص المقاييس الظاهرة'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metric Configuration Drawer & Rendered Selected Metrics Badges (Collapsed by Default) */}
            {showMetricsStrip && (
              <div className="space-y-3 pt-2.5 animate-in fade-in duration-200">
                {/* Metric Configuration Drawer */}
                {showMetricConfig && (
                  <div className="p-3 rounded-lg bg-[#0A0D12] border border-sky-500/30 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-b border-slate-800 pb-2">
                      <span className="text-sky-300 font-bold flex items-center gap-1">
                        <Settings className="w-3.5 h-3.5" />
                        حدد المقاييس التي ترغب في ظهورها في السور:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreferredMetrics(AVAILABLE_METRICS.map(m => m.id))}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px]"
                        >
                          تحديد الكل
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreferredMetrics(DEFAULT_METRIC_IDS)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          الافتراضي
                        </button>
                      </div>
                    </div>

                    {/* Checkbox grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {AVAILABLE_METRICS.map(metric => {
                        const isSelected = preferredMetrics.includes(metric.id);
                        return (
                          <button
                            key={metric.id}
                            type="button"
                            onClick={() => toggleMetric(metric.id)}
                            className={`p-2.5 rounded-lg text-right border flex items-start justify-between gap-1.5 transition-all text-xs font-mono cursor-pointer min-w-0 ${
                              isSelected
                                ? 'bg-sky-500/15 border-sky-500/40 text-slate-100 shadow-sm'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-bold flex items-center gap-1">
                                <span>{metric.label}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                {metric.description}
                              </div>
                            </div>
                            <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                              isSelected
                                ? 'bg-sky-500 border-sky-400 text-white'
                                : 'border-slate-700 bg-slate-800 text-transparent'
                            }`}>
                              <Check className="w-3 h-3" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rendered Selected Metrics Badges - 4 columns on desktop with min-w-0 to prevent overlap */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 font-mono text-xs">
                  {preferredMetrics.map(id => {
                    const metricDef = AVAILABLE_METRICS.find(m => m.id === id);
                    if (!metricDef) return null;
                    const value = metricDef.getValue(surah, goldenMetrics);
                    const formattedValue = `${value}${metricDef.suffix ? ` ${metricDef.suffix}` : ''}`;
                    const cardContent = (
                      <div 
                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all w-full min-w-0 text-right ${
                          isLight 
                            ? 'bg-slate-50 border-slate-200 hover:border-sky-400 shadow-2xs' 
                            : 'bg-[#0A0D12] border-slate-800 hover:border-sky-500/40'
                        }`}
                      >
                        <div className="text-[11px] text-slate-400 flex items-center justify-between gap-1.5 min-w-0">
                          <span className="font-semibold text-slate-300 dark:text-slate-300 truncate">{metricDef.label}</span>
                          {metricDef.mathMetricId && (
                            <span className="text-[9px] text-sky-400 shrink-0 font-mono bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                              ⓘ معادلة
                            </span>
                          )}
                        </div>
                        <div className={`text-base font-bold mt-2 truncate font-mono ${metricDef.colorClass}`}>
                          {value} {metricDef.suffix && <span className="text-xs text-slate-400 font-normal mr-1">{metricDef.suffix}</span>}
                        </div>
                      </div>
                    );

                    return metricDef.mathMetricId ? (
                      <div key={metricDef.id} className="w-full min-w-0">
                        <MathTooltip 
                          metricId={metricDef.mathMetricId} 
                          value={formattedValue}
                          showUnderline={false}
                          wrapperClassName="w-full block min-w-0"
                        >
                          {cardContent}
                        </MathTooltip>
                      </div>
                    ) : (
                      <div key={metricDef.id} className="w-full min-w-0" title={metricDef.description}>
                        {cardContent}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* TAB 1: LETTERS FINGERPRINT */}
          {activeTab === 'letters' && (
            <div className="space-y-4">
              
              {/* Absent Letters Alert */}
              <div className="p-3 rounded-lg bg-[#0A0D12] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold font-mono text-sm">
                    {surah.letters.absentCount}
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-slate-200">
                      الحروف الغائبة كلياً عن السورة (تكرار = 0)
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {surah.letters.absentCount > 0 
                        ? 'الحروف التي لم ترد في نص السورة مطلقاً'
                        : 'هذه السورة تحتوي على جميع الحروف الأبجدية الـ 28!'}
                    </p>
                  </div>
                </div>

                {((surah.letters?.absentLetters || []).length > 0) && (
                  <div className="flex flex-wrap gap-1">
                    {(surah.letters?.absentLetters || []).map(letter => (
                      <span 
                        key={letter}
                        className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold font-quran text-xs"
                      >
                        حرف {letter}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Letters Frequency Chart */}
              <div className="bg-[#0A0D12] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-sky-400 uppercase">
                      منحنى توزيع تردد الحروف الأبجدية (النسبة المئوية %)
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">بصمة التوزيع التكراري لحروف السورة بالرسم المجرد</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <button
                      onClick={() => setLetterSortBy('frequency')}
                      className={`px-2 py-1 rounded text-xs transition-all ${
                        letterSortBy === 'frequency' 
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      حسب التكرار
                    </button>
                    <button
                      onClick={() => setLetterSortBy('alphabet')}
                      className={`px-2 py-1 rounded text-xs transition-all ${
                        letterSortBy === 'alphabet' 
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      الترتيب الأبجدي
                    </button>
                  </div>
                </div>

                <div className="h-60 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lettersData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <XAxis 
                        dataKey="letter" 
                        stroke={isLight ? '#94A3B8' : '#475569'} 
                        fontSize={11} 
                        tick={{ fill: isLight ? '#0F172A' : '#94a3b8', fontFamily: 'Amiri', fontSize: 13, fontWeight: 'bold' }} 
                      />
                      <YAxis stroke={isLight ? '#94A3B8' : '#475569'} fontSize={10} tickFormatter={(v) => `${v}%`} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isLight ? '#FFFFFF' : '#0F172A', 
                          borderColor: isLight ? '#CBD5E1' : '#334155', 
                          borderRadius: '8px', 
                          color: isLight ? '#0F172A' : '#f8fafc',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          textAlign: 'right',
                          direction: 'rtl',
                          boxShadow: isLight ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                        }}
                        formatter={(val: any, name: any, item: any) => [
                          `${val}% (${item.payload.plainCount} مرة)`, 
                          `حرف ${item.payload.letter}`
                        ]}
                      />
                      <Bar dataKey="plainPercent" radius={[2, 2, 0, 0]}>
                        {lettersData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.plainPercent === 0 ? '#ef4444' : entry.plainPercent > 10 ? '#38bdf8' : '#0284c7'} 
                          />
                        ))}
                      </Bar>
                      {lettersData.length > 0 && (
                        <ChartMidpointMarker 
                          y={Number((Math.max(...lettersData.map(l => l.plainPercent), 1) / 2).toFixed(1))}
                        />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Side-by-side Letters Table: Plain vs Tashkeel */}
              <div className="bg-[#0A0D12] border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-3 bg-[#0A0D12] border-b border-slate-800 flex items-center justify-between font-mono">
                  <h4 className="text-xs font-bold text-sky-400">
                    مقارنة تكرار الحروف: الرسم المجرد مقابل النص المشكل
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    إجمالي الحروف: {surah.letters.totalLettersPlain} (مجرد) / {surah.letters.totalLettersVocalized} (مشكل)
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-right text-xs font-mono">
                    <thead className="bg-[#0A0D12] text-sky-400 sticky top-0 border-b border-slate-800 text-[10px] uppercase">
                      <tr>
                        <th className="p-2">الحرف</th>
                        <th className="p-2">تكرار الرسم المجرد</th>
                        <th className="p-2">النسبة (المجرد)</th>
                        <th className="p-2">تكرار المشكل</th>
                        <th className="p-2">النسبة (المشكل)</th>
                        <th className="p-2">التمثيل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-300 text-[11px]">
                      {lettersData.map((row) => (
                        <tr key={row.letter} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-2 font-bold font-quran text-sm text-sky-300">
                            {row.letter}
                          </td>
                          <td className="p-2">{row.plainCount}</td>
                          <td className="p-2 text-sky-300">{row.plainPercent}%</td>
                          <td className="p-2">{row.vocalizedCount}</td>
                          <td className="p-2 text-cyan-300">{row.vocalizedPercent}%</td>
                          <td className="p-2">
                            <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-sky-400 h-1.5 rounded-full" 
                                style={{ width: `${Math.min(100, row.plainPercent * 5)}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Diacritics Layer */}
              <div className="bg-[#0A0D12] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-sky-400 uppercase">
                      طبقة التشكيل والحركات (النص المشكل الكامل)
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">إجمالي الحركات وعلامات الضبط: {surah.diacritics.total.toLocaleString('en-US')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 font-mono">
                  {diacriticsList.map(d => {
                    const pct = surah.diacritics.total > 0 ? ((d.count / surah.diacritics.total) * 100).toFixed(1) : '0';
                    return (
                      <div key={d.label} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <div className="text-[11px] text-slate-400">{d.label}</div>
                        <div className="text-base font-bold text-slate-100 mt-0.5">{d.count.toLocaleString('en-US')}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{pct}% من الإجمالي</div>
                        <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className="h-full rounded-full" 
                            style={{ width: `${pct}%`, backgroundColor: d.color }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: WORDS FINGERPRINT */}
          {activeTab === 'words' && (
            <div className="space-y-4 font-mono">
              {/* USER-CONTROLLED CUSTOM LEXICAL FILTERS & NORMALIZATION PANEL */}
              <LexicalFilterControlPanel
                options={lexicalOptions}
                onChange={setLexicalOptions}
                activeSurahsCount={1}
              />

              {/* Word Metrics Grid - 6 Independent Computational Linguistics Metrics */}
              {(() => {
                const totalN = surahLexicalResult?.totalFilteredTokens ?? surah.totalWords ?? 1;
                const uniqueV = surahLexicalResult?.uniqueFilteredWordsCount ?? surah.uniqueWordsCount ?? 0;
                const guiraudScore = totalN > 0 ? (uniqueV / Math.sqrt(totalN)).toFixed(2) : '0';
                const herdanScore = totalN > 1 && uniqueV > 0 ? (Math.log(uniqueV) / Math.log(totalN)).toFixed(3) : '1.00';

                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                      <div className={`p-3 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'}`}>
                        <div className="text-[10px] text-sky-500 font-bold uppercase">إجمالي الكلمات (N)</div>
                        <div className={`text-lg font-bold mt-0.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                          {totalN.toLocaleString('en-US')}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {(surahLexicalResult?.excludedTokensCount ?? 0) > 0 
                            ? `بعد إقصاء ${surahLexicalResult?.excludedTokensCount} لفظ` 
                            : 'المعدود الفعلي بالسور'}
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'}`}>
                        <div className="text-[10px] text-sky-500 font-bold uppercase">المفردات الفريدة (V)</div>
                        <div className="text-lg font-bold text-sky-400 mt-0.5">
                          {uniqueV.toLocaleString('en-US')}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">مفردة غير مكررة</div>
                      </div>

                      <div className={`p-3 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'}`}>
                        <div className="text-[10px] text-emerald-500 font-bold uppercase">TTR الخام السطحي</div>
                        <div className="text-lg font-bold text-emerald-400 mt-0.5">
                          {surahLexicalResult.activeTTR}%
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          (V ÷ N) × 100
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg border relative overflow-hidden ${
                        isLight ? 'bg-teal-50/60 border-teal-300' : 'bg-teal-950/20 border-teal-500/40'
                      }`}>
                        <div className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase flex items-center justify-between">
                          <span>مؤشر جيراود (R)</span>
                          <span className="text-[8px] px-1 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">معدّل</span>
                        </div>
                        <div className="text-lg font-bold text-teal-500 mt-0.5">
                          {guiraudScore}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          V ÷ √N (مستقل عن الطول)
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'}`}>
                        <div className="text-[10px] text-cyan-500 font-bold uppercase">مؤشر هيردان (C)</div>
                        <div className="text-lg font-bold text-cyan-400 mt-0.5">
                          {herdanScore}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          log(V) ÷ log(N)
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'}`}>
                        <div className="text-[10px] text-indigo-500 font-bold uppercase">متوسط طول الكلمة</div>
                        <div className="text-lg font-bold text-indigo-400 mt-0.5">{surah.avgWordLength}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">حرف لكل كلمة</div>
                      </div>
                    </div>

                    {/* Academic Distinction Notice */}
                    <div className={`p-2.5 rounded-lg border text-[11px] leading-relaxed flex items-start gap-2 ${
                      isLight ? 'bg-sky-50 border-sky-200 text-slate-800' : 'bg-sky-950/30 border-sky-800/60 text-sky-200'
                    }`}>
                      <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>ملاحظة أكاديمية في اللسانيات الحاسوبية:</strong> ينخفض مؤشر TTR الخام تلقائياً في السور الطويلة بسبب تكرار حروف المعاني والضمائر تماشياً مع <em>قانون هيبس (Heaps' Law)</em>. للمقارنة الإحصائية العادلة بين قصار السور وطوالها، يُنصح بالاعتماد على <strong>مؤشر جيراود المعدّل (Guiraud R)</strong> أو مراجعة النص بعد تجريد حروف المعاني من لوحة الفلترة أعلاه.
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Top Most Frequent Words Table */}
              <div className="bg-[#0A0D12] border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-3 bg-[#0A0D12] border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-sky-400 uppercase">
                      الكلمات الأكثر تكراراً في السورة (Top Words)
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      وفق معايير الفلترة وتجريد السوابق المحددة أعلاه ({surahLexicalResult.topWords.length} كلمة)
                    </p>
                    <p className="text-[10px] text-sky-400 font-mono mt-0.5">
                      💡 اضغط على أي كلمة لعرض قائمة الآيات التي تحتوي عليها حصراً في السورة.
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    أعلى {lexicalOptions.topWordsCount} كلمات
                  </span>
                </div>

                {surahLexicalResult.topWords.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 italic">
                    لا توجد كلمات مطابقة للمعايير المحددة حالياً. جرّب تخفيف الفلاتر أو إعادة ضبطها.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs font-mono">
                      <thead className="bg-[#0A0D12] text-sky-400 border-b border-slate-800 text-[10px] uppercase">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">الكلمة / الجذر المجرد</th>
                          <th className="p-2.5">التكرار</th>
                          <th className="p-2.5">النسبة المئوية</th>
                          <th className="p-2.5">طول الكلمة</th>
                          <th className="p-2.5">الصيغ المدمجة (إن وجدت)</th>
                          <th className="p-2.5">التمثيل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 text-slate-300 text-[11px]">
                        {surahLexicalResult.topWords.map((item, idx) => (
                          <tr 
                            key={idx} 
                            onClick={() => setSelectedWordForModal({ word: item.word, wordItem: item })}
                            className="hover:bg-sky-950/40 cursor-pointer transition-colors group"
                            title={`انقر لعرض الآيات التي تحتوي على «${item.word}» حصراً في سورة ${surah.name}`}
                          >
                            <td className="p-2.5 text-slate-500">{idx + 1}</td>
                            <td className="p-2.5 font-bold font-quran text-sm text-sky-300">
                              <div className="flex items-center justify-between gap-2">
                                <span>{item.word}</span>
                                <span className="text-[10px] text-sky-400 font-sans font-normal opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                  <BookOpen className="w-3 h-3" />
                                  <span>عرض الآيات</span>
                                </span>
                              </div>
                            </td>
                            <td className="p-2.5 font-semibold text-white">{item.count}</td>
                            <td className="p-2.5 text-cyan-300">{item.percentage}%</td>
                            <td className="p-2.5 text-slate-400">{item.word.length} حروف</td>
                            <td className="p-2.5">
                              {item.mergedVariants && item.mergedVariants.length > 1 ? (
                                <div className="flex flex-wrap gap-1">
                                  {item.mergedVariants.map((v, vIdx) => (
                                    <span 
                                      key={vIdx} 
                                      className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
                                    >
                                      {v.variant} ({v.count})
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-600 text-[10px]">—</span>
                              )}
                            </td>
                            <td className="p-2.5">
                              <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-sky-400 h-1.5 rounded-full" 
                                  style={{ width: `${Math.min(100, item.percentage * 10)}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: AYAHS FINGERPRINT */}
          {activeTab === 'ayahs' && (
            <div className="space-y-4">
              
              {/* Shortest & Longest Verses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* Shortest */}
                <div className={`p-3.5 rounded-xl border space-y-2 font-mono ${
                  isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#0A0D12] border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                      أقصر آية في السورة
                    </span>
                    <span className="text-[10px] text-slate-400">الآية رقم {surah.ayahs.shortestAyah.numberInSurah}</span>
                  </div>
                  <div 
                    className={`quran-ayah-container p-3 rounded-lg border font-quran text-base sm:text-lg leading-[2.2] sm:leading-[2.5] text-right select-text ${
                      isLight 
                        ? 'bg-white border-slate-200 text-slate-900 shadow-xs' 
                        : 'bg-black/50 border-slate-800 text-slate-100'
                    }`}
                    dir="rtl"
                  >
                    « {surah.ayahs.shortestAyah.textUthmani} »
                    <span className="inline-block mr-1 text-sky-500 text-sm font-mono font-bold select-none" dir="ltr">
                      ﴿{surah.ayahs.shortestAyah.numberInSurah}﴾
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                    <span>{surah.ayahs.shortestAyah.wordCount} كلمات</span>
                    <span>•</span>
                    <span>{surah.ayahs.shortestAyah.charCount} حرف</span>
                  </div>
                </div>

                {/* Longest */}
                <div className={`p-3.5 rounded-xl border space-y-2 font-mono ${
                  isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#0A0D12] border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                      أطول آية في السورة
                    </span>
                    <span className="text-[10px] text-slate-400">الآية رقم {surah.ayahs.longestAyah.numberInSurah}</span>
                  </div>
                  <div 
                    className={`quran-ayah-container p-3 rounded-lg border font-quran text-sm sm:text-base leading-[2.2] sm:leading-[2.5] text-right max-h-48 sm:max-h-60 overflow-y-auto select-text ${
                      isLight 
                        ? 'bg-white border-slate-200 text-slate-900 shadow-xs' 
                        : 'bg-black/50 border-slate-800 text-slate-100'
                    }`}
                    dir="rtl"
                  >
                    « {surah.ayahs.longestAyah.textUthmani} »
                    <span className="inline-block mr-1 text-cyan-500 text-sm font-mono font-bold select-none" dir="ltr">
                      ﴿{surah.ayahs.longestAyah.numberInSurah}﴾
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                    <span>{surah.ayahs.longestAyah.wordCount} كلمة</span>
                    <span>•</span>
                    <span>{surah.ayahs.longestAyah.charCount} حرف</span>
                  </div>
                </div>

              </div>

              {/* Verse Length Distribution Histogram & Statistical Analysis Component */}
              <VerseLengthHistogram surah={surah} ayahs={currentAyahs} />

              {/* Verse Endings & Rhymes */}
              <div className="bg-[#0A0D12] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-sky-400 uppercase">
                      نمط فواصل الآيات والقوافي الصوتية (Verse Endings)
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">المقاطع الصوتية والنهايات التي تختم بها آيات السورة</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 font-mono">
                  {(surah.ayahs?.verseEndings || []).map((rhyme, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-quran font-bold text-base text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                          {rhyme.pattern}
                        </span>
                        <div>
                          <div className="text-[11px] font-bold text-slate-200">{rhyme.count} آية</div>
                          <div className="text-[10px] text-slate-400">{rhyme.percentage}% من السورة</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB: PER-VERSE LETTER DISTRIBUTION (توزيع الحروف عبر آيات السورة) */}
          {activeTab === 'verse-letters' && (
            <div className="space-y-4">
              <SurahVerseLetterDistribution 
                ayahs={currentAyahs} 
                surahName={surah.name} 
                surahNumber={surah.number} 
              />
            </div>
          )}

          {/* TAB: VERSE WORD FREQUENCY HEATMAP (خريطة الكثافة المعجمية للآيات) */}
          {activeTab === 'verse-heatmap' && (
            <div className="space-y-4">
              <VerseHeatmap 
                surah={surah}
                ayahs={currentAyahs}
                onOpenInReader={onOpenInReader}
                allSurahs={allSurahs}
                onSelectSurah={onSelectSurah}
              />
            </div>
          )}

          {/* TAB: GOLDEN RATIO & GEOMETRIC HARMONY (النسبة الذهبية والتناسب الهندسي) */}
          {activeTab === 'golden' && goldenMetrics && (
            <SurahGoldenRatioSection 
              surah={surah} 
              goldenMetrics={goldenMetrics} 
              isLight={isLight} 
              onOpenInReader={onOpenInReader} 
            />
          )}

          {/* TAB 4: SIMILARITY & RELATIONS */}
          {activeTab === 'similarity' && (
            <div className="space-y-4">
              <SurahSimilarityExplorer
                baseSurah={surah}
                allSurahs={surahs}
                onSelectSurah={onSelectSurah}
                onCompareWith={onCompareWith}
                titlePrefix="معايير قياس التشابه والعلاقات مع"
              />

              {/* Mathematical Clustering Info */}
              <div className={`p-3 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-3 font-mono transition-colors ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0A0D12] border-slate-800 text-slate-300'
              }`}>
                <div className="space-y-0.5">
                  <h5 className={`text-xs font-bold ${isLight ? 'text-slate-950' : 'text-sky-400'}`}>
                    موقع السورة في الفضاء المتجهي للأبجدية
                  </h5>
                  <div className={`text-[11px] ${isLight ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                    الإحداثيات الثنائية الناتجة عن تحليل المكونات الرئيسية (PCA 2D): 
                    <MathTooltip metricId="pcaCoordinates" value={`X: ${surah.pcaCoordinates.x}, Y: ${surah.pcaCoordinates.y}`}>
                      <span className={`mx-1 font-bold ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>X: {surah.pcaCoordinates.x}</span>
                      <span className={`font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>Y: {surah.pcaCoordinates.y}</span>
                    </MathTooltip>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const clusterInfo = getSurahClusterDisplayInfo(surah.number);
                    return (
                      <span 
                        className={`text-[10px] px-2.5 py-1 rounded border font-bold ${clusterInfo.badgeBg}`}
                        title={clusterInfo.tooltip}
                      >
                        {clusterInfo.shortLabel}
                      </span>
                    );
                  })()}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Bottom Workspace Return Bar */}
        <div className={`border-t px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono transition-colors ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0D12] border-slate-800'
        }`}>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <span className="font-bold text-sky-400">{formatSurahName(surah.name)} (#{surah.number})</span>
            <span>•</span>
            <span>{surah.totalAyahs} آية • {surah.totalWords.toLocaleString('en-US')} كلمة</span>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {onOpenInReader && (
              <button
                type="button"
                onClick={() => onOpenInReader(surah.number)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-1.5 transition-all cursor-pointer font-bold"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>قراءة في المصحف</span>
              </button>
            )}

            <button
              id="footer-back-surah-btn"
              type="button"
              onClick={handleBack}
              className="px-4 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 hover:text-white border border-sky-500/40 text-xs flex items-center gap-1.5 font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
              <span>الرجوع إلى القائمة</span>
            </button>
          </div>
        </div>

      </div>

      {/* EXCLUSIVE WORD VERSES MODAL */}
      {selectedWordForModal && (
        <WordVersesModal
          isOpen={Boolean(selectedWordForModal)}
          onClose={() => setSelectedWordForModal(null)}
          word={selectedWordForModal.word}
          wordItem={selectedWordForModal.wordItem}
          surahName={surah.name}
          surahNumber={surah.number}
          totalSurahAyahs={surah.totalAyahs}
          corpusSurah={corpus?.find(c => c.number === surah.number)}
          lexicalOptions={lexicalOptions}
          onOpenInReader={onOpenInReader}
        />
      )}
    </div>
  );
};

export const SurahDetailView = SurahDetailModal;
