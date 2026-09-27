import React from 'react';
import { 
  Table, 
  BookOpen, 
  Eye, 
  GitCompare, 
  TrendingUp, 
  Check, 
  Info,
  Scale
} from 'lucide-react';
import { SurahData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { formatSurahName } from '../utils/arabic';
import { 
  HawameemAggregateReport, 
  HAWAMEEM_METADATA 
} from '../utils/hawameemData';

interface HawameemMatrixProps {
  report: HawameemAggregateReport;
  activeMushaf: 'kufi' | 'madani';
  onSelectSurah?: (surah: SurahData) => void;
  onOpenInReader?: (surahNumber: number) => void;
  onCompareWith?: (surahNumber: number) => void;
}

export const HawameemMatrix: React.FC<HawameemMatrixProps> = ({
  report,
  activeMushaf,
  onSelectSurah,
  onOpenInReader,
  onCompareWith
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'sci-bg sci-border shadow-md'
      }`}>
        <div>
          <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Table className="w-5 h-5 text-sky-500" />
            المصفوفة الإحصائية المقارنة الشاملة لسور الحواميم السبع
          </h3>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            جدول قياسي مفصل يقارن السور السبع في 12 بعداً إحصائياً دقيقاً، مع إبراز فوارق العد بين المصحفين الكوفي والمدني.
          </p>
        </div>

        <div className={`flex items-center gap-2 text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
          <Scale className="w-4 h-4 text-sky-500" />
          المصحف النشط:
          <span className={`px-2 py-0.5 rounded border ${
            isLight ? 'bg-sky-100 text-sky-950 border-sky-300 font-bold' : 'bg-sky-950/60 text-sky-300 border-sky-800 font-bold'
          }`}>
            {activeMushaf === 'madani' ? 'المدني (ورش)' : 'الكوفي (حفص)'}
          </span>
        </div>
      </div>

      <div className={`rounded-xl border overflow-hidden shadow-xs transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'sci-bg sci-border'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[1000px]">
            <thead>
              <tr className={`border-b text-xs font-bold ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}>
                <th className="px-4 py-3 text-center w-12">#</th>
                <th className="px-4 py-3">السورة والاسم المشهور</th>
                <th className="px-3 py-3 text-center">ترتيب النزول</th>
                <th className="px-3 py-3 text-center">الآيات</th>
                <th className="px-3 py-3 text-center">الكلمات</th>
                <th className="px-3 py-3 text-center">الحروف</th>
                <th className="px-3 py-3 text-center">التنوع المعجمي</th>
                <th className="px-3 py-3 text-center">طول الآية (كلمة)</th>
                <th className={`px-3 py-3 text-center ${isLight ? 'bg-emerald-100/60 text-emerald-950' : 'bg-emerald-950/40 text-emerald-300'}`}>
                  حرف (ح)
                </th>
                <th className={`px-3 py-3 text-center ${isLight ? 'bg-amber-100/60 text-amber-950' : 'bg-amber-950/40 text-amber-300'}`}>
                  حرف (م)
                </th>
                <th className={`px-3 py-3 text-center ${isLight ? 'bg-sky-100/60 text-sky-950' : 'bg-sky-950/40 text-sky-300'}`}>
                  مجموع (ح+م)
                </th>
                <th className="px-3 py-3 text-center">القافية الغالبة</th>
                <th className="px-4 py-3 text-center">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {report.surahs.map(surah => {
                const meta = HAWAMEEM_METADATA[surah.number];
                const lStat = report.hawameemLettersStats.find(s => s.surahNumber === surah.number);
                const topRhyme = surah.ayahs?.verseEndings?.[0];

                return (
                  <tr 
                    key={surah.number}
                    className={`transition-colors ${
                      isLight ? 'hover:bg-slate-50/90' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Index */}
                    <td className={`px-4 py-3 text-center font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                      {surah.number}
                    </td>

                    {/* Surah Name & Metadata */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-quran text-base font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>
                          {formatSurahName(surah.name)}
                        </span>
                        {meta?.historicalNames[0] && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}>
                            {meta.historicalNames[0]}
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        الجزء: {meta?.juz.join('، ')} • مكية
                      </div>
                    </td>

                    {/* Revelation Order */}
                    <td className={`px-3 py-3 text-center font-mono ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                      {meta?.revelationOrder}
                    </td>

                    {/* Verses Count */}
                    <td className={`px-3 py-3 text-center font-mono font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                      {surah.totalAyahs}
                    </td>

                    {/* Words Count */}
                    <td className={`px-3 py-3 text-center font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {surah.totalWords.toLocaleString()}
                    </td>

                    {/* Chars Count */}
                    <td className={`px-3 py-3 text-center font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {surah.totalChars.toLocaleString()}
                    </td>

                    {/* Vocabulary Diversity */}
                    <td className={`px-3 py-3 text-center font-mono font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {surah.vocabularyDiversity.toFixed(1)}%
                    </td>

                    {/* Average Verse Length in words */}
                    <td className={`px-3 py-3 text-center font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {surah.avgAyahLengthWords.toFixed(1)}
                    </td>

                    {/* Ha Count & Pct */}
                    <td className={`px-3 py-3 text-center font-mono font-bold ${
                      isLight ? 'bg-emerald-50 text-emerald-950' : 'bg-emerald-950/20 text-emerald-300'
                    }`}>
                      <div>{lStat?.haCount}</div>
                      <div className="text-[10px] opacity-80">{lStat?.haPercentage}%</div>
                    </td>

                    {/* Meem Count & Pct */}
                    <td className={`px-3 py-3 text-center font-mono font-bold ${
                      isLight ? 'bg-amber-50 text-amber-950' : 'bg-amber-950/20 text-amber-300'
                    }`}>
                      <div>{lStat?.meemCount}</div>
                      <div className="text-[10px] opacity-80">{lStat?.meemPercentage}%</div>
                    </td>

                    {/* Ha+Meem Total & Pct */}
                    <td className={`px-3 py-3 text-center font-mono font-extrabold ${
                      isLight ? 'bg-sky-50 text-sky-950' : 'bg-sky-950/20 text-sky-300'
                    }`}>
                      <div>{lStat?.haPlusMeemCount}</div>
                      <div className="text-[10px] opacity-85">{lStat?.haPlusMeemPercentage}%</div>
                    </td>

                    {/* Dominant Rhyme */}
                    <td className="px-3 py-3 text-center">
                      {topRhyme ? (
                        <span className={`font-mono text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {topRhyme.pattern} ({topRhyme.percentage}%)
                        </span>
                      ) : '-'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onOpenInReader && (
                          <button
                            type="button"
                            onClick={() => onOpenInReader(surah.number)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isLight 
                                ? 'border-slate-300 text-slate-700 hover:text-sky-600 hover:border-sky-500 hover:bg-sky-50' 
                                : 'border-slate-700 text-slate-400 hover:text-sky-400 hover:border-sky-500 hover:bg-slate-800'
                            }`}
                            title="قراءة في المصحف"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onSelectSurah && (
                          <button
                            type="button"
                            onClick={() => onSelectSurah(surah)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isLight 
                                ? 'border-slate-300 text-slate-700 hover:text-sky-600 hover:border-sky-500 hover:bg-sky-50' 
                                : 'border-slate-700 text-slate-400 hover:text-sky-400 hover:border-sky-500 hover:bg-slate-800'
                            }`}
                            title="التحليل المفصل"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onCompareWith && (
                          <button
                            type="button"
                            onClick={() => onCompareWith(surah.number)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isLight 
                                ? 'border-slate-300 text-slate-700 hover:text-sky-600 hover:border-sky-500 hover:bg-sky-50' 
                                : 'border-slate-700 text-slate-400 hover:text-sky-400 hover:border-sky-500 hover:bg-slate-800'
                            }`}
                            title="مقارنة في معمل السور"
                          >
                            <GitCompare className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total Footer */}
            <tfoot>
              <tr className={`border-t-2 font-bold text-xs ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-950' : 'bg-slate-950 border-slate-700 text-white'
              }`}>
                <td colSpan={3} className="px-4 py-3 text-right font-extrabold">
                  مجموع الحواميم السبع (آل حـم)
                </td>
                <td className={`px-3 py-3 text-center font-mono font-extrabold ${isLight ? 'text-sky-950' : 'text-sky-300'}`}>
                  {report.totalHawameemVerses}
                </td>
                <td className="px-3 py-3 text-center font-mono">
                  {report.totalHawameemWords.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-center font-mono">
                  {report.totalHawameemLetters.toLocaleString()}
                </td>
                <td className={`px-3 py-3 text-center font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  -
                </td>
                <td className={`px-3 py-3 text-center font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  -
                </td>
                <td className={`px-3 py-3 text-center font-mono font-extrabold ${
                  isLight ? 'text-emerald-950 bg-emerald-100/70' : 'text-emerald-300 bg-emerald-950/40'
                }`}>
                  <div>{report.totalHawameemHa}</div>
                  <div className="text-[10px]">{report.avgHawameemHaPct}%</div>
                </td>
                <td className={`px-3 py-3 text-center font-mono font-extrabold ${
                  isLight ? 'text-amber-950 bg-amber-100/70' : 'text-amber-300 bg-amber-950/40'
                }`}>
                  <div>{report.totalHawameemMeem}</div>
                  <div className="text-[10px]">{report.avgHawameemMeemPct}%</div>
                </td>
                <td className={`px-3 py-3 text-center font-mono font-black ${
                  isLight ? 'text-sky-950 bg-sky-100/70' : 'text-sky-300 bg-sky-950/40'
                }`}>
                  <div>{report.totalHawameemHaPlusMeem}</div>
                  <div className="text-[10px]">{report.avgHawameemHaPlusMeemPct}%</div>
                </td>
                <td colSpan={2} className={`px-3 py-3 text-center font-normal ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                  سلسلة متصلة من سورة 40 حتى 46
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
