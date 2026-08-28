import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { 
  VibeApp, 
  PortalConfig, 
  CategoryTab,
  DEFAULT_THEMES, 
  DEFAULT_LAYOUTS 
} from '../types';
import { compressImageFile, purgeLargeThumbnails } from '../lib/imageUtils';
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
  Heart,
  Upload,
  Image as ImageIcon,
  GripVertical,
  Lock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  LogOut,
  Link as LinkIcon,
  Zap,
  HardDrive
} from 'lucide-react';

interface SettingsPanelProps {
  config: PortalConfig;
  apps: VibeApp[];
  onSaveConfig: (config: PortalConfig) => void;
  onSaveApps: (apps: VibeApp[]) => void;
  onSaveAll?: (config: PortalConfig, apps: VibeApp[]) => void;
  onClose: () => void;
  initialTab?: 'general' | 'apps';
  initialEditingAppId?: string | null;
  onLockAdmin?: () => void;
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
  onSaveAll,
  onClose,
  initialTab = 'general',
  initialEditingAppId = null,
  onLockAdmin
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'apps'>(initialTab);
  const [portalTitle, setPortalTitle] = useState(config.portalTitle);
  const [layoutId, setLayoutId] = useState(config.layoutId);
  const [themeId, setThemeId] = useState(config.themeId);

  const defaultCategories: CategoryTab[] = [
    { id: 'school', name: config.schoolCategoryName || '학교 프로젝트', icon: 'GraduationCap' },
    { id: 'personal', name: config.personalCategoryName || '개인 프로젝트', icon: 'Globe' }
  ];
  const [categories, setCategories] = useState<CategoryTab[]>(config.categories && config.categories.length > 0 ? config.categories : defaultCategories);
  const [schoolCategoryName, setSchoolCategoryName] = useState(config.schoolCategoryName || '학교 프로젝트');
  const [personalCategoryName, setPersonalCategoryName] = useState(config.personalCategoryName || '개인 프로젝트');

  // Dynamic Category state additions
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Folder');

  // Security & Admin Password States
  const [adminPassword, setAdminPassword] = useState(config.adminPassword || '1234');
  const [lockAdmin, setLockAdmin] = useState(config.lockAdmin !== false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [passwordSaveSuccess, setPasswordSaveSuccess] = useState(false);
  const [appAddedSuccessMsg, setAppAddedSuccessMsg] = useState<string | null>(null);

  // App Editor States
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [appTitle, setAppTitle] = useState('');
  const [appLink, setAppLink] = useState('');
  const [appCategory, setAppCategory] = useState<string>('school');
  const [appOrder, setAppOrder] = useState(1);
  const [appDescription, setAppDescription] = useState('');
  const [appIcon, setAppIcon] = useState('Globe');
  const [appTagsInput, setAppTagsInput] = useState('');
  const [appThumbnail, setAppThumbnail] = useState('');
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);

  // DOM Refs for scroll and focus handling
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const appTitleInputRef = useRef<HTMLInputElement>(null);

  // Auto edit initial app if provided
  useEffect(() => {
    if (initialEditingAppId) {
      const targetApp = apps.find(a => a.id === initialEditingAppId);
      if (targetApp) {
        setActiveTab('apps');
        handleStartEdit(targetApp);
      }
    }
  }, [initialEditingAppId]);

  // Drag & Drop Apps list in Settings states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);
  const [draggableIndex, setDraggableIndex] = useState<number | null>(null);

