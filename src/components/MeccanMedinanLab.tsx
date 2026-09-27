import React from 'react';
import { 
  BarChart3, 
  Sparkles, 
  Layers, 
  BookOpen, 
  Activity, 
  Type, 
  TrendingUp,
  Percent
} from 'lucide-react';
import { MacroStatsData, LetterStatsData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { SectionHelpButton } from './SectionHelpModal';
import { MathTooltip } from './MathTooltip';
import { ChartMidpointMarker } from './ChartMidpointMarker';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell 
} from 'recharts';

interface MeccanMedinanLabProps {
  macroStats: MacroStatsData;
  letterStats: LetterStatsData;
}

const MeccanMedinanLabComponent: React.FC<MeccanMedinanLabProps> = ({
  macroStats,
  letterStats
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { meccan, medinan } = macroStats;

  // Prepare letter difference comparison data
  const lettersComparisonData = letterStats.letters.map(letter => {
    const pMec = meccan.letterPercentages[letter] || 0;
    const pMed = medinan.letterPercentages[letter] || 0;
    const diff = Number((pMec - pMed).toFixed(2));
    return {
      letter,
      name: letterStats.letterNames[letter],
      'القرآن المكي': pMec,
      'القرآن المدني': pMed,
      diff
    };
  });

  const macroMetrics = [
    {
      title: 'عدد السور',
      meccanVal: `${meccan.surahsCount} سورة`,
      medinanVal: `${medinan.surahsCount} سورة`,
      desc: '75.4٪ من سور المصحف مكية'
    },
    {
      title: 'إجمالي الآيات',
      meccanVal: `${meccan.totalVerses.toLocaleString('en-US')} آية`,
      medinanVal: `${medinan.totalVerses.toLocaleString('en-US')} آية`,
      desc: 'متوسط عدد الآيات بالسورة المكية 55 مقابل 52 للمدنية'
    },
    {
      title: 'إجمالي الكلمات',
      meccanVal: meccan.totalWords.toLocaleString('en-US'),
      medinanVal: medinan.totalWords.toLocaleString('en-US'),
      desc: 'المفردات المنطوقة والمكتوبة'
    },
    {
      title: 'متوسط طول الآية (بالكلمات)',
      metricId: 'avgAyahLengthWords',
      meccanVal: `${meccan.avgAyahLengthWords} كلمة`,
      medinanVal: `${medinan.avgAyahLengthWords} كلمة`,
      desc: 'الآيات المدنية أطول بمرتين ونصف في المتوسط من المكية!'
    },
    {
      title: 'متوسط طول الآية (بالحروف)',
      metricId: 'avgWordLength',
      meccanVal: `${meccan.avgAyahLengthChars} حرف`,
      medinanVal: `${medinan.avgAyahLengthChars} حرف`,
      desc: 'الكثافة الحرفية لكل آية'
    },
    {
      title: 'مؤشر تنوع المفردات (TTR)',
      metricId: 'ttr',
      meccanVal: `${meccan.avgVocabDiversity}%`,
      medinanVal: `${medinan.avgVocabDiversity}%`,
      desc: 'نسبة الكلمات الفريدة إلى إجمالي الكلمات'
    },
  ];

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="sci-bg sci-border p-3 sm:p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-slate-800 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold font-quran text-slate-100 flex items-center gap-2">
              <span>المختبر الإحصائي الكلي: المقارنة بين المكي والمدني</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              تحليل رياضي ومقارنة إحصائية جماعية بين الـ 86 سورة مكية والـ 28 سورة مدنية
            </p>
          </div>
        </div>

        <SectionHelpButton 
          guideId="meccan-medinan" 
          variant="icon" 
          title="استعلام: شرح المختبر الإحصائي للمكي والمدني والمنهجية الرياضية" 
        />
      </div>

      {/* Macro Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {macroMetrics.map((item, idx) => (
          <div key={idx} className="sci-bg sci-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              {item.metricId ? (
                <MathTooltip metricId={item.metricId} showUnderline={true}>
                  <h3 className="text-[11px] font-mono text-sky-400 uppercase tracking-wider">{item.title}</h3>
                </MathTooltip>
              ) : (
                <h3 className="text-[11px] font-mono text-sky-400 uppercase tracking-wider">{item.title}</h3>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-center pt-1 border-t border-slate-800/80 font-mono">
              <div className="p-2 rounded bg-[#0A0D12] border border-sky-500/30">
                <div className="text-[10px] text-sky-400 font-semibold mb-0.5">المكي (86)</div>
                {item.metricId ? (
                  <MathTooltip metricId={item.metricId} value={item.meccanVal} showUnderline={false}>
                    <div className="font-bold text-sky-300 text-xs">{item.meccanVal}</div>
                  </MathTooltip>
                ) : (
                  <div className="font-bold text-sky-300 text-xs">{item.meccanVal}</div>
                )}
              </div>
              
              <div className="p-2 rounded bg-[#0A0D12] border border-cyan-500/30">
                <div className="text-[10px] text-cyan-400 font-semibold mb-0.5">المدني (28)</div>
                {item.metricId ? (
                  <MathTooltip metricId={item.metricId} value={item.medinanVal} showUnderline={false}>
                    <div className="font-bold text-cyan-300 text-xs">{item.medinanVal}</div>
                  </MathTooltip>
                ) : (
                  <div className="font-bold text-cyan-300 text-xs">{item.medinanVal}</div>
                )}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center font-mono">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Rhyme & Ending Structure Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Meccan Rhymes */}
        <div className="sci-bg sci-border rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>
              <h3 className="font-bold text-slate-100 text-xs font-mono">
                القوافي وفواصل الآيات في القرآن المكي
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">تنوع صوتي وإيقاعي غني</span>
          </div>

          <div className="space-y-1.5 font-mono">
            {(meccan.topRhymes || []).map((r, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-[#0A0D12] border border-slate-800 text-xs">
                <span className="font-quran font-bold text-sm text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {r.pattern}
                </span>
                <span className="text-slate-300 text-[11px]">
                  {r.count.toLocaleString('en-US')} آية ({r.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Medinan Rhymes */}
        <div className="sci-bg sci-border rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
              <h3 className="font-bold text-slate-100 text-xs font-mono">
                القوافي وفواصل الآيات في القرآن المدني
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">هيمنة لفاصلة «ـون / ـين»</span>
          </div>

          <div className="space-y-1.5 font-mono">
            {(medinan.topRhymes || []).map((r, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-[#0A0D12] border border-slate-800 text-xs">
                <span className="font-quran font-bold text-sm text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {r.pattern}
                </span>
                <span className="text-slate-300 text-[11px]">
                  {r.count.toLocaleString('en-US')} آية ({r.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 28 Letters Distribution: Meccan vs Medinan */}
      <div className="sci-bg sci-border rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              مقارنة تردد الحروف الـ 28: المكي مقابل المدني
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              متوسط النسبة المئوية لتكرار كل حرف في المجموعة المكية مقابل المجموعة المدنية
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-sky-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block"></span>
              <span>المكي</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block"></span>
              <span>المدني</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lettersComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis 
                dataKey="letter" 
                stroke={isLight ? '#94A3B8' : '#475569'} 
                fontSize={11} 
                tick={{ fill: isLight ? '#0F172A' : '#94a3b8', fontFamily: 'Amiri', fontSize: 13, fontWeight: 'bold' }} 
              />
              <YAxis stroke={isLight ? '#94A3B8' : '#475569'} fontSize={10} tickFormatter={(v) => `${v}%`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isLight ? '#FFFFFF' : '#0F172A', 
                  borderColor: isLight ? '#CBD5E1' : '#334155', 
                  borderRadius: '8px', 
                  color: isLight ? '#0F172A' : '#f8fafc',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  direction: 'rtl',
                  boxShadow: isLight ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                }}
                formatter={(val: any, name: any) => [`${val}%`, name]}
              />
              <Bar dataKey="القرآن المكي" fill="#38bdf8" radius={[2, 2, 0, 0]} />
              <Bar dataKey="القرآن المدني" fill="#22d3ee" radius={[2, 2, 0, 0]} />
              {lettersComparisonData.length > 0 && (
                <ChartMidpointMarker 
                  y={Number((Math.max(...lettersComparisonData.map(d => Math.max(Number(d['القرآن المكي']) || 0, Number(d['القرآن المدني']) || 0)), 1) / 2).toFixed(1))}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export const MeccanMedinanLab = React.memo(MeccanMedinanLabComponent);
