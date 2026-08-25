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
  Moon,
  Upload,
  Image as ImageIcon,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Copy
} from 'lucide-react';

import { 
  VibeApp, 
  PortalConfig, 
  PortalData, 
  CategoryTab, 
  GET_THEME_CLASSES, 
  DEFAULT_THEMES, 
  INITIAL_DATA 
} from './types';
import { 
  fetchPortalData, 
  savePortalData, 
  subscribeToPortalData,
  isSupabaseConfigured,
  SQL_CREATION_SCRIPT 
} from './lib/supabase';
import { compressImageFile, purgeLargeThumbnails } from './lib/imageUtils';
import SettingsPanel from './components/SettingsPanel';
import SupabaseGuide from './components/SupabaseGuide';
import DynamicIcon from './components/DynamicIcon';
import AdminPasswordModal from './components/AdminPasswordModal';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortalData>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual & Real-time Sync UI States
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncCompletedRecently, setSyncCompletedRecently] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const [copiedSqlInBanner, setCopiedSqlInBanner] = useState(false);

  const handleCopySqlFromBanner = async () => {
    try {
      await navigator.clipboard.writeText(SQL_CREATION_SCRIPT);
      setCopiedSqlInBanner(true);
      setSyncToastMessage('📋 SQL 스크립트가 클립보드에 복사되었습니다! Supabase SQL Editor에 붙여넣고 Run을 눌러주세요.');
      setTimeout(() => setCopiedSqlInBanner(false), 3000);
    } catch {
      setShowGuide(true);
    }
  };
  
  // Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vibe_portal_admin_auth') === 'true' || 
             sessionStorage.getItem('vibe_portal_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalTitle, setPasswordModalTitle] = useState<string>('관리자 인증이 필요합니다');
  const [passwordModalDesc, setPasswordModalDesc] = useState<string>('포털 설정 및 웹앱 관리를 위해 관리자 비밀번호를 입력해 주세요.');
  const [pendingAdminAction, setPendingAdminAction] = useState<(() => void) | null>(null);

  // Helper to guard admin actions
  const requireAdmin = (action: () => void, title?: string, desc?: string) => {
    // If lockAdmin is explicitly disabled or password is empty, permit immediately
    if (data.config.lockAdmin === false || !data.config.adminPassword) {
      action();
      return;
    }

    if (isAdminAuthenticated) {
      action();
    } else {
      if (title) setPasswordModalTitle(title);
      if (desc) setPasswordModalDesc(desc);
      setPendingAdminAction(() => action);
      setShowPasswordModal(true);
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    setShowPasswordModal(false);
    if (pendingAdminAction) {
      pendingAdminAction();
      setPendingAdminAction(null);
    }
  };

  const handleAdminLock = () => {
    setIsAdminAuthenticated(false);
    try {
      localStorage.removeItem('vibe_portal_admin_auth');
      sessionStorage.removeItem('vibe_portal_admin_auth');
    } catch {}
    setShowSettings(false);
  };

  // Modals & Panels
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'general' | 'apps'>('general');
  const [settingsEditingAppId, setSettingsEditingAppId] = useState<string | null>(null);

  const handleOpenAppEdit = (appId: string) => {
    requireAdmin(() => {
      setSettingsInitialTab('apps');
      setSettingsEditingAppId(appId);
      setShowSettings(true);
    }, '웹앱 세부사항 수정', '이 웹앱의 정보 및 링크를 수정하려면 관리자 비밀번호를 입력해 주세요.');
  };
  
  // Sync Statuses
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');

  // Drag & Drop Reordering States
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverAppId, setDragOverAppId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const isDraggingFromHandleRef = React.useRef<string | null>(null);

  // Drag & Drop Category States
  const [draggedCatId, setDraggedCatId] = useState<string | null>(null);
  const [dragOverCatId, setDragOverCatId] = useState<string | null>(null);
  const [dragOverCatPosition, setDragOverCatPosition] = useState<'before' | 'after' | null>(null);

  // Drag & Drop Image/Thumbnail States
  const [dragOverImageAppId, setDragOverImageAppId] = useState<string | null>(null);

  // Synchronously reset handle dragging reference on window release
  useEffect(() => {
    const handleGlobalRelease = () => {
      isDraggingFromHandleRef.current = null;
    };
    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    return () => {
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
    };
  }, []);

  const handleCatDragStart = (e: React.DragEvent, id: string) => {
    if (data.config.lockAdmin !== false && !isAdminAuthenticated) {
      e.preventDefault();
      requireAdmin(() => {}, '카테고리 순서 변경', '카테고리 순서를 변경하려면 관리자 비밀번호를 입력해 주세요.');
      return;
    }
    setDraggedCatId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCatDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id === draggedCatId) {
      setDragOverCatId(null);
      setDragOverCatPosition(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const position = mouseX > rect.width / 2 ? 'after' : 'before';

    if (dragOverCatId !== id || dragOverCatPosition !== position) {
      setDragOverCatId(id);
      setDragOverCatPosition(position);
    }
  };

  const handleCatDragEnd = () => {
    setDraggedCatId(null);
    setDragOverCatId(null);
    setDragOverCatPosition(null);
  };

  const handleCatDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedCatId || draggedCatId === targetId) {
      setDraggedCatId(null);
      setDragOverCatId(null);
      setDragOverCatPosition(null);
      return;
    }

    const updatedCategories = [...categories];
    const draggedIndex = updatedCategories.findIndex(c => c.id === draggedCatId);
    if (draggedIndex !== -1) {
      const [draggedCat] = updatedCategories.splice(draggedIndex, 1);
      const targetIndex = updatedCategories.findIndex(c => c.id === targetId);
      
      let insertIndex = targetIndex;
      if (dragOverCatPosition === 'after') {
        insertIndex = targetIndex + 1;
      }
      updatedCategories.splice(insertIndex, 0, draggedCat);

      // Save updated categories to config
      await handleSaveConfig({
        ...config,
        categories: updatedCategories
      });
    }

    setDraggedCatId(null);
    setDragOverCatId(null);
    setDragOverCatPosition(null);
  };

  const handleCardDragEnter = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedAppId) {
      if (id !== draggedAppId && dragOverAppId !== id) {
        setDragOverAppId(id);
      }
    } else {
      const types = e.dataTransfer.types;
      const isExternalDrag = types.includes('Files') || types.includes('text/html') || types.includes('text/uri-list') || types.includes('text/plain');
      if (isExternalDrag) {
        setDragOverImageAppId(id);
      }
    }
  };

  const handleCardDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (!draggedAppId) {
      const types = e.dataTransfer.types;
      const isExternalDrag = types.includes('Files') || types.includes('text/html') || types.includes('text/uri-list') || types.includes('text/plain');
      if (isExternalDrag && dragOverImageAppId !== id) {
        setDragOverImageAppId(id);
      }
    } else {
      if (id === draggedAppId) {
        setDragOverAppId(null);
        setDragOverPosition(null);
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const isHorizontal = config.layoutId === 'grid' || config.layoutId === 'split';
      
      let position: 'before' | 'after' = 'before';
      if (isHorizontal) {
        const mouseX = e.clientX - rect.left;
        if (mouseX > rect.width / 2) {
          position = 'after';
        }
      } else {
        const mouseY = e.clientY - rect.top;
        if (mouseY > rect.height / 2) {
          position = 'after';
        }
      }

      if (dragOverAppId !== id || dragOverPosition !== position) {
        setDragOverAppId(id);
        setDragOverPosition(position);
      }
    }
  };

  const handleCardDragLeave = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    // Prevent false leaves when hovering over child elements
    if (e.currentTarget && e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    if (draggedAppId) {
      if (dragOverAppId === id) {
        setDragOverAppId(null);
        setDragOverPosition(null);
      }
    } else {
      if (dragOverImageAppId === id) {
        setDragOverImageAppId(null);
      }
    }
  };

  const updateAppThumbnail = async (appId: string, thumbnail: string) => {
    const updatedApps = data.apps.map(app => {
      if (app.id === appId) {
        return { ...app, thumbnail };
      }
      return app;
    });

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
  };

  const handleCardDrop = async (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverImageAppId(null);

    if (draggedAppId) {
      await handleDrop(e, id);
      return;
    }

    let imageUrl = '';

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        try {
          // Fast client-side compression to lightweight WebP/JPEG
          const compressed = await compressImageFile(file, 600, 600, 0.85);
          await updateAppThumbnail(id, compressed);
        } catch {
          const reader = new FileReader();
          reader.onload = async () => {
            await updateAppThumbnail(id, reader.result as string);
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }

    const uriList = e.dataTransfer.getData('text/uri-list');
    if (uriList) {
      imageUrl = uriList.split('\n')[0].trim();
    }

    if (!imageUrl) {
      const html = e.dataTransfer.getData('text/html');
      if (html) {
        const match = html.match(/<img[^>]+src="([^">]+)"/i);
        if (match && match[1]) {
          imageUrl = match[1];
        }
      }
    }

    if (!imageUrl) {
      const plainText = e.dataTransfer.getData('text');
      if (plainText && (plainText.startsWith('http://') || plainText.startsWith('https://') || plainText.startsWith('data:image/'))) {
        imageUrl = plainText.trim();
      }
    }

    if (imageUrl) {
      await updateAppThumbnail(id, imageUrl);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (data.config.lockAdmin !== false && !isAdminAuthenticated) {
      e.preventDefault();
      requireAdmin(() => {}, '웹앱 순서 변경', '웹앱 카드의 우선순위를 변경하려면 관리자 비밀번호를 입력해 주세요.');
      return;
    }
    setDraggedAppId(id);
    setIsDraggingState(true);
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
    setDragOverPosition(null);
    setDragActiveId(null);
    isDraggingFromHandleRef.current = null;
    setTimeout(() => {
      setIsDraggingState(false);
    }, 100);
  };

  const handleCardClick = (e: React.MouseEvent, link: string) => {
    if (isDraggingState || draggedAppId) {
      e.preventDefault();
      return;
    }
    window.open(link, '_blank');
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedAppId || draggedAppId === targetId) {
      setDraggedAppId(null);
      setDragOverAppId(null);
      setDragOverPosition(null);
      return;
    }

    // Determine target drop position synchronously from mouse coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const isHorizontal = config.layoutId === 'grid' || config.layoutId === 'split';
    let dropPosition: 'before' | 'after' = 'before';
    if (isHorizontal) {
      const mouseX = e.clientX - rect.left;
      if (mouseX > rect.width / 2) {
        dropPosition = 'after';
      }
    } else {
      const mouseY = e.clientY - rect.top;
      if (mouseY > rect.height / 2) {
        dropPosition = 'after';
      }
    }

    // Clone all apps
    const allApps = data.apps.map(app => ({ ...app }));
    const draggedApp = allApps.find(a => a.id === draggedAppId);
    const targetApp = allApps.find(a => a.id === targetId);

    if (!draggedApp || !targetApp) {
      setDraggedAppId(null);
      setDragOverAppId(null);
      setDragOverPosition(null);
      return;
    }

    const targetCategory = targetApp.category;
    draggedApp.category = targetCategory;

    // Filter out dragged app from target category's list
    const targetCategoryApps = allApps
      .filter(a => a.category === targetCategory && a.id !== draggedApp.id)
      .sort((a, b) => a.order - b.order);

    const targetIdx = targetCategoryApps.findIndex(a => a.id === targetId);
    const insertIdx = (dropPosition === 'after' && targetIdx !== -1) ? targetIdx + 1 : (targetIdx === -1 ? targetCategoryApps.length : targetIdx);

    targetCategoryApps.splice(insertIdx, 0, draggedApp);

    // Reassign order strictly 1, 2, 3...
    targetCategoryApps.forEach((app, i) => {
      app.order = i + 1;
    });

    // Reconstruct full list preserving other categories
    const otherApps = allApps.filter(a => a.category !== targetCategory && a.id !== draggedApp.id);
    const defaultCategories: CategoryTab[] = [
      { id: 'school', name: data.config.schoolCategoryName || '학교 프로젝트', icon: 'GraduationCap' },
      { id: 'personal', name: data.config.personalCategoryName || '개인 프로젝트', icon: 'Globe' }
    ];
    const categories = data.config.categories && data.config.categories.length > 0 ? data.config.categories : defaultCategories;

    const finalApps: VibeApp[] = [];
    categories.forEach((cat) => {
      if (cat.id === targetCategory) {
        finalApps.push(...targetCategoryApps);
      } else {
        const catApps = otherApps.filter(a => a.category === cat.id).sort((a, b) => a.order - b.order);
        catApps.forEach((app, i) => { app.order = i + 1; });
        finalApps.push(...catApps);
      }
    });

    const knownIds = categories.map(c => c.id);
    const restApps = otherApps.filter(a => !knownIds.includes(a.category));
    finalApps.push(...restApps);

    const newData: PortalData = {
      ...data,
      apps: finalApps
    };

    // Update state immediately so UI responds on first drop
    setData(newData);
    setDraggedAppId(null);
    setDragOverAppId(null);
    setDragOverPosition(null);
    setSyncStatus('syncing');

    // Save to persistence
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

  const handleColumnDrop = async (e: React.DragEvent, category: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedAppId) return;

    const allApps = data.apps.map(app => ({ ...app }));
    const draggedApp = allApps.find(a => a.id === draggedAppId);
    if (!draggedApp) return;

    draggedApp.category = category;

    const defaultCategories: CategoryTab[] = [
      { id: 'school', name: data.config.schoolCategoryName || '학교 프로젝트', icon: 'GraduationCap' },
      { id: 'personal', name: data.config.personalCategoryName || '개인 프로젝트', icon: 'Globe' }
    ];
    const categories = data.config.categories && data.config.categories.length > 0 ? data.config.categories : defaultCategories;

    const finalApps: VibeApp[] = [];
    categories.forEach((cat) => {
      const catApps = allApps.filter(a => a.category === cat.id && a.id !== draggedApp.id).sort((a, b) => a.order - b.order);
      if (cat.id === category) {
        catApps.push(draggedApp);
      }
      catApps.forEach((app, i) => { app.order = i + 1; });
      finalApps.push(...catApps);
    });

    const knownIds = categories.map(c => c.id);
    const restApps = allApps.filter(a => !knownIds.includes(a.category) && a.id !== draggedApp.id);
    finalApps.push(...restApps);

    const newData: PortalData = {
      ...data,
      apps: finalApps
    };

    setData(newData);
    setDraggedAppId(null);
    setDragOverAppId(null);
    setDragOverPosition(null);
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

  // Load Initial Data & Real-time Auto Sync across devices
  useEffect(() => {
    async function loadData() {
      setSyncStatus('syncing');
      const result = await fetchPortalData();
      
      // Auto-optimize any heavy thumbnails in loaded data
      if (result.data && Array.isArray(result.data.apps)) {
        const { apps: optimizedApps, purgedCount } = await purgeLargeThumbnails(result.data.apps);
        if (purgedCount > 0) {
          result.data.apps = optimizedApps;
          savePortalData(result.data); // save lightweight back
        }
      }

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

    // Subscribe to live Postgres changes for real-time multi-device sync
    const unsubscribe = subscribeToPortalData((freshData) => {
      setData(freshData);
      setDataSource('supabase');
      setSyncStatus('synced');
      setSyncCompletedRecently(true);
      setTimeout(() => setSyncCompletedRecently(false), 3000);
    });

    // Auto-refresh when tab/window becomes active (e.g. switching between phone/PC/laptop)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchPortalData().then(res => {
          if (res.data) {
            setData(res.data);
            setDataSource(res.source);
            if (!res.error) {
              setSyncStatus('synced');
            }
          }
        });
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, []);

  // Manual Force sync handler with distinct visual feedback
  const handleManualSync = async () => {
    if (isManualSyncing) return;
    setIsManualSyncing(true);
    setSyncStatus('syncing');
    setSyncError(null);
    setSyncCompletedRecently(false);

    const startTime = Date.now();
    try {
      const result = await fetchPortalData();
      
      // Ensure minimum 600ms so user can comfortably see the rotation animation
      const elapsed = Date.now() - startTime;
      if (elapsed < 600) {
        await new Promise(resolve => setTimeout(resolve, 600 - elapsed));
      }

      setData(result.data);
      setDataSource(result.source);
      
      if (result.error) {
        setSyncStatus('error');
        setSyncError(result.error);
        setSyncToastMessage('⚠️ 동기화 실패: ' + result.error);
      } else {
        setSyncStatus('synced');
        setSyncCompletedRecently(true);
        setSyncToastMessage(`☁️ 최신 데이터(${result.data.apps.length}개 웹앱) 동기화 완료!`);
      }
    } catch (err: any) {
      setSyncStatus('error');
      setSyncError(err.message || '동기화 중 오류가 발생했습니다.');
      setSyncToastMessage('⚠️ 동기화 중 오류가 발생했습니다.');
    } finally {
      setIsManualSyncing(false);
      setTimeout(() => {
        setSyncCompletedRecently(false);
      }, 3500);
      setTimeout(() => {
        setSyncToastMessage(null);
      }, 3500);
    }
  };

  // Force sync / reload data
  const handleRefreshSync = () => {
    handleManualSync();
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

  // Dynamic Categories Definition
  const defaultCategories: CategoryTab[] = [
    { id: 'school', name: schoolCategoryName, icon: 'GraduationCap' },
    { id: 'personal', name: personalCategoryName, icon: 'Globe' }
  ];
  const categories = config.categories && config.categories.length > 0 ? config.categories : defaultCategories;

  // Helper to determine theme accents by category
  const getCategoryStyles = (catId: string) => {
    const isSchool = catId === 'school';
    const isPersonal = catId === 'personal';
    
    if (isSchool) {
      return {
        hoverBorder: isDark ? 'hover:border-sky-500/40' : 'hover:border-sky-400 hover:shadow-sky-100',
        iconBg: isDark ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 group-hover:shadow-[0_0_12px_rgba(56,189,248,0.15)]' : 'bg-sky-50 text-sky-700 border-sky-200 shadow-sm',
        progressBar: 'bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]',
        tag: isDark ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20' : 'bg-sky-50 text-sky-800 border border-sky-200 font-semibold',
        badge: activeTheme.schoolBadge,
        activeBorder: 'border-sky-500 shadow-sky-500/20',
        accentColor: isDark ? 'text-sky-400' : 'text-sky-600'
      };
    } else if (isPersonal) {
      return {
        hoverBorder: isDark ? 'hover:border-purple-500/40' : 'hover:border-purple-400 hover:shadow-purple-100',
        iconBg: isDark ? 'bg-violet-500/10 text-violet-400 border-violet-500/20 group-hover:shadow-[0_0_12px_rgba(167,139,250,0.15)]' : 'bg-violet-50 text-violet-700 border-violet-200 shadow-sm',
        progressBar: 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]',
        tag: isDark ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20' : 'bg-violet-50 text-violet-800 border border-violet-200 font-semibold',
        badge: activeTheme.personalBadge,
        activeBorder: 'border-violet-500 shadow-violet-500/20',
        accentColor: isDark ? 'text-violet-400' : 'text-violet-600'
      };
    } else {
      return {
        hoverBorder: isDark ? 'hover:border-emerald-500/40' : 'hover:border-emerald-400 hover:shadow-emerald-100',
        iconBg: isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.15)]' : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm',
        progressBar: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
        tag: isDark ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold',
        badge: isDark ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold',
        activeBorder: 'border-emerald-500 shadow-emerald-500/20',
        accentColor: isDark ? 'text-emerald-400' : 'text-emerald-600'
      };
    }
  };

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
          const aIndex = categories.findIndex(c => c.id === a.category);
          const bIndex = categories.findIndex(c => c.id === b.category);
          const aOrder = aIndex !== -1 ? aIndex : 999;
          const bOrder = bIndex !== -1 ? bIndex : 999;
          return aOrder - bOrder;
        }
      }
      return a.order - b.order;
    });

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
    <div className={`min-h-screen flex flex-col transition-colors duration-300 font-sans relative overflow-hidden ${activeTheme.bg}`}>
      
      {/* Premium Background Ambient Glow */}
      <div className="absolute top-0 inset-x-0 h-[600px] overflow-hidden pointer-events-none -z-10">
        <div className={`absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[160px] opacity-[0.12] transition-all duration-1000 ${
          activeTheme.id === 'indigo' ? 'bg-blue-500' :
          activeTheme.id === 'emerald' ? 'bg-emerald-500' :
          activeTheme.id === 'rosewood' ? 'bg-rose-500' :
          'bg-amber-500'
        }`}></div>
        <div className={`absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.08] transition-all duration-1000 ${
          activeTheme.id === 'indigo' ? 'bg-indigo-500' :
          activeTheme.id === 'emerald' ? 'bg-teal-500' :
          activeTheme.id === 'rosewood' ? 'bg-pink-500' :
          'bg-yellow-500'
        }`}></div>
      </div>
      
      {/* Dynamic Floating Subheader for warning if Supabase table or keys are missing */}
      {syncStatus === 'error' && syncError && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 animate-pulse" />
            <span className="font-medium truncate">{syncError}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCopySqlFromBanner}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              {copiedSqlInBanner ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">SQL 복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>1초 만에 SQL 복사</span>
                </>
              )}
            </button>
            <button 
              onClick={() => setShowGuide(true)}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>연동 가이드</span>
            </button>
            <button 
              onClick={handleManualSync}
              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
              <span>동기화 다시 시도</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation Topbar */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-all duration-300 ${
        isDark 
          ? (activeTheme.id === 'indigo' ? 'bg-[#0B132B]/85 border-blue-500/10 text-slate-100' :
             activeTheme.id === 'emerald' ? 'bg-[#051A14]/85 border-emerald-500/10 text-slate-100' :
             activeTheme.id === 'rosewood' ? 'bg-[#1A0A10]/85 border-rose-500/10 text-slate-100' :
             'bg-[#120F0D]/85 border-amber-500/10 text-slate-100')
          : 'bg-white/90 border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Portal Title */}
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg transition-all duration-300 ${activeTheme.accentBg} flex items-center justify-center w-9 h-9 shadow-md`}>
              <svg className="w-6 h-6" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" opacity="0.3" />
                <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="2" strokeDasharray="5,3" opacity="0.5" />
                <path d="M 30,35 L 45,65 C 47,70 53,70 55,65 L 70,35" stroke="url(#headerGrad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="50" cy="46" r="6" fill="#f43f5e" />
              </svg>
            </div>
            <div>
              <h1 className={`text-sm font-extrabold tracking-tight md:text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {config.portalTitle || 'Vibe App Portal'}
              </h1>
              
              {/* Sync Badge */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                  dataSource === 'supabase' && syncStatus === 'synced' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
                  dataSource === 'supabase' && syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' :
                  syncStatus === 'error' ? 'bg-rose-500' :
                  'bg-indigo-400'
                }`}></span>
                <span className={`text-[10px] font-mono tracking-wider font-medium ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  {dataSource === 'supabase' ? (isManualSyncing ? '동기화 진행 중...' : 'Supabase 실시간 연동') : '로컬 백업 모드'}
                </span>
                <button 
                  onClick={handleManualSync}
                  title="실시간 연동 데이터 새로고침"
                  className={`p-0.5 rounded transition-colors cursor-pointer ml-0.5 ${isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isManualSyncing || syncStatus === 'syncing' ? 'animate-spin text-sky-500' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Search bar & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Search Input */}
            <div className="relative hidden md:block">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="웹앱 이름 또는 태그 검색..."
                className={`pl-9 pr-4 py-1.5 rounded-full text-xs transition-all w-52 lg:w-64 focus:w-72 outline-none border ${
                  isDark 
                    ? `${activeTheme.cardBg} ${activeTheme.border} text-slate-200 placeholder-slate-500` 
                    : 'bg-slate-100/90 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-400 shadow-inner'
                }`}
              />
            </div>

            {/* Dedicated Real-time Manual Sync Button */}
            <button
              onClick={handleManualSync}
              disabled={isManualSyncing}
              title="클릭 시 모든 기기(집, 학교, 노트북, 스마트폰)의 최신 데이터 실시간 연동 및 동기화"
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all duration-300 cursor-pointer shadow-sm ${
                isManualSyncing
                  ? 'bg-sky-500/20 border-sky-500/60 text-sky-400 ring-2 ring-sky-500/30'
                  : syncCompletedRecently
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-500 ring-2 ring-emerald-500/30'
                  : syncStatus === 'error'
                  ? 'bg-rose-500/20 border-rose-500/60 text-rose-500'
                  : isDark 
                  ? `${activeTheme.cardBg} ${activeTheme.border} text-slate-200 hover:bg-neutral-800/80 hover:border-sky-500/40 hover:text-white`
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 flex-shrink-0 ${
                  isManualSyncing
                    ? 'animate-spin text-sky-500'
                    : syncCompletedRecently
                    ? 'text-emerald-500'
                    : isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              />
              <span className="whitespace-nowrap">
                {isManualSyncing
                  ? '동기화 중...'
                  : syncCompletedRecently
                  ? '동기화 완료'
                  : syncStatus === 'error'
                  ? '동기화 재시도'
                  : '실시간 연동'}
              </span>
            </button>

            {/* Supabase Guide button */}
            <button
              onClick={() => setShowGuide(true)}
              title="데이터 동기화 방법 확인"
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark 
                  ? `${activeTheme.cardBg} ${activeTheme.border} text-slate-300 hover:bg-neutral-800/40`
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
              }`}
            >
              <Database className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
              <span className="hidden xl:inline">백엔드 연동</span>
            </button>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleThemeMode}
              title={isDark ? '밝은 모드로 전환' : '어두운 모드로 전환'}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center transition-all duration-300 cursor-pointer ${
                isDark 
                  ? `${activeTheme.cardBg} ${activeTheme.border} text-slate-300 hover:scale-[1.03]`
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm hover:scale-[1.03]'
              }`}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Admin status toggle if authenticated */}
            {data.config.lockAdmin !== false && isAdminAuthenticated && (
              <button
                onClick={handleAdminLock}
                title="관리자 모드 잠그기 (방문자 화면 테스트)"
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDark 
                    ? `${activeTheme.cardBg} border-amber-500/40 text-amber-400 hover:bg-amber-500/10`
                    : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 shadow-sm'
                }`}
              >
                <Unlock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">관리자 인증됨 (잠금)</span>
              </button>
            )}

            {/* Settings button in the top right */}
            <button
              onClick={() => {
                requireAdmin(() => {
                  setSettingsInitialTab('general');
                  setSettingsEditingAppId(null);
                  setShowSettings(true);
                }, '포털 설정 관리자', '포털 정보 및 설정을 변경하려면 관리자 비밀번호를 입력해 주세요.');
              }}
              id="settings-trigger-btn"
              className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer transition-all duration-300 ${activeTheme.primaryBtn}`}
            >
              {data.config.lockAdmin !== false && !isAdminAuthenticated ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Settings className="w-4 h-4" />
              )}
              <span>포털 관리</span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Content Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
        {/* Mobile Search input */}
        <div className="relative md:hidden mb-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="웹앱 이름 또는 태그 검색..."
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none border transition-all ${
              isDark 
                ? `${activeTheme.cardBg} ${activeTheme.border} text-slate-200 placeholder-slate-500` 
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400 shadow-sm'
            }`}
          />
        </div>

        {/* Hero Portfolio Introduction Widget - Pure Solid NAVER GREEN (#2DB400) */}
        <motion.div 
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-8 p-6 sm:p-9 lg:p-10 rounded-3xl border border-[#239000] relative overflow-hidden shadow-xl text-white transition-all duration-500 bg-[#2DB400]"
        >
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/40 bg-black/15 text-white text-xs sm:text-sm font-bold tracking-wider uppercase font-mono shadow-sm backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
                <span>Expert Dev Workspace Active</span>
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-display text-white drop-shadow-sm leading-tight">
                {config.portalTitle || 'My Vibe App Coding Portal'}
              </h2>
              <p className="text-sm sm:text-base lg:text-[17px] text-white/95 leading-relaxed font-normal sm:font-medium tracking-normal">
                Vibe Coding 에이전트와 연동하여 직접 구축한 나만의 하이엔드 개발 포털입니다. 학교 과제, 학술 연구, 그리고 사이드 프로젝트 웹앱들을 하나의 공간에서 체계적으로 관리하세요. 드래그앤드롭 re-order 기능을 활용해 최우선 과제 및 추천 항목을 자유롭게 강조할 수 있습니다.
              </p>
            </div>
            
            {/* Real-time statistics counters in a mini-dashboard within the hero */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 self-stretch sm:self-start lg:self-center">
              {categories.map((cat) => {
                const count = apps.filter(app => app.category === cat.id).length;
                const isSelected = activeTab === cat.id;
                
                return (
                  <button 
                    key={cat.id} 
                    type="button"
                    onClick={() => {
                      setActiveTab(cat.id);
                      const targetElem = document.getElementById('category-tabs-section');
                      if (targetElem) {
                        targetElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className={`p-4 sm:p-5 px-5 sm:px-7 rounded-2xl border backdrop-blur-md flex flex-col items-center justify-center transition-all duration-300 min-w-[110px] sm:min-w-[125px] cursor-pointer text-left select-none ${
                      isSelected 
                        ? 'border-white bg-black/35 shadow-lg scale-105 ring-2 ring-white/50' 
                        : 'border-white/30 bg-black/15 hover:bg-black/25 hover:border-white/60 hover:scale-105 shadow-sm'
                    }`}
                    title={`${cat.name} 카테고리 보기 (${count}개)`}
                  >
                    <span className="text-xs sm:text-sm text-white font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 pointer-events-none">
                      <DynamicIcon name={cat.icon || 'Folder'} className="w-4 h-4 text-white" />
                      {cat.name}
                    </span>
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-display my-1 text-white pointer-events-none">{count}</span>
                    <span className="text-[10px] sm:text-xs font-mono font-semibold text-white/80 pointer-events-none">Projects</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Categories Tab Selector */}
        <div id="category-tabs-section" className={`flex justify-between items-center mb-8 border-b pb-4 ${isDark ? 'border-neutral-200/10' : 'border-slate-200'}`}>
          <div className={`flex gap-2 p-1.5 border backdrop-blur-md rounded-2xl flex-wrap relative ${
            isDark ? 'bg-neutral-950/40 border-neutral-800/40' : 'bg-slate-100 border-slate-200 shadow-inner'
          }`}>
            <button
              onClick={() => setActiveTab('all')}
              className={`relative px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer flex items-center gap-2 z-10 overflow-hidden ${
                activeTab === 'all'
                  ? (isDark ? 'text-slate-100 font-extrabold' : 'text-slate-900 font-extrabold shadow-sm')
                  : (isDark ? 'text-neutral-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
              }`}
            >
              {activeTab === 'all' && (
                <motion.span
                  layoutId="activeTabGlow"
                  className={`absolute inset-0 rounded-xl -z-10 ${
                    isDark ? `${activeTheme.accentBg} border border-white/5` : 'bg-white border border-slate-200 shadow-sm'
                  }`}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              전체보기
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'all'
                  ? (isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800')
                  : (isDark ? 'bg-neutral-800/60 text-neutral-500' : 'bg-slate-200 text-slate-600')
              }`}>
                {apps.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = apps.filter(app => app.category === cat.id).length;
              const catStyles = getCategoryStyles(cat.id);
              const isSelected = activeTab === cat.id;
              
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  draggable={true}
                  onDragStart={(e) => handleCatDragStart(e, cat.id)}
                  onDragOver={(e) => handleCatDragOver(e, cat.id)}
                  onDragEnd={handleCatDragEnd}
                  onDrop={(e) => handleCatDrop(e, cat.id)}
                  className={`relative px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer flex items-center gap-2 z-10 overflow-hidden ${
                    isSelected
                      ? (isDark ? 'text-slate-100 font-extrabold' : 'text-slate-900 font-extrabold shadow-sm')
                      : (isDark ? 'text-neutral-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                  } ${draggedCatId === cat.id ? 'opacity-30 border-dashed border-indigo-500/30 scale-95' : ''}`}
                >
                  {/* Vertical Insertion Divider Line for Category Tabs */}
                  {dragOverCatId === cat.id && draggedCatId !== cat.id && dragOverCatPosition && (
                    <div 
                      className={`absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] z-30 animate-pulse pointer-events-none ${
                        dragOverCatPosition === 'before'
                          ? 'left-0'
                          : 'right-0'
                      }`}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white border border-indigo-500 shadow-[0_0_4px_rgba(255,255,255,1)]" />
                    </div>
                  )}
                  {isSelected && (
                    <motion.span
                      layoutId="activeTabGlow"
                      className={`absolute inset-0 rounded-xl -z-10 ${
                        isDark ? `${activeTheme.accentBg} border border-white/5` : 'bg-white border border-slate-200 shadow-sm'
                      }`}
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    />
                  )}
                  <DynamicIcon name={cat.icon || 'Folder'} className={`w-4 h-4 ${catStyles.accentColor}`} />
                  {cat.name}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isSelected
                      ? (isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700')
                      : (isDark ? 'bg-neutral-800/60 text-neutral-500' : 'bg-slate-200 text-slate-600')
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className={`text-[11px] font-semibold uppercase tracking-wider font-mono hidden sm:block ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
            Order-Priority Matrix Active
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
                onClick={() => {
                  setSettingsInitialTab('apps');
                  setSettingsEditingAppId(null);
                  setShowSettings(true);
                }}
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
                  <div
                    key={app.id}
                    role="button"
                    onClick={(e) => handleCardClick(e, app.link)}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, app.id)}
                    onDragEnter={(e) => handleCardDragEnter(e, app.id)}
                    onDragOver={(e) => handleCardDragOver(e, app.id)}
                    onDragLeave={(e) => handleCardDragLeave(e, app.id)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleCardDrop(e, app.id)}
                    className={`group p-6 rounded-2xl border transition-all duration-500 block relative hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/10 cursor-pointer ${
                      draggedAppId === app.id ? 'opacity-30 border-dashed border-neutral-700 scale-95' :
                      dragOverAppId === app.id ? 'border-indigo-500 shadow-xl shadow-indigo-500/10' :
                      dragOverImageAppId === app.id ? 'scale-[1.02] border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/20' :
                      `${activeTheme.cardBg} ${activeTheme.border} ${getCategoryStyles(app.category).hoverBorder}`
                    }`}
                  >
                    {/* Beautiful Insertion Divider Line */}
                    {dragOverAppId === app.id && draggedAppId !== app.id && dragOverPosition && (
                      <div 
                        className={`absolute z-30 pointer-events-none transition-all duration-200 bg-gradient-to-r sm:bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] rounded-full animate-pulse ${
                          dragOverPosition === 'before'
                            ? '-top-3.5 left-0 right-0 h-1 sm:h-auto sm:top-0 sm:bottom-0 sm:-left-3.5 sm:w-1'
                            : '-bottom-3.5 left-0 right-0 h-1 sm:h-auto sm:top-0 sm:bottom-0 sm:-right-3.5 sm:w-1'
                        }`}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-indigo-500 shadow-[0_0_6px_rgba(255,255,255,1)]" />
                      </div>
                    )}
                    {/* Image drop overlay */}
                    {dragOverImageAppId === app.id && (
                      <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-dashed border-indigo-500 z-50 animate-fade-in pointer-events-none">
                        <div className="p-3 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400">
                          <Upload className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="text-xs font-bold text-indigo-200">여기에 놓아 썸네일 설정</div>
                        <div className="text-[10px] text-neutral-400">웹 이미지 또는 이미지 파일</div>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-sm border ${
                        getCategoryStyles(app.category).iconBg
                      }`}>
                        <DynamicIcon name={app.icon || 'Globe'} className="w-5 h-5" />
                      </div>
                      
                      {/* Priority display order indicator badge */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-neutral-500 font-bold">
                          #{app.order}
                        </span>
                        <button
                          type="button"
                          title="웹앱 세부사항 수정"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAppEdit(app.id);
                          }}
                          className="p-1 hover:bg-indigo-500/20 text-neutral-400 hover:text-indigo-400 rounded-md transition-colors cursor-pointer group/editbtn"
                        >
                          <Settings className="w-3.5 h-3.5 transition-transform group-hover/editbtn:rotate-45" />
                        </button>
                        <div 
                          className="p-1 cursor-grab active:cursor-grabbing hover:bg-neutral-800/20 rounded transition-colors"
                          onMouseDown={() => { isDraggingFromHandleRef.current = app.id; }}
                          onTouchStart={() => { isDraggingFromHandleRef.current = app.id; }}
                          onMouseUp={() => { isDraggingFromHandleRef.current = null; }}
                          onTouchEnd={() => { isDraggingFromHandleRef.current = null; }}
                        >
                          <GripVertical className="w-4 h-4 text-slate-500/50 opacity-40 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>

                    {app.thumbnail && (
                      <div className="w-full aspect-square rounded-xl overflow-hidden border border-neutral-200/10 dark:border-white/5 mt-4 bg-black/25">
                        <img 
                          src={app.thumbnail} 
                          alt={app.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                    )}

                    <div className="mt-5">
                      <h3 className={`text-base font-bold tracking-tight group-hover:text-indigo-400 transition-colors flex items-center gap-1.5 font-display ${activeTheme.text}`}>
                        {app.title}
                        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-neutral-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </h3>
                      {app.description && (
                        <p className={`text-xs mt-2.5 leading-relaxed line-clamp-2 font-medium ${activeTheme.textMuted}`}>
                          {app.description}
                        </p>
                      )}
                    </div>

                    {/* Geometric Balance Order/Priority progress bar */}
                    <div className="h-1.5 w-full bg-neutral-900/40 dark:bg-black/30 rounded-full mt-5 overflow-hidden border border-neutral-800/10">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          getCategoryStyles(app.category).progressBar
                        }`}
                        style={{ width: `${Math.max(20, Math.min(100, 105 - Number(app.order) * 15))}%` }}
                      ></div>
                    </div>

                    {/* App tags */}
                    {app.tags && app.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-neutral-200/5 dark:border-white/5">
                        {app.tags.map((tag, i) => (
                          <span
                            key={i}
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wide ${
                              getCategoryStyles(app.category).tag
                            }`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
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
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, app.id)}
                    onDragEnter={(e) => handleCardDragEnter(e, app.id)}
                    onDragOver={(e) => handleCardDragOver(e, app.id)}
                    onDragLeave={(e) => handleCardDragLeave(e, app.id)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleCardDrop(e, app.id)}
                    className={`group p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 relative ${
                      draggedAppId === app.id ? 'opacity-30 border-dashed border-neutral-700 scale-95' :
                      dragOverAppId === app.id ? 'border-indigo-500 shadow-md shadow-indigo-500/10' :
                      dragOverImageAppId === app.id ? 'scale-[1.01] border-indigo-500 shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500/20' :
                      `${activeTheme.cardBg} ${activeTheme.border} ${getCategoryStyles(app.category).hoverBorder}`
                    }`}
                  >
                    {/* Beautiful Insertion Divider Line - Horizontal */}
                    {dragOverAppId === app.id && draggedAppId !== app.id && dragOverPosition && (
                      <div 
                        className={`absolute left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] z-30 rounded-full animate-pulse pointer-events-none ${
                          dragOverPosition === 'before'
                            ? '-top-2.5'
                            : '-bottom-2.5'
                        }`}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-indigo-500 shadow-[0_0_6px_rgba(255,255,255,1)]" />
                      </div>
                    )}
                    {/* Image drop overlay */}
                    {dragOverImageAppId === app.id && (
                      <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-indigo-500 z-50 animate-fade-in pointer-events-none">
                        <div className="text-xs font-bold text-indigo-200 flex items-center gap-2">
                          <Upload className="w-4 h-4 animate-pulse" />
                          <span>여기에 놓아 썸네일 설정</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div 
                          className="p-1 cursor-grab active:cursor-grabbing hover:bg-neutral-800/20 rounded transition-colors"
                          onMouseDown={() => { isDraggingFromHandleRef.current = app.id; }}
                          onTouchStart={() => { isDraggingFromHandleRef.current = app.id; }}
                          onMouseUp={() => { isDraggingFromHandleRef.current = null; }}
                          onTouchEnd={() => { isDraggingFromHandleRef.current = null; }}
                        >
                          <GripVertical className="w-4 h-4 text-slate-500/50 opacity-40 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {app.thumbnail ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-neutral-200/10 dark:border-white/5 flex-shrink-0 bg-black/25 shadow-sm">
                            <img 
                              src={app.thumbnail} 
                              alt={app.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              referrerPolicy="no-referrer" 
                            />
                          </div>
                        ) : (
                          <div className={`p-3 rounded-xl border transition-all duration-300 group-hover:scale-105 ${
                            getCategoryStyles(app.category).iconBg
                          }`}>
                            <DynamicIcon name={app.icon || 'Globe'} className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-neutral-400 font-bold">#{app.order}</span>
                          <h3 className={`text-sm font-bold truncate font-display ${activeTheme.text}`}>{app.title}</h3>
                          
                          {/* Mini label indicator */}
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
                            getCategoryStyles(app.category).badge
                          }`}>
                            {categories.find(c => c.id === app.category)?.name || app.category.toUpperCase()}
                          </span>
                        </div>
                        {app.description && (
                          <p className={`text-xs leading-relaxed line-clamp-1 font-medium ${activeTheme.textMuted}`}>
                            {app.description}
                          </p>
                        )}
                        {app.tags && app.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {app.tags.map((tag, i) => (
                              <span
                                key={i}
                                className={`text-[10px] font-semibold mr-2 font-mono ${
                                  app.category === 'school' ? 'text-sky-400/80' : app.category === 'personal' ? 'text-purple-400/80' : 'text-emerald-400/80'
                                }`}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        title="웹앱 세부사항 수정"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAppEdit(app.id);
                        }}
                        className="p-2.5 rounded-xl border border-neutral-800 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-neutral-400 hover:text-indigo-300 transition-all cursor-pointer group/editbtn"
                      >
                        <Settings className="w-4 h-4 transition-transform group-hover/editbtn:rotate-45" />
                      </button>
                      <a
                        href={app.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-[1.02] ${activeTheme.primaryBtn}`}
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
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, filteredApps[0].id)}
                      onDragEnter={(e) => handleCardDragEnter(e, filteredApps[0].id)}
                      onDragOver={(e) => handleCardDragOver(e, filteredApps[0].id)}
                      onDragLeave={(e) => handleCardDragLeave(e, filteredApps[0].id)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleCardDrop(e, filteredApps[0].id)}
                      className={`p-8 rounded-3xl border flex-1 flex flex-col justify-between transition-all duration-500 shadow-xl relative group cursor-grab active:cursor-grabbing ${
                        draggedAppId === filteredApps[0].id ? 'opacity-30 border-dashed border-neutral-700 scale-95' :
                        dragOverAppId === filteredApps[0].id ? 'border-indigo-500 shadow-xl shadow-indigo-500/10' :
                        dragOverImageAppId === filteredApps[0].id ? 'scale-[1.01] border-indigo-500 shadow-xl shadow-indigo-500/20 ring-2 ring-indigo-500/20' :
                        `${activeTheme.cardBg} ${activeTheme.border} ${getCategoryStyles(filteredApps[0].category).hoverBorder}`
                      }`}
                    >
                      {/* Beautiful Insertion Divider Line */}
                      {dragOverAppId === filteredApps[0].id && draggedAppId !== filteredApps[0].id && dragOverPosition && (
                        <div 
                          className={`absolute z-30 pointer-events-none transition-all duration-200 bg-gradient-to-r sm:bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] rounded-full animate-pulse ${
                            dragOverPosition === 'before'
                              ? '-top-4 left-0 right-0 h-1 sm:h-auto sm:top-0 sm:bottom-0 sm:-left-4.5 sm:w-1'
                              : '-bottom-4 left-0 right-0 h-1 sm:h-auto sm:top-0 sm:bottom-0 sm:-right-4.5 sm:w-1'
                          }`}
                        >
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-indigo-500 shadow-[0_0_6px_rgba(255,255,255,1)]" />
                        </div>
                      )}
                      {/* Image drop overlay */}
                      {dragOverImageAppId === filteredApps[0].id && (
                        <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center gap-2 border-2 border-dashed border-indigo-500 z-50 animate-fade-in pointer-events-none">
                          <div className="p-3 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400">
                            <Upload className="w-6 h-6 animate-pulse" />
                          </div>
                          <div className="text-xs font-bold text-indigo-200">여기에 놓아 썸네일 설정</div>
                          <div className="text-[10px] text-neutral-400">웹 이미지 또는 이미지 파일</div>
                        </div>
                      )}
                      
                      {/* Highlight absolute design glow decor */}
                      <div className="absolute -right-24 -top-24 w-52 h-52 bg-indigo-500/5 dark:bg-white/[0.02] blur-3xl rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-500"></div>
 
                       <div>
                         <div className="flex justify-between items-center">
                           <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold tracking-wider uppercase border ${
                             getCategoryStyles(filteredApps[0].category).badge
                           }`}>
                             🎯 {categories.find(c => c.id === filteredApps[0].category)?.name || filteredApps[0].category.toUpperCase()} 최우선 추천
                           </span>
                           <div className="flex items-center gap-1.5">
                             <span className="font-mono text-xs text-neutral-400 font-bold">#{filteredApps[0].order} 순위</span>
                             <button
                               type="button"
                               title="웹앱 세부사항 수정"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleOpenAppEdit(filteredApps[0].id);
                               }}
                               className="p-1 hover:bg-indigo-500/20 text-neutral-400 hover:text-indigo-400 rounded-lg transition-colors cursor-pointer group/editbtn"
                             >
                               <Settings className="w-4 h-4 transition-transform group-hover/editbtn:rotate-45" />
                             </button>
                             <div 
                               className="p-1 cursor-grab active:cursor-grabbing hover:bg-neutral-800/20 rounded transition-colors"
                               onMouseDown={() => { isDraggingFromHandleRef.current = filteredApps[0].id; }}
                               onTouchStart={() => { isDraggingFromHandleRef.current = filteredApps[0].id; }}
                               onMouseUp={() => { isDraggingFromHandleRef.current = null; }}
                               onTouchEnd={() => { isDraggingFromHandleRef.current = null; }}
                             >
                               <GripVertical className="w-4 h-4 text-slate-500/40 opacity-40 group-hover:opacity-100 transition-opacity" />
                             </div>
                           </div>
                         </div>

                        <div className="mt-8 flex items-center gap-4">
                          <div className={`p-4 rounded-2xl border ${
                            getCategoryStyles(filteredApps[0].category).iconBg
                          }`}>
                            <DynamicIcon name={filteredApps[0].icon || 'Globe'} className="w-8 h-8" />
                          </div>
                          <div>
                            <h2 className={`text-xl sm:text-2xl font-extrabold tracking-tight font-display ${activeTheme.text}`}>
                              {filteredApps[0].title}
                            </h2>
                            <p className="text-xs text-neutral-500 mt-1.5 truncate max-w-sm font-mono">{filteredApps[0].link}</p>
                          </div>
                        </div>

                        {filteredApps[0].thumbnail && (
                          <div className="w-full max-w-sm aspect-square mx-auto rounded-2xl overflow-hidden border border-neutral-200/10 dark:border-white/5 my-5 bg-black/25">
                            <img 
                              src={filteredApps[0].thumbnail} 
                              alt={filteredApps[0].title} 
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" 
                              referrerPolicy="no-referrer" 
                            />
                          </div>
                        )}

                        <p className={`text-sm mt-6 leading-relaxed font-medium ${activeTheme.textMuted}`}>
                          {filteredApps[0].description || '별도의 세부 설명이 지정되지 않은 웹앱 프로젝트 포털 항목입니다. 바로가기 버튼을 통해 앱 작동을 확인하실 수 있습니다.'}
                        </p>

                        {filteredApps[0].tags && filteredApps[0].tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-8">
                            {filteredApps[0].tags.map((tag, i) => (
                              <span key={i} className={`px-3 py-1 rounded-lg text-xs font-bold border ${activeTheme.badge}`}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-12 pt-6 border-t border-neutral-200/5 dark:border-white/5 flex items-center justify-between gap-4 flex-wrap">
                        <span className="text-[11px] text-neutral-500 font-semibold font-mono">WORKSPACE STATE: SYNCED</span>
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">Portal Dashboard Checklist</h3>
                  
                  {filteredApps.slice(1).length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-neutral-200/10 text-center text-xs text-neutral-500">
                      그 외 등록된 다른 웹앱이 존재하지 않습니다.
                    </div>
                  ) : (
                    filteredApps.slice(1).map((app) => (
                      <div
                        key={app.id}
                        role="button"
                        onClick={(e) => handleCardClick(e, app.link)}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onDragEnter={(e) => handleCardDragEnter(e, app.id)}
                        onDragOver={(e) => handleCardDragOver(e, app.id)}
                        onDragLeave={(e) => handleCardDragLeave(e, app.id)}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleCardDrop(e, app.id)}
                        className={`group p-4 rounded-xl border flex items-center justify-between gap-3 transition-all duration-300 hover:translate-x-2 relative cursor-pointer ${
                          draggedAppId === app.id ? 'opacity-30 border-dashed border-neutral-700 scale-95' :
                          dragOverAppId === app.id ? 'border-indigo-500 shadow-md shadow-indigo-500/10' :
                          dragOverImageAppId === app.id ? 'scale-[1.01] border-indigo-500 shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500/20' :
                          `${activeTheme.cardBg} ${activeTheme.border} ${getCategoryStyles(app.category).hoverBorder}`
                        }`}
                      >
                        {/* Beautiful Insertion Divider Line - Horizontal */}
                        {dragOverAppId === app.id && draggedAppId !== app.id && dragOverPosition && (
                          <div 
                            className={`absolute left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] z-30 rounded-full animate-pulse pointer-events-none ${
                              dragOverPosition === 'before'
                                ? '-top-2.5'
                                : '-bottom-2.5'
                            }`}
                          >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-indigo-500 shadow-[0_0_6px_rgba(255,255,255,1)]" />
                          </div>
                        )}
                        {/* Image drop overlay */}
                        {dragOverImageAppId === app.id && (
                          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-indigo-500 z-50 animate-fade-in pointer-events-none">
                            <span className="text-[10px] font-bold text-indigo-200">썸네일 드롭</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 min-w-0">
                          <div 
                            className="p-1 cursor-grab active:cursor-grabbing hover:bg-neutral-800/20 rounded transition-colors flex-shrink-0"
                            onMouseDown={() => { isDraggingFromHandleRef.current = app.id; }}
                            onTouchStart={() => { isDraggingFromHandleRef.current = app.id; }}
                            onMouseUp={() => { isDraggingFromHandleRef.current = null; }}
                            onTouchEnd={() => { isDraggingFromHandleRef.current = null; }}
                          >
                            <GripVertical className="w-4 h-4 text-slate-500/50 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                          {app.thumbnail ? (
                            <div className="w-10 h-10 rounded-md overflow-hidden border border-neutral-200/10 dark:border-white/5 flex-shrink-0 bg-black/25">
                              <img 
                                src={app.thumbnail} 
                                alt={app.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                referrerPolicy="no-referrer" 
                              />
                            </div>
                          ) : (
                            <div className={`p-2 rounded-lg border flex-shrink-0 ${
                              getCategoryStyles(app.category).iconBg
                            }`}>
                              <DynamicIcon name={app.icon || 'Globe'} className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className={`text-xs font-bold font-display truncate ${activeTheme.text}`}>{app.title}</h4>
                            <span className="text-[10px] text-neutral-500 font-mono font-semibold">#{app.order} 순번</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            title="웹앱 세부사항 수정"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAppEdit(app.id);
                            }}
                            className="p-1 hover:bg-indigo-500/20 text-neutral-400 hover:text-indigo-400 rounded transition-colors cursor-pointer group/editbtn"
                          >
                            <Settings className="w-3.5 h-3.5 transition-transform group-hover/editbtn:rotate-45" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </motion.div>
            )}

            {/* COMPACT SPLIT LAYOUT (학교 / 개인 / 기타 동적 다단 분할 레이아웃) */}
            {config.layoutId === 'split' && (
              <motion.div
                key="split"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`grid grid-cols-1 ${
                  activeTab === 'all' 
                    ? categories.length === 2 
                      ? 'md:grid-cols-2' 
                      : 'md:grid-cols-3' 
                    : ''
                } gap-8`}
              >
                {categories.map((cat) => {
                  const isVisible = activeTab === 'all' || activeTab === cat.id;
                  if (!isVisible) return null;

                  const catAppsSplit = apps
                    .filter(app => app.category === cat.id && 
                      (app.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase()))))
                    .sort((a, b) => a.order - b.order);

                  const catStyles = getCategoryStyles(cat.id);

                  return (
                    <div
                      key={cat.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleColumnDrop(e, cat.id)}
                      className="space-y-4 p-5 rounded-3xl bg-neutral-900/10 dark:bg-black/25 border border-neutral-200/10 dark:border-white/5 shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-center justify-between border-b border-neutral-200/10 dark:border-white/5 pb-4">
                        <h3 className={`text-sm font-extrabold flex items-center gap-2 font-display ${activeTheme.text}`}>
                          <DynamicIcon name={cat.icon || 'Folder'} className={`w-4 h-4 ${catStyles.accentColor}`} />
                          {cat.name} ({catAppsSplit.length})
                        </h3>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold font-mono">
                          {cat.id.toUpperCase().substring(0, 8)}
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        {catAppsSplit.length === 0 ? (
                          <div className="p-8 rounded-2xl border border-dashed border-neutral-200/10 text-center text-xs text-neutral-500">
                            {cat.name} 탭에 일치하는 웹앱이 없습니다.
                          </div>
                        ) : (
                          catAppsSplit.map((app) => (
                            <div
                              key={app.id}
                              role="button"
                              onClick={(e) => handleCardClick(e, app.link)}
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, app.id)}
                              onDragEnter={(e) => handleCardDragEnter(e, app.id)}
                              onDragOver={(e) => handleCardDragOver(e, app.id)}
                              onDragLeave={(e) => handleCardDragLeave(e, app.id)}
                              onDragEnd={handleDragEnd}
                              onDrop={(e) => handleCardDrop(e, app.id)}
                              className={`group p-4 rounded-2xl border block transition-all duration-300 hover:shadow-lg relative ${catStyles.hoverBorder} cursor-pointer ${
                                draggedAppId === app.id ? 'opacity-30 border-dashed border-neutral-700 scale-95' :
                                dragOverAppId === app.id ? `${catStyles.activeBorder} shadow-md` :
                                dragOverImageAppId === app.id ? `scale-[1.01] ${catStyles.activeBorder} shadow-md ring-2 ring-indigo-500/20` :
                                `${activeTheme.cardBg} ${activeTheme.border}`
                              }`}
                            >
                              {/* Beautiful Insertion Divider Line - Horizontal */}
                              {dragOverAppId === app.id && draggedAppId !== app.id && dragOverPosition && (
                                <div 
                                  className={`absolute left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] z-30 rounded-full animate-pulse pointer-events-none ${
                                    dragOverPosition === 'before'
                                      ? '-top-2'
                                      : '-bottom-2'
                                  }`}
                                >
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-indigo-500 shadow-[0_0_6px_rgba(255,255,255,1)]" />
                                </div>
                              )}
                              {/* Image drop overlay */}
                              {dragOverImageAppId === app.id && (
                                <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-indigo-500 z-50 animate-fade-in pointer-events-none">
                                  <span className="text-[10px] font-bold text-indigo-200">썸네일 드롭</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div 
                                    className="p-1 cursor-grab active:cursor-grabbing hover:bg-neutral-800/20 rounded transition-colors flex-shrink-0"
                                    onMouseDown={() => { isDraggingFromHandleRef.current = app.id; }}
                                    onTouchStart={() => { isDraggingFromHandleRef.current = app.id; }}
                                    onMouseUp={() => { isDraggingFromHandleRef.current = null; }}
                                    onTouchEnd={() => { isDraggingFromHandleRef.current = null; }}
                                  >
                                    <GripVertical className="w-3.5 h-3.5 text-slate-500/55 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                  </div>
                                  {app.thumbnail ? (
                                    <div className="w-10 h-10 rounded-md overflow-hidden border border-neutral-200/10 dark:border-white/5 flex-shrink-0 bg-black/25">
                                      <img 
                                        src={app.thumbnail} 
                                        alt={app.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                        referrerPolicy="no-referrer" 
                                      />
                                    </div>
                                  ) : (
                                    <div className={`p-1.5 rounded-lg ${catStyles.iconBg}`}>
                                      <DynamicIcon name={app.icon || 'Globe'} className="w-3.5 h-3.5" />
                                    </div>
                                  )}
                                  <h4 className={`text-xs font-bold font-display truncate ${activeTheme.text}`}>{app.title}</h4>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <span className="font-mono text-[9px] text-neutral-500 font-bold">#{app.order}</span>
                                  <button
                                    type="button"
                                    title="웹앱 세부사항 수정"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenAppEdit(app.id);
                                    }}
                                    className="p-1 hover:bg-indigo-500/20 text-neutral-400 hover:text-indigo-400 rounded transition-colors cursor-pointer group/editbtn"
                                  >
                                    <Settings className="w-3.5 h-3.5 transition-transform group-hover/editbtn:rotate-45" />
                                  </button>
                                </div>
                              </div>
                              {app.description && (
                                <p className={`text-[11px] mt-2.5 line-clamp-2 leading-relaxed font-medium ${activeTheme.textMuted}`}>
                                  {app.description}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
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
                initialTab={settingsInitialTab}
                initialEditingAppId={settingsEditingAppId}
                onLockAdmin={handleAdminLock}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Admin Password Verification Modal */}
      <AdminPasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPendingAdminAction(null);
        }}
        onSuccess={handleAdminAuthSuccess}
        expectedPassword={config.adminPassword || '1234'}
        title={passwordModalTitle}
        description={passwordModalDesc}
      />

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

      {/* Real-time Sync Toast Notification */}
      <AnimatePresence>
        {syncToastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-neutral-900/95 border border-neutral-700/80 text-white text-xs font-semibold shadow-2xl backdrop-blur-md"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{syncToastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