  const handleSettingsDragStart = (e: React.DragEvent, index: number) => {
    if (draggableIndex !== index) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSettingsDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    if (index === draggedIndex) {
      setDragOverIndex(null);
      setDragOverPosition(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const position = mouseY > rect.height / 2 ? 'after' : 'before';

    if (dragOverIndex !== index || dragOverPosition !== position) {
      setDragOverIndex(index);
      setDragOverPosition(position);
    }
  };

  const handleSettingsDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDragOverPosition(null);
      setDraggableIndex(null);
      return;
    }

    const originalDraggedApp = apps[draggedIndex];
    const filteredAppsList = apps.filter((_, idx) => idx !== draggedIndex);

    let adjustedTargetIndex = targetIndex;
    if (draggedIndex < targetIndex) {
      adjustedTargetIndex = targetIndex - 1;
    }

    const finalInsertIndex = dragOverPosition === 'after' ? adjustedTargetIndex + 1 : adjustedTargetIndex;
    filteredAppsList.splice(finalInsertIndex, 0, originalDraggedApp);

    // Re-index order within categories
    const finalApps: VibeApp[] = [];
    categories.forEach((cat) => {
      const catApps = filteredAppsList.filter(a => a.category === cat.id);
      catApps.forEach((app, i) => { app.order = i + 1; });
      finalApps.push(...catApps);
    });
    const knownCategoryIds = categories.map(c => c.id);
    const otherApps = filteredAppsList.filter(a => !knownCategoryIds.includes(a.category));
    finalApps.push(...otherApps);

    onSaveApps(finalApps);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragOverPosition(null);
    setDraggableIndex(null);
  };

