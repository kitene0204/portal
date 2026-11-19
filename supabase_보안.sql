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

-- 9. 클로드 편집 허용 (관리자가 설정창에서 정한 시간 동안만, 클로드 전용 열쇠로 저장 가능)
alter table public.vibe_portal_secret add column if not exists helper_key_hash text;
alter table public.vibe_portal_secret add column if not exists helper_open_until timestamptz;

create or replace function public.portal_helper_status()
returns timestamptz
language sql
security definer
set search_path = public
stable
as $$
  select case when helper_open_until > now() then helper_open_until else null end
  from public.vibe_portal_secret where id = 'global';
$$;

create or replace function public.portal_helper_open(pw text, minutes integer)
returns timestamptz
language plpgsql
security definer
set search_path = public, extensions
as $$
declare result timestamptz;
begin
  if not public.portal_check_password(pw) then
    raise exception '관리자 비밀번호가 맞지 않습니다' using errcode = '28P01';
  end if;
  update public.vibe_portal_secret
    set helper_open_until = case when minutes > 0
      then now() + make_interval(mins => least(minutes, 1440)) else null end
    where id = 'global'
    returning helper_open_until into result;
  return result;
end;
$$;

create or replace function public.portal_helper_save(helper_key text, new_config jsonb, new_apps jsonb)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (
    select 1 from public.vibe_portal_secret
    where id = 'global'
      and helper_open_until > now()
      and helper_key_hash is not null
      and helper_key_hash = extensions.crypt(coalesce(helper_key, ''), helper_key_hash)
  ) then
    raise exception '클로드 편집이 닫혀 있거나 열쇠가 맞지 않습니다' using errcode = '28P01';
  end if;
  update public.vibe_portal_data
    set config = new_config - 'adminPassword', apps = new_apps, updated_at = now()
    where id = 'global';
  return true;
end;
$$;

revoke all on function public.portal_helper_status() from public;
revoke all on function public.portal_helper_open(text, integer) from public;
revoke all on function public.portal_helper_save(text, jsonb, jsonb) from public;
grant execute on function public.portal_helper_status() to anon, authenticated;
grant execute on function public.portal_helper_open(text, integer) to anon, authenticated;
grant execute on function public.portal_helper_save(text, jsonb, jsonb) to anon, authenticated;

-- 확인: 아래 결과가 true 한 줄이면 성공
select not exists (
  select 1 from public.vibe_portal_data where id = 'global' and config ? 'adminPassword'
) as "비밀번호가_데이터에서_사라짐";
