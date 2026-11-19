// 클로드가 포털 앱 목록을 대신 고칠 때 쓰는 도구
// 포털 설정창에서 "클로드 편집 허용"을 열어 둔 동안에만 저장됩니다.
// 사용법:
//   node scripts/claude-portal.mjs status            열려 있는지 보기
//   node scripts/claude-portal.mjs pull <파일.json>   지금 데이터 내려받기
//   node scripts/claude-portal.mjs push <파일.json>   고친 데이터 저장하기
// 필요한 값(.env.local, 깃허브에 올리지 않음): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, PORTAL_HELPER_KEY
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')])
);
const URL = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const rpc = async (name, body = {}) => {
  const r = await fetch(`${URL}/rest/v1/rpc/${name}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await r.text();
  if (!r.ok) throw new Error(`${name} 실패 (${r.status}): ${text}`);
  return text ? JSON.parse(text) : null;
};

const [cmd, file] = process.argv.slice(2);

if (cmd === 'status') {
  const until = await rpc('portal_helper_status');
  console.log(until ? `열림: ${new Date(until).toLocaleString('ko-KR')}까지` : '닫힘');
} else if (cmd === 'pull') {
  const r = await fetch(`${URL}/rest/v1/vibe_portal_data?id=eq.global&select=config,apps`, { headers });
  const [row] = await r.json();
  fs.writeFileSync(file, JSON.stringify(row, null, 2));
  console.log(`내려받음: 앱 ${row.apps.length}개 → ${file}`);
} else if (cmd === 'push') {
  if (!env.PORTAL_HELPER_KEY) throw new Error('.env.local에 PORTAL_HELPER_KEY가 없습니다.');
  const row = JSON.parse(fs.readFileSync(file, 'utf8'));
  await rpc('portal_helper_save', { helper_key: env.PORTAL_HELPER_KEY, new_config: row.config, new_apps: row.apps });
  console.log(`저장함: 앱 ${row.apps.length}개`);
} else {
  console.log('사용법: status | pull <파일> | push <파일>');
}
