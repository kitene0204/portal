import React, { useState, FormEvent } from 'react';
import { 
  VibeApp, 
  PortalConfig, 
  DEFAULT_THEMES, 
  DEFAULT_LAYOUTS 
} from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  LayoutGrid, 
  Palette, 
  Sliders, 
  ListOrdered,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  Code2,
  Globe,
  Laptop,
  Terminal,
  Smartphone,
  Compass,
  Activity,
  Heart
} from 'lucide-react';

interface SettingsPanelProps {
  config: PortalConfig;
  apps: VibeApp[];
  onSaveConfig: (config: PortalConfig) => void;
  onSaveApps: (apps: VibeApp[]) => void;
  onClose: () => void;
}

const POPULAR_ICONS = [
  { name: 'GraduationCap', label: '학업/학교', icon: GraduationCap },
  { name: 'BookOpen', label: '도서/블로그', icon: BookOpen },
  { name: 'Calendar', label: '일정/달력', icon: Calendar },
  { name: 'Clock', label: '시간/타이머', icon: Clock },
  { name: 'Code2', label: '코딩/개발', icon: Code2 },
  { name: 'Globe', label: '웹서비스', icon: Globe },
  { name: 'Laptop', label: '데스크톱 앱', icon: Laptop },
  { name: 'Terminal', label: '도구/유틸', icon: Terminal },
  { name: 'Smartphone', label: '모바일 웹앱', icon: Smartphone },
  { name: 'Compass', label: '탐색/기타', icon: Compass },
  { name: 'Activity', label: '운동/건강', icon: Activity },
  { name: 'Heart', label: '소셜/일기', icon: Heart }
];

