import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen,
  Compass, 
  Layers, 
  GitCompare, 
  Share2, 
  Network, 
  Sparkles, 
  Database, 
  BarChart3,
  Flame,
  Info,
  Sun,
  Moon,
  Scale,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Table,
  Music,
  Brain,
  HelpCircle,
  SlidersHorizontal
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { useQueryDrawer } from '../context/QueryDrawerContext';

export type NavCategory = 'all' | 'quran' | 'letters' | 'linguistics' | 'similarity' | 'mushaf';

interface TabDefinition {
  id: ActiveTab;
  label: string;
  category: NavCategory;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  totalSurahs: number;
  totalAyahs: number;
  totalWords: number;
  selectedSurahName?: string;
  onBackFromAnalysis?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalSurahs,
  totalAyahs,
  totalWords,
  selectedSurahName,
  onBackFromAnalysis
}) => {
  const { theme, toggleTheme } = useTheme();
  const { 
    activeMushaf, 
    setActiveMushaf
  } = useQuranCorpus();
  const { openQuery } = useQueryDrawer();

  const isInsideAnalysis = Boolean(selectedSurahName);
  const [selectedCategory, setSelectedCategory] = useState<NavCategory>('all');

  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const tabsNavRef = useRef<HTMLElement | null>(null);

  // Enable mouse wheel horizontal scrolling over navigation tabs
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const nav = tabsNavRef.current;
      const container = tabsContainerRef.current;

      const target = (nav && nav.scrollWidth > nav.clientWidth) ? nav :
                     (container && container.scrollWidth > container.clientWidth) ? container : (nav || container);

      if (!target) return;

      // Only intercept vertical wheel if container has horizontal overflow
      if (target.scrollWidth > target.clientWidth && e.deltaY !== 0) {
        e.preventDefault();
        const isRTL = document.documentElement.dir === 'rtl' || getComputedStyle(target).direction === 'rtl';
        const delta = isRTL ? -e.deltaY : e.deltaY;
        target.scrollBy({ left: delta, behavior: 'auto' });
      }
    };

    const container = tabsContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  // Ensure active tab is visible into view only when outside container bounds
  useEffect(() => {
    if (selectedSurahName) return;
    const activeBtn = document.getElementById(`nav-tab-${activeTab}`);
    if (activeBtn && tabsNavRef.current) {
      const container = tabsNavRef.current;
      const btnRect = activeBtn.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      if (btnRect.left < containerRect.left || btnRect.right > containerRect.right) {
        activeBtn.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeTab, selectedSurahName, selectedCategory]);

  const handleMushafSwitch = (target: 'kufi' | 'madani') => {
    setActiveMushaf(target);
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    const el = tabsNavRef.current;
    if (!el) return;
    const isRTL = document.documentElement.dir === 'rtl' || getComputedStyle(el).direction === 'rtl';
    const amount = 220;
    const delta = direction === 'left' ? (isRTL ? amount : -amount) : (isRTL ? -amount : amount);
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  // 18 Structured Academic Labs Ordered from Simplest to Most Complex
  const allTabs: TabDefinition[] = useMemo(() => [
    // المستوى 1: المصحف والسور (القراءة والتصفح الأساسي والمقارنة المباشرة)
    {
      id: 'quran-reader',
      label: 'قراءة المصحف',
      category: 'quran',
      icon: BookOpen,
      desc: 'قراءة نصوص السور والآيات وتدبر المتن القرآني المباشر'
    },
    {
      id: 'explorer',
      label: 'فهرس السور',
      category: 'quran',
      icon: Compass,
      desc: 'فهرس وبحث سور القرآن الـ 114 والبيانات الوصفية الأساسية'
    },
    {
      id: 'dashboard',
      label: 'لوحة الإحصاءات',
      category: 'quran',
      icon: BarChart3,
      desc: 'المؤشرات العامة المجمعة للسور والآيات والمكي والمدني'
    },
    {
      id: 'comparator',
      label: 'مقارنة السور',
      category: 'quran',
      icon: GitCompare,
      desc: 'مقارنة إحصائية مباشرة بين سورتين مختارتين'
    },

    // المستوى 2: المصاحف والمقارنات (مقارنة النسخ والعدود وفترات النزول)
    {
      id: 'mushaf-direct',
      label: 'مقارنة آيات المصحفين',
      category: 'mushaf',
      icon: Scale,
      desc: 'مقابلة نصية متزامنة بين المتن الكوفي والمتن المدني آية بآية'
    },
    {
      id: 'mushaf-diff-table',
      label: 'جدول فوارق المصحفين',
      category: 'mushaf',
      icon: Table,
      desc: 'فهرس وحصر فوارق العدين ورؤوس الآي والتباعد بين الروايتين'
    },
    {
      id: 'meccan-medinan',
      label: 'مقارنة المكي والمدني',
      category: 'mushaf',
      icon: BarChart3,
      desc: 'التحليل المقارن بين خصائص السور المكية والمدنية'
    },

    // المستوى 3: الحروف والتشكيل والصوتيات (التحليل الإحصائي والصوتي للأبجدية)
    {
      id: 'letters-heatmap',
      label: 'خريطة الحروف (المصفوفة)',
      category: 'letters',
      icon: Flame,
      desc: 'مصفوفة حرارية لتردد الحروف الـ 28 عبر كل سور القرآن'
    },
    {
      id: 'letters-comparator',
      label: 'مقارنة تكرار الحروف (شريطي متداخل)',
      category: 'letters',
      icon: BarChart3,
      desc: 'مخطط شريطي متداخل لتباين الحروف بين سورتين'
    },
    {
      id: 'letters-extremes',
      label: 'القيم القصوى للحروف',
      category: 'letters',
      icon: Layers,
      desc: 'أعلى وأدنى تكرار ونسب لكل حرف من حروف المعجم الـ 28'
    },
    {
      id: 'letters-phonetics',
      label: 'مخارج وأصوات الحروف',
      category: 'letters',
      icon: Sparkles,
      desc: 'رادار المخارج والصفات الصوتية والتجانس الصوتي'
    },
    {
      id: 'letters-diacritics',
      label: 'حركات التشكيل والضبط',
      category: 'letters',
      icon: BookOpen,
      desc: 'إحصاء الحركات والتنوين والسكون والشدات'
    },
    {
      id: 'letters-cumulative',
      label: 'التوزيع التراكمي للحروف',
      category: 'letters',
      icon: TrendingUp,
      desc: 'المنحنى التراكمي الرياضي لتدفق الحروف عبر القرآن'
    },

    // المستوى 4: اللسانيات والإيقاع القرآني (الفواصل والعوائل والنسبة الذهبية)
    {
      id: 'verse-endings',
      label: 'فواصل الآيات والإيقاع',
      category: 'linguistics',
      icon: Music,
      desc: 'حروف الروي وتجانس الفواصل الصوتية والإيقاع'
    },
    {
      id: 'openings-families',
      label: 'عوائل السور وفواتح الحروف',
      category: 'linguistics',
      icon: Sparkles,
      desc: 'الفواتح الـ 29 وعوائل آل حم والمسبحات والطواسين'
    },
    {
      id: 'lexical-richness',
      label: 'اللسانيات والنسبة الذهبية',
      category: 'linguistics',
      icon: Brain,
      desc: 'قانون زيف اللساني، التنوع المفرداتي TTR، والتناسب الذهبي'
    },

    // المستوى 5: التشابه والتنقيب الرياضي (المصفوفات وعناقيد K-Means الأكثر تعقيداً)
    {
      id: 'similarity-matrix',
      label: 'مصفوفة تشابه السور',
      category: 'similarity',
      icon: Network,
      desc: 'مصفوفة ومستكشف التشابه الصرفي والإحصائي 114×114'
    },
    {
      id: 'similarity-clusters',
      label: 'عناقيد وتصنيف السور',
      category: 'similarity',
      icon: Share2,
      desc: 'عناقيد K-Means متعددة الأبعاد وتحزيب الصحابة'
    }
  ], []);

  // Filter tabs by selected category
  const filteredTabs = useMemo(() => {
    if (selectedCategory === 'all') return allTabs;
    return allTabs.filter(t => t.category === selectedCategory);
  }, [allTabs, selectedCategory]);

  const categories: { id: NavCategory; label: string; count: number }[] = [
    { id: 'all', label: 'كافة الأدوات', count: allTabs.length },
    { id: 'quran', label: 'المصحف والسور', count: 4 },
    { id: 'mushaf', label: 'المصاحف والمقارنات', count: 3 },
    { id: 'letters', label: 'الحروف والتشكيل', count: 6 },
    { id: 'linguistics', label: 'اللسانيات والإيقاع', count: 3 },
    { id: 'similarity', label: 'التشابه والتنقيب', count: 2 }
  ];

  const isLight = theme === 'light';

  return (
    <header className={`border-b sticky top-0 z-40 transition-colors duration-200 shadow-sm ${
      isLight 
        ? 'bg-white border-slate-200/90 shadow-slate-200/50' 
        : 'bg-[#0F172A] border-sky-500/20'
    }`}>
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6">
        
        {/* Top Header Row: Brand, Mushaf Switcher, Category Pills & Theme */}
        {/* Top Header Row: Brand with Inline Mushaf Switcher, Category Pills & Theme */}
        <div className={`flex flex-wrap items-center justify-between py-1.5 gap-2 border-b ${
          isLight ? 'border-slate-200' : 'border-slate-800/60'
        }`}>
          
          {/* Logo & Compact Mushaf Switcher right beside بصمة السور */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded bg-sky-500 flex items-center justify-center font-bold text-slate-950 text-sm shadow-xs shrink-0">
              ص
            </div>
            <h1 className={`text-base font-bold tracking-tight font-quran shrink-0 ${
              isLight ? 'text-sky-700' : 'text-sky-400'
            }`}>
              بصمة السور
            </h1>

            {/* Compact Toggle Button beside بصمة السور */}
            <div 
              className={`inline-flex items-center p-0.5 rounded-lg border shadow-xs shrink-0 transition-colors mr-1 sm:mr-1.5 ${
                isLight 
                  ? 'bg-slate-100 border-slate-300' 
                  : (isInsideAnalysis ? 'bg-slate-950 border-amber-500/50' : 'bg-slate-900 border-slate-700/80')
              }`} 
              role="group" 
              aria-label="اختيار رواية وعدّ المصحف المعتمد"
            >
              <button
                id="navbar-select-kufi-btn"
                type="button"
                onClick={() => handleMushafSwitch('kufi')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  activeMushaf === 'kufi'
                    ? 'bg-sky-600 text-white shadow-xs font-black'
                    : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60')
                }`}
                title="المصحف الكوفي: رواية حفص عن عاصم (6,236 آية)"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeMushaf === 'kufi' ? 'bg-white' : 'bg-sky-500'}`} />
                <span>الكوفي</span>
              </button>
              
              <button
                id="navbar-select-madani-btn"
                type="button"
                onClick={() => handleMushafSwitch('madani')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  activeMushaf === 'madani'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60')
                }`}
                title="المصحف المدني: رواية ورش عن نافع (6,214 آية)"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeMushaf === 'madani' ? 'bg-white' : 'bg-emerald-500'}`} />
                <span>المدني</span>
              </button>
            </div>
          </div>

          {/* Right Controls: Category Filter Pills, Theme Toggle & Guide */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5 scrollbar-none text-[11px]">
            {/* Quick Category Filter Pills */}
            <div className="flex items-center gap-1">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? (isLight ? 'bg-sky-600 text-white shadow-xs' : 'bg-sky-500/20 text-sky-300 border border-sky-500/50')
                        : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-transparent' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent')
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] mr-1 font-mono ${isSelected ? 'opacity-90' : 'opacity-70'}`}>({cat.count})</span>
                  </button>
                );
              })}
            </div>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

            {/* Theme Toggle Button (النمط النهاري / النمط الليلي) */}
            <button
              id="theme-toggle-btn"
              role="switch"
              aria-checked={theme === 'light'}
              aria-label="تبديل النمط بين النهاري والليلي"
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold transition-all shadow-xs duration-200 shrink-0 cursor-pointer ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 hover:text-sky-700' 
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-sky-300'
              }`}
              title={theme === 'dark' ? 'التبديل إلى النمط النهاري (أبيض عالي التباين)' : 'التبديل إلى النمط الليلي (داكن هادئ)'}
            >
              {theme === 'dark' ? (
                <>
                  <span className="w-4 h-4 rounded bg-amber-400/15 border border-amber-400/40 flex items-center justify-center">
                    <Sun className="w-3 h-3 text-amber-400" />
                  </span>
                  <span className="text-[11px] font-sans font-bold hidden sm:inline">نهاري</span>
                </>
              ) : (
                <>
                  <span className="w-4 h-4 rounded bg-sky-600/15 border border-sky-600/40 flex items-center justify-center">
                    <Moon className="w-3 h-3 text-sky-600" />
                  </span>
                  <span className="text-[11px] font-sans font-bold text-slate-900 hidden sm:inline">ليلي</span>
                </>
              )}
            </button>

            {/* Master Academic Help Drawer Button (دليل الأقسام والاستعلام) */}
            <button
              id="navbar-open-guide-btn"
              type="button"
              onClick={() => {
                const guideMapping: Record<ActiveTab, string> = {
                  'dashboard': 'quran-reader',
                  'quran-reader': 'quran-reader',
                  'explorer': 'explorer',
                  'comparator': 'comparator-split-view',
                  'letters-heatmap': 'letters-lab-extrema',
                  'letters-comparator': 'letters-lab-extrema',
                  'letters-extremes': 'letters-lab-extrema',
                  'letters-phonetics': 'letters-lab-extrema',
                  'letters-diacritics': 'letters-lab-extrema',
                  'letters-cumulative': 'letters-lab-cumulative',
                  'verse-endings': 'verse-endings-lab',
                  'lexical-richness': 'lexical-richness-lab',
                  'openings-families': 'openings-and-families-lab',
                  'similarity-matrix': 'similarity-matrix-114',
                  'similarity-clusters': 'similarity-clusters',
                  'meccan-medinan': 'meccan-medinan-lab',
                  'mushaf-direct': 'mushaf-comparison',
                  'mushaf-diff-table': 'mushaf-comparison'
                };
                openQuery(guideMapping[activeTab] || 'quran-reader');
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold transition-all shadow-xs duration-200 shrink-0 cursor-pointer ${
                isLight 
                  ? 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-800' 
                  : 'bg-sky-950/40 hover:bg-sky-900/60 border-sky-800/80 text-sky-300'
              }`}
              title="فتح دليل الأقسام والاستعلامات المنهجية لجميع أدوات التطبيق"
              aria-label="دليل الأقسام ودرج المساعدة"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] font-sans font-bold hidden md:inline">دليل الأقسام</span>
            </button>
          </div>
        </div>

        {/* Tools Navigation Row (Always directly visible, ordered by complexity) */}
        <div className="py-1.5 flex items-center gap-1.5">
            {selectedSurahName && onBackFromAnalysis && (
              <button
                type="button"
                id="navbar-analysis-back-btn"
                onClick={onBackFromAnalysis}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 transition-all shrink-0 cursor-pointer shadow-xs"
                title="الرجوع إلى القائمة السابقة"
              >
                <span>الرجوع من {selectedSurahName} ←</span>
              </button>
            )}

            {/* Scroll Left Button */}
            <button
              type="button"
              onClick={() => scrollTabs('right')}
              className={`hidden sm:flex items-center justify-center w-7 h-7 rounded-lg border shrink-0 cursor-pointer transition-colors ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300 hover:text-slate-900' 
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
              }`}
              title="تمرير لليمين"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* High Density Independent Navigation Tabs */}
            <div 
              ref={tabsContainerRef}
              className="flex-1 overflow-hidden min-w-0"
            >
              <nav 
                ref={tabsNavRef}
                className="flex items-center gap-1 overflow-x-auto w-full scrollbar-none py-0.5"
              >
                {filteredTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = !selectedSurahName && activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`nav-tab-${tab.id}`}
                      onClick={() => setActiveTab(tab.id)}
                      title={tab.desc}
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 min-h-[30px] shrink-0 cursor-pointer ${
                        isActive
                          ? (isLight 
                              ? 'bg-sky-600 text-white shadow-xs font-bold' 
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-xs font-bold')
                          : (isLight
                              ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 border border-transparent'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent')
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? (isLight ? 'text-white' : 'text-sky-400') : (isLight ? 'text-slate-500' : 'text-slate-400')}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Scroll Right Button */}
            <button
              type="button"
              onClick={() => scrollTabs('left')}
              className={`hidden sm:flex items-center justify-center w-7 h-7 rounded-lg border shrink-0 cursor-pointer transition-colors ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300 hover:text-slate-900' 
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
              }`}
              title="تمرير لليسار"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

      </div>
    </header>
  );
};
