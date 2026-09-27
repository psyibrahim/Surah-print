import React, { useState, useMemo } from 'react';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { useTheme } from '../context/ThemeContext';
import { SurahData, LetterStatsData, GlobalLetterStat } from '../types';
import { 
  MUQATTAAT_SURAHS, 
  SURAH_FAMILIES, 
  SurahFamilyMeta, 
  MuqattaatSurahMeta 
} from '../utils/surahFamilies';
import { HawameemLab } from './HawameemLab';
import { MuqattaatVerseHeatmap } from './MuqattaatVerseHeatmap';
import { 
  Sparkles, 
  Layers, 
  Search, 
  BookOpen, 
  Flame, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Info,
  Scale,
  Award,
  ChevronLeft
} from 'lucide-react';
import { ARABIC_LETTER_NAMES, formatSurahName } from '../utils/arabic';
import { SectionHelpButton } from './SectionHelpModal';

interface OpeningsAndFamiliesLabProps {
  surahs: SurahData[];
  letterStats: LetterStatsData;
  onSelectSurah?: (surah: SurahData) => void;
  onOpenInReader?: (surahNumber: number) => void;
  onCompareWith?: (surahNumber: number) => void;
}

const OpeningsAndFamiliesLabComponent: React.FC<OpeningsAndFamiliesLabProps> = ({
  surahs,
  letterStats,
  onSelectSurah,
  onOpenInReader,
  onCompareWith
}) => {
  const { theme } = useTheme();
  const { corpus } = useQuranCorpus();
  const isDark = theme === 'dark';

  const [activeMainTab, setActiveMainTab] = useState<'muqattaat' | 'hawameem' | 'families'>('muqattaat');
  const [selectedMuqattaatSurah, setSelectedMuqattaatSurah] = useState<number>(2); // Al-Baqarah
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('musabbihat');
  const [muqattaatSearch, setMuqattaatSearch] = useState<string>('');

  // Selected Muqatta'at Surah Metadata
  const currentMuqattaat = useMemo(() => {
    return MUQATTAAT_SURAHS.find(m => m.surahNumber === selectedMuqattaatSurah) || MUQATTAAT_SURAHS[0];
  }, [selectedMuqattaatSurah]);

  // Selected SurahData
  const currentSurahData = useMemo(() => {
    return surahs.find(s => s.number === selectedMuqattaatSurah) || surahs[0];
  }, [surahs, selectedMuqattaatSurah]);

  // Selected SurahCorpus for verse texts and verse-by-verse heatmap
  const currentSurahCorpus = useMemo(() => {
    return corpus.find(c => c.number === selectedMuqattaatSurah);
  }, [corpus, selectedMuqattaatSurah]);

  // Selected Family Metadata
  const currentFamily = useMemo(() => {
    return SURAH_FAMILIES.find(f => f.id === selectedFamilyId) || SURAH_FAMILIES[1];
  }, [selectedFamilyId]);

  // Family aggregate statistics
  const familyStats = useMemo(() => {
    const familySurahs = surahs.filter(s => currentFamily.surahNumbers.includes(s.number));
    const totalAyahs = familySurahs.reduce((acc, s) => acc + (s.totalAyahs || 0), 0);
    const totalWords = familySurahs.reduce((acc, s) => acc + (s.totalWords || 0), 0);
    const totalChars = familySurahs.reduce((acc, s) => acc + (s.totalChars || s.letters?.totalLettersPlain || 0), 0);
    const avgVerseLength = totalAyahs > 0 ? Number((totalWords / totalAyahs).toFixed(1)) : 0;

    return {
      count: familySurahs.length,
      surahs: familySurahs,
      totalAyahs,
      totalWords,
      totalChars,
      avgVerseLength
    };
  }, [surahs, currentFamily]);

  // Muqatta'at letter frequency analysis inside the selected surah
  const openingLettersStats = useMemo(() => {
    if (!currentSurahData || !letterStats || !currentMuqattaat) return [];

    const plainCounts = currentSurahData.letters?.plainCounts || {};
    const plainPercentages = currentSurahData.letters?.plainPercentages || {};
    const globalStats = letterStats.globalStats || {};

    // Total Quran letters across all 28 letters
    const statsList: GlobalLetterStat[] = Object.values(globalStats);
    const totalQuranLetters: number = statsList.reduce((acc: number, stat: GlobalLetterStat) => acc + (stat?.totalOccurrences || 0), 0) || 1;

    return currentMuqattaat.letters.map(letter => {
      const count = plainCounts[letter] || 0;
      const percentageInSurah = plainPercentages[letter] 
        ? Number(plainPercentages[letter].toFixed(2)) 
        : (currentSurahData.totalChars > 0 ? Number(((count / currentSurahData.totalChars) * 100).toFixed(2)) : 0);

      const stat: GlobalLetterStat | undefined = globalStats[letter];
      const quranOccurrences = stat ? stat.totalOccurrences : 0;
      const quranAvg = Number(((quranOccurrences / totalQuranLetters) * 100).toFixed(2));
      const relativeRatio = quranAvg > 0 ? Number((percentageInSurah / quranAvg).toFixed(2)) : 1;

      return {
        letter,
        letterName: ARABIC_LETTER_NAMES[letter] || (stat?.name) || letter,
        count,
        percentageInSurah,
        quranAvg,
        relativeRatio,
        isHigherThanAverage: percentageInSurah >= quranAvg
      };
    });
  }, [currentSurahData, currentMuqattaat, letterStats]);

  // Filtered 29 Muqatta'at Surahs
  const filteredMuqattaat = useMemo(() => {
    return MUQATTAAT_SURAHS.filter(m => {
      const search = muqattaatSearch.trim();
      if (!search) return true;
      return m.surahName.includes(search) || 
        m.openingText.includes(search) || 
        m.surahNumber.toString() === search;
    });
  }, [muqattaatSearch]);

  return (
    <div className="w-full space-y-5 animate-fadeIn">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900/90 via-[#181E29]/90 to-slate-900/90 border-slate-800 shadow-xl' 
          : 'bg-gradient-to-r from-amber-50 via-white to-sky-50/50 border-amber-100 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  مختبر عوائل السور وفواتح الحروف المقطعة
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  29 سورة مقطعة + عوائل القرآن
                </span>
                <SectionHelpButton 
                  guideId="openings-and-families-lab" 
                  variant="button" 
                  title="استعلام ودليل مختبر الفواتح والعوائل" 
                />
              </div>
              <p className={`text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                دراسة إحصائية مجمعة للسور المبدوءة بفواتح الحروف المقطعة (الم، حم، الر، طسم...)، وتحليل عوائل السور القرآنية (الحواميم، المسبحات، الطواسين، الزهراوان).
              </p>
            </div>
          </div>

          {/* Navigation Pills */}
          <div className="flex items-center gap-2 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveMainTab('muqattaat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeMainTab === 'muqattaat'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              فواتح الحروف الـ 29
            </button>
            <button
              onClick={() => setActiveMainTab('hawameem')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeMainTab === 'hawameem'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              عائلة الحواميم السبع (آل حم)
            </button>
            <button
              onClick={() => setActiveMainTab('families')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeMainTab === 'families'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              عوائل السور (المسبحات، الطواسين...)
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab 1: The 29 Muqatta'at Surahs */}
      {activeMainTab === 'muqattaat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: 29 Surahs Directory */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>سور الفواتح المقطعة</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-mono">
                  29 سورة
                </span>
              </h2>
            </div>

            <div className="relative mb-3">
              <input
                type="text"
                placeholder="ابحث بالاسم أو الفاتحة (مثل: الر، حم)..."
                value={muqattaatSearch}
                onChange={(e) => setMuqattaatSearch(e.target.value)}
                className={`w-full px-3 py-1.5 pl-8 rounded-lg text-xs border outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredMuqattaat.map(m => {
                const isSelected = m.surahNumber === selectedMuqattaatSurah;
                return (
                  <button
                    key={m.surahNumber}
                    onClick={() => setSelectedMuqattaatSurah(m.surahNumber)}
                    className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                        : isDark
                        ? 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800 text-slate-300'
                        : 'bg-slate-50 border-slate-200 hover:bg-amber-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-slate-800 text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                        {m.surahNumber}
                      </span>
                      <div className="min-w-0 truncate">
                        <div className="text-sm truncate font-serif font-bold">
                          {formatSurahName(m.surahName)}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {m.meaningSummary}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-left">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-mono font-bold text-xs border border-amber-500/20">
                        {m.openingText}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right 2 Columns: Selected Surah Letter Analysis */}
          <div className="lg:col-span-2 space-y-4">
            {/* Surah Detail Header Card */}
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/60">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold font-serif">
                      {formatSurahName(currentMuqattaat.surahName)}
                    </h2>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold font-serif text-sm border border-amber-500/30">
                      {currentMuqattaat.openingText}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({currentSurahData.totalAyahs} آية | {(currentSurahData.totalChars || currentSurahData.letters?.totalLettersPlain)?.toLocaleString()} حرف)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {currentMuqattaat.meaningSummary} — دراسة كثافة حروف الفاتحة في السورة مقابل متوسط القرآن.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenInReader && (
                    <button
                      onClick={() => onOpenInReader(currentMuqattaat.surahNumber)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-sky-500 hover:text-white text-xs font-semibold text-slate-300 transition-all flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      فتح في المصحف
                    </button>
                  )}
                  {onSelectSurah && (
                    <button
                      onClick={() => onSelectSurah(currentSurahData)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-white text-xs font-semibold text-amber-300 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      التحليل الشامل
                    </button>
                  )}
                </div>
              </div>

              {/* Letter Frequencies Comparison Cards */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {openingLettersStats.map(stat => (
                  <div 
                    key={stat.letter}
                    className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold font-mono text-base flex items-center justify-center">
                          {stat.letter}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-200">
                            حرف {stat.letterName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {stat.count} تكرار
                          </div>
                        </div>
                      </div>

                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        stat.isHigherThanAverage
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {stat.relativeRatio}x
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-slate-400">
                        <span>نسبته في السورة:</span>
                        <span className="font-bold text-amber-400">{stat.percentageInSurah}%</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>معدله في القرآن:</span>
                        <span className="font-mono">{stat.quranAvg}%</span>
                      </div>
                    </div>

                    <div className="mt-2 w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${stat.isHigherThanAverage ? 'bg-emerald-400' : 'bg-amber-400'}`}
                        style={{ width: `${Math.min(100, stat.relativeRatio * 50)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Academic Scholarly Notes */}
              <div className="mt-4 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-amber-400">ملاحظة بحثية: </span>
                تناولت دراسات الإعجاز العددي واللساني (مثل أبحاث د. عبد الرزاق نوفل ود. رشاد خليفة وغيرهما) فرضية أن الحروف المقطعة في فواتح السور تحظى بنسب تردد نوعية داخل سورها. يُظهر هذا الجدول الأرقام الإحصائية المحايدة والدقيقة لاختبار هذه الفرضيات علمياً دون تكلف.
              </div>
            </div>

            {/* Verse-by-verse Heatmap and In-Depth Surah Frequency Analysis */}
            <MuqattaatVerseHeatmap
              surahData={currentSurahData}
              muqattaatMeta={currentMuqattaat}
              ayahs={currentSurahCorpus?.ayahs || []}
              letterStats={letterStats}
              onOpenInReader={onOpenInReader}
            />
          </div>
        </div>
      )}

      {/* Main Tab 2: The 7 Hawameem (Integrated from previous Lab) */}
      {activeMainTab === 'hawameem' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-orange-400" />
            <span>
              عائلة الحواميم السبع (السور 40 إلى 46 المفتتحة بـ حم): تم دمج كافة أدواتها (الخريطة الحرارية 7×28، ورادار الحروف، ومصفوفة التشابه، وفلك الفواتح) في هذه اللوحة الشاملة.
            </span>
          </div>

          <HawameemLab 
            surahs={surahs}
            letterStats={letterStats}
            onSelectSurah={onSelectSurah}
            onOpenInReader={onOpenInReader}
            onCompareWith={onCompareWith}
          />
        </div>
      )}

      {/* Main Tab 3: Other Surah Families (المسبحات، الطواسين، ذوات الم، ذوات الر...) */}
      {activeMainTab === 'families' && (
        <div className="space-y-4">
          {/* Families Selector Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {SURAH_FAMILIES.filter(f => f.id !== 'hawameem').map(family => (
              <button
                key={family.id}
                onClick={() => setSelectedFamilyId(family.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  family.id === selectedFamilyId
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                    : isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {family.name}
              </button>
            ))}
          </div>

          {/* Current Family Header & Stats */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold font-serif text-slate-200">
                  {currentFamily.nameWithPrefix}
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  {currentFamily.description}
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {familyStats.count} سور قرآنية
              </span>
            </div>

            {/* 4 Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[11px] text-slate-400">إجمالي الآيات</div>
                <div className="text-xl font-bold font-mono text-sky-400 mt-1">
                  {familyStats.totalAyahs.toLocaleString()}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[11px] text-slate-400">إجمالي الكلمات</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {familyStats.totalWords.toLocaleString()}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[11px] text-slate-400">إجمالي الحروف</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                  {familyStats.totalChars.toLocaleString()}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[11px] text-slate-400">متوسط طول الآية</div>
                <div className="text-xl font-bold font-mono text-purple-400 mt-1">
                  {familyStats.avgVerseLength} <span className="text-[10px] text-slate-400 font-sans">كلمة/آية</span>
                </div>
              </div>
            </div>

            {/* Surahs in this family */}
            <div className="mt-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                سور هذه العائلة:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {familyStats.surahs.map(s => (
                  <div 
                    key={s.number}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 font-mono text-xs font-bold flex items-center justify-center">
                        {s.number}
                      </span>
                      <div>
                        <div className={`font-bold font-serif text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {formatSurahName(s.name)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {s.totalAyahs} آية • {s.isMeccan ? 'مكية' : 'مدنية'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onOpenInReader && (
                        <button
                          onClick={() => onOpenInReader(s.number)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-sky-500 hover:text-white text-slate-400 transition-all"
                          title="فتح في المصحف"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onSelectSurah && (
                        <button
                          onClick={() => onSelectSurah(s)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-400 transition-all"
                          title="التحليل التفصيلي"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const OpeningsAndFamiliesLab = React.memo(OpeningsAndFamiliesLabComponent);
export default OpeningsAndFamiliesLab;