export default function SettingsPanel({
  config,
  apps,
  onSaveConfig,
  onSaveApps,
  onClose
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'apps'>('general');
  const [portalTitle, setPortalTitle] = useState(config.portalTitle);
  const [layoutId, setLayoutId] = useState(config.layoutId);
  const [themeId, setThemeId] = useState(config.themeId);
  const [schoolCategoryName, setSchoolCategoryName] = useState(config.schoolCategoryName || '학교 프로젝트');
  const [personalCategoryName, setPersonalCategoryName] = useState(config.personalCategoryName || '개인 프로젝트');

  // App Editor States
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [appTitle, setAppTitle] = useState('');
  const [appLink, setAppLink] = useState('');
  const [appCategory, setAppCategory] = useState<'school' | 'personal'>('school');
  const [appOrder, setAppOrder] = useState(1);
  const [appDescription, setAppDescription] = useState('');
  const [appIcon, setAppIcon] = useState('Globe');
  const [appTagsInput, setAppTagsInput] = useState('');

  // Save General settings
  const handleSaveGeneral = () => {
    onSaveConfig({
      ...config,
      portalTitle,
      layoutId,
      themeId,
      schoolCategoryName,
      personalCategoryName
    });
  };

  // Trigger whenever theme or layout or title changes dynamically for real-time vibe feedback!
  const handleThemeChange = (id: typeof themeId) => {
    setThemeId(id);
    onSaveConfig({
      ...config,
      portalTitle,
      layoutId,
      themeId: id,
      schoolCategoryName,
      personalCategoryName
    });
  };

  const handleLayoutChange = (id: typeof layoutId) => {
    setLayoutId(id);
    onSaveConfig({
      ...config,
      portalTitle,
      layoutId: id,
      themeId,
      schoolCategoryName,
      personalCategoryName
    });
  };

  const handleTitleChange = (val: string) => {
    setPortalTitle(val);
    onSaveConfig({
      ...config,
      portalTitle: val,
      layoutId,
      themeId,
      schoolCategoryName,
      personalCategoryName
    });
  };

  const handleSchoolCategoryNameChange = (val: string) => {
    setSchoolCategoryName(val);
    onSaveConfig({
      ...config,
      portalTitle,
      layoutId,
      themeId,
      schoolCategoryName: val,
      personalCategoryName
    });
  };

  const handlePersonalCategoryNameChange = (val: string) => {
    setPersonalCategoryName(val);
    onSaveConfig({
      ...config,
      portalTitle,
      layoutId,
      themeId,
      schoolCategoryName,
      personalCategoryName: val
    });
  };

  // Reset Add/Edit App form
  const resetAppForm = () => {
    setEditingAppId(null);
    setAppTitle('');
    setAppLink('');
    setAppCategory('school');
    setAppOrder(apps.length + 1);
    setAppDescription('');
    setAppIcon('Globe');
    setAppTagsInput('');
  };

  // Edit App trigger
  const handleStartEdit = (app: VibeApp) => {
    setEditingAppId(app.id);
    setAppTitle(app.title);
    setAppLink(app.link);
    setAppCategory(app.category);
    setAppOrder(app.order);
    setAppDescription(app.description || '');
    setAppIcon(app.icon || 'Globe');
    setAppTagsInput(app.tags ? app.tags.join(', ') : '');
  };

  // Save/Add App
  const handleSaveApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appTitle.trim() || !appLink.trim()) return;

    const tags = appTagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    if (editingAppId) {
      // Editing
      const updatedApps = apps.map(app => {
        if (app.id === editingAppId) {
          return {
            ...app,
            title: appTitle,
            link: appLink,
            category: appCategory,
            order: Number(appOrder),
            description: appDescription,
            icon: appIcon,
            tags
          };
        }
        return app;
      });
      // Re-index by category
      const schoolApps = updatedApps.filter(a => a.category === 'school').sort((a, b) => a.order - b.order);
      schoolApps.forEach((app, i) => { app.order = i + 1; });
      const personalApps = updatedApps.filter(a => a.category === 'personal').sort((a, b) => a.order - b.order);
      personalApps.forEach((app, i) => { app.order = i + 1; });

      onSaveApps([...schoolApps, ...personalApps]);
    } else {
      // Adding new
      const newApp: VibeApp = {
        id: Date.now().toString(),
        title: appTitle,
        link: appLink,
        category: appCategory,
        order: Number(appOrder),
        description: appDescription,
        icon: appIcon,
        tags
      };
      const updatedApps = [...apps, newApp];
      // Re-index by category
      const schoolApps = updatedApps.filter(a => a.category === 'school').sort((a, b) => a.order - b.order);
      schoolApps.forEach((app, i) => { app.order = i + 1; });
      const personalApps = updatedApps.filter(a => a.category === 'personal').sort((a, b) => a.order - b.order);
      personalApps.forEach((app, i) => { app.order = i + 1; });

      onSaveApps([...schoolApps, ...personalApps]);
    }

    resetAppForm();
  };

  // Delete App
  const handleDeleteApp = (id: string) => {
    if (confirm('이 포털 항목을 정말 삭제하시겠습니까?')) {
      const filtered = apps.filter(app => app.id !== id);
      const schoolApps = filtered.filter(a => a.category === 'school').sort((a, b) => a.order - b.order);
      schoolApps.forEach((app, i) => { app.order = i + 1; });
      const personalApps = filtered.filter(a => a.category === 'personal').sort((a, b) => a.order - b.order);
      personalApps.forEach((app, i) => { app.order = i + 1; });
      onSaveApps([...schoolApps, ...personalApps]);
      if (editingAppId === id) {
        resetAppForm();
      }
    }
  };

  // Reorder app up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newApps = [...apps];
    // Swap position in array
    const temp = newApps[index];
    newApps[index] = newApps[index - 1];
    newApps[index - 1] = temp;

    // Ensure sequential clean order numbers by category based on list order
    const schoolApps = newApps.filter(a => a.category === 'school');
    schoolApps.forEach((app, i) => { app.order = i + 1; });
    const personalApps = newApps.filter(a => a.category === 'personal');
    personalApps.forEach((app, i) => { app.order = i + 1; });

    onSaveApps([...schoolApps, ...personalApps]);
  };

  // Reorder app down
  const handleMoveDown = (index: number) => {
    if (index === apps.length - 1) return;
    const newApps = [...apps];
    // Swap position in array
    const temp = newApps[index];
    newApps[index] = newApps[index + 1];
    newApps[index + 1] = temp;

    // Ensure sequential clean order numbers by category based on list order
    const schoolApps = newApps.filter(a => a.category === 'school');
    schoolApps.forEach((app, i) => { app.order = i + 1; });
    const personalApps = newApps.filter(a => a.category === 'personal');
    personalApps.forEach((app, i) => { app.order = i + 1; });

    onSaveApps([...schoolApps, ...personalApps]);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-100 border-l border-neutral-800 w-full md:max-w-md shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold text-sm tracking-wide text-neutral-200">포털 설정 관리자</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 bg-neutral-900/40 text-xs">
        <button
          onClick={() => { setActiveTab('general'); resetAppForm(); }}
          className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'general'
              ? 'border-indigo-500 text-indigo-400 bg-neutral-800/20'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          기본 설정 & 테마
        </button>
        <button
          onClick={() => setActiveTab('apps')}
          className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'apps'
              ? 'border-indigo-500 text-indigo-400 bg-neutral-800/20'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          웹앱 항목 편집 ({apps.length})
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Portal Title Config */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-neutral-300">포털 대시보드 대제목</label>
              <input
                type="text"
                value={portalTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="예: My Vibe App Coding Portal"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <p className="text-[10px] text-neutral-500">실시간으로 좌측 포털 제목 영역에 반영됩니다.</p>
            </div>

            {/* Category Names Config */}
            <div className="space-y-3 p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/30">
              <span className="block text-xs font-semibold text-neutral-200">카테고리 탭 이름 설정</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-medium text-neutral-400">🏫 학교 탭 이름</label>
                  <input
                    type="text"
                    value={schoolCategoryName}
                    onChange={(e) => handleSchoolCategoryNameChange(e.target.value)}
                    placeholder="학교 프로젝트"
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-medium text-neutral-400">👤 개인 탭 이름</label>
                  <input
                    type="text"
                    value={personalCategoryName}
                    onChange={(e) => handlePersonalCategoryNameChange(e.target.value)}
                    placeholder="개인 프로젝트"
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <p className="text-[10px] text-neutral-500 leading-snug">메인 대시보드 및 필터 탭에 반영되며 실시간 저장됩니다.</p>
            </div>

            {/* Layout Options */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4 text-indigo-400" />
                <label className="text-xs font-semibold text-neutral-300">레이아웃 선택 (4가지)</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_LAYOUTS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleLayoutChange(item.id as any)}
                    className={`p-3 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                      layoutId === item.id
                        ? 'border-indigo-500 bg-indigo-950/20 text-indigo-300 shadow-md shadow-indigo-950/10'
                        : 'border-neutral-800 bg-neutral-950/40 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <div className="font-medium text-xs mb-1">{item.name}</div>
                    <div className="text-[10px] text-neutral-500 leading-snug">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color/Theme Options */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-indigo-400" />
                <label className="text-xs font-semibold text-neutral-300">색상 및 무드 배치 (4가지)</label>
              </div>
              <div className="space-y-2.5">
                {Object.values(DEFAULT_THEMES).map((theme) => {
                  const isSelected = themeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/20 text-indigo-200'
                          : 'border-neutral-800 bg-neutral-950/40 hover:bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-medium text-slate-200">{theme.name}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {theme.id === 'indigo' ? '다크 슬레이트 & 딥 블루 프리셋' :
                           theme.id === 'emerald' ? '다크 슬레이트 & 활성 에메랄드 프리셋' :
                           theme.id === 'rosewood' ? '다크 슬레이트 & 로즈 버건디 프리셋' :
                           '다크 슬레이트 & 기하학적 골드 프리셋'}
                        </div>
                      </div>
                      
                      {/* Swatch color circles */}
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-700 bg-[#0F172A]"></span>
                        <span className={`w-3.5 h-3.5 rounded-full ${
                          theme.id === 'indigo' ? 'bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)]' :
                          theme.id === 'emerald' ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]' :
                          theme.id === 'rosewood' ? 'bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.5)]' :
                          'bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)]'
                        }`}></span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400 ml-1.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 text-[11px] text-neutral-500 leading-relaxed space-y-1">
              <p>✔️ 모든 디자인 요소는 변경 시 실시간 반영됩니다.</p>
              <p>✔️ 변경된 레이아웃 및 테마 값 역시 Supabase에 그대로 동기화됩니다.</p>
            </div>
          </div>
        )}

        {activeTab === 'apps' && (
          <div className="space-y-6">
            {/* Dynamic Add / Edit Header */}
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/50">
              <h3 className="text-xs font-semibold tracking-wide text-neutral-300 flex items-center gap-1.5 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                {editingAppId ? '웹앱 정보 수정하기' : '새 웹앱 정보 추가하기'}
              </h3>
              
              <form onSubmit={handleSaveApp} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1 font-medium">웹앱 이름 *</label>
                  <input
                    type="text"
                    required
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                    placeholder="예: 급식 알리미 위젯"
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1 font-medium">분류 탭 *</label>
                    <select
                      value={appCategory}
                      onChange={(e) => setAppCategory(e.target.value as any)}
                      className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-neutral-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="school">🏫 {schoolCategoryName}</option>
                      <option value="personal">👤 {personalCategoryName}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1 font-medium">기본 순서 (순위)</label>
                    <input
                      type="number"
                      min="1"
                      value={appOrder}
                      onChange={(e) => setAppOrder(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-neutral-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1 font-medium">웹앱 링크 URL *</label>
                  <input
                    type="url"
                    required
                    value={appLink}
                    onChange={(e) => setAppLink(e.target.value)}
                    placeholder="https://example.com/myapp"
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1 font-medium">아이콘 선택</label>
                  <div className="grid grid-cols-6 gap-1 bg-neutral-900 p-2 rounded-md border border-neutral-800">
                    {POPULAR_ICONS.map((item) => {
                      const IconComponent = item.icon;
                      const isSelected = appIcon === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setAppIcon(item.name)}
                          title={item.label}
                          className={`p-1.5 rounded flex items-center justify-center hover:bg-neutral-800 transition-colors ${
                            isSelected ? 'bg-indigo-600 text-white hover:bg-indigo-600' : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1 font-medium">설명 (간단히)</label>
                  <textarea
                    value={appDescription}
                    onChange={(e) => setAppDescription(e.target.value)}
                    rows={2}
                    placeholder="이 앱의 기능과 사용법을 간단히 소개해주세요."
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1 font-medium">태그 (쉼표로 구분)</label>
                  <input
                    type="text"
                    value={appTagsInput}
                    onChange={(e) => setAppTagsInput(e.target.value)}
                    placeholder="React, AI, 급식, 실시간"
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-2 pt-1.5">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors cursor-pointer"
                  >
                    {editingAppId ? '수정 완료하기' : '포털 항목 등록하기'}
                  </button>
                  <button
                    type="button"
                    onClick={resetAppForm}
                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>

            {/* Apps display ordering list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <ListOrdered className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-neutral-300">포털 전체 항목 ({apps.length}개)</span>
                </div>
                <span className="text-[10px] text-neutral-500">순서 조정 가능</span>
              </div>

              <div className="space-y-2">
                {apps.map((app, index) => {
                  return (
                    <div
                      key={app.id}
                      className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-all ${
                        editingAppId === app.id
                          ? 'border-indigo-500 bg-indigo-950/10'
                          : 'border-neutral-800 bg-neutral-950/30 hover:bg-neutral-950/60'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-tight ${
                            app.category === 'school'
                              ? 'bg-sky-950 text-sky-400 border border-sky-900/50'
                              : 'bg-violet-950 text-violet-400 border border-violet-900/50'
                          }`}>
                            {app.category === 'school' ? schoolCategoryName : personalCategoryName}
                          </span>
                          <span className="text-neutral-500 font-mono text-[10px]">#{app.order}</span>
                        </div>
                        <div className="font-medium text-neutral-200 mt-1 truncate">{app.title}</div>
                        <div className="text-[10px] text-neutral-500 truncate mt-0.5 font-mono">{app.link}</div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          title="위로 이동"
                          className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === apps.length - 1}
                          title="아래로 이동"
                          className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(app)}
                          title="편집"
                          className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-indigo-400 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteApp(app.id)}
                          title="삭제"
                          className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-end gap-3">
        <button
          onClick={() => {
            handleSaveGeneral();
            onClose();
          }}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950/25 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>저장 및 닫기</span>
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          취소
        </button>
      </div>
    </div>
  );
}
