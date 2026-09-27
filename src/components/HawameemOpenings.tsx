import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Quote, 
  Network, 
  Check, 
  Info, 
  Compass, 
  Layers,
  ChevronLeft
} from 'lucide-react';
import { SurahData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { formatSurahName } from '../utils/arabic';
import { 
  HawameemAggregateReport, 
  HAWAMEEM_METADATA, 
  HAWAMEEM_TRADITIONS, 
  HAWAMEEM_SURAH_NUMBERS 
} from '../utils/hawameemData';

interface HawameemOpeningsProps {
  report: HawameemAggregateReport;
  onOpenInReader?: (surahNumber: number) => void;
  onSelectSurah?: (surah: SurahData) => void;
}

export const HawameemOpenings: React.FC<HawameemOpeningsProps> = ({
  report,
  onOpenInReader,
  onSelectSurah
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [selectedPair, setSelectedPair] = useState<{ surahA: number; surahB: number } | null>(null);

  // Helper to get similarity between any two surahs
  const getSimilarity = (numA: number, numB: number): number => {
    if (numA === numB) return 100;
    const found = report.similarityMatrix7x7.find(
      x => (x.surahA === numA && x.surahB === numB) || (x.surahA === numB && x.surahB === numA)
    );
    return found ? found.similarity : 95.0;
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: The 7 Openings & Tanzil Verses */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            فواتح الحواميم السبع والاقتران المعجز بقضية «تنزيل الكتاب»
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ظاهرة لافتة لا تتكرر بهذا التتابع في القرآن: كل سورة من الحواميم تفتتح بـ ﴿حم﴾ ويعقبها فوراً ذكر الوحي ونزول القرآن الكريم والصفات الإلهية العلية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HAWAMEEM_SURAH_NUMBERS.map(surahNum => {
            const meta = HAWAMEEM_METADATA[surahNum];
            const surah = report.surahs.find(s => s.number === surahNum);
            const lStat = report.hawameemLettersStats.find(s => s.surahNumber === surahNum);

            return (
              <div 
                key={surahNum}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:shadow-md ${
                  isLight 
                    ? 'bg-white border-slate-200 hover:border-sky-400' 
                    : 'sci-bg sci-border hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Surah Header Pill */}
                  <div className="flex items-center justify-between border-b pb-2 mb-3 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center border ${
                        isLight ? 'bg-sky-100 text-sky-950 border-sky-300' : 'bg-sky-950/60 text-sky-300 border-sky-800'
                      }`}>
                        {surahNum}
                      </span>
                      <div>
                        <h4 className={`font-quran text-base font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>
                          سورة {meta.name}
                        </h4>
                        <span className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {meta.historicalNames.join(' • ')}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      isLight ? 'bg-amber-100 text-amber-950 border-amber-300' : 'bg-amber-950/60 text-amber-300 border-amber-800'
                    }`}>
                      ح+م: {lStat?.haPlusMeemPercentage}%
                    </span>
                  </div>

                  {/* Opening Quranic Text */}
                  <div className={`p-3 rounded-lg border mb-3 text-center ${
                    isLight ? 'bg-amber-50/80 border-amber-300' : 'bg-amber-950/20 border-amber-800/40'
                  }`}>
                    <div className={`font-quran text-2xl font-bold mb-1.5 leading-relaxed ${
                      isLight ? 'text-amber-950' : 'text-amber-400'
                    }`}>
                      {meta.openingUthmani}
                    </div>
                    <div className={`font-quran text-sm leading-loose ${isLight ? 'text-slate-950' : 'text-slate-200'}`}>
                      {meta.followingVerseUthmani}
                    </div>
                  </div>

                  {/* Divine Attributes Highlight */}
                  <div className="text-xs space-y-1.5 mb-3">
                    <div className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                      الصفات الإلهية المقترنة بالتنزيل:
                    </div>
                    <div className={`px-2.5 py-1 rounded font-medium text-[11px] border ${
                      isLight ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-200'
                    }`}>
                      {meta.divineAttributesInOpening}
                    </div>
                  </div>

                  {/* Thematic Summary */}
                  <div className={`text-xs line-clamp-3 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                    {meta.thematicSummary}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  {onOpenInReader && (
                    <button
                      type="button"
                      onClick={() => onOpenInReader(surahNum)}
                      className={`hover:underline flex items-center gap-1 font-bold cursor-pointer ${
                        isLight ? 'text-sky-800 hover:text-sky-950' : 'text-sky-400 hover:text-sky-300'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      تلاوة السورة
                    </button>
                  )}
                  {onSelectSurah && surah && (
                    <button
                      type="button"
                      onClick={() => onSelectSurah(surah)}
                      className={`flex items-center gap-0.5 cursor-pointer font-semibold ${
                        isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      تحليل البصمة
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Inter-Hawameem Cosine Similarity Matrix (7x7) */}
      <div className={`p-5 rounded-xl border transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'sci-bg sci-border shadow-md'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Network className="w-5 h-5 text-sky-500" />
              مصفوفة التشابه الحرفي والأسلوبي البيني (7×7)
            </h3>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              معامل التشابه التوافقي (Cosine Similarity) القائم على متجهات التوزيع النسبي للـ 28 حرفاً بين كل زوجين من سور الحواميم.
            </p>
          </div>
          <span className={`text-xs font-mono px-2.5 py-1 rounded font-bold border ${
            isLight ? 'bg-sky-100 text-sky-950 border-sky-300' : 'bg-sky-950/60 text-sky-300 border-sky-800'
          }`}>
            أدنى تشابه بينها: &gt; 96.5% (تجانس أسلوبي مذهل)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse min-w-[600px]">
            <thead>
              <tr className={`border-b text-xs font-bold ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}>
                <th className="px-3 py-2 text-right">السورة</th>
                {HAWAMEEM_SURAH_NUMBERS.map(num => (
                  <th key={num} className="px-3 py-2">
                    <div className="font-quran text-sm">{HAWAMEEM_METADATA[num]?.name}</div>
                    <div className={`text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>({num})</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-mono">
              {HAWAMEEM_SURAH_NUMBERS.map(numA => (
                <tr key={numA} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className={`px-3 py-2 text-right font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                    <span className="font-quran text-sm">{HAWAMEEM_METADATA[numA]?.name}</span>
                    <span className={`text-[10px] mr-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>({numA})</span>
                  </td>

                  {HAWAMEEM_SURAH_NUMBERS.map(numB => {
                    const sim = getSimilarity(numA, numB);
                    const isIdentical = numA === numB;
                    const isHovered = selectedPair && 
                      ((selectedPair.surahA === numA && selectedPair.surahB === numB) || 
                       (selectedPair.surahA === numB && selectedPair.surahB === numA));

                    // Heatmap color intensity based on similarity 95-100%
                    const ratio = Math.max(0, Math.min(1, (sim - 95) / 5));
                    const bgColor = isIdentical 
                      ? (isLight ? '#cbd5e1' : '#334155') 
                      : (isLight 
                          ? `rgba(14, 165, 233, ${0.15 + ratio * 0.5})` 
                          : `rgba(56, 189, 248, ${0.15 + ratio * 0.55})`);

                    return (
                      <td 
                        key={numB}
                        onMouseEnter={() => setSelectedPair({ surahA: numA, surahB: numB })}
                        onMouseLeave={() => setSelectedPair(null)}
                        className={`p-1.5 transition-all cursor-pointer ${
                          isHovered ? 'ring-2 ring-sky-500 z-10' : ''
                        }`}
                      >
                        <div 
                          style={{ backgroundColor: bgColor }}
                          className={`py-2 px-1 rounded font-bold text-xs ${
                            isIdentical 
                              ? (isLight ? 'text-slate-700' : 'text-slate-400') 
                              : (isLight ? 'text-sky-950' : 'text-sky-100')
                          }`}
                        >
                          {sim.toFixed(1)}%
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedPair && selectedPair.surahA !== selectedPair.surahB && (
          <div className={`mt-4 p-3 rounded-lg border text-xs flex items-center justify-between ${
            isLight ? 'bg-sky-100/70 border-sky-300 text-sky-950' : 'bg-sky-950/40 border-sky-800 text-sky-300'
          }`}>
            <div>
              التشابه الحرفي بين <strong>سورة {HAWAMEEM_METADATA[selectedPair.surahA]?.name}</strong> و <strong>سورة {HAWAMEEM_METADATA[selectedPair.surahB]?.name}</strong>:
              {' '}<strong className="font-mono text-sm">{getSimilarity(selectedPair.surahA, selectedPair.surahB).toFixed(2)}%</strong>
            </div>
            <span className={`text-[11px] ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
              تطابق هيكلي ونسبي متين في البنية الصرفية والحرفية
            </span>
          </div>
        )}
      </div>

      {/* SECTION 3: Athar and Traditional Traditions on Hawameem */}
      <div className={`p-5 rounded-xl border transition-colors ${
        isLight ? 'bg-slate-50 border-slate-200' : 'sci-bg sci-border'
      }`}>
        <h3 className={`text-base font-bold flex items-center gap-2 mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          <Quote className="w-5 h-5 text-amber-500" />
          من لطائف الآثار النبوية ومأثور الصحابة في فضل «آل حـم»
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HAWAMEEM_TRADITIONS.map((item, idx) => (
            <div 
              key={idx}
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-900 border-slate-800 shadow-2xs'
              }`}
            >
              <p className={`font-quran text-base font-bold leading-relaxed mb-3 ${
                isLight ? 'text-slate-950' : 'text-slate-100'
              }`}>
                {item.quote}
              </p>
              <div className={`text-xs border-t pt-2 ${
                isLight ? 'text-slate-700 border-slate-200' : 'text-slate-400 border-slate-800'
              }`}>
                {item.source}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
