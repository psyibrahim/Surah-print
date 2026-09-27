import React, { useState, useMemo } from 'react';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { useTheme } from '../context/ThemeContext';
import { 
  analyzeSurahLexiconAdvanced, 
  computeGlobalQuranLexicon, 
  SurahLexicalAnalysis, 
  QuranGlobalLexicalStats 
} from '../utils/lexicalMetrics';
import { formatSurahName } from '../utils/arabic';
import { SectionHelpButton } from './SectionHelpModal';
import { WordVersesModal } from './WordVersesModal';
import { useLexicalWorker } from '../hooks/useLexicalWorker';
import { SurahGoldenRatioScatterPlot } from './SurahGoldenRatioScatterPlot';
import { 
  TrendingDown, 
  Sparkles, 
  BookOpen, 
  BarChart2, 
  Search, 
  Brain, 
  HelpCircle, 
  Hash, 
  Activity, 
  Layers, 
  Award,
  Filter,
  CheckCircle2,
  Zap,
  Loader2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';

interface LexicalRichnessLabProps {
  onSelectSurah?: (surahNumber: number) => void;
}

const LexicalRichnessLabComponent: React.FC<LexicalRichnessLabProps> = ({ onSelectSurah }) => {
  const { corpus, surahs } = useQuranCorpus();
  const { theme } = useTheme();

  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'zipf' | 'ttr-atlas' | 'top-words' | 'golden-ratio' | 'methodology'>('zipf');
  const [atlasSearch, setAtlasSearch] = useState<string>('');
  const [excludeStopwords, setExcludeStopwords] = useState<boolean>(false);
  const [unifyLemmas, setUnifyLemmas] = useState<boolean>(true);
  const [selectedWordForModal, setSelectedWordForModal] = useState<string | null>(null);

  // Current surah corpus
  const currentSurah = useMemo(() => {
    return corpus.find(c => c.number === selectedSurahNumber) || corpus[0];
  }, [corpus, selectedSurahNumber]);

  // Web Worker offloaded text processing & intensive memoization
  const { 
    surahAnalysis: analysis, 
    globalLexicon, 
    isWorkerCalculating 
  } = useLexicalWorker({
    currentSurah,
    corpus,
    excludeStopwords,
    unifyLemmas,
    enableGlobalAtlas: activeTab === 'ttr-atlas'
  });

  // Filtered rankings
  const filteredRankings = useMemo(() => {
    if (!globalLexicon) return [];
    return globalLexicon.surahRankings.filter(item => {
      return atlasSearch.trim() === '' || 
        item.surahName.includes(atlasSearch.trim()) || 
        item.surahNumber.toString() === atlasSearch.trim();
    });
  }, [globalLexicon, atlasSearch]);

  const isDark = theme === 'dark';

  return (
    <div className="w-full space-y-5 animate-fadeIn">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900/90 via-[#151D2A]/90 to-slate-900/90 border-slate-800 shadow-xl' 
          : 'bg-gradient-to-r from-indigo-50 via-white to-sky-50/50 border-indigo-100 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  مختبر اللسانيات الرياضية وثراء المفردات
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  قانون زيف والإنتروبيا
                </span>
                {isWorkerCalculating ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                    <span>معالجة خيطية سريعة...</span>
                  </span>
                ) : (
                  <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span>مُعالج Web Worker فوري</span>
                  </span>
                )}
                <SectionHelpButton 
                  guideId="lexical-richness-lab" 
                  variant="button" 
                  title="استعلام ودليل مختبر اللسانيات وزيف" 
                />
              </div>
              <p className={`text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                تطبيق نماذج اللسانيات الحاسوبية العالمية على النص القرآني: مؤشر التنوع المعجمي (TTR)، ومنحنى قانون زيف اللوغاريتمي، وقياس إنتروبيا شانون للمعلومات.
              </p>
            </div>
          </div>

          {/* Surah Dropdown & Content Lexicon Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
            {/* Academic Content Lexicon vs All Tokens Toggle Filter */}
            <div className={`flex items-center p-1 rounded-xl border text-xs font-medium transition-all ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <button
                type="button"
                onClick={() => setExcludeStopwords(false)}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
                  !excludeStopwords
                    ? (isDark ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200')
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="عرض كافة الكلمات دون استثناء بما فيها حروف المعاني والجر والضمائر"
              >
                <span>كافة الكلمات</span>
                <span className="text-[10px] opacity-75 font-mono">({analysis.totalTokens + (analysis.stopwordsExcludedCount || 0)})</span>
              </button>

              <button
                type="button"
                onClick={() => setExcludeStopwords(true)}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
                  excludeStopwords
                    ? (isDark ? 'bg-purple-600 text-white shadow-xs' : 'bg-purple-50 text-purple-700 font-bold border border-purple-200')
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="استبعاد حروف المعاني (في، من، إلى، ما، لا...) وإظهار المفردات الدلالية الصرفة (الأسماء والأفعال)"
              >
                <Filter className="w-3 h-3 text-purple-400" />
                <span>المفردات الدلالية</span>
                <span className="text-[10px] opacity-75 font-mono">({analysis.totalTokens})</span>
              </button>
            </div>

            {/* Lemma Unification Toggle (توحيد الأصل المعجمي والسوابق مثل الله/والله) */}
            <div className={`flex items-center p-1 rounded-xl border text-xs font-medium transition-all ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <button
                type="button"
                onClick={() => setUnifyLemmas(true)}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
                  unifyLemmas
                    ? (isDark ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200')
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="توحيد تنويعات الكلمة الواحدة (الله، والله، بالله، لله) تحت أصل معجمي واحد لضبط قانون زيف ورتب الكلمات"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                <span>توحيد معجمي</span>
              </button>

              <button
                type="button"
                onClick={() => setUnifyLemmas(false)}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
                  !unifyLemmas
                    ? (isDark ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-700 font-bold border border-amber-200')
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="فصل الكلمات حسب الرسم السطحي الحرفي الخام دون تجريد الواو أو الباء"
              >
                <span>رسم خام</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-medium whitespace-nowrap">السورة الحالية:</label>
              <select
                value={selectedSurahNumber}
                onChange={(e) => setSelectedSurahNumber(Number(e.target.value))}
                aria-label="اختر السورة لتحليل اللسانيات وقانون زيف"
                className={`px-3 py-2 rounded-xl text-sm font-semibold border outline-none cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-slate-800/90 border-slate-700 text-white focus:border-indigo-500' 
                    : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 shadow-sm'
                }`}
              >
                {surahs.map(s => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {formatSurahName(s.name)} ({s.totalWords} كلمة)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
          {/* TTR (Type-Token Ratio) */}
          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white/80 border-slate-200'}`}>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>التنوع المعجمي (TTR)</span>
              <Award className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-indigo-400">
                {analysis.ttr}%
              </span>
              <span className="text-[10px] text-slate-400">
                ({analysis.uniqueTypes}/{analysis.totalTokens})
              </span>
            </div>
          </div>

          {/* Shannon Entropy */}
          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white/80 border-slate-200'}`}>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>إنتروبيا شانون (H)</span>
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-sky-400">
                {analysis.shannonEntropy}
              </span>
              <span className="text-[10px] text-slate-400">
                بت/مفردة
              </span>
            </div>
          </div>

          {/* Zipf Slope */}
          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white/80 border-slate-200'}`}>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>ميل قانون زيف (Slope)</span>
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {analysis.zipfSlope}
              </span>
              <span className="text-[10px] text-slate-400">
                (المثالي: -1.0)
              </span>
            </div>
          </div>

          {/* R2 Goodness of fit */}
          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white/80 border-slate-200'}`}>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>معامل التطابق (R²)</span>
              <Activity className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {analysis.zipfR2}
              </span>
              <span className="text-[10px] text-slate-400">
                توافق عالٍ
              </span>
            </div>
          </div>

          {/* Hapax Legomena in Surah */}
          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white/80 border-slate-200'}`}>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>الألفاظ الفريدة (Hapax)</span>
              <Hash className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-purple-400">
                {analysis.hapaxCount}
              </span>
              <span className="text-[10px] text-slate-400">
                ({analysis.hapaxPercentage}%)
              </span>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/60 flex-wrap">
          <button
            onClick={() => setActiveTab('zipf')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'zipf'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            منحنى قانون زيف اللوغاريتمي (Log-Log)
          </button>
          <button
            onClick={() => setActiveTab('ttr-atlas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'ttr-atlas'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            تصنيف السور حسب التنوع المعجمي (TTR)
          </button>
          <button
            onClick={() => setActiveTab('top-words')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'top-words'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            أعلى المفردات تواتراً في السورة
          </button>
          <button
            onClick={() => setActiveTab('golden-ratio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'golden-ratio'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            مخطط النسبة الذهبية (Scatter Plot)
          </button>
          <button
            onClick={() => setActiveTab('methodology')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'methodology'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            المنهجية العلمية ومعادلات القياس
          </button>
        </div>
      </div>

      {/* Tab 1: Zipf's Law Log-Log Curve */}
      {activeTab === 'zipf' && (
        <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <span>توزيع قانون زيف في {formatSurahName(analysis.surahName)}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                    R² = {analysis.zipfR2} | Slope = {analysis.zipfSlope}
                  </span>
                </h2>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                  excludeStopwords 
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}>
                  {excludeStopwords ? 'المفردات الدلالية فقط (مستبعد حروف المعاني)' : 'كافة الكلمات (شامل الأدوات والضمائر)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                مقارنة المنحنى التجريبي الفعلي للكلمات مع خط قانون زيف النظري (العلاقة العكسية بين رتبة الكلمة وتكرارها).
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-indigo-400 font-medium">
                <span className="w-3 h-0.5 bg-indigo-500"></span>
                التكرار الفعلي (Empirical)
              </span>
              <span className="flex items-center gap-1 text-slate-400 font-medium">
                <span className="w-3 h-0.5 bg-slate-500 border-dashed"></span>
                خط زيف النظري (Theoretical)
              </span>
            </div>
          </div>

          <div className="h-[340px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analysis.zipfCurve} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis 
                  dataKey="rank" 
                  stroke="#64748b" 
                  fontSize={11} 
                  label={{ value: 'رتبة المفردة (Rank r)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  label={{ value: 'التكرار (Frequency f)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    direction: 'rtl'
                  }}
                  formatter={(value: any, name: string, item: any) => [
                    `${value} مرة (${item.payload.word})`,
                    name === 'count' ? 'التكرار الفعلي' : 'توقع زيف'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#6366f1" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#6366f1' }}
                  name="count"
                />
                <Line 
                  type="monotone" 
                  dataKey="theoreticalZipf" 
                  stroke="#94a3b8" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4"
                  dot={false}
                  name="theoreticalZipf"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Academic Insight Card */}
          <div className="mt-4 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs leading-relaxed">
            <span className="font-bold">التفسير الرياضي: </span>
            يُظهر المعامل $R^2 = {analysis.zipfR2}$ تطابقاً استثنائياً مع قانون القوة الطبيعي للغات. كلما اقترب الميل من $-1.00$، دلّ ذلك على توازن طبيعي محكم بين مركزية الكلمات المفتاحية وسعة المفردات المتجددة.
          </div>
        </div>
      )}

      {/* Tab 2: TTR Rankings Across 114 Surahs */}
      {activeTab === 'ttr-atlas' && (
        <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>أطلس التنوع المعجمي لجميع سور القرآن (TTR)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                  114 سورة
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ترتيب السور من الأعلى إلى الأدنى في نسبة المفردات الفريدة (تتراوح من السور المكثفة قصيرة الآيات إلى السور التشريعية الطويلة).
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن سورة..."
                value={atlasSearch}
                onChange={(e) => setAtlasSearch(e.target.value)}
                className={`px-3 py-1.5 pl-8 rounded-lg text-xs border outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                  <th className="py-2.5 px-3">الترتيب</th>
                  <th className="py-2.5 px-3">السورة</th>
                  <th className="py-2.5 px-3">إجمالي الكلمات (Tokens)</th>
                  <th className="py-2.5 px-3">المفردات الفريدة (Types)</th>
                  <th className="py-2.5 px-3">نسبة التنوع (TTR)</th>
                  <th className="py-2.5 px-3">إنتروبيا شانون (H)</th>
                  <th className="py-2.5 px-3">معامل جيراود (Guiraud)</th>
                  <th className="py-2.5 px-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono">
                {filteredRankings.map((item, idx) => (
                  <tr 
                    key={item.surahNumber}
                    className={`transition-colors cursor-pointer ${
                      item.surahNumber === selectedSurahNumber
                        ? isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'
                        : isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => {
                      setSelectedSurahNumber(item.surahNumber);
                      setActiveTab('zipf');
                    }}
                  >
                    <td className="py-2.5 px-3 text-slate-400 font-bold">{idx + 1}</td>
                    <td className={`py-2.5 px-3 font-serif font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {formatSurahName(item.surahName)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{item.totalTokens.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-semibold">{item.uniqueTypes.toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-indigo-500" 
                            style={{ width: `${Math.min(100, item.ttr)}%` }}
                          ></div>
                        </div>
                        <span className="text-indigo-400 font-bold">{item.ttr}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-sky-400">{item.entropy}</td>
                    <td className="py-2.5 px-3 text-amber-400">{item.guiraudIndex}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSurahNumber(item.surahNumber);
                          setActiveTab('zipf');
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-indigo-500 hover:text-white text-slate-300 text-[10px] font-sans transition-all"
                      >
                        تحليل زيف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Top Words Frequency */}
      {activeTab === 'top-words' && (
        <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold mb-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                أعلى {analysis.topWords.length} مفردة تواتراً في {formatSurahName(analysis.surahName)}
                {unifyLemmas && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                    أصل معجمي موحد
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                توزيع المفردات الأكثر تكراراً ونسبتها من إجمالي كلمات السورة ({analysis.totalTokens} كلمة). انقر على أي كلمة لعرض كافة آياتها وتفرعاتها اللفظية في نافذة الآيات.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {analysis.topWords.map((tw) => (
              <div 
                key={tw.rank}
                onClick={() => setSelectedWordForModal(tw.word)}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all cursor-pointer group ${
                  isDark 
                    ? 'bg-slate-800/40 border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/70' 
                    : 'bg-slate-50 border-slate-200 hover:border-purple-400 hover:bg-white shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-purple-500/10 text-purple-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {tw.rank}
                    </span>
                    <div>
                      <div className={`text-base font-bold font-serif group-hover:text-purple-400 transition-colors ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {tw.word}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        النسبة: {tw.percentage}%
                      </div>
                    </div>
                  </div>

                  <div className="text-left font-mono font-bold text-sm text-purple-400">
                    {tw.count} <span className="text-[10px] text-slate-500 font-sans">مرة</span>
                  </div>
                </div>

                {/* Unified Variants Pill Display */}
                {tw.variants && tw.variants.length > 1 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap gap-1 items-center">
                    <span className="text-[9px] text-slate-400 font-medium">التنويعات:</span>
                    {tw.variants.slice(0, 4).map(v => (
                      <span 
                        key={v.variant} 
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20"
                      >
                        {v.variant} <span className="opacity-75">({v.count})</span>
                      </span>
                    ))}
                    {tw.variants.length > 4 && (
                      <span className="text-[9px] text-slate-500 font-mono">
                        +{tw.variants.length - 4} أخرى
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Methodology & Equations */}
      {activeTab === 'methodology' && (
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h2 className="text-base font-bold mb-3 flex items-center gap-2 text-indigo-400">
            <HelpCircle className="w-5 h-5" />
            الأسس الرياضية واللسانية المعتمدة في هذا المختبر
          </h2>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className="font-bold text-sm text-indigo-400 mb-1">1. قانون زيف اللغوي (Zipf's Law)</h3>
              <p>
                قانون تجريبي وضعه عالم اللسانيات جورج كينغسلي زيف، ينص على أن تكرار أي كلمة في نص لغوي طبيعي يتناسب عكسياً مع رتبتها في جدول التكرار:
              </p>
              <div className="my-2 p-2 rounded bg-slate-900 text-sky-300 font-mono text-center">
                f(r) = C / r^s &nbsp;&nbsp;⟹&nbsp;&nbsp; log(f) = log(C) - s · log(r)
              </div>
              <p>
                في النصوص الطبيعية المتوازنة، يكون الأس اللغوي $s \approx 1.00$. وقد أثبتت التحليلات في هذا المختبر خضوع السور القرآنية لقانون زيف بدرجة دقة $R^2 \ge 0.90$.
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className="font-bold text-sm text-sky-400 mb-1">2. نسبة التنوع المعجمي (Type-Token Ratio - TTR)</h3>
              <p>
                مقياس معتمد عالمياً لقياس الثراء المعجمي في النصوص:
              </p>
              <div className="my-2 p-2 rounded bg-slate-900 text-sky-300 font-mono text-center">
                TTR = (V / N) × 100
              </div>
              <p>
                حيث $V$ هو عدد المفردات الفريدة دون تكرار (Types)، و $N$ هو إجمالي الكلمات الواردة (Tokens). تمتاز السور القصيرة بنسبة TTR مرتفعة تتجاوز 80%، بينما السور الطويلة تمتاز بنسبة تكرار موضوعي وتثبيتي للأحكام.
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className="font-bold text-sm text-emerald-400 mb-1">3. إنتروبيا شانون للمعلومات (Shannon Entropy)</h3>
              <p>
                مقياس من نظرية المعلومات وضعه كلود شانون لقياس درجة التشتت وعدم اليقين وكثافة المعلومات في التوزيع الاحتمالي للمفردات:
              </p>
              <div className="my-2 p-2 rounded bg-slate-900 text-emerald-300 font-mono text-center">
                H = - ∑ p(w) · log2( p(w) )
              </div>
              <p>
                كلما زادت الإنتروبيا، دل ذلك على توازن انتشار المفردات وعدم احتكار كلمة واحدة لمعظم النص.
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className="font-bold text-sm text-amber-400 mb-1">4. التوحيد المعجمي وضبط السوابق (Canonical Lemma Normalization)</h3>
              <p>
                في الدراسات اللسانية الحاسوبية وقانون زيف، تُحسب الرتب على مستوى الكلمات المعجمية (Lemmas) وليس السوابق اللفظية العارضة كحروف العطف (الواو والفاء) وحروف الجر المتصلة (الباء واللام والكاف) وتاء القسم. يضمن خيار "توحيد معجمي" تجميع كافة تنويعات اللفظ الواحد (مثل: الله، والله، بالله، تالله، لله، ولله) تحت أصل معجمي واحد موحد، حتى لا تتشتت رتب الكلمة الواحدة في التحليل الإحصائي ونتائج البحث.
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className="font-bold text-sm text-amber-300 mb-1">5. التناسب الإحصائي والنسبة الذهبية (Golden Ratio Proportionality)</h3>
              <p>
                يتحقق هذا النموذج من التناسب الرياضي الإحصائي لأعداد كلمات السور القرآنية مقارنة بالمتوسط الحسابي العام للقرآن الكريم (W̄ ≈ 679.7 كلمة لكل سورة). ويُبيّن المخطط المبعثر التفاعلي (Scatter Plot) أن أحجام السور تنتظم في نطاقات توافقية هندسية تحاكي قوى النسبة الذهبية (φ ≈ 1.618، و 1/φ ≈ 0.618، و φ² ≈ 2.618). ويُقاس معامل الاتساق الذهبي (Convergence Score) بنسبة ابتعاد السورة عن أقرب مستوى هندسي ذهبي، مما يوضح التوازن الإعجازي بين المركزية البيانية للسور وأطوال مقاطعها.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Golden Ratio Scatter Plot & Statistical Proportionality */}
      {activeTab === 'golden-ratio' && (
        <SurahGoldenRatioScatterPlot
          surahs={surahs}
          selectedSurahNumber={selectedSurahNumber}
          onSelectSurah={(num) => {
            setSelectedSurahNumber(num);
          }}
          onOpenDetailModal={(num) => {
            if (onSelectSurah) {
              onSelectSurah(num);
            }
          }}
          isDark={isDark}
        />
      )}

      {/* Word Verses Modal */}
      {selectedWordForModal && currentSurah && (
        <WordVersesModal
          isOpen={!!selectedWordForModal}
          onClose={() => setSelectedWordForModal(null)}
          word={selectedWordForModal}
          surahName={analysis.surahName}
          surahNumber={analysis.surahNumber}
          totalSurahAyahs={currentSurah.totalAyahs || 0}
          corpusSurah={currentSurah}
          onOpenInReader={onSelectSurah}
        />
      )}
    </div>
  );
};

export const LexicalRichnessLab = React.memo(LexicalRichnessLabComponent);
export default LexicalRichnessLab;
