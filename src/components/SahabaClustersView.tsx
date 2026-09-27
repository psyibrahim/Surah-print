// src/components/SahabaClustersView.tsx
// الواجهة التفاعلية المتطورة لعناقيد تحزيب الصحابة السبعة واستقلال الفاتحة ووضع سورة ق في العنقود قبل الأخير

import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  BookOpen, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  TrendingDown, 
  BarChart3, 
  Grid, 
  Table as TableIcon, 
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Search,
  ExternalLink,
  Flame
} from 'lucide-react';
import { SurahData, LetterStatsData } from '../types';
import { SAHABA_CLUSTERS, AL_FATIHAH_META, computeClusterStats, SahabaClusterDef } from '../data/sahabaClusters';
import { useTheme } from '../context/ThemeContext';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { ClusteringMethodologyExplainer } from './ClusteringMethodologyExplainer';
import { SahabaClustersCharts } from './SahabaClustersCharts';
import { SahabaLetterHeatmap } from './SahabaLetterHeatmap';
import { SahabaClusterWordsAnalysis } from './SahabaClusterWordsAnalysis';

interface SahabaClustersViewProps {
  surahs: SurahData[];
  similarityMatrix?: number[][];
  letterStats?: LetterStatsData;
  onSelectSurah: (surah: SurahData) => void;
  onCompare?: (surah1: number, surah2: number) => void;
}

