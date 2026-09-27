import React, { useState, useMemo } from 'react';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { useTheme } from '../context/ThemeContext';
import { 
  analyzeSurahVerseEndings, 
  SurahVerseEndingsAnalysis, 
  VerseEndingItem 
} from '../utils/verseEndings';
import { formatSurahName } from '../utils/arabic';
import { SectionHelpButton } from './SectionHelpModal';
import { 
  Music, 
  Search, 
  Sparkles, 
  Filter, 
  ChevronRight, 
  ChevronLeft, 
  BarChart3, 
  List, 
  Layers, 
  Info,
  CheckCircle2,
  TrendingUp,
  Volume2
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

interface VerseEndingsLabProps {
  onSelectSurah?: (surahNumber: number) => void;
  onOpenInReader?: (surahNumber: number) => void;
}

const VerseEndingsLabComponent: React.FC<VerseEndingsLabProps> = ({ 
  onSelectSurah, 
  onOpenInReader 
}) => {
  const { corpus, surahs } = useQuranCorpus();
  const { theme } = useTheme();

  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1);
  const [activeSubTab, setActiveSubTab] = useState<'ribbon' | 'distribution' | 'atlas'>('ribbon');
  const [atlasFilter, setAtlasFilter] = useState<'all' | 'monorhyme' | 'birhyme' | 'multirhyme'>('all');
  const [atlasSearch, setAtlasSearch] = useState<string>('');

  // Selected surah corpus
  const currentSurahCorpus = useMemo(() => {
    return corpus.find(c => c.number === selectedSurahNumber) || corpus[0];
  }, [corpus, selectedSurahNumber]);

  // Current surah endings analysis
  const analysis: SurahVerseEndingsAnalysis = useMemo(() => {
    if (!currentSurahCorpus) {
      return {
        surahNumber: 1,
        surahName: 'الفاتحة',
        totalVerses: 7,
        dominantLetter: 'ن',
        dominantLetterName: 'نون',
        dominantPercentage: 71.4,
        uniformityScore: 65,
        rhymeType: 'birhyme',
        rhymeTypeLabel: 'ثنائية الفاصلة (ن و م)',
        letterFrequencies: [],
        familyFrequencies: [],
        shiftPoints: [],
        verseEndings: []
      };
    }
    return analyzeSurahVerseEndings(currentSurahCorpus);
  }, [currentSurahCorpus]);

  // Global Quran Atlas analysis for all 114 surahs
  const globalAtlas = useMemo(() => {
    return corpus.map(s => analyzeSurahVerseEndings(s));
  }, [corpus]);

  // Filtered atlas
  const filteredAtlas = useMemo(() => {
    return globalAtlas.filter(item => {
      const matchSearch = atlasSearch.trim() === '' || 
        item.surahName.includes(atlasSearch.trim()) || 
        item.dominantLetter.includes(atlasSearch.trim()) ||
        item.surahNumber.toString() === atlasSearch.trim();
      
      const matchFilter = atlasFilter === 'all' || item.rhymeType === atlasFilter;
      return matchSearch && matchFilter;
    });
  }, [globalAtlas, atlasSearch, atlasFilter]);

  const isDark = theme === 'dark';

  return (
    <div className="w-full space-y-5 animate-fadeIn">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900/90 via-[#131B2A]/90 to-slate-900/90 border-slate-800 shadow-xl' 
          : 'bg-gradient-to-r from-sky-50 via-white to-indigo-50/40 border-sky-100 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  مختبر فواصل الآيات والإيقاع الصوتي
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  صوتيات ولسانيات
                </span>
                <SectionHelpButton 
                  guideId="verse-endings-lab" 
                  variant="button" 
                  title="استعلام ودليل مختبر الفواصل" 
                />
              </div>
              <p className={`text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                دراسة حروف الروي في نهايات الآيات، ونسب تجانس الإيقاع الصوتي، وكشف تحولات الفاصلة الموسيقية مع تبدل المقاصد القرآنية.
              </p>
            </div>
          </div>

          {/* Quick Surah Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium whitespace-nowrap">السورة:</label>
            <select
              value={selectedSurahNumber}
              onChange={(e) => setSelectedSurahNumber(Number(e.target.value))}
              aria-label="اختر السورة لتحليل فواصل الآيات"
              className={`px-3 py-2 rounded-xl text-sm font-semibold border outline-none cursor-pointer transition-all ${
                isDark 
                  ? 'bg-slate-800/90 border-slate-700 text-white focus:border-sky-500' 
                  : 'bg-white border-slate-200 text-slate-800 focus:border-sky-500 shadow-sm'
              }`}
            >
              {surahs.map(s => (
                <option key={s.number} value={s.number}>
                  {s.number}. {formatSurahName(s.name)} ({s.totalAyahs} آية)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Top 4 KPI Metric Cards for Current Surah */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {/* Dominant Rhyme */}
          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white/80 border-slate-200'}`}>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>حرف الروي السائد</span>
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-sky-400">
                {analysis.dominantLetter}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({analysis.dominantLetterName})
              </span>
              <span className="text-xs font-semibold text-emerald-400 ml-auto">
                {analysis.dominantPercentage}%
              </span>
            </div>
          </div>

          {/* Uniformity Score */}
          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white/80 border-slate-200'}`}>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>مؤشر التجانس الصوتي</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {analysis.uniformityScore}%
              </span>
              <span className="text-xs text-slate-400">
                {analysis.uniformityScore >= 80 ? 'عالي التجانس' : analysis.uniformityScore >= 50 ? 'متوسط' : 'متنوع'}
              </span>
            </div>
          </div>

          {/* Rhyme Cadence Type */}
          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white/80 border-slate-200'}`}>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>طبيعة الفاصلة</span>
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="mt-1">
              <div className="text-sm font-bold text-indigo-400 truncate">
                {analysis.rhymeType === 'monorhyme' ? 'أحادية الروي' : analysis.rhymeType === 'birhyme' ? 'ثنائية الروي' : 'متعددة الإيقاع'}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {analysis.rhymeTypeLabel}
              </div>
            </div>
          </div>

          {/* Shift Points */}
          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white/80 border-slate-200'}`}>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>تحولات الفاصلة الموسيقية</span>
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {analysis.shiftPoints.length}
              </span>
              <span className="text-xs text-slate-400">
                نقطة تحول سياقية
              </span>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/60">
          <button
            onClick={() => setActiveSubTab('ribbon')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'ribbon'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            شريط الآيات وحروف الروي ({analysis.totalVerses})
          </button>
          <button
            onClick={() => setActiveSubTab('distribution')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'distribution'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            توزيع ونسب الفواصل
          </button>
          <button
            onClick={() => setActiveSubTab('atlas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'atlas'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            أطلس فواصل القرآن الـ 114
          </button>
        </div>
      </div>

      {/* Sub-tab 1: Ribbon & Verse by Verse Details */}
      {activeSubTab === 'ribbon' && (
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>مسار فواصل سورة {analysis.surahName}</span>
                <span className="text-xs text-slate-400">({analysis.totalVerses} آية)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تتبع انسياب حروف الروي في أواخر الآيات وكيفية تناغمها الصوتي.
              </p>
            </div>
            
            {/* Visual Color Legend */}
            <div className="flex items-center gap-2 flex-wrap">
              {analysis.letterFrequencies.slice(0, 5).map(lf => (
                <div key={lf.letter} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-800/50 border border-slate-700/50">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lf.color }}></span>
                  <span className="font-mono font-bold">{lf.letter}</span>
                  <span className="text-slate-400">{lf.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verse Endings Grid / List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[600px] overflow-y-auto pr-1">
            {analysis.verseEndings.map((ve) => {
              const isDominant = ve.rhymeLetter === analysis.dominantLetter;
              return (
                <div 
                  key={ve.verseNumber}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isDark 
                      ? 'bg-slate-800/40 border-slate-800 hover:border-slate-700' 
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-sky-50/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-sky-500/10 text-sky-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {ve.verseNumber}
                    </span>
                    <div className="min-w-0 truncate">
                      <div className="text-sm font-semibold truncate font-serif">
                        ... {ve.lastWord}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span>الضبط: {ve.harakah}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span 
                      className={`px-2 py-1 rounded-md text-xs font-bold font-mono flex items-center justify-center min-w-[28px] ${
                        isDominant 
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' 
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {ve.rhymeLetter}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shift Points Notification (if any) */}
          {analysis.shiftPoints.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                تحول إيقاع الفاصلة عند الآيات: {analysis.shiftPoints.map(p => `[الآية ${p.verseNumber}: من ${p.fromLetter} إلى ${p.toLetter}]`).join('، ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 2: Distribution & Charts */}
      {activeSubTab === 'distribution' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className="text-sm font-bold mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              تكرار حروف الروي في سورة {analysis.surahName}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              النسب المئوية لكل حرف فاصلة من إجمالي {analysis.totalVerses} آية.
            </p>

            <div className="h-[280px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.letterFrequencies} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="letter" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      borderRadius: '8px',
                      fontSize: '12px',
                      direction: 'rtl'
                    }} 
                    formatter={(val: any) => [`${val} آية`, 'التكرار']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {analysis.letterFrequencies.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Family Groups Breakdown */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className="text-sm font-bold mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              العوائل الصوتية لفواصل السورة
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              تصنيف نهايات الآيات حسب المخارج والخصائص الصوتية المعتمدة في الإيقاع القرآني.
            </p>

            <div className="space-y-3">
              {analysis.familyFrequencies.map(f => (
                <div key={f.family} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }}></span>
                      {f.name}
                    </span>
                    <span className="font-mono text-slate-400">{f.count} آية ({f.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${f.percentage}%`, backgroundColor: f.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Academic Footnote */}
            <div className="mt-5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-400 text-[11px] leading-relaxed">
              <span className="text-sky-400 font-semibold">ملاحظة بلاغية: </span>
              تمثل فواصل المد والتمكين (النون والميم) النمط الأوسع انتشاراً في القرآن الكريم، وتضفي نغمة هادئة مسترسلة تناسب الأحكام والقصص، بينما الفواصل المقلقلة والمشدودة تظهر بكثافة في مشاهد القيامة والإنذار.
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Quran 114 Surahs Atlas */}
      {activeSubTab === 'atlas' && (
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>أطلس فواصل القرآن الكريم كاملاً</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {filteredAtlas.length} سورة
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                مقارنة شاملة لحروف الروي السائدة ودرجة التجانس الصوتي عبر سور القرآن الـ 114.
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث عن سورة أو حرف..."
                  value={atlasSearch}
                  onChange={(e) => setAtlasSearch(e.target.value)}
                  className={`px-3 py-1.5 pl-8 rounded-lg text-xs border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {/* Type filter */}
              <select
                value={atlasFilter}
                onChange={(e) => setAtlasFilter(e.target.value as any)}
                aria-label="تصفية فواصل السور حسب النمط"
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <option value="all">كل الأنماط (114)</option>
                <option value="monorhyme">أحادية الفاصلة فقط (&gt;=85%)</option>
                <option value="birhyme">ثنائية الفاصلة</option>
                <option value="multirhyme">متعددة الإيقاع</option>
              </select>
            </div>
          </div>

          {/* Surahs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">السورة</th>
                  <th className="py-2.5 px-3">عدد الآيات</th>
                  <th className="py-2.5 px-3">حرف الروي السائد</th>
                  <th className="py-2.5 px-3">نسبة الهيمنة</th>
                  <th className="py-2.5 px-3">مؤشر التجانس</th>
                  <th className="py-2.5 px-3">النمط الصوتي</th>
                  <th className="py-2.5 px-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono">
                {filteredAtlas.map((item) => (
                  <tr 
                    key={item.surahNumber}
                    className={`transition-colors cursor-pointer ${
                      item.surahNumber === selectedSurahNumber
                        ? isDark ? 'bg-sky-500/10' : 'bg-sky-50'
                        : isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => {
                      setSelectedSurahNumber(item.surahNumber);
                      setActiveSubTab('ribbon');
                    }}
                  >
                    <td className="py-2.5 px-3 text-slate-400">{item.surahNumber}</td>
                    <td className={`py-2.5 px-3 font-serif font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {formatSurahName(item.surahName)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{item.totalVerses}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20">
                        {item.dominantLetter} ({item.dominantLetterName})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-semibold">{item.dominantPercentage}%</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-amber-400" 
                            style={{ width: `${item.uniformityScore}%` }}
                          ></div>
                        </div>
                        <span className="text-amber-400 text-[11px]">{item.uniformityScore}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[11px] text-slate-400">
                      {item.rhymeType === 'monorhyme' ? (
                        <span className="text-emerald-400 font-medium">أحادية صريحة</span>
                      ) : item.rhymeType === 'birhyme' ? (
                        <span className="text-sky-400 font-medium">ثنائية الروي</span>
                      ) : (
                        <span className="text-slate-400">متعددة</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSurahNumber(item.surahNumber);
                          setActiveSubTab('ribbon');
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-sky-500 hover:text-white text-slate-300 text-[10px] font-sans transition-all"
                      >
                        تحليل الفواصل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export const VerseEndingsLab = React.memo(VerseEndingsLabComponent);
export default VerseEndingsLab;
