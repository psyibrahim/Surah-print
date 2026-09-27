import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Activity, 
  TrendingUp, 
  Layers, 
  Sparkles, 
  Filter, 
  Check, 
  Info,
  Maximize2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  ReferenceLine
} from 'recharts';
import { SurahData, LetterStatsData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { 
  ARABIC_LETTERS, 
  ARABIC_LETTER_NAMES, 
  formatSurahName 
} from '../utils/arabic';
import { 
  HawameemAggregateReport, 
  HAWAMEEM_SURAH_NUMBERS, 
  HAWAMEEM_METADATA 
} from '../utils/hawameemData';

interface HawameemChartsProps {
  report: HawameemAggregateReport;
  letterStats: LetterStatsData;
}

type ActiveChartMode = 'letters_bar' | 'radar_multiaxis' | 'sequential_trend' | 'rhyme_cadence';

// Standard distinct colors for the 7 surahs
const SURAH_COLORS: Record<number, { stroke: string; fill: string; name: string }> = {
  40: { stroke: '#0284c7', fill: '#38bdf8', name: 'غافر' },
  41: { stroke: '#059669', fill: '#34d399', name: 'فصلت' },
  42: { stroke: '#7c3aed', fill: '#a78bfa', name: 'الشورى' },
  43: { stroke: '#d97706', fill: '#fbbf24', name: 'الزخرف' },
  44: { stroke: '#e11d48', fill: '#fb7185', name: 'الدخان' },
  45: { stroke: '#0d9488', fill: '#2dd4bf', name: 'الجاثية' },
  46: { stroke: '#4f46e5', fill: '#818cf8', name: 'الأحقاف' }
};

export const HawameemCharts: React.FC<HawameemChartsProps> = ({
  report,
  letterStats
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [activeChart, setActiveChart] = useState<ActiveChartMode>('letters_bar');
  
  // Selected surahs for Radar overlay
  const [selectedRadarSurahs, setSelectedRadarSurahs] = useState<number[]>([40, 42, 44]);

  // Letter subset for Bar Chart
  const [barLettersGroup, setBarLettersGroup] = useState<'hameem_core' | 'top_frequent' | 'muqattaat' | 'all'>('hameem_core');

  const toggleRadarSurah = (surahNum: number) => {
    setSelectedRadarSurahs(prev => {
      if (prev.includes(surahNum)) {
        if (prev.length <= 1) return prev; // keep at least one
        return prev.filter(n => n !== surahNum);
      } else {
        return [...prev, surahNum];
      }
    });
  };

  // Letters to display in Bar chart
  const activeBarLetters = useMemo(() => {
    switch (barLettersGroup) {
      case 'hameem_core':
        return ['ح', 'م', 'ع', 'س', 'ق'];
      case 'top_frequent':
        return ['ا', 'ل', 'ن', 'م', 'و', 'ي', 'ه', 'ر', 'ب', 'ت', 'ح'];
      case 'muqattaat':
        return ['ا', 'ل', 'م', 'ص', 'ر', 'ك', 'ه', 'ي', 'ع', 'ط', 'س', 'ح', 'ق', 'ن'];
      case 'all':
      default:
        return ARABIC_LETTERS;
    }
  }, [barLettersGroup]);

  // Data for the Letter Bar Chart
  const barChartData = useMemo(() => {
    let quranTotalLetters = 326048;
    const stats = letterStats.globalStats || {};
    
    return activeBarLetters.map(letter => {
      const entry: any = {
        letter,
        letterName: ARABIC_LETTER_NAMES[letter] || letter,
      };

      // Each surah's percentage
      report.hawameemLettersStats.forEach(sStat => {
        entry[`surah_${sStat.surahNumber}`] = sStat.letterPercentages[letter] || 0;
      });

      // Whole Quran baseline
      const globalCount = stats[letter]?.totalOccurrences || 0;
      entry['quran_global'] = Number(((globalCount / quranTotalLetters) * 100).toFixed(2));

      return entry;
    });
  }, [activeBarLetters, report, letterStats]);

  // Data for the Multi-Axis Radar Chart
  // 6 normalized dimensions: 0 to 100
  const radarChartData = useMemo(() => {
    // Find maximums among Hawameem for normalization
    let maxAyahWords = 0;
    let maxVocabDiv = 0;
    let maxHaPct = 0;
    let maxMeemPct = 0;
    let maxWordLength = 0;

    report.surahs.forEach(s => {
      if (s.avgAyahLengthWords > maxAyahWords) maxAyahWords = s.avgAyahLengthWords;
      if (s.vocabularyDiversity > maxVocabDiv) maxVocabDiv = s.vocabularyDiversity;
      if (s.avgWordLength > maxWordLength) maxWordLength = s.avgWordLength;
    });
    report.hawameemLettersStats.forEach(s => {
      if (s.haPercentage > maxHaPct) maxHaPct = s.haPercentage;
      if (s.meemPercentage > maxMeemPct) maxMeemPct = s.meemPercentage;
    });

    const dimensions = [
      { key: 'avgAyahWords', label: 'طول الآية (كلمات)', max: maxAyahWords || 20 },
      { key: 'vocabDiversity', label: 'التنوع المعجمي %', max: maxVocabDiv || 50 },
      { key: 'haPct', label: 'كثافة الحاء %', max: maxHaPct || 2 },
      { key: 'meemPct', label: 'كثافة الميم %', max: maxMeemPct || 12 },
      { key: 'avgWordLen', label: 'طول الكلمة (حروف)', max: maxWordLength || 5 },
      { key: 'rhymeUniformity', label: 'توحيد الفاصلة (ـون/ـين)', max: 100 }
    ];

    return dimensions.map(dim => {
      const row: any = {
        dimension: dim.label
      };

      report.surahs.forEach(surah => {
        const lStat = report.hawameemLettersStats.find(x => x.surahNumber === surah.number);
        let val = 0;
        if (dim.key === 'avgAyahWords') val = surah.avgAyahLengthWords;
        if (dim.key === 'vocabDiversity') val = surah.vocabularyDiversity;
        if (dim.key === 'haPct') val = lStat?.haPercentage || 0;
        if (dim.key === 'meemPct') val = lStat?.meemPercentage || 0;
        if (dim.key === 'avgWordLen') val = surah.avgWordLength;
        if (dim.key === 'rhymeUniformity') {
          const topRhyme = surah.ayahs?.verseEndings?.[0]?.percentage || 50;
          val = topRhyme;
        }

        // Normalized score 0-100 for visual symmetry in radar
        const normalized = Math.min(100, Math.round((val / dim.max) * 100));
        row[`surah_${surah.number}`] = normalized;
        row[`raw_${surah.number}`] = val;
      });

      return row;
    });
  }, [report]);

  // Data for the Sequential Trend (Surah 40 -> 46)
  const sequentialData = useMemo(() => {
    return report.surahs.map(surah => {
      const lStat = report.hawameemLettersStats.find(x => x.surahNumber === surah.number);
      return {
        number: surah.number,
        name: formatSurahName(surah.name),
        totalAyahs: surah.totalAyahs,
        avgAyahWords: Number(surah.avgAyahLengthWords.toFixed(1)),
        haPct: lStat?.haPercentage || 0,
        meemPct: lStat?.meemPercentage || 0,
        haPlusMeemPct: lStat?.haPlusMeemPercentage || 0,
        vocabDiversity: Number(surah.vocabularyDiversity.toFixed(1)),
        totalWords: surah.totalWords
      };
    });
  }, [report]);

  // Data for Rhyme Distribution across Hawameem
  const rhymeChartData = useMemo(() => {
    // Sort rhymes by total frequency
    const sortedPatterns = Object.entries(report.rhymeDistribution)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 6);

    return sortedPatterns.map(([pattern, total]) => {
      const entry: any = {
        pattern,
        total
      };

      report.surahs.forEach(surah => {
        const found = (surah.ayahs?.verseEndings || []).find(e => e.pattern === pattern);
        entry[`surah_${surah.number}`] = found ? found.count : 0;
      });

      return entry;
    });
  }, [report]);

  // Custom tick for Hawameem radar to align labels and prevent clipping/overlap
  const renderHawameemRadarTick = (props: any) => {
    const { x, y, cx, cy, payload } = props;
    const label = payload?.value || '';

    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;

    const radialOffset = 18 + Math.abs(ux) * 22;
    const targetX = cx + ux * (dist + radialOffset);
    const targetY = cy + uy * (dist + radialOffset);

    const boxWidth = Math.max(90, label.length * 7.5 + 24);
    const boxHeight = 22;

    return (
      <g className="recharts-polar-angle-axis-tick select-none">
        <line
          x1={x}
          y1={y}
          x2={cx + ux * (dist + 6)}
          y2={cy + uy * (dist + 6)}
          stroke={isLight ? '#94a3b8' : '#475569'}
          strokeWidth={1.5}
          strokeDasharray="2 2"
        />
        <circle
          cx={cx + ux * (dist + 6)}
          cy={cy + uy * (dist + 6)}
          r={2}
          fill={isLight ? '#0284c7' : '#38bdf8'}
        />
        <g transform={`translate(${targetX}, ${targetY})`}>
          <rect
            x={-boxWidth / 2}
            y={-boxHeight / 2}
            width={boxWidth}
            height={boxHeight}
            rx={5}
            fill={isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.92)'}
            stroke={isLight ? '#cbd5e1' : '#334155'}
            strokeWidth={1}
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.06))' }}
          />
          <text
            x={0}
            y={1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={700}
            fill={isLight ? '#0f172a' : '#f8fafc'}
          >
            {label}
          </text>
        </g>
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Visual Chart Navigation Strip */}
      <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'sci-bg sci-border shadow-md'
      }`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-bold flex items-center gap-1.5 ml-2 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
            <BarChart3 className="w-3.5 h-3.5 text-sky-500" />
            المعلم البياني المعروض:
          </span>

          <button
            type="button"
            onClick={() => setActiveChart('letters_bar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeChart === 'letters_bar'
                ? 'bg-sky-600 text-white shadow-xs'
                : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800')
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            المخطط الشريطي لتوزيع الحروف
          </button>

          <button
            type="button"
            onClick={() => setActiveChart('radar_multiaxis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeChart === 'radar_multiaxis'
                ? 'bg-sky-600 text-white shadow-xs'
                : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800')
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            الرادار السداسي المقارن
          </button>

          <button
            type="button"
            onClick={() => setActiveChart('sequential_trend')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeChart === 'sequential_trend'
                ? 'bg-sky-600 text-white shadow-xs'
                : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800')
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            المسار التسلسلي (40 ➔ 46)
          </button>

          <button
            type="button"
            onClick={() => setActiveChart('rhyme_cadence')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeChart === 'rhyme_cadence'
                ? 'bg-sky-600 text-white shadow-xs'
                : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800')
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            قوافي وفواصل الآيات
          </button>
        </div>

        {/* Dynamic Secondary Filter */}
        {activeChart === 'letters_bar' && (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>مجموعة الحروف:</span>
            <select
              value={barLettersGroup}
              onChange={e => setBarLettersGroup(e.target.value as any)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-200'
              }`}
            >
              <option value="hameem_core">فواتح الحواميم (ح، م، ع، س، ق)</option>
              <option value="top_frequent">الحروف الأكثر شيوعاً (11 حرفاً)</option>
              <option value="muqattaat">الحروف النورانية الـ 14</option>
              <option value="all">سائر الحروف الـ 28</option>
            </select>
          </div>
        )}
      </div>

      {/* CHART 1: Multi-Surah Letter Bar Chart */}
      {activeChart === 'letters_bar' && (
        <div className={`p-5 rounded-xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'sci-bg sci-border shadow-md'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <BarChart3 className="w-5 h-5 text-sky-500" />
                توزيع نسب الحروف في سور الحواميم السبع مقابل معدل القرآن العام
              </h3>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                نسبة كل حرف من إجمالي حروف السورة، مع خط مرجعي يمثل معدل الحرف في المصحف كاملاً.
              </p>
            </div>
            
            {/* Surah Color Legend Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
              {HAWAMEEM_SURAH_NUMBERS.map(num => (
                <span 
                  key={num}
                  className={`px-2 py-0.5 rounded-md flex items-center gap-1.5 border ${
                    isLight 
                      ? 'bg-slate-100 border-slate-300 text-slate-900' 
                      : 'bg-slate-800/80 border-slate-700 text-slate-100'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SURAH_COLORS[num].stroke }} />
                  {SURAH_COLORS[num].name} ({num})
                </span>
              ))}
            </div>
          </div>

          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} />
                <XAxis 
                  dataKey="letter" 
                  stroke={isLight ? '#64748b' : '#94a3b8'} 
                  tick={{ fontSize: 14, fontFamily: 'Amiri, serif' }}
                  interval={0}
                />
                <YAxis 
                  unit="%" 
                  stroke={isLight ? '#64748b' : '#94a3b8'}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const letterName = ARABIC_LETTER_NAMES[label as string] || label;
                    return (
                      <div className={`p-3 rounded-lg border text-xs shadow-xl min-w-[200px] ${
                        isLight ? 'bg-white/95 border-slate-200 text-slate-900' : 'bg-slate-900/95 border-slate-700 text-slate-100'
                      }`}>
                        <div className="font-bold border-b pb-1.5 mb-2 flex items-center justify-between">
                          <span className="text-base font-quran">حرف {letterName} ({label})</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            معدل المصحف: {payload[0]?.payload?.quran_global}%
                          </span>
                        </div>
                        <div className="space-y-1">
                          {payload.map((entry: any) => {
                            const surahNum = Number(entry.dataKey.replace('surah_', ''));
                            if (!surahNum) return null;
                            const surah = HAWAMEEM_METADATA[surahNum];
                            return (
                              <div key={entry.dataKey} className="flex items-center justify-between font-mono">
                                <span className="flex items-center gap-1.5 font-sans" style={{ color: entry.color }}>
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                  {surah?.name}:
                                </span>
                                <span className="font-bold">{Number(entry.value).toFixed(2)}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }}
                />

                {/* Bars for each of the 7 surahs */}
                {HAWAMEEM_SURAH_NUMBERS.map(num => (
                  <Bar
                    key={num}
                    dataKey={`surah_${num}`}
                    name={SURAH_COLORS[num].name}
                    fill={SURAH_COLORS[num].fill}
                    stroke={SURAH_COLORS[num].stroke}
                    radius={[3, 3, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 2: Hexagonal Comparative Radar */}
      {activeChart === 'radar_multiaxis' && (
        <div className={`p-5 rounded-xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-md'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-500" />
                الرادار السداسي البنيوي لمقارنة سور الحواميم
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                مقارنة متعددة المحاور توازن بين طول الآيات، التنوع المعجمي، كثافة (ح) و (م)، وانتظام الفواصل.
              </p>
            </div>

            {/* Surah Toggle Selector for Radar Overlay */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-xs font-bold ml-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>تحديد السور:</span>
              {HAWAMEEM_SURAH_NUMBERS.map(num => {
                const isSelected = selectedRadarSurahs.includes(num);
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => toggleRadarSurah(num)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? (isLight ? 'bg-sky-100 border-sky-400 text-slate-950 shadow-2xs' : 'bg-sky-950/60 border-sky-500 text-slate-100 shadow-2xs')
                        : (isLight ? 'bg-slate-50 border-slate-300 text-slate-600 opacity-60 hover:opacity-100' : 'bg-slate-900 border-slate-800 text-slate-400 opacity-60 hover:opacity-100')
                    }`}
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: SURAH_COLORS[num].stroke }} 
                    />
                    {SURAH_COLORS[num].name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[440px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarChartData} outerRadius="62%">
                <PolarGrid stroke={isLight ? '#cbd5e1' : '#334155'} />
                <PolarAngleAxis 
                  dataKey="dimension" 
                  tick={renderHawameemRadarTick} 
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  stroke={isLight ? '#94a3b8' : '#64748b'} 
                  axisLine={false}
                  tick={{ fontSize: 9 }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const dimLabel = payload[0]?.payload?.dimension;
                    return (
                      <div className={`p-3 rounded-lg border text-xs shadow-xl min-w-[200px] ${
                        isLight ? 'bg-white/95 border-slate-200 text-slate-900' : 'bg-slate-900/95 border-slate-700 text-slate-100'
                      }`}>
                        <div className="font-bold border-b pb-1 mb-2 text-sky-500">
                          {dimLabel}
                        </div>
                        <div className="space-y-1">
                          {payload.map((entry: any) => {
                            const surahNum = Number(entry.dataKey.replace('surah_', ''));
                            if (!surahNum) return null;
                            const surah = HAWAMEEM_METADATA[surahNum];
                            const raw = entry.payload?.[`raw_${surahNum}`];
                            return (
                              <div key={entry.dataKey} className="flex items-center justify-between font-mono">
                                <span className="flex items-center gap-1.5 font-sans" style={{ color: entry.stroke }}>
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }} />
                                  {surah?.name}:
                                </span>
                                <span className="font-bold">
                                  {raw !== undefined ? Number(raw).toFixed(1) : ''} ({entry.value}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }}
                />

                {selectedRadarSurahs.map(num => (
                  <Radar
                    key={num}
                    name={SURAH_COLORS[num].name}
                    dataKey={`surah_${num}`}
                    stroke={SURAH_COLORS[num].stroke}
                    fill={SURAH_COLORS[num].fill}
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                ))}
                <Legend 
                  wrapperStyle={{ paddingTop: 10 }}
                  formatter={(value) => <span className="text-xs font-bold">{value}</span>}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 3: Sequential Trend (40 ➔ 46) */}
      {activeChart === 'sequential_trend' && (
        <div className={`p-5 rounded-xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-md'
        }`}>
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-500" />
              المسار البياني لتسلسل سور الحواميم (40 ➔ 46)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              تتبع المسار الإحصائي المتدرج من سورة غافر حتى سورة الأحقاف، ملاحظاً صعود نسبة (ح+م) التي تبلغ ذروتها في سورة الدخان (10.92%) والجاثية (10.84%).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sub-Chart A: Ha+Meem Progression */}
            <div className={`p-4 rounded-xl border ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  منحنى نسبة حرفي (ح + م) من إجمالي حروف السورة
                </span>
                <span className="text-[11px] font-mono text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                  المعدل: 9.67%
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sequentialData} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorHameem" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fontWeight: 'bold' }} 
                      stroke={isLight ? '#64748b' : '#94a3b8'} 
                    />
                    <YAxis 
                      domain={[7, 12]} 
                      unit="%" 
                      tick={{ fontSize: 11 }} 
                      stroke={isLight ? '#64748b' : '#94a3b8'} 
                    />
                    <Tooltip 
                      formatter={(val: any) => [`${val}%`, 'نسبة (ح + م)']}
                      labelFormatter={(label) => `سورة ${label}`}
                    />
                    <ReferenceLine y={report.quranGlobalHaPlusMeemPct} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: `معدل المصحف ${report.quranGlobalHaPlusMeemPct}%`, fill: '#94a3b8', fontSize: 10 }} />
                    <Area 
                      type="monotone" 
                      dataKey="haPlusMeemPct" 
                      name="نسبة (ح + م)" 
                      stroke="#d97706" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorHameem)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sub-Chart B: Verse Count & Avg Words */}
            <div className={`p-4 rounded-xl border ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  تعداد الآيات ومتوسط طول الآية بالكلمات
                </span>
                <span className="text-[11px] font-mono text-sky-500 font-bold bg-sky-500/10 px-2 py-0.5 rounded">
                  المجموع: {report.totalHawameemVerses} آية
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sequentialData} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fontWeight: 'bold' }} 
                      stroke={isLight ? '#64748b' : '#94a3b8'} 
                    />
                    <YAxis 
                      yAxisId="left" 
                      tick={{ fontSize: 11 }} 
                      stroke="#0284c7" 
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tick={{ fontSize: 11 }} 
                      stroke="#10b981" 
                    />
                    <Tooltip labelFormatter={(label) => `سورة ${label}`} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="totalAyahs" 
                      name="عدد الآيات" 
                      stroke="#0284c7" 
                      strokeWidth={2.5} 
                      dot={{ r: 4 }} 
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="avgAyahWords" 
                      name="معدل طول الآية (كلمة)" 
                      stroke="#10b981" 
                      strokeWidth={2.5} 
                      dot={{ r: 4 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHART 4: Rhyme Cadence and Endings */}
      {activeChart === 'rhyme_cadence' && (
        <div className={`p-5 rounded-xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-md'
        }`}>
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-500" />
              الوحدة الصوتية وقوافي فواصل الآي في الحواميم
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              إحصاء مقاطع الرَّوِيّ (أواخر الآيات)؛ كاشفاً الهيمنة شبه المطلقة لمقاطع النون والميم الساكنة المردوفة (ـون / ـين، ـوم / ـيم).
            </p>
          </div>

          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rhymeChartData}
                margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} />
                <XAxis 
                  dataKey="pattern" 
                  stroke={isLight ? '#64748b' : '#94a3b8'} 
                  tick={{ fontSize: 13, fontWeight: 'bold' }}
                />
                <YAxis 
                  stroke={isLight ? '#64748b' : '#94a3b8'}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${value} آية`,
                    name === 'total' ? 'مجموع الحواميم' : name
                  ]}
                />
                <Bar 
                  dataKey="total" 
                  name="مجموع الحواميم" 
                  fill="#0284c7" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