export const SahabaClustersView: React.FC<SahabaClustersViewProps> = ({
  surahs,
  similarityMatrix,
  letterStats: propsLetterStats,
  onSelectSurah,
  onCompare
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { letterStats: ctxLetterStats } = useQuranCorpus();
  const letterStats = propsLetterStats || ctxLetterStats;

  const [viewMode, setViewMode] = useState<'charts' | 'heatmap' | 'words' | 'cards' | 'table'>('charts');
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fatihah Surah Data
  const fatihahSurah = useMemo(() => {
    return surahs.find(s => s.number === 1) || surahs[0];
  }, [surahs]);

  // Compute stats for all 7 clusters
  const clustersStats = useMemo(() => {
    return SAHABA_CLUSTERS.map(cDef => computeClusterStats(cDef, surahs, similarityMatrix));
  }, [surahs, similarityMatrix]);

  // Total summary across the 7 clusters
  const totalQuranWords = useMemo(() => surahs.reduce((sum, s) => sum + s.totalWords, 0) || 77797, [surahs]);
  const totalQuranAyahs = useMemo(() => surahs.reduce((sum, s) => sum + s.totalAyahs, 0) || 6236, [surahs]);

  // Filtered surahs when user searches
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.trim().toLowerCase();
    return surahs.filter(s => 
      s.name.includes(q) || 
      s.englishName.toLowerCase().includes(q) || 
      s.number.toString() === q
    );
  }, [surahs, searchQuery]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* Top Banner: Concept & Rule Header */}
      <div className="sci-bg sci-border rounded-xl p-4 sm:p-5 shadow-sm space-y-3 transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2 font-quran">
                <span>العناقيد السبعة الكبرى (تحزيب الصحابة المأثور)</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  7 أحزاب قرآنية
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                توزيع السور الـ 114 وفق هدي الصحابة في تجزئة المصحف (فَمِي بِشَوْقٍ)، مع خصوصية استقلال الفاتحة وضم (ق) للعنقود السادس
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto bg-slate-900/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('charts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'charts'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>لوحة الرسوم (Recharts)</span>
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'heatmap'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>خريطة كثافة الحروف</span>
            </button>
            <button
              onClick={() => setViewMode('words')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'words'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>أكثر الكلمات تكراراً (Top 10)</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>بطاقات العناقيد</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>الجدول المقارن</span>
            </button>
          </div>
        </div>

        {/* Essential Methodology Note */}
        <div className={`p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 ${
          isLight ? 'bg-amber-50/70 border-amber-200/80 text-amber-950' : 'bg-amber-950/20 border-amber-900/40 text-amber-200'
        }`}>
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold font-quran text-amber-300">الضوابط المنهجية للعناقيد الحالية:</span>
            <div className="text-[11px] font-sans text-slate-300 space-y-0.5">
              <div>1. <strong className="text-amber-300">سورة الفاتحة:</strong> مستقلة تماماً كفاتحة وأم للكتاب، ولا تنتمي للعناقيد السبعة.</div>
              <div>2. <strong className="text-amber-300">سورة (ق):</strong> أُدرجت هنا في <span className="underline font-bold text-amber-200">العنقود السادس (قبل الأخير)</span>، وتضم مجموعته 14 سورة (من الصافات إلى ق).</div>
              <div>3. <strong className="text-amber-300">العنقود السابع (المفصل):</strong> ينطلق من سورة الذاريات (51) وحتى سورة الناس (114) ويضم 64 سورة.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Standalone Honored Card: AL-FATIHAH */}
      <div className={`sci-bg sci-border rounded-xl p-4 transition-all duration-200 border-l-4 border-l-amber-400 shadow-sm ${
        isLight ? 'bg-gradient-to-r from-amber-50/40 to-transparent' : 'bg-gradient-to-r from-amber-950/15 to-transparent'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold font-mono text-sm shrink-0">
              1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-100 text-sm sm:text-base font-quran">
                  {fatihahSurah.name} ({fatihahSurah.englishName})
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  أم القرآن • مستقلة عن الأحزاب السبعة
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {AL_FATIHAH_META.note}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right font-mono text-xs hidden sm:block">
              <span className="text-slate-400">{fatihahSurah.totalAyahs} آيات • {fatihahSurah.totalWords} كلمة • {fatihahSurah.totalChars} حرفاً</span>
            </div>
            <button
              onClick={() => onSelectSurah(fatihahSurah)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>فحص الفاتحة</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* RECHARTS STATISTICAL DASHBOARD VIEW */}
      {viewMode === 'charts' && (
        <SahabaClustersCharts
          surahs={surahs}
          similarityMatrix={similarityMatrix}
          onSelectSurah={onSelectSurah}
        />
      )}

      {/* HEATMAP VIEW MODE */}
      {viewMode === 'heatmap' && (
        <SahabaLetterHeatmap
          surahs={surahs}
          letterStats={letterStats}
          onSelectSurah={onSelectSurah}
        />
      )}

      {/* TOP WORDS STATISTICAL TOOL VIEW */}
      {viewMode === 'words' && (
        <SahabaClusterWordsAnalysis
          surahs={surahs}
          onSelectSurah={onSelectSurah}
        />
      )}

      {/* CARDS VIEW MODE */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {clustersStats.map(stat => {
              const cDef = stat.clusterDef;
              const isSelected = selectedClusterId === cDef.id;

              return (
                <div
                  key={cDef.id}
                  className={`sci-bg sci-border rounded-xl p-4 space-y-3.5 shadow-sm transition-all duration-200 border-t-2 relative flex flex-col justify-between ${
                    isSelected ? 'ring-2 ring-sky-500/40' : ''
                  }`}
                  style={{ borderTopColor: cDef.color }}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: cDef.color }}
                        ></span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-100 text-sm font-quran">
                              {cDef.name}: {cDef.traditionalLabel}
                            </h4>
                            <span className={`text-[10px] font-mono px-2 py-0.2 rounded border font-semibold ${cDef.badgeBg}`}>
                              {stat.totalSurahs} سور
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono block">
                            {cDef.subtitle}
                          </span>
                        </div>
                      </div>

                      <div className="text-left font-mono text-[11px] text-slate-400">
                        <span className="text-slate-300 font-bold">{stat.meccanCount}</span> مكية / <span className="text-slate-300 font-bold">{stat.medinanCount}</span> مدنية
                      </div>
                    </div>

                    {/* Description & Thematic Focus */}
                    <p className="text-xs text-slate-300 leading-relaxed mt-2.5 font-sans">
                      {cDef.description}
                    </p>
                  </div>

                  {/* Quantitative Metrics Ribbon */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">إجمالي الآيات</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-200">
                        {stat.totalAyahs.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-500 block font-sans">
                        ({stat.percentageOfQuranAyahs}%)
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">إجمالي الكلمات</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-200">
                        {stat.totalWords.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-500 block font-sans">
                        ({stat.percentageOfQuranWords}%)
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">متوسط طول الآية</span>
                      <span className="text-xs sm:text-sm font-bold text-sky-400">
                        {stat.avgAyahWords} كلمة
                      </span>
                      <span className="text-[9px] text-slate-500 block font-sans">
                        ({stat.avgAyahChars} حرف)
                      </span>
                    </div>
                  </div>

                  {/* Surahs List Chips */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-0.5">
                      <span>سور العنقود ({cDef.countRule}):</span>
                      <span className="text-[10px] text-sky-400">انقر على السورة لتحليلها</span>
                    </div>

                    <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-1 bg-slate-950/40 rounded-lg border border-slate-800/60 scrollbar-thin">
                      {stat.surahs.map(s => {
                        const isSpecialQaf = s.number === 50;
                        return (
                          <button
                            key={s.number}
                            onClick={() => onSelectSurah(s)}
                            className={`px-2 py-1 rounded text-xs font-quran transition-all flex items-center gap-1.5 cursor-pointer border ${
                              isSpecialQaf
                                ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-200 font-bold shadow-xs'
                                : 'bg-slate-900 hover:bg-sky-500/20 border-slate-800 hover:border-sky-500/40 text-slate-300 hover:text-sky-200'
                            }`}
                            title={`سورة ${s.name} - الآيات: ${s.totalAyahs} (${s.isMeccan ? 'مكية' : 'مدنية'})`}
                          >
                            <span className="font-mono text-[9px] text-slate-500">#{s.number}</span>
                            <span>{s.name}</span>
                            <span className="text-[9px] font-mono text-slate-500">({s.totalAyahs})</span>
                            {isSpecialQaf && (
                              <span className="text-[8px] bg-cyan-500/30 text-cyan-200 px-1 rounded font-mono">سورة ق</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Intra-Cluster Cohesion & Top Letters footer */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/60 pt-2">
                    <div className="flex items-center gap-1.5">
                      <span>التجانس الداخلي:</span>
                      <span className="font-bold text-emerald-400">{stat.intraClusterCohesion}%</span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-slate-500">الحروف المهيمنة:</span>
                      {stat.dominantLetters.slice(0, 3).map(l => (
                        <span key={l.letter} className="px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                          {l.letter} ({l.percentage}%)
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TABLE VIEW MODE: Comprehensive Rhythm & Gradient Comparison */}
      {viewMode === 'table' && (
        <div className="sci-bg sci-border rounded-xl p-4 overflow-x-auto shadow-sm transition-colors duration-200">
          <div className="mb-3">
            <h4 className="font-bold text-slate-100 text-sm font-quran flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span>الجدول البانورامي المقارن للأحزاب السبعة (تدرج الإيقاع والآيات)</span>
            </h4>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              لاحظ التدرج الرياضي الصارم في انخفاض متوسط طول الآية من 23.8 كلمة في العنقود الأول حتى 4.9 كلمات في المفصل!
            </p>
          </div>

          <table className="w-full text-xs font-mono text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-300">
                <th className="py-2.5 px-3 font-bold">العنقود</th>
                <th className="py-2.5 px-3 font-bold">المسمى الأثري</th>
                <th className="py-2.5 px-3 font-bold">نطاق السور</th>
                <th className="py-2.5 px-3 font-bold text-center">العدد</th>
                <th className="py-2.5 px-3 font-bold text-center">مكي / مدني</th>
                <th className="py-2.5 px-3 font-bold text-center">إجمالي الآيات</th>
                <th className="py-2.5 px-3 font-bold text-center">إجمالي الكلمات</th>
                <th className="py-2.5 px-3 font-bold text-center text-sky-400">متوسط طول الآية</th>
                <th className="py-2.5 px-3 font-bold text-center text-emerald-400">التجانس الداخلي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {/* Al-Fatihah Row */}
              <tr className="bg-amber-500/5 hover:bg-amber-500/10 text-amber-200 font-medium">
                <td className="py-2 px-3 font-bold text-amber-300">الفاتحة</td>
                <td className="py-2 px-3">أم القرآن</td>
                <td className="py-2 px-3 font-quran">سورة الفاتحة (1)</td>
                <td className="py-2 px-3 text-center">1</td>
                <td className="py-2 px-3 text-center">مكية</td>
                <td className="py-2 px-3 text-center">7</td>
                <td className="py-2 px-3 text-center">29</td>
                <td className="py-2 px-3 text-center font-bold text-amber-300">4.14 كلمة</td>
                <td className="py-2 px-3 text-center text-slate-400">100%</td>
              </tr>

              {clustersStats.map((stat, idx) => {
                const cDef = stat.clusterDef;
                return (
                  <tr key={cDef.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cDef.color }}></span>
                      <span>{cDef.name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-quran text-slate-200">{cDef.traditionalLabel}</td>
                    <td className="py-2.5 px-3 text-slate-400">{cDef.countRule}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-200">{stat.totalSurahs}</td>
                    <td className="py-2.5 px-3 text-center text-slate-400">
                      {stat.meccanCount} مكي / {stat.medinanCount} مدني
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-300">
                      {stat.totalAyahs.toLocaleString()} ({stat.percentageOfQuranAyahs}%)
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-300">
                      {stat.totalWords.toLocaleString()} ({stat.percentageOfQuranWords}%)
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-sky-400 bg-sky-500/5">
                      {stat.avgAyahWords} كلمة
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-400">
                      {stat.intraClusterCohesion}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Scientific Explainer Methodology for Sahaba 7-Clusters */}
      <ClusteringMethodologyExplainer className="mt-4" />

    </div>
  );
};