  const handleSettingsDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragOverPosition(null);
    setDraggableIndex(null);
  };

  const [isCompressingThumbnail, setIsCompressingThumbnail] = useState(false);
  const [showThumbnailUrlInput, setShowThumbnailUrlInput] = useState(false);
  const [thumbnailUrlInput, setThumbnailUrlInput] = useState('');
  const [thumbnailSavedFeedback, setThumbnailSavedFeedback] = useState(false);
  const [isPurgingStorage, setIsPurgingStorage] = useState(false);
  const [purgeResultMsg, setPurgeResultMsg] = useState<string | null>(null);

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(PNG, JPG, WebP, GIF 등)만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 파일 크기는 10MB 이하여야 합니다.');
      return;
    }
    setIsCompressingThumbnail(true);
    try {
      // Compress and optimize thumbnail to max 320x240, ~15-25KB WebP/JPEG for minimum storage
      const optimizedDataUrl = await compressImageFile(file, 320, 240, 0.70);
      setAppThumbnail(optimizedDataUrl);
      setThumbnailSavedFeedback(true);
      setTimeout(() => setThumbnailSavedFeedback(false), 3000);
    } catch (err) {
      console.error('Thumbnail compression error:', err);
      // Fallback
      const reader = new FileReader();
      reader.onloadend = () => {
        setAppThumbnail(reader.result as string);
        setThumbnailSavedFeedback(true);
        setTimeout(() => setThumbnailSavedFeedback(false), 3000);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressingThumbnail(false);
    }
  };

  const handleCleanStorageAndPurge = async () => {
    setIsPurgingStorage(true);
    try {
      const { apps: optimizedApps, purgedCount } = await purgeLargeThumbnails(apps);
      onSaveApps(optimizedApps);
      setPurgeResultMsg(`✨ ${purgedCount > 0 ? `${purgedCount}개의 고용량 썸네일을 최적화/정리` : '모든 썸네일이 이미 가벼운 상태'}했습니다!`);
    } catch {
      setPurgeResultMsg('정리 중 오류가 발생했습니다.');
    } finally {
      setIsPurgingStorage(false);
      setTimeout(() => setPurgeResultMsg(null), 4000);
    }
  };

  const handleApplyThumbnailUrl = () => {
    if (!thumbnailUrlInput.trim()) return;
    setAppThumbnail(thumbnailUrlInput.trim());
    setShowThumbnailUrlInput(false);
    setThumbnailSavedFeedback(true);
    setTimeout(() => setThumbnailSavedFeedback(false), 3000);
  };

  // Save General settings
  const handleSaveGeneral = () => {
    onSaveConfig({
      ...config,
      portalTitle,
      layoutId,
      themeId,
      schoolCategoryName,
      personalCategoryName,
      categories,
      adminPassword,
      lockAdmin
    });
  };

  const handleSaveSecurity = (newPassword?: string, newLock?: boolean) => {
    const psw = newPassword !== undefined ? newPassword : adminPassword;
    const lck = newLock !== undefined ? newLock : lockAdmin;
    onSaveConfig({
      ...config,
      portalTitle,
      layoutId,
      themeId,
      schoolCategoryName,
      personalCategoryName,
      categories,
      adminPassword: psw,
      lockAdmin: lck
    });
    setPasswordSaveSuccess(true);
    setTimeout(() => setPasswordSaveSuccess(false), 2500);
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
      personalCategoryName,
      categories,
      adminPassword,
      lockAdmin
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
      personalCategoryName,
      categories,
      adminPassword,
      lockAdmin
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
      personalCategoryName,
      categories,
      adminPassword,
      lockAdmin
    });
  };

  // Dynamic categories management handlers
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newId = 'cat_' + Date.now().toString();
    const updated = [
      ...categories,
      { id: newId, name: newCatName.trim(), icon: newCatIcon }
    ];
    setCategories(updated);
    onSaveConfig({
      ...config,
      portalTitle,
      layoutId,
      themeId,
      schoolCategoryName,
      personalCategoryName,
      categories: updated,
      adminPassword,
      lockAdmin
    });
    setNewCatName('');
  };

  const handleUpdateCategory = (id: string, name: string, icon: string) => {
    const updated = categories.map(cat => {
      if (cat.id === id) {
        return { ...cat, name, icon };
      }
      return cat;
    });
    setCategories(updated);

    const schoolName = id === 'school' ? name : schoolCategoryName;
    const personalName = id === 'personal' ? name : personalCategoryName;
    if (id === 'school') setSchoolCategoryName(name);
    if (id === 'personal') setPersonalCategoryName(name);

    onSaveConfig({
      ...config,
      portalTitle,
      layoutId,
      themeId,
      schoolCategoryName: schoolName,
      personalCategoryName: personalName,
      categories: updated,
      adminPassword,
      lockAdmin
    });
  };

  const handleDeleteCategory = (id: string) => {
    if (id === 'school' || id === 'personal') {
      alert('기본 카테고리(학교, 개인)는 삭제할 수 없습니다.');
      return;
    }
    if (confirm('이 카테고리 탭을 정말 삭제하시겠습니까? 해당 카테고리에 속한 웹앱들은 기본 카테고리로 이동됩니다.')) {
      const updatedCategories = categories.filter(cat => cat.id !== id);
      setCategories(updatedCategories);

      // Move apps of deleted category to 'school' (fallback)
      const updatedApps = apps.map(app => {
        if (app.category === id) {
          return { ...app, category: 'school' };
        }
        return app;
      });

      // Re-index all categories
      const finalApps: VibeApp[] = [];
      updatedCategories.forEach((cat) => {
        const catApps = updatedApps.filter(a => a.category === cat.id).sort((a, b) => a.order - b.order);
        catApps.forEach((app, i) => { app.order = i + 1; });
        finalApps.push(...catApps);
      });

      onSaveConfig({
        ...config,
        portalTitle,
        layoutId,
        themeId,
        categories: updatedCategories
      });
      onSaveApps(finalApps);
    }
  };

  // Reset Add/Edit App form
  const resetAppForm = () => {
    setEditingAppId(null);
    setAppTitle('');
    setAppLink('');
    setAppCategory(categories[0]?.id || 'school');
    setAppOrder(apps.length + 1);
    setAppDescription('');
    setAppIcon('Globe');
    setAppTagsInput('');
    setAppThumbnail('');
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
    setAppThumbnail(app.thumbnail || '');

    // Scroll to the top of the panel to show the filled input form!
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (appTitleInputRef.current) {
        appTitleInputRef.current.focus();
      }
    }, 100);
  };

  // Save/Add App
  const handleSaveApp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!appTitle.trim()) {
      alert('웹앱 이름을 입력해주세요.');
      appTitleInputRef.current?.focus();
      return;
    }
    if (!appLink.trim()) {
      alert('웹앱 링크 URL을 입력해주세요.');
      return;
    }

    let formattedLink = appLink.trim();
    if (!/^https?:\/\//i.test(formattedLink)) {
      formattedLink = 'https://' + formattedLink;
    }

    const tags = appTagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const savedTitle = appTitle.trim();
    let finalApps: VibeApp[] = [];

    if (editingAppId) {
      // Editing
      const updatedApps = apps.map(app => {
        if (app.id === editingAppId) {
          return {
            ...app,
            title: savedTitle,
            link: formattedLink,
            category: appCategory,
            order: Number(appOrder),
            description: appDescription.trim(),
            icon: appIcon,
            tags,
            thumbnail: appThumbnail
          };
        }
        return app;
      });

      // Re-index dynamically by all categories
      categories.forEach((cat) => {
        const catApps = updatedApps.filter(a => a.category === cat.id).sort((a, b) => a.order - b.order);
        catApps.forEach((app, i) => { app.order = i + 1; });
        finalApps.push(...catApps);
      });
      const knownCategoryIds = categories.map(c => c.id);
      const otherApps = updatedApps.filter(a => !knownCategoryIds.includes(a.category));
      finalApps.push(...otherApps);
    } else {
      // Adding new
      const newApp: VibeApp = {
        id: Date.now().toString(),
        title: savedTitle,
        link: formattedLink,
        category: appCategory,
        order: Number(appOrder),
        description: appDescription.trim(),
        icon: appIcon,
        tags,
        thumbnail: appThumbnail
      };
      const updatedApps = [...apps, newApp];

      // Re-index dynamically by all categories
      categories.forEach((cat) => {
        const catApps = updatedApps.filter(a => a.category === cat.id).sort((a, b) => a.order - b.order);
        catApps.forEach((app, i) => { app.order = i + 1; });
        finalApps.push(...catApps);
      });
      const knownCategoryIds = categories.map(c => c.id);
      const otherApps = updatedApps.filter(a => !knownCategoryIds.includes(a.category));
      finalApps.push(...otherApps);
    }

    const latestConfig: PortalConfig = {
      ...config,
      portalTitle,
      layoutId,
      themeId,
      schoolCategoryName,
      personalCategoryName,
      categories,
      adminPassword,
      lockAdmin
    };

    if (onSaveAll) {
      onSaveAll(latestConfig, finalApps);
    } else {
      onSaveConfig(latestConfig);
      onSaveApps(finalApps);
    }

    setAppAddedSuccessMsg(editingAppId ? `✨ "${savedTitle}" 웹앱이 수정되었습니다!` : `✨ "${savedTitle}" 웹앱이 정상 등록되었습니다! (목록에 반영됨)`);
    setTimeout(() => setAppAddedSuccessMsg(null), 3500);

    resetAppForm();
  };

  // Save/Add App and Save General and Close Drawer
  const handleSaveAndClose = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let targetApps = apps;

    if (activeTab === 'apps') {
      const hasStartedForm = Boolean(appTitle.trim() || appLink.trim() || editingAppId);
      if (hasStartedForm) {
        if (!appTitle.trim()) {
          alert('웹앱 이름을 입력해주세요.');
          appTitleInputRef.current?.focus();
          return;
        }
        if (!appLink.trim()) {
          alert('웹앱 링크 URL을 입력해주세요.');
          return;
        }

        let formattedLink = appLink.trim();
        if (!/^https?:\/\//i.test(formattedLink)) {
          formattedLink = 'https://' + formattedLink;
        }

        const tags = appTagsInput
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);

        if (editingAppId) {
          const updatedApps = apps.map(app => {
            if (app.id === editingAppId) {
              return {
                ...app,
                title: appTitle.trim(),
                link: formattedLink,
                category: appCategory,
                order: Number(appOrder),
                description: appDescription.trim(),
                icon: appIcon,
                tags,
                thumbnail: appThumbnail
              };
            }
            return app;
          });

          const finalApps: VibeApp[] = [];
          categories.forEach((cat) => {
            const catApps = updatedApps.filter(a => a.category === cat.id).sort((a, b) => a.order - b.order);
            catApps.forEach((app, i) => { app.order = i + 1; });
            finalApps.push(...catApps);
          });
          const knownCategoryIds = categories.map(c => c.id);
          const otherApps = updatedApps.filter(a => !knownCategoryIds.includes(a.category));
          finalApps.push(...otherApps);

          targetApps = finalApps;
        } else {
          const newApp: VibeApp = {
            id: Date.now().toString(),
            title: appTitle.trim(),
            link: formattedLink,
            category: appCategory,
            order: Number(appOrder),
            description: appDescription.trim(),
            icon: appIcon,
            tags,
            thumbnail: appThumbnail
          };
          const updatedApps = [...apps, newApp];

          const finalApps: VibeApp[] = [];
          categories.forEach((cat) => {
            const catApps = updatedApps.filter(a => a.category === cat.id).sort((a, b) => a.order - b.order);
            catApps.forEach((app, i) => { app.order = i + 1; });
            finalApps.push(...catApps);
          });
          const knownCategoryIds = categories.map(c => c.id);
          const otherApps = updatedApps.filter(a => !knownCategoryIds.includes(a.category));
          finalApps.push(...otherApps);

          targetApps = finalApps;
        }
      }
    }

    const latestConfig: PortalConfig = {
      ...config,
      portalTitle,
      layoutId,
      themeId,
      schoolCategoryName,
      personalCategoryName,
      categories,
      adminPassword,
      lockAdmin
    };

    if (onSaveAll) {
      onSaveAll(latestConfig, targetApps);
    } else {
      onSaveConfig(latestConfig);
      onSaveApps(targetApps);
    }

    resetAppForm();
    onClose();
  };

  // Delete App
  const handleDeleteApp = (id: string) => {
    if (confirm('이 포털 항목을 정말 삭제하시겠습니까?')) {
      const filtered = apps.filter(app => app.id !== id);
      const finalApps: VibeApp[] = [];
      categories.forEach((cat) => {
        const catApps = filtered.filter(a => a.category === cat.id).sort((a, b) => a.order - b.order);
        catApps.forEach((app, i) => { app.order = i + 1; });
        finalApps.push(...catApps);
      });
      const knownCategoryIds = categories.map(c => c.id);
      const otherApps = filtered.filter(a => !knownCategoryIds.includes(a.category));
      finalApps.push(...otherApps);

      onSaveApps(finalApps);
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

    const finalApps: VibeApp[] = [];
    categories.forEach((cat) => {
      const catApps = newApps.filter(a => a.category === cat.id);
      catApps.forEach((app, i) => { app.order = i + 1; });
      finalApps.push(...catApps);
    });
    const knownCategoryIds = categories.map(c => c.id);
    const otherApps = newApps.filter(a => !knownCategoryIds.includes(a.category));
    finalApps.push(...otherApps);

    onSaveApps(finalApps);
  };

  // Reorder app down
  const handleMoveDown = (index: number) => {
    if (index === apps.length - 1) return;
    const newApps = [...apps];
    // Swap position in array
    const temp = newApps[index];
    newApps[index] = newApps[index + 1];
    newApps[index + 1] = temp;

    const finalApps: VibeApp[] = [];
    categories.forEach((cat) => {
      const catApps = newApps.filter(a => a.category === cat.id);
      catApps.forEach((app, i) => { app.order = i + 1; });
      finalApps.push(...catApps);
    });
    const knownCategoryIds = categories.map(c => c.id);
    const otherApps = newApps.filter(a => !knownCategoryIds.includes(a.category));
    finalApps.push(...otherApps);

    onSaveApps(finalApps);
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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 space-y-6">
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

            {/* Category Management */}
            <div className="space-y-3 p-4 rounded-xl border border-neutral-800 bg-neutral-950/40">
              <span className="block text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                대시보드 카테고리 탭 관리 ({categories.length})
              </span>
              
              {/* Category Items list */}
              <div className="space-y-2 mt-2 max-h-[160px] overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const isDefault = cat.id === 'school' || cat.id === 'personal';
                  const catAppsCount = apps.filter(app => app.category === cat.id).length;
                  return (
                    <div key={cat.id} className="p-2 rounded-lg bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <select
                          value={cat.icon || 'Folder'}
                          onChange={(e) => handleUpdateCategory(cat.id, cat.name, e.target.value)}
                          className="bg-neutral-950 border border-neutral-800 text-neutral-300 rounded px-1 py-0.5 text-[11px] focus:outline-none focus:border-indigo-500"
                        >
                          <option value="GraduationCap">🏫</option>
                          <option value="Globe">🌐</option>
                          <option value="BookOpen">📖</option>
                          <option value="Clock">⏰</option>
                          <option value="Code2">💻</option>
                          <option value="Folder">📁</option>
                          <option value="Sparkles">✨</option>
                          <option value="Heart">❤️</option>
                          <option value="Coffee">☕</option>
                          <option value="Award">🏆</option>
                        </select>
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) => handleUpdateCategory(cat.id, e.target.value, cat.icon || 'Folder')}
                          className="bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-indigo-500 font-semibold w-full min-w-[80px]"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[9px] text-neutral-500 bg-neutral-950 px-1.5 py-0.5 rounded font-mono">
                          {catAppsCount}개
                        </span>
                        {!isDefault ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800/50 rounded transition-colors"
                            title="카테고리 삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[9px] text-neutral-600 font-mono select-none px-1">SYS</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Category form */}
              <div className="border-t border-neutral-800/80 pt-3 mt-1.5 space-y-2">
                <span className="block text-[11px] font-semibold text-neutral-400">➕ 새 카테고리 탭 추가</span>
                <div className="flex gap-2">
                  <select
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Folder">📁 폴더</option>
                    <option value="GraduationCap">🏫 학업</option>
                    <option value="Globe">🌐 웹</option>
                    <option value="BookOpen">📖 독서</option>
                    <option value="Clock">⏰ 시간</option>
                    <option value="Code2">💻 개발</option>
                    <option value="Sparkles">✨ 혜택</option>
                    <option value="Heart">❤️ 개인</option>
                    <option value="Coffee">☕ 여가</option>
                    <option value="Award">🏆 공모전</option>
                  </select>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="새 카테고리 이름 (예: 공모전 준비)"
                    className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    추가
                  </button>
                </div>
              </div>
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

            {/* Admin Security & Password Lock Section */}
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-200">관리자 보안 및 잠금 설정</h3>
                    <p className="text-[11px] text-neutral-400">공유 시 타인의 무단 수정을 방지합니다.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockAdmin}
                    onChange={(e) => {
                      const newLock = e.target.checked;
                      setLockAdmin(newLock);
                      handleSaveSecurity(adminPassword, newLock);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {lockAdmin && (
                <div className="space-y-3 pt-2 border-t border-neutral-800/80 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                      <span>관리자 비밀번호 (PIN)</span>
                      <span className="text-[10px] text-amber-400/90 font-mono">기본값: 1234</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-neutral-500">
                          <KeyRound className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type={showAdminPassword ? 'text' : 'password'}
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="새 비밀번호 입력"
                          className="w-full pl-8 pr-8 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-neutral-500 hover:text-neutral-300"
                        >
                          {showAdminPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveSecurity(adminPassword, lockAdmin)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        {passwordSaveSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-slate-950" />
                            <span>저장됨!</span>
                          </>
                        ) : (
                          <span>변경 저장</span>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    💡 다른 사람이 이 포털 웹앱에 접속했을 때, 관리자 비밀번호를 모르면 <strong>웹앱 정보 수정/삭제/추가 및 카드 순서 드래그</strong>가 차단됩니다.
                  </p>

                  {onLockAdmin && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={onLockAdmin}
                        className="w-full py-2 px-3 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-amber-400" />
                        <span>지금 관리자 모드 잠그기 (방문자 화면 테스트)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Storage & Thumbnail Optimization section */}
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-200">저장 공간 및 썸네일 용량 최적화</h3>
                    <p className="text-[11px] text-neutral-400">용량이 큰 썸네일을 초경량화하여 브라우저 저장소 용량을 확보합니다.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isPurgingStorage}
                  onClick={handleCleanStorageAndPurge}
                  className="w-full py-2.5 px-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-300 transition-colors text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isPurgingStorage ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                      <span>썸네일 최적화 및 정리 중...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      <span>원클릭 썸네일 용량 최적화 & 용량 정리</span>
                    </>
                  )}
                </button>

                {purgeResultMsg && (
                  <p className="mt-2 text-center text-xs font-semibold text-emerald-400 animate-fade-in">
                    {purgeResultMsg}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 text-[11px] text-neutral-500 leading-relaxed space-y-1">
              <p>✔️ 모든 디자인 및 보안 설정은 변경 시 실시간 반영됩니다.</p>
              <p>✔️ 변경된 설정값은 Supabase 및 로컬 스토리지에 자동 동기화됩니다.</p>
            </div>
          </div>
        )}

        {activeTab === 'apps' && (
          <div className="space-y-6">
            {/* Dynamic Add / Edit Header */}
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold tracking-wide text-neutral-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  {editingAppId ? '웹앱 정보 수정하기' : '새 웹앱 정보 추가하기'}
                </h3>
                {editingAppId && (
                  <button
                    type="button"
                    onClick={resetAppForm}
                    className="text-[11px] text-neutral-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>수정 취소</span>
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSaveApp} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1 font-medium">웹앱 이름 *</label>
                  <input
                    ref={appTitleInputRef}
                    type="text"
                    required
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                    placeholder="예: 도장 만들기, 급식 알리미"
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1 font-medium">분류 탭 *</label>
                    <select
                      value={appCategory}
                      onChange={(e) => setAppCategory(e.target.value)}
                      className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-neutral-200 focus:outline-none focus:border-indigo-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.id === 'school' ? '🏫' : cat.id === 'personal' ? '👤' : '📁'} {cat.name}
                        </option>
                      ))}
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
                    type="text"
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] text-neutral-400 font-medium">썸네일 이미지 (선택)</label>
                    <button
                      type="button"
                      onClick={() => setShowThumbnailUrlInput(!showThumbnailUrlInput)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>{showThumbnailUrlInput ? '파일 업로드로 변경' : 'URL 직접 입력'}</span>
                    </button>
                  </div>

                  {showThumbnailUrlInput ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={thumbnailUrlInput}
                          onChange={(e) => setThumbnailUrlInput(e.target.value)}
                          placeholder="https://example.com/image.png"
                          className="flex-1 min-w-0 px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleApplyThumbnailUrl}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold cursor-pointer transition-colors"
                        >
                          적용
                        </button>
                      </div>
                      <p className="text-[10px] text-neutral-500">웹상에 있는 이미지 링크를 붙여넣어 썸네일로 사용할 수 있습니다.</p>
                    </div>
                  ) : appThumbnail ? (
                    <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative rounded-lg overflow-hidden border border-neutral-700 w-16 h-16 bg-black/40 flex-shrink-0">
                          <img src={appThumbnail} alt="썸네일 프리뷰" className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>썸네일 이미지 준비 완료</span>
                          </div>
                          <p className="text-[10px] text-neutral-400">하단 [저장 및 닫기]를 누르면 즉시 포털에 반영됩니다.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setAppThumbnail('');
                            setThumbnailUrlInput('');
                          }}
                          className="px-2.5 py-1.5 bg-neutral-800 hover:bg-rose-500/20 hover:text-rose-300 text-neutral-400 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                          title="썸네일 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>삭제</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingThumbnail(true);
                      }}
                      onDragLeave={() => setIsDraggingThumbnail(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingThumbnail(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          handleFileProcess(file);
                        }
                      }}
                      onClick={() => document.getElementById('thumbnail-file-input')?.click()}
                      className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                        isDraggingThumbnail
                          ? 'border-indigo-500 bg-indigo-950/30 text-indigo-300 scale-[1.01]'
                          : 'border-neutral-800 bg-neutral-900/60 hover:border-indigo-500/50 hover:bg-neutral-800/40 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {isCompressingThumbnail ? (
                        <>
                          <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                          <span className="text-xs font-semibold text-indigo-400">이미지 자동 최적화 중...</span>
                        </>
                      ) : (
                        <>
                          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div className="text-xs font-bold text-center text-neutral-200">
                            이미지를 드래그하거나 클릭하여 업로드
                          </div>
                          <div className="text-[10px] text-neutral-500 text-center">
                            PNG, JPG, WebP (자동 최적화 및 압축 저장)
                          </div>
                        </>
                      )}
                      <input
                        id="thumbnail-file-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileProcess(file);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1 font-medium">설명 (간단히)</label>
                  <textarea
                    value={appDescription}
                    onChange={(e) => setAppDescription(e.target.value)}
                    rows={2}
                    placeholder="이 앱의 기능과 사용법을 간단히 소개해주세요."
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 resize-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1 font-medium">태그 (쉼표로 구분)</label>
                  <input
                    type="text"
                    value={appTagsInput}
                    onChange={(e) => setAppTagsInput(e.target.value)}
                    placeholder="React, AI, 급식, 실시간"
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="pt-1.5">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950/40 cursor-pointer hover:scale-[1.01]"
                  >
                    {editingAppId ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>웹앱 수정 완료 (즉시 저장)</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ 새 웹앱 등록하기 (즉시 저장)</span>
                      </>
                    )}
                  </button>
                </div>

                {appAddedSuccessMsg && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs text-center font-medium animate-fade-in flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{appAddedSuccessMsg}</span>
                  </div>
                )}
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
                  const isDragged = draggedIndex === index;
                  const isDragOver = dragOverIndex === index;
                  const isEditing = editingAppId === app.id;

                  return (
                    <div
                      key={app.id}
                      draggable={true}
                      onDragStart={(e) => handleSettingsDragStart(e, index)}
                      onDragOver={(e) => handleSettingsDragOver(e, index)}
                      onDrop={(e) => handleSettingsDrop(e, index)}
                      onDragEnd={handleSettingsDragEnd}
                      className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-all select-none relative ${
                        isDragged ? 'opacity-30 border-dashed border-neutral-700 scale-95 pointer-events-none' :
                        isDragOver ? 'scale-[1.01] border-indigo-500 bg-indigo-950/10 shadow-md shadow-indigo-500/10' :
                        isEditing
                          ? 'border-indigo-500 bg-indigo-950/10'
                          : draggableIndex === index
                          ? 'border-indigo-500 bg-indigo-950/20 scale-[1.02] shadow-lg cursor-grabbing'
                          : 'border-neutral-800 bg-neutral-950/30 hover:bg-neutral-950/60 cursor-pointer'
                      }`}
                    >
                      {/* Beautiful Insertion Divider Line - Settings Panel */}
                      {isDragOver && draggedIndex !== index && dragOverPosition && (
                        <div 
                          className={`absolute left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] z-30 rounded-full animate-pulse pointer-events-none ${
                            dragOverPosition === 'before'
                              ? '-top-1'
                              : '-bottom-1'
                          }`}
                        >
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white border border-indigo-500 shadow-[0_0_4px_rgba(255,255,255,1)]" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                        <div
                          className="p-1 cursor-grab active:cursor-grabbing hover:bg-neutral-800/30 rounded transition-colors flex-shrink-0"
                          onMouseDown={() => setDraggableIndex(index)}
                          onTouchStart={() => setDraggableIndex(index)}
                          onMouseUp={() => setDraggableIndex(null)}
                          onTouchEnd={() => setDraggableIndex(null)}
                        >
                          <GripVertical className={`w-3.5 h-3.5 text-neutral-500/50 flex-shrink-0 transition-opacity ${draggableIndex === index ? 'opacity-100 text-indigo-400' : 'opacity-40 group-hover:opacity-100'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {(() => {
                              const foundCat = categories.find(c => c.id === app.category);
                              const catName = foundCat ? foundCat.name : app.category;
                              const isSchool = app.category === 'school';
                              const isPersonal = app.category === 'personal';
                              return (
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-tight ${
                                  isSchool
                                    ? 'bg-sky-950 text-sky-400 border border-sky-900/50'
                                    : isPersonal
                                    ? 'bg-violet-950 text-violet-400 border border-violet-900/50'
                                    : 'bg-emerald-950 text-emerald-400 border border-emerald-900/50'
                                }`}>
                                  {catName}
                                </span>
                              );
                            })()}
                            <span className="text-neutral-500 font-mono text-[10px]">#{app.order}</span>
                          </div>
                          <div className="font-medium text-neutral-200 mt-1 truncate">{app.title}</div>
                          <div className="text-[10px] text-neutral-500 truncate mt-0.5 font-mono">{app.link}</div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div 
                        className="flex items-center gap-1"
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveUp(index);
                          }}
                          disabled={index === 0}
                          title="위로 이동"
                          className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveDown(index);
                          }}
                          disabled={index === apps.length - 1}
                          title="아래로 이동"
                          className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(app);
                          }}
                          title="편집"
                          className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-indigo-400 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteApp(app.id);
                          }}
                          title="삭제"
                          className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
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
          type="button"
          onClick={handleSaveAndClose}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/40 cursor-pointer hover:scale-[1.01]"
        >
          <Check className="w-4 h-4" />
          <span>
            {activeTab === 'apps' && editingAppId
              ? '수정 완료 및 저장 후 닫기'
              : activeTab === 'apps' && (appTitle.trim() || appLink.trim())
              ? '웹앱 등록 및 저장 후 닫기'
              : '저장 및 닫기'}
          </span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-900 text-neutral-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          취소
        </button>
      </div>
    </div>
  );
}
