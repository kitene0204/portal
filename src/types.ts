export interface VibeApp {
  id: string;
  title: string;
  link: string;
  category: 'school' | 'personal';
  order: number;
  description?: string;
  tags?: string[];
  icon?: string;
}

export interface PortalConfig {
  portalTitle: string;
  layoutId: 'grid' | 'list' | 'featured' | 'split';
  themeId: 'indigo' | 'emerald' | 'rosewood' | 'charcoal';
  mode?: 'dark' | 'light';
  schoolCategoryName?: string;
  personalCategoryName?: string;
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
      bg: isDark ? 'bg-[#0B132B]' : 'bg-[#F0F4F8]',
      cardBg: isDark ? 'bg-[#1C2541]/60 backdrop-blur-md border border-blue-500/10' : 'bg-white border border-blue-200/80 shadow-sm shadow-blue-100/30',
      text: isDark ? 'text-slate-100' : 'text-slate-800',
      textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
      primary: 'blue',
      accent: 'blue-500',
      border: isDark ? 'border-blue-500/10' : 'border-blue-200/60',
      accentBg: isDark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      primaryBtn: isDark ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/45' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200/60',
      badge: isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100',
      schoolBadge: isDark ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-sky-50 text-sky-600 border border-sky-100',
      personalBadge: isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      sidebarBg: isDark ? 'bg-[#0B132B] text-slate-100' : 'bg-[#1C2541] text-slate-100',
    };
  } else if (themeId === 'emerald') {
    return {
      id: 'emerald' as const,
      name: '지오메트릭 에메랄드',
      bg: isDark ? 'bg-[#051A14]' : 'bg-[#F4FAF6]',
      cardBg: isDark ? 'bg-[#0E2E25]/60 backdrop-blur-md border border-emerald-500/10' : 'bg-white border border-emerald-200/80 shadow-sm shadow-emerald-100/30',
      text: isDark ? 'text-slate-100' : 'text-slate-800',
      textMuted: isDark ? 'text-slate-400' : 'text-emerald-700/80',
      primary: 'emerald',
      accent: 'emerald-500',
      border: isDark ? 'border-emerald-500/10' : 'border-emerald-200/60',
      accentBg: isDark ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
      primaryBtn: isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/45' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200/60',
      badge: isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      schoolBadge: isDark ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-teal-50 text-teal-600 border border-teal-100',
      personalBadge: isDark ? 'bg-[#051A14]/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      sidebarBg: isDark ? 'bg-[#051A14] text-slate-100' : 'bg-[#0E2E25] text-slate-100',
    };
  } else if (themeId === 'rosewood') {
    return {
      id: 'rosewood' as const,
      name: '지오메트릭 로즈',
      bg: isDark ? 'bg-[#1A0A10]' : 'bg-[#FFF5F8]',
      cardBg: isDark ? 'bg-[#2D141E]/60 backdrop-blur-md border border-rose-500/10' : 'bg-white border border-rose-200/80 shadow-sm shadow-rose-100/30',
      text: isDark ? 'text-slate-100' : 'text-slate-800',
      textMuted: isDark ? 'text-slate-400' : 'text-rose-700/80',
      primary: 'rose',
      accent: 'rose-500',
      border: isDark ? 'border-rose-500/10' : 'border-rose-200/60',
      accentBg: isDark ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-700 hover:bg-rose-100',
      primaryBtn: isDark ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/45' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200/60',
      badge: isDark ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-700 border border-rose-100',
      schoolBadge: isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-100',
      personalBadge: isDark ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-700 border border-rose-100',
      sidebarBg: isDark ? 'bg-[#1A0A10] text-slate-100' : 'bg-[#2D141E] text-slate-100',
    };
  } else {
    return {
      id: 'charcoal' as const,
      name: '지오메트릭 앰버',
      bg: isDark ? 'bg-[#120F0D]' : 'bg-[#FCF9F5]',
      cardBg: isDark ? 'bg-[#211B17]/60 backdrop-blur-md border border-amber-500/10' : 'bg-white border border-amber-200 shadow-sm shadow-amber-100/30',
      text: isDark ? 'text-slate-100' : 'text-slate-800',
      textMuted: isDark ? 'text-slate-400' : 'text-amber-800/80',
      primary: 'amber',
      accent: 'amber-500',
      border: isDark ? 'border-amber-500/10' : 'border-amber-200/60',
      accentBg: isDark ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
      primaryBtn: isDark ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-950/45' : 'bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-200/60',
      badge: isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-100',
      schoolBadge: isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-100',
      personalBadge: isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-100',
      sidebarBg: isDark ? 'bg-[#120F0D] text-slate-100' : 'bg-[#211B17] text-slate-100',
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
    mode: 'dark'
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
