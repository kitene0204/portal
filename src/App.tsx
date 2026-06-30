import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Settings, 
  Search, 
  Plus, 
  ExternalLink, 
  AlertTriangle, 
  Sparkles, 
  HelpCircle, 
  RefreshCw,
  Check,
  ChevronRight,
  Code,
  GraduationCap,
  Globe,
  Tag,
  GripVertical,
  Sun,
  Moon
} from 'lucide-react';

import { 
  VibeApp, 
  PortalConfig, 
  PortalData, 
  GET_THEME_CLASSES,
  DEFAULT_THEMES, 
  INITIAL_DATA 
} from './types';
import { 
  fetchPortalData, 
  savePortalData, 
  isSupabaseConfigured 
} from './lib/supabase';
import SettingsPanel from './components/SettingsPanel';
import SupabaseGuide from './components/SupabaseGuide';
import DynamicIcon from './components/DynamicIcon';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortalData>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<'all' | 'school' | 'personal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Panels
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  // Sync Statuses
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');

  // Drag & Drop Reordering States
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverAppId, setDragOverAppId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedAppId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== draggedAppId && id !== dragOverAppId) {
      setDragOverAppId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedAppId(null);
    setDragOverAppId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedAppId || draggedAppId === targetId) {
      setDraggedAppId(null);
      setDragOverAppId(null);
      return;
    }

    const updatedApps = [...data.apps];
    const draggedIndex = updatedApps.findIndex(a => a.id === draggedAppId);
    const targetIndex = updatedApps.findIndex(a => a.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const draggedApp = updatedApps[draggedIndex];
      const targetApp = updatedApps[targetIndex];

      // If categories differ, move to target's category
      if (draggedApp.category !== targetApp.category) {
        draggedApp.category = targetApp.category;
      }

      // Remove from original position
      updatedApps.splice(draggedIndex, 1);
      
      // Find new target index in the modified array
      const newTargetIndex = updatedApps.findIndex(a => a.id === targetId);
      
      // Insert
      updatedApps.splice(newTargetIndex, 0, draggedApp);

      // Re-index both categories
      const schoolApps = updatedApps.filter(a => a.category === 'school');
      schoolApps.forEach((app, i) => { app.order = i + 1; });

      const personalApps = updatedApps.filter(a => a.category === 'personal');
      personalApps.forEach((app, i) => { app.order = i + 1; });

      const newData = {
        ...data,
        apps: updatedApps
      };

      setData(newData);
      setSyncStatus('syncing');
      try {
        const result = await savePortalData(newData);
        if (result.success) {
          setSyncStatus('synced');
        } else {
          setSyncStatus('error');
          setSyncError(result.error);
        }
      } catch (err: any) {
        setSyncStatus('error');
        setSyncError(err.message || '저장 오류');
      }
    }

    setDraggedAppId(null);
    setDragOverAppId(null);
  };

  const handleColumnDrop = async (e: React.DragEvent, category: 'school' | 'personal') => {
    e.preventDefault();
    if (!draggedAppId) return;

    const updatedApps = [...data.apps];
    const draggedIndex = updatedApps.findIndex(a => a.id === draggedAppId);
    if (draggedIndex !== -1) {
      const draggedApp = updatedApps[draggedIndex];
      
      if (draggedApp.category !== category) {
        draggedApp.category = category;
        
        // Remove and append to end
        updatedApps.splice(draggedIndex, 1);
        updatedApps.push(draggedApp);

        // Re-index both
        const schoolApps = updatedApps.filter(a => a.category === 'school');
        schoolApps.forEach((app, i) => { app.order = i + 1; });

        const personalApps = updatedApps.filter(a => a.category === 'personal');
        personalApps.forEach((app, i) => { app.order = i + 1; });

        const newData = {
          ...data,
          apps: updatedApps
        };

        setData(newData);
        setSyncStatus('syncing');
        try {
          const result = await savePortalData(newData);
          if (result.success) {
            setSyncStatus('synced');
          } else {
            setSyncStatus('error');
            setSyncError(result.error);
          }
        } catch (err: any) {
          setSyncStatus('error');
          setSyncError(err.message || '저장 오류');
        }
      }
    }

    setDraggedAppId(null);
    setDragOverAppId(null);
  };

  const toggleThemeMode = async () => {
    const nextMode = currentMode === 'dark' ? 'light' : 'dark';
    const newConfig = {
      ...config,
      mode: nextMode
    };
    const newData = {
      ...data,
      config: newConfig
    };
    setData(newData);
    setSyncStatus('syncing');
    try {
      const result = await savePortalData(newData);
      if (result.success) {
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
        setSyncError(result.error);
      }
    } catch (err: any) {
      setSyncStatus('error');
      setSyncError(err.message || '저장 오류');
    }
  };

  // Load Initial Data
  useEffect(() => {
    async function loadData() {
      setSyncStatus('syncing');
      const result = await fetchPortalData();
      setData(result.data);
      setDataSource(result.source);
      if (result.error) {
        setSyncStatus('error');
        setSyncError(result.error);
      } else {
        setSyncStatus('synced');
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Force sync / reload data
  const handleRefreshSync = async () => {
    setSyncStatus('syncing');
    setSyncError(null);
    const result = await fetchPortalData();
    setData(result.data);
    setDataSource(result.source);
    if (result.error) {
      setSyncStatus('error');
      setSyncError(result.error);
    } else {
      setSyncStatus('synced');
    }
  };

  // Save configurations helper
  const handleSaveConfig = async (newConfig: PortalConfig) => {
    const updatedData = { ...data, config: newConfig };
    setData(updatedData);
    setSyncStatus('syncing');
    const result = await savePortalData(updatedData);
    setDataSource(result.source);
    if (result.error) {
      setSyncStatus('error');
      setSyncError(result.error);
    } else {
      setSyncStatus('synced');
    }
  };

  // Save app items list helper
  const handleSaveApps = async (newApps: VibeApp[]) => {
    const updatedData = { ...data, apps: newApps };
    setData(updatedData);
    setSyncStatus('syncing');
    const result = await savePortalData(updatedData);
    setDataSource(result.source);
    if (result.error) {
      setSyncStatus('error');
      setSyncError(result.error);
    } else {
      setSyncStatus('synced');
    }
  };

  const { config, apps } = data;
  const currentMode = config.mode || 'dark';
  const activeTheme = GET_THEME_CLASSES(config.themeId, currentMode);
  const isDark = currentMode === 'dark';
  const schoolCategoryName = config.schoolCategoryName || '학교 프로젝트';
  const personalCategoryName = config.personalCategoryName || '개인 프로젝트';

  // Filters apps based on active category tab, search query, and sorts by order
  const filteredApps = apps
    .filter(app => {
      const matchesCategory = activeTab === 'all' ? true : app.category === activeTab;
      
      const matchesSearch = 
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (app.tags && app.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (activeTab === 'all') {
        if (a.category !== b.category) {
          return a.category === 'school' ? -1 : 1;
        }
      }
      return a.order - b.order;
    });

  // Separate apps specifically for Compact Split layout
  const schoolAppsSplit = apps
    .filter(app => app.category === 'school' && 
      (app.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase()))))
    .sort((a, b) => a.order - b.order);

  const personalAppsSplit = apps
    .filter(app => app.category === 'personal' && 
      (app.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase()))))
    .sort((a, b) => a.order - b.order);

  // Tab counts
  const schoolCount = apps.filter(app => app.category === 'school').length;
  const personalCount = apps.filter(app => app.category === 'personal').length;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-300 font-sans">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <Database className="w-5 h-5 text-indigo-400 absolute animate-pulse" />
        </div>
        <p className="mt-4 text-xs font-mono text-neutral-400 tracking-widest uppercase">Initializing Portal Workspace...</p>
        <p className="mt-2 text-xs text-neutral-500">서버 동기화 상태를 확인하고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 font-sans ${activeTheme.bg}`}>
      
      {/* Dynamic Floating Subheader for warning if Supabase table or keys are missing */}
      {syncStatus === 'error' && syncError && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-500 text-xs px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-bounce" />
            <span className="font-medium">{syncError}</span>
          </div>
          <button 
            onClick={() => setShowGuide(true)}
            className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 rounded text-[10px] font-semibold transition-colors cursor-pointer"
          >
            설정 가이드 열기
          </button>
        </div>
      )}

      {/* Navigation Topbar */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-all duration-300 ${
        activeTheme.id === 'indigo' ? 'bg-[#0B132B]/80 border-blue-500/10 text-slate-100' :
        activeTheme.id === 'emerald' ? 'bg-[#051A14]/80 border-emerald-500/10 text-slate-100' :
        activeTheme.id === 'rosewood' ? 'bg-[#1A0A10]/80 border-rose-500/10 text-slate-100' :
        'bg-[#120F0D]/80 border-amber-500/10 text-slate-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Portal Title */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors duration-300 ${activeTheme.accentBg}`}>
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight md:text-base">
                {config.portalTitle || 'Vibe App Portal'}
              </h1>
              
              {/* Sync Badge */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                  dataSource === 'supabase' && syncStatus === 'synced' ? 'bg-emerald-500' :
                  dataSource === 'supabase' && syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' :
                  'bg-indigo-400'
                }`}></span>
                <span className="text-[10px] text-neutral-400 font-mono tracking-wider">
                  {dataSource === 'supabase' ? 'Supabase Synchronized' : 'Local Backup Active'}
                </span>
                <button 
                  onClick={handleRefreshSync}
                  title="서버와 동기화 새로고침"
                  className="p-0.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer ml-1"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Search bar & Controls */}
          <div className="flex items-center gap-3">
            
            {/* Search Input */}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="웹앱 이름 또는 태그 검색..."
                className={`pl-9 pr-4 py-1.5 rounded-full text-xs transition-all w-60 focus:w-72 outline-none border ${activeTheme.cardBg} ${activeTheme.border} text-slate-200 placeholder-slate-500`}
              />
            </div>

            {/* Supabase Guide button */}
            <button
              onClick={() => setShowGuide(true)}
              title="데이터 동기화 방법 확인"
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${activeTheme.cardBg} ${activeTheme.border} text-slate-300 hover:bg-neutral-800/40`}
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">백엔드 연동</span>
            </button>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleThemeMode}
              title={isDark ? '밝은 모드로 전환' : '어두운 모드로 전환'}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center transition-all duration-300 cursor-pointer ${activeTheme.cardBg} ${activeTheme.border} text-slate-300 hover:scale-[1.03]`}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Settings button in the top right */}
            <button
              onClick={() => setShowSettings(true)}
              id="settings-trigger-btn"
              className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer transition-all duration-300 ${activeTheme.primaryBtn}`}
            >
              <Settings className="w-4 h-4" />
              <span>포털 관리</span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Content Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Mobile Search input */}
        <div className="relative md:hidden mb-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="웹앱 이름 또는 태그 검색..."
            className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs outline-none border ${activeTheme.cardBg} ${activeTheme.border} text-slate-200 placeholder-slate-500`}
          />
        </div>

        {/* Categories Tab Selector */}
        <div className="flex justify-between items-center mb-8 border-b border-neutral-200/10 pb-4">
          <div className="flex gap-1.5 p-1 bg-neutral-950/40 border border-slate-800/40 rounded-xl flex-wrap">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'all'
                  ? `${activeTheme.accentBg} font-bold shadow-sm shadow-black/20`
                  : 'text-neutral-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              전체보기
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'all'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-neutral-800/60 text-neutral-500'
              }`}>
                {apps.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('school')}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'school'
                  ? `${activeTheme.accentBg} font-bold shadow-sm shadow-black/20`
                  : 'text-neutral-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-sky-400" />
              {schoolCategoryName}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'school'
                  ? 'bg-sky-500/15 text-sky-400'
                  : 'bg-neutral-800/60 text-neutral-500'
              }`}>
                {schoolCount}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'personal'
                  ? `${activeTheme.accentBg} font-bold shadow-sm shadow-black/20`
                  : 'text-neutral-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4 text-purple-400" />
              {personalCategoryName}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'personal'
                  ? 'bg-purple-500/15 text-purple-400'
                  : 'bg-neutral-800/60 text-neutral-500'
              }`}>
                {personalCount}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-neutral-500 font-medium hidden sm:block">
            정렬 기준: 지정된 순번 (오름차순)
          </div>
        </div>

        {/* Apps Render Container */}
        {filteredApps.length === 0 ? (
          
          /* Empty state */
          <div className="py-24 text-center max-w-md mx-auto">
            <div className="w-14 h-14 bg-neutral-200/5 border border-neutral-200/10 text-neutral-400 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Globe className="w-6 h-6 text-neutral-500" />
            </div>
            <h3 className={`text-base font-semibold ${activeTheme.text}`}>등록된 웹앱이 없습니다</h3>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              {searchQuery ? '검색어와 일치하는 웹앱 항목을 찾을 수 없습니다.' : '아직 이 카테고리에 등록한 바이브 코딩 앱이 없습니다.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowSettings(true)}
                className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-sm shadow-indigo-950/10"
              >
                첫 웹앱 등록하기
              </button>
            )}
          </div>

        ) : (
          
          /* Layout Rendering Dispatch */
          <AnimatePresence mode="wait">
            
            {/* GRID LAYOUT */}
            {config.layoutId === 'grid' && (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  if (activeTab) handleColumnDrop(e, activeTab);
                }}
              >
                {filteredApps.map((app) => (
                  <a
                    key={app.id}
                    href={app.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    draggable
                    onDragStart={(e) => handleDragStart(e, app.id)}
                    onDragOver={(e) => handleDragOver(e, app.id)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, app.id)}
                    className={`group p-6 rounded-2xl border transition-all duration-300 block relative hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/5 cursor-grab active:cursor-grabbing ${
                      draggedAppId === app.id ? 'opacity-35 border-dashed border-slate-600 scale-95 pointer-events-none' :
                      dragOverAppId === app.id ? 'scale-[1.03] border-indigo-500 shadow-lg shadow-indigo-500/20 border-double' :
                      `${activeTheme.cardBg} ${activeTheme.border}`
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={`p-3 rounded-xl transition-all group-hover:scale-110 ${
                        app.category === 'school' 
                          ? isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-700'
                          : isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-700'
                      }`}>
                        <DynamicIcon name={app.icon || 'Globe'} className="w-5 h-5" />
                      </div>
                      
                      {/* Priority display order indicator badge */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-neutral-500 font-semibold">
                          #{app.order}
                        </span>
                        <GripVertical className="w-4 h-4 text-slate-500/60 opacity-40 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className={`text-base font-semibold group-hover:text-indigo-500 transition-colors flex items-center gap-1.5 ${activeTheme.text}`}>
                        {app.title}
                        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-neutral-400 transition-opacity" />
                      </h3>
                      {app.description && (
                        <p className={`text-xs mt-2 leading-relaxed line-clamp-2 ${activeTheme.textMuted}`}>
                          {app.description}
                        </p>
                      )}
                    </div>

                    {/* Geometric Balance Order/Priority progress bar */}
                    <div className="h-1 w-full bg-slate-800 rounded-full mt-4">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          activeTheme.id === 'indigo' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                          activeTheme.id === 'emerald' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                          activeTheme.id === 'rosewood' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                          'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        }`}
                        style={{ width: `${Math.max(20, Math.min(100, 105 - Number(app.order) * 15))}%` }}
                      ></div>
                    </div>

                    {/* App tags */}
                    {app.tags && app.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-800">
                        {app.tags.map((tag, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium tracking-wide ${activeTheme.badge}`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </a>
                ))}
              </motion.div>
            )}

            {/* LIST FLOW LAYOUT */}
            {config.layoutId === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  if (activeTab) handleColumnDrop(e, activeTab);
                }}
              >
                {filteredApps.map((app) => (
                  <div
                    key={app.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, app.id)}
                    onDragOver={(e) => handleDragOver(e, app.id)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, app.id)}
                    className={`group p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 hover:shadow-md cursor-grab active:cursor-grabbing ${
                      draggedAppId === app.id ? 'opacity-35 border-dashed border-slate-600 scale-95 pointer-events-none' :
                      dragOverAppId === app.id ? 'scale-[1.01] border-indigo-500 shadow-md shadow-indigo-500/20 border-double' :
                      `${activeTheme.cardBg} ${activeTheme.border}`
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <GripVertical className="w-4 h-4 text-slate-500/60 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <div className={`p-3 rounded-lg ${
                          app.category === 'school' 
                            ? isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-700'
                            : isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-700'
                        }`}>
                          <DynamicIcon name={app.icon || 'Globe'} className="w-5 h-5" />
                        </div>
                      </div>
                      
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-neutral-400 font-semibold">#{app.order}</span>
                          <h3 className={`text-sm font-semibold truncate ${activeTheme.text}`}>{app.title}</h3>
                          
                          {/* Mini label indicator */}
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                            app.category === 'school' ? activeTheme.schoolBadge : activeTheme.personalBadge
                          }`}>
                            {app.category === 'school' ? 'SCHOOL' : 'PERSONAL'}
                          </span>
                        </div>
                        {app.description && (
                          <p className={`text-xs leading-relaxed line-clamp-1 ${activeTheme.textMuted}`}>
                            {app.description}
                          </p>
                        )}
                        {app.tags && app.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {app.tags.map((tag, i) => (
                              <span key={i} className="text-[10px] text-neutral-500 mr-2 font-mono">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center justify-end">
                      <a
                        href={app.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${activeTheme.primaryBtn}`}
                      >
                        <span>웹앱 바로가기</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* FEATURED FOCUS LAYOUT */}
            {config.layoutId === 'featured' && (
              <motion.div
                key="featured"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Left Side: Large Featured First App Card */}
                {filteredApps.length > 0 && (
                  <div className="lg:col-span-7 flex flex-col">
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, filteredApps[0].id)}
                      onDragOver={(e) => handleDragOver(e, filteredApps[0].id)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, filteredApps[0].id)}
                      className={`p-8 rounded-3xl border flex-1 flex flex-col justify-between transition-all duration-300 shadow-lg relative overflow-hidden group cursor-grab active:cursor-grabbing ${
                        draggedAppId === filteredApps[0].id ? 'opacity-35 border-dashed border-slate-600 scale-95 pointer-events-none' :
                        dragOverAppId === filteredApps[0].id ? 'scale-[1.02] border-indigo-500 shadow-lg shadow-indigo-500/20 border-double' :
                        `${activeTheme.cardBg} ${activeTheme.border}`
                      }`}
                    >
                      
                      {/* Highlight absolute design glow decor */}
                      <div className="absolute -right-24 -top-24 w-48 h-48 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-500"></div>
 
                       <div>
                         <div className="flex justify-between items-center">
                           <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase ${
                             filteredApps[0].category === 'school' ? activeTheme.schoolBadge : activeTheme.personalBadge
                           }`}>
                             🎯 최우선 추천 프로젝트
                           </span>
                           <div className="flex items-center gap-1.5">
                             <span className="font-mono text-xs text-neutral-400 font-bold">#{filteredApps[0].order} 순위</span>
                             <GripVertical className="w-4 h-4 text-slate-500/60 opacity-40 group-hover:opacity-100 transition-opacity" />
                           </div>
                         </div>

                        <div className="mt-8 flex items-center gap-4">
                          <div className={`p-4 rounded-2xl ${
                            filteredApps[0].category === 'school' 
                              ? isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-700'
                              : isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-700'
                          }`}>
                            <DynamicIcon name={filteredApps[0].icon || 'Globe'} className="w-8 h-8" />
                          </div>
                          <div>
                            <h2 className={`text-xl font-bold tracking-tight ${activeTheme.text}`}>
                              {filteredApps[0].title}
                            </h2>
                            <p className="text-xs text-neutral-400 mt-1 truncate max-w-sm">{filteredApps[0].link}</p>
                          </div>
                        </div>

                        <p className={`text-sm mt-6 leading-relaxed ${activeTheme.textMuted}`}>
                          {filteredApps[0].description || '별도의 세부 설명이 지정되지 않은 웹앱 프로젝트 포털 항목입니다. 바로가기 버튼을 통해 앱 작동을 확인하실 수 있습니다.'}
                        </p>

                        {filteredApps[0].tags && filteredApps[0].tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-8">
                            {filteredApps[0].tags.map((tag, i) => (
                              <span key={i} className={`px-3 py-1 rounded-md text-xs font-semibold ${activeTheme.badge}`}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-12 pt-6 border-t border-neutral-200/5 flex items-center justify-between">
                        <span className="text-[11px] text-neutral-500 font-medium">실시간 동기화 상태: 완료</span>
                        <a
                          href={filteredApps[0].link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md hover:scale-[1.02] cursor-pointer ${activeTheme.primaryBtn}`}
                        >
                          <span>지금 바로 웹앱 실행하기</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Right Side: Scrollable simpler vertical checklist of other apps */}
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">포털 대시보드 리스트</h3>
                  
                  {filteredApps.slice(1).length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-neutral-200/10 text-center text-xs text-neutral-500">
                      그 외 등록된 다른 웹앱이 존재하지 않습니다.
                    </div>
                  ) : (
                    filteredApps.slice(1).map((app) => (
                      <a
                        key={app.id}
                        href={app.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onDragOver={(e) => handleDragOver(e, app.id)}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, app.id)}
                        className={`group p-4 rounded-xl border flex items-center justify-between gap-3 transition-all duration-300 hover:translate-x-1.5 cursor-grab active:cursor-grabbing ${
                          draggedAppId === app.id ? 'opacity-35 border-dashed border-slate-600 scale-95 pointer-events-none' :
                          dragOverAppId === app.id ? 'scale-[1.02] border-indigo-500 shadow-lg shadow-indigo-500/20 border-double' :
                          `${activeTheme.cardBg} ${activeTheme.border}`
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <GripVertical className="w-4 h-4 text-slate-500/60 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          <div className={`p-2 rounded-lg flex-shrink-0 ${
                            app.category === 'school' 
                              ? isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-700'
                              : isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-700'
                          }`}>
                            <DynamicIcon name={app.icon || 'Globe'} className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className={`text-xs font-semibold truncate ${activeTheme.text}`}>{app.title}</h4>
                            <span className="text-[10px] text-neutral-500 font-mono">#{app.order} 순번</span>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                      </a>
                    ))
                  )}
                </div>

              </motion.div>
            )}

            {/* COMPACT SPLIT LAYOUT (학교 / 개인 좌우 2단 분할 레이아웃) */}
            {config.layoutId === 'split' && (
              <motion.div
                key="split"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`grid grid-cols-1 ${activeTab === 'all' ? 'md:grid-cols-2' : ''} gap-8`}
              >
                
                {/* School Column */}
                {(activeTab === 'all' || activeTab === 'school') && (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleColumnDrop(e, 'school')}
                    className="space-y-4 p-4 rounded-2xl bg-neutral-900/5 dark:bg-neutral-950/20 border border-transparent hover:border-sky-500/10 hover:bg-sky-500/5 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-200/10 pb-3">
                      <h3 className={`text-sm font-bold flex items-center gap-2 ${activeTheme.text}`}>
                        <GraduationCap className="w-4 h-4 text-sky-400" />
                        {schoolCategoryName} 포털 ({schoolAppsSplit.length})
                      </h3>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">School Works</span>
                    </div>

                    <div className="space-y-3.5">
                      {schoolAppsSplit.length === 0 ? (
                        <div className="p-8 rounded-xl border border-dashed border-neutral-200/10 text-center text-xs text-neutral-500">
                          {schoolCategoryName} 탭에 일치하는 웹앱이 없습니다.
                        </div>
                      ) : (
                        schoolAppsSplit.map((app) => (
                          <a
                            key={app.id}
                            href={app.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            draggable
                            onDragStart={(e) => handleDragStart(e, app.id)}
                            onDragOver={(e) => handleDragOver(e, app.id)}
                            onDragEnd={handleDragEnd}
                            onDrop={(e) => handleDrop(e, app.id)}
                            className={`group p-4 rounded-xl border block transition-all duration-300 hover:shadow-md hover:border-sky-500/30 cursor-grab active:cursor-grabbing ${
                              draggedAppId === app.id ? 'opacity-35 border-dashed border-slate-600 scale-95 pointer-events-none' :
                              dragOverAppId === app.id ? 'scale-[1.02] border-sky-500 shadow-lg shadow-sky-500/20 border-double' :
                              `${activeTheme.cardBg} ${activeTheme.border}`
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <GripVertical className="w-3.5 h-3.5 text-slate-500/60 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0 animate-pulse" />
                                <DynamicIcon name={app.icon || 'Globe'} className="w-4 h-4 text-sky-400" />
                                <h4 className={`text-xs font-semibold truncate ${activeTheme.text}`}>{app.title}</h4>
                              </div>
                              <span className="font-mono text-[9px] text-neutral-500">#{app.order}</span>
                            </div>
                            {app.description && (
                              <p className="text-[11px] text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                                {app.description}
                              </p>
                            )}
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Personal Column */}
                {(activeTab === 'all' || activeTab === 'personal') && (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleColumnDrop(e, 'personal')}
                    className="space-y-4 p-4 rounded-2xl bg-neutral-900/5 dark:bg-neutral-950/20 border border-transparent hover:border-violet-500/10 hover:bg-violet-500/5 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-200/10 pb-3">
                      <h3 className={`text-sm font-bold flex items-center gap-2 ${activeTheme.text}`}>
                        <Globe className="w-4 h-4 text-violet-400" />
                        {personalCategoryName} 포털 ({personalAppsSplit.length})
                      </h3>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Personal Side</span>
                    </div>

                    <div className="space-y-3.5">
                      {personalAppsSplit.length === 0 ? (
                        <div className="p-8 rounded-xl border border-dashed border-neutral-200/10 text-center text-xs text-neutral-500">
                          {personalCategoryName} 탭에 일치하는 웹앱이 없습니다.
                        </div>
                      ) : (
                        personalAppsSplit.map((app) => (
                          <a
                            key={app.id}
                            href={app.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            draggable
                            onDragStart={(e) => handleDragStart(e, app.id)}
                            onDragOver={(e) => handleDragOver(e, app.id)}
                            onDragEnd={handleDragEnd}
                            onDrop={(e) => handleDrop(e, app.id)}
                            className={`group p-4 rounded-xl border block transition-all duration-300 hover:shadow-md hover:border-violet-500/30 cursor-grab active:cursor-grabbing ${
                              draggedAppId === app.id ? 'opacity-35 border-dashed border-slate-600 scale-95 pointer-events-none' :
                              dragOverAppId === app.id ? 'scale-[1.02] border-violet-500 shadow-lg shadow-violet-500/20 border-double' :
                              `${activeTheme.cardBg} ${activeTheme.border}`
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <GripVertical className="w-3.5 h-3.5 text-slate-500/60 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0 animate-pulse" />
                                <DynamicIcon name={app.icon || 'Globe'} className="w-4 h-4 text-violet-400" />
                                <h4 className={`text-xs font-semibold truncate ${activeTheme.text}`}>{app.title}</h4>
                              </div>
                              <span className="font-mono text-[9px] text-neutral-500">#{app.order}</span>
                            </div>
                            {app.description && (
                              <p className="text-[11px] text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                                {app.description}
                              </p>
                            )}
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>

      {/* Footer Branding (Subtle, humble, elegant) */}
      <footer className="py-8 mt-auto border-t border-neutral-200/5 text-center text-[11px] text-neutral-500 max-w-7xl w-full mx-auto px-4">
        <p>© 2026 {config.portalTitle || 'Vibe App Coding Portal'}. All rights reserved.</p>
        <p className="mt-1 font-mono text-[10px] text-neutral-600">
          Built with React & Supabase Backend • Deployed on Vercel
        </p>
      </footer>

      {/* Sidebar Overlay Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            
            {/* Sidebar drawer container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 h-full w-full max-w-md"
            >
              <SettingsPanel
                config={config}
                apps={apps}
                onSaveConfig={handleSaveConfig}
                onSaveApps={handleSaveApps}
                onClose={() => setShowSettings(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Supabase Guide Modal */}
      <AnimatePresence>
        {showGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGuide(false)}
              className="absolute inset-0 bg-black cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-neutral-950 text-neutral-100 rounded-2xl max-w-lg w-full border border-neutral-800 shadow-2xl z-10 overflow-hidden"
            >
              <SupabaseGuide onClose={() => setShowGuide(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
