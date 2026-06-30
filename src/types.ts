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
}

export interface PortalData {
  config: PortalConfig;
  apps: VibeApp[];
}

export const DEFAULT_THEMES = {
  indigo: {
    id: 'indigo' as const,
    name: '지오메트릭 블루',
    bg: 'bg-[#0B132B]',
    cardBg: 'bg-[#1C2541]/60 backdrop-blur-md border border-blue-500/10',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    primary: 'blue',
    accent: 'blue-500',
    border: 'border-blue-500/10',
    accentBg: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20',
    primaryBtn: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/45',
    badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    schoolBadge: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    personalBadge: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    sidebarBg: 'bg-[#0B132B] text-slate-100',
  },
  emerald: {
    id: 'emerald' as const,
    name: '지오메트릭 에메랄드',
    bg: 'bg-[#051A14]',
    cardBg: 'bg-[#0E2E25]/60 backdrop-blur-md border border-emerald-500/10',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    primary: 'emerald',
    accent: 'emerald-500',
    border: 'border-emerald-500/10',
    accentBg: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
    primaryBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/45',
    badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    schoolBadge: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
    personalBadge: 'bg-[#051A14]/10 text-emerald-400 border border-emerald-500/20',
    sidebarBg: 'bg-[#051A14] text-slate-100',
  },
  rosewood: {
    id: 'rosewood' as const,
    name: '지오메트릭 로즈',
    bg: 'bg-[#1A0A10]',
    cardBg: 'bg-[#2D141E]/60 backdrop-blur-md border border-rose-500/10',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    primary: 'rose',
    accent: 'rose-500',
    border: 'border-rose-500/10',
    accentBg: 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20',
    primaryBtn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/45',
    badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    schoolBadge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    personalBadge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    sidebarBg: 'bg-[#1A0A10] text-slate-100',
  },
  charcoal: {
    id: 'charcoal' as const,
    name: '지오메트릭 앰버',
    bg: 'bg-[#120F0D]',
    cardBg: 'bg-[#211B17]/60 backdrop-blur-md border border-amber-500/10',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    primary: 'amber',
    accent: 'amber-500',
    border: 'border-amber-500/10',
    accentBg: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
    primaryBtn: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-950/45',
    badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    schoolBadge: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    personalBadge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    sidebarBg: 'bg-[#120F0D] text-slate-100',
  }
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
    themeId: 'emerald'
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
