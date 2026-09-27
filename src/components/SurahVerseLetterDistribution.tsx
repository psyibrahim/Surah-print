import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  ReferenceLine
} from 'recharts';
import { 
  Type, 
  ArrowUpDown, 
  Sparkles, 
  Flame, 
  Filter, 
  CheckCircle2, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { QuranAyah } from '../types';
import { useTheme } from '../context/ThemeContext';
import { 
  analyzeVerseLetterDistribution, 
  VerseLetterDensityItem 
} from '../utils/verseLetterAnalysis';
import { formatSurahName } from '../utils/arabic';

interface SurahVerseLetterDistributionProps {
  ayahs: QuranAyah[];
  surahName: string;
  surahNumber: number;
}

const ARABIC_LETTERS = [
  'ALL',
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 
  'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 
  'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
];

export const SurahVerseLetterDistribution: React.FC<SurahVerseLetterDistributionProps> = ({
  ayahs,
  surahName,
  surahNumber
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'verse-order' | 'frequency-desc' | 'frequency-asc'>('verse-order');
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [selectedVerseDetail, setSelectedVerseDetail] = useState<VerseLetterDensityItem | null>(null);

  // Analyze distribution
  const analysis = useMemo(() => {
    return analyzeVerseLetterDistribution(ayahs, selectedLetter, sortBy);
  }, [ayahs, selectedLetter, sortBy]);

  // Determine segmenting for long surahs (if ayahs > 60, break into chunks of 50 for crystal clear bar reading)
  const pageSize = 50;
  const isSegmented = ayahs.length > 60 && sortBy === 'verse-order';
  const totalSegments = isSegmented ? Math.ceil(analysis.items.length / pageSize) : 1;

  const displayedItems = useMemo(() => {
    if (!isSegmented) return analysis.items;
    const start = activeSegmentIndex * pageSize;
    return analysis.items.slice(start, start + pageSize);
  }, [analysis.items, isSegmented, activeSegmentIndex]);

  return (
    <div className="sci-bg sci-border rounded-xl p-4 sm:p-5 space-y-4 shadow-sm transition-colors duration-200">
      
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Type className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>توزيع الحروف عبر آيات السورة (مدرج الكثافة النصية)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono">
                {analysis.letterLabel}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              تتبع تدفق وكثافة تكرار الحروف آية بآية من بداية {formatSurahName(surahName)} إلى ختامها، مع إمكانية الفرز والتحليل المجهري
            </p>
          </div>
        </div>

        {/* Sorting Controls */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-900/80 p-1 rounded-lg border border-slate-800">
          <span className="text-slate-400 text-[10px] px-1.5 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" />
            الفرز:
          </span>
          <button
            onClick={() => setSortBy('verse-order')}
            className={`px-2.5 py-1 rounded transition-all text-xs ${
              sortBy === 'verse-order'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="تسلسل الآيات من البداية إلى النهاية"
          >
            تسلسل الآيات
          </button>
          <button
            onClick={() => setSortBy('frequency-desc')}
            className={`px-2.5 py-1 rounded transition-all text-xs ${
              sortBy === 'frequency-desc'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="فرز من الآيات الأكثر احتواءً على الحرف إلى الأقل"
          >
            الأعلى تكراراً ↓
          </button>
          <button
            onClick={() => setSortBy('frequency-asc')}
            className={`px-2.5 py-1 rounded transition-all text-xs ${
              sortBy === 'frequency-asc'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="فرز من الآيات الأقل احتواءً على الحرف إلى الأكثر"
          >
            الأدنى تكراراً ↑
          </button>
        </div>
      </div>

      {/* Letter Selector Chips Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-sky-400" />
            اختر الحرف المراد تتبع مساره عبر الآيات:
          </span>
          <span className="text-sky-300 font-bold">
            {selectedLetter === 'ALL' ? 'إجمالي الحروف في كل آية' : `تكرار حرف «${selectedLetter}» عبر الآيات`}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-[#0A0D12] rounded-lg border border-slate-800 scrollbar-thin">
          {ARABIC_LETTERS.map(char => {
            const isAll = char === 'ALL';
            const active = selectedLetter === char;
            return (
              <button
                key={char}
                onClick={() => {
                  setSelectedLetter(char);
                  setSelectedVerseDetail(null);
                }}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                  active
                    ? isLight
                      ? 'bg-sky-600 text-white font-bold shadow-sm'
                      : 'bg-sky-500/30 text-sky-200 border border-sky-400 font-bold shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                    : isLight
                    ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                {isAll ? 'الكل (كثافة الآية)' : char}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
        <div className="p-2.5 rounded-lg bg-[#0A0D12] border border-slate-800">
          <div className="text-[10px] text-sky-400 uppercase">إجمالي التكرار</div>
          <div className="text-lg font-bold text-slate-100 mt-0.5">
            {analysis.totalOccurrences.toLocaleString('en-US')}
          </div>
          <div className="text-[10px] text-slate-400">مرة في مجموع السورة</div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#0A0D12] border border-slate-800">
          <div className="text-[10px] text-emerald-400 uppercase">الآيات الحاوية للحرف</div>
          <div className="text-lg font-bold text-emerald-300 mt-0.5">
            {analysis.versesWithLetter.toLocaleString('en-US')} / {ayahs.length}
          </div>
          <div className="text-[10px] text-slate-400">
            ({((analysis.versesWithLetter / Math.max(1, ayahs.length)) * 100).toFixed(1)}% من الآيات)
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#0A0D12] border border-slate-800">
          <div className="text-[10px] text-amber-400 uppercase">ذروة الكثافة بالآية</div>
          <div className="text-lg font-bold text-amber-300 mt-0.5 flex items-center gap-1">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>{analysis.maxOccurrenceInSingleVerse} مرة</span>
          </div>
          <div className="text-[10px] text-slate-400">
            في الآية رقم {analysis.peakVerseNumber}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#0A0D12] border border-slate-800">
          <div className="text-[10px] text-cyan-400 uppercase">معدل التكرار لكل آية</div>
          <div className="text-lg font-bold text-cyan-300 mt-0.5">
            {analysis.averagePerVerse}
          </div>
          <div className="text-[10px] text-slate-400">حرف / آية واحدة</div>
        </div>
      </div>

      {/* Segment Pagination Controls (for long surahs) */}
      {isSegmented && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#0A0D12] border border-slate-800 text-xs font-mono">
          <span className="text-slate-400 text-[11px]">
            عرض المقطع: الآيات {activeSegmentIndex * pageSize + 1} إلى {Math.min(ayahs.length, (activeSegmentIndex + 1) * pageSize)} من إجمالي {ayahs.length} آية
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveSegmentIndex(p => Math.max(0, p - 1))}
              disabled={activeSegmentIndex === 0}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition-colors"
              title="المقطع السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="px-2 text-sky-400 font-bold">
              {activeSegmentIndex + 1} / {totalSegments}
            </span>
            <button
              onClick={() => setActiveSegmentIndex(p => Math.min(totalSegments - 1, p + 1))}
              disabled={activeSegmentIndex === totalSegments - 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition-colors"
              title="المقطع التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Bar Chart Container */}
      <div className="bg-[#0A0D12] border border-slate-800 rounded-xl p-3 sm:p-4">
        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={displayedItems} 
              margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                  setSelectedVerseDetail(e.activePayload[0].payload as VerseLetterDensityItem);
                }
              }}
            >
              <XAxis 
                dataKey="verseNumber" 
                stroke={isLight ? '#94A3B8' : '#475569'} 
                fontSize={10}
                tickFormatter={(num) => `آية ${num}`}
                interval={displayedItems.length > 30 ? Math.ceil(displayedItems.length / 15) : 0}
              />
              <YAxis 
                stroke={isLight ? '#94A3B8' : '#475569'} 
                fontSize={10} 
                allowDecimals={false} 
              />
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
                formatter={(val: any, name: any, item: any) => {
                  const p = item.payload as VerseLetterDensityItem;
                  return [
                    `${val} مرة (${p.densityPercentage}% من حروف الآية)`,
                    selectedLetter === 'ALL' ? 'إجمالي الحروف' : `تكرار حرف ${selectedLetter}`
                  ];
                }}
                labelFormatter={(v) => `الآية رقم ${v}`}
              />
              <ReferenceLine 
                y={analysis.averagePerVerse} 
                stroke="#f59e0b" 
                strokeDasharray="3 3" 
                label={{ 
                  value: `المتوسط: ${analysis.averagePerVerse}`, 
                  fill: '#f59e0b', 
                  fontSize: 10,
                  position: 'insideTopLeft' 
                }} 
              />
              <Bar 
                dataKey="letterCount" 
                radius={[2, 2, 0, 0]}
                cursor="pointer"
              >
                {displayedItems.map((entry, index) => {
                  let fillColor = '#0284c7';
                  if (entry.isPeak) {
                    fillColor = '#f59e0b'; // Gold peak
                  } else if (entry.letterCount === 0) {
                    fillColor = isLight ? '#E2E8F0' : '#1e293b';
                  } else if (entry.densityPercentage > 20) {
                    fillColor = '#38bdf8';
                  }
                  return <Cell key={`cell-verse-${index}`} fill={fillColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-[10px] text-slate-400 font-mono text-center mt-2 flex items-center justify-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b] inline-block"></span>
            الذهب: أعلى آية تكراراً (الذروة)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#38bdf8] inline-block"></span>
            السماوي: كثافة مرتفعة
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#0284c7] inline-block"></span>
            الأزرق: كثافة اعتيادية
          </span>
          <span className="text-sky-400 font-semibold cursor-pointer hidden sm:inline">
            • انقر على أي عمود لمعاينة نص الآية
          </span>
        </div>
      </div>

      {/* Selected Verse Preview Drawer / Box */}
      {selectedVerseDetail && (
        <div className={`p-3.5 sm:p-4 rounded-xl border space-y-2 animate-in fade-in duration-200 ${
          isLight 
            ? 'bg-sky-50/90 border-sky-200 text-slate-900 shadow-sm' 
            : 'bg-sky-500/10 border-sky-500/30 text-slate-100'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={`font-bold flex items-center gap-1.5 ${
              isLight ? 'text-sky-800' : 'text-sky-300'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-sky-500" />
              معاينة الآية رقم {selectedVerseDetail.verseNumber}:
            </span>
            <span className="text-slate-400 text-[11px]">
              {selectedVerseDetail.letterCount} مرة • {selectedVerseDetail.densityPercentage}% من حروف الآية • {selectedVerseDetail.wordCount} كلمات
            </span>
          </div>
          <div 
            className={`quran-ayah-container p-3 sm:p-4 rounded-lg border font-quran text-base sm:text-lg leading-[2.2] sm:leading-[2.5] text-right shadow-inner select-text ${
              isLight 
                ? 'bg-white border-slate-200 text-slate-950' 
                : 'bg-black/50 border-slate-800 text-slate-100'
            }`}
            dir="rtl"
          >
            <span className="opacity-60 select-none">« </span>
            {selectedVerseDetail.textUthmani}
            <span className="opacity-60 select-none"> »</span>
            {' '}
            <span className="inline-block mr-1 text-sky-500 text-sm font-mono font-bold select-none" dir="ltr">
              ﴿{selectedVerseDetail.verseNumber}﴾
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
