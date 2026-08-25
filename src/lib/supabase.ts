import { createClient } from '@supabase/supabase-js';
import { PortalData, INITIAL_DATA } from '../types';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.length > 0 &&
    !supabaseUrl.includes('your-project') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 0 &&
    !supabaseAnonKey.includes('your-anon-key')
  );
};

// Lazy initialization of Supabase client to avoid crashes
let supabaseClientInstance: any = null;

export const getSupabase = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseClientInstance) {
    try {
      supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false
        }
      });
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      return null;
    }
  }
  return supabaseClientInstance;
};

const STORAGE_KEY = 'vibe_portal_local_data';

/**
 * Safely saves data to localStorage, stripping large base64 thumbnails if quota is exceeded
 */
export const safeSaveToLocalStorage = (data: PortalData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e: any) {
    console.warn('LocalStorage save failed, trying fallback without heavy thumbnails:', e);
    try {
      // Create a lightweight version stripping data:image base64 strings if storage quota is full
      const lightData: PortalData = {
        config: data.config,
        apps: data.apps.map(app => {
          if (app.thumbnail && app.thumbnail.startsWith('data:')) {
            // Keep URL thumbnails, strip heavy base64 for local storage safety
            return { ...app, thumbnail: '' };
          }
          return app;
        })
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lightData));
    } catch (innerErr) {
      console.error('Critical localStorage quota exceeded:', innerErr);
    }
  }
};

// Fetch helper
export const fetchPortalData = async (): Promise<{ data: PortalData; source: 'supabase' | 'local'; error?: string }> => {
  // First, load from localStorage as fallback
  let localData: PortalData = INITIAL_DATA;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      localData = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading local storage data:', e);
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { data: localData, source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('vibe_portal_data')
      .select('config, apps')
      .eq('id', 'global')
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch error or table not found, using local storage:', error);
      
      const errorCode = error.code || '';
      const errorMsg = error.message || '';

      if (errorCode === '42P01' || errorMsg.includes('does not exist')) {
        return { 
          data: localData, 
          source: 'local', 
          error: "Supabase에 'vibe_portal_data' 테이블이 없습니다. Supabase SQL Editor에서 스크립트를 실행해 주세요."
        };
      }

      if (errorCode === '42501' || errorMsg.includes('row-level security') || errorMsg.includes('permission denied')) {
        return { 
          data: localData, 
          source: 'local', 
          error: "Supabase RLS(보안 정책) 권한이 없습니다. SQL 스크립트를 실행하여 읽기/쓰기를 허용해 주세요."
        };
      }
      
      return { 
        data: localData, 
        source: 'local', 
        error: `Supabase 연동 오류 (${errorCode || 'DB 오류'}): ${errorMsg || '데이터를 불러올 수 없습니다.'}`
      };
    }

    if (data && data.config) {
      const merged: PortalData = {
        config: data.config,
        apps: Array.isArray(data.apps) ? data.apps : []
      };
      
      // Keep localStorage in sync safely
      safeSaveToLocalStorage(merged);
      return { data: merged, source: 'supabase' };
    }

    // If data is null (table exists but is empty), seed it automatically with local/initial data!
    const saveResult = await savePortalData(localData);
    if (saveResult.success) {
      return { data: localData, source: 'supabase' };
    }

    return { data: localData, source: 'supabase' };
  } catch (err: any) {
    console.error('Supabase fetch exception:', err);
    return { data: localData, source: 'local', error: err.message || 'Supabase 연결 오류' };
  }
};

// Save helper
export const savePortalData = async (data: PortalData): Promise<{ success: boolean; source: 'supabase' | 'local'; error?: string }> => {
  // Always save to localStorage safely
  safeSaveToLocalStorage(data);

  const supabase = getSupabase();
  if (!supabase) {
    return { success: true, source: 'local' };
  }

  try {
    const { error } = await supabase
      .from('vibe_portal_data')
      .upsert({
        id: 'global',
        config: data.config,
        apps: data.apps,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error('Supabase upsert error:', error);
      const errorCode = error.code || '';
      const errorMsg = error.message || '';

      if (errorCode === '42P01' || errorMsg.includes('does not exist')) {
        return { 
          success: false, 
          source: 'local', 
          error: "Supabase에 'vibe_portal_data' 테이블이 없습니다. SQL Editor에서 스크립트를 실행해 주세요." 
        };
      }

      if (errorCode === '42501' || errorMsg.includes('row-level security') || errorMsg.includes('permission denied')) {
        return { 
          success: false, 
          source: 'local', 
          error: "Supabase RLS(보안 정책) 권한이 없습니다. SQL 스크립트를 실행해 주세요." 
        };
      }

      return { 
        success: false, 
        source: 'local', 
        error: `Supabase 저장 실패 (${errorCode}): ${errorMsg}` 
      };
    }

    return { success: true, source: 'supabase' };
  } catch (err: any) {
    console.error('Supabase upsert exception:', err);
    return { success: false, source: 'local', error: err.message || 'Supabase 저장 중 오류가 발생했습니다.' };
  }
};

export const subscribeToPortalData = (onUpdate: (data: PortalData) => void) => {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('portal_realtime_data')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vibe_portal_data', filter: 'id=eq.global' },
        (payload: any) => {
          if (payload?.new && payload.new.config && payload.new.apps) {
            const updated: PortalData = {
              config: payload.new.config,
              apps: Array.isArray(payload.new.apps) ? payload.new.apps : []
            };
            safeSaveToLocalStorage(updated);
            onUpdate(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.error('Failed to subscribe to realtime changes:', err);
    return () => {};
  }
};

export const SQL_CREATION_SCRIPT = `
-- =======================================================
-- Supabase SQL Editor에 복사하여 실행(Run)해 주세요.
-- 포털 데이터 저장 테이블 및 권한/실시간 동기화 설정
-- =======================================================

-- 1. 포털 데이터 저장 테이블 생성
CREATE TABLE IF NOT EXISTS public.vibe_portal_data (
  id TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  apps JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. RLS (Row Level Security) 활성화 및 누구나 읽고 쓸 수 있는 정책 생성
ALTER TABLE public.vibe_portal_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read and write" ON public.vibe_portal_data;

CREATE POLICY "Allow public read and write" 
ON public.vibe_portal_data 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 3. 여러 기기(폰, 노트북, 데스크톱) 간 실시간 변경 알림(Realtime) 활성화
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'vibe_portal_data'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vibe_portal_data;
  END IF;
END $$;
`;
