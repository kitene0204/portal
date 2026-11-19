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

// ===== 관리자 비밀번호 (브라우저에만 보관, 창고에서 확인) =====
const ADMIN_PW_KEY = 'vibe_portal_admin_pw';

export const getStoredAdminPassword = (): string => {
  try {
    return sessionStorage.getItem(ADMIN_PW_KEY) || localStorage.getItem(ADMIN_PW_KEY) || '';
  } catch {
    return '';
  }
};

export const storeAdminPassword = (pw: string, remember: boolean): void => {
  try {
    sessionStorage.setItem(ADMIN_PW_KEY, pw);
    if (remember) localStorage.setItem(ADMIN_PW_KEY, pw);
    else localStorage.removeItem(ADMIN_PW_KEY);
    // 예전 방식(통과 표시만 저장) 흔적 지우기
    localStorage.removeItem('vibe_portal_admin_auth');
    sessionStorage.removeItem('vibe_portal_admin_auth');
  } catch {}
};

const updateStoredAdminPassword = (pw: string): void => {
  try {
    sessionStorage.setItem(ADMIN_PW_KEY, pw);
    if (localStorage.getItem(ADMIN_PW_KEY)) localStorage.setItem(ADMIN_PW_KEY, pw);
  } catch {}
};

export const clearStoredAdminPassword = (): void => {
  try {
    sessionStorage.removeItem(ADMIN_PW_KEY);
    localStorage.removeItem(ADMIN_PW_KEY);
    localStorage.removeItem('vibe_portal_admin_auth');
    sessionStorage.removeItem('vibe_portal_admin_auth');
  } catch {}
};

// 창고(Supabase)에게 비밀번호가 맞는지 물어봄. 연결이 없으면 null
export const verifyAdminPassword = async (pw: string): Promise<boolean | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('portal_check_password', { pw: pw.trim() });
  if (error) {
    console.error('Password check error:', error);
    return null;
  }
  return data === true;
};

