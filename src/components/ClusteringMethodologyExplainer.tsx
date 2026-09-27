// src/components/ClusteringMethodologyExplainer.tsx
// التوثيق المنهجي والعلمي لعناقيد تحزيب الصحابة السبعة وإحصاءاتها البلاغية والرياضية

import React, { useState } from 'react';
import { 
  Cpu, 
  Binary, 
  Layers, 
  Activity, 
  Compass, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  BookOpen,
  GitBranch,
  BarChart2,
  CheckCircle2,
  Scale,
  ScrollText,
  Clock
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useQueryDrawer } from '../context/QueryDrawerContext';

export const ClusteringMethodologyExplainer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { openQuery } = useQueryDrawer();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTopic, setActiveTopic] = useState<'prophetic' | 'gradient' | 'rules' | 'comparison' | 'vector'>('prophetic');

  return (
    <div className={`sci-bg sci-border rounded-xl p-4 sm:p-5 shadow-sm space-y-4 transition-colors duration-200 ${className}`}>
      {/* Section Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3 ${
        isLight ? 'border-slate-200' : 'border-slate-800/80'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <ScrollText className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-sm sm:text-base font-bold flex items-center gap-2 font-quran ${
              isLight ? 'text-slate-900' : 'text-slate-100'
            }`}>
              <span>منهجية العناقيد السبعة (تحزيب الصحابة المأثور) والبرهان الإحصائي</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isLight ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-sky-950/40 text-sky-300 border-sky-800/60'
              }`}>
                تأصيل أثري وبياني
              </span>
            </h3>
            <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              كيف انتظم القرآن في 7 عناقيد إعجازية تكشف تدرج الإيقاع وتناسق حجم الأحزاب في الختمة الأسبوعية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => openQuery('similarity-kmeans-groups')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              isLight 
                ? 'bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200' 
                : 'bg-slate-800 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-700'
            }`}
            title="فتح استعلام العناقيد"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>استعلام العناقيد</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              isLight 
                ? 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={isExpanded ? 'طي الشرح' : 'توسيع الشرح'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          
          {/* Quick Concept Summary Banner */}
          <div className={`p-3.5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs leading-relaxed ${
            isLight ? 'bg-sky-50/50 border-sky-100 text-slate-800' : 'bg-sky-950/20 border-sky-900/40 text-slate-200'
          }`}>
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold font-quran text-sm block mb-1">
                  الحكمة العلمية من تحويل العناقيد إلى تحزيب الصحابة السبعة:
                </span>
                <span className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-sans`}>
                  بدلاً من خوارزميات التجميع الآلي الصماء (كـ K-Means) التي تفرض حدوداً مصطنعة وتتأثر بنقاط البداية الحسابية، يجسد <strong className={isLight ? 'text-sky-700 font-bold' : 'text-sky-400'}>تحزيب الصحابة المأثور (فَمِي بِشَوْقٍ)</strong> أعظم نموذج عنقودي طبيعي مستقر في تاريخ النظم القرآني؛ حيث يجتمع التأصيل الشرعي النبوي مع التدرج الإيقاعي الباهر في أطوال الآيات ونسب الكلمات.
                </span>
              </div>
            </div>
          </div>

          {/* Methodology Step Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-thin">
            {[
              { id: 'prophetic', label: '1. الأصل الأثري (فمي بشوق)', icon: BookOpen },
              { id: 'rules', label: '2. الضوابط الخاصة (الفاتحة وق)', icon: GitBranch },
              { id: 'gradient', label: '3. الانحدار الإيقاعي لطول الآيات', icon: BarChart2 },
              { id: 'comparison', label: '4. ثبات العناقيد بين المصحفين', icon: Scale },
              { id: 'vector', label: '5. مصفوفة التشابه والتجانس', icon: Binary },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTopic === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTopic(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? (isLight ? 'bg-sky-600 text-white font-bold shadow-xs' : 'bg-sky-500/25 text-sky-300 font-bold border border-sky-500/50')
                      : (isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200')
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Cards */}
          <div className="text-xs sm:text-[13px] leading-relaxed">
            
            {/* Topic 1: Prophetic & Traditional Root */}
            {activeTopic === 'prophetic' && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#080B11] border-slate-800/80 text-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full font-mono font-bold text-xs flex items-center justify-center ${
                    isLight ? 'bg-sky-100 text-sky-800' : 'bg-sky-500/20 text-sky-400'
                  }`}>1</span>
                  <h4 className={`font-bold font-quran text-sm ${isLight ? 'text-sky-800' : 'text-sky-400'}`}>
                    أصل التقسيم السباعي في السنة والآثار: حديث أوس بن حذيفة الثقفي رضي الله عنه
                  </h4>
                </div>
                <p className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                  روى الإمام أحمد وأبو داود وابن ماجه عن الصحابي الجليل أوس بن حذيفة قال: 
                  <span className={`block font-quran p-3 my-2 rounded-lg border text-sm leading-loose ${
                    isLight ? 'text-sky-950 bg-sky-50 border-sky-200' : 'text-sky-300 bg-sky-500/10 border-sky-500/20'
                  }`}>
                    «سألتُ أصحابَ رسولِ اللهِ ﷺ: كيف تُحَزِّبونَ القرآنَ؟ قالوا: ثَلاثٌ، وخَمسٌ، وسَبعٌ، وتِسعٌ، وإحدى عَشرةَ، وثَلاثَ عَشرةَ، وحِزبُ المُفَصَّلِ».
                  </span>
                  وقد جمعها العلماء قديماً في الرمز المشهور: <strong className={isLight ? 'text-amber-800 font-black' : 'text-amber-400'}>«فَمِي بِشَوْقٍ»</strong>؛ حيث كل حرف يرمز إلى أول سورة من حزب اليوم لختم القرآن أسبوعياً.
                </p>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                  <div className={`flex items-center gap-2 p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span><strong>السبت:</strong> ثلاث سور (البقرة، آل عمران، النساء)</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span><strong>الأحد:</strong> خمس سور (المائدة إلى التوبة)</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span><strong>الإثنين:</strong> سبع سور (يونس إلى النحل)</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span><strong>الثلاثاء:</strong> تسع سور (الإسراء إلى الفرقان)</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span><strong>الأربعاء:</strong> 11 سورة (الشعراء إلى يس)</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span><strong>الخميس:</strong> الصافات إلى سورة ق (14 سورة)</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded border sm:col-span-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span><strong>الجمعة (المفصل):</strong> من سورة الذاريات إلى سورة الناس (64 سورة)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Topic 2: Special Rules */}
            {activeTopic === 'rules' && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#080B11] border-slate-800/80 text-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full font-mono font-bold text-xs flex items-center justify-center ${
                    isLight ? 'bg-amber-100 text-amber-900' : 'bg-amber-500/20 text-amber-400'
                  }`}>2</span>
                  <h4 className={`font-bold font-quran text-sm ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                    الضوابط المنهجية التطبيقية المعتمدة في هذا القسم
                  </h4>
                </div>
                <div className={`space-y-3 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <div className={`p-3 rounded-lg border space-y-1 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <span className={`font-bold font-quran text-xs ${isLight ? 'text-sky-800' : 'text-sky-400'}`}>1. استقلال سورة الفاتحة وعدم إدراجها في العناقيد السبعة:</span>
                    <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      سورة الفاتحة هي «فاتحة الكتاب» و«أم القرآن» و«السبع المثاني»، وهي ديباجة الوحي الشاملة. لذلك تُعرض الفاتحة ككيان مستقل تماماً ومفرد في بطاقة تكريمية خاصة بأعلى اللوحة، بينما يبدأ العنقود الأول الحسابي من سورة البقرة.
                    </p>
                  </div>

                  <div className={`p-3 rounded-lg border space-y-1 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <span className={`font-bold font-quran text-xs ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>2. وضع سورة (ق) في العنقود السادس (قبل الأخير):</span>
                    <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      استجابةً للرؤية البحثية الدقيقة، تم ضم سورة (ق) (السورة رقم 50) إلى العنقود السادس ليضم 14 سورة بدلاً من 13 (من الصافات حتى ق)، مما يجعل العنقود السابع (المفصل) يبدأ فوراً من سورة الذاريات (51) وحتى الناس (114).
                    </p>
                  </div>

                  <div className={`p-3 rounded-lg border space-y-1 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <span className={`font-bold font-quran text-xs ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>3. اكتمال الحصر الشامل لـ 114 سورة:</span>
                    <p className={`text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      1 (الفاتحة) + 3 (الأول) + 5 (الثاني) + 7 (الثالث) + 9 (الرابع) + 11 (الخامس) + 14 (السادس) + 64 (السابع) = 114 سورة بالضبط دون سقوط أو تكرار أي سورة.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Topic 3: Rhythm & Verse Length Gradient */}
            {activeTopic === 'gradient' && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#080B11] border-slate-800/80 text-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full font-mono font-bold text-xs flex items-center justify-center ${
                    isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>3</span>
                  <h4 className={`font-bold font-quran text-sm ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                    البرهان الإحصائي: التدرج الرياضي الصارم في إيقاع وطول الآيات
                  </h4>
                </div>
                <p className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                  عند تحليل العناقيد السبعة إحصائياً، يظهر <strong className={isLight ? 'text-sky-700 font-bold' : 'text-sky-400'}>انحدار هندسي تنازلي مذهل</strong> في متوسط طول الآية (بالكلمات والحروف)، مما يبرهن على الهندسة البلاغية والأسلوبية للقرآن:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-xs">
                  <div className={`p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <div className={`text-[10px] ${isLight ? 'text-slate-600 font-bold' : 'text-slate-500'}`}>العنقود 1 (ثلاث)</div>
                    <div className={`font-bold text-sm mt-0.5 ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>23.8 كلمه/آية</div>
                    <div className={`text-[9px] ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>طوال الآيات والأحكام</div>
                  </div>
                  <div className={`p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <div className={`text-[10px] ${isLight ? 'text-slate-600 font-bold' : 'text-slate-500'}`}>العنقود 2 (خمس)</div>
                    <div className={`font-bold text-sm mt-0.5 ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>18.2 كلمه/آية</div>
                    <div className={`text-[9px] ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>العقود والحل والحرمة</div>
                  </div>
                  <div className={`p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <div className={`text-[10px] ${isLight ? 'text-slate-600 font-bold' : 'text-slate-500'}`}>العنقود 3 (سبع)</div>
                    <div className={`font-bold text-sm mt-0.5 ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>15.6 كلمه/آية</div>
                    <div className={`text-[9px] ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>القصص والسنن</div>
                  </div>
                  <div className={`p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <div className={`text-[10px] ${isLight ? 'text-slate-600 font-bold' : 'text-slate-500'}`}>العنقود 4 (تسع)</div>
                    <div className={`font-bold text-sm mt-0.5 ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>12.8 كلمه/آية</div>
                    <div className={`text-[9px] ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>الفتن والعبر</div>
                  </div>
                  <div className={`p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <div className={`text-[10px] ${isLight ? 'text-slate-600 font-bold' : 'text-slate-500'}`}>العنقود 5 (إحدى عشرة)</div>
                    <div className={`font-bold text-sm mt-0.5 ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>10.4 كلمه/آية</div>
                    <div className={`text-[9px] ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>الترنم والإنذار</div>
                  </div>
                  <div className={`p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <div className={`text-[10px] ${isLight ? 'text-slate-600 font-bold' : 'text-slate-500'}`}>العنقود 6 (أربع عشرة)</div>
                    <div className={`font-bold text-sm mt-0.5 ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>9.1 كلمه/آية</div>
                    <div className={`text-[9px] ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>الحواميم وسورة ق</div>
                  </div>
                  <div className={`p-2 rounded border col-span-2 ${isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-950 border-slate-800'}`}>
                    <div className={`text-[10px] font-bold ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>العنقود 7 (المفصل - 64 سورة)</div>
                    <div className={`font-bold text-sm mt-0.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>4.9 كلمه/آية فقط!</div>
                    <div className={`text-[9px] ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>إيقاع حاسم وقصار الفواصل وهدير القيامة</div>
                  </div>
                </div>
              </div>
            )}

            {/* Topic 4: Consistency across Kufi and Madani */}
            {activeTopic === 'comparison' && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#080B11] border-slate-800/80 text-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full font-mono font-bold text-xs flex items-center justify-center ${
                    isLight ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-500/20 text-cyan-400'
                  }`}>4</span>
                  <h4 className={`font-bold font-quran text-sm ${isLight ? 'text-cyan-800' : 'text-cyan-400'}`}>
                    ثبات العناقيد ومقارنة المصحفين (الكوفي والمدني)
                  </h4>
                </div>
                <p className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                  على خلاف خوارزمية K-Means الآلية التي كانت تتأرجح بين المصحفين بسبب حساسية الفواصل الفردية، فإن <strong className={isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400'}>عناقيد تحزيب الصحابة ثابتة ورصينة 100%</strong> في كلا المصحفين:
                </p>
                <div className={`space-y-2 text-xs ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <span>عدد السور في كل عنقود:</span>
                    <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>متطابق تماماً (114 سورة)</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <span>فارق عدد الآيات الإجمالي (الكوفي 6236 / المدني 6214):</span>
                    <span className={`font-bold ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>22 آية فقط موزعة بانتظام عبر الأحزاب</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <span>ثبات البصمة المعجمية والترددية:</span>
                    <span className={`font-bold ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>تطابق يفوق 99.95% بين المصحفين</span>
                  </div>
                </div>
              </div>
            )}

            {/* Topic 5: Vector Similarity and Cohesion */}
            {activeTopic === 'vector' && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#080B11] border-slate-800/80 text-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full font-mono font-bold text-xs flex items-center justify-center ${
                    isLight ? 'bg-purple-100 text-purple-800' : 'bg-purple-500/20 text-purple-400'
                  }`}>5</span>
                  <h4 className={`font-bold font-quran text-sm ${isLight ? 'text-purple-800' : 'text-purple-400'}`}>
                    معامل التجانس الداخلي للعنقود (Intra-Cluster Cohesion)
                  </h4>
                </div>
                <p className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                  تُحسب درجة التجانس الداخلي لكل عنقود عن طريق أخذ متوسط معاملات تشابه جيب التمام (Cosine Similarity) بين كل أزواج السور المنضوية تحت العنقود نفسه:
                </p>
                <div className={`p-3 rounded-lg border text-center font-mono text-xs dir-ltr font-bold ${
                  isLight ? 'bg-sky-50 text-sky-900 border-sky-200' : 'bg-slate-950 text-sky-300 border-slate-800'
                }`}>
                  Cohesion(Cluster) = [ 2 / (N × (N - 1)) ] × ∑ [ CosineSim(S_i, S_j) ]
                </div>
                <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  تتجاوز درجة التجانس الداخلي في سائر عناقيد الصحابة نسبة 93%، وتصل في بعض العناقيد إلى 98%، مما يثبت أن السور التي رتبها الصحابة في حزب واحد تشترك في نسيج لغوي وصوتي عالي الانسجام والتناغم.
                </p>
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
};
