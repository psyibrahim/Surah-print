import React, { useState, useMemo } from 'react';
import { SurahData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { 
  SIMILARITY_CRITERIA, 
  SimilarityCriterionId, 
  getClosestSurahsByCriterion,
  calculateLettersSimilarity,
  calculatePhoneticSimilarity,
  calculateVerseEndingsSimilarity,
  calculateDiacriticsSimilarity,
  calculateCadenceSimilarity,
  calculateVocabularySimilarity
} from '../utils/similarityMetrics';
import { 
  GitCompare, 
  Info, 
  Sparkles, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { MathTooltip } from './MathTooltip';
import { formatSurahName } from '../utils/arabic';

interface SurahSimilarityExplorerProps {
  baseSurah: SurahData;
  allSurahs: SurahData[];
  onSelectSurah: (surah: SurahData) => void;
  onCompareWith: (targetSurahNumber: number) => void;
  titlePrefix?: string;
}

export const SurahSimilarityExplorer: React.FC<SurahSimilarityExplorerProps> = ({
  baseSurah,
  allSurahs,
  onSelectSurah,
  onCompareWith,
  titlePrefix
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [selectedCriterion, setSelectedCriterion] = useState<SimilarityCriterionId>('letters');
  const [filterRevelation, setFilterRevelation] = useState<'all' | 'meccan' | 'medinan'>('all');
  const [displayCount, setDisplayCount] = useState<5 | 10>(5);
  const [expandedSurahNumber, setExpandedSurahNumber] = useState<number | null>(null);

  const activeCriterionDef = useMemo(() => {
    return SIMILARITY_CRITERIA.find(c => c.id === selectedCriterion) || SIMILARITY_CRITERIA[0];
  }, [selectedCriterion]);

  // Query closest surahs using current criterion and filters
  const closestResults = useMemo(() => {
    return getClosestSurahsByCriterion(baseSurah, allSurahs, selectedCriterion, {
      filterRevelation,
      limit: displayCount
    });
  }, [baseSurah, allSurahs, selectedCriterion, filterRevelation, displayCount]);

  // Breakdown metrics for the expanded comparison card
  const getPairwiseBreakdown = (target: SurahData) => {
    const lettersSim = calculateLettersSimilarity(baseSurah, target);
    const phoneticsRes = calculatePhoneticSimilarity(baseSurah, target);
    const endingsRes = calculateVerseEndingsSimilarity(baseSurah, target);
    const diacriticsSim = calculateDiacriticsSimilarity(baseSurah, target);
    const cadenceSim = calculateCadenceSimilarity(baseSurah, target, allSurahs);
    const vocabRes = calculateVocabularySimilarity(baseSurah, target);

    return {
      lettersSim,
      phoneticsSim: phoneticsRes.similarity,
      endingsSim: endingsRes.similarity,
      topEnding: endingsRes.topSharedEnding,
      diacriticsSim,
      cadenceSim,
      vocabSim: vocabRes.similarity,
      sharedWordsCount: vocabRes.sharedTopWordsCount,
      rawTtrBase: vocabRes.rawTtr1,
      rawTtrTarget: vocabRes.rawTtr2,
      guiraudBase: vocabRes.guiraud1,
      guiraudTarget: vocabRes.guiraud2
    };
  };

  return (
    <div className="space-y-4">
      {/* Criteria Selection Header & Badges */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div>
            <h4 className={`text-xs font-mono font-bold uppercase flex items-center gap-2 ${
              isLight ? 'text-slate-950' : 'text-sky-400'
            }`}>
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{titlePrefix || 'معايير قياس التشابه والعلاقات مع'} «{formatSurahName(baseSurah.name)}»</span>
            </h4>
            <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
              اختر المعيار الإحصائي أو الأسلوبي لمقارنة وتحديد السور الأقرب شبهاً ونظماً
            </p>
          </div>

          {/* Revelation & Limit Quick Controls */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
            {/* Revelation Filter */}
            <div className={`flex items-center p-0.5 rounded-lg border text-xs font-mono ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0A0D12] border-slate-800'
            }`}>
              <span className={`px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 ${
                isLight ? 'text-slate-900' : 'text-slate-400'
              }`}>
                <Filter className="w-3 h-3 text-sky-400" />
                <span>النزول:</span>
              </span>
              {(['all', 'meccan', 'medinan'] as const).map(rev => (
                <button
                  key={rev}
                  onClick={() => setFilterRevelation(rev)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    filterRevelation === rev
                      ? (isLight 
                          ? 'bg-sky-600 text-white shadow-2xs' 
                          : 'bg-sky-500/25 text-sky-300 border border-sky-500/40')
                      : (isLight ? 'text-slate-800 hover:text-black' : 'text-slate-400 hover:text-slate-200')
                  }`}
                >
                  {rev === 'all' ? 'الكل' : rev === 'meccan' ? 'مكية' : 'مدنية'}
                </button>
              ))}
            </div>

            {/* Display Count Toggle */}
            <div className={`flex items-center p-0.5 rounded-lg border text-xs font-mono ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0A0D12] border-slate-800'
            }`}>
              {([5, 10] as const).map(count => (
                <button
                  key={count}
                  onClick={() => setDisplayCount(count)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    displayCount === count
                      ? (isLight 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-800 text-sky-300 border border-slate-700')
                      : (isLight ? 'text-slate-800 hover:text-black' : 'text-slate-400 hover:text-slate-200')
                  }`}
                >
                  أقرب {count}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 7 Criteria Selection Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {SIMILARITY_CRITERIA.map(criterion => {
            const Icon = criterion.icon;
            const isSelected = selectedCriterion === criterion.id;

            return (
              <button
                key={criterion.id}
                onClick={() => setSelectedCriterion(criterion.id)}
                className={`p-2.5 rounded-lg border text-right transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? (isLight 
                        ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-400 shadow-sm' 
                        : `${criterion.color.bg} ${criterion.color.border} ring-2 ${criterion.color.activeRing} shadow-md`)
                    : (isLight 
                        ? 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50' 
                        : 'bg-[#0A0D12] border-slate-800 hover:border-slate-700 hover:bg-slate-900/50')
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className={`p-1.5 rounded-md ${
                    isSelected
                      ? (isLight ? 'bg-sky-200 text-sky-950' : 'bg-slate-800 text-sky-300')
                      : (isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-900 text-slate-400')
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    isLight ? criterion.color.badgeLight : criterion.color.badgeDark
                  }`}>
                    {criterion.badge}
                  </span>
                </div>

                <div>
                  <div className={`text-xs font-bold font-quran leading-tight ${
                    isSelected
                      ? (isLight ? 'text-slate-950' : 'text-white')
                      : (isLight ? 'text-slate-900' : 'text-slate-300')
                  }`}>
                    {criterion.shortLabel}
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 truncate ${
                    isLight ? 'text-slate-700 font-bold' : 'text-slate-400'
                  }`}>
                    {criterion.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Criterion Scientific Methodology Card */}
      <div className={`p-3 rounded-lg border text-xs font-mono transition-colors ${
        isLight 
          ? 'bg-sky-50/80 border-sky-300 text-slate-900' 
          : 'bg-[#0A0D12] border-sky-900/60 text-slate-300'
      }`}>
        <div className="flex items-start gap-2.5">
          <div className={`p-1.5 rounded-md mt-0.5 shrink-0 ${
            isLight ? 'bg-sky-200 text-sky-950' : 'bg-sky-950 text-sky-400 border border-sky-800'
          }`}>
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`font-bold font-quran text-sm ${isLight ? 'text-slate-950' : 'text-sky-300'}`}>
                معيار: {activeCriterionDef.label}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                isLight ? activeCriterionDef.color.badgeLight : activeCriterionDef.color.badgeDark
              }`}>
                {activeCriterionDef.badge}
              </span>
            </div>
            <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
              {activeCriterionDef.description}
            </p>
            <div className={`text-[10px] pt-1 border-t flex flex-wrap items-center gap-2 ${
              isLight ? 'border-sky-200 text-sky-950 font-bold' : 'border-slate-800 text-sky-400'
            }`}>
              <span><strong>المعادلة:</strong> {activeCriterionDef.formula}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-950' : 'text-slate-300'}`}>
            أقرب {closestResults.length} سور بحسب {activeCriterionDef.shortLabel}:
          </span>
          <span className={`text-[10px] font-mono ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
            السور المفحوصة: {allSurahs.length - 1} سورة
          </span>
        </div>

        <div className={`grid gap-2.5 font-mono ${
          displayCount === 10 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
        }`}>
          {closestResults.map(result => {
            const target = result.surah;
            const isExpanded = expandedSurahNumber === target.number;
            const breakdown = isExpanded ? getPairwiseBreakdown(target) : null;

            // Determine similarity color badge
            let badgeColor = '';
            if (result.similarity >= 95) {
              badgeColor = isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-400' : 'bg-emerald-950/80 text-emerald-300 border-emerald-700';
            } else if (result.similarity >= 85) {
              badgeColor = isLight ? 'bg-sky-100 text-sky-950 border-sky-400' : 'bg-sky-950/80 text-sky-300 border-sky-700';
            } else if (result.similarity >= 70) {
              badgeColor = isLight ? 'bg-amber-100 text-amber-950 border-amber-400' : 'bg-amber-950/80 text-amber-300 border-amber-700';
            } else {
              badgeColor = isLight ? 'bg-slate-100 text-slate-950 border-slate-300' : 'bg-slate-900 text-slate-300 border-slate-800';
            }

            return (
              <div 
                key={target.number}
                className={`p-3 rounded-lg border flex flex-col justify-between transition-all group ${
                  isLight 
                    ? 'bg-white border-slate-300 hover:border-sky-500 shadow-2xs' 
                    : 'bg-[#0A0D12] border-slate-800 hover:border-sky-500/50'
                } ${isExpanded ? (isLight ? 'ring-2 ring-sky-500' : 'ring-2 ring-sky-500/60') : ''}`}
              >
                <div>
                  {/* Card Header: Rank & Similarity Score */}
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className={`w-5 h-5 rounded text-[11px] flex items-center justify-center font-bold font-mono ${
                      isLight ? 'bg-slate-900 text-white' : 'bg-slate-800 text-slate-300'
                    }`}>
                      #{result.rank}
                    </span>

                    <MathTooltip metricId="cosineSimilarity" value={`${result.similarity}%`}>
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border shadow-2xs ${badgeColor}`}>
                        {result.similarity}%
                      </span>
                    </MathTooltip>
                  </div>

                  {/* Similarity Progress Bar */}
                  <div className={`w-full h-1.5 rounded-full overflow-hidden mb-2 ${
                    isLight ? 'bg-slate-100' : 'bg-slate-800'
                  }`}>
                    <div 
                      className={`h-full transition-all duration-300 ${
                        result.similarity >= 95 
                          ? 'bg-emerald-500' 
                          : result.similarity >= 85 
                            ? 'bg-sky-500' 
                            : result.similarity >= 70 
                              ? 'bg-amber-500' 
                              : 'bg-slate-500'
                      }`}
                      style={{ width: `${Math.max(5, Math.min(100, result.similarity))}%` }}
                    />
                  </div>

                  {/* Surah Name */}
                  <h5 className={`font-quran font-bold text-base transition-colors ${
                    isLight ? 'text-slate-950 group-hover:text-sky-700' : 'text-slate-100 group-hover:text-sky-300'
                  }`}>
                    {formatSurahName(target.name)}
                  </h5>

                  {/* Surah Basic Metadata */}
                  <div className={`text-[10px] mt-1 space-y-0.5 font-mono ${
                    isLight ? 'text-slate-800 font-bold' : 'text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`px-1 rounded text-[9px] font-bold ${
                        target.isMeccan
                          ? (isLight ? 'bg-sky-100 text-sky-950 border border-sky-300' : 'bg-sky-950/60 text-sky-300 border border-sky-800')
                          : (isLight ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800')
                      }`}>
                        {target.isMeccan ? 'مكية' : 'مدنية'}
                      </span>
                      <span>{target.totalAyahs} آية • {target.totalWords} كلمة</span>
                    </div>

                    {/* Criterion-specific Highlight Note */}
                    <div className={`pt-1 border-t text-[10px] mt-1.5 flex items-center justify-between ${
                      isLight ? 'border-slate-200 text-slate-900' : 'border-slate-800/80 text-sky-400'
                    }`}>
                      <span className="font-semibold truncate" title={result.detailValue}>
                        {result.detailValue}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Pairwise Breakdown Panel */}
                {isExpanded && breakdown && (
                  <div className={`my-2 p-2 rounded-md border text-[10px] space-y-1.5 font-mono ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900/90 border-slate-700 text-slate-200'
                  }`}>
                    <div className="font-bold border-b pb-1 text-center font-quran text-xs">
                      مقارنة الأبعاد الستة مع «{baseSurah.name}»
                    </div>
                    <div className="flex items-center justify-between">
                      <span>الحروف الـ 28:</span>
                      <strong className="text-sky-500">{breakdown.lettersSim}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>المخارج والصفات التجويدية:</span>
                      <strong className="text-teal-500">{breakdown.phoneticsSim}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>فواصل الآيات:</span>
                      <strong className="text-purple-500">{breakdown.endingsSim}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>التشكيل والحركات:</span>
                      <strong className="text-emerald-500">{breakdown.diacriticsSim}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>الإيقاع وطول الآيات:</span>
                      <strong className="text-amber-500">{breakdown.cadenceSim}%</strong>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span>تنوع ومعجم الألفاظ (جيراود):</span>
                        <strong className="text-rose-500">{breakdown.vocabSim}%</strong>
                      </div>
                      <div className={`p-1.5 rounded text-[9px] space-y-0.5 ${
                        isLight ? 'bg-slate-100 border border-slate-200 text-slate-700' : 'bg-slate-800/80 border border-slate-700/60 text-slate-300'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-rose-600 dark:text-rose-400 font-bold">• مؤشر جيراود المعدّل (V/√N):</span>
                          <span className="font-bold">{breakdown.guiraudBase} مقابل {breakdown.guiraudTarget}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>• TTR السطحي الكلاسيكي:</span>
                          <span>{breakdown.rawTtrBase}% مقابل {breakdown.rawTtrTarget}%</span>
                        </div>
                        {breakdown.sharedWordsCount > 0 && (
                          <div className="flex items-center justify-between text-teal-600 dark:text-teal-400">
                            <span>• ألفاظ مركزية مشتركة:</span>
                            <span>{breakdown.sharedWordsCount} كلمات متطابقة</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {breakdown.topEnding && (
                      <div className="pt-1 border-t text-[9px] text-purple-600 dark:text-purple-300">
                        أبرز فاصلة مشتركة: {breakdown.topEnding}
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Card Actions */}
                <div className={`mt-2.5 pt-2 border-t flex items-center gap-1.5 font-mono ${
                  isLight ? 'border-slate-200' : 'border-slate-800/80'
                }`}>
                  <button
                    onClick={() => onSelectSurah(target)}
                    className={`flex-1 py-1 px-1.5 rounded text-[11px] font-bold text-center transition-all cursor-pointer ${
                      isLight 
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-950 border border-slate-300' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                    title="فتح بطاقة السورة وبصمتها الكاملة"
                  >
                    عرض البصمة
                  </button>

                  <button
                    onClick={() => setExpandedSurahNumber(isExpanded ? null : target.number)}
                    className={`p-1 rounded text-xs transition-all cursor-pointer ${
                      isExpanded
                        ? (isLight ? 'bg-sky-200 text-sky-950' : 'bg-sky-500/30 text-sky-300')
                        : (isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300')
                    }`}
                    title="تحليل تفصيلي للأبعاد الخمسة"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => onCompareWith(target.number)}
                    className={`p-1 rounded text-xs transition-all cursor-pointer ${
                      isLight 
                        ? 'bg-sky-100 hover:bg-sky-200 text-sky-950 border border-sky-300' 
                        : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40'
                    }`}
                    title="مقارنة مباشرة في معمل المقارنة الثنائية"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
