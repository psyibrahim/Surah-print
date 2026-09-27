import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  ArrowUpDown, 
  LayoutGrid, 
  List, 
  BookOpen, 
  Sparkles, 
  GitCompare, 
  Activity,
  Layers,
  X,
  RotateCcw,
  CheckCircle2,
  Hash
} from 'lucide-react';
import { SurahData } from '../types';
import { SectionHelpButton } from './SectionHelpModal';
import { MathTooltip } from './MathTooltip';
import { normalizeArabicText } from '../utils/arabic';
import { SAHABA_CLUSTERS, getSurahClusterDisplayInfo } from '../data/sahabaClusters';
import { BarChart3 } from 'lucide-react';

interface SurahExplorerProps {
  surahs: SurahData[];
  onSelectSurah: (surah: SurahData) => void;
  onCompareWith: (surahNumber: number) => void;
  onOpenInReader?: (surahNumber: number) => void;
  onOpenDashboard?: () => void;
}


// Arabic normalization helper using global normalizeArabicText
function normalizeArabic(text: string): string {
  return normalizeArabicText(text);
}

const SurahExplorerComponent: React.FC<SurahExplorerProps> = ({
  surahs,
  onSelectSurah,
  onCompareWith,
  onOpenInReader,
  onOpenDashboard
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Meccan' | 'Medinan'>('all');
  const [lengthFilter, setLengthFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [featureFilter, setFeatureFilter] = useState<'all' | 'absent' | 'complete' | 'uniform' | 'high-diversity'>('all');
  const [filterCluster, setFilterCluster] = useState<number | 'fatihah' | 'all'>('all');
  const [sortBy, setSortBy] = useState<
    'number' | 'ayahs-desc' | 'ayahs-asc' | 'words-desc' | 'diversity-desc' | 'absent-desc' | 'avg-asc' | 'avg-desc'
  >('number');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const resetAllFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setLengthFilter('all');
    setFeatureFilter('all');
    setFilterCluster('all');
    setSortBy('number');
  };

  const isAnyFilterActive = 
    searchTerm.trim() !== '' || 
    filterType !== 'all' || 
    lengthFilter !== 'all' || 
    featureFilter !== 'all' || 
    filterCluster !== 'all' ||
    sortBy !== 'number';

  const filteredSurahs = useMemo(() => {
    const rawSearch = searchTerm.trim();
    const normSearch = normalizeArabic(rawSearch);
    const searchNumber = parseInt(normSearch.replace(/[^0-9]/g, ''), 10);

    // Detect if search term specifically refers to Meccan / Medinan
    const isMeccanSearch = normSearch === 'مكي' || normSearch === 'مكيه' || normSearch === 'meccan';
    const isMedinanSearch = normSearch === 'مدني' || normSearch === 'مدنيه' || normSearch === 'medinan';

    return surahs.filter(s => {
      // 1. Search Matching (Name, Number, English, or Type)
      let matchSearch = true;
      if (rawSearch) {
        if (isMeccanSearch) {
          matchSearch = s.isMeccan;
        } else if (isMedinanSearch) {
          matchSearch = !s.isMeccan;
        } else {
          const normSurahName = normalizeArabic(s.name);
          const normEnglish = s.englishName.toLowerCase();
          const matchNumber = !isNaN(searchNumber) && (
            s.number === searchNumber || 
            normSearch === s.number.toString() ||
            normSearch === `#${s.number}` ||
            normSearch === `سوره ${s.number}`
          );
          const matchName = normSurahName.includes(normSearch);
          const matchEnglish = normEnglish.includes(rawSearch.toLowerCase());

          matchSearch = matchNumber || matchName || matchEnglish;
        }
      }

      // 2. Revelation Type Filter
      const matchType = filterType === 'all' || s.revelationType === filterType;

      // 3. Length Filter
      let matchLength = true;
      if (lengthFilter === 'short') matchLength = s.totalAyahs <= 10;
      else if (lengthFilter === 'medium') matchLength = s.totalAyahs > 10 && s.totalAyahs <= 50;
      else if (lengthFilter === 'long') matchLength = s.totalAyahs > 50;

      // 4. Linguistic/Mathematical Feature Filter
      let matchFeature = true;
      if (featureFilter === 'absent') matchFeature = s.letters.absentCount > 0;
      else if (featureFilter === 'complete') matchFeature = s.letters.absentCount === 0;
      else if (featureFilter === 'uniform') matchFeature = s.isUniform;
      else if (featureFilter === 'high-diversity') matchFeature = s.vocabularyDiversity >= 75;

      // 5. Cluster Filter (العناقيد السبعة لتحزيب الصحابة المأثور + استقلال الفاتحة)
      let matchCluster = true;
      if (filterCluster === 'all') {
        matchCluster = true;
      } else if (filterCluster === 'fatihah') {
        matchCluster = s.number === 1;
      } else {
        const clusterDef = SAHABA_CLUSTERS.find(c => c.id === filterCluster);
        matchCluster = clusterDef ? clusterDef.surahNumbers.includes(s.number) : true;
      }

      return matchSearch && matchType && matchLength && matchFeature && matchCluster;
    }).sort((a, b) => {
      if (sortBy === 'number') return a.number - b.number;
      if (sortBy === 'ayahs-desc') return b.totalAyahs - a.totalAyahs;
      if (sortBy === 'ayahs-asc') return a.totalAyahs - b.totalAyahs;
      if (sortBy === 'words-desc') return b.totalWords - a.totalWords;
      if (sortBy === 'diversity-desc') return b.vocabularyDiversity - a.vocabularyDiversity;
      if (sortBy === 'absent-desc') return b.letters.absentCount - a.letters.absentCount;
      if (sortBy === 'avg-asc') return a.avgAyahLengthWords - b.avgAyahLengthWords;
      if (sortBy === 'avg-desc') return b.avgAyahLengthWords - a.avgAyahLengthWords;
      return 0;
    });
  }, [surahs, searchTerm, filterType, lengthFilter, featureFilter, filterCluster, sortBy]);

  // Pre-compute top 3 letters for each surah once per surahs dataset to avoid 3,192 sort calls per render
  const surahTopLettersMap = useMemo(() => {
    const map = new Map<number, [string, number][]>();
    surahs.forEach(s => {
      const top = Object.entries(s.letters.plainPercentages)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 3) as [string, number][];
      map.set(s.number, top);
    });
    return map;
  }, [surahs]);

  return (
    <div className="space-y-4">
      
      {/* Search & Control Master Panel */}
      <div className="sci-bg sci-border rounded-xl p-2.5 sm:p-5 shadow-sm space-y-3 sm:space-y-4 transition-colors duration-200">
        
        {/* Main Search Input & Top Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3 justify-between">
          
          {/* Enhanced Search Input */}
          <div className="relative flex-1 max-w-2xl">
            <Search className="w-4 h-4 text-sky-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-surah-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم السورة، رقمها، أو نوعها..."
              className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl pr-10 pl-10 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-sans shadow-inner"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="p-1 rounded-full hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
                title="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Counter & View Mode Toggle & Help */}
          <div className="flex items-center justify-between md:justify-end gap-2.5 flex-wrap">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <span>النتائج:</span>
              <strong className="text-sky-400 font-bold px-1.5 py-0.5 rounded bg-sky-950/40 border border-sky-800/60 text-xs">
                {filteredSurahs.length}
              </strong>
              <span className="text-slate-500">من 114</span>
            </div>

            {/* View Mode Toggle (Grid / Table) */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
              <button
                id="view-mode-grid"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-xs font-medium ${
                  viewMode === 'grid' 
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="عرض بطاقات البصمات"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">شبكة</span>
              </button>
              <button
                id="view-mode-table"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-xs font-medium ${
                  viewMode === 'table' 
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="عرض جدول إحصائي شامل"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">جدول</span>
              </button>
            </div>

            {/* Dashboard Quick Switch Button */}
            {onOpenDashboard && (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-sky-400 hover:text-sky-300 hover:border-sky-500/50 hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
                title="لوحة المؤشرات الإحصائية العامة للقرآن"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">لوحة الإحصاءات</span>
              </button>
            )}

            {/* Isolated Corner Help Button */}
            <SectionHelpButton 
              guideId="explorer" 
              variant="icon" 
              title="استعلام: شرح مستكشف السور، معايير الفرز، والمنهجية الرياضية" 
            />
          </div>

        </div>

        {/* Multi-tier Quick Filter Bars */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
          
          {/* Row 1: Revelation Type & Sorter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Revelation Type Filter (النزول: مكي / مدني) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-sky-400 font-semibold ml-1">النوع:</span>
              {[
                { id: 'all', label: 'الكل (114)' },
                { id: 'Meccan', label: 'مكية (86)' },
                { id: 'Medinan', label: 'مدنية (28)' }
              ].map(type => (
                <button
                  key={type.id}
                  id={`filter-type-${type.id}`}
                  onClick={() => setFilterType(type.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    filterType === type.id
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm font-bold'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Sorter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-sky-400 font-semibold flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                الترتيب:
              </span>
              <select
                id="sort-surah-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-sky-500 font-sans shadow-sm"
              >
                <option value="number">الترتيب المصحفي (1 - 114)</option>
                <option value="ayahs-desc">الأكثر آيات (تنازلي)</option>
                <option value="ayahs-asc">الأقل آيات (تصاعدي)</option>
                <option value="words-desc">الأكثر كلمات (تنازلي)</option>
                <option value="diversity-desc">الأعلى تنوعاً معجمياً (TTR)</option>
                <option value="absent-desc">الأكثر غياباً للحروف (صفرية)</option>
                <option value="avg-desc">الأطول آيات في المتوسط</option>
                <option value="avg-asc">الأقصر آيات في المتوسط</option>
              </select>
            </div>

          </div>

          {/* Row 2: Length & Characteristics Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            
            {/* Length Filter (قصار / متوسطة / طوال) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-sky-400 font-semibold ml-1">طول السورة:</span>
              {[
                { id: 'all', label: 'الكل' },
                { id: 'short', label: 'قصار (≤10 آيات)' },
                { id: 'medium', label: 'متوسطة (11-50)' },
                { id: 'long', label: 'طوال (>50 آية)' }
              ].map(len => (
                <button
                  key={len.id}
                  onClick={() => setLengthFilter(len.id as any)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                    lengthFilter === len.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                      : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border border-slate-800'
                  }`}
                >
                  {len.label}
                </button>
              ))}
            </div>

            {/* Linguistic / Characteristic Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-sky-400 font-semibold ml-1">الخصائص:</span>
              {[
                { id: 'all', label: 'الكل' },
                { id: 'absent', label: 'بها حروف غائبة' },
                { id: 'complete', label: 'كاملة الحروف (28)' },
                { id: 'uniform', label: 'إيقاع منتظم' },
                { id: 'high-diversity', label: 'تنوع معجمي > 75٪' }
              ].map(feat => (
                <button
                  key={feat.id}
                  onClick={() => setFeatureFilter(feat.id as any)}
                  className={`px-2 py-0.5 rounded-md text-[11px] transition-all ${
                    featureFilter === feat.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                      : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border border-slate-800'
                  }`}
                >
                  {feat.label}
                </button>
              ))}
            </div>

          </div>

          {/* Row 3: Clusters Filter & Clear Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            
            {/* Cluster Filter - العناقيد السبعة لتحزيب الصحابة المأثور + استقلال الفاتحة */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-sky-400 font-semibold ml-1">العناقيد السبعة (الأحزاب):</span>
              <button
                onClick={() => setFilterCluster('all')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-all ${
                  filterCluster === 'all'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 font-bold shadow-2xs'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                الكل (114)
              </button>
              <button
                onClick={() => setFilterCluster('fatihah')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-all flex items-center gap-1 ${
                  filterCluster === 'fatihah'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold shadow-2xs ring-1 ring-amber-500/40'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
                title="سورة الفاتحة: مستقلة تماماً كفاتحة وأم للكتاب"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>الفاتحة (مستقلة)</span>
              </button>
              {SAHABA_CLUSTERS.map(c => {
                const isSelected = filterCluster === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setFilterCluster(c.id)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? `${c.badgeBg} font-bold ring-1 ring-white/20 shadow-xs`
                        : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border border-slate-800'
                    }`}
                    title={`${c.name} (${c.traditionalLabel}) • ${c.subtitle} • ${c.countRule}`}
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full shrink-0" 
                      style={{ backgroundColor: c.color }}
                    />
                    <span>عنقود {c.id} ({c.traditionalLabel})</span>
                  </button>
                );
              })}
            </div>

            {/* Reset All Filters Button */}
            {isAnyFilterActive && (
              <button
                id="reset-filters-btn"
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono transition-all font-medium"
                title="إعادة ضبط جميع معايير البحث والتصفية"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة ضبط التصفية</span>
              </button>
            )}

          </div>

          {/* Active Cluster Explanatory Callout */}
          {filterCluster !== 'all' && (
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 flex-wrap">
                {filterCluster === 'fatihah' ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                    <span className="text-amber-300 font-bold font-quran">سورة الفاتحة (أم الكتاب):</span>
                    <span className="text-slate-300 text-[11px]">مستقلة عن سائر الأحزاب السبعة؛ ديباجة المصحف ومفتاح سائر سوره.</span>
                  </>
                ) : (() => {
                  const activeDef = SAHABA_CLUSTERS.find(c => c.id === filterCluster);
                  if (!activeDef) return null;
                  return (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: activeDef.color }}></span>
                      <span className="font-bold text-slate-100 font-quran">{activeDef.name} ({activeDef.traditionalLabel}):</span>
                      <span className="text-slate-300 text-[11px]">{activeDef.subtitle} • {activeDef.countRule}</span>
                      <span className="text-slate-500 text-[10px] hidden md:inline">({activeDef.thematicFocus})</span>
                    </>
                  );
                })()}
              </div>
              <button
                onClick={() => setFilterCluster('all')}
                className="text-[10px] font-mono text-slate-400 hover:text-slate-200 underline shrink-0"
              >
                إظهار جميع العناقيد
              </button>
            </div>
          )}

        </div>

      </div>

      {/* No Results Fallback */}
      {filteredSurahs.length === 0 && (
        <div className="sci-bg sci-border rounded-xl p-10 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-500 mx-auto opacity-60" />
          <h4 className="text-base font-bold text-slate-200">لم يتم العثور على سور مطابقة</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            لا توجد سور تطابق معايير البحث والتصفية المحددة. جرب البحث باسم السورة باللغة العربية أو الإنجليزية أو برقمها، أو أعد ضبط خيارات التصفية.
          </p>
          <button
            onClick={resetAllFilters}
            className="mt-2 px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-medium hover:bg-sky-500/30 transition-all font-mono"
          >
            إلغاء جميع خيارات التصفية
          </button>
        </div>
      )}

      {/* View 1: HIGH DENSITY GRID MODE */}
      {viewMode === 'grid' && filteredSurahs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredSurahs.map((surah) => {
            // Find top 3 letters from pre-computed map (0ms overhead)
            const topLetters = surahTopLettersMap.get(surah.number) || [];

            return (
              <div
                key={surah.number}
                id={`surah-card-${surah.number}`}
                onClick={() => onSelectSurah(surah)}
                className="sci-bg sci-border hover:border-sky-500/50 rounded-xl p-3.5 transition-all duration-150 cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-slate-800 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold font-mono text-xs group-hover:bg-sky-500/20 transition-all">
                        {surah.number}
                      </div>
                      <div>
                        <h3 className="font-quran font-bold text-lg text-slate-100 group-hover:text-sky-300 transition-colors">
                          {surah.name}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-400">
                          {surah.englishName}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                      surah.isMeccan 
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80' 
                        : 'bg-sky-950/40 text-sky-300 border-sky-800/80'
                    }`}>
                      {surah.isMeccan ? 'مكية' : 'مدنية'}
                    </span>
                  </div>

                  {/* Core Metrics */}
                  <div className="grid grid-cols-3 gap-1.5 my-2.5 pt-2 border-t border-slate-800/80 text-center">
                    <div className="bg-[#0A0D12] p-1.5 rounded border border-slate-800/80">
                      <div className="text-[9px] uppercase font-mono text-sky-500">الآيات</div>
                      <div className="text-xs font-bold text-slate-200 mt-0.5 font-mono">{surah.totalAyahs}</div>
                    </div>
                    <div className="bg-[#0A0D12] p-1.5 rounded border border-slate-800/80">
                      <div className="text-[9px] uppercase font-mono text-sky-500">الكلمات</div>
                      <div className="text-xs font-bold text-slate-200 mt-0.5 font-mono">{surah.totalWords.toLocaleString('en-US')}</div>
                    </div>
                    <div className="bg-[#0A0D12] p-1.5 rounded border border-slate-800/80">
                      <MathTooltip metricId="ttr" value={`${surah.vocabularyDiversity}%`} showUnderline={false}>
                        <div className="text-[9px] uppercase font-mono text-sky-500">التنوع</div>
                        <div className="text-xs font-bold text-emerald-400 mt-0.5 font-mono">{surah.vocabularyDiversity}%</div>
                      </MathTooltip>
                    </div>
                  </div>

                  {/* Top Letters & Absent Letters mini bar */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono text-slate-400">أعلى الترددات:</span>
                      <div className="flex items-center gap-1">
                        {topLetters.map(([l, p]) => (
                          <span key={l} className="font-mono text-sky-300 font-bold px-1 bg-slate-900 border border-slate-800 rounded text-[10px]">
                            {l}:{p}%
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono text-slate-400">حروف غائبة (صفرية):</span>
                      <MathTooltip metricId="absentLetters" value={`${surah.letters.absentCount} حروف`} showUnderline={false}>
                        <span className={`font-mono font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                          surah.letters.absentCount > 0 
                            ? 'text-red-400 bg-red-950/40 border border-red-800/40' 
                            : 'text-slate-500'
                        }`}>
                          {surah.letters.absentCount > 0 ? `${surah.letters.absentCount} حروف` : 'كاملة (0)'}
                        </span>
                      </MathTooltip>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {(() => {
                    const clusterInfo = getSurahClusterDisplayInfo(surah.number);
                    return (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span 
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border font-medium cursor-help transition-all ${clusterInfo.badgeBg}`}
                          title={clusterInfo.tooltip}
                        >
                          {clusterInfo.shortLabel}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          • {surah.isUniform ? 'إيقاع منتظم' : 'إيقاع متذبذب'}
                        </span>
                      </div>
                    );
                  })()}
                  
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {onOpenInReader && (
                      <button
                        id={`read-quran-btn-${surah.number}`}
                        onClick={() => onOpenInReader(surah.number)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 border border-slate-700/60 transition-all"
                        title="فتح في المصحف الشريف"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      id={`compare-btn-${surah.number}`}
                      onClick={() => onCompareWith(surah.number)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 border border-slate-700/60 transition-all"
                      title="مقارنة مع سورة أخرى"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`view-fingerprint-${surah.number}`}
                      onClick={() => onSelectSurah(surah)}
                      className="px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-mono font-medium transition-all"
                    >
                      البصمة
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* View 2: HIGH DENSITY TABLE MODE */}
      {viewMode === 'table' && filteredSurahs.length > 0 && (
        <div className="sci-bg sci-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0A0D12] text-sky-400 border-b border-slate-800 font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-2.5">الرقم</th>
                  <th className="p-2.5">السورة</th>
                  <th className="p-2.5">النزول</th>
                  <th className="p-2.5">العنقود</th>
                  <th className="p-2.5">الآيات</th>
                  <th className="p-2.5">الكلمات</th>
                  <th className="p-2.5">الحروف</th>
                  <th className="p-2.5">
                    <MathTooltip metricId="ttr" showUnderline={true}>
                      <span>تنوع المفردات</span>
                    </MathTooltip>
                  </th>
                  <th className="p-2.5">
                    <MathTooltip metricId="avgAyahLengthWords" showUnderline={true}>
                      <span>متوسط الآية</span>
                    </MathTooltip>
                  </th>
                  <th className="p-2.5">
                    <MathTooltip metricId="absentLetters" showUnderline={true}>
                      <span>الحروف الغائبة</span>
                    </MathTooltip>
                  </th>
                  <th className="p-2.5">الإيقاع</th>
                  <th className="p-2.5 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300 font-mono text-[11px]">
                {filteredSurahs.map((surah) => (
                  <tr 
                    key={surah.number} 
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => onSelectSurah(surah)}
                  >
                    <td className="p-2.5 text-sky-400 font-bold">{surah.number}</td>
                    <td className="p-2.5">
                      <div className="font-quran font-bold text-sm text-slate-100">{surah.name}</div>
                      <div className="text-[10px] text-slate-500">{surah.englishName}</div>
                    </td>
                    <td className="p-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        surah.isMeccan 
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/60' 
                          : 'bg-sky-950/40 text-sky-400 border border-sky-800/60'
                      }`}>
                        {surah.isMeccan ? 'مكية' : 'مدنية'}
                      </span>
                    </td>
                    <td className="p-2.5">
                      {(() => {
                        const clusterInfo = getSurahClusterDisplayInfo(surah.number);
                        return (
                          <span 
                            className={`text-[10px] px-2 py-0.5 rounded font-mono border whitespace-nowrap ${clusterInfo.badgeBg}`}
                            title={clusterInfo.tooltip}
                          >
                            {clusterInfo.shortLabel}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-2.5">{surah.totalAyahs}</td>
                    <td className="p-2.5">{surah.totalWords.toLocaleString('en-US')}</td>
                    <td className="p-2.5">{surah.totalChars.toLocaleString('en-US')}</td>
                    <td className="p-2.5 text-emerald-400 font-semibold">
                      <MathTooltip metricId="ttr" value={`${surah.vocabularyDiversity}%`} showUnderline={false}>
                        <span>{surah.vocabularyDiversity}%</span>
                      </MathTooltip>
                    </td>
                    <td className="p-2.5">
                      <MathTooltip metricId="avgAyahLengthWords" value={`${surah.avgAyahLengthWords} كلمة/آية`} showUnderline={false}>
                        <span>{surah.avgAyahLengthWords} ك</span>
                      </MathTooltip>
                    </td>
                    <td className="p-2.5">
                      <MathTooltip metricId="absentLetters" value={`${surah.letters.absentCount} حروف`} showUnderline={false}>
                        {surah.letters.absentCount > 0 ? (
                          <span className="text-red-400 bg-red-950/30 px-1 py-0.5 rounded border border-red-900/40">
                            {surah.letters.absentCount} حروف
                          </span>
                        ) : (
                          <span className="text-slate-500">كاملة (0)</span>
                        )}
                      </MathTooltip>
                    </td>
                    <td className="p-2.5">
                      <span className={`text-[10px] ${surah.isUniform ? 'text-cyan-400' : 'text-amber-400'}`}>
                        {surah.isUniform ? 'منتظم' : 'متذبذب'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {onOpenInReader && (
                          <button
                            onClick={() => onOpenInReader(surah.number)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 transition-all"
                            title="فتح في المصحف الشريف"
                          >
                            <BookOpen className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => onCompareWith(surah.number)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 transition-all"
                          title="مقارنة مع سورة أخرى"
                        >
                          <GitCompare className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onSelectSurah(surah)}
                          className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 transition-all text-[10px] font-mono font-medium"
                        >
                          بصمة
                        </button>
                      </div>
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

export const SurahExplorer = React.memo(SurahExplorerComponent);
