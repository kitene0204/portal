export interface CategoryTab {
  id: string;
  name: string;
  icon?: string;
}

export interface VibeApp {
  id: string;
  title: string;
  link: string;
  category: string;
  order: number;
  description?: string;
  tags?: string[];
  icon?: string;
  thumbnail?: string;
}

export interface PortalConfig {
  portalTitle: string;
  layoutId: 'grid' | 'list' | 'featured' | 'split';
  themeId: 'indigo' | 'emerald' | 'rosewood' | 'charcoal';
  mode?: 'dark' | 'light';
  schoolCategoryName?: string;
  personalCategoryName?: string;
  categories?: CategoryTab[];
  adminPassword?: string;
  lockAdmin?: boolean;
}

export interface PortalData {
  config: PortalConfig;
  apps: VibeApp[];
}

export const GET_THEME_CLASSES = (themeId: 'indigo' | 'emerald' | 'rosewood' | 'charcoal', mode: 'dark' | 'light' = 'dark') => {
  const isDark = mode === 'dark';
  if (themeId === 'indigo') {
    return {
      id: 'indigo' as const,
      name: '지오메트릭 블루',
      bg: isDark ? 'bg-[#0B132B]' : 'bg-[#F4F6F9]',
      cardBg: isDark ? 'bg-[#1C2541]/60 backdrop-blur-md border border-blue-500/10' : 'bg-white border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)] hover:border-slate-300',
      text: isDark ? 'text-slate-100' : 'text-slate-900',
      textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
      primary: 'blue',
      accent: 'blue-600',
      border: isDark ? 'border-blue-500/10' : 'border-slate-200/90',
      accentBg: isDark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50/80 text-blue-700 hover:bg-blue-100/80 border border-blue-100',
      primaryBtn: isDark ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/45' : 'bg-slate-900 hover:bg-blue-600 text-white shadow-sm font-semibold transition-all',
      badge: isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-100 text-slate-700 border border-slate-200 font-semibold',
      schoolBadge: isDark ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-sky-50 text-sky-800 border border-sky-200/80 font-semibold',
      personalBadge: isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-800 border border-indigo-200/80 font-semibold',
      sidebarBg: isDark ? 'bg-[#0B132B] text-slate-100' : 'bg-white text-slate-900',
    };
  } else if (themeId === 'emerald') {
    return {
      id: 'emerald' as const,
      name: '지오메트릭 에메랄드',
      bg: isDark ? 'bg-[#051A14]' : 'bg-[#F2F7F4]',
      cardBg: isDark ? 'bg-[#0E2E25]/60 backdrop-blur-md border border-emerald-500/10' : 'bg-white border border-emerald-200/60 shadow-[0_2px_8px_rgba(6,78,59,0.04)] hover:shadow-[0_8px_20px_rgba(6,78,59,0.08)] hover:border-emerald-300',
      text: isDark ? 'text-slate-100' : 'text-slate-900',
      textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
      primary: 'emerald',
      accent: 'emerald-600',
      border: isDark ? 'border-emerald-500/10' : 'border-emerald-200/70',
      accentBg: isDark ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-100',
      primaryBtn: isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/45' : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm font-semibold transition-all',
      badge: isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold',
      schoolBadge: isDark ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-teal-50 text-teal-800 border border-teal-200/80 font-semibold',
      personalBadge: isDark ? 'bg-[#051A14]/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold',
      sidebarBg: isDark ? 'bg-[#051A14] text-slate-100' : 'bg-white text-slate-900',
    };
  } else if (themeId === 'rosewood') {
    return {
      id: 'rosewood' as const,
      name: '지오메트릭 로즈',
      bg: isDark ? 'bg-[#1A0A10]' : 'bg-[#F9F5F6]',
      cardBg: isDark ? 'bg-[#2D141E]/60 backdrop-blur-md border border-rose-500/10' : 'bg-white border border-rose-200/60 shadow-[0_2px_8px_rgba(76,5,25,0.04)] hover:shadow-[0_8px_20px_rgba(76,5,25,0.08)] hover:border-rose-300',
      text: isDark ? 'text-slate-100' : 'text-slate-900',
      textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
      primary: 'rose',
      accent: 'rose-600',
      border: isDark ? 'border-rose-500/10' : 'border-rose-200/70',
      accentBg: isDark ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-800 hover:bg-rose-100/80 border border-rose-100',
      primaryBtn: isDark ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/45' : 'bg-rose-700 hover:bg-rose-800 text-white shadow-sm font-semibold transition-all',
      badge: isDark ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-800 border border-rose-200/80 font-semibold',
      schoolBadge: isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-800 border border-amber-200/80 font-semibold',
      personalBadge: isDark ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-800 border border-rose-200/80 font-semibold',
      sidebarBg: isDark ? 'bg-[#1A0A10] text-slate-100' : 'bg-white text-slate-900',
    };
  } else {
    return {
      id: 'charcoal' as const,
      name: '지오메트릭 앰버',
      bg: isDark ? 'bg-[#120F0D]' : 'bg-[#FBF8F3]',
      cardBg: isDark ? 'bg-[#211B17]/60 backdrop-blur-md border border-amber-500/10' : 'bg-white border border-stone-200/80 shadow-[0_2px_8px_rgba(41,37,36,0.04)] hover:shadow-[0_8px_20px_rgba(41,37,36,0.08)] hover:border-amber-300',
      text: isDark ? 'text-slate-100' : 'text-slate-900',
      textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
      primary: 'amber',
      accent: 'amber-600',
      border: isDark ? 'border-amber-500/10' : 'border-stone-200',
      accentBg: isDark ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-900 hover:bg-amber-100/80 border border-amber-200/80',
      primaryBtn: isDark ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-950/45' : 'bg-stone-900 hover:bg-amber-700 text-white shadow-sm font-semibold transition-all',
      badge: isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-900 border border-amber-200/80 font-semibold',
      schoolBadge: isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-800 border border-cyan-200/80 font-semibold',
      personalBadge: isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-900 border border-amber-200/80 font-semibold',
      sidebarBg: isDark ? 'bg-[#120F0D] text-slate-100' : 'bg-white text-slate-900',
    };
  }
};