// Save helper
export const savePortalData = async (data: PortalData): Promise<{ success: boolean; source: 'supabase' | 'local'; error?: string }> => {
  // 비밀번호는 절대 데이터에 넣어 저장하지 않음
  const { adminPassword: typedPassword, ...cleanConfig } = data.config;
  const cleanData: PortalData = { config: cleanConfig, apps: data.apps };

  // Always save to localStorage safely
  safeSaveToLocalStorage(cleanData);

  const supabase = getSupabase();
  if (!supabase) {
    return { success: true, source: 'local' };
  }

  const currentPw = getStoredAdminPassword();
  if (!currentPw) {
    return {
      success: false,
      source: 'supabase',
      error: '관리자 비밀번호를 입력해야 저장할 수 있습니다.'
    };
  }

  // 설정창에서 비밀번호를 새로 바꾼 경우에만 새 비밀번호를 함께 보냄
  const newPw = typedPassword && typedPassword.trim().length >= 4 && typedPassword.trim() !== currentPw.trim()
    ? typedPassword.trim()
    : null;

  try {
    const { error } = await supabase.rpc('portal_save', {
      pw: currentPw.trim(),
      new_config: cleanConfig,
      new_apps: data.apps,
      new_pw: newPw
    });

    if (error) {
      console.error('Supabase save error:', error);
      const errorCode = error.code || '';
      const errorMsg = error.message || '';

      if (errorCode === '28P01' || errorMsg.includes('비밀번호')) {
        clearStoredAdminPassword();
        return {
          success: false,
          source: 'supabase',
          error: '관리자 비밀번호가 맞지 않아 저장하지 못했습니다. 다시 로그인해 주세요.'
        };
      }

      if (errorCode === 'PGRST202' || errorMsg.includes('portal_save')) {
        return {
          success: false,
          source: 'local',
          error: "Supabase에 저장 기능(portal_save)이 없습니다. SQL Editor에서 보안 스크립트를 실행해 주세요."
        };
      }

      return { 
        success: false, 
        source: 'local', 
        error: `Supabase 저장 실패 (${errorCode}): ${errorMsg}` 
      };
    }

    if (newPw) updateStoredAdminPassword(newPw);
    return { success: true, source: 'supabase' };
  } catch (err: any) {
    console.error('Supabase save exception:', err);
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
-- 창민 포털 Supabase 설정 (보안판)
-- Supabase SQL Editor에 통째로 붙여넣고 Run을 눌러 주세요.
-- 여러 번 실행해도 안전합니다.
--  · 누구나: 읽기만 가능
--  · 저장·수정: 관리자 비밀번호가 맞을 때만 (창고가 직접 확인)
--  · 비밀번호: 알아볼 수 없게 바꿔서 아무도 읽을 수 없는 곳에 보관
-- =======================================================

create extension if not exists pgcrypto with schema extensions;

-- 1. 포털 데이터 표
create table if not exists public.vibe_portal_data (
  id text primary key,
  config jsonb not null,
  apps jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.vibe_portal_data enable row level security;

-- 2. 비밀번호 보관 표 (정책이 없으므로 밖에서는 아무도 못 읽음)
create table if not exists public.vibe_portal_secret (
  id text primary key,
  pw_hash text not null
);
alter table public.vibe_portal_secret enable row level security;
revoke all on public.vibe_portal_secret from anon, authenticated;

-- 지금 쓰는 비밀번호를 그대로 옮겨 담기 (없으면 처음 비밀번호는 1234)
insert into public.vibe_portal_secret (id, pw_hash)
select 'global', extensions.crypt(
  coalesce(nullif(trim((select config->>'adminPassword' from public.vibe_portal_data where id = 'global')), ''), '1234'),
  extensions.gen_salt('bf'))
on conflict (id) do nothing;

-- 3. 비밀번호 확인 기능
create or replace function public.portal_check_password(pw text)
returns boolean
language sql
security definer
set search_path = public, extensions
stable
as $$
  select exists (
    select 1 from public.vibe_portal_secret
    where id = 'global' and pw_hash = extensions.crypt(trim(coalesce(pw, '')), pw_hash)
  );
$$;

-- 4. 저장 기능 (비밀번호가 맞을 때만 저장, 원하면 새 비밀번호로 바꿈)
create or replace function public.portal_save(pw text, new_config jsonb, new_apps jsonb, new_pw text default null)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.portal_check_password(pw) then
    raise exception '관리자 비밀번호가 맞지 않습니다' using errcode = '28P01';
  end if;

  insert into public.vibe_portal_data (id, config, apps, updated_at)
  values ('global', new_config - 'adminPassword', new_apps, now())
  on conflict (id) do update
    set config = excluded.config, apps = excluded.apps, updated_at = excluded.updated_at;

  if new_pw is not null and length(trim(new_pw)) >= 4 then
    update public.vibe_portal_secret
      set pw_hash = extensions.crypt(trim(new_pw), extensions.gen_salt('bf'))
      where id = 'global';
  end if;

  return true;
end;
$$;

revoke all on function public.portal_check_password(text) from public;
revoke all on function public.portal_save(text, jsonb, jsonb, text) from public;
grant execute on function public.portal_check_password(text) to anon, authenticated;
grant execute on function public.portal_save(text, jsonb, jsonb, text) to anon, authenticated;

-- 5. 포털 표의 예전 규칙(누구나 쓰기)을 모두 지우고 "누구나 읽기만" 규칙 하나만 둠
do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'vibe_portal_data' loop
    execute format('drop policy %I on public.vibe_portal_data', r.policyname);
  end loop;
end $$;
create policy "portal public read" on public.vibe_portal_data for select using (true);
revoke insert, update, delete, truncate on public.vibe_portal_data from anon, authenticated;

-- 6. 읽을 수 있는 데이터에서 비밀번호 지우기
update public.vibe_portal_data set config = config - 'adminPassword' where id = 'global';

-- 7. 여러 기기 실시간 동기화
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'vibe_portal_data'
  ) then
    alter publication supabase_realtime add table public.vibe_portal_data;
  end if;
end $$;

-- 8. 썸네일 그림 보관함 (새 그림 올리기만 가능, 덮어쓰기·지우기는 불가)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portal-thumbs', 'portal-thumbs', true, 5242880, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

drop policy if exists "portal thumbs upload" on storage.objects;
create policy "portal thumbs upload" on storage.objects
for insert to anon, authenticated
with check (bucket_id = 'portal-thumbs');

-- 확인: 아래 결과가 true 한 줄이면 성공
select not exists (
  select 1 from public.vibe_portal_data where id = 'global' and config ? 'adminPassword'
) as "비밀번호가_데이터에서_사라짐";
`;
