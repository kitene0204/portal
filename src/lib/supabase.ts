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
      .single();

    if (error) {
      // If table doesn't exist (PGRST116 or 42P01 code) or no data yet
      console.warn('Supabase fetch error or table not found, using local storage:', error);
      
      // Let's seed initial data if it's a 116 (No row found) but table exists
      if (error.code === 'PGRST116') {
        await savePortalData(localData);
        return { data: localData, source: 'supabase' };
      }
      
      return { 
        data: localData, 
        source: 'local', 
        error: `Supabase 연결은 되었으나 테이블(${error.code})을 찾을 수 없거나 데이터가 없습니다. SQL 스크립트를 실행해 주세요.`
      };
    }

    if (data) {
      const merged: PortalData = {
        config: data.config,
        apps: Array.isArray(data.apps) ? data.apps : []
      };
      
      // Keep localStorage in sync
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return { data: merged, source: 'supabase' };
    }

    return { data: localData, source: 'local' };
  } catch (err: any) {
    console.error('Supabase fetch exception:', err);
    return { data: localData, source: 'local', error: err.message || 'Supabase 연결 오류' };
  }
};

// Save helper
export const savePortalData = async (data: PortalData): Promise<{ success: boolean; source: 'supabase' | 'local'; error?: string }> => {
  // Always save to localStorage first
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }

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
      return { 
        success: false, 
        source: 'local', 
        error: `Supabase 저장 실패: ${error.message}. 테이블이 없는 경우 SQL 쿼리를 실행해 테이블을 먼저 생성해야 합니다.` 
      };
    }

    return { success: true, source: 'supabase' };
  } catch (err: any) {
    console.error('Supabase upsert exception:', err);
    return { success: false, source: 'local', error: err.message || 'Supabase 저장 중 오류가 발생했습니다.' };
  }
};

export const SQL_CREATION_SCRIPT = `
-- Supabase SQL Editor에 복사하여 실행해 주세요.
-- 'vibe_portal_data' 테이블을 생성합니다.

CREATE TABLE IF NOT EXISTS vibe_portal_data (
  id TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  apps JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 누구나 읽고 쓸 수 있는 RLS (Row Level Security) 설정 (원하는 경우 보안 규칙 수정 가능)
ALTER TABLE vibe_portal_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read and write" 
ON vibe_portal_data 
FOR ALL 
USING (true) 
WITH CHECK (true);
`;