export const DEFAULT_THEMES = {
  indigo: GET_THEME_CLASSES('indigo', 'dark'),
  emerald: GET_THEME_CLASSES('emerald', 'dark'),
  rosewood: GET_THEME_CLASSES('rosewood', 'dark'),
  charcoal: GET_THEME_CLASSES('charcoal', 'dark')
};

export const DEFAULT_LAYOUTS = [
  { id: 'grid', name: '그리드 보드', desc: '카드 중심의 균형 잡힌 레이아웃' },
  { id: 'list', name: '리스트 플로우', desc: '설명과 링크 중심의 직관적 레이아웃' },
  { id: 'featured', name: '피처드 포커스', desc: '주요 프로젝트와 목록 분할 레이아웃' },
  { id: 'split', name: '컴팩트 분할', desc: '학교와 개인 항목 좌우 2단 분할 레이아웃' }
];

export const INITIAL_DATA: PortalData = {
  config: {
    portalTitle: 'My Vibe App Coding Portal',
    layoutId: 'grid',
    themeId: 'emerald',
    mode: 'dark',
    adminPassword: '1234',
    lockAdmin: true
  },
  apps: [
    {
      id: '1',
      title: '스마트 학교 급식 알리미',
      link: 'https://example.com/school-meals',
      category: 'school',
      order: 1,
      description: '우리 학교의 실시간 급식 메뉴와 칼로리 정보를 위젯 형태로 깔끔하게 시각화해주는 바이브 웹앱입니다.',
      tags: ['학교', '급식 API', 'React'],
      icon: 'GraduationCap'
    },
    {
      id: '2',
      title: '동아리 협업 일정 관리 보드',
      link: 'https://example.com/club-board',
      category: 'school',
      order: 2,
      description: '학교 동아리 부원들이 실시간으로 일정을 공유하고 업무 역할을 분담하는 칸반 보드 시스템입니다.',
      tags: ['프로젝트', '칸반보드', '실시간'],
      icon: 'Calendar'
    },
    {
      id: '3',
      title: '개인 사이드 프로젝트 - 책방지기',
      link: 'https://example.com/book-keeper',
      category: 'personal',
      order: 1,
      description: '읽은 책의 핵심 키워드를 AI 마인드맵으로 시각화하고 개인 독서 일지를 기록할 수 있는 서재 포털입니다.',
      tags: ['개인', 'AI 마인드맵', 'LocalDB'],
      icon: 'BookOpen'
    },
    {
      id: '4',
      title: '포모도르 집중 타이머 & 사운드스케이프',
      link: 'https://example.com/pomodoro-timer',
      category: 'personal',
      order: 2,
      description: '화이트 노이즈 믹서와 결합된 하이엔드 디자인의 포모도르 집중 관리 타이머 앱입니다.',
      tags: ['유틸리티', '집중', '오디오'],
      icon: 'Clock'
    }
  ]
};
