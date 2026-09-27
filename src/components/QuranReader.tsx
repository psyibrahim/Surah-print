import React, { useState, useMemo, useRef } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  CheckCircle2, 
  BookMarked, 
  Maximize2, 
  Minimize2, 
  AlignJustify, 
  List, 
  Sparkles,
  Hash,
  ArrowRightLeft
} from 'lucide-react';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { useTheme } from '../context/ThemeContext';
import { SectionHelpButton } from './SectionHelpModal';
import { normalizeArabicText, matchAyahTokens } from '../utils/arabic';

const QuranReaderComponent: React.FC<{
  onSelectSurahForAnalysis?: (surahNumber: number) => void;
}> = ({ onSelectSurahForAnalysis }) => {
  const { 
    activeMushaf,
    setActiveMushaf,
    activeMeta,
    corpus, 
    surahs,
    selectedReaderSurah, 
    setSelectedReaderSurah, 
    includeBasmalahInFatihah, 
    readingMode,
    setReadingMode
  } = useQuranCorpus();

  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState<number>(24);
  const [activeAyahHover, setActiveAyahHover] = useState<number | null>(null);
  const [targetAyahInput, setTargetAyahInput] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Current surah data
  const currentCorpusSurah = useMemo(() => {
    return corpus.find(s => s.number === selectedReaderSurah) || corpus[0];
  }, [corpus, selectedReaderSurah]);

  const currentStatsSurah = useMemo(() => {
    return surahs.find(s => s.number === selectedReaderSurah) || surahs[0];
  }, [surahs, selectedReaderSurah]);

  // Filtered ayahs based on search query and Fatihah Basmalah setting
  const filteredAyahs = useMemo(() => {
    let list = currentCorpusSurah.ayahs;
    if (activeMushaf === 'kufi' && currentCorpusSurah.number === 1 && !includeBasmalahInFatihah) {
      // When Basmalah is not counted as an ayah in Al-Fatihah (العد المدني):
      // The 7 verses of the surah start directly from Al-Hamd:
      list = [
        { numberInSurah: 1, numberInQuran: 2, textUthmani: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ', textSimple: 'الحمد لله رب العالمين', juz: 1, page: 1 },
        { numberInSurah: 2, numberInQuran: 3, textUthmani: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', textSimple: 'الرحمن الرحيم', juz: 1, page: 1 },
        { numberInSurah: 3, numberInQuran: 4, textUthmani: 'مَٰلِكِ يَوْمِ ٱلدِّينِ', textSimple: 'مالك يوم الدين', juz: 1, page: 1 },
        { numberInSurah: 4, numberInQuran: 5, textUthmani: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', textSimple: 'إياك نعبد وإياك نستعين', juz: 1, page: 1 },
        { numberInSurah: 5, numberInQuran: 6, textUthmani: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', textSimple: 'اهدنا الصراط المستقيم', juz: 1, page: 1 },
        { numberInSurah: 6, numberInQuran: 7, textUthmani: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ', textSimple: 'صراط الذين أنعمت عليهم', juz: 1, page: 1 },
        { numberInSurah: 7, numberInQuran: 7, textUthmani: 'غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ', textSimple: 'غير المغضوب عليهم ولا الضالين', juz: 1, page: 1 }
      ];
    }
    if (!searchQuery.trim()) return list;
    const rawQ = searchQuery.trim();
    // البحث برقم الآية المباشر إذا كان المدخل رقماً فقط
    if (/^\d+$/.test(rawQ)) {
      const targetNum = parseInt(rawQ, 10);
      return list.filter(a => a.numberInSurah === targetNum);
    }
    // البحث الدقيق القائم على التمييز بين الكلمات (Tokenization)
    return list.filter(a => {
      const res = matchAyahTokens(a.textUthmani || a.textSimple, rawQ);
      return res.isMatch;
    });
  }, [activeMushaf, currentCorpusSurah, searchQuery, includeBasmalahInFatihah]);

  // Navigate to prev/next surah
  const handlePrevSurah = () => {
    if (selectedReaderSurah > 1) {
      setSelectedReaderSurah(selectedReaderSurah - 1);
      setSearchQuery('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextSurah = () => {
    if (selectedReaderSurah < 114) {
      setSelectedReaderSurah(selectedReaderSurah + 1);
      setSearchQuery('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpToAyah = (e: React.FormEvent) => {
    e.preventDefault();
    const ayahNum = parseInt(targetAyahInput);
    if (!isNaN(ayahNum) && ayahNum >= 1 && ayahNum <= currentCorpusSurah.totalAyahs) {
      const el = document.getElementById(`ayah-${ayahNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setActiveAyahHover(ayahNum);
      }
      setTargetAyahInput('');
    }
  };

  return (
    <div className="space-y-5 pb-12">
      
      {/* Top Controller Bar */}
      <div className={`p-2.5 sm:p-4 rounded-2xl border shadow-sm transition-colors duration-200 ${
        isLight ? 'bg-white border-slate-200 shadow-slate-100' : 'bg-[#0F172A] border-slate-800'
      }`}>
        
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Surah Selector & Navigator */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 justify-between sm:justify-start">
            
            <div className="flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial">
              <button
                id="prev-surah-btn"
                type="button"
                onClick={handlePrevSurah}
                disabled={selectedReaderSurah <= 1}
                className={`p-2 rounded-lg border transition-all shrink-0 ${
                  selectedReaderSurah <= 1
                    ? 'opacity-40 cursor-not-allowed border-slate-700/50 text-slate-500'
                    : isLight 
                      ? 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-sky-500'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:border-sky-500/50'
                }`}
                title="السورة السابقة"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Surah Dropdown Picker */}
              <div className="relative flex-1 min-w-0 sm:w-60">
                <select
                  id="surah-selector-dropdown"
                  value={selectedReaderSurah}
                  onChange={(e) => {
                    setSelectedReaderSurah(Number(e.target.value));
                    setSearchQuery('');
                  }}
                  className={`w-full py-2 px-2.5 sm:py-2.5 sm:px-3.5 rounded-xl border text-xs sm:text-sm font-bold font-sans-arabic cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all truncate text-center sm:text-right ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-900 hover:border-slate-400' 
                      : 'bg-slate-900/90 border-slate-700 text-slate-100 hover:border-slate-600'
                  }`}
                >
                  {corpus.map(s => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {s.name} ({s.isMeccan ? 'مك' : 'مد'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                id="next-surah-btn"
                type="button"
                onClick={handleNextSurah}
                disabled={selectedReaderSurah >= 114}
                className={`p-2 rounded-lg border transition-all shrink-0 ${
                  selectedReaderSurah >= 114
                    ? 'opacity-40 cursor-not-allowed border-slate-700/50 text-slate-500'
                    : isLight 
                      ? 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-sky-500'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:border-sky-500/50'
                }`}
                title="السورة التالية"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Jump to Ayah Form */}
            <form onSubmit={handleJumpToAyah} className="flex items-center gap-1.5 shrink-0">
              <input
                id="jump-ayah-input"
                type="number"
                min="1"
                max={currentCorpusSurah.totalAyahs}
                placeholder={`الآية (1-${currentCorpusSurah.totalAyahs})`}
                value={targetAyahInput}
                onChange={(e) => setTargetAyahInput(e.target.value)}
                className={`w-20 sm:w-28 py-1.5 px-2 rounded-lg border text-xs text-center font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
                }`}
              />
              <button
                type="submit"
                className={`py-1.5 px-2.5 sm:px-3 rounded-lg border text-xs font-bold transition-all shrink-0 ${
                  isLight 
                    ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' 
                    : 'bg-sky-500/20 text-sky-300 border-sky-500/30 hover:bg-sky-500/30'
                }`}
              >
                انتقال
              </button>
            </form>
          </div>

          {/* Controls: Search, View Mode, Font Size, Methodology */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
            
            {/* Search inside Surah */}
            <div className="relative flex-1 sm:flex-initial min-w-[120px] sm:min-w-[150px]">
              <input
                id="quran-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في السورة..."
                className={`w-full py-1.5 sm:py-2 pr-7 sm:pr-8 pl-3 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/40 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
                }`}
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Reading Mode Switcher */}
            <div className={`p-0.5 sm:p-1 rounded-lg border flex items-center gap-0.5 sm:gap-1 ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <button
                id="mode-verses-btn"
                type="button"
                onClick={() => setReadingMode('verses')}
                className={`flex items-center gap-1 py-1 px-2 sm:px-2.5 rounded-md text-xs font-bold transition-all ${
                  readingMode === 'verses'
                    ? isLight ? 'bg-white text-sky-800 shadow-sm border border-slate-200' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="عرض تفصيلي مع الإحصاء الفوري لكل آية"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">الآيات المفصلة</span>
                <span className="xs:hidden">مفصلة</span>
              </button>

              <button
                id="mode-mushaf-btn"
                type="button"
                onClick={() => setReadingMode('mushaf')}
                className={`flex items-center gap-1 py-1 px-2 sm:px-2.5 rounded-md text-xs font-bold transition-all ${
                  readingMode === 'mushaf'
                    ? isLight ? 'bg-white text-sky-800 shadow-sm border border-slate-200' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="قراءة المصحف الشريف المتصل"
              >
                <AlignJustify className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">المصحف المتصل</span>
                <span className="xs:hidden">متصل</span>
              </button>
            </div>

            {/* Font Size Adjusters */}
            <div className={`p-0.5 sm:p-1 rounded-lg border flex items-center gap-0.5 font-mono text-xs ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => setFontSize(prev => Math.max(18, prev - 2))}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center text-slate-400 hover:text-sky-500 hover:bg-white/50"
                title="تصغير الخط"
              >
                A-
              </button>
              <span className="px-0.5 sm:px-1 text-slate-400 text-[10px] sm:text-[11px]">{fontSize}</span>
              <button
                type="button"
                onClick={() => setFontSize(prev => Math.min(38, prev + 2))}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center text-slate-400 hover:text-sky-500 hover:bg-white/50"
                title="تكبير الخط"
              >
                A+
              </button>
            </div>

            {/* Jump to Deep Analysis Button */}
            {onSelectSurahForAnalysis && (
              <button
                id="analyze-current-surah-btn"
                type="button"
                onClick={() => onSelectSurahForAnalysis(selectedReaderSurah)}
                className={`py-1.5 sm:py-2 px-2.5 sm:px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-all shadow-sm shrink-0 ${
                  isLight 
                    ? 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700' 
                    : 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">تحليل بصمة السورة</span>
                <span className="sm:hidden">تحليل</span>
              </button>
            )}

            {/* Isolated Corner Help Button */}
            <SectionHelpButton 
              guideId="quran-reader" 
              variant="icon" 
              title="استعلام: شرح المصحف الرقمي وطبقة القراءة والعد العثماني" 
            />

          </div>

        </div>

      </div>

      {/* Surah Golden Calligraphic Header Card */}
      <div className={`p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border shadow-md relative overflow-hidden text-center space-y-3 sm:space-y-4 ${
        isLight 
          ? 'bg-gradient-to-b from-white via-sky-50/20 to-slate-50 border-slate-200' 
          : 'bg-gradient-to-b from-[#0F172A] via-[#0D1525] to-[#0A0D12] border-slate-800'
      }`}>
        {/* Subtle decorative background Islamic pattern elements */}
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-sky-500/5 blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none"></div>

        {/* Surah Meta Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveMushaf(activeMushaf === 'kufi' ? 'madani' : 'kufi')}
            className={`px-3 py-1 rounded-full border font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              activeMushaf === 'madani'
                ? isLight ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-400' : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-600'
                : isLight ? 'bg-sky-100 hover:bg-sky-200 text-sky-950 border-sky-400' : 'bg-sky-950 hover:bg-sky-900 text-sky-300 border-sky-600'
            }`}
            title="انقر للتبديل الفوري بين المصحف الكوفي (حفص) والمصحف المدني (ورش)"
          >
            <ArrowRightLeft className="w-3 h-3 shrink-0" />
            <span>{activeMushaf === 'madani' ? 'المصحف المدني (ورش)' : 'المصحف الكوفي (حفص)'}</span>
            <span className={`text-[10px] px-1 rounded ${
              isLight ? 'bg-white/80 text-slate-900 font-bold' : 'bg-slate-900/60 text-slate-200'
            }`}>
              تبديل ⇄
            </span>
          </button>
          <span className={`px-2.5 py-1 rounded-full border ${
            isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            السورة رقم {currentCorpusSurah.number}
          </span>
          <span className={`px-2.5 py-1 rounded-full border font-bold ${
            currentCorpusSurah.isMeccan 
              ? isLight ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-sky-950/70 text-sky-300 border-sky-700/50'
              : isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50'
          }`}>
            {currentCorpusSurah.isMeccan ? 'مكية' : 'مدنية'}
          </span>
          <span className={`px-2.5 py-1 rounded-full border ${
            isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {currentCorpusSurah.totalAyahs} آية
          </span>
          <span className={`px-2.5 py-1 rounded-full border ${
            isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {currentStatsSurah.totalWords} كلمة
          </span>
          <span className={`px-2.5 py-1 rounded-full border ${
            isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {currentStatsSurah.totalChars} حرفاً
          </span>
        </div>

        {/* Surah Name in Display Quranic Calligraphy */}
        <h1 className={`font-quran text-4xl sm:text-5xl md:text-6xl font-bold tracking-wide ${
          isLight ? 'text-slate-900' : 'text-slate-50'
        }`}>
          {currentCorpusSurah.name}
        </h1>

        <div className="text-xs text-slate-400 font-mono">
          {currentCorpusSurah.englishName} • {currentCorpusSurah.englishNameTranslation}
        </div>

        {/* Noble Basmalah Header */}
        <div className="pt-2">
          {currentCorpusSurah.number === 1 ? (
            <div className="inline-block py-2.5 px-6 rounded-2xl border border-sky-500/30 bg-sky-500/5">
              <p className="font-quran text-2xl sm:text-3xl text-sky-400 dark:text-sky-300 font-bold">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </p>
            </div>
          ) : currentCorpusSurah.number === 9 ? null : (
            <div className={`inline-block py-2.5 px-8 rounded-2xl border ${
              isLight 
                ? 'bg-slate-50 border-slate-200 shadow-inner' 
                : 'bg-black/40 border-slate-800'
            }`}>
              <p className={`font-quran text-2xl sm:text-3xl font-bold ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Search Query Status Banner */}
      {searchQuery.trim() && (
        <div className={`p-3 sm:p-4 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm ${
          isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/40 border-amber-700/50 text-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="font-bold">مطابقة الكلمات الدقيقة (Tokenization):</span>
            <span>
              عثر على <strong className="underline text-sm font-bold">{filteredAyahs.length}</strong> آية مطابقة للفظ «{searchQuery.trim()}» في {currentCorpusSurah.name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/50"
          >
            إلغاء التصفية
          </button>
        </div>
      )}

      {/* Main Reading Container */}
      <div ref={containerRef} className={`rounded-3xl border shadow-sm overflow-hidden transition-colors duration-200 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0F172A] border-slate-800'
      }`}>
        
        {/* ============================================================ */}
        {/* MODE 1: VERSE BY VERSE DETAILED ANALYTIC INSPECTION */}
        {/* ============================================================ */}
        {readingMode === 'verses' && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredAyahs.map((ayah) => {
              const isHovered = activeAyahHover === ayah.numberInSurah;

              // Word count of this specific ayah
              const cleanA = ayah.textSimple.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u08F0-\u08FF]/g, '').trim();
              const wordsCount = cleanA ? cleanA.split(/\s+/).filter(w => /[\u0621-\u064A]/.test(w)).length : 0;
              const charsCount = cleanA.replace(/\s+/g, '').length;

              return (
                <div
                  key={ayah.numberInSurah}
                  id={`ayah-${ayah.numberInSurah}`}
                  onMouseEnter={() => setActiveAyahHover(ayah.numberInSurah)}
                  onMouseLeave={() => setActiveAyahHover(null)}
                  className={`p-3 sm:p-5 md:p-6 transition-all duration-150 ${
                    isHovered 
                      ? isLight ? 'bg-sky-50/50' : 'bg-sky-950/20' 
                      : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/50">
                    
                    {/* Verse Number Pill */}
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs border ${
                        isHovered 
                          ? 'bg-sky-500 text-white border-sky-500' 
                          : isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {ayah.numberInSurah}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        الآية رقم {ayah.numberInSurah} من {currentCorpusSurah.totalAyahs}
                      </span>
                      <span className="text-xs text-slate-500 font-mono hidden md:inline">
                        (الآية {ayah.numberInQuran} في المصحف • جزء {ayah.juz} • صفحة {ayah.page})
                      </span>
                    </div>

                    {/* Instant Word & Char Stats Chip */}
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      <span className={`px-2 py-0.5 rounded border ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}>
                        <strong className="text-sky-500 font-bold">{wordsCount}</strong> كلمات
                      </span>
                      <span className={`px-2 py-0.5 rounded border ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}>
                        <strong className="text-cyan-500 font-bold">{charsCount}</strong> أحرف
                      </span>
                    </div>

                  </div>

                  {/* Quranic Text Display with Tokenization Match Highlighting */}
                  <div 
                    className="font-quran leading-[2.2] text-right"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    <span className={isLight ? 'text-slate-900' : 'text-slate-100'}>
                      {(() => {
                        const rawTokens = (ayah.textUthmani || ayah.textSimple || '').trim().split(/\s+/).filter(Boolean);
                        if (!searchQuery.trim()) {
                          return ayah.textUthmani;
                        }
                        const matchRes = matchAyahTokens(ayah.textUthmani || ayah.textSimple, searchQuery.trim());
                        const matchedSet = new Set(matchRes.matchedIndices);
                        return rawTokens.map((token, idx) => {
                          const isMatched = matchedSet.has(idx);
                          return (
                            <React.Fragment key={idx}>
                              {isMatched ? (
                                <mark className="bg-amber-400/35 dark:bg-amber-400/30 text-amber-950 dark:text-amber-200 px-1 py-0.5 rounded border-b-2 border-amber-500 dark:border-amber-400 font-bold transition-all">
                                  {token}
                                </mark>
                              ) : (
                                <span>{token}</span>
                              )}
                              {idx < rawTokens.length - 1 ? ' ' : ''}
                            </React.Fragment>
                          );
                        });
                      })()}
                    </span>
                    
                    {/* Verse Ending Symbol */}
                    <span className="inline-flex items-center justify-center mx-2 text-sky-500 dark:text-sky-400 font-serif select-none">
                      ﴿{ayah.numberInSurah}﴾
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 2: CONTINUOUS MUSHAF READING VIEW */}
        {/* ============================================================ */}
        {readingMode === 'mushaf' && (
          <div className="p-3.5 sm:p-8 md:p-12">
            <div 
              className="font-quran leading-[2.4] sm:leading-[2.6] text-justify text-right"
              style={{ fontSize: `${fontSize}px` }}
            >
              {filteredAyahs.map((ayah) => {
                const isHovered = activeAyahHover === ayah.numberInSurah;
                const rawTokens = (ayah.textUthmani || ayah.textSimple || '').trim().split(/\s+/).filter(Boolean);
                const matchRes = searchQuery.trim() ? matchAyahTokens(ayah.textUthmani || ayah.textSimple, searchQuery.trim()) : null;
                const matchedSet = new Set(matchRes?.matchedIndices || []);

                return (
                  <React.Fragment key={ayah.numberInSurah}>
                    <span
                      id={`ayah-${ayah.numberInSurah}`}
                      onMouseEnter={() => setActiveAyahHover(ayah.numberInSurah)}
                      onMouseLeave={() => setActiveAyahHover(null)}
                      className={`transition-colors duration-150 px-1 rounded cursor-pointer ${
                        isHovered 
                          ? isLight ? 'bg-sky-100 text-sky-900' : 'bg-sky-900/40 text-sky-200' 
                          : isLight ? 'text-slate-900' : 'text-slate-100'
                      }`}
                      title={`الآية رقم ${ayah.numberInSurah} (${ayah.textSimple.split(' ').length} كلمات)`}
                    >
                      {searchQuery.trim() ? (
                        rawTokens.map((token, idx) => {
                          const isMatched = matchedSet.has(idx);
                          return (
                            <React.Fragment key={idx}>
                              {isMatched ? (
                                <mark className="bg-amber-400/35 dark:bg-amber-400/30 text-amber-950 dark:text-amber-200 px-1 py-0.5 rounded border-b-2 border-amber-500 dark:border-amber-400 font-bold">
                                  {token}
                                </mark>
                              ) : (
                                <span>{token}</span>
                              )}
                              {idx < rawTokens.length - 1 ? ' ' : ''}
                            </React.Fragment>
                          );
                        })
                      ) : (
                        ayah.textUthmani
                      )}
                    </span>
                    <span className="inline-flex items-center justify-center mx-1.5 text-sky-500 dark:text-sky-400 font-serif select-none">
                      ﴿{ayah.numberInSurah}﴾
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Bottom Floating Navigation for Surahs */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={handlePrevSurah}
          disabled={selectedReaderSurah <= 1}
          className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
            selectedReaderSurah <= 1
              ? 'opacity-40 cursor-not-allowed border-slate-700/50 text-slate-500'
              : isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
          <span>السورة السابقة: {selectedReaderSurah > 1 ? corpus[selectedReaderSurah - 2].name : ''}</span>
        </button>

        <span className="text-xs font-mono text-slate-400">
          {selectedReaderSurah} / 114
        </span>

        <button
          type="button"
          onClick={handleNextSurah}
          disabled={selectedReaderSurah >= 114}
          className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
            selectedReaderSurah >= 114
              ? 'opacity-40 cursor-not-allowed border-slate-700/50 text-slate-500'
              : isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span>السورة التالية: {selectedReaderSurah < 114 ? corpus[selectedReaderSurah].name : ''}</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

export const QuranReader = React.memo(QuranReaderComponent);
