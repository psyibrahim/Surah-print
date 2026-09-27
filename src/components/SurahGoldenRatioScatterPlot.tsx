import React, { useState, useMemo } from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  ReferenceArea, 
  Cell 
} from 'recharts';
import { 
  Sparkles, 
  Compass, 
  Search, 
  TrendingUp, 
  BarChart2, 
  Award, 
  Layers, 
  Info, 
  CheckCircle2, 
  ArrowUpRight,
  Filter,
  Eye,
  SlidersHorizontal,
  Flame,
  Scale
} from 'lucide-react';
import { SurahData } from '../types';
import { 
  calculateQuranGoldenRatioStats, 
  SurahGoldenStat, 
  QuranGoldenRatioGlobalStats 
} from '../utils/goldenRatioStats';
import { formatSurahName } from '../utils/arabic';
import { PHI, PHI_INV } from '../utils/goldenRatio';

interface SurahGoldenRatioScatterPlotProps {
  surahs: SurahData[];
  selectedSurahNumber: number;
  onSelectSurah: (surahNumber: number) => void;
  onOpenDetailModal?: (surahNumber: number) => void;
  isDark: boolean;
}

export const SurahGoldenRatioScatterPlot: React.FC<SurahGoldenRatioScatterPlotProps> = ({
  surahs,
  selectedSurahNumber,
  onSelectSurah,
  onOpenDetailModal,
  isDark
}) => {
  // Global Quran Golden Stats
  const globalStats: QuranGoldenRatioGlobalStats = useMemo(() => {
    return calculateQuranGoldenRatioStats(surahs);
  }, [surahs]);

  // Selected surah enriched stat
  const selectedSurahStat = useMemo(() => {
    return globalStats.surahStats.find(s => s.surahNumber === selectedSurahNumber) 
      || globalStats.surahStats[0];
  }, [globalStats, selectedSurahNumber]);

  // Interactive controls state
  const [xAxisKey, setXAxisKey] = useState<'totalWords' | 'surahNumber' | 'totalAyahs' | 'ttr'>('totalWords');
  const [yAxisKey, setYAxisKey] = useState<'ratioToMean' | 'convergencePct' | 'totalWords' | 'avgAyahWords'>('ratioToMean');
  const [revelationFilter, setRevelationFilter] = useState<'all' | 'Meccan' | 'Medinan'>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'phi' | 'phi-inv' | 'high-harmony'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeExemplarTab, setActiveExemplarTab] = useState<'phi' | 'phi-inv' | 'all'>('phi');

  // Filtered scatter points
  const scatterData = useMemo(() => {
    return globalStats.surahStats.filter(item => {
      // Revelation filter
      if (revelationFilter !== 'all' && item.revelationType !== revelationFilter) {
        return false;
      }
      // Tier filter
      if (tierFilter === 'phi') {
        // Within ~25% of Phi factor (1.618)
        if (Math.abs(item.ratioToMean - PHI) / PHI > 0.25) return false;
      } else if (tierFilter === 'phi-inv') {
        // Within ~25% of Inverse Phi factor (0.618)
        if (Math.abs(item.ratioToMean - PHI_INV) / PHI_INV > 0.25) return false;
      } else if (tierFilter === 'high-harmony') {
        if (item.convergencePct < 80) return false;
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.trim();
        const matchName = item.surahName.includes(q);
        const matchEng = item.englishName.toLowerCase().includes(q.toLowerCase());
        const matchNum = item.surahNumber.toString() === q;
        if (!matchName && !matchEng && !matchNum) return false;
      }
      return true;
    });
  }, [globalStats, revelationFilter, tierFilter, searchQuery]);

  // Axis configuration labels
  const xAxisLabel = useMemo(() => {
    switch (xAxisKey) {
      case 'totalWords': return 'عدد كلمات السورة (Word Count W)';
      case 'surahNumber': return 'ترتيب السورة في المصحف (1 - 114)';
      case 'totalAyahs': return 'عدد آيات السورة (Ayahs Count A)';
      case 'ttr': return 'نسبة التنوع المعجمي (TTR %)';
    }
  }, [xAxisKey]);

  const yAxisLabel = useMemo(() => {
    switch (yAxisKey) {
      case 'ratioToMean': return 'النسبة إلى المتوسط القرآني العام (W / W̄)';
      case 'convergencePct': return 'معامل التقارب والتناسق الذهبي (% Convergence)';
      case 'totalWords': return 'عدد كلمات السورة (Word Count W)';
      case 'avgAyahWords': return 'معدل طول الآية بالكلمات (Words / Ayah)';
    }
  }, [yAxisKey]);

  // Tooltip component
  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: SurahGoldenStat = payload[0].payload;
    const isSelected = data.surahNumber === selectedSurahNumber;

    return (
      <div className={`p-4 rounded-xl shadow-2xl border text-right max-w-xs transition-all pointer-events-none select-none z-50 ${
        isDark 
          ? 'bg-slate-900/95 backdrop-blur-md border-indigo-500/40 text-slate-100 shadow-indigo-950/50' 
          : 'bg-white/95 backdrop-blur-md border-indigo-200 text-slate-900 shadow-slate-300'
      }`} dir="rtl">
        <div className="flex items-center justify-between gap-3 border-b pb-2 mb-2 border-slate-700/40">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-mono text-xs font-bold flex items-center justify-center">
              {data.surahNumber}
            </span>
            <span className="font-serif font-bold text-base text-amber-300">
              {formatSurahName(data.surahName)}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
            data.isMeccan 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
          }`}>
            {data.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
          </span>
        </div>

        <div className="space-y-1.5 text-xs font-sans">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">إجمالي الكلمات:</span>
            <span className="font-mono font-bold text-amber-400">
              {data.totalWords.toLocaleString()} كلمة
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">النسبة للمتوسط العام ({globalStats.meanWordsPerSurah}):</span>
            <span className="font-mono font-bold text-sky-400">
              {data.ratioToMean}×
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">المستوى الذهبي الأقرب:</span>
            <span className="font-bold text-amber-300 text-[11px]">
              {data.nearestTier.nameArabic}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-400">الاتساق الذهبي:</span>
            <span className={`font-mono font-bold text-xs ${
              data.convergencePct >= 85 ? 'text-emerald-400' : data.convergencePct >= 70 ? 'text-amber-400' : 'text-slate-300'
            }`}>
              {data.convergencePct}% ({data.harmonyTier})
            </span>
          </div>

          {/* Convergence Mini Bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1">
            <div 
              className={`h-full rounded-full transition-all ${
                data.convergencePct >= 85 ? 'bg-emerald-500' : data.convergencePct >= 70 ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(100, data.convergencePct)}%` }}
            />
          </div>

          <div className="pt-2 border-t border-slate-700/40 text-[11px] text-slate-400 flex items-center justify-between">
            <span>آية القطع الذهبي:</span>
            <span className="font-mono font-bold text-purple-300">
              الآية ﴿{data.internalGoldenAyah}﴾ من أصل {data.totalAyahs}
            </span>
          </div>

          {isSelected ? (
            <div className="mt-2 text-center text-[10px] font-bold text-amber-400 bg-amber-500/10 py-1 rounded border border-amber-500/20">
              ★ السورة المحددة حالياً في المختبر
            </div>
          ) : (
            <div className="mt-2 text-center text-[10px] text-indigo-400 bg-indigo-500/10 py-1 rounded">
              انقر لاختيار السورة وعرض تحليلها الكامل ↵
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 4 Statistical KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Mean Words in Quran */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">المتوسط القرآني العام (W̄)</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-indigo-400">
              {globalStats.meanWordsPerSurah}
            </span>
            <span className="text-xs text-slate-400 font-sans">كلمة / سورة</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-800/40">
            <span>إجمالي القرآن: {globalStats.totalWords.toLocaleString()} كلمة</span>
            <span>σ = {globalStats.stdDevWords}</span>
          </div>
        </div>

        {/* Golden Phi Proportionality Benchmark */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">النسبة الذهبية الكبرى (φ × W̄)</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
              {globalStats.phiTimesMeanWords}
            </span>
            <span className="text-xs text-slate-400 font-sans">كلمة (φ = 1.618)</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400/80 flex items-center justify-between pt-2 border-t border-slate-800/40 font-mono">
            <span>سورة الزمر (1,177)</span>
            <span>سورة النمل (1,160)</span>
          </div>
        </div>

        {/* Inverse Phi Proportionality Benchmark */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">معكوس النسبة الذهبية (1/φ × W̄)</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-sky-400">
              {globalStats.phiInvTimesMeanWords}
            </span>
            <span className="text-xs text-slate-400 font-sans">كلمة (1/φ = 0.618)</span>
          </div>
          <div className="mt-2 text-[11px] text-sky-400/80 flex items-center justify-between pt-2 border-t border-slate-800/40 font-mono">
            <span>سورة الحشر (447)</span>
            <span>سورة الواقعة (379)</span>
          </div>
        </div>

        {/* Global Harmony Alignment Score */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">معدل الاتساق الذهبي القرآني</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
              {globalStats.globalMeanConvergencePct}%
            </span>
            <span className="text-xs text-slate-400 font-sans">تطابق رياضي</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400/80 flex items-center justify-between pt-2 border-t border-slate-800/40">
            <span>{globalStats.highConvergenceSurahsCount} سورة باتساق ≥ 80%</span>
            <span>توزيع متزن</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Scatter Plot Container */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-900/80 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Controls Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold flex items-center gap-2 text-amber-400">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>المخطط المبعثر للتناسب والنسبة الذهبية (Golden Ratio Scatter Plot)</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                114 سورة قرآنية
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              تحليل التناسب الإحصائي لكلمات كل سورة مقارنة بالمتوسط العام للقرآن (W̄ = {globalStats.meanWordsPerSurah}) وخطوط القطع الذهبي الهندسية (φ = 1.618 و 1/φ = 0.618).
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[200px]">
            <input
              type="text"
              placeholder="ابحث عن سورة أو رقمها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-3 py-1.5 pl-8 rounded-xl text-xs border outline-none transition-all ${
                isDark 
                  ? 'bg-slate-800/90 border-slate-700 text-white focus:border-amber-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500'
              }`}
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 text-xs">
          {/* Axis Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">المحور الأفقي (X):</span>
              <select
                value={xAxisKey}
                onChange={(e) => setXAxisKey(e.target.value as any)}
                aria-label="اختر المحور الأفقي"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border outline-none cursor-pointer ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                }`}
              >
                <option value="totalWords">عدد كلمات السورة (Word Count)</option>
                <option value="surahNumber">ترتيب السور في المصحف (1 - 114)</option>
                <option value="totalAyahs">عدد آيات السورة (Ayahs Count)</option>
                <option value="ttr">التنوع المعجمي (TTR %)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">المحور الرأسي (Y):</span>
              <select
                value={yAxisKey}
                onChange={(e) => setYAxisKey(e.target.value as any)}
                aria-label="اختر المحور الرأسي"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border outline-none cursor-pointer ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                }`}
              >
                <option value="ratioToMean">النسبة إلى المتوسط العام (W / W̄)</option>
                <option value="convergencePct">معامل التناسب الذهبي (% Convergence)</option>
                <option value="totalWords">عدد كلمات السورة (Word Count)</option>
                <option value="avgAyahWords">معدل طول الآية بالكلمات</option>
              </select>
            </div>
          </div>

          {/* Revelation & Golden Tier Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Revelation Filter */}
            <div className={`flex items-center p-0.5 rounded-lg border ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setRevelationFilter('all')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  revelationFilter === 'all'
                    ? (isDark ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-indigo-700 shadow-xs')
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                الكل (114)
              </button>
              <button
                type="button"
                onClick={() => setRevelationFilter('Meccan')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  revelationFilter === 'Meccan'
                    ? (isDark ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-800 shadow-xs')
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                مكية (86)
              </button>
              <button
                type="button"
                onClick={() => setRevelationFilter('Medinan')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  revelationFilter === 'Medinan'
                    ? (isDark ? 'bg-purple-600 text-white shadow-xs' : 'bg-purple-100 text-purple-800 shadow-xs')
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                مدنية (28)
              </button>
            </div>

            {/* Golden Tier Filter */}
            <div className={`flex items-center p-0.5 rounded-lg border ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setTierFilter('all')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  tierFilter === 'all'
                    ? (isDark ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-100 text-amber-900 shadow-xs')
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                كافة التناسبات
              </button>
              <button
                type="button"
                onClick={() => setTierFilter('phi')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  tierFilter === 'phi'
                    ? (isDark ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-100 text-amber-900 shadow-xs')
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="السور القريبة من النسبة الذهبية الكبرى 1.618"
              >
                نطاق φ (1.618)
              </button>
              <button
                type="button"
                onClick={() => setTierFilter('phi-inv')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  tierFilter === 'phi-inv'
                    ? (isDark ? 'bg-sky-600 text-white shadow-xs' : 'bg-sky-100 text-sky-900 shadow-xs')
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="السور القريبة من معكوس النسبة الذهبية 0.618"
              >
                نطاق 1/φ (0.618)
              </button>
              <button
                type="button"
                onClick={() => setTierFilter('high-harmony')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  tierFilter === 'high-harmony'
                    ? (isDark ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-900 shadow-xs')
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="السور ذات الاتساق الذهبي العالي ≥ 80%"
              >
                فائقة الاتساق (≥ 80%)
              </button>
            </div>
          </div>
        </div>

        {/* Legend Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 text-[11px] font-sans">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-xs shadow-amber-500/50"></span>
              خط النسبة الذهبية (φ = 1.618)
            </span>
            <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
              <span className="w-3 h-3 rounded-full bg-sky-500 inline-block shadow-xs shadow-sky-500/50"></span>
              خط معكوس النسبة (1/φ = 0.618)
            </span>
            <span className="flex items-center gap-1.5 text-purple-400 font-semibold">
              <span className="w-3 h-0.5 bg-purple-500 border-dashed inline-block"></span>
              المتوسط القرآني (W̄ = {globalStats.meanWordsPerSurah})
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              سورة مكية
            </span>
            <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
              سورة مدنية
            </span>
          </div>

          <div className="text-slate-400 text-[10px]">
            عرض <strong className="text-amber-400 font-mono">{scatterData.length}</strong> من أصل 114 سورة (انقر على أي نقطة لاختيار السورة)
          </div>
        </div>

        {/* The Recharts Scatter Canvas */}
        <div className="h-[420px] w-full mt-2" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 30, bottom: 25, left: 15 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDark ? '#1e293b' : '#e2e8f0'} 
              />

              <XAxis 
                type="number" 
                dataKey={xAxisKey} 
                name={xAxisLabel}
                stroke={isDark ? '#64748b' : '#94a3b8'} 
                fontSize={11}
                tick={{ fill: isDark ? '#94a3b8' : '#64748b' }}
                label={{ 
                  value: xAxisLabel, 
                  position: 'insideBottom', 
                  offset: -15, 
                  fill: isDark ? '#94a3b8' : '#64748b', 
                  fontSize: 11,
                  fontFamily: 'system-ui'
                }}
              />

              <YAxis 
                type="number" 
                dataKey={yAxisKey} 
                name={yAxisLabel}
                stroke={isDark ? '#64748b' : '#94a3b8'} 
                fontSize={11}
                tick={{ fill: isDark ? '#94a3b8' : '#64748b' }}
                label={{ 
                  value: yAxisLabel, 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: 0,
                  fill: isDark ? '#94a3b8' : '#64748b', 
                  fontSize: 11,
                  fontFamily: 'system-ui'
                }}
              />

              <ZAxis type="number" range={[45, 120]} />

              <Tooltip 
                content={<CustomScatterTooltip />} 
                cursor={{ strokeDasharray: '3 3', stroke: isDark ? '#475569' : '#cbd5e1' }}
              />

              {/* Reference Lines when Y-Axis is Ratio to Mean */}
              {yAxisKey === 'ratioToMean' && (
                <>
                  {/* Horizontal Line for Phi^2 (2.618) */}
                  <ReferenceLine 
                    y={2.61803} 
                    stroke="#10b981" 
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{ 
                      value: 'φ² = 2.618 (المربع الذهبي)', 
                      fill: '#10b981', 
                      fontSize: 10, 
                      position: 'top'
                    }}
                  />

                  {/* Horizontal Line for Phi (1.618) */}
                  <ReferenceLine 
                    y={1.61803} 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    label={{ 
                      value: 'φ = 1.618 (النسبة الذهبية)', 
                      fill: '#f59e0b', 
                      fontSize: 10, 
                      position: 'top',
                      offset: 5
                    }}
                  />

                  {/* Horizontal Line for Mean Unity (1.000) */}
                  <ReferenceLine 
                    y={1.00000} 
                    stroke="#8b5cf6" 
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    label={{ 
                      value: 'المتوسط القرآني (1.00)', 
                      fill: '#8b5cf6', 
                      fontSize: 10, 
                      position: 'right'
                    }}
                  />

                  {/* Horizontal Line for Inverse Phi (0.618) */}
                  <ReferenceLine 
                    y={0.61803} 
                    stroke="#0284c7" 
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    label={{ 
                      value: '1/φ = 0.618 (معكوس الذهبية)', 
                      fill: '#0284c7', 
                      fontSize: 10, 
                      position: 'bottom',
                      offset: 5
                    }}
                  />

                  {/* Horizontal Line for Inverse Phi^2 (0.382) */}
                  <ReferenceLine 
                    y={0.38197} 
                    stroke="#06b6d4" 
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{ 
                      value: '1/φ² = 0.382 (المعكوس التربيعي)', 
                      fill: '#06b6d4', 
                      fontSize: 10, 
                      position: 'bottom'
                    }}
                  />
                </>
              )}

              {/* Vertical Reference Lines when X-Axis is Total Words */}
              {xAxisKey === 'totalWords' && (
                <>
                  <ReferenceLine 
                    x={globalStats.meanWordsPerSurah} 
                    stroke="#8b5cf6" 
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  <ReferenceLine 
                    x={globalStats.phiTimesMeanWords} 
                    stroke="#f59e0b" 
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  <ReferenceLine 
                    x={globalStats.phiInvTimesMeanWords} 
                    stroke="#0284c7" 
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                </>
              )}

              {/* Scatter Points */}
              <Scatter 
                data={scatterData} 
                onClick={(e: any) => {
                  const sNum = e?.surahNumber || e?.payload?.surahNumber || e?.activePayload?.[0]?.payload?.surahNumber;
                  if (sNum) {
                    onSelectSurah(sNum);
                  }
                }}
                className="cursor-pointer"
              >
                {scatterData.map((entry) => {
                  const isSelected = entry.surahNumber === selectedSurahNumber;
                  // Color determination
                  let pointFill = entry.isMeccan ? '#10b981' : '#6366f1'; // Meccan Emerald vs Medinan Indigo
                  
                  if (isSelected) {
                    pointFill = '#f59e0b'; // Selected Gold
                  } else if (entry.convergencePct >= 90) {
                    pointFill = entry.isMeccan ? '#34d399' : '#818cf8';
                  }

                  return (
                    <Cell 
                      key={`scatter-cell-${entry.surahNumber}`} 
                      fill={pointFill}
                      stroke={isSelected ? '#ffffff' : (isDark ? '#0f172a' : '#ffffff')}
                      strokeWidth={isSelected ? 3 : 1.5}
                      className={isSelected ? 'animate-pulse' : ''}
                      onClick={() => onSelectSurah(entry.surahNumber)}
                    />
                  );
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Selected Surah Golden Analysis Spotlight */}
        <div className={`mt-5 p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
          isDark 
            ? 'bg-gradient-to-r from-amber-500/10 via-slate-800/60 to-indigo-500/10 border-amber-500/30' 
            : 'bg-gradient-to-r from-amber-50 via-white to-indigo-50 border-amber-200 shadow-xs'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-lg font-mono shadow-md shadow-amber-500/20">
              {selectedSurahStat.surahNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400 font-semibold font-sans">السورة المحددة حالياً:</span>
                <h3 className="text-lg font-bold font-serif text-amber-300">
                  {formatSurahName(selectedSurahStat.surahName)}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  selectedSurahStat.isMeccan 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                }`}>
                  {selectedSurahStat.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                <span>الكلمات: <strong className="font-mono text-amber-400">{selectedSurahStat.totalWords}</strong> كلمة</span>
                <span className="opacity-40">•</span>
                <span>النسبة للمتوسط العام: <strong className="font-mono text-sky-400">{selectedSurahStat.ratioToMean}×</strong> ({selectedSurahStat.differenceFromMean >= 0 ? `+${selectedSurahStat.differenceFromMean}` : selectedSurahStat.differenceFromMean} كلمة)</span>
                <span className="opacity-40">•</span>
                <span>المستوى الذهبي: <strong className="text-amber-300">{selectedSurahStat.nearestTier.nameArabic}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-left font-mono">
              <div className="text-[10px] text-slate-400">الاتساق الذهبي:</div>
              <div className={`text-xl font-bold ${
                selectedSurahStat.convergencePct >= 85 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {selectedSurahStat.convergencePct}%
              </div>
              <div className="text-[10px] text-slate-400 font-sans">({selectedSurahStat.harmonyTier})</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-right text-xs">
              <div className="text-slate-400 text-[10px]">القطع الذهبي الداخلي للسورة:</div>
              <div className="font-semibold text-purple-300 mt-0.5">
                الآية ﴿{selectedSurahStat.internalGoldenAyah}﴾ من {selectedSurahStat.totalAyahs} آية
              </div>
              <div className="text-[10px] text-slate-500">
                (نسبة مقطعي الآيات: {selectedSurahStat.internalAyahsPhiRatio} ≈ φ)
              </div>
            </div>

            {onOpenDetailModal && (
              <button
                type="button"
                onClick={() => onOpenDetailModal(selectedSurahStat.surahNumber)}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:scale-105"
                title="عرض التحليل المفصل الشامل لهذه السورة في نافذة مستقلة"
              >
                <span>التحليل المفصل للسورة</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top Golden Exemplars Section */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-400">
              <Award className="w-4 h-4 text-indigo-400" />
              <span>أبرز السور المحققة للتناسب والنسبة الذهبية مع المتوسط العام</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              السور التي تتوافق أعداد كلماتها بدقة هندسية استثنائية مع مضاعفات النسبة الذهبية للقرآن الكريم. انقر على أي بطاقة لاختيارها فوراً.
            </p>
          </div>

          {/* Exemplar Tab Switcher */}
          <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveExemplarTab('phi')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeExemplarTab === 'phi'
                  ? (isDark ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-100 text-amber-900 shadow-xs')
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              نطاق φ المباشر (≈ 1,100 كلمة)
            </button>
            <button
              onClick={() => setActiveExemplarTab('phi-inv')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeExemplarTab === 'phi-inv'
                  ? (isDark ? 'bg-sky-600 text-white shadow-xs' : 'bg-sky-100 text-sky-900 shadow-xs')
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              نطاق معكوس 1/φ (≈ 420 كلمة)
            </button>
            <button
              onClick={() => setActiveExemplarTab('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeExemplarTab === 'all'
                  ? (isDark ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-900 shadow-xs')
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الأعلى اتساقاً عاماً (≥ 90%)
            </button>
          </div>
        </div>

        {/* Exemplars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {(activeExemplarTab === 'phi' 
            ? globalStats.topPhiSurahs 
            : activeExemplarTab === 'phi-inv' 
              ? globalStats.topPhiInvSurahs 
              : globalStats.topOverallConvergenceSurahs
          ).map((item) => {
            const isSelected = item.surahNumber === selectedSurahNumber;

            return (
              <div
                key={item.surahNumber}
                onClick={() => onSelectSurah(item.surahNumber)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                  isSelected
                    ? (isDark 
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10' 
                        : 'bg-amber-50 border-amber-400 text-amber-950 shadow-sm')
                    : (isDark 
                        ? 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white shadow-xs')
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-700/60 text-slate-300 font-mono text-xs font-bold flex items-center justify-center group-hover:bg-amber-500/20 group-hover:text-amber-400 transition-colors">
                        {item.surahNumber}
                      </span>
                      <span className="font-serif font-bold text-sm group-hover:text-amber-300 transition-colors">
                        {formatSurahName(item.surahName)}
                      </span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                      item.isMeccan ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      {item.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs font-mono mt-2">
                    <span className="text-slate-400 font-sans text-[11px]">الكلمات:</span>
                    <span className="font-bold text-amber-400">{item.totalWords} كلمة</span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs font-mono mt-1">
                    <span className="text-slate-400 font-sans text-[11px]">النسبة للمتوسط:</span>
                    <span className="font-bold text-sky-400">{item.ratioToMean}×</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/30 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 text-[10px]">{item.nearestTier.nameArabic}</span>
                  <span className={`font-mono font-bold ${
                    item.convergencePct >= 90 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {item.convergencePct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SurahGoldenRatioScatterPlot;
